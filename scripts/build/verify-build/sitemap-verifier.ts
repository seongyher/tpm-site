import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "../../../src/lib/diagnostics/output-verification";
import { sitemapIncludesPath } from "../../../src/lib/metadata/metadata";

/** Inputs used to verify a generated sitemap XML file. */
export interface SitemapFileVerificationInput {
  distDir: string;
  file: string;
}

/**
 * Verifies one generated sitemap file against noindex policy.
 *
 * @param input Build output root and sitemap file path.
 * @param input.distDir Generated build output root.
 * @param input.file Absolute sitemap file path.
 * @returns Sitemap diagnostics for invalid or disallowed sitemap entries.
 */
export async function verifySitemapFile({
  distDir,
  file,
}: SitemapFileVerificationInput): Promise<OutputDiagnostic[]> {
  return verifySitemapXml({
    relativePath: toPosix(path.relative(distDir, file)),
    xml: await readFile(file, "utf8"),
  });
}

/**
 * Verifies sitemap XML text against noindex policy.
 *
 * @param input Sitemap XML and relative output path.
 * @param input.relativePath Relative sitemap output path.
 * @param input.xml Sitemap XML text.
 * @returns Sitemap diagnostics for invalid or disallowed sitemap entries.
 */
export function verifySitemapXml({
  relativePath,
  xml,
}: {
  relativePath: string;
  xml: string;
}): OutputDiagnostic[] {
  const diagnostics: OutputDiagnostic[] = [];
  const locPattern = /<loc>([^<]+)<\/loc>/giu;
  let match: null | RegExpExecArray;

  while ((match = locPattern.exec(xml)) !== null) {
    const loc = match[1];
    if (loc === undefined) {
      continue;
    }

    const pathname = absoluteUrlPathname(loc);
    if (pathname === undefined) {
      diagnostics.push(invalidSitemapUrlDiagnostic(relativePath, loc));
    } else if (!sitemapIncludesPath(pathname)) {
      diagnostics.push(noindexSitemapPathDiagnostic(relativePath, pathname));
    }
  }

  return diagnostics;
}

/**
 * Builds the canonical diagnostic for an invalid sitemap URL.
 *
 * @param outputPath Sitemap output path.
 * @param loc Invalid loc value.
 * @returns Sitemap policy diagnostic.
 */
export function invalidSitemapUrlDiagnostic(
  outputPath: string,
  loc: string,
): OutputDiagnostic {
  const message = `${outputPath}: sitemap contains invalid URL ${loc}`;

  return createOutputDiagnostic({
    category: "sitemap",
    code: "sitemap.loc-invalid",
    evidence: [`metadataIssues: ${message}`],
    location: { outputPath, url: loc },
    message,
    moduleId: "build.sitemap",
    owner: "generated-output",
    remediation: "Ensure sitemap loc entries are absolute public URLs.",
    severity: "error",
  });
}

/**
 * Builds the canonical diagnostic for a noindex route in the sitemap.
 *
 * @param outputPath Sitemap output path.
 * @param pathname Disallowed route pathname.
 * @returns Sitemap policy diagnostic.
 */
export function noindexSitemapPathDiagnostic(
  outputPath: string,
  pathname: string,
): OutputDiagnostic {
  const message = `${outputPath}: sitemap includes noindex route ${pathname}`;

  return createOutputDiagnostic({
    category: "sitemap",
    code: "sitemap.noindex-route-included",
    evidence: [`metadataIssues: ${message}`],
    location: { outputPath, route: pathname },
    message,
    moduleId: "build.sitemap",
    owner: "generated-output",
    remediation: "Remove noindex routes from generated sitemap output.",
    severity: "error",
  });
}

/**
 * Extracts an absolute URL pathname without constructing a mutable URL object.
 *
 * @param value Absolute URL string.
 * @returns URL pathname, or `undefined` for non-absolute input.
 */
function absoluteUrlPathname(value: string): string | undefined {
  const authoritySeparator = value.indexOf("://");
  if (authoritySeparator <= 0) {
    return undefined;
  }

  const pathStart = value.indexOf("/", authoritySeparator + 3);
  if (pathStart === -1) {
    return "/";
  }

  const queryStart = value.indexOf("?", pathStart);
  const hashStart = value.indexOf("#", pathStart);
  const pathEndCandidates = [queryStart, hashStart].filter(
    (index) => index >= 0,
  );
  const pathEnd =
    pathEndCandidates.length === 0
      ? value.length
      : Math.min(...pathEndCandidates);

  const pathname = value.slice(pathStart, pathEnd);
  return pathname === "" ? "/" : pathname;
}

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}
