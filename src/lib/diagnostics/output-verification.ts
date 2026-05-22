/** Verifier family used for filtering, ownership, and module routing. */
export type OutputDiagnosticCategory =
  | "asset"
  | "build"
  | "cache"
  | "content"
  | "feed"
  | "html"
  | "link"
  | "metadata"
  | "pdf"
  | "redirect"
  | "route"
  | "search"
  | "security"
  | "sitemap";

/** Stable namespaced diagnostic code. */
export type OutputDiagnosticCode = `${OutputDiagnosticCategory}.${string}`;

type OutputDiagnosticSeverity = "error" | "info" | "warning";

/** Likely owner responsible for repairing a diagnostic. */
export type OutputDiagnosticOwner =
  | "content"
  | "external"
  | "generated-output"
  | "platform"
  | "site-config";

interface OutputDiagnosticLocation {
  column?: number | undefined;
  line?: number | undefined;
  outputPath?: string | undefined;
  route?: string | undefined;
  sourcePath?: string | undefined;
  url?: string | undefined;
}

/** Input used to create a generated-output diagnostic. */
export interface OutputDiagnosticInput {
  category: OutputDiagnosticCategory;
  code: OutputDiagnosticCode;
  evidence?: readonly string[] | undefined;
  location?: OutputDiagnosticLocation | undefined;
  message: string;
  moduleId: string;
  owner?: OutputDiagnosticOwner | undefined;
  remediation?: string | undefined;
  severity: OutputDiagnosticSeverity;
}

/** Structured generated-output diagnostic shared by verifier modules. */
export interface OutputDiagnostic extends OutputDiagnosticInput {
  readonly category: OutputDiagnosticCategory;
  readonly code: OutputDiagnosticCode;
  readonly evidence?: readonly string[] | undefined;
  readonly location?: OutputDiagnosticLocation | undefined;
  readonly message: string;
  readonly moduleId: string;
  readonly owner?: OutputDiagnosticOwner | undefined;
  readonly remediation?: string | undefined;
  readonly severity: OutputDiagnosticSeverity;
}

/** Build-output verification context passed into verifier modules. */
export interface OutputVerifierContext {
  artifacts?: Readonly<Record<string, unknown>> | undefined;
  distDir: string;
  rootDir: string;
  siteRootDir?: string | undefined;
}

/** A focused verifier module that emits structured diagnostics. */
export interface OutputVerifierModule {
  category: OutputDiagnosticCategory;
  id: string;
  label: string;
  run: (
    context: OutputVerifierContext,
  ) => Promise<readonly OutputDiagnostic[]> | readonly OutputDiagnostic[];
}

interface OutputDiagnosticSummary {
  byCategory: Partial<Record<OutputDiagnosticCategory, number>>;
  byModule: Record<string, number>;
  errors: number;
  info: number;
  total: number;
  warnings: number;
}

/** Machine-readable generated-output verification report. */
export interface OutputVerificationReport {
  diagnostics: readonly OutputDiagnostic[];
  summary: OutputDiagnosticSummary;
}

/**
 * Creates a generated-output diagnostic and validates its code namespace.
 *
 * @param input Diagnostic input.
 * @returns Validated generated-output diagnostic.
 */
export function createOutputDiagnostic(
  input: OutputDiagnosticInput,
): OutputDiagnostic {
  if (!input.code.startsWith(`${input.category}.`)) {
    throw new Error(
      `Diagnostic code "${input.code}" must start with "${input.category}.".`,
    );
  }

  return {
    ...input,
    evidence:
      input.evidence === undefined
        ? undefined
        : input.evidence.filter((entry) => entry.trim() !== ""),
  };
}

/**
 * Builds a machine-readable report from diagnostics.
 *
 * @param diagnostics Diagnostics emitted by verifier modules.
 * @returns Diagnostics plus summary counts.
 */
export function createOutputVerificationReport(
  diagnostics: readonly OutputDiagnostic[],
): OutputVerificationReport {
  return {
    diagnostics,
    summary: summarizeOutputDiagnostics(diagnostics),
  };
}

/**
 * Formats one diagnostic for human CLI output.
 *
 * @param diagnostic Diagnostic to format.
 * @returns Human-readable diagnostic line.
 */
export function formatOutputDiagnostic(diagnostic: OutputDiagnostic): string {
  const owner =
    diagnostic.owner === undefined ? "" : ` owner=${diagnostic.owner}`;
  const location = diagnosticLocationLabel(diagnostic.location);
  const locationLabel = location === "" ? "" : ` ${location}`;

  return `[${diagnostic.severity}] ${diagnostic.code}${locationLabel}${owner}: ${diagnostic.message}`;
}

/**
 * Returns whether any diagnostic should fail a release-style gate.
 *
 * @param diagnostics Diagnostics to inspect.
 * @returns Whether at least one diagnostic has `error` severity.
 */
export function hasBlockingOutputDiagnostics(
  diagnostics: readonly OutputDiagnostic[],
): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

/**
 * Creates a stable identity for diagnostic diffing.
 *
 * @param diagnostic Diagnostic to identify.
 * @returns Stable identity based on code, severity, and best available target.
 */
export function outputDiagnosticIdentity(diagnostic: OutputDiagnostic): string {
  const location = diagnosticLocationIdentity(diagnostic.location);
  const target = location === "" ? diagnostic.message : location;

  return `${diagnostic.severity}|${diagnostic.code}|${target}`;
}

/**
 * Runs verifier modules in order and aggregates their diagnostics.
 *
 * @param context Build-output context.
 * @param modules Verifier modules to run.
 * @returns Diagnostics emitted by all modules.
 */
export async function runOutputVerifierModules(
  context: OutputVerifierContext,
  modules: readonly OutputVerifierModule[],
): Promise<OutputDiagnostic[]> {
  const diagnostics: OutputDiagnostic[] = [];

  for (const module of modules) {
    const moduleDiagnostics = await module.run(context);
    diagnostics.push(
      ...moduleDiagnostics.map((diagnostic) =>
        createOutputDiagnostic({
          ...diagnostic,
          category: diagnostic.category,
          moduleId:
            diagnostic.moduleId === "" ? module.id : diagnostic.moduleId,
        }),
      ),
    );
  }

  return diagnostics;
}

/**
 * Summarizes diagnostics by severity, category, and module.
 *
 * @param diagnostics Diagnostics to summarize.
 * @returns Diagnostic summary counts.
 */
function summarizeOutputDiagnostics(
  diagnostics: readonly OutputDiagnostic[],
): OutputDiagnosticSummary {
  const byCategory: Partial<Record<OutputDiagnosticCategory, number>> = {};
  const byModule: Record<string, number> = {};
  let errors = 0;
  let info = 0;
  let warnings = 0;

  for (const diagnostic of diagnostics) {
    byCategory[diagnostic.category] =
      (byCategory[diagnostic.category] ?? 0) + 1;
    byModule[diagnostic.moduleId] = (byModule[diagnostic.moduleId] ?? 0) + 1;

    if (diagnostic.severity === "error") {
      errors += 1;
    } else if (diagnostic.severity === "warning") {
      warnings += 1;
    } else {
      info += 1;
    }
  }

  return {
    byCategory,
    byModule,
    errors,
    info,
    total: diagnostics.length,
    warnings,
  };
}

function diagnosticLocationIdentity(
  location: OutputDiagnosticLocation | undefined,
): string {
  if (location === undefined) {
    return "";
  }

  const target =
    location.outputPath ??
    location.sourcePath ??
    location.route ??
    location.url ??
    "";
  if (target === "") {
    return "";
  }

  const line = location.line === undefined ? "" : `:${location.line}`;
  const column = location.column === undefined ? "" : `:${location.column}`;

  return `${target}${line}${column}`;
}

function diagnosticLocationLabel(
  location: OutputDiagnosticLocation | undefined,
): string {
  const identity = diagnosticLocationIdentity(location);

  return identity === "" ? "" : `at ${identity}`;
}
