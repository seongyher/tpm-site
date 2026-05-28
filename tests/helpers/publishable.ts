import type { ImageMetadata } from "astro";

import type { ArticleArchiveItem } from "../../src/lib/archive";
import {
  defaultPublishableVisibility,
  type PublishableEntry,
  publishableFromAnnouncement,
  publishableFromArticleArchive,
  type PublishableImage,
  type PublishableVisibility,
} from "../../src/lib/publishable";
import type { AnnouncementEntry, ArticleEntry } from "../../src/lib/routes";
import { announcementEntry, articleEntry } from "./content";

/** Shared image metadata for publishable fixtures that need representative art. */
export const publishableImageMetadata = {
  format: "jpg",
  height: 600,
  src: "/preview.jpg",
  width: 800,
} as const satisfies ImageMetadata;

/** Shared publishable image fixture with non-empty alt text. */
export const publishableImage = {
  alt: "Preview image",
  src: publishableImageMetadata,
} as const satisfies PublishableImage;

/** Options for building article archive publishable fixtures. */
export interface PublishableArticleArchiveFixtureOptions {
  category?: ArticleArchiveItem["category"];
  data?: Partial<ArticleEntry["data"]>;
  filePath?: string;
  id?: string;
  image?: ArticleArchiveItem["image"];
  title?: string;
}

/** Options for building announcement publishable fixtures. */
export interface PublishableAnnouncementFixtureOptions {
  data?: Partial<AnnouncementEntry["data"]>;
  id?: string;
}

/**
 * Builds a complete publishable visibility fixture from the shared defaults.
 *
 * @param overrides Surface overrides to apply.
 * @returns Complete visibility fixture.
 */
export function publishableVisibilityFixture(
  overrides: Partial<PublishableVisibility> = {},
): PublishableVisibility {
  return {
    ...defaultPublishableVisibility,
    ...overrides,
  };
}

/**
 * Builds visibility for a page that should exist only in curated collections.
 *
 * @returns Visibility fixture with only collections enabled.
 */
export function collectionOnlyVisibilityFixture(): PublishableVisibility {
  return publishableVisibilityFixture({
    directory: false,
    external: false,
    feed: false,
    homepage: false,
    pdf: false,
    related: false,
    search: false,
    sitemap: false,
  });
}

/**
 * Builds an article archive item fixture ready for publishable conversion.
 *
 * @param options Article archive fixture overrides.
 * @param options.category Optional category fixture override.
 * @param options.data Article frontmatter overrides.
 * @param options.filePath Article source file path override.
 * @param options.id Entry ID override.
 * @param options.image Representative image override.
 * @param options.title Display title override.
 * @returns Article archive item fixture.
 */
export function articleArchiveItemFixture({
  category = {
    title: "Metamemetics",
    url: "/categories/metamemetics/",
  },
  data = {},
  filePath,
  id = "what-is-a-meme",
  image,
  title = "What Is A Meme?",
}: PublishableArticleArchiveFixtureOptions = {}): ArticleArchiveItem {
  const articleOptions =
    filePath === undefined ? { data, id } : { data, filePath, id };

  return {
    article: articleEntry(articleOptions),
    author: "Author",
    authors: [],
    category,
    date: "November 30, 2021",
    description: "Article description.",
    image,
    title,
    url: `/articles/${id}/`,
  };
}

/**
 * Builds a normalized article publishable fixture.
 *
 * @param options Article archive fixture overrides.
 * @returns Article publishable fixture.
 */
export function articlePublishableFixture(
  options: PublishableArticleArchiveFixtureOptions = {},
): PublishableEntry {
  return publishableFromArticleArchive(articleArchiveItemFixture(options));
}

/**
 * Builds a normalized announcement publishable fixture.
 *
 * @param options Announcement fixture overrides.
 * @returns Announcement publishable fixture.
 */
export function announcementPublishableFixture(
  options: PublishableAnnouncementFixtureOptions = {},
): PublishableEntry {
  const { data = {}, id = "sample-announcement" } = options;

  return publishableFromAnnouncement(
    announcementEntry({
      data,
      id,
    }),
  );
}
