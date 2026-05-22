import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { resolveSiteInstancePaths } from "../../src/lib/site/site-instance";

/** Options for the mechanical article-reference migration. */
export interface MechanicalArticleReferenceMigrationOptions {
  articleDir: string;
  rootDir: string;
  write: boolean;
}

/** One changed article from the mechanical migration. */
export interface MechanicalArticleReferenceMigrationChange {
  file: string;
  replacements: number;
}

/** Mechanical migration result. */
export interface MechanicalArticleReferenceMigrationResult {
  changes: readonly MechanicalArticleReferenceMigrationChange[];
  replacementCount: number;
}

/** Result of converting one source string. */
export interface MechanicalArticleReferenceSourceResult {
  replacements: number;
  source: string;
}

interface SimpleHtmlLink {
  end: number;
  start: number;
  text: string;
  url: string;
}

/**
 * Runs the mechanical article-reference migration command-line workflow.
 *
 * @param args Command-line arguments without executable prefix.
 * @param rootDir Repository root.
 * @returns Process exit code.
 */
export async function runMechanicalArticleReferenceMigrationCli(
  args = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const sitePaths = resolveSiteInstancePaths({ cwd: rootDir });
  const result = await mechanicalArticleReferenceMigration({
    articleDir: sitePaths.content.articles,
    rootDir,
    write: args.includes("--write"),
  });

  if (!args.includes("--quiet")) {
    console.log(formatMechanicalArticleReferenceMigration(result));
  }

  return 0;
}

/**
 * Converts simple raw HTML links and paragraphs in article files.
 *
 * @param options Migration options.
 * @param options.articleDir Article source directory.
 * @param options.rootDir Repository root for relative paths.
 * @param options.write Whether to write converted files.
 * @returns Migration result.
 */
export async function mechanicalArticleReferenceMigration({
  articleDir,
  rootDir,
  write,
}: MechanicalArticleReferenceMigrationOptions): Promise<MechanicalArticleReferenceMigrationResult> {
  const files = await listFiles(articleDir, /\.mdx?$/iu);
  const changes = (
    await Promise.all(
      files.map(async (file) => {
        const original = await readFile(file, "utf8");
        const converted = convertMechanicalArticleReferenceMarkup(original);

        if (converted.replacements === 0) {
          return undefined;
        }

        if (write) {
          await writeFile(file, converted.source);
        }

        return {
          file: toPosix(path.relative(rootDir, file)),
          replacements: converted.replacements,
        };
      }),
    )
  ).filter((change): change is MechanicalArticleReferenceMigrationChange =>
    Boolean(change),
  );

  return {
    changes,
    replacementCount: changes.reduce(
      (total, change) => total + change.replacements,
      0,
    ),
  };
}

/**
 * Converts simple raw HTML links and simple paragraphs in one source string.
 *
 * @param source Markdown/MDX source.
 * @returns Converted source and replacement count.
 */
export function convertMechanicalArticleReferenceMarkup(
  source: string,
): MechanicalArticleReferenceSourceResult {
  let replacements = 0;
  const paragraphSeparatedSource = source.replace(
    /<\/p>\n(?=<p>)/giu,
    "</p>\n\n",
  );
  const withoutSimpleParagraphs = paragraphSeparatedSource.replace(
    simpleParagraphPattern(),
    (match, inner: string) => {
      const converted = convertSimpleHtmlInline(inner);

      if (/<(?!br\s*\/?>)[a-z][\s\S]*>/iu.test(converted.source)) {
        return match;
      }

      replacements += converted.replacements + 1;

      return converted.source.replace(/<br\s*\/?>\s*/giu, "  \n").trim();
    },
  );
  const converted = convertSimpleHtmlInline(withoutSimpleParagraphs);

  return {
    replacements: replacements + converted.replacements,
    source: converted.source,
  };
}

/**
 * Formats a mechanical migration result as Markdown.
 *
 * @param result Migration result.
 * @returns Markdown report.
 */
export function formatMechanicalArticleReferenceMigration(
  result: MechanicalArticleReferenceMigrationResult,
): string {
  if (result.changes.length === 0) {
    return "No mechanical article-reference changes found.";
  }

  return [
    `Mechanical article-reference replacements: ${result.replacementCount}`,
    "",
    "| Article | Replacements |",
    "| --- | ---: |",
    ...result.changes.map(
      (change) => `| \`${change.file}\` | ${change.replacements} |`,
    ),
  ].join("\n");
}

function convertSimpleHtmlInline(
  source: string,
): MechanicalArticleReferenceSourceResult {
  const links = simpleHtmlLinks(source);

  if (links.length === 0) {
    return { replacements: 0, source };
  }

  const converted = links.reduce(
    (result, link) => ({
      cursor: link.end,
      value: `${result.value}${source.slice(result.cursor, link.start)}[${link.text}](${link.url})`,
    }),
    { cursor: 0, value: "" },
  );

  return {
    replacements: links.length,
    source: `${converted.value}${source.slice(converted.cursor)}`,
  };
}

/**
 * Counts simple raw HTML links eligible for mechanical conversion.
 *
 * @param source Markdown/MDX source line or document.
 * @returns Number of convertible links.
 */
export function countConvertibleHtmlLinks(source: string): number {
  return simpleHtmlLinks(source).length;
}

function simpleParagraphPattern(): RegExp {
  return /^<p>([\s\S]*?)<\/p>$/gmu;
}

function simpleHtmlLinks(source: string): SimpleHtmlLink[] {
  const links: SimpleHtmlLink[] = [];
  let cursor = 0;

  while (cursor < source.length) {
    const start = source.indexOf("<a ", cursor);

    if (start < 0) {
      return links;
    }

    const openEnd = source.indexOf(">", start);

    if (openEnd < 0) {
      return links;
    }

    const closeStart = source.indexOf("</a>", openEnd);

    if (closeStart < 0) {
      cursor = openEnd + 1;
      continue;
    }

    const parsed = parseSimpleHtmlLink(
      source.slice(start, openEnd + 1),
      source.slice(openEnd + 1, closeStart),
    );

    if (parsed !== undefined) {
      links.push({
        ...parsed,
        end: closeStart + "</a>".length,
        start,
      });
    }

    cursor = closeStart + "</a>".length;
  }

  return links;
}

function parseSimpleHtmlLink(
  openTag: string,
  text: string,
): undefined | { text: string; url: string } {
  if (text.includes("<") || text.includes("\n")) {
    return undefined;
  }

  const rawAttributes = openTag.slice("<a ".length, -">".length).trim();
  const attributes = rawAttributes.split(/\s/u).filter(Boolean);
  const href = attributes.find((attribute) => attribute.startsWith("href="));
  const unsupportedAttributes = attributes.filter(
    (attribute) =>
      !attribute.startsWith("href=") && !attribute.startsWith("target="),
  );
  const target = attributes.find((attribute) =>
    attribute.startsWith("target="),
  );

  if (
    href === undefined ||
    unsupportedAttributes.length > 0 ||
    (target !== undefined && quotedAttributeValue(target) !== "_blank")
  ) {
    return undefined;
  }

  const url = quotedAttributeValue(href);

  return url === undefined ? undefined : { text, url };
}

function quotedAttributeValue(attribute: string): string | undefined {
  const equalsIndex = attribute.indexOf("=");
  const value = attribute.slice(equalsIndex + 1);
  const quote = value.at(0);

  if (
    equalsIndex < 0 ||
    quote === undefined ||
    (quote !== '"' && quote !== "'") ||
    value.at(-1) !== quote
  ) {
    return undefined;
  }

  return value.slice(1, -1);
}

async function listFiles(dir: string, pattern: RegExp): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return listFiles(fullPath, pattern);
      }

      return pattern.test(entry.name) ? [fullPath] : [];
    }),
  );

  return files.flat().sort((left, right) => left.localeCompare(right));
}

function toPosix(file: string): string {
  return file.split(path.sep).join("/");
}

if (import.meta.main) {
  process.exitCode = await runMechanicalArticleReferenceMigrationCli();
}
