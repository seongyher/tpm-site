import { describe, expect, test } from "vitest";

import CategoryOverviewBlock from "../../../../../src/components/blocks/terms/CategoryOverviewBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { navigationItems } from "../../navigation/navigation-fixture";

describe("CategoryOverviewBlock", () => {
  test("renders categories from shared navigation data", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(CategoryOverviewBlock, {
      props: {
        description: "Browse the archive by subject.",
        items: navigationItems,
        title: "Categories",
      },
    });

    expect(view).toContain("Categories");
    expect(view).toContain("Browse the archive by subject.");
    expect(view).toContain("Metamemetics");
    expect(view).toMatch(/2\s+articles/);
    expect(view).toContain("xl:grid-cols-4");
    expect(view).toContain('data-astro-prefetch="hover"');
  });

  test("supports a compact two-column variant for constrained surfaces", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(CategoryOverviewBlock, {
      props: {
        columns: "compact",
        headingLevel: 2,
        items: navigationItems,
      },
    });

    expect(view).toContain("<h2");
    expect(view).not.toContain("<h1");
    expect(view).toContain("sm:grid-cols-2");
    expect(view).not.toContain("xl:grid-cols-4");
  });
});
