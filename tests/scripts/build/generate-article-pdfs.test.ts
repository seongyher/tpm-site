import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, spyOn, test } from "bun:test";
import { PDFDocument } from "pdf-lib";

import {
  articlePdfPreferredSrcsetUrl,
  articlePdfRenderStatsIssues,
  articlePdfSmallestSrcsetUrl,
  articlePdfSrcsetCandidates,
  articlePdfTargets,
  generateArticlePdfs,
  runGenerateArticlePdfsCli,
  validateGeneratedArticlePdf,
} from "../../../scripts/build/generate-article-pdfs";

async function withTempRoot<T>(callback: (root: string) => Promise<T> | T) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-pdf-test-"));

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

async function blankPdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.addPage([200, 200]);

  return pdf.save();
}

describe("article PDF generator", () => {
  test("derives sorted targets and skips draft or PDF-disabled articles", async () =>
    withTempRoot(async (root) => {
      await writeText(
        root,
        "src/content/articles/history/live.md",
        [
          "---",
          "title: Live Article",
          "author: First Author & Second Author",
          "description: Article description.",
          "date: 2022-04-06",
          "tags:",
          "  - meme research",
          "---",
        ].join("\n"),
      );
      await writeText(
        root,
        "src/content/articles/history/draft.md",
        "---\ntitle: Draft\nauthor: Author\ndraft: true\n---\n",
      );
      await writeText(
        root,
        "src/content/articles/history/web-only.md",
        "---\ntitle: Web Only\nauthor: Author\npdf: false\n---\n",
      );

      const targets = await articlePdfTargets({
        articleDir: path.join(root, "src/content/articles"),
        distDir: path.join(root, "dist"),
      });

      expect(targets).toHaveLength(1);
      expect(targets[0]?.slug).toBe("live");
      expect(targets[0]?.pdfHref).toBe("/articles/live/live.pdf");
      expect(targets[0]?.metadata).toMatchObject({
        authors: ["First Author", "Second Author"],
        keywords: ["history", "meme research"],
        subject: "Article description.",
        title: "Live Article",
      });
    }));

  test("renders PDFs through a test renderer and applies document metadata", async () =>
    withTempRoot(async (root) => {
      await writeText(
        root,
        "src/content/articles/history/live.md",
        [
          "---",
          "title: Live Article",
          "author: Author",
          "description: Article description.",
          "date: 2022-04-06",
          "---",
        ].join("\n"),
      );

      const result = await generateArticlePdfs(
        {
          articleDir: path.join(root, "src/content/articles"),
          distDir: path.join(root, "dist"),
        },
        {
          createRenderer: async () => {
            await Promise.resolve();
            return {
              close: async () => {
                await Promise.resolve();
              },
              render: async (target) => {
                await writeFile(target.outputPath, await blankPdf());
                return {
                  articleImageCount: 2,
                  optimizedArticleImageCount: 2,
                  unoptimizedArticleImageSources: [],
                  unloadedArticleImages: [],
                };
              },
            };
          },
        },
      );
      const pdf = await PDFDocument.load(
        await Bun.file(path.join(root, "dist/articles/live/live.pdf")).bytes(),
      );

      expect(result).toEqual({
        generatedCount: 1,
        imageCount: 2,
        issues: [],
        optimizedImageCount: 2,
      });
      expect(pdf.getTitle()).toBe("Live Article");
      expect(pdf.getAuthor()).toBe("Author");
      expect(pdf.getSubject()).toBe("Article description.");
      expect(pdf.getKeywords()).toContain("history");
    }));

  test("reports article images that fail to load before PDF rendering", async () => {
    await withTempRoot((root) => {
      const issueTarget = {
        articleHref: "/articles/live/",
        metadata: {
          authors: ["Author"],
          keywords: [],
          title: "Live Article",
        },
        outputPath: path.join(root, "dist/articles/live/live.pdf"),
        pdfHref: "/articles/live/live.pdf",
        relativeOutputPath: "articles/live/live.pdf",
        slug: "live",
        sourcePath: path.join(root, "src/content/articles/history/live.md"),
      };

      expect(
        articlePdfRenderStatsIssues(issueTarget, {
          articleImageCount: 2,
          optimizedArticleImageCount: 1,
          unoptimizedArticleImageSources: [],
          unloadedArticleImages: ["Figure 7"],
        }),
      ).toEqual([
        "articles/live/live.pdf: article images failed to load before PDF rendering: Figure 7",
      ]);
      expect(
        articlePdfRenderStatsIssues(issueTarget, {
          articleImageCount: 2,
          optimizedArticleImageCount: 1,
          unoptimizedArticleImageSources: ["/images/raw.png"],
          unloadedArticleImages: [],
        }),
      ).toEqual([
        "articles/live/live.pdf: article images bypassed Astro optimization: /images/raw.png",
      ]);
    });
  });

  test("chooses the smallest Astro srcset candidate for compact PDF images", () => {
    const srcset = [
      "/_astro/image.large.webp 1280w",
      "/_astro/image.small.webp 640w",
      "/_astro/image.medium.webp 828w",
      "/_astro/image.density.webp 2x",
      "/_astro/image.pdf.webp 384w",
      "bad-candidate",
    ].join(", ");

    expect(articlePdfSrcsetCandidates(srcset)).toEqual([
      { url: "/_astro/image.pdf.webp", width: 384 },
      { url: "/_astro/image.small.webp", width: 640 },
      { url: "/_astro/image.medium.webp", width: 828 },
      { url: "/_astro/image.large.webp", width: 1280 },
    ]);
    expect(articlePdfSmallestSrcsetUrl(srcset)).toBe("/_astro/image.pdf.webp");
    expect(articlePdfPreferredSrcsetUrl(srcset)).toBe("/_astro/image.pdf.webp");
    expect(articlePdfPreferredSrcsetUrl(srcset, 800)).toBe(
      "/_astro/image.medium.webp",
    );
    expect(articlePdfPreferredSrcsetUrl("/_astro/tiny.webp 320w")).toBe(
      "/_astro/tiny.webp",
    );
    expect(articlePdfSmallestSrcsetUrl("")).toBeUndefined();
    expect(articlePdfPreferredSrcsetUrl("")).toBeUndefined();
  });

  test("reports invalid PDF files and oversized output", async () =>
    withTempRoot(async (root) => {
      const outputPath = path.join(root, "dist/articles/live/live.pdf");
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, "not a pdf");

      const invalidIssues = await validateGeneratedArticlePdf({
        articleHref: "/articles/live/",
        metadata: {
          authors: ["Author"],
          keywords: [],
          title: "Live Article",
        },
        outputPath,
        pdfHref: "/articles/live/live.pdf",
        relativeOutputPath: "articles/live/live.pdf",
        slug: "live",
        sourcePath: path.join(root, "src/content/articles/history/live.md"),
      });

      expect(invalidIssues).toEqual([
        "articles/live/live.pdf: generated file is not a PDF",
      ]);

      await writeFile(outputPath, await blankPdf());
      const oversizedIssues = await validateGeneratedArticlePdf(
        {
          articleHref: "/articles/live/",
          metadata: {
            authors: ["Author"],
            keywords: [],
            title: "Live Article",
          },
          outputPath,
          pdfHref: "/articles/live/live.pdf",
          relativeOutputPath: "articles/live/live.pdf",
          slug: "live",
          sourcePath: path.join(root, "src/content/articles/history/live.md"),
        },
        { maxPdfBytes: 1 },
      );
      expect(
        oversizedIssues.some((issue) =>
          issue.startsWith("articles/live/live.pdf: generated PDF is"),
        ),
      ).toBe(true);
    }));

  test.serial("prints command usage without generating PDFs", async () => {
    const log = spyOn(console, "log").mockImplementation(() => undefined);

    try {
      const exitCode = await runGenerateArticlePdfsCli(["--help"]);

      expect(exitCode).toBe(0);
      expect(String(log.mock.calls[0]?.[0])).toContain("Usage: just build-pdf");
    } finally {
      log.mockRestore();
    }
  });
});
