import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";

import { installArticleTableOfContents } from "../../../src/scripts/article-table-of-contents";

describe("article table of contents browser script", () => {
  test("marks the current heading link from the hash target", () => {
    const window = new Window({
      url: "https://example.com/articles/post/#second-section",
    });
    Reflect.set(window, "SyntaxError", SyntaxError);
    Reflect.set(window, "innerHeight", 900);
    const document = window.document;

    document.documentElement.style.setProperty("--site-header-height", "72px");
    document.body.innerHTML = `
      <nav data-article-toc>
        <a href="#first-section">First</a>
        <a href="#second-section">Second</a>
      </nav>
      <h2 id="first-section">First</h2>
      <h2 id="second-section">Second</h2>
    `;

    const firstHeading = document.getElementById("first-section");
    const secondHeading = document.getElementById("second-section");

    if (firstHeading === null || secondHeading === null) {
      throw new Error("Expected table-of-contents heading fixtures.");
    }

    Reflect.set(firstHeading, "getBoundingClientRect", () =>
      domRect({ top: 96 }),
    );
    Reflect.set(secondHeading, "getBoundingClientRect", () =>
      domRect({ top: 280 }),
    );
    installImmediateAnimationFrame(window);

    installArticleTableOfContents(browserDocument(document));

    const current = browserAnchor(
      document.querySelector('a[href="#second-section"]'),
    );
    const previous = browserAnchor(
      document.querySelector('a[href="#first-section"]'),
    );

    if (current === null || previous === null) {
      throw new Error("Expected table-of-contents link fixtures.");
    }

    expect(current.outerHTML).toContain('data-current="true"');
    expect(current.outerHTML).toContain('aria-current="location"');
    expect(previous.outerHTML).not.toContain("data-current");
  });

  test("falls back to the nearest scrolled heading when the hash target is out of range", () => {
    const window = new Window({
      url: "https://example.com/articles/post/#second-section",
    });
    Reflect.set(window, "SyntaxError", SyntaxError);
    Reflect.set(window, "innerHeight", 900);
    const document = window.document;

    document.documentElement.style.setProperty("--site-header-height", "72px");
    document.body.innerHTML = `
      <nav data-article-toc>
        <a href="/articles/post/">Article</a>
        <a href="#missing-section">Missing</a>
        <a href="#first-section">First</a>
        <a href="#second-section">Second</a>
      </nav>
      <h2 id="first-section">First</h2>
      <h2 id="second-section">Second</h2>
    `;

    const firstHeading = document.getElementById("first-section");
    const secondHeading = document.getElementById("second-section");

    if (firstHeading === null || secondHeading === null) {
      throw new Error("Expected table-of-contents heading fixtures.");
    }

    Reflect.set(firstHeading, "getBoundingClientRect", () =>
      domRect({ top: 96 }),
    );
    Reflect.set(secondHeading, "getBoundingClientRect", () =>
      domRect({ top: 640 }),
    );
    installImmediateAnimationFrame(window);

    installArticleTableOfContents(browserDocument(document));

    const current = browserAnchor(
      document.querySelector('a[href="#first-section"]'),
    );
    const outOfRange = browserAnchor(
      document.querySelector('a[href="#second-section"]'),
    );

    if (current === null || outOfRange === null) {
      throw new Error("Expected table-of-contents link fixtures.");
    }

    expect(current.getAttribute("aria-current")).toBe("location");
    expect(outOfRange.hasAttribute("aria-current")).toBe(false);
  });

  test("updates the current heading when scrolling changes the active section", () => {
    const window = new Window({
      url: "https://example.com/articles/post/",
    });
    Reflect.set(window, "SyntaxError", SyntaxError);
    Reflect.set(window, "innerHeight", 900);
    const document = window.document;

    let firstTop = 96;
    let secondTop = 640;

    document.documentElement.style.setProperty("--site-header-height", "72px");
    document.body.innerHTML = `
      <nav data-article-toc>
        <a href="#first-section">First</a>
        <a href="#second-section">Second</a>
      </nav>
      <h2 id="first-section">First</h2>
      <h2 id="second-section">Second</h2>
    `;

    const firstHeading = document.getElementById("first-section");
    const secondHeading = document.getElementById("second-section");

    if (firstHeading === null || secondHeading === null) {
      throw new Error("Expected table-of-contents heading fixtures.");
    }

    Reflect.set(firstHeading, "getBoundingClientRect", () =>
      domRect({ top: firstTop }),
    );
    Reflect.set(secondHeading, "getBoundingClientRect", () =>
      domRect({ top: secondTop }),
    );
    const frameCallbacks: FrameRequestCallback[] = [];
    Reflect.set(
      window,
      "requestAnimationFrame",
      (callback: FrameRequestCallback) => {
        frameCallbacks.push(callback);

        return frameCallbacks.length;
      },
    );

    installArticleTableOfContents(browserDocument(document));

    firstTop = -240;
    secondTop = 128;
    window.dispatchEvent(new window.Event("scroll"));
    frameCallbacks.forEach((callback) => {
      callback(0);
    });

    const previous = browserAnchor(
      document.querySelector('a[href="#first-section"]'),
    );
    const current = browserAnchor(
      document.querySelector('a[href="#second-section"]'),
    );

    if (current === null || previous === null) {
      throw new Error("Expected table-of-contents link fixtures.");
    }

    expect(previous.hasAttribute("aria-current")).toBe(false);
    expect(current.getAttribute("data-current")).toBe("true");
  });

  test("does nothing when the table-of-contents document has no default view", () => {
    const window = new Window();
    const toc = window.document.createElement("nav");
    toc.setAttribute("data-article-toc", "");
    const document = {
      defaultView: null,
      querySelectorAll: () => [toc],
    };

    installArticleTableOfContents(browserDocument(document));

    expect(toc.children.length).toBe(0);
  });
});

function domRect({ top }: { top: number }): DOMRect {
  return {
    bottom: top + 20,
    height: 20,
    left: 0,
    right: 400,
    toJSON: () => ({}),
    top,
    width: 400,
    x: 0,
    y: top,
  };
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

function browserAnchor(element: unknown): HTMLAnchorElement | null {
  if (element === null) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements browser anchor elements at runtime but exposes package-local DOM types.
  return element as HTMLAnchorElement;
}

function browserDocument(document: unknown): Document {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements browser documents at runtime but exposes package-local DOM types.
  return document as Document;
}
