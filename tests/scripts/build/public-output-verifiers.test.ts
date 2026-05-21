import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";
import { PDFDocument } from "pdf-lib";

import {
  verifyArticleJsonLdPresence,
  verifyArticlePageCount,
  verifyArticlePdfHtml,
  verifyArticlePdfs,
  verifyArticleSocialImageHtml,
  verifyCatalogOutput,
  verifyDraftLeaks,
  verifyGeneratedAssetCachePolicy,
  verifyHtmlImageAlt,
  verifyHtmlMediaOutput,
  verifyHtmlMetadata,
  verifyHydrationBoundaries,
  verifySourceMapOutput,
  verifyStaticReadingPageAssets,
} from "../../../scripts/build/verify-build";

async function withTempDist<T>(callback: (distDir: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-public-output-"));

  try {
    const distDir = path.join(root, "dist");
    await mkdir(distDir, { recursive: true });

    return await callback(distDir);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

async function writeDistFile(
  distDir: string,
  relativePath: string,
  text = "",
): Promise<string> {
  const fullPath = path.join(distDir, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, text);

  return fullPath;
}

describe("public-output verifier modules", () => {
  test("emits HTML diagnostics for missing image alt and hydration boundaries", () => {
    const html = '<img src="/image.webp"><astro-island></astro-island>';

    expect(
      verifyHtmlImageAlt({
        html,
        relativeHtmlPath: "articles/example/index.html",
      }),
    ).toMatchObject([
      {
        code: "html.image-alt-missing",
        location: { outputPath: "articles/example/index.html" },
        message: "articles/example/index.html: /image.webp is missing alt",
        moduleId: "build.html",
      },
    ]);
    expect(
      verifyHydrationBoundaries({
        html,
        relativeHtmlPath: "articles/example/index.html",
        staticReadingPages: ["articles/example/index.html"],
      }),
    ).toMatchObject([
      {
        code: "html.hydration-boundary-unexpected",
        location: { outputPath: "articles/example/index.html" },
        message: "articles/example/index.html",
        moduleId: "build.html",
      },
    ]);
  });

  test("emits scoped media diagnostics for unoptimized images and missing embed fallbacks", () => {
    const html = [
      '<img data-article-image="true" src="/assets/raw.png" alt="Raw">',
      '<img data-hover-image-image="true" src="https://example.com/remote.jpg" alt="Remote">',
      '<img data-publishable-media-image="true" src="/_astro/card.hash.webp" alt="Card">',
      '<iframe data-article-embed-frame="true" src="https://example.com/embed" title="Embed"></iframe>',
    ].join("");

    expect(
      verifyHtmlMediaOutput({
        html,
        relativeHtmlPath: "articles/example/index.html",
      }).map((diagnostic) => diagnostic.message),
    ).toEqual([
      "articles/example/index.html: /assets/raw.png is not an optimized Astro asset",
      "articles/example/index.html: https://example.com/remote.jpg is a remote image in scoped media output",
      "articles/example/index.html: article embeds need static fallbacks; found 1 embed frames and 0 fallbacks",
    ]);
  });

  test("emits metadata diagnostics for missing document and article metadata", async () =>
    withTempDist(async (distDir) => {
      const html = "<html><head></head><body></body></html>";

      expect(
        verifyHtmlMetadata({
          html,
          relativeHtmlPath: "articles/example/index.html",
        }).map((diagnostic) => diagnostic.message),
      ).toContain("articles/example/index.html: missing document title");
      expect(
        verifyArticleJsonLdPresence({
          html,
          relativeHtmlPath: "articles/example/index.html",
        }),
      ).toMatchObject([
        {
          code: "metadata.article-json-ld-missing",
          message: "articles/example/index.html",
          moduleId: "build.metadata",
        },
      ]);
      expect(
        await verifyArticleSocialImageHtml({
          distDir,
          html,
          relativeHtmlPath: "articles/example/index.html",
        }),
      ).toMatchObject([
        {
          code: "metadata.social-preview-invalid",
          message:
            "articles/example/index.html: expected exactly one og:image, found 0",
          moduleId: "build.social-preview",
        },
        {
          code: "metadata.social-preview-invalid",
          message:
            "articles/example/index.html: expected exactly one twitter:image, found 0",
        },
        {
          code: "metadata.social-preview-invalid",
          message:
            "articles/example/index.html: expected exactly one BlogPosting JSON-LD image, found 0",
        },
      ]);
    }));

  test("emits metadata diagnostics for unstable JSON-LD IDs and canonical drift", () => {
    const html = [
      "<html><head>",
      "<title>Example</title>",
      '<link rel="canonical" href="https://example.com/articles/example/">',
      '<meta name="description" content="Example description.">',
      '<meta name="robots" content="index,follow">',
      '<meta property="og:site_name" content="Example">',
      '<meta property="og:locale" content="en_US">',
      '<meta property="og:type" content="article">',
      '<meta property="og:title" content="Example">',
      '<meta property="og:description" content="Example description.">',
      '<meta property="og:url" content="https://example.com/articles/wrong/">',
      '<meta property="og:image" content="https://example.com/_astro/social.jpg">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:title" content="Example">',
      '<meta name="twitter:description" content="Example description.">',
      '<meta name="twitter:image" content="https://example.com/_astro/social.jpg">',
      '<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@id":"https://example.com/articles/wrong/#webpage"}]}</script>',
      "</head><body></body></html>",
    ].join("");

    expect(
      verifyHtmlMetadata({
        html,
        relativeHtmlPath: "articles/example/index.html",
      }).map((diagnostic) => diagnostic.message),
    ).toEqual([
      "articles/example/index.html: JSON-LD is missing the stable route #webpage entity",
      "articles/example/index.html: og:url does not match canonical link",
    ]);
  });

  test("emits PDF diagnostics for missing article PDF surfaces", () => {
    expect(
      verifyArticlePdfHtml({
        article: {
          authors: ["Test Author"],
          pdfEnabled: true,
          publicationDate: new Date("2024-01-02T00:00:00.000Z"),
          slug: "example",
          title: "Example",
        },
        html: '<meta name="citation_title" content="Example">',
        relativeHtmlPath: "articles/example/index.html",
      }).map((diagnostic) => diagnostic.message),
    ).toEqual([
      "articles/example/index.html: missing Save PDF link to /articles/example/example.pdf",
      "articles/example/index.html: missing citation_pdf_url metadata",
      "articles/example/index.html: missing citation_author metadata for Test Author",
      "articles/example/index.html: missing citation_publication_date metadata",
    ]);
  });

  test("emits PDF media diagnostics for oversized generated PDFs", async () =>
    withTempDist(async (distDir) => {
      const pdf = await PDFDocument.create();
      pdf.addPage([72, 72]);
      pdf.setTitle("Example");
      pdf.setAuthor("Test Author");
      const pdfBytes = await pdf.save();
      const relativePdfPath = "articles/example/example.pdf";
      const fullPdfPath = path.join(distDir, relativePdfPath);
      await mkdir(path.dirname(fullPdfPath), { recursive: true });
      await writeFile(
        fullPdfPath,
        Buffer.concat([Buffer.from(pdfBytes), Buffer.alloc(5 * 1024 * 1024)]),
      );

      const diagnostics = await verifyArticlePdfs({
        articles: [
          {
            authors: ["Test Author"],
            pdfEnabled: true,
            slug: "example",
            title: "Example",
          },
        ],
        distDir,
      });

      expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
        "pdf.article-media-invalid",
      ]);
      expect(diagnostics[0]?.message).toContain("above the 5242880 byte limit");
      expect(diagnostics[0]?.evidence).toContain(
        "mediaDiagnostic: media.pdf-output-oversized",
      );
    }));

  test("emits asset diagnostics for source maps and unexpected client scripts", async () =>
    withTempDist(async (distDir) => {
      const sourceMap = await writeDistFile(distDir, "_astro/index.js.map");

      expect(
        verifySourceMapOutput({
          distDir,
          files: [sourceMap],
        }),
      ).toMatchObject([
        {
          code: "asset.source-map-leak",
          message: "_astro/index.js.map",
          moduleId: "build.assets",
        },
      ]);
      expect(
        await verifyStaticReadingPageAssets({
          distDir,
          html: '<script type="module" src="/_astro/app.js"></script>',
          relativeHtmlPath: "index.html",
          staticReadingPages: ["index.html"],
        }),
      ).toMatchObject([
        {
          code: "asset.client-script-unexpected",
          message: "index.html -> /_astro/app.js",
          moduleId: "build.assets",
        },
      ]);
    }));

  test("emits cache diagnostics for missing immutable generated asset headers", async () =>
    withTempDist(async (distDir) => {
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

  test("emits content diagnostics for draft leaks, catalog output, and article count mismatch", async () =>
    withTempDist(async (distDir) => {
      const feed = await writeDistFile(distDir, "feed.xml", "<rss>draft</rss>");
      await writeDistFile(distDir, "catalog/index.html");

      expect(
        await verifyDraftLeaks({
          distDir,
          draftSlugs: ["draft"],
          file: feed,
        }),
      ).toMatchObject([
        {
          code: "content.draft-leak",
          message: "feed.xml -> draft",
          moduleId: "build.drafts",
        },
      ]);
      expect(await verifyCatalogOutput(distDir)).toMatchObject([
        {
          code: "build.catalog-leak",
          message: "catalog/",
          moduleId: "build.catalog",
        },
      ]);
      expect(
        verifyArticlePageCount({
          actualArticlePageCount: 1,
          expectedArticlePageCount: 2,
        }),
      ).toMatchObject([
        {
          code: "content.article-count-mismatch",
          message:
            "expected 2 article pages from published source content, found 1",
          moduleId: "build.article-pages",
        },
      ]);
    }));
});
