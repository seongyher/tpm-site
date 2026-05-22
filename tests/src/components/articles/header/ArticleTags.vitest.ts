import { describe, expect, test } from "vitest";

import ArticleTags from "../../../../../src/components/articles/header/ArticleTags.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("ArticleTags", () => {
  test("renders tag badges when tags are present", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleTags, {
      props: { tags: ["history", "philosophy"] },
    });

    expect(view).toContain('aria-label="Article tags"');
    expect(view).toContain("history");
    expect(view).toContain("philosophy");
    expect(view).toContain('href="/tags/history/"');
    expect(view).toContain('data-astro-prefetch="hover"');
  });
});
