import type { ImageMetadata } from "astro";

import type { ArticleArchiveItem } from "./archive";
import type { AuthorSummary } from "./authors";
import {
  type AnnouncementEntry,
  announcementUrl,
  type ArticleEntry,
  articleUrl,
  formatDate,
} from "./routes";
import { siteConfig } from "./site-config";

/** Runtime kind derived from the source content collection. */
export type PublishableKind = "announcement" | "article";

/** Public surfaces a publishable entry may opt out of. */
export type PublishableVisibilitySurface =
  "directory" | "feed" | "homepage" | "search";

/** Normalized publishable visibility with permissive defaults. */
export type PublishableVisibility = Record<
  PublishableVisibilitySurface,
  boolean
>;

/** Image metadata consumed by publishable cards, lists, and feature slots. */
interface PublishableImage {
  alt: string;
  src: ImageMetadata;
}

/** Article or announcement normalized for source-agnostic helpers. */
export interface PublishableEntry {
  author: string;
  authors?: readonly AuthorSummary[] | undefined;
  category?:
    | undefined
    | {
        href: string;
        title: string;
      };
  date: string;
  description: string;
  href: string;
  image?: PublishableImage | undefined;
  kind: PublishableKind;
  slug: string;
  title: string;
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
  directory: true,
  feed: true,
  homepage: true,
  search: true,
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
  return {
    author: item.author,
    authors: item.authors,
    category:
      item.category === undefined
        ? undefined
        : {
            href: item.category.url,
            title: item.category.title,
          },
    date: item.date,
    description: item.description,
    href: item.url,
    image: item.image,
    kind: "article",
    slug: item.article.id,
    title: item.title,
    visibility: normalizePublishableVisibility(
      item.article.data.visibility,
      siteConfig.contentDefaults.articles.visibility,
    ),
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
  return {
    author: announcement.data.author,
    date: formatDate(announcement.data.date),
    description: announcement.data.description,
    href: announcementUrl(announcement.id),
    image:
      announcement.data.image === undefined
        ? undefined
        : {
            alt: announcement.data.imageAlt ?? announcement.data.title,
            src: announcement.data.image,
          },
    kind: "announcement",
    slug: announcement.id,
    title: announcement.data.title,
    visibility: normalizePublishableVisibility(
      announcement.data.visibility,
      siteConfig.contentDefaults.announcements.visibility,
    ),
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
    author: entry.author,
    authors: entry.authors,
    category: entry.category,
    date: entry.date,
    description: entry.description,
    href: entry.href,
    image: entry.image,
    kind: entry.kind,
    title: entry.title,
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
    case "directory":
      return entry.visibility.directory;
    case "feed":
      return entry.visibility.feed;
    case "homepage":
      return entry.visibility.homepage;
    case "search":
      return entry.visibility.search;
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
