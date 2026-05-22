import { describe, expect, test } from "bun:test";

import {
  announcementFeedEntries,
  articleFeedEntries,
  publishableFeedEntries,
} from "../../../../src/lib/content/feed";
import { defaultPublishableVisibility } from "../../../../src/lib/content/publishable";
import {
  announcementEntry,
  articleEntry,
  authorEntry,
} from "../../../helpers/content";

describe("feed helpers", () => {
  test("builds feed-visible articles and announcements newest first", () => {
    const olderArticle = articleEntry({
      data: {
        author: "Known Author",
        description: "Older article description",
        title: "Older Article",
      },
      date: new Date("2020-01-01T00:00:00.000Z"),
      id: "older-article",
    });
    const newerAnnouncement = announcementEntry({
      data: {
        description: "Newer announcement description",
        title: "Newer Announcement",
      },
      date: new Date("2024-01-01T00:00:00.000Z"),
      id: "newer-announcement",
    });
    const hiddenAnnouncement = announcementEntry({
      data: {
        title: "Hidden Announcement",
        visibility: {
          ...defaultPublishableVisibility,
          feed: false,
        },
      },
      date: new Date("2025-01-01T00:00:00.000Z"),
      id: "hidden-announcement",
    });

    const entries = publishableFeedEntries({
      announcements: [newerAnnouncement, hiddenAnnouncement],
      articles: [olderArticle],
      authors: [
        authorEntry({
          aliases: ["Known Author"],
          displayName: "Known Author",
        }),
      ],
    });

    expect(entries.map((entry) => entry.title)).toEqual([
      "Newer Announcement",
      "Older Article",
    ]);
    expect(entries[0]).toMatchObject({
      author: "The Philosopher's Meme",
      description: "Newer announcement description",
      href: "/announcements/newer-announcement/",
      kind: "announcement",
    });
    expect(entries[1]).toMatchObject({
      author: "Known Author",
      description: "Older article description",
      href: "/articles/older-article/",
      kind: "article",
    });
  });

  test("honors feed visibility for each source type", () => {
    const hiddenArticle = articleEntry({
      data: {
        visibility: {
          ...defaultPublishableVisibility,
          feed: false,
        },
      },
      id: "hidden-article",
    });
    const visibleAnnouncement = announcementEntry({
      id: "visible-announcement",
    });

    expect(articleFeedEntries([hiddenArticle], [])).toEqual([]);
    expect(announcementFeedEntries([visibleAnnouncement])).toHaveLength(1);
  });
});
