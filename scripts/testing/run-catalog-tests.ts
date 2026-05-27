import { spawnSync } from "node:child_process";
import path from "node:path";

/** One command in the catalog browser-test workflow. */
export interface CatalogTestCommand {
  args: string[];
  command: string;
  env: Record<string, string | undefined>;
  label: string;
}

/** Dependency-injected command runner for catalog test workflow tests. */
export type CatalogTestCommandRunner = (command: CatalogTestCommand) => number;

/** Parsed catalog test CLI options. */
export interface CatalogTestOptions {
  outputDir: string;
  playwrightArgs: string[];
}

const defaultCatalogOutputDir = "dist-catalog";

/**
 * Builds the private component catalog into an isolated output directory and
 * runs catalog-specific Playwright invariants against that output.
 *
 * @param args CLI arguments.
 * @param cwd Repository working directory.
 * @param runner Command runner seam for tests.
 * @returns Process exit code.
 */
export function runCatalogTestsCli(
  args = process.argv.slice(2),
  cwd = process.cwd(),
  runner: CatalogTestCommandRunner = runCommand,
): number {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return 0;
  }

  const options = parseCatalogTestOptions(args);

  for (const command of catalogTestCommands(options, cwd)) {
    const exitCode = runner(command);

    if (exitCode !== 0) {
      return exitCode;
    }
  }

  return 0;
}

/**
 * Builds the commands needed for isolated catalog browser tests.
 *
 * @param options Catalog test options.
 * @param cwd Repository working directory.
 * @returns Commands to run sequentially.
 */
export function catalogTestCommands(
  options: CatalogTestOptions,
  cwd = process.cwd(),
): CatalogTestCommand[] {
  const outputDir = path.relative(cwd, path.resolve(cwd, options.outputDir));
  const env = {
    ...process.env,
    ASTRO_TELEMETRY_DISABLED: "1",
    PLATFORM_COMPONENT_CATALOG: "true",
    SITE_OUTPUT_DIR: outputDir,
  };

  return [
    {
      args: ["catalog-build"],
      command: "just",
      env,
      label: "Catalog build",
    },
    {
      args: [
        "playwright",
        "test",
        "tests/e2e/catalog-invariants.pw.ts",
        ...options.playwrightArgs,
      ],
      command: "bunx",
      env,
      label: "Catalog browser invariants",
    },
  ];
}

/**
 * Parses catalog test CLI flags.
 *
 * @param args CLI arguments.
 * @returns Parsed catalog test options.
 */
export function parseCatalogTestOptions(args: string[]): CatalogTestOptions {
  let outputDir = defaultCatalogOutputDir;
  const playwrightArgs: string[] = [];
  const remainingArgs = Array.from(args);

  while (remainingArgs.length > 0) {
    const arg = remainingArgs.shift();
    if (arg === undefined) {
      continue;
    }

    if (arg === "--") {
      playwrightArgs.push(...remainingArgs);
      break;
    }

    if (arg === "--dir") {
      const value = remainingArgs.shift();

      if (value === undefined || value.startsWith("-")) {
        throw new Error(`Missing value for ${arg}.`);
      }

      outputDir = value;
      continue;
    }

    playwrightArgs.push(arg);
  }

  return {
    outputDir,
    playwrightArgs,
  };
}

function runCommand(command: CatalogTestCommand): number {
  const result = spawnSync(command.command, command.args, {
    env: command.env,
    stdio: "inherit",
  });

  return result.status ?? 1;
}

function usage(): string {
  return `Usage: just test-catalog [--dir <dir>] [-- <playwright-args>]

Build the private component catalog into an isolated output directory, then run
catalog-specific Playwright invariants against that output.

Default directory: ${defaultCatalogOutputDir}`;
}

if (import.meta.main) {
  try {
    process.exitCode = runCatalogTestsCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
