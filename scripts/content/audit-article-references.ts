import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";

import { resolveSiteInstancePaths } from "../../src/lib/site/site-instance";

/** Options for the article-reference corpus audit. */
export interface ArticleReferenceAuditOptions {
  articleDir: string;
  rootDir: string;
}

/** Per-article audit result for citation-like source content. */
export interface ArticleReferenceAuditArticle {
  counts: ArticleReferenceAuditCounts;
  file: string;
  manualReviewPatterns: readonly string[];
  patterns: readonly string[];
}

/** Aggregate article-reference audit result. */
export interface ArticleReferenceAuditResult {
  articles: readonly ArticleReferenceAuditArticle[];
  manualReviewCount: number;
  totals: ArticleReferenceAuditTotals;
}

/** Counted reference-like structures detected in one article. */
export interface ArticleReferenceAuditCounts {
  archiveLinkCount: number;
  bracketReferenceLineCount: number;
  canonicalCitationMarkerCount: number;
  canonicalNoteDefinitionCount: number;
  canonicalNoteMarkerCount: number;
  hiddenBibtexBlockCount: number;
  markdownLinkCount: number;
  mediaCreditLineCount: number;
  noncanonicalFootnoteDefinitionCount: number;
  noncanonicalFootnoteMarkerCount: number;
  obsoleteCitationDefinitionCount: number;
  rawHtmlLinkCount: number;
  rawUrlCount: number;
  referenceHeadingCount: number;
  visibleBibtexBlockCount: number;
}

/** Aggregate counts across the article corpus. */
export type ArticleReferenceAuditTotals = ArticleReferenceAuditCounts & {
  articleCount: number;
};

interface AuditAstNode {
  children?: readonly AuditAstNode[] | undefined;
  lang?: null | string | undefined;
  type: string;
  url?: string | undefined;
  value?: string | undefined;
}

const emptyCounts: ArticleReferenceAuditCounts = {
  archiveLinkCount: 0,
  bracketReferenceLineCount: 0,
  canonicalCitationMarkerCount: 0,
  canonicalNoteDefinitionCount: 0,
  canonicalNoteMarkerCount: 0,
  hiddenBibtexBlockCount: 0,
  markdownLinkCount: 0,
  mediaCreditLineCount: 0,
  noncanonicalFootnoteDefinitionCount: 0,
  noncanonicalFootnoteMarkerCount: 0,
  obsoleteCitationDefinitionCount: 0,
  rawHtmlLinkCount: 0,
  rawUrlCount: 0,
  referenceHeadingCount: 0,
  visibleBibtexBlockCount: 0,
};

/**
 * Runs the article-reference audit command-line workflow.
 *
 * @param args Command-line arguments without executable prefix.
 * @param rootDir Repository root.
 * @returns Process exit code.
 */
export async function runArticleReferenceAuditCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const sitePaths = resolveSiteInstancePaths({ cwd: rootDir });
  const result = await auditArticleReferences({
    articleDir: sitePaths.content.articles,
    rootDir,
  });

  if (args.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
    return 0;
  }

  if (!args.includes("--quiet")) {
    console.log(formatArticleReferenceAudit(result));
  }

  return 0;
}

/**
 * Inventories citation-like source patterns across article Markdown and MDX.
 *
 * @param options Audit options.
 * @param options.articleDir Article source directory.
 * @param options.rootDir Repository root for report paths.
 * @returns Deterministic audit result.
 */
export async function auditArticleReferences({
  articleDir,
  rootDir,
}: ArticleReferenceAuditOptions): Promise<ArticleReferenceAuditResult> {
  const files = await listFiles(articleDir, /\.mdx?$/iu);
  const articles = await Promise.all(
    files.map(async (file) =>
      auditArticleFile(rootDir, file, await readFile(file, "utf8")),
    ),
  );
  const sortedArticles = articles.sort((left, right) =>
    left.file.localeCompare(right.file),
  );
  const totals = sortedArticles.reduce(
    (aggregate, article) => ({
      ...addCounts(aggregate, article.counts),
      articleCount: aggregate.articleCount + 1,
    }),
    { ...emptyCounts, articleCount: 0 },
  );

  return {
    articles: sortedArticles,
    manualReviewCount: sortedArticles.filter(
      (article) => article.manualReviewPatterns.length > 0,
    ).length,
    totals,
  };
}

/**
 * Formats audit output for human review.
 *
 * @param result Audit result.
 * @returns Markdown report.
 */
export function formatArticleReferenceAudit(
  result: ArticleReferenceAuditResult,
): string {
  const manualReviewArticles = result.articles.filter(
    (article) => article.manualReviewPatterns.length > 0,
  );

  return [
    "# Article Reference Corpus Audit",
    "",
    `Scanned ${result.totals.articleCount} articles.`,
    `Manual review candidates: ${result.manualReviewCount}.`,
    "",
    "## Manual Review Candidates",
    "",
    ...formatManualReviewRows(manualReviewArticles),
    "",
    "## Totals",
    "",
    ...formatTotalRows(result.totals),
  ].join("\n");
}

function auditArticleFile(
  rootDir: string,
  file: string,
  source: string,
): ArticleReferenceAuditArticle {
  const content = markdownBody(source);
  const astCounts = astReferenceCounts(content);
  const lineCounts = lineReferenceCounts(content);
  const counts = addCounts(astCounts, lineCounts);
  const patterns = detectedPatterns(counts);
  const manualReviewPatterns = patterns.filter(isManualReviewPattern);

  return {
    counts,
    file: toPosix(path.relative(rootDir, file)),
    manualReviewPatterns,
    patterns,
  };
}

function astReferenceCounts(content: string): ArticleReferenceAuditCounts {
  const counts = { ...emptyCounts };

  try {
    walkAst(remark().use(remarkGfm).parse(content), counts);
  } catch {
    return counts;
  }

  return counts;
}

function walkAst(
  node: AuditAstNode,
  counts: ArticleReferenceAuditCounts,
): void {
  if (node.type === "code" && node.lang === "tpm-bibtex") {
    counts.hiddenBibtexBlockCount += 1;
  }

  if (node.type === "code" && node.lang === "bibtex") {
    counts.visibleBibtexBlockCount += 1;
  }

  if (node.type === "link") {
    counts.markdownLinkCount += 1;

    if (isArchiveUrl(node.url ?? "")) {
      counts.archiveLinkCount += 1;
    }
  }

  if (node.type === "html") {
    const html = node.value ?? "";
    counts.rawHtmlLinkCount += countMatches(html, /<a\s+/giu);
    counts.archiveLinkCount += countMatches(html, archiveUrlPattern());
  }

  if (node.type === "heading" && isReferenceHeading(textFromAst(node))) {
    counts.referenceHeadingCount += 1;
  }

  for (const child of node.children ?? []) {
    walkAst(child, counts);
  }
}

function lineReferenceCounts(content: string): ArticleReferenceAuditCounts {
  const counts = { ...emptyCounts };
  const footnoteDefinitions = Array.from(
    content.matchAll(/^ {0,3}\[\^([^\]]+)\]:/gmu),
    (match) => match.at(1) ?? "",
  );
  const inlineFootnoteMarkers = Array.from(
    content.matchAll(/\[\^([^\]]+)\](?!:)/gu),
    (match) => match.at(1) ?? "",
  );

  counts.canonicalCitationMarkerCount = inlineFootnoteMarkers.filter((label) =>
    label.startsWith("cite-"),
  ).length;
  counts.canonicalNoteMarkerCount = inlineFootnoteMarkers.filter((label) =>
    label.startsWith("note-"),
  ).length;
  counts.noncanonicalFootnoteMarkerCount = inlineFootnoteMarkers.filter(
    (label) => !isCanonicalReferenceLabel(label),
  ).length;
  counts.obsoleteCitationDefinitionCount = footnoteDefinitions.filter((label) =>
    label.startsWith("cite-"),
  ).length;
  counts.canonicalNoteDefinitionCount = footnoteDefinitions.filter((label) =>
    label.startsWith("note-"),
  ).length;
  counts.noncanonicalFootnoteDefinitionCount = footnoteDefinitions.filter(
    (label) => !isCanonicalReferenceLabel(label),
  ).length;
  counts.rawUrlCount = countMatches(content, /https?:\/\/[^\s)<]+/giu);
  counts.mediaCreditLineCount = countLines(content, isMediaCreditLine);
  counts.bracketReferenceLineCount = countLines(
    content,
    isBracketReferenceLine,
  );
  counts.archiveLinkCount += countMatches(content, archiveUrlPattern());

  return counts;
}

function detectedPatterns(counts: ArticleReferenceAuditCounts): string[] {
  return [
    pattern("canonical citation markers", counts.canonicalCitationMarkerCount),
    pattern("canonical note markers", counts.canonicalNoteMarkerCount),
    pattern("canonical note definitions", counts.canonicalNoteDefinitionCount),
    pattern("hidden tpm-bibtex blocks", counts.hiddenBibtexBlockCount),
    pattern(
      "obsolete cite footnote definitions",
      counts.obsoleteCitationDefinitionCount,
    ),
    pattern(
      "noncanonical footnote definitions",
      counts.noncanonicalFootnoteDefinitionCount,
    ),
    pattern(
      "noncanonical footnote markers",
      counts.noncanonicalFootnoteMarkerCount,
    ),
    pattern("reference-section headings", counts.referenceHeadingCount),
    pattern("visible bibtex fences", counts.visibleBibtexBlockCount),
    pattern("raw HTML links", counts.rawHtmlLinkCount),
    pattern("markdown links", counts.markdownLinkCount),
    pattern("archive links", counts.archiveLinkCount),
    pattern("raw URLs", counts.rawUrlCount),
    pattern("media/source credit lines", counts.mediaCreditLineCount),
    pattern("bracket-style reference lines", counts.bracketReferenceLineCount),
  ].filter((value): value is string => value !== undefined);
}

function isManualReviewPattern(pattern: string): boolean {
  return [
    "obsolete cite footnote definitions",
    "noncanonical footnote definitions",
    "noncanonical footnote markers",
    "reference-section headings",
    "visible bibtex fences",
    "raw HTML links",
    "media/source credit lines",
    "bracket-style reference lines",
  ].some((prefix) => pattern.startsWith(prefix));
}

function pattern(label: string, count: number): string | undefined {
  return count === 0 ? undefined : `${label}: ${count}`;
}

function formatManualReviewRows(
  articles: readonly ArticleReferenceAuditArticle[],
): string[] {
  if (articles.length === 0) {
    return ["No manual review candidates found."];
  }

  return [
    "| Article | Patterns |",
    "| --- | --- |",
    ...articles.map(
      (article) =>
        `| \`${article.file}\` | ${escapeTableCell(
          article.manualReviewPatterns.join("; "),
        )} |`,
    ),
  ];
}

function formatTotalRows(totals: ArticleReferenceAuditTotals): string[] {
  return [
    `- archiveLinkCount: ${totals.archiveLinkCount}`,
    `- articleCount: ${totals.articleCount}`,
    `- bracketReferenceLineCount: ${totals.bracketReferenceLineCount}`,
    `- canonicalCitationMarkerCount: ${totals.canonicalCitationMarkerCount}`,
    `- canonicalNoteDefinitionCount: ${totals.canonicalNoteDefinitionCount}`,
    `- canonicalNoteMarkerCount: ${totals.canonicalNoteMarkerCount}`,
    `- hiddenBibtexBlockCount: ${totals.hiddenBibtexBlockCount}`,
    `- markdownLinkCount: ${totals.markdownLinkCount}`,
    `- mediaCreditLineCount: ${totals.mediaCreditLineCount}`,
    `- noncanonicalFootnoteDefinitionCount: ${totals.noncanonicalFootnoteDefinitionCount}`,
    `- noncanonicalFootnoteMarkerCount: ${totals.noncanonicalFootnoteMarkerCount}`,
    `- obsoleteCitationDefinitionCount: ${totals.obsoleteCitationDefinitionCount}`,
    `- rawHtmlLinkCount: ${totals.rawHtmlLinkCount}`,
    `- rawUrlCount: ${totals.rawUrlCount}`,
    `- referenceHeadingCount: ${totals.referenceHeadingCount}`,
    `- visibleBibtexBlockCount: ${totals.visibleBibtexBlockCount}`,
  ];
}

function addCounts<T extends ArticleReferenceAuditCounts>(
  left: T,
  right: ArticleReferenceAuditCounts,
): T {
  return {
    ...left,
    archiveLinkCount: left.archiveLinkCount + right.archiveLinkCount,
    bracketReferenceLineCount:
      left.bracketReferenceLineCount + right.bracketReferenceLineCount,
    canonicalCitationMarkerCount:
      left.canonicalCitationMarkerCount + right.canonicalCitationMarkerCount,
    canonicalNoteDefinitionCount:
      left.canonicalNoteDefinitionCount + right.canonicalNoteDefinitionCount,
    canonicalNoteMarkerCount:
      left.canonicalNoteMarkerCount + right.canonicalNoteMarkerCount,
    hiddenBibtexBlockCount:
      left.hiddenBibtexBlockCount + right.hiddenBibtexBlockCount,
    markdownLinkCount: left.markdownLinkCount + right.markdownLinkCount,
    mediaCreditLineCount:
      left.mediaCreditLineCount + right.mediaCreditLineCount,
    noncanonicalFootnoteDefinitionCount:
      left.noncanonicalFootnoteDefinitionCount +
      right.noncanonicalFootnoteDefinitionCount,
    noncanonicalFootnoteMarkerCount:
      left.noncanonicalFootnoteMarkerCount +
      right.noncanonicalFootnoteMarkerCount,
    obsoleteCitationDefinitionCount:
      left.obsoleteCitationDefinitionCount +
      right.obsoleteCitationDefinitionCount,
    rawHtmlLinkCount: left.rawHtmlLinkCount + right.rawHtmlLinkCount,
    rawUrlCount: left.rawUrlCount + right.rawUrlCount,
    referenceHeadingCount:
      left.referenceHeadingCount + right.referenceHeadingCount,
    visibleBibtexBlockCount:
      left.visibleBibtexBlockCount + right.visibleBibtexBlockCount,
  };
}

function markdownBody(source: string): string {
  return matter(source).content;
}

function textFromAst(node: AuditAstNode): string {
  return node.value ?? (node.children ?? []).map(textFromAst).join("");
}

function isReferenceHeading(value: string): boolean {
  return referenceHeadingPattern().test(value.trim());
}

function referenceHeadingPattern(): RegExp {
  return /^(?:bibliograph(?:y|ies)|citations?|further reading|references?|sources?|source list|works cited|works consulted)$/iu;
}

function isCanonicalReferenceLabel(label: string): boolean {
  const separatorIndex = label.indexOf("-");
  const prefix = label.slice(0, separatorIndex);
  const suffix = label.slice(separatorIndex + 1);

  return (
    separatorIndex > 0 &&
    (prefix === "cite" || prefix === "note") &&
    suffix.split("-").every(isLowercaseAsciiSegment)
  );
}

function isArchiveUrl(url: string): boolean {
  return archiveUrlPattern().test(url);
}

function archiveUrlPattern(): RegExp {
  return /https?:\/\/(?:web\.)?archive\.(?:org|is|today)\b/giu;
}

function countMatches(text: string, pattern: RegExp): number {
  return Array.from(text.matchAll(pattern)).length;
}

function countLines(
  text: string,
  predicate: (line: string) => boolean,
): number {
  return text.split("\n").filter(predicate).length;
}

function isMediaCreditLine(line: string): boolean {
  const normalized = line.trim().toLowerCase();

  return (
    hasCreditPrefix(normalized, "source:") ||
    hasCreditPrefix(normalized, "credit:") ||
    hasCreditPrefix(normalized, "via:") ||
    hasCreditPrefix(normalized, "image source:") ||
    hasCreditPrefix(normalized, "image credit:")
  );
}

function isBracketReferenceLine(line: string): boolean {
  const trimmed = line.trim();
  const closingIndex = trimmed.indexOf("]");

  return (
    trimmed.startsWith("[") &&
    !trimmed.startsWith("[^") &&
    closingIndex > 0 &&
    trimmed.at(closingIndex + 1) === " " &&
    trimmed.slice(closingIndex + 2).trim() !== ""
  );
}

function hasCreditPrefix(value: string, prefix: string): boolean {
  return value.startsWith(prefix) && value.slice(prefix.length).trim() !== "";
}

function isLowercaseAsciiSegment(segment: string): boolean {
  return (
    segment !== "" &&
    Array.from(segment).every((character) => {
      const codePoint = character.codePointAt(0);

      return (
        codePoint !== undefined &&
        ((codePoint >= 97 && codePoint <= 122) ||
          (codePoint >= 48 && codePoint <= 57))
      );
    })
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

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}

if (import.meta.main) {
  process.exitCode = await runArticleReferenceAuditCli();
}
