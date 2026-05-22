import { describe, expect, test } from "vitest";

import TermOverviewBlock from "../../../../../src/components/blocks/terms/TermOverviewBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("TermOverviewBlock", () => {
  test("renders reusable taxonomy overview terms", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(TermOverviewBlock, {
      props: {
        description: "Find articles by reusable terms.",
        items: [
          {
            count: 2,
            description: "Theory and practice.",
            href: "/tags/memetics/",
            title: "memetics",
          },
          {
            count: 1,
            href: "/tags/pol/",
            title: "pol",
          },
        ],
        title: "Tags",
      },
    });

    expect(view).toContain("Tags");
    expect(view).toContain("Find articles by reusable terms.");
    expect(view).toContain('href="/tags/memetics/"');
    expect(view).toContain("Theory and practice.");
    expect(view).toMatch(/2\s+articles/);
    expect(view).toMatch(/1\s+article/);
    expect(view).toContain('data-astro-prefetch="hover"');
  });

  test("renders an explicit empty state without changing heading semantics", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(TermOverviewBlock, {
      props: {
        emptyLabel: "No tags yet.",
        headingLevel: 2,
        items: [],
        title: "Tags",
      },
    });

    expect(view).toContain("<h2");
    expect(view).not.toContain("<h1");
    expect(view).toContain("No tags yet.");
    expect(view).toContain("data-term-overview-empty");
  });

  test("supports non-article count nouns for collection indexes", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(TermOverviewBlock, {
      props: {
        itemNoun: "entry",
        itemNounPlural: "entries",
        items: [
          { count: 2, href: "/collections/featured/", title: "Featured" },
        ],
        title: "Collections",
      },
    });

    expect(view).toMatch(/2\s+entries/);
  });
});
