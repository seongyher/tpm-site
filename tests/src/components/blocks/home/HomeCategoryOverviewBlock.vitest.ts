import { describe, expect, test } from "vitest";

import HomeCategoryOverviewBlock from "../../../../../src/components/blocks/home/HomeCategoryOverviewBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { navigationItems } from "../../navigation/navigation-fixture";

describe("HomeCategoryOverviewBlock", () => {
  test("renders category navigation data as a horizontal discovery rail", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeCategoryOverviewBlock, {
      props: { items: navigationItems },
    });

    expect(view).toContain('aria-label="Categories"');
    expect(view).toContain("Metamemetics");
    expect(view).toMatch(/2\s+articles/);
    expect(view).toContain("data-home-category-overview");
    expect(view).toContain("data-category-rail");
    expect(view).toContain("data-scroll-rail");
    expect(view).toContain("data-scroll-rail-viewport");
    expect(view).toContain("data-scroll-rail-previous");
    expect(view).toContain("data-scroll-rail-next");
    expect(view).toContain("Scroll categories left");
    expect(view).toContain("Scroll categories right");
    expect(view).toContain("auto-cols-fr");
    expect(view).toContain("w-max");
    expect(view).toContain("justify-items-center");
    expect(view).toContain("text-center");
    expect(view).not.toContain("home-categories-heading");
    expect(view).not.toContain("max-w-3xl");
    expect(view).not.toContain("xl:grid-cols-4");
    expect(view).not.toContain("w-[min(17rem,78vw)]");
  });
});
