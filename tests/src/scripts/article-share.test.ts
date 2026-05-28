import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";

import { installArticleShare } from "../../../src/scripts/article-share";

describe("article share browser script", () => {
  test("copies the article URL and reports success", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const copiedText: string[] = [];
    const document = window.document;

    document.body.innerHTML = `
      <div data-article-share-menu>
        <button
          data-article-share-copy-button
          data-article-share-copy-text="&quot;https://example.com/articles/post/&quot;"
        >Copy link</button>
        <p data-article-share-copy-status></p>
      </div>
    `;

    installArticleShare({
      document: browserDocument(document),
      navigator: browserNavigator({
        clipboard: {
          writeText: async (value: string) => {
            await Promise.resolve();
            copiedText.push(value);
          },
        },
      }),
      window: browserWindow(),
    });

    document
      .querySelector("button")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await settledPromises();

    expect(copiedText).toEqual(["https://example.com/articles/post/"]);
    expect(
      document.querySelector("[data-article-share-copy-status]")?.textContent,
    ).toBe("Copied.");
    expect(
      document.querySelector("button")?.dataset["articleShareCopyState"],
    ).toBe("copied");
  });

  test("reports a copy failure without mutating share links", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const document = window.document;

    document.body.innerHTML = `
      <div data-article-share-menu>
        <button
          data-article-share-copy-button
          data-article-share-copy-text="&quot;https://example.com/articles/post/&quot;"
        >Copy link</button>
        <a href="https://bsky.app/intent/compose?text=Post" data-article-share-action="bluesky">Bluesky</a>
        <p data-article-share-copy-status></p>
      </div>
    `;

    installArticleShare({
      document: browserDocument(document),
      navigator: browserNavigator({
        clipboard: {
          writeText: async () => {
            await Promise.resolve();
            throw new Error("Permission denied.");
          },
        },
      }),
      window: browserWindow(),
    });

    document
      .querySelector("button")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await settledPromises();

    expect(
      document.querySelector("[data-article-share-copy-status]")?.textContent,
    ).toBe("Copy failed. Copy the URL from your address bar.");
    expect(
      document.querySelector("button")?.dataset["articleShareCopyState"],
    ).toBe("error");
    expect(document.querySelector("a")?.getAttribute("href")).toBe(
      "https://bsky.app/intent/compose?text=Post",
    );
  });

  test("ignores unrelated clicks and malformed copy payloads", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const copiedText: string[] = [];
    const document = window.document;

    document.body.innerHTML = `
      <div data-article-share-menu>
        <button data-article-share-copy-button data-article-share-copy-text="">Copy link</button>
        <button data-unrelated>Other</button>
        <p data-article-share-copy-status></p>
      </div>
    `;

    installArticleShare({
      document: browserDocument(document),
      navigator: browserNavigator({
        clipboard: {
          writeText: async (value: string) => {
            await Promise.resolve();
            copiedText.push(value);
          },
        },
      }),
      window: browserWindow(),
    });

    document
      .querySelector("[data-unrelated]")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await settledPromises();

    expect(copiedText).toEqual([]);
    expect(
      document.querySelector("[data-article-share-copy-status]")?.textContent,
    ).toBe("");

    document
      .querySelector("[data-article-share-copy-button]")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await settledPromises();

    expect(copiedText).toEqual([]);
    expect(
      document.querySelector("[data-article-share-copy-status]")?.textContent,
    ).toBe("Article URL was not found.");
  });

  test("ignores non-element clicks and malformed open payloads", () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const openedUrls: string[] = [];
    const document = window.document;

    document.body.innerHTML = `
      <div data-article-share-menu>
        <button data-article-share-open-button data-article-share-open-url="">Open</button>
      </div>
    `;

    installArticleShare({
      document: browserDocument(document),
      navigator: browserNavigator({
        clipboard: {
          writeText: async () => {
            await Promise.resolve();
          },
        },
      }),
      window: browserWindow({
        open: (url) => {
          openedUrls.push(url);
          return null;
        },
      }),
    });

    document.dispatchEvent(new window.Event("click"));
    document
      .querySelector("[data-article-share-open-button]")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    expect(openedUrls).toEqual([]);
  });

  test("installs only once", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const copiedText: string[] = [];
    const document = window.document;

    document.body.innerHTML = `
      <div data-article-share-menu>
        <button
          data-article-share-copy-button
          data-article-share-copy-text="&quot;https://example.com/articles/post/&quot;"
        >Copy link</button>
        <p data-article-share-copy-status></p>
      </div>
    `;

    const runtime = {
      document: browserDocument(document),
      navigator: browserNavigator({
        clipboard: {
          writeText: async (value: string) => {
            await Promise.resolve();
            copiedText.push(value);
          },
        },
      }),
      window: browserWindow(),
    };

    installArticleShare(runtime);
    installArticleShare(runtime);

    document
      .querySelector("button")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await settledPromises();

    expect(copiedText).toEqual(["https://example.com/articles/post/"]);
    expect(document.documentElement.dataset["articleShare"]).toBe("ready");
  });

  test("opens external share targets from buttons without direct social href anchors", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const openedUrls: string[] = [];
    const document = window.document;

    document.body.innerHTML = `
      <div data-article-share-menu>
        <button
          data-article-share-action="x"
          data-article-share-open-button
          data-article-share-open-url="&quot;https://twitter.com/intent/tweet?url=https%3A%2F%2Fexample.com&quot;"
        >X</button>
        <p data-article-share-copy-status></p>
      </div>
    `;

    installArticleShare({
      document: browserDocument(document),
      navigator: browserNavigator({
        clipboard: {
          writeText: async () => {
            await Promise.resolve();
          },
        },
      }),
      window: browserWindow({
        open: (url) => {
          openedUrls.push(url);
          return null;
        },
      }),
    });

    document
      .querySelector("button")
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await settledPromises();

    expect(openedUrls).toEqual([
      "https://twitter.com/intent/tweet?url=https%3A%2F%2Fexample.com",
    ]);
    expect(document.querySelector("a[href*='twitter.com']")).toBeNull();
  });

  test("installs from ambient browser globals when runtime is omitted", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const copiedText: string[] = [];
    const document = window.document;
    const navigator = browserNavigator({
      clipboard: {
        writeText: async (value: string) => {
          await Promise.resolve();
          copiedText.push(value);
        },
      },
    });

    document.body.innerHTML = `
      <div data-article-share-menu>
        <button
          data-article-share-copy-button
          data-article-share-copy-text="&quot;https://example.com/articles/post/&quot;"
        >Copy link</button>
        <p data-article-share-copy-status></p>
      </div>
    `;

    Reflect.set(globalThis, "document", document);
    Reflect.set(globalThis, "navigator", navigator);
    Reflect.set(globalThis, "window", browserWindow());

    try {
      installArticleShare();
      document
        .querySelector("button")
        ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await settledPromises();
    } finally {
      Reflect.deleteProperty(globalThis, "document");
      Reflect.deleteProperty(globalThis, "navigator");
      Reflect.deleteProperty(globalThis, "window");
    }

    expect(copiedText).toEqual(["https://example.com/articles/post/"]);
  });
});

function browserDocument(document: unknown): Document {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Happy DOM implements the browser Document shape used by the script.
  return document as Document;
}

function browserNavigator(input: unknown): Navigator {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Tests provide the clipboard subset required by the script.
  return input as Navigator;
}

function browserWindow(
  input: Partial<{
    open: (url: string, target?: string, features?: string) => unknown;
  }> = {},
): { open: (url: string, target?: string, features?: string) => unknown } {
  return {
    open: () => null,
    ...input,
  };
}

async function settledPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
