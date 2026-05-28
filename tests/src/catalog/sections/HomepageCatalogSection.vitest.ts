import { describe, expect, test } from "vitest";

import sampleDarkImage from "../../../../src/catalog/assets/catalog-sample-dark.svg";
import sampleImage from "../../../../src/catalog/assets/catalog-sample-light.svg";
import {
  catalogArticleItems,
  catalogNavigationItems,
} from "../../../../src/catalog/examples/hostile-fixtures";
import HomepageCatalogSection from "../../../../src/catalog/sections/HomepageCatalogSection.astro";
import { createAstroTestContainer } from "../../../helpers/astro-container";

const supportActions = {
  discord: {
    ariaLabel: "Join Discord",
    href: "https://example.com/discord",
    label: "Join Discord",
  },
  enabled: true,
  patreon: {
    ariaLabel: "Support on Patreon",
    href: "https://example.com/support",
    label: "Support Us",
  },
} as const;

describe("HomepageCatalogSection", () => {
  test("renders homepage block catalog examples from a domain section", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomepageCatalogSection, {
      props: {
        articleItems: catalogArticleItems,
        articleItemsWithMedia: catalogArticleItems,
        navigationItems: catalogNavigationItems,
        sampleDarkImage,
        sampleImage,
        supportActions,
        supportUrl: "https://example.com/support",
      },
    });

    expect(view).toContain("Homepage Blocks");
    expect(view).toContain("src/components/blocks/HomeHeroBlock.astro");
    expect(view).toContain("src/components/blocks/HomeAnnouncementBlock.astro");
    expect(view).toContain(
      "src/components/blocks/HomeLatestArticleBlock.astro",
    );
    expect(view).toContain(
      "src/components/blocks/HomeFeaturedArticlesBlock.astro",
    );
    expect(view).toContain(
      "src/components/blocks/HomeCategoryOverviewBlock.astro",
    );
    expect(view).toContain("src/components/blocks/HomeArchiveLinksBlock.astro");
    expect(view).toContain("https://example.com/support");
  });
});
