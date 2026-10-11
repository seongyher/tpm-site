import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";

describe("site header offset browser script", () => {
  test("publishes sticky header height as a document CSS variable", async () => {
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

    await withBrowserGlobals(window, async () => {
      Reflect.set(
        globalThis,
        "ResizeObserver",
        class ResizeObserver {
          constructor(private readonly callback: ResizeObserverCallback) {}

          disconnect(): void {
            observedElement = undefined;
          }

          observe(element: Element): void {
            observedElement = element;
            this.callback([], this);
          }

          unobserve(element: Element): void {
            if (observedElement === element) {
              observedElement = undefined;
            }
          }
        },
      );

      await import("../../../src/scripts/site-header-offset");
    });

    expect(observedElement).toBe(header);
    expect(
      document.documentElement.style.getPropertyValue("--site-header-height"),
    ).toBe("96px");
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

  // Happy DOM implements browser elements at runtime but exposes package-local DOM types.
  return element as HTMLElement;
}

async function withBrowserGlobals(
  window: Window,
  callback: () => Promise<void>,
): Promise<void> {
  Reflect.set(globalThis, "document", window.document);
  Reflect.set(globalThis, "HTMLElement", window.HTMLElement);
  Reflect.set(globalThis, "window", window);

  try {
    await callback();
  } finally {
    Reflect.deleteProperty(globalThis, "document");
    Reflect.deleteProperty(globalThis, "HTMLElement");
    Reflect.deleteProperty(globalThis, "ResizeObserver");
    Reflect.deleteProperty(globalThis, "window");
  }
}
