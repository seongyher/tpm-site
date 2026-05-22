import type { RouteRegistryEntry } from "../routes/route-registry";
import type {
  SourceArtifactEntry,
  SourceArtifactManifest,
} from "../site/source-artifacts";
import type {
  ObservabilityCategory,
  ObservabilityFinding,
  ObservabilityFixability,
  ObservabilityNoiseClass,
  ObservabilityOwner,
  ObservabilitySeverity,
} from "./observability";

/** High-level report disposition for one observability finding. */
type ObservabilityReportDisposition = "actionable" | "needs-triage" | "noise";

/** Route matching class for an observability finding. */
type ObservabilityRouteMatchKind =
  | "external"
  | "registered-route"
  | "unknown-internal-route"
  | "unmapped";

/** Route/source facts attached to an observability finding. */
interface ObservabilityRouteMatch {
  readonly artifactKey?: string | undefined;
  readonly enabled?: boolean | undefined;
  readonly entity?: string | undefined;
  readonly feature?: string | undefined;
  readonly kind: ObservabilityRouteMatchKind;
  readonly outputPath?: string | undefined;
  readonly route?: string | undefined;
  readonly routeKey?: string | undefined;
  readonly sourceArtifact?: ObservabilitySourceArtifactReference | undefined;
}

/** Safe source-artifact reference for JSON and Markdown reports. */
interface ObservabilitySourceArtifactReference {
  readonly key: string;
  readonly owner: string;
  readonly relativePath: string;
  readonly role: string;
}

/** Observability finding plus route/source/report classification. */
export interface RouteLinkedObservabilityFinding {
  readonly disposition: ObservabilityReportDisposition;
  readonly finding: ObservabilityFinding;
  readonly routeMatch: ObservabilityRouteMatch;
}

/** Summary counts for a route-linked observability report. */
interface RouteLinkedObservabilityReportSummary {
  readonly byCategory: Record<string, number>;
  readonly byDisposition: Record<string, number>;
  readonly byFixability: Record<string, number>;
  readonly byNoise: Record<string, number>;
  readonly byOwner: Record<string, number>;
  readonly byRouteMatch: Record<string, number>;
  readonly bySeverity: Record<string, number>;
  readonly total: number;
}

/** Deterministic route-linked webmaster/observability report. */
export interface RouteLinkedObservabilityReport {
  readonly findings: readonly RouteLinkedObservabilityFinding[];
  readonly summary: RouteLinkedObservabilityReportSummary;
  readonly title: string;
}

/** Inputs for building a route-linked observability report. */
export interface RouteLinkedObservabilityReportOptions {
  readonly routeRegistry: readonly RouteRegistryEntry[];
  readonly sourceArtifacts?: SourceArtifactManifest | undefined;
  readonly title?: string | undefined;
}

/**
 * Builds a deterministic route-linked observability report.
 *
 * @param findings Normalized observability findings.
 * @param options Route registry and optional source-artifact facts.
 * @returns Findings linked to route/source ownership plus summary counts.
 */
export function createRouteLinkedObservabilityReport(
  findings: readonly ObservabilityFinding[],
  options: RouteLinkedObservabilityReportOptions,
): RouteLinkedObservabilityReport {
  const linkedFindings = routeLinkObservabilityFindings(findings, options);

  return {
    findings: linkedFindings,
    summary: summarizeRouteLinkedFindings(linkedFindings),
    title: options.title ?? "Webmaster Observability Report",
  };
}

/**
 * Links normalized observability findings to route registry and source facts.
 *
 * @param findings Normalized observability findings.
 * @param options Route registry and optional source-artifact facts.
 * @returns Route-linked findings sorted for stable reports.
 */
export function routeLinkObservabilityFindings(
  findings: readonly ObservabilityFinding[],
  options: RouteLinkedObservabilityReportOptions,
): RouteLinkedObservabilityFinding[] {
  return findings
    .map((finding) => ({
      disposition: dispositionForNoise(finding.noise),
      finding,
      routeMatch: routeMatchForFinding(finding, options),
    }))
    .sort(compareLinkedFindings);
}

/**
 * Formats a route-linked observability report as deterministic Markdown.
 *
 * @param report Route-linked observability report.
 * @returns Markdown report suitable for generated tooling artifacts.
 */
export function formatRouteLinkedObservabilityMarkdownReport(
  report: RouteLinkedObservabilityReport,
): string {
  return [
    `# ${report.title}`,
    "",
    "## Summary",
    "",
    `- Total findings: ${report.summary.total}`,
    `- Actionable findings: ${report.summary.byDisposition["actionable"] ?? 0}`,
    `- Needs triage: ${report.summary.byDisposition["needs-triage"] ?? 0}`,
    `- Noise or accepted findings: ${report.summary.byDisposition["noise"] ?? 0}`,
    "",
    ...formatFindingSection(
      "Actionable Findings",
      report.findings.filter((finding) => finding.disposition === "actionable"),
    ),
    "",
    ...formatFindingSection(
      "Needs Triage",
      report.findings.filter(
        (finding) => finding.disposition === "needs-triage",
      ),
    ),
    "",
    ...formatFindingSection(
      "Noise And Accepted Findings",
      report.findings.filter((finding) => finding.disposition === "noise"),
    ),
    "",
  ].join("\n");
}

function compareLinkedFindings(
  left: RouteLinkedObservabilityFinding,
  right: RouteLinkedObservabilityFinding,
): number {
  const dispositionComparison =
    dispositionRank(left.disposition) - dispositionRank(right.disposition);

  if (dispositionComparison !== 0) {
    return dispositionComparison;
  }

  const severityComparison =
    severityRank(left.finding.severity) - severityRank(right.finding.severity);

  if (severityComparison !== 0) {
    return severityComparison;
  }

  const routeComparison = routeLabel(left).localeCompare(routeLabel(right));

  if (routeComparison !== 0) {
    return routeComparison;
  }

  const sourceComparison = left.finding.source.localeCompare(
    right.finding.source,
  );

  if (sourceComparison !== 0) {
    return sourceComparison;
  }

  return left.finding.summary.localeCompare(right.finding.summary);
}

function countBy<T>(
  values: readonly T[],
  keyFor: (value: T) => string,
): Record<string, number> {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    const key = keyFor(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Object.fromEntries(
    Array.from(counts.entries()).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

function dispositionForNoise(
  noise: ObservabilityNoiseClass,
): ObservabilityReportDisposition {
  switch (noise) {
    case "actionable":
      return "actionable";
    case "bot-noise":
    case "expected":
    case "provider-noise":
    case "stale-crawler":
      return "noise";
    case "unclear":
      return "needs-triage";
  }
}

function dispositionRank(disposition: ObservabilityReportDisposition): number {
  switch (disposition) {
    case "actionable":
      return 0;
    case "needs-triage":
      return 1;
    case "noise":
      return 2;
  }
}

function escapeMarkdownTableCell(value: string): string {
  return value.replace(/\|/gu, "\\|").replace(/\n+/gu, " ");
}

function formatFindingSection(
  title: string,
  findings: readonly RouteLinkedObservabilityFinding[],
): string[] {
  if (findings.length === 0) {
    return [`## ${title}`, "", "No findings."];
  }

  return [
    `## ${title}`,
    "",
    "| Severity | Category | Route | Owner | Source | Finding | Remediation |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...findings.map(formatFindingTableRow),
  ];
}

function formatFindingTableRow(
  finding: RouteLinkedObservabilityFinding,
): string {
  const cells = [
    finding.finding.severity,
    finding.finding.category,
    routeLabel(finding),
    finding.finding.owner,
    sourceLabel(finding.finding),
    finding.finding.summary,
    finding.finding.remediation ?? "",
  ].map(escapeMarkdownTableCell);

  return `| ${cells.join(" | ")} |`;
}

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//iu.test(value);
}

function normalizeReportPath(value: string): string {
  const pathOnly = value.split("#")[0]?.split("?")[0] ?? value;
  const withSlash = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;

  if (withSlash === "/" || /\.[a-z0-9]+$/iu.test(withSlash)) {
    return withSlash;
  }

  return withSlash.endsWith("/") ? withSlash : `${withSlash}/`;
}

function routeLabel(finding: RouteLinkedObservabilityFinding): string {
  if (finding.routeMatch.kind === "registered-route") {
    const route =
      finding.finding.route ?? finding.routeMatch.route ?? "unknown";
    const routeKey = finding.routeMatch.routeKey ?? "unknown";

    return `${route} (${routeKey})`;
  }

  return finding.finding.route ?? finding.finding.url ?? "unmapped";
}

function routeMatchForFinding(
  finding: ObservabilityFinding,
  options: RouteLinkedObservabilityReportOptions,
): ObservabilityRouteMatch {
  if (finding.route !== undefined) {
    const registryEntry = routeRegistryEntryForPath(
      finding.route,
      options.routeRegistry,
    );

    if (registryEntry !== undefined) {
      return routeMatchForRegistryEntry(registryEntry, options.sourceArtifacts);
    }

    return {
      kind: "unknown-internal-route",
      route: finding.route,
    };
  }

  if (finding.url !== undefined && isExternalUrl(finding.url)) {
    return {
      kind: "external",
    };
  }

  return {
    kind: "unmapped",
  };
}

function routeMatchForRegistryEntry(
  entry: RouteRegistryEntry,
  sourceArtifacts: SourceArtifactManifest | undefined,
): ObservabilityRouteMatch {
  return {
    artifactKey: entry.artifactKey,
    enabled: entry.enabled,
    entity: entry.entity,
    feature: entry.feature,
    kind: "registered-route",
    outputPath: entry.outputPath,
    route: entry.route,
    routeKey: entry.routeKey,
    sourceArtifact: sourceArtifactReference(entry.artifactKey, sourceArtifacts),
  };
}

function routeOwnsReportPath(path: string, route: string): boolean {
  const normalizedPath = normalizeReportPath(path);
  const normalizedRoute = normalizeReportPath(route);

  if (normalizedRoute === "/") {
    return normalizedPath === "/";
  }

  if (/\.[a-z0-9]+$/iu.test(normalizedRoute)) {
    return normalizedPath === normalizedRoute;
  }

  return (
    normalizedPath === normalizedRoute ||
    normalizedPath.startsWith(normalizedRoute)
  );
}

function routeRegistryEntryForPath(
  path: string,
  entries: readonly RouteRegistryEntry[],
): RouteRegistryEntry | undefined {
  return entries
    .filter((entry) => routeOwnsReportPath(path, entry.route))
    .sort((left, right) => right.route.length - left.route.length)[0];
}

function severityRank(severity: ObservabilitySeverity): number {
  switch (severity) {
    case "error":
      return 0;
    case "info":
      return 2;
    case "warning":
      return 1;
  }
}

function sourceArtifactReference(
  artifactKey: string,
  sourceArtifacts: SourceArtifactManifest | undefined,
): ObservabilitySourceArtifactReference | undefined {
  const entry = sourceArtifacts?.entries.find(
    (candidate: SourceArtifactEntry) => candidate.key === artifactKey,
  );

  if (entry === undefined) {
    return undefined;
  }

  return {
    key: entry.key,
    owner: entry.owner,
    relativePath: entry.relativePath,
    role: entry.role,
  };
}

function sourceLabel(finding: ObservabilityFinding): string {
  return finding.providerCode === undefined
    ? finding.source
    : `${finding.source}:${finding.providerCode}`;
}

function summarizeRouteLinkedFindings(
  findings: readonly RouteLinkedObservabilityFinding[],
): RouteLinkedObservabilityReportSummary {
  return {
    byCategory: countBy(
      findings,
      (finding): ObservabilityCategory => finding.finding.category,
    ),
    byDisposition: countBy(
      findings,
      (finding): ObservabilityReportDisposition => finding.disposition,
    ),
    byFixability: countBy(
      findings,
      (finding): ObservabilityFixability => finding.finding.fixability,
    ),
    byNoise: countBy(
      findings,
      (finding): ObservabilityNoiseClass => finding.finding.noise,
    ),
    byOwner: countBy(
      findings,
      (finding): ObservabilityOwner => finding.finding.owner,
    ),
    byRouteMatch: countBy(
      findings,
      (finding): ObservabilityRouteMatchKind => finding.routeMatch.kind,
    ),
    bySeverity: countBy(
      findings,
      (finding): ObservabilitySeverity => finding.finding.severity,
    ),
    total: findings.length,
  };
}
