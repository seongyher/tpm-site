import { describe, expect, test } from "vitest";

import { catalogNavigationItems } from "../../../../src/catalog/examples/hostile-fixtures";
import LayoutCatalogSection from "../../../../src/catalog/sections/LayoutCatalogSection.astro";
import { createAstroTestContainer } from "../../../helpers/astro-container";

describe("LayoutCatalogSection", () => {
  test("renders layout catalog examples from a domain section", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(LayoutCatalogSection, {
      props: {
        longActionLabel: "Support this catalog with a long translated label",
        navigationItems: catalogNavigationItems,
        supportUrl: "https://example.com/support",
      },
    });

    expect(view).toContain("Layout Components");
    expect(view).toContain("src/components/layout/PriorityInlineRow.astro");
    expect(view).toContain("src/components/layout/SiteHeader.astro");
    expect(view).toContain("src/components/layout/MainFrame.astro");
    expect(view).toContain("src/components/layout/SiteFooter.astro");
    expect(view).toContain("src/components/layout/PageFrame.astro");
    expect(view).toContain("https://example.com/support");
  });
});
