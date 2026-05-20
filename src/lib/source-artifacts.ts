import { projectRelativePath, type SiteInstancePaths } from "./site-instance";

/** Known source/artifact lifecycle categories owned by the platform. */
type SourceArtifactKind =
  | "content-collection"
  | "generated-output"
  | "parked-legacy-asset"
  | "processed-asset"
  | "public-static"
  | "site-config"
  | "site-root"
  | "site-theme";

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
  | "output.dist"
  | "public.root"
  | "site.root"
  | "theme"
  | "unusedAssets.root";

/** One known source or generated artifact location. */
export interface SourceArtifactEntry {
  readonly absolutePath: string;
  readonly key: SourceArtifactKey;
  readonly kind: SourceArtifactKind;
  readonly relativePath: string;
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
  readonly key: SourceArtifactKey;
  readonly kind: SourceArtifactKind;
}

/** Options for building a site source/artifact manifest. */
export interface SourceArtifactManifestOptions {
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
  const entries = sourceArtifactDefinitions(paths).map((entry) => ({
    ...entry,
    relativePath: projectRelativePath(entry.absolutePath, cwd),
  }));

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
  return (
    entry.kind === "content-collection" ||
    entry.kind === "processed-asset" ||
    entry.kind === "public-static" ||
    entry.kind === "site-config" ||
    entry.kind === "site-root" ||
    entry.kind === "site-theme"
  );
}

function sourceArtifactDefinitions(
  paths: SiteInstancePaths,
): SourceArtifactDefinition[] {
  return [
    {
      absolutePath: paths.root,
      key: "site.root",
      kind: "site-root",
    },
    {
      absolutePath: paths.config.site,
      key: "config.site",
      kind: "site-config",
    },
    {
      absolutePath: paths.config.redirects,
      key: "config.redirects",
      kind: "site-config",
    },
    {
      absolutePath: paths.theme,
      key: "theme",
      kind: "site-theme",
    },
    {
      absolutePath: paths.content.announcements,
      key: "content.announcements",
      kind: "content-collection",
    },
    {
      absolutePath: paths.content.articles,
      key: "content.articles",
      kind: "content-collection",
    },
    {
      absolutePath: paths.content.authors,
      key: "content.authors",
      kind: "content-collection",
    },
    {
      absolutePath: paths.content.categories,
      key: "content.categories",
      kind: "content-collection",
    },
    {
      absolutePath: paths.content.collections,
      key: "content.collections",
      kind: "content-collection",
    },
    {
      absolutePath: paths.content.pages,
      key: "content.pages",
      kind: "content-collection",
    },
    {
      absolutePath: paths.assets.root,
      key: "assets.root",
      kind: "processed-asset",
    },
    {
      absolutePath: paths.assets.articles,
      key: "assets.articles",
      kind: "processed-asset",
    },
    {
      absolutePath: paths.assets.shared,
      key: "assets.shared",
      kind: "processed-asset",
    },
    {
      absolutePath: paths.assets.site,
      key: "assets.site",
      kind: "processed-asset",
    },
    {
      absolutePath: paths.public,
      key: "public.root",
      kind: "public-static",
    },
    {
      absolutePath: paths.unusedAssets,
      key: "unusedAssets.root",
      kind: "parked-legacy-asset",
    },
    {
      absolutePath: paths.output.dist,
      key: "output.dist",
      kind: "generated-output",
    },
  ];
}
