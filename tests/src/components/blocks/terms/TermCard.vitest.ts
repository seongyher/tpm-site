import { describe, expect, test } from "vitest";

import TermCard from "../../../../../src/components/blocks/terms/TermCard.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("TermCard", () => {
  test("renders a linked term summary with count and description", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(TermCard, {
      props: {
        count: 3,
        description: "Writing about games.",
        href: "/categories/game-studies/",
        title: "Game Studies",
      },
    });

    expect(view).toContain("<li");
    expect(view).toContain('href="/categories/game-studies/"');
    expect(view).toContain("Game Studies");
    expect(view).toContain("3 articles");
    expect(view).toContain("Writing about games.");
  });

  test("uses singular nouns and center alignment when requested", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(TermCard, {
      props: {
        align: "center",
        count: 1,
        href: "/collections/start-here/",
        itemNoun: "entry",
        itemNounPlural: "entries",
        title: "Start Here",
      },
    });

    expect(view).toContain("1 entry");
    expect(view).toContain("justify-items-center");
    expect(view).toContain("text-center");
  });
});
