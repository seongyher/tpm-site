import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";

import {
  type AnchoredDisclosureRuntime,
  installAnchoredDisclosure,
} from "../../../src/lib/anchored-disclosure";

describe("anchored disclosure controller", () => {
  test("does nothing outside a browser runtime", () => {
    expect(() => {
      installAnchoredDisclosure();
    }).not.toThrow();
  });

  test("installs from ambient browser globals when no runtime is injected", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <div data-disclosure-root>
        <button data-disclosure-trigger aria-expanded="false">Open</button>
        <div data-disclosure-panel>Panel</div>
      </div>
    `;

    const root = requiredElement(window, "[data-disclosure-root]");
    const trigger = requiredElement(window, "[data-disclosure-trigger]");

    withAmbientBrowserRuntime(window, () => {
      installAnchoredDisclosure();
      dispatchMouseEvent(trigger, window, "click");
    });

    expect(root.getAttribute("data-disclosure-open")).toBe("true");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  test("opens a root from an explicit trigger and keeps trigger state synchronized", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <div data-disclosure-root>
        <button data-disclosure-trigger aria-expanded="false">Open</button>
        <div data-disclosure-panel>Panel</div>
      </div>
    `;

    const root = requiredElement(window, "[data-disclosure-root]");
    const trigger = requiredElement(window, "[data-disclosure-trigger]");
    let changeCount = 0;
    root.addEventListener("anchored-disclosure-change", () => {
      changeCount += 1;
    });

    installAnchoredDisclosure(runtimeFor(window));
    dispatchMouseEvent(trigger, window, "click");

    expect(root.getAttribute("data-disclosure-open")).toBe("true");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(changeCount).toBe(1);

    dispatchMouseEvent(trigger, window, "click");
    expect(root.hasAttribute("data-disclosure-open")).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(changeCount).toBe(2);
  });

  test("summary triggers toggle while plain links wait for coarse activation", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <details id="summary-root" data-disclosure-root>
        <summary data-disclosure-trigger aria-expanded="false">Summary</summary>
        <div>Summary panel</div>
      </details>
      <div id="link-root" data-disclosure-root>
        <a data-disclosure-trigger href="/preview/" aria-expanded="false">
          Preview
        </a>
        <div>Link panel</div>
      </div>
    `;

    const summaryRoot = requiredElement(window, "#summary-root");
    const summaryTrigger = requiredElement(
      window,
      "#summary-root [data-disclosure-trigger]",
    );
    const linkRoot = requiredElement(window, "#link-root");
    const linkTrigger = requiredElement(
      window,
      "#link-root [data-disclosure-trigger]",
    );

    installAnchoredDisclosure(runtimeFor(window));

    expect(dispatchMouseEvent(summaryTrigger, window, "click")).toBe(false);
    expect(summaryRoot.getAttribute("data-disclosure-open")).toBe("true");

    expect(dispatchMouseEvent(linkTrigger, window, "click")).toBe(true);
    expect(linkRoot.hasAttribute("data-disclosure-open")).toBe(false);
  });

  test("opening one root closes siblings and outside pointer clicks dismiss", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <div id="first" data-disclosure-root data-disclosure-suppressed>
        <button data-disclosure-trigger aria-expanded="false">First</button>
        <div>First panel</div>
      </div>
      <div id="second" data-disclosure-root>
        <button data-disclosure-trigger aria-expanded="false">Second</button>
        <div>Second panel</div>
      </div>
    `;

    const outside = requiredElement(window, "#outside");
    const first = requiredElement(window, "#first");
    const second = requiredElement(window, "#second");
    const firstTrigger = requiredElement(
      window,
      "#first [data-disclosure-trigger]",
    );
    const secondTrigger = requiredElement(
      window,
      "#second [data-disclosure-trigger]",
    );

    installAnchoredDisclosure(runtimeFor(window));

    dispatchMouseEvent(firstTrigger, window, "click");
    expect(first.getAttribute("data-disclosure-open")).toBe("true");
    expect(first.hasAttribute("data-disclosure-suppressed")).toBe(false);

    dispatchMouseEvent(secondTrigger, window, "click");
    expect(first.hasAttribute("data-disclosure-open")).toBe(false);
    expect(second.getAttribute("data-disclosure-open")).toBe("true");

    dispatchPointerEvent(outside, window, "pointerdown", "mouse");
    expect(second.hasAttribute("data-disclosure-open")).toBe(false);
  });

  test("focus opens roots, clears stale suppression, and focusout respects retained focus", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <div data-disclosure-root data-disclosure-suppressed>
        <button data-disclosure-trigger aria-expanded="false">Toggle</button>
        <a id="inside" href="/inside/">Inside</a>
      </div>
    `;

    const outside = requiredElement(window, "#outside");
    const root = requiredElement(window, "[data-disclosure-root]");
    const trigger = requiredElement(window, "[data-disclosure-trigger]");
    const inside = requiredElement(window, "#inside");

    installImmediateAnimationFrame(window);
    installAnchoredDisclosure(runtimeFor(window));

    dispatchFocusEvent(outside, window, "focusin");
    expect(root.hasAttribute("data-disclosure-suppressed")).toBe(false);

    trigger.focus();
    dispatchFocusEvent(trigger, window, "focusin");
    expect(root.getAttribute("data-disclosure-open")).toBe("true");

    inside.focus();
    dispatchFocusEvent(trigger, window, "focusout");
    expect(root.getAttribute("data-disclosure-open")).toBe("true");

    outside.focus();
    dispatchFocusEvent(inside, window, "focusout");
    expect(root.hasAttribute("data-disclosure-open")).toBe(false);
  });

  test("Escape closes the active root, suppresses restored focus, and falls back to anchor triggers", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <div data-disclosure-root data-disclosure-open="true">
        <a data-anchor-trigger href="/inside/">Anchor trigger</a>
        <a id="panel-link" href="/inside/">Inside</a>
      </div>
    `;

    const root = requiredElement(window, "[data-disclosure-root]");
    const anchorTrigger = requiredElement(window, "[data-anchor-trigger]");
    const panelLink = requiredElement(window, "#panel-link");

    installAnchoredDisclosure(runtimeFor(window));

    panelLink.focus();
    expect(dispatchKeyboardEvent(window, "keydown", "Escape")).toBe(false);

    expect(root.hasAttribute("data-disclosure-open")).toBe(false);
    expect(root.getAttribute("data-disclosure-suppressed")).toBe("true");
    expect(Object.is(document.activeElement, anchorTrigger)).toBe(true);

    dispatchFocusEvent(anchorTrigger, window, "focusin");
    expect(root.hasAttribute("data-disclosure-open")).toBe(false);
  });

  test("Escape and non-element targets are ignored when no disclosure can handle them", () => {
    const window = browserWindow();

    installAnchoredDisclosure(runtimeFor(window));

    expect(dispatchKeyboardEvent(window, "keydown", "Enter")).toBe(true);
    expect(dispatchKeyboardEvent(window, "keydown", "Escape")).toBe(true);
    expect(
      window.document.dispatchEvent(
        new window.MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        }),
      ),
    ).toBe(true);
    expect(
      window.document.dispatchEvent(
        new window.FocusEvent("focusin", {
          bubbles: true,
        }),
      ),
    ).toBe(true);
    expect(
      window.document.dispatchEvent(
        new window.FocusEvent("focusout", {
          bubbles: true,
        }),
      ),
    ).toBe(true);
  });

  test("ignores disclosure events that have no trigger or root contract", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <button id="orphan" data-disclosure-trigger aria-expanded="false">Orphan</button>
    `;

    const outside = requiredElement(window, "#outside");
    const orphan = requiredElement(window, "#orphan");

    installAnchoredDisclosure(runtimeFor(window));

    expect(dispatchMouseEvent(outside, window, "click")).toBe(true);
    expect(dispatchMouseEvent(orphan, window, "click")).toBe(true);
    expect(dispatchFocusEvent(outside, window, "focusout")).toBe(true);
    expect(orphan.getAttribute("aria-expanded")).toBe("false");
  });

  test("coarse pointer link activation opens the disclosure instead of navigating", () => {
    const window = browserWindow({ coarsePointer: true });
    const document = window.document;

    document.body.innerHTML = `
      <div data-disclosure-root>
        <a data-disclosure-trigger href="/image.png" aria-expanded="false">
          Preview
        </a>
        <div data-disclosure-panel>Panel</div>
      </div>
    `;

    const root = requiredElement(window, "[data-disclosure-root]");
    const trigger = requiredElement(window, "[data-disclosure-trigger]");

    installAnchoredDisclosure(runtimeFor(window));

    dispatchPointerEvent(trigger, window, "pointerdown", "touch");
    expect(dispatchMouseEvent(trigger, window, "click")).toBe(false);
    expect(root.getAttribute("data-disclosure-open")).toBe("true");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  test("keeps link activation navigable when pointer media support is unavailable", () => {
    const window = browserWindow();
    const document = window.document;
    Reflect.set(window, "matchMedia", undefined);

    document.body.innerHTML = `
      <div data-disclosure-root>
        <a data-disclosure-trigger href="/image.png" aria-expanded="false">
          Preview
        </a>
        <div data-disclosure-panel>Panel</div>
      </div>
    `;

    const root = requiredElement(window, "[data-disclosure-root]");
    const trigger = requiredElement(window, "[data-disclosure-trigger]");

    installAnchoredDisclosure(runtimeFor(window));

    expect(dispatchMouseEvent(trigger, window, "click")).toBe(true);
    expect(root.hasAttribute("data-disclosure-open")).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  test("unknown pointer types fall back to media-query activation policy", () => {
    const window = browserWindow({ coarsePointer: true });
    const document = window.document;

    document.body.innerHTML = `
      <div data-disclosure-root>
        <a data-disclosure-trigger href="/image.png" aria-expanded="false">
          Preview
        </a>
        <div data-disclosure-panel>Panel</div>
      </div>
    `;

    const root = requiredElement(window, "[data-disclosure-root]");
    const trigger = requiredElement(window, "[data-disclosure-trigger]");

    installAnchoredDisclosure(runtimeFor(window));

    dispatchPointerEvent(trigger, window, "pointerdown", "eraser");
    expect(dispatchMouseEvent(trigger, window, "click")).toBe(false);
    expect(root.getAttribute("data-disclosure-open")).toBe("true");
  });

  test("pen activation follows fine-pointer media support", () => {
    const window = browserWindow({ finePointer: true });
    const document = window.document;

    document.body.innerHTML = `
      <div data-disclosure-root>
        <a data-disclosure-trigger href="/image.png" aria-expanded="false">
          Preview
        </a>
        <div data-disclosure-panel>Panel</div>
      </div>
    `;

    const root = requiredElement(window, "[data-disclosure-root]");
    const trigger = requiredElement(window, "[data-disclosure-trigger]");

    installAnchoredDisclosure(runtimeFor(window));

    dispatchPointerEvent(trigger, window, "pointerdown", "pen");
    expect(dispatchMouseEvent(trigger, window, "click")).toBe(true);
    expect(root.hasAttribute("data-disclosure-open")).toBe(false);
  });

  test("Escape closes roots that do not have a focusable trigger fallback", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <div data-disclosure-root data-disclosure-open="true">
        <a id="panel-link" href="/inside/">Inside</a>
      </div>
    `;

    const root = requiredElement(window, "[data-disclosure-root]");

    installAnchoredDisclosure(runtimeFor(window));

    expect(dispatchKeyboardEvent(window, "keydown", "Escape")).toBe(false);
    expect(root.hasAttribute("data-disclosure-open")).toBe(false);
    expect(root.getAttribute("data-disclosure-suppressed")).toBe("true");
  });
});

function browserWindow(
  options: {
    readonly coarsePointer?: boolean;
    readonly finePointer?: boolean;
  } = {},
): Window {
  const window = new Window({ url: "https://example.com/" });
  Reflect.set(window, "SyntaxError", SyntaxError);
  Reflect.set(
    window,
    "requestAnimationFrame",
    (callback: FrameRequestCallback) => {
      callback(0);

      return 1;
    },
  );
  Reflect.set(window, "matchMedia", (query: string) => ({
    addEventListener: () => undefined,
    addListener: () => undefined,
    dispatchEvent: () => true,
    matches:
      (options.coarsePointer === true &&
        (query.includes("hover: none") || query.includes("pointer: coarse"))) ||
      (options.finePointer === true &&
        query.includes("hover: hover") &&
        query.includes("pointer: fine")),
    media: query,
    onchange: null,
    removeEventListener: () => undefined,
    removeListener: () => undefined,
  }));

  return window;
}

function runtimeFor(window: Window): AnchoredDisclosureRuntime {
  return {
    classes: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM exposes browser constructors with the runtime shape needed by the controller.
      Element: window.Element as unknown as typeof Element,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM exposes browser constructors with the runtime shape needed by the controller.
      Node: window.Node as unknown as typeof Node,
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM provides the browser runtime shape used by this controller test.
    document: window.document as unknown as Document,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM provides the browser runtime shape used by this controller test.
    window: window as unknown as globalThis.Window,
  };
}

function requiredElement(window: Window, selector: string): HTMLElement {
  const element = window.document.querySelector(selector);

  if (!(element instanceof window.HTMLElement)) {
    throw new Error(`Expected fixture element for selector ${selector}.`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM elements satisfy the browser HTMLElement shape used by the controller.
  return element as unknown as HTMLElement;
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

function withAmbientBrowserRuntime(window: Window, callback: () => void): void {
  const keys = ["document", "window", "Element", "Node"] as const;
  const originals = new Map<
    (typeof keys)[number],
    { existed: boolean; value: unknown }
  >();

  for (const key of keys) {
    originals.set(key, {
      existed: Object.hasOwn(globalThis, key),
      value: Reflect.get(globalThis, key),
    });
  }

  try {
    Reflect.set(globalThis, "document", window.document);
    Reflect.set(globalThis, "window", window);
    Reflect.set(globalThis, "Element", window.Element);
    Reflect.set(globalThis, "Node", window.Node);
    callback();
  } finally {
    for (const [key, original] of originals) {
      if (original.existed) {
        Reflect.set(globalThis, key, original.value);
      } else {
        Reflect.deleteProperty(globalThis, key);
      }
    }
  }
}

function dispatchMouseEvent(
  element: HTMLElement,
  window: Window,
  eventName: string,
): boolean {
  return element.dispatchEvent(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM events satisfy DOM Event at runtime for dispatch.
    new window.MouseEvent(eventName, {
      bubbles: true,
      cancelable: true,
    }) as unknown as Event,
  );
}

function dispatchPointerEvent(
  element: HTMLElement,
  window: Window,
  eventName: string,
  pointerType: string,
): boolean {
  const event = new window.Event(eventName, {
    bubbles: true,
    cancelable: true,
  });
  Reflect.set(event, "pointerType", pointerType);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM events satisfy DOM Event at runtime for dispatch.
  return element.dispatchEvent(event as unknown as Event);
}

function dispatchFocusEvent(
  element: HTMLElement,
  window: Window,
  eventName: string,
): boolean {
  return element.dispatchEvent(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM events satisfy DOM Event at runtime for dispatch.
    new window.FocusEvent(eventName, {
      bubbles: true,
    }) as unknown as Event,
  );
}

function dispatchKeyboardEvent(
  window: Window,
  eventName: string,
  key: string,
): boolean {
  const event = new window.Event(eventName, {
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, "key", {
    value: key,
  });

  return window.document.dispatchEvent(event);
}
