import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, spyOn, test } from "bun:test";
import { PDFDocument } from "pdf-lib";

import {
  announcementPublicationStats,
  type ArticlePublication,
  articlePublicationStats,
  type BuildVerificationDiagnosticReport,
  buildVerificationDiagnosticReport,
  buildVerificationDiagnostics,
  collectionPublicationStats,
  formatBuildVerificationReport,
  isExternal,
  linkTargets,
  requiredPathsForSource,
  runBuildVerificationCli,
  staticReadingPagesForSource,
  verifyBuild,
} from "../../../scripts/build/verify-build";
import { parseSiteConfig } from "../../../src/lib/site-config";
import { maxSocialPreviewImageBytes } from "../../../src/lib/social-images";

function publication(): ArticlePublication {
  return {
    draftSlugs: ["draft-post"],
    publishedArticles: [
      {
        authors: ["Test Author"],
        isMdx: false,
        pdfEnabled: true,
        publicationDate: new Date("2024-01-02T00:00:00.000Z"),
        slug: "markdown-post",
        title: "Markdown Post",
      },
      {
        authors: ["Test Author"],
        isMdx: true,
        pdfEnabled: true,
        publicationDate: new Date("2024-01-03T00:00:00.000Z"),
        slug: "interactive-post",
        title: "Interactive Post",
      },
    ],
    publishedCategorySlugs: new Set(["history"]),
    publishedTagSegments: new Set(["meme history"]),
  };
}

async function withTempRoot<T>(callback: (root: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-build-test-"));

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

async function writeArticlePdf(
  root: string,
  slug: string,
  {
    authors = [],
    oversized = false,
    title = "Published",
  }: {
    authors?: readonly string[];
    oversized?: boolean;
    title?: string;
  } = {},
) {
  const fullPath = path.join(root, `dist/articles/${slug}/${slug}.pdf`);
  const pdf = await PDFDocument.create();

  pdf.addPage([72, 72]);
  pdf.setTitle(title);
  pdf.setAuthor(authors.join(", "));
  if (oversized) {
    pdf.setSubject("x".repeat(5 * 1024 * 1024));
  }
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, await pdf.save());

  if (oversized) {
    const data = await readFile(fullPath);
    await writeFile(
      fullPath,
      Buffer.concat([data, Buffer.alloc(5 * 1024 * 1024)]),
    );
  }
}

function pageHtmlFixture(
  relativePath: string,
  body = "",
  { includeShareMeta = true, noindex = false, title = "Test Page" } = {},
) {
  const pathWithLeadingSlash = `/${relativePath}`
    .replace(/\/index\.html$/, "/")
    .replace(/\/404\.html$/, "/404/");
  const canonical = `https://thephilosophersmeme.com${pathWithLeadingSlash}`;
  const socialImage =
    "https://thephilosophersmeme.com/_astro/social-preview.jpg";
  const robots = noindex ? "noindex, follow" : "index, follow";

  const shareMeta = includeShareMeta
    ? [
        '<meta property="og:site_name" content="The Philosopher\'s Meme">',
        '<meta property="og:locale" content="en_US">',
        '<meta property="og:type" content="website">',
        `<meta property="og:title" content="${title}">`,
        '<meta property="og:description" content="Test description">',
        `<meta property="og:url" content="${canonical}">`,
        `<meta property="og:image" content="${socialImage}">`,
        '<meta name="twitter:card" content="summary_large_image">',
        `<meta name="twitter:title" content="${title}">`,
        '<meta name="twitter:description" content="Test description">',
        `<meta name="twitter:image" content="${socialImage}">`,
      ]
    : [];

  return [
    "<!doctype html><html><head>",
    `<title>${title}</title>`,
    `<link rel="canonical" href="${canonical}">`,
    '<meta name="description" content="Test description">',
    `<meta name="robots" content="${robots}">`,
    ...shareMeta,
    `<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","@id":"${canonical}#webpage"}</script>`,
    "</head><body>",
    body,
    "</body></html>",
  ].join("");
}

function diagnosticReportFingerprint(
  report: BuildVerificationDiagnosticReport,
) {
  return {
    articlePageCount: report.articlePageCount,
    astroClientScriptCount: report.astroClientScriptCount,
    diagnostics: report.diagnostics.map((diagnostic) => ({
      category: diagnostic.category,
      code: diagnostic.code,
      location: diagnostic.location,
      message: diagnostic.message,
      moduleId: diagnostic.moduleId,
      owner: diagnostic.owner,
      severity: diagnostic.severity,
    })),
    summary: report.summary,
  };
}

type DiagnosticReportFingerprint = ReturnType<
  typeof diagnosticReportFingerprint
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDiagnosticReportFingerprint(
  value: unknown,
): value is DiagnosticReportFingerprint {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value["articlePageCount"] === "number" &&
    typeof value["astroClientScriptCount"] === "number" &&
    Array.isArray(value["diagnostics"]) &&
    isRecord(value["summary"])
  );
}

function parseDiagnosticReportFingerprint(
  text: string,
): DiagnosticReportFingerprint {
  const parsed: unknown = JSON.parse(text);

  if (!isDiagnosticReportFingerprint(parsed)) {
    throw new TypeError(
      "Golden diagnostic report fixture has an unexpected shape.",
    );
  }

  return parsed;
}

async function writeRequiredDistShell(root: string) {
  await writeText(root, "dist/_astro/social-preview.jpg", "small social jpg");
  await writeText(root, "dist/index.html", pageHtmlFixture("index.html"));
  await writeText(
    root,
    "dist/404.html",
    pageHtmlFixture("404.html", "", { noindex: true, title: "Not Found" }),
  );
  await writeText(
    root,
    "dist/about/index.html",
    pageHtmlFixture("about/index.html"),
  );
  await writeText(
    root,
    "dist/announcements/index.html",
    pageHtmlFixture("announcements/index.html"),
  );
  await writeText(
    root,
    "dist/authors/index.html",
    pageHtmlFixture("authors/index.html"),
  );
  await writeText(
    root,
    "dist/articles/index.html",
    pageHtmlFixture("articles/index.html"),
  );
  await writeText(
    root,
    "dist/articles/all/index.html",
    pageHtmlFixture("articles/all/index.html"),
  );
  await writeText(
    root,
    "dist/bibliography/index.html",
    pageHtmlFixture("bibliography/index.html"),
  );
  await writeText(
    root,
    "dist/categories/index.html",
    pageHtmlFixture("categories/index.html"),
  );
  await writeText(
    root,
    "dist/collections/index.html",
    pageHtmlFixture("collections/index.html"),
  );
  await writeText(
    root,
    "dist/tags/index.html",
    pageHtmlFixture("tags/index.html"),
  );
  await writeText(
    root,
    "dist/search/index.html",
    pageHtmlFixture("search/index.html", "", {
      noindex: true,
      title: "Search",
    }),
  );
  await writeText(
    root,
    "dist/categories/history/index.html",
    pageHtmlFixture("categories/history/index.html"),
  );
  await writeText(root, "dist/feed.xml", "<feed>published</feed>");
  await writeText(root, "dist/sitemap-index.xml", "<sitemap />");
  await writeText(root, "dist/pagefind/pagefind.js", "");
}

function articleHtmlFixture(
  slug = "published",
  {
    authors = [],
    date,
    includePdf = true,
    title = "Published",
  }: {
    authors?: readonly string[];
    date?: string;
    includePdf?: boolean;
    title?: string;
  } = {},
) {
  const socialImage =
    "https://thephilosophersmeme.com/_astro/social-preview.jpg";

  return pageHtmlFixture(
    `articles/${slug}/index.html`,
    [
      `<script type="application/ld+json">{"@type":"BlogPosting","image":"${socialImage}"}</script>`,
      '<meta property="og:site_name" content="The Philosopher\'s Meme">',
      '<meta property="og:locale" content="en_US">',
      '<meta property="og:type" content="article">',
      `<meta property="og:title" content="${title}">`,
      '<meta property="og:description" content="Test description">',
      `<meta property="og:url" content="https://thephilosophersmeme.com/articles/${slug}/">`,
      `<meta property="og:image" content="${socialImage}">`,
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      '<meta property="og:image:type" content="image/jpeg">',
      '<meta name="twitter:card" content="summary_large_image">',
      `<meta name="twitter:title" content="${title}">`,
      '<meta name="twitter:description" content="Test description">',
      `<meta name="twitter:image" content="${socialImage}">`,
      `<meta name="citation_title" content="${title}">`,
      ...authors.map(
        (author) => `<meta name="citation_author" content="${author}">`,
      ),
      date === undefined
        ? ""
        : `<meta name="citation_publication_date" content="${date}">`,
      includePdf
        ? `<meta name="citation_pdf_url" content="https://thephilosophersmeme.com/articles/${slug}/${slug}.pdf">`
        : "",
      includePdf
        ? `<a href="/articles/${slug}/${slug}.pdf" data-article-pdf-link>Save PDF</a>`
        : "",
    ].join(""),
    { includeShareMeta: false, title },
  );
}

const astroPrefetchRuntimeFixture =
  'document.querySelector("a")?.dataset.astroPrefetch; document.createElement("link").relList?.supports?.("prefetch"); const option = { ignoreSlowConnection: true }; navigator.connection; option.ignoreSlowConnection;';
const oxcNormalizedAstroPrefetchRuntimeFixture =
  "document.querySelector(`a`)?.dataset.astroPrefetch; document.createElement(`link`).relList?.supports?.(`prefetch`); const option = { ignoreSlowConnection: true }; navigator.connection; option.ignoreSlowConnection;";

describe("build verifier helpers", () => {
  test("derives required article, collection, and category paths from source content", () => {
    expect(requiredPathsForSource(publication(), ["history"])).toContain(
      "announcements/index.html",
    );
    expect(
      requiredPathsForSource(publication(), ["history"], ["site-news"]),
    ).toContain("announcements/site-news/index.html");
    expect(requiredPathsForSource(publication(), ["history"])).toContain(
      "articles/markdown-post/index.html",
    );
    expect(requiredPathsForSource(publication(), ["history"])).toContain(
      "articles/markdown-post/markdown-post.pdf",
    );
    expect(requiredPathsForSource(publication(), ["history"])).toContain(
      "articles/interactive-post/index.html",
    );
    expect(requiredPathsForSource(publication(), ["history"])).toContain(
      "articles/all/index.html",
    );
    expect(requiredPathsForSource(publication(), ["history"])).toContain(
      "categories/history/index.html",
    );
    expect(requiredPathsForSource(publication(), ["history"])).toContain(
      "collections/index.html",
    );
    expect(
      requiredPathsForSource(publication(), ["history"], [], ["featured"]),
    ).toContain("collections/featured/index.html");
    expect(requiredPathsForSource(publication(), ["history"])).toContain(
      "tags/meme history/index.html",
    );
  });

  test("omits disabled optional feature routes from required build paths", () => {
    const config = parseSiteConfig({
      features: {
        announcements: false,
        categories: false,
        collections: false,
        feed: false,
        search: false,
        tags: false,
      },
      identity: {
        description: "A configurable publication.",
        language: "en",
        title: "Example Blog",
        url: "https://example.com",
      },
      navigation: {
        footer: [],
        primary: [],
      },
      routes: {
        allArticles: "/articles/all/",
        announcements: "/announcements/",
        articles: "/articles/",
        authors: "/authors/",
        bibliography: "/bibliography/",
        categories: "/categories/",
        collections: "/collections/",
        feed: "/feed.xml",
        home: "/",
        search: "/search/",
        tags: "/tags/",
      },
      support: {
        block: {
          body: "Keep publishing going.",
          title: "Support Example Blog",
        },
        discord: {
          href: "https://discord.gg/example",
          label: "Join Discord",
        },
        patreon: {
          href: "https://patreon.com/example",
          label: "Support Us",
        },
      },
    });
    const required = requiredPathsForSource(
      publication(),
      ["history"],
      ["site-news"],
      ["featured"],
      config,
    );

    expect(required).toContain("articles/markdown-post/index.html");
    expect(required).not.toContain("announcements/index.html");
    expect(required).not.toContain("announcements/site-news/index.html");
    expect(required).not.toContain("categories/index.html");
    expect(required).not.toContain("categories/history/index.html");
    expect(required).not.toContain("collections/index.html");
    expect(required).not.toContain("collections/featured/index.html");
    expect(required).not.toContain("feed.xml");
    expect(required).not.toContain("pagefind/pagefind.js");
    expect(required).not.toContain("tags/index.html");
    expect(required).not.toContain("tags/meme history/index.html");
  });

  test("sorts source article publication stats deterministically", async () =>
    withTempRoot(async (root) => {
      await writeText(
        root,
        "src/content/articles/history/z-post.md",
        "---\ntitle: Z\ntags:\n  - Meme History\n---\n",
      );
      await writeText(
        root,
        "src/content/articles/history/a-post.md",
        "---\ntitle: A\n---\n",
      );
      await writeText(
        root,
        "src/content/articles/history/web-only.md",
        "---\ntitle: Web Only\npdf: false\n---\n",
      );

      const result = await articlePublicationStats(
        path.join(root, "src/content/articles"),
      );

      expect(result.publishedArticles.map((article) => article.slug)).toEqual([
        "a-post",
        "web-only",
        "z-post",
      ]);
      expect(
        result.publishedArticles.find((article) => article.slug === "a-post")
          ?.pdfEnabled,
      ).toBe(true);
      expect(
        result.publishedArticles.find((article) => article.slug === "web-only")
          ?.pdfEnabled,
      ).toBe(false);
      expect(Array.from(result.publishedTagSegments)).toEqual(["meme history"]);
    }));

  test("sorts source announcement publication stats deterministically", async () =>
    withTempRoot(async (root) => {
      await writeText(
        root,
        "src/content/announcements/z-news.md",
        "---\ntitle: Z\n---\n",
      );
      await writeText(
        root,
        "src/content/announcements/a-news.md",
        "---\ntitle: A\n---\n",
      );
      await writeText(
        root,
        "src/content/announcements/draft-news.md",
        "---\ntitle: Draft\ndraft: true\n---\n",
      );

      const result = await announcementPublicationStats(
        path.join(root, "src/content/announcements"),
      );

      expect(result.publishedSlugs).toEqual(["a-news", "z-news"]);
      expect(result.draftSlugs).toEqual(["draft-news"]);
    }));

  test("sorts source collection publication stats deterministically", async () =>
    withTempRoot(async (root) => {
      await writeText(
        root,
        "src/content/collections/z-list.md",
        "---\ntitle: Z\n---\n",
      );
      await writeText(
        root,
        "src/content/collections/a-list.md",
        "---\ntitle: A\n---\n",
      );
      await writeText(
        root,
        "src/content/collections/draft-list.md",
        "---\ntitle: Draft\ndraft: true\n---\n",
      );

      const result = await collectionPublicationStats(
        path.join(root, "src/content/collections"),
      );

      expect(result.publishedSlugs).toEqual(["a-list", "z-list"]);
      expect(result.draftSlugs).toEqual(["draft-list"]);
    }));

  test("chooses representative static pages without hardcoded migrated slugs", () => {
    expect(staticReadingPagesForSource(publication(), ["history"])).toEqual([
      "index.html",
      "about/index.html",
      "articles/index.html",
      "articles/all/index.html",
      "announcements/index.html",
      "authors/index.html",
      "bibliography/index.html",
      "categories/index.html",
      "collections/index.html",
      "tags/index.html",
      "articles/markdown-post/index.html",
      "categories/history/index.html",
      "tags/meme history/index.html",
    ]);
    expect(
      staticReadingPagesForSource(publication(), ["history"], ["site-news"]),
    ).toContain("announcements/site-news/index.html");
    expect(
      staticReadingPagesForSource(publication(), ["history"], [], ["featured"]),
    ).toContain("collections/featured/index.html");
  });

  test("omits disabled optional feature routes from static reading checks", () => {
    const config = parseSiteConfig({
      features: {
        announcements: false,
        bibliography: false,
        categories: false,
        collections: false,
        search: false,
        tags: false,
      },
      identity: {
        description: "A configurable publication.",
        language: "en",
        title: "Example Blog",
        url: "https://example.com",
      },
      navigation: {
        footer: [],
        primary: [],
      },
      routes: {
        allArticles: "/articles/all/",
        announcements: "/announcements/",
        articles: "/articles/",
        authors: "/authors/",
        bibliography: "/bibliography/",
        categories: "/categories/",
        collections: "/collections/",
        feed: "/feed.xml",
        home: "/",
        search: "/search/",
        tags: "/tags/",
      },
      support: {
        block: {
          body: "Keep publishing going.",
          title: "Support Example Blog",
        },
        discord: {
          href: "https://discord.gg/example",
          label: "Join Discord",
        },
        patreon: {
          href: "https://patreon.com/example",
          label: "Support Us",
        },
      },
    });

    expect(
      staticReadingPagesForSource(
        publication(),
        ["history"],
        ["site-news"],
        ["featured"],
        config,
      ),
    ).toEqual([
      "index.html",
      "about/index.html",
      "articles/index.html",
      "articles/all/index.html",
      "authors/index.html",
      "articles/markdown-post/index.html",
    ]);
  });

  test("extracts href and src link targets from built HTML", () => {
    expect(
      linkTargets(
        '<a href="/articles/example/">Example</a><img src="/_astro/image.webp">',
      ),
    ).toEqual(["/articles/example/", "/_astro/image.webp"]);
  });

  test("recognizes external URLs that should not be checked as local files", () => {
    expect(isExternal("https://example.com")).toBe(true);
    expect(isExternal("//cdn.example.com/image.png")).toBe(true);
    expect(isExternal("mailto:test@example.com")).toBe(true);
    expect(isExternal("/articles/example/")).toBe(false);
  });

  test("formats concise failure output", () => {
    expect(
      formatBuildVerificationReport({
        articlePageCount: 0,
        astroClientScriptCount: 0,
        issues: {
          articlePdfIssues: [],
          articleCountIssues: ["expected 1 article page, found 0"],
          brokenLinks: [],
          cachePolicyIssues: [],
          catalogLeaks: [],
          draftLeaks: [],
          invalidLegacyRedirects: [],
          imageAltIssues: [],
          mediaOutputIssues: [],
          metadataIssues: [],
          missingArticleJsonLd: [],
          missingLegacyRedirects: [],
          missingRequired: ["articles/example/index.html"],
          sourceMaps: [],
          socialImageIssues: [],
          unexpectedHydrationBoundaries: [],
          unexpectedClientScripts: [],
          unexpectedDatedPages: [],
        },
      }),
    ).toContain("Build verification failed.");
  });

  test("formats each build verification issue section", () => {
    const report = formatBuildVerificationReport({
      articlePageCount: 2,
      astroClientScriptCount: 1,
      issues: {
        articlePdfIssues: [
          "articles/post/post.pdf: missing PDF title metadata",
        ],
        articleCountIssues: ["expected 1 article page, found 2"],
        brokenLinks: ["index.html -> /missing/"],
        cachePolicyIssues: [
          "_headers: missing /_astro/* immutable cache header block",
        ],
        catalogLeaks: ["catalog/"],
        draftLeaks: ["feed.xml -> draft-post"],
        invalidLegacyRedirects: ["2022/01/01/post/index.html: invalid"],
        imageAltIssues: [
          "articles/post/index.html: /image.webp is missing alt",
        ],
        mediaOutputIssues: [
          "articles/post/index.html: /raw.png is not an optimized Astro asset",
        ],
        metadataIssues: ["index.html: missing meta description"],
        missingArticleJsonLd: ["articles/post/index.html"],
        missingLegacyRedirects: ["/2022/01/01/post/ -> /articles/post/"],
        missingRequired: ["feed.xml"],
        sourceMaps: ["_astro/index.js.map"],
        socialImageIssues: ["articles/post/index.html: social image invalid"],
        unexpectedHydrationBoundaries: ["articles/post/index.html"],
        unexpectedClientScripts: ["index.html"],
        unexpectedDatedPages: ["2022/01/01/post/index.html"],
      },
    });

    expect(report).toContain("Missing:");
    expect(report).toContain("Article PDF issues:");
    expect(report).toContain("Cache policy issues:");
    expect(report).toContain("Missing legacy redirects:");
    expect(report).toContain("Invalid legacy redirects:");
    expect(report).toContain("Metadata issues:");
    expect(report).toContain("Image alt issues:");
    expect(report).toContain("Media output issues:");
    expect(report).toContain("Broken links:");
    expect(report).toContain("Unexpected component catalog output:");
    expect(report).toContain("Article count mismatch:");
    expect(report).toContain("Unexpected static-page client scripts:");
    expect(report).toContain("Unexpected generated dated pages:");
    expect(report).toContain("Draft content leaked into generated metadata:");
    expect(report).toContain("Missing article JSON-LD:");
    expect(report).toContain("Unexpected source maps:");
    expect(report).toContain("Social preview image issues:");
    expect(report).toContain("Unexpected hydration boundaries:");
  });

  test("maps each build verification issue bucket to structured diagnostics", async () => {
    const result = {
      articlePageCount: 2,
      astroClientScriptCount: 1,
      issues: {
        articlePdfIssues: [
          "articles/post/post.pdf: missing PDF title metadata",
        ],
        articleCountIssues: ["expected 1 article page, found 2"],
        brokenLinks: ["index.html -> /missing/"],
        cachePolicyIssues: [
          "_headers: missing /_astro/* immutable cache header block",
        ],
        catalogLeaks: ["catalog/"],
        draftLeaks: ["feed.xml -> draft-post"],
        invalidLegacyRedirects: ["2022/01/01/post/index.html: invalid"],
        imageAltIssues: [
          "articles/post/index.html: /image.webp is missing alt",
        ],
        mediaOutputIssues: [
          "articles/post/index.html: /raw.png is not an optimized Astro asset",
        ],
        metadataIssues: ["index.html: missing meta description"],
        missingArticleJsonLd: ["articles/post/index.html"],
        missingLegacyRedirects: ["/2022/01/01/post/ -> /articles/post/"],
        missingRequired: ["feed.xml"],
        sourceMaps: ["_astro/index.js.map"],
        socialImageIssues: ["articles/post/index.html: social image invalid"],
        unexpectedHydrationBoundaries: ["articles/post/index.html"],
        unexpectedClientScripts: ["index.html -> /_astro/index.js"],
        unexpectedDatedPages: ["2022/01/01/post/index.html"],
      },
    };
    const diagnostics = buildVerificationDiagnostics(result);
    const report = buildVerificationDiagnosticReport(result);

    expect(diagnostics).toHaveLength(18);
    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "pdf.article-output-invalid",
      "cache.immutable-asset-policy-missing",
      "content.article-count-mismatch",
      "link.internal-target-missing",
      "build.catalog-leak",
      "content.draft-leak",
      "redirect.legacy-fallback-invalid",
      "html.image-alt-missing",
      "html.media-output-invalid",
      "metadata.html-invalid",
      "metadata.article-json-ld-missing",
      "redirect.legacy-fallback-missing",
      "route.required-output-missing",
      "asset.source-map-leak",
      "metadata.social-preview-invalid",
      "html.hydration-boundary-unexpected",
      "asset.client-script-unexpected",
      "route.dated-page-unexpected",
    ]);
    expect(diagnostics[12]).toMatchObject({
      location: { outputPath: "feed.xml" },
      moduleId: "build.routes",
      owner: "generated-output",
      severity: "error",
    });
    expect(report.summary).toMatchObject({
      errors: 18,
      total: 18,
      warnings: 0,
    });
    expect(report.articlePageCount).toBe(2);
    expect(report.astroClientScriptCount).toBe(1);
    const expected = parseDiagnosticReportFingerprint(
      await readFile(
        path.join(
          "tests/fixtures/build-verifier/golden-diagnostic-report.json",
        ),
        "utf8",
      ),
    );
    expect(diagnosticReportFingerprint(report)).toEqual(expected);
  });

  test("verifies built output against source articles and categories", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/published.md",
        "---\ntitle: Published\n---\n",
      );
      await writeText(
        root,
        "src/content/articles/history/draft.md",
        "---\ntitle: Draft\ndraft: true\n---\n",
      );

      await writeText(
        root,
        "dist/index.html",
        pageHtmlFixture(
          "index.html",
          '<a href="/articles/published/">Published</a>',
        ),
      );
      await writeText(
        root,
        "dist/404.html",
        pageHtmlFixture("404.html", "", { noindex: true, title: "Not Found" }),
      );
      await writeText(
        root,
        "dist/about/index.html",
        pageHtmlFixture("about/index.html"),
      );
      await writeText(
        root,
        "dist/announcements/index.html",
        pageHtmlFixture("announcements/index.html"),
      );
      await writeText(
        root,
        "dist/authors/index.html",
        pageHtmlFixture("authors/index.html"),
      );
      await writeText(
        root,
        "dist/articles/index.html",
        pageHtmlFixture("articles/index.html"),
      );
      await writeText(
        root,
        "dist/articles/all/index.html",
        pageHtmlFixture("articles/all/index.html"),
      );
      await writeText(
        root,
        "dist/bibliography/index.html",
        pageHtmlFixture("bibliography/index.html"),
      );
      await writeText(
        root,
        "dist/articles/published/index.html",
        articleHtmlFixture("published"),
      );
      await writeText(
        root,
        "dist/_astro/social-preview.jpg",
        "small social jpg",
      );
      await writeArticlePdf(root, "published");
      await writeText(
        root,
        "dist/categories/index.html",
        pageHtmlFixture("categories/index.html"),
      );
      await writeText(
        root,
        "dist/collections/index.html",
        pageHtmlFixture("collections/index.html"),
      );
      await writeText(
        root,
        "dist/tags/index.html",
        pageHtmlFixture("tags/index.html"),
      );
      await writeText(
        root,
        "dist/search/index.html",
        pageHtmlFixture("search/index.html", "", {
          noindex: true,
          title: "Search",
        }),
      );
      await writeText(
        root,
        "dist/categories/history/index.html",
        pageHtmlFixture("categories/history/index.html"),
      );
      await writeText(root, "dist/feed.xml", "<feed>published</feed>");
      await writeText(root, "dist/sitemap-index.xml", "<sitemap />");
      await writeText(root, "dist/pagefind/pagefind.js", "");

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
      });

      expect(result.articlePageCount).toBe(1);
      expect(formatBuildVerificationReport(result)).toContain(
        "Build verification passed",
      );
    }));

  test("reports article PDF Scholar metadata and file-shape regressions", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/published.md",
        "---\ntitle: Published\nauthor: Test Author\ndate: 2024-01-02\n---\n",
      );
      await writeRequiredDistShell(root);
      await writeText(
        root,
        "dist/articles/published/index.html",
        [
          '{"@type":"BlogPosting"}',
          '<meta name="citation_title" content="Published">',
          '<meta name="citation_author" content="Test Author">',
          '<meta name="citation_publication_date" content="2024/01/02">',
          '<meta name="citation_pdf_url" content="https://thephilosophersmeme.com/articles/wrong/wrong.pdf">',
          '<a href="/articles/wrong/wrong.pdf">Wrong PDF</a>',
        ].join(""),
      );
      await writeText(root, "dist/articles/published/published.pdf", "nope");

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
      });

      expect(result.issues.articlePdfIssues).toEqual([
        "articles/published/index.html: missing Save PDF link to /articles/published/published.pdf",
        "articles/published/index.html: citation_pdf_url does not point to /articles/published/published.pdf",
        "articles/published/published.pdf: generated file is not a PDF",
      ]);
    }));

  test("rejects stale PDF surfaces when an article disables generated PDFs", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/web-only.md",
        "---\ntitle: Web Only\nauthor: Test Author\npdf: false\n---\n",
      );
      await writeRequiredDistShell(root);
      await writeText(
        root,
        "dist/articles/web-only/index.html",
        articleHtmlFixture("web-only", {
          authors: ["Test Author"],
          includePdf: true,
        }),
      );
      await writeArticlePdf(root, "web-only", {
        authors: ["Test Author"],
        title: "Web Only",
      });

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
      });

      expect(result.issues.articlePdfIssues).toEqual([
        "articles/web-only/index.html: PDF disabled but Save PDF link is present for /articles/web-only/web-only.pdf",
        "articles/web-only/index.html: PDF disabled but citation_pdf_url metadata is present",
        "articles/web-only/web-only.pdf: PDF disabled but generated PDF exists",
      ]);
      expect(result.issues.missingRequired).not.toContain(
        "articles/web-only/web-only.pdf",
      );
    }));

  test("allows PDF-disabled articles with base Scholar metadata", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/web-only.md",
        "---\ntitle: Web Only\nauthor: Test Author\npdf: false\n---\n",
      );
      await writeRequiredDistShell(root);
      await writeText(
        root,
        "dist/articles/web-only/index.html",
        articleHtmlFixture("web-only", {
          authors: ["Test Author"],
          includePdf: false,
          title: "Web Only",
        }),
      );

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
      });

      expect(result.issues.articlePdfIssues).toEqual([]);
      expect(result.issues.missingRequired).not.toContain(
        "articles/web-only/web-only.pdf",
      );
    }));

  test("reports generated article PDFs over the size budget", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/published.md",
        "---\ntitle: Published\nauthor: Test Author\n---\n",
      );
      await writeRequiredDistShell(root);
      await writeText(
        root,
        "dist/articles/published/index.html",
        articleHtmlFixture("published", { authors: ["Test Author"] }),
      );
      await writeArticlePdf(root, "published", {
        authors: ["Test Author"],
        oversized: true,
      });

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
      });

      expect(result.issues.articlePdfIssues).toHaveLength(1);
      expect(result.issues.articlePdfIssues[0]).toContain(
        "above the 5242880 byte limit",
      );
    }));

  test("reports social preview metadata that points to raw or mismatched images", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/published.md",
        "---\ntitle: Published\nauthor: Test Author\n---\n",
      );
      await writeRequiredDistShell(root);
      await writeText(
        root,
        "dist/articles/published/index.html",
        [
          '<script type="application/ld+json">{"@type":"BlogPosting","image":"https://thephilosophersmeme.com/_astro/jsonld.jpg"}</script>',
          '<meta property="og:image" content="https://thephilosophersmeme.com/_astro/raw.png">',
          '<meta property="og:image:width" content="600">',
          '<meta property="og:image:height" content="315">',
          '<meta property="og:image:type" content="image/png">',
          '<meta name="twitter:image" content="https://thephilosophersmeme.com/_astro/twitter.jpg">',
          '<meta name="citation_title" content="Published">',
          '<meta name="citation_author" content="Test Author">',
          '<meta name="citation_pdf_url" content="https://thephilosophersmeme.com/articles/published/published.pdf">',
          '<a href="/articles/published/published.pdf" data-article-pdf-link>Save PDF</a>',
        ].join(""),
      );
      await writeArticlePdf(root, "published", {
        authors: ["Test Author"],
      });

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
      });

      expect(result.issues.socialImageIssues).toEqual([
        "articles/published/index.html: twitter:image does not match og:image",
        "articles/published/index.html: BlogPosting JSON-LD image does not match og:image",
        "articles/published/index.html: og:image:width is not 1200",
        "articles/published/index.html: og:image:height is not 630",
        "articles/published/index.html: og:image:type is not image/jpeg",
        "articles/published/index.html: og:image must point to a generated local JPG asset",
      ]);
    }));

  test("accepts article JSON-LD image metadata from a graph node", async () =>
    withTempRoot(async (root) => {
      const socialImage =
        "https://thephilosophersmeme.com/_astro/social-preview.jpg";

      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/published.md",
        "---\ntitle: Published\nauthor: Test Author\n---\n",
      );
      await writeRequiredDistShell(root);
      await writeText(
        root,
        "dist/articles/published/index.html",
        articleHtmlFixture("published", { authors: ["Test Author"] }).replace(
          `<script type="application/ld+json">{"@type":"BlogPosting","image":"${socialImage}"}</script>`,
          `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"BlogPosting","image":"${socialImage}"},{"@type":"Review","name":"Extra semantic node"}]}</script>`,
        ),
      );
      await writeArticlePdf(root, "published", {
        authors: ["Test Author"],
      });

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
      });

      expect(result.issues.missingArticleJsonLd).toEqual([]);
      expect(result.issues.socialImageIssues).toEqual([]);
    }));

  test("reports oversized generated social preview image files", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/published.md",
        "---\ntitle: Published\nauthor: Test Author\n---\n",
      );
      await writeRequiredDistShell(root);
      await writeFile(
        path.join(root, "dist/_astro/social-preview.jpg"),
        Buffer.alloc(maxSocialPreviewImageBytes + 1),
      );
      await writeText(
        root,
        "dist/articles/published/index.html",
        articleHtmlFixture("published", { authors: ["Test Author"] }),
      );
      await writeArticlePdf(root, "published", {
        authors: ["Test Author"],
      });

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
      });

      expect(result.issues.socialImageIssues).toEqual([
        `articles/published/index.html: social preview image is ${maxSocialPreviewImageBytes + 1} bytes, above the ${maxSocialPreviewImageBytes} byte budget`,
      ]);
    }));

  test("reports RSS item enclosures", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/published.md",
        "---\ntitle: Published\nauthor: Test Author\n---\n",
      );
      await writeRequiredDistShell(root);
      await writeText(
        root,
        "dist/feed.xml",
        '<rss><channel><item><enclosure url="https://thephilosophersmeme.com/_astro/raw.png" type="image/png" /></item></channel></rss>',
      );
      await writeText(
        root,
        "dist/articles/published/index.html",
        articleHtmlFixture("published", { authors: ["Test Author"] }),
      );
      await writeArticlePdf(root, "published", {
        authors: ["Test Author"],
      });

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
      });

      expect(result.issues.socialImageIssues).toEqual([
        "feed.xml: RSS feed must not include item enclosures; found 1",
      ]);
    }));

  test("fails normal build verification when private catalog output is present", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/published.md",
        "---\ntitle: Published\n---\n",
      );

      await writeText(root, "dist/index.html", "");
      await writeText(root, "dist/404.html", "");
      await writeText(root, "dist/about/index.html", "");
      await writeText(root, "dist/announcements/index.html", "");
      await writeText(root, "dist/authors/index.html", "");
      await writeText(root, "dist/articles/index.html", "");
      await writeText(root, "dist/articles/all/index.html", "");
      await writeText(root, "dist/bibliography/index.html", "");
      await writeText(
        root,
        "dist/articles/published/index.html",
        articleHtmlFixture("published"),
      );
      await writeArticlePdf(root, "published");
      await writeText(root, "dist/categories/index.html", "");
      await writeText(root, "dist/collections/index.html", "");
      await writeText(root, "dist/tags/index.html", "");
      await writeText(root, "dist/search/index.html", "");
      await writeText(root, "dist/categories/history/index.html", "");
      await writeText(root, "dist/feed.xml", "<feed>published</feed>");
      await writeText(root, "dist/sitemap-index.xml", "<sitemap />");
      await writeText(root, "dist/pagefind/pagefind.js", "");
      await writeText(
        root,
        "dist/_astro/social-preview.jpg",
        "small social jpg",
      );
      await writeText(root, "dist/catalog/index.html", "catalog");

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
      });

      expect(result.issues.catalogLeaks).toEqual(["catalog/"]);
    }));

  test.serial(
    "prints a quiet success from the command-line workflow",
    async () =>
      withTempRoot(async (root) => {
        const log = spyOn(console, "log").mockImplementation(() => undefined);

        try {
          await writeText(root, "astro.config.ts", "export default {};\n");
          await writeText(root, "site/content/categories/history.json", "{}");
          await writeText(
            root,
            "site/content/articles/history/published.md",
            "---\ntitle: Published\n---\n",
          );

          await writeRequiredDistShell(root);
          await writeText(
            root,
            "dist/articles/published/index.html",
            articleHtmlFixture("published"),
          );
          await writeArticlePdf(root, "published");

          const exitCode = await runBuildVerificationCli(["--quiet"], root);

          expect(exitCode).toBe(0);
          expect(log.mock.calls).toHaveLength(0);

          const loggedExitCode = await runBuildVerificationCli([], root);

          expect(loggedExitCode).toBe(0);
          expect(String(log.mock.calls[0]?.[0])).toContain(
            "Build verification passed",
          );
        } finally {
          log.mockRestore();
        }
      }),
  );

  test("reports generated output regressions without hardcoded article counts", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/published.md",
        "---\ntitle: Published\n---\n",
      );
      await writeText(
        root,
        "src/content/articles/history/draft.md",
        "---\ntitle: Draft\ndraft: true\n---\n",
      );
      await writeText(
        root,
        "src/content/announcements/hidden-announcement.md",
        "---\ntitle: Draft Announcement\ndraft: true\n---\n",
      );

      await writeText(
        root,
        "dist/index.html",
        '<script src="/_astro/index.js"></script><script type="module" src="/_astro/page.Abc123.js"></script><script type="module" src="/_astro/page.Wrapper123.js"></script><script type="module" src="/_astro/page.NotPrefetch.js"></script><script type="module" src="/_astro/ArticleImageInspectorScript.astro_astro_type_script_index_0_lang.Abc123.js"></script><script type="module" src="/_astro/AnchoredRoot.astro_astro_type_script_index_0_lang.Abc123.js"></script><astro-island></astro-island><a href="/missing/">Missing</a><a href="relative">Relative</a>',
      );
      await writeText(root, "dist/_astro/index.js", "");
      await writeText(
        root,
        "dist/_astro/page.Abc123.js",
        astroPrefetchRuntimeFixture,
      );
      await writeText(
        root,
        "dist/_astro/page.Wrapper123.js",
        'import{i}from"./_astro_prefetch.Abc123.js";i();',
      );
      await writeText(
        root,
        "dist/_astro/_astro_prefetch.Abc123.js",
        oxcNormalizedAstroPrefetchRuntimeFixture,
      );
      await writeText(root, "dist/_astro/page.NotPrefetch.js", "alert(1);");
      await writeText(
        root,
        "dist/_astro/ArticleImageInspectorScript.astro_astro_type_script_index_0_lang.Abc123.js",
        "",
      );
      await writeText(
        root,
        "dist/_astro/ArticleReferences.astro_astro_type_script_index_0_lang.Abc123.js",
        "",
      );
      await writeText(
        root,
        "dist/_astro/ArticleShareMenu.astro_astro_type_script_index_0_lang.Abc123.js",
        "",
      );
      await writeText(
        root,
        "dist/_astro/AnchoredRoot.astro_astro_type_script_index_0_lang.Abc123.js",
        "",
      );
      await writeText(root, "dist/_astro/index.js.map", "");
      await writeText(root, "dist/404.html", "");
      await writeText(root, "dist/about/index.html", "");
      await writeText(root, "dist/announcements/index.html", "");
      await writeText(root, "dist/authors/index.html", "");
      await writeText(root, "dist/articles/index.html", "");
      await writeText(root, "dist/articles/all/index.html", "");
      await writeText(root, "dist/bibliography/index.html", "");
      await writeText(
        root,
        "dist/articles/published/index.html",
        '<script type="module" src="/_astro/ArticleImageInspectorScript.astro_astro_type_script_index_0_lang.Abc123.js"></script><script type="module" src="/_astro/ArticleReferences.astro_astro_type_script_index_0_lang.Abc123.js"></script><script type="module" src="/_astro/ArticleShareMenu.astro_astro_type_script_index_0_lang.Abc123.js"></script><a href="#local">Article without JSON-LD</a>',
      );
      await writeText(root, "dist/articles/extra/index.html", "");
      await writeText(root, "dist/categories/index.html", "");
      await writeText(root, "dist/collections/index.html", "");
      await writeText(root, "dist/tags/index.html", "");
      await writeText(root, "dist/feed.xml", "<feed>draft</feed>");
      await writeText(
        root,
        "dist/sitemap-index.xml",
        "<sitemap>hidden-announcement</sitemap>",
      );
      await writeText(root, "dist/pagefind/pagefind.js", "");

      const result = await verifyBuild({
        announcementDir: path.join(root, "src/content/announcements"),
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
      });

      expect(result.issues.articleCountIssues).toEqual([
        "expected 1 article pages from published source content, found 2",
      ]);
      expect(result.issues.brokenLinks).toEqual(["index.html -> /missing/"]);
      expect(result.issues.draftLeaks).toEqual([
        "feed.xml -> draft",
        "sitemap-index.xml -> hidden-announcement",
      ]);
      expect(result.issues.missingArticleJsonLd).toEqual([
        "articles/extra/index.html",
        "articles/published/index.html",
      ]);
      expect(result.issues.missingRequired).toContain(
        "categories/history/index.html",
      );
      expect(result.issues.missingRequired).toContain(
        "articles/published/published.pdf",
      );
      expect(result.issues.sourceMaps).toEqual(["_astro/index.js.map"]);
      expect(result.issues.unexpectedHydrationBoundaries).toEqual([
        "index.html",
      ]);
      expect(result.issues.unexpectedClientScripts).toEqual([
        "index.html -> /_astro/index.js, /_astro/page.NotPrefetch.js, /_astro/ArticleImageInspectorScript.astro_astro_type_script_index_0_lang.Abc123.js",
      ]);
    }));

  test.serial(
    "prints build verification failures from the command-line workflow",
    async () =>
      withTempRoot(async (root) => {
        const error = spyOn(console, "error").mockImplementation(
          () => undefined,
        );

        try {
          await writeText(root, "astro.config.ts", "export default {};\n");
          await writeText(root, "site/content/categories/history.json", "{}");
          await writeText(
            root,
            "site/content/articles/history/published.md",
            "---\ntitle: Published\n---\n",
          );
          await writeText(root, "dist/index.html", "");
          await writeText(root, "dist/articles/index.html", "");
          await writeText(root, "dist/articles/all/index.html", "");
          await writeText(root, "dist/articles/published/index.html", "");

          const exitCode = await runBuildVerificationCli(["--quiet"], root);

          expect(exitCode).toBe(1);
          expect(String(error.mock.calls[0]?.[0])).toContain(
            "Build verification failed",
          );
        } finally {
          error.mockRestore();
        }
      }),
  );

  test.serial(
    "prints build verification JSON from the command-line workflow",
    async () =>
      withTempRoot(async (root) => {
        const log = spyOn(console, "log").mockImplementation(() => undefined);
        const error = spyOn(console, "error").mockImplementation(
          () => undefined,
        );

        try {
          await writeText(root, "astro.config.ts", "export default {};\n");
          await writeText(root, "site/content/categories/history.json", "{}");
          await writeText(
            root,
            "site/content/articles/history/published.md",
            "---\ntitle: Published\n---\n",
          );
          await writeText(root, "dist/index.html", "");
          await writeText(root, "dist/articles/index.html", "");
          await writeText(root, "dist/articles/all/index.html", "");
          await writeText(root, "dist/articles/published/index.html", "");

          const exitCode = await runBuildVerificationCli(["--json"], root);
          const output = String(log.mock.calls[0]?.[0]);
          const json: unknown = JSON.parse(output);

          expect(exitCode).toBe(1);
          expect(error.mock.calls).toHaveLength(0);
          expect(json).toHaveProperty("summary");
          expect(output).toContain('"diagnostics"');
          expect(output).toContain('"errors":');
          expect(output).toContain('"total":');
          expect(output).toContain('"metadata.html-invalid"');
        } finally {
          log.mockRestore();
          error.mockRestore();
        }
      }),
  );

  test("reports when the articles output path is not a directory", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(root, "src/content/articles/.keep", "");
      await writeText(root, "dist/index.html", "");
      await writeText(root, "dist/404.html", "");
      await writeText(root, "dist/about/index.html", "");
      await writeText(root, "dist/announcements/index.html", "");
      await writeText(root, "dist/articles", "not a directory");
      await writeText(root, "dist/bibliography/index.html", "");
      await writeText(root, "dist/categories/index.html", "");
      await writeText(root, "dist/collections/index.html", "");
      await writeText(root, "dist/tags/index.html", "");
      await writeText(root, "dist/search/index.html", "");
      await writeText(root, "dist/categories/history/index.html", "");
      await writeText(root, "dist/feed.xml", "<feed />");
      await writeText(root, "dist/sitemap-index.xml", "<sitemap />");
      await writeText(root, "dist/pagefind/pagefind.js", "");

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
      });

      expect(result.issues.missingRequired).toContain("articles/");
    }));

  test("rejects redirect fallback pages without matching configured redirects", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/published.md",
        "---\ntitle: Published\n---\n",
      );

      await writeText(root, "dist/index.html", "");
      await writeText(root, "dist/404.html", "");
      await writeText(root, "dist/about/index.html", "");
      await writeText(root, "dist/announcements/index.html", "");
      await writeText(root, "dist/authors/index.html", "");
      await writeText(root, "dist/articles/index.html", "");
      await writeText(root, "dist/articles/all/index.html", "");
      await writeText(root, "dist/bibliography/index.html", "");
      await writeText(
        root,
        "dist/articles/published/index.html",
        articleHtmlFixture("published"),
      );
      await writeArticlePdf(root, "published");
      await writeText(root, "dist/categories/index.html", "");
      await writeText(root, "dist/collections/index.html", "");
      await writeText(root, "dist/tags/index.html", "");
      await writeText(root, "dist/search/index.html", "");
      await writeText(root, "dist/categories/history/index.html", "");
      await writeText(root, "dist/feed.xml", "<feed>published</feed>");
      await writeText(root, "dist/sitemap-index.xml", "<sitemap />");
      await writeText(root, "dist/pagefind/pagefind.js", "");
      await writeText(
        root,
        "dist/_astro/social-preview.jpg",
        "small social jpg",
      );
      await writeText(
        root,
        "dist/2022/04/20/published/index.html",
        '<!doctype html><title>Redirecting to: /articles/published/</title><meta http-equiv="refresh" content="0;url=/articles/published/"><meta name="robots" content="noindex"><link rel="canonical" href="https://thephilosophersmeme.com/articles/published/"><body><a href="/articles/published/">Redirecting from <code>/2022/04/20/published/</code> to <code>/articles/published/</code></a></body>',
      );

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
      });

      expect(result.issues.invalidLegacyRedirects).toEqual([
        "2022/04/20/published/index.html: no matching redirect in astro.config.ts for /2022/04/20/published/",
      ]);
    }));

  test("allows Astro generated dated redirect fallback pages", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/published.md",
        "---\ntitle: Published\n---\n",
      );
      await writeText(
        root,
        "src/content/articles/history/draft.md",
        "---\ntitle: Draft\ndraft: true\n---\n",
      );

      await writeText(root, "dist/index.html", "");
      await writeText(root, "dist/404.html", "");
      await writeText(root, "dist/about/index.html", "");
      await writeText(root, "dist/announcements/index.html", "");
      await writeText(root, "dist/authors/index.html", "");
      await writeText(root, "dist/articles/index.html", "");
      await writeText(root, "dist/articles/all/index.html", "");
      await writeText(root, "dist/bibliography/index.html", "");
      await writeText(
        root,
        "dist/articles/published/index.html",
        articleHtmlFixture("published"),
      );
      await writeArticlePdf(root, "published");
      await writeText(root, "dist/categories/index.html", "");
      await writeText(root, "dist/collections/index.html", "");
      await writeText(root, "dist/tags/index.html", "");
      await writeText(root, "dist/search/index.html", "");
      await writeText(root, "dist/categories/history/index.html", "");
      await writeText(root, "dist/feed.xml", "<feed>published</feed>");
      await writeText(root, "dist/sitemap-index.xml", "<sitemap />");
      await writeText(root, "dist/pagefind/pagefind.js", "");
      await writeText(
        root,
        "dist/_astro/social-preview.jpg",
        "small social jpg",
      );
      await writeText(
        root,
        "dist/2022/04/20/draft/index.html",
        '<!doctype html><title>Redirecting to: /articles/draft/</title><meta http-equiv="refresh" content="0;url=/articles/draft/"><meta name="robots" content="noindex"><link rel="canonical" href="https://thephilosophersmeme.com/articles/draft/"><body><a href="/articles/draft/">Redirecting from <code>/2022/04/20/draft/</code> to <code>/articles/draft/</code></a></body>',
      );

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
        expectedRedirects: {
          "/2022/04/20/draft/": "/articles/draft/",
        },
      });

      expect(result.issues.brokenLinks).toEqual([]);
      expect(result.issues.unexpectedDatedPages).toEqual([]);
    }));

  test("allows Astro generated root redirect fallback pages", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/published.md",
        "---\ntitle: Published\n---\n",
      );

      await writeText(root, "dist/index.html", "");
      await writeText(root, "dist/404.html", "");
      await writeText(root, "dist/about/index.html", "");
      await writeText(root, "dist/announcements/index.html", "");
      await writeText(root, "dist/authors/index.html", "");
      await writeText(root, "dist/articles/index.html", "");
      await writeText(root, "dist/articles/all/index.html", "");
      await writeText(root, "dist/bibliography/index.html", "");
      await writeText(
        root,
        "dist/articles/published/index.html",
        articleHtmlFixture("published"),
      );
      await writeArticlePdf(root, "published");
      await writeText(root, "dist/categories/index.html", "");
      await writeText(root, "dist/collections/index.html", "");
      await writeText(root, "dist/tags/index.html", "");
      await writeText(root, "dist/search/index.html", "");
      await writeText(root, "dist/categories/history/index.html", "");
      await writeText(root, "dist/feed.xml", "<feed>published</feed>");
      await writeText(root, "dist/sitemap-index.xml", "<sitemap />");
      await writeText(root, "dist/pagefind/pagefind.js", "");
      await writeText(
        root,
        "dist/_astro/social-preview.jpg",
        "small social jpg",
      );
      await writeText(
        root,
        "dist/memeculture/index.html",
        '<!doctype html><title>Redirecting to: /categories/memeculture/</title><meta http-equiv="refresh" content="0;url=/categories/memeculture/"><meta name="robots" content="noindex"><link rel="canonical" href="https://thephilosophersmeme.com/categories/memeculture/"><body><a href="/categories/memeculture/">Redirecting from <code>/memeculture/</code> to <code>/categories/memeculture/</code></a></body>',
      );

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
        expectedRedirects: {
          "/memeculture/": "/categories/memeculture/",
        },
      });

      expect(result.issues.invalidLegacyRedirects).toEqual([]);
      expect(result.issues.metadataIssues).not.toContain(
        "memeculture/index.html: missing meta description",
      );
      expect(result.issues.metadataIssues).not.toContain(
        "memeculture/index.html: missing JSON-LD",
      );
    }));

  test("rejects dated pages that are not Astro redirect fallbacks", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/published.md",
        "---\ntitle: Published\n---\n",
      );

      await writeText(root, "dist/index.html", "");
      await writeText(root, "dist/404.html", "");
      await writeText(root, "dist/about/index.html", "");
      await writeText(root, "dist/announcements/index.html", "");
      await writeText(root, "dist/authors/index.html", "");
      await writeText(root, "dist/articles/index.html", "");
      await writeText(root, "dist/articles/all/index.html", "");
      await writeText(root, "dist/bibliography/index.html", "");
      await writeText(
        root,
        "dist/articles/published/index.html",
        articleHtmlFixture("published"),
      );
      await writeArticlePdf(root, "published");
      await writeText(root, "dist/categories/index.html", "");
      await writeText(root, "dist/collections/index.html", "");
      await writeText(root, "dist/tags/index.html", "");
      await writeText(root, "dist/search/index.html", "");
      await writeText(root, "dist/categories/history/index.html", "");
      await writeText(root, "dist/feed.xml", "<feed>published</feed>");
      await writeText(root, "dist/sitemap-index.xml", "<sitemap />");
      await writeText(root, "dist/pagefind/pagefind.js", "");
      await writeText(
        root,
        "dist/_astro/social-preview.jpg",
        "small social jpg",
      );
      await writeText(
        root,
        "dist/2022/04/20/not-a-redirect/index.html",
        "<html><body>Unexpected page</body></html>",
      );

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
      });

      expect(result.issues.unexpectedDatedPages).toEqual([
        "2022/04/20/not-a-redirect/index.html",
      ]);
    }));

  test("rejects redirect fallback pages that do not match configured redirects", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/published.md",
        "---\ntitle: Published\n---\n",
      );

      await writeText(root, "dist/index.html", "");
      await writeText(root, "dist/404.html", "");
      await writeText(root, "dist/about/index.html", "");
      await writeText(root, "dist/announcements/index.html", "");
      await writeText(root, "dist/authors/index.html", "");
      await writeText(root, "dist/articles/index.html", "");
      await writeText(root, "dist/articles/all/index.html", "");
      await writeText(root, "dist/bibliography/index.html", "");
      await writeText(
        root,
        "dist/articles/published/index.html",
        articleHtmlFixture("published"),
      );
      await writeArticlePdf(root, "published");
      await writeText(root, "dist/categories/index.html", "");
      await writeText(root, "dist/collections/index.html", "");
      await writeText(root, "dist/tags/index.html", "");
      await writeText(root, "dist/search/index.html", "");
      await writeText(root, "dist/categories/history/index.html", "");
      await writeText(root, "dist/feed.xml", "<feed>published</feed>");
      await writeText(root, "dist/sitemap-index.xml", "<sitemap />");
      await writeText(root, "dist/pagefind/pagefind.js", "");
      await writeText(
        root,
        "dist/_astro/social-preview.jpg",
        "small social jpg",
      );
      await writeText(
        root,
        "dist/2022/04/20/published/index.html",
        '<!doctype html><title>Redirecting to: /articles/wrong/</title><meta http-equiv="refresh" content="0;url=/articles/wrong/"><meta name="robots" content="noindex"><link rel="canonical" href="https://thephilosophersmeme.com/articles/wrong/"><body><a href="/articles/wrong/">Redirecting from <code>/2022/04/20/published/</code> to <code>/articles/wrong/</code></a></body>',
      );

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
        expectedRedirects: {
          "/2022/04/20/published/": "/articles/published/",
        },
      });

      expect(result.issues.invalidLegacyRedirects).toEqual([
        "2022/04/20/published/index.html: does not match configured redirect /2022/04/20/published/ -> /articles/published/",
      ]);
    }));

  test("reports configured redirects missing from built output", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "src/content/categories/history.json", "{}");
      await writeText(
        root,
        "src/content/articles/history/published.md",
        "---\ntitle: Published\n---\n",
      );

      await writeText(root, "dist/index.html", "");
      await writeText(root, "dist/404.html", "");
      await writeText(root, "dist/about/index.html", "");
      await writeText(root, "dist/announcements/index.html", "");
      await writeText(root, "dist/authors/index.html", "");
      await writeText(root, "dist/articles/index.html", "");
      await writeText(root, "dist/articles/all/index.html", "");
      await writeText(root, "dist/bibliography/index.html", "");
      await writeText(
        root,
        "dist/articles/published/index.html",
        articleHtmlFixture("published"),
      );
      await writeArticlePdf(root, "published");
      await writeText(root, "dist/categories/index.html", "");
      await writeText(root, "dist/collections/index.html", "");
      await writeText(root, "dist/tags/index.html", "");
      await writeText(root, "dist/search/index.html", "");
      await writeText(root, "dist/categories/history/index.html", "");
      await writeText(root, "dist/feed.xml", "<feed>published</feed>");
      await writeText(root, "dist/sitemap-index.xml", "<sitemap />");
      await writeText(root, "dist/pagefind/pagefind.js", "");
      await writeText(
        root,
        "dist/_astro/social-preview.jpg",
        "small social jpg",
      );

      const result = await verifyBuild({
        articleDir: path.join(root, "src/content/articles"),
        categoryDir: path.join(root, "src/content/categories"),
        distDir: path.join(root, "dist"),
        expectedRedirects: {
          "/2022/04/20/published/": "/articles/published/",
        },
      });

      expect(result.issues.missingLegacyRedirects).toEqual([
        "/2022/04/20/published/ -> /articles/published/ (2022/04/20/published/index.html)",
      ]);
    }));
});
