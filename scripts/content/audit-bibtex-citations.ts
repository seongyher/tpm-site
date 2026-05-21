import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import { parseBibtexEntries } from "../../src/lib/article-references/bibtex";
import type { ParsedBibtexEntry } from "../../src/lib/article-references/model";
import { resolveSiteInstancePaths } from "../../src/lib/site-instance";

/** Options for the complete BibTeX citation audit. */
export interface BibtexCitationAuditOptions {
  articleDir: string;
  generatedDate: string;
  rootDir: string;
}

/** Complete BibTeX citation audit result. */
export interface BibtexCitationAudit {
  articles: readonly BibtexCitationAuditArticle[];
  diagnostics: readonly BibtexCitationDiagnostic[];
  duplicateClusters: readonly BibtexDuplicateCluster[];
  generatedDate: string;
  inventory: readonly BibtexCitationInventoryEntry[];
  missingEntries: readonly BibtexMissingCitationEntry[];
  totals: BibtexCitationAuditTotals;
}

/** Per-article citation audit result. */
export interface BibtexCitationAuditArticle {
  bibtexBlocks: readonly BibtexBlockAudit[];
  citationMarkers: readonly BibtexCitationMarker[];
  duplicateKeys: readonly string[];
  entries: readonly BibtexCitationInventoryEntry[];
  file: string;
  missingEntries: readonly BibtexMissingCitationEntry[];
  unusedEntries: readonly BibtexCitationInventoryEntry[];
}

/** One hidden `tpm-bibtex` block found in article source. */
export interface BibtexBlockAudit {
  diagnostics: readonly string[];
  entryCount: number;
  line: number;
}

/** One inline citation marker occurrence. */
export interface BibtexCitationMarker {
  key: string;
  line: number;
}

/** One parsed BibTeX entry in the review inventory. */
export interface BibtexCitationInventoryEntry {
  article: string;
  citation?: string | undefined;
  doi?: string | undefined;
  entryType: string;
  fieldCount: number;
  fields: readonly string[];
  flags: readonly BibtexCitationReviewFlag[];
  key: string;
  line: number;
  markerCount: number;
  reviewText: string;
  suggestedType?: string | undefined;
  title?: string | undefined;
  url?: string | undefined;
  year?: string | undefined;
}

/** Missing citation source data for an inline marker. */
export interface BibtexMissingCitationEntry {
  article: string;
  key: string;
  lines: readonly number[];
  markerCount: number;
}

/** A probable duplicate citation cluster. */
export interface BibtexDuplicateCluster {
  entries: readonly BibtexDuplicateClusterEntry[];
  kind: "citation" | "doi" | "title" | "url";
  value: string;
}

/** One entry inside a duplicate cluster. */
export interface BibtexDuplicateClusterEntry {
  article: string;
  key: string;
  line: number;
  title: string;
}

/** Machine-readable citation audit finding for tools, CI, and future UI. */
export interface BibtexCitationDiagnostic {
  article: string;
  code: BibtexCitationDiagnosticCode;
  evidence?: string | undefined;
  key?: string | undefined;
  line: number;
  message: string;
  severity: BibtexCitationDiagnosticSeverity;
}

/** Stable diagnostic code emitted by the BibTeX citation audit. */
export type BibtexCitationDiagnosticCode =
  | "ambiguous-locator"
  | "citation-field-transitional"
  | "citation-only-entry"
  | "duplicate-bibtex-key"
  | "duplicate-candidate"
  | "generic-misc-type"
  | "malformed-bibtex"
  | "missing-bibtex-entry"
  | "missing-contributor"
  | "missing-date"
  | "missing-source-title"
  | "missing-structured-identifier"
  | "missing-url-field"
  | "needs-external-verification"
  | "possible-entry-type-upgrade"
  | "unsupported-entry-type";

/** Severity for citation audit diagnostics. */
export type BibtexCitationDiagnosticSeverity = "error" | "review";

/** Aggregate coverage and quality counts. */
export interface BibtexCitationAuditTotals {
  articlesScanned: number;
  articlesWithBibtex: number;
  articlesWithCitationMarkers: number;
  bibtexBlocks: number;
  diagnostics: number;
  duplicateClusters: number;
  duplicateKeysWithinArticles: number;
  inventoryEntries: number;
  markerOccurrences: number;
  missingEntries: number;
  parseDiagnostics: number;
  reviewFlagCounts: Readonly<Record<BibtexCitationReviewFlag, number>>;
  uniqueCitationKeys: number;
  unusedEntries: number;
  usedEntries: number;
}

/** Review flags assigned to entries that need cleanup or verification. */
export type BibtexCitationReviewFlag =
  | "ambiguous-locator"
  | "citation-field-transitional"
  | "citation-only-entry"
  | "duplicate-candidate"
  | "generic-misc-type"
  | "missing-contributor"
  | "missing-date"
  | "missing-source-title"
  | "missing-structured-identifier"
  | "missing-url-field"
  | "needs-external-verification"
  | "possible-entry-type-upgrade"
  | "unsupported-entry-type";

interface BibtexBlock {
  line: number;
  value: string;
}

interface ParsedEntryWithLine {
  entry: ParsedBibtexEntry;
  line: number;
}

const defaultOutputPath = "docs/CITATION_BIBTEX_AUDIT.md";
const reviewFlagOrder: readonly BibtexCitationReviewFlag[] = [
  "citation-only-entry",
  "citation-field-transitional",
  "unsupported-entry-type",
  "possible-entry-type-upgrade",
  "generic-misc-type",
  "ambiguous-locator",
  "missing-contributor",
  "missing-source-title",
  "missing-date",
  "missing-url-field",
  "missing-structured-identifier",
  "duplicate-candidate",
  "needs-external-verification",
];
const supportedEntryTypes = new Set([
  "article",
  "book",
  "booklet",
  "conference",
  "dataset",
  "inbook",
  "incollection",
  "inproceedings",
  "manual",
  "mastersthesis",
  "misc",
  "online",
  "phdthesis",
  "proceedings",
  "software",
  "techreport",
  "unpublished",
  "www",
]);
const sourceLevelLocatorFields = new Set([
  "locator",
  "page",
  "pinpoint",
  "quote",
  "section",
  "timestamp",
]);

/**
 * Runs the BibTeX citation audit command-line workflow.
 *
 * @param args Command-line arguments without executable prefix.
 * @param rootDir Repository root.
 * @returns Process exit code.
 */
export async function runBibtexCitationAuditCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const sitePaths = resolveSiteInstancePaths({ cwd: rootDir });
  const outputIndex = args.indexOf("--output");
  const outputPath =
    outputIndex >= 0
      ? (args.at(outputIndex + 1) ?? defaultOutputPath)
      : defaultOutputPath;
  const audit = await auditBibtexCitations({
    articleDir: sitePaths.content.articles,
    generatedDate: new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
      year: "numeric",
    }),
    rootDir,
  });
  const markdown = formatBibtexCitationAudit(audit);

  if (args.includes("--json")) {
    console.log(JSON.stringify(audit, null, 2));
    return 0;
  }

  if (args.includes("--write")) {
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
 * Audits every article citation marker and hidden BibTeX entry.
 *
 * @param options Audit options.
 * @param options.articleDir Article source directory.
 * @param options.generatedDate Human-readable generated date.
 * @param options.rootDir Repository root for relative paths.
 * @returns Full citation audit.
 */
export async function auditBibtexCitations({
  articleDir,
  generatedDate,
  rootDir,
}: BibtexCitationAuditOptions): Promise<BibtexCitationAudit> {
  const files = await listFiles(articleDir, /\.mdx?$/iu);
  const articles = (
    await Promise.all(
      files.map(async (file) =>
        auditArticle(rootDir, file, await readFile(file, "utf8")),
      ),
    )
  ).sort((left, right) => left.file.localeCompare(right.file));
  const inventory = articles.flatMap((article) => article.entries);
  const missingEntries = articles.flatMap((article) => article.missingEntries);
  const duplicateClusters = duplicateCitationClusters(inventory);
  const duplicateEntryIds = new Set(
    duplicateClusters.flatMap((cluster) =>
      cluster.entries.map((entry) => entryId(entry.article, entry.key)),
    ),
  );
  const inventoryWithDuplicateFlags = inventory.map((entry) =>
    duplicateEntryIds.has(entryId(entry.article, entry.key))
      ? addFlag(entry, "duplicate-candidate")
      : entry,
  );
  const articlesWithDuplicateFlags = articles.map((article) => ({
    ...article,
    entries: article.entries.map((entry) =>
      duplicateEntryIds.has(entryId(entry.article, entry.key))
        ? addFlag(entry, "duplicate-candidate")
        : entry,
    ),
    unusedEntries: article.unusedEntries.map((entry) =>
      duplicateEntryIds.has(entryId(entry.article, entry.key))
        ? addFlag(entry, "duplicate-candidate")
        : entry,
    ),
  }));
  const diagnostics = citationAuditDiagnostics(articlesWithDuplicateFlags);

  return {
    articles: articlesWithDuplicateFlags,
    diagnostics,
    duplicateClusters,
    generatedDate,
    inventory: inventoryWithDuplicateFlags,
    missingEntries,
    totals: auditTotals(
      articlesWithDuplicateFlags,
      duplicateClusters,
      diagnostics,
    ),
  };
}

/**
 * Formats the full audit as a developer-ready Markdown report.
 *
 * @param audit Full citation audit.
 * @returns Markdown report.
 */
export function formatBibtexCitationAudit(audit: BibtexCitationAudit): string {
  return [
    "# Citation BibTeX Audit",
    "",
    `Generated from repository content on ${audit.generatedDate}.`,
    "",
    "This report inventories every article `[^cite-*]` marker and every hidden",
    "`tpm-bibtex` entry under `site/content/articles/`. It is a structural",
    "audit, not the final source-correction pass: every inventory row still",
    "needs human verification against the canonical source before editing the",
    "article citation data.",
    "",
    "Canonical verification rules live in",
    "`docs/CITATION_CANONICAL_VERIFICATION.md`; the per-entry source lookup",
    "ledger lives in `docs/CITATION_CANONICAL_VERIFICATION_LEDGER.md`.",
    "",
    "## Coverage Proof",
    "",
    ...formatCoverageRows(audit.totals),
    "",
    "Coverage is complete when the scanned article count matches the article",
    "corpus, every parsed BibTeX entry appears exactly once in the full",
    "inventory, every inline marker is either attached to an entry or listed in",
    "the missing-entry table, and parser diagnostics are zero.",
    "",
    "## BibTeX Field Model",
    "",
    "- The classic BibTeX model defines entry-type-specific required and",
    "  optional fields, such as `author`, `title`, `journal`, `year`,",
    "  `publisher`, `booktitle`, `pages`, and `note`.",
    "- Modern web citations commonly need BibLaTeX-style fields such as `url`,",
    "  `urldate`, `doi`, `date`, `journaltitle`, and `organization`.",
    "- TPM currently accepts parser-compatible BibTeX-like data and stores",
    "  unknown fields, but `citation = {...}` is a transitional migration field.",
    "  It is useful evidence for cleanup, not a clean final source model.",
    "- Authoring references: [BibTeXing](https://texdoc.org/serve/btxdoc/0)",
    "  for classic BibTeX field expectations and",
    "  [biblatex](https://texdoc.org/serve/biblatex/0) for modern web and",
    "  identifier fields.",
    "",
    "## High-Level Findings",
    "",
    ...formatFindingRows(audit),
    "",
    "## Citation Diagnostics",
    "",
    ...formatDiagnosticRows(audit.diagnostics),
    "",
    "## Required Cleanup Strategy",
    "",
    "1. Work article by article, using the full inventory below as the checklist.",
    "2. For each row, search for the canonical source and rewrite the entry into",
    "   structured BibTeX fields instead of relying on a literal `citation`",
    "   string.",
    "3. Prefer specific types (`@article`, `@book`, `@incollection`, `@online`,",
    "   etc.) over generic `@misc` when the source shape is known.",
    "4. Merge duplicate clusters only after confirming they refer to the same",
    "   source. Similar titles and reused URLs are review signals, not automatic",
    "   proof.",
    "5. Re-run `bun run references:bibtex:audit -- --write` after each cleanup",
    "   pass to prove that no citation markers or entries were skipped.",
    "",
    "## Article Coverage",
    "",
    "<!-- prettier-ignore-start -->",
    "",
    "| Article | Markers | Unique markers | BibTeX entries | Missing entries | Unused entries | Parse diagnostics | Duplicate keys |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ...audit.articles.map(formatArticleCoverageRow),
    "",
    "## Duplicate Review Clusters",
    "",
    ...trimTrailingBlankLines(formatDuplicateClusters(audit.duplicateClusters)),
    "",
    "## Missing BibTeX Entries",
    "",
    ...formatMissingEntries(audit.missingEntries),
    "",
    "## Full Citation Inventory",
    "",
    "| # | Article | Line | Key | Type | Used | Fields | Flags | Review text |",
    "| ---: | --- | ---: | --- | --- | ---: | --- | --- | --- |",
    ...audit.inventory.map(formatInventoryRow),
    "",
    "<!-- prettier-ignore-end -->",
    "",
  ].join("\n");
}

function auditArticle(
  rootDir: string,
  file: string,
  source: string,
): BibtexCitationAuditArticle {
  const content = matter(source).content;
  const filePath = toPosix(path.relative(rootDir, file));
  const markers = citationMarkers(content);
  const markerCounts = countBy(markers, (marker) => marker.key);
  const parsedBlocks = bibtexBlocks(content).map((block) =>
    parseBibtexBlock(block),
  );
  const entries = parsedBlocks.flatMap((block) =>
    block.entries.map((entry) =>
      inventoryEntry({
        article: filePath,
        entry: entry.entry,
        line: entry.line,
        markerCount: markerCounts.get(entry.entry.normalizedKey) ?? 0,
      }),
    ),
  );
  const entryKeys = new Set(entries.map((entry) => entry.key.toLowerCase()));
  const missingEntries = Array.from(markerCounts, ([key, markerCount]) => {
    const markerLines = markers
      .filter((marker) => marker.key === key)
      .map((marker) => marker.line);

    return {
      article: filePath,
      key,
      lines: markerLines,
      markerCount,
    };
  }).filter((entry) => !entryKeys.has(entry.key));
  const duplicateKeys = duplicateValues(
    entries.map((entry) => entry.key.toLowerCase()),
  );

  return {
    bibtexBlocks: parsedBlocks.map((block) => ({
      diagnostics: block.diagnostics,
      entryCount: block.entries.length,
      line: block.line,
    })),
    citationMarkers: markers,
    duplicateKeys,
    entries,
    file: filePath,
    missingEntries,
    unusedEntries: entries.filter((entry) => entry.markerCount === 0),
  };
}

function parseBibtexBlock(block: BibtexBlock): {
  diagnostics: readonly string[];
  entries: readonly ParsedEntryWithLine[];
  line: number;
} {
  const parsed = parseBibtexEntries(block.value);

  if (!parsed.ok) {
    return {
      diagnostics: parsed.diagnostics.map(
        (diagnostic) => `${diagnostic.message} at offset ${diagnostic.offset}`,
      ),
      entries: [],
      line: block.line,
    };
  }

  return {
    diagnostics: [],
    entries: entriesWithLineNumbers(block, parsed.entries),
    line: block.line,
  };
}

function entriesWithLineNumbers(
  block: BibtexBlock,
  entries: readonly ParsedBibtexEntry[],
): readonly ParsedEntryWithLine[] {
  let searchOffset = 0;

  return entries.map((entry) => {
    const entryOffset = block.value.indexOf(entry.raw, searchOffset);
    const safeEntryOffset = entryOffset >= 0 ? entryOffset : searchOffset;
    searchOffset = safeEntryOffset + entry.raw.length;

    return {
      entry,
      line: block.line + lineCount(block.value.slice(0, safeEntryOffset)),
    };
  });
}

function inventoryEntry({
  article,
  entry,
  line,
  markerCount,
}: {
  article: string;
  entry: ParsedBibtexEntry;
  line: number;
  markerCount: number;
}): BibtexCitationInventoryEntry {
  const fields = Object.keys(entry.fields).sort((left, right) =>
    left.localeCompare(right),
  );
  const title = field(entry, "title") ?? field(entry, "journaltitle");
  const citation = field(entry, "citation");
  const url = field(entry, "url");
  const doi = field(entry, "doi");
  const suggestedType = suggestedEntryType(entry);
  const flags = entryFlags(entry, suggestedType);

  return {
    article,
    citation,
    doi,
    entryType: entry.entryType,
    fieldCount: fields.length,
    fields,
    flags,
    key: entry.key,
    line,
    markerCount,
    reviewText: reviewText(entry),
    suggestedType,
    title,
    url,
    year: field(entry, "year") ?? field(entry, "date"),
  };
}

function entryFlags(
  entry: ParsedBibtexEntry,
  suggestedType: string | undefined,
): readonly BibtexCitationReviewFlag[] {
  const flags = new Set<BibtexCitationReviewFlag>([
    "needs-external-verification",
  ]);
  const fields = new Set(Object.keys(entry.fields));
  const hasCitation = fields.has("citation");
  const hasUrl = fields.has("url");
  const citation = field(entry, "citation") ?? "";

  if (hasCitation) {
    flags.add("citation-field-transitional");
  }

  if (!supportedEntryTypes.has(entry.entryType)) {
    flags.add("unsupported-entry-type");
  }

  if (hasSourceLevelLocator(entry)) {
    flags.add("ambiguous-locator");
  }

  if (
    hasCitation &&
    fields.size <= 2 &&
    (!fields.has("note") || fields.size === 2)
  ) {
    flags.add("citation-only-entry");
  }

  if (entry.entryType === "misc") {
    flags.add("generic-misc-type");
  }

  if (suggestedType !== undefined) {
    flags.add("possible-entry-type-upgrade");
  }

  if (!hasContributor(entry)) {
    flags.add("missing-contributor");
  }

  if (!hasSourceTitle(entry)) {
    flags.add("missing-source-title");
  }

  if (!hasDate(entry)) {
    flags.add("missing-date");
  }

  if (!hasStructuredIdentifier(entry)) {
    flags.add("missing-structured-identifier");
  }

  if (!hasUrl && firstUrl(citation) !== undefined) {
    flags.add("missing-url-field");
  }

  return reviewFlagOrder.filter((flag) => flags.has(flag));
}

function hasSourceLevelLocator(entry: ParsedBibtexEntry): boolean {
  return Object.keys(entry.fields).some((name) =>
    sourceLevelLocatorFields.has(name),
  );
}

function hasContributor(entry: ParsedBibtexEntry): boolean {
  return [
    "author",
    "editor",
    "organization",
    "institution",
    "school",
    "publisher",
  ].some((name) => hasField(entry, name));
}

function hasSourceTitle(entry: ParsedBibtexEntry): boolean {
  return ["title", "booktitle", "journal", "journaltitle", "citation"].some(
    (name) => hasField(entry, name),
  );
}

function hasDate(entry: ParsedBibtexEntry): boolean {
  return ["year", "date", "urldate"].some((name) => hasField(entry, name));
}

function hasStructuredIdentifier(entry: ParsedBibtexEntry): boolean {
  return ["doi", "eprint", "isbn", "issn", "pmid", "url", "archiveurl"].some(
    (name) => hasField(entry, name),
  );
}

function suggestedEntryType(entry: ParsedBibtexEntry): string | undefined {
  if (entry.entryType !== "misc") {
    return undefined;
  }

  if (hasField(entry, "journal") || hasField(entry, "journaltitle")) {
    return "article";
  }

  if (hasField(entry, "booktitle")) {
    return hasField(entry, "pages") ? "incollection" : "inbook";
  }

  if (hasField(entry, "publisher") && hasField(entry, "title")) {
    return "book";
  }

  if (
    hasField(entry, "url") ||
    firstUrl(field(entry, "citation") ?? "") !== undefined
  ) {
    return "online";
  }

  return undefined;
}

function duplicateCitationClusters(
  inventory: readonly BibtexCitationInventoryEntry[],
): readonly BibtexDuplicateCluster[] {
  return [
    ...clustersBy(inventory, "doi", (entry) => normalizeDoi(entry.doi)),
    ...clustersBy(inventory, "url", (entry) =>
      normalizeUrl(entry.url ?? firstUrl(entry.citation ?? "")),
    ),
    ...clustersBy(inventory, "title", (entry) => normalizeText(entry.title)),
    ...clustersBy(inventory, "citation", (entry) =>
      normalizeText(entry.citation),
    ),
  ].sort((left, right) =>
    left.kind === right.kind
      ? left.value.localeCompare(right.value)
      : left.kind.localeCompare(right.kind),
  );
}

function clustersBy(
  inventory: readonly BibtexCitationInventoryEntry[],
  kind: BibtexDuplicateCluster["kind"],
  normalize: (entry: BibtexCitationInventoryEntry) => string | undefined,
): readonly BibtexDuplicateCluster[] {
  const groups = new Map<string, BibtexDuplicateClusterEntry[]>();

  for (const entry of inventory) {
    const value = normalize(entry);

    if (value === undefined) {
      continue;
    }

    const group = groups.get(value) ?? [];
    group.push({
      article: entry.article,
      key: entry.key,
      line: entry.line,
      title: entry.title ?? entry.reviewText,
    });
    groups.set(value, group);
  }

  return Array.from(groups, ([value, entries]) => ({
    entries: entries.sort((left, right) =>
      left.article === right.article
        ? left.key.localeCompare(right.key)
        : left.article.localeCompare(right.article),
    ),
    kind,
    value,
  })).filter((cluster) => cluster.entries.length > 1);
}

function citationAuditDiagnostics(
  articles: readonly BibtexCitationAuditArticle[],
): readonly BibtexCitationDiagnostic[] {
  return articles
    .flatMap((article) => [
      ...article.bibtexBlocks.flatMap((block) =>
        block.diagnostics.map((message) =>
          citationDiagnostic({
            article: article.file,
            code: "malformed-bibtex",
            line: block.line,
            message,
            severity: "error",
          }),
        ),
      ),
      ...article.duplicateKeys.map((key) =>
        citationDiagnostic({
          article: article.file,
          code: "duplicate-bibtex-key",
          key,
          line: article.entries.find((entry) => entry.key.toLowerCase() === key)
            ?.line,
          message: `Duplicate BibTeX key "${key}". Keep one source record for this key in the article.`,
          severity: "error",
        }),
      ),
      ...article.missingEntries.map((entry) =>
        citationDiagnostic({
          article: article.file,
          code: "missing-bibtex-entry",
          evidence: `Referenced ${entry.markerCount} time(s) on lines ${entry.lines.join(", ")}.`,
          key: entry.key,
          line: entry.lines.at(0),
          message: `Citation marker "cite-${entry.key}" has no matching BibTeX entry.`,
          severity: "error",
        }),
      ),
      ...article.entries.flatMap((entry) =>
        entry.flags.map((flag) =>
          citationDiagnostic({
            article: article.file,
            code: flag,
            evidence: entry.reviewText,
            key: entry.key,
            line: entry.line,
            message: reviewFlagMessage(entry, flag),
            severity: "review",
          }),
        ),
      ),
    ])
    .sort(compareCitationDiagnostics);
}

function compareCitationDiagnostics(
  left: BibtexCitationDiagnostic,
  right: BibtexCitationDiagnostic,
): number {
  const articleOrder = left.article.localeCompare(right.article);

  if (articleOrder !== 0) {
    return articleOrder;
  }

  const lineOrder = compareNumber(left.line, right.line);

  return lineOrder === 0 ? left.code.localeCompare(right.code) : lineOrder;
}

function auditTotals(
  articles: readonly BibtexCitationAuditArticle[],
  duplicateClusters: readonly BibtexDuplicateCluster[],
  diagnostics: readonly BibtexCitationDiagnostic[],
): BibtexCitationAuditTotals {
  const inventory = articles.flatMap((article) => article.entries);
  const reviewFlagCounts: Record<BibtexCitationReviewFlag, number> = {
    "ambiguous-locator": countFlag(inventory, "ambiguous-locator"),
    "citation-field-transitional": countFlag(
      inventory,
      "citation-field-transitional",
    ),
    "citation-only-entry": countFlag(inventory, "citation-only-entry"),
    "duplicate-candidate": countFlag(inventory, "duplicate-candidate"),
    "generic-misc-type": countFlag(inventory, "generic-misc-type"),
    "missing-contributor": countFlag(inventory, "missing-contributor"),
    "missing-date": countFlag(inventory, "missing-date"),
    "missing-source-title": countFlag(inventory, "missing-source-title"),
    "missing-structured-identifier": countFlag(
      inventory,
      "missing-structured-identifier",
    ),
    "missing-url-field": countFlag(inventory, "missing-url-field"),
    "needs-external-verification": countFlag(
      inventory,
      "needs-external-verification",
    ),
    "possible-entry-type-upgrade": countFlag(
      inventory,
      "possible-entry-type-upgrade",
    ),
    "unsupported-entry-type": countFlag(inventory, "unsupported-entry-type"),
  };

  return {
    articlesScanned: articles.length,
    articlesWithBibtex: articles.filter(
      (article) => article.bibtexBlocks.length > 0,
    ).length,
    articlesWithCitationMarkers: articles.filter(
      (article) => article.citationMarkers.length > 0,
    ).length,
    bibtexBlocks: sum(articles, (article) => article.bibtexBlocks.length),
    diagnostics: diagnostics.length,
    duplicateClusters: duplicateClusters.length,
    duplicateKeysWithinArticles: sum(
      articles,
      (article) => article.duplicateKeys.length,
    ),
    inventoryEntries: inventory.length,
    markerOccurrences: sum(
      articles,
      (article) => article.citationMarkers.length,
    ),
    missingEntries: sum(articles, (article) => article.missingEntries.length),
    parseDiagnostics: sum(articles, (article) =>
      sum(article.bibtexBlocks, (block) => block.diagnostics.length),
    ),
    reviewFlagCounts,
    uniqueCitationKeys: new Set(
      articles.flatMap((article) =>
        article.citationMarkers.map((marker) => marker.key),
      ),
    ).size,
    unusedEntries: sum(articles, (article) => article.unusedEntries.length),
    usedEntries: inventory.filter((entry) => entry.markerCount > 0).length,
  };
}

function bibtexBlocks(content: string): readonly BibtexBlock[] {
  const blocks: BibtexBlock[] = [];
  const lines = content.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines.at(index) ?? "";
    const trimmed = line.trim();
    const fence = openingBibtexFence(trimmed);

    if (fence === undefined) {
      continue;
    }

    const startLine = index + 1;
    const valueLines: string[] = [];
    index += 1;

    while (index < lines.length) {
      const candidate = lines.at(index) ?? "";

      if (candidate.trim() === fence) {
        break;
      }

      valueLines.push(candidate);
      index += 1;
    }

    blocks.push({ line: startLine, value: valueLines.join("\n") });
  }

  return blocks;
}

function openingBibtexFence(line: string): string | undefined {
  const fenceCharacter = line.at(0);

  if (fenceCharacter !== "`" && fenceCharacter !== "~") {
    return undefined;
  }

  const fenceLength = Array.from(line).findIndex(
    (character) => character !== fenceCharacter,
  );
  const normalizedFenceLength = fenceLength === -1 ? line.length : fenceLength;

  if (normalizedFenceLength < 3) {
    return undefined;
  }

  const rest = line.slice(normalizedFenceLength).trim();

  return rest === "tpm-bibtex" || rest.startsWith("tpm-bibtex ")
    ? line.slice(0, normalizedFenceLength)
    : undefined;
}

function citationMarkers(content: string): readonly BibtexCitationMarker[] {
  return content.split("\n").flatMap((line, index) => {
    const markers: BibtexCitationMarker[] = [];

    for (const match of line.matchAll(
      /\[\^cite-([A-Za-z0-9][A-Za-z0-9-]*)\](?!:)/gu,
    )) {
      const key = match.at(1)?.toLowerCase();

      if (key !== undefined) {
        markers.push({ key, line: index + 1 });
      }
    }

    return markers;
  });
}

function firstUrl(value: string): string | undefined {
  return /https?:\/\/[^\s<>"')\]}]+/iu.exec(value)?.at(0);
}

function formatCoverageRows(totals: BibtexCitationAuditTotals): string[] {
  return [
    `- Articles scanned: ${totals.articlesScanned}`,
    `- Articles with citation markers: ${totals.articlesWithCitationMarkers}`,
    `- Articles with hidden BibTeX: ${totals.articlesWithBibtex}`,
    `- Hidden \`tpm-bibtex\` blocks: ${totals.bibtexBlocks}`,
    `- Inline citation marker occurrences: ${totals.markerOccurrences}`,
    `- Unique inline citation keys: ${totals.uniqueCitationKeys}`,
    `- Parsed BibTeX entries in full inventory: ${totals.inventoryEntries}`,
    `- Used BibTeX entries: ${totals.usedEntries}`,
    `- Bibliography-only BibTeX entries: ${totals.unusedEntries}`,
    `- Missing BibTeX entries for inline markers: ${totals.missingEntries}`,
    `- Parser diagnostics: ${totals.parseDiagnostics}`,
    `- Citation audit diagnostics: ${totals.diagnostics}`,
    `- Duplicate candidate clusters: ${totals.duplicateClusters}`,
  ];
}

function formatFindingRows(audit: BibtexCitationAudit): string[] {
  return [
    `- ${audit.totals.reviewFlagCounts["citation-field-transitional"]} entries still use the transitional \`citation\` field.`,
    `- ${audit.totals.reviewFlagCounts["citation-only-entry"]} entries are effectively literal citation strings rather than structured BibTeX.`,
    `- ${audit.totals.reviewFlagCounts["unsupported-entry-type"]} entries use unsupported source types.`,
    `- ${audit.totals.reviewFlagCounts["generic-misc-type"]} entries are \`@misc\`; many probably need a more specific type after verification.`,
    `- ${audit.totals.reviewFlagCounts["ambiguous-locator"]} entries appear to attach usage-specific locator data to source records.`,
    `- ${audit.totals.reviewFlagCounts["missing-contributor"]} entries lack a structured contributor field such as \`author\`, \`editor\`, or \`organization\`.`,
    `- ${audit.totals.reviewFlagCounts["missing-date"]} entries lack a structured date field.`,
    `- ${audit.totals.reviewFlagCounts["missing-structured-identifier"]} entries lack a structured identifier such as \`url\`, \`doi\`, \`isbn\`, or \`issn\`.`,
    `- ${audit.totals.duplicateClusters} probable duplicate clusters need manual comparison before sitewide bibliography aggregation can be trusted.`,
    `- ${audit.totals.missingEntries} inline citation keys have no matching BibTeX entry.`,
  ];
}

function formatDiagnosticRows(
  diagnostics: readonly BibtexCitationDiagnostic[],
): string[] {
  if (diagnostics.length === 0) {
    return ["No citation audit diagnostics were emitted."];
  }

  const counts = Array.from(
    countBy(diagnostics, (diagnostic) => diagnostic.code),
  )
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([code, count]) => `- ${inlineCode(code)}: ${count}`);
  const errorCount = diagnostics.filter(
    (diagnostic) => diagnostic.severity === "error",
  ).length;
  const reviewCount = diagnostics.length - errorCount;

  return [
    `- Error diagnostics: ${errorCount}`,
    `- Review diagnostics: ${reviewCount}`,
    "",
    ...counts,
    "",
    "Detailed diagnostics are available from",
    "`bun run references:bibtex:audit -- --json`; the inventory table below",
    "keeps per-entry review flags beside the source records authors need to",
    "repair.",
  ];
}

function formatArticleCoverageRow(article: BibtexCitationAuditArticle): string {
  const uniqueMarkers = new Set(
    article.citationMarkers.map((marker) => marker.key),
  ).size;
  const diagnostics = sum(
    article.bibtexBlocks,
    (block) => block.diagnostics.length,
  );

  return toTableRow([
    inlineCode(article.file),
    String(article.citationMarkers.length),
    String(uniqueMarkers),
    String(article.entries.length),
    String(article.missingEntries.length),
    String(article.unusedEntries.length),
    String(diagnostics),
    article.duplicateKeys.length === 0
      ? "None"
      : article.duplicateKeys.map(inlineCode).join(", "),
  ]);
}

function formatDuplicateClusters(
  clusters: readonly BibtexDuplicateCluster[],
): string[] {
  if (clusters.length === 0) {
    return ["No probable duplicate clusters were detected."];
  }

  return clusters.flatMap((cluster, index) => [
    `### ${index + 1}. ${cluster.kind}: ${inlineCode(truncate(cluster.value, 120))}`,
    "",
    "| Article | Line | Key | Title / citation |",
    "| --- | ---: | --- | --- |",
    ...cluster.entries.map((entry) =>
      toTableRow([
        inlineCode(entry.article),
        String(entry.line),
        inlineCode(entry.key),
        escapeTableCell(truncate(entry.title, 140)),
      ]),
    ),
    "",
  ]);
}

function formatMissingEntries(
  missingEntries: readonly BibtexMissingCitationEntry[],
): string[] {
  if (missingEntries.length === 0) {
    return ["No inline citation markers are missing BibTeX entries."];
  }

  return [
    "| Article | Key | Marker count | Lines |",
    "| --- | --- | ---: | --- |",
    ...missingEntries.map((entry) =>
      toTableRow([
        inlineCode(entry.article),
        inlineCode(entry.key),
        String(entry.markerCount),
        entry.lines.join(", "),
      ]),
    ),
  ];
}

function formatInventoryRow(
  entry: BibtexCitationInventoryEntry,
  index: number,
): string {
  return toTableRow([
    String(index + 1),
    inlineCode(entry.article),
    String(entry.line),
    inlineCode(entry.key),
    entry.suggestedType === undefined
      ? inlineCode(entry.entryType)
      : `${inlineCode(entry.entryType)} -> ${inlineCode(entry.suggestedType)}`,
    String(entry.markerCount),
    entry.fields.map(inlineCode).join(", "),
    entry.flags.map(inlineCode).join(", "),
    escapeTableCell(truncate(entry.reviewText, 180)),
  ]);
}

function addFlag(
  entry: BibtexCitationInventoryEntry,
  flag: BibtexCitationReviewFlag,
): BibtexCitationInventoryEntry {
  if (entry.flags.includes(flag)) {
    return entry;
  }

  return {
    ...entry,
    flags: reviewFlagOrder.filter(
      (candidate) => entry.flags.includes(candidate) || candidate === flag,
    ),
  };
}

function citationDiagnostic({
  article,
  code,
  evidence,
  key,
  line,
  message,
  severity,
}: Omit<BibtexCitationDiagnostic, "line"> & {
  line?: number | undefined;
}): BibtexCitationDiagnostic {
  return {
    article,
    code,
    evidence,
    key,
    line: line ?? 1,
    message,
    severity,
  };
}

function countBy<T>(
  values: readonly T[],
  keyFor: (value: T) => string,
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const value of values) {
    const key = keyFor(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

function countFlag(
  inventory: readonly BibtexCitationInventoryEntry[],
  flag: BibtexCitationReviewFlag,
): number {
  return inventory.filter((entry) => entry.flags.includes(flag)).length;
}

function compareNumber(left: number, right: number): number {
  return left === right ? 0 : left - right;
}

function duplicateValues(values: readonly string[]): readonly string[] {
  const counts = countBy(values, (value) => value);

  return Array.from(counts)
    .filter((entry) => entry[1] > 1)
    .map((entry) => entry[0])
    .sort((left, right) => left.localeCompare(right));
}

function entryId(article: string, key: string): string {
  return `${article}\0${key.toLowerCase()}`;
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/gu, "\\|").replace(/\n+/gu, " ");
}

function field(entry: ParsedBibtexEntry, name: string): string | undefined {
  const value = entry.fields[name.toLowerCase()]?.trim();

  return value === undefined || value.length === 0 ? undefined : value;
}

function hasField(entry: ParsedBibtexEntry, name: string): boolean {
  return field(entry, name) !== undefined;
}

function inlineCode(value: string): string {
  return `\`${value.replaceAll("`", "\\`")}\``;
}

function lineCount(value: string): number {
  return value.split("\n").length - 1;
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

function normalizeDoi(value: string | undefined): string | undefined {
  const normalized = value
    ?.trim()
    .toLowerCase()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//u, "")
    .replace(/^doi:\s*/u, "")
    .replace(/\s+/gu, "");

  return normalized === undefined || normalized.length === 0
    ? undefined
    : normalized;
}

function normalizeText(value: string | undefined): string | undefined {
  const normalized = value
    ?.toLowerCase()
    .replace(/https?:\/\/\S+/gu, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");

  return normalized === undefined || normalized.length < 12
    ? undefined
    : normalized;
}

function normalizeUrl(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = parseHttpUrl(trimmed);

  if (parsed === undefined) {
    const normalized = trimmed.toLowerCase();

    return normalized.length === 0 ? undefined : normalized;
  }

  const protocol = parsed.protocol.toLowerCase();
  const host = parsed.host.toLowerCase();
  const rawPath = parsed.path;
  const pathname =
    rawPath.length === 0 || rawPath === "/"
      ? "/"
      : rawPath.replace(/\/+$/u, "");
  const query = normalizedQuery(parsed.query);

  return `${protocol}://${host}${pathname}${query}`;
}

function parseHttpUrl(value: string):
  | undefined
  | {
      host: string;
      path: string;
      protocol: "http" | "https";
      query?: string | undefined;
    } {
  const protocolSeparatorIndex = value.indexOf("://");

  if (protocolSeparatorIndex < 0) {
    return undefined;
  }

  const rawProtocol = value.slice(0, protocolSeparatorIndex).toLowerCase();

  if (rawProtocol !== "http" && rawProtocol !== "https") {
    return undefined;
  }

  const withoutProtocol = value.slice(protocolSeparatorIndex + 3);
  const hashIndex = withoutProtocol.indexOf("#");
  const withoutHash =
    hashIndex < 0 ? withoutProtocol : withoutProtocol.slice(0, hashIndex);
  const queryIndex = withoutHash.indexOf("?");
  const withoutQuery =
    queryIndex < 0 ? withoutHash : withoutHash.slice(0, queryIndex);
  const query = queryIndex < 0 ? undefined : withoutHash.slice(queryIndex);
  const slashIndex = withoutQuery.indexOf("/");
  const host =
    slashIndex < 0 ? withoutQuery : withoutQuery.slice(0, slashIndex);
  const urlPath = slashIndex < 0 ? "" : withoutQuery.slice(slashIndex);

  if (host.length === 0) {
    return undefined;
  }

  return { host, path: urlPath, protocol: rawProtocol, query };
}

function normalizedQuery(query: string | undefined): string {
  if (query === undefined || query.length <= 1) {
    return "";
  }

  const params = new URLSearchParams(query.slice(1));
  const filteredParams = Array.from(params).filter(
    ([name]) => !/^(?:fbclid|gclid|utm_)/iu.test(name),
  );

  if (filteredParams.length === 0) {
    return "";
  }

  const normalizedParams = new URLSearchParams(filteredParams);
  const normalizedQueryText = normalizedParams.toString();

  return normalizedQueryText.length === 0 ? "" : `?${normalizedQueryText}`;
}

function reviewText(entry: ParsedBibtexEntry): string {
  return (
    field(entry, "title") ??
    field(entry, "citation") ??
    field(entry, "url") ??
    entry.key
  );
}

function reviewFlagMessage(
  entry: BibtexCitationInventoryEntry,
  flag: BibtexCitationReviewFlag,
): string {
  switch (flag) {
    case "ambiguous-locator":
      return `BibTeX entry "${entry.key}" has source-level locator metadata. Keep source facts on the source and preserve usage-specific page, section, quote, or timestamp details in prose until locator metadata exists.`;
    case "citation-field-transitional":
      return `BibTeX entry "${entry.key}" still uses the transitional citation field. Rewrite the source as structured BibTeX fields after canonical verification.`;
    case "citation-only-entry":
      return `BibTeX entry "${entry.key}" is effectively a literal citation string. Replace it with structured fields before treating it as clean source data.`;
    case "duplicate-candidate":
      return `BibTeX entry "${entry.key}" looks similar to another source. Merge only after manually confirming both entries cite the same source.`;
    case "generic-misc-type":
      return `BibTeX entry "${entry.key}" uses @misc. Choose a more specific type when the source shape is known.`;
    case "missing-contributor":
      return `BibTeX entry "${entry.key}" lacks a structured contributor field such as author, editor, organization, institution, school, or publisher.`;
    case "missing-date":
      return `BibTeX entry "${entry.key}" lacks a structured date field such as year, date, or urldate.`;
    case "missing-source-title":
      return `BibTeX entry "${entry.key}" lacks a structured title field.`;
    case "missing-structured-identifier":
      return `BibTeX entry "${entry.key}" lacks a structured identifier such as doi, isbn, issn, url, pmid, eprint, or archiveurl.`;
    case "missing-url-field":
      return `BibTeX entry "${entry.key}" contains a URL in citation prose but lacks a structured url field.`;
    case "needs-external-verification":
      return `BibTeX entry "${entry.key}" still needs manual verification against the canonical source.`;
    case "possible-entry-type-upgrade":
      return `BibTeX entry "${entry.key}" may be better represented as @${entry.suggestedType ?? "a more specific type"}.`;
    case "unsupported-entry-type":
      return `BibTeX entry "${entry.key}" uses unsupported type @${entry.entryType}. Map it to a supported BibTeX/BibLaTeX type before relying on generated outputs.`;
  }
}

function sum<T>(values: readonly T[], valueFor: (value: T) => number): number {
  return values.reduce((total, value) => total + valueFor(value), 0);
}

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength
    ? value
    : `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function trimTrailingBlankLines(lines: readonly string[]): readonly string[] {
  let endIndex = lines.length;

  while (endIndex > 0 && lines.at(endIndex - 1) === "") {
    endIndex -= 1;
  }

  return lines.slice(0, endIndex);
}

function toTableRow(cells: readonly string[]): string {
  return `| ${cells.join(" | ")} |`;
}

if (import.meta.main) {
  process.exitCode = await runBibtexCitationAuditCli();
}
