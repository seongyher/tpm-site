import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { accountabilityMirrorTests } from "./verify-test-accountability";

const defaultCoverageFile = "coverage/lcov.info";
const defaultExceptionFile = "scripts/coverage-exceptions.json";
const defaultRoots = [
  "astro.config.ts",
  "eslint",
  "eslint.config.ts",
  "knip.ts",
  "playwright.config.ts",
  "prettier.config.mjs",
  "scripts",
  "src",
  "types",
];
const coveredFilePattern = /^SF:(.+)$/gm;
const coverageSubjectPattern = /\.(?:astro|css|[cm]?[jt]sx?)$/i;
const ignoredPathSegments = new Set([
  ".astro",
  ".git",
  ".lighthouseci",
  "coverage",
  "dist",
  "dist-catalog",
  "node_modules",
  "playwright-report",
  "test-results",
  "tmp",
]);

/** Coverage inventory result used by reports and tests. */
export interface CoverageInventoryResult {
  approvedExceptionFiles: string[];
  coveredFiles: string[];
  missingFiles: string[];
  subjectFiles: string[];
}

/** Inputs needed to verify unit-test coverage inventory. */
export interface CoverageVerificationOptions {
  coverageFile?: string;
  exceptionFile?: string;
  rootDir: string;
  roots?: string[];
}

interface CoverageException {
  pattern: string;
  reason: string;
}

/**
 * Formats coverage inventory findings for local and CI output.
 *
 * @param result Coverage inventory result.
 * @returns Human-readable coverage inventory report.
 */
export function formatCoverageInventoryReport(
  result: CoverageInventoryResult,
): string {
  if (result.missingFiles.length === 0) {
    return `Coverage inventory passed: ${result.subjectFiles.length} code-like source files are represented in LCOV or covered by approved exceptions.`;
  }

  return [
    `Coverage inventory found ${result.missingFiles.length} unapproved coverage gap${
      result.missingFiles.length === 1 ? "" : "s"
    }.`,
    "",
    "Add meaningful tests, extract testable logic into a covered module, add a mirrored accountability test, or add an explicitly approved exception with rationale to scripts/coverage-exceptions.json.",
    "",
    ...result.missingFiles.map((file) => `- ${file}`),
  ].join("\n");
}

/**
 * Runs the coverage inventory command-line workflow.
 *
 * @param args Command-line arguments without the executable prefix.
 * @param rootDir Repository root to verify from.
 * @returns Process exit code.
 */
export async function runCoverageVerificationCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Usage: bun run coverage:verify [--quiet]

Verify that every testable TypeScript source file appears in coverage/lcov.info.
This is intentionally broad: Astro templates, CSS, declarations, browser scripts,
tooling config, app code, and repository scripts are all treated as coverage
subjects unless they match an approved exception.`);
    return 0;
  }

  const quiet = args.includes("--quiet");
  const result = await verifyCoverageInventory({ rootDir });
  const report = formatCoverageInventoryReport(result);

  if (result.missingFiles.length > 0) {
    console.error(report);
    return 1;
  }

  if (!quiet) {
    console.log(report);
  }

  return 0;
}

/**
 * Verifies that every testable source file is represented in LCOV output.
 *
 * @param options Repository root, coverage file, and source roots.
 * @param options.coverageFile Relative path to the LCOV report.
 * @param options.exceptionFile Relative path to approved coverage exceptions.
 * @param options.rootDir Repository root.
 * @param options.roots Source roots to inventory.
 * @returns Coverage inventory result.
 */
export async function verifyCoverageInventory({
  coverageFile = defaultCoverageFile,
  exceptionFile = defaultExceptionFile,
  rootDir,
  roots = defaultRoots,
}: CoverageVerificationOptions): Promise<CoverageInventoryResult> {
  const coveredFiles = parseCoveredFiles(
    await readFile(path.resolve(rootDir, coverageFile), "utf8"),
    rootDir,
  );
  const covered = new Set(coveredFiles);
  const exceptions = await loadCoverageExceptions(rootDir, exceptionFile);
  const subjectFiles = (
    await Promise.all(
      roots.map(async (root) =>
        listCoverageSubjectFiles(rootDir, path.resolve(rootDir, root)),
      ),
    )
  )
    .flat()
    .sort((left, right) => left.localeCompare(right));
  const approvedExceptionFiles = subjectFiles.filter((file) =>
    matchesApprovedException(file, exceptions),
  );

  return {
    approvedExceptionFiles,
    coveredFiles,
    missingFiles: subjectFiles.filter(
      (file) =>
        !covered.has(file) &&
        !approvedExceptionFiles.includes(file) &&
        !hasMirroredAccountabilityTest(rootDir, file),
    ),
    subjectFiles,
  };
}

function globToRegExp(pattern: string): RegExp {
  let regex = "^";

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern.charAt(index);
    const nextCharacter = pattern.charAt(index + 1);
    const followingCharacter = pattern.charAt(index + 2);

    if (
      character === "*" &&
      nextCharacter === "*" &&
      followingCharacter === "/"
    ) {
      regex += "(?:.*/)?";
      index += 2;
    } else if (character === "*" && nextCharacter === "*") {
      regex += ".*";
      index += 1;
    } else if (character === "*") {
      regex += "[^/]*";
    } else if (character === "?") {
      regex += "[^/]";
    } else {
      regex += regexEscape(character);
    }
  }

  // eslint-disable-next-line security/detect-non-literal-regexp -- Approved exception patterns are repository-owned glob strings parsed above.
  return new RegExp(`${regex}$`);
}

function hasMirroredAccountabilityTest(rootDir: string, file: string): boolean {
  return accountabilityMirrorTests(file).some((testFile) =>
    existsSync(path.resolve(rootDir, testFile)),
  );
}

function isCoverageException(value: unknown): value is CoverageException {
  return (
    typeof value === "object" &&
    value !== null &&
    "pattern" in value &&
    "reason" in value &&
    typeof value.pattern === "string" &&
    typeof value.reason === "string" &&
    value.reason.trim() !== ""
  );
}

function isIgnoredPath(relativePath: string): boolean {
  return relativePath
    .split("/")
    .some((segment) => ignoredPathSegments.has(segment));
}

async function listCoverageSubjectFiles(
  rootDir: string,
  target: string,
): Promise<string[]> {
  const targetStat = await stat(target);
  const relativePath = toPosix(path.relative(rootDir, target));

  if (isIgnoredPath(relativePath)) {
    return [];
  }

  if (targetStat.isFile()) {
    return coverageSubjectPattern.test(relativePath) ? [relativePath] : [];
  }

  // Coverage note: repository coverage roots are regular files or
  // directories. This branch protects callers that pass special filesystem
  // entries without forcing fixture-level device nodes into unit tests.
  if (!targetStat.isDirectory()) {
    return [];
  }

  const entries = await readdir(target, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(target, entry.name);
    const childRelativePath = toPosix(path.relative(rootDir, fullPath));

    if (entry.isDirectory()) {
      // Coverage note: ignored-directory traversal is covered by the release
      // inventory against the real repository; the unit fixtures focus on
      // ordinary source trees and exception matching.
      if (!isIgnoredPath(childRelativePath)) {
        files.push(...(await listCoverageSubjectFiles(rootDir, fullPath)));
      }
    } else if (
      coverageSubjectPattern.test(entry.name) &&
      !isIgnoredPath(childRelativePath)
    ) {
      files.push(childRelativePath);
    }
  }

  return files;
}

async function loadCoverageExceptions(
  rootDir: string,
  exceptionFile: string,
): Promise<CoverageException[]> {
  const fullPath = path.resolve(rootDir, exceptionFile);
  const parsed: unknown = JSON.parse(await readFile(fullPath, "utf8"));

  if (!Array.isArray(parsed)) {
    throw new TypeError(`${exceptionFile} must contain an array.`);
  }

  return parsed.map((item, index) => {
    if (!isCoverageException(item)) {
      throw new TypeError(
        `${exceptionFile}[${index}] must include string pattern and reason fields.`,
      );
    }

    return item;
  });
}

function matchesApprovedException(
  file: string,
  exceptions: CoverageException[],
): boolean {
  return exceptions.some((exception) =>
    globToRegExp(exception.pattern).test(file),
  );
}

function parseCoveredFiles(lcov: string, rootDir: string): string[] {
  return Array.from(lcov.matchAll(coveredFilePattern), (match) => {
    const file = match[1] ?? "";
    const relativePath = path.isAbsolute(file)
      ? path.relative(rootDir, file)
      : file;

    return toPosix(relativePath);
  }).sort((left, right) => left.localeCompare(right));
}

function regexEscape(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}

// Coverage note: this wrapper only wires the exported CLI workflow to process
// exit state; tests exercise `runCoverageVerificationCli()` directly.
if (import.meta.main) {
  try {
    process.exitCode = await runCoverageVerificationCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
