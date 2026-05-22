import { access } from "node:fs/promises";
import path from "node:path";

import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "../../../src/lib/diagnostics/output-verification";

/** Inputs used to verify configured legacy redirect fallback files. */
export interface MissingLegacyRedirectVerificationInput {
  distDir: string;
  expectedRedirects: Readonly<Record<string, string>>;
}

/** Inputs used to verify one generated redirect fallback HTML file. */
export interface LegacyRedirectHtmlVerificationInput {
  expectedRedirects: Readonly<Record<string, string>>;
  html: string;
  relativeHtmlPath: string;
}

/**
 * Verifies that configured legacy redirects generated static fallback pages.
 *
 * @param input Build output root and configured redirect map.
 * @param input.distDir Generated build output root.
 * @param input.expectedRedirects Configured legacy redirect map.
 * @returns Redirect diagnostics for missing fallback pages.
 */
export async function verifyMissingLegacyRedirectFallbacks({
  distDir,
  expectedRedirects,
}: MissingLegacyRedirectVerificationInput): Promise<OutputDiagnostic[]> {
  const diagnostics: OutputDiagnostic[] = [];

  for (const [source, destination] of Object.entries(expectedRedirects)) {
    const fallbackPath = redirectFallbackPath(source);
    if (!(await outputPathExists(distDir, fallbackPath))) {
      diagnostics.push(
        missingLegacyRedirectFallbackDiagnostic({
          destination,
          fallbackPath,
          source,
        }),
      );
    }
  }

  return diagnostics;
}

/**
 * Verifies that one generated redirect fallback matches Astro config.
 *
 * @param input Redirect fallback HTML, output path, and configured redirect map.
 * @param input.expectedRedirects Configured legacy redirect map.
 * @param input.html Rendered redirect fallback HTML.
 * @param input.relativeHtmlPath Relative fallback output path.
 * @returns Redirect diagnostics for unconfigured or mismatched fallback output.
 */
export function verifyLegacyRedirectFallbackHtml({
  expectedRedirects,
  html,
  relativeHtmlPath,
}: LegacyRedirectHtmlVerificationInput): OutputDiagnostic[] {
  const source = expectedRedirectSource(relativeHtmlPath);
  const expectedDestination = new Map(Object.entries(expectedRedirects)).get(
    source,
  );

  if (expectedDestination === undefined) {
    return [
      invalidLegacyRedirectFallbackDiagnostic(
        relativeHtmlPath,
        `no matching redirect in astro.config.ts for ${source}`,
      ),
    ];
  }

  if (!htmlIncludesRedirect(html, source, expectedDestination)) {
    return [
      invalidLegacyRedirectFallbackDiagnostic(
        relativeHtmlPath,
        `does not match configured redirect ${source} -> ${expectedDestination}`,
      ),
    ];
  }

  return [];
}

/**
 * Detects Astro's generated noindex redirect fallback page shape.
 *
 * @param html Rendered HTML.
 * @param relativeHtmlPath Relative output path being inspected.
 * @returns Whether the page is a redirect fallback.
 */
export function isAstroRedirectFallbackPage(
  html: string,
  relativeHtmlPath: string,
): boolean {
  return (
    /<title>Redirecting to: [^<]+<\/title>/iu.test(html) &&
    /<meta\s+http-equiv=["']refresh["']\s+content=["']0;url=[^"']+["']>/iu.test(
      html,
    ) &&
    /<meta\s+name=["']robots["']\s+content=["']noindex["']>/iu.test(html) &&
    /<link\s+rel=["']canonical["']\s+href=["']https?:\/\/[^"']+["']>/iu.test(
      html,
    ) &&
    html.includes(`<code>${expectedRedirectSource(relativeHtmlPath)}</code>`)
  );
}

/**
 * Builds the canonical missing legacy redirect fallback diagnostic.
 *
 * @param input Redirect source, destination, and expected fallback path.
 * @param input.destination Redirect destination.
 * @param input.fallbackPath Expected generated fallback output path.
 * @param input.source Redirect source route.
 * @returns Redirect diagnostic.
 */
export function missingLegacyRedirectFallbackDiagnostic({
  destination,
  fallbackPath,
  source,
}: {
  destination: string;
  fallbackPath: string;
  source: string;
}): OutputDiagnostic {
  const message = `${source} -> ${destination} (${fallbackPath})`;

  return createOutputDiagnostic({
    category: "redirect",
    code: "redirect.legacy-fallback-missing",
    evidence: [`missingLegacyRedirects: ${message}`],
    location: { route: source },
    message,
    moduleId: "build.redirects",
    owner: "site-config",
    remediation:
      "Generate redirect fallback output for every configured legacy redirect.",
    severity: "error",
  });
}

/**
 * Builds the canonical invalid legacy redirect fallback diagnostic.
 *
 * @param outputPath Redirect fallback output path.
 * @param reason Human-readable mismatch reason.
 * @returns Redirect diagnostic.
 */
export function invalidLegacyRedirectFallbackDiagnostic(
  outputPath: string,
  reason: string,
): OutputDiagnostic {
  const message = `${outputPath}: ${reason}`;

  return createOutputDiagnostic({
    category: "redirect",
    code: "redirect.legacy-fallback-invalid",
    evidence: [`invalidLegacyRedirects: ${message}`],
    location: { outputPath },
    message,
    moduleId: "build.redirects",
    owner: "site-config",
    remediation:
      "Regenerate or correct the legacy redirect fallback so it matches configured redirects.",
    severity: "error",
  });
}

function expectedRedirectSource(relativeHtmlPath: string): string {
  return `/${relativeHtmlPath.replace(/index\.html$/u, "")}`;
}

function htmlIncludesRedirect(
  html: string,
  source: string,
  destination: string,
): boolean {
  return (
    html.includes(`<title>Redirecting to: ${destination}</title>`) &&
    html.includes(`content="0;url=${destination}"`) &&
    html.includes(`href="${destination}"`) &&
    html.includes(`<code>${source}</code>`) &&
    html.includes(`<code>${destination}</code>`)
  );
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

function redirectFallbackPath(source: string): string {
  return `${source.replace(/^\//u, "")}index.html`;
}
