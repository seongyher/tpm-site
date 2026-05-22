import { describe, expect, test } from "vitest";

import HomeStartHerePanel from "../../../../../src/components/blocks/home/HomeStartHerePanel.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleItems } from "../../articles/article-fixture";

describe("HomeStartHerePanel", () => {
  test("renders curated article links as an ordered start-here section", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeStartHerePanel, {
      props: { items: articleItems },
    });

    expect(view).toContain("data-home-start-here-panel");
    expect(view).toContain("Start Here");
    expect(view).toContain("Article Title");
    expect(view).toContain("/articles/article-title/");
    expect(view).toContain("<ol");
  });

  test("renders a useful empty state", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeStartHerePanel, {
      props: { items: [] },
    });

    expect(view).toContain("Curated starter articles will appear here.");
    expect(view).not.toContain("<ol");
  });
});
