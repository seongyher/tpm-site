import { describe, expect, test } from "vitest";

import ArticleList from "../../../../../src/components/articles/lists/ArticleList.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleItems } from "../article-fixture";

describe("ArticleList", () => {
  test("renders ordered article cards and optional pagefind ignore marker", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleList, {
      props: {
        items: articleItems,
        pagefindIgnore: true,
      },
    });

    expect(view).toContain("<ol");
    expect(view).toContain("data-pagefind-ignore");
    expect(view).toContain("Article Title");
    expect(view).toContain("Second Article");
    expect(view).toContain("data-article-list");
    expect(view).toContain("border-b");
    expect(view).toContain('data-article-card-has-image="true"');
    expect(view).toContain('data-article-card-has-image="false"');
  });
});
