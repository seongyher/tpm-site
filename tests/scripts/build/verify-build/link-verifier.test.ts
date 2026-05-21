import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
  isExternal,
  linkTargets,
  verifyHtmlInternalLinks,
} from "../../../../scripts/build/verify-build/link-verifier";

async function withTempDist<T>(callback: (distDir: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-link-verifier-"));

  try {
    const distDir = path.join(root, "dist");
    await mkdir(distDir, { recursive: true });

    return await callback(distDir);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

describe("link verifier", () => {
  test("extracts href/src targets and classifies external URLs", () => {
    expect(
      linkTargets('<a href="/post/">Post</a><img src="/_astro/image.webp">'),
    ).toEqual(["/post/", "/_astro/image.webp"]);
    expect(isExternal("https://example.com")).toBe(true);
    expect(isExternal("mailto:test@example.com")).toBe(true);
    expect(isExternal("/post/")).toBe(false);
  });

  test("reports missing internal targets and accepts generated index fallbacks", async () =>
    await withTempDist(async (distDir) => {
      const indexPath = path.join(distDir, "articles/post/index.html");
      await mkdir(path.dirname(indexPath), { recursive: true });
      await writeFile(indexPath, "");

      expect(
        (
          await verifyHtmlInternalLinks({
            distDir,
            html: '<a href="/articles/post/">Post</a><a href="/missing/">Missing</a>',
            relativeHtmlPath: "index.html",
          })
        ).map((diagnostic) => diagnostic.message),
      ).toEqual(["index.html -> /missing/"]);
    }));
});
