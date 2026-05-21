import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
  verifyRenderedRoutePath,
  verifyRequiredRouteOutputs,
} from "../../../../scripts/build/verify-build/route-verifier";

async function withTempDist<T>(callback: (distDir: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-route-verifier-"));

  try {
    const distDir = path.join(root, "dist");
    await mkdir(distDir, { recursive: true });

    return await callback(distDir);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

describe("route verifier", () => {
  test("reports missing required route output", async () =>
    await withTempDist(async (distDir) => {
      const existingPath = path.join(distDir, "index.html");
      await writeFile(existingPath, "");

      expect(
        (
          await verifyRequiredRouteOutputs({
            distDir,
            requiredPaths: ["index.html", "articles/post/index.html"],
          })
        ).map((diagnostic) => diagnostic.message),
      ).toEqual(["articles/post/index.html"]);
    }));

  test("reports dated pages only when they are not redirect fallbacks", () => {
    expect(
      verifyRenderedRoutePath({
        isRedirectFallback: false,
        relativeHtmlPath: "2020/01/01/post/index.html",
      }).map((diagnostic) => diagnostic.message),
    ).toEqual(["2020/01/01/post/index.html"]);
    expect(
      verifyRenderedRoutePath({
        isRedirectFallback: true,
        relativeHtmlPath: "2020/01/01/post/index.html",
      }),
    ).toEqual([]);
  });
});
