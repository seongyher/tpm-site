import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import {
  projectRelativePath,
  resolveSiteInstancePaths,
} from "../../src/lib/site-instance";
import { findAssetReferences } from "./find-shared-assets";

const defaultIgnoreFile = "scripts/unused-image-ignore.json";
const imageExtensionPattern =
  /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|tiff?|webp)$/i;
const alwaysIgnoredDirectoryNames = new Set([".git", "node_modules"]);

/** Unused-image scan output used by reports and tests. */
export interface UnusedImageResult {
  ignoredPatterns: string[];
  referencedImageCount: number;
  scannedImageCount: number;
  unusedImages: string[];
}

interface UnusedImageCliOptions {
  failOnUnused: boolean;
  help: boolean;
  ignoreFile: string;
  json: boolean;
  quiet: boolean;
  review: boolean;
}

interface UnusedImageOptions {
  assetsDir?: string;
  ignoreFile?: string;
  ignorePatterns?: string[];
  rootDir: string;
  srcDir?: string;
}

/**
 * Finds images in the site asset root that source files do not reference.
 *
 * @param options Source, asset, and ignore-list configuration.
 * @param options.assetsDir Relative asset directory to scan.
 * @param options.ignoreFile JSON file containing intentional unused-image ignore patterns.
 * @param options.ignorePatterns Explicit ignore patterns that bypass `ignoreFile`.
 * @param options.rootDir Repository root to scan from.
 * @param options.srcDir Source directory to inspect for references.
 * @returns Unused-image scan result.
 */
export async function findUnusedImages({
  assetsDir,
  ignoreFile = defaultIgnoreFile,
  ignorePatterns,
  rootDir,
  srcDir,
}: UnusedImageOptions): Promise<UnusedImageResult> {
  const sitePaths = resolveSiteInstancePaths({ cwd: rootDir });
  const resolvedAssetsDir = path.resolve(
    rootDir,
    assetsDir ?? projectRelativePath(sitePaths.assets.root, rootDir),
  );
  const activeIgnorePatterns =
    ignorePatterns ?? (await loadIgnorePatterns(rootDir, ignoreFile));

  if (!(await pathExists(resolvedAssetsDir))) {
    return {
      ignoredPatterns: activeIgnorePatterns,
      referencedImageCount: 0,
      scannedImageCount: 0,
      unusedImages: [],
    };
  }

  const images = await listImages(
    rootDir,
    resolvedAssetsDir,
    activeIgnorePatterns,
  );
  const referenceOptions = {
    assetsDir: resolvedAssetsDir,
    rootDir,
  };
  const references = await findAssetReferences(
    srcDir === undefined ? referenceOptions : { ...referenceOptions, srcDir },
  );
  const referenced = referencedImages(rootDir, references);
  const unusedImages = images
    .map((image) => relative(rootDir, image))
    .filter((image) => !referenced.has(image))
    .filter((image) => !isIgnored(image, activeIgnorePatterns))
    .sort((left, right) => left.localeCompare(right));

  return {
    ignoredPatterns: activeIgnorePatterns,
    referencedImageCount: referenced.size,
    scannedImageCount: images.length,
    unusedImages,
  };
}

/**
 * Formats unused-image findings with author-friendly remediation guidance.
 *
 * @param result Unused-image scan result.
 * @param ignoreFile Ignore-list file to mention in remediation guidance.
 * @returns Human-readable unused-image report.
 */
export function formatUnusedImageReport(
  result: UnusedImageResult,
  ignoreFile = defaultIgnoreFile,
): string {
  if (result.unusedImages.length === 0) {
    return `No unused site images found (${result.scannedImageCount} image files scanned, ${result.referencedImageCount} referenced).`;
  }

  return [
    `Unused image review warning: found ${result.unusedImages.length} image file${
      result.unusedImages.length === 1 ? "" : "s"
    } in site/assets that no source file appears to use.`,
    "",
    "These files probably will not appear on the site. Please choose one:",
    "- Use the image from an article, page, or component.",
    "- Move it to site/unused-assets/ if it is only being kept for possible future use.",
    "- Delete it if it is not needed.",
    `- If this check is wrong, add a specific path or narrow glob to ${ignoreFile}.`,
    "",
    "Files:",
    ...result.unusedImages.map((image) => `- ${image}`),
  ].join("\n");
}

/**
 * Converts a small glob subset used by ignore files into a regular expression.
 *
 * @param pattern Ignore-file glob pattern.
 * @returns Regular expression that matches full POSIX-style relative paths.
 */
export function globToRegExp(pattern: string): RegExp {
  let source = "^";

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern.charAt(index);
    const nextCharacter = pattern.charAt(index + 1);

    if (character === "*" && nextCharacter === "*") {
      source += ".*";
      index += 1;
    } else if (character === "*") {
      source += "[^/]*";
    } else if (character === "?") {
      source += "[^/]";
    } else {
      source += regexEscape(character);
    }
  }

  // eslint-disable-next-line security/detect-non-literal-regexp -- Glob input is escaped before constructing the matcher.
  return new RegExp(`${source}$`);
}

/**
 * Runs the unused-image command-line workflow.
 *
 * @param args Command-line arguments without the executable prefix.
 * @param rootDir Repository root to scan from.
 * @returns Process exit code.
 */
export async function runUnusedImageCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const options = parseCliArgs(args);

  if (options.help) {
    console.log(usage());
    return 0;
  }

  const result = await findUnusedImages({
    ignoreFile: options.ignoreFile,
    rootDir,
  });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const report = formatUnusedImageReport(result, options.ignoreFile);
    if (result.unusedImages.length > 0) {
      console.warn(report);
    } else if (!options.quiet) {
      console.log(report);
    }
  }

  return options.failOnUnused && result.unusedImages.length > 0 ? 1 : 0;
}

function hasDotPathSegment(relativePath: string) {
  return relativePath
    .split("/")
    .some((segment) => segment.startsWith(".") && segment !== ".");
}

function isIgnored(relativePath: string, ignorePatterns: string[]) {
  return ignorePatterns
    .map((pattern) => globToRegExp(pattern))
    .some((regex) => regex.test(relativePath));
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((pattern) => typeof pattern === "string")
  );
}

async function listImages(
  rootDir: string,
  dir: string,
  ignorePatterns: string[],
) {
  const entries = await readdir(dir, { withFileTypes: true });
  const images: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = relative(rootDir, fullPath);

    if (
      alwaysIgnoredDirectoryNames.has(entry.name) ||
      hasDotPathSegment(relativePath) ||
      isIgnored(relativePath, ignorePatterns)
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      images.push(...(await listImages(rootDir, fullPath, ignorePatterns)));
    } else if (imageExtensionPattern.test(entry.name)) {
      images.push(fullPath);
    }
  }

  return images;
}

async function loadIgnorePatterns(rootDir: string, ignoreFile: string) {
  const fullPath = path.resolve(rootDir, ignoreFile);

  if (!(await pathExists(fullPath))) {
    return [];
  }

  const parsed: unknown = JSON.parse(await readFile(fullPath, "utf8"));

  if (!isStringArray(parsed)) {
    throw new TypeError(`${ignoreFile} must contain a JSON array of strings.`);
  }

  return parsed;
}

function parseCliArgs(args: string[]): UnusedImageCliOptions {
  let ignoreFile = defaultIgnoreFile;

  for (let index = 0; index < args.length; index += 1) {
    if (args.at(index) !== "--ignore-file") {
      continue;
    }

    const value = args[index + 1];
    if (value === undefined) {
      throw new Error("--ignore-file requires a path.");
    }

    ignoreFile = value;
    index += 1;
  }

  return {
    failOnUnused: args.includes("--fail-on-unused"),
    help: args.includes("--help") || args.includes("-h"),
    ignoreFile,
    json: args.includes("--json"),
    quiet: args.includes("--quiet"),
    review: args.includes("--review"),
  };
}

async function pathExists(file: string) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

function referencedImages(
  rootDir: string,
  references: Array<{ assetPath: string }>,
) {
  return new Set(
    references
      .map((reference) => reference.assetPath)
      .filter((assetPath) => imageExtensionPattern.test(assetPath))
      .map((assetPath) => relative(rootDir, assetPath)),
  );
}

function regexEscape(value: string) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function relative(rootDir: string, file: string) {
  return toPosix(path.relative(rootDir, file));
}

function toPosix(file: string) {
  return file.split(path.sep).join("/");
}

function usage() {
  return `Usage: just assets-unused [--json] [--quiet] [--review] [--fail-on-unused] [--ignore-file path]

Find images in site/assets that no source file appears to reference.

This is review feedback by default. Move unused-but-preserved files to
site/unused-assets/, delete files that are not needed, or add an intentional
exception to ${defaultIgnoreFile}.`;
}

// Coverage note: this wrapper only wires the exported CLI workflow to process
// exit state; tests exercise `runUnusedImageCli()` directly.
if (import.meta.main) {
  try {
    process.exitCode = await runUnusedImageCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
