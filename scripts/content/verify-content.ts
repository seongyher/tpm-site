import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import type { Image, Nodes, Paragraph, Root } from "mdast";
import { remark } from "remark";

import { isArticleMdxPdfCompatibleImport } from "../../src/lib/articles/article-pdf-compatibility";
import { tagDiagnostics } from "../../src/lib/content/tags";
import { resolveSiteInstancePaths } from "../../src/lib/site/site-instance";

/** Inputs needed to verify source content conventions. */
export interface ContentVerificationOptions {
  articleDir: string;
  authorDir: string;
  categoryDir: string;
  rootDir: string;
}

/** Content verification output used by reports and tests. */
export interface ContentVerificationResult {
  draftCount: number;
  issues: string[];
  publishedCount: number;
}

/**
 * Runs the content verification command-line workflow.
 *
 * @param args Command-line arguments without the executable prefix.
 * @param rootDir Repository root to verify from.
 * @returns Process exit code.
 */
export async function runContentVerificationCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const quiet = args.includes("--quiet");
  const paths = resolveSiteInstancePaths({ cwd: rootDir });
  const result = await verifyContent({
    articleDir: paths.content.articles,
    authorDir: paths.content.authors,
    categoryDir: paths.content.categories,
    rootDir,
  });
  const report = formatContentVerificationResult(result);

  if (result.issues.length > 0) {
    console.error(report);
    return 1;
  }

  if (!quiet) {
    console.log(report);
  }

  return 0;
}

/**
 * Verifies source content paths and publication metadata invariants.
 *
 * @param options Article, category, and repository-root directories.
 * @param options.articleDir Source article directory.
 * @param options.authorDir Source author metadata directory.
 * @param options.categoryDir Source category metadata directory.
 * @param options.rootDir Repository root for relative error paths.
 * @returns Content verification result with counts and issues.
 */
export async function verifyContent({
  articleDir,
  authorDir,
  categoryDir,
  rootDir,
}: ContentVerificationOptions): Promise<ContentVerificationResult> {
  const articleFiles = await listFiles(articleDir, /\.mdx?$/i);
  const authorFiles = await listFiles(authorDir, /\.md$/i);
  const categoryFiles = await listFiles(categoryDir, /\.json$/i);
  const issues: string[] = [];
  const seenSlugs = new Map<string, string>();
  const authorAliases = await loadAuthorAliases(rootDir, authorFiles, issues);
  let draftCount = 0;

  for (const file of authorFiles) {
    validateAuthorMetadataFilename(rootDir, file, issues);
  }

  for (const file of categoryFiles) {
    validateCategoryMetadataFilename(rootDir, file, issues);
  }

  for (const file of articleFiles) {
    validateArticlePath(articleDir, file, seenSlugs, issues);

    const text = await readFile(file, "utf8");
    const data = frontmatterData(text);
    if (isDraft(data)) {
      draftCount += 1;
    }
    validateArticleAuthor(
      rootDir,
      file,
      data,
      authorDir,
      authorAliases,
      issues,
    );
    validateArticleTags(rootDir, file, data, issues);
    validateArticleImageParagraphs(rootDir, file, text, issues);
    validateArticleMdxPdfImports(rootDir, file, text, issues);
  }

  return {
    draftCount,
    issues,
    publishedCount: articleFiles.length - draftCount,
  };
}

function categorySlug(articleDir: string, file: string) {
  return relativeArticlePath(articleDir, file).split("/")[0] ?? "";
}

function filenameStem(file: string) {
  return path.basename(file).replace(/\.(?:md|mdx)$/i, "");
}

function formatContentVerificationResult(result: ContentVerificationResult) {
  if (result.issues.length > 0) {
    return [
      "Content verification failed.",
      ...result.issues.map((issue) => `- ${issue}`),
    ].join("\n");
  }

  return `Content verification passed: ${result.publishedCount} published articles, ${result.draftCount} drafts.`;
}

function isDraft(data: Record<string, unknown>) {
  return data["draft"] === true;
}

function frontmatterData(text: string): Record<string, unknown> {
  const rawData: unknown = matter(text).data;

  return isRecord(rawData) ? rawData : {};
}

function contentLineOffset(source: string, content: string): number {
  const start = source.indexOf(content);

  if (start < 0) {
    return 0;
  }

  return source.slice(0, start).split("\n").length - 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function loadAuthorAliases(
  rootDir: string,
  authorFiles: readonly string[],
  issues: string[],
): Promise<Set<string>> {
  const aliases = new Set<string>();

  for (const file of authorFiles) {
    const data = frontmatterData(await readFile(file, "utf8"));
    const displayName = data["displayName"];
    const authorAliases = data["aliases"];

    if (typeof displayName === "string") {
      addAuthorAlias(aliases, displayName);
    } else {
      issues.push(
        `${toPosix(path.relative(rootDir, file))}: author metadata needs a displayName`,
      );
    }

    if (Array.isArray(authorAliases)) {
      authorAliases
        .filter((alias): alias is string => typeof alias === "string")
        .forEach((alias) => addAuthorAlias(aliases, alias));
    }
  }

  return aliases;
}

function addAuthorAlias(aliases: Set<string>, value: string): void {
  aliases.add(normalizeAuthorAlias(value));
}

function isLowercaseAsciiLetterOrDigit(character: string): boolean {
  const codePoint = character.codePointAt(0);

  return (
    codePoint !== undefined &&
    ((codePoint >= 97 && codePoint <= 122) ||
      (codePoint >= 48 && codePoint <= 57))
  );
}

function isUrlSafeSlug(value: string): boolean {
  return (
    value !== "" &&
    value
      .split("-")
      .every(
        (segment) =>
          segment !== "" &&
          Array.from(segment).every(isLowercaseAsciiLetterOrDigit),
      )
  );
}

async function listFiles(dir: string, pattern: RegExp) {
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

function relativeArticlePath(articleDir: string, file: string) {
  return toPosix(path.relative(articleDir, file));
}

function toPosix(file: string) {
  return file.split(path.sep).join("/");
}

function validateArticlePath(
  articleDir: string,
  file: string,
  seenSlugs: Map<string, string>,
  issues: string[],
) {
  const relativePath = relativeArticlePath(articleDir, file);
  const slug = filenameStem(file);
  const category = categorySlug(articleDir, file);

  if (!isUrlSafeSlug(slug)) {
    issues.push(`${relativePath}: filename stem is not URL-safe`);
  }

  if (!isUrlSafeSlug(category)) {
    issues.push(`${relativePath}: category folder is not URL-safe`);
  }

  const previous = seenSlugs.get(slug);
  if (previous !== undefined) {
    issues.push(
      `${relativePath}: duplicate article slug "${slug}" also used by ${previous}`,
    );
  } else {
    seenSlugs.set(slug, relativePath);
  }
}

function validateArticleAuthor(
  rootDir: string,
  file: string,
  data: Record<string, unknown>,
  authorDir: string,
  authorAliases: Set<string>,
  issues: string[],
) {
  const author = data["author"];

  if (typeof author !== "string" || author.trim() === "") {
    issues.push(
      `${toPosix(path.relative(rootDir, file))}: article frontmatter needs an author string`,
    );
    return;
  }

  author
    .split(/\s*&\s*/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .forEach((part) => {
      if (!authorAliases.has(normalizeAuthorAlias(part))) {
        const authorDirectory = toPosix(path.relative(rootDir, authorDir));

        issues.push(
          `${toPosix(path.relative(rootDir, file))}: author "${part}" does not match ${authorDirectory}/ aliases; add an author profile or approved alias`,
        );
      }
    });
}

function validateArticleTags(
  rootDir: string,
  file: string,
  data: Record<string, unknown>,
  issues: string[],
): void {
  const tags = data["tags"];
  const articlePath = toPosix(path.relative(rootDir, file));

  if (tags === undefined) {
    return;
  }

  if (!Array.isArray(tags)) {
    issues.push(`${articlePath}: article tags must be a list of strings`);
    return;
  }

  const nonStringIndex = tags.findIndex((tag) => typeof tag !== "string");

  if (nonStringIndex >= 0) {
    issues.push(
      `${articlePath}: article tag at index ${nonStringIndex} must be a string`,
    );
    return;
  }

  tagDiagnostics(tags).forEach((diagnostic) => {
    issues.push(
      `${articlePath}: article tag "${diagnostic.value}" at index ${diagnostic.index} is invalid: ${diagnostic.message}`,
    );
  });
}

function validateArticleImageParagraphs(
  rootDir: string,
  file: string,
  text: string,
  issues: string[],
): void {
  const parsed = matter(text);
  const tree = remark().parse(parsed.content);
  const lineOffset = contentLineOffset(text, parsed.content);
  const articlePath = toPosix(path.relative(rootDir, file));

  remoteMarkdownImages(tree).forEach((image) => {
    const line = image.position?.start.line;
    const suffix = line === undefined ? "" : `:${line + lineOffset}`;

    issues.push(
      `${articlePath}${suffix}: remote article image "${image.url}" must be stored locally and referenced from site/assets`,
    );
  });

  remoteHtmlImages(text).forEach(({ line, url }) => {
    issues.push(
      `${articlePath}:${line}: remote article image "${url}" must be stored locally and referenced from site/assets`,
    );
  });

  localImagesInMixedParagraphs(tree).forEach(({ image, paragraph }) => {
    const line = image.position?.start.line ?? paragraph.position?.start.line;
    const suffix = line === undefined ? "" : `:${line + lineOffset}`;

    issues.push(
      `${articlePath}${suffix}: local article image must be separated into its own paragraph; add blank lines around the image so article image tooling can render it as an inspectable figure`,
    );
  });
}

function remoteMarkdownImages(tree: Root): Image[] {
  const images: Image[] = [];

  visitImages(tree, (image) => {
    if (isRemoteImageUrl(image.url)) {
      images.push(image);
    }
  });

  return images;
}

function remoteHtmlImages(text: string): Array<{ line: number; url: string }> {
  const images: Array<{ line: number; url: string }> = [];
  const imageStartPattern = /<img(?=[\s>])/giu;
  const srcAttributePattern = /\ssrc\s*=\s*(["'])(https?:\/\/[^"']+)\1/iu;

  for (const match of text.matchAll(imageStartPattern)) {
    const tagStart = match.index;
    const tagEnd = text.indexOf(">", tagStart);

    if (tagEnd < 0) {
      continue;
    }

    const srcMatch = srcAttributePattern.exec(text.slice(tagStart, tagEnd + 1));
    const url = srcMatch?.[2];

    if (url !== undefined) {
      images.push({
        line: lineNumberAt(text, match.index),
        url,
      });
    }
  }

  return images;
}

function lineNumberAt(text: string, index: number): number {
  return text.slice(0, index).split("\n").length;
}

function validateArticleMdxPdfImports(
  rootDir: string,
  file: string,
  text: string,
  issues: string[],
): void {
  if (!file.toLowerCase().endsWith(".mdx")) {
    return;
  }

  articleMdxImportSources(text)
    .filter((importSource) => !isArticleMdxPdfCompatibleImport(importSource))
    .forEach((importSource) => {
      issues.push(
        `${toPosix(path.relative(rootDir, file))}: article MDX import "${importSource}" needs an explicit PDF fallback in src/lib/articles/article-pdf-compatibility.ts`,
      );
    });
}

function articleMdxImportSources(text: string): string[] {
  const sources: string[] = [];
  let index = 0;

  while (index < text.length) {
    const importIndex = text.indexOf("import", index);
    if (importIndex === -1) {
      break;
    }

    const fromIndex = text.indexOf("from", importIndex + "import".length);
    if (fromIndex === -1) {
      break;
    }

    const importSource = quotedValueAfterKeyword(
      text.slice(fromIndex + "from".length),
    );
    if (importSource !== undefined) {
      sources.push(importSource);
    }

    index = fromIndex + "from".length;
  }

  return sources;
}

function quotedValueAfterKeyword(text: string): string | undefined {
  const trimmed = text.trimStart();
  const quote = trimmed.at(0);
  if (quote !== '"' && quote !== "'") {
    return undefined;
  }

  const closingIndex = trimmed.indexOf(quote, 1);
  if (closingIndex === -1) {
    return undefined;
  }

  return trimmed.slice(1, closingIndex);
}

function localImagesInMixedParagraphs(
  tree: Root,
): Array<{ image: Image; paragraph: Paragraph }> {
  const images: Array<{ image: Image; paragraph: Paragraph }> = [];

  visitParagraphs(tree, (paragraph) => {
    const meaningfulChildren = paragraph.children.filter(isMeaningfulNode);

    if (
      meaningfulChildren.length === 1 &&
      isStandaloneImageNode(meaningfulChildren[0])
    ) {
      return;
    }

    paragraph.children
      .filter(isImage)
      .filter((image) => isLocalArticleImageUrl(image.url))
      .forEach((image) => images.push({ image, paragraph }));
  });

  return images;
}

function visitParagraphs(
  node: Nodes,
  callback: (paragraph: Paragraph) => void,
): void {
  if (node.type === "paragraph") {
    callback(node);
  }

  if (isParentNode(node)) {
    node.children.forEach((child) => visitParagraphs(child, callback));
  }
}

function visitImages(node: Nodes, callback: (image: Image) => void): void {
  if (isImage(node)) {
    callback(node);
  }

  if (isParentNode(node)) {
    node.children.forEach((child) => visitImages(child, callback));
  }
}

function isParentNode(node: Nodes): node is Nodes & { children: Nodes[] } {
  return "children" in node && Array.isArray(node.children);
}

function isStandaloneImageNode(node: Nodes | undefined): boolean {
  if (node === undefined) {
    return false;
  }

  if (node.type === "image") {
    return true;
  }

  if (node.type !== "link") {
    return false;
  }

  const meaningfulChildren = node.children.filter(isMeaningfulNode);

  return (
    meaningfulChildren.length === 1 && meaningfulChildren[0]?.type === "image"
  );
}

function isMeaningfulNode(node: Nodes): boolean {
  return node.type !== "text" || node.value.trim().length > 0;
}

function isImage(node: Nodes): node is Image {
  return node.type === "image";
}

function isLocalArticleImageUrl(url: string): boolean {
  return url.trim() !== "" && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\/)/iu.test(url);
}

function isRemoteImageUrl(url: string): boolean {
  return /^https?:\/\//iu.test(url.trim());
}

function validateAuthorMetadataFilename(
  rootDir: string,
  file: string,
  issues: string[],
) {
  const slug = path.basename(file, ".md");

  if (!isUrlSafeSlug(slug)) {
    issues.push(
      `${toPosix(path.relative(rootDir, file))}: author metadata filename is not URL-safe`,
    );
  }
}

function validateCategoryMetadataFilename(
  rootDir: string,
  file: string,
  issues: string[],
) {
  const slug = path.basename(file, ".json");

  if (!isUrlSafeSlug(slug)) {
    issues.push(
      `${toPosix(path.relative(rootDir, file))}: category metadata filename is not URL-safe`,
    );
  }
}

function normalizeAuthorAlias(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

// Coverage note: this wrapper only wires the exported CLI workflow to process
// exit state; tests exercise `runContentVerificationCli()` directly.
if (import.meta.main) {
  try {
    process.exitCode = await runContentVerificationCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
