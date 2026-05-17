import type { ImageMetadata } from "astro";
import { describe, expect, test } from "bun:test";

import { articlePageViewModel } from "../../../src/lib/article-page-view-model";
import { type SiteConfig, siteConfig } from "../../../src/lib/site-config";
import type { SocialPreviewImageTransform } from "../../../src/lib/social-images";
import {
  articleEntry,
  authorEntry,
  categorySummary,
} from "../../helpers/content";

const fallbackImage = {
  format: "png",
  height: 630,
  src: "/fallback.png",
  width: 1200,
} as const satisfies ImageMetadata;
const articleImage = {
  format: "png",
  height: 900,
  src: "/article.png",
  width: 900,
} as const satisfies ImageMetadata;

describe("articlePageViewModel", () => {
  test("builds article page data from content, config, and social image policy", async () => {
    let socialTransform: SocialPreviewImageTransform | undefined;
    const author = authorEntry({
      displayName: "Known Author",
      id: "known-author",
      shortBio: "A useful profile summary.",
    });
    const olderArticle = articleEntry({
      data: { title: "Older Article" },
      date: new Date("2022-01-01T00:00:00.000Z"),
      id: "older-article",
    });
    const currentArticle = articleEntry({
      data: {
        author: "Known Author",
        description: "Current article description.",
        image: articleImage,
        semantic: {
          item: {
            name: "Example Book",
            type: "book",
          },
          kind: "review",
        },
        tags: ["memes"],
        title: "Current Article",
      },
      date: new Date("2022-01-02T00:00:00.000Z"),
      id: "current-article",
    });
    const newerArticle = articleEntry({
      data: { title: "Newer Article" },
      date: new Date("2022-01-03T00:00:00.000Z"),
      id: "newer-article",
    });
    const category = categorySummary({
      articles: [newerArticle, currentArticle, olderArticle],
      slug: "history",
      title: "History",
    });
    const page = await articlePageViewModel({
      article: currentArticle,
      content: {
        allArticles: [newerArticle, currentArticle, olderArticle],
        authorEntries: [author],
        categories: [category],
        fallbackSocialPreviewImage: fallbackImage,
      },
      optimizeImage: async (transform) => {
        socialTransform = transform;
        return Promise.resolve({ src: "/_astro/current-article.hash.jpg" });
      },
      origin: "https://preview.example",
      site: "https://example.com",
      tableOfContentsHeadings: [
        {
          depth: 2,
          href: "#first",
          id: "first",
          level: 1,
          order: 0,
          text: "First",
        },
        {
          depth: 2,
          href: "#second",
          id: "second",
          level: 1,
          order: 1,
          text: "Second",
        },
      ],
    });

    expect(page.article.title).toBe("Current Article");
    expect(page.documentTitle).toBe("Current Article | The Philosopher's Meme");
    expect(page.canonicalUrl).toBe(
      "https://example.com/articles/current-article/",
    );
    expect(page.categoryHref).toBe("/categories/history/");
    expect(page.authors.map((entry) => entry.displayName)).toEqual([
      "Known Author",
    ]);
    expect(page.authorProfilesWithBio.map((entry) => entry.id)).toEqual([
      "known-author",
    ]);
    expect(page.continuity?.label).toBe("Next Article");
    expect(page.continuity?.item.title).toBe("Newer Article");
    expect(page.moreInCategory.map((item) => item.title)).toEqual([
      "Newer Article",
      "Older Article",
    ]);
    expect(page.readingNavigationLinks.map((link) => link.label)).toContain(
      "Archive",
    );
    expect(page.bibliographyAction).toEqual({
      href: "/bibliography/",
      label: "View Site Bibliography",
    });
    expect(page.searchable).toBe(true);
    expect(page.semanticDetails).toMatchObject({
      heading: "Review details",
      items: [
        { label: "Reviewed", value: "Example Book" },
        { label: "Type", value: "Book" },
      ],
    });
    expect(page.tagsVisible).toBe(true);
    expect(page.profileLinksEnabled).toBe(true);
    expect(page.support.enabled).toBe(true);
    expect(page.showTableOfContents).toBe(true);
    expect(page.socialPreviewImage).toMatchObject({
      height: 630,
      src: "/_astro/current-article.hash.jpg",
      type: "image/jpeg",
      width: 1200,
    });
    expect(socialTransform?.src).toBe(articleImage);
    expect(page.citation.formats.length).toBeGreaterThan(0);
    expect(page.share.actions.map((action) => action.id)).toContain("x");
    expect(page.pdf?.pdfHref).toBe(
      "/articles/current-article/current-article.pdf",
    );
  });

  test("honors disabled feature policy from the injected config", async () => {
    const config = {
      ...siteConfig,
      features: {
        ...siteConfig.features,
        authors: false,
        bibliography: false,
        categories: false,
        pdf: false,
        search: false,
        support: false,
        tags: false,
      },
    } satisfies SiteConfig;
    const article = articleEntry({
      data: {
        image: articleImage,
        tags: ["hidden"],
        title: "Feature Flag Article",
      },
      id: "feature-flag-article",
    });
    const page = await articlePageViewModel({
      article,
      config,
      content: {
        allArticles: [article],
        authorEntries: [],
        categories: [categorySummary({ articles: [article] })],
        fallbackSocialPreviewImage: fallbackImage,
      },
      optimizeImage: async () =>
        Promise.resolve({ src: "/_astro/feature.hash.jpg" }),
      origin: "https://preview.example",
      site: "https://example.com",
    });

    expect(page.category).toBeDefined();
    expect(page.categoryHref).toBeUndefined();
    expect(page.bibliographyAction).toBeUndefined();
    expect(page.pdf).toBeUndefined();
    expect(page.profileLinksEnabled).toBe(false);
    expect(page.searchable).toBe(false);
    expect(page.support.enabled).toBe(false);
    expect(page.tagsVisible).toBe(false);
  });
});
