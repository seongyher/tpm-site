import { describe, expect, test } from "vitest";

import ArticleCardBody from "../../../../../src/components/articles/lists/ArticleCardBody.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleItems } from "../article-fixture";

describe("ArticleCardBody", () => {
  test("renders article card text, kicker, and metadata without owning media", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleCardBody, {
      props: {
        ...articleItems[0],
        hasImage: true,
      },
    });

    expect(view).toContain("data-article-card-kicker");
    expect(view).toContain("/categories/history/");
    expect(view).toContain("Article Title");
    expect(view).toContain("Article description.");
    expect(view).toContain("/authors/seong-young-her/");
    expect(view).toContain('data-article-card-title-fit="default"');
    expect(view).toContain('data-article-card-description-fit="default"');
    expect(view).not.toContain("data-publishable-media-frame");
  });

  test("omits empty optional body regions without dangling separators", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleCardBody, {
      props: {
        href: "/articles/minimal/",
        title: "Minimal Article",
      },
    });

    expect(view).toContain("Minimal Article");
    expect(view).not.toContain("data-article-card-kicker");
    expect(view).not.toContain("data-article-card-description");
    expect(view).not.toContain("aria-hidden");
  });
});
