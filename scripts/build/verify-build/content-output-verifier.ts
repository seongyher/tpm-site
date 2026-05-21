import { access, readFile } from "node:fs/promises";
import path from "node:path";

import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "../../../src/lib/output-verification";

/** Inputs used to verify draft content does not leak into generated indexes. */
export interface DraftLeakVerificationInput {
  distDir: string;
  draftSlugs: readonly string[];
  file: string;
}

/** Inputs used to verify generated article page count. */
export interface ArticlePageCountVerificationInput {
  actualArticlePageCount: number;
  expectedArticlePageCount: number;
}

/**
 * Verifies that generated metadata/index files do not contain draft slugs.
 *
 * @param input Build output root, generated file path, and draft slugs.
 * @param input.distDir Generated build output root.
 * @param input.draftSlugs Source draft slugs.
 * @param input.file Absolute generated file path.
 * @returns Content diagnostics for draft leaks.
 */
export async function verifyDraftLeaks({
  distDir,
  draftSlugs,
  file,
}: DraftLeakVerificationInput): Promise<OutputDiagnostic[]> {
  const relativePath = toPosix(path.relative(distDir, file));
  if (
    relativePath !== "feed.xml" &&
    !/^sitemap.*\.xml$/u.test(relativePath) &&
    !relativePath.startsWith("pagefind/")
  ) {
    return [];
  }

  const diagnostics: OutputDiagnostic[] = [];
  const text = await readFile(file, "utf8");
  for (const draftSlug of draftSlugs) {
    if (text.includes(draftSlug)) {
      diagnostics.push(draftLeakDiagnostic(relativePath, draftSlug));
    }
  }

  return diagnostics;
}

/**
 * Verifies expected and actual generated article page counts match.
 *
 * @param input Expected and actual article page counts.
 * @param input.actualArticlePageCount Generated article page count.
 * @param input.expectedArticlePageCount Published source article count.
 * @returns Content diagnostics for article count mismatches.
 */
export function verifyArticlePageCount({
  actualArticlePageCount,
  expectedArticlePageCount,
}: ArticlePageCountVerificationInput): OutputDiagnostic[] {
  return actualArticlePageCount === expectedArticlePageCount
    ? []
    : [
        articleCountMismatchDiagnostic(
          expectedArticlePageCount,
          actualArticlePageCount,
        ),
      ];
}

/**
 * Verifies that private component catalog output is absent.
 *
 * @param distDir Generated build output root.
 * @returns Build diagnostics for private catalog output.
 */
export async function verifyCatalogOutput(
  distDir: string,
): Promise<OutputDiagnostic[]> {
  return (await outputPathExists(distDir, "catalog"))
    ? [catalogLeakDiagnostic("catalog/")]
    : [];
}

/**
 * Builds the canonical draft leak diagnostic.
 *
 * @param outputPath Relative generated output path.
 * @param draftSlug Draft source slug found in output.
 * @returns Content diagnostic.
 */
export function draftLeakDiagnostic(
  outputPath: string,
  draftSlug: string,
): OutputDiagnostic {
  const message = `${outputPath} -> ${draftSlug}`;

  return createOutputDiagnostic({
    category: "content",
    code: "content.draft-leak",
    evidence: [`draftLeaks: ${message}`],
    location: { outputPath },
    message,
    moduleId: "build.drafts",
    owner: "content",
    remediation:
      "Remove draft entries from generated feeds, sitemaps, and search output.",
    severity: "error",
  });
}

/**
 * Builds the canonical article count mismatch diagnostic.
 *
 * @param expectedArticlePageCount Published source article count.
 * @param actualArticlePageCount Generated article page count.
 * @returns Content diagnostic.
 */
export function articleCountMismatchDiagnostic(
  expectedArticlePageCount: number,
  actualArticlePageCount: number,
): OutputDiagnostic {
  const message = `expected ${expectedArticlePageCount} article pages from published source content, found ${actualArticlePageCount}`;

  return createOutputDiagnostic({
    category: "content",
    code: "content.article-count-mismatch",
    evidence: [`articleCountIssues: ${message}`],
    message,
    moduleId: "build.article-pages",
    owner: "generated-output",
    remediation:
      "Compare published article source files with generated article pages.",
    severity: "error",
  });
}

/**
 * Builds the canonical private catalog output diagnostic.
 *
 * @param outputPath Relative catalog output path.
 * @returns Build diagnostic.
 */
export function catalogLeakDiagnostic(outputPath: string): OutputDiagnostic {
  return createOutputDiagnostic({
    category: "build",
    code: "build.catalog-leak",
    evidence: [`catalogLeaks: ${outputPath}`],
    location: { outputPath },
    message: outputPath,
    moduleId: "build.catalog",
    owner: "platform",
    remediation:
      "Remove private component catalog output from the public release build.",
    severity: "error",
  });
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

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}
