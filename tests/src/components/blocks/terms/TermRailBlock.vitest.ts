import { describe, expect, test } from "vitest";

import TermRailBlock from "../../../../../src/components/blocks/terms/TermRailBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("TermRailBlock", () => {
  test("renders generic term data through the shared horizontal rail", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(TermRailBlock, {
      props: {
        itemNoun: "entry",
        itemNounPlural: "entries",
        items: [
          {
            count: 2,
            description: "A curated set.",
            href: "/collections/start-here/",
            title: "Start Here",
          },
        ],
        railId: "collections-rail",
        title: "Collections",
      },
    });

    expect(view).toContain('aria-label="Collections"');
    expect(view).toContain('id="collections-rail"');
    expect(view).toContain("Start Here");
    expect(view).toContain("2 entries");
    expect(view).toContain("data-term-rail");
    expect(view).toContain("data-scroll-rail");
  });

  test("renders a compact empty state", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(TermRailBlock, {
      props: {
        emptyText: "No collections yet.",
        items: [],
      },
    });

    expect(view).toContain("No collections yet.");
    expect(view).toContain("data-term-rail-empty");
    expect(view).not.toContain("data-scroll-rail");
  });
});
