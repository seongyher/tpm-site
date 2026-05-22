import type { ImageMetadata } from "astro";
import { describe, expect, test } from "bun:test";

import { articleArchiveItems } from "../../../../src/lib/content/archive";
import {
  articleEntry,
  authorEntry,
  categorySummary,
} from "../../../helpers/content";

describe("articleArchiveItems", () => {
  const sampleImage = {
    format: "jpg",
    height: 600,
    src: "/assets/article-preview.jpg",
    width: 800,
  } as const satisfies ImageMetadata;

  test("combines article data with category display metadata", () => {
    const article = articleEntry({
      data: {
        author: "Seong-Young Her",
        date: new Date("2022-04-06T23:58:10.000Z"),
        description: "Article excerpt",
        image: sampleImage,
        imageAlt: "Article preview image",
        title: "Article Title",
      },
      id: "article-title",
    });
    const [archiveItem] = articleArchiveItems(
      [article],
      [
        categorySummary({
          articles: [article],
          slug: "history",
          title: "History",
        }),
      ],
    );

    expect(archiveItem).toMatchObject({
      author: "Seong-Young Her",
      authors: [],
      category: {
        title: "History",
        url: "/categories/history/",
      },
      date: "April 6, 2022",
      description: "Article excerpt",
      image: {
        alt: "Article preview image",
        src: sampleImage,
      },
      title: "Article Title",
      url: "/articles/article-title/",
    });
  });

  test("keeps article entries renderable when category metadata is missing", () => {
    const [archiveItem] = articleArchiveItems(
      [
        articleEntry({
          filePath: "/repo/site/content/articles/missing-category/post.md",
          id: "post",
        }),
      ],
      [],
    );

    expect(archiveItem?.category).toBeUndefined();
  });

  test("uses article titles as preview image alt fallback", () => {
    const article = articleEntry({
      data: {
        image: sampleImage,
        title: "Article Without Custom Image Alt",
      },
      id: "article-without-custom-image-alt",
    });
    const [archiveItem] = articleArchiveItems([article], []);

    expect(archiveItem?.image).toMatchObject({
      alt: "Article Without Custom Image Alt",
      src: sampleImage,
    });
  });

  test("adds structured author summaries when author metadata is available", () => {
    const article = articleEntry({
      data: { author: "Seong-Young Her" },
      id: "article-title",
    });
    const [archiveItem] = articleArchiveItems(
      [article],
      [],
      [
        authorEntry({
          displayName: "Seong-Young Her",
          id: "seong-young-her",
        }),
      ],
    );

    expect(archiveItem).toMatchObject({
      author: "Seong-Young Her",
      authors: [
        {
          displayName: "Seong-Young Her",
          href: "/authors/seong-young-her/",
        },
      ],
    });
  });
});
