import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import { siteInstance } from "../../src/lib/site-instance";
import { siteRedirects as currentSiteRedirects } from "../../src/lib/site-redirects";

const CLOUDFLARE_STATIC_REDIRECT_LIMIT = 2_000;
const CLOUDFLARE_REDIRECT_LINE_LIMIT = 1_000;
const LEGACY_CONTENT_PATTERN = /\.mdx?$/iu;
const GENERATED_HEADER =
  "# Generated from site redirects and article legacyPermalink metadata. Do not edit by hand.";
const REDIRECT_STATUS = 301;

/** Content directory and current public route prefix for legacy redirects. */
export interface LegacyRedirectSource {
  readonly dir: string;
  readonly routePrefix: string;
}

/** Static Cloudflare redirect rule derived from legacy permalink metadata. */
export interface CloudflareRedirectRule {
  readonly destination: string;
  readonly source: string;
}

type SiteRedirectMap = Readonly<Record<string, string>>;

interface GenerateCloudflareRedirectsOptions {
  readonly outputDir?: string | undefined;
  readonly quiet?: boolean | undefined;
  readonly siteRedirects?: SiteRedirectMap | undefined;
  readonly sources?: readonly LegacyRedirectSource[] | undefined;
}

interface ParsedCliOptions {
  readonly quiet: boolean;
}

/**
 * Builds default content roots that can publish legacy-permalink redirects.
 *
 * @returns Site-instance content roots and their current public route prefixes.
 */
export function defaultLegacyRedirectSources(): LegacyRedirectSource[] {
  return [
    {
      dir: siteInstance.content.announcements,
      routePrefix: "/announcements/",
    },
    {
      dir: siteInstance.content.articles,
      routePrefix: "/articles/",
    },
  ];
}

/**
 * Generates Cloudflare's static `_redirects` file from site-owned redirects
 * and legacy permalink frontmatter.
 *
 * @param options Optional output and content source overrides.
 * @returns The generated redirect file path and redirect count.
 */
export async function generateCloudflareRedirects(
  options: GenerateCloudflareRedirectsOptions = {},
): Promise<{ count: number; path: string }> {
  const outputDir = options.outputDir ?? siteInstance.output.dist;
  const outputPath = path.join(outputDir, "_redirects");
  const rules = await collectCloudflareRedirectRules(
    options.sources ?? defaultLegacyRedirectSources(),
    options.siteRedirects ?? currentSiteRedirects,
  );
  const output = formatCloudflareRedirects(rules);

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, output);

  if (options.quiet !== true) {
    console.info(
      `Wrote ${rules.length} Cloudflare redirects to ${outputPath}.`,
    );
  }

  return { count: rules.length, path: outputPath };
}

/**
 * Reads generated content redirects and merges them with site-owned redirect
 * config.
 *
 * @param sources Content directories and their current public route prefixes.
 * @param configuredRedirects Hand-written site redirects.
 * @returns Sorted Cloudflare redirect rules.
 */
export async function collectCloudflareRedirectRules(
  sources: readonly LegacyRedirectSource[],
  configuredRedirects: SiteRedirectMap = currentSiteRedirects,
): Promise<CloudflareRedirectRule[]> {
  return mergeCloudflareRedirectRules(
    await collectLegacyRedirectRules(sources),
    redirectRulesFromSiteRedirects(configuredRedirects),
  );
}

/**
 * Reads Markdown/MDX files and derives redirect rules from `legacyPermalink`.
 *
 * @param sources Content directories and their current public route prefixes.
 * @returns Sorted Cloudflare redirect rules.
 */
export async function collectLegacyRedirectRules(
  sources: readonly LegacyRedirectSource[],
): Promise<CloudflareRedirectRule[]> {
  const redirects = new Map<string, CloudflareRedirectRule>();
  const seen = new Map<string, string>();

  for (const source of sources) {
    const files = await listFiles(source.dir, LEGACY_CONTENT_PATTERN);

    for (const file of files) {
      const data = frontmatterData(await readFileForFrontmatter(file));
      const legacyPermalink = data["legacyPermalink"];

      if (legacyPermalink === undefined) {
        continue;
      }

      if (typeof legacyPermalink !== "string") {
        throw new TypeError(`${file}: legacyPermalink must be a string.`);
      }

      const redirectSource = normalizeLegacyPermalink(legacyPermalink);
      const previous = seen.get(redirectSource);

      if (previous !== undefined) {
        throw new Error(
          `${file}: duplicate legacyPermalink ${redirectSource}; already used by ${previous}.`,
        );
      }

      seen.set(redirectSource, file);
      redirects.set(redirectSource, {
        destination: currentContentUrl(source.routePrefix, file),
        source: redirectSource,
      });
    }
  }

  const rules = Array.from(redirects.values()).sort((left, right) =>
    left.source.localeCompare(right.source),
  );

  assertCloudflareRedirectLimits(rules);

  return rules;
}

/**
 * Formats redirect rules for Cloudflare Workers Static Assets.
 *
 * @param rules Redirect rules derived from site config and legacy permalink metadata.
 * @returns `_redirects` file content.
 */
export function formatCloudflareRedirects(
  rules: readonly CloudflareRedirectRule[],
): string {
  const lines = [
    GENERATED_HEADER,
    ...rules.map(
      (rule) => `${rule.source} ${rule.destination} ${REDIRECT_STATUS}`,
    ),
  ];

  return `${lines.join("\n")}\n`;
}

/**
 * Runs the Cloudflare redirect generator CLI.
 *
 * @param args Command-line arguments.
 * @returns Process exit code.
 */
export async function runCloudflareRedirectsCli(
  args = process.argv.slice(2),
): Promise<number> {
  const options = parseCliOptions(args);
  await generateCloudflareRedirects({ quiet: options.quiet });

  return 0;
}

function assertCloudflareRedirectLimits(
  rules: readonly CloudflareRedirectRule[],
): void {
  if (rules.length > CLOUDFLARE_STATIC_REDIRECT_LIMIT) {
    throw new Error(
      `Cloudflare supports ${CLOUDFLARE_STATIC_REDIRECT_LIMIT} static redirects; generated ${rules.length}.`,
    );
  }

  const oversizedRule = rules.find((rule) => {
    const line = `${rule.source} ${rule.destination} ${REDIRECT_STATUS}`;
    return line.length > CLOUDFLARE_REDIRECT_LINE_LIMIT;
  });

  if (oversizedRule !== undefined) {
    throw new Error(
      `Cloudflare redirect line exceeds ${CLOUDFLARE_REDIRECT_LINE_LIMIT} characters for ${oversizedRule.source}.`,
    );
  }
}

function mergeCloudflareRedirectRules(
  ...ruleSets: ReadonlyArray<readonly CloudflareRedirectRule[]>
): CloudflareRedirectRule[] {
  const redirects = new Map<string, CloudflareRedirectRule>();

  for (const rules of ruleSets) {
    for (const rule of rules) {
      const previous = redirects.get(rule.source);

      if (previous !== undefined && previous.destination !== rule.destination) {
        throw new Error(
          `Conflicting redirect destinations for ${rule.source}: ${previous.destination} and ${rule.destination}.`,
        );
      }

      redirects.set(rule.source, rule);
    }
  }

  const mergedRules = Array.from(redirects.values()).sort((left, right) =>
    left.source.localeCompare(right.source),
  );

  assertCloudflareRedirectLimits(mergedRules);

  return mergedRules;
}

function redirectRulesFromSiteRedirects(
  redirects: SiteRedirectMap,
): CloudflareRedirectRule[] {
  return Object.entries(redirects).map(([source, destination]) => ({
    destination: destination.trim(),
    source: normalizeLegacyPermalink(source),
  }));
}

function currentContentUrl(routePrefix: string, file: string): string {
  return withTrailingSlash(path.posix.join(routePrefix, filenameStem(file)));
}

function filenameStem(file: string): string {
  return path.basename(file).replace(/\.(?:md|mdx)$/iu, "");
}

function frontmatterData(markdown: string): Record<string, unknown> {
  return (matter(markdown) as { data: Record<string, unknown> }).data;
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

  return files.sort((left, right) => left.localeCompare(right));
}

function normalizeLegacyPermalink(value: string): string {
  const trimmed = value.trim();
  const pathname = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  return withTrailingSlash(pathname.replace(/\/{2,}/gu, "/"));
}

function parseCliOptions(args: readonly string[]): ParsedCliOptions {
  const allowedFlags = new Set(["--quiet"]);

  for (const arg of args) {
    if (!allowedFlags.has(arg)) {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return { quiet: args.includes("--quiet") };
}

async function readFileForFrontmatter(file: string): Promise<string> {
  return readFile(file, "utf8");
}

function withTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

if (import.meta.main) {
  try {
    process.exitCode = await runCloudflareRedirectsCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
