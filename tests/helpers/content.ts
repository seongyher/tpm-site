import { defaultPublishableVisibility } from "../../src/lib/publishable";
import type {
  AnnouncementEntry,
  ArticleEntry,
  AuthorEntry,
  CategorySummary,
  EditorialCollectionEntry,
} from "../../src/lib/routes";

/** Options for building announcement-entry test fixtures. */
export interface AnnouncementEntryFixtureOptions {
  data?: Partial<AnnouncementEntry["data"]>;
  date?: Date;
  filePath?: string;
  id?: string;
}

/** Options for building article-entry test fixtures. */
export interface ArticleEntryFixtureOptions {
  data?: Partial<ArticleEntry["data"]>;
  date?: Date;
  filePath?: string;
  id?: string;
}

/** Options for building category-summary test fixtures. */
export interface CategorySummaryFixtureOptions {
  articles?: ArticleEntry[];
  description?: string;
  order?: number;
  slug?: string;
  title?: string;
}

/** Options for building editorial-collection test fixtures. */
export interface EditorialCollectionEntryFixtureOptions {
  data?: Partial<EditorialCollectionEntry["data"]>;
  id?: string;
}

/** Options for building author-entry test fixtures. */
export interface AuthorEntryFixtureOptions {
  aliases?: string[];
  displayName?: string;
  id?: string;
  shortBio?: string;
  socials?: Array<{ href: string; label: string }>;
  type?: AuthorEntry["data"]["type"];
  website?: string;
}

/**
 * Builds a minimal Astro content announcement entry for unit tests.
 *
 * @param options Announcement entry overrides.
 * @param options.data Frontmatter overrides.
 * @param options.date Publication date override.
 * @param options.filePath Source file path override.
 * @param options.id Entry ID override.
 * @returns Test announcement entry.
 */
export function announcementEntry({
  data = {},
  date = new Date("2022-01-01T00:00:00.000Z"),
  filePath,
  id = "sample-announcement",
}: AnnouncementEntryFixtureOptions = {}): AnnouncementEntry {
  return {
    collection: "announcements",
    data: {
      author: "The Philosopher's Meme",
      date,
      description: "Announcement description",
      draft: false,
      tags: [],
      title: "Sample Announcement",
      visibility: defaultPublishableVisibility,
      ...data,
    },
    filePath: filePath ?? `/repo/src/content/announcements/${id}.md`,
    id,
  };
}

/**
 * Builds a minimal Astro content article entry for unit tests.
 *
 * @param options Article entry overrides.
 * @param options.data Frontmatter overrides.
 * @param options.date Publication date override.
 * @param options.filePath Source file path override.
 * @param options.id Entry ID override.
 * @returns Test article entry.
 */
export function articleEntry({
  data = {},
  date = new Date("2022-01-01T00:00:00.000Z"),
  filePath,
  id = "sample-article",
}: ArticleEntryFixtureOptions = {}): ArticleEntry {
  return {
    collection: "articles",
    data: {
      author: "Author",
      date,
      description: "Description",
      draft: false,
      tags: [],
      title: "Sample Article",
      visibility: defaultPublishableVisibility,
      ...data,
    },
    filePath: filePath ?? `/repo/src/content/articles/history/${id}.md`,
    id,
  };
}

/**
 * Builds a category summary for route and view-model tests.
 *
 * @param options Category summary overrides.
 * @param options.articles Article entries in the category.
 * @param options.description Category description override.
 * @param options.order Category order override.
 * @param options.slug Category slug override.
 * @param options.title Category title override.
 * @returns Test category summary.
 */
export function categorySummary({
  articles = [],
  description = "Category description",
  order = 1,
  slug = "history",
  title = "History",
}: CategorySummaryFixtureOptions = {}): CategorySummary {
  return {
    articles,
    description,
    order,
    slug,
    title,
  };
}

/**
 * Builds a minimal Astro content editorial collection entry for unit tests.
 *
 * @param options Editorial collection entry overrides.
 * @param options.data Frontmatter overrides.
 * @param options.id Entry ID override.
 * @returns Test editorial collection entry.
 */
export function editorialCollectionEntry({
  data = {},
  id = "sample-collection",
}: EditorialCollectionEntryFixtureOptions = {}): EditorialCollectionEntry {
  return {
    body: "",
    collection: "collections",
    data: {
      description: "Collection description",
      draft: false,
      items: [],
      title: "Sample Collection",
      ...data,
    },
    filePath: `/repo/src/content/collections/${id}.md`,
    id,
  };
}

/**
 * Builds a minimal Astro content author entry for unit tests.
 *
 * @param options Author entry overrides.
 * @param options.aliases Author alias override.
 * @param options.displayName Author display-name override.
 * @param options.id Author entry ID override.
 * @param options.shortBio Optional short-bio override.
 * @param options.socials Optional social/profile-link override.
 * @param options.type Author type override.
 * @param options.website Optional website override.
 * @returns Test author entry.
 */
export function authorEntry({
  aliases,
  displayName = "Author",
  id = "author",
  shortBio,
  socials = [],
  type = "person",
  website,
}: AuthorEntryFixtureOptions = {}): AuthorEntry {
  return {
    body: "",
    collection: "authors",
    data: {
      aliases: aliases ?? [displayName],
      displayName,
      shortBio,
      socials,
      type,
      website,
    },
    filePath: `/repo/src/content/authors/${id}.md`,
    id,
  };
}
