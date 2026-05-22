import { describe, expect, test } from "vitest";

import ArticleHeaderActionTrigger from "../../../../../src/components/articles/actions/ArticleHeaderActionTrigger.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("ArticleHeaderActionTrigger", () => {
  test("renders an anchored button trigger with the shared action treatment", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleHeaderActionTrigger, {
      props: {
        label: "Share this article",
        popovertarget: "share-menu",
      },
      slots: {
        default: "Share",
      },
    });

    expect(view).toContain("<button");
    expect(view).toContain('type="button"');
    expect(view).toContain('aria-label="Share this article"');
    expect(view).toContain('popovertarget="share-menu"');
    expect(view).toContain("data-anchor-trigger");
    expect(view).toContain("text-muted-foreground");
    expect(view).toContain("Share");
  });
});
