import {
  type AuthorDiagnostic,
  type AuthorDiagnosticCategory,
  type AuthorDiagnosticRepairOwner,
  createAuthorDiagnostic,
} from "./author-diagnostics";
import type {
  ObservabilityCategory,
  ObservabilityFinding,
} from "./observability";
import type {
  RouteLinkedObservabilityFinding,
  RouteLinkedObservabilityReport,
} from "./observability-reports";

type AuthorRepairableObservabilityFinding = RouteLinkedObservabilityFinding & {
  readonly disposition: "actionable";
  readonly finding: ObservabilityFinding & {
    readonly fixability: "source-edit";
    readonly owner: "author" | "site-owner";
  };
  readonly routeMatch: RouteLinkedObservabilityFinding["routeMatch"] & {
    readonly kind: "registered-route" | "unknown-internal-route";
  };
};

/** One release-health delta for route-linked observability reports. */
interface ObservabilityReleaseHealthDelta {
  readonly afterCount: number | undefined;
  readonly beforeCount: number | undefined;
  readonly finding: RouteLinkedObservabilityFinding;
}

/** Route-class summary for release-health report diffs. */
interface ObservabilityReleaseRouteClassSummary {
  readonly added: number;
  readonly changed: number;
  readonly persistent: number;
  readonly resolved: number;
  readonly routeClass: string;
}

/** Deterministic before/after observability release-health report. */
export interface ObservabilityReleaseHealthReport {
  readonly added: readonly ObservabilityReleaseHealthDelta[];
  readonly changed: readonly ObservabilityReleaseHealthDelta[];
  readonly persistent: readonly ObservabilityReleaseHealthDelta[];
  readonly resolved: readonly ObservabilityReleaseHealthDelta[];
  readonly routeClasses: readonly ObservabilityReleaseRouteClassSummary[];
  readonly title: string;
}

/** Inputs for building an observability release-health report. */
export interface ObservabilityReleaseHealthReportOptions {
  readonly baseline: RouteLinkedObservabilityReport;
  readonly candidate: RouteLinkedObservabilityReport;
  readonly title?: string | undefined;
}

/**
 * Converts source-repairable observability findings into author diagnostics.
 *
 * @param report Route-linked observability report.
 * @returns Author diagnostics for actionable source-edit findings only.
 */
export function authorDiagnosticsFromObservabilityReport(
  report: RouteLinkedObservabilityReport,
): AuthorDiagnostic[] {
  return report.findings.flatMap((finding) => {
    if (!observabilityFindingIsAuthorDiagnostic(finding)) {
      return [];
    }

    const category = authorCategoryForObservabilityCategory(
      finding.finding.category,
    );

    return [
      createAuthorDiagnostic({
        category,
        code: `${category}.observability.${diagnosticCodeSegment(finding.finding)}`,
        detail: finding.finding.detail,
        evidence: finding.finding.evidence,
        fixability: "source-edit",
        location: {
          outputPath: finding.routeMatch.outputPath,
          route: finding.finding.route ?? finding.routeMatch.route,
          sourcePath:
            finding.finding.sourcePath ??
            finding.routeMatch.sourceArtifact?.relativePath,
          url: finding.finding.url,
        },
        relatedDocs: [
          ...(finding.finding.relatedDocs ?? []),
          "docs/metadata/OBSERVABILITY_AND_WEBMASTER_REPORTS.md",
        ],
        remediation: finding.finding.remediation,
        repairOwner: authorRepairOwnerForObservabilityOwner(
          finding.finding.owner,
        ),
        severity: finding.finding.severity,
        source: "observability-import",
        sourceCode: finding.finding.providerCode,
        summary: finding.finding.summary,
      }),
    ];
  });
}

/**
 * Builds a deterministic before/after release-health report from two
 * route-linked observability reports.
 *
 * @param options Baseline and candidate reports.
 * @returns Added, resolved, changed, persistent, and route-class summaries.
 */
export function createObservabilityReleaseHealthReport(
  options: ObservabilityReleaseHealthReportOptions,
): ObservabilityReleaseHealthReport {
  const baseline = findingMap(options.baseline.findings);
  const candidate = findingMap(options.candidate.findings);
  const keys = Array.from(
    new Set([...baseline.keys(), ...candidate.keys()]),
  ).sort((left, right) => left.localeCompare(right));
  const added: ObservabilityReleaseHealthDelta[] = [];
  const changed: ObservabilityReleaseHealthDelta[] = [];
  const persistent: ObservabilityReleaseHealthDelta[] = [];
  const resolved: ObservabilityReleaseHealthDelta[] = [];

  keys.forEach((key) => {
    const before = baseline.get(key);
    const after = candidate.get(key);

    if (before === undefined && after !== undefined) {
      added.push(releaseDelta(after, undefined, trendCount(after.finding)));
    } else if (before !== undefined && after === undefined) {
      resolved.push(
        releaseDelta(before, trendCount(before.finding), undefined),
      );
    } else if (before !== undefined && after !== undefined) {
      const beforeCount = trendCount(before.finding);
      const afterCount = trendCount(after.finding);
      const target =
        beforeCount !== afterCount && beforeCount !== undefined
          ? changed
          : persistent;

      target.push(releaseDelta(after, beforeCount, afterCount));
    }
  });

  return {
    added: added.sort(compareReleaseDeltas),
    changed: changed.sort(compareReleaseDeltas),
    persistent: persistent.sort(compareReleaseDeltas),
    resolved: resolved.sort(compareReleaseDeltas),
    routeClasses: routeClassSummaries({
      added,
      changed,
      persistent,
      resolved,
    }),
    title: options.title ?? "Observability Release Health",
  };
}

/**
 * Formats an observability release-health report as deterministic Markdown.
 *
 * @param report Release-health report.
 * @returns Markdown report for release notes and incident triage.
 */
export function formatObservabilityReleaseHealthMarkdownReport(
  report: ObservabilityReleaseHealthReport,
): string {
  return [
    `# ${report.title}`,
    "",
    "## Summary",
    "",
    `- Added findings: ${report.added.length}`,
    `- Resolved findings: ${report.resolved.length}`,
    `- Changed findings: ${report.changed.length}`,
    `- Persistent findings: ${report.persistent.length}`,
    "",
    ...formatRouteClassSection(report.routeClasses),
    "",
    ...formatReleaseDeltaSection("Added Findings", report.added),
    "",
    ...formatReleaseDeltaSection("Resolved Findings", report.resolved),
    "",
    ...formatReleaseDeltaSection("Changed Counts", report.changed),
    "",
  ].join("\n");
}

function authorCategoryForObservabilityCategory(
  category: ObservabilityCategory,
): AuthorDiagnosticCategory {
  switch (category) {
    case "accessibility":
      return "accessibility";
    case "assets":
      return "assets";
    case "cache":
    case "deployment":
    case "security":
    case "uptime":
      return "deployment";
    case "crawlability":
    case "metadata":
      return "metadata";
    case "links":
    case "routes":
      return "routes";
    case "performance":
      return "performance";
    case "redirects":
      return "redirects";
    case "search":
      return "search";
    case "unknown":
      return "generated-artifacts";
  }
}

function authorRepairOwnerForObservabilityOwner(
  owner: AuthorRepairableObservabilityFinding["finding"]["owner"],
): AuthorDiagnosticRepairOwner {
  switch (owner) {
    case "author":
      return "author";
    case "site-owner":
      return "site-owner";
  }
}

function compareReleaseDeltas(
  left: ObservabilityReleaseHealthDelta,
  right: ObservabilityReleaseHealthDelta,
): number {
  const routeClassComparison = routeClass(left.finding).localeCompare(
    routeClass(right.finding),
  );

  if (routeClassComparison !== 0) {
    return routeClassComparison;
  }

  const severityComparison = left.finding.finding.severity.localeCompare(
    right.finding.finding.severity,
  );

  if (severityComparison !== 0) {
    return severityComparison;
  }

  return findingLabel(left.finding).localeCompare(findingLabel(right.finding));
}

function diagnosticCodeSegment(finding: ObservabilityFinding): string {
  return [
    finding.source,
    finding.providerCode ?? finding.category,
    finding.noise,
  ]
    .join(".")
    .replace(/[^a-z0-9.]+/giu, "-")
    .toLowerCase();
}

function escapeMarkdownTableCell(value: string): string {
  return value.replace(/\|/gu, "\\|").replace(/\n+/gu, " ");
}

function findingIdentity(finding: RouteLinkedObservabilityFinding): string {
  return JSON.stringify([
    finding.finding.source,
    finding.finding.providerCode ?? "",
    finding.finding.category,
    finding.finding.route ?? "",
    finding.finding.url ?? "",
    finding.finding.summary,
  ]);
}

function findingLabel(finding: RouteLinkedObservabilityFinding): string {
  return [
    finding.finding.route ?? finding.finding.url ?? "global",
    finding.finding.source,
    finding.finding.providerCode ?? finding.finding.category,
    finding.finding.summary,
  ].join(" / ");
}

function findingMap(
  findings: readonly RouteLinkedObservabilityFinding[],
): Map<string, RouteLinkedObservabilityFinding> {
  return new Map(
    findings.map((finding) => [findingIdentity(finding), finding]),
  );
}

function formatReleaseDeltaSection(
  title: string,
  deltas: readonly ObservabilityReleaseHealthDelta[],
): string[] {
  if (deltas.length === 0) {
    return [`## ${title}`, "", "No findings."];
  }

  return [
    `## ${title}`,
    "",
    "| Route class | Severity | Source | Finding | Before | After |",
    "| --- | --- | --- | --- | --- | --- |",
    ...deltas
      .map((delta) =>
        [
          routeClass(delta.finding),
          delta.finding.finding.severity,
          sourceLabel(delta.finding.finding),
          delta.finding.finding.summary,
          countLabel(delta.beforeCount),
          countLabel(delta.afterCount),
        ]
          .map(escapeMarkdownTableCell)
          .join(" | "),
      )
      .map((row) => `| ${row} |`),
  ];
}

function formatRouteClassSection(
  summaries: readonly ObservabilityReleaseRouteClassSummary[],
): string[] {
  if (summaries.length === 0) {
    return ["## Route Class Changes", "", "No route-class changes."];
  }

  return [
    "## Route Class Changes",
    "",
    "| Route class | Added | Resolved | Changed | Persistent |",
    "| --- | --- | --- | --- | --- |",
    ...summaries.map(
      (summary) =>
        `| ${escapeMarkdownTableCell(summary.routeClass)} | ${summary.added} | ${summary.resolved} | ${summary.changed} | ${summary.persistent} |`,
    ),
  ];
}

function countLabel(value: number | undefined): string {
  return value === undefined ? "-" : String(value);
}

function observabilityFindingIsAuthorDiagnostic(
  finding: RouteLinkedObservabilityFinding,
): finding is AuthorRepairableObservabilityFinding {
  return (
    finding.disposition === "actionable" &&
    finding.finding.fixability === "source-edit" &&
    (finding.finding.owner === "author" ||
      finding.finding.owner === "site-owner") &&
    (finding.routeMatch.kind === "registered-route" ||
      finding.routeMatch.kind === "unknown-internal-route")
  );
}

function releaseDelta(
  finding: RouteLinkedObservabilityFinding,
  beforeCount: number | undefined,
  afterCount: number | undefined,
): ObservabilityReleaseHealthDelta {
  return { afterCount, beforeCount, finding };
}

function routeClass(finding: RouteLinkedObservabilityFinding): string {
  return finding.routeMatch.routeKey ?? finding.routeMatch.kind;
}

function routeClassSummaries(groups: {
  readonly added: readonly ObservabilityReleaseHealthDelta[];
  readonly changed: readonly ObservabilityReleaseHealthDelta[];
  readonly persistent: readonly ObservabilityReleaseHealthDelta[];
  readonly resolved: readonly ObservabilityReleaseHealthDelta[];
}): ObservabilityReleaseRouteClassSummary[] {
  const routeClasses = new Set([
    ...groups.added.map((delta) => routeClass(delta.finding)),
    ...groups.changed.map((delta) => routeClass(delta.finding)),
    ...groups.persistent.map((delta) => routeClass(delta.finding)),
    ...groups.resolved.map((delta) => routeClass(delta.finding)),
  ]);

  return Array.from(routeClasses)
    .sort((left, right) => left.localeCompare(right))
    .map((entry) => ({
      added: groups.added.filter((delta) => routeClass(delta.finding) === entry)
        .length,
      changed: groups.changed.filter(
        (delta) => routeClass(delta.finding) === entry,
      ).length,
      persistent: groups.persistent.filter(
        (delta) => routeClass(delta.finding) === entry,
      ).length,
      resolved: groups.resolved.filter(
        (delta) => routeClass(delta.finding) === entry,
      ).length,
      routeClass: entry,
    }));
}

function sourceLabel(finding: ObservabilityFinding): string {
  return finding.providerCode === undefined
    ? finding.source
    : `${finding.source}:${finding.providerCode}`;
}

function trendCount(finding: ObservabilityFinding): number | undefined {
  return finding.trend?.current;
}
