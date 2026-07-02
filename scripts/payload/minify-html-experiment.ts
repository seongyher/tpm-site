import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { minify } from "@minify-html/node";

import { collectPayloadReport, type PayloadReport } from "./report-payload";

/** Supported minify-html experiment names. */
export type MinifyHtmlExperimentName =
  "conservative" | "inline-js" | "noncompliant-measurement" | "optional-tags";

/** Explicit minify-html configuration used by experiment runs. */
export interface MinifyHtmlConfig {
  allow_noncompliant_unquoted_attribute_values: boolean;
  allow_optimal_entities: boolean;
  allow_removing_spaces_between_attributes: boolean;
  keep_closing_tags: boolean;
  keep_comments: boolean;
  keep_html_and_head_opening_tags: boolean;
  keep_input_type_text_attr: boolean;
  keep_ssi_comments: boolean;
  minify_css: boolean;
  minify_doctype: boolean;
  minify_js: boolean;
  preserve_brace_template_syntax: boolean;
  preserve_chevron_percent_template_syntax: boolean;
  remove_bangs: boolean;
  remove_processing_instructions: boolean;
}

/** Options for running a minify-html experiment. */
export interface MinifyHtmlExperimentOptions {
  configName: MinifyHtmlExperimentName;
  outputDir: string;
  sourceDir: string;
}

/** Result from one minify-html experiment run. */
export interface MinifyHtmlExperimentResult {
  after: PayloadReport;
  before: PayloadReport;
  config: MinifyHtmlConfig;
  configName: MinifyHtmlExperimentName;
  durationMs: number;
  htmlFilesProcessed: number;
  outputDir: string;
  sourceDir: string;
}

/** Supported minify-html experiment names in deterministic report order. */
export const minifyHtmlExperimentNames = [
  "conservative",
  "inline-js",
  "optional-tags",
  "noncompliant-measurement",
] as const satisfies readonly MinifyHtmlExperimentName[];

/**
 * Returns the explicit minify-html config for an experiment name.
 *
 * @param name Experiment name.
 * @returns Concrete minify-html configuration.
 */
export function configForMinifyHtmlExperiment(
  name: MinifyHtmlExperimentName,
): MinifyHtmlConfig {
  const conservative: MinifyHtmlConfig = {
    allow_noncompliant_unquoted_attribute_values: false,
    allow_optimal_entities: false,
    allow_removing_spaces_between_attributes: false,
    keep_closing_tags: true,
    keep_comments: false,
    keep_html_and_head_opening_tags: true,
    keep_input_type_text_attr: false,
    keep_ssi_comments: false,
    minify_css: true,
    minify_doctype: false,
    minify_js: false,
    preserve_brace_template_syntax: false,
    preserve_chevron_percent_template_syntax: false,
    remove_bangs: false,
    remove_processing_instructions: false,
  };

  switch (name) {
    case "conservative":
      return conservative;
    case "inline-js":
      return {
        ...conservative,
        minify_js: true,
      };
    case "noncompliant-measurement":
      return {
        ...conservative,
        allow_noncompliant_unquoted_attribute_values: true,
        allow_optimal_entities: true,
        allow_removing_spaces_between_attributes: true,
        keep_closing_tags: false,
        keep_html_and_head_opening_tags: false,
        minify_doctype: true,
        minify_js: true,
      };
    case "optional-tags":
      return {
        ...conservative,
        keep_closing_tags: false,
        keep_html_and_head_opening_tags: false,
      };
  }
}

/**
 * Formats one minify-html experiment result for human review.
 *
 * @param result Experiment result.
 * @returns Human-readable result summary.
 */
export function formatMinifyHtmlExperimentReport(
  result: MinifyHtmlExperimentResult,
): string {
  const htmlRawDelta =
    result.after.htmlFiles.rawBytes - result.before.htmlFiles.rawBytes;
  const htmlGzipDelta =
    (result.after.htmlFiles.gzipBytes ?? 0) -
    (result.before.htmlFiles.gzipBytes ?? 0);
  const htmlBrotliDelta =
    (result.after.htmlFiles.brotliBytes ?? 0) -
    (result.before.htmlFiles.brotliBytes ?? 0);
  const textRawDelta =
    result.after.gzipEligibleFiles.rawBytes -
    result.before.gzipEligibleFiles.rawBytes;
  const textGzipDelta =
    (result.after.gzipEligibleFiles.gzipBytes ?? 0) -
    (result.before.gzipEligibleFiles.gzipBytes ?? 0);
  const textBrotliDelta =
    (result.after.gzipEligibleFiles.brotliBytes ?? 0) -
    (result.before.gzipEligibleFiles.brotliBytes ?? 0);

  return [
    `minify-html experiment: ${result.configName}`,
    `Source: ${result.sourceDir}`,
    `Output: ${result.outputDir}`,
    `HTML files processed: ${result.htmlFilesProcessed}`,
    `Duration: ${result.durationMs}ms`,
    `HTML raw delta: ${formatSignedBytes(htmlRawDelta)}`,
    `HTML gzip delta: ${formatSignedBytes(htmlGzipDelta)}`,
    `HTML Brotli delta: ${formatSignedBytes(htmlBrotliDelta)}`,
    `Gzip-eligible raw delta: ${formatSignedBytes(textRawDelta)}`,
    `Gzip-eligible gzip delta: ${formatSignedBytes(textGzipDelta)}`,
    `Gzip-eligible Brotli delta: ${formatSignedBytes(textBrotliDelta)}`,
  ].join("\n");
}

/**
 * Runs one minify-html experiment against a copied build output directory.
 *
 * @param options Experiment options.
 * @param options.configName Experiment configuration name.
 * @param options.outputDir Destination directory that will be replaced.
 * @param options.sourceDir Existing built output directory.
 * @returns Experiment result with before/after payload reports.
 */
export function runMinifyHtmlExperiment({
  configName,
  outputDir,
  sourceDir,
}: MinifyHtmlExperimentOptions): MinifyHtmlExperimentResult {
  const resolvedSource = path.resolve(sourceDir);
  const resolvedOutput = path.resolve(outputDir);

  if (!existsSync(resolvedSource) || !statSync(resolvedSource).isDirectory()) {
    throw new Error(
      `Source build output directory not found: ${resolvedSource}`,
    );
  }

  if (resolvedSource === resolvedOutput) {
    throw new Error("Experiment output directory must differ from sourceDir.");
  }

  const startedAt = Date.now();
  const config = configForMinifyHtmlExperiment(configName);
  const before = collectPayloadReport({ distDir: resolvedSource });

  rmSync(resolvedOutput, { force: true, recursive: true });
  cpSync(resolvedSource, resolvedOutput, { recursive: true });

  const htmlFiles = listHtmlFiles(resolvedOutput);
  htmlFiles.forEach((htmlFile) => {
    const minified = minify(readFileSync(htmlFile), config);
    writeFileSync(htmlFile, minified);
  });

  return {
    after: collectPayloadReport({ distDir: resolvedOutput }),
    before,
    config,
    configName,
    durationMs: Date.now() - startedAt,
    htmlFilesProcessed: htmlFiles.length,
    outputDir: resolvedOutput,
    sourceDir: resolvedSource,
  };
}

/**
 * Runs the minify-html experiment command-line workflow.
 *
 * @param args Command-line arguments without executable prefix.
 * @param cwd Working directory for relative paths.
 * @returns Process exit code.
 */
export function runMinifyHtmlExperimentCli(
  args = process.argv.slice(2),
  cwd = process.cwd(),
): number {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return 0;
  }

  if (args.includes("--list-configs")) {
    console.log(minifyHtmlExperimentNames.join("\n"));
    return 0;
  }

  try {
    const configName = parseExperimentName(
      readValueArg(args, "--config") ?? "conservative",
    );
    const sourceDir = path.resolve(
      cwd,
      readValueArg(args, "--source") ?? "dist",
    );
    const outputDir = path.resolve(
      cwd,
      readValueArg(args, "--out") ??
        path.join("tmp", "minify-html", configName),
    );
    const result = runMinifyHtmlExperiment({
      configName,
      outputDir,
      sourceDir,
    });

    console.log(
      args.includes("--json")
        ? JSON.stringify(result, null, 2)
        : formatMinifyHtmlExperimentReport(result),
    );
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function formatSignedBytes(bytes: number): string {
  const sign = bytes > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("en-US").format(bytes)} B`;
}

function listHtmlFiles(rootDir: string): string[] {
  return readdirSync(rootDir, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      return listHtmlFiles(absolutePath);
    }

    if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".html") {
      return [absolutePath];
    }

    return [];
  });
}

function parseExperimentName(rawValue: string): MinifyHtmlExperimentName {
  const match = minifyHtmlExperimentNames.find((name) => name === rawValue);

  if (match === undefined) {
    throw new Error(
      `Unknown minify-html config "${rawValue}". Expected one of: ${minifyHtmlExperimentNames.join(", ")}.`,
    );
  }

  return match;
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
  return `Usage: bun scripts/payload/minify-html-experiment.ts [--config <name>] [--source <dir>] [--out <dir>] [--json]

Run a named minify-html experiment against a copied build output directory.
Use --list-configs to show available experiment configurations.`;
}

// Coverage note: this wrapper only connects the exported CLI workflow to
// process exit state; tests call `runMinifyHtmlExperimentCli()` directly.
if (import.meta.main) {
  try {
    process.exitCode = runMinifyHtmlExperimentCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
