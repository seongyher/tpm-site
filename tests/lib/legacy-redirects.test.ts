import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, test } from "bun:test";
import matter from "gray-matter";

import {
  collectCloudflareRedirectRules,
  collectLegacyRedirectRules,
  defaultLegacyRedirectSources,
} from "../../scripts/build/generate-cloudflare-redirects";

const publishableSources = [
  {
    dir: path.resolve("site/content/announcements"),
    url: (file: string) =>
      withTrailingSlash(`/announcements/${filenameStem(file)}`),
  },
  {
    dir: path.resolve("site/content/articles"),
    url: (file: string) => withTrailingSlash(`/articles/${filenameStem(file)}`),
  },
] as const;
const publishablePattern = /\.mdx?$/i;
const rootCategoryRedirects = {
  "/aesthetics/": "/categories/aesthetics/",
  "/game-studies/": "/categories/game-studies/",
  "/history/": "/categories/history/",
  "/irony/": "/categories/irony/",
  "/memeculture/": "/categories/memeculture/",
  "/metamemetics/": "/categories/metamemetics/",
  "/philosophy/": "/categories/philosophy/",
  "/politics/": "/categories/politics/",
} as const;

async function configRedirects() {
  // eslint-disable-next-line no-unsanitized/method -- Fixed local config path, not user-controlled input.
  const configModule: unknown = await import(
    pathToFileURL(path.resolve("astro.config.ts")).href
  );

  if (!isAstroConfigModule(configModule)) {
    throw new TypeError("Astro config module has an unexpected shape.");
  }

  const redirects = configModule.default.redirects;

  if (redirects === undefined) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(redirects).map(([source, destination]) => {
      if (typeof destination !== "string") {
        throw new TypeError(
          `Expected string redirect destination for ${source}.`,
        );
      }

      return [source, destination];
    }),
  );
}

async function expectedRedirectsFromPublishableFrontmatter() {
  const redirects = new Map<string, string>();
  const seen = new Map<string, string>();

  for (const source of publishableSources) {
    const files = await listFiles(source.dir, publishablePattern);

    for (const file of files) {
      const data = frontmatterData(await readFile(file, "utf8"));

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
      redirects.set(redirectSource, source.url(file));
    }
  }

  return Object.fromEntries(
    Array.from(redirects.entries()).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function filenameStem(file: string) {
  return path.basename(file).replace(/\.(?:md|mdx)$/i, "");
}

function frontmatterData(markdown: string) {
  return (matter(markdown) as { data: Record<string, unknown> }).data;
}

function isAstroConfigModule(
  value: unknown,
): value is { default: { redirects?: Record<string, unknown> } } {
  if (!isRecord(value) || !isRecord(value["default"])) {
    return false;
  }

  const redirects = value["default"]["redirects"];
  return redirects === undefined || isRecord(redirects);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

  return files.sort((a, b) => a.localeCompare(b));
}

function normalizeLegacyPermalink(value: string) {
  const trimmed = value.trim();
  const pathname = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withTrailingSlash(pathname.replace(/\/{2,}/g, "/"));
}

function withTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

describe("legacy redirects", () => {
  test("Astro redirects include publishable legacy permalink frontmatter and root categories", async () => {
    const redirects = await configRedirects();

    expect(redirects).toMatchObject(
      await expectedRedirectsFromPublishableFrontmatter(),
    );
    expect(redirects).toMatchObject(rootCategoryRedirects);
  });

  test("content-derived Cloudflare redirects match publishable legacy permalink frontmatter", async () => {
    expect(
      Object.fromEntries(
        (await collectLegacyRedirectRules(defaultLegacyRedirectSources())).map(
          (rule) => [rule.source, rule.destination],
        ),
      ),
    ).toEqual(await expectedRedirectsFromPublishableFrontmatter());
  });

  test("Cloudflare redirects include site-owned root category redirects", async () => {
    expect(
      Object.fromEntries(
        (
          await collectCloudflareRedirectRules(defaultLegacyRedirectSources())
        ).map((rule) => [rule.source, rule.destination]),
      ),
    ).toMatchObject(rootCategoryRedirects);
  });
});
