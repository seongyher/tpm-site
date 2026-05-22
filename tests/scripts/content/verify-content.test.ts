import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import { verifyContent } from "../../../scripts/content/verify-content";

async function withTempRoot<T>(callback: (root: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-content-test-"));

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

describe("content verifier", () => {
  test("accepts URL-safe categories and article slugs", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/authors/author.md",
        "---\ndisplayName: Author\naliases:\n  - Author\n---\n",
      );
      await writeText(
        root,
        "src/content/articles/history/example.md",
        "---\ntitle: Example\nauthor: Author\n---\n",
      );

      const result = await verifyContent({
        articleDir: path.join(root, "src/content/articles"),
        authorDir: path.join(root, "src/content/authors"),
        categoryDir: path.join(root, "src/content/categories"),
        rootDir: root,
      });

      expect(result.issues).toEqual([]);
      expect(result.publishedCount).toBe(1);
    }));

  test("reports article authors that lack author metadata aliases", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/authors/known-author.md",
        "---\ndisplayName: Known Author\naliases:\n  - Known Author\n---\n",
      );
      await writeText(
        root,
        "src/content/articles/history/example.md",
        "---\ntitle: Example\nauthor: Unknown Author\n---\n",
      );

      const result = await verifyContent({
        articleDir: path.join(root, "src/content/articles"),
        authorDir: path.join(root, "src/content/authors"),
        categoryDir: path.join(root, "src/content/categories"),
        rootDir: root,
      });

      expect(result.issues).toContain(
        'src/content/articles/history/example.md: author "Unknown Author" does not match src/content/authors/ aliases; add an author profile or approved alias',
      );
    }));

  test("reports noncanonical article tags", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/authors/author.md",
        "---\ndisplayName: Author\naliases:\n  - Author\n---\n",
      );
      await writeText(
        root,
        "src/content/articles/history/example.md",
        [
          "---",
          "title: Example",
          "author: Author",
          "tags:",
          "  - Meme History",
          "  - meme   history",
          '  - "/pol/"',
          "---",
          "",
        ].join("\n"),
      );

      const result = await verifyContent({
        articleDir: path.join(root, "src/content/articles"),
        authorDir: path.join(root, "src/content/authors"),
        categoryDir: path.join(root, "src/content/categories"),
        rootDir: root,
      });

      expect(result.issues).toContain(
        'src/content/articles/history/example.md: article tag "Meme History" at index 0 is invalid: tag must be canonical "meme history"',
      );
      expect(result.issues).toContain(
        'src/content/articles/history/example.md: article tag "meme   history" at index 1 is invalid: duplicate canonical tag "meme history" also appears at index 0',
      );
      expect(result.issues).toContain(
        'src/content/articles/history/example.md: article tag "/pol/" at index 2 is invalid: tag must not contain "/"',
      );
    }));

  test("accepts standalone local image paragraphs and remote image-file links", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/authors/author.md",
        "---\ndisplayName: Author\naliases:\n  - Author\n---\n",
      );
      await writeText(
        root,
        "src/content/articles/history/example.md",
        [
          "---",
          "title: Example",
          "author: Author",
          "---",
          "",
          "![Standalone](../../../assets/articles/example/standalone.png)",
          "",
          "[![Linked](../../../assets/articles/example/linked.png)](https://example.com/source)",
          "",
          "Plain prose stays plain.",
          "",
          "Remote image-file links like [source image](https://example.com/source.png) stay as links.",
          "",
        ].join("\n"),
      );

      const result = await verifyContent({
        articleDir: path.join(root, "src/content/articles"),
        authorDir: path.join(root, "src/content/authors"),
        categoryDir: path.join(root, "src/content/categories"),
        rootDir: root,
      });

      expect(result.issues).toEqual([]);
    }));

  test("reports rendered remote article images", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/authors/author.md",
        "---\ndisplayName: Author\naliases:\n  - Author\n---\n",
      );
      await writeText(
        root,
        "src/content/articles/history/example.md",
        [
          "---",
          "title: Example",
          "author: Author",
          "---",
          "",
          "Inline remote emoji ![emoji](https://example.com/emoji.png) is not local.",
          "",
          '<img src="https://example.com/raw.jpg" alt="Raw remote image">',
          "",
        ].join("\n"),
      );

      const result = await verifyContent({
        articleDir: path.join(root, "src/content/articles"),
        authorDir: path.join(root, "src/content/authors"),
        categoryDir: path.join(root, "src/content/categories"),
        rootDir: root,
      });

      expect(result.issues).toContain(
        'src/content/articles/history/example.md:6: remote article image "https://example.com/emoji.png" must be stored locally and referenced from site/assets',
      );
      expect(result.issues).toContain(
        'src/content/articles/history/example.md:8: remote article image "https://example.com/raw.jpg" must be stored locally and referenced from site/assets',
      );
    }));

  test("reports local article images mixed into prose paragraphs", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/authors/author.md",
        "---\ndisplayName: Author\naliases:\n  - Author\n---\n",
      );
      await writeText(
        root,
        "src/content/articles/history/example.md",
        [
          "---",
          "title: Example",
          "author: Author",
          "---",
          "",
          "Text before a legacy block image.",
          "![Mixed](../../../assets/articles/example/mixed.png)",
          "",
        ].join("\n"),
      );

      const result = await verifyContent({
        articleDir: path.join(root, "src/content/articles"),
        authorDir: path.join(root, "src/content/authors"),
        categoryDir: path.join(root, "src/content/categories"),
        rootDir: root,
      });

      expect(result.issues).toContain(
        "src/content/articles/history/example.md:7: local article image must be separated into its own paragraph; add blank lines around the image so article image tooling can render it as an inspectable figure",
      );
    }));

  test("requires article MDX component imports to declare PDF compatibility", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/authors/author.md",
        "---\ndisplayName: Author\naliases:\n  - Author\n---\n",
      );
      await writeText(
        root,
        "src/content/articles/history/compatible.mdx",
        [
          "---",
          "title: Compatible",
          "author: Author",
          "---",
          "",
          'import HoverImageLink from "../../../components/articles/media/HoverImageLink.astro";',
          'import articleImage from "../../../assets/articles/example/image.png";',
          "",
          '<HoverImageLink image={articleImage} label="preview" />',
        ].join("\n"),
      );
      await writeText(
        root,
        "src/content/articles/history/unsupported.mdx",
        [
          "---",
          "title: Unsupported",
          "author: Author",
          "---",
          "",
          'import InteractiveWidget from "../../../components/articles/InteractiveWidget.astro";',
          "",
          "<InteractiveWidget />",
        ].join("\n"),
      );

      const result = await verifyContent({
        articleDir: path.join(root, "src/content/articles"),
        authorDir: path.join(root, "src/content/authors"),
        categoryDir: path.join(root, "src/content/categories"),
        rootDir: root,
      });

      expect(result.issues).toContain(
        'src/content/articles/history/unsupported.mdx: article MDX import "../../../components/articles/InteractiveWidget.astro" needs an explicit PDF fallback in src/lib/articles/article-pdf-compatibility.ts',
      );
      expect(
        result.issues.some((issue) => issue.includes("compatible.mdx")),
      ).toBe(false);
    }));
});
