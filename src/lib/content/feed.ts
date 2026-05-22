import type {
  AnnouncementEntry,
  ArticleEntry,
  AuthorEntry,
} from "../routes/routes";
import { articleArchiveItems } from "./archive";
import {
  type PublishableEntry,
  publishableFromAnnouncement,
  publishableFromArticleArchive,
  visiblePublishables,
} from "./publishable";

/** Feed item source normalized from any publishable content collection. */
export interface PublishableFeedEntry {
  author: string;
  description: string;
  href: string;
  kind: "announcement" | "article";
  pubDate: Date;
  title: string;
}

interface PublishableFeedEntriesInput {
  announcements: readonly AnnouncementEntry[];
  articles: readonly ArticleEntry[];
  authors: readonly AuthorEntry[];
}

/**
 * Builds newest-first RSS source entries from publishable content.
 *
 * @param input Articles, announcements, and author metadata.
 * @returns Feed entries visible on the feed surface.
 */
export function publishableFeedEntries(
  input: PublishableFeedEntriesInput,
): PublishableFeedEntry[] {
  const articles = articleArchiveItems(input.articles, [], input.authors).map(
    publishableFromArticleArchive,
  );
  const announcements = input.announcements.map(publishableFromAnnouncement);

  return publishableFeedEntriesFromPublishables([
    ...articles,
    ...announcements,
  ]);
}

/**
 * Builds newest-first RSS source entries from normalized publishables.
 *
 * @param entries Publishable entries from any source collection.
 * @returns Feed entries visible on the feed surface.
 */
function publishableFeedEntriesFromPublishables(
  entries: readonly PublishableEntry[],
): PublishableFeedEntry[] {
  return visiblePublishables(entries, "feed")
    .map(publishableFeedEntry)
    .sort(sortFeedEntriesNewestFirst);
}

/**
 * Converts one normalized publishable entry into RSS source facts.
 *
 * @param entry Feed-visible publishable entry.
 * @returns Feed item source data.
 */
function publishableFeedEntry(entry: PublishableEntry): PublishableFeedEntry {
  return {
    author: entry.display.author,
    description: entry.display.description,
    href: entry.route.href,
    kind: entry.kind,
    pubDate: entry.metadata.date,
    title: entry.display.title,
  };
}

/**
 * Builds RSS source entries from articles visible in feeds.
 *
 * @param articles Published article entries.
 * @param authors Author metadata used for display bylines.
 * @returns Feed entries for feed-visible articles.
 */
export function articleFeedEntries(
  articles: readonly ArticleEntry[],
  authors: readonly AuthorEntry[],
): PublishableFeedEntry[] {
  return publishableFeedEntriesFromPublishables(
    articleArchiveItems(articles, [], authors).map(
      publishableFromArticleArchive,
    ),
  );
}

/**
 * Builds RSS source entries from announcements visible in feeds.
 *
 * @param announcements Published announcement entries.
 * @returns Feed entries for feed-visible announcements.
 */
export function announcementFeedEntries(
  announcements: readonly AnnouncementEntry[],
): PublishableFeedEntry[] {
  return publishableFeedEntriesFromPublishables(
    announcements.map(publishableFromAnnouncement),
  );
}

function sortFeedEntriesNewestFirst(
  left: PublishableFeedEntry,
  right: PublishableFeedEntry,
): number {
  const dateSort = right.pubDate.getTime() - left.pubDate.getTime();
  return dateSort !== 0 ? dateSort : left.href.localeCompare(right.href);
}
