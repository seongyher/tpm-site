import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import createIgnore from "ignore";

const defaultIgnoreFile = ".test-accountability-ignore";
const ignoredPathSegments = new Set([
  ".git",
  "coverage",
  "dist",
  "dist-catalog",
  "node_modules",
]);
const mirroredExtensionPattern = /\.(?:astro|d\.ts|[cm]?[jt]sx?)$/i;
const requestedPermissionPattern = /^requested permission:/i;
const testFilePattern = /(?:^|\/)tests\/.*\.test\.[cm]?[jt]sx?$/i;

/** Parsed accountability ignore rule with the comment that justifies it. */
export interface AccountabilityIgnoreRule {
  line: number;
  pattern: string;
  reason: string;
  requestedPermission: boolean;
}

/** Inputs needed to verify repository test accountability. */
export interface TestAccountabilityOptions {
  files?: string[];
  ignoreFile?: string;
  release?: boolean;
  rootDir: string;
}

/** Test-accountability verification output used by reports and tests. */
export interface TestAccountabilityResult {
  accountabilityFiles: string[];
  files: string[];
  invalidRules: string[];
  missingMirrors: MissingMirror[];
  requestedPermissionRules: AccountabilityIgnoreRule[];
  unaccountedFiles: string[];
  unmatchedRules: AccountabilityIgnoreRule[];
}

interface MissingMirror {
  expected: string[];
  file: string;
}

/**
 * Returns the conventional mirrored test paths for a repository file.
 *
 * @param file Repository-relative file path.
 * @returns Candidate test files that account for the source file.
 */
export function accountabilityMirrorTests(file: string): string[] {
  return expectedMirrorTests(file);
}

/**
 * Formats test-accountability findings for local and CI output.
 *
 * @param result Verification result.
 * @param release Whether requested-permission entries are blocking.
 * @returns Human-readable accountability report.
 */
export function formatTestAccountabilityReport(
  result: TestAccountabilityResult,
  release: boolean,
): string {
  const sections: string[] = [];

  if (result.invalidRules.length > 0) {
    sections.push(
      "Invalid accountability ignore rules:",
      ...result.invalidRules,
    );
  }

  if (result.unmatchedRules.length > 0) {
    sections.push(
      "Accountability ignore patterns that match no repository files:",
      ...result.unmatchedRules.map(
        (rule) => `- ${rule.pattern} (line ${rule.line})`,
      ),
    );
  }

  if (result.missingMirrors.length > 0) {
    sections.push(
      "Code files missing mirrored tests:",
      ...result.missingMirrors.map(
        (missing) =>
          `- ${missing.file} (expected ${missing.expected.join(" or ")})`,
      ),
    );
  }

  if (result.unaccountedFiles.length > 0) {
    sections.push(
      "Repository files without test accountability:",
      ...result.unaccountedFiles.map((file) => `- ${file}`),
    );
  }

  if (result.requestedPermissionRules.length > 0) {
    sections.push(
      release
        ? "Requested-permission accountability exceptions must be resolved before release:"
        : "Requested-permission accountability exceptions to report during handoff:",
      ...result.requestedPermissionRules.map(
        (rule) => `- ${rule.pattern} (line ${rule.line}): ${rule.reason}`,
      ),
    );
  }

  if (sections.length === 0) {
    return `Test accountability passed: ${result.files.length} repository files are covered by mirrored tests or documented accountability rules.`;
  }

  return sections.join("\n");
}

/**
 * Parses a gitignore-style accountability file and its required comments.
 *
 * @param text Ignore-file contents.
 * @param fileName File name used in validation messages.
 * @returns Parsed rules and validation problems.
 */
export function parseAccountabilityIgnore(
  text: string,
  fileName = defaultIgnoreFile,
): { invalidRules: string[]; rules: AccountabilityIgnoreRule[] } {
  const invalidRules: string[] = [];
  const rules: AccountabilityIgnoreRule[] = [];
  let activeReason = "";
  let pendingComments: string[] = [];

  text.split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    if (trimmed === "") {
      activeReason = "";
      pendingComments = [];
      return;
    }

    if (trimmed.startsWith("#")) {
      pendingComments.push(trimmed.replace(/^#+\s?/, "").trim());
      return;
    }

    const pendingReason = pendingComments.join(" ").trim();
    const reason = pendingReason === "" ? activeReason : pendingReason;
    if (!isMeaningfulReason(reason)) {
      invalidRules.push(
        `${fileName}:${lineNumber} pattern "${trimmed}" needs an immediately preceding meaningful comment.`,
      );
    }

    rules.push({
      line: lineNumber,
      pattern: trimmed,
      reason,
      requestedPermission: requestedPermissionPattern.test(reason),
    });
    activeReason = reason;
    pendingComments = [];
  });

  return { invalidRules, rules };
}

/**
 * Runs the test-accountability command-line workflow.
 *
 * @param args Command-line arguments without executable prefix.
 * @param rootDir Repository root.
 * @returns Process exit code.
 */
export async function runTestAccountabilityCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Usage: just test-accountability [--release] [--quiet]

Verify every repository file is either represented by a mirrored test file or
matched by a gitignore-style accountability rule in ${defaultIgnoreFile}.`);
    return 0;
  }

  const release = args.includes("--release");
  const quiet = args.includes("--quiet");
  const result = await verifyTestAccountability({ release, rootDir });
  const report = formatTestAccountabilityReport(result, release);
  const hasBlockingProblems =
    result.invalidRules.length > 0 ||
    result.unmatchedRules.length > 0 ||
    result.missingMirrors.length > 0 ||
    result.unaccountedFiles.length > 0 ||
    (release && result.requestedPermissionRules.length > 0);

  if (hasBlockingProblems) {
    console.error(report);
    return 1;
  }

  if (!quiet) {
    console.log(report);
  }

  return 0;
}

/**
 * Verifies repository files have explicit test accountability.
 *
 * @param options Repository root and optional file list.
 * @param options.files Optional repository files for tests.
 * @param options.ignoreFile Accountability ignore file path.
 * @param options.rootDir Repository root.
 * @returns Accountability verification result.
 */
export async function verifyTestAccountability({
  files,
  ignoreFile = defaultIgnoreFile,
  rootDir,
}: TestAccountabilityOptions): Promise<TestAccountabilityResult> {
  const repositoryFiles = (files ?? listRepositoryFiles(rootDir))
    .map(toPosix)
    .filter((file) => !isIgnoredPath(file))
    .sort((left, right) => left.localeCompare(right));
  const fileSet = new Set(repositoryFiles);
  const { invalidRules, rules } = parseAccountabilityIgnore(
    await readFile(path.resolve(rootDir, ignoreFile), "utf8"),
    ignoreFile,
  );
  const ignoreMatcher = createIgnore().add(rules.map((rule) => rule.pattern));
  const accountabilityFiles = repositoryFiles.filter((file) =>
    ignoreMatcher.ignores(file),
  );
  const accountabilityFileSet = new Set(accountabilityFiles);
  const unmatchedRules = rules.filter(
    (rule) =>
      !rule.pattern.startsWith("!") &&
      !repositoryFiles.some((file) =>
        createIgnore().add(rule.pattern).ignores(file),
      ),
  );
  const missingMirrors = repositoryFiles
    .filter((file) => requiresMirroredTest(file))
    .filter((file) => !accountabilityFileSet.has(file))
    .map((file) => ({
      expected: expectedMirrorTests(file),
      file,
    }))
    .filter((missing) =>
      missing.expected.every((testFile) => !fileSet.has(testFile)),
    );
  const mirroredFiles = new Set(
    repositoryFiles.filter((file) =>
      expectedMirrorTests(file).some((testFile) => fileSet.has(testFile)),
    ),
  );
  const rustWorkspaceFiles = new Set(
    repositoryFiles.filter((file) => isRustWorkspaceAccountedFile(file)),
  );
  const unaccountedFiles = repositoryFiles.filter(
    (file) =>
      !accountabilityFileSet.has(file) &&
      !mirroredFiles.has(file) &&
      !rustWorkspaceFiles.has(file) &&
      !testFilePattern.test(file),
  );

  return {
    accountabilityFiles,
    files: repositoryFiles,
    invalidRules,
    missingMirrors,
    requestedPermissionRules: rules.filter((rule) => rule.requestedPermission),
    unmatchedRules,
    unaccountedFiles,
  };
}

function expectedMirrorTests(file: string): string[] {
  const pathWithoutExtension = file
    .replace(/\.d\.ts$/u, "")
    .replace(/\.astro$/u, "")
    .replace(/\.[cm]?[jt]sx?$/u, "");

  if (file.endsWith(".astro")) {
    return [
      `tests/${pathWithoutExtension}.test.ts`,
      `tests/${pathWithoutExtension}.vitest.ts`,
    ];
  }

  if (file === "astro.config.ts") {
    return ["tests/config/astro.config.test.ts"];
  }
  if (file === "eslint.config.ts") {
    return ["tests/config/eslint.config.test.ts"];
  }
  if (file === "knip.ts") {
    return ["tests/config/knip.test.ts"];
  }
  if (file === "playwright.config.ts") {
    return ["tests/config/playwright.config.test.ts"];
  }
  if (file === "prettier.config.mjs") {
    return ["tests/config/prettier.config.test.ts"];
  }
  if (
    file === "eslint/tsconfig.json" ||
    file === "scripts/tsconfig.json" ||
    file === "tests/tsconfig.json"
  ) {
    return ["tests/config/tooling-tsconfigs.test.ts"];
  }
  if (file === "tsconfig.json") {
    return ["tests/config/tsconfig.test.ts"];
  }
  if (file === "tsconfig.tools.json") {
    return ["tests/config/tsconfig.tools.test.ts"];
  }
  if (file === "vitest.config.ts") {
    return ["tests/config/vitest.config.test.ts"];
  }
  if (file === "wrangler.toml") {
    return ["tests/config/wrangler.config.test.ts"];
  }
  if (file === "examples/platform-entrypoint-consumer/platform-consumer.ts") {
    return ["tests/src/platform/example-consumer.test.ts"];
  }
  if (file.startsWith("src/platform/") && file.endsWith(".ts")) {
    return [
      `tests/${pathWithoutExtension}.test.ts`,
      `tests/${pathWithoutExtension}-entrypoint.test.ts`,
      "tests/src/platform/entrypoints.test.ts",
    ];
  }

  return [`tests/${pathWithoutExtension}.test.ts`];
}

function isIgnoredPath(relativePath: string): boolean {
  return relativePath
    .split("/")
    .some((segment) => ignoredPathSegments.has(segment));
}

function isMeaningfulReason(reason: string): boolean {
  return reason.length >= 24 && !/^ignored?\.?$/iu.test(reason.trim());
}

function isRustWorkspaceAccountedFile(file: string): boolean {
  return (
    file === "Cargo.lock" ||
    file === "Cargo.toml" ||
    file === "deny.toml" ||
    file === "justfile" ||
    file === "rust-toolchain.toml" ||
    file === "rustfmt.toml" ||
    /^crates\/[^/]+\/Cargo\.toml$/u.test(file) ||
    /^crates\/[^/]+\/src\/.+\.rs$/u.test(file)
  );
}

function listRepositoryFiles(rootDir: string): string[] {
  const result = spawnSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    {
      cwd: rootDir,
      encoding: "utf8",
    },
  );

  if (result.status !== 0) {
    const stderr = result.stderr.trim();
    // Coverage note: Git normally emits stderr for this failure path. The
    // empty-stderr fallback is defensive process-boundary behavior.
    throw new Error(
      stderr === "" ? "Failed to list repository files." : stderr,
    );
  }

  return result.stdout
    .split(/\r?\n/)
    .filter((line) => line !== "")
    .filter((line) => existsSync(path.resolve(rootDir, line)));
}

function requiresMirroredTest(file: string): boolean {
  return mirroredExtensionPattern.test(file) && !testFilePattern.test(file);
}

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}

// Coverage note: this wrapper only wires the exported CLI workflow to process
// exit state; tests exercise `runTestAccountabilityCli()` directly.
if (import.meta.main) {
  try {
    process.exitCode = await runTestAccountabilityCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
