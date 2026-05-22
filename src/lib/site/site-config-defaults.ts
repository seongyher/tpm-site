import { semanticProfileKinds } from "../metadata/semantic-profile-kinds";

/** Route keys exposed by the site-owner configuration. */
export const siteRouteKeys = [
  "allArticles",
  "announcements",
  "articles",
  "authors",
  "bibliography",
  "categories",
  "collections",
  "feed",
  "home",
  "search",
  "tags",
] as const;

/** Third-party article share targets supported by the platform. */
export const siteShareTargetIds = [
  "bluesky",
  "x",
  "threads",
  "facebook",
  "linkedin",
  "reddit",
  "hacker-news",
  "pinterest",
] as const;

/** Default homepage section labels for site-owner config. */
export const defaultHomepageLabelsConfig = {
  announcements: "Announcements",
  categories: "Categories",
  featured: "Featured Articles",
  read: "Read",
  recent: "Recent",
  startHere: "Start Here",
} as const;

/** Default homepage empty-state copy for site-owner config. */
export const defaultHomepageEmptyTextConfig = {
  announcements: "Announcements will appear here.",
  categories: "No categories are available yet.",
  featured: "Featured items will appear here.",
  startHere: "Curated starter articles will appear here.",
} as const;

/** Default homepage quick-navigation links for site-owner config. */
export const defaultHomepageDiscoveryLinksConfig = [
  { label: "Articles", route: "articles" },
  { label: "Archive", route: "allArticles" },
  { label: "Authors", route: "authors" },
  { label: "Collections", route: "collections" },
  { label: "Tags", route: "tags" },
] as const;

/** Default homepage content controls for site-owner config. */
export const defaultHomepageConfig = {
  announcementLimit: 3,
  discoveryLinks: defaultHomepageDiscoveryLinksConfig,
  emptyText: defaultHomepageEmptyTextConfig,
  featuredCollection: "featured",
  labels: defaultHomepageLabelsConfig,
  recentLimit: 8,
  startHereCollection: "start-here",
} as const;

/** Feature flags exposed by site-owner config. */
export const siteFeatureKeys = [
  "announcements",
  "authors",
  "bibliography",
  "categories",
  "collections",
  "feed",
  "pdf",
  "search",
  "support",
  "tags",
  "themeToggle",
] as const;

/** Default feature flags for site-owner config. */
export const defaultFeatureConfig = {
  announcements: true,
  authors: true,
  bibliography: true,
  categories: true,
  collections: true,
  feed: true,
  pdf: true,
  search: true,
  support: true,
  tags: true,
  themeToggle: true,
} as const satisfies Record<(typeof siteFeatureKeys)[number], boolean>;

/** Default metadata controls for site-owner config. */
export const defaultMetadataConfig = {
  semanticProfiles: {
    enabled: semanticProfileKinds,
  },
} as const;

/** Default publishable visibility controls for article-like content. */
export const defaultPublishableVisibilityConfig = {
  collections: true,
  directory: true,
  external: true,
  feed: true,
  homepage: true,
  pdf: true,
  related: true,
  search: true,
  sitemap: true,
} as const;

/** Default article and announcement frontmatter behavior. */
export const defaultContentDefaultsConfig = {
  announcements: {
    draft: false,
    visibility: defaultPublishableVisibilityConfig,
  },
  articles: {
    draft: false,
    pdf: {
      enabled: true,
    },
    visibility: defaultPublishableVisibilityConfig,
  },
} as const;
