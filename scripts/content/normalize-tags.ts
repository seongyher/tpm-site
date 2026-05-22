import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import { normalizeTagList } from "../../src/lib/content/tags";
import { resolveSiteInstancePaths } from "../../src/lib/site/site-instance";

/** Options for normalizing article tags in source frontmatter. */
export interface NormalizeArticleTagsOptions {
  articleDir: string;
  rootDir: string;
  write: boolean;
}

/** Result from a tag normalization pass. */
export interface NormalizeArticleTagsResult {
  changedFiles: string[];
  issues: string[];
  scannedFiles: number;
}

/**
 * Runs the tag normalization command-line workflow.
 *
 * @param args Command-line arguments without the executable prefix.
 * @param rootDir Repository root.
 * @returns Process exit code.
 */
export async function runNormalizeTagsCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const quiet = args.includes("--quiet");
  const write = args.includes("--write");
  const sitePaths = resolveSiteInstancePaths({ cwd: rootDir });
  const result = await normalizeArticleTags({
    articleDir: sitePaths.content.articles,
    rootDir,
    write,
  });
  const report = formatNormalizeArticleTagsResult(result, write);

  if (result.issues.length > 0) {
    console.error(report);
    return 1;
  }

  if (!write && result.changedFiles.length > 0) {
    console.error(report);
    return 1;
  }

  if (!quiet) {
    console.log(report);
  }

  return 0;
}

/**
 * Normalizes article tag frontmatter across a source article directory.
 *
 * @param options Normalization options.
 * @param options.articleDir Source article directory.
 * @param options.rootDir Repository root for relative reports.
 * @param options.write Whether to write normalized files.
 * @returns Changed files and issues.
 */
export async function normalizeArticleTags({
  articleDir,
  rootDir,
  write,
}: NormalizeArticleTagsOptions): Promise<NormalizeArticleTagsResult> {
  const files = await listFiles(articleDir, /\.mdx?$/i);
  const changedFiles: string[] = [];
  const issues: string[] = [];

  for (const file of files) {
    const text = await readFile(file, "utf8");
    const normalized = normalizeArticleFileTags(rootDir, file, text);

    issues.push(...normalized.issues);

    if (normalized.changed) {
      changedFiles.push(toPosix(path.relative(rootDir, file)));
      if (write && normalized.issues.length === 0) {
        await writeFile(file, normalized.text);
      }
    }
  }

  return {
    changedFiles,
    issues,
    scannedFiles: files.length,
  };
}

function formatNormalizeArticleTagsResult(
  result: NormalizeArticleTagsResult,
  write: boolean,
): string {
  if (result.issues.length > 0) {
    return [
      "Article tag normalization failed.",
      ...result.issues.map((issue) => `- ${issue}`),
    ].join("\n");
  }

  if (result.changedFiles.length > 0) {
    const action = write ? "Updated" : "Would update";

    return [
      `${action} ${result.changedFiles.length} article tag ${result.changedFiles.length === 1 ? "block" : "blocks"}.`,
      ...result.changedFiles.map((file) => `- ${file}`),
      ...(write ? [] : ["Run with --write to apply these changes."]),
    ].join("\n");
  }

  return `Article tag normalization passed: ${result.scannedFiles} article files scanned.`;
}

function frontmatterBounds(
  text: string,
): null | { end: number; start: number } {
  if (!text.startsWith("---\n")) {
    return null;
  }

  const end = text.indexOf("\n---", 4);

  return end < 0 ? null : { end, start: 4 };
}

function normalizeArticleFileTags(
  rootDir: string,
  file: string,
  text: string,
): { changed: boolean; issues: string[]; text: string } {
  const rawData: unknown = matter(text).data;
  const data = isRecord(rawData) ? rawData : {};
  const tags = data["tags"];
  const articlePath = toPosix(path.relative(rootDir, file));

  if (tags === undefined) {
    return { changed: false, issues: [], text };
  }

  if (!Array.isArray(tags)) {
    return {
      changed: false,
      issues: [`${articlePath}: article tags must be a list of strings`],
      text,
    };
  }

  const nonStringIndex = tags.findIndex((tag) => typeof tag !== "string");

  if (nonStringIndex >= 0) {
    return {
      changed: false,
      issues: [
        `${articlePath}: article tag at index ${nonStringIndex} must be a string`,
      ],
      text,
    };
  }

  const normalization = normalizeTagList(tags);
  const issues = normalization.diagnostics.map(
    (diagnostic) =>
      `${articlePath}: article tag "${diagnostic.value}" at index ${diagnostic.index} is invalid: ${diagnostic.message}`,
  );

  if (issues.length > 0 || !normalization.changed) {
    return { changed: false, issues, text };
  }

  return {
    changed: true,
    issues,
    text: replaceTagsBlock(text, normalization.tags) ?? text,
  };
}

function replaceTagsBlock(
  text: string,
  tags: readonly string[],
): null | string {
  const bounds = frontmatterBounds(text);

  if (bounds === null) {
    return null;
  }

  const frontmatter = text.slice(bounds.start, bounds.end);
  const lines = frontmatter.split("\n");
  const tagsLineIndex = lines.findIndex((line) => /^tags\s*:/u.test(line));

  if (tagsLineIndex < 0) {
    return null;
  }

  const blockEndIndex = tagsBlockEndIndex(lines, tagsLineIndex);
  const comments = lines
    .slice(tagsLineIndex + 1, blockEndIndex)
    .filter((line) => /^\s*#/u.test(line));
  const tagBlock =
    tags.length === 0
      ? ["tags: []"]
      : [
          "tags:",
          ...comments,
          ...tags.map((tag) => `  - ${JSON.stringify(tag)}`),
        ];
  const nextFrontmatter = [
    ...lines.slice(0, tagsLineIndex),
    ...tagBlock,
    ...lines.slice(blockEndIndex),
  ].join("\n");

  return `${text.slice(0, bounds.start)}${nextFrontmatter}${text.slice(bounds.end)}`;
}

function tagsBlockEndIndex(lines: readonly string[], tagsLineIndex: number) {
  const nextTopLevelIndex = lines
    .slice(tagsLineIndex + 1)
    .findIndex((line) => line.trim() !== "" && !/^\s*(?:#|-)/u.test(line));

  return nextTopLevelIndex < 0
    ? lines.length
    : tagsLineIndex + 1 + nextTopLevelIndex;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function listFiles(dir: string, pattern: RegExp): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath, pattern)));
    } else if (pattern.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function toPosix(file: string) {
  return file.split(path.sep).join("/");
}

// Coverage note: this wrapper only wires the exported CLI workflow to process
// exit state; tests exercise `runNormalizeTagsCli()` directly.
if (import.meta.main) {
  try {
    process.exitCode = await runNormalizeTagsCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
