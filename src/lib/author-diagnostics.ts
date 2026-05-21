import type {
  OutputDiagnostic,
  OutputDiagnosticCategory,
  OutputDiagnosticOwner,
} from "./output-verification";

/** Author-facing diagnostic categories shared by CLI, docs, and future studio surfaces. */
export const authorDiagnosticCategories = [
  "accessibility",
  "assets",
  "citations",
  "config",
  "content",
  "deployment",
  "feeds",
  "frontmatter",
  "generated-artifacts",
  "media",
  "metadata",
  "pdfs",
  "performance",
  "redirects",
  "routes",
  "search",
] as const;

/** Person or system most likely to repair an author-facing diagnostic. */
export const authorDiagnosticRepairOwners = [
  "author",
  "developer",
  "external",
  "platform",
  "site-owner",
] as const;

/** Repair path expected for an author-facing diagnostic. */
export const authorDiagnosticFixabilities = [
  "code-change",
  "external-action",
  "investigate",
  "regenerate",
  "source-edit",
] as const;

/** Origin surface that produced an author-facing diagnostic. */
export const authorDiagnosticSources = [
  "asset-audit",
  "content-schema",
  "deployment-check",
  "generated-output",
  "markdown-plugin",
  "observability-import",
  "site-doctor",
] as const;

/** Author-facing diagnostic category. */
export type AuthorDiagnosticCategory =
  (typeof authorDiagnosticCategories)[number];

/** Stable namespaced author diagnostic code. */
export type AuthorDiagnosticCode = `${AuthorDiagnosticCategory}.${string}`;

/** Author-facing diagnostic severity. */
type AuthorDiagnosticSeverity = "error" | "info" | "warning";

/** Person or system most likely to repair an author-facing diagnostic. */
export type AuthorDiagnosticRepairOwner =
  (typeof authorDiagnosticRepairOwners)[number];

/** Repair path expected for an author-facing diagnostic. */
type AuthorDiagnosticFixability = (typeof authorDiagnosticFixabilities)[number];

/** Origin surface that produced an author-facing diagnostic. */
type AuthorDiagnosticSource = (typeof authorDiagnosticSources)[number];

/** Repairable source or generated-output location for an author diagnostic. */
interface AuthorDiagnosticLocation {
  column?: number | undefined;
  fieldPath?: string | undefined;
  line?: number | undefined;
  outputPath?: string | undefined;
  route?: string | undefined;
  sourcePath?: string | undefined;
  url?: string | undefined;
}

/** Input used to create a validated author-facing diagnostic. */
export interface AuthorDiagnosticInput {
  category: AuthorDiagnosticCategory;
  code: AuthorDiagnosticCode;
  detail?: string | undefined;
  evidence?: readonly string[] | undefined;
  fixability: AuthorDiagnosticFixability;
  location?: AuthorDiagnosticLocation | undefined;
  relatedDocs?: readonly string[] | undefined;
  remediation?: string | undefined;
  repairOwner: AuthorDiagnosticRepairOwner;
  severity: AuthorDiagnosticSeverity;
  source: AuthorDiagnosticSource;
  sourceCode?: string | undefined;
  summary: string;
}

/** Structured author-facing diagnostic shared by author tooling surfaces. */
export interface AuthorDiagnostic extends AuthorDiagnosticInput {
  readonly category: AuthorDiagnosticCategory;
  readonly code: AuthorDiagnosticCode;
  readonly detail?: string | undefined;
  readonly evidence?: readonly string[] | undefined;
  readonly fixability: AuthorDiagnosticFixability;
  readonly location?: AuthorDiagnosticLocation | undefined;
  readonly relatedDocs?: readonly string[] | undefined;
  readonly remediation?: string | undefined;
  readonly repairOwner: AuthorDiagnosticRepairOwner;
  readonly severity: AuthorDiagnosticSeverity;
  readonly source: AuthorDiagnosticSource;
  readonly sourceCode?: string | undefined;
  readonly summary: string;
}

/** Summary counts for author-facing diagnostic reports. */
interface AuthorDiagnosticReportSummary {
  byCategory: Record<string, number>;
  byRepairOwner: Record<string, number>;
  errors: number;
  info: number;
  total: number;
  warnings: number;
}

/** JSON-ready author-facing diagnostic report. */
export interface AuthorDiagnosticReport {
  diagnostics: readonly AuthorDiagnostic[];
  summary: AuthorDiagnosticReportSummary;
}

/**
 * Creates and validates an author-facing diagnostic.
 *
 * @param input Author diagnostic input.
 * @returns Validated author-facing diagnostic.
 */
export function createAuthorDiagnostic(
  input: AuthorDiagnosticInput,
): AuthorDiagnostic {
  if (!input.code.startsWith(`${input.category}.`)) {
    throw new Error(
      `Author diagnostic code "${input.code}" must start with "${input.category}.".`,
    );
  }

  return {
    ...input,
    evidence: filteredStrings(input.evidence),
    relatedDocs: filteredStrings(input.relatedDocs),
  };
}

/**
 * Converts a generated-output diagnostic into the author-facing taxonomy.
 *
 * @param diagnostic Generated-output diagnostic.
 * @returns Author-facing diagnostic preserving lower-level identity.
 */
export function authorDiagnosticFromOutputDiagnostic(
  diagnostic: OutputDiagnostic,
): AuthorDiagnostic {
  const category = authorCategoryFromOutputDiagnostic(diagnostic);
  const repairOwner = authorRepairOwnerFromOutputOwner(diagnostic.owner);

  return createAuthorDiagnostic({
    category,
    code: `${category}.${diagnostic.code}`,
    evidence: diagnostic.evidence,
    fixability: authorFixabilityForRepairOwner(repairOwner),
    location: diagnostic.location,
    relatedDocs: relatedDocsForCategory(category),
    remediation: diagnostic.remediation,
    repairOwner,
    severity: diagnostic.severity,
    source: "generated-output",
    sourceCode: diagnostic.code,
    summary: diagnostic.message,
  });
}

/**
 * Maps generated-output diagnostics into author-facing diagnostics.
 *
 * @param diagnostics Generated-output diagnostics.
 * @returns Author-facing diagnostics in the same order.
 */
/**
 * Builds a deterministic JSON-ready author diagnostic report.
 *
 * @param diagnostics Author-facing diagnostics.
 * @returns Diagnostics plus summary counts.
 */
export function createAuthorDiagnosticReport(
  diagnostics: readonly AuthorDiagnostic[],
): AuthorDiagnosticReport {
  const categoryCounts = new Map<AuthorDiagnosticCategory, number>();
  const repairOwnerCounts = new Map<AuthorDiagnosticRepairOwner, number>();
  let errors = 0;
  let info = 0;
  let warnings = 0;

  for (const diagnostic of diagnostics) {
    incrementCount(categoryCounts, diagnostic.category);
    incrementCount(repairOwnerCounts, diagnostic.repairOwner);

    if (diagnostic.severity === "error") {
      errors += 1;
    } else if (diagnostic.severity === "warning") {
      warnings += 1;
    } else {
      info += 1;
    }
  }

  return {
    diagnostics,
    summary: {
      byCategory: countRecord(categoryCounts),
      byRepairOwner: countRecord(repairOwnerCounts),
      errors,
      info,
      total: diagnostics.length,
      warnings,
    },
  };
}

function authorCategoryFromOutputDiagnostic(
  diagnostic: OutputDiagnostic,
): AuthorDiagnosticCategory {
  switch (diagnostic.code) {
    case "html.image-alt-missing":
      return "accessibility";

    case "html.media-output-invalid":
      return "media";

    default:
      return authorCategoryFromOutputCategory(diagnostic.category);
  }
}

function authorCategoryFromOutputCategory(
  category: OutputDiagnosticCategory,
): AuthorDiagnosticCategory {
  switch (category) {
    case "asset":
      return "assets";

    case "build":
    case "html":
      return "generated-artifacts";

    case "cache":
    case "security":
      return "deployment";

    case "content":
      return "content";

    case "feed":
      return "feeds";

    case "link":
    case "route":
      return "routes";

    case "metadata":
    case "sitemap":
      return "metadata";

    case "pdf":
      return "pdfs";

    case "redirect":
      return "redirects";

    case "search":
      return "search";
  }
}

function authorRepairOwnerFromOutputOwner(
  owner: OutputDiagnosticOwner | undefined,
): AuthorDiagnosticRepairOwner {
  if (owner === undefined) {
    return "platform";
  }

  switch (owner) {
    case "content":
      return "author";

    case "external":
      return "external";

    case "generated-output":
      return "platform";

    case "platform":
      return "developer";

    case "site-config":
      return "site-owner";
  }
}

function authorFixabilityForRepairOwner(
  owner: AuthorDiagnosticRepairOwner,
): AuthorDiagnosticFixability {
  switch (owner) {
    case "author":
    case "site-owner":
      return "source-edit";

    case "developer":
      return "code-change";

    case "external":
      return "external-action";

    case "platform":
      return "investigate";
  }
}

function relatedDocsForCategory(
  category: AuthorDiagnosticCategory,
): readonly string[] {
  switch (category) {
    case "accessibility":
      return ["docs/AUTHOR_DIAGNOSTICS.md"];

    case "assets":
    case "media":
      return ["docs/MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md"];

    case "citations":
      return ["docs/ARTICLE_REFERENCE_AUTHORING.md"];

    case "config":
    case "redirects":
      return ["docs/SITE_ANATOMY.md"];

    case "content":
    case "frontmatter":
      return ["docs/AUTHORING_WORKFLOW.md"];

    case "deployment":
      return ["docs/CLOUDFLARE_WORKERS_MIGRATION.md"];

    case "feeds":
      return ["docs/PUBLISHABLE_FEED_ARTICLE_CONTINUITY_AND_EMBEDS.md"];

    case "generated-artifacts":
      return ["docs/GENERATED_OUTPUT_VERIFIER_CONTRACT.md"];

    case "metadata":
    case "search":
      return ["docs/METADATA_GRAPH_AND_SEMANTIC_PROFILES.md"];

    case "pdfs":
      return ["docs/ARTICLE_PDF_EXPORT.md"];

    case "performance":
      return ["docs/performance/route-class-performance-budgets.md"];

    case "routes":
      return ["docs/SOURCE_CONTRACTS.md"];
  }
}

function incrementCount<Key>(counts: Map<Key, number>, key: Key): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function countRecord<Key extends string>(
  counts: ReadonlyMap<Key, number>,
): Record<string, number> {
  return Object.fromEntries(
    Array.from(counts.entries()).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

function filteredStrings(
  values: readonly string[] | undefined,
): readonly string[] | undefined {
  if (values === undefined) {
    return undefined;
  }

  const filtered = values.filter((entry) => entry.trim() !== "");

  return filtered.length === 0 ? undefined : filtered;
}
