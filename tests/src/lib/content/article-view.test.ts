import { describe, expect, test } from "bun:test";

import { articleViewModel } from "../../../../src/lib/content/article-view";
import { articleEntry } from "../../../helpers/content";

describe("articleViewModel", () => {
  test("normalizes article metadata for layouts", () => {
    const image = {
      format: "jpg",
      height: 640,
      src: "/assets/article.jpg",
      width: 960,
    } as const;
    const viewModel = articleViewModel(
      articleEntry({
        data: {
          author: "Seong-Young Her",
          date: new Date("2022-04-06T23:58:10.000Z"),
          description: "Article description",
          image,
          imageAlt: "Article image alt",
          title: "Article Title",
        },
        id: "article-title",
      }),
    );

    expect(viewModel).toEqual({
      author: "Seong-Young Her",
      canonicalPath: "/articles/article-title/",
      categorySlug: "history",
      date: new Date("2022-04-06T23:58:10.000Z"),
      description: "Article description",
      formattedDate: "April 6, 2022",
      imageAlt: "Article image alt",
      title: "Article Title",
    });
  });
});
