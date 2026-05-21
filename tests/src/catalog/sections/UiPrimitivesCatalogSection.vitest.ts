import { describe, expect, test } from "vitest";

import UiPrimitivesCatalogSection from "../../../../src/catalog/sections/UiPrimitivesCatalogSection.astro";
import { createAstroTestContainer } from "../../../helpers/astro-container";

describe("UiPrimitivesCatalogSection", () => {
  test("renders the UI primitive catalog examples from a domain section", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(UiPrimitivesCatalogSection, {
      props: {
        anchoredPresetMatrix: [
          "header-dropdown",
          "header-search-start",
          "header-search-end",
        ],
        catalogSupportUrl: "https://example.com/support",
      },
    });

    expect(view).toContain("UI Primitives");
    expect(view).toContain("src/components/ui/Button.astro");
    expect(view).toContain("src/components/ui/ActionMenuItem.astro");
    expect(view).toContain("src/components/ui/ActionPopover.astro");
    expect(view).toContain("src/components/ui/AnchoredRoot.astro");
    expect(view).toContain("src/components/ui/BrandButton.astro");
    expect(view).toContain("src/components/ui/ScrollRail.astro");
    expect(view).toContain("src/components/ui/SectionHeader.astro");
    expect(view).toContain("https://example.com/support");
    expect(view).toContain("header-search-end");
    expect(view).toContain("catalog-action-popover");
    expect(view).toContain("catalog-scroll-rail");
  });
});
