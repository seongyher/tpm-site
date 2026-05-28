import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";
import matter from "gray-matter";
import { PDFDocument } from "pdf-lib";

import {
  articlePdfHref,
  articlePdfOutputPath,
} from "../../src/lib/article-pdf";
import {
  articlePdfFileSizeMediaDiagnostics,
  articlePdfRenderMediaDiagnostics,
} from "../../src/lib/media-policy";
import { siteConfig } from "../../src/lib/site-config";
import {
  projectRelativePath,
  resolveSiteInstancePaths,
  siteInstance,
} from "../../src/lib/site-instance";

const pdfHeader = "%PDF-";
const pdfCreator = `${siteConfig.identity.title} Astro PDF pipeline`;
const pdfProducer = "Playwright Chromium + pdf-lib";
const defaultMaxPdfBytes = 5 * 1024 * 1024;
const pdfImageTargetWidth = 384;

/** Metadata written into generated article PDFs. */
export interface ArticlePdfDocumentMetadata {
  authors: readonly string[];
  keywords: readonly string[];
  publicationDate?: Date | undefined;
  subject?: string | undefined;
  title: string;
}

/** One article PDF target derived from source content and build output paths. */
export interface ArticlePdfTarget {
  articleHref: string;
  metadata: ArticlePdfDocumentMetadata;
  outputPath: string;
  pdfHref: string;
  relativeOutputPath: string;
  slug: string;
  sourcePath: string;
}

/** Generated PDF result used by CLI reports and tests. */
export interface GenerateArticlePdfsResult {
  generatedCount: number;
  imageCount: number;
  issues: string[];
  optimizedImageCount: number;
}

/** Inputs for the generated article PDF workflow. */
export interface GenerateArticlePdfsOptions {
  articleDir: string;
  distDir: string;
  maxPdfBytes?: number | undefined;
}

interface ArticlePdfRenderer {
  close: () => Promise<void>;
  render: (
    target: ArticlePdfTarget,
    articleUrl: string,
  ) => Promise<ArticlePdfRenderStats>;
}

/** Article-image loading stats collected immediately before PDF rendering. */
export interface ArticlePdfRenderStats {
  articleImageCount: number;
  optimizedArticleImageCount: number;
  unloadedArticleImages: readonly string[];
  unoptimizedArticleImageSources: readonly string[];
}

/** Serializable facts collected from an article image before PDF rendering. */
export interface ArticlePdfImageSnapshot {
  alt: null | string;
  complete: boolean;
  currentSrc: string;
  naturalHeight: number;
  naturalWidth: number;
  src: null | string;
}

/** Parsed responsive image candidate used by the PDF renderer. */
export interface ArticlePdfSrcsetCandidate {
  url: string;
  width: number;
}

interface GenerateArticlePdfsDependencies {
  createRenderer?: (distDir: string) => Promise<ArticlePdfRenderer>;
}

interface StaticRouteFulfillOptions {
  body: Buffer | string;
  contentType: string;
  status: number;
}

/** Minimal element handle contract needed for PDF image preparation. */
export interface ArticlePdfImagePreparationElement {
  evaluate: <Result>(
    callback: (element: Element) => Promise<Result> | Result,
  ) => Promise<Result>;
  scrollIntoViewIfNeeded: () => Promise<void>;
}

/** Minimal locator contract needed for PDF image preparation. */
export interface ArticlePdfImagePreparationLocator {
  elementHandles: () => Promise<ArticlePdfImagePreparationElement[]>;
}

/** Minimal page contract needed for PDF image preparation. */
export interface ArticlePdfImagePreparationPage {
  evaluate: <Result>(
    callback: () => Promise<Result> | Result,
  ) => Promise<Result>;
  locator: (selector: string) => ArticlePdfImagePreparationLocator;
}

/**
 * Runs the generated article PDF command-line workflow.
 *
 * @param args Command-line arguments without the executable prefix.
 * @param rootDir Repository root.
 * @param dependencies Optional renderer dependencies for tests.
 * @returns Process exit code.
 */
export async function runGenerateArticlePdfsCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
  dependencies: GenerateArticlePdfsDependencies = {},
): Promise<number> {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return 0;
  }

  const quiet = args.includes("--quiet");

  try {
    const result = await generateArticlePdfs(
      parseOptions(args, rootDir),
      dependencies,
    );

    if (result.issues.length > 0) {
      console.error(formatGenerateArticlePdfsReport(result));
      return 1;
    }

    if (!quiet) {
      console.log(formatGenerateArticlePdfsReport(result));
    }

    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

/**
 * Generates static PDFs for every published article in a built `dist/` tree.
 *
 * @param options Source article and generated output directories.
 * @param dependencies Optional test seams for server and renderer behavior.
 * @returns PDF generation result with collected issues.
 */
export async function generateArticlePdfs(
  options: GenerateArticlePdfsOptions,
  dependencies: GenerateArticlePdfsDependencies = {},
): Promise<GenerateArticlePdfsResult> {
  const targets = await articlePdfTargets(options);
  const renderer = await (
    dependencies.createRenderer ?? createPlaywrightRenderer
  )(options.distDir);
  const issues: string[] = [];
  let generatedCount = 0;
  let imageCount = 0;
  let optimizedImageCount = 0;

  try {
    for (const target of targets) {
      try {
        await mkdir(path.dirname(target.outputPath), { recursive: true });
        const renderStats = await renderer.render(
          target,
          articlePdfLocalUrl(target.articleHref),
        );
        const renderIssues = articlePdfRenderStatsIssues(target, renderStats);

        if (renderIssues.length > 0) {
          issues.push(...renderIssues);
          continue;
        }

        imageCount += renderStats.articleImageCount;
        optimizedImageCount += renderStats.optimizedArticleImageCount;
        await applyArticlePdfMetadata(target.outputPath, target.metadata);
        const targetIssues = await validateGeneratedArticlePdf(target, {
          maxPdfBytes: options.maxPdfBytes ?? defaultMaxPdfBytes,
        });

        if (targetIssues.length === 0) {
          generatedCount += 1;
        } else {
          issues.push(...targetIssues);
        }
      } catch (error) {
        issues.push(
          `${target.relativeOutputPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  } finally {
    await renderer.close();
  }

  return {
    generatedCount,
    imageCount,
    optimizedImageCount,
    issues,
  };
}

/**
 * Derives article PDF targets from source article files.
 *
 * @param options Source article and generated output directories.
 * @param options.articleDir Source article content directory.
 * @param options.distDir Generated static build directory.
 * @returns Sorted article PDF targets.
 */
export async function articlePdfTargets({
  articleDir,
  distDir,
}: GenerateArticlePdfsOptions): Promise<ArticlePdfTarget[]> {
  const files = (await listFiles(articleDir)).filter((file) =>
    /\.mdx?$/iu.test(file),
  );
  const targets: ArticlePdfTarget[] = [];

  for (const file of files) {
    const { data } = matter(await readFile(file, "utf8"));
    if (isDraft(data) || articlePdfDisabled(data)) {
      continue;
    }

    const slug = filenameStem(file);
    const relativeOutputPath = articlePdfOutputPath(slug);

    targets.push({
      articleHref: `/articles/${slug}/`,
      metadata: articlePdfDocumentMetadata(articleDir, file, data),
      outputPath: path.join(distDir, relativeOutputPath),
      pdfHref: articlePdfHref(slug),
      relativeOutputPath,
      slug,
      sourcePath: file,
    });
  }

  return targets.sort((left, right) => left.slug.localeCompare(right.slug));
}

/**
 * Applies article document metadata to an already-rendered PDF.
 *
 * @param pdfPath Generated PDF path.
 * @param metadata Source-derived article metadata.
 */
export async function applyArticlePdfMetadata(
  pdfPath: string,
  metadata: ArticlePdfDocumentMetadata,
): Promise<void> {
  const pdf = await PDFDocument.load(await readFile(pdfPath));
  const publicationDate = metadata.publicationDate;

  pdf.setTitle(metadata.title, { showInWindowTitleBar: true });
  pdf.setAuthor(metadata.authors.join(", "));
  pdf.setCreator(pdfCreator);
  pdf.setProducer(pdfProducer);

  if (metadata.subject !== undefined && metadata.subject.trim() !== "") {
    pdf.setSubject(metadata.subject);
  }

  if (metadata.keywords.length > 0) {
    pdf.setKeywords(Array.from(metadata.keywords));
  }

  if (publicationDate !== undefined) {
    pdf.setCreationDate(publicationDate);
    pdf.setModificationDate(publicationDate);
  }

  await writeFile(pdfPath, await pdf.save({ useObjectStreams: true }));
}

/**
 * Validates generated PDF file shape, size, and document metadata.
 *
 * @param target Article PDF target.
 * @param options Validation settings.
 * @param options.maxPdfBytes Hard PDF size budget.
 * @returns Human-readable issues.
 */
export async function validateGeneratedArticlePdf(
  target: ArticlePdfTarget,
  { maxPdfBytes = defaultMaxPdfBytes }: { maxPdfBytes?: number } = {},
): Promise<string[]> {
  const issues: string[] = [];
  const data = await readFile(target.outputPath);
  const header = new TextDecoder().decode(data.subarray(0, pdfHeader.length));

  if (header !== pdfHeader) {
    return [`${target.relativeOutputPath}: generated file is not a PDF`];
  }

  if (data.byteLength > maxPdfBytes) {
    issues.push(
      ...articlePdfFileSizeMediaDiagnostics({
        byteLength: data.byteLength,
        maxBytes: maxPdfBytes,
        relativeOutputPath: target.relativeOutputPath,
      }).map((diagnostic) => diagnostic.message),
    );
  }

  const pdf = await PDFDocument.load(data);
  const expectedAuthor = target.metadata.authors.join(", ");

  if (pdf.getTitle() !== target.metadata.title) {
    issues.push(`${target.relativeOutputPath}: missing PDF title metadata`);
  }

  if (expectedAuthor !== "" && pdf.getAuthor() !== expectedAuthor) {
    issues.push(`${target.relativeOutputPath}: missing PDF author metadata`);
  }

  return issues;
}

/**
 * Converts browser render stats into release-blocking PDF generation issues.
 *
 * @param target Article PDF target.
 * @param stats Article-image loading stats collected before printing.
 * @returns Human-readable issues.
 */
export function articlePdfRenderStatsIssues(
  target: ArticlePdfTarget,
  stats: ArticlePdfRenderStats,
): string[] {
  return articlePdfRenderMediaDiagnostics({
    relativeOutputPath: target.relativeOutputPath,
    unloadedArticleImages: stats.unloadedArticleImages,
    unoptimizedArticleImageSources: stats.unoptimizedArticleImageSources,
  }).map((diagnostic) => diagnostic.message);
}

/**
 * Parses width-based `srcset` candidates from Astro-generated article images.
 *
 * @param srcset Responsive image `srcset` value.
 * @returns Width candidates sorted from smallest to largest.
 */
export function articlePdfSrcsetCandidates(
  srcset: string,
): ArticlePdfSrcsetCandidate[] {
  return srcset
    .split(",")
    .map((candidate) => srcsetCandidate(candidate))
    .filter((candidate): candidate is ArticlePdfSrcsetCandidate =>
      isSrcsetWidthCandidate(candidate),
    )
    .sort((left, right) => left.width - right.width);
}

/**
 * Finds the smallest width-based image candidate for PDF output.
 *
 * @param srcset Responsive image `srcset` value.
 * @returns The smallest candidate URL, if available.
 */
export function articlePdfSmallestSrcsetUrl(
  srcset: string,
): string | undefined {
  return articlePdfSrcsetCandidates(srcset)[0]?.url;
}

/**
 * Chooses a compact but readable article image candidate for PDF output.
 *
 * @param srcset Responsive image `srcset` value.
 * @param targetWidth Preferred raster width for print/PDF output.
 * @returns The preferred candidate URL, if available.
 */
export function articlePdfPreferredSrcsetUrl(
  srcset: string,
  targetWidth = pdfImageTargetWidth,
): string | undefined {
  const candidates = articlePdfSrcsetCandidates(srcset);

  return (
    candidates.find((candidate) => candidate.width >= targetWidth)?.url ??
    candidates.at(-1)?.url
  );
}

/**
 * Converts browser-collected image snapshots into PDF render statistics.
 *
 * @param images Serializable article image facts from the browser page.
 * @param origin Page origin used to classify Astro-optimized absolute URLs.
 * @returns Article-image render stats used by PDF diagnostics.
 */
export function articlePdfRenderStatsFromImageSnapshots(
  images: readonly ArticlePdfImageSnapshot[],
  origin: string,
): ArticlePdfRenderStats {
  const unloadedArticleImages = images.flatMap((image, index) => {
    if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
      return [];
    }

    const alt = image.alt;
    const currentSrc = image.currentSrc.trim();
    const src = image.src;

    if (alt !== null && alt.trim() !== "") {
      return [alt];
    }

    if (currentSrc !== "") {
      return [currentSrc];
    }

    if (src !== null && src.trim() !== "") {
      return [src];
    }

    return [`image ${index + 1}`];
  });
  const imageSources = images.map((image) =>
    image.currentSrc.trim() !== "" ? image.currentSrc : (image.src ?? ""),
  );
  const astroAssetPrefix = `${origin}/_astro/`;
  const isAstroOptimizedSource = (source: string) =>
    source.startsWith("/_astro/") || source.startsWith(astroAssetPrefix);
  const unoptimizedArticleImageSources = imageSources.filter((source) => {
    if (source.trim() === "") {
      return true;
    }

    return !isAstroOptimizedSource(source);
  });
  const optimizedArticleImageCount = imageSources.filter((source) =>
    isAstroOptimizedSource(source),
  ).length;

  return {
    articleImageCount: images.length,
    optimizedArticleImageCount,
    unoptimizedArticleImageSources,
    unloadedArticleImages,
  };
}

function articlePdfDocumentMetadata(
  articleDir: string,
  file: string,
  data: Record<string, unknown>,
): ArticlePdfDocumentMetadata {
  const category = categorySlug(articleDir, file);
  const tags = stringArray(data["tags"]);
  const keywords = Array.from(new Set([category, ...tags].filter(Boolean)));

  return {
    authors: authorNames(data["author"]),
    keywords,
    publicationDate: dateValue(data["date"]),
    subject: stringValue(data["description"]),
    title: stringValue(data["title"]) ?? filenameStem(file),
  };
}

async function createPlaywrightRenderer(
  distDir: string,
): Promise<ArticlePdfRenderer> {
  // Coverage note: this boundary launches Chromium and drives Playwright PDF
  // rendering. Unit tests inject `ArticlePdfRenderer` implementations and cover
  // static routing, target planning, metadata, image preparation, validation,
  // CLI reporting, and renderer cleanup without depending on a browser process.
  const resolvedDist = path.resolve(distDir);
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { height: 1056, width: 640 },
  });
  await page.route("**/*", async (route) => {
    const response = await articlePdfStaticRouteResponse(
      resolvedDist,
      articlePdfPathnameFromAbsoluteUrl(route.request().url()),
    );

    await route.fulfill(response);
  });
  await page.emulateMedia({ media: "print" });

  return {
    close: async () => {
      await browser.close();
    },
    render: async (target, articleUrl) => {
      await page.goto(articleUrl, { waitUntil: "networkidle" });
      const renderStats = await prepareArticlePdfImages(page);

      if (renderStats.unloadedArticleImages.length > 0) {
        throw new Error(
          `article images failed to load before PDF rendering: ${renderStats.unloadedArticleImages.join(", ")}`,
        );
      }

      await page.pdf({
        format: "Letter",
        outline: true,
        path: target.outputPath,
        preferCSSPageSize: true,
        printBackground: false,
        tagged: true,
      });
      return renderStats;
    },
  };
}

/**
 * Converts a site pathname into the synthetic local origin used for PDF render.
 *
 * @param pathname Site pathname to request through the static route handler.
 * @returns Absolute URL under the article PDF render origin.
 */
export function articlePdfLocalUrl(pathname: string): string {
  return `http://article-pdf.local${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

/**
 * Extracts a pathname from an absolute or path-like browser request URL.
 *
 * @param url Browser request URL.
 * @returns Pathname without query string or fragment.
 */
export function articlePdfPathnameFromAbsoluteUrl(url: string): string {
  const protocolIndex = url.indexOf("://");

  if (protocolIndex === -1) {
    return url.split("?")[0]?.split("#")[0] ?? "/";
  }

  const pathnameStart = url.indexOf("/", protocolIndex + 3);

  if (pathnameStart === -1) {
    return "/";
  }

  return url.slice(pathnameStart).split("?")[0]?.split("#")[0] ?? "/";
}

/**
 * Prepares printable article images before Playwright renders a PDF.
 *
 * @param page Browser page contract used by the PDF renderer.
 * @returns Article-image stats used by PDF diagnostics.
 */
export async function prepareArticlePdfImages(
  page: ArticlePdfImagePreparationPage,
): Promise<ArticlePdfRenderStats> {
  const allImages = await page
    .locator("img[data-article-image]")
    .elementHandles();
  const images: typeof allImages = [];

  for (const image of allImages) {
    const isPrintable = await image.evaluate(
      (element) =>
        element instanceof Element &&
        element.closest("[data-pdf-exclude]") === null,
    );

    if (isPrintable) {
      images.push(image);
    }
  }

  for (const image of images) {
    await image.evaluate((element) => {
      if (element instanceof HTMLImageElement) {
        const srcset = element.getAttribute("srcset") ?? "";
        const candidates = srcset
          .split(",")
          .map((candidate) => {
            const parts = candidate.trim().split(/\s+/u);
            const url = parts[0] ?? "";
            const descriptor = parts[1] ?? "";
            const width = descriptor.endsWith("w")
              ? Number.parseInt(descriptor.slice(0, -1), 10)
              : Number.NaN;

            return { url, width };
          })
          .filter(
            (candidate) =>
              candidate.url.trim() !== "" &&
              Number.isFinite(candidate.width) &&
              candidate.width > 0,
          )
          .sort((left, right) => left.width - right.width);
        const preferredCandidate =
          candidates.find((candidate) => candidate.width >= 384)?.url ??
          candidates.at(-1)?.url;

        if (preferredCandidate !== undefined) {
          element.removeAttribute("srcset");
          element.removeAttribute("sizes");
          element.src = preferredCandidate;
        }

        element.loading = "eager";
      }
    });
  }

  for (const image of images) {
    await image.scrollIntoViewIfNeeded();
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });
    });
    await image.evaluate(async (element) => {
      if (!(element instanceof HTMLImageElement)) {
        return;
      }

      try {
        await element.decode();
      } catch {
        // The complete/natural-size check below reports the actionable failure.
      }
    });
  }

  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });

  const { images: imageSnapshots, origin } = await page.evaluate(() => ({
    images: Array.from(
      document.querySelectorAll<HTMLImageElement>("img[data-article-image]"),
    )
      .filter((image) => image.closest("[data-pdf-exclude]") === null)
      .map((image) => ({
        alt: image.getAttribute("alt"),
        complete: image.complete,
        currentSrc: image.currentSrc,
        naturalHeight: image.naturalHeight,
        naturalWidth: image.naturalWidth,
        src: image.getAttribute("src"),
      })),
    origin: window.location.origin,
  }));

  return articlePdfRenderStatsFromImageSnapshots(imageSnapshots, origin);
}

function srcsetCandidate(
  candidate: string,
): ArticlePdfSrcsetCandidate | undefined {
  const parts = candidate.trim().split(/\s+/u);
  const url = parts[0] ?? "";
  const descriptor = parts[1] ?? "";
  const width = descriptor.endsWith("w")
    ? Number.parseInt(descriptor.slice(0, -1), 10)
    : Number.NaN;

  if (url.trim() === "" || !Number.isFinite(width) || width <= 0) {
    return undefined;
  }

  return { url, width };
}

function isSrcsetWidthCandidate(
  candidate: ArticlePdfSrcsetCandidate | undefined,
): candidate is ArticlePdfSrcsetCandidate {
  return candidate !== undefined;
}

/**
 * Reads a generated static file for Playwright route fulfillment.
 *
 * @param resolvedDist Absolute generated output directory.
 * @param pathname Browser request pathname.
 * @returns Route fulfillment shape with content type and status.
 */
export async function articlePdfStaticRouteResponse(
  resolvedDist: string,
  pathname: string,
): Promise<StaticRouteFulfillOptions> {
  const filePath = articlePdfStaticFilePath(resolvedDist, pathname);

  if (filePath === undefined) {
    return {
      body: "Not found",
      contentType: "text/plain",
      status: 404,
    };
  }

  try {
    return {
      body: await readFile(filePath),
      contentType: articlePdfContentType(filePath),
      status: 200,
    };
  } catch {
    return {
      body: "Not found",
      contentType: "text/plain",
      status: 404,
    };
  }
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
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

function parseOptions(
  args: string[],
  rootDir: string,
): GenerateArticlePdfsOptions {
  const paths = resolveSiteInstancePaths({ cwd: rootDir });

  return {
    articleDir: path.resolve(
      rootDir,
      readValueArg(args, "--articles") ??
        projectRelativePath(paths.content.articles, rootDir),
    ),
    distDir: path.resolve(
      rootDir,
      readValueArg(args, "--dir") ??
        projectRelativePath(paths.output.dist, rootDir),
    ),
  };
}

function readValueArg(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];

  if (value === undefined || value.startsWith("-")) {
    throw new Error(`Missing value for ${flag}.`);
  }

  return value;
}

/**
 * Resolves a browser pathname to a generated static file under `dist`.
 *
 * @param distDir Absolute generated output directory.
 * @param pathname Browser request pathname.
 * @returns Absolute file path, or undefined when the request escapes `dist`.
 */
export function articlePdfStaticFilePath(
  distDir: string,
  pathname: string,
): string | undefined {
  const relativePath = relativeStaticPath(decodeURIComponent(pathname));
  const resolvedFile = path.resolve(distDir, relativePath);

  if (
    resolvedFile !== distDir &&
    !resolvedFile.startsWith(`${distDir}${path.sep}`)
  ) {
    return undefined;
  }

  return resolvedFile;
}

function relativeStaticPath(pathname: string): string {
  if (pathname === "/") {
    return "index.html";
  }

  if (pathname.endsWith("/")) {
    return `${pathname.slice(1)}index.html`;
  }

  return pathname.slice(1);
}

/**
 * Returns the content type used by the PDF render static route handler.
 *
 * @param filePath Static file path.
 * @returns HTTP content type for the file extension.
 */
export function articlePdfContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".avif":
      return "image/avif";
    case ".css":
      return "text/css; charset=utf-8";
    case ".gif":
      return "image/gif";
    case ".html":
      return "text/html; charset=utf-8";
    case ".jpg":
      return "image/jpeg";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".webp":
      return "image/webp";
    case ".xml":
      return "application/xml; charset=utf-8";
    default:
      return "application/octet-stream";
  }
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

function categorySlug(articleDir: string, file: string): string {
  return toPosix(path.relative(articleDir, file)).split("/")[0] ?? "";
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

function filenameStem(file: string): string {
  return path.basename(file).replace(/\.(?:md|mdx)$/iu, "");
}

function formatGenerateArticlePdfsReport(
  result: GenerateArticlePdfsResult,
): string {
  if (result.issues.length === 0) {
    return `Generated ${result.generatedCount} article PDFs with ${result.optimizedImageCount}/${result.imageCount} optimized article images.`;
  }

  return [
    "Article PDF generation failed.",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

function isDraft(data: Record<string, unknown>): boolean {
  return typeof data["draft"] === "boolean"
    ? data["draft"]
    : siteConfig.contentDefaults.articles.draft;
}

function articlePdfDisabled(data: Record<string, unknown>): boolean {
  if (!siteConfig.features.pdf) {
    return true;
  }

  return typeof data["pdf"] === "boolean"
    ? !data["pdf"]
    : !siteConfig.contentDefaults.articles.pdf.enabled;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}

function usage(): string {
  return `Usage: just build-pdf [--dir <dir>] [--articles <dir>] [--quiet]

Generate same-directory static article PDFs from an already-built Astro dist
directory.

Default build directory: ${projectRelativePath(siteInstance.output.dist)}
Default article source directory: ${projectRelativePath(siteInstance.content.articles)}`;
}

// Coverage note: this process entrypoint is intentionally thin. Unit tests call
// `runGenerateArticlePdfsCli()` directly with injected dependencies.
if (import.meta.main) {
  try {
    process.exitCode = await runGenerateArticlePdfsCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
