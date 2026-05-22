import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, spyOn, test } from "bun:test";

import {
  normalizeArticleTags,
  runNormalizeTagsCli,
} from "../../../scripts/content/normalize-tags";

async function withTempRoot<T>(callback: (root: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-tags-test-"));

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

describe("article tag normalizer", () => {
  test("rewrites safe tag case, whitespace, and duplicate issues", async () =>
    withTempRoot(async (root) => {
      const articlePath = "src/content/articles/history/example.md";
      await writeText(
        root,
        articlePath,
        [
          "---",
          "title: Example",
          "tags:",
          "  # Keep this local tag note.",
          "  - Memes",
          "  - memes",
          "  - Digital   Art",
          "---",
          "",
          "Body.",
          "",
        ].join("\n"),
      );

      const result = await normalizeArticleTags({
        articleDir: path.join(root, "src/content/articles"),
        rootDir: root,
        write: true,
      });
      const text = await readFile(path.join(root, articlePath), "utf8");

      expect(result).toMatchObject({
        changedFiles: [articlePath],
        issues: [],
        scannedFiles: 1,
      });
      expect(text).toContain(
        [
          "tags:",
          "  # Keep this local tag note.",
          '  - "memes"',
          '  - "digital art"',
        ].join("\n"),
      );
    }));

  test("reports slash tags without writing files", async () =>
    withTempRoot(async (root) => {
      const articlePath = "src/content/articles/history/example.md";
      await writeText(
        root,
        articlePath,
        ["---", "title: Example", "tags:", '  - "/pol/"', "---", ""].join("\n"),
      );

      const result = await normalizeArticleTags({
        articleDir: path.join(root, "src/content/articles"),
        rootDir: root,
        write: true,
      });
      const text = await readFile(path.join(root, articlePath), "utf8");

      expect(result.issues).toContain(
        'src/content/articles/history/example.md: article tag "/pol/" at index 0 is invalid: tag must not contain "/"',
      );
      expect(text).toContain('  - "/pol/"');
    }));

  test("reports malformed tag frontmatter without rewriting", async () =>
    withTempRoot(async (root) => {
      const articlesDir = "src/content/articles";
      const nonListPath = `${articlesDir}/history/non-list.md`;
      const nonStringPath = `${articlesDir}/history/non-string.md`;
      await writeText(
        root,
        nonListPath,
        ["---", "title: Example", "tags: memes", "---", ""].join("\n"),
      );
      await writeText(
        root,
        nonStringPath,
        [
          "---",
          "title: Example",
          "tags:",
          "  - memes",
          "  - 12",
          "---",
          "",
        ].join("\n"),
      );

      const result = await normalizeArticleTags({
        articleDir: path.join(root, articlesDir),
        rootDir: root,
        write: true,
      });

      expect({
        ...result,
        issues: Array.from(result.issues).sort((left, right) =>
          left.localeCompare(right),
        ),
      }).toEqual({
        changedFiles: [],
        issues: [
          "src/content/articles/history/non-list.md: article tags must be a list of strings",
          "src/content/articles/history/non-string.md: article tag at index 1 must be a string",
        ].sort((left, right) => left.localeCompare(right)),
        scannedFiles: 2,
      });
    }));

  test("check mode reports pending normalized changes without writing", async () =>
    withTempRoot(async (root) => {
      const articlePath = "src/content/articles/history/example.md";
      await writeText(
        root,
        articlePath,
        ["---", "title: Example", "tags:", "  - Meme Culture", "---", ""].join(
          "\n",
        ),
      );

      const result = await normalizeArticleTags({
        articleDir: path.join(root, "src/content/articles"),
        rootDir: root,
        write: false,
      });
      const text = await readFile(path.join(root, articlePath), "utf8");

      expect(result).toMatchObject({
        changedFiles: [articlePath],
        issues: [],
        scannedFiles: 1,
      });
      expect(text).toContain("  - Meme Culture");
    }));

  test("rewrites unindented YAML tag lists without leaving stale entries", async () =>
    withTempRoot(async (root) => {
      const articlePath = "src/content/articles/history/example.md";
      await writeText(
        root,
        articlePath,
        [
          "---",
          "title: Example",
          "tags:",
          "- Internet Philosophy",
          "- philosophy",
          "legacyPermalink: 2020/01/01/example/",
          "---",
          "",
        ].join("\n"),
      );

      const result = await normalizeArticleTags({
        articleDir: path.join(root, "src/content/articles"),
        rootDir: root,
        write: true,
      });
      const text = await readFile(path.join(root, articlePath), "utf8");

      expect(result.issues).toEqual([]);
      expect(text).toContain(
        ["tags:", '  - "internet philosophy"', '  - "philosophy"'].join("\n"),
      );
      expect(text).not.toContain("- Internet Philosophy");
      expect(text).toContain("legacyPermalink: 2020/01/01/example/");
    }));

  test.serial(
    "prints CLI reports for successful, pending, and invalid tag checks",
    async () =>
      withTempRoot(async (root) => {
        const log = spyOn(console, "log").mockImplementation(() => undefined);
        const error = spyOn(console, "error").mockImplementation(
          () => undefined,
        );

        try {
          await writeText(
            root,
            "site/content/articles/history/clean.md",
            ["---", "title: Clean", "---", ""].join("\n"),
          );
          expect(await runNormalizeTagsCli(["--quiet"], root)).toBe(0);

          await writeText(
            root,
            "site/content/articles/history/pending.md",
            [
              "---",
              "title: Pending",
              "tags:",
              "  - Meme Culture",
              "---",
              "",
            ].join("\n"),
          );
          expect(await runNormalizeTagsCli([], root)).toBe(1);
          expect(String(error.mock.calls.at(-1)?.[0])).toContain(
            "Run with --write to apply these changes.",
          );

          await writeText(
            root,
            "site/content/articles/history/invalid.md",
            ["---", "title: Invalid", "tags: memes", "---", ""].join("\n"),
          );
          expect(await runNormalizeTagsCli(["--write"], root)).toBe(1);
          expect(String(error.mock.calls.at(-1)?.[0])).toContain(
            "Article tag normalization failed.",
          );
          expect(log.mock.calls).toHaveLength(0);
        } finally {
          log.mockRestore();
          error.mockRestore();
        }
      }),
  );
});
