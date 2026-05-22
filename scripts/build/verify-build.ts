import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import matter from "gray-matter";

import { articlePdfOutputPath } from "../../src/lib/articles/article-pdf";
import { normalizeTag } from "../../src/lib/content/tags";
import {
  createOutputDiagnostic,
  createOutputVerificationReport,
  type OutputDiagnostic,
  type OutputDiagnosticCategory,
  type OutputDiagnosticCode,
  type OutputDiagnosticOwner,
  type OutputVerificationReport,
} from "../../src/lib/diagnostics/output-verification";
import { optionalFeatureRouteEntries } from "../../src/lib/routes/feature-routes";
import {
  routeChildIndexOutputPath,
  routeIndexOutputPath,
  routeOutputBasePath,
} from "../../src/lib/routes/route-registry";
import { type SiteConfig, siteConfig } from "../../src/lib/site/site-config";
import { resolveSiteInstancePaths } from "../../src/lib/site/site-instance";
import {
  verifyGeneratedAssetCachePolicy,
  verifySourceMapOutput,
  verifyStaticReadingPageAssets,
} from "./verify-build/asset-verifier";
import {
  verifyArticlePageCount,
  verifyCatalogOutput,
  verifyDraftLeaks,
} from "./verify-build/content-output-verifier";
import { verifyFeedFile } from "./verify-build/feed-verifier";
import {
  verifyHtmlImageAlt,
  verifyHtmlMediaOutput,
  verifyHydrationBoundaries,
} from "./verify-build/html-verifier";
import { verifyHtmlInternalLinks } from "./verify-build/link-verifier";
import {
  verifyArticleJsonLdPresence,
  verifyArticleSocialImageHtml,
  verifyHtmlMetadata,
} from "./verify-build/metadata-verifier";
import {
  verifyArticlePdfHtml,
  verifyArticlePdfs,
} from "./verify-build/pdf-verifier";
import {
  isAstroRedirectFallbackPage,
  verifyLegacyRedirectFallbackHtml,
  verifyMissingLegacyRedirectFallbacks,
} from "./verify-build/redirect-verifier";
import {
  verifyRenderedRoutePath,
  verifyRequiredRouteOutputs,
} from "./verify-build/route-verifier";
import { verifySitemapFile } from "./verify-build/sitemap-verifier";

export {
  verifyGeneratedAssetCachePolicy,
  verifySourceMapOutput,
  verifyStaticReadingPageAssets,
} from "./verify-build/asset-verifier";
export {
  verifyArticlePageCount,
  verifyCatalogOutput,
  verifyDraftLeaks,
} from "./verify-build/content-output-verifier";
export { verifyFeedFile, verifyFeedXml } from "./verify-build/feed-verifier";
export {
  verifyHtmlImageAlt,
  verifyHtmlMediaOutput,
  verifyHydrationBoundaries,
} from "./verify-build/html-verifier";
export { isExternal, linkTargets } from "./verify-build/link-verifier";
export { verifyHtmlInternalLinks } from "./verify-build/link-verifier";
export {
  verifyArticleJsonLdPresence,
  verifyArticleSocialImageHtml,
  verifyHtmlMetadata,
} from "./verify-build/metadata-verifier";
export {
  verifyArticlePdfHtml,
  verifyArticlePdfs,
} from "./verify-build/pdf-verifier";
export {
  isAstroRedirectFallbackPage,
  verifyLegacyRedirectFallbackHtml,
  verifyMissingLegacyRedirectFallbacks,
} from "./verify-build/redirect-verifier";
export {
  verifyRenderedRoutePath,
  verifyRequiredRouteOutputs,
} from "./verify-build/route-verifier";
export {
  verifySitemapFile,
  verifySitemapXml,
} from "./verify-build/sitemap-verifier";

/** Source-content publication state used to verify generated output. */
export interface ArticlePublication {
  draftSlugs: string[];
  publishedArticles: PublishedArticle[];
  publishedCategorySlugs: Set<string>;
  publishedTagSegments: Set<string>;
}

/** Source-content publication state used to verify generated announcements. */
export interface AnnouncementPublication {
  draftSlugs: string[];
  publishedSlugs: string[];
}

/** Source-content publication state used to verify editorial collections. */
export interface CollectionPublication {
  draftSlugs: string[];
  publishedSlugs: string[];
}

/** Categorized build verification failures. */
export interface BuildVerificationIssues {
  articleCountIssues: string[];
  articlePdfIssues: string[];
  brokenLinks: string[];
  cachePolicyIssues: string[];
  catalogLeaks: string[];
  draftLeaks: string[];
  imageAltIssues: string[];
  invalidLegacyRedirects: string[];
  mediaOutputIssues: string[];
  metadataIssues: string[];
  missingArticleJsonLd: string[];
  missingLegacyRedirects: string[];
  missingRequired: string[];
  socialImageIssues: string[];
  sourceMaps: string[];
  unexpectedClientScripts: string[];
  unexpectedDatedPages: string[];
  unexpectedHydrationBoundaries: string[];
}

type BuildVerificationIssueBucket = keyof BuildVerificationIssues;

interface BuildIssueBucketMetadata {
  category: OutputDiagnosticCategory;
  code: OutputDiagnosticCode;
  key: BuildVerificationIssueBucket;
  moduleId: string;
  owner: OutputDiagnosticOwner;
  remediation: string;
}

const buildIssueBuckets: readonly BuildIssueBucketMetadata[] = [
  {
    category: "pdf",
    code: "pdf.article-output-invalid",
    key: "articlePdfIssues",
    moduleId: "build.article-pdf",
    owner: "generated-output",
    remediation:
      "Inspect the article PDF link, Scholar metadata, generated PDF file, and PDF document metadata.",
  },
  {
    category: "cache",
    code: "cache.immutable-asset-policy-missing",
    key: "cachePolicyIssues",
    moduleId: "build.assets",
    owner: "site-config",
    remediation:
      "Keep immutable cache headers for hashed generated Astro assets.",
  },
  {
    category: "content",
    code: "content.article-count-mismatch",
    key: "articleCountIssues",
    moduleId: "build.article-pages",
    owner: "generated-output",
    remediation:
      "Compare published article source files with generated article pages.",
  },
  {
    category: "link",
    code: "link.internal-target-missing",
    key: "brokenLinks",
    moduleId: "build.links",
    owner: "content",
    remediation:
      "Update the rendered link target or generate the missing internal route.",
  },
  {
    category: "build",
    code: "build.catalog-leak",
    key: "catalogLeaks",
    moduleId: "build.catalog",
    owner: "platform",
    remediation:
      "Remove private component catalog output from the public release build.",
  },
  {
    category: "content",
    code: "content.draft-leak",
    key: "draftLeaks",
    moduleId: "build.drafts",
    owner: "content",
    remediation:
      "Remove draft entries from generated feeds, sitemaps, and search output.",
  },
  {
    category: "redirect",
    code: "redirect.legacy-fallback-invalid",
    key: "invalidLegacyRedirects",
    moduleId: "build.redirects",
    owner: "site-config",
    remediation:
      "Regenerate or correct the legacy redirect fallback so it matches configured redirects.",
  },
  {
    category: "html",
    code: "html.image-alt-missing",
    key: "imageAltIssues",
    moduleId: "build.html",
    owner: "content",
    remediation:
      "Add meaningful alt text or mark the image decorative with valid semantics.",
  },
  {
    category: "html",
    code: "html.media-output-invalid",
    key: "mediaOutputIssues",
    moduleId: "build.html",
    owner: "generated-output",
    remediation:
      "Inspect scoped article, hover, thumbnail, or embed media output.",
  },
  {
    category: "metadata",
    code: "metadata.html-invalid",
    key: "metadataIssues",
    moduleId: "build.metadata",
    owner: "generated-output",
    remediation:
      "Inspect the page metadata, robots policy, JSON-LD, sitemap policy, or share metadata.",
  },
  {
    category: "metadata",
    code: "metadata.article-json-ld-missing",
    key: "missingArticleJsonLd",
    moduleId: "build.metadata",
    owner: "generated-output",
    remediation:
      "Ensure every generated article page includes BlogPosting JSON-LD.",
  },
  {
    category: "redirect",
    code: "redirect.legacy-fallback-missing",
    key: "missingLegacyRedirects",
    moduleId: "build.redirects",
    owner: "site-config",
    remediation:
      "Generate redirect fallback output for every configured legacy redirect.",
  },
  {
    category: "route",
    code: "route.required-output-missing",
    key: "missingRequired",
    moduleId: "build.routes",
    owner: "generated-output",
    remediation:
      "Generate the required route or update feature/route expectations if the route is intentionally disabled.",
  },
  {
    category: "asset",
    code: "asset.source-map-leak",
    key: "sourceMaps",
    moduleId: "build.assets",
    owner: "platform",
    remediation: "Remove source maps from public release output.",
  },
  {
    category: "metadata",
    code: "metadata.social-preview-invalid",
    key: "socialImageIssues",
    moduleId: "build.social-preview",
    owner: "generated-output",
    remediation:
      "Ensure social preview metadata points to one generated local JPG within the configured size and dimension policy.",
  },
  {
    category: "html",
    code: "html.hydration-boundary-unexpected",
    key: "unexpectedHydrationBoundaries",
    moduleId: "build.html",
    owner: "platform",
    remediation:
      "Keep static reading pages free of unexpected hydrated islands.",
  },
  {
    category: "asset",
    code: "asset.client-script-unexpected",
    key: "unexpectedClientScripts",
    moduleId: "build.assets",
    owner: "platform",
    remediation:
      "Remove unexpected client JavaScript from static reading pages or explicitly allow a narrowly scoped script.",
  },
  {
    category: "route",
    code: "route.dated-page-unexpected",
    key: "unexpectedDatedPages",
    moduleId: "build.routes",
    owner: "generated-output",
    remediation:
      "Keep historical dated URLs as redirect fallbacks, not generated article pages.",
  },
];

/** Inputs needed to verify a completed Astro build. */
export interface BuildVerificationOptions {
  announcementDir?: string;
  articleDir: string;
  categoryDir: string;
  collectionDir?: string;
  distDir: string;
  expectedRedirects?: Record<string, string>;
}

/**
 * Reads announcement source files and separates draft and published slugs.
 *
 * @param announcementDir Source announcement directory.
 * @returns Publication stats derived from announcement frontmatter and paths.
 */
export async function announcementPublicationStats(
  announcementDir: string,
): Promise<AnnouncementPublication> {
  if (!(await pathExists(announcementDir))) {
    return { draftSlugs: [], publishedSlugs: [] };
  }

  const sourceFiles = (await listFiles(announcementDir)).filter((file) =>
    /\.mdx?$/i.test(file),
  );
  const draftSlugs: string[] = [];
  const publishedSlugs: string[] = [];

  for (const file of sourceFiles) {
    const { data } = matter(await readFile(file, "utf8"));
    if (isDraft(data, siteConfig.contentDefaults.announcements.draft)) {
      draftSlugs.push(filenameStem(file));
    } else {
      publishedSlugs.push(filenameStem(file));
    }
  }

  return {
    draftSlugs: draftSlugs.sort((left, right) => left.localeCompare(right)),
    publishedSlugs: publishedSlugs.sort((left, right) =>
      left.localeCompare(right),
    ),
  };
}

/**
 * Reads collection source files and separates draft and active collection slugs.
 *
 * @param collectionDir Source collection directory.
 * @returns Publication stats derived from collection frontmatter and paths.
 */
export async function collectionPublicationStats(
  collectionDir: string,
): Promise<CollectionPublication> {
  if (!(await pathExists(collectionDir))) {
    return { draftSlugs: [], publishedSlugs: [] };
  }

  const sourceFiles = (await listFiles(collectionDir)).filter((file) =>
    /\.mdx?$/i.test(file),
  );
  const draftSlugs: string[] = [];
  const publishedSlugs: string[] = [];

  for (const file of sourceFiles) {
    const { data } = matter(await readFile(file, "utf8"));
    if (isDraft(data, false)) {
      draftSlugs.push(filenameStem(file));
    } else {
      publishedSlugs.push(filenameStem(file));
    }
  }

  return {
    draftSlugs: draftSlugs.sort((left, right) => left.localeCompare(right)),
    publishedSlugs: publishedSlugs.sort((left, right) =>
      left.localeCompare(right),
    ),
  };
}

/** Build verification output used by reports and tests. */
export interface BuildVerificationResult {
  articlePageCount: number;
  astroClientScriptCount: number;
  issues: BuildVerificationIssues;
}

/** Machine-readable build verification report with generated-output metadata. */
export interface BuildVerificationDiagnosticReport extends OutputVerificationReport {
  articlePageCount: number;
  astroClientScriptCount: number;
}

/** Publication metadata for one non-draft article source file. */
export interface PublishedArticle {
  authors: string[];
  isMdx: boolean;
  pdfEnabled: boolean;
  publicationDate?: Date | undefined;
  slug: string;
  title: string;
}

/**
 * Reads article source files and separates draft and published article data.
 *
 * @param articleDir Source article directory.
 * @returns Publication stats derived from article frontmatter and paths.
 */
export async function articlePublicationStats(
  articleDir: string,
): Promise<ArticlePublication> {
  const articleSourceFiles = (await listFiles(articleDir)).filter((file) =>
    /\.mdx?$/i.test(file),
  );
  const draftSlugs: string[] = [];
  const publishedArticles: PublishedArticle[] = [];
  const publishedCategorySlugs = new Set<string>();
  const publishedTagSegments = new Set<string>();

  for (const file of articleSourceFiles) {
    const { data } = matter(await readFile(file, "utf8"));
    if (isDraft(data, siteConfig.contentDefaults.articles.draft)) {
      draftSlugs.push(filenameStem(file));
    } else {
      const slug = filenameStem(file);
      publishedArticles.push({
        authors: authorNames(data["author"]),
        isMdx: /\.mdx$/i.test(file),
        pdfEnabled: articlePdfEnabledFromFrontmatter(data),
        publicationDate: dateValue(data["date"]),
        slug,
        title: stringValue(data["title"]) ?? slug,
      });

      const categorySlug = categorySlugFromArticlePath(articleDir, file);
      if (categorySlug !== "") {
        publishedCategorySlugs.add(categorySlug);
      }

      for (const tag of tagsFromFrontmatter(data)) {
        publishedTagSegments.add(tag);
      }
    }
  }

  return {
    draftSlugs: draftSlugs.sort((left, right) => left.localeCompare(right)),
    publishedArticles: publishedArticles.sort((left, right) =>
      left.slug.localeCompare(right.slug),
    ),
    publishedCategorySlugs,
    publishedTagSegments,
  };
}

/**
 * Formats build verification issues for CI and local command output.
 *
 * @param result Build verification result.
 * @returns Human-readable build verification report.
 */
export function formatBuildVerificationReport(
  result: BuildVerificationResult,
): string {
  if (!hasIssues(result.issues)) {
    return `Build verification passed: ${result.articlePageCount} articles and ${result.astroClientScriptCount} Astro client script assets.`;
  }

  const lines = ["Build verification failed."];
  const sections: Array<[string, readonly string[], number?]> = [
    ["Article PDF issues", result.issues.articlePdfIssues, 50],
    ["Cache policy issues", result.issues.cachePolicyIssues, 50],
    ["Missing", result.issues.missingRequired],
    ["Missing legacy redirects", result.issues.missingLegacyRedirects, 50],
    ["Invalid legacy redirects", result.issues.invalidLegacyRedirects, 50],
    ["Metadata issues", result.issues.metadataIssues, 50],
    ["Image alt issues", result.issues.imageAltIssues, 50],
    ["Media output issues", result.issues.mediaOutputIssues, 50],
    ["Broken links", result.issues.brokenLinks, 50],
    ["Unexpected component catalog output", result.issues.catalogLeaks],
    ["Article count mismatch", result.issues.articleCountIssues],
    [
      "Unexpected static-page client scripts",
      result.issues.unexpectedClientScripts,
    ],
    ["Unexpected generated dated pages", result.issues.unexpectedDatedPages],
    ["Draft content leaked into generated metadata", result.issues.draftLeaks],
    ["Missing article JSON-LD", result.issues.missingArticleJsonLd, 50],
    ["Unexpected source maps", result.issues.sourceMaps, 50],
    ["Social preview image issues", result.issues.socialImageIssues, 50],
    [
      "Unexpected hydration boundaries",
      result.issues.unexpectedHydrationBoundaries,
      50,
    ],
  ];

  for (const [label, values, limit] of sections) {
    if (values.length > 0) {
      lines.push(
        `${label}: ${JSON.stringify(limit === undefined ? values : values.slice(0, limit))}`,
      );
    }
  }

  return lines.join("\n");
}

/**
 * Converts current build-verifier issue buckets into shared output
 * diagnostics.
 *
 * @param result Build verification result.
 * @returns Structured generated-output diagnostics.
 */
export function buildVerificationDiagnostics(
  result: BuildVerificationResult,
): OutputDiagnostic[] {
  return buildIssueBuckets.flatMap((bucket) =>
    result.issues[bucket.key].map((issue) =>
      createOutputDiagnostic({
        category: bucket.category,
        code: bucket.code,
        evidence: [`${bucket.key}: ${issue}`],
        location: buildIssueLocation(bucket.key, issue),
        message: issue,
        moduleId: bucket.moduleId,
        owner: bucket.owner,
        remediation: bucket.remediation,
        severity: "error",
      }),
    ),
  );
}

/**
 * Builds the machine-readable build-verifier report.
 *
 * @param result Build verification result.
 * @returns Structured diagnostic report with build summary fields.
 */
export function buildVerificationDiagnosticReport(
  result: BuildVerificationResult,
): BuildVerificationDiagnosticReport {
  return {
    ...createOutputVerificationReport(buildVerificationDiagnostics(result)),
    articlePageCount: result.articlePageCount,
    astroClientScriptCount: result.astroClientScriptCount,
  };
}

function buildIssueLocation(
  key: BuildVerificationIssueBucket,
  issue: string,
): OutputDiagnostic["location"] {
  switch (key) {
    case "articleCountIssues":
      return undefined;

    case "articlePdfIssues":
      return { outputPath: issue.split(": ")[0] ?? issue };

    case "brokenLinks":
      return { outputPath: issue.split(" -> ")[0] ?? issue };

    case "cachePolicyIssues":
      return { outputPath: "_headers" };

    case "catalogLeaks":
      return { outputPath: issue };

    case "draftLeaks":
      return { outputPath: issue.split(" -> ")[0] ?? issue };

    case "imageAltIssues":
      return { outputPath: issue.split(": ")[0] ?? issue };

    case "invalidLegacyRedirects":
      return { outputPath: issue.split(": ")[0] ?? issue };

    case "mediaOutputIssues":
      return { outputPath: issue.split(": ")[0] ?? issue };

    case "metadataIssues":
      return { outputPath: issue.split(": ")[0] ?? issue };

    case "missingArticleJsonLd":
      return { outputPath: issue };

    case "missingLegacyRedirects":
      return { route: issue.split(" -> ")[0] ?? issue };

    case "missingRequired":
      return { outputPath: issue };

    case "socialImageIssues":
      return { outputPath: issue.split(": ")[0] ?? issue };

    case "sourceMaps":
      return { outputPath: issue };

    case "unexpectedClientScripts":
      return { outputPath: issue.split(" -> ")[0] ?? issue };

    case "unexpectedDatedPages":
      return { outputPath: issue };

    case "unexpectedHydrationBoundaries":
      return { outputPath: issue };
  }
}

/**
 * Builds the list of required build-output paths for the current source tree.
 *
 * @param articlePublication Published article and draft metadata.
 * @param categorySlugs Category slugs expected in the output.
 * @param announcementSlugs Announcement slugs expected in the output.
 * @param collectionSlugs Collection slugs expected in the output.
 * @param config Site config that owns feature availability and routes.
 * @returns Relative `dist` paths that must exist after build.
 */
export function requiredPathsForSource(
  articlePublication: ArticlePublication,
  categorySlugs: string[],
  announcementSlugs: readonly string[] = [],
  collectionSlugs: readonly string[] = [],
  config: SiteConfig = siteConfig,
): string[] {
  return [
    ...requiredBasePathsForConfig(config),
    ...(config.features.announcements
      ? announcementSlugs.map((slug) =>
          routeChildIndexOutputPath(config.routes.announcements, slug),
        )
      : []),
    ...articlePublication.publishedArticles.map(
      (article) => `articles/${article.slug}/index.html`,
    ),
    ...articlePublication.publishedArticles
      .filter((article) => article.pdfEnabled)
      .map((article) =>
        articlePdfOutputPath(article.slug, config.routes.articles),
      ),
    ...(config.features.categories
      ? categorySlugs.map((slug) =>
          routeChildIndexOutputPath(config.routes.categories, slug),
        )
      : []),
    ...(config.features.collections
      ? collectionSlugs.map((slug) =>
          routeChildIndexOutputPath(config.routes.collections, slug),
        )
      : []),
    ...(config.features.tags
      ? Array.from(articlePublication.publishedTagSegments)
          .sort((left, right) => left.localeCompare(right))
          .map((segment) =>
            routeChildIndexOutputPath(config.routes.tags, segment),
          )
      : []),
  ];
}

/**
 * Runs the build verification command-line workflow.
 *
 * @param args Command-line arguments without the executable prefix.
 * @param rootDir Repository root to verify from.
 * @returns Process exit code.
 */
export async function runBuildVerificationCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const json = args.includes("--json");
  const quiet = args.includes("--quiet");
  const paths = resolveSiteInstancePaths({ cwd: rootDir });
  const expectedRedirects = await configuredRedirects(rootDir);
  const result = await verifyBuild({
    announcementDir: paths.content.announcements,
    articleDir: paths.content.articles,
    categoryDir: paths.content.categories,
    collectionDir: paths.content.collections,
    distDir: paths.output.dist,
    expectedRedirects,
  });
  const report = formatBuildVerificationReport(result);

  if (json) {
    console.log(JSON.stringify(buildVerificationDiagnosticReport(result)));
    return hasIssues(result.issues) ? 1 : 0;
  }

  if (hasIssues(result.issues)) {
    console.error(report);
    return 1;
  }

  if (!quiet) {
    console.log(report);
  }

  return 0;
}

/**
 * Collects all category slugs that should have generated category pages.
 *
 * @param categoryDir Source category metadata directory.
 * @param articlePublication Published article and draft metadata.
 * @returns Sorted category slugs from metadata and published article folders.
 */
export async function sourceCategorySlugs(
  categoryDir: string,
  articlePublication: ArticlePublication,
): Promise<string[]> {
  const slugs = new Set([
    ...(await categorySlugsFromMetadata(categoryDir)),
    ...articlePublication.publishedCategorySlugs,
  ]);

  return Array.from(slugs).sort((left, right) => left.localeCompare(right));
}

/**
 * Chooses representative reading pages that should stay static and lightweight.
 *
 * @param articlePublication Published article and draft metadata.
 * @param categorySlugs Category slugs expected in the output.
 * @param announcementSlugs Announcement slugs expected in the output.
 * @param collectionSlugs Collection slugs expected in the output.
 * @param config Site config that owns feature availability and routes.
 * @returns Relative `dist` paths to inspect for unexpected client scripts.
 */
export function staticReadingPagesForSource(
  articlePublication: ArticlePublication,
  categorySlugs: string[],
  announcementSlugs: readonly string[] = [],
  collectionSlugs: readonly string[] = [],
  config: SiteConfig = siteConfig,
): string[] {
  const representativeMarkdownArticle =
    articlePublication.publishedArticles.find((article) => !article.isMdx);
  const representativeTagSegment = firstSortedTagSegment(articlePublication);

  return [
    ...staticReadingBasePagesForConfig(config),
    !config.features.announcements || announcementSlugs[0] === undefined
      ? undefined
      : routeChildIndexOutputPath(
          config.routes.announcements,
          announcementSlugs[0],
        ),
    representativeMarkdownArticle === undefined
      ? undefined
      : `articles/${representativeMarkdownArticle.slug}/index.html`,
    !config.features.categories || categorySlugs[0] === undefined
      ? undefined
      : routeChildIndexOutputPath(config.routes.categories, categorySlugs[0]),
    !config.features.collections || collectionSlugs[0] === undefined
      ? undefined
      : routeChildIndexOutputPath(
          config.routes.collections,
          collectionSlugs[0],
        ),
    !config.features.tags || representativeTagSegment === undefined
      ? undefined
      : routeChildIndexOutputPath(config.routes.tags, representativeTagSegment),
  ].filter((page): page is string => page !== undefined);
}

function requiredBasePathsForConfig(config: SiteConfig): string[] {
  return [
    "index.html",
    "404.html",
    "about/index.html",
    routeIndexOutputPath(config.routes.articles),
    routeIndexOutputPath(config.routes.allArticles),
    "sitemap-index.xml",
    config.features.search ? "pagefind/pagefind.js" : undefined,
    ...optionalFeatureRouteEntries(config).map((entry) =>
      entry.enabled ? optionalFeatureBaseOutputPath(entry) : undefined,
    ),
  ].filter((item): item is string => item !== undefined);
}

function staticReadingBasePagesForConfig(config: SiteConfig): string[] {
  return [
    "index.html",
    "about/index.html",
    routeIndexOutputPath(config.routes.articles),
    routeIndexOutputPath(config.routes.allArticles),
    ...optionalFeatureRouteEntries(config)
      .filter(
        (entry) =>
          entry.enabled &&
          entry.feature !== "feed" &&
          entry.feature !== "search",
      )
      .map(optionalFeatureBaseOutputPath),
  ];
}

function optionalFeatureBaseOutputPath(
  entry: ReturnType<typeof optionalFeatureRouteEntries>[number],
): string {
  return entry.outputKind === "directory"
    ? `${entry.outputPath}/index.html`
    : entry.outputPath;
}

/**
 * Verifies that generated `dist` output matches source content expectations.
 *
 * @param options Build output, source content, and redirect expectations.
 * @param options.announcementDir Source announcement directory, when announcement output should be verified.
 * @param options.articleDir Source article directory.
 * @param options.categoryDir Source category metadata directory.
 * @param options.collectionDir Source collection directory, when collection output should be verified.
 * @param options.distDir Generated build output directory.
 * @param options.expectedRedirects Legacy redirect map from Astro config.
 * @returns Build verification result with counts and issues.
 */
export async function verifyBuild({
  announcementDir,
  articleDir,
  categoryDir,
  collectionDir,
  distDir,
  expectedRedirects = {},
}: BuildVerificationOptions): Promise<BuildVerificationResult> {
  const files = await listFiles(distDir);
  const articlePublication = await articlePublicationStats(articleDir);
  const announcementPublication =
    !siteConfig.features.announcements || announcementDir === undefined
      ? { draftSlugs: [], publishedSlugs: [] }
      : await announcementPublicationStats(announcementDir);
  const categorySlugs = siteConfig.features.categories
    ? await sourceCategorySlugs(categoryDir, articlePublication)
    : [];
  const collectionPublication =
    !siteConfig.features.collections || collectionDir === undefined
      ? { draftSlugs: [], publishedSlugs: [] }
      : await collectionPublicationStats(collectionDir);
  const requiredPaths = requiredPathsForSource(
    articlePublication,
    categorySlugs,
    announcementPublication.publishedSlugs,
    collectionPublication.publishedSlugs,
    siteConfig,
  );
  const staticReadingPages = staticReadingPagesForSource(
    articlePublication,
    categorySlugs,
    announcementPublication.publishedSlugs,
    collectionPublication.publishedSlugs,
    siteConfig,
  );
  const draftSlugs = [
    ...articlePublication.draftSlugs,
    ...announcementPublication.draftSlugs,
    ...collectionPublication.draftSlugs,
  ];
  const htmlAndXml = files.filter((file) => /\.(?:html|xml)$/i.test(file));
  const astroClientScripts = files.filter((file) =>
    /\/_astro\/.+\.js$/i.test(file),
  );
  const issues = emptyIssues();
  const publishedArticleByHtmlPath = new Map(
    articlePublication.publishedArticles.map((article) => [
      `articles/${article.slug}/index.html`,
      article,
    ]),
  );
  appendGeneratedOutputDiagnostics(
    issues,
    verifySourceMapOutput({ distDir, files }),
  );
  appendGeneratedOutputDiagnostics(
    issues,
    await verifyGeneratedAssetCachePolicy({ distDir }),
  );

  appendGeneratedOutputDiagnostics(
    issues,
    await verifyRequiredRouteOutputs({ distDir, requiredPaths }),
  );
  appendGeneratedOutputDiagnostics(
    issues,
    await verifyMissingLegacyRedirectFallbacks({ distDir, expectedRedirects }),
  );
  appendGeneratedOutputDiagnostics(issues, await verifyCatalogOutput(distDir));

  for (const file of htmlAndXml) {
    if (file.endsWith(".html")) {
      await inspectHtmlFile(
        distDir,
        file,
        publishedArticleByHtmlPath,
        staticReadingPages,
        expectedRedirects,
        issues,
      );
    }

    if (
      siteConfig.features.feed &&
      toPosix(path.relative(distDir, file)) ===
        routeOutputBasePath(siteConfig.routes.feed)
    ) {
      appendGeneratedOutputDiagnostics(
        issues,
        await verifyFeedFile({ distDir, file }),
      );
    }

    if (/\/?sitemap-\d+\.xml$/u.test(toPosix(path.relative(distDir, file)))) {
      appendGeneratedOutputDiagnostics(
        issues,
        await verifySitemapFile({ distDir, file }),
      );
    }

    appendGeneratedOutputDiagnostics(
      issues,
      await verifyDraftLeaks({ distDir, draftSlugs, file }),
    );
  }

  appendGeneratedOutputDiagnostics(
    issues,
    await verifyArticlePdfs({
      articles: articlePublication.publishedArticles,
      distDir,
    }),
  );

  const articleStats = await stat(path.join(distDir, "articles"));
  if (!articleStats.isDirectory()) {
    issues.missingRequired.push("articles/");
  }

  const articlePages = articlePageFiles(files);
  const expectedArticlePages = articlePublication.publishedArticles.length;

  appendGeneratedOutputDiagnostics(
    issues,
    verifyArticlePageCount({
      actualArticlePageCount: articlePages.length,
      expectedArticlePageCount: expectedArticlePages,
    }),
  );

  return {
    articlePageCount: articlePages.length,
    astroClientScriptCount: astroClientScripts.length,
    issues,
  };
}

function articlePageFiles(files: string[]): string[] {
  return files.filter((file) =>
    /\/articles\/(?!all\/)[^/]+\/index\.html$/.test(file),
  );
}

function categorySlugFromArticlePath(articleDir: string, file: string): string {
  return path.relative(articleDir, file).split(path.sep)[0] ?? "";
}

async function categorySlugsFromMetadata(
  categoryDir: string,
): Promise<string[]> {
  const categoryFiles = (await listFiles(categoryDir)).filter((file) =>
    /\.json$/i.test(file),
  );

  return categoryFiles.map((file) => path.basename(file, ".json"));
}

async function configuredRedirects(
  rootDir: string,
): Promise<Record<string, string>> {
  // Coverage note: this dynamic import is the boundary to Astro's user config.
  // Build-verifier behavior is tested with injected redirect maps; this guard
  // remains defensive for malformed local config modules.
  // eslint-disable-next-line no-unsanitized/method -- Fixed local config path, not user-controlled input.
  const configModule: unknown = await import(
    pathToFileURL(path.resolve(rootDir, "astro.config.ts")).href
  );

  if (!isAstroConfigModule(configModule)) {
    throw new TypeError("Astro config module has an unexpected shape.");
  }

  const redirects = configModule.default.redirects;
  if (redirects === undefined) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(redirects).map(([source, destination]) => {
      if (typeof destination !== "string") {
        throw new TypeError(
          `Expected string redirect destination for ${source}.`,
        );
      }

      return [source, destination];
    }),
  );
}

function emptyIssues(): BuildVerificationIssues {
  return {
    articlePdfIssues: [],
    articleCountIssues: [],
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
    missingRequired: [],
    sourceMaps: [],
    socialImageIssues: [],
    unexpectedHydrationBoundaries: [],
    unexpectedClientScripts: [],
    unexpectedDatedPages: [],
  };
}

function appendGeneratedOutputDiagnostics(
  issues: BuildVerificationIssues,
  diagnostics: readonly OutputDiagnostic[],
): void {
  for (const diagnostic of diagnostics) {
    switch (diagnostic.code) {
      case "asset.client-script-unexpected":
        issues.unexpectedClientScripts.push(diagnostic.message);
        break;

      case "asset.source-map-leak":
        issues.sourceMaps.push(diagnostic.message);
        break;

      case "build.catalog-leak":
        issues.catalogLeaks.push(diagnostic.message);
        break;

      case "cache.immutable-asset-policy-missing":
        issues.cachePolicyIssues.push(diagnostic.message);
        break;

      case "content.article-count-mismatch":
        issues.articleCountIssues.push(diagnostic.message);
        break;

      case "content.draft-leak":
        issues.draftLeaks.push(diagnostic.message);
        break;

      case "feed.enclosure-unexpected":
        issues.socialImageIssues.push(diagnostic.message);
        break;

      case "html.hydration-boundary-unexpected":
        issues.unexpectedHydrationBoundaries.push(diagnostic.message);
        break;

      case "html.image-alt-missing":
        issues.imageAltIssues.push(diagnostic.message);
        break;

      case "html.media-output-invalid":
        issues.mediaOutputIssues.push(diagnostic.message);
        break;

      case "link.internal-target-missing":
        issues.brokenLinks.push(diagnostic.message);
        break;

      case "metadata.article-json-ld-missing":
        issues.missingArticleJsonLd.push(diagnostic.message);
        break;

      case "metadata.html-invalid":
        issues.metadataIssues.push(diagnostic.message);
        break;

      case "metadata.social-preview-invalid":
        issues.socialImageIssues.push(diagnostic.message);
        break;

      case "pdf.article-media-invalid":
      case "pdf.article-output-invalid":
        issues.articlePdfIssues.push(diagnostic.message);
        break;

      case "redirect.legacy-fallback-invalid":
        issues.invalidLegacyRedirects.push(diagnostic.message);
        break;

      case "redirect.legacy-fallback-missing":
        issues.missingLegacyRedirects.push(diagnostic.message);
        break;

      case "route.dated-page-unexpected":
        issues.unexpectedDatedPages.push(diagnostic.message);
        break;

      case "route.required-output-missing":
        issues.missingRequired.push(diagnostic.message);
        break;

      case "sitemap.loc-invalid":
      case "sitemap.noindex-route-included":
        issues.metadataIssues.push(diagnostic.message);
        break;

      default:
        throw new Error(
          `Unsupported generated-output diagnostic code ${diagnostic.code}.`,
        );
    }
  }
}

async function pathExists(fullPath: string): Promise<boolean> {
  try {
    await access(fullPath);
    return true;
  } catch {
    return false;
  }
}

function filenameStem(file: string): string {
  return path.basename(file).replace(/\.(?:md|mdx)$/i, "");
}

function firstSortedTagSegment(
  articlePublication: ArticlePublication,
): string | undefined {
  return Array.from(articlePublication.publishedTagSegments).sort(
    (left, right) => left.localeCompare(right),
  )[0];
}

function hasIssues(issues: BuildVerificationIssues): boolean {
  return (
    issues.articlePdfIssues.length > 0 ||
    issues.articleCountIssues.length > 0 ||
    issues.brokenLinks.length > 0 ||
    issues.catalogLeaks.length > 0 ||
    issues.draftLeaks.length > 0 ||
    issues.invalidLegacyRedirects.length > 0 ||
    issues.imageAltIssues.length > 0 ||
    issues.metadataIssues.length > 0 ||
    issues.missingArticleJsonLd.length > 0 ||
    issues.missingLegacyRedirects.length > 0 ||
    issues.missingRequired.length > 0 ||
    issues.sourceMaps.length > 0 ||
    issues.socialImageIssues.length > 0 ||
    issues.unexpectedHydrationBoundaries.length > 0 ||
    issues.unexpectedClientScripts.length > 0 ||
    issues.unexpectedDatedPages.length > 0
  );
}

function tagsFromFrontmatter(data: Record<string, unknown>) {
  const tags = data["tags"];
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map(normalizeTag)
    .filter((tag) => tag !== "" && !tag.includes("/"));
}

function authorNames(value: unknown): string[] {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\s*&\s*/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function dateValue(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string") {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

async function inspectHtmlFile(
  distDir: string,
  file: string,
  publishedArticleByHtmlPath: ReadonlyMap<string, PublishedArticle>,
  staticReadingPages: string[],
  expectedRedirects: Record<string, string>,
  issues: BuildVerificationIssues,
): Promise<void> {
  const text = await readFile(file, "utf8");
  const relativeHtmlPath = toPosix(path.relative(distDir, file));
  const isRedirectFallback = isAstroRedirectFallbackPage(
    text,
    relativeHtmlPath,
  );

  appendGeneratedOutputDiagnostics(
    issues,
    verifyRenderedRoutePath({ isRedirectFallback, relativeHtmlPath }),
  );

  if (isRedirectFallback) {
    appendGeneratedOutputDiagnostics(
      issues,
      verifyLegacyRedirectFallbackHtml({
        expectedRedirects,
        html: text,
        relativeHtmlPath,
      }),
    );
    return;
  }

  appendGeneratedOutputDiagnostics(
    issues,
    verifyHtmlMetadata({ html: text, relativeHtmlPath }),
  );
  appendGeneratedOutputDiagnostics(
    issues,
    verifyHtmlImageAlt({ html: text, relativeHtmlPath }),
  );
  appendGeneratedOutputDiagnostics(
    issues,
    verifyHtmlMediaOutput({ html: text, relativeHtmlPath }),
  );

  if (isArticleHtmlPath(relativeHtmlPath)) {
    appendGeneratedOutputDiagnostics(
      issues,
      verifyArticleJsonLdPresence({ html: text, relativeHtmlPath }),
    );
  }

  const article = publishedArticleByHtmlPath.get(relativeHtmlPath);
  if (article !== undefined) {
    appendGeneratedOutputDiagnostics(
      issues,
      verifyArticlePdfHtml({
        article,
        html: text,
        relativeHtmlPath,
      }),
    );
    appendGeneratedOutputDiagnostics(
      issues,
      await verifyArticleSocialImageHtml({
        distDir,
        html: text,
        relativeHtmlPath,
      }),
    );
  }

  appendGeneratedOutputDiagnostics(
    issues,
    await verifyStaticReadingPageAssets({
      distDir,
      html: text,
      relativeHtmlPath,
      staticReadingPages,
    }),
  );
  appendGeneratedOutputDiagnostics(
    issues,
    verifyHydrationBoundaries({
      html: text,
      relativeHtmlPath,
      staticReadingPages,
    }),
  );

  appendGeneratedOutputDiagnostics(
    issues,
    await verifyHtmlInternalLinks({ distDir, html: text, relativeHtmlPath }),
  );
}

function isArticleHtmlPath(relativeHtmlPath: string): boolean {
  return /^articles\/(?!all\/)[^/]+\/index\.html$/.test(relativeHtmlPath);
}

function isAstroConfigModule(
  value: unknown,
): value is { default: { redirects?: Record<string, unknown> } } {
  // Coverage note: malformed Astro config module shapes are defensive checks
  // around dynamic import output, not normal verifier domain behavior.
  if (!isRecord(value) || !isRecord(value["default"])) {
    return false;
  }

  const redirects = value["default"]["redirects"];
  return redirects === undefined || isRecord(redirects);
}

function isDraft(
  data: Record<string, unknown>,
  defaultDraft: boolean,
): boolean {
  return typeof data["draft"] === "boolean" ? data["draft"] : defaultDraft;
}

function articlePdfEnabledFromFrontmatter(
  data: Record<string, unknown>,
): boolean {
  if (!siteConfig.features.pdf) {
    return false;
  }

  return typeof data["pdf"] === "boolean"
    ? data["pdf"]
    : siteConfig.contentDefaults.articles.pdf.enabled;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = (await readdir(dir, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}

// Coverage note: this wrapper only wires the exported CLI workflow to process
// exit state; tests exercise `runBuildVerificationCli()` directly.
if (import.meta.main) {
  try {
    process.exitCode = await runBuildVerificationCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
