import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";

import {
  horizontalScrollStep,
  installHorizontalScrollRails,
} from "../../../src/scripts/horizontal-scroll-rail";

describe("horizontal scroll rail browser script", () => {
  test("reveals only the forward edge control at the rail start", () => {
    const window = railWindow();
    const document = browserDocument(window.document);

    appendRailFixture(document, { clientWidth: 320, scrollWidth: 900 });
    installHorizontalScrollRails(document);

    const previousWrap = requiredHtmlElement(
      document.querySelector("[data-scroll-rail-start]"),
    );
    const nextWrap = requiredHtmlElement(
      document.querySelector("[data-scroll-rail-end]"),
    );
    const previous = requiredButton(
      document.querySelector("[data-scroll-rail-previous]"),
    );
    const next = requiredButton(
      document.querySelector("[data-scroll-rail-next]"),
    );

    expect(previousWrap.hidden).toBe(true);
    expect(previousWrap.classList.contains("flex")).toBe(false);
    expect(nextWrap.hidden).toBe(false);
    expect(nextWrap.classList.contains("flex")).toBe(true);
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
  });

  test("scrolls by a visible page and updates edge affordances", () => {
    const window = railWindow();
    const document = browserDocument(window.document);

    appendRailFixture(document, { clientWidth: 320, scrollWidth: 900 });
    installHorizontalScrollRails(document);

    const viewport = requiredHtmlElement(
      document.querySelector("[data-scroll-rail-viewport]"),
    );
    const previous = requiredButton(
      document.querySelector("[data-scroll-rail-previous]"),
    );
    const next = requiredButton(
      document.querySelector("[data-scroll-rail-next]"),
    );
    const previousWrap = requiredHtmlElement(
      document.querySelector("[data-scroll-rail-start]"),
    );
    const nextWrap = requiredHtmlElement(
      document.querySelector("[data-scroll-rail-end]"),
    );

    next.dispatchEvent(domEvent(new window.Event("click")));

    expect(viewport.scrollLeft).toBe(horizontalScrollStep(viewport));
    expect(previousWrap.hidden).toBe(false);
    expect(nextWrap.hidden).toBe(false);
    expect(previous.disabled).toBe(false);
    expect(next.disabled).toBe(false);

    viewport.scrollLeft = 580;
    viewport.dispatchEvent(domEvent(new window.Event("scroll")));

    expect(previousWrap.hidden).toBe(false);
    expect(nextWrap.hidden).toBe(true);
    expect(previous.disabled).toBe(false);
    expect(next.disabled).toBe(true);

    previous.dispatchEvent(domEvent(new window.Event("click")));

    expect(viewport.scrollLeft).toBe(580 - horizontalScrollStep(viewport));
  });

  test("keeps controls hidden when every item already fits", () => {
    const window = railWindow();
    const document = browserDocument(window.document);

    appendRailFixture(document, { clientWidth: 900, scrollWidth: 900 });
    installHorizontalScrollRails(document);

    const controls = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scroll-rail-controls]"),
    );
    const previous = requiredButton(
      document.querySelector("[data-scroll-rail-previous]"),
    );
    const next = requiredButton(
      document.querySelector("[data-scroll-rail-next]"),
    );

    expect(controls.every((control) => control.hidden === true)).toBe(true);
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(true);
  });

  test("does not bind incomplete or already-bound rail fixtures", () => {
    const window = railWindow();
    const document = browserDocument(window.document);
    const incomplete = document.createElement("section");
    incomplete.setAttribute("data-scroll-rail", "");
    document.body.append(incomplete);

    expect(() => installHorizontalScrollRails(document)).not.toThrow();

    appendRailFixture(document, { clientWidth: 320, scrollWidth: 900 });
    const root = requiredHtmlElement(
      document.querySelector("[data-scroll-rail]"),
    );
    const next = requiredButton(
      document.querySelector("[data-scroll-rail-next]"),
    );

    installHorizontalScrollRails(document);
    installHorizontalScrollRails(document);
    next.dispatchEvent(domEvent(new window.Event("click")));

    const viewport = requiredHtmlElement(
      document.querySelector("[data-scroll-rail-viewport]"),
    );
    expect(root.getAttribute("data-scroll-rail-bound")).toBe("true");
    expect(viewport.scrollLeft).toBe(horizontalScrollStep(viewport));
  });

  test("updates controls from resize observers and reduced-motion scrolling", () => {
    const window = railWindow();
    const document = browserDocument(window.document);
    let observerCallback: ResizeObserverCallback | undefined;
    const observer: ResizeObserver = {
      disconnect: () => {
        observerCallback = undefined;
      },
      observe: (element: Element, options?: ResizeObserverOptions) => {
        void element;
        void options;
      },
      unobserve: (element: Element) => {
        void element;
      },
    };

    Reflect.set(window, "matchMedia", () => ({ matches: true }));
    Reflect.set(
      window,
      "ResizeObserver",
      class TestResizeObserver implements ResizeObserver {
        constructor(callback: ResizeObserverCallback) {
          observerCallback = callback;
        }

        disconnect(): void {
          observer.disconnect();
        }

        observe(element: Element, options?: ResizeObserverOptions): void {
          observer.observe(element, options);
        }

        unobserve(element: Element): void {
          observer.unobserve(element);
        }
      },
    );

    appendRailFixture(document, { clientWidth: 320, scrollWidth: 900 });
    installHorizontalScrollRails(document);
    const viewport = requiredHtmlElement(
      document.querySelector("[data-scroll-rail-viewport]"),
    );
    const next = requiredButton(
      document.querySelector("[data-scroll-rail-next]"),
    );
    let behavior: ScrollBehavior | undefined;
    Object.defineProperty(viewport, "scrollBy", {
      configurable: true,
      value: (options?: number | ScrollToOptions) => {
        if (typeof options !== "number") {
          behavior = options?.behavior;
          viewport.scrollLeft += options?.left ?? 0;
        }
      },
    });

    next.dispatchEvent(domEvent(new window.Event("click")));
    defineDimension(viewport, "scrollWidth", 320);
    const callback = observerCallback;
    if (callback !== undefined) {
      callback([], observer);
    }

    expect(behavior).toBe("auto");
    expect(next.disabled).toBe(true);
  });

  test("keeps rails usable when ResizeObserver is unavailable", () => {
    const window = railWindow();
    const document = browserDocument(window.document);

    Reflect.set(window, "ResizeObserver", undefined);
    appendRailFixture(document, { clientWidth: 320, scrollWidth: 900 });

    expect(() => installHorizontalScrollRails(document)).not.toThrow();
    expect(
      requiredButton(document.querySelector("[data-scroll-rail-next]"))
        .disabled,
    ).toBe(false);
  });
});

function appendRailFixture(
  document: Document,
  {
    clientWidth,
    scrollWidth,
  }: {
    clientWidth: number;
    scrollWidth: number;
  },
): void {
  const root = document.createElement("section");
  root.setAttribute("data-scroll-rail", "");

  const previousWrap = document.createElement("div");
  previousWrap.classList.add("hidden");
  previousWrap.hidden = true;
  previousWrap.setAttribute("data-scroll-rail-controls", "");
  previousWrap.setAttribute("data-scroll-rail-start", "");

  const previous = document.createElement("button");
  previous.disabled = true;
  previous.setAttribute("data-scroll-rail-previous", "");

  const viewport = document.createElement("ul");
  viewport.setAttribute("data-scroll-rail-viewport", "");
  defineDimension(viewport, "clientWidth", clientWidth);
  defineDimension(viewport, "scrollWidth", scrollWidth);
  const defaultView = document.defaultView;
  if (defaultView === null) {
    throw new Error("Expected rail fixture window.");
  }
  Object.defineProperty(viewport, "scrollBy", {
    configurable: true,
    value: (options?: number | ScrollToOptions) => {
      const left = typeof options === "number" ? options : (options?.left ?? 0);

      viewport.scrollLeft += left;
      viewport.dispatchEvent(domEvent(new defaultView.Event("scroll")));
    },
  });

  const nextWrap = document.createElement("div");
  nextWrap.classList.add("hidden");
  nextWrap.hidden = true;
  nextWrap.setAttribute("data-scroll-rail-controls", "");
  nextWrap.setAttribute("data-scroll-rail-end", "");

  const next = document.createElement("button");
  next.disabled = true;
  next.setAttribute("data-scroll-rail-next", "");

  previousWrap.append(previous);
  nextWrap.append(next);
  root.append(previousWrap, viewport, nextWrap);
  document.body.replaceChildren(root);
}

function railWindow(): Window {
  const window = new Window();

  Reflect.set(window, "SyntaxError", SyntaxError);
  Reflect.set(window, "matchMedia", () => ({ matches: false }));
  Reflect.set(
    window,
    "requestAnimationFrame",
    (callback: FrameRequestCallback) => {
      callback(0);

      return 1;
    },
  );

  return window;
}

function defineDimension(
  element: HTMLElement,
  property: "clientWidth" | "scrollWidth",
  value: number,
): void {
  Object.defineProperty(element, property, {
    configurable: true,
    value,
  });
}

function requiredButton(element: Element | null): HTMLButtonElement {
  if (element?.tagName !== "BUTTON") {
    throw new Error("Expected rail fixture button.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The fixture creates a button element inside Happy DOM.
  return element as HTMLButtonElement;
}

function requiredHtmlElement(element: Element | null): HTMLElement {
  if (element === null) {
    throw new Error("Expected rail fixture element.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements browser elements at runtime but exposes package-local DOM types.
  return element as HTMLElement;
}

function browserDocument(document: unknown): Document {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements browser documents at runtime but exposes package-local DOM types.
  return document as Document;
}

function domEvent(event: unknown): Event {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM events are runtime-compatible with DOM dispatch in these tests.
  return event as Event;
}
