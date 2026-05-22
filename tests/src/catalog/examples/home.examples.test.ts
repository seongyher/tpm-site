import { describe, expect, test } from "bun:test";

import { homeCatalogExamples } from "../../../../src/catalog/examples/home.examples";

describe("home catalog examples", () => {
  test("cover homepage blocks with stable component paths", () => {
    const paths = homeCatalogExamples.map((example) => example.componentPath);

    expect(paths).toContain(
      "src/components/blocks/shared/CompactEntryPanel.astro",
    );
    expect(paths).toContain(
      "src/components/articles/lists/FlatArticleList.astro",
    );
    expect(paths).toContain(
      "src/components/articles/lists/FlatArticleTeaser.astro",
    );
    expect(paths).toContain("src/components/blocks/home/HomeHeroBlock.astro");
    expect(paths).toContain(
      "src/components/blocks/home/HomeLatestArticleBlock.astro",
    );
    expect(paths).toContain(
      "src/components/blocks/home/HomeCategoryOverviewBlock.astro",
    );
    expect(paths).toContain(
      "src/components/blocks/home/HomeCurrentPanel.astro",
    );
    expect(paths).toContain(
      "src/components/blocks/home/HomeDiscoveryLinksBlock.astro",
    );
    expect(paths).toContain(
      "src/components/blocks/home/HomeFeaturedCarousel.astro",
    );
    expect(paths).toContain(
      "src/components/blocks/home/HomeFeaturedSlide.astro",
    );
    expect(paths).toContain(
      "src/components/blocks/home/HomeMastheadBlock.astro",
    );
    expect(paths).toContain(
      "src/components/blocks/home/HomeRecentPostsBlock.astro",
    );
    expect(paths).toContain(
      "src/components/blocks/home/HomeStartHerePanel.astro",
    );
    expect(paths).toContain("src/components/blocks/terms/TermRailCard.astro");
    expect(new Set(paths).size).toBe(paths.length);
  });
});
