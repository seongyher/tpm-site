import { describe, expect, test } from "vitest";

import MoreInCategoryBlock from "../../../../../src/components/articles/endcap/MoreInCategoryBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleItems } from "../article-fixture";

describe("MoreInCategoryBlock", () => {
  test("renders same-category discovery when items are present", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(MoreInCategoryBlock, {
      props: {
        categoryHref: "/categories/history/",
        categoryTitle: "History",
        headingId: "test-more-in-category",
        items: articleItems,
      },
    });

    expect(view).toContain('aria-labelledby="test-more-in-category"');
    expect(view).toContain("More in History");
    expect(view).toContain("View category");
    expect(view).toContain('href="/categories/history/"');
    expect(view).toContain('data-astro-prefetch="hover"');
    expect(view).toContain("Article Title");
  });
});
