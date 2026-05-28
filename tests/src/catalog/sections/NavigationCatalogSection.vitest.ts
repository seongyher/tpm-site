import { describe, expect, test } from "vitest";

import { catalogNavigationItems } from "../../../../src/catalog/examples/hostile-fixtures";
import NavigationCatalogSection from "../../../../src/catalog/sections/NavigationCatalogSection.astro";
import { createAstroTestContainer } from "../../../helpers/astro-container";

describe("NavigationCatalogSection", () => {
  test("renders navigation catalog examples from a domain section", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(NavigationCatalogSection, {
      props: { navigationItems: catalogNavigationItems },
    });

    expect(view).toContain("Navigation Components");
    expect(view).toContain("src/components/navigation/BrandLink.astro");
    expect(view).toContain("src/components/navigation/PrimaryNav.astro");
    expect(view).toContain("src/components/navigation/SearchForm.astro");
    expect(view).toContain("src/components/navigation/SearchReveal.astro");
    expect(view).toContain("src/components/navigation/ThemeToggle.astro");
    expect(view).toContain("src/components/navigation/SupportLink.astro");
    expect(view).toContain("src/components/navigation/SectionNavItem.astro");
    expect(view).toContain("src/components/navigation/CategoryGroup.astro");
    expect(view).toContain("src/components/navigation/CategoryTree.astro");
    expect(view).toContain("src/components/navigation/MobileMenu.astro");
  });
});
