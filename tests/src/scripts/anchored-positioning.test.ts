import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";

import {
  type AnchoredPositioningRuntime,
  installAnchoredPositioning,
} from "../../../src/scripts/anchored-positioning";

describe("anchored positioning browser script", () => {
  test("positions an open mobile shell panel below the header", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <header data-site-header>Header</header>
      <details data-anchor-root data-anchor-preset="mobile-shell-panel" open>
        <summary data-anchor-trigger>Menu</summary>
        <div data-anchor-panel>Panel</div>
      </details>
    `;

    const header = requiredElement(window, "[data-site-header]");
    const trigger = requiredElement(window, "[data-anchor-trigger]");
    const panel = requiredElement(window, "[data-anchor-panel]");
    const root = requiredElement(window, "[data-anchor-root]");

    setRect(header, { height: 96, width: 390, x: 0, y: 0 });
    setRect(trigger, { height: 40, width: 40, x: 0, y: 24 });
    setRect(panel, { height: 640, width: 360, x: 16, y: 104 });
    installImmediateAnimationFrame(window);

    installAnchoredPositioning(runtimeFor(window));
    dispatchWindowEvent(root, window, "toggle");

    expect(panel.style.getPropertyValue("--anchor-x")).toBe("0px");
    expect(panel.style.getPropertyValue("--anchor-y")).toBe("96px");
    expect(panel.style.getPropertyValue("--anchor-max-width")).toBe("390px");
    expect(panel.style.getPropertyValue("--anchor-max-height")).toBe("748px");
    expect(panel.dataset["anchorPlacement"]).toBe("viewport-fill");
    expect(panel.dataset["anchorState"]).toContain("sized-block");
  });

  test("does not eagerly measure closed panels", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <header data-site-header>Header</header>
      <div data-anchor-root data-anchor-preset="header-dropdown">
        <a data-anchor-trigger href="/categories/culture/">Culture</a>
        <div data-anchor-panel>Panel</div>
      </div>
    `;

    const header = requiredElement(window, "[data-site-header]");
    const trigger = requiredElement(window, "[data-anchor-trigger]");
    const panel = requiredElement(window, "[data-anchor-panel]");
    let panelMeasureCount = 0;

    setRect(header, { height: 96, width: 800, x: 0, y: 0 });
    setRect(trigger, { height: 32, width: 80, x: 120, y: 32 });
    Reflect.set(panel, "getBoundingClientRect", () => {
      panelMeasureCount += 1;
      return domRect({ height: 240, width: 320, x: 0, y: 0 });
    });
    installImmediateAnimationFrame(window);

    installAnchoredPositioning(runtimeFor(window));
    dispatchWindowEvent(trigger, window, "click");

    expect(panelMeasureCount).toBe(0);
    expect(panel.style.getPropertyValue("--anchor-x")).toBe("");
  });

  test("positions focus-owned search panels with visual viewport geometry", () => {
    const window = browserWindow();
    const document = window.document;

    Reflect.set(window, "visualViewport", {
      addEventListener: () => undefined,
      height: 700,
      offsetLeft: 20,
      offsetTop: 10,
      width: 500,
    });
    document.body.innerHTML = `
      <header data-site-header>Header</header>
      <div data-anchor-root data-anchor-preset="header-search-end">
        <button data-anchor-trigger>Search</button>
        <div data-anchor-panel popover>Panel</div>
      </div>
    `;

    const header = requiredElement(window, "[data-site-header]");
    const trigger = requiredElement(window, "[data-anchor-trigger]");
    const panel = requiredElement(window, "[data-anchor-panel]");

    setRect(header, { height: 96, width: 500, x: 0, y: 0 });
    setRect(trigger, { height: 40, width: 40, x: 420, y: 28 });
    setRect(panel, { height: 120, width: 300, x: 0, y: 0 });
    installImmediateAnimationFrame(window);

    installAnchoredPositioning(runtimeFor(window));
    trigger.focus();
    dispatchWindowEvent(trigger, window, "focusin");

    expect(panel.style.getPropertyValue("--anchor-x")).toBe("160px");
    expect(panel.style.getPropertyValue("--anchor-y")).toBe("96px");
    expect(panel.style.getPropertyValue("--anchor-max-width")).toBe("468px");
    expect(panel.style.getPropertyValue("--anchor-max-height")).toBe("598px");
    expect(panel.dataset["anchorPlacement"]).toBe("bottom-end");
  });

  test("positions article action menus with the same trigger-relative contract as article citations", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <div data-anchor-root data-anchor-preset="article-action-menu">
        <button data-anchor-trigger>Share</button>
        <div data-anchor-panel popover>Panel</div>
      </div>
    `;

    const trigger = requiredElement(window, "[data-anchor-trigger]");
    const panel = requiredElement(window, "[data-anchor-panel]");

    Reflect.set(window, "innerHeight", 700);
    Reflect.set(window, "innerWidth", 768);
    setRect(trigger, { height: 24, width: 64, x: 600, y: 320 });
    setRect(panel, { height: 360, width: 288, x: 0, y: 0 });
    Reflect.set(
      panel,
      "matches",
      (selector: string) => selector === ":popover-open",
    );
    installImmediateAnimationFrame(window);

    installAnchoredPositioning(runtimeFor(window));
    dispatchWindowEvent(trigger, window, "click");

    expect(panel.style.getPropertyValue("--anchor-x")).toBe("376px");
    expect(panel.style.getPropertyValue("--anchor-y")).toBe("348px");
    expect(panel.style.getPropertyValue("--anchor-max-width")).toBe("736px");
    expect(panel.style.getPropertyValue("--anchor-max-height")).toBe("336px");
    expect(panel.dataset["anchorPlacement"]).toBe("bottom-end");
  });

  test("ignores unrelated events and invalid root contracts", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <details id="invalid-preset" data-anchor-root data-anchor-preset="unknown" open>
        <summary data-anchor-trigger>Invalid</summary>
        <div data-anchor-panel>Invalid panel</div>
      </details>
      <details id="missing-trigger" data-anchor-root data-anchor-preset="header-dropdown" open>
        <div data-anchor-panel>Missing trigger panel</div>
      </details>
      <details id="missing-panel" data-anchor-root data-anchor-preset="header-dropdown" open>
        <summary data-anchor-trigger>Missing panel</summary>
      </details>
    `;

    const outside = requiredElement(window, "#outside");
    const invalidPreset = requiredElement(window, "#invalid-preset");
    const invalidPanel = requiredElement(
      window,
      "#invalid-preset [data-anchor-panel]",
    );
    const missingTrigger = requiredElement(window, "#missing-trigger");
    const missingTriggerPanel = requiredElement(
      window,
      "#missing-trigger [data-anchor-panel]",
    );
    const missingPanel = requiredElement(window, "#missing-panel");

    installImmediateAnimationFrame(window);
    installAnchoredPositioning(runtimeFor(window));
    dispatchWindowEvent(document, window, "click");
    dispatchWindowEvent(outside, window, "click");
    dispatchWindowEvent(invalidPreset, window, "toggle");
    dispatchWindowEvent(missingTrigger, window, "toggle");
    dispatchWindowEvent(missingPanel, window, "toggle");

    expect(invalidPanel.style.getPropertyValue("--anchor-x")).toBe("");
    expect(missingTriggerPanel.style.getPropertyValue("--anchor-x")).toBe("");
  });

  test("observes header and panel size changes and disconnects removed roots", () => {
    const window = browserWindow();
    const document = window.document;
    const observer = resizeObserverConstructor();

    document.body.innerHTML = `
      <header data-site-header>Header</header>
      <details data-anchor-root data-anchor-preset="mobile-shell-panel" open>
        <summary data-anchor-trigger>Menu</summary>
        <div data-anchor-panel>Panel</div>
      </details>
    `;

    const root = requiredElement(window, "[data-anchor-root]");
    const panel = requiredElement(window, "[data-anchor-panel]");
    installImmediateAnimationFrame(window);

    installAnchoredPositioning(runtimeFor(window, observer.ResizeObserver));
    root.remove();
    window.dispatchEvent(new window.Event("resize"));

    expect(observer.observedSelectors).toEqual([
      "[data-anchor-root]",
      "[data-site-header]",
      "[data-anchor-panel]",
    ]);
    expect(observer.disconnectCount).toBe(1);
    expect(panel.style.getPropertyValue("--anchor-x")).toBe("");
  });

  test("positions disclosure-open roots without treating restored focus as open", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <header data-site-header>Header</header>
      <div data-anchor-root data-anchor-preset="header-dropdown" data-disclosure-root>
        <a data-anchor-trigger href="/categories/culture/">Culture</a>
        <button data-disclosure-trigger aria-expanded="false">Toggle</button>
        <div data-anchor-panel>Panel</div>
      </div>
    `;

    const header = requiredElement(window, "[data-site-header]");
    const root = requiredElement(window, "[data-anchor-root]");
    const trigger = requiredElement(window, "[data-anchor-trigger]");
    const panel = requiredElement(window, "[data-anchor-panel]");
    const button = requiredElement(window, "[data-disclosure-trigger]");

    Reflect.set(window, "innerWidth", 800);
    setRect(header, { height: 96, width: 800, x: 0, y: 0 });
    setRect(trigger, { height: 32, width: 80, x: 120, y: 64 });
    setRect(panel, { height: 240, width: 320, x: 0, y: 0 });
    installImmediateAnimationFrame(window);

    installAnchoredPositioning(runtimeFor(window));

    button.focus();
    dispatchWindowEvent(button, window, "focusin");
    expect(panel.style.getPropertyValue("--anchor-x")).toBe("");

    root.setAttribute("data-disclosure-open", "true");
    dispatchWindowEvent(root, window, "anchored-disclosure-change");
    expect(panel.style.getPropertyValue("--anchor-x")).toBe("120px");
    expect(panel.style.getPropertyValue("--anchor-y")).toBe("96px");

    root.removeAttribute("data-disclosure-open");
    dispatchWindowEvent(root, window, "anchored-disclosure-change");
    expect(panel.style.getPropertyValue("--anchor-x")).toBe("120px");
  });
});

function browserWindow(): Window {
  const window = new Window({ url: "https://example.com/" });
  Reflect.set(window, "SyntaxError", SyntaxError);
  Reflect.set(window, "innerHeight", 844);
  Reflect.set(window, "innerWidth", 390);

  return window;
}

function runtimeFor(
  window: Window,
  resizeObserver?: typeof ResizeObserver,
): AnchoredPositioningRuntime {
  return {
    classes: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM exposes browser constructors with the runtime shape needed by the script.
      Element: window.Element as unknown as typeof Element,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM exposes browser constructors with the runtime shape needed by the script.
      Node: window.Node as unknown as typeof Node,
      ResizeObserver: resizeObserver,
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM provides the browser runtime shape used by this script test.
    document: window.document as unknown as Document,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM provides the browser runtime shape used by this script test.
    window: window as unknown as globalThis.Window,
  };
}

function requiredElement(window: Window, selector: string): HTMLElement {
  const element = window.document.querySelector(selector);

  if (!(element instanceof window.HTMLElement)) {
    throw new Error(`Expected fixture element for selector ${selector}.`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM elements satisfy the browser HTMLElement shape used by the script.
  return element as unknown as HTMLElement;
}

function setRect(element: Element, rect: TestRect): void {
  Reflect.set(element, "getBoundingClientRect", () => domRect(rect));
}

function installImmediateAnimationFrame(window: Window): void {
  Reflect.set(
    window,
    "requestAnimationFrame",
    (callback: FrameRequestCallback) => {
      callback(0);

      return 1;
    },
  );
}

function dispatchWindowEvent(
  element: unknown,
  window: Window,
  eventName: string,
): void {
  if (!isDispatchableEventTarget(element)) {
    throw new Error("Expected fixture target to dispatch browser events.");
  }

  const event = new window.Event(eventName, { bubbles: true });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM events satisfy DOM Event at runtime for dispatch.
  element.dispatchEvent(event as unknown as Event);
}

interface DispatchableEventTarget {
  readonly dispatchEvent: (event: Event) => boolean;
}

function isDispatchableEventTarget(
  value: unknown,
): value is DispatchableEventTarget {
  return (
    typeof value === "object" &&
    value !== null &&
    "dispatchEvent" in value &&
    typeof value.dispatchEvent === "function"
  );
}

interface TestRect {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

function domRect(rect: TestRect): DOMRect {
  return {
    bottom: rect.y + rect.height,
    height: rect.height,
    left: rect.x,
    right: rect.x + rect.width,
    toJSON: () => ({}),
    top: rect.y,
    width: rect.width,
    x: rect.x,
    y: rect.y,
  };
}

function resizeObserverConstructor(): {
  readonly disconnectCount: number;
  readonly observedSelectors: readonly string[];
  readonly ResizeObserver: typeof ResizeObserver;
} {
  const observedSelectors: string[] = [];
  let disconnectCount = 0;

  class TestResizeObserver implements ResizeObserver {
    disconnect(): void {
      disconnectCount += 1;
    }

    observe(element: Element, _options?: ResizeObserverOptions): void {
      observedSelectors.push(selectorFor(element));
    }

    unobserve(_element: Element): void {
      // Per-element cleanup is outside this fixture's observation contract.
    }
  }

  return {
    get disconnectCount() {
      return disconnectCount;
    },
    get observedSelectors() {
      return observedSelectors;
    },
    ResizeObserver: TestResizeObserver,
  };
}

function selectorFor(element: Element): string {
  if (element.hasAttribute("data-anchor-root")) {
    return "[data-anchor-root]";
  }

  if (element.hasAttribute("data-site-header")) {
    return "[data-site-header]";
  }

  if (element.hasAttribute("data-anchor-panel")) {
    return "[data-anchor-panel]";
  }

  return element.tagName.toLowerCase();
}
