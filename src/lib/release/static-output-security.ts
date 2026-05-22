import { parseCloudflareHeaderRules } from "../deployment/deployment-adapters";
import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "../diagnostics/output-verification";

/** Trust boundary that can affect generated static output. */
export type StaticOutputTrustBoundaryKind =
  | "analytics"
  | "citation-url"
  | "downloaded-asset"
  | "embed"
  | "external-cta"
  | "json-ld"
  | "markdown-html"
  | "mdx-component"
  | "raw-html"
  | "share-link"
  | "third-party-script";

/** Default policy posture for one trust boundary. */
export type StaticOutputTrustBoundaryDisposition = "allow" | "reject" | "warn";

/** Security header assessment state. */
export type StaticOutputSecurityAssessmentState =
  | "accepted"
  | "rejected"
  | "warned";

/** One named static-output trust boundary. */
export interface StaticOutputTrustBoundary {
  readonly disposition: StaticOutputTrustBoundaryDisposition;
  readonly kind: StaticOutputTrustBoundaryKind;
  readonly privacyNote: string;
  readonly summary: string;
}

/** One target HTTP header for generated static output. */
export interface StaticOutputSecurityHeaderTarget {
  readonly header: string;
  readonly required: boolean;
  readonly valueIncludes?: readonly string[] | undefined;
}

/** Static-output security policy consumed by verifiers and docs. */
export interface StaticOutputSecurityPolicy {
  readonly cspDirectives: Readonly<Record<string, readonly string[]>>;
  readonly headers: readonly StaticOutputSecurityHeaderTarget[];
  readonly trustBoundaries: readonly StaticOutputTrustBoundary[];
}

/** Inputs used to assess static-output security headers. */
export interface StaticOutputSecurityAssessmentInput {
  readonly headersText: string;
  readonly outputPath?: string | undefined;
  readonly policy?: StaticOutputSecurityPolicy | undefined;
}

/** Result of assessing static-output security headers. */
export interface StaticOutputSecurityAssessment {
  readonly diagnostics: readonly OutputDiagnostic[];
  readonly state: StaticOutputSecurityAssessmentState;
}

/** Default static-output security policy target. */
export const defaultStaticOutputSecurityPolicy = {
  cspDirectives: {
    "base-uri": ["'self'"],
    "connect-src": ["'self'"],
    "default-src": ["'self'"],
    "frame-ancestors": ["'none'"],
    "frame-src": [
      "'self'",
      "https://w.soundcloud.com",
      "https://www.youtube.com",
      "https://www.youtube-nocookie.com",
    ],
    "img-src": ["'self'", "data:", "https:"],
    "media-src": ["'self'", "https:"],
    "object-src": ["'none'"],
    "script-src": ["'self'"],
    "style-src": ["'self'", "'unsafe-inline'"],
  },
  headers: [
    {
      header: "Content-Security-Policy",
      required: true,
    },
    {
      header: "Permissions-Policy",
      required: true,
      valueIncludes: ["camera=()", "geolocation=()", "microphone=()"],
    },
    {
      header: "Referrer-Policy",
      required: true,
      valueIncludes: ["strict-origin-when-cross-origin"],
    },
    {
      header: "X-Content-Type-Options",
      required: true,
      valueIncludes: ["nosniff"],
    },
  ],
  trustBoundaries: [
    {
      disposition: "warn",
      kind: "analytics",
      privacyNote:
        "Analytics can contact third-party origins and should be site-owner approved.",
      summary: "Third-party analytics or injected measurement scripts.",
    },
    {
      disposition: "warn",
      kind: "citation-url",
      privacyNote:
        "Citation links are user-triggered but may expose referrers to external sites.",
      summary:
        "External links generated from notes, citations, and bibliography.",
    },
    {
      disposition: "warn",
      kind: "downloaded-asset",
      privacyNote:
        "Downloaded migration assets need provenance so future owners know their origin.",
      summary: "Remote media materialized into local project assets.",
    },
    {
      disposition: "warn",
      kind: "embed",
      privacyNote:
        "Embeds may contact third-party origins before or after user interaction.",
      summary: "YouTube, SoundCloud, and future iframe/embed providers.",
    },
    {
      disposition: "warn",
      kind: "external-cta",
      privacyNote:
        "External calls to action are user-triggered but can affect reader privacy.",
      summary: "Support, social, newsletter, or payment links.",
    },
    {
      disposition: "allow",
      kind: "json-ld",
      privacyNote:
        "JSON-LD is static metadata; unsafe data must be escaped before output.",
      summary: "Structured data generated into HTML documents.",
    },
    {
      disposition: "warn",
      kind: "markdown-html",
      privacyNote:
        "Markdown HTML escape hatches can bypass normal component constraints.",
      summary: "Raw HTML embedded in Markdown content.",
    },
    {
      disposition: "warn",
      kind: "mdx-component",
      privacyNote:
        "MDX components can add scripts, embeds, or remote provider behavior.",
      summary: "Article-owned MDX components and fallbacks.",
    },
    {
      disposition: "reject",
      kind: "raw-html",
      privacyNote:
        "Unreviewed raw HTML can introduce scripts, unsafe links, or broken semantics.",
      summary:
        "Untrusted raw HTML outside documented Markdown/MDX escape hatches.",
    },
    {
      disposition: "warn",
      kind: "share-link",
      privacyNote:
        "Share links are user-triggered but can include handles, titles, and URLs.",
      summary: "Generated social sharing URLs.",
    },
    {
      disposition: "reject",
      kind: "third-party-script",
      privacyNote:
        "Third-party scripts execute in the reader's browser and require explicit policy.",
      summary: "Remote scripts not bundled by the platform.",
    },
  ],
} as const satisfies StaticOutputSecurityPolicy;

/**
 * Assesses generated static headers against the security policy target.
 *
 * @param input Header text and optional policy override.
 * @param input.headersText Static `_headers` file text.
 * @param input.outputPath Output path used in diagnostics.
 * @param input.policy Optional security policy override.
 * @returns Static-output security assessment.
 */
export function assessStaticOutputSecurityHeaders({
  headersText,
  outputPath = "_headers",
  policy = defaultStaticOutputSecurityPolicy,
}: StaticOutputSecurityAssessmentInput): StaticOutputSecurityAssessment {
  const headers = globalHeaderMap(headersText);
  const diagnostics = [
    ...missingHeaderDiagnostics(headers, policy, outputPath),
    ...cspDiagnostics(headers, policy, outputPath),
  ];

  return {
    diagnostics,
    state: assessmentState(diagnostics),
  };
}

function missingHeaderDiagnostics(
  headers: Readonly<Record<string, string>>,
  policy: StaticOutputSecurityPolicy,
  outputPath: string,
): OutputDiagnostic[] {
  return policy.headers.flatMap((target) => {
    const value = headers[normalizeHeaderName(target.header)];

    if (value === undefined) {
      return target.required
        ? [
            securityDiagnostic({
              code: "security.header-missing",
              message: `${target.header} is missing from global static headers.`,
              outputPath,
              severity: "error",
            }),
          ]
        : [];
    }

    const missingIncludes = (target.valueIncludes ?? []).filter(
      (expected) => !value.includes(expected),
    );

    return missingIncludes.length === 0
      ? []
      : [
          securityDiagnostic({
            code: "security.header-incompatible",
            message: `${target.header} is missing required value(s): ${missingIncludes.join(", ")}.`,
            outputPath,
            severity: "error",
          }),
        ];
  });
}

function cspDiagnostics(
  headers: Readonly<Record<string, string>>,
  policy: StaticOutputSecurityPolicy,
  outputPath: string,
): OutputDiagnostic[] {
  const csp = headers["content-security-policy"];
  if (csp === undefined) {
    return [];
  }

  const directives = parseContentSecurityPolicy(csp);

  return [
    ...Object.entries(policy.cspDirectives).flatMap(([directive, values]) =>
      values.every((value) =>
        directiveValues(directives, directive).includes(value),
      )
        ? []
        : [
            securityDiagnostic({
              code: "security.csp-directive-missing",
              message: `Content-Security-Policy is missing ${directive} ${values.join(" ")}.`,
              outputPath,
              severity: "error",
            }),
          ],
    ),
    ...relaxedCspDiagnostics(directives, outputPath),
  ];
}

function relaxedCspDiagnostics(
  directives: Readonly<Record<string, readonly string[]>>,
  outputPath: string,
): OutputDiagnostic[] {
  const relaxed: string[] = [];

  for (const [directive, values] of Object.entries(directives)) {
    if (values.includes("*") || values.includes("'unsafe-eval'")) {
      relaxed.push(`${directive} ${values.join(" ")}`);
    }

    if (directive === "script-src" && values.includes("'unsafe-inline'")) {
      relaxed.push(`${directive} ${values.join(" ")}`);
    }
  }

  return relaxed.map((value) =>
    securityDiagnostic({
      code: "security.csp-relaxed",
      message: `Content-Security-Policy includes relaxed directive: ${value}.`,
      outputPath,
      severity: "warning",
    }),
  );
}

function directiveValues(
  directives: Readonly<Record<string, readonly string[]>>,
  directive: string,
): readonly string[] {
  return (
    Object.entries(directives).find(
      ([candidate]) => candidate === directive,
    )?.[1] ?? []
  );
}

function globalHeaderMap(text: string): Record<string, string> {
  const globalRule = parseCloudflareHeaderRules(text).find(
    (rule) => rule.pathPattern === "/*",
  );

  return Object.fromEntries(
    Object.entries(globalRule?.headers ?? {}).map(([name, value]) => [
      normalizeHeaderName(name),
      value,
    ]),
  );
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

function assessmentState(
  diagnostics: readonly OutputDiagnostic[],
): StaticOutputSecurityAssessmentState {
  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return "rejected";
  }

  return diagnostics.some((diagnostic) => diagnostic.severity === "warning")
    ? "warned"
    : "accepted";
}

function normalizeHeaderName(name: string): string {
  return name.trim().toLowerCase();
}

function securityDiagnostic({
  code,
  message,
  outputPath,
  severity,
}: {
  readonly code:
    | "security.csp-directive-missing"
    | "security.csp-relaxed"
    | "security.header-incompatible"
    | "security.header-missing";
  readonly message: string;
  readonly outputPath: string;
  readonly severity: "error" | "warning";
}): OutputDiagnostic {
  return createOutputDiagnostic({
    category: "security",
    code,
    evidence: [message],
    location: { outputPath },
    message,
    moduleId: "build.security",
    owner: "site-config",
    remediation:
      "Update static headers or document an explicit site-owner security-policy override.",
    severity,
  });
}
