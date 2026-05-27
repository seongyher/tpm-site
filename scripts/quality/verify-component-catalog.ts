import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import {
  catalogExampleComponentPaths,
  type ComponentCatalogIgnore,
  componentCatalogIgnoreList,
} from "../../src/catalog/catalog.config";

const componentFilePattern = /^src\/components\/.*\.(?:astro|tsx)$/u;

/** Inputs for component catalog completeness verification. */
export interface ComponentCatalogVerificationOptions {
  componentFiles?: string[];
  examplePaths?: string[];
  ignoreList?: ComponentCatalogIgnore[];
  rootDir: string;
}

/** Result of component catalog completeness verification. */
export interface ComponentCatalogVerificationResult {
  duplicateConfiguredPaths: string[];
  ignoredComponents: string[];
  missingComponents: string[];
  unknownExamplePaths: string[];
  unknownIgnorePaths: string[];
  weakIgnoreReasons: string[];
}

/**
 * Formats component catalog verification results for humans.
 *
 * @param result Catalog verification result.
 * @returns Human-readable catalog completeness report.
 */
export function formatComponentCatalogReport(
  result: ComponentCatalogVerificationResult,
): string {
  if (!hasCatalogProblems(result)) {
    return `Component catalog passed: every public component has a catalog example or documented ignore reason.`;
  }

  const lines = ["Component catalog check failed."];

  if (result.missingComponents.length > 0) {
    lines.push(
      "Missing catalog coverage:",
      ...result.missingComponents.map(
        (component) =>
          `- ${component} (add an example in src/catalog/examples/*.examples.ts or add a reasoned ignore in src/catalog/catalog.config.ts)`,
      ),
    );
  }

  if (result.weakIgnoreReasons.length > 0) {
    lines.push("Weak ignore reasons:", ...result.weakIgnoreReasons);
  }

  if (result.unknownExamplePaths.length > 0) {
    lines.push(
      "Catalog examples for missing files:",
      ...result.unknownExamplePaths.map((component) => `- ${component}`),
    );
  }

  if (result.unknownIgnorePaths.length > 0) {
    lines.push(
      "Catalog ignores for missing files:",
      ...result.unknownIgnorePaths.map((component) => `- ${component}`),
    );
  }

  if (result.duplicateConfiguredPaths.length > 0) {
    lines.push(
      "Duplicate catalog configuration paths:",
      ...result.duplicateConfiguredPaths.map((component) => `- ${component}`),
    );
  }

  return lines.join("\n");
}

/**
 * Runs the component catalog verification command-line workflow.
 *
 * @param args Command-line arguments without the executable prefix.
 * @param rootDir Repository root.
 * @returns Process exit code.
 */
export function runComponentCatalogCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
): number {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Usage: just catalog-check [--quiet]

Verify that every public component in src/components has either a catalog
example or a documented ignore reason.`);
    return 0;
  }

  const quiet = args.includes("--quiet");
  let result: ComponentCatalogVerificationResult;

  try {
    result = verifyComponentCatalog({ rootDir });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  const report = formatComponentCatalogReport(result);

  if (hasCatalogProblems(result)) {
    console.error(report);
    return 1;
  }

  if (!quiet) {
    console.log(report);
  }

  return 0;
}

/**
 * Verifies component catalog coverage for public component files.
 *
 * @param options Component files, examples, ignores, and repository root.
 * @param options.componentFiles Optional component file list for tests.
 * @param options.examplePaths Optional cataloged component path list.
 * @param options.ignoreList Optional ignored component path list.
 * @param options.rootDir Repository root to scan.
 * @returns Catalog verification result.
 */
export function verifyComponentCatalog({
  componentFiles,
  examplePaths = catalogExampleComponentPaths,
  ignoreList = componentCatalogIgnoreList,
  rootDir,
}: ComponentCatalogVerificationOptions): ComponentCatalogVerificationResult {
  const components = (componentFiles ?? listRepositoryFiles(rootDir))
    .map(toPosix)
    .filter((file) => componentFilePattern.test(file))
    .sort((left, right) => left.localeCompare(right));
  const componentSet = new Set(components);
  const exampleSet = new Set(examplePaths);
  const ignoredPathSet = new Set(ignoreList.map((entry) => entry.path));
  const configuredPaths = [
    ...examplePaths,
    ...ignoreList.map((entry) => entry.path),
  ];

  return {
    duplicateConfiguredPaths: duplicateValues(configuredPaths),
    ignoredComponents: components.filter((component) =>
      ignoredPathSet.has(component),
    ),
    missingComponents: components.filter(
      (component) =>
        !exampleSet.has(component) && !ignoredPathSet.has(component),
    ),
    unknownExamplePaths: examplePaths
      .filter((component) => !componentSet.has(component))
      .sort((left, right) => left.localeCompare(right)),
    unknownIgnorePaths: ignoreList
      .map((entry) => entry.path)
      .filter((component) => !componentSet.has(component))
      .sort((left, right) => left.localeCompare(right)),
    weakIgnoreReasons: ignoreList
      .filter((entry) => entry.reason.trim().length < 24)
      .map((entry) => `- ${entry.path}: ${entry.reason}`),
  };
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    } else {
      seen.add(value);
    }
  }

  return Array.from(duplicates).sort((left, right) =>
    left.localeCompare(right),
  );
}

function hasCatalogProblems(
  result: ComponentCatalogVerificationResult,
): boolean {
  return (
    result.duplicateConfiguredPaths.length > 0 ||
    result.missingComponents.length > 0 ||
    result.unknownExamplePaths.length > 0 ||
    result.unknownIgnorePaths.length > 0 ||
    result.weakIgnoreReasons.length > 0
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
    const stderr =
      typeof result.stderr === "string" ? result.stderr.trim() : "";
    // Coverage note: Git normally emits stderr for this failure path. The
    // empty-stderr fallback is defensive process-boundary behavior.
    throw new Error(
      stderr === "" ? "Failed to list repository files." : stderr,
    );
  }

  return result.stdout
    .split(/\r?\n/)
    .filter((line) => line !== "")
    .filter((line) => existsSync(path.join(rootDir, line)));
}

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}

// Coverage note: this wrapper only wires the exported CLI workflow to process
// exit state; tests exercise `runComponentCatalogCli()` directly.
if (import.meta.main) {
  try {
    process.exitCode = runComponentCatalogCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
