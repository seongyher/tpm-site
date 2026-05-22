import { describe, expect, test } from "vitest";

import SiteHeader from "../../../../src/components/layout/SiteHeader.astro";
import { primaryNavigationItems } from "../../../../src/lib/site/navigation";
import { createAstroTestContainer } from "../../../helpers/astro-container";
import { navigationItems } from "../navigation/navigation-fixture";

describe("SiteHeader", () => {
  test("renders brand, search, primary navigation, support, theme, and mobile menu", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(SiteHeader, {
      props: {
        categoryItems: navigationItems,
        currentPath: "/articles/",
        primaryItems: primaryNavigationItems(),
      },
    });

    expect(view).toContain("The Philosopher&#39;s Meme");
    expect(view).toContain("data-priority-inline-row");
    expect(view).toContain("data-action-cluster");
    expect(view).toContain("gap-x-3");
    expect(view).toContain("Patreon");
    expect(view).toContain("Category discovery");
    expect(view).toContain("Open search");
    expect(view).toContain('role="search"');
    expect(view).toContain("Support Us");
    expect(view).toContain("theme-toggle");
    expect(view).toContain("Mobile site search");
    expect(view).toContain("Mobile primary navigation");
    expect(view).toContain("md:hidden");
    expect(view).toContain("md:flex");
  });
});
