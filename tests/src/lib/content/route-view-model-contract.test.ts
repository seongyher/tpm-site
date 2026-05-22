import { describe, expect, test } from "bun:test";

import { authorProfiles } from "../../../../src/lib/content/authors";
import {
  bibliographyRouteViewModel,
  markdownPageRouteViewModel,
} from "../../../../src/lib/content/content-route-view-models";
import { homePageRouteViewModel } from "../../../../src/lib/content/home";
import {
  announcementsIndexRouteViewModel,
  articlesArchiveRouteViewModel,
  articlesIndexRouteViewModel,
  authorsIndexRouteViewModel,
  categoriesIndexRouteViewModel,
  categoryDetailRouteViewModel,
  collectionDetailRouteViewModel,
  collectionsIndexRouteViewModel,
  searchRouteViewModel,
  tagDetailRouteViewModel,
  tagsIndexRouteViewModel,
} from "../../../../src/lib/content/listing-route-view-models";
import { siteConfig } from "../../../../src/lib/site/site-config";
import {
  announcementEntry,
  articleEntry,
  authorEntry,
  categorySummary,
  editorialCollectionEntry,
} from "../../../helpers/content";
import { publishableImageMetadata } from "../../../helpers/publishable";

describe("route view-model contract", () => {
  test("keeps migrated route document facts explicit and stable", () => {
    const article = articleEntry({ id: "sample-article" });
    const announcement = announcementEntry({ id: "sample-announcement" });
    const author = authorEntry({ displayName: "Author", id: "author" });
    const [profile] = authorProfiles([author], [article]);
    const category = categorySummary({ articles: [article] });
    const tag = {
      articles: [article],
      href: "/tags/example/",
      label: "example",
      pathSegment: "example",
    };
    const featured = editorialCollectionEntry({
      data: { items: ["sample-article"] },
      id: "featured",
    });
    const startHere = editorialCollectionEntry({
      data: { items: ["sample-article"] },
      id: "start-here",
    });

    if (profile === undefined) {
      throw new Error("Expected author profile fixture.");
    }

    const documents = [
      articlesIndexRouteViewModel({
        articles: [article],
        authors: [author],
        categories: [category],
      }).document,
      articlesArchiveRouteViewModel({
        articles: [article],
        authors: [author],
        categories: [category],
      }).document,
      categoriesIndexRouteViewModel([category]).document,
      categoryDetailRouteViewModel({ authors: [author], category }).document,
      tagsIndexRouteViewModel([tag]).document,
      tagDetailRouteViewModel({
        authors: [author],
        categories: [category],
        tag,
      }).document,
      authorsIndexRouteViewModel([profile]).document,
      announcementsIndexRouteViewModel([announcement]).document,
      collectionsIndexRouteViewModel([featured, startHere]).document,
      collectionDetailRouteViewModel({
        announcements: [announcement],
        articles: [article],
        authors: [author],
        categories: [category],
        collection: featured,
      }).document,
      markdownPageRouteViewModel(
        {
          body: "",
          collection: "pages",
          data: {
            description: "About the site.",
            startHere: [],
            title: "About",
          },
          id: "about",
        },
        "about",
      ).document,
      bibliographyRouteViewModel([]).document,
      searchRouteViewModel().document,
      homePageRouteViewModel({
        announcements: [announcement],
        articles: [article],
        authors: [author],
        categories: [category],
        collections: [featured, startHere],
        config: siteConfig,
        home: {
          data: {
            hero: {
              lightImage: publishableImageMetadata,
            },
            startHere: [],
            title: "Home",
          },
        },
      }).document,
    ];

    expect(
      documents.map((document) => ({
        canonicalPath: document.canonicalPath,
        kind: document.kind,
      })),
    ).toEqual([
      { canonicalPath: "/articles/", kind: "articles-index" },
      { canonicalPath: "/articles/all/", kind: "articles-archive" },
      { canonicalPath: "/categories/", kind: "category-index" },
      { canonicalPath: "/categories/history/", kind: "category-detail" },
      { canonicalPath: "/tags/", kind: "tag-index" },
      { canonicalPath: "/tags/example/", kind: "tag-detail" },
      { canonicalPath: "/authors/", kind: "author-index" },
      { canonicalPath: "/announcements/", kind: "announcements-index" },
      { canonicalPath: "/collections/", kind: "collection-index" },
      { canonicalPath: "/collections/featured/", kind: "collection-detail" },
      { canonicalPath: "/about/", kind: "page" },
      { canonicalPath: "/bibliography/", kind: "bibliography" },
      { canonicalPath: "/search/", kind: "search" },
      { canonicalPath: "/", kind: "home" },
    ]);
  });
});
