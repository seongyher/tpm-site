import { describe, expect, test } from "bun:test";

import {
  defaultPublishableVisibility,
  normalizePublishableVisibility,
  publishableFromAnnouncement,
  publishableIndex,
  publishableListItem,
  publishableListItems,
  publishableSourceHref,
  visiblePublishables,
} from "../../../../src/lib/content/publishable";
import { announcementEntry, articleEntry } from "../../../helpers/content";
import {
  announcementPublishableFixture,
  articlePublishableFixture,
  collectionOnlyVisibilityFixture,
  publishableImage,
  publishableImageMetadata,
  publishableVisibilityFixture,
} from "../../../helpers/publishable";

describe("publishable model", () => {
  test("normalizes visibility with true defaults and explicit overrides", () => {
    expect(normalizePublishableVisibility(undefined)).toEqual(
      defaultPublishableVisibility,
    );
    expect(normalizePublishableVisibility({ homepage: false })).toEqual({
      ...defaultPublishableVisibility,
      homepage: false,
    });
    expect(
      normalizePublishableVisibility(
        { homepage: true },
        {
          ...defaultPublishableVisibility,
          feed: false,
          homepage: false,
          related: false,
          search: false,
        },
      ),
    ).toEqual({
      ...defaultPublishableVisibility,
      feed: false,
      homepage: true,
      related: false,
      search: false,
    });
  });

  test("derives article kind and list data from archive items", () => {
    const publishable = articlePublishableFixture({ id: "what-is-a-meme" });

    expect(publishable).toMatchObject({
      category: {
        href: "/categories/metamemetics/",
        title: "Metamemetics",
      },
      display: {
        category: {
          href: "/categories/metamemetics/",
          title: "Metamemetics",
        },
        title: "What Is A Meme?",
      },
      href: "/articles/what-is-a-meme/",
      kind: "article",
      metadata: {
        canonicalPath: "/articles/what-is-a-meme/",
        title: "What Is A Meme?",
      },
      route: {
        canonicalPath: "/articles/what-is-a-meme/",
        href: "/articles/what-is-a-meme/",
      },
      slug: "what-is-a-meme",
      source: {
        collection: "articles",
        draft: false,
        format: "markdown",
        id: "what-is-a-meme",
        kind: "article",
      },
      taxonomy: {
        tags: [],
      },
      title: "What Is A Meme?",
    });
    expect(publishableListItem(publishable)).toMatchObject({
      href: "/articles/what-is-a-meme/",
      kind: "article",
      title: "What Is A Meme?",
    });
  });

  test("derives announcement kind and image fallback data from announcement entries", () => {
    const announcement = announcementEntry({
      data: {
        image: publishableImageMetadata,
        title: "Join Discord",
      },
      id: "join-discord",
    });
    const publishable = publishableFromAnnouncement(announcement);

    expect(publishable).toMatchObject({
      author: "The Philosopher's Meme",
      display: {
        title: "Join Discord",
      },
      href: "/announcements/join-discord/",
      image: {
        alt: "Join Discord",
        src: publishableImageMetadata,
      },
      kind: "announcement",
      media: {
        image: {
          alt: "Join Discord",
          src: publishableImageMetadata,
        },
      },
      route: {
        canonicalPath: "/announcements/join-discord/",
        href: "/announcements/join-discord/",
      },
      slug: "join-discord",
      source: {
        collection: "announcements",
        draft: false,
        format: "markdown",
        id: "join-discord",
        kind: "announcement",
      },
      title: "Join Discord",
    });
  });

  test("builds a global index and rejects duplicate publishable slugs", () => {
    const article = articlePublishableFixture({ id: "same-slug" });
    const announcement = publishableFromAnnouncement(
      announcementEntry({ id: "same-slug" }),
    );

    expect(() => publishableIndex([article, announcement])).toThrow(
      'Duplicate publishable slug "same-slug" for article and announcement.',
    );
    expect(publishableIndex([article]).get("same-slug")).toBe(article);
  });

  test("filters visible publishables per surface", () => {
    const hidden = articlePublishableFixture({
      data: {
        visibility: publishableVisibilityFixture({
          homepage: false,
        }),
      },
      id: "hidden",
    });
    const visible = announcementPublishableFixture();

    expect(visiblePublishables([hidden, visible], "homepage")).toEqual([
      visible,
    ]);
    expect(visiblePublishables([hidden, visible], "directory")).toEqual([
      hidden,
      visible,
    ]);
  });

  test("maps multiple publishables to source-agnostic list items", () => {
    const items = publishableListItems([
      articlePublishableFixture({ id: "article" }),
      announcementPublishableFixture({ id: "announcement" }),
    ]);

    expect(items.map((item) => item.kind)).toEqual(["article", "announcement"]);
  });

  test("represents collection-only entries without leaking to other surfaces", () => {
    const entry = articlePublishableFixture({
      data: {
        visibility: collectionOnlyVisibilityFixture(),
      },
      id: "collection-only",
    });

    expect(visiblePublishables([entry], "collections")).toEqual([entry]);
    expect(visiblePublishables([entry], "directory")).toEqual([]);
    expect(visiblePublishables([entry], "feed")).toEqual([]);
    expect(visiblePublishables([entry], "search")).toEqual([]);
    expect(visiblePublishables([entry], "sitemap")).toEqual([]);
  });

  test("preserves representative image facts across display, media, and metadata layers", () => {
    const entry = articlePublishableFixture({
      image: publishableImage,
    });

    expect(entry.display.image).toEqual(publishableImage);
    expect(entry.media.image).toEqual(publishableImage);
    expect(entry.metadata.image).toEqual(publishableImage);
    expect(publishableListItem(entry).image).toEqual(publishableImage);
  });

  test("keeps extension expectations explicit for unsupported future kinds", () => {
    const entry = articlePublishableFixture();

    expect(entry.kind).toBe("article");
    expect(entry.source.collection).toBe("articles");
    expect(entry.source.kind).toBe(entry.kind);
  });

  test("returns source hrefs from folder-derived collection kind", () => {
    expect(publishableSourceHref(articleEntry({ id: "article" }))).toBe(
      "/articles/article/",
    );
    expect(
      publishableSourceHref(announcementEntry({ id: "announcement" })),
    ).toBe("/announcements/announcement/");
  });
});
