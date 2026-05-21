import { access } from "node:fs/promises";
import path from "node:path";

import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "../../../src/lib/output-verification";

/** Inputs used to verify required generated route files. */
export interface RequiredRouteOutputVerificationInput {
  distDir: string;
  requiredPaths: readonly string[];
}

/** Inputs used to verify one rendered HTML route path. */
export interface RenderedRoutePathVerificationInput {
  isRedirectFallback: boolean;
  relativeHtmlPath: string;
}

/**
 * Verifies that required generated route files exist in build output.
 *
 * @param input Build output root and relative route paths that must exist.
 * @param input.distDir Generated build output root.
 * @param input.requiredPaths Relative route output paths that must exist.
 * @returns Route diagnostics for each missing required output.
 */
export async function verifyRequiredRouteOutputs({
  distDir,
  requiredPaths,
}: RequiredRouteOutputVerificationInput): Promise<OutputDiagnostic[]> {
  const diagnostics: OutputDiagnostic[] = [];

  for (const requiredPath of requiredPaths) {
    if (!(await outputPathExists(distDir, requiredPath))) {
      diagnostics.push(requiredRouteOutputMissingDiagnostic(requiredPath));
    }
  }

  return diagnostics;
}

/**
 * Verifies that historical dated URLs are not generated as normal pages.
 *
 * @param input Rendered route path and redirect-fallback classification.
 * @param input.isRedirectFallback Whether the rendered page is a redirect fallback.
 * @param input.relativeHtmlPath Relative rendered HTML path.
 * @returns A diagnostic when a dated page is generated outside redirect output.
 */
export function verifyRenderedRoutePath({
  isRedirectFallback,
  relativeHtmlPath,
}: RenderedRoutePathVerificationInput): OutputDiagnostic[] {
  if (!isRedirectFallback && isDatedHtmlPage(relativeHtmlPath)) {
    return [unexpectedDatedRouteDiagnostic(relativeHtmlPath)];
  }

  return [];
}

/**
 * Builds the canonical diagnostic for a missing generated route.
 *
 * @param outputPath Missing relative output path.
 * @returns Route diagnostic.
 */
export function requiredRouteOutputMissingDiagnostic(
  outputPath: string,
): OutputDiagnostic {
  return createOutputDiagnostic({
    category: "route",
    code: "route.required-output-missing",
    evidence: [`missingRequired: ${outputPath}`],
    location: { outputPath },
    message: outputPath,
    moduleId: "build.routes",
    owner: "generated-output",
    remediation:
      "Generate the required route or update feature/route expectations if the route is intentionally disabled.",
    severity: "error",
  });
}

/**
 * Builds the canonical diagnostic for unexpected dated route output.
 *
 * @param outputPath Unexpected generated dated route.
 * @returns Route diagnostic.
 */
export function unexpectedDatedRouteDiagnostic(
  outputPath: string,
): OutputDiagnostic {
  return createOutputDiagnostic({
    category: "route",
    code: "route.dated-page-unexpected",
    evidence: [`unexpectedDatedPages: ${outputPath}`],
    location: { outputPath },
    message: outputPath,
    moduleId: "build.routes",
    owner: "generated-output",
    remediation:
      "Keep historical dated URLs as redirect fallbacks, not generated article pages.",
    severity: "error",
  });
}

function isDatedHtmlPage(relativeHtmlPath: string): boolean {
  return /^\d{4}\/\d{2}\/\d{2}\/[^/]+\/index\.html$/u.test(relativeHtmlPath);
}

async function outputPathExists(
  distDir: string,
  relativePath: string,
): Promise<boolean> {
  try {
    await access(path.join(distDir, relativePath));
    return true;
  } catch {
    return false;
  }
}
