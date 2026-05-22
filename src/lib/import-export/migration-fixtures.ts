import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "../diagnostics/output-verification";

/** Supported representative migration source families. */
export type MigrationSourceKind =
  | "legacy-tpm"
  | "markdown-folder"
  | "static-html"
  | "substack-like"
  | "wordpress";

/** Preservation state for imported source fields. */
export type MigrationPreservationState =
  | "exact"
  | "inferred"
  | "lossy"
  | "manual-review"
  | "normalized"
  | "omitted"
  | "unknown"
  | "unsupported";

/** One source field preserved during migration normalization. */
export interface MigrationPreservedField {
  readonly fieldPath: string;
  readonly note?: string | undefined;
  readonly state: MigrationPreservationState;
  readonly value: string;
}

/** Original source location for a migrated record. */
export interface MigrationSourceReference {
  readonly archiveEntry: string;
  readonly originalId: string;
  readonly originalUrl?: string | undefined;
  readonly sourceKind: MigrationSourceKind;
}

/** One record-like source entry used by migration fixtures. */
export interface MigrationFixtureRecord {
  readonly assets?: readonly string[] | undefined;
  readonly authors: readonly string[];
  readonly body: string;
  readonly category?: string | undefined;
  readonly citations?: readonly string[] | undefined;
  readonly embeds?: readonly string[] | undefined;
  readonly fields: readonly MigrationPreservedField[];
  readonly id: string;
  readonly legacyPermalink?: string | undefined;
  readonly pubDate?: string | undefined;
  readonly slug: string;
  readonly source: MigrationSourceReference;
  readonly tags?: readonly string[] | undefined;
  readonly title: string;
}

/** One migrated asset fixture. */
export interface MigrationFixtureAsset {
  readonly alt?: string | undefined;
  readonly id: string;
  readonly sourceUrl: string;
  readonly state: MigrationPreservationState;
  readonly targetPath?: string | undefined;
}

/** One redirect expected from migration. */
export interface MigrationFixtureRedirect {
  readonly destination: string;
  readonly source: string;
  readonly state: MigrationPreservationState;
  readonly status: 301 | 302;
}

/** Fixture for one migration source family. */
export interface MigrationFixture {
  readonly assets: readonly MigrationFixtureAsset[];
  readonly records: readonly MigrationFixtureRecord[];
  readonly redirects: readonly MigrationFixtureRedirect[];
  readonly sourceKind: MigrationSourceKind;
}

/** Materialized source file expected from a migration fixture. */
export interface MigrationFixtureSourceOutput {
  readonly frontmatter: Readonly<Record<string, readonly string[] | string>>;
  readonly reviewRequired: boolean;
  readonly sourcePath: string;
  readonly text: string;
}

/** Source-map row expected from a migration fixture. */
export interface MigrationFixtureSourceMap {
  readonly generatedRoute: string;
  readonly originalId: string;
  readonly originalUrl?: string | undefined;
  readonly preservationStates: readonly MigrationPreservationState[];
  readonly sourceKind: MigrationSourceKind;
  readonly sourcePath: string;
}

/** Deterministic migration fixture output. */
export interface MigrationFixtureOutput {
  readonly assets: readonly MigrationFixtureAsset[];
  readonly diagnostics: readonly OutputDiagnostic[];
  readonly redirects: readonly MigrationFixtureRedirect[];
  readonly sourceMaps: readonly MigrationFixtureSourceMap[];
  readonly sources: readonly MigrationFixtureSourceOutput[];
}

/** Migration round-trip status for reports and future UI. */
export type MigrationRoundTripStatus =
  | "passed"
  | "review-required"
  | "unsupported";

/** One item in a migration human-review queue. */
export interface MigrationReviewQueueItem {
  readonly code: string;
  readonly message: string;
  readonly remediation: string;
  readonly sourcePath?: string | undefined;
}

/** Migration review report consumed by diagnostics/docs/studio surfaces. */
export interface MigrationReviewReport {
  readonly diagnostics: readonly OutputDiagnostic[];
  readonly reviewQueue: readonly MigrationReviewQueueItem[];
  readonly sourceCount: number;
  readonly status: MigrationRoundTripStatus;
  readonly summaryByCode: Readonly<Record<string, number>>;
}

/**
 * Creates deterministic source outputs, source maps, redirects, and diagnostics
 * for migration fixtures.
 *
 * @param fixture Representative migration fixture.
 * @returns Deterministic fixture output.
 */
export function createMigrationFixtureOutput(
  fixture: MigrationFixture,
): MigrationFixtureOutput {
  const records = Array.from(fixture.records).sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  const assets = Array.from(fixture.assets).sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  const redirects = Array.from(fixture.redirects).sort((left, right) =>
    left.source.localeCompare(right.source),
  );
  const assetIds = new Set(assets.map((asset) => asset.id));

  return {
    assets,
    diagnostics: [
      ...records.flatMap((record) => recordDiagnostics(record, assetIds)),
      ...assets.flatMap(assetDiagnostics),
      ...redirects.flatMap(redirectDiagnostics),
    ],
    redirects,
    sourceMaps: records.map(sourceMapForRecord),
    sources: records.map(sourceOutputForRecord),
  };
}

/**
 * Creates a deterministic migration review report from fixture outputs.
 *
 * @param outputs Migration fixture outputs.
 * @returns Human-review report for future site-doctor/studio surfaces.
 */
export function createMigrationReviewReport(
  outputs: readonly MigrationFixtureOutput[],
): MigrationReviewReport {
  const diagnostics = outputs.flatMap((output) => output.diagnostics);
  const sourceCount = outputs.reduce(
    (count, output) => count + output.sources.length,
    0,
  );

  return {
    diagnostics,
    reviewQueue: diagnostics.map(reviewQueueItem),
    sourceCount,
    status: migrationRoundTripStatus(diagnostics),
    summaryByCode: summarizeMigrationDiagnostics(diagnostics),
  };
}

/**
 * Formats a migration review report as stable Markdown.
 *
 * @param report Migration review report.
 * @returns Markdown report for docs, CLI, CI, and studio panes.
 */
export function formatMigrationReviewMarkdownReport(
  report: MigrationReviewReport,
): string {
  const summaryRows = Object.entries(report.summaryByCode)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([code, count]) => `| \`${code}\` | ${count} |`);
  const queueRows = report.reviewQueue.map(
    (item) =>
      `| \`${item.code}\` | ${item.sourcePath ?? ""} | ${item.message} | ${item.remediation} |`,
  );

  return [
    "# Migration Review Report",
    "",
    `Status: \`${report.status}\``,
    `Sources: ${report.sourceCount}`,
    `Diagnostics: ${report.diagnostics.length}`,
    "",
    "## Diagnostic Summary",
    "",
    "| Code | Count |",
    "| --- | ---: |",
    ...(summaryRows.length === 0 ? ["| None | 0 |"] : summaryRows),
    "",
    "## Review Queue",
    "",
    "| Code | Source | Message | Action |",
    "| --- | --- | --- | --- |",
    ...(queueRows.length === 0 ? ["| None |  |  |  |"] : queueRows),
    "",
  ].join("\n");
}

function sourceOutputForRecord(
  record: MigrationFixtureRecord,
): MigrationFixtureSourceOutput {
  const reviewRequired = record.fields.some(fieldNeedsReview);
  const frontmatter = sortedFrontmatter({
    authors: record.authors,
    category: record.category ?? "",
    legacyPermalink: record.legacyPermalink ?? "",
    migrationReview: reviewRequired ? "true" : "",
    pubDate: record.pubDate ?? "",
    tags: record.tags ?? [],
    title: record.title,
  });
  const sourcePath = `site/content/articles/${record.slug}.md`;

  return {
    frontmatter,
    reviewRequired,
    sourcePath,
    text: `${formatFrontmatter(frontmatter)}\n${record.body.trim()}\n`,
  };
}

function sourceMapForRecord(
  record: MigrationFixtureRecord,
): MigrationFixtureSourceMap {
  return {
    generatedRoute: `/articles/${record.slug}/`,
    originalId: record.source.originalId,
    originalUrl: record.source.originalUrl,
    preservationStates: uniquePreservationStates(record.fields),
    sourceKind: record.source.sourceKind,
    sourcePath: record.source.archiveEntry,
  };
}

function recordDiagnostics(
  record: MigrationFixtureRecord,
  assetIds: ReadonlySet<string>,
): OutputDiagnostic[] {
  return [
    ...(record.assets ?? []).map((assetId) =>
      assetIds.has(assetId)
        ? null
        : migrationDiagnostic({
            code: "content.migration-missing-asset",
            message: `${record.title} references missing migrated asset ${assetId}.`,
            remediation:
              "Add the missing asset record, remove the reference, or mark the asset as intentionally omitted.",
            sourcePath: record.source.archiveEntry,
          }),
    ),
    ...record.fields.filter(fieldNeedsReview).map((field) =>
      migrationDiagnostic({
        code: "content.migration-field-review",
        message: `${record.title} has ${field.state} migration data at ${field.fieldPath}.`,
        remediation:
          "Review the original source evidence before publishing the migrated record.",
        sourcePath: record.source.archiveEntry,
      }),
    ),
    ...(record.citations ?? []).map((citation) =>
      citation.includes("???") || citation.includes("TODO")
        ? migrationDiagnostic({
            code: "content.migration-citation-review",
            message: `${record.title} has an incomplete citation: ${citation}.`,
            remediation:
              "Verify the citation against the source and complete structured fields.",
            sourcePath: record.source.archiveEntry,
          })
        : null,
    ),
    ...(record.embeds ?? []).map((embed) =>
      embed.includes("<iframe")
        ? migrationDiagnostic({
            code: "content.migration-embed-review",
            message: `${record.title} includes embedded media that needs a static/PDF fallback review.`,
            remediation:
              "Convert embeds to a reviewed component or record a migration fallback.",
            sourcePath: record.source.archiveEntry,
          })
        : null,
    ),
  ].filter((diagnostic): diagnostic is OutputDiagnostic => diagnostic !== null);
}

function assetDiagnostics(asset: MigrationFixtureAsset): OutputDiagnostic[] {
  return fieldNeedsReview({ state: asset.state })
    ? [
        migrationDiagnostic({
          code: "content.migration-asset-review",
          message: `${asset.id} asset requires ${asset.state} migration review.`,
          remediation:
            "Confirm asset provenance, alt text, target path, and whether the asset should be localized.",
          sourcePath: asset.sourceUrl,
        }),
      ]
    : [];
}

function redirectDiagnostics(
  redirect: MigrationFixtureRedirect,
): OutputDiagnostic[] {
  return [
    isValidRedirectPath(redirect.source) &&
    isValidRedirectPath(redirect.destination)
      ? null
      : migrationDiagnostic({
          code: "content.migration-invalid-redirect",
          message: `${redirect.source} -> ${redirect.destination} is not a valid site-relative redirect.`,
          remediation:
            "Use site-relative source and destination paths before materializing redirects.",
          sourcePath: redirect.source,
        }),
    fieldNeedsReview({ state: redirect.state })
      ? migrationDiagnostic({
          code: "content.migration-redirect-review",
          message: `${redirect.source} redirect requires ${redirect.state} migration review.`,
          remediation:
            "Confirm the historical URL should point to the generated route before publishing.",
          sourcePath: redirect.source,
        })
      : null,
  ].filter((diagnostic): diagnostic is OutputDiagnostic => diagnostic !== null);
}

function migrationDiagnostic({
  code,
  message,
  remediation,
  sourcePath,
}: {
  readonly code:
    | "content.migration-asset-review"
    | "content.migration-citation-review"
    | "content.migration-embed-review"
    | "content.migration-field-review"
    | "content.migration-invalid-redirect"
    | "content.migration-missing-asset"
    | "content.migration-redirect-review";
  readonly message: string;
  readonly remediation: string;
  readonly sourcePath: string;
}): OutputDiagnostic {
  return createOutputDiagnostic({
    category: "content",
    code,
    location: { sourcePath },
    message,
    moduleId: "content.migration-fixtures",
    owner: "content",
    remediation,
    severity: "warning",
  });
}

function fieldNeedsReview({
  state,
}: {
  readonly state: MigrationPreservationState;
}): boolean {
  return (
    state === "inferred" ||
    state === "lossy" ||
    state === "manual-review" ||
    state === "unknown" ||
    state === "unsupported"
  );
}

function uniquePreservationStates(
  fields: readonly MigrationPreservedField[],
): readonly MigrationPreservationState[] {
  return Array.from(new Set(fields.map((field) => field.state))).sort();
}

function sortedFrontmatter(
  input: Readonly<Record<string, readonly string[] | string>>,
): Readonly<Record<string, readonly string[] | string>> {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) =>
        Array.isArray(value) ? value.length > 0 : value !== "",
      )
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function formatFrontmatter(
  frontmatter: Readonly<Record<string, readonly string[] | string>>,
): string {
  const lines = Object.entries(frontmatter).map(([key, value]) =>
    Array.isArray(value)
      ? `${key}: [${value.map((item) => JSON.stringify(item)).join(", ")}]`
      : `${key}: ${JSON.stringify(value)}`,
  );

  return ["---", ...lines, "---"].join("\n");
}

function isValidRedirectPath(path: string): boolean {
  return path.startsWith("/");
}

function migrationRoundTripStatus(
  diagnostics: readonly OutputDiagnostic[],
): MigrationRoundTripStatus {
  if (
    diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "content.migration-invalid-redirect" ||
        diagnostic.code === "content.migration-missing-asset",
    )
  ) {
    return "unsupported";
  }

  return diagnostics.length === 0 ? "passed" : "review-required";
}

function reviewQueueItem(
  diagnostic: OutputDiagnostic,
): MigrationReviewQueueItem {
  return {
    code: diagnostic.code,
    message: diagnostic.message,
    remediation: diagnostic.remediation ?? "",
    sourcePath: diagnostic.location?.sourcePath,
  };
}

function summarizeMigrationDiagnostics(
  diagnostics: readonly OutputDiagnostic[],
): Readonly<Record<string, number>> {
  return diagnostics.reduce<Record<string, number>>((summary, diagnostic) => {
    summary[diagnostic.code] = (summary[diagnostic.code] ?? 0) + 1;
    return summary;
  }, {});
}
