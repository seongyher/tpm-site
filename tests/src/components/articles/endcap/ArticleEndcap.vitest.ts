import { describe, expect, test } from "vitest";

import ArticleEndcap from "../../../../../src/components/articles/endcap/ArticleEndcap.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleItems } from "../article-fixture";

describe("ArticleEndcap", () => {
  test("composes category discovery, related discovery, and support CTA", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleEndcap, {
      props: {
        categoryHref: "/categories/history/",
        categoryTitle: "History",
        continuity: {
          item: articleItems[0],
          label: "Next Article",
        },
        idPrefix: "test-endcap",
        moreInCategory: articleItems,
        related: articleItems.slice(0, 1),
        support: {
          body: "Support independent writing.",
          discord: {
            ariaLabel: "Join Discord",
            href: "https://discord.gg/example",
            label: "Discord",
          },
          enabled: true,
          patreon: {
            ariaLabel: "Support on Patreon",
            href: "https://patreon.com/example",
            label: "Patreon",
          },
          title: "Support The Philosopher's Meme",
        },
      },
    });

    expect(view).toContain("More in History");
    expect(view).toContain("Next Article");
    expect(view).toContain("Related Articles");
    expect(view).toContain("Support The Philosopher&#39;s Meme");
    expect(view).toContain('aria-label="Article support and discovery"');
    expect(view).toContain("test-endcap-continuity-heading");
    expect(view).toContain("test-endcap-support-heading");

    const continuityIndex = view.indexOf("test-endcap-continuity-heading");
    const supportIndex = view.indexOf("test-endcap-support-heading");
    const moreIndex = view.indexOf("test-endcap-more-in-category-heading");
    const relatedIndex = view.indexOf("test-endcap-related-articles-heading");

    expect(continuityIndex).toBeGreaterThan(-1);
    expect(supportIndex).toBeGreaterThan(-1);
    expect(supportIndex).toBeGreaterThan(continuityIndex);
    expect(moreIndex).toBeGreaterThan(supportIndex);
    expect(relatedIndex).toBeGreaterThan(moreIndex);
  });
});
