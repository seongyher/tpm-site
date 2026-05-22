import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "./output-verification";

/** Generated-output surface that can introduce a third-party origin. */
export type ThirdPartyOriginSurface =
  | "analytics"
  | "asset"
  | "citation"
  | "cta"
  | "downloaded-asset"
  | "embed"
  | "raw-html"
  | "script"
  | "share-link";

/** Whether a reader action is required before the origin is contacted. */
export type ThirdPartyOriginInteraction =
  | "build-time"
  | "passive"
  | "unknown"
  | "user-triggered";

/** Whether the origin is essential for the intended output. */
export type ThirdPartyOriginRequirement = "optional" | "required" | "unknown";

/** Whether an asset's external origin has explicit provenance. */
export type ThirdPartyOriginProvenance = "declared" | "downloaded" | "unknown";

/** CSP coverage state for one origin reference. */
export type ThirdPartyOriginCspState =
  | "allowed"
  | "blocked"
  | "not-applicable"
  | "not-checked";

/** Policy state for one origin reference. */
export type ThirdPartyOriginPolicyState =
  | "allowed"
  | "disallowed"
  | "first-party"
  | "unknown";

/** One source reference that can introduce an external origin. */
export interface ThirdPartyOriginReference {
  readonly interaction?: ThirdPartyOriginInteraction | undefined;
  readonly label?: string | undefined;
  readonly provenance?: ThirdPartyOriginProvenance | undefined;
  readonly requirement?: ThirdPartyOriginRequirement | undefined;
  readonly sourceLine?: number | undefined;
  readonly sourcePath?: string | undefined;
  readonly surface: ThirdPartyOriginSurface;
  readonly url: string;
}

/** One allowed or disallowed origin policy entry. */
export interface ThirdPartyOriginPolicyEntry {
  readonly origin: string;
  readonly privacyNote: string;
  readonly surfaces?: readonly ThirdPartyOriginSurface[] | undefined;
}

/** Policy used to classify external origins. */
export interface ThirdPartyOriginPolicy {
  readonly allowedOrigins?: readonly ThirdPartyOriginPolicyEntry[] | undefined;
  readonly disallowedOrigins?:
    | readonly ThirdPartyOriginPolicyEntry[]
    | undefined;
  readonly firstPartyOrigins: readonly string[];
}

/** Inputs used to assess external origins. */
export interface ThirdPartyOriginAssessmentInput {
  readonly contentSecurityPolicy?: string | undefined;
  readonly policy: ThirdPartyOriginPolicy;
  readonly references: readonly ThirdPartyOriginReference[];
}

/** Classified third-party origin row. */
export interface ThirdPartyOriginFinding {
  readonly cspState: ThirdPartyOriginCspState;
  readonly interaction: ThirdPartyOriginInteraction;
  readonly origin: string;
  readonly policyState: ThirdPartyOriginPolicyState;
  readonly privacySensitive: boolean;
  readonly provenance: ThirdPartyOriginProvenance;
  readonly reference: ThirdPartyOriginReference;
  readonly requirement: ThirdPartyOriginRequirement;
}

/** Report of third-party origin references and diagnostics. */
export interface ThirdPartyOriginAssessment {
  readonly diagnostics: readonly OutputDiagnostic[];
  readonly findings: readonly ThirdPartyOriginFinding[];
}

/** Platform default third-party origin policy. */
export const defaultThirdPartyOriginPolicy = {
  allowedOrigins: [
    {
      origin: "https://w.soundcloud.com",
      privacyNote: "Bundled SoundCloud embeds render in iframes.",
      surfaces: ["embed"],
    },
    {
      origin: "https://www.youtube.com",
      privacyNote: "Bundled YouTube embeds render in iframes.",
      surfaces: ["embed"],
    },
    {
      origin: "https://www.youtube-nocookie.com",
      privacyNote: "Bundled privacy-enhanced YouTube embeds render in iframes.",
      surfaces: ["embed"],
    },
  ],
  disallowedOrigins: [],
  firstPartyOrigins: [],
} as const satisfies ThirdPartyOriginPolicy;

/**
 * Assesses third-party origin references against policy and CSP coverage.
 *
 * @param input Origin references, origin policy, and optional CSP.
 * @param input.contentSecurityPolicy Optional generated CSP header text.
 * @param input.policy Third-party origin policy.
 * @param input.references Origin references to classify.
 * @returns Classified findings and source-mapped diagnostics.
 */
export function assessThirdPartyOrigins({
  contentSecurityPolicy,
  policy,
  references,
}: ThirdPartyOriginAssessmentInput): ThirdPartyOriginAssessment {
  const csp =
    contentSecurityPolicy !== undefined && contentSecurityPolicy !== ""
      ? parseContentSecurityPolicy(contentSecurityPolicy)
      : undefined;
  const findings = references.flatMap((reference) => {
    const origin = absoluteOrigin(reference.url);
    if (origin === undefined) {
      return [];
    }

    return [
      classifyThirdPartyOrigin({
        csp,
        origin,
        policy,
        reference,
      }),
    ];
  });

  return {
    diagnostics: findings.flatMap(originDiagnostics),
    findings,
  };
}

function classifyThirdPartyOrigin({
  csp,
  origin,
  policy,
  reference,
}: {
  readonly csp: Readonly<Record<string, readonly string[]>> | undefined;
  readonly origin: string;
  readonly policy: ThirdPartyOriginPolicy;
  readonly reference: ThirdPartyOriginReference;
}): ThirdPartyOriginFinding {
  const interaction = reference.interaction ?? defaultInteraction(reference);
  const requirement = reference.requirement ?? "unknown";
  const provenance = reference.provenance ?? "unknown";
  const policyState = originPolicyState(origin, reference.surface, policy);

  return {
    cspState: cspStateForReference(origin, reference.surface, csp),
    interaction,
    origin,
    policyState,
    privacySensitive: isPrivacySensitive(reference.surface, interaction),
    provenance,
    reference,
    requirement,
  };
}

function originDiagnostics(
  finding: ThirdPartyOriginFinding,
): OutputDiagnostic[] {
  if (finding.policyState === "first-party") {
    return [];
  }

  return [
    disallowedOriginDiagnostic(finding),
    unknownOriginDiagnostic(finding),
    passiveOriginDiagnostic(finding),
    cspMismatchDiagnostic(finding),
    rawHtmlOriginDiagnostic(finding),
    externalScriptDiagnostic(finding),
    missingProvenanceDiagnostic(finding),
  ].filter((diagnostic): diagnostic is OutputDiagnostic => diagnostic !== null);
}

function disallowedOriginDiagnostic(
  finding: ThirdPartyOriginFinding,
): null | OutputDiagnostic {
  return finding.policyState === "disallowed"
    ? originDiagnostic({
        code: "security.third-party-origin-disallowed",
        finding,
        message: `${finding.origin} is disallowed for ${finding.reference.surface} output.`,
        remediation:
          "Remove this origin, replace it with a first-party/local asset, or add an explicit reviewed override.",
        severity: "error",
      })
    : null;
}

function unknownOriginDiagnostic(
  finding: ThirdPartyOriginFinding,
): null | OutputDiagnostic {
  return finding.policyState === "unknown"
    ? originDiagnostic({
        code: "security.third-party-origin-unknown",
        finding,
        message: `${finding.origin} is not declared in third-party origin policy.`,
        remediation:
          "Confirm the origin is intentional, then declare it with a privacy note or replace it with local output.",
        severity: "warning",
      })
    : null;
}

function passiveOriginDiagnostic(
  finding: ThirdPartyOriginFinding,
): null | OutputDiagnostic {
  return finding.privacySensitive
    ? originDiagnostic({
        code: "security.third-party-origin-passive",
        finding,
        message: `${finding.origin} may be contacted before the reader explicitly leaves the site.`,
        remediation:
          "Prefer first-party assets, click-to-load embeds, or a documented site-owner approval.",
        severity: "warning",
      })
    : null;
}

function cspMismatchDiagnostic(
  finding: ThirdPartyOriginFinding,
): null | OutputDiagnostic {
  return finding.cspState === "blocked"
    ? originDiagnostic({
        code: "security.third-party-origin-csp-mismatch",
        finding,
        message: `${finding.origin} appears in ${finding.reference.surface} output but is blocked by the current CSP target.`,
        remediation:
          "Either remove the origin or update the CSP target and third-party origin policy together.",
        severity: "error",
      })
    : null;
}

function rawHtmlOriginDiagnostic(
  finding: ThirdPartyOriginFinding,
): null | OutputDiagnostic {
  return finding.reference.surface === "raw-html"
    ? originDiagnostic({
        code: "security.raw-html-origin",
        finding,
        message: `Raw HTML introduces external origin ${finding.origin}.`,
        remediation:
          "Move this behavior into a reviewed component or remove the raw HTML escape hatch.",
        severity: "warning",
      })
    : null;
}

function externalScriptDiagnostic(
  finding: ThirdPartyOriginFinding,
): null | OutputDiagnostic {
  return finding.reference.surface === "script"
    ? originDiagnostic({
        code: "security.third-party-script",
        finding,
        message: `External script origin ${finding.origin} requires an explicit extension or site-owner policy.`,
        remediation:
          "Bundle scripts through the platform or add a reviewed extension/deployment policy.",
        severity: "error",
      })
    : null;
}

function missingProvenanceDiagnostic(
  finding: ThirdPartyOriginFinding,
): null | OutputDiagnostic {
  return finding.reference.surface === "downloaded-asset" &&
    finding.provenance === "unknown"
    ? originDiagnostic({
        code: "security.asset-provenance-missing",
        finding,
        message: `Downloaded asset from ${finding.origin} is missing provenance metadata.`,
        remediation:
          "Record the original URL, source note, or migration evidence for this asset.",
        severity: "warning",
      })
    : null;
}

function originDiagnostic({
  code,
  finding,
  message,
  remediation,
  severity,
}: {
  readonly code:
    | "security.asset-provenance-missing"
    | "security.raw-html-origin"
    | "security.third-party-origin-csp-mismatch"
    | "security.third-party-origin-disallowed"
    | "security.third-party-origin-passive"
    | "security.third-party-origin-unknown"
    | "security.third-party-script";
  readonly finding: ThirdPartyOriginFinding;
  readonly message: string;
  readonly remediation: string;
  readonly severity: "error" | "warning";
}): OutputDiagnostic {
  return createOutputDiagnostic({
    category: "security",
    code,
    evidence: [
      `surface=${finding.reference.surface}`,
      `interaction=${finding.interaction}`,
      `requirement=${finding.requirement}`,
      `csp=${finding.cspState}`,
      `origin=${finding.origin}`,
    ],
    location: {
      line: finding.reference.sourceLine,
      sourcePath: finding.reference.sourcePath,
      url: finding.reference.url,
    },
    message,
    moduleId: "build.third-party-origins",
    owner:
      finding.reference.surface === "citation" ||
      finding.reference.surface === "raw-html"
        ? "content"
        : "site-config",
    remediation,
    severity,
  });
}

function originPolicyState(
  origin: string,
  surface: ThirdPartyOriginSurface,
  policy: ThirdPartyOriginPolicy,
): ThirdPartyOriginPolicyState {
  if (policy.firstPartyOrigins.map(normalizeOrigin).includes(origin)) {
    return "first-party";
  }

  if (matchesPolicyEntry(origin, surface, policy.disallowedOrigins ?? [])) {
    return "disallowed";
  }

  return matchesPolicyEntry(origin, surface, policy.allowedOrigins ?? [])
    ? "allowed"
    : "unknown";
}

function matchesPolicyEntry(
  origin: string,
  surface: ThirdPartyOriginSurface,
  entries: readonly ThirdPartyOriginPolicyEntry[],
): boolean {
  return entries.some((entry) => {
    const surfaces = entry.surfaces ?? [];
    return (
      normalizeOrigin(entry.origin) === origin &&
      (surfaces.length === 0 || surfaces.includes(surface))
    );
  });
}

function cspStateForReference(
  origin: string,
  surface: ThirdPartyOriginSurface,
  csp: Readonly<Record<string, readonly string[]>> | undefined,
): ThirdPartyOriginCspState {
  const directive = cspDirectiveForSurface(surface);

  if (directive === null) {
    return "not-applicable";
  }

  if (csp === undefined) {
    return "not-checked";
  }

  return cspAllowsOrigin(origin, directiveValues(csp, directive, "default-src"))
    ? "allowed"
    : "blocked";
}

function cspDirectiveForSurface(
  surface: ThirdPartyOriginSurface,
): "connect-src" | "frame-src" | "img-src" | "script-src" | null {
  if (surface === "analytics") {
    return "connect-src";
  }

  if (surface === "asset" || surface === "downloaded-asset") {
    return "img-src";
  }

  if (surface === "embed") {
    return "frame-src";
  }

  if (surface === "script") {
    return "script-src";
  }

  return null;
}

function cspAllowsOrigin(origin: string, values: readonly string[]): boolean {
  const url = URL.parse(origin);

  if (url === null) {
    return false;
  }

  return values.some((value) => {
    if (value === "*" || value === url.protocol) {
      return true;
    }

    if (value === origin) {
      return true;
    }

    return value.endsWith(":") ? value === url.protocol : false;
  });
}

function defaultInteraction(
  reference: ThirdPartyOriginReference,
): ThirdPartyOriginInteraction {
  if (
    reference.surface === "citation" ||
    reference.surface === "cta" ||
    reference.surface === "share-link"
  ) {
    return "user-triggered";
  }

  if (reference.surface === "downloaded-asset") {
    return "build-time";
  }

  return "passive";
}

function isPrivacySensitive(
  surface: ThirdPartyOriginSurface,
  interaction: ThirdPartyOriginInteraction,
): boolean {
  return (
    interaction === "passive" &&
    (surface === "analytics" ||
      surface === "asset" ||
      surface === "embed" ||
      surface === "raw-html" ||
      surface === "script")
  );
}

function absoluteOrigin(url: string): string | undefined {
  return normalizeOrigin(URL.parse(url)?.origin);
}

function normalizeOrigin(origin: string | undefined): string | undefined {
  if (origin === undefined) {
    return undefined;
  }

  return URL.parse(origin)?.origin;
}

function parseContentSecurityPolicy(
  value: string,
): Record<string, readonly string[]> {
  return Object.fromEntries(
    value
      .split(";")
      .map((directive) => directive.trim())
      .filter((directive) => directive !== "")
      .map((directive) => {
        const [name, ...values] = directive.split(/\s+/u);
        return [name ?? "", values] as const;
      })
      .filter(([name]) => name !== ""),
  );
}

function directiveValues(
  csp: Readonly<Record<string, readonly string[]>>,
  directive: string,
  fallbackDirective: string,
): readonly string[] {
  return (
    Object.entries(csp).find(([candidate]) => candidate === directive)?.[1] ??
    Object.entries(csp).find(
      ([candidate]) => candidate === fallbackDirective,
    )?.[1] ??
    []
  );
}
