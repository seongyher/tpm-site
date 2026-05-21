import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
  verifyGeneratedAssetCachePolicy,
  verifySourceMapOutput,
  verifyStaticReadingPageAssets,
} from "../../../../scripts/build/verify-build/asset-verifier";

async function withTempDist<T>(callback: (distDir: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-asset-verifier-"));

  try {
    const distDir = path.join(root, "dist");
    await mkdir(distDir, { recursive: true });

    return await callback(distDir);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

async function writeDistFile(distDir: string, relativePath: string, text = "") {
  const fullPath = path.join(distDir, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, text);

  return fullPath;
}

describe("asset verifier", () => {
  test("reports source maps by relative generated path", async () =>
    await withTempDist(async (distDir) => {
      const sourceMap = await writeDistFile(distDir, "_astro/app.js.map");

      expect(
        verifySourceMapOutput({
          distDir,
          files: [sourceMap],
        }).map((diagnostic) => diagnostic.message),
      ).toEqual(["_astro/app.js.map"]);
    }));

  test("allows known static page scripts and reports unexpected generated scripts", async () =>
    await withTempDist(async (distDir) => {
      await writeDistFile(
        distDir,
        "_astro/AnchoredRoot.astro_astro_type_script_index_0_lang.hash.js",
      );

      expect(
        await verifyStaticReadingPageAssets({
          distDir,
          html: [
            '<script type="module" src="/_astro/AnchoredRoot.astro_astro_type_script_index_0_lang.hash.js"></script>',
            '<script type="module" src="/_astro/unexpected.js"></script>',
          ].join(""),
          relativeHtmlPath: "index.html",
          staticReadingPages: ["index.html"],
        }),
      ).toMatchObject([
        {
          code: "asset.client-script-unexpected",
          message: "index.html -> /_astro/unexpected.js",
        },
      ]);
    }));

  test("requires immutable cache headers for hashed Astro assets", async () =>
    await withTempDist(async (distDir) => {
      expect(
        (await verifyGeneratedAssetCachePolicy({ distDir })).map(
          (diagnostic) => diagnostic.message,
        ),
      ).toEqual(["_headers: missing /_astro/* immutable cache header block"]);

      await writeDistFile(
        distDir,
        "_headers",
        "/_astro/*\n  Cache-Control: public, max-age=31556952, immutable\n",
      );

      expect(await verifyGeneratedAssetCachePolicy({ distDir })).toEqual([]);
    }));
});
