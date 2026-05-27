import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, spyOn, test } from "bun:test";

import {
  findDuplicateImages,
  formatDuplicateImageReport,
  runDuplicateImageCli,
} from "../../scripts/assets/find-duplicate-images";
import {
  findSharedAssets,
  runSharedAssetsCli,
} from "../../scripts/assets/find-shared-assets";
import {
  findUnusedImages,
  formatUnusedImageReport,
  runUnusedImageCli,
} from "../../scripts/assets/find-unused-images";
import {
  formatImageAssetLocationReport,
  runImageAssetLocationCli,
  verifyImageAssetLocations,
} from "../../scripts/assets/verify-image-asset-locations";
import {
  runContentVerificationCli,
  verifyContent,
} from "../../scripts/content/verify-content";

async function runGit(root: string, args: string[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("git", args, {
      cwd: root,
      stdio: ["ignore", "ignore", "pipe"],
    });
    const chunks: Buffer[] = [];

    child.stderr.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(Buffer.concat(chunks).toString("utf8")));
    });
  });
}

async function withTempRoot<T>(callback: (root: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-script-test-"));

  try {
    return await callback(root);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

async function writeBytes(root: string, relativePath: string, bytes: Buffer) {
  const fullPath = path.join(root, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes);
}

async function writeText(root: string, relativePath: string, text: string) {
  const fullPath = path.join(root, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, text);
}

describe("content verification script", () => {
  test.serial(
    "prints a success report from the command-line workflow",
    async () =>
      withTempRoot(async (root) => {
        const log = spyOn(console, "log").mockImplementation(() => undefined);

        try {
          await writeText(root, "site/content/categories/history.json", "{}");
          await writeText(
            root,
            "site/content/authors/author.md",
            "---\ndisplayName: Author\naliases:\n  - Author\n---\n",
          );
          await writeText(
            root,
            "site/content/articles/history/published.md",
            "---\ntitle: Published\nauthor: Author\n---\n",
          );

          const exitCode = await runContentVerificationCli([], root);

          expect(exitCode).toBe(0);
          expect(String(log.mock.calls[0]?.[0])).toContain(
            "Content verification passed",
          );
        } finally {
          log.mockRestore();
        }
      }),
  );

  test.serial("prints failures from the command-line workflow", async () =>
    withTempRoot(async (root) => {
      const error = spyOn(console, "error").mockImplementation(() => undefined);

      try {
        await writeText(root, "site/content/categories/Bad Name.json", "{}");
        await writeText(
          root,
          "site/content/authors/author.md",
          "---\ndisplayName: Author\naliases:\n  - Author\n---\n",
        );
        await writeText(
          root,
          "site/content/articles/Bad Category/Bad Slug.md",
          "---\ntitle: Bad\nauthor: Author\n---\n",
        );

        const exitCode = await runContentVerificationCli([], root);

        expect(exitCode).toBe(1);
        expect(String(error.mock.calls[0]?.[0])).toContain(
          "Content verification failed",
        );
      } finally {
        error.mockRestore();
      }
    }),
  );

  test("reports unsafe category names and duplicate article slugs", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "site/content/categories/Bad Name.json", "{}");
      await writeText(
        root,
        "site/content/authors/author.md",
        "---\ndisplayName: Author\naliases:\n  - Author\n---\n",
      );
      await writeText(
        root,
        "site/content/articles/history/same.md",
        "---\ntitle: One\nauthor: Author\n---\n",
      );
      await writeText(
        root,
        "site/content/articles/politics/same.md",
        "---\ntitle: Two\nauthor: Author\n---\n",
      );

      const result = await verifyContent({
        articleDir: path.join(root, "site/content/articles"),
        authorDir: path.join(root, "site/content/authors"),
        categoryDir: path.join(root, "site/content/categories"),
        rootDir: root,
      });

      expect(result.issues).toContain(
        "site/content/categories/Bad Name.json: category metadata filename is not URL-safe",
      );
      expect(
        result.issues.some((issue) =>
          issue.includes('duplicate article slug "same"'),
        ),
      ).toBe(true);
    }));

  test("counts drafts without requiring article count edits", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "site/content/categories/history.json", "{}");
      await writeText(
        root,
        "site/content/authors/author.md",
        "---\ndisplayName: Author\naliases:\n  - Author\n---\n",
      );
      await writeText(
        root,
        "site/content/articles/history/published.md",
        "---\ntitle: Published\nauthor: Author\n---\n",
      );
      await writeText(
        root,
        "site/content/articles/history/draft.md",
        "---\ntitle: Draft\nauthor: Author\ndraft: true\n---\n",
      );

      const result = await verifyContent({
        articleDir: path.join(root, "site/content/articles"),
        authorDir: path.join(root, "site/content/authors"),
        categoryDir: path.join(root, "site/content/categories"),
        rootDir: root,
      });

      expect(result.draftCount).toBe(1);
      expect(result.publishedCount).toBe(1);
      expect(result.issues).toEqual([]);
    }));
});

describe("image asset location script", () => {
  test.serial("prints command usage without scanning assets", async () => {
    const log = spyOn(console, "log").mockImplementation(() => undefined);

    try {
      const exitCode = await runImageAssetLocationCli(
        ["--help"],
        process.cwd(),
      );

      expect(exitCode).toBe(0);
      expect(String(log.mock.calls[0]?.[0])).toContain(
        "Usage: just assets-locations",
      );
    } finally {
      log.mockRestore();
    }
  });

  test("returns success from the quiet command-line workflow", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "scripts/image-asset-location-ignore.json", "[]");
      await writeBytes(root, "site/assets/site/ok.png", Buffer.from("ok"));

      const exitCode = await runImageAssetLocationCli(["--quiet"], root);

      expect(exitCode).toBe(0);
    }));

  test.serial(
    "prints image asset location JSON from the command-line workflow",
    async () =>
      withTempRoot(async (root) => {
        const log = spyOn(console, "log").mockImplementation(() => undefined);

        try {
          await writeText(
            root,
            "scripts/image-asset-location-ignore.json",
            "[]",
          );
          await writeBytes(root, "site/assets/site/ok.png", Buffer.from("ok"));

          const exitCode = await runImageAssetLocationCli(["--json"], root);

          expect(exitCode).toBe(0);
          expect(String(log.mock.calls[0]?.[0])).toContain("imageCount");
        } finally {
          log.mockRestore();
        }
      }),
  );

  test.serial(
    "prints image asset location failures from the command-line workflow",
    async () =>
      withTempRoot(async (root) => {
        const error = spyOn(console, "error").mockImplementation(
          () => undefined,
        );

        try {
          await writeText(
            root,
            "scripts/image-asset-location-ignore.json",
            "[]",
          );
          await writeBytes(root, "public/leaked.png", Buffer.from("bad"));

          const exitCode = await runImageAssetLocationCli([], root);

          expect(exitCode).toBe(1);
          expect(String(error.mock.calls[0]?.[0])).toContain(
            "Image asset location verification failed",
          );
        } finally {
          error.mockRestore();
        }
      }),
  );

  test.serial(
    "prints successful image asset location output when not quiet",
    async () =>
      withTempRoot(async (root) => {
        const log = spyOn(console, "log").mockImplementation(() => undefined);

        try {
          await writeText(
            root,
            "scripts/image-asset-location-ignore.json",
            "[]",
          );
          await writeBytes(root, "site/assets/site/ok.png", Buffer.from("ok"));

          const exitCode = await runImageAssetLocationCli([], root);

          expect(exitCode).toBe(0);
          expect(String(log.mock.calls[0]?.[0])).toContain(
            "Image asset location verification passed",
          );
        } finally {
          log.mockRestore();
        }
      }),
  );

  test("formats a success report", () => {
    expect(
      formatImageAssetLocationReport({
        ignoredPatterns: [],
        imageCount: 0,
        violations: [],
      }),
    ).toContain("Image asset location verification passed");
  });

  test("reports images outside site/assets with repair guidance", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "scripts/image-asset-location-ignore.json", "[]");
      await writeBytes(root, "site/assets/site/ok.png", Buffer.from("ok"));
      await writeBytes(root, "public/leaked.png", Buffer.from("bad"));

      const result = await verifyImageAssetLocations({
        isGitIgnored: () => false,
        rootDir: root,
      });

      expect(result.violations).toEqual(["public/leaked.png"]);
      expect(formatImageAssetLocationReport(result)).toContain(
        "Move each file into the appropriate source asset folder",
      );
    }));

  test("honors explicit image location ignore patterns", async () =>
    withTempRoot(async (root) => {
      await writeText(
        root,
        "scripts/image-asset-location-ignore.json",
        JSON.stringify(["public/allowed.png"]),
      );
      await writeBytes(root, "public/allowed.png", Buffer.from("ok"));

      const result = await verifyImageAssetLocations({
        isGitIgnored: () => false,
        rootDir: root,
      });

      expect(result.violations).toEqual([]);
    }));

  test("rejects invalid image location ignore files", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "scripts/image-asset-location-ignore.json", "{}");
      let caughtError: unknown;

      try {
        await verifyImageAssetLocations({ rootDir: root });
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(TypeError);
      expect(caughtError).toHaveProperty(
        "message",
        "scripts/image-asset-location-ignore.json must contain a JSON array of strings.",
      );
    }));

  test("skips gitignored image paths with one batched git lookup", async () =>
    withTempRoot(async (root) => {
      await runGit(root, ["init"]);
      await writeText(root, ".gitignore", "ignored-assets/\n");
      await writeText(root, "scripts/image-asset-location-ignore.json", "[]");
      await writeBytes(root, "ignored-assets/ignored.png", Buffer.from("ok"));
      await writeBytes(root, "public/leaked.png", Buffer.from("bad"));

      const result = await verifyImageAssetLocations({ rootDir: root });

      expect(result.violations).toEqual(["public/leaked.png"]);
    }));
});

describe("duplicate image script", () => {
  test.serial("prints command usage without scanning duplicates", async () => {
    const log = spyOn(console, "log").mockImplementation(() => undefined);

    try {
      const exitCode = await runDuplicateImageCli(["--help"], process.cwd());

      expect(exitCode).toBe(0);
      expect(String(log.mock.calls[0]?.[0])).toContain(
        "Usage: just assets-duplicates",
      );
    } finally {
      log.mockRestore();
    }
  });

  test.serial("prints duplicate scan JSON and fails when requested", async () =>
    withTempRoot(async (root) => {
      const log = spyOn(console, "log").mockImplementation(() => undefined);
      const bytes = Buffer.from("same-image");

      try {
        await writeBytes(root, "site/assets/articles/post/a.png", bytes);
        await writeBytes(root, "site/unused-assets/a-copy.png", bytes);

        const exitCode = await runDuplicateImageCli(
          ["--json", "--fail-on-duplicates"],
          root,
        );

        expect(exitCode).toBe(1);
        expect(String(log.mock.calls[0]?.[0])).toContain("duplicateGroups");
      } finally {
        log.mockRestore();
      }
    }),
  );

  test.serial("prints duplicate warnings in review mode", async () =>
    withTempRoot(async (root) => {
      const warn = spyOn(console, "warn").mockImplementation(() => undefined);
      const bytes = Buffer.from("same-image");

      try {
        await writeBytes(root, "site/assets/articles/post/a.png", bytes);
        await writeBytes(root, "site/unused-assets/a-copy.png", bytes);

        const exitCode = await runDuplicateImageCli(
          ["--fail-on-duplicates"],
          root,
        );

        expect(exitCode).toBe(1);
        expect(String(warn.mock.calls[0]?.[0])).toContain(
          "Duplicate image review warning",
        );
      } finally {
        warn.mockRestore();
      }
    }),
  );

  test.serial(
    "prints successful duplicate scan output when not quiet",
    async () =>
      withTempRoot(async (root) => {
        const log = spyOn(console, "log").mockImplementation(() => undefined);

        try {
          await writeBytes(
            root,
            "site/assets/articles/post/a.png",
            Buffer.from("a"),
          );

          const exitCode = await runDuplicateImageCli([], root);

          expect(exitCode).toBe(0);
          expect(String(log.mock.calls[0]?.[0])).toContain(
            "No duplicate images found",
          );
        } finally {
          log.mockRestore();
        }
      }),
  );

  test("uses custom duplicate ignore files and scan directories", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "custom-ignore.json", JSON.stringify([]));
      await writeBytes(root, "custom-scan/a.png", Buffer.from("a"));

      const exitCode = await runDuplicateImageCli(
        ["--ignore-file", "custom-ignore.json", "custom-scan", "--quiet"],
        root,
      );

      expect(exitCode).toBe(0);
    }));

  test("rejects missing duplicate ignore-file arguments", async () =>
    withTempRoot(async (root) => {
      let caughtError: unknown;

      try {
        await runDuplicateImageCli(["--ignore-file"], root);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError).toHaveProperty(
        "message",
        "--ignore-file requires a path.",
      );
    }));

  test("rejects invalid duplicate image ignore files", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "scripts/duplicate-image-ignore.json", "{}");
      let caughtError: unknown;

      try {
        await findDuplicateImages({ rootDir: root });
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(TypeError);
      expect(caughtError).toHaveProperty(
        "message",
        "scripts/duplicate-image-ignore.json must contain a JSON array of strings.",
      );
    }));

  test("finds identical images and prints review guidance", async () =>
    withTempRoot(async (root) => {
      const bytes = Buffer.from("same-image");
      await writeBytes(root, "site/assets/articles/post/a.png", bytes);
      await writeBytes(root, "site/unused-assets/a-copy.png", bytes);

      const result = await findDuplicateImages({
        ignorePatterns: [],
        rootDir: root,
      });

      expect(result.duplicateGroups).toHaveLength(1);
      expect(formatDuplicateImageReport(result)).toContain(
        "Duplicate image review warning",
      );
      expect(formatDuplicateImageReport(result)).toContain(
        "scripts/duplicate-image-ignore.json",
      );
    }));

  test("honors duplicate image ignore patterns", async () =>
    withTempRoot(async (root) => {
      const bytes = Buffer.from("same-image");
      await writeBytes(root, "site/assets/articles/post/a.png", bytes);
      await writeBytes(root, "site/unused-assets/a-copy.png", bytes);

      const result = await findDuplicateImages({
        ignorePatterns: ["site/unused-assets/**"],
        rootDir: root,
      });

      expect(result.duplicateGroups).toEqual([]);
    }));
});

describe("unused image script", () => {
  test.serial(
    "prints command usage without scanning unused images",
    async () => {
      const log = spyOn(console, "log").mockImplementation(() => undefined);

      try {
        const exitCode = await runUnusedImageCli(["--help"], process.cwd());

        expect(exitCode).toBe(0);
        expect(String(log.mock.calls[0]?.[0])).toContain(
          "Usage: just assets-unused",
        );
      } finally {
        log.mockRestore();
      }
    },
  );

  test.serial("prints unused scan JSON and fails when requested", async () =>
    withTempRoot(async (root) => {
      const log = spyOn(console, "log").mockImplementation(() => undefined);

      try {
        await writeBytes(
          root,
          "site/assets/articles/post/unused.png",
          Buffer.from("y"),
        );

        const exitCode = await runUnusedImageCli(
          ["--json", "--fail-on-unused"],
          root,
        );

        expect(exitCode).toBe(1);
        expect(String(log.mock.calls[0]?.[0])).toContain("unusedImages");
      } finally {
        log.mockRestore();
      }
    }),
  );

  test.serial("prints unused image warnings in review mode", async () =>
    withTempRoot(async (root) => {
      const warn = spyOn(console, "warn").mockImplementation(() => undefined);

      try {
        await writeBytes(
          root,
          "site/assets/articles/post/unused.png",
          Buffer.from("y"),
        );

        const exitCode = await runUnusedImageCli(["--fail-on-unused"], root);

        expect(exitCode).toBe(1);
        expect(String(warn.mock.calls[0]?.[0])).toContain(
          "Unused image review warning",
        );
      } finally {
        warn.mockRestore();
      }
    }),
  );

  test.serial("prints successful unused scan output when not quiet", async () =>
    withTempRoot(async (root) => {
      const log = spyOn(console, "log").mockImplementation(() => undefined);

      try {
        const exitCode = await runUnusedImageCli([], root);

        expect(exitCode).toBe(0);
        expect(String(log.mock.calls[0]?.[0])).toContain(
          "No unused site images found",
        );
      } finally {
        log.mockRestore();
      }
    }),
  );

  test("uses custom unused image ignore files", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "custom-unused-ignore.json", JSON.stringify([]));

      const exitCode = await runUnusedImageCli(
        ["--ignore-file", "custom-unused-ignore.json", "--quiet"],
        root,
      );

      expect(exitCode).toBe(0);
    }));

  test("rejects missing unused ignore-file arguments", async () =>
    withTempRoot(async (root) => {
      let caughtError: unknown;

      try {
        await runUnusedImageCli(["--ignore-file"], root);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError).toHaveProperty(
        "message",
        "--ignore-file requires a path.",
      );
    }));

  test("returns success when the configured asset directory is missing", async () =>
    withTempRoot(async (root) => {
      const result = await findUnusedImages({
        assetsDir: "missing-assets",
        ignorePatterns: [],
        rootDir: root,
      });

      expect(result).toEqual({
        ignoredPatterns: [],
        referencedImageCount: 0,
        scannedImageCount: 0,
        unusedImages: [],
      });
    }));

  test("rejects invalid unused image ignore files", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "scripts/unused-image-ignore.json", "{}");
      let caughtError: unknown;

      try {
        await findUnusedImages({ rootDir: root });
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(TypeError);
      expect(caughtError).toHaveProperty(
        "message",
        "scripts/unused-image-ignore.json must contain a JSON array of strings.",
      );
    }));

  test("reports images in site/assets that no source file references", async () =>
    withTempRoot(async (root) => {
      await writeBytes(
        root,
        "site/assets/articles/post/used.png",
        Buffer.from("x"),
      );
      await writeBytes(
        root,
        "site/assets/articles/post/unused.png",
        Buffer.from("y"),
      );
      await writeText(
        root,
        "site/content/articles/post/example.md",
        "![Used image](../../../assets/articles/post/used.png)",
      );

      const result = await findUnusedImages({
        ignorePatterns: [],
        rootDir: root,
      });

      expect(result.unusedImages).toEqual([
        "site/assets/articles/post/unused.png",
      ]);
      expect(formatUnusedImageReport(result)).toContain(
        "Move it to site/unused-assets/",
      );
    }));

  test("honors unused image ignore patterns", async () =>
    withTempRoot(async (root) => {
      await writeBytes(
        root,
        "site/assets/articles/post/unused.png",
        Buffer.from("y"),
      );

      const result = await findUnusedImages({
        ignorePatterns: ["site/assets/articles/post/unused.png"],
        rootDir: root,
      });

      expect(result.unusedImages).toEqual([]);
    }));
});

describe("shared asset script", () => {
  test.serial(
    "prints shared asset JSON from the command-line workflow",
    async () =>
      withTempRoot(async (root) => {
        const log = spyOn(console, "log").mockImplementation(() => undefined);

        try {
          await writeBytes(
            root,
            "site/assets/articles/post/shared.png",
            Buffer.from("x"),
          );
          await writeText(
            root,
            "src/pages/one.astro",
            '---\nconst img = "site/assets/articles/post/shared.png";\n---\n',
          );
          await writeText(
            root,
            "src/pages/two.astro",
            '---\nconst img = "site/assets/articles/post/shared.png";\n---\n',
          );

          const exitCode = await runSharedAssetsCli(["--json"], root);

          expect(exitCode).toBe(1);
          expect(String(log.mock.calls[0]?.[0])).toContain("sourceFiles");
        } finally {
          log.mockRestore();
        }
      }),
  );

  test.serial(
    "prints shared asset violations from the command-line workflow",
    async () =>
      withTempRoot(async (root) => {
        const error = spyOn(console, "error").mockImplementation(
          () => undefined,
        );

        try {
          await writeBytes(
            root,
            "site/assets/articles/post/shared.png",
            Buffer.from("x"),
          );
          await writeText(
            root,
            "src/pages/one.astro",
            '---\nconst img = "site/assets/articles/post/shared.png";\n---\n',
          );
          await writeText(
            root,
            "src/pages/two.astro",
            '---\nconst img = "site/assets/articles/post/shared.png";\n---\n',
          );

          const exitCode = await runSharedAssetsCli([], root);

          expect(exitCode).toBe(1);
          expect(String(error.mock.calls[0]?.[0])).toContain(
            "outside site/assets/shared",
          );
        } finally {
          error.mockRestore();
        }
      }),
  );

  test.serial(
    "prints successful shared asset output when not quiet",
    async () =>
      withTempRoot(async (root) => {
        const log = spyOn(console, "log").mockImplementation(() => undefined);

        try {
          await writeBytes(root, "site/assets/site/logo.png", Buffer.from("x"));
          await writeText(
            root,
            "src/pages/index.astro",
            '---\nconst img = "site/assets/site/logo.png";\n---\n',
          );

          const exitCode = await runSharedAssetsCli([], root);

          expect(exitCode).toBe(0);
          expect(String(log.mock.calls[0]?.[0])).toContain(
            "No shared site assets found",
          );
        } finally {
          log.mockRestore();
        }
      }),
  );

  test("reports assets referenced from multiple source files outside shared", async () =>
    withTempRoot(async (root) => {
      await writeBytes(
        root,
        "site/assets/articles/post/shared.png",
        Buffer.from("x"),
      );
      await writeText(
        root,
        "src/pages/one.astro",
        '---\nconst img = "site/assets/articles/post/shared.png";\n---\n',
      );
      await writeText(
        root,
        "src/pages/two.astro",
        '---\nconst img = "site/assets/articles/post/shared.png";\n---\n',
      );

      const result = await findSharedAssets({ rootDir: root });

      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]?.assetPath.endsWith("shared.png")).toBe(true);
    }));

  test("allows assets referenced from multiple files when they live in shared", async () =>
    withTempRoot(async (root) => {
      await writeBytes(root, "site/assets/shared/shared.png", Buffer.from("x"));
      await writeText(
        root,
        "src/pages/one.astro",
        '---\nconst img = "site/assets/shared/shared.png";\n---\n',
      );
      await writeText(
        root,
        "src/pages/two.astro",
        '---\nconst img = "site/assets/shared/shared.png";\n---\n',
      );

      const result = await findSharedAssets({ rootDir: root });

      expect(result.violations).toEqual([]);
    }));
});
