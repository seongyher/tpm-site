import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
  verifyArticlePdfHtml,
  verifyArticlePdfs,
} from "../../../../scripts/build/verify-build/pdf-verifier";

async function withTempDist<T>(callback: (distDir: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-pdf-verifier-"));

  try {
    const distDir = path.join(root, "dist");
    await mkdir(distDir, { recursive: true });

    return await callback(distDir);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

describe("PDF verifier", () => {
  test("reports missing PDF links and Scholar metadata", () => {
    expect(
      verifyArticlePdfHtml({
        article: {
          authors: ["Test Author"],
          pdfEnabled: true,
          publicationDate: new Date("2024-01-02T00:00:00.000Z"),
          slug: "post",
          title: "Post",
        },
        html: '<meta name="citation_title" content="Post">',
        relativeHtmlPath: "articles/post/index.html",
      }).map((diagnostic) => diagnostic.message),
    ).toEqual([
      "articles/post/index.html: missing Save PDF link to /articles/post/post.pdf",
      "articles/post/index.html: missing citation_pdf_url metadata",
      "articles/post/index.html: missing citation_author metadata for Test Author",
      "articles/post/index.html: missing citation_publication_date metadata",
    ]);
  });

  test("reports generated PDF file shape regressions", async () =>
    await withTempDist(async (distDir) => {
      const pdfPath = path.join(distDir, "articles/post/post.pdf");
      await mkdir(path.dirname(pdfPath), { recursive: true });
      await writeFile(pdfPath, "not a pdf");

      expect(
        (
          await verifyArticlePdfs({
            articles: [
              {
                authors: [],
                pdfEnabled: true,
                slug: "post",
                title: "Post",
              },
            ],
            distDir,
          })
        ).map((diagnostic) => diagnostic.message),
      ).toEqual(["articles/post/post.pdf: generated file is not a PDF"]);
    }));
});
