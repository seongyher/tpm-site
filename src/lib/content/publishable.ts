import type { ImageMetadata } from "astro";

import type { SemanticMetadata } from "../metadata/semantic-metadata";
import {
  type AnnouncementEntry,
  announcementUrl,
  type ArticleEntry,
  articleUrl,
  formatDate,
} from "../routes/routes";
import { siteConfig } from "../site/site-config";
import type { ArticleArchiveItem } from "./archive";
import type { AuthorSummary } from "./authors";

/** Runtime kind derived from the source content collection. */
export type PublishableKind = "announcement" | "article";

/** Source content collection that currently produces publishable entries. */
type PublishableSourceCollection = "announcements" | "articles";

/** Source body format derived from the content file path. */
type PublishableSourceFormat = "markdown" | "mdx" | "unknown";

/** Public surfaces a publishable entry may opt out of. */
export type PublishableVisibilitySurface =
  | "collections"
  | "directory"
  | "external"
  | "feed"
  | "homepage"
  | "pdf"
  | "related"
  | "search"
  | "sitemap";

/** Normalized publishable visibility with permissive defaults. */
export type PublishableVisibility = Record<
  PublishableVisibilitySurface,
  boolean
>;

/** Image metadata consumed by publishable cards, lists, and feature slots. */
export interface PublishableImage {
  alt: string;
  src: ImageMetadata;
}

/** Category facts shared by article-like publishable entries. */
interface PublishableCategory {
  href: string;
  title: string;
}

/** Stable source facts for a publishable entry. */
interface PublishableSourceFacts {
  collection: PublishableSourceCollection;
  draft: boolean;
  filePath?: string | undefined;
  format: PublishableSourceFormat;
  id: string;
  kind: PublishableKind;
}

/** Canonical route facts for a publishable entry. */
interface PublishableRouteFacts {
  canonicalPath: string;
  href: string;
  legacyPaths: readonly string[];
  outputPath?: string | undefined;
}

/** Display facts safe to pass to list/card/feed/view-model consumers. */
interface PublishableDisplayFacts {
  author: string;
  authors?: readonly AuthorSummary[] | undefined;
  category?: PublishableCategory | undefined;
  date: string;
  description: string;
  image?: PublishableImage | undefined;
  title: string;
  updated?: string | undefined;
}

/** Taxonomy facts for grouping and discovery surfaces. */
interface PublishableTaxonomyFacts {
  category?: PublishableCategory | undefined;
  tags: readonly string[];
}

/** Representative media facts carried by publishable entries. */
interface PublishableMediaFacts {
  image?: PublishableImage | undefined;
}

/** Entry-level metadata facts consumed by the metadata engine. */
interface PublishableMetadataFacts {
  canonicalPath: string;
  date: Date;
  description: string;
  image?: PublishableImage | undefined;
  semantic: SemanticMetadata;
  title: string;
  updated?: Date | undefined;
}

/** Article or announcement normalized for source-agnostic helpers. */
export interface PublishableEntry {
  author: string;
  authors?: readonly AuthorSummary[] | undefined;
  category?: PublishableCategory | undefined;
  date: string;
  description: string;
  display: PublishableDisplayFacts;
  href: string;
  image?: PublishableImage | undefined;
  kind: PublishableKind;
  media: PublishableMediaFacts;
  metadata: PublishableMetadataFacts;
  route: PublishableRouteFacts;
  slug: string;
  source: PublishableSourceFacts;
  taxonomy: PublishableTaxonomyFacts;
  title: string;
  updated?: string | undefined;
  visibility: PublishableVisibility;
}

/** Display-ready item consumed by compact publishable-entry lists. */
export interface PublishableListItem {
  author?: string | undefined;
  authors?: readonly AuthorSummary[] | undefined;
  category?: PublishableEntry["category"];
  date?: string | undefined;
  description?: string | undefined;
  href: string;
  image?: PublishableImage | undefined;
  kind?: PublishableKind | undefined;
  title: string;
}

/** Default visibility for published entries that omit overrides. */
export const defaultPublishableVisibility = {
  collections: true,
  directory: true,
  external: true,
  feed: true,
  homepage: true,
  pdf: true,
  related: true,
  search: true,
  sitemap: true,
} as const satisfies PublishableVisibility;

/**
 * Normalizes partial visibility data into a complete visibility contract.
 *
 * @param visibility Optional visibility overrides from frontmatter.
 * @param defaults Site-owned fallback visibility values.
 * @returns Visibility values with true defaults.
 */
export function normalizePublishableVisibility(
  visibility: Partial<PublishableVisibility> | undefined,
  defaults: PublishableVisibility = defaultPublishableVisibility,
): PublishableVisibility {
  return {
    ...defaults,
    ...visibility,
  };
}

/**
 * Converts an article archive item into the shared publishable model.
 *
 * @param item Display-ready article archive item.
 * @returns Source-agnostic publishable entry.
 */
export function publishableFromArticleArchive(
  item: ArticleArchiveItem,
): PublishableEntry {
  const category =
    item.category === undefined
      ? undefined
      : {
          href: item.category.url,
          title: item.category.title,
        };
  const href = item.url;
  const display = publishableDisplayFacts({
    author: item.author,
    authors: item.authors,
    category,
    date: item.date,
    description: item.description,
    image: item.image,
    title: item.title,
    updated:
      item.article.data.updated === undefined
        ? undefined
        : formatDate(item.article.data.updated),
  });
  const metadata = publishableMetadataFacts({
    canonicalPath: href,
    date: item.article.data.date,
    description: item.description,
    image: item.image,
    semantic: item.article.data.semantic,
    title: item.title,
    updated: item.article.data.updated,
  });
  const visibility = normalizePublishableVisibility(
    item.article.data.visibility,
    siteConfig.contentDefaults.articles.visibility,
  );

  return {
    ...display,
    display,
    href,
    kind: "article",
    media: {
      image: item.image,
    },
    metadata,
    route: {
      canonicalPath: href,
      href,
      legacyPaths: publishableLegacyPaths(item.article.data.legacyPermalink),
    },
    slug: item.article.id,
    source: {
      collection: "articles",
      draft: item.article.data.draft,
      filePath: item.article.filePath,
      format: publishableSourceFormat(item.article.filePath),
      id: item.article.id,
      kind: "article",
    },
    taxonomy: {
      category,
      tags: item.article.data.tags,
    },
    visibility,
  };
}

/**
 * Converts an announcement entry into the shared publishable model.
 *
 * @param announcement Announcement content entry.
 * @returns Source-agnostic publishable entry.
 */
export function publishableFromAnnouncement(
  announcement: AnnouncementEntry,
): PublishableEntry {
  const title = announcement.data.title;
  const href = announcementUrl(announcement.id);
  const image =
    announcement.data.image === undefined
      ? undefined
      : {
          alt: announcement.data.imageAlt ?? title,
          src: announcement.data.image,
        };
  const display = publishableDisplayFacts({
    author: announcement.data.author,
    date: formatDate(announcement.data.date),
    description: announcement.data.description,
    image,
    title,
    updated:
      announcement.data.updated === undefined
        ? undefined
        : formatDate(announcement.data.updated),
  });
  const metadata = publishableMetadataFacts({
    canonicalPath: href,
    date: announcement.data.date,
    description: announcement.data.description,
    image,
    semantic: announcement.data.semantic,
    title,
    updated: announcement.data.updated,
  });
  const visibility = normalizePublishableVisibility(
    announcement.data.visibility,
    siteConfig.contentDefaults.announcements.visibility,
  );

  return {
    ...display,
    display,
    href,
    kind: "announcement",
    media: {
      image,
    },
    metadata,
    route: {
      canonicalPath: href,
      href,
      legacyPaths: publishableLegacyPaths(announcement.data.legacyPermalink),
    },
    slug: announcement.id,
    source: {
      collection: "announcements",
      draft: announcement.data.draft,
      filePath: announcement.filePath,
      format: publishableSourceFormat(announcement.filePath),
      id: announcement.id,
      kind: "announcement",
    },
    taxonomy: {
      tags: [],
    },
    visibility,
  };
}

/**
 * Converts publishable entries into compact list item props.
 *
 * @param entries Normalized publishable entries.
 * @returns Component-ready compact list items.
 */
export function publishableListItems(
  entries: readonly PublishableEntry[],
): PublishableListItem[] {
  return entries.map(publishableListItem);
}

/**
 * Converts one publishable entry into compact list item props.
 *
 * @param entry Normalized publishable entry.
 * @returns Component-ready compact list item.
 */
export function publishableListItem(
  entry: PublishableEntry,
): PublishableListItem {
  return {
    author: entry.display.author,
    authors: entry.display.authors,
    category: entry.display.category,
    date: entry.display.date,
    description: entry.display.description,
    href: entry.href,
    image: entry.display.image,
    kind: entry.kind,
    title: entry.display.title,
  };
}

/**
 * Checks one visibility surface without dynamic object indexing.
 *
 * @param entry Publishable entry to inspect.
 * @param surface Visibility surface.
 * @returns Whether the entry is visible on that surface.
 */
export function publishableVisibleOn(
  entry: PublishableEntry,
  surface: PublishableVisibilitySurface,
): boolean {
  switch (surface) {
    case "collections":
      return entry.visibility.collections;
    case "directory":
      return entry.visibility.directory;
    case "external":
      return entry.visibility.external;
    case "feed":
      return entry.visibility.feed;
    case "homepage":
      return entry.visibility.homepage;
    case "pdf":
      return entry.visibility.pdf;
    case "related":
      return entry.visibility.related;
    case "search":
      return entry.visibility.search;
    case "sitemap":
      return entry.visibility.sitemap;
  }
}

/**
 * Filters publishable entries for one public surface.
 *
 * @param entries Normalized publishable entries.
 * @param surface Visibility surface to check.
 * @returns Entries visible on the requested surface.
 */
export function visiblePublishables(
  entries: readonly PublishableEntry[],
  surface: PublishableVisibilitySurface,
): PublishableEntry[] {
  return entries.filter((entry) => publishableVisibleOn(entry, surface));
}

/**
 * Builds a global publishable slug index and fails duplicate slugs.
 *
 * @param entries Publishable entries from every publishable collection.
 * @returns Slug lookup map.
 */
export function publishableIndex(
  entries: readonly PublishableEntry[],
): Map<string, PublishableEntry> {
  const index = new Map<string, PublishableEntry>();

  entries.forEach((entry) => {
    const previous = index.get(entry.slug);
    if (previous !== undefined) {
      throw new Error(
        `Duplicate publishable slug "${entry.slug}" for ${previous.kind} and ${entry.kind}.`,
      );
    }

    index.set(entry.slug, entry);
  });

  return index;
}

/**
 * Returns the canonical URL for an article or announcement source entry.
 *
 * @param entry Source publishable entry.
 * @returns Public route for the entry's source collection.
 */
export function publishableSourceHref(
  entry: AnnouncementEntry | ArticleEntry,
): string {
  return entry.collection === "articles"
    ? articleUrl(entry.id)
    : announcementUrl(entry.id);
}

function publishableDisplayFacts(
  display: PublishableDisplayFacts,
): PublishableDisplayFacts {
  return display;
}

function publishableLegacyPaths(
  legacyPermalink: string | undefined,
): readonly string[] {
  return legacyPermalink === undefined || legacyPermalink.trim() === ""
    ? []
    : [legacyPermalink];
}

function publishableMetadataFacts(
  metadata: PublishableMetadataFacts,
): PublishableMetadataFacts {
  return metadata;
}

function publishableSourceFormat(
  filePath: string | undefined,
): PublishableSourceFormat {
  if (filePath?.endsWith(".mdx") === true) {
    return "mdx";
  }

  if (filePath?.endsWith(".md") === true) {
    return "markdown";
  }

  return "unknown";
}
