import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "../diagnostics/output-verification";

/** Workflow stage where a supply-chain check should run. */
export type SupplyChainWorkflowStage =
  | "fast-local"
  | "package-release"
  | "pr"
  | "release"
  | "starter-template";

/** Stable supply-chain check identifier. */
export type SupplyChainCheckId =
  | "asset-provenance"
  | "dependency-audit-all"
  | "dependency-audit-high"
  | "lockfile-present"
  | "public-env-secret-name"
  | "secret-scan"
  | "third-party-script-policy";

/** One supply-chain policy check. */
export interface SupplyChainPolicyCheck {
  readonly blocking: boolean;
  readonly command?: string | undefined;
  readonly id: SupplyChainCheckId;
  readonly owner: "author" | "developer" | "release-operator";
  readonly summary: string;
  readonly workflowStages: readonly SupplyChainWorkflowStage[];
}

/** Supply-chain policy configuration. */
export interface SupplyChainPolicy {
  readonly checks: readonly SupplyChainPolicyCheck[];
  readonly ignoredSecretEnvGlobs: readonly string[];
  readonly requiredReleaseScripts: readonly string[];
  readonly secretLikePatterns: readonly RegExp[];
}

/** Inputs used to assess supply-chain policy coverage. */
export interface SupplyChainPolicyAssessmentInput {
  readonly generatedOutputSamples?: readonly SupplyChainOutputSample[];
  readonly gitignoreText: string;
  readonly lockfilePresent: boolean;
  readonly packageScripts: Readonly<Record<string, string>>;
  readonly policy?: SupplyChainPolicy | undefined;
  readonly publicEnvNames?: readonly string[] | undefined;
}

/** One generated-output text sample checked for secret-like values. */
export interface SupplyChainOutputSample {
  readonly outputPath: string;
  readonly text: string;
}

/** Supply-chain assessment result. */
export interface SupplyChainPolicyAssessment {
  readonly checks: readonly SupplyChainPolicyCheck[];
  readonly diagnostics: readonly OutputDiagnostic[];
}

/** Default dependency, lockfile, secret, and supply-chain policy. */
export const defaultSupplyChainPolicy = {
  checks: [
    {
      blocking: true,
      command: "bun --silent run audit",
      id: "dependency-audit-high",
      owner: "release-operator",
      summary: "High-severity dependency audit blocks release checks.",
      workflowStages: ["pr", "release", "package-release", "starter-template"],
    },
    {
      blocking: false,
      command: "bun --silent run audit:all",
      id: "dependency-audit-all",
      owner: "developer",
      summary: "All-severity dependency audits are maintenance review signal.",
      workflowStages: ["pr", "package-release", "starter-template"],
    },
    {
      blocking: true,
      command: "bun --silent run secrets",
      id: "secret-scan",
      owner: "release-operator",
      summary: "Gitleaks history scan blocks release checks when available.",
      workflowStages: ["pr", "release", "package-release", "starter-template"],
    },
    {
      blocking: true,
      id: "lockfile-present",
      owner: "developer",
      summary: "Bun lockfile is committed for reproducible dependency inputs.",
      workflowStages: ["fast-local", "pr", "release", "package-release"],
    },
    {
      blocking: true,
      id: "public-env-secret-name",
      owner: "developer",
      summary:
        "Secret-like `PUBLIC_*` environment variable names are rejected.",
      workflowStages: ["fast-local", "pr", "release", "starter-template"],
    },
    {
      blocking: true,
      id: "third-party-script-policy",
      owner: "release-operator",
      summary:
        "Third-party scripts are rejected unless a reviewed policy allows them.",
      workflowStages: ["pr", "release", "starter-template"],
    },
    {
      blocking: false,
      id: "asset-provenance",
      owner: "author",
      summary:
        "Migrated/downloaded assets should preserve original source provenance.",
      workflowStages: ["fast-local", "pr", "release", "starter-template"],
    },
  ],
  ignoredSecretEnvGlobs: [".env.local", ".env.*.local"],
  requiredReleaseScripts: ["audit", "secrets"],
  secretLikePatterns: [
    /AKIA[0-9A-Z]{16}/u,
    /ghp_\w{20,}/u,
    /sk-[A-Za-z0-9]{20,}/u,
  ],
} as const satisfies SupplyChainPolicy;

/**
 * Assesses dependency, lockfile, secret, and supply-chain policy coverage.
 *
 * @param input Repository policy inputs.
 * @param input.generatedOutputSamples Generated output snippets to scan.
 * @param input.gitignoreText Repository gitignore text.
 * @param input.lockfilePresent Whether the Bun lockfile is present.
 * @param input.packageScripts Package scripts keyed by script name.
 * @param input.policy Optional supply-chain policy override.
 * @param input.publicEnvNames Public environment variable names to inspect.
 * @returns Supply-chain checks and diagnostics.
 */
export function assessSupplyChainPolicy({
  generatedOutputSamples = [],
  gitignoreText,
  lockfilePresent,
  packageScripts,
  policy = defaultSupplyChainPolicy,
  publicEnvNames = [],
}: SupplyChainPolicyAssessmentInput): SupplyChainPolicyAssessment {
  return {
    checks: policy.checks,
    diagnostics: [
      ...releaseCommandDiagnostics(packageScripts, policy),
      ...gitignoreDiagnostics(gitignoreText, policy),
      ...lockfileDiagnostics(lockfilePresent),
      ...publicEnvDiagnostics(publicEnvNames),
      ...generatedSecretDiagnostics(generatedOutputSamples, policy),
    ],
  };
}

/**
 * Redacts secret-like values for logs and diagnostics.
 *
 * @param value Text to redact.
 * @param policy Optional supply-chain policy override.
 * @returns Text with secret-like values replaced by a stable placeholder.
 */
export function redactSecretLikeValues(
  value: string,
  policy: SupplyChainPolicy = defaultSupplyChainPolicy,
): string {
  return policy.secretLikePatterns.reduce(
    (text, pattern) => text.replace(pattern, "[REDACTED_SECRET]"),
    value,
  );
}

function releaseCommandDiagnostics(
  packageScripts: Readonly<Record<string, string>>,
  policy: SupplyChainPolicy,
): OutputDiagnostic[] {
  const releaseCommand = packageScripts["check:release"] ?? "";

  return policy.requiredReleaseScripts.flatMap((script) =>
    releaseCommand.includes(`run ${script}`) ||
    releaseCommand.includes(`&& ${script}`)
      ? []
      : [
          supplyChainDiagnostic({
            code: "security.release-security-command-missing",
            message: `check:release does not run ${script}.`,
            remediation:
              "Add the security command to check:release or document a replacement gate in the supply-chain policy.",
            severity: "error",
          }),
        ],
  );
}

function gitignoreDiagnostics(
  gitignoreText: string,
  policy: SupplyChainPolicy,
): OutputDiagnostic[] {
  const ignoredLines = new Set(
    gitignoreText
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line !== "" && !line.startsWith("#")),
  );

  return policy.ignoredSecretEnvGlobs.flatMap((entry) =>
    ignoredLines.has(entry)
      ? []
      : [
          supplyChainDiagnostic({
            code: "security.secret-env-ignore-missing",
            message: `${entry} is not ignored.`,
            remediation:
              "Add local secret env files to .gitignore so credentials are not committed.",
            severity: "error",
          }),
        ],
  );
}

function lockfileDiagnostics(lockfilePresent: boolean): OutputDiagnostic[] {
  return lockfilePresent
    ? []
    : [
        supplyChainDiagnostic({
          code: "security.lockfile-missing",
          message: "bun.lock is missing from the repository inputs.",
          remediation:
            "Commit bun.lock or explicitly document a reproducible package-manager replacement.",
          severity: "error",
        }),
      ];
}

function publicEnvDiagnostics(
  publicEnvNames: readonly string[],
): OutputDiagnostic[] {
  return publicEnvNames
    .filter((name) => /^PUBLIC_.*(?:KEY|SECRET|TOKEN|PASSWORD)/iu.test(name))
    .map((name) =>
      supplyChainDiagnostic({
        code: "security.public-env-secret-name",
        message: `${name} looks like a secret but would be public in client output.`,
        remediation:
          "Rename the value and keep secrets server-side or in provider credentials.",
        severity: "error",
      }),
    );
}

function generatedSecretDiagnostics(
  samples: readonly SupplyChainOutputSample[],
  policy: SupplyChainPolicy,
): OutputDiagnostic[] {
  return samples.flatMap((sample) =>
    policy.secretLikePatterns.some((pattern) => pattern.test(sample.text))
      ? [
          supplyChainDiagnostic({
            code: "security.generated-output-secret",
            evidence: [redactSecretLikeValues(sample.text, policy)],
            location: { outputPath: sample.outputPath },
            message: `${sample.outputPath} contains a secret-like value.`,
            remediation:
              "Remove the secret from source/config and regenerate output before release.",
            severity: "error",
          }),
        ]
      : [],
  );
}

function supplyChainDiagnostic({
  code,
  evidence,
  location,
  message,
  remediation,
  severity,
}: {
  readonly code:
    | "security.generated-output-secret"
    | "security.lockfile-missing"
    | "security.public-env-secret-name"
    | "security.release-security-command-missing"
    | "security.secret-env-ignore-missing";
  readonly evidence?: readonly string[] | undefined;
  readonly location?: undefined | { readonly outputPath?: string | undefined };
  readonly message: string;
  readonly remediation: string;
  readonly severity: "error" | "warning";
}): OutputDiagnostic {
  return createOutputDiagnostic({
    category: "security",
    code,
    evidence,
    location,
    message,
    moduleId: "build.supply-chain",
    owner: "platform",
    remediation,
    severity,
  });
}
