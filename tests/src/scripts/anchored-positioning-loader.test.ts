import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";

import { installAnchoredPositioningLoader } from "../../../src/scripts/anchored-positioning-loader";

type TestIdleCallback = (
  callback: (deadline: {
    didTimeout: boolean;
    timeRemaining(): number;
  }) => void,
  options?: { timeout?: number },
) => number;

interface BrowserWindowFixture {
  requestIdleCallback?: TestIdleCallback;
  setTimeout(callback: () => void, timeout: number): number;
}

describe("anchored positioning loader", () => {
  test("loads once on first user intent and schedules that anchored root", async () => {
    const { document, loadCalls, scheduledTargets, window } = loaderFixture();
    const trigger = requiredElement(document, "[data-anchor-trigger]");

    installAnchoredPositioningLoader({
      document: browserDocument(document),
      loadAnchoredPositioning: loadCalls.load,
      window: browserWindow(window),
    });
    trigger.dispatchEvent(
      browserEvent(new window.Event("pointerdown", { bubbles: true })),
    );
    trigger.dispatchEvent(
      browserEvent(new window.Event("click", { bubbles: true })),
    );
    await flushAsyncTasks();

    expect(loadCalls.count).toBe(1);
    expect(scheduledTargets.map((target) => target === trigger)).toEqual([
      true,
      true,
    ]);
  });

  test("warms the positioning module on idle when anchored roots exist", async () => {
    const { document, loadCalls, scheduledTargets, window } = loaderFixture();
    let idleCallback: (() => void) | undefined;
    const requestIdleCallback: TestIdleCallback = (callback): number => {
      idleCallback = () => {
        callback({ didTimeout: false, timeRemaining: () => 0 });
      };

      return 1;
    };

    installAnchoredPositioningLoader({
      document: browserDocument(document),
      loadAnchoredPositioning: loadCalls.load,
      window: browserWindow(window, requestIdleCallback),
    });

    idleCallback?.();
    await flushAsyncTasks();

    expect(loadCalls.count).toBe(1);
    expect(scheduledTargets).toEqual([null]);
  });

  test("does not install when a page has no anchored roots", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const document = window.document;
    const loadCalls = loadCounter([]);

    installAnchoredPositioningLoader({
      document: browserDocument(document),
      loadAnchoredPositioning: loadCalls.load,
      window: browserWindow(window),
    });
    browserDocument(document).dispatchEvent(
      browserEvent(new window.Event("pointerdown", { bubbles: true })),
    );
    await flushAsyncTasks();

    expect(loadCalls.count).toBe(0);
  });
});

function loaderFixture(): {
  document: Document;
  loadCalls: ReturnType<typeof loadCounter>;
  scheduledTargets: Array<EventTarget | null>;
  window: Window;
} {
  const window = new Window();
  Reflect.set(window, "SyntaxError", SyntaxError);
  const document = window.document;
  const scheduledTargets: Array<EventTarget | null> = [];
  const loadCalls = loadCounter(scheduledTargets);

  document.body.innerHTML = `
    <div data-anchor-root data-anchor-preset="article-action-menu">
      <button data-anchor-trigger>Share</button>
      <div data-anchor-panel>Panel</div>
    </div>
  `;

  return {
    document: browserDocument(document),
    loadCalls,
    scheduledTargets,
    window,
  };
}

function loadCounter(scheduledTargets: Array<EventTarget | null>): {
  readonly count: number;
  load: () => Promise<{
    scheduleAnchoredRootFromTarget(target: EventTarget | null): void;
  }>;
} {
  let count = 0;

  return {
    get count() {
      return count;
    },
    load: async () => {
      count += 1;
      await Promise.resolve();

      return {
        scheduleAnchoredRootFromTarget: (target: EventTarget | null) => {
          scheduledTargets.push(target);
        },
      };
    },
  };
}

function requiredElement(document: Document, selector: string): Element {
  const element = document.querySelector(selector);

  if (element === null) {
    throw new Error(`Expected fixture element: ${selector}`);
  }

  return element;
}

function browserDocument(document: unknown): Document {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements browser documents at runtime but exposes package-local DOM types.
  return document as Document;
}

function browserWindow(
  window: Window,
  requestIdleCallback?: TestIdleCallback,
): BrowserWindowFixture {
  return {
    ...(requestIdleCallback === undefined ? {} : { requestIdleCallback }),
    setTimeout: (callback, timeout) => {
      window.setTimeout(callback, timeout);

      return 1;
    },
  };
}

function browserEvent(event: unknown): Event {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements browser events at runtime but exposes package-local DOM types.
  return event as Event;
}

async function flushAsyncTasks(): Promise<void> {
  for (let index = 0; index < 10; index += 1) {
    await Promise.resolve();
  }
}
