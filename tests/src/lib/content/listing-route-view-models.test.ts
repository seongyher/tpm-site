import { describe, expect, test } from "bun:test";

import { authorProfiles } from "../../../../src/lib/content/authors";
import {
  articlesArchiveRouteViewModel,
  authorDetailRouteViewModel,
  categoryDetailRouteViewModel,
  collectionDetailRouteViewModel,
} from "../../../../src/lib/content/listing-route-view-models";
import {
  announcementEntry,
  articleEntry,
  authorEntry,
  categorySummary,
  editorialCollectionEntry,
} from "../../../helpers/content";
import {
  collectionOnlyVisibilityFixture,
  publishableVisibilityFixture,
} from "../../../helpers/publishable";

describe("listing route view models", () => {
  test("filters archive items through directory visibility", () => {
    const visible = articleEntry({ id: "visible" });
    const directoryHidden = articleEntry({
      data: {
        visibility: publishableVisibilityFixture({ directory: false }),
      },
      id: "hidden",
    });
    const category = categorySummary({
      articles: [visible, directoryHidden],
    });

    const model = articlesArchiveRouteViewModel({
      articles: [visible, directoryHidden],
      authors: [authorEntry()],
      categories: [category],
    });

    expect(model.items.map((item) => item.href)).toEqual([
      "/articles/visible/",
    ]);
    expect(model.document).toMatchObject({
      canonicalPath: "/articles/all/",
      kind: "articles-archive",
    });
  });

  test("builds category detail metadata, breadcrumbs, and filtered list items", () => {
    const visible = articleEntry({ id: "visible" });
    const directoryHidden = articleEntry({
      data: {
        visibility: publishableVisibilityFixture({ directory: false }),
      },
      id: "hidden",
    });
    const category = categorySummary({
      articles: [visible, directoryHidden],
      description: "History writing.",
      slug: "history",
      title: "History",
    });

    const model = categoryDetailRouteViewModel({
      authors: [authorEntry()],
      category,
    });

    expect(model.breadcrumbs.map((item) => item.title)).toEqual([
      "Home",
      "Categories",
      "History",
    ]);
    expect(model.items.map((item) => item.href)).toEqual([
      "/articles/visible/",
    ]);
    expect(model.document).toMatchObject({
      canonicalPath: "/categories/history/",
      description: "History writing.",
      kind: "category-detail",
    });
  });

  test("builds author detail profile facts without route-level shaping", () => {
    const article = articleEntry({ id: "author-article" });
    const author = authorEntry({
      displayName: "Author",
      id: "author",
      shortBio: "Author bio.",
      socials: [{ href: "https://example.com/author", label: "Example" }],
      website: "https://author.example",
    });
    const [profile] = authorProfiles([author], [article]);

    if (profile === undefined) {
      throw new Error("Expected author profile fixture.");
    }

    const model = authorDetailRouteViewModel({
      authors: [author],
      categories: [categorySummary({ articles: [article] })],
      profile,
    });

    expect(model.profileEntity.sameAs).toEqual([
      "https://author.example",
      "https://example.com/author",
    ]);
    expect(model.items.map((item) => item.href)).toEqual([
      "/articles/author-article/",
    ]);
    expect(model.document.kind).toBe("author-profile");
  });

  test("builds collection detail items from article and announcement publishables", () => {
    const article = articleEntry({
      data: {
        visibility: collectionOnlyVisibilityFixture(),
      },
      id: "collection-article",
    });
    const announcement = announcementEntry({ id: "collection-announcement" });
    const collection = editorialCollectionEntry({
      data: {
        items: [
          "collection-article",
          {
            note: "Announcement note.",
            slug: "collection-announcement",
          },
        ],
      },
      id: "featured",
    });

    const model = collectionDetailRouteViewModel({
      announcements: [announcement],
      articles: [article],
      authors: [authorEntry()],
      categories: [categorySummary({ articles: [article] })],
      collection,
    });

    expect(model.title).toBe("Featured Articles");
    expect(model.items.map((item) => item.href)).toEqual([
      "/articles/collection-article/",
      "/announcements/collection-announcement/",
    ]);
    expect(model.items[1]?.description).toBe("Announcement note.");
    expect(model.document.kind).toBe("collection-detail");
  });
});
