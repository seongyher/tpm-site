import type { DeployAdapterResult } from "../deployment/deployment-adapters";
import type { OutputVerificationReport } from "../diagnostics/output-verification";

/** Release surface whose compatibility can change. */
export type ReleaseGovernanceArea =
  | "deployment"
  | "frontmatter"
  | "metadata"
  | "output"
  | "platform-api"
  | "routes"
  | "site-config";

/** Compatibility impact for one release change. */
export type ReleaseChangeImpact =
  | "breaking"
  | "deprecation"
  | "minor"
  | "patch"
  | "security";

/** Stable release-governance diagnostic code. */
export type ReleaseGovernanceDiagnosticCode =
  | "release.breaking-compatibility-note-missing"
  | "release.breaking-migration-note-missing"
  | "release.breaking-rollback-note-missing"
  | "release.deployment-blocked"
  | "release.deprecation-note-missing";

/** One planned or detected release change. */
export interface ReleaseGovernanceChange {
  readonly area: ReleaseGovernanceArea;
  readonly compatibilityNote?: string | undefined;
  readonly deprecationNote?: string | undefined;
  readonly impact: ReleaseChangeImpact;
  readonly migrationNote?: string | undefined;
  readonly rollbackNote?: string | undefined;
  readonly source: string;
  readonly summary: string;
}

/** Release-governance diagnostic for CI, CLI, GUI, and MCP consumers. */
export interface ReleaseGovernanceDiagnostic {
  readonly code: ReleaseGovernanceDiagnosticCode;
  readonly message: string;
  readonly severity: "error" | "warning";
  readonly source: string;
}

/** Release checklist item generated from changes and adapter reports. */
export interface ReleaseLaunchChecklistItem {
  readonly done: boolean;
  readonly owner: "deploy-operator" | "developer" | "site-owner";
  readonly required: boolean;
  readonly summary: string;
}

/** Inputs for a governed release health report. */
export interface ReleaseGovernanceReportOptions {
  readonly changes: readonly ReleaseGovernanceChange[];
  readonly deploymentResults: readonly DeployAdapterResult[];
  readonly outputVerification?: OutputVerificationReport | undefined;
  readonly releaseId: string;
  readonly title?: string | undefined;
  readonly version: string;
}

/** Summary counts for a governed release health report. */
export interface ReleaseGovernanceSummary {
  readonly blockingDiagnostics: number;
  readonly breakingChanges: number;
  readonly changeCount: number;
  readonly deploymentStatuses: Readonly<Record<string, string>>;
  readonly outputErrors: number;
  readonly outputWarnings: number;
}

/** Deterministic governed release health report. */
export interface ReleaseGovernanceReport {
  readonly changes: readonly ReleaseGovernanceChange[];
  readonly checklist: readonly ReleaseLaunchChecklistItem[];
  readonly deploymentResults: readonly DeployAdapterResult[];
  readonly diagnostics: readonly ReleaseGovernanceDiagnostic[];
  readonly releaseId: string;
  readonly summary: ReleaseGovernanceSummary;
  readonly title: string;
  readonly version: string;
}

/**
 * Creates a deterministic governed release report.
 *
 * @param options Release changes, deployment results, and verifier report.
 * @returns Release governance report.
 */
export function createReleaseGovernanceReport(
  options: ReleaseGovernanceReportOptions,
): ReleaseGovernanceReport {
  const diagnostics = releaseGovernanceDiagnostics(options);

  return {
    changes: Array.from(options.changes).sort(compareReleaseChanges),
    checklist: releaseLaunchChecklist(options, diagnostics),
    deploymentResults: options.deploymentResults,
    diagnostics,
    releaseId: options.releaseId,
    summary: releaseGovernanceSummary(options, diagnostics),
    title: options.title ?? "Release Governance Report",
    version: options.version,
  };
}

/**
 * Validates release changes and deployment results for release governance.
 *
 * @param options Release changes and deployment results.
 * @returns Release-governance diagnostics.
 */
export function releaseGovernanceDiagnostics(
  options: Pick<
    ReleaseGovernanceReportOptions,
    "changes" | "deploymentResults"
  >,
): ReleaseGovernanceDiagnostic[] {
  return [
    ...options.changes.flatMap(changeGovernanceDiagnostics),
    ...options.deploymentResults.flatMap(deploymentGovernanceDiagnostics),
  ].sort(compareDiagnostics);
}

/**
 * Formats a governed release report as deterministic Markdown.
 *
 * @param report Release governance report.
 * @returns Markdown release report.
 */
export function formatReleaseGovernanceMarkdownReport(
  report: ReleaseGovernanceReport,
): string {
  return [
    `# ${report.title}`,
    "",
    `- Release: ${report.releaseId}`,
    `- Version: ${report.version}`,
    `- Changes: ${report.summary.changeCount}`,
    `- Breaking changes: ${report.summary.breakingChanges}`,
    `- Blocking diagnostics: ${report.summary.blockingDiagnostics}`,
    `- Output errors: ${report.summary.outputErrors}`,
    `- Output warnings: ${report.summary.outputWarnings}`,
    "",
    "## Deployment Status",
    "",
    ...formatDeploymentStatuses(report),
    "",
    "## Launch Checklist",
    "",
    ...report.checklist.map(formatChecklistItem),
    "",
    "## Changes",
    "",
    ...formatChangesTable(report.changes),
    "",
    "## Diagnostics",
    "",
    ...formatDiagnosticsTable(report.diagnostics),
    "",
  ].join("\n");
}

function changeGovernanceDiagnostics(
  change: ReleaseGovernanceChange,
): ReleaseGovernanceDiagnostic[] {
  return [
    ...requiredBreakingNoteDiagnostics(change),
    ...requiredDeprecationNoteDiagnostics(change),
  ];
}

function requiredBreakingNoteDiagnostics(
  change: ReleaseGovernanceChange,
): ReleaseGovernanceDiagnostic[] {
  if (change.impact !== "breaking") {
    return [];
  }

  return [
    requiredChangeNoteDiagnostic({
      change,
      code: "release.breaking-migration-note-missing",
      field: "migrationNote",
      label: "migration",
    }),
    requiredChangeNoteDiagnostic({
      change,
      code: "release.breaking-compatibility-note-missing",
      field: "compatibilityNote",
      label: "compatibility",
    }),
    requiredChangeNoteDiagnostic({
      change,
      code: "release.breaking-rollback-note-missing",
      field: "rollbackNote",
      label: "rollback",
    }),
  ].filter(
    (diagnostic): diagnostic is ReleaseGovernanceDiagnostic =>
      diagnostic !== undefined,
  );
}

function requiredDeprecationNoteDiagnostics(
  change: ReleaseGovernanceChange,
): ReleaseGovernanceDiagnostic[] {
  if (change.impact !== "deprecation" || hasText(change.deprecationNote)) {
    return [];
  }

  return [
    {
      code: "release.deprecation-note-missing",
      message: `${change.source}: deprecation changes require a deprecation note.`,
      severity: "warning",
      source: change.source,
    },
  ];
}

function requiredChangeNoteDiagnostic({
  change,
  code,
  field,
  label,
}: {
  readonly change: ReleaseGovernanceChange;
  readonly code: ReleaseGovernanceDiagnosticCode;
  readonly field: "compatibilityNote" | "migrationNote" | "rollbackNote";
  readonly label: string;
}): ReleaseGovernanceDiagnostic | undefined {
  return hasText(releaseChangeNote(change, field))
    ? undefined
    : {
        code,
        message: `${change.source}: breaking changes require a ${label} note.`,
        severity: "error",
        source: change.source,
      };
}

function releaseChangeNote(
  change: ReleaseGovernanceChange,
  field: "compatibilityNote" | "migrationNote" | "rollbackNote",
): string | undefined {
  switch (field) {
    case "compatibilityNote":
      return change.compatibilityNote;
    case "migrationNote":
      return change.migrationNote;
    case "rollbackNote":
      return change.rollbackNote;
  }
}

function deploymentGovernanceDiagnostics(
  result: DeployAdapterResult,
): ReleaseGovernanceDiagnostic[] {
  return result.status === "blocked" || result.status === "failed"
    ? [
        {
          code: "release.deployment-blocked",
          message: `${result.target.name}: ${result.provider} deployment is ${result.status}.`,
          severity: "error",
          source: result.target.name,
        },
      ]
    : [];
}

function releaseLaunchChecklist(
  options: ReleaseGovernanceReportOptions,
  diagnostics: readonly ReleaseGovernanceDiagnostic[],
): ReleaseLaunchChecklistItem[] {
  return [
    {
      done: diagnostics.length === 0,
      owner: "developer",
      required: true,
      summary:
        "Resolve release-governance diagnostics before publishing externally.",
    },
    {
      done: (options.outputVerification?.summary.errors ?? 0) === 0,
      owner: "developer",
      required: true,
      summary: "Confirm generated-output verification has zero errors.",
    },
    ...options.deploymentResults.flatMap((result) =>
      result.manualSteps.map((step) => ({
        done: !step.required,
        owner:
          step.owner === "provider"
            ? ("deploy-operator" as const)
            : ("site-owner" as const),
        required: step.required,
        summary: step.action,
      })),
    ),
    ...options.changes
      .filter((change) => change.impact === "breaking")
      .map((change) => ({
        done:
          hasText(change.migrationNote) &&
          hasText(change.compatibilityNote) &&
          hasText(change.rollbackNote),
        owner: "developer" as const,
        required: true,
        summary: `Confirm migration, compatibility, and rollback notes for ${change.source}.`,
      })),
  ];
}

function releaseGovernanceSummary(
  options: ReleaseGovernanceReportOptions,
  diagnostics: readonly ReleaseGovernanceDiagnostic[],
): ReleaseGovernanceSummary {
  return {
    blockingDiagnostics: diagnostics.filter(
      (diagnostic) => diagnostic.severity === "error",
    ).length,
    breakingChanges: options.changes.filter(
      (change) => change.impact === "breaking",
    ).length,
    changeCount: options.changes.length,
    deploymentStatuses: Object.fromEntries(
      options.deploymentResults.map((result) => [
        result.target.name,
        result.status,
      ]),
    ),
    outputErrors: options.outputVerification?.summary.errors ?? 0,
    outputWarnings: options.outputVerification?.summary.warnings ?? 0,
  };
}

function compareReleaseChanges(
  left: ReleaseGovernanceChange,
  right: ReleaseGovernanceChange,
): number {
  const areaComparison = left.area.localeCompare(right.area);
  if (areaComparison !== 0) {
    return areaComparison;
  }

  return left.source.localeCompare(right.source);
}

function compareDiagnostics(
  left: ReleaseGovernanceDiagnostic,
  right: ReleaseGovernanceDiagnostic,
): number {
  const severityComparison =
    diagnosticSeverityRank(left.severity) -
    diagnosticSeverityRank(right.severity);

  if (severityComparison !== 0) {
    return severityComparison;
  }

  const sourceComparison = left.source.localeCompare(right.source);
  if (sourceComparison !== 0) {
    return sourceComparison;
  }

  return left.code.localeCompare(right.code);
}

function diagnosticSeverityRank(
  severity: ReleaseGovernanceDiagnostic["severity"],
): number {
  return severity === "error" ? 0 : 1;
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/gu, "\\|").replace(/\n+/gu, " ");
}

function formatChangesTable(
  changes: readonly ReleaseGovernanceChange[],
): string[] {
  if (changes.length === 0) {
    return ["No release changes recorded."];
  }

  return [
    "| Impact | Area | Source | Summary | Migration | Compatibility | Rollback |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...changes.map(
      (change) =>
        `| ${change.impact} | ${change.area} | ${escapeTableCell(change.source)} | ${escapeTableCell(change.summary)} | ${escapeTableCell(change.migrationNote ?? "")} | ${escapeTableCell(change.compatibilityNote ?? "")} | ${escapeTableCell(change.rollbackNote ?? "")} |`,
    ),
  ];
}

function formatChecklistItem(item: ReleaseLaunchChecklistItem): string {
  const marker = item.done ? "x" : " ";
  const required = item.required ? "required" : "optional";

  return `- [${marker}] (${required}, ${item.owner}) ${item.summary}`;
}

function formatDeploymentStatuses(report: ReleaseGovernanceReport): string[] {
  if (report.deploymentResults.length === 0) {
    return ["No deployment adapter results supplied."];
  }

  return [
    "| Target | Provider | Status | Diagnostics | Manual Steps |",
    "| --- | --- | --- | --- | --- |",
    ...report.deploymentResults.map(
      (result) =>
        `| ${escapeTableCell(result.target.name)} | ${result.provider} | ${result.status} | ${result.diagnostics.length} | ${result.manualSteps.length} |`,
    ),
  ];
}

function formatDiagnosticsTable(
  diagnostics: readonly ReleaseGovernanceDiagnostic[],
): string[] {
  if (diagnostics.length === 0) {
    return ["No release-governance diagnostics."];
  }

  return [
    "| Severity | Code | Source | Message |",
    "| --- | --- | --- | --- |",
    ...diagnostics.map(
      (diagnostic) =>
        `| ${diagnostic.severity} | ${diagnostic.code} | ${escapeTableCell(diagnostic.source)} | ${escapeTableCell(diagnostic.message)} |`,
    ),
  ];
}

function hasText(value: string | undefined): boolean {
  return value !== undefined && value.trim() !== "";
}
