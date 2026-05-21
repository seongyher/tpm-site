import { describe, expect, test } from "bun:test";

import {
  verifyHtmlImageAlt,
  verifyHtmlMediaOutput,
  verifyHydrationBoundaries,
} from "../../../../scripts/build/verify-build/html-verifier";

describe("HTML verifier", () => {
  test("reports missing alt text while preserving decorative image semantics", () => {
    expect(
      verifyHtmlImageAlt({
        html: '<img src="/missing.webp"><img src="/decorative.webp" aria-hidden="true">',
        relativeHtmlPath: "articles/post/index.html",
      }).map((diagnostic) => diagnostic.message),
    ).toEqual(["articles/post/index.html: /missing.webp is missing alt"]);
  });

  test("reports scoped raw media and embed fallback regressions", () => {
    expect(
      verifyHtmlMediaOutput({
        html: [
          '<img data-article-image="true" src="/raw.png" alt="Raw">',
          '<div data-article-embed-frame="true"></div>',
        ].join(""),
        relativeHtmlPath: "articles/post/index.html",
      }).map((diagnostic) => diagnostic.code),
    ).toEqual(["html.media-output-invalid", "html.media-output-invalid"]);
  });

  test("reports unexpected hydration only on protected static reading pages", () => {
    expect(
      verifyHydrationBoundaries({
        html: "<astro-island></astro-island>",
        relativeHtmlPath: "index.html",
        staticReadingPages: ["index.html"],
      }).map((diagnostic) => diagnostic.message),
    ).toEqual(["index.html"]);
    expect(
      verifyHydrationBoundaries({
        html: "<astro-island></astro-island>",
        relativeHtmlPath: "search/index.html",
        staticReadingPages: ["index.html"],
      }),
    ).toEqual([]);
  });
});
