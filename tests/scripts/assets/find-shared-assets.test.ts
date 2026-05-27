import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, spyOn, test } from "bun:test";

import {
  findAssetReferences,
  findSharedAssets,
  formatSharedAssetReport,
  normalizeReference,
  resolveAssetReference,
  runSharedAssetsCli,
  sharedAssetViolations,
} from "../../../scripts/assets/find-shared-assets";

async function withTempRoot<T>(callback: (root: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-shared-assets-test-"));

  try {
    return await callback(root);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

async function writeText(root: string, relativePath: string, text: string) {
  const fullPath = path.join(root, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, text);
}

describe("shared asset finder", () => {
  test("normalizes and resolves source asset references", () => {
    expect(normalizeReference("./image.png?raw")).toBe("./image.png");
    expect(
      resolveAssetReference(
        "/repo/src/content/articles/post.md",
        "../../assets/articles/post/image.png",
        "/repo",
        "/repo/src/assets",
      ),
    ).toBe("/repo/src/assets/articles/post/image.png");
  });

  test("rejects non-local and non-asset references", () => {
    const templateReference = ["$", "{dynamicImage}.png"].join("");

    expect(normalizeReference("")).toBeUndefined();
    expect(normalizeReference("https://example.com/image.png")).toBeUndefined();
    expect(normalizeReference("//cdn.example.com/image.png")).toBeUndefined();
    expect(normalizeReference(templateReference)).toBeUndefined();
    expect(normalizeReference("./document.txt")).toBeUndefined();
    expect(normalizeReference("<./image%EA.png?raw>")).toBe("./image%EA.png");
  });

  test("resolves absolute, project-relative, relative, and out-of-scope assets", () => {
    expect(
      resolveAssetReference(
        "/repo/src/pages/index.astro",
        "https://example.com/image.png",
        "/repo",
        "/repo/src/assets",
      ),
    ).toBeUndefined();
    expect(
      resolveAssetReference(
        "/repo/src/pages/index.astro",
        "/src/assets/site/logo.png",
        "/repo",
        "/repo/src/assets",
      ),
    ).toBe("/repo/src/assets/site/logo.png");
    expect(
      resolveAssetReference(
        "/repo/src/pages/index.astro",
        "src/assets/site/logo.png",
        "/repo",
        "/repo/src/assets",
      ),
    ).toBe("/repo/src/assets/site/logo.png");
    expect(
      resolveAssetReference(
        "/repo/src/content/articles/post.md",
        "../../assets/articles/post/image.png",
        "/repo",
        "/repo/src/assets",
      ),
    ).toBe("/repo/src/assets/articles/post/image.png");
    expect(
      resolveAssetReference(
        "/repo/src/pages/index.astro",
        "../assets/../secret/image.png",
        "/repo",
        "/repo/src/assets",
      ),
    ).toBeUndefined();
    expect(
      resolveAssetReference(
        "/repo/src/pages/index.astro",
        "../outside/image.png",
        "/repo",
        "/repo/src/assets",
      ),
    ).toBeUndefined();
  });

  test("reports assets shared outside the shared asset folder", () => {
    const violations = sharedAssetViolations(
      new Map([
        [
          "/repo/site/assets/articles/post/image.png",
          [
            {
              assetPath: "/repo/site/assets/articles/post/image.png",
              file: "/repo/site/content/a.md",
              line: 1,
              value: "image.png",
            },
            {
              assetPath: "/repo/site/assets/articles/post/image.png",
              file: "/repo/site/content/b.md",
              line: 2,
              value: "image.png",
            },
          ],
        ],
      ]),
      "/repo/site/assets/shared",
    );

    expect(violations).toHaveLength(1);
    expect(
      formatSharedAssetReport(
        {
          referenceCount: 2,
          referencedAssetCount: 1,
          violations,
        },
        "/repo",
      ),
    ).toContain("outside site/assets/shared/");
  });

  test("formats success output for shared asset checks", () => {
    expect(
      formatSharedAssetReport(
        {
          referenceCount: 2,
          referencedAssetCount: 2,
          violations: [],
        },
        "/repo",
      ),
    ).toContain("No shared site assets found outside site/assets/shared");
  });

  test("finds markdown, quoted, and angle-bracket asset references", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "site/assets/articles/post/image.png", "image");
      await writeText(
        root,
        "site/content/articles/post.md",
        [
          "![Markdown](../../assets/articles/post/image.png)",
          'const quoted = "site/assets/articles/post/image.png";',
          "<site/assets/articles/post/image.png>",
          "[Markdown angle](<site/assets/articles/post/image.png>)",
          "![Broken](../../assets/articles/post/image.png",
          "![Broken angle](<site/assets/articles/post/image.png",
        ].join("\n"),
      );

      const references = await findAssetReferences({ rootDir: root });

      expect(references).toHaveLength(5);
      expect(references.map((reference) => reference.line)).toEqual([
        1, 4, 2, 3, 4,
      ]);
    }));

  test("deduplicates repeated asset references from the same source line", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "site/assets/articles/post/image.png", "image");
      await writeText(
        root,
        "site/content/articles/post.md",
        '"site/assets/articles/post/image.png"; "site/assets/articles/post/image.png";',
      );

      const references = await findAssetReferences({ rootDir: root });

      expect(references).toHaveLength(1);
    }));

  test("honors explicit scan directories in shared asset checks", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/assets/articles/post/shared.png", "image");
      await writeText(
        root,
        "custom-src/one.ts",
        '"src/assets/articles/post/shared.png";',
      );
      await writeText(
        root,
        "custom-src/two.ts",
        '"src/assets/articles/post/shared.png";',
      );

      const result = await findSharedAssets({
        assetsDir: path.join(root, "src/assets"),
        rootDir: root,
        sharedAssetsDir: path.join(root, "src/assets/shared"),
        srcDir: path.join(root, "custom-src"),
      });

      expect(result.violations).toHaveLength(1);
    }));

  test.serial(
    "prints command usage without scanning shared assets",
    async () => {
      const log = spyOn(console, "log").mockImplementation(() => undefined);

      try {
        const exitCode = await runSharedAssetsCli(["--help"], process.cwd());

        expect(exitCode).toBe(0);
        expect(String(log.mock.calls[0]?.[0])).toContain(
          "Usage: just assets-shared",
        );
      } finally {
        log.mockRestore();
      }
    },
  );
});
