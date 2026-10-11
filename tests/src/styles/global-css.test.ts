import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";

describe("global article print styles", () => {
  test("declares the browser print contract selectors", async () => {
    const css = await readFile("src/styles/print.css", "utf8");

    expect(css).toContain("@media print");
    expect(css).toContain("@page");
    expect(css).toContain("[data-site-header]");
    expect(css).toContain("[data-print-exclude]");
    expect(css).not.toContain("[data-article-pdf-disclaimer]");
    expect(css).toContain('[data-article-toc-placement="inline"]');
    expect(css).toContain("[data-article-image-inspect-affordance]");
    expect(css).toContain("[data-article-embed-fallback]");
    expect(css).toContain("[data-article-image-fallback]");
    expect(css).toContain("[data-article-references]");
  });
});

describe("site theme contract", () => {
  test("keeps site theme tokens outside the platform global stylesheet", async () => {
    const [globalCss, siteThemeCss, printCss] = await Promise.all([
      readFile("src/styles/global.css", "utf8"),
      readFile("site/theme.css", "utf8"),
      readFile("src/styles/print.css", "utf8"),
    ]);

    expect(globalCss).toContain("@theme inline");
    expect(siteThemeCss).toContain("--background");
    expect(siteThemeCss).toContain("Outfit");
    expect(printCss).toContain("@media print");
  });
});
