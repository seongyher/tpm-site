import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import { resolveSiteInstancePaths } from "../../src/lib/site/site-instance";
import {
  type ArticleReferenceAuditArticle,
  auditArticleReferences,
} from "./audit-article-references";
import { countConvertibleHtmlLinks } from "./migrate-mechanical-article-references";

/** Options for generating the article-reference migration catalog. */
export interface ArticleReferenceCatalogOptions {
  articleDir: string;
  generatedDate: string;
  rootDir: string;
}

/** Full article-reference migration catalog. */
export interface ArticleReferenceCatalog {
  articles: readonly ArticleReferenceCatalogArticle[];
  generatedDate: string;
  totals: ArticleReferenceCatalogTotals;
}

/** Per-article catalog row and review details. */
export interface ArticleReferenceCatalogArticle {
  audit: ArticleReferenceAuditArticle;
  details: ArticleReferenceCatalogDetails;
  status: ArticleReferenceCatalogStatus;
}

/** Per-article detail groups for human review. */
export interface ArticleReferenceCatalogDetails {
  convertibleHtmlLinks: readonly ArticleReferenceCatalogLine[];
  footnoteDefinitions: readonly ArticleReferenceCatalogLine[];
  footnoteMarkers: readonly ArticleReferenceCatalogLine[];
  mediaCreditLines: readonly ArticleReferenceCatalogLine[];
  rawHtmlLinks: readonly ArticleReferenceCatalogLine[];
  referenceHeadings: readonly ArticleReferenceCatalogLine[];
}

/** One source line captured for migration review. */
export interface ArticleReferenceCatalogLine {
  line: number;
  text: string;
}

/** Aggregate catalog counts. */
export interface ArticleReferenceCatalogTotals {
  canonicalReferencesCount: number;
  cleanCount: number;
  manualRequiredCount: number;
  mechanicalSafeCount: number;
  proseLinksOnlyCount: number;
}

/** Review status for an article's reference migration state. */
export type ArticleReferenceCatalogStatus =
  | "canonical-references"
  | "clean"
  | "manual-required"
  | "mechanical-safe"
  | "prose-links-only";

const defaultOutputPath = "docs/ARTICLE_REFERENCE_CONTENT_MIGRATION.md";

/**
 * Runs the article-reference migration catalog command-line workflow.
 *
 * @param args Command-line arguments without executable prefix.
 * @param rootDir Repository root.
 * @returns Process exit code.
 */
export async function runArticleReferenceCatalogCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const sitePaths = resolveSiteInstancePaths({ cwd: rootDir });
  const writeIndex = args.indexOf("--write");
  const outputIndex = args.indexOf("--output");
  const outputPath =
    outputIndex >= 0
      ? (args.at(outputIndex + 1) ?? defaultOutputPath)
      : defaultOutputPath;
  const catalog = await articleReferenceCatalog({
    articleDir: sitePaths.content.articles,
    generatedDate: new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
      year: "numeric",
    }),
    rootDir,
  });
  const markdown = formatArticleReferenceCatalog(catalog);

  if (writeIndex >= 0) {
    const fullOutputPath = path.resolve(rootDir, outputPath);
    await mkdir(path.dirname(fullOutputPath), { recursive: true });
    await writeFile(fullOutputPath, markdown);

    if (!args.includes("--quiet")) {
      console.log(`Wrote ${toPosix(path.relative(rootDir, fullOutputPath))}`);
    }

    return 0;
  }

  if (!args.includes("--quiet")) {
    console.log(markdown);
  }

  return 0;
}

/**
 * Builds the full per-article migration catalog.
 *
 * @param options Catalog generation options.
 * @param options.articleDir Article source directory.
 * @param options.generatedDate Human-readable generation date.
 * @param options.rootDir Repository root for relative paths.
 * @returns Full catalog.
 */
export async function articleReferenceCatalog({
  articleDir,
  generatedDate,
  rootDir,
}: ArticleReferenceCatalogOptions): Promise<ArticleReferenceCatalog> {
  const audit = await auditArticleReferences({ articleDir, rootDir });
  const detailEntries = await Promise.all(
    (await listFiles(articleDir, /\.mdx?$/iu)).map(
      async (
        file,
      ): Promise<readonly [string, ArticleReferenceCatalogDetails]> => [
        toPosix(path.relative(rootDir, file)),
        articleReferenceCatalogDetails(
          matter(await readFile(file, "utf8")).content,
        ),
      ],
    ),
  );
  const detailMap = new Map<string, ArticleReferenceCatalogDetails>(
    detailEntries,
  );
  const articles = audit.articles.map((auditArticle) => {
    const details = detailMap.get(auditArticle.file) ?? emptyDetails();

    return {
      audit: auditArticle,
      details,
      status: articleReferenceCatalogStatus(auditArticle, details),
    };
  });

  return {
    articles,
    generatedDate,
    totals: catalogTotals(articles),
  };
}

/**
 * Formats the migration catalog as a Markdown review document.
 *
 * @param catalog Article reference catalog.
 * @returns Markdown catalog.
 */
export function formatArticleReferenceCatalog(
  catalog: ArticleReferenceCatalog,
): string {
  return [
    "# Article Reference Content Migration Catalog",
    "",
    `Generated from repository content on ${catalog.generatedDate}.`,
    "",
    "This catalog tracks every article's current reference-normalization status.",
    "It is intentionally conservative: ordinary prose links stay ordinary prose",
    "unless an article is explicitly edited to cite them.",
    "",
    "## Decision Report",
    "",
    "Migration decisions are recorded in",
    "[`ARTICLE_REFERENCE_MIGRATION_DECISIONS.md`](./ARTICLE_REFERENCE_MIGRATION_DECISIONS.md).",
    "Every catalog update that changes migration rules, article classification,",
    "exception handling, or content-normalization scope should add or update a",
    "decision record there.",
    "",
    "## Status Legend",
    "",
    "- `clean`: no reference-like content detected by the catalog.",
    "- `canonical-references`: canonical `note-*` or `cite-*` reference data",
    "  was detected and no manual-review patterns remain.",
    "- `prose-links-only`: only ordinary Markdown links, raw URLs, or archive",
    "  links were detected; these are not bibliography entries by default.",
    "- `mechanical-safe`: the article has simple HTML links that can be converted",
    "  to Markdown without classifying them as citations.",
    "- `manual-required`: the article has footnotes, reference sections, source",
    "  credits, structural HTML anchors, or bibliography-shaped content that",
    "  needs human review.",
    "",
    "## Mechanical Pass Scope",
    "",
    "Mechanical migration may convert only simple HTML `<a href>` links and",
    "simple HTML paragraph wrappers into normal Markdown. It must not convert",
    "footnotes, reference sections, media credits, glossary named anchors, or",
    "ordinary prose links into structured bibliography entries.",
    "",
    "## Summary",
    "",
    `- Clean articles: ${catalog.totals.cleanCount}`,
    `- Canonical-reference articles: ${catalog.totals.canonicalReferencesCount}`,
    `- Prose-links-only articles: ${catalog.totals.proseLinksOnlyCount}`,
    `- Mechanical-safe articles: ${catalog.totals.mechanicalSafeCount}`,
    `- Manual-required articles: ${catalog.totals.manualRequiredCount}`,
    "",
    "## Article Inventory",
    "",
    "| Article | Status | One-line inventory |",
    "| --- | --- | --- |",
    ...catalog.articles.map(formatInventoryRow),
    "",
    "## Article Details",
    "",
    ...catalog.articles.flatMap(formatArticleDetails),
    "",
  ].join("\n");
}

/**
 * Extracts review details from one Markdown/MDX article body.
 *
 * @param body Markdown/MDX body without frontmatter.
 * @returns Extracted detail groups.
 */
export function articleReferenceCatalogDetails(
  body: string,
): ArticleReferenceCatalogDetails {
  const lines = body.split("\n");

  return {
    convertibleHtmlLinks: matchingLines(lines, hasConvertibleHtmlLink),
    footnoteDefinitions: matchingLines(lines, hasFootnoteDefinition),
    footnoteMarkers: matchingLines(lines, hasFootnoteMarker),
    mediaCreditLines: matchingLines(lines, isMediaCreditLine),
    rawHtmlLinks: matchingLines(lines, hasRawHtmlLink),
    referenceHeadings: matchingLines(lines, isReferenceHeadingLine),
  };
}

function articleReferenceCatalogStatus(
  article: ArticleReferenceAuditArticle,
  details: ArticleReferenceCatalogDetails,
): ArticleReferenceCatalogStatus {
  if (
    article.manualReviewPatterns.length > 0 &&
    convertibleHtmlLinkCount(details) !== article.counts.rawHtmlLinkCount
  ) {
    return "manual-required";
  }

  if (details.convertibleHtmlLinks.length > 0) {
    return "mechanical-safe";
  }

  if (article.manualReviewPatterns.length > 0) {
    return "manual-required";
  }

  if (hasCanonicalReferenceData(article)) {
    return "canonical-references";
  }

  if (article.patterns.length === 0) {
    return "clean";
  }

  return "prose-links-only";
}

function catalogTotals(
  articles: readonly ArticleReferenceCatalogArticle[],
): ArticleReferenceCatalogTotals {
  return {
    canonicalReferencesCount: articles.filter(
      (article) => article.status === "canonical-references",
    ).length,
    cleanCount: articles.filter((article) => article.status === "clean").length,
    manualRequiredCount: articles.filter(
      (article) => article.status === "manual-required",
    ).length,
    mechanicalSafeCount: articles.filter(
      (article) => article.status === "mechanical-safe",
    ).length,
    proseLinksOnlyCount: articles.filter(
      (article) => article.status === "prose-links-only",
    ).length,
  };
}

function hasCanonicalReferenceData(
  article: ArticleReferenceAuditArticle,
): boolean {
  return (
    article.counts.canonicalCitationMarkerCount > 0 ||
    article.counts.canonicalNoteDefinitionCount > 0 ||
    article.counts.canonicalNoteMarkerCount > 0 ||
    article.counts.hiddenBibtexBlockCount > 0
  );
}

function emptyDetails(): ArticleReferenceCatalogDetails {
  return {
    convertibleHtmlLinks: [],
    footnoteDefinitions: [],
    footnoteMarkers: [],
    mediaCreditLines: [],
    rawHtmlLinks: [],
    referenceHeadings: [],
  };
}

function convertibleHtmlLinkCount(
  details: ArticleReferenceCatalogDetails,
): number {
  return details.convertibleHtmlLinks.reduce(
    (total, line) => total + countConvertibleHtmlLinks(line.text),
    0,
  );
}

function formatInventoryRow(article: ArticleReferenceCatalogArticle): string {
  return [
    `| \`${article.audit.file}\``,
    `\`${article.status}\``,
    `${escapeTableCell(oneLineInventory(article))} |`,
  ].join(" | ");
}

function oneLineInventory(article: ArticleReferenceCatalogArticle): string {
  return article.audit.patterns.length === 0
    ? "No reference-like content detected."
    : article.audit.patterns.join("; ");
}

function formatArticleDetails(
  article: ArticleReferenceCatalogArticle,
): string[] {
  return [
    `### \`${article.audit.file}\``,
    "",
    `Status: \`${article.status}\``,
    "",
    `Inventory: ${oneLineInventory(article)}`,
    "",
    ...formatDetailGroup(
      "Convertible HTML links",
      article.details.convertibleHtmlLinks,
    ),
    ...formatDetailGroup("Raw HTML links", article.details.rawHtmlLinks),
    ...formatDetailGroup(
      "Reference headings",
      article.details.referenceHeadings,
    ),
    ...formatDetailGroup(
      "Footnote definitions",
      article.details.footnoteDefinitions,
    ),
    ...formatDetailGroup("Footnote markers", article.details.footnoteMarkers),
    ...formatDetailGroup(
      "Media/source credit lines",
      article.details.mediaCreditLines,
    ),
  ];
}

function formatDetailGroup(
  label: string,
  lines: readonly ArticleReferenceCatalogLine[],
): string[] {
  if (lines.length === 0) {
    return [];
  }

  return [
    `${label}:`,
    "",
    ...lines.map((line) => `- Line ${line.line}: ${inlineCode(line.text)}`),
    "",
  ];
}

function matchingLines(
  lines: readonly string[],
  predicate: (line: string) => boolean,
): ArticleReferenceCatalogLine[] {
  return lines.flatMap((line, index) =>
    predicate(line)
      ? [
          {
            line: index + 1,
            text: line.trim(),
          },
        ]
      : [],
  );
}

function hasConvertibleHtmlLink(line: string): boolean {
  return countConvertibleHtmlLinks(line) > 0;
}

function hasRawHtmlLink(line: string): boolean {
  return line.includes("<a ");
}

function hasFootnoteDefinition(line: string): boolean {
  return /^ {0,3}\[\^[^\]]+\]:/u.test(line);
}

function hasFootnoteMarker(line: string): boolean {
  return /\[\^[^\]]+\](?!:)/u.test(line);
}

function isMediaCreditLine(line: string): boolean {
  return /^(?:image source|image credit|source|credit|via):\s+\S/iu.test(
    line.trim(),
  );
}

function isReferenceHeadingLine(line: string): boolean {
  return /^#{1,6}\s+(?:bibliograph(?:y|ies)|citations?|further reading|references?|sources?|source list|works cited|works consulted)\s*$/iu.test(
    line.trim(),
  );
}

async function listFiles(dir: string, pattern: RegExp): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return listFiles(fullPath, pattern);
      }

      return pattern.test(entry.name) ? [fullPath] : [];
    }),
  );

  return files.flat().sort((left, right) => left.localeCompare(right));
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/gu, "\\|");
}

function inlineCode(value: string): string {
  return `\`${value.replaceAll("`", "\\`")}\``;
}

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}

if (import.meta.main) {
  process.exitCode = await runArticleReferenceCatalogCli();
}
