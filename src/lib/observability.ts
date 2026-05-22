/** Source family that produced an observability finding. */
type ObservabilitySourceFamily =
  | "accessibility"
  | "bing"
  | "cloudflare"
  | "lighthouse"
  | "link-scanner"
  | "manual"
  | "search-console"
  | "security"
  | "unlighthouse"
  | "uptime";

/** Normalized observability finding category. */
export type ObservabilityCategory =
  | "accessibility"
  | "assets"
  | "cache"
  | "crawlability"
  | "deployment"
  | "links"
  | "metadata"
  | "performance"
  | "redirects"
  | "routes"
  | "search"
  | "security"
  | "unknown"
  | "uptime";

/** Normalized observability finding severity. */
export type ObservabilitySeverity = "error" | "info" | "warning";

/** Normalized observability lifecycle status. */
type ObservabilityStatus =
  | "improved"
  | "open"
  | "regressed"
  | "resolved"
  | "unknown";

/** Domain most likely responsible for an observability finding. */
export type ObservabilityOwner =
  | "author"
  | "developer"
  | "external"
  | "platform"
  | "site-owner"
  | "unknown";

/** Repair path expected for an observability finding. */
export type ObservabilityFixability =
  | "code-change"
  | "external-action"
  | "investigate"
  | "regenerate"
  | "source-edit";

/** Confidence in an observability finding classification. */
type ObservabilityConfidence = "high" | "low" | "medium";

/** Noise or actionability classification for an observability finding. */
export type ObservabilityNoiseClass =
  | "actionable"
  | "bot-noise"
  | "expected"
  | "provider-noise"
  | "stale-crawler"
  | "unclear";

/** Trend facts imported from provider reports or computed from baselines. */
interface ObservabilityTrend {
  readonly affectedRoutes?: number | undefined;
  readonly current?: number | undefined;
  readonly delta?: number | undefined;
  readonly firstSeen?: string | undefined;
  readonly lastSeen?: string | undefined;
  readonly previous?: number | undefined;
  readonly sampleSize?: number | undefined;
}

/** Input for one normalized observability finding. */
export interface ObservabilityFindingInput {
  readonly category: ObservabilityCategory;
  readonly confidence: ObservabilityConfidence;
  readonly detail?: string | undefined;
  readonly evidence?: readonly string[] | undefined;
  readonly fixability: ObservabilityFixability;
  readonly noise: ObservabilityNoiseClass;
  readonly outputPath?: string | undefined;
  readonly owner: ObservabilityOwner;
  readonly provider?: string | undefined;
  readonly providerCode?: string | undefined;
  readonly relatedDocs?: readonly string[] | undefined;
  readonly remediation?: string | undefined;
  readonly route?: string | undefined;
  readonly severity: ObservabilitySeverity;
  readonly source: ObservabilitySourceFamily;
  readonly sourcePath?: string | undefined;
  readonly status?: ObservabilityStatus | undefined;
  readonly summary: string;
  readonly trend?: ObservabilityTrend | undefined;
  readonly url?: string | undefined;
}

/** Normalized observability finding used by reports, diagnostics, and studio surfaces. */
export interface ObservabilityFinding extends ObservabilityFindingInput {
  readonly status: ObservabilityStatus;
}

/** Summary counts for one normalized observability report. */
interface ObservabilityReportSummary {
  readonly byCategory: Record<string, number>;
  readonly byNoise: Record<string, number>;
  readonly byOwner: Record<string, number>;
  readonly bySeverity: Record<string, number>;
  readonly total: number;
}

/** JSON-ready normalized observability report. */
export interface ObservabilityReport {
  readonly findings: readonly ObservabilityFinding[];
  readonly summary: ObservabilityReportSummary;
}

/** Options for converting Lighthouse JSON into findings. */
export interface LighthouseObservabilityOptions {
  readonly provider?: string | undefined;
  readonly route?: string | undefined;
  readonly url?: string | undefined;
}

/** Options for parsing provider status rows. */
export interface StatusRowObservabilityOptions {
  readonly provider?: string | undefined;
}

/** Options for parsing generic webmaster rows. */
export interface WebmasterRowObservabilityOptions {
  readonly provider?: string | undefined;
  readonly source: Extract<
    ObservabilitySourceFamily,
    "bing" | "search-console"
  >;
}

/**
 * Creates a normalized observability finding with deterministic defaults.
 *
 * @param input Finding input from a provider parser or manual import.
 * @returns Normalized finding.
 */
export function createObservabilityFinding(
  input: ObservabilityFindingInput,
): ObservabilityFinding {
  return {
    ...input,
    evidence: filteredStrings(input.evidence),
    relatedDocs: filteredStrings(input.relatedDocs),
    route: input.route === undefined ? undefined : normalizeRoute(input.route),
    status: input.status ?? "open",
    url:
      input.url === undefined ? undefined : redactObservabilityUrl(input.url),
  };
}

/**
 * Builds a JSON-ready report from normalized observability findings.
 *
 * @param findings Normalized findings.
 * @returns Findings plus summary counts.
 */
export function createObservabilityReport(
  findings: readonly ObservabilityFinding[],
): ObservabilityReport {
  return {
    findings,
    summary: {
      byCategory: countBy(findings, (finding) => finding.category),
      byNoise: countBy(findings, (finding) => finding.noise),
      byOwner: countBy(findings, (finding) => finding.owner),
      bySeverity: countBy(findings, (finding) => finding.severity),
      total: findings.length,
    },
  };
}

/**
 * Converts a Lighthouse report JSON object into actionable audit findings.
 *
 * @param value Unknown parsed Lighthouse JSON.
 * @param options Route and provider metadata for the imported report.
 * @returns Normalized findings for failed scored audits.
 */
export function observabilityFindingsFromLighthouseReport(
  value: unknown,
  options: LighthouseObservabilityOptions = {},
): ObservabilityFinding[] {
  if (!isRecord(value) || !isRecord(value["audits"])) {
    return [];
  }

  return Object.entries(value["audits"]).flatMap(([id, audit]) => {
    if (!isRecord(audit) || !isFailingScoredAudit(audit)) {
      return [];
    }

    return [
      createObservabilityFinding({
        category: lighthouseCategoryForAudit(id),
        confidence: "high",
        detail: stringValue(audit["description"]),
        evidence: [stringValue(audit["displayValue"])].filter(
          (entry): entry is string => entry !== undefined,
        ),
        fixability: "code-change",
        noise: "actionable",
        owner: "developer",
        provider: options.provider ?? "lighthouse",
        providerCode: id,
        relatedDocs: ["docs/performance/route-class-performance-budgets.md"],
        remediation:
          "Investigate the route-class performance budget and either fix the source issue or document accepted provider noise.",
        route: options.route,
        severity: lighthouseSeverityForScore(audit["score"]),
        source: "lighthouse",
        summary:
          stringValue(audit["title"]) ?? `Lighthouse audit ${id} failed.`,
        url: options.url,
      }),
    ];
  });
}

/**
 * Converts Cloudflare-style status rows into route and deployment findings.
 *
 * @param value Unknown rows or `{ rows }` object.
 * @param options Provider metadata.
 * @returns Normalized route/deployment findings.
 */
export function observabilityFindingsFromStatusRows(
  value: unknown,
  options: StatusRowObservabilityOptions = {},
): ObservabilityFinding[] {
  return rowsFrom(value).flatMap((row) => {
    const status = numberValue(row["status"] ?? row["statusCode"]);
    const count = numberValue(row["count"] ?? row["requests"]);
    const rawPath = stringValue(row["path"] ?? row["url"]);

    if (status === undefined || rawPath === undefined || status < 400) {
      return [];
    }

    const route = internalRouteFromUrl(rawPath);
    const noise = httpNoiseClass(rawPath, status);

    return [
      createObservabilityFinding({
        category: status >= 500 ? "deployment" : "routes",
        confidence: noise === "actionable" ? "medium" : "high",
        fixability: noise === "actionable" ? "source-edit" : "investigate",
        noise,
        owner: noise === "actionable" ? "site-owner" : "external",
        provider: options.provider ?? "cloudflare",
        providerCode: `http-${status}`,
        relatedDocs: ["docs/CLOUDFLARE_WORKERS_MIGRATION.md"],
        remediation:
          noise === "actionable"
            ? "Add or fix the source route, redirect, public file, or deploy configuration."
            : "Keep this classified as crawler/provider noise unless it becomes a recurring actionable route.",
        route,
        severity: status >= 500 ? "error" : "warning",
        source: "cloudflare",
        summary: `${status} response observed for ${route ?? redactObservabilityUrl(rawPath)}.`,
        trend: { current: count },
        url: rawPath,
      }),
    ];
  });
}

/**
 * Converts Search Console or Bing webmaster rows into normalized findings.
 *
 * @param value Unknown rows or `{ rows }` object.
 * @param options Source and provider metadata.
 * @returns Normalized webmaster findings.
 */
export function observabilityFindingsFromWebmasterRows(
  value: unknown,
  options: WebmasterRowObservabilityOptions,
): ObservabilityFinding[] {
  return rowsFrom(value).flatMap((row) => {
    const issue = stringValue(row["issue"] ?? row["message"] ?? row["reason"]);
    const rawUrl = stringValue(row["url"] ?? row["page"] ?? row["path"]);

    if (issue === undefined || rawUrl === undefined) {
      return [];
    }

    const category = webmasterCategory(issue);
    const route = internalRouteFromUrl(rawUrl);

    return [
      createObservabilityFinding({
        category,
        confidence: route === undefined ? "low" : "medium",
        detail: stringValue(row["detail"]),
        evidence: [stringValue(row["sample"])].filter(
          (entry): entry is string => entry !== undefined,
        ),
        fixability: route === undefined ? "investigate" : "source-edit",
        noise: "unclear",
        owner: route === undefined ? "unknown" : "site-owner",
        provider: options.provider ?? options.source,
        providerCode: issue.toLowerCase().replace(/\s+/gu, "-"),
        relatedDocs: ["docs/OBSERVABILITY_AND_WEBMASTER_REPORTS.md"],
        remediation:
          "Triage the finding against current source routes, redirects, metadata, and generated-output verifier results.",
        route,
        severity: severityFromUnknown(row["severity"]),
        source: options.source,
        summary: issue,
        url: rawUrl,
      }),
    ];
  });
}

/**
 * Converts local link-scanner rows into route-linked findings.
 *
 * @param value Unknown rows or `{ rows }` object.
 * @returns Normalized link findings.
 */
export function observabilityFindingsFromLinkScannerRows(
  value: unknown,
): ObservabilityFinding[] {
  return rowsFrom(value).flatMap((row) => {
    const page = stringValue(row["page"] ?? row["source"]);
    const target = stringValue(row["target"] ?? row["url"] ?? row["href"]);

    if (page === undefined || target === undefined) {
      return [];
    }

    return [
      createObservabilityFinding({
        category: "links",
        confidence: "high",
        detail: stringValue(row["message"]),
        fixability: "source-edit",
        noise: "actionable",
        owner: "author",
        provider: "local-link-scanner",
        providerCode: "broken-link",
        relatedDocs: ["docs/AUTHORING_WORKFLOW.md"],
        remediation:
          "Update the source link target, add the missing source asset, or add an intentional redirect.",
        route: internalRouteFromUrl(page),
        severity: "error",
        source: "link-scanner",
        summary: `Broken link from ${page} to ${target}.`,
        url: target,
      }),
    ];
  });
}

/**
 * Redacts an observability URL for safe storage in reports.
 *
 * @param value URL or path to redact.
 * @returns URL/path without query string or hash.
 */
export function redactObservabilityUrl(value: string): string {
  const trimmed = value.trim();

  if (trimmed.startsWith("/")) {
    return normalizeRoute(trimmed);
  }

  const externalMatch = /^(https?:\/\/[^/?#]+)([^?#]*)/iu.exec(trimmed);

  if (externalMatch !== null) {
    const origin = externalMatch[1] ?? "";
    const pathname = externalMatch[2] ?? "/";

    return `${origin}${normalizeRoute(pathname)}`;
  }

  return trimmed.split("#")[0]?.split("?")[0] ?? trimmed;
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

function filteredStrings(
  values: readonly string[] | undefined,
): readonly string[] | undefined {
  if (values === undefined) {
    return undefined;
  }

  const filtered = values.filter((entry) => entry.trim() !== "");

  return filtered.length === 0 ? undefined : filtered;
}

function httpNoiseClass(
  pathOrUrl: string,
  status: number,
): ObservabilityNoiseClass {
  if (status >= 500) {
    return "actionable";
  }

  const lower = pathOrUrl.toLowerCase();

  if (
    lower.includes("/.env") ||
    lower.includes("/.git") ||
    lower.includes("docker-compose") ||
    lower.includes("/attacker/")
  ) {
    return "bot-noise";
  }

  if (lower.includes("/assets/") || lower.includes("/wp-content/")) {
    return "stale-crawler";
  }

  return "actionable";
}

function internalRouteFromUrl(value: string): string | undefined {
  const redacted = redactObservabilityUrl(value);

  if (redacted.startsWith("/")) {
    return redacted;
  }

  const externalMatch = /^https?:\/\/[^/?#]+([^?#]*)/iu.exec(redacted);

  if (externalMatch !== null) {
    return normalizeRoute(externalMatch[1] ?? "/");
  }

  return undefined;
}

function isFailingScoredAudit(audit: Record<string, unknown>): boolean {
  const score = numberValue(audit["score"]);
  const scoreDisplayMode = stringValue(audit["scoreDisplayMode"]);

  return (
    score !== undefined &&
    score < 1 &&
    scoreDisplayMode !== "notApplicable" &&
    scoreDisplayMode !== "informative"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function lighthouseCategoryForAudit(id: string): ObservabilityCategory {
  if (id.includes("cache") || id.includes("ttl")) {
    return "cache";
  }

  if (id.includes("meta") || id.includes("crawl")) {
    return "metadata";
  }

  return "performance";
}

function lighthouseSeverityForScore(value: unknown): ObservabilitySeverity {
  const score = numberValue(value);

  return score !== undefined && score < 0.5 ? "error" : "warning";
}

function normalizeRoute(value: string): string {
  const pathOnly = value.split("#")[0]?.split("?")[0] ?? value;
  const withSlash = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;

  if (withSlash === "/" || /\.[a-z0-9]+$/iu.test(withSlash)) {
    return withSlash;
  }

  return withSlash.endsWith("/") ? withSlash : `${withSlash}/`;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function rowsFrom(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }

  if (isRecord(value) && Array.isArray(value["rows"])) {
    return value["rows"].filter(isRecord);
  }

  return [];
}

function severityFromUnknown(value: unknown): ObservabilitySeverity {
  if (value === "error" || value === "warning" || value === "info") {
    return value;
  }

  return "warning";
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : undefined;
}

function webmasterCategory(issue: string): ObservabilityCategory {
  const lower = issue.toLowerCase();

  if (lower.includes("redirect")) {
    return "redirects";
  }

  if (lower.includes("metadata") || lower.includes("title")) {
    return "metadata";
  }

  if (lower.includes("crawl") || lower.includes("index")) {
    return "crawlability";
  }

  if (lower.includes("link")) {
    return "links";
  }

  return "search";
}
