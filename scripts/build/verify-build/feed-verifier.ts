import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "../../../src/lib/diagnostics/output-verification";

/** Inputs used to verify a generated RSS feed file. */
export interface FeedFileVerificationInput {
  distDir: string;
  file: string;
}

/**
 * Verifies generated feed XML against TPM feed policy.
 *
 * @param input Build output root and feed file path.
 * @param input.distDir Generated build output root.
 * @param input.file Absolute feed file path.
 * @returns Feed diagnostics for feed policy violations.
 */
export async function verifyFeedFile({
  distDir,
  file,
}: FeedFileVerificationInput): Promise<OutputDiagnostic[]> {
  return verifyFeedXml({
    relativePath: toPosix(path.relative(distDir, file)),
    xml: await readFile(file, "utf8"),
  });
}

/**
 * Verifies feed XML text against TPM feed policy.
 *
 * @param input Feed XML and relative output path.
 * @param input.relativePath Relative feed output path.
 * @param input.xml Feed XML text.
 * @returns Feed diagnostics for feed policy violations.
 */
export function verifyFeedXml({
  relativePath,
  xml,
}: {
  relativePath: string;
  xml: string;
}): OutputDiagnostic[] {
  const enclosureCount = Array.from(
    xml.matchAll(/<enclosure\b[^>]*>/giu),
  ).length;

  return enclosureCount === 0
    ? []
    : [unexpectedFeedEnclosuresDiagnostic(relativePath, enclosureCount)];
}

/**
 * Builds the canonical diagnostic for unexpected RSS enclosures.
 *
 * @param outputPath Feed output path.
 * @param enclosureCount Number of rendered enclosure elements.
 * @returns Feed policy diagnostic.
 */
export function unexpectedFeedEnclosuresDiagnostic(
  outputPath: string,
  enclosureCount: number,
): OutputDiagnostic {
  const message = `${outputPath}: RSS feed must not include item enclosures; found ${enclosureCount}`;

  return createOutputDiagnostic({
    category: "feed",
    code: "feed.enclosure-unexpected",
    evidence: [`socialImageIssues: ${message}`],
    location: { outputPath },
    message,
    moduleId: "build.feed",
    owner: "generated-output",
    remediation:
      "Remove RSS item enclosures; social preview metadata on article pages owns image discovery.",
    severity: "error",
  });
}

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}
