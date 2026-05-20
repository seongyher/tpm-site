import { absoluteUrl } from "./seo";
import { type SiteConfig, siteConfig } from "./site-config";

/** Supported route-family names for normalized metadata. */
export type RouteMetadataKind =
  | "announcement"
  | "announcements-index"
  | "article"
  | "articles-archive"
  | "articles-index"
  | "author-index"
  | "author-profile"
  | "bibliography"
  | "catalog"
  | "category-detail"
  | "category-index"
  | "collection-detail"
  | "collection-index"
  | "home"
  | "not-found"
  | "page"
  | "redirect"
  | "search"
  | "tag-detail"
  | "tag-index";

/** Robots policies emitted by the platform. */
export type RobotsPolicy = "index,follow" | "noindex,follow";

/** Machine-readable discovery policy for a route or publishable entry. */
export interface DiscoveryPolicy {
  contentIndex: boolean;
  feed: boolean;
  sitemap: boolean;
}

/** Visibility fields available on article-like content. */
export interface PublishableVisibility {
  directory: boolean;
  feed: boolean;
  search: boolean;
}

/** Minimal visible item shape accepted by `ItemList` metadata helpers. */
export interface MetadataListItem {
  description?: string | undefined;
  href: string;
  title: string;
}

/** Minimal breadcrumb item shape accepted by metadata helpers. */
export interface MetadataBreadcrumbItem {
  href: string;
  title: string;
}

/** Inputs supplied by routes before metadata normalization. */
export interface RouteMetadataInput {
  canonicalPath: string;
  description: string;
  kind: RouteMetadataKind;
  robots?: RobotsPolicy | undefined;
  title: string;
}

/** Normalized route metadata consumed by layouts and validation code. */
export interface RouteMetadata extends RouteMetadataInput {
  discovery: DiscoveryPolicy;
  robots: RobotsPolicy;
}

/** Schema.org JSON-LD node used by metadata builders. */
export type JsonLdNode = Record<string, unknown>;

const noindexRouteKinds = new Set<RouteMetadataKind>([
  "catalog",
  "not-found",
  "redirect",
  "search",
]);

/**
 * Normalizes route metadata and applies platform-level robots/discovery rules.
 *
 * @param input Route-specific metadata facts.
 * @returns Metadata with explicit robots and discovery policy.
 */
export function normalizeRouteMetadata(
  input: RouteMetadataInput,
): RouteMetadata {
  const robots = input.robots ?? routeRobotsPolicy(input.kind);

  return {
    ...input,
    discovery: routeDiscoveryPolicy(input.kind, robots),
    robots,
  };
}

/**
 * Resolves the default robots policy for a route family.
 *
 * @param kind Route metadata kind.
 * @returns Indexable route policy unless the route is utility/private output.
 */
export function routeRobotsPolicy(kind: RouteMetadataKind): RobotsPolicy {
  return noindexRouteKinds.has(kind) ? "noindex,follow" : "index,follow";
}

/**
 * Resolves sitemap/feed/search-index policy for a route family.
 *
 * @param kind Route metadata kind.
 * @param robots Effective robots policy for the route.
 * @returns Machine-readable discovery policy.
 */
export function routeDiscoveryPolicy(
  kind: RouteMetadataKind,
  robots: RobotsPolicy = routeRobotsPolicy(kind),
): DiscoveryPolicy {
  if (robots === "noindex,follow") {
    return { contentIndex: false, feed: false, sitemap: false };
  }

  return {
    contentIndex: routeContentIndexPolicy(kind),
    feed: false,
    sitemap: routeSitemapPolicy(kind),
  };
}

/**
 * Maps article-like content visibility to public discovery surfaces.
 *
 * @param visibility Normalized frontmatter/config visibility.
 * @returns Discovery policy for the concrete published entry.
 */
export function publishableDiscoveryPolicy(
  visibility: PublishableVisibility,
): DiscoveryPolicy {
  return {
    contentIndex: visibility.search,
    feed: visibility.feed,
    sitemap: visibility.directory,
  };
}

/**
 * Determines whether a path should be included in the generated sitemap.
 *
 * @param pathname Absolute URL path from the sitemap integration.
 * @param config Site configuration with configured feature route roots.
 * @returns False for known noindex utility routes.
 */
export function sitemapIncludesPath(
  pathname: string,
  config: SiteConfig = siteConfig,
): boolean {
  const normalizedPathname = ensureLeadingAndTrailingSlash(pathname);
  const excludedRoutes = [config.routes.search, "/404/", "/catalog/"].map(
    ensureLeadingAndTrailingSlash,
  );

  return !excludedRoutes.some((route) => normalizedPathname.startsWith(route));
}

/**
 * Builds the stable site root URL used in JSON-LD `@id` values.
 *
 * @param site Astro site URL when available.
 * @returns Absolute site root URL with a trailing slash and no hash.
 */
export function siteRootUrl(site: string | undefined | URL): string {
  return absoluteUrl("/", site).replace(/\/+$/u, "/");
}

/**
 * Builds the stable `WebSite` JSON-LD ID.
 *
 * @param site Astro site URL when available.
 * @returns Stable `WebSite` ID.
 */
export function websiteEntityId(site: string | undefined | URL): string {
  return `${siteRootUrl(site)}#website`;
}

/**
 * Builds the stable publisher `Organization`/`Person` JSON-LD ID.
 *
 * @param site Astro site URL when available.
 * @returns Stable publisher ID.
 */
export function publisherEntityId(site: string | undefined | URL): string {
  return `${siteRootUrl(site)}#publisher`;
}

/**
 * Builds a stable route-scoped JSON-LD ID.
 *
 * @param canonicalPath Route canonical path or URL.
 * @param fragment Fragment without a leading `#`.
 * @param site Astro site URL when available.
 * @returns Absolute route URL with a hash ID.
 */
export function routeEntityId(
  canonicalPath: string,
  fragment: string,
  site: string | undefined | URL,
): string {
  return `${absoluteUrl(canonicalPath, site).split("#")[0] ?? ""}#${fragment}`;
}

/**
 * Builds the stable `WebPage` JSON-LD ID for a route.
 *
 * @param canonicalPath Route canonical path or URL.
 * @param site Astro site URL when available.
 * @returns Stable route `WebPage` ID.
 */
export function webPageEntityId(
  canonicalPath: string,
  site: string | undefined | URL,
): string {
  return routeEntityId(canonicalPath, "webpage", site);
}

/**
 * Builds the stable `ItemList` JSON-LD ID for a route.
 *
 * @param canonicalPath Route canonical path or URL.
 * @param site Astro site URL when available.
 * @returns Stable route `ItemList` ID.
 */
export function itemListEntityId(
  canonicalPath: string,
  site: string | undefined | URL,
): string {
  return routeEntityId(canonicalPath, "itemlist", site);
}

/**
 * Builds the stable `BreadcrumbList` JSON-LD ID for a route.
 *
 * @param canonicalPath Route canonical path or URL.
 * @param site Astro site URL when available.
 * @returns Stable route `BreadcrumbList` ID.
 */
export function breadcrumbEntityId(
  canonicalPath: string,
  site: string | undefined | URL,
): string {
  return routeEntityId(canonicalPath, "breadcrumb", site);
}

/**
 * Builds stable publisher and website nodes for every indexable site route.
 *
 * @param site Astro site URL when available.
 * @param config Site identity configuration.
 * @returns Publisher and `WebSite` JSON-LD nodes.
 */
export function siteIdentityJsonLd(
  site: string | undefined | URL,
  config: SiteConfig = siteConfig,
): JsonLdNode[] {
  const publisherId = publisherEntityId(site);
  const publisherType =
    config.identity.publisherType === "person" ? "Person" : "Organization";
  const publisher = compactJsonLdNode({
    "@id": publisherId,
    "@type": publisherType,
    logo:
      config.identity.logo === undefined
        ? undefined
        : {
            "@type": "ImageObject",
            url: absoluteUrl(config.identity.logo, site),
          },
    name: config.identity.publisherName ?? config.identity.title,
    sameAs:
      config.identity.sameAs.length === 0 ? undefined : config.identity.sameAs,
    url: siteRootUrl(site),
  });
  const website = compactJsonLdNode({
    "@id": websiteEntityId(site),
    "@type": "WebSite",
    alternateName: config.identity.shortTitle,
    description: config.identity.description,
    inLanguage: config.identity.language,
    name: config.identity.title,
    publisher: { "@id": publisherId },
    url: siteRootUrl(site),
  });

  return [publisher, website];
}

/**
 * Builds a route-level `WebPage` JSON-LD node from normalized metadata.
 *
 * @param metadata Normalized route metadata.
 * @param site Astro site URL when available.
 * @param config Site identity configuration.
 * @returns Conservative `WebPage` JSON-LD node.
 */
export function webPageJsonLd(
  metadata: RouteMetadata,
  site: string | undefined | URL,
  config: SiteConfig = siteConfig,
  options: { mainEntity?: JsonLdNode } = {},
): JsonLdNode {
  return compactJsonLdNode({
    "@id": webPageEntityId(metadata.canonicalPath, site),
    "@type": webPageSchemaType(metadata.kind),
    description: metadata.description,
    inLanguage: config.identity.language,
    isPartOf: { "@id": websiteEntityId(site) },
    mainEntity: options.mainEntity,
    name: metadata.title,
    publisher: { "@id": publisherEntityId(site) },
    url: absoluteUrl(metadata.canonicalPath, site),
  });
}

/**
 * Serializes route metadata nodes as one Schema.org graph.
 *
 * @param nodes JSON-LD nodes to include.
 * @returns JSON-LD graph object or undefined when there are no nodes.
 */
export function jsonLdGraph(
  nodes: readonly JsonLdNode[],
): JsonLdNode | undefined {
  const graph = nodes.filter((node) => Object.keys(node).length > 0);

  return graph.length === 0
    ? undefined
    : {
        "@context": "https://schema.org",
        "@graph": graph,
      };
}

/**
 * Builds a Schema.org `ItemList` for items visibly represented on a route.
 *
 * @param canonicalPath Route canonical path owning the list.
 * @param items Visible items in display order.
 * @param site Astro site URL when available.
 * @returns ItemList node, or undefined when there are no visible items.
 */
export function itemListJsonLd(
  canonicalPath: string,
  items: readonly MetadataListItem[],
  site: string | undefined | URL,
): JsonLdNode | undefined {
  if (items.length === 0) {
    return undefined;
  }

  return {
    "@id": itemListEntityId(canonicalPath, site),
    "@type": "ItemList",
    itemListElement: items.map((item, index) =>
      compactJsonLdNode({
        "@type": "ListItem",
        description: item.description,
        name: item.title,
        position: index + 1,
        url: absoluteUrl(item.href, site),
      }),
    ),
    numberOfItems: items.length,
  };
}

/**
 * Builds a Schema.org `BreadcrumbList` for real site hierarchy.
 *
 * @param canonicalPath Route canonical path owning the breadcrumb list.
 * @param items Breadcrumbs in top-to-current order.
 * @param site Astro site URL when available.
 * @returns BreadcrumbList node, or undefined when there is no hierarchy.
 */
export function breadcrumbListJsonLd(
  canonicalPath: string,
  items: readonly MetadataBreadcrumbItem[],
  site: string | undefined | URL,
): JsonLdNode | undefined {
  if (items.length < 2) {
    return undefined;
  }

  return {
    "@id": breadcrumbEntityId(canonicalPath, site),
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      item: absoluteUrl(item.href, site),
      name: item.title,
      position: index + 1,
    })),
  };
}

/**
 * Builds a conservative author profile entity node.
 *
 * @param input Author profile facts visible on the author page.
 * @param input.href Canonical author URL.
 * @param input.name Display name.
 * @param input.type Author profile kind.
 * @param input.description Optional visible short biography.
 * @param input.sameAs Optional external profile links.
 * @param site Astro site URL when available.
 * @returns Person or Organization node for a profile route.
 */
export function profileEntityJsonLd(
  input: {
    description?: string | undefined;
    href: string;
    name: string;
    sameAs?: readonly string[] | undefined;
    type: "anonymous" | "collective" | "organization" | "person";
  },
  site: string | undefined | URL,
): JsonLdNode {
  return compactJsonLdNode({
    "@id": routeEntityId(input.href, "author", site),
    "@type":
      input.type === "organization" || input.type === "collective"
        ? "Organization"
        : "Person",
    description: input.description,
    name: input.name,
    sameAs:
      input.sameAs === undefined || input.sameAs.length === 0
        ? undefined
        : input.sameAs,
    url: absoluteUrl(input.href, site),
  });
}

function routeSitemapPolicy(kind: RouteMetadataKind): boolean {
  return kind !== "redirect";
}

function routeContentIndexPolicy(kind: RouteMetadataKind): boolean {
  return !(
    kind === "articles-archive" ||
    kind === "bibliography" ||
    kind === "redirect"
  );
}

function webPageSchemaType(kind: RouteMetadataKind): string {
  switch (kind) {
    case "announcement":
      return "WebPage";
    case "announcements-index":
      return "CollectionPage";
    case "article":
      return "WebPage";
    case "articles-archive":
      return "CollectionPage";
    case "articles-index":
      return "CollectionPage";
    case "author-index":
      return "WebPage";
    case "author-profile":
      return "ProfilePage";
    case "bibliography":
      return "CollectionPage";
    case "catalog":
      return "WebPage";
    case "category-detail":
      return "CollectionPage";
    case "category-index":
      return "CollectionPage";
    case "collection-detail":
      return "CollectionPage";
    case "collection-index":
      return "CollectionPage";
    case "home":
      return "WebPage";
    case "not-found":
      return "WebPage";
    case "page":
      return "WebPage";
    case "redirect":
      return "WebPage";
    case "search":
      return "WebPage";
    case "tag-detail":
      return "CollectionPage";
    case "tag-index":
      return "CollectionPage";
  }
}

function compactJsonLdNode(node: JsonLdNode): JsonLdNode {
  return Object.fromEntries(
    Object.entries(node).filter(([, value]) => value !== undefined),
  );
}

function ensureLeadingAndTrailingSlash(pathname: string): string {
  const cleanPathname = pathname.split("?")[0]?.split("#")[0] ?? "/";
  const withLeadingSlash = cleanPathname.startsWith("/")
    ? cleanPathname
    : `/${cleanPathname}`;

  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}
