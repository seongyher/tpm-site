import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { resolveSiteInstancePaths } from "../../src/lib/site/site-instance";

const sourceFilePattern = /\.(?:astro|css|mdx?|[cm]?[jt]sx?)$/i;
const assetExtensionPattern =
  /\.(?:avif|bmp|gif|ico|jpe?g|mp3|mp4|ogg|otf|pdf|png|svg|tiff?|ttf|wav|webm|webp|woff2?)$/i;

/** One source-file reference to an asset under the site asset root. */
export interface AssetReference {
  assetPath: string;
  file: string;
  line: number;
  value: string;
}

/** Options for collecting source-file asset references. */
export interface AssetReferenceOptions {
  assetsDir?: string;
  rootDir: string;
  sourceDirs?: string[];
  srcDir?: string;
}

/** Options for scanning shared asset placement. */
export interface SharedAssetOptions {
  assetsDir?: string;
  rootDir: string;
  sharedAssetsDir?: string;
  sourceDirs?: string[];
  srcDir?: string;
}

/** Shared-asset verification output used by reports and tests. */
export interface SharedAssetResult {
  referenceCount: number;
  referencedAssetCount: number;
  violations: SharedAssetViolation[];
}

/** Asset placement violation for files referenced by multiple source files. */
export interface SharedAssetViolation {
  assetPath: string;
  references: AssetReference[];
  sourceFiles: string[];
}

/**
 * Scans platform and site source files for references to site assets.
 *
 * @param options Source and asset directory configuration.
 * @param options.assetsDir Absolute path to the site asset directory.
 * @param options.rootDir Repository root to scan from.
 * @param options.sourceDirs Absolute source directories to scan.
 * @param options.srcDir Absolute source directory to scan.
 * @returns Resolved asset references found in source files.
 */
export async function findAssetReferences({
  assetsDir,
  rootDir,
  sourceDirs,
  srcDir,
}: AssetReferenceOptions): Promise<AssetReference[]> {
  const sitePaths = resolveSiteInstancePaths({ cwd: rootDir });
  const resolvedAssetsDir = assetsDir ?? sitePaths.assets.root;
  const resolvedSourceDirs =
    sourceDirs ??
    (srcDir === undefined ? defaultSourceDirs(rootDir) : [srcDir]);
  const sourceFiles = Array.from(
    new Set(
      (
        await Promise.all(
          resolvedSourceDirs.map(async (dir) =>
            listSourceFilesIfPresent(dir, resolvedAssetsDir),
          ),
        )
      ).flat(),
    ),
  );
  const references: AssetReference[] = [];

  for (const file of sourceFiles.sort()) {
    references.push(
      ...(await sourceFileReferences(file, rootDir, resolvedAssetsDir)),
    );
  }

  return references;
}

/**
 * Finds shared site assets that should live under `site/assets/shared`.
 *
 * @param options Source, asset, and shared-directory configuration.
 * @param options.assetsDir Absolute path to the site asset directory.
 * @param options.rootDir Repository root to scan from.
 * @param options.sharedAssetsDir Absolute path to the shared assets directory.
 * @param options.sourceDirs Absolute source directories to scan.
 * @param options.srcDir Absolute source directory to scan.
 * @returns Shared-asset verification result.
 */
export async function findSharedAssets({
  assetsDir,
  rootDir,
  sharedAssetsDir,
  sourceDirs,
  srcDir,
}: SharedAssetOptions): Promise<SharedAssetResult> {
  const sitePaths = resolveSiteInstancePaths({ cwd: rootDir });
  const resolvedSharedAssetsDir = sharedAssetsDir ?? sitePaths.assets.shared;
  const referenceOptions: AssetReferenceOptions = { rootDir };
  if (assetsDir !== undefined) {
    referenceOptions.assetsDir = assetsDir;
  }
  if (sourceDirs !== undefined) {
    referenceOptions.sourceDirs = sourceDirs;
  }
  if (srcDir !== undefined) {
    referenceOptions.srcDir = srcDir;
  }

  const references = await findAssetReferences(referenceOptions);
  const groups = groupByAsset(references);

  return {
    referenceCount: references.length,
    referencedAssetCount: groups.size,
    violations: sharedAssetViolations(groups, resolvedSharedAssetsDir),
  };
}

/**
 * Formats shared-asset placement findings for developers.
 *
 * @param result Shared-asset verification result.
 * @param rootDir Repository root for relative paths in the report.
 * @returns Human-readable shared-asset report.
 */
export function formatSharedAssetReport(
  result: SharedAssetResult,
  rootDir: string,
): string {
  if (result.violations.length === 0) {
    return `No shared site assets found outside site/assets/shared (${result.referencedAssetCount} referenced assets, ${result.referenceCount} references scanned).`;
  }

  const lines = [
    `Found ${result.violations.length} shared site asset${
      result.violations.length === 1 ? "" : "s"
    } outside site/assets/shared/:`,
    "",
    "Move shared files into site/assets/shared/, or duplicate intentionally only when the files are no longer meant to stay identical.",
  ];

  for (const violation of result.violations) {
    lines.push("", `- ${relative(rootDir, violation.assetPath)}`);

    for (const sourceFile of violation.sourceFiles) {
      const linesForFile = violation.references
        .filter((reference) => reference.file === sourceFile)
        .map((reference) => reference.line)
        .sort((left, right) => left - right);
      lines.push(
        `  - ${relative(rootDir, sourceFile)}:${Array.from(new Set(linesForFile)).join(",")}`,
      );
    }
  }

  return lines.join("\n");
}

/**
 * Normalizes a source-code asset reference into a path-like value.
 *
 * @param value Raw Markdown, HTML, or quoted reference target.
 * @returns Normalized asset path when the reference points at a local asset.
 */
export function normalizeReference(value: string): string | undefined {
  let raw = value.trim();

  if (raw.startsWith("<") && raw.endsWith(">")) {
    raw = raw.slice(1, -1).trim();
  }

  if (
    raw === "" ||
    raw.includes("${") ||
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("//")
  ) {
    return undefined;
  }

  const pathOnly = safeDecodeUri(raw.split(/[?#]/, 1)[0] ?? raw);

  if (!assetExtensionPattern.test(pathOnly)) {
    return undefined;
  }

  return pathOnly;
}

/**
 * Resolves a local asset reference to an absolute path under the site asset root.
 *
 * @param file Source file containing the reference.
 * @param value Raw reference value.
 * @param rootDir Repository root directory.
 * @param assetsDir Absolute path to the source assets directory.
 * @returns Absolute asset path when the reference is valid and in scope.
 */
export function resolveAssetReference(
  file: string,
  value: string,
  rootDir: string,
  assetsDir: string,
): string | undefined {
  const normalized = normalizeReference(value);

  if (normalized === undefined) {
    return undefined;
  }

  let resolved: string;
  const absoluteAssetsPrefix = `/${relative(rootDir, assetsDir)}/`;
  const relativeAssetsPrefix = `${relative(rootDir, assetsDir)}/`;
  const siteAssetAliasPrefix = "@site/assets/";

  if (normalized.startsWith(absoluteAssetsPrefix)) {
    resolved = path.resolve(rootDir, `.${normalized}`);
  } else if (normalized.startsWith(relativeAssetsPrefix)) {
    resolved = path.resolve(rootDir, normalized);
  } else if (normalized.startsWith(siteAssetAliasPrefix)) {
    resolved = path.join(
      assetsDir,
      normalized.slice(siteAssetAliasPrefix.length),
    );
  } else if (startsWithRelativeAssetsPath(normalized)) {
    resolved = path.resolve(path.dirname(file), normalized);
  } else {
    return undefined;
  }

  if (!isInside(resolved, assetsDir)) {
    return undefined;
  }

  return resolved;
}

/**
 * Runs the shared-asset command-line workflow.
 *
 * @param args Command-line arguments without the executable prefix.
 * @param rootDir Repository root to scan from.
 * @returns Process exit code.
 */
export async function runSharedAssetsCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Usage: bun run assets:shared [--json] [--quiet]

Detect site assets referenced by more than one source file while living outside
site/assets/shared/.

The script scans platform source files and site content files, excluding
site/assets/. Multiple references from the same source file do not make an
asset shared.`);
    return 0;
  }

  const result = await findSharedAssets({ rootDir });

  if (args.includes("--json")) {
    console.log(
      JSON.stringify(
        {
          referenceCount: result.referenceCount,
          referencedAssetCount: result.referencedAssetCount,
          violations: result.violations.map((violation) => ({
            assetPath: relative(rootDir, violation.assetPath),
            references: violation.references.map((reference) => ({
              file: relative(rootDir, reference.file),
              line: reference.line,
              value: reference.value,
            })),
            sourceFiles: violation.sourceFiles.map((file) =>
              relative(rootDir, file),
            ),
          })),
        },
        null,
        2,
      ),
    );
  } else {
    const report = formatSharedAssetReport(result, rootDir);
    if (result.violations.length > 0) {
      console.error(report);
    } else if (!args.includes("--quiet")) {
      console.log(report);
    }
  }

  return result.violations.length > 0 ? 1 : 0;
}

/**
 * Finds assets referenced from multiple source files outside the shared folder.
 *
 * @param groups References grouped by resolved asset path.
 * @param sharedAssetsDir Absolute path to the shared assets directory.
 * @returns Shared-asset placement violations.
 */
export function sharedAssetViolations(
  groups: Map<string, AssetReference[]>,
  sharedAssetsDir: string,
): SharedAssetViolation[] {
  return Array.from(groups.entries(), ([assetPath, references]) => ({
    assetPath,
    references,
    sourceFiles: Array.from(referencedFiles(references)).sort(),
  }))
    .filter(
      (group) =>
        group.sourceFiles.length > 1 &&
        !isInside(group.assetPath, sharedAssetsDir),
    )
    .sort((left, right) => left.assetPath.localeCompare(right.assetPath));
}

function angleReferences(
  text: string,
  file: string,
  rootDir: string,
  assetsDir: string,
): AssetReference[] {
  const references: AssetReference[] = [];
  const anglePathPattern =
    // eslint-disable-next-line security/detect-unsafe-regex -- This bounded asset-reference matcher scans source files, not untrusted runtime input.
    /<((?:(?:\.\.?\/)+assets|\/?(?:src|site)\/assets|@site\/assets)\/[^>\r\n]+)>/g;

  for (const match of text.matchAll(anglePathPattern)) {
    const value = match[1];

    if (value === undefined) {
      continue;
    }

    const assetPath = resolveAssetReference(file, value, rootDir, assetsDir);

    if (assetPath !== undefined) {
      references.push({
        assetPath,
        file,
        line: lineNumberAt(text, match.index),
        value,
      });
    }
  }

  return references;
}

function defaultSourceDirs(rootDir: string): string[] {
  const sitePaths = resolveSiteInstancePaths({ cwd: rootDir });

  return [
    path.resolve(rootDir, "src"),
    path.dirname(sitePaths.content.articles),
  ];
}

async function listSourceFilesIfPresent(
  dir: string,
  assetsDir: string,
): Promise<string[]> {
  try {
    return await listSourceFiles(dir, assetsDir);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

function findClosingMarkdownTarget(
  text: string,
  start: number,
): number | undefined {
  if (text.charAt(start) === "<") {
    const close = text.indexOf(">)", start);
    return close === -1 ? undefined : close + 1;
  }

  const close = text.indexOf(")", start);
  return close === -1 ? undefined : close;
}

function groupByAsset(
  references: AssetReference[],
): Map<string, AssetReference[]> {
  const groups = new Map<string, AssetReference[]>();

  for (const reference of references) {
    const group = groups.get(reference.assetPath) ?? [];
    group.push(reference);
    groups.set(reference.assetPath, group);
  }

  return groups;
}

function isInside(file: string, dir: string): boolean {
  const relativePath = path.relative(dir, file);
  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}

function lineNumberAt(text: string, index: number): number {
  return text.slice(0, index).split(/\r?\n/).length;
}

async function listSourceFiles(
  dir: string,
  assetsDir: string,
): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (isInside(fullPath, assetsDir)) {
        continue;
      }

      files.push(...(await listSourceFiles(fullPath, assetsDir)));
    } else if (sourceFilePattern.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function markdownTargetReferences(
  text: string,
  file: string,
  rootDir: string,
  assetsDir: string,
): AssetReference[] {
  const references: AssetReference[] = [];
  let searchIndex = 0;

  while (searchIndex < text.length) {
    const targetOpen = text.indexOf("](", searchIndex);

    if (targetOpen === -1) {
      break;
    }

    const targetStart = targetOpen + 2;
    const targetEnd = findClosingMarkdownTarget(text, targetStart);

    if (targetEnd === undefined) {
      searchIndex = targetStart;
      continue;
    }

    const targetToken = text.slice(targetStart, targetEnd);
    const assetPath = resolveAssetReference(
      file,
      targetToken,
      rootDir,
      assetsDir,
    );

    if (assetPath !== undefined) {
      references.push({
        assetPath,
        file,
        line: lineNumberAt(text, targetStart),
        value: targetToken,
      });
    }

    searchIndex = targetEnd + 1;
  }

  return references;
}

function quotedReferences(
  text: string,
  file: string,
  rootDir: string,
  assetsDir: string,
): AssetReference[] {
  const references: AssetReference[] = [];
  const quotedPathPattern =
    // eslint-disable-next-line security/detect-unsafe-regex -- This bounded asset-reference matcher scans source files, not untrusted runtime input.
    /(["'`])((?:(?:\.\.?\/)+assets|\/?(?:src|site)\/assets|@site\/assets)\/[^"'`\r\n]+)\1/g;

  for (const match of text.matchAll(quotedPathPattern)) {
    const value = match[2];

    if (value === undefined) {
      continue;
    }

    const assetPath = resolveAssetReference(file, value, rootDir, assetsDir);

    if (assetPath !== undefined) {
      references.push({
        assetPath,
        file,
        line: lineNumberAt(text, match.index),
        value,
      });
    }
  }

  return references;
}

function referencedFiles(references: AssetReference[]): Set<string> {
  return new Set(references.map((reference) => reference.file));
}

function relative(rootDir: string, file: string): string {
  return toPosix(path.relative(rootDir, file));
}

function safeDecodeUri(value: string): string {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}

async function sourceFileReferences(
  file: string,
  rootDir: string,
  assetsDir: string,
): Promise<AssetReference[]> {
  const text = await readFile(file, "utf8");
  const references = [
    ...markdownTargetReferences(text, file, rootDir, assetsDir),
    ...quotedReferences(text, file, rootDir, assetsDir),
    ...angleReferences(text, file, rootDir, assetsDir),
  ];
  const seen = new Set<string>();

  return references.filter((reference) => {
    const key = `${reference.assetPath}:${reference.file}:${reference.line}:${reference.value}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function startsWithRelativeAssetsPath(normalized: string): boolean {
  const segments = normalized.split("/");
  const assetsIndex = segments.findIndex((segment) => segment === "assets");

  return (
    assetsIndex > 0 &&
    segments
      .slice(0, assetsIndex)
      .every((segment) => segment === "." || segment === "..")
  );
}

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}

// Coverage note: this wrapper only wires the exported CLI workflow to process
// exit state; tests exercise `runSharedAssetsCli()` directly.
if (import.meta.main) {
  try {
    process.exitCode = await runSharedAssetsCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
