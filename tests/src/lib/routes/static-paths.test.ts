import { describe, expect, test } from "bun:test";

import {
  announcementStaticPaths,
  articleStaticPaths,
  categoryStaticPaths,
  collectionStaticPaths,
  tagStaticPaths,
} from "../../../../src/lib/routes/static-paths";
import {
  announcementEntry,
  articleEntry,
  categorySummary,
  editorialCollectionEntry,
} from "../../../helpers/content";

describe("static path helpers", () => {
  test("builds announcement static path params from entry IDs", () => {
    const announcement = announcementEntry({ id: "site-news" });

    expect(announcementStaticPaths([announcement])).toEqual([
      {
        params: { slug: "site-news" },
        props: { announcement },
      },
    ]);
  });

  test("builds article static path params from entry IDs", () => {
    const article = articleEntry({ id: "article-title" });

    expect(articleStaticPaths([article])).toEqual([
      {
        params: { slug: "article-title" },
        props: { article },
      },
    ]);
  });

  test("builds category static path params from category slugs", () => {
    const category = categorySummary({ slug: "history" });

    expect(categoryStaticPaths([category])).toEqual([
      {
        params: { category: "history" },
        props: { category },
      },
    ]);
  });

  test("builds collection static path params from entry IDs", () => {
    const collection = editorialCollectionEntry({ id: "start-here" });

    expect(collectionStaticPaths([collection])).toEqual([
      {
        params: { collection: "start-here" },
        props: { collection },
      },
    ]);
  });

  test("builds tag static path params from raw labels so Astro encodes URLs", () => {
    const article = articleEntry({ id: "tagged" });
    const tag = {
      articles: [article],
      href: "/tags/meme%20history/",
      label: "meme history",
      pathSegment: "meme%20history",
    };

    expect(tagStaticPaths([tag])).toEqual([
      {
        params: { tag: "meme history" },
        props: { tag },
      },
    ]);
  });
});
