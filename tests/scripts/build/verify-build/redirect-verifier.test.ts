import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
  isAstroRedirectFallbackPage,
  verifyLegacyRedirectFallbackHtml,
  verifyMissingLegacyRedirectFallbacks,
} from "../../../../scripts/build/verify-build/redirect-verifier";

async function withTempDist<T>(callback: (distDir: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-redirect-verifier-"));

  try {
    const distDir = path.join(root, "dist");
    await mkdir(distDir, { recursive: true });

    return await callback(distDir);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

describe("redirect verifier", () => {
  test("reports missing legacy redirect fallback output", async () =>
    await withTempDist(async (distDir) => {
      expect(
        (
          await verifyMissingLegacyRedirectFallbacks({
            distDir,
            expectedRedirects: {
              "/2020/01/01/post/": "/articles/post/",
            },
          })
        ).map((diagnostic) => diagnostic.message),
      ).toEqual([
        "/2020/01/01/post/ -> /articles/post/ (2020/01/01/post/index.html)",
      ]);
    }));

  test("validates generated redirect fallback HTML against configured redirects", () => {
    const html = [
      "<title>Redirecting to: /articles/post/</title>",
      '<meta http-equiv="refresh" content="0;url=/articles/post/">',
      '<meta name="robots" content="noindex">',
      '<link rel="canonical" href="/articles/post/">',
      "<code>/2020/01/01/post/</code>",
      "<code>/articles/post/</code>",
    ].join("");

    expect(
      verifyLegacyRedirectFallbackHtml({
        expectedRedirects: {
          "/2020/01/01/post/": "/articles/post/",
        },
        html,
        relativeHtmlPath: "2020/01/01/post/index.html",
      }),
    ).toEqual([]);
  });

  test("recognizes Astro generated redirect fallback pages", () => {
    const html = [
      "<title>Redirecting to: /articles/post/</title>",
      '<meta http-equiv="refresh" content="0;url=/articles/post/">',
      '<meta name="robots" content="noindex">',
      '<link rel="canonical" href="https://example.com/articles/post/">',
      "<code>/2020/01/01/post/</code>",
    ].join("");

    expect(
      isAstroRedirectFallbackPage(html, "2020/01/01/post/index.html"),
    ).toBe(true);
  });
});
