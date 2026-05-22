import { spawnSync } from "node:child_process";
import path from "node:path";

import { type SiteConfig, siteConfig } from "../../src/lib/site/site-config";
import {
  projectRelativePath,
  resolveSiteInstancePaths,
  siteInstance,
} from "../../src/lib/site/site-instance";

interface HtmlValidationRun {
  args: string[];
  command: string;
}

interface ValidateHtmlCliOptions {
  outputDir: string;
  targets: string[];
}

type HtmlValidationRunner = (run: HtmlValidationRun) => number;

/**
 * Runs html-validate against representative generated pages for one site output.
 *
 * @param args CLI arguments.
 * @param rootDir Repository root.
 * @param runCommand Command runner seam for tests.
 * @returns Process exit code.
 */
export function runValidateHtmlCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
  runCommand: HtmlValidationRunner = defaultHtmlValidationRunner,
): number {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return 0;
  }

  const options = parseOptions(args, rootDir);

  return runCommand({
    args: ["--max-warnings=0", ...options.targets],
    command: "html-validate",
  });
}

/**
 * Builds the representative HTML validation target list for a generated site.
 *
 * @param config Site config.
 * @param outputDir Generated output directory.
 * @returns File and glob targets for html-validate.
 */
export function htmlValidationTargetsForSiteConfig(
  config: SiteConfig,
  outputDir: string,
): string[] {
  return [
    path.join(outputDir, "index.html"),
    path.join(outputDir, "404.html"),
    path.join(outputDir, "about", "**", "*.html"),
    routeIndexHtmlTarget(outputDir, config.routes.articles),
    config.features.announcements &&
      routeTreeHtmlTarget(outputDir, config.routes.announcements),
    config.features.authors &&
      routeTreeHtmlTarget(outputDir, config.routes.authors),
    config.features.bibliography &&
      routeTreeHtmlTarget(outputDir, config.routes.bibliography),
    config.features.categories &&
      routeTreeHtmlTarget(outputDir, config.routes.categories),
    config.features.collections &&
      routeTreeHtmlTarget(outputDir, config.routes.collections),
    config.features.search &&
      routeTreeHtmlTarget(outputDir, config.routes.search),
    config.features.tags && routeTreeHtmlTarget(outputDir, config.routes.tags),
  ].filter((target): target is string => target !== false);
}

function defaultHtmlValidationRunner(run: HtmlValidationRun): number {
  const result = spawnSync(run.command, run.args, {
    stdio: "inherit",
  });

  return result.status ?? 1;
}

function parseOptions(args: string[], rootDir: string): ValidateHtmlCliOptions {
  const outputDir = path.resolve(
    rootDir,
    readValueArg(args, "--dir") ??
      projectRelativePath(
        resolveSiteInstancePaths({ cwd: rootDir }).output.dist,
        rootDir,
      ),
  );

  return {
    outputDir,
    targets: htmlValidationTargetsForSiteConfig(siteConfig, outputDir),
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

function routeIndexHtmlTarget(outputDir: string, route: string): string {
  const routePath = route.replace(/^\/|\/$/gu, "");

  return routePath.length === 0
    ? path.join(outputDir, "index.html")
    : path.join(outputDir, routePath, "index.html");
}

function routeTreeHtmlTarget(outputDir: string, route: string): string {
  const routePath = route.replace(/^\/|\/$/gu, "");

  return routePath.length === 0
    ? path.join(outputDir, "index.html")
    : path.join(outputDir, routePath, "**", "*.html");
}

function usage(): string {
  return `Usage: bun run validate:html [--dir <dir>]

Validate representative generated HTML for the active site instance.

Default directory: ${projectRelativePath(siteInstance.output.dist)}`;
}

if (import.meta.main) {
  try {
    process.exitCode = runValidateHtmlCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
