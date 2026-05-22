import { describe, expect, test } from "bun:test";

import { defaultPublishableVisibility } from "../../src/lib/publishable";
import {
  type AnnouncementEntry,
  announcementsIndexUrl,
  announcementUrl,
  type ArticleEntry,
  articlesArchiveUrl,
  articlesIndexUrl,
  articleSlug,
  articleUrl,
  assertUniqueAnnouncementSlugs,
  assertUniqueArticleSlugs,
  authorsIndexUrl,
  authorUrl,
  bibliographyUrl,
  categoriesIndexUrl,
  categorySlug,
  categoryUrl,
  collectionsIndexUrl,
  collectionUrl,
  decodeHtmlEntities,
  feedUrl,
  formatDate,
  imageUrl,
  isPublishedAnnouncement,
  isPublishedArticle,
  normalizeSlug,
  pageUrl,
  searchUrl,
  tagsIndexUrl,
  tagUrl,
} from "../../src/lib/routes";
import { announcementEntry } from "../helpers/content";

function entry(
  id: string,
  data: Record<string, unknown> = {},
  filePath = "",
): ArticleEntry {
  const articleData = {
    author: "Author",
    date: new Date("2022-04-06T00:00:00Z"),
    description: "Description",
    draft: false,
    tags: [],
    title: "Title",
    visibility: defaultPublishableVisibility,
    ...data,
  } satisfies ArticleEntry["data"];

  return {
    collection: "articles",
    id,
    data: articleData,
    filePath:
      filePath === ""
        ? `/repo/site/content/articles/history/${id}.md`
        : filePath,
  };
}

describe("route helpers", () => {
  test("normalizes labels into URL slugs", () => {
    expect(normalizeSlug("Game Studies")).toBe("game-studies");
    expect(normalizeSlug("Memes & Humor")).toBe("memes-and-humor");
  });

  test("keeps canonical routes trailing-slashed", () => {
    expect(announcementsIndexUrl()).toBe("/announcements/");
    expect(announcementUrl("support-us")).toBe("/announcements/support-us/");
    expect(articlesIndexUrl()).toBe("/articles/");
    expect(articlesArchiveUrl()).toBe("/articles/all/");
    expect(articleUrl("gamergate-as-metagaming")).toBe(
      "/articles/gamergate-as-metagaming/",
    );
    expect(authorsIndexUrl()).toBe("/authors/");
    expect(authorUrl("seong-young-her")).toBe("/authors/seong-young-her/");
    expect(bibliographyUrl()).toBe("/bibliography/");
    expect(categoriesIndexUrl()).toBe("/categories/");
    expect(categoryUrl("memeculture")).toBe("/categories/memeculture/");
    expect(collectionsIndexUrl()).toBe("/collections/");
    expect(collectionUrl("featured")).toBe("/collections/featured/");
    expect(pageUrl("About")).toBe("/about/");
    expect(searchUrl()).toBe("/search/");
    expect(tagsIndexUrl()).toBe("/tags/");
    expect(tagUrl("twitch plays pokémon")).toBe(
      "/tags/twitch%20plays%20pok%C3%A9mon/",
    );
    expect(feedUrl()).toBe("/feed.xml");
  });

  test("uses collection ids directly as article slugs", () => {
    expect(
      articleSlug(
        entry("filename-slug", {
          legacyPermalink: "/2022/04/06/legacy-permalink-slug/",
        }),
      ),
    ).toBe("filename-slug");
  });

  test("filters draft entries", () => {
    const published = entry("published");
    const draft = entry("draft", { draft: true });

    expect(isPublishedArticle(published)).toBe(true);
    expect(isPublishedArticle(draft)).toBe(false);
  });

  test("detects duplicate article slugs", () => {
    expect(() => {
      assertUniqueArticleSlugs([entry("same"), entry("same")]);
    }).toThrow('Duplicate article slug "same"');
  });

  test("detects duplicate announcement slugs", () => {
    expect(() => {
      assertUniqueAnnouncementSlugs([
        announcementEntry({ id: "same" }),
        announcementEntry({ id: "same" }),
      ]);
    }).toThrow('Duplicate announcement slug "same"');
  });

  test("detects article slugs reserved for static routes", () => {
    expect(() => {
      assertUniqueArticleSlugs([entry("all")]);
    }).toThrow('Article slug "all" is reserved for a site route.');
  });

  test("derives categories from source folders", () => {
    const politics = entry(
      "the-post-pepe-manifesto",
      {},
      "/repo/site/content/articles/politics/the-post-pepe-manifesto.md",
    );

    expect(categorySlug(politics)).toBe("politics");
  });

  test("keeps entries without usable source paths uncategorized", () => {
    const noPath = entry("no-file");
    noPath.filePath = "";

    expect(categorySlug(noPath)).toBe("");
    expect(
      categorySlug(
        entry("outside-root", {}, "/tmp/imported/articles/outside-root.md"),
      ),
    ).toBe("");
  });

  test("reads publication fields with defensive fallbacks", () => {
    const image = {
      format: "png",
      height: 400,
      src: "/image.png",
      width: 600,
    };

    expect(imageUrl(entry("with-image", { image }))).toBe("/image.png");
    expect(imageUrl(entry("without-image"))).toBeUndefined();
    expect(formatDate(undefined)).toBe("");
    expect(formatDate(new Date("invalid"))).toBe("");
    expect(isPublishedAnnouncement(announcement("published"))).toBe(true);
    expect(
      isPublishedAnnouncement(announcement("draft", { draft: true })),
    ).toBe(false);
  });

  test("decodes known HTML entities in titles", () => {
    expect(
      decodeHtmlEntities(
        "Memes and Humor&#58; &#x26; &quot;What is a Meme?&quot;",
      ),
    ).toBe('Memes and Humor: & "What is a Meme?"');
  });
});

function announcement(
  id: string,
  data: Partial<AnnouncementEntry["data"]> = {},
): AnnouncementEntry {
  return announcementEntry({ data, id });
}
