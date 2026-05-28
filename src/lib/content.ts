import siteSocialFallbackImage from "@site/assets/site/tpm_home_hero_dark.png";
import type { ImageMetadata } from "astro";
import { getCollection, getEntry } from "astro:content";

import {
  activeEditorialCollections,
  type EditorialCollectionEntry,
} from "./collections";
import { imageMetadataOrUndefined } from "./content-images";
import {
  type AnnouncementEntry,
  type ArticleEntry,
  assertUniqueAnnouncementSlugs,
  assertUniqueArticleSlugs,
  type CategoryEntry,
  categorySlug,
  type CategorySummary,
  isPublishedAnnouncement,
  isPublishedArticle,
  normalizeSlug,
  type PageEntry,
  sortAnnouncementsNewestFirst,
  sortNewestFirst,
} from "./routes";
import {
  normalizeTag,
  tagSummariesFromArticles,
  type TagSummary,
} from "./tags";

/**
 * Loads all published articles in newest-first order.
 *
 * @returns Published article entries sorted for public listing surfaces.
 */
export async function getArticles(): Promise<ArticleEntry[]> {
  const entries = await getArticleEntries();
  assertUniqueArticleSlugs(entries);
  return sortNewestFirst(entries.filter(isPublishedArticle));
}

/**
 * Loads all published announcements in newest-first order.
 *
 * @returns Published announcement entries sorted for public announcement surfaces.
 */
export async function getAnnouncements(): Promise<AnnouncementEntry[]> {
  const entries = await getAnnouncementEntries();
  assertUniqueAnnouncementSlugs(entries);
  return sortAnnouncementsNewestFirst(entries.filter(isPublishedAnnouncement));
}

/**
 * Loads the configured home page content entry.
 *
 * @returns The home page entry when present.
 */
async function getHomePage(): Promise<PageEntry | undefined> {
  return getEntry("pages", "index");
}

/**
 * Loads the active site instance's default social preview image.
 *
 * @returns The homepage hero dark image used as the site-level social fallback.
 */
export async function getSiteSocialFallbackImage(): Promise<ImageMetadata> {
  const home = await getHomePage();
  const fallbackImage =
    home?.data.hero?.darkImage ?? home?.data.hero?.lightImage;
  const resolvedFallback = imageMetadataOrUndefined(fallbackImage);

  if (fallbackImage === undefined) {
    throw new Error("Missing homepage hero image for site social previews.");
  }

  // Astro's container renderer can expose content collection images as
  // unresolved strings. Keep the production path config-driven, but preserve a
  // renderable site fallback for component tests and other non-build adapters.
  return resolvedFallback ?? siteSocialFallbackImage;
}

/**
 * Loads category summaries with their published articles.
 *
 * @returns Category summaries sorted by category metadata order and title.
 */
export async function getCategories(): Promise<CategorySummary[]> {
  const articles = await getArticles();
  const categoryEntries = await getCollection("categories");
  const metadata = new Map(
    categoryEntries.map((entry) => [entry.id, entry] as const),
  );
  const slugs = new Set<string>([
    ...articles.map(categorySlug).filter((slug) => slug !== ""),
    ...categoryEntries.map((entry) => entry.id),
  ]);

  return Array.from(slugs, (slug) =>
    categoryFromMetadata(
      slug,
      metadata.get(slug),
      articles.filter((article) => categorySlug(article) === slug),
    ),
  ).sort((a, b) => {
    const orderSort = a.order - b.order;
    return orderSort !== 0 ? orderSort : a.title.localeCompare(b.title);
  });
}

/**
 * Looks up one category summary by URL slug.
 *
 * @param slug Raw category slug from a route parameter or caller.
 * @returns Matching category summary when it exists.
 */
export async function getCategory(
  slug: string,
): Promise<CategorySummary | undefined> {
  const normalizedSlug = normalizeSlug(slug);
  const categories = await getCategories();
  return categories.find((category) => category.slug === normalizedSlug);
}

/**
 * Loads tag summaries with their published articles.
 *
 * @returns Tag summaries sorted by canonical tag label.
 */
export async function getTags(): Promise<TagSummary[]> {
  return tagSummariesFromArticles(await getArticles());
}

/**
 * Loads active editor-owned collections.
 *
 * @returns Non-draft editorial collections sorted by ID.
 */
export async function getEditorialCollections(): Promise<
  EditorialCollectionEntry[]
> {
  return activeEditorialCollections(await getCollection("collections"));
}

/**
 * Looks up one tag summary by encoded route segment.
 *
 * @param pathSegment Encoded tag route parameter.
 * @returns Matching tag summary when it exists.
 */
export async function getTag(
  pathSegment: string,
): Promise<TagSummary | undefined> {
  const label = normalizeTag(decodeURIComponent(pathSegment));
  const tags = await getTags();
  return tags.find((tag) => tag.label === label);
}

function categoryFromMetadata(
  slug: string,
  entry: CategoryEntry | undefined,
  articles: ArticleEntry[],
): CategorySummary {
  return {
    articles: sortNewestFirst(articles),
    description: entry?.data.description,
    order: entry?.data.order ?? Number.MAX_SAFE_INTEGER,
    slug,
    title: entry?.data.title ?? labelFromSlug(slug),
  };
}

async function getArticleEntries(): Promise<ArticleEntry[]> {
  return getCollection("articles");
}

async function getAnnouncementEntries(): Promise<AnnouncementEntry[]> {
  return getCollection("announcements");
}

function labelFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
