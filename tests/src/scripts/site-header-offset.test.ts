import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";

import { installSiteHeaderOffset } from "../../../src/scripts/site-header-offset";

describe("site header offset browser script", () => {
  test("publishes sticky header height as a document CSS variable", () => {
    const window = new Window({
      url: "https://example.com/articles/post/#target",
    });
    Reflect.set(window, "SyntaxError", SyntaxError);
    const document = window.document;

    document.body.innerHTML = `
      <header data-site-header>Header</header>
      <h2 id="target">Target</h2>
    `;

    const header = browserElement(document.querySelector("[data-site-header]"));
    const target = browserElement(document.getElementById("target"));
    let observedElement: Element | undefined;
    let scrolledIntoView = false;

    if (header === null || target === null) {
      throw new Error("Expected site-header offset fixtures.");
    }

    Reflect.set(header, "getBoundingClientRect", () => domRect({ height: 96 }));
    Reflect.set(target, "scrollIntoView", () => {
      scrolledIntoView = true;
    });
    Reflect.set(
      window,
      "requestAnimationFrame",
      (callback: FrameRequestCallback) => {
        callback(0);

        return 1;
      },
    );

    installSiteHeaderOffset({
      document: browserDocument(document),
      ResizeObserver: resizeObserverClass((element) => {
        observedElement = element;
      }),
      window: browserWindow(window),
    });

    expect(observedElement).toBe(header);
    expect(
      document.documentElement.style.getPropertyValue("--site-header-height"),
    ).toBe("96px");
    expect(scrolledIntoView).toBe(true);
  });

  test("keeps missing headers and empty hash targets inert", () => {
    const window = new Window({
      url: "https://example.com/articles/post/",
    });
    Reflect.set(window, "SyntaxError", SyntaxError);
    const document = window.document;
    let animationFrameCalls = 0;
    let observedElement: Element | undefined;

    Reflect.set(
      window,
      "requestAnimationFrame",
      (callback: FrameRequestCallback) => {
        animationFrameCalls += 1;
        callback(0);

        return 1;
      },
    );

    installSiteHeaderOffset({
      document: browserDocument(document),
      ResizeObserver: resizeObserverClass((element) => {
        observedElement = element;
      }),
      window: browserWindow(window),
    });

    expect(animationFrameCalls).toBe(0);
    expect(observedElement).toBeUndefined();

    document.body.innerHTML = `<header data-site-header>Header</header>`;
    const header = browserElement(document.querySelector("[data-site-header]"));
    if (header === null) {
      throw new Error("Expected site-header fixture.");
    }
    Reflect.set(header, "getBoundingClientRect", () => domRect({ height: 64 }));

    installSiteHeaderOffset({
      document: browserDocument(document),
      ResizeObserver: resizeObserverClass((element) => {
        observedElement = element;
      }),
      window: browserWindow(window),
    });

    expect(animationFrameCalls).toBe(0);
    expect(observedElement).toBe(header);
    expect(
      document.documentElement.style.getPropertyValue("--site-header-height"),
    ).toBe("64px");

    window.history.replaceState(null, "", "#missing");
    window.dispatchEvent(new window.Event("hashchange"));
    expect(animationFrameCalls).toBe(0);
  });

  test("installs from ambient browser globals when runtime is omitted", () => {
    const window = new Window({
      url: "https://example.com/articles/post/#target",
    });
    Reflect.set(window, "SyntaxError", SyntaxError);
    const document = window.document;
    document.body.innerHTML = `
      <header data-site-header>Header</header>
      <h2 id="target">Target</h2>
    `;

    const header = browserElement(document.querySelector("[data-site-header]"));
    const target = browserElement(document.getElementById("target"));
    let scrolledIntoView = false;

    if (header === null || target === null) {
      throw new Error("Expected site-header offset fixtures.");
    }

    Reflect.set(header, "getBoundingClientRect", () => domRect({ height: 72 }));
    Reflect.set(target, "scrollIntoView", () => {
      scrolledIntoView = true;
    });
    Reflect.set(
      window,
      "requestAnimationFrame",
      (callback: FrameRequestCallback) => {
        callback(0);

        return 1;
      },
    );

    withAmbientBrowserGlobals(window, () => {
      Reflect.set(
        globalThis,
        "ResizeObserver",
        resizeObserverClass(() => undefined),
      );
      installSiteHeaderOffset();
    });

    window.dispatchEvent(new window.Event("load"));

    expect(
      document.documentElement.style.getPropertyValue("--site-header-height"),
    ).toBe("72px");
    expect(scrolledIntoView).toBe(true);
  });
});

function domRect({ height }: { height: number }): DOMRect {
  return {
    bottom: height,
    height,
    left: 0,
    right: 400,
    toJSON: () => ({}),
    top: 0,
    width: 400,
    x: 0,
    y: 0,
  };
}

function browserElement(element: unknown): HTMLElement | null {
  if (element === null) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements browser elements at runtime but exposes package-local DOM types.
  return element as HTMLElement;
}

function browserDocument(document: unknown): Document {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements browser documents at runtime but exposes package-local DOM types.
  return document as Document;
}

function browserWindow(
  window: unknown,
): globalThis.Window & Pick<typeof globalThis, "HTMLElement"> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements browser windows at runtime but exposes package-local DOM types.
  return window as globalThis.Window & Pick<typeof globalThis, "HTMLElement">;
}

function resizeObserverClass(
  observeElement: (element: Element) => void,
): typeof ResizeObserver {
  return class ResizeObserver {
    private observedElement: Element | undefined;

    constructor(private readonly callback: ResizeObserverCallback) {}

    disconnect(): void {
      this.observedElement = undefined;
    }

    observe(element: Element): void {
      this.observedElement = element;
      observeElement(element);
      this.callback([], this);
    }

    unobserve(element: Element): void {
      if (this.observedElement === element) {
        this.observedElement = undefined;
      }
    }
  };
}

function withAmbientBrowserGlobals(window: Window, callback: () => void): void {
  Reflect.set(globalThis, "document", window.document);
  Reflect.set(globalThis, "window", window);

  try {
    callback();
  } finally {
    Reflect.deleteProperty(globalThis, "document");
    Reflect.deleteProperty(globalThis, "ResizeObserver");
    Reflect.deleteProperty(globalThis, "window");
  }
}
