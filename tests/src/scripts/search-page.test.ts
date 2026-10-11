import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";

import {
  isPagefindModule,
  renderResults,
  renderSearchError,
  runSearch,
  searchQuery,
} from "../../../src/scripts/search-page";

describe("search page browser script", () => {
  test("validates Pagefind module shape and parses search queries", () => {
    expect(
      isPagefindModule({
        options: () => undefined,
        search: async () => Promise.resolve({ results: [] }),
      }),
    ).toBe(true);
    expect(isPagefindModule({ search: () => undefined })).toBe(false);
    expect(searchQuery("?q=gamergate")).toBe("gamergate");
    expect(searchQuery("")).toBe("");
  });

  test("renders an unavailable-search fallback", () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const element = window.document.createElement("div");

    renderSearchError(element);

    expect(element.textContent).toBe("Search is unavailable right now.");
  });

  test("renders Pagefind results into DOM links", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const results = window.document.createElement("div");
    Reflect.set(globalThis, "document", window.document);

    try {
      await renderResults(
        {
          options: () => undefined,
          search: async () =>
            Promise.resolve({
              results: [
                {
                  data: async () =>
                    Promise.resolve({
                      excerpt: "A result excerpt.",
                      meta: { title: "Result Title" },
                      url: "/articles/result/",
                    }),
                },
              ],
            }),
        },
        browserElement(results),
        "query",
      );

      expect(results.querySelector("a")?.getAttribute("href")).toBe(
        "/articles/result/",
      );
      expect(results.querySelector("a")?.dataset["astroPrefetch"]).toBe(
        "hover",
      );
      expect(results.querySelector("a")?.className).toContain("border-b");
      expect(results.querySelector("a")?.className).toContain("min-h-28");
      expect(results.querySelector("a")?.className).not.toContain("bg-card");
      expect(results.querySelector("a")?.className).not.toContain("rounded-sm");
      expect(results.querySelector("strong")?.className).toContain(
        "line-clamp-2",
      );
      expect(results.querySelector("strong")?.className).toContain("text-xl");
      expect(results.querySelector("span")?.className).toContain(
        "line-clamp-3",
      );
      expect(results.querySelector("span")?.className).toContain("text-sm");
      expect(results.querySelector("span")?.className).toContain(
        "md:text-base",
      );
      expect(results.textContent).toContain("Result Title");
    } finally {
      Reflect.deleteProperty(globalThis, "document");
    }
  });

  test("uses article-list title fitting for dynamic search results", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const results = window.document.createElement("div");
    Reflect.set(globalThis, "document", window.document);

    try {
      await renderResults(
        {
          options: () => undefined,
          search: async () =>
            Promise.resolve({
              results: [
                {
                  data: async () =>
                    Promise.resolve({
                      excerpt: "A result excerpt.",
                      meta: {
                        title:
                          "A Very Long Article Title Containing metamemeticcountercounterinterpretationwithoutnaturalbreakpoints",
                      },
                      url: "/articles/long-result/",
                    }),
                },
              ],
            }),
        },
        browserElement(results),
        "query",
      );

      expect(results.querySelector("strong")?.className).toContain("text-sm");
      expect(results.querySelector("strong")?.className).toContain(
        "md:text-base",
      );
      expect(results.querySelector("strong")?.className).toContain(
        "line-clamp-2",
      );
    } finally {
      Reflect.deleteProperty(globalThis, "document");
    }
  });

  test("uses article-list description fitting for dynamic search excerpts", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const results = window.document.createElement("div");
    Reflect.set(globalThis, "document", window.document);

    try {
      await renderResults(
        {
          options: () => undefined,
          search: async () =>
            Promise.resolve({
              results: [
                {
                  data: async () =>
                    Promise.resolve({
                      excerpt:
                        "A very long search excerpt with <mark>highlighted</mark> text and a hostile metamemeticcountercounterinterpretationwithoutnaturalbreakpoints sequence that should use the tight description size.",
                      meta: { title: "Result Title" },
                      url: "/articles/long-excerpt/",
                    }),
                },
              ],
            }),
        },
        browserElement(results),
        "query",
      );

      expect(results.querySelector("span")?.className).toContain("text-sm");
      expect(results.querySelector("span")?.className).toContain("leading-5");
      expect(results.querySelector("span")?.className).not.toContain("text-xs");
      expect(results.querySelector("span")?.className).toContain(
        "line-clamp-3",
      );
      expect(results.querySelector("mark")?.textContent).toBe("highlighted");
    } finally {
      Reflect.deleteProperty(globalThis, "document");
    }
  });

  test("prefetches dynamic search results on high-intent hover or focus", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const results = window.document.createElement("div");
    const prefetchedUrls: string[] = [];
    Reflect.set(globalThis, "document", window.document);

    try {
      await renderResults(
        {
          options: () => undefined,
          search: async () =>
            Promise.resolve({
              results: [
                {
                  data: async () =>
                    Promise.resolve({
                      excerpt: "A result excerpt.",
                      meta: { title: "Result Title" },
                      url: "/articles/result/",
                    }),
                },
              ],
            }),
        },
        browserElement(results),
        "query",
        (url) => {
          prefetchedUrls.push(url);
        },
      );

      const link = results.querySelector("a");
      if (link === null) {
        throw new Error("Expected a rendered search result link.");
      }

      expect(prefetchedUrls).toEqual([]);

      link.dispatchEvent(new window.Event("mouseenter"));
      link.dispatchEvent(new window.Event("focus"));
      await Promise.resolve();

      expect(prefetchedUrls).toEqual(["/articles/result/"]);
    } finally {
      Reflect.deleteProperty(globalThis, "document");
    }
  });

  test("renders Pagefind mark highlights as sanitized markup", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const results = window.document.createElement("div");
    Reflect.set(globalThis, "document", window.document);

    try {
      await renderResults(
        {
          options: () => undefined,
          search: async () =>
            Promise.resolve({
              results: [
                {
                  data: async () =>
                    Promise.resolve({
                      excerpt: "A <mark>highlighted</mark> search result.",
                      meta: { title: "Highlighted Result" },
                      url: "/articles/highlighted/",
                    }),
                },
              ],
            }),
        },
        browserElement(results),
        "highlighted",
      );

      const mark = results.querySelector("mark");

      expect(mark?.textContent).toBe("highlighted");
      expect(results.textContent).toContain("A highlighted search result.");
      expect(results.innerHTML).not.toContain("&lt;mark&gt;");
    } finally {
      Reflect.deleteProperty(globalThis, "document");
    }
  });

  test("drops unsupported Pagefind excerpt markup", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const results = window.document.createElement("div");
    Reflect.set(globalThis, "document", window.document);

    try {
      await renderResults(
        {
          options: () => undefined,
          search: async () =>
            Promise.resolve({
              results: [
                {
                  data: async () =>
                    Promise.resolve({
                      excerpt:
                        'Safe <strong>text</strong><script>alert(1)</script> <mark onclick="alert(1)">match</mark>.',
                      meta: { title: "Sanitized Result" },
                      url: "/articles/sanitized/",
                    }),
                },
              ],
            }),
        },
        browserElement(results),
        "match",
      );

      const excerpt = results.querySelector("span");

      expect(excerpt?.querySelector("strong")).toBeNull();
      expect(excerpt?.querySelector("script")).toBeNull();
      expect(
        excerpt?.querySelector("mark")?.getAttribute("onclick"),
      ).toBeNull();
      expect(excerpt?.textContent).toContain("Safe text match.");
    } finally {
      Reflect.deleteProperty(globalThis, "document");
    }
  });

  test("handles malformed Pagefind excerpt tags as safe text", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const results = window.document.createElement("div");
    Reflect.set(globalThis, "document", window.document);

    try {
      await renderResults(
        {
          options: () => undefined,
          search: async () =>
            Promise.resolve({
              results: [
                {
                  data: async () =>
                    Promise.resolve({
                      excerpt:
                        "<!---->Visible <script><mark>hidden</mark></script> text <",
                      meta: { title: "Malformed Result" },
                      url: "/articles/malformed/",
                    }),
                },
              ],
            }),
        },
        browserElement(results),
        "malformed",
      );

      const excerpt = results.querySelector("span");

      expect(excerpt?.querySelector("script")).toBeNull();
      expect(excerpt?.querySelector("mark")).toBeNull();
      expect(excerpt?.textContent).toBe("Visible  text <");
    } finally {
      Reflect.deleteProperty(globalThis, "document");
    }
  });

  test("clears results without searching when the query is blank", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const results = window.document.createElement("div");
    const existing = window.document.createElement("a");
    existing.href = "/existing/";
    results.append(existing);
    let searchCalls = 0;

    await renderResults(
      {
        options: () => undefined,
        search: async () => {
          searchCalls += 1;
          await Promise.resolve();
          return { results: [] };
        },
      },
      browserElement(results),
      "   ",
    );

    expect(searchCalls).toBe(0);
    expect(results.children).toHaveLength(0);
  });

  test("uses the result URL as fallback title metadata", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const results = window.document.createElement("div");
    Reflect.set(globalThis, "document", window.document);

    try {
      await renderResults(
        {
          options: () => undefined,
          search: async () =>
            Promise.resolve({
              results: [
                {
                  data: async () =>
                    Promise.resolve({
                      excerpt: "A result excerpt.",
                      meta: {},
                      url: "/articles/untitled/",
                    }),
                },
              ],
            }),
        },
        browserElement(results),
        "query",
      );

      expect(results.querySelector("strong")?.textContent).toBe(
        "/articles/untitled/",
      );
    } finally {
      Reflect.deleteProperty(globalThis, "document");
    }
  });

  test("does not load Pagefind when the search container is absent", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    Reflect.set(globalThis, "HTMLElement", window.HTMLElement);
    let loaderCalls = 0;

    try {
      await runSearch(browserDocument(window), "?q=memes", async () => {
        loaderCalls += 1;
        await Promise.resolve();
        return {
          options: () => undefined,
          search: async () => Promise.resolve({ results: [] }),
        };
      });

      expect(loaderCalls).toBe(0);
    } finally {
      Reflect.deleteProperty(globalThis, "HTMLElement");
    }
  });

  test("renders an error fallback when interactive searching fails", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const container = window.document.createElement("div");
    container.id = "search";
    window.document.body.append(container);
    Reflect.set(globalThis, "document", window.document);
    Reflect.set(globalThis, "HTMLElement", window.HTMLElement);
    Reflect.set(globalThis, "HTMLInputElement", window.HTMLInputElement);
    Reflect.set(globalThis, "Element", window.Element);

    try {
      await runSearch(browserDocument(window), "", async () =>
        Promise.resolve({
          options: () => undefined,
          search: async () => {
            await Promise.resolve();
            throw new Error("Search failed.");
          },
        }),
      );

      const input = container.querySelector("input");
      if (input === null) {
        throw new Error("Expected search input to render.");
      }
      input.value = "memes";
      input.dispatchEvent(new window.Event("input"));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(
        container.querySelector("[data-search-results]")?.textContent,
      ).toBe("Search is unavailable right now.");
    } finally {
      Reflect.deleteProperty(globalThis, "document");
      Reflect.deleteProperty(globalThis, "Element");
      Reflect.deleteProperty(globalThis, "HTMLInputElement");
      Reflect.deleteProperty(globalThis, "HTMLElement");
    }
  });

  test("initializes the search page from URL query state", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const container = window.document.createElement("div");
    container.id = "search";
    window.document.body.append(container);
    Reflect.set(globalThis, "document", window.document);
    Reflect.set(globalThis, "HTMLElement", window.HTMLElement);
    Reflect.set(globalThis, "HTMLInputElement", window.HTMLInputElement);
    Reflect.set(globalThis, "Element", window.Element);

    try {
      await runSearch(browserDocument(window), "?q=memes", async () =>
        Promise.resolve({
          options: () => undefined,
          search: async () => Promise.resolve({ results: [] }),
        }),
      );

      expect(container.querySelector("input")?.getAttribute("value")).toBe(
        null,
      );
      expect(container.querySelector("input")?.value).toBe("memes");
      expect(container.querySelector("[data-search-results]")).not.toBeNull();
    } finally {
      Reflect.deleteProperty(globalThis, "document");
      Reflect.deleteProperty(globalThis, "Element");
      Reflect.deleteProperty(globalThis, "HTMLInputElement");
      Reflect.deleteProperty(globalThis, "HTMLElement");
    }
  });

  test("enhances an existing search form and results region", async () => {
    const window = new Window();
    Reflect.set(window, "SyntaxError", SyntaxError);
    const container = window.document.createElement("section");
    container.id = "search";
    const input = window.document.createElement("input");
    input.type = "search";
    const results = window.document.createElement("div");
    results.dataset["searchResults"] = "";
    container.append(input, results);
    window.document.body.append(container);
    Reflect.set(globalThis, "document", window.document);
    Reflect.set(globalThis, "HTMLElement", window.HTMLElement);
    Reflect.set(globalThis, "HTMLInputElement", window.HTMLInputElement);

    try {
      await runSearch(browserDocument(window), "?q=history", async () =>
        Promise.resolve({
          options: () => undefined,
          search: async () => Promise.resolve({ results: [] }),
        }),
      );

      expect(container.querySelectorAll("input")).toHaveLength(1);
      expect(input.value).toBe("history");
      expect(container.querySelector("[data-search-results]")).toBe(results);
    } finally {
      Reflect.deleteProperty(globalThis, "document");
      Reflect.deleteProperty(globalThis, "HTMLInputElement");
      Reflect.deleteProperty(globalThis, "HTMLElement");
    }
  });
});

function browserDocument(window: Window): Document {
  // Happy DOM implements browser Document at runtime but exposes package-local DOM types.
  return window.document as unknown as Document;
}

function browserElement(element: unknown): HTMLElement {
  // Happy DOM implements browser HTMLElement at runtime but exposes package-local DOM types.
  return element as HTMLElement;
}
