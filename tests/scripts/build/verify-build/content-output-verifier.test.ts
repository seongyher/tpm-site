import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
  verifyArticlePageCount,
  verifyCatalogOutput,
  verifyDraftLeaks,
} from "../../../../scripts/build/verify-build/content-output-verifier";

async function withTempDist<T>(callback: (distDir: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-content-verifier-"));

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

describe("content output verifier", () => {
  test("reports draft slugs only in generated metadata outputs", async () =>
    await withTempDist(async (distDir) => {
      const feed = await writeDistFile(distDir, "feed.xml", "draft-post");
      const page = await writeDistFile(
        distDir,
        "articles/post/index.html",
        "draft-post",
      );

      expect(
        (
          await verifyDraftLeaks({
            distDir,
            draftSlugs: ["draft-post"],
            file: feed,
          })
        ).map((diagnostic) => diagnostic.message),
      ).toEqual(["feed.xml -> draft-post"]);
      expect(
        await verifyDraftLeaks({
          distDir,
          draftSlugs: ["draft-post"],
          file: page,
        }),
      ).toEqual([]);
    }));

  test("reports article count mismatches", () => {
    expect(
      verifyArticlePageCount({
        actualArticlePageCount: 1,
        expectedArticlePageCount: 2,
      }).map((diagnostic) => diagnostic.message),
    ).toEqual([
      "expected 2 article pages from published source content, found 1",
    ]);
  });

  test("reports private component catalog output", async () =>
    await withTempDist(async (distDir) => {
      await writeDistFile(distDir, "catalog/index.html");

      expect(
        (await verifyCatalogOutput(distDir)).map(
          (diagnostic) => diagnostic.message,
        ),
      ).toEqual(["catalog/"]);
    }));
});
