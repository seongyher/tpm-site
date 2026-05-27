import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { toJSONSchema } from "astro/zod";

import { siteConfigSchema } from "../../src/lib/site-config";
import { projectRelativePath, siteInstance } from "../../src/lib/site-instance";

const defaultOutputPath = path.join(
  path.dirname(siteInstance.config.site),
  "site.schema.json",
);

interface GenerateSchemaCliIo {
  stderr: Pick<typeof process.stderr, "write">;
  stdout: Pick<typeof process.stdout, "write">;
}

/** JSON-compatible schema document produced for editor and future GUI tooling. */
export type SiteConfigJsonSchema = Record<string, unknown>;

/**
 * Builds the site config JSON Schema from the platform Zod schema.
 *
 * @returns JSON Schema for `site/config/site.json`.
 */
export function siteConfigJsonSchema(): SiteConfigJsonSchema {
  return {
    ...toJSONSchema(siteConfigSchema, { io: "input" }),
    $id: "https://example.com/schemas/blog-site-config.schema.json",
    description:
      "Validated site-owner configuration for the reusable Astro blogging platform.",
    title: "Blog Platform Site Config",
  };
}

/**
 * Runs the site config schema generator CLI.
 *
 * @param args CLI arguments.
 * @param io Output writers.
 * @returns Process exit code.
 */
export function runGenerateSiteConfigSchemaCli(
  args = Bun.argv.slice(2),
  io: GenerateSchemaCliIo = {
    stderr: process.stderr,
    stdout: process.stdout,
  },
): number {
  if (args.includes("--help")) {
    io.stdout.write(usage());

    return 0;
  }

  const outputPath = outputPathFromArgs(args);
  const quiet = args.includes("--quiet");
  const check = args.includes("--check");
  const schemaText = `${JSON.stringify(siteConfigJsonSchema(), null, 2)}\n`;

  if (check) {
    const existingText = readFileSync(outputPath, "utf8");
    const existingSchema = JSON.parse(existingText) as unknown;

    if (
      JSON.stringify(existingSchema) === JSON.stringify(siteConfigJsonSchema())
    ) {
      if (!quiet) {
        io.stdout.write(
          `Site config schema is current at ${projectRelativePath(outputPath)}.\n`,
        );
      }

      return 0;
    }

    io.stderr.write(
      `Site config schema is stale at ${projectRelativePath(
        outputPath,
      )}. Run just site-schema.\n`,
    );

    return 1;
  }

  writeFileSync(outputPath, schemaText);

  if (!quiet) {
    io.stdout.write(
      `Wrote site config schema to ${projectRelativePath(outputPath)}.\n`,
    );
  }

  return 0;
}

function outputPathFromArgs(args: readonly string[]): string {
  const outputIndex = args.indexOf("--output");

  if (outputIndex === -1) {
    return defaultOutputPath;
  }

  const outputValue = args[outputIndex + 1];

  if (outputValue === undefined || outputValue.startsWith("--")) {
    throw new Error("Missing value for --output.");
  }

  return path.resolve(outputValue);
}

function usage(): string {
  return [
    "Usage: bun scripts/site/generate-site-config-schema.ts [--check] [--quiet] [--output <path>]",
    "",
    "Generates JSON Schema for site/config/site.json from the platform Zod schema.",
    "",
  ].join("\n");
}

if (import.meta.main) {
  process.exitCode = runGenerateSiteConfigSchemaCli();
}
