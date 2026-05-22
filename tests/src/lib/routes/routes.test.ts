import { describe, expect, test } from "bun:test";

import { defaultPublishableVisibility } from "../../../../src/lib/content/publishable";
import {
  type AnnouncementEntry,
  announcementsIndexUrl,
  announcementUrl,
  type ArticleEntry,
  articlesArchiveUrl,
  articlesIndexUrl,
  articleUrl,
  assertUniqueArticleSlugs,
  authorsIndexUrl,
  authorUrl,
  bibliographyUrl,
  categoriesIndexUrl,
  categorySlug,
  categoryUrl,
  collectionsIndexUrl,
  collectionUrl,
  entryTitle,
  feedUrl,
  formatDate,
  imageUrl,
  pageUrl,
  searchUrl,
  sortAnnouncementsNewestFirst,
  sortNewestFirst,
  tagsIndexUrl,
  tagUrl,
} from "../../../../src/lib/routes/routes";

function announcement(
  id: string,
  date: Date,
  data: Partial<AnnouncementEntry["data"]> = {},
): AnnouncementEntry {
  return {
    collection: "announcements",
    data: {
      author: "The Philosopher's Meme",
      date,
      description: "Description",
      draft: false,
      tags: [],
      title: id,
      visibility: defaultPublishableVisibility,
      ...data,
    },
    filePath: `/repo/site/content/announcements/${id}.md`,
    id,
  };
}

function article(
  id: string,
  date: Date,
  data: Partial<ArticleEntry["data"]> = {},
): ArticleEntry {
  return {
    collection: "articles",
    data: {
      author: "Author",
      date,
      description: "Description",
      draft: false,
      tags: [],
      title: id,
      visibility: defaultPublishableVisibility,
      ...data,
    },
    filePath: `/repo/site/content/articles/history/${id}.md`,
    id,
  };
}

describe("route helpers", () => {
  test("builds stable public URLs with expected trailing slash behavior", () => {
    expect(announcementsIndexUrl()).toBe("/announcements/");
    expect(announcementUrl("site-news")).toBe("/announcements/site-news/");
    expect(articlesIndexUrl()).toBe("/articles/");
    expect(articlesArchiveUrl()).toBe("/articles/all/");
    expect(articleUrl("article-title")).toBe("/articles/article-title/");
    expect(authorsIndexUrl()).toBe("/authors/");
    expect(authorUrl("seong-young-her")).toBe("/authors/seong-young-her/");
    expect(bibliographyUrl()).toBe("/bibliography/");
    expect(categoriesIndexUrl()).toBe("/categories/");
    expect(categoryUrl("history")).toBe("/categories/history/");
    expect(collectionsIndexUrl()).toBe("/collections/");
    expect(collectionUrl("start-here")).toBe("/collections/start-here/");
    expect(pageUrl("About")).toBe("/about/");
    expect(searchUrl()).toBe("/search/");
    expect(tagsIndexUrl()).toBe("/tags/");
    expect(tagUrl("meme history")).toBe("/tags/meme%20history/");
    expect(tagUrl("c++")).toBe("/tags/c%2B%2B/");
    expect(feedUrl()).toBe("/feed.xml");
  });

  test("rejects article slugs reserved for static article routes", () => {
    expect(() =>
      assertUniqueArticleSlugs([article("all", new Date("2022-01-01"))]),
    ).toThrow('Article slug "all" is reserved for a site route.');
  });

  test("sorts newest first with stable slug tiebreakers", () => {
    const sameDate = new Date("2022-01-01T00:00:00Z");

    expect(
      sortNewestFirst([
        article("b", sameDate),
        article("a", sameDate),
        article("new", new Date("2023-01-01T00:00:00Z")),
      ]).map((entry) => entry.id),
    ).toEqual(["new", "a", "b"]);
  });

  test("sorts announcements newest first with stable slug tiebreakers", () => {
    const sameDate = new Date("2022-01-01T00:00:00Z");

    expect(
      sortAnnouncementsNewestFirst([
        announcement("b", sameDate),
        announcement("a", sameDate),
        announcement("new", new Date("2023-01-01T00:00:00Z")),
      ]).map((entry) => entry.id),
    ).toEqual(["new", "a", "b"]);
  });

  test("handles invalid dates and image source variants", () => {
    expect(formatDate(new Date("invalid"))).toBe("");
    expect(
      imageUrl(
        article("image", new Date(), {
          image: { format: "png", height: 1, src: "/x.png", width: 1 },
        }),
      ),
    ).toBe("/x.png");
    expect(
      entryTitle(article("title", new Date(), { title: "A &amp; B" })),
    ).toBe("A & B");
  });

  test("derives empty category for files outside article folders", () => {
    const entry = article("orphan", new Date());
    entry.filePath = "orphan.md";

    expect(categorySlug(entry)).toBe("");
  });
});
