import { describe, expect, mock, test } from "bun:test";

import { defaultPublishableVisibility } from "../../src/lib/content/publishable";

await mock.module("astro:content", () => ({
  getCollection: async (collection: string) => {
    await Promise.resolve();

    if (collection === "articles") {
      return [
        {
          collection: "articles",
          data: {
            author: "Author",
            date: new Date("2022-01-02T00:00:00Z"),
            description: "Newer",
            draft: false,
            tags: [],
            title: "Newer Article",
          },
          filePath: "/repo/site/content/articles/history/newer.md",
          id: "newer",
        },
        {
          collection: "articles",
          data: {
            author: "Author",
            date: new Date("2021-01-02T00:00:00Z"),
            description: "Draft",
            draft: true,
            tags: [],
            title: "Draft Article",
          },
          filePath: "/repo/site/content/articles/history/draft.md",
          id: "draft",
        },
        {
          collection: "articles",
          data: {
            author: "Author",
            date: new Date("2020-01-02T00:00:00Z"),
            description: "Older",
            draft: false,
            tags: [],
            title: "Older Article",
          },
          filePath: "/repo/site/content/articles/politics/older.md",
          id: "older",
        },
      ];
    }

    if (collection === "announcements") {
      return [
        {
          collection: "announcements",
          data: {
            author: "The Philosopher's Meme",
            date: new Date("2023-01-02T00:00:00Z"),
            description: "Announcement",
            draft: false,
            tags: [],
            title: "Feed Announcement",
          },
          filePath: "/repo/site/content/announcements/feed-announcement.md",
          id: "feed-announcement",
        },
        {
          collection: "announcements",
          data: {
            author: "The Philosopher's Meme",
            date: new Date("2024-01-02T00:00:00Z"),
            description: "Hidden announcement",
            draft: false,
            tags: [],
            title: "Hidden Feed Announcement",
            visibility: {
              ...defaultPublishableVisibility,
              directory: true,
              feed: false,
              homepage: true,
              search: true,
            },
          },
          filePath: "/repo/site/content/announcements/hidden.md",
          id: "hidden",
        },
      ];
    }

    if (collection === "authors") {
      return [
        {
          body: "",
          collection: "authors",
          data: {
            aliases: ["Author"],
            displayName: "Author",
            socials: [],
            type: "person",
          },
          id: "author",
        },
      ];
    }

    return [];
  },
  getEntry: async () => {
    await Promise.resolve();

    return undefined;
  },
}));

const { GET } = await import("../../src/pages/feed.xml");

describe("RSS feed endpoint", () => {
  test("renders feed-visible published articles and announcements into RSS XML", async () => {
    const response = await GET({ site: new URL("https://example.com") });
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain("<rss");
    expect(text).toContain("Newer Article");
    expect(text).not.toContain("Draft Article");
    expect(text).toContain("https://example.com/articles/newer/");
    expect(text).toContain("Feed Announcement");
    expect(text).not.toContain("Hidden Feed Announcement");
    expect(text).toContain(
      "https://example.com/announcements/feed-announcement/",
    );
    expect(text).toContain('xmlns:dc="http://purl.org/dc/elements/1.1/"');
    expect(text).toContain("<dc:creator>Author</dc:creator>");
    expect(text).toContain(
      "<dc:creator>The Philosopher&apos;s Meme</dc:creator>",
    );
    expect(text).not.toContain("<author>");
    expect(text).not.toContain("<enclosure");
  });
});
