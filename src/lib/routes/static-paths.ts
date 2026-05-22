import type { TagSummary } from "../content/tags";
import type {
  AnnouncementEntry,
  ArticleEntry,
  CategorySummary,
  EditorialCollectionEntry,
} from "./routes";

/** Astro static path entry for announcement pages. */
interface AnnouncementStaticPath {
  params: {
    slug: string;
  };
  props: {
    announcement: AnnouncementEntry;
  };
}

/** Astro static path entry for article pages. */
interface ArticleStaticPath {
  params: {
    slug: string;
  };
  props: {
    article: ArticleEntry;
  };
}

/** Astro static path entry for category pages. */
interface CategoryStaticPath {
  params: {
    category: string;
  };
  props: {
    category: CategorySummary;
  };
}

/** Astro static path entry for editorial collection pages. */
interface CollectionStaticPath {
  params: {
    collection: string;
  };
  props: {
    collection: EditorialCollectionEntry;
  };
}

/** Astro static path entry for tag pages. */
interface TagStaticPath {
  params: {
    tag: string;
  };
  props: {
    tag: TagSummary;
  };
}

/**
 * Builds Astro static paths for published announcements.
 *
 * @param announcements Published announcement entries.
 * @returns Static path params and props.
 */
export function announcementStaticPaths(
  announcements: AnnouncementEntry[],
): AnnouncementStaticPath[] {
  return announcements.map((announcement) => ({
    params: { slug: announcement.id },
    props: { announcement },
  }));
}

/**
 * Builds Astro static paths for published articles.
 *
 * @param articles Published article entries.
 * @returns Static path params and props.
 */
export function articleStaticPaths(
  articles: ArticleEntry[],
): ArticleStaticPath[] {
  return articles.map((article) => ({
    params: { slug: article.id },
    props: { article },
  }));
}

/**
 * Builds Astro static paths for public categories.
 *
 * @param categories Category summaries.
 * @returns Static path params and props.
 */
export function categoryStaticPaths(
  categories: CategorySummary[],
): CategoryStaticPath[] {
  return categories.map((category) => ({
    params: { category: category.slug },
    props: { category },
  }));
}

/**
 * Builds Astro static paths for active editor-owned collections.
 *
 * @param collections Active editorial collection entries.
 * @returns Static path params and props.
 */
export function collectionStaticPaths(
  collections: EditorialCollectionEntry[],
): CollectionStaticPath[] {
  return collections.map((collection) => ({
    params: { collection: collection.id },
    props: { collection },
  }));
}

/**
 * Builds Astro static paths for public tag pages.
 *
 * @param tags Tag summaries.
 * @returns Static path params and props.
 */
export function tagStaticPaths(tags: TagSummary[]): TagStaticPath[] {
  return tags.map((tag) => ({
    params: { tag: tag.label },
    props: { tag },
  }));
}
