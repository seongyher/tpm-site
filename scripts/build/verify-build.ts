import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import matter from "gray-matter";
import { PDFDocument } from "pdf-lib";

import {
  articlePdfHref,
  articlePdfOutputPath,
  scholarPublicationDate,
} from "../../src/lib/article-pdf";
import { optionalFeatureRouteEntries } from "../../src/lib/feature-routes";
import { sitemapIncludesPath } from "../../src/lib/metadata";
import { type SiteConfig, siteConfig } from "../../src/lib/site-config";
import { resolveSiteInstancePaths } from "../../src/lib/site-instance";
import {
  maxSocialPreviewImageBytes,
  socialPreviewImageMimeType,
  socialPreviewImageSpec,
} from "../../src/lib/social-images";
import { normalizeTag } from "../../src/lib/tags";

const allowedStaticClientScriptPatterns = [
  /^\/_astro\/AnchoredRoot\.astro_astro_type_script_index_0_lang\.[\w-]+\.js$/u,
] as const;
const articleImageInspectorScriptPattern =
  /^\/_astro\/ArticleImageInspectorScript\.astro_astro_type_script_index_0_lang\.[\w-]+\.js$/u;
const articleCitationMenuScriptPattern =
  /^\/_astro\/ArticleCitationMenu\.astro_astro_type_script_index_0_lang\.[\w-]+\.js$/u;
const articleReferencePreviewScriptPattern =
  /^\/_astro\/ArticleReferences\.astro_astro_type_script_index_0_lang\.[\w-]+\.js$/u;
const astroPrefetchPageScriptPattern = /^\/_astro\/page\.[\w-]+\.js$/u;
const astroPrefetchChunkImportPattern =
  /from\s*["'`]\.\/(_astro_prefetch\.[\w-]+\.js)["'`]/u;
const pdfHeader = "%PDF-";
const maxArticlePdfBytes = 5 * 1024 * 1024;

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
  catalogLeaks: string[];
  draftLeaks: string[];
  imageAltIssues: string[];
  invalidLegacyRedirects: string[];
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
    ["Missing", result.issues.missingRequired],
    ["Missing legacy redirects", result.issues.missingLegacyRedirects, 50],
    ["Invalid legacy redirects", result.issues.invalidLegacyRedirects, 50],
    ["Metadata issues", result.issues.metadataIssues, 50],
    ["Image alt issues", result.issues.imageAltIssues, 50],
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
 * Checks whether a URL points outside the generated static site.
 *
 * @param url URL or URL-like target from rendered HTML.
 * @returns True for protocol-relative, absolute, mail, or telephone URLs.
 */
export function isExternal(url: string): boolean {
  // eslint-disable-next-line security/detect-unsafe-regex -- URL scheme detection is bounded to the target string.
  return /^(?:[a-z]+:)?\/\//i.test(url) || /^(?:mailto|tel):/i.test(url);
}

/**
 * Extracts link and asset targets from rendered HTML attributes.
 *
 * @param html Rendered HTML text.
 * @returns Values from `href` and `src` attributes.
 */
export function linkTargets(html: string): string[] {
  const targets: string[] = [];
  const attributePattern = /\s(?:href|src)=["']([^"']+)["']/gi;
  let match: null | RegExpExecArray;

  while ((match = attributePattern.exec(html)) !== null) {
    const target = match[1];
    if (target !== undefined) {
      targets.push(target);
    }
  }

  return targets;
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
      .map((article) => articlePdfOutputPath(article.slug)),
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

function routeChildIndexOutputPath(route: string, child: string): string {
  const basePath = routeOutputBasePath(route);

  return basePath === ""
    ? `${child}/index.html`
    : `${basePath}/${child}/index.html`;
}

function routeIndexOutputPath(route: string): string {
  const basePath = routeOutputBasePath(route);

  return basePath === "" ? "index.html" : `${basePath}/index.html`;
}

function routeOutputBasePath(route: string): string {
  return (
    route
      .split("#")[0]
      ?.split("?")[0]
      ?.replace(/^\/+|\/+$/gu, "") ?? ""
  );
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
  issues.sourceMaps.push(
    ...files
      .map((file) => toPosix(path.relative(distDir, file)))
      .filter((file) => file.endsWith(".map")),
  );

  await collectMissingRequired(distDir, requiredPaths, issues);
  await collectMissingLegacyRedirects(distDir, expectedRedirects, issues);
  if (await exists(distDir, "catalog")) {
    issues.catalogLeaks.push("catalog/");
  }

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
      await inspectFeedEnclosures(distDir, file, issues);
    }

    if (/\/?sitemap-\d+\.xml$/u.test(toPosix(path.relative(distDir, file)))) {
      await inspectSitemapPolicy(distDir, file, issues);
    }

    await inspectDraftLeaks(distDir, file, draftSlugs, issues);
  }

  await inspectArticlePdfs(
    distDir,
    articlePublication.publishedArticles,
    issues,
  );

  const articleStats = await stat(path.join(distDir, "articles"));
  if (!articleStats.isDirectory()) {
    issues.missingRequired.push("articles/");
  }

  const articlePages = articlePageFiles(files);
  const expectedArticlePages = articlePublication.publishedArticles.length;

  if (articlePages.length !== expectedArticlePages) {
    issues.articleCountIssues.push(
      `expected ${expectedArticlePages} article pages from published source content, found ${articlePages.length}`,
    );
  }

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

async function collectMissingLegacyRedirects(
  distDir: string,
  expectedRedirects: Record<string, string>,
  issues: BuildVerificationIssues,
): Promise<void> {
  for (const [source, destination] of Object.entries(expectedRedirects)) {
    const fallbackPath = redirectFallbackPath(source);
    if (!(await exists(distDir, fallbackPath))) {
      issues.missingLegacyRedirects.push(
        `${source} -> ${destination} (${fallbackPath})`,
      );
    }
  }
}

async function collectMissingRequired(
  distDir: string,
  requiredPaths: string[],
  issues: BuildVerificationIssues,
): Promise<void> {
  for (const requiredPath of requiredPaths) {
    if (!(await exists(distDir, requiredPath))) {
      issues.missingRequired.push(requiredPath);
    }
  }
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
    catalogLeaks: [],
    draftLeaks: [],
    invalidLegacyRedirects: [],
    imageAltIssues: [],
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

async function exists(distDir: string, relativePath: string): Promise<boolean> {
  try {
    await access(path.join(distDir, relativePath));
    return true;
  } catch {
    return false;
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

function expectedRedirectSource(relativeHtmlPath: string): string {
  return `/${relativeHtmlPath.replace(/index\.html$/, "")}`;
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

function htmlIncludesRedirect(
  html: string,
  source: string,
  destination: string,
): boolean {
  return (
    html.includes(`<title>Redirecting to: ${destination}</title>`) &&
    html.includes(`content="0;url=${destination}"`) &&
    html.includes(`href="${destination}"`) &&
    html.includes(`<code>${source}</code>`) &&
    html.includes(`<code>${destination}</code>`)
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

async function inspectDraftLeaks(
  distDir: string,
  file: string,
  draftSlugs: string[],
  issues: BuildVerificationIssues,
): Promise<void> {
  const relativePath = toPosix(path.relative(distDir, file));
  if (
    relativePath !== "feed.xml" &&
    !/^sitemap.*\.xml$/.test(relativePath) &&
    !relativePath.startsWith("pagefind/")
  ) {
    return;
  }

  const text = await readFile(file, "utf8");
  for (const draftSlug of draftSlugs) {
    if (text.includes(draftSlug)) {
      issues.draftLeaks.push(`${relativePath} -> ${draftSlug}`);
    }
  }
}

async function inspectFeedEnclosures(
  distDir: string,
  file: string,
  issues: BuildVerificationIssues,
): Promise<void> {
  const xml = await readFile(file, "utf8");
  const relativePath = toPosix(path.relative(distDir, file));
  const enclosureCount = Array.from(
    xml.matchAll(/<enclosure\b[^>]*>/giu),
  ).length;

  if (enclosureCount > 0) {
    issues.socialImageIssues.push(
      `${relativePath}: RSS feed must not include item enclosures; found ${enclosureCount}`,
    );
  }
}

async function inspectSitemapPolicy(
  distDir: string,
  file: string,
  issues: BuildVerificationIssues,
): Promise<void> {
  const xml = await readFile(file, "utf8");
  const relativePath = toPosix(path.relative(distDir, file));
  const locPattern = /<loc>([^<]+)<\/loc>/giu;
  let match: null | RegExpExecArray;

  while ((match = locPattern.exec(xml)) !== null) {
    const loc = match[1];
    if (loc === undefined) {
      continue;
    }

    const pathname = absoluteUrlPathname(loc);
    if (pathname === undefined) {
      issues.metadataIssues.push(
        `${relativePath}: sitemap contains invalid URL ${loc}`,
      );
    } else if (!sitemapIncludesPath(pathname)) {
      issues.metadataIssues.push(
        `${relativePath}: sitemap includes noindex route ${pathname}`,
      );
    }
  }
}

function metaContentValues(html: string, metaName: string): string[] {
  return metaContentValuesByAttribute(html, "name", metaName);
}

function metaPropertyContentValues(
  html: string,
  metaProperty: string,
): string[] {
  return metaContentValuesByAttribute(html, "property", metaProperty);
}

function metaContentValuesByAttribute(
  html: string,
  attributeName: "name" | "property",
  attributeValue: string,
): string[] {
  const values: string[] = [];
  const metaPattern = /<meta\b[^>]*>/giu;
  let match: null | RegExpExecArray;

  while ((match = metaPattern.exec(html)) !== null) {
    const tag = match[0];
    if (htmlAttributeValue(tag, attributeName) === attributeValue) {
      const content = htmlAttributeValue(tag, "content");
      if (content !== undefined) {
        values.push(decodeHtmlAttributeValue(content));
      }
    }
  }

  return values;
}

function articleJsonLdImageValues(html: string): string[] {
  const values: string[] = [];

  for (const node of articleJsonLdNodes(html)) {
    const image = node["image"];
    if (typeof image === "string") {
      values.push(image);
    }
  }

  return values;
}

function articleJsonLdNodes(html: string): Array<Record<string, unknown>> {
  return jsonLdNodesByType(html, "BlogPosting");
}

function jsonLdNodesByType(
  html: string,
  type: string,
): Array<Record<string, unknown>> {
  const nodes: Array<Record<string, unknown>> = [];

  for (const script of htmlScriptTextsByType(html, "application/ld+json")) {
    const text = script.trim();
    if (text === "") {
      continue;
    }

    try {
      const parsed = JSON.parse(text) as unknown;
      for (const node of jsonLdNodeCandidates(parsed)) {
        if (jsonLdTypeIncludes(node["@type"], type)) {
          nodes.push(node);
        }
      }
    } catch {
      // Invalid JSON-LD is reported by the generic metadata verifier.
    }
  }

  return nodes;
}

function jsonLdNodeCandidates(value: unknown): Array<Record<string, unknown>> {
  if (!isRecord(value)) {
    return [];
  }

  const candidates = [value];
  const graph = value["@graph"];
  if (Array.isArray(graph)) {
    candidates.push(...graph.filter(isRecord));
  }

  return candidates;
}

function jsonLdTypeIncludes(value: unknown, type: string): boolean {
  return (
    value === type ||
    (Array.isArray(value) &&
      value.some((entry) => typeof entry === "string" && entry === type))
  );
}

function localGeneratedSocialImagePath(
  value: string,
  distDir: string,
): string | undefined {
  const pathname = absoluteUrlPathname(value);
  if (pathname === undefined) {
    return undefined;
  }

  if (!pathname.startsWith("/_astro/") || !/\.jpe?g$/i.test(pathname)) {
    return undefined;
  }

  return path.join(distDir, decodeURIComponent(pathname.slice(1)));
}

/**
 * Extracts an absolute URL pathname without constructing a mutable URL object.
 *
 * @param value Absolute URL string.
 * @returns URL pathname, or `undefined` for non-absolute input.
 */
function absoluteUrlPathname(value: string): string | undefined {
  const authoritySeparator = value.indexOf("://");
  if (authoritySeparator <= 0) {
    return undefined;
  }

  const pathStart = value.indexOf("/", authoritySeparator + 3);
  if (pathStart === -1) {
    return "/";
  }

  const queryStart = value.indexOf("?", pathStart);
  const hashStart = value.indexOf("#", pathStart);
  const pathEndCandidates = [queryStart, hashStart].filter(
    (index) => index >= 0,
  );
  const pathEnd =
    pathEndCandidates.length === 0
      ? value.length
      : Math.min(...pathEndCandidates);

  const pathname = value.slice(pathStart, pathEnd);
  return pathname === "" ? "/" : pathname;
}

function htmlAttributeValue(
  tag: string,
  attributeName: string,
): string | undefined {
  const attributePattern = /\s([a-z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/giu;
  let match: null | RegExpExecArray;

  while ((match = attributePattern.exec(tag)) !== null) {
    if (match[1]?.toLowerCase() !== attributeName) {
      continue;
    }

    return match[2] ?? match[3];
  }

  return undefined;
}

function decodeHtmlAttributeValue(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function scholarPdfMetaMatches(value: string, pdfHref: string): boolean {
  let withoutProtocol: string | undefined;
  if (value.startsWith("https://")) {
    withoutProtocol = value.slice("https://".length);
  } else if (value.startsWith("http://")) {
    withoutProtocol = value.slice("http://".length);
  }

  if (withoutProtocol === undefined) {
    return false;
  }

  const pathStart = withoutProtocol.indexOf("/");
  if (pathStart === -1) {
    return false;
  }

  const pathAndQuery = withoutProtocol.slice(pathStart);
  const pathname = pathAndQuery.split("?")[0]?.split("#")[0] ?? "";

  return pathname === pdfHref;
}

function inspectHtmlMetadata(
  html: string,
  relativeHtmlPath: string,
  issues: BuildVerificationIssues,
): void {
  const title = htmlTitleText(html);
  const canonicalLinks = htmlTags(html, "link").filter(
    (tag) => htmlAttributeValue(tag, "rel") === "canonical",
  );
  const description = metaContentValues(html, "description")[0];
  const robots = metaContentValues(html, "robots")[0];
  const jsonLdScripts = htmlScriptTextsByType(html, "application/ld+json");

  if (title === "") {
    issues.metadataIssues.push(`${relativeHtmlPath}: missing document title`);
  }

  if (canonicalLinks.length !== 1) {
    issues.metadataIssues.push(
      `${relativeHtmlPath}: expected exactly one canonical link, found ${canonicalLinks.length}`,
    );
  } else if (
    htmlAttributeValue(canonicalLinks[0] ?? "", "href")?.trim() === ""
  ) {
    issues.metadataIssues.push(`${relativeHtmlPath}: canonical link is empty`);
  }

  if (description === undefined || description.trim() === "") {
    issues.metadataIssues.push(`${relativeHtmlPath}: missing meta description`);
  }

  if (robots === undefined || robots.trim() === "") {
    issues.metadataIssues.push(`${relativeHtmlPath}: missing robots policy`);
  }

  if (jsonLdScripts.length === 0) {
    issues.metadataIssues.push(`${relativeHtmlPath}: missing JSON-LD`);
  }

  for (const script of jsonLdScripts) {
    try {
      JSON.parse(script.trim());
    } catch {
      issues.metadataIssues.push(`${relativeHtmlPath}: invalid JSON-LD script`);
    }
  }

  inspectHtmlImageAlt(html, relativeHtmlPath, issues);

  if (robots !== undefined && !robots.includes("noindex")) {
    inspectShareableHtmlMetadata(html, relativeHtmlPath, issues);
  }
}

function inspectHtmlImageAlt(
  html: string,
  relativeHtmlPath: string,
  issues: BuildVerificationIssues,
): void {
  htmlTags(html, "img").forEach((image, index) => {
    const role = htmlAttributeValue(image, "role");
    const isDecorative =
      htmlAttributeValue(image, "aria-hidden") === "true" ||
      role === "presentation" ||
      role === "none";

    if (!isDecorative && htmlAttributeValue(image, "alt") === undefined) {
      const src = htmlAttributeValue(image, "src") ?? `image ${index + 1}`;
      issues.imageAltIssues.push(`${relativeHtmlPath}: ${src} is missing alt`);
    }
  });
}

function inspectShareableHtmlMetadata(
  html: string,
  relativeHtmlPath: string,
  issues: BuildVerificationIssues,
): void {
  const requiredMeta = [
    ["property", "og:site_name"],
    ["property", "og:locale"],
    ["property", "og:type"],
    ["property", "og:title"],
    ["property", "og:description"],
    ["property", "og:url"],
    ["property", "og:image"],
    ["name", "twitter:card"],
    ["name", "twitter:title"],
    ["name", "twitter:description"],
    ["name", "twitter:image"],
  ] as const;

  for (const [attributeName, attributeValue] of requiredMeta) {
    const value =
      attributeName === "name"
        ? metaContentValues(html, attributeValue)[0]
        : metaPropertyContentValues(html, attributeValue)[0];
    if (value === undefined || value.trim() === "") {
      issues.metadataIssues.push(
        `${relativeHtmlPath}: missing ${attributeName}="${attributeValue}" metadata`,
      );
    }
  }
}

function htmlScriptTextsByType(html: string, type: string): string[] {
  const texts: string[] = [];
  const scriptPattern = /<script(?<attributes>[^>]*)>([\s\S]*?)<\/script>/giu;
  let match: null | RegExpExecArray;

  while ((match = scriptPattern.exec(html)) !== null) {
    const attributes = match.groups?.["attributes"];
    if (
      attributes !== undefined &&
      htmlAttributeValue(`<script${attributes}>`, "type") === type
    ) {
      texts.push(match[2] ?? "");
    }
  }

  return texts;
}

function htmlTags(html: string, tagName: "img" | "link"): string[] {
  const tagPattern = tagName === "img" ? /<img\b[^>]*>/giu : /<link\b[^>]*>/giu;

  return Array.from(html.matchAll(tagPattern), (match) => match[0]);
}

function htmlTitleText(html: string): string {
  const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title>/iu.exec(html);

  return decodeHtmlAttributeValue(titleMatch?.[1]?.trim() ?? "");
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

  if (isDatedHtmlPage(relativeHtmlPath) && !isRedirectFallback) {
    issues.unexpectedDatedPages.push(relativeHtmlPath);
  }

  if (isRedirectFallback) {
    const source = expectedRedirectSource(relativeHtmlPath);
    const expectedDestination = new Map(Object.entries(expectedRedirects)).get(
      source,
    );

    if (expectedDestination === undefined) {
      issues.invalidLegacyRedirects.push(
        `${relativeHtmlPath}: no matching redirect in astro.config.ts for ${source}`,
      );
    } else if (!htmlIncludesRedirect(text, source, expectedDestination)) {
      issues.invalidLegacyRedirects.push(
        `${relativeHtmlPath}: does not match configured redirect ${source} -> ${expectedDestination}`,
      );
    }

    return;
  }

  inspectHtmlMetadata(text, relativeHtmlPath, issues);

  if (
    isArticleHtmlPath(relativeHtmlPath) &&
    articleJsonLdNodes(text).length === 0
  ) {
    issues.missingArticleJsonLd.push(relativeHtmlPath);
  }

  const article = publishedArticleByHtmlPath.get(relativeHtmlPath);
  if (article !== undefined) {
    inspectArticlePdfHtml(text, relativeHtmlPath, article, issues);
    await inspectArticleSocialImageHtml(
      text,
      relativeHtmlPath,
      distDir,
      issues,
    );
  }

  await inspectStaticReadingPageHtml(
    text,
    relativeHtmlPath,
    staticReadingPages,
    distDir,
    issues,
  );

  for (const target of linkTargets(text)) {
    if (!isExternal(target) && !(await internalTargetExists(distDir, target))) {
      issues.brokenLinks.push(`${relativeHtmlPath} -> ${target}`);
    }
  }
}

function inspectArticlePdfHtml(
  html: string,
  relativeHtmlPath: string,
  article: PublishedArticle,
  issues: BuildVerificationIssues,
): void {
  const pdfHref = articlePdfHref(article.slug);
  const pdfMetaValues = metaContentValues(html, "citation_pdf_url");
  const titleMetaValues = metaContentValues(html, "citation_title");
  const authorMetaValues = metaContentValues(html, "citation_author").map(
    decodeHtmlAttributeValue,
  );
  const publicationDateValues = metaContentValues(
    html,
    "citation_publication_date",
  );

  if (!article.pdfEnabled) {
    if (linkTargets(html).includes(pdfHref)) {
      issues.articlePdfIssues.push(
        `${relativeHtmlPath}: PDF disabled but Save PDF link is present for ${pdfHref}`,
      );
    }

    if (pdfMetaValues.length > 0) {
      issues.articlePdfIssues.push(
        `${relativeHtmlPath}: PDF disabled but citation_pdf_url metadata is present`,
      );
    }
  } else if (!linkTargets(html).includes(pdfHref)) {
    issues.articlePdfIssues.push(
      `${relativeHtmlPath}: missing Save PDF link to ${pdfHref}`,
    );
  }

  if (!article.pdfEnabled) {
    // Base Scholar metadata is still verified below for PDF-disabled articles.
  } else if (pdfMetaValues.length === 0) {
    issues.articlePdfIssues.push(
      `${relativeHtmlPath}: missing citation_pdf_url metadata`,
    );
  } else if (
    !pdfMetaValues.some((value) => scholarPdfMetaMatches(value, pdfHref))
  ) {
    issues.articlePdfIssues.push(
      `${relativeHtmlPath}: citation_pdf_url does not point to ${pdfHref}`,
    );
  }

  if (titleMetaValues.length === 0 || titleMetaValues[0]?.trim() === "") {
    issues.articlePdfIssues.push(
      `${relativeHtmlPath}: missing citation_title metadata`,
    );
  }

  for (const author of article.authors) {
    if (!authorMetaValues.includes(author)) {
      issues.articlePdfIssues.push(
        `${relativeHtmlPath}: missing citation_author metadata for ${author}`,
      );
    }
  }

  if (
    article.publicationDate !== undefined &&
    !publicationDateValues.includes(
      scholarPublicationDate(article.publicationDate),
    )
  ) {
    issues.articlePdfIssues.push(
      `${relativeHtmlPath}: missing citation_publication_date metadata`,
    );
  }
}

async function inspectArticleSocialImageHtml(
  html: string,
  relativeHtmlPath: string,
  distDir: string,
  issues: BuildVerificationIssues,
): Promise<void> {
  const ogImages = metaPropertyContentValues(html, "og:image");
  const twitterImages = metaContentValues(html, "twitter:image");
  const jsonLdImages = articleJsonLdImageValues(html);
  const ogWidths = metaPropertyContentValues(html, "og:image:width");
  const ogHeights = metaPropertyContentValues(html, "og:image:height");
  const ogTypes = metaPropertyContentValues(html, "og:image:type");

  if (ogImages.length !== 1) {
    issues.socialImageIssues.push(
      `${relativeHtmlPath}: expected exactly one og:image, found ${ogImages.length}`,
    );
  }

  if (twitterImages.length !== 1) {
    issues.socialImageIssues.push(
      `${relativeHtmlPath}: expected exactly one twitter:image, found ${twitterImages.length}`,
    );
  }

  if (jsonLdImages.length !== 1) {
    issues.socialImageIssues.push(
      `${relativeHtmlPath}: expected exactly one BlogPosting JSON-LD image, found ${jsonLdImages.length}`,
    );
  }

  const ogImage = ogImages[0];
  if (ogImage === undefined) {
    return;
  }

  if (twitterImages[0] !== undefined && twitterImages[0] !== ogImage) {
    issues.socialImageIssues.push(
      `${relativeHtmlPath}: twitter:image does not match og:image`,
    );
  }

  if (jsonLdImages[0] !== undefined && jsonLdImages[0] !== ogImage) {
    issues.socialImageIssues.push(
      `${relativeHtmlPath}: BlogPosting JSON-LD image does not match og:image`,
    );
  }

  if (ogWidths[0] !== socialPreviewImageSpec.width.toString()) {
    issues.socialImageIssues.push(
      `${relativeHtmlPath}: og:image:width is not ${socialPreviewImageSpec.width}`,
    );
  }

  if (ogHeights[0] !== socialPreviewImageSpec.height.toString()) {
    issues.socialImageIssues.push(
      `${relativeHtmlPath}: og:image:height is not ${socialPreviewImageSpec.height}`,
    );
  }

  if (ogTypes[0] !== socialPreviewImageMimeType) {
    issues.socialImageIssues.push(
      `${relativeHtmlPath}: og:image:type is not ${socialPreviewImageMimeType}`,
    );
  }

  const localImagePath = localGeneratedSocialImagePath(ogImage, distDir);
  if (localImagePath === undefined) {
    issues.socialImageIssues.push(
      `${relativeHtmlPath}: og:image must point to a generated local JPG asset`,
    );
    return;
  }

  try {
    const imageStats = await stat(localImagePath);
    if (imageStats.size > maxSocialPreviewImageBytes) {
      issues.socialImageIssues.push(
        `${relativeHtmlPath}: social preview image is ${imageStats.size} bytes, above the ${maxSocialPreviewImageBytes} byte budget`,
      );
    }
  } catch {
    issues.socialImageIssues.push(
      `${relativeHtmlPath}: social preview image file is missing for ${ogImage}`,
    );
  }
}

async function inspectArticlePdfs(
  distDir: string,
  articles: readonly PublishedArticle[],
  issues: BuildVerificationIssues,
): Promise<void> {
  for (const article of articles) {
    const relativePdfPath = articlePdfOutputPath(article.slug);
    const pdfExists = await exists(distDir, relativePdfPath);

    if (!article.pdfEnabled) {
      if (pdfExists) {
        issues.articlePdfIssues.push(
          `${relativePdfPath}: PDF disabled but generated PDF exists`,
        );
      }
      continue;
    }

    if (!pdfExists) {
      continue;
    }

    const data = await readFile(path.join(distDir, relativePdfPath));
    const header = new TextDecoder().decode(data.subarray(0, pdfHeader.length));

    if (header !== pdfHeader) {
      issues.articlePdfIssues.push(
        `${relativePdfPath}: generated file is not a PDF`,
      );
      continue;
    }

    if (data.byteLength > maxArticlePdfBytes) {
      issues.articlePdfIssues.push(
        `${relativePdfPath}: generated PDF is ${data.byteLength} bytes, above the ${maxArticlePdfBytes} byte limit`,
      );
    }

    await inspectArticlePdfDocumentMetadata(
      relativePdfPath,
      data,
      article,
      issues,
    );
  }
}

async function inspectArticlePdfDocumentMetadata(
  relativePdfPath: string,
  data: Uint8Array,
  article: PublishedArticle,
  issues: BuildVerificationIssues,
): Promise<void> {
  try {
    const pdf = await PDFDocument.load(data);
    const expectedAuthor = article.authors.join(", ");

    if (pdf.getTitle() !== article.title) {
      issues.articlePdfIssues.push(
        `${relativePdfPath}: missing PDF title metadata`,
      );
    }

    if (expectedAuthor !== "" && pdf.getAuthor() !== expectedAuthor) {
      issues.articlePdfIssues.push(
        `${relativePdfPath}: missing PDF author metadata`,
      );
    }
  } catch (error) {
    issues.articlePdfIssues.push(
      `${relativePdfPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function inspectStaticReadingPageHtml(
  text: string,
  relativeHtmlPath: string,
  staticReadingPages: string[],
  distDir: string,
  issues: BuildVerificationIssues,
): Promise<void> {
  if (!staticReadingPages.includes(relativeHtmlPath)) {
    return;
  }

  const unexpectedScriptSources: string[] = [];

  for (const source of scriptSources(text)) {
    if (
      /^\/_astro\/[^"']+\.js$/iu.test(source) &&
      !(await isAllowedStaticClientScript(distDir, relativeHtmlPath, source))
    ) {
      unexpectedScriptSources.push(source);
    }
  }

  if (unexpectedScriptSources.length > 0) {
    issues.unexpectedClientScripts.push(
      `${relativeHtmlPath} -> ${unexpectedScriptSources.join(", ")}`,
    );
  }

  if (/<astro-island\b/i.test(text)) {
    issues.unexpectedHydrationBoundaries.push(relativeHtmlPath);
  }
}

async function isAllowedStaticClientScript(
  distDir: string,
  relativeHtmlPath: string,
  source: string,
): Promise<boolean> {
  if (
    isArticleHtmlPath(relativeHtmlPath) &&
    (articleImageInspectorScriptPattern.test(source) ||
      articleCitationMenuScriptPattern.test(source) ||
      articleReferencePreviewScriptPattern.test(source))
  ) {
    return true;
  }

  if (
    allowedStaticClientScriptPatterns.some((pattern) => pattern.test(source))
  ) {
    return true;
  }

  if (!astroPrefetchPageScriptPattern.test(source)) {
    return false;
  }

  const scriptText = await staticClientScriptText(distDir, source);
  if (isAstroPrefetchRuntime(scriptText)) {
    return true;
  }

  const prefetchChunk = astroPrefetchChunkImport(scriptText);
  if (prefetchChunk === null) {
    return false;
  }

  return isAstroPrefetchRuntime(
    await staticClientScriptText(distDir, `/_astro/${prefetchChunk}`),
  );
}

function isAstroPrefetchRuntime(scriptText: string): boolean {
  return (
    readsAstroPrefetchDataset(scriptText) &&
    supportsPrefetchLinkCapabilityCheck(scriptText) &&
    preservesSlowConnectionGuard(scriptText)
  );
}

function astroPrefetchChunkImport(scriptText: string): null | string {
  const match = astroPrefetchChunkImportPattern.exec(scriptText);
  const prefetchChunk = match?.[1];

  return prefetchChunk ?? null;
}

function preservesSlowConnectionGuard(scriptText: string): boolean {
  return (
    scriptText.includes("ignoreSlowConnection") &&
    scriptText.includes("navigator.connection")
  );
}

function readsAstroPrefetchDataset(scriptText: string): boolean {
  return /dataset\s*\.\s*astroPrefetch/u.test(scriptText);
}

function supportsPrefetchLinkCapabilityCheck(scriptText: string): boolean {
  return /relList\s*\??\.\s*supports\s*\??\.\s*\(\s*["'`]prefetch["'`]\s*\)/u.test(
    scriptText,
  );
}

async function staticClientScriptText(
  distDir: string,
  source: string,
): Promise<string> {
  try {
    return await readFile(
      path.join(distDir, source.replace(/^\//u, "")),
      "utf8",
    );
  } catch {
    return "";
  }
}

function scriptSources(html: string): string[] {
  const sources: string[] = [];
  const scriptSourcePattern = /<script\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/giu;
  let match: null | RegExpExecArray;

  while ((match = scriptSourcePattern.exec(html)) !== null) {
    const source = match[1];
    if (source !== undefined) {
      sources.push(source);
    }
  }

  return sources;
}

function isArticleHtmlPath(relativeHtmlPath: string): boolean {
  return /^articles\/(?!all\/)[^/]+\/index\.html$/.test(relativeHtmlPath);
}

async function internalTargetExists(
  distDir: string,
  url: string,
): Promise<boolean> {
  const cleanUrl = withoutFragmentAndQuery(url);
  if (cleanUrl === "" || cleanUrl.startsWith("#")) {
    return true;
  }
  if (!cleanUrl.startsWith("/")) {
    return true;
  }

  const decoded = decodeURIComponent(cleanUrl).replace(/^\//, "");
  const candidates = [
    decoded,
    path.join(decoded, "index.html"),
    decoded.endsWith("/") ? path.join(decoded, "index.html") : "",
  ].filter((candidate): candidate is string => candidate !== "");

  for (const candidate of candidates) {
    if (await exists(distDir, candidate)) {
      return true;
    }
  }

  return false;
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

function isAstroRedirectFallbackPage(
  html: string,
  relativeHtmlPath: string,
): boolean {
  return (
    /<title>Redirecting to: [^<]+<\/title>/i.test(html) &&
    /<meta\s+http-equiv=["']refresh["']\s+content=["']0;url=[^"']+["']>/i.test(
      html,
    ) &&
    /<meta\s+name=["']robots["']\s+content=["']noindex["']>/i.test(html) &&
    /<link\s+rel=["']canonical["']\s+href=["']https?:\/\/[^"']+["']>/i.test(
      html,
    ) &&
    html.includes(`<code>${expectedRedirectSource(relativeHtmlPath)}</code>`)
  );
}

function isDatedHtmlPage(relativeHtmlPath: string): boolean {
  return /^\d{4}\/\d{2}\/\d{2}\/[^/]+\/index\.html$/.test(relativeHtmlPath);
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

function redirectFallbackPath(source: string): string {
  return `${source.replace(/^\//, "")}index.html`;
}

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}

function withoutFragmentAndQuery(url: string): string {
  return url.split("#")[0]?.split("?")[0] ?? "";
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
