import sampleImage from "@site/assets/shared/tpm_defaultpic.jpg";
import { describe, expect, test } from "vitest";

import HomeLatestArticleBlock from "../../../../../src/components/blocks/home/HomeLatestArticleBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleItems } from "../../articles/article-fixture";

describe("HomeLatestArticleBlock", () => {
  test("renders the latest article when an item is present", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeLatestArticleBlock, {
      props: {
        image: sampleImage,
        imageAlt: "Latest article",
        item: articleItems[0],
      },
    });

    expect(view).toContain("Most Recent Post");
    expect(view).toContain("Article Title");
    expect(view).toContain('alt="Latest article"');
  });

  test("renders an empty state when no article is available", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeLatestArticleBlock, {
      props: {
        image: sampleImage,
        imageAlt: "Latest article",
        item: undefined,
      },
    });

    expect(view).toContain("No published articles yet.");
  });
});
