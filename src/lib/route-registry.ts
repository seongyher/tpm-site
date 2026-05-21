import type { SiteConfig, SiteRouteKey } from "./site-config";
import type { SourceArtifactKey } from "./source-artifacts";

/** Optional feature keys that own generated route surfaces. */
export type RouteRegistryFeatureKey =
  | "announcements"
  | "authors"
  | "bibliography"
  | "categories"
  | "collections"
  | "feed"
  | "search"
  | "tags";

/** Publishable or generated entity kind represented by a route surface. */
export type RouteRegistryEntityKind =
  | "announcement"
  | "article"
  | "author"
  | "bibliography"
  | "category"
  | "collection"
  | "feed"
  | "home"
  | "search"
  | "tag";

/** Generated-output kind for a registered route surface. */
export type RouteRegistryOutputKind = "directory" | "file";

/** Cardinality/pattern class for a registered route surface. */
export type RouteRegistryPattern = "entry-root" | "file" | "index" | "root";

/** Public/generated surfaces a route participates in. */
export type RouteRegistrySurface =
  | "disabled-feature-diagnostic"
  | "feed"
  | "html"
  | "metadata"
  | "navigation"
  | "redirect-fallback"
  | "search"
  | "sitemap"
  | "validation";

/** Canonical route, entity, feature, and output metadata. */
export interface RouteRegistryEntry {
  readonly artifactKey: SourceArtifactKey;
  readonly enabled: boolean;
  readonly entity: RouteRegistryEntityKind;
  readonly feature?: RouteRegistryFeatureKey | undefined;
  readonly outputKind: RouteRegistryOutputKind;
  readonly outputPath: string;
  readonly pattern: RouteRegistryPattern;
  readonly route: string;
  readonly routeKey: SiteRouteKey;
  readonly surfaces: readonly RouteRegistrySurface[];
}

interface RouteRegistryDefinition {
  readonly entity: RouteRegistryEntityKind;
  readonly feature?: RouteRegistryFeatureKey | undefined;
  readonly pattern: RouteRegistryPattern;
  readonly routeKey: SiteRouteKey;
  readonly surfaces: readonly RouteRegistrySurface[];
}

const routeRegistryDefinitions = [
  {
    entity: "home",
    pattern: "root",
    routeKey: "home",
    surfaces: [
      "html",
      "metadata",
      "navigation",
      "search",
      "sitemap",
      "validation",
    ],
  },
  {
    entity: "article",
    pattern: "entry-root",
    routeKey: "articles",
    surfaces: [
      "html",
      "metadata",
      "navigation",
      "search",
      "sitemap",
      "validation",
    ],
  },
  {
    entity: "article",
    pattern: "index",
    routeKey: "allArticles",
    surfaces: [
      "html",
      "metadata",
      "navigation",
      "search",
      "sitemap",
      "validation",
    ],
  },
  {
    entity: "announcement",
    feature: "announcements",
    pattern: "entry-root",
    routeKey: "announcements",
    surfaces: [
      "disabled-feature-diagnostic",
      "html",
      "metadata",
      "navigation",
      "search",
      "sitemap",
      "validation",
    ],
  },
  {
    entity: "author",
    feature: "authors",
    pattern: "entry-root",
    routeKey: "authors",
    surfaces: [
      "disabled-feature-diagnostic",
      "html",
      "metadata",
      "navigation",
      "search",
      "sitemap",
      "validation",
    ],
  },
  {
    entity: "bibliography",
    feature: "bibliography",
    pattern: "index",
    routeKey: "bibliography",
    surfaces: [
      "disabled-feature-diagnostic",
      "html",
      "metadata",
      "navigation",
      "search",
      "sitemap",
      "validation",
    ],
  },
  {
    entity: "category",
    feature: "categories",
    pattern: "entry-root",
    routeKey: "categories",
    surfaces: [
      "disabled-feature-diagnostic",
      "html",
      "metadata",
      "navigation",
      "search",
      "sitemap",
      "validation",
    ],
  },
  {
    entity: "collection",
    feature: "collections",
    pattern: "entry-root",
    routeKey: "collections",
    surfaces: [
      "disabled-feature-diagnostic",
      "html",
      "metadata",
      "navigation",
      "search",
      "sitemap",
      "validation",
    ],
  },
  {
    entity: "feed",
    feature: "feed",
    pattern: "file",
    routeKey: "feed",
    surfaces: ["disabled-feature-diagnostic", "feed", "metadata", "validation"],
  },
  {
    entity: "search",
    feature: "search",
    pattern: "index",
    routeKey: "search",
    surfaces: [
      "disabled-feature-diagnostic",
      "html",
      "metadata",
      "search",
      "validation",
    ],
  },
  {
    entity: "tag",
    feature: "tags",
    pattern: "entry-root",
    routeKey: "tags",
    surfaces: [
      "disabled-feature-diagnostic",
      "html",
      "metadata",
      "navigation",
      "search",
      "sitemap",
      "validation",
    ],
  },
] as const satisfies readonly RouteRegistryDefinition[];

/**
 * Returns the canonical route registry for a site configuration.
 *
 * @param config Validated site configuration.
 * @returns Route registry entries with generated-output ownership metadata.
 */
export function routeRegistryEntries(config: SiteConfig): RouteRegistryEntry[] {
  return routeRegistryDefinitions.map((definition) =>
    routeRegistryEntry(definition, config),
  );
}

/**
 * Looks up one route registry entry by configured site route key.
 *
 * @param config Validated site configuration.
 * @param routeKey Site route key to read.
 * @returns Matching route registry entry.
 */
export function routeRegistryEntryForKey(
  config: SiteConfig,
  routeKey: SiteRouteKey,
): RouteRegistryEntry {
  const entry = routeRegistryEntries(config).find(
    (candidate) => candidate.routeKey === routeKey,
  );

  if (entry === undefined) {
    throw new Error(`Missing route registry entry "${routeKey}".`);
  }

  return entry;
}

/**
 * Builds a concrete generated index path below a configured route root.
 *
 * @param route Configured route root.
 * @param child Child route segment.
 * @returns Build-output-relative child index path.
 */
export function routeChildIndexOutputPath(
  route: string,
  child: string,
): string {
  const basePath = routeOutputBasePath(route);

  return basePath === ""
    ? `${child}/index.html`
    : `${basePath}/${child}/index.html`;
}

/**
 * Builds a concrete generated index path for a configured route root.
 *
 * @param route Configured route root.
 * @returns Build-output-relative route index path.
 */
export function routeIndexOutputPath(route: string): string {
  const basePath = routeOutputBasePath(route);

  return basePath === "" ? "index.html" : `${basePath}/index.html`;
}

/**
 * Checks whether a rendered pathname belongs to a configured route.
 *
 * @param pathname Rendered URL pathname.
 * @param route Configured route path.
 * @returns True when the route owns the pathname.
 */
export function routeOwnsPathname(pathname: string, route: string): boolean {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedRoute = normalizePathname(route);

  if (routeOutputKind(normalizedRoute) === "file") {
    return normalizedPathname === normalizedRoute;
  }

  return (
    normalizedPathname === normalizedRoute ||
    normalizedPathname.startsWith(normalizedRoute)
  );
}

/**
 * Normalizes a route into its generated output kind.
 *
 * @param route Configured route path.
 * @returns Generated-output kind.
 */
export function routeOutputKind(route: string): RouteRegistryOutputKind {
  return normalizePathname(route).endsWith(".xml") ? "file" : "directory";
}

/**
 * Normalizes a route into a build-output-relative path.
 *
 * @param route Configured route path.
 * @returns Build-output-relative path owned by the route.
 */
export function routeOutputPath(route: string): string {
  const pathname = normalizePathname(route);
  const relativePath = pathname.replace(/^\/+/u, "");

  if (relativePath === "") {
    return "index.html";
  }

  return routeOutputKind(pathname) === "directory"
    ? relativePath.replace(/\/+$/u, "")
    : relativePath;
}

/**
 * Normalizes a configured route root into its build-output base path.
 *
 * @param route Configured route path.
 * @returns Directory/file path without leading or trailing slashes.
 */
export function routeOutputBasePath(route: string): string {
  return (
    route
      .split("#")[0]
      ?.split("?")[0]
      ?.replace(/^\/+|\/+$/gu, "") ?? ""
  );
}

/**
 * Checks whether a route-owning feature is enabled for a site config.
 *
 * @param config Validated site configuration.
 * @param feature Optional feature key from a route registry entry.
 * @returns True when the route has no feature gate or its feature is enabled.
 */
export function routeFeatureEnabled(
  config: SiteConfig,
  feature: RouteRegistryFeatureKey | undefined,
): boolean {
  if (feature === undefined) {
    return true;
  }

  switch (feature) {
    case "announcements":
      return config.features.announcements;
    case "authors":
      return config.features.authors;
    case "bibliography":
      return config.features.bibliography;
    case "categories":
      return config.features.categories;
    case "collections":
      return config.features.collections;
    case "feed":
      return config.features.feed;
    case "search":
      return config.features.search;
    case "tags":
      return config.features.tags;
  }
}

function normalizePathname(value: string): string {
  const pathname = value.split("#")[0]?.split("?")[0] ?? "/";
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (withLeadingSlash === "/") {
    return "/";
  }

  return withLeadingSlash.endsWith(".xml") || withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

function routeRegistryEntry(
  definition: RouteRegistryDefinition,
  config: SiteConfig,
): RouteRegistryEntry {
  const route = config.routes[definition.routeKey];

  return {
    artifactKey: routeArtifactKey(definition),
    enabled: featureEnabled(config, definition.feature),
    entity: definition.entity,
    feature: definition.feature,
    outputKind: routeOutputKind(route),
    outputPath: routeOutputPath(route),
    pattern: definition.pattern,
    route,
    routeKey: definition.routeKey,
    surfaces: definition.surfaces,
  };
}

function featureEnabled(
  config: SiteConfig,
  feature: RouteRegistryFeatureKey | undefined,
): boolean {
  return routeFeatureEnabled(config, feature);
}

function routeArtifactKey(
  definition: RouteRegistryDefinition,
): SourceArtifactKey {
  if (definition.routeKey === "feed") {
    return "output.feed";
  }

  if (definition.routeKey === "search") {
    return "output.searchIndex";
  }

  return "output.routes";
}
