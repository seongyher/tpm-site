import { describe, expect, test } from "bun:test";

import {
  articleJsonLdImageValues,
  decodeHtmlAttributeValue,
  htmlAttributeValue,
  htmlScriptTextsByType,
  htmlTags,
  htmlTitleText,
  metaContentValues,
  metaPropertyContentValues,
  scriptSources,
} from "../../../../scripts/build/verify-build/html-inspection";

describe("HTML inspection helpers", () => {
  test("extracts metadata, tags, scripts, and decoded attributes from rendered HTML", () => {
    const html = [
      "<html><head>",
      "<title>Article &amp; Notes</title>",
      '<meta name="description" content="A &amp; B">',
      '<meta property="og:title" content="Title">',
      '<link rel="canonical" href="https://example.com/articles/post/">',
      '<script type="application/ld+json">{"@type":"BlogPosting","image":"https://example.com/image.jpg"}</script>',
      '<script type="module" src="/_astro/app.js"></script>',
      "</head><body>",
      '<img src="/_astro/image.webp" alt="Image">',
      "</body></html>",
    ].join("");

    expect(htmlTitleText(html)).toBe("Article & Notes");
    expect(metaContentValues(html, "description")).toEqual(["A & B"]);
    expect(metaPropertyContentValues(html, "og:title")).toEqual(["Title"]);
    expect(htmlAttributeValue('<a href="/post/">Post</a>', "href")).toBe(
      "/post/",
    );
    expect(decodeHtmlAttributeValue("A &amp; B")).toBe("A & B");
    expect(htmlTags(html, "img")).toHaveLength(1);
    expect(htmlTags(html, "link")).toHaveLength(1);
    expect(htmlScriptTextsByType(html, "application/ld+json")).toHaveLength(1);
    expect(articleJsonLdImageValues(html)).toEqual([
      "https://example.com/image.jpg",
    ]);
    expect(scriptSources(html)).toEqual(["/_astro/app.js"]);
  });
});
