import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";

import {
  type ArticleReferencePreviewRuntime,
  installArticleReferencePreviews,
} from "../../../src/scripts/article-reference-previews";

describe("article reference preview browser script", () => {
  test("does nothing without a usable preview panel", () => {
    const window = browserWindow();
    const document = window.document;

    expect(() => installArticleReferencePreviews()).not.toThrow();

    document.body.innerHTML = `<section data-article-references></section>`;
    installArticleReferencePreviews(runtimeFor(window));
    expect(
      document.querySelector("[data-article-reference-preview-initialized]"),
    ).toBe(null);

    document.body.innerHTML = `<div data-article-reference-preview></div>`;
    installArticleReferencePreviews(runtimeFor(window));
    expect(
      document.querySelector("[data-article-reference-preview-initialized]"),
    ).toBe(null);

    document.body.innerHTML = `
      <div data-article-reference-preview data-article-reference-preview-initialized>
        <div data-article-reference-preview-content></div>
      </div>
    `;
    installArticleReferencePreviews(runtimeFor(window));
    expect(requiredElement(window, "[data-article-reference-preview]").id).toBe(
      "",
    );
  });

  test("opens citation definition previews from inline markers", () => {
    const window = browserWindow();
    const document = window.document;
    // eslint-disable-next-line no-unsanitized/property -- Static test fixture for browser behavior.
    document.body.innerHTML = referencePreviewFixture();

    const marker = requiredElement(window, "#cite-ref-source");
    const panel = requiredElement(window, "[data-article-reference-preview]");
    setRect(marker, { height: 16, width: 24, x: 240, y: 160 });
    setRect(panel, { height: 180, width: 320, x: 0, y: 0 });

    installArticleReferencePreviews(runtimeFor(window));
    dispatchWindowEvent(marker, window, "pointerover");

    expect(panel.hidden).toBe(false);
    expect(panel.classList.contains("hidden")).toBe(false);
    expect(panel.dataset["referencePreviewSource"]).toBe("definition");
    expect(
      textContent(panel, "[data-article-reference-preview-content]"),
    ).toContain("Source title");
    expect(
      panel.querySelector("[data-article-reference-preview-content] [id]"),
    ).toBe(null);
    expect(
      panel.querySelector(
        "[data-article-reference-preview-content] [data-article-reference-marker]",
      ),
    ).toBe(null);
    expect(panel.querySelector("[data-article-reference-preview-label]")).toBe(
      null,
    );
    expect(panel.querySelector("[data-article-reference-preview-jump]")).toBe(
      null,
    );
    expect(panel.style.getPropertyValue("--anchor-x")).toBe("54px");
  });

  test("opens marker previews from encoded hash fragments when metadata is absent", () => {
    const window = browserWindow();
    const document = window.document;
    document.body.innerHTML = `
      <article data-article-prose>
        <p>
          Encoded marker
          <a
            id="encoded-marker"
            href="#cite%20source"
            data-article-reference-marker="true"
          >[1]</a>
        </p>
      </article>
      <section data-article-references>
        <ol>
          <li id="cite source">
            <div data-article-reference-definition-content>
              <p>Encoded source title.</p>
            </div>
          </li>
        </ol>
        <div class="hidden" data-article-reference-preview hidden>
          <div data-article-reference-preview-content></div>
        </div>
      </section>
    `;

    const marker = requiredElement(window, "#encoded-marker");
    const panel = requiredElement(window, "[data-article-reference-preview]");
    setRect(marker, { height: 16, width: 24, x: 240, y: 160 });
    setRect(panel, { height: 180, width: 320, x: 0, y: 0 });

    installArticleReferencePreviews(runtimeFor(window));
    dispatchWindowEvent(marker, window, "pointerover");

    expect(panel.hidden).toBe(false);
    expect(
      textContent(panel, "[data-article-reference-preview-content]"),
    ).toContain("Encoded source title.");
  });

  test("falls back to undecodable hash fragments when finding preview targets", () => {
    const window = browserWindow();
    const document = window.document;
    document.body.innerHTML = `
      <article data-article-prose>
        <p>
          Legacy marker
          <a
            id="legacy-marker"
            href="#%E0%A4%A"
            data-article-reference-marker="true"
          >[1]</a>
        </p>
      </article>
      <section data-article-references>
        <ol>
          <li id="%E0%A4%A">
            <div data-article-reference-definition-content>
              <p>Legacy malformed fragment source.</p>
            </div>
          </li>
        </ol>
        <div class="hidden" data-article-reference-preview hidden>
          <div data-article-reference-preview-content></div>
        </div>
      </section>
    `;

    const marker = requiredElement(window, "#legacy-marker");
    const panel = requiredElement(window, "[data-article-reference-preview]");
    setRect(marker, { height: 16, width: 24, x: 240, y: 160 });
    setRect(panel, { height: 180, width: 320, x: 0, y: 0 });

    installArticleReferencePreviews(runtimeFor(window));
    dispatchWindowEvent(marker, window, "pointerover");

    expect(panel.hidden).toBe(false);
    expect(
      textContent(panel, "[data-article-reference-preview-content]"),
    ).toContain("Legacy malformed fragment source.");
  });

  test("opens backlink context previews from source prose blocks", () => {
    const window = browserWindow();
    const document = window.document;
    // eslint-disable-next-line no-unsanitized/property -- Static test fixture for browser behavior.
    document.body.innerHTML = referencePreviewFixture();

    const backlink = requiredElement(window, "#cite-backref-source");
    const panel = requiredElement(window, "[data-article-reference-preview]");
    setRect(backlink, { height: 32, width: 64, x: 120, y: 520 });
    setRect(panel, { height: 160, width: 320, x: 0, y: 0 });

    installArticleReferencePreviews(runtimeFor(window));
    backlink.focus();
    dispatchWindowEvent(backlink, window, "focusin");

    expect(panel.hidden).toBe(false);
    expect(panel.dataset["referencePreviewSource"]).toBe("context");
    expect(
      textContent(panel, "[data-article-reference-preview-content]"),
    ).toContain("This paragraph cites a source");
    expect(panel.querySelector("[data-article-reference-preview-label]")).toBe(
      null,
    );
    expect(panel.querySelector("[data-article-reference-preview-jump]")).toBe(
      null,
    );
  });

  test("does not keep stale previews for missing or empty targets", () => {
    const window = browserWindow();
    const document = window.document;
    // eslint-disable-next-line no-unsanitized/property -- Static test fixture for browser behavior.
    document.body.innerHTML = referencePreviewFixture();

    const marker = requiredElement(window, "#cite-ref-source");
    const missing = requiredElement(window, "#missing-reference");
    const panel = requiredElement(window, "[data-article-reference-preview]");
    setRect(marker, { height: 16, width: 24, x: 240, y: 160 });
    setRect(missing, { height: 16, width: 24, x: 280, y: 160 });
    setRect(panel, { height: 180, width: 320, x: 0, y: 0 });

    installArticleReferencePreviews(runtimeFor(window));
    dispatchWindowEvent(marker, window, "pointerover");
    expect(panel.hidden).toBe(false);

    dispatchWindowEvent(missing, window, "pointerover");
    expect(panel.hidden).toBe(true);
    expect(panel.classList.contains("hidden")).toBe(true);
  });

  test("keeps touch hover quiet but opens the first coarse-pointer tap as a preview", () => {
    const window = browserWindow({ coarsePointer: true });
    const document = window.document;
    // eslint-disable-next-line no-unsanitized/property -- Static test fixture for browser behavior.
    document.body.innerHTML = referencePreviewFixture();

    const marker = requiredElement(window, "#cite-ref-source");
    const panel = requiredElement(window, "[data-article-reference-preview]");
    setRect(marker, { height: 16, width: 24, x: 120, y: 160 });
    setRect(panel, { height: 180, width: 320, x: 0, y: 0 });

    installArticleReferencePreviews(runtimeFor(window));
    dispatchPointerEvent(marker, window, "pointerover", "touch");
    expect(panel.hidden).toBe(true);

    const click = dispatchWindowEvent(marker, window, "click", {
      cancelable: true,
    });

    expect(click.defaultPrevented).toBe(true);
    expect(panel.hidden).toBe(false);
    expect(marker.getAttribute("aria-describedby")).toBe(panel.id);
  });

  test("closes active previews when users click outside", () => {
    const window = browserWindow();
    const document = window.document;
    // eslint-disable-next-line no-unsanitized/property -- Static test fixture for browser behavior.
    document.body.innerHTML = referencePreviewFixture();

    const marker = requiredElement(window, "#cite-ref-source");
    const panel = requiredElement(window, "[data-article-reference-preview]");
    setRect(marker, { height: 16, width: 24, x: 240, y: 160 });
    setRect(panel, { height: 180, width: 320, x: 0, y: 0 });

    installArticleReferencePreviews(runtimeFor(window));
    dispatchWindowEvent(marker, window, "pointerover");
    expect(panel.hidden).toBe(false);

    dispatchWindowEvent(
      requiredElement(window, "#outside-target"),
      window,
      "click",
    );

    expect(panel.hidden).toBe(true);
    expect(panel.classList.contains("hidden")).toBe(true);
    expect(marker.getAttribute("aria-describedby")).toBe(null);
  });

  test("repositions an active preview when the viewport changes", () => {
    const window = browserWindow();
    const document = window.document;
    // eslint-disable-next-line no-unsanitized/property -- Static test fixture for browser behavior.
    document.body.innerHTML = referencePreviewFixture();

    const marker = requiredElement(window, "#cite-ref-source");
    const panel = requiredElement(window, "[data-article-reference-preview]");
    setRect(marker, { height: 16, width: 24, x: 240, y: 160 });
    setRect(panel, { height: 180, width: 320, x: 0, y: 0 });

    installArticleReferencePreviews(runtimeFor(window));
    dispatchWindowEvent(marker, window, "pointerover");
    const firstX = panel.style.getPropertyValue("--anchor-x");

    setRect(marker, { height: 16, width: 24, x: 12, y: 160 });
    dispatchWindowEvent(window, window, "resize");

    expect(panel.style.getPropertyValue("--anchor-x")).not.toBe(firstX);
  });

  test("closes previews after pointer and focus leave both trigger and panel", () => {
    const window = browserWindow({ immediateTimers: true });
    const document = window.document;
    // eslint-disable-next-line no-unsanitized/property -- Static test fixture for browser behavior.
    document.body.innerHTML = referencePreviewFixture();

    const marker = requiredElement(window, "#cite-ref-source");
    const outside = requiredElement(window, "#outside-target");
    const panel = requiredElement(window, "[data-article-reference-preview]");
    setRect(marker, { height: 16, width: 24, x: 240, y: 160 });
    setRect(panel, { height: 180, width: 320, x: 0, y: 0 });

    installArticleReferencePreviews(runtimeFor(window));
    dispatchWindowEvent(marker, window, "pointerover");
    expect(panel.hidden).toBe(false);

    dispatchWindowEvent(marker, window, "pointerout", {
      relatedTarget: outside,
    });
    expect(panel.hidden).toBe(true);

    dispatchWindowEvent(marker, window, "pointerover");
    marker.focus();
    dispatchWindowEvent(marker, window, "focusout", {
      relatedTarget: outside,
    });
    expect(panel.hidden).toBe(true);
  });
});

function referencePreviewFixture(): string {
  return `
    <main>
      <button id="outside-target" type="button">Outside</button>
      <article data-article-prose>
        <p>
          This paragraph cites a source
          <a
            id="cite-ref-source"
            href="#cite-source"
            data-article-reference-marker="true"
            data-reference-entry-id="cite-source"
            data-reference-kind="citation"
            data-reference-label="cite-source"
            data-reference-order="1"
          >[1]</a>
          with enough nearby context to preview.
        </p>
        <p>
          Missing target
          <a
            id="missing-reference"
            href="#missing-source"
            data-article-reference-marker="true"
            data-reference-entry-id="missing-source"
            data-reference-kind="citation"
            data-reference-label="cite-missing"
            data-reference-order="2"
          >[2]</a>
        </p>
      </article>
      <section data-article-references>
        <ol>
          <li id="cite-source">
            <div data-article-reference-definition-content>
              <p>
                Author. <em>Source title</em>.
                <a href="https://example.com/source">Archive</a>.
                <span
                  id="nested-reference-preview-id"
                  data-article-reference-marker="true"
                >Nested marker metadata should not survive cloning.</span>
              </p>
            </div>
            <nav>
              <a
                id="cite-backref-source"
                href="#cite-ref-source"
                data-article-reference-backlink="true"
                data-reference-entry-id="cite-source"
                data-reference-kind="citation"
                data-reference-label="cite-source"
                data-reference-marker-id="cite-ref-source"
                data-reference-order="1"
              >Back 1</a>
            </nav>
          </li>
        </ol>
        <div
          aria-label="Reference preview"
          class="hidden"
          data-article-reference-preview
          hidden
          role="dialog"
        >
          <div data-article-reference-preview-content></div>
        </div>
      </section>
    </main>
  `;
}

function browserWindow(
  options: {
    readonly coarsePointer?: boolean;
    readonly immediateTimers?: boolean;
  } = {},
): Window {
  const window = new Window({ url: "https://example.com/articles/source/" });
  Reflect.set(window, "SyntaxError", SyntaxError);
  Reflect.set(window, "innerHeight", 844);
  Reflect.set(window, "innerWidth", 390);
  Reflect.set(window, "matchMedia", () => ({
    matches: options.coarsePointer === true,
  }));
  if (options.immediateTimers === true) {
    Reflect.set(window, "setTimeout", (callback: () => void) => {
      callback();

      return 1;
    });
    Reflect.set(window, "clearTimeout", () => undefined);
  }

  return window;
}

function runtimeFor(window: Window): ArticleReferencePreviewRuntime {
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

function textContent(element: HTMLElement, selector: string): string {
  return (element.querySelector(selector)?.textContent ?? "").trim();
}

function setRect(element: Element, rect: TestRect): void {
  Reflect.set(element, "getBoundingClientRect", () => domRect(rect));
}

function dispatchWindowEvent(
  element: unknown,
  window: Window,
  eventName: string,
  options: TestEventOptions = {},
): DispatchedEventState {
  if (!isDispatchableEventTarget(element)) {
    throw new Error("Expected fixture target to dispatch browser events.");
  }

  const { relatedTarget, ...eventOptions } = options;
  const event = new window.Event(eventName, { bubbles: true, ...eventOptions });
  if (relatedTarget !== undefined) {
    Object.defineProperty(event, "relatedTarget", { value: relatedTarget });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM events satisfy DOM Event at runtime for dispatch.
  element.dispatchEvent(event as unknown as Event);

  return { defaultPrevented: event.defaultPrevented };
}

interface TestEventOptions extends EventInit {
  readonly relatedTarget?: EventTarget | null;
}

function dispatchPointerEvent(
  element: unknown,
  window: Window,
  eventName: string,
  pointerType: string,
): void {
  if (!isDispatchableEventTarget(element)) {
    throw new Error("Expected fixture target to dispatch browser events.");
  }

  const event = new window.Event(eventName, { bubbles: true });
  Reflect.set(event, "pointerType", pointerType);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM events satisfy DOM Event at runtime for dispatch.
  element.dispatchEvent(event as unknown as Event);
}

interface DispatchableEventTarget {
  readonly dispatchEvent: (event: Event) => boolean;
}

interface DispatchedEventState {
  readonly defaultPrevented: boolean;
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
