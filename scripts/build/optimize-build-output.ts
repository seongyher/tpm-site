import path from "node:path";

import {
  projectRelativePath,
  resolveSiteInstancePaths,
  siteInstance,
} from "../../src/lib/site/site-instance";
import {
  optimizeBuildOutput,
  productionBuildOutputTransforms,
} from "./build-output-optimizer";

/** Options for the production generated-output optimization CLI. */
export interface OptimizeBuildOutputCliOptions {
  outputDir: string;
  quiet: boolean;
}

/**
 * Runs the production generated-output optimization CLI.
 *
 * @param args Command-line arguments without executable prefix.
 * @param cwd Repository root.
 * @returns Process exit code.
 */
export function runOptimizeBuildOutputCli(
  args = process.argv.slice(2),
  cwd = process.cwd(),
): number {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return 0;
  }

  try {
    const options = parseOptions(args, cwd);
    const result = optimizeBuildOutput({
      outputDir: options.outputDir,
      transforms: productionBuildOutputTransforms,
    });

    if (!options.quiet) {
      console.log(
        `Optimized generated output: ${result.routeEntriesRemoved} disabled feature route entries removed, ${result.cssFiles} CSS, ${result.jsFiles} JS, ${result.svgFiles} SVG files, ${result.rasterFilesRemoved} unreferenced Astro raster assets removed.`,
      );
    }

    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function parseOptions(
  args: string[],
  cwd: string,
): OptimizeBuildOutputCliOptions {
  return {
    outputDir: path.resolve(
      cwd,
      readValueArg(args, "--dir") ??
        projectRelativePath(resolveSiteInstancePaths({ cwd }).output.dist, cwd),
    ),
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

function usage(): string {
  return `Usage: bun run build:optimize [--dir <dir>] [--quiet]

Apply the production generated-output optimization stack to an existing static
build directory. The production stack prunes disabled feature routes, runs
Lightning CSS, SVGO, conservative Oxc JavaScript whitespace optimization, and
removes unreferenced generated raster assets.

Default directory: ${projectRelativePath(siteInstance.output.dist)}`;
}

if (import.meta.main) {
  try {
    process.exitCode = runOptimizeBuildOutputCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
