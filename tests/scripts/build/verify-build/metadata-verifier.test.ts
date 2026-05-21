import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
  verifyArticleJsonLdPresence,
  verifyArticleSocialImageHtml,
  verifyHtmlMetadata,
} from "../../../../scripts/build/verify-build/metadata-verifier";

async function withTempDist<T>(callback: (distDir: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-metadata-verifier-"));

  try {
    const distDir = path.join(root, "dist");
    await mkdir(distDir, { recursive: true });

    return await callback(distDir);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

describe("metadata verifier", () => {
  test("reports missing document metadata and missing article JSON-LD", () => {
    const html = "<html><head></head><body></body></html>";

    expect(
      verifyHtmlMetadata({
        html,
        relativeHtmlPath: "articles/post/index.html",
      }).map((diagnostic) => diagnostic.message),
    ).toContain("articles/post/index.html: missing document title");
    expect(
      verifyArticleJsonLdPresence({
        html,
        relativeHtmlPath: "articles/post/index.html",
      }).map((diagnostic) => diagnostic.message),
    ).toEqual(["articles/post/index.html"]);
  });

  test("reports social preview metadata mismatches against generated policy", async () =>
    await withTempDist(async (distDir) => {
      await mkdir(path.join(distDir, "_astro"), { recursive: true });
      await writeFile(path.join(distDir, "_astro/social.jpg"), "small");

      expect(
        (
          await verifyArticleSocialImageHtml({
            distDir,
            html: [
              '<meta property="og:image" content="https://thephilosophersmeme.com/_astro/social.jpg">',
              '<meta property="og:image:width" content="600">',
              '<meta property="og:image:height" content="315">',
              '<meta property="og:image:type" content="image/png">',
              '<meta name="twitter:image" content="https://thephilosophersmeme.com/_astro/other.jpg">',
              '<script type="application/ld+json">{"@type":"BlogPosting","image":"https://thephilosophersmeme.com/_astro/social.jpg"}</script>',
            ].join(""),
            relativeHtmlPath: "articles/post/index.html",
          })
        ).map((diagnostic) => diagnostic.message),
      ).toEqual([
        "articles/post/index.html: twitter:image does not match og:image",
        "articles/post/index.html: og:image:width is not 1200",
        "articles/post/index.html: og:image:height is not 630",
        "articles/post/index.html: og:image:type is not image/jpeg",
      ]);
    }));
});
