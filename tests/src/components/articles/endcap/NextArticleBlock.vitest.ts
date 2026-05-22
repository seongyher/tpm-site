import { describe, expect, test } from "vitest";

import NextArticleBlock from "../../../../../src/components/articles/endcap/NextArticleBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleItems } from "../article-fixture";

describe("NextArticleBlock", () => {
  test("renders one chronological continuation item", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(NextArticleBlock, {
      props: {
        headingId: "test-next-article",
        item: articleItems[0],
        label: "Next Article",
      },
    });

    expect(view).toContain("data-article-continuity");
    expect(view).toContain("test-next-article");
    expect(view).toContain("Next Article");
    expect(view).toContain("View more");
    expect(view).toContain('href="/articles/all/"');
    expect(view).toContain(articleItems[0].title);
  });

  test("renders nothing when no item is available", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(NextArticleBlock, {
      props: {},
    });

    expect(view).not.toContain("data-article-continuity");
  });
});
