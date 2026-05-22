import { describe, expect, test } from "vitest";

import { getCategories } from "../../../../src/lib/content/content";
import CategoryPage from "../../../../src/pages/categories/[category].astro";
import {
  createAstroTestContainer,
  testSiteUrl,
} from "../../../helpers/astro-container";

describe("category page", () => {
  test("renders category article listings", async () => {
    const [category] = await getCategories();

    if (category === undefined) {
      throw new Error("Expected at least one category fixture from content.");
    }

    const container = await createAstroTestContainer();
    const view = await container.renderToString(CategoryPage, {
      props: { category },
      request: new Request(`${testSiteUrl}/categories/${category.slug}/`),
    });

    expect(view).toContain(category.title);
    expect(view).toContain("data-page-frame");
    expect(view).toContain("<article");
  });
});
