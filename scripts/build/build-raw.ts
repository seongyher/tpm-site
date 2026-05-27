import { spawnSync } from "node:child_process";
import path from "node:path";

import { type SiteConfig, siteConfig } from "../../src/lib/site-config";
import {
  projectRelativePath,
  resolveSiteInstancePaths,
  siteInstance,
} from "../../src/lib/site-instance";

interface CommandRun {
  args: string[];
  command: string;
  env: Record<string, string | undefined>;
}

interface BuildRawCliOptions {
  outputDir: string;
  pagefindGlobs: string[];
  quiet: boolean;
}

type CommandRunner = (run: CommandRun) => number;

/**
 * Builds Astro output and creates a Pagefind index for the active site instance.
 *
 * @param args CLI arguments.
 * @param rootDir Repository root.
 * @param runCommand Command runner seam for tests.
 * @param config Site config that owns feature availability and routes.
 * @returns Process exit code.
 */
export function runBuildRawCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
  runCommand: CommandRunner = defaultCommandRunner,
  config: SiteConfig = siteConfig,
): number {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return 0;
  }

  const options = parseOptions(args, rootDir, config);
  const buildExitCode = runCommand({
    args: ["astro", "build", "--force"],
    command: "bunx",
    env: {
      ...process.env,
      SITE_OUTPUT_DIR: projectRelativePath(options.outputDir, rootDir),
    },
  });

  if (buildExitCode !== 0) {
    return buildExitCode;
  }

  if (options.pagefindGlobs.length === 0) {
    return 0;
  }

  return runCommand({
    args: [
      "--site",
      options.outputDir,
      ...(options.quiet ? ["--quiet"] : []),
      "--glob",
      `{${options.pagefindGlobs.join(",")}}`,
    ],
    command: localBinary(rootDir, "pagefind"),
    env: process.env,
  });
}

/**
 * Returns Pagefind HTML globs for routes that may contain searchable content.
 *
 * @param config Site config.
 * @returns Pagefind globs relative to the generated output directory.
 */
export function pagefindGlobsForSiteConfig(config: SiteConfig): string[] {
  if (!config.features.search) {
    return [];
  }

  return [
    "index.html",
    "about/**/*.html",
    routeTreeHtmlGlob(config.routes.articles),
    config.features.announcements &&
      routeTreeHtmlGlob(config.routes.announcements),
    config.features.authors && routeTreeHtmlGlob(config.routes.authors),
    config.features.bibliography &&
      routeTreeHtmlGlob(config.routes.bibliography),
    config.features.categories && routeTreeHtmlGlob(config.routes.categories),
    config.features.collections && routeTreeHtmlGlob(config.routes.collections),
    routeTreeHtmlGlob(config.routes.search),
    config.features.tags && routeTreeHtmlGlob(config.routes.tags),
  ].filter((glob): glob is string => glob !== false);
}

function defaultCommandRunner(run: CommandRun): number {
  const result = spawnSync(run.command, run.args, {
    env: run.env,
    stdio: "inherit",
  });

  return result.status ?? 1;
}

function parseOptions(
  args: string[],
  rootDir: string,
  config: SiteConfig,
): BuildRawCliOptions {
  return {
    outputDir: path.resolve(
      rootDir,
      readValueArg(args, "--dir") ??
        projectRelativePath(
          resolveSiteInstancePaths({ cwd: rootDir }).output.dist,
          rootDir,
        ),
    ),
    pagefindGlobs: pagefindGlobsForSiteConfig(config),
    quiet: args.includes("--quiet"),
  };
}

function readValueArg(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];

  if (value === undefined || value.startsWith("-")) {
    throw new Error(`Missing value for ${flag}.`);
  }

  return value;
}

function routeTreeHtmlGlob(route: string): string {
  const routePath = route.replace(/^\/|\/$/gu, "");

  return routePath.length === 0 ? "index.html" : `${routePath}/**/*.html`;
}

function localBinary(rootDir: string, binary: string): string {
  const executable = process.platform === "win32" ? `${binary}.cmd` : binary;

  return path.join(rootDir, "node_modules", ".bin", executable);
}

function usage(): string {
  return `Usage: just build-raw [--dir <dir>] [--quiet]

Build the active Astro site instance and create a Pagefind index in the same
output directory.

Default directory: ${projectRelativePath(siteInstance.output.dist)}`;
}

if (import.meta.main) {
  try {
    process.exitCode = runBuildRawCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
