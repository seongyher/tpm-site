import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";

import {
  type AnchoredDisclosureRuntime,
  installAnchoredDisclosure,
} from "../../../src/scripts/anchored-disclosure";

describe("anchored disclosure browser script", () => {
  test("button triggers toggle open state and aria-expanded", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <div data-disclosure-root>
        <button data-disclosure-trigger aria-expanded="false">Toggle</button>
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

  test("opening one root closes previous roots and outside clicks dismiss", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <div id="first" data-disclosure-root>
        <button data-disclosure-trigger aria-expanded="false">First</button>
        <div data-disclosure-panel>First panel</div>
      </div>
      <div id="second" data-disclosure-root>
        <button data-disclosure-trigger aria-expanded="false">Second</button>
        <div data-disclosure-panel>Second panel</div>
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

    dispatchMouseEvent(secondTrigger, window, "click");
    expect(first.hasAttribute("data-disclosure-open")).toBe(false);
    expect(second.getAttribute("data-disclosure-open")).toBe("true");

    dispatchPointerEvent(outside, window, "pointerdown", "mouse");
    expect(second.hasAttribute("data-disclosure-open")).toBe(false);
  });

  test("focus opens and focus leaving closes", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <button id="outside">Outside</button>
      <div data-disclosure-root>
        <button data-disclosure-trigger aria-expanded="false">Toggle</button>
        <a href="/inside/">Inside</a>
      </div>
    `;

    const outside = requiredElement(window, "#outside");
    const root = requiredElement(window, "[data-disclosure-root]");
    const trigger = requiredElement(window, "[data-disclosure-trigger]");

    installImmediateAnimationFrame(window);
    installAnchoredDisclosure(runtimeFor(window));

    trigger.focus();
    dispatchFocusEvent(trigger, window, "focusin");
    expect(root.getAttribute("data-disclosure-open")).toBe("true");

    outside.focus();
    dispatchFocusEvent(trigger, window, "focusout");
    expect(root.hasAttribute("data-disclosure-open")).toBe(false);
  });

  test("Escape closes without immediately reopening from restored focus", () => {
    const window = browserWindow();
    const document = window.document;

    document.body.innerHTML = `
      <div data-disclosure-root data-disclosure-open="true">
        <button data-disclosure-trigger aria-expanded="true">Toggle</button>
        <a id="panel-link" href="/inside/">Inside</a>
      </div>
    `;

    const root = requiredElement(window, "[data-disclosure-root]");
    const trigger = requiredElement(window, "[data-disclosure-trigger]");
    const panelLink = requiredElement(window, "#panel-link");

    installAnchoredDisclosure(runtimeFor(window));

    panelLink.focus();
    dispatchKeyboardEvent(panelLink, window, "keydown", "Escape");

    expect(root.hasAttribute("data-disclosure-open")).toBe(false);
    expect(root.getAttribute("data-disclosure-suppressed")).toBe("true");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    dispatchFocusEvent(trigger, window, "focusin");
    expect(root.hasAttribute("data-disclosure-open")).toBe(false);
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
    const clickAllowed = dispatchMouseEvent(trigger, window, "click");

    expect(clickAllowed).toBe(false);
    expect(root.getAttribute("data-disclosure-open")).toBe("true");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });
});

function browserWindow(
  options: { readonly coarsePointer?: boolean } = {},
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
      options.coarsePointer === true &&
      (query.includes("hover: none") || query.includes("pointer: coarse")),
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM exposes browser constructors with the runtime shape needed by the script.
      Element: window.Element as unknown as typeof Element,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM exposes browser constructors with the runtime shape needed by the script.
      Node: window.Node as unknown as typeof Node,
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
  pointerType: "mouse" | "pen" | "touch",
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
  _element: HTMLElement,
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
