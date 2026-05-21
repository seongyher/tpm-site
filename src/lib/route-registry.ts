import type { SiteConfig, SiteRouteKey } from "./site-config";

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
type RouteRegistryEntityKind =
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

/** Canonical route, entity, feature, and output metadata. */
export interface RouteRegistryEntry {
  readonly enabled: boolean;
  readonly entity: RouteRegistryEntityKind;
  readonly feature?: RouteRegistryFeatureKey | undefined;
  readonly outputKind: RouteRegistryOutputKind;
  readonly outputPath: string;
  readonly route: string;
  readonly routeKey: SiteRouteKey;
}

interface RouteRegistryDefinition {
  readonly entity: RouteRegistryEntityKind;
  readonly feature?: RouteRegistryFeatureKey | undefined;
  readonly routeKey: SiteRouteKey;
}

const routeRegistryDefinitions = [
  { entity: "home", routeKey: "home" },
  { entity: "article", routeKey: "articles" },
  { entity: "article", routeKey: "allArticles" },
  {
    entity: "announcement",
    feature: "announcements",
    routeKey: "announcements",
  },
  { entity: "author", feature: "authors", routeKey: "authors" },
  {
    entity: "bibliography",
    feature: "bibliography",
    routeKey: "bibliography",
  },
  { entity: "category", feature: "categories", routeKey: "categories" },
  { entity: "collection", feature: "collections", routeKey: "collections" },
  { entity: "feed", feature: "feed", routeKey: "feed" },
  { entity: "search", feature: "search", routeKey: "search" },
  { entity: "tag", feature: "tags", routeKey: "tags" },
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

function featureEnabled(
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
    enabled: featureEnabled(config, definition.feature),
    entity: definition.entity,
    feature: definition.feature,
    outputKind: routeOutputKind(route),
    outputPath: routeOutputPath(route),
    route,
    routeKey: definition.routeKey,
  };
}
