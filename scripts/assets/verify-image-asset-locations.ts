import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { resolveSiteInstancePaths } from "../../src/lib/site/site-instance";
import {
  sourceArtifactEntry,
  sourceArtifactManifest,
} from "../../src/lib/site/source-artifacts";

const defaultIgnoreFile = "scripts/image-asset-location-ignore.json";
const imageExtensionPattern =
  /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|tiff?|webp)$/i;
const alwaysIgnoredDirectoryNames = new Set([".git", "node_modules"]);

/** Compiled ignore-list pattern for image asset location checks. */
export interface IgnorePattern {
  pattern: string;
  regex: RegExp;
}

/** Inputs needed to verify image asset locations. */
export interface ImageAssetLocationOptions {
  ignoreFile?: string;
  isGitIgnored?: (relativePath: string) => boolean;
  rootDir: string;
  srcAssetsDir?: string;
}

/** Image asset location verification output used by reports and tests. */
export interface ImageAssetLocationResult {
  ignoredPatterns: string[];
  imageCount: number;
  violations: string[];
}

interface GitIgnoredPaths {
  directories: string[];
  files: Set<string>;
}

/**
 * Formats image-location violations with remediation guidance.
 *
 * @param result Image asset location verification result.
 * @param ignoreFile Ignore-list file to mention in remediation guidance.
 * @returns Human-readable image-location report.
 */
export function formatImageAssetLocationReport(
  result: ImageAssetLocationResult,
  ignoreFile = defaultIgnoreFile,
): string {
  if (result.violations.length === 0) {
    return `Image asset location verification passed: ${result.imageCount} image files scanned.`;
  }

  return [
    `Image asset location verification failed: ${result.violations.length} image file${
      result.violations.length === 1 ? "" : "s"
    } found outside site/assets/.`,
    "",
    "Move each file into the appropriate source asset folder:",
    "- site/assets/articles/<article-slug>/ for one article.",
    "- site/assets/shared/ for assets reused by multiple pages.",
    "- site/assets/site/ for site UI, layout, and homepage assets.",
    "",
    `If a file intentionally must stay outside site/assets/, add a specific path or glob to ${ignoreFile}.`,
    "",
    "Files:",
    ...result.violations.map((violation) => `- ${violation}`),
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
 * Runs the image asset location command-line workflow.
 *
 * @param args Command-line arguments without the executable prefix.
 * @param rootDir Repository root to verify from.
 * @returns Process exit code.
 */
export async function runImageAssetLocationCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Usage: bun run assets:locations [--json] [--quiet]

Require image assets to live under site/assets/.

Intentional exceptions are configured in ${defaultIgnoreFile}. Dotfiles,
dot-directories, and paths ignored by Git are skipped automatically.`);
    return 0;
  }

  const result = await verifyImageAssetLocations({ rootDir });

  if (args.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const report = formatImageAssetLocationReport(result);
    if (result.violations.length > 0) {
      console.error(report);
    } else if (!args.includes("--quiet")) {
      console.log(report);
    }
  }

  return result.violations.length > 0 ? 1 : 0;
}

/**
 * Verifies that project image assets live under the source asset pipeline.
 *
 * @param options Repository root, allowed asset directory, and ignore settings.
 * @param options.ignoreFile JSON file containing intentional location exceptions.
 * @param options.isGitIgnored Optional Git ignore checker for tests and callers.
 * @param options.rootDir Repository root to verify from.
 * @param options.srcAssetsDir Relative directory where image assets are allowed.
 * @returns Image asset location verification result.
 */
export async function verifyImageAssetLocations({
  ignoreFile = defaultIgnoreFile,
  isGitIgnored,
  rootDir,
  srcAssetsDir = defaultSrcAssetsDir(rootDir),
}: ImageAssetLocationOptions): Promise<ImageAssetLocationResult> {
  const ignorePatterns = await loadIgnorePatterns(rootDir, ignoreFile);
  const gitIgnoredPaths =
    isGitIgnored === undefined ? await listGitIgnoredPaths(rootDir) : undefined;
  const gitIgnored =
    isGitIgnored ??
    ((relativePath: string) => isGitIgnoredPath(relativePath, gitIgnoredPaths));
  const imageFiles = await listImageFiles(
    rootDir,
    rootDir,
    ignorePatterns,
    gitIgnored,
  );
  const violations = imageFiles
    .filter((file) => !isAllowedAssetLocation(file, srcAssetsDir))
    .filter((file) => !isIgnored(file, ignorePatterns))
    .sort((left, right) => left.localeCompare(right));

  return {
    ignoredPatterns: ignorePatterns.map(({ pattern }) => pattern),
    imageCount: imageFiles.length,
    violations,
  };
}

function defaultSrcAssetsDir(rootDir: string): string {
  return sourceArtifactEntry(
    sourceArtifactManifest(resolveSiteInstancePaths({ cwd: rootDir }), {
      cwd: rootDir,
    }),
    "assets.root",
  ).relativePath;
}

function hasDotPathSegment(relativePath: string) {
  return relativePath
    .split("/")
    .some((segment) => segment.startsWith(".") && segment !== ".");
}

function isAllowedAssetLocation(relativePath: string, srcAssetsDir: string) {
  return (
    relativePath === srcAssetsDir || relativePath.startsWith(`${srcAssetsDir}/`)
  );
}

function isGitIgnoredPath(
  relativePath: string,
  gitIgnoredPaths: GitIgnoredPaths | undefined,
) {
  // Coverage note: undefined is only possible when this private helper is
  // called outside the normal verifier path; public tests inject a checker
  // instead of reaching this defensive fallback.
  if (gitIgnoredPaths === undefined) {
    return false;
  }

  return (
    gitIgnoredPaths.files.has(relativePath) ||
    gitIgnoredPaths.directories.includes(
      relativePath.endsWith("/") ? relativePath : `${relativePath}/`,
    ) ||
    gitIgnoredPaths.directories.some((directory) =>
      relativePath.startsWith(directory),
    )
  );
}

function isIgnored(relativePath: string, ignorePatterns: IgnorePattern[]) {
  return ignorePatterns.some(({ regex }) => regex.test(relativePath));
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((pattern) => typeof pattern === "string")
  );
}

async function listGitIgnoredPaths(rootDir: string): Promise<GitIgnoredPaths> {
  const output = await runGit(
    ["ls-files", "--others", "--ignored", "--exclude-standard", "--directory"],
    rootDir,
  );
  const ignoredPaths = output
    .split(/\r?\n/)
    .filter((line) => line !== "")
    .map(toPosix);

  return {
    directories: ignoredPaths.filter((relativePath) =>
      relativePath.endsWith("/"),
    ),
    files: new Set(
      ignoredPaths.filter((relativePath) => !relativePath.endsWith("/")),
    ),
  };
}

async function listImageFiles(
  dir: string,
  rootDir: string,
  ignorePatterns: IgnorePattern[],
  isGitIgnored: (relativePath: string) => boolean,
): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry): Promise<string[]> => {
      const fullPath = path.join(dir, entry.name);
      const relativePath = normalizeRelativePath(rootDir, fullPath);

      if (entry.isDirectory()) {
        if (
          alwaysIgnoredDirectoryNames.has(entry.name) ||
          shouldSkip(`${relativePath}/`, ignorePatterns, isGitIgnored)
        ) {
          return [];
        }

        return listImageFiles(fullPath, rootDir, ignorePatterns, isGitIgnored);
      }

      if (
        imageExtensionPattern.test(entry.name) &&
        !shouldSkip(relativePath, ignorePatterns, isGitIgnored)
      ) {
        return [relativePath];
      }

      return [];
    }),
  );

  return files.flat();
}

async function loadIgnorePatterns(rootDir: string, ignoreFile: string) {
  const text = await readFile(path.resolve(rootDir, ignoreFile), "utf8");
  const patterns: unknown = JSON.parse(text);

  if (!isStringArray(patterns)) {
    throw new TypeError(`${ignoreFile} must contain a JSON array of strings.`);
  }

  return patterns.map((pattern) => ({
    pattern,
    regex: globToRegExp(pattern),
  }));
}

function normalizeRelativePath(rootDir: string, file: string) {
  return toPosix(path.relative(rootDir, file));
}

function regexEscape(value: string) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

async function runGit(args: string[], rootDir: string): Promise<string> {
  // Coverage note: this is a best-effort Git boundary. Unit tests cover the
  // verifier with injected ignore behavior and one real successful Git call;
  // forcing spawn errors would test the runtime more than the script logic.
  return new Promise<string>((resolve) => {
    const child = spawn("git", args, {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const chunks: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    child.on("error", () => {
      resolve("");
    });
    child.on("close", (code) => {
      resolve(code === 0 ? Buffer.concat(chunks).toString("utf8") : "");
    });
  });
}

function shouldSkip(
  relativePath: string,
  ignorePatterns: IgnorePattern[],
  isGitIgnored: (relativePath: string) => boolean,
) {
  return (
    hasDotPathSegment(relativePath) ||
    isGitIgnored(relativePath) ||
    isIgnored(relativePath, ignorePatterns)
  );
}

function toPosix(file: string) {
  return file.split(path.sep).join("/");
}

// Coverage note: this wrapper only wires the exported CLI workflow to process
// exit state; tests exercise `runImageAssetLocationCli()` directly.
if (import.meta.main) {
  try {
    process.exitCode = await runImageAssetLocationCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
