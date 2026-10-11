import { describe, expect, test } from "vitest";

import ArticleHeaderActionRow from "../../../../src/components/articles/ArticleHeaderActionRow.astro";
import { createAstroTestContainer } from "../../../helpers/astro-container";

describe("ArticleHeaderActionRow", () => {
  test("renders the article header action wrapper hooks", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleHeaderActionRow, {
      slots: {
        default: "Actions",
      },
    });

    expect(view).toContain("data-article-header-actions");
    expect(view).toContain("data-print-exclude");
    expect(view).toContain("print:hidden");
    expect(view).toContain("Actions");
  });
});
