import { describe, expect, mock, test } from "bun:test";

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
            tags: ["meme history", "memes"],
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
            tags: ["meme history"],
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
            tags: ["meme history", "games"],
            title: "Older Article",
          },
          filePath: "/repo/site/content/articles/politics/older.md",
          id: "older",
        },
        {
          collection: "articles",
          data: {
            author: "Author",
            date: new Date("2019-01-02T00:00:00Z"),
            description: "Unlisted category",
            draft: false,
            tags: [],
            title: "Unlisted Category Article",
          },
          filePath: "/repo/site/content/articles/game-studies/unlisted.md",
          id: "unlisted",
        },
      ];
    }

    if (collection === "announcements") {
      return [
        {
          collection: "announcements",
          data: {
            author: "The Philosopher's Meme",
            date: new Date("2026-05-05T00:00:00Z"),
            description: "Newest announcement",
            draft: false,
            tags: [],
            title: "Newest Announcement",
          },
          filePath: "/repo/site/content/announcements/newest.md",
          id: "newest",
        },
        {
          collection: "announcements",
          data: {
            author: "The Philosopher's Meme",
            date: new Date("2026-05-04T00:00:00Z"),
            description: "Draft announcement",
            draft: true,
            tags: [],
            title: "Draft Announcement",
          },
          filePath: "/repo/site/content/announcements/draft.md",
          id: "draft",
        },
        {
          collection: "announcements",
          data: {
            author: "The Philosopher's Meme",
            date: new Date("2026-05-03T00:00:00Z"),
            description: "Older announcement",
            draft: false,
            tags: [],
            title: "Older Announcement",
          },
          filePath: "/repo/site/content/announcements/older.md",
          id: "older",
        },
      ];
    }

    if (collection === "categories") {
      return [
        {
          collection: "categories",
          data: {
            description: "History articles",
            order: 1,
            title: "History",
          },
          id: "history",
        },
        {
          collection: "categories",
          data: {
            order: 2,
            title: "Politics",
          },
          id: "politics",
        },
      ];
    }

    return [];
  },
  getEntry: async (collection: string, id: string) => {
    await Promise.resolve();

    if (collection === "pages" && id === "index") {
      return {
        collection: "pages",
        data: {
          description: "Home page",
          hero: {
            darkImage: {
              format: "png",
              height: 630,
              src: "/home-dark.png",
              width: 1200,
            },
            lightImage: {
              format: "png",
              height: 630,
              src: "/home.png",
              width: 1200,
            },
          },
          title: "Home",
        },
        id: "index",
      };
    }

    return undefined;
  },
}));

const {
  getAnnouncements,
  getCategories,
  getCategory,
  getSiteSocialFallbackImage,
  getTag,
  getTags,
} = await import("../../../src/lib/content");

describe("content helpers", () => {
  test("loads published announcements newest first", async () => {
    const announcements = await getAnnouncements();

    expect(announcements.map((announcement) => announcement.id)).toEqual([
      "newest",
      "older",
    ]);
  });

  test("loads the active homepage dark hero as the site social fallback", async () => {
    const fallback = await getSiteSocialFallbackImage();

    expect(fallback).toMatchObject({
      src: "/home-dark.png",
    });
  });

  test("builds category summaries from metadata and article folders", async () => {
    const categories = await getCategories();

    expect(categories.map((category) => category.slug)).toEqual([
      "history",
      "politics",
      "game-studies",
    ]);
    expect(categories[0]?.articles.map((article) => article.id)).toEqual([
      "newer",
    ]);
    expect(categories[2]).toMatchObject({ title: "Game Studies" });
  });

  test("normalizes category lookup before searching summaries", async () => {
    const category = await getCategory("History");

    expect(category).toMatchObject({ slug: "history" });
  });

  test("builds tag summaries from published article frontmatter", async () => {
    const tags = await getTags();

    expect(tags.map((tag) => tag.label)).toEqual([
      "games",
      "meme history",
      "memes",
    ]);
    expect(tags[1]?.articles.map((article) => article.id)).toEqual([
      "newer",
      "older",
    ]);
    expect(await getTag("meme%20history")).toMatchObject({
      href: "/tags/meme%20history/",
      label: "meme history",
    });
    expect(await getTag("meme history")).toMatchObject({
      href: "/tags/meme%20history/",
      label: "meme history",
    });
  });
});
