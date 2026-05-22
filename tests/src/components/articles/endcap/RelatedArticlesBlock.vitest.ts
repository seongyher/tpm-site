import { describe, expect, test } from "vitest";

import RelatedArticlesBlock from "../../../../../src/components/articles/endcap/RelatedArticlesBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleItems } from "../article-fixture";

describe("RelatedArticlesBlock", () => {
  test("renders related-article discovery when items are present", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(RelatedArticlesBlock, {
      props: {
        headingId: "test-related-articles",
        items: articleItems,
      },
    });

    expect(view).toContain('aria-labelledby="test-related-articles"');
    expect(view).toContain("Related Articles");
    expect(view).toContain("Second Article");
  });
});
