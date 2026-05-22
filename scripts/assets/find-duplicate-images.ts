import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import {
  projectRelativePath,
  resolveSiteInstancePaths,
} from "../../src/lib/site/site-instance";

const defaultIgnoreFile = "scripts/duplicate-image-ignore.json";
const imageExtensionPattern =
  /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|tiff?|webp)$/i;
const alwaysIgnoredDirectoryNames = new Set([".git", "node_modules"]);

/** One scanned image file with its content hash and file size. */
export interface DuplicateImageRecord {
  hash: string;
  path: string;
  size: number;
}

/** Duplicate-image scan output used by reports and tests. */
export interface DuplicateImageResult {
  duplicateGroups: DuplicateImageRecord[][];
  ignoredPatterns: string[];
  imageCount: number;
  scanDirs: string[];
}

interface DuplicateImageCliOptions {
  failOnDuplicates: boolean;
  help: boolean;
  ignoreFile: string;
  json: boolean;
  quiet: boolean;
  review: boolean;
  scanDirs: string[];
}

interface DuplicateImageOptions {
  ignoreFile?: string;
  ignorePatterns?: string[];
  rootDir: string;
  scanDirs?: string[];
}

/**
 * Scans configured image directories for byte-identical duplicate images.
 *
 * @param options Scan roots, directories, and ignore-list configuration.
 * @param options.ignoreFile JSON file containing intentional duplicate ignore patterns.
 * @param options.ignorePatterns Explicit ignore patterns that bypass `ignoreFile`.
 * @param options.rootDir Repository root to scan from.
 * @param options.scanDirs Relative directories to scan for image files.
 * @returns Duplicate-image scan result.
 */
export async function findDuplicateImages({
  ignoreFile = defaultIgnoreFile,
  ignorePatterns,
  rootDir,
  scanDirs,
}: DuplicateImageOptions): Promise<DuplicateImageResult> {
  const activeIgnorePatterns =
    ignorePatterns ?? (await loadIgnorePatterns(rootDir, ignoreFile));
  const resolvedScanDirs = scanDirs ?? defaultScanDirs(rootDir);
  const existingDirs: string[] = [];

  for (const dir of resolvedScanDirs) {
    const fullPath = path.resolve(rootDir, dir);

    if (await pathExists(fullPath)) {
      existingDirs.push(fullPath);
    }
  }

  const imageFiles: string[] = [];
  for (const dir of existingDirs) {
    imageFiles.push(
      ...(await listImageFiles(rootDir, dir, activeIgnorePatterns)),
    );
  }

  const records: DuplicateImageRecord[] = [];
  for (const file of imageFiles.sort()) {
    records.push(await imageRecord(rootDir, file));
  }

  return {
    duplicateGroups: groupDuplicateImages(records),
    ignoredPatterns: activeIgnorePatterns,
    imageCount: records.length,
    scanDirs: existingDirs.map((dir) => relative(rootDir, dir)),
  };
}

/**
 * Formats duplicate-image findings for human review.
 *
 * @param result Duplicate-image scan result.
 * @param ignoreFile Ignore-list file to mention in remediation guidance.
 * @returns Human-readable duplicate-image report.
 */
export function formatDuplicateImageReport(
  result: DuplicateImageResult,
  ignoreFile = defaultIgnoreFile,
): string {
  if (result.duplicateGroups.length === 0) {
    return `No duplicate images found across ${result.imageCount} image files.`;
  }

  const duplicateFileCount = result.duplicateGroups.reduce(
    (count, group) => count + group.length,
    0,
  );
  const lines = [
    `Duplicate image review warning: found ${result.duplicateGroups.length} duplicate image group${
      result.duplicateGroups.length === 1 ? "" : "s"
    } across ${duplicateFileCount} files.`,
    "",
    "Review these files before release. If the duplicate is intentional, add the specific file path or a narrow glob to:",
    `- ${ignoreFile}`,
    "",
    "Prefer removing unused duplicates. Keep intentional shared images in site/assets/shared/ when they are referenced by multiple pages.",
  ];

  for (const [index, group] of result.duplicateGroups.entries()) {
    const first = group[0];
    if (first === undefined) {
      continue;
    }

    lines.push(
      "",
      `Group ${index + 1}: ${first.size} bytes, sha256 ${first.hash}`,
    );

    for (const record of group) {
      lines.push(`- ${record.path}`);
    }
  }

  return lines.join("\n");
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
 * Groups image records by content hash and keeps only duplicated hashes.
 *
 * @param records Image file records with SHA-256 hashes.
 * @returns Duplicate groups sorted by size and path for stable reports.
 */
export function groupDuplicateImages(
  records: DuplicateImageRecord[],
): DuplicateImageRecord[][] {
  const byHash = new Map<string, DuplicateImageRecord[]>();

  for (const record of records) {
    const group = byHash.get(record.hash) ?? [];
    group.push(record);
    byHash.set(record.hash, group);
  }

  return Array.from(byHash.values())
    .filter((group) => group.length > 1)
    .sort((left, right) => {
      const sizeDelta = (right[0]?.size ?? 0) - (left[0]?.size ?? 0);

      if (sizeDelta !== 0) {
        return sizeDelta;
      }

      return (left[0]?.path ?? "").localeCompare(right[0]?.path ?? "");
    });
}

/**
 * Runs the duplicate-image command-line workflow.
 *
 * @param args Command-line arguments without the executable prefix.
 * @param rootDir Repository root to scan from.
 * @returns Process exit code.
 */
export async function runDuplicateImageCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const options = parseCliArgs(args);

  if (options.help) {
    console.log(usage(rootDir));
    return 0;
  }

  const scanOptions =
    options.scanDirs.length > 0 ? { scanDirs: options.scanDirs } : {};
  const result = await findDuplicateImages({
    ignoreFile: options.ignoreFile,
    rootDir,
    ...scanOptions,
  });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const report = formatDuplicateImageReport(result, options.ignoreFile);
    if (result.duplicateGroups.length > 0) {
      console.warn(report);
    } else if (!options.quiet) {
      console.log(report);
    }
  }

  return options.failOnDuplicates && result.duplicateGroups.length > 0 ? 1 : 0;
}

function hasDotPathSegment(relativePath: string) {
  return relativePath
    .split("/")
    .some((segment) => segment.startsWith(".") && segment !== ".");
}

function defaultScanDirs(rootDir: string): string[] {
  const sitePaths = resolveSiteInstancePaths({ cwd: rootDir });

  return [
    projectRelativePath(sitePaths.assets.root, rootDir),
    projectRelativePath(sitePaths.public, rootDir),
    projectRelativePath(sitePaths.unusedAssets, rootDir),
  ];
}

async function imageRecord(
  rootDir: string,
  file: string,
): Promise<DuplicateImageRecord> {
  const fileStats = await stat(file);

  return {
    hash: await sha256(file),
    path: relative(rootDir, file),
    size: fileStats.size,
  };
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

async function listImageFiles(
  rootDir: string,
  dir: string,
  ignorePatterns: string[],
) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

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
      files.push(...(await listImageFiles(rootDir, fullPath, ignorePatterns)));
    } else if (imageExtensionPattern.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
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

function parseCliArgs(args: string[]): DuplicateImageCliOptions {
  const scanDirs: string[] = [];
  let ignoreFile = defaultIgnoreFile;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args.at(index);

    if (arg === "--ignore-file") {
      const value = args[index + 1];
      if (value === undefined) {
        throw new Error("--ignore-file requires a path.");
      }
      ignoreFile = value;
      index += 1;
    } else if (arg !== undefined && !arg.startsWith("--")) {
      scanDirs.push(arg);
    }
  }

  return {
    failOnDuplicates: args.includes("--fail-on-duplicates"),
    help: args.includes("--help") || args.includes("-h"),
    ignoreFile,
    json: args.includes("--json"),
    quiet: args.includes("--quiet"),
    review: args.includes("--review"),
    scanDirs,
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

function regexEscape(value: string) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function relative(rootDir: string, file: string) {
  return toPosix(path.relative(rootDir, file));
}

async function sha256(file: string) {
  const hash = createHash("sha256");
  const stream = createReadStream(file);

  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk: Buffer | string) => {
      hash.update(chunk);
    });
    stream.on("error", reject);
    stream.on("end", resolve);
  });

  return hash.digest("hex");
}

function toPosix(file: string) {
  return file.split(path.sep).join("/");
}

function usage(rootDir: string) {
  return `Usage: bun run assets:duplicates [--json] [--quiet] [--review] [--fail-on-duplicates] [--ignore-file path] [dir ...]

Find image files with identical byte content.

Defaults to:
${defaultScanDirs(rootDir)
  .map((dir) => `- ${dir}`)
  .join("\n")}

Intentional duplicates can be ignored with ${defaultIgnoreFile}.
Use --fail-on-duplicates when duplicate images should fail a gate.`;
}

// Coverage note: this wrapper only wires the exported CLI workflow to process
// exit state; tests exercise `runDuplicateImageCli()` directly.
if (import.meta.main) {
  try {
    process.exitCode = await runDuplicateImageCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
