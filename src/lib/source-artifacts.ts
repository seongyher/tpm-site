import path from "node:path";

import type { SiteConfig } from "./site-config";
import { projectRelativePath, type SiteInstancePaths } from "./site-instance";

/** Known source/artifact lifecycle categories owned by the platform. */
export type SourceArtifactKind =
  | "content-collection"
  | "generated-output"
  | "parked-legacy-asset"
  | "processed-asset"
  | "public-static"
  | "site-config"
  | "site-root"
  | "site-theme";

/** Likely maintainer responsible for one source or generated artifact. */
export type SourceArtifactOwner = "author" | "platform" | "site-owner";

/** Role used by diagnostics, release reports, and future studio tooling. */
export type SourceArtifactRole =
  | "asset-source"
  | "config"
  | "content"
  | "generated-asset"
  | "generated-feed"
  | "generated-pdf"
  | "generated-redirect"
  | "generated-route"
  | "generated-search"
  | "generated-sitemap"
  | "parked-source"
  | "public-static"
  | "site-root"
  | "theme";

/** Stable manifest key for one known source or artifact location. */
export type SourceArtifactKey =
  | "assets.articles"
  | "assets.root"
  | "assets.shared"
  | "assets.site"
  | "config.redirects"
  | "config.site"
  | "content.announcements"
  | "content.articles"
  | "content.authors"
  | "content.categories"
  | "content.collections"
  | "content.pages"
  | "output.articlePdfs"
  | "output.assets"
  | "output.dist"
  | "output.feed"
  | "output.headers"
  | "output.redirectFallbacks"
  | "output.routes"
  | "output.searchIndex"
  | "output.sitemapIndex"
  | "output.socialImages"
  | "output.wellKnown"
  | "public.root"
  | "site.root"
  | "theme"
  | "unusedAssets.root";

/** One known source or generated artifact location. */
export interface SourceArtifactEntry {
  readonly absolutePath: string;
  readonly description: string;
  readonly key: SourceArtifactKey;
  readonly kind: SourceArtifactKind;
  readonly owner: SourceArtifactOwner;
  readonly relativePath: string;
  readonly required: boolean;
  readonly role: SourceArtifactRole;
}

/** Source and generated artifact manifest for one site instance. */
export interface SourceArtifactManifest {
  readonly entries: readonly SourceArtifactEntry[];
  readonly generatedOutputs: readonly SourceArtifactEntry[];
  readonly parkedLegacyAssets: readonly SourceArtifactEntry[];
  readonly processedAssets: readonly SourceArtifactEntry[];
  readonly publicStatic: readonly SourceArtifactEntry[];
  readonly siteEditableSources: readonly SourceArtifactEntry[];
}

interface SourceArtifactDefinition {
  readonly absolutePath: string;
  readonly description: string;
  readonly key: SourceArtifactKey;
  readonly kind: SourceArtifactKind;
  readonly owner: SourceArtifactOwner;
  readonly required: boolean;
  readonly role: SourceArtifactRole;
}

/** Options for building a site source/artifact manifest. */
export interface SourceArtifactManifestOptions {
  readonly config?: Pick<SiteConfig, "features" | "routes"> | undefined;
  readonly cwd?: string | undefined;
}

/**
 * Builds the source/artifact manifest for one resolved site instance.
 *
 * @param paths Resolved site-instance paths.
 * @param options Optional project cwd used for relative diagnostics.
 * @returns Typed source and generated artifact ownership manifest.
 */
export function sourceArtifactManifest(
  paths: SiteInstancePaths,
  options: SourceArtifactManifestOptions = {},
): SourceArtifactManifest {
  const cwd = options.cwd ?? process.cwd();
  const entries = sourceArtifactDefinitions(paths, options.config).map(
    (entry) => ({
      ...entry,
      relativePath: projectRelativePath(entry.absolutePath, cwd),
    }),
  );

  return {
    entries,
    generatedOutputs: entries.filter(isGeneratedOutput),
    parkedLegacyAssets: entries.filter(isParkedLegacyAsset),
    processedAssets: entries.filter(isProcessedAsset),
    publicStatic: entries.filter(isPublicStatic),
    siteEditableSources: entries.filter(isSiteEditableSource),
  };
}

/**
 * Finds all manifest entries for one verifier-facing artifact role.
 *
 * @param manifest Source/artifact manifest.
 * @param role Source/artifact role to select.
 * @returns Matching manifest entries.
 */
export function sourceArtifactEntriesByRole(
  manifest: SourceArtifactManifest,
  role: SourceArtifactRole,
): SourceArtifactEntry[] {
  return manifest.entries.filter((entry) => entry.role === role);
}

/**
 * Finds one source/artifact manifest entry by stable key.
 *
 * @param manifest Source/artifact manifest.
 * @param key Stable source/artifact key.
 * @returns Matching manifest entry.
 */
export function sourceArtifactEntry(
  manifest: SourceArtifactManifest,
  key: SourceArtifactKey,
): SourceArtifactEntry {
  const entry = manifest.entries.find((candidate) => candidate.key === key);

  if (entry === undefined) {
    throw new Error(`Missing source artifact manifest entry "${key}".`);
  }

  return entry;
}

function isGeneratedOutput(entry: SourceArtifactEntry): boolean {
  return entry.kind === "generated-output";
}

function isParkedLegacyAsset(entry: SourceArtifactEntry): boolean {
  return entry.kind === "parked-legacy-asset";
}

function isProcessedAsset(entry: SourceArtifactEntry): boolean {
  return entry.kind === "processed-asset";
}

function isPublicStatic(entry: SourceArtifactEntry): boolean {
  return entry.kind === "public-static";
}

function isSiteEditableSource(entry: SourceArtifactEntry): boolean {
  return entry.owner !== "platform" && entry.kind !== "parked-legacy-asset";
}

function sourceArtifactDefinitions(
  paths: SiteInstancePaths,
  config: Pick<SiteConfig, "features" | "routes"> | undefined,
): SourceArtifactDefinition[] {
  return [
    {
      absolutePath: paths.root,
      description: "Active site instance root",
      key: "site.root",
      kind: "site-root",
      owner: "site-owner",
      required: true,
      role: "site-root",
    },
    {
      absolutePath: paths.config.site,
      description: "Validated site configuration",
      key: "config.site",
      kind: "site-config",
      owner: "site-owner",
      required: true,
      role: "config",
    },
    {
      absolutePath: paths.config.redirects,
      description: "Site-owned redirect configuration",
      key: "config.redirects",
      kind: "site-config",
      owner: "site-owner",
      required: true,
      role: "config",
    },
    {
      absolutePath: paths.theme,
      description: "Site-owned theme token overrides",
      key: "theme",
      kind: "site-theme",
      owner: "site-owner",
      required: true,
      role: "theme",
    },
    {
      absolutePath: paths.content.announcements,
      description: "Announcement content collection",
      key: "content.announcements",
      kind: "content-collection",
      owner: "author",
      required: config?.features.announcements ?? true,
      role: "content",
    },
    {
      absolutePath: paths.content.articles,
      description: "Article content collection",
      key: "content.articles",
      kind: "content-collection",
      owner: "author",
      required: true,
      role: "content",
    },
    {
      absolutePath: paths.content.authors,
      description: "Author metadata collection",
      key: "content.authors",
      kind: "content-collection",
      owner: "author",
      required: config?.features.authors ?? true,
      role: "content",
    },
    {
      absolutePath: paths.content.categories,
      description: "Category metadata collection",
      key: "content.categories",
      kind: "content-collection",
      owner: "site-owner",
      required: config?.features.categories ?? true,
      role: "content",
    },
    {
      absolutePath: paths.content.collections,
      description: "Editorial collection content",
      key: "content.collections",
      kind: "content-collection",
      owner: "author",
      required: true,
      role: "content",
    },
    {
      absolutePath: paths.content.pages,
      description: "Standalone page content collection",
      key: "content.pages",
      kind: "content-collection",
      owner: "author",
      required: true,
      role: "content",
    },
    {
      absolutePath: paths.assets.root,
      description: "Site assets processed by Astro",
      key: "assets.root",
      kind: "processed-asset",
      owner: "site-owner",
      required: false,
      role: "asset-source",
    },
    {
      absolutePath: paths.assets.articles,
      description: "Article-owned processed assets",
      key: "assets.articles",
      kind: "processed-asset",
      owner: "author",
      required: false,
      role: "asset-source",
    },
    {
      absolutePath: paths.assets.shared,
      description: "Shared processed assets",
      key: "assets.shared",
      kind: "processed-asset",
      owner: "site-owner",
      required: false,
      role: "asset-source",
    },
    {
      absolutePath: paths.assets.site,
      description: "Site identity processed assets",
      key: "assets.site",
      kind: "processed-asset",
      owner: "site-owner",
      required: false,
      role: "asset-source",
    },
    {
      absolutePath: paths.public,
      description: "Static public files copied unchanged",
      key: "public.root",
      kind: "public-static",
      owner: "site-owner",
      required: true,
      role: "public-static",
    },
    {
      absolutePath: paths.unusedAssets,
      description: "Intentionally parked legacy assets",
      key: "unusedAssets.root",
      kind: "parked-legacy-asset",
      owner: "site-owner",
      required: false,
      role: "parked-source",
    },
    {
      absolutePath: paths.output.dist,
      description: "Generated static output root",
      key: "output.dist",
      kind: "generated-output",
      owner: "platform",
      required: true,
      role: "generated-route",
    },
    {
      absolutePath: paths.output.dist,
      description: "Generated HTML route surfaces",
      key: "output.routes",
      kind: "generated-output",
      owner: "platform",
      required: true,
      role: "generated-route",
    },
    {
      absolutePath: path.join(paths.output.dist, "_astro"),
      description: "Generated fingerprinted Astro assets",
      key: "output.assets",
      kind: "generated-output",
      owner: "platform",
      required: false,
      role: "generated-asset",
    },
    {
      absolutePath: path.join(paths.output.dist, "_astro"),
      description: "Generated social preview image assets",
      key: "output.socialImages",
      kind: "generated-output",
      owner: "platform",
      required: false,
      role: "generated-asset",
    },
    {
      absolutePath: path.join(paths.output.dist, "articles"),
      description: "Generated article PDF files",
      key: "output.articlePdfs",
      kind: "generated-output",
      owner: "platform",
      required: config?.features.pdf ?? false,
      role: "generated-pdf",
    },
    {
      absolutePath: path.join(
        paths.output.dist,
        outputPath(config?.routes.feed ?? "/feed.xml"),
      ),
      description: "Generated RSS feed",
      key: "output.feed",
      kind: "generated-output",
      owner: "platform",
      required: config?.features.feed ?? true,
      role: "generated-feed",
    },
    {
      absolutePath: path.join(paths.output.dist, "sitemap-index.xml"),
      description: "Generated sitemap index",
      key: "output.sitemapIndex",
      kind: "generated-output",
      owner: "platform",
      required: true,
      role: "generated-sitemap",
    },
    {
      absolutePath: path.join(paths.output.dist, "pagefind"),
      description: "Generated Pagefind search index",
      key: "output.searchIndex",
      kind: "generated-output",
      owner: "platform",
      required: config?.features.search ?? true,
      role: "generated-search",
    },
    {
      absolutePath: paths.output.dist,
      description: "Generated redirect fallback pages",
      key: "output.redirectFallbacks",
      kind: "generated-output",
      owner: "platform",
      required: false,
      role: "generated-redirect",
    },
    {
      absolutePath: path.join(paths.output.dist, "_headers"),
      description: "Generated or copied Cloudflare headers file",
      key: "output.headers",
      kind: "generated-output",
      owner: "platform",
      required: false,
      role: "generated-asset",
    },
    {
      absolutePath: path.join(paths.output.dist, ".well-known"),
      description: "Generated well-known crawler policy files",
      key: "output.wellKnown",
      kind: "generated-output",
      owner: "platform",
      required: false,
      role: "generated-asset",
    },
  ];
}

function outputPath(route: string): string {
  const routePath = route.split("#")[0]?.split("?")[0]?.replace(/^\/+/u, "");

  return routePath === undefined || routePath.length === 0
    ? "index.html"
    : routePath;
}
