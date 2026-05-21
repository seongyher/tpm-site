import { describe, expect, test } from "bun:test";

import { verifySitemapXml } from "../../../../scripts/build/verify-build/sitemap-verifier";

describe("sitemap verifier", () => {
  test("reports invalid sitemap URLs and noindex routes", () => {
    expect(
      verifySitemapXml({
        relativePath: "sitemap-0.xml",
        xml: [
          "<urlset>",
          "<url><loc>not absolute</loc></url>",
          "<url><loc>https://thephilosophersmeme.com/search/</loc></url>",
          "</urlset>",
        ].join(""),
      }).map((diagnostic) => diagnostic.message),
    ).toEqual([
      "sitemap-0.xml: sitemap contains invalid URL not absolute",
      "sitemap-0.xml: sitemap includes noindex route /search/",
    ]);
  });

  test("accepts indexable absolute sitemap URLs", () => {
    expect(
      verifySitemapXml({
        relativePath: "sitemap-0.xml",
        xml: "<urlset><url><loc>https://thephilosophersmeme.com/articles/</loc></url></urlset>",
      }),
    ).toEqual([]);
  });
});
