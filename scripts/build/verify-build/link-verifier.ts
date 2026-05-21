import { access } from "node:fs/promises";
import path from "node:path";

import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "../../../src/lib/output-verification";

/** Inputs used to verify rendered internal links in one HTML page. */
export interface HtmlInternalLinkVerificationInput {
  distDir: string;
  html: string;
  relativeHtmlPath: string;
}

/**
 * Checks whether a URL points outside the generated static site.
 *
 * @param url URL or URL-like target from rendered HTML.
 * @returns True for protocol-relative, absolute, mail, or telephone URLs.
 */
export function isExternal(url: string): boolean {
  // eslint-disable-next-line security/detect-unsafe-regex -- URL scheme detection is bounded to the target string.
  return /^(?:[a-z]+:)?\/\//iu.test(url) || /^(?:mailto|tel):/iu.test(url);
}

/**
 * Extracts link and asset targets from rendered HTML attributes.
 *
 * @param html Rendered HTML text.
 * @returns Values from `href` and `src` attributes.
 */
export function linkTargets(html: string): string[] {
  const targets: string[] = [];
  const attributePattern = /\s(?:href|src)=["']([^"']+)["']/giu;
  let match: null | RegExpExecArray;

  while ((match = attributePattern.exec(html)) !== null) {
    const target = match[1];
    if (target !== undefined) {
      targets.push(target);
    }
  }

  return targets;
}

/**
 * Verifies that rendered local links and asset targets exist in `dist`.
 *
 * @param input HTML, source route, and build output root.
 * @param input.distDir Generated build output root.
 * @param input.html Rendered HTML text.
 * @param input.relativeHtmlPath Relative HTML output path that owns the links.
 * @returns Link diagnostics for missing local targets.
 */
export async function verifyHtmlInternalLinks({
  distDir,
  html,
  relativeHtmlPath,
}: HtmlInternalLinkVerificationInput): Promise<OutputDiagnostic[]> {
  const diagnostics: OutputDiagnostic[] = [];

  for (const target of linkTargets(html)) {
    if (!isExternal(target) && !(await internalTargetExists(distDir, target))) {
      diagnostics.push(missingInternalLinkDiagnostic(relativeHtmlPath, target));
    }
  }

  return diagnostics;
}

/**
 * Builds the canonical diagnostic for a missing rendered internal target.
 *
 * @param sourcePath Rendered HTML output that owns the link.
 * @param target Missing href/src target.
 * @returns Link diagnostic.
 */
export function missingInternalLinkDiagnostic(
  sourcePath: string,
  target: string,
): OutputDiagnostic {
  const message = `${sourcePath} -> ${target}`;

  return createOutputDiagnostic({
    category: "link",
    code: "link.internal-target-missing",
    evidence: [`brokenLinks: ${message}`],
    location: { outputPath: sourcePath },
    message,
    moduleId: "build.links",
    owner: "content",
    remediation:
      "Update the rendered link target or generate the missing internal route.",
    severity: "error",
  });
}

async function internalTargetExists(
  distDir: string,
  url: string,
): Promise<boolean> {
  const cleanUrl = withoutFragmentAndQuery(url);
  if (cleanUrl === "" || cleanUrl.startsWith("#")) {
    return true;
  }
  if (!cleanUrl.startsWith("/")) {
    return true;
  }

  const decoded = decodeURIComponent(cleanUrl).replace(/^\//u, "");
  const candidates = [
    decoded,
    path.join(decoded, "index.html"),
    decoded.endsWith("/") ? path.join(decoded, "index.html") : "",
  ].filter((candidate): candidate is string => candidate !== "");

  for (const candidate of candidates) {
    if (await outputPathExists(distDir, candidate)) {
      return true;
    }
  }

  return false;
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

function withoutFragmentAndQuery(url: string): string {
  return url.split("#")[0]?.split("?")[0] ?? "";
}
