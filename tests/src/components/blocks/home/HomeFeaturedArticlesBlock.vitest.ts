import { describe, expect, test } from "vitest";

import HomeFeaturedArticlesBlock from "../../../../../src/components/blocks/home/HomeFeaturedArticlesBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleItems } from "../../articles/article-fixture";

describe("HomeFeaturedArticlesBlock", () => {
  test("renders a start-here article list", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeFeaturedArticlesBlock, {
      props: { items: articleItems },
    });

    expect(view).toContain("Start Here");
    expect(view).toContain("Article Title");
    expect(view).toContain("Second Article");
  });

  test("renders a missing-content state for empty featured lists", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeFeaturedArticlesBlock, {
      props: { items: [] },
    });

    expect(view).toContain("Featured articles will appear here.");
  });
});
