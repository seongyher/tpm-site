import { describe, expect, test } from "vitest";

import {
  catalogArticleItems,
  catalogNavigationItems,
} from "../../../../src/catalog/examples/hostile-fixtures";
import ArchiveSearchCatalogSection from "../../../../src/catalog/sections/ArchiveSearchCatalogSection.astro";
import { createAstroTestContainer } from "../../../helpers/astro-container";

describe("ArchiveSearchCatalogSection", () => {
  test("renders archive, category, and search catalog examples", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArchiveSearchCatalogSection, {
      props: {
        articleItems: catalogArticleItems,
        navigationItems: catalogNavigationItems,
      },
    });

    expect(view).toContain("Archive, Category, And Search Blocks");
    expect(view).toContain("src/components/blocks/ArchiveListBlock.astro");
    expect(view).toContain("src/components/blocks/CategoryRailBlock.astro");
    expect(view).toContain("src/components/blocks/CategoryOverviewBlock.astro");
    expect(view).toContain("src/components/blocks/SearchResultsBlock.astro");
    expect(view).toContain("catalog-category-rail");
    expect(view).toContain("catalog-search-heading");
  });
});
