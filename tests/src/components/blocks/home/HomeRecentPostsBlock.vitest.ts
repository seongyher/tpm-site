import { describe, expect, test } from "vitest";

import HomeRecentPostsBlock from "../../../../../src/components/blocks/home/HomeRecentPostsBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleItems } from "../../articles/article-fixture";

describe("HomeRecentPostsBlock", () => {
  test("renders compact recent post links without thumbnails", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeRecentPostsBlock, {
      props: { items: articleItems },
    });

    expect(view).toContain("data-home-recent-posts");
    expect(view).toContain("Most Recent");
    expect(view).toContain("Article Title");
    expect(view).toContain("History");
    expect(view).not.toContain("data-article-card-image-link");
  });

  test("renders a missing-content state", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeRecentPostsBlock, {
      props: { items: [] },
    });

    expect(view).toContain("Recent articles will appear here.");
  });
});
