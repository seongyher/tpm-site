import { describe, expect, test } from "vitest";

import TermRailCard from "../../../../../src/components/blocks/terms/TermRailCard.astro";
import {
  createAstroTestContainer,
  testSiteUrl,
} from "../../../../helpers/astro-container";

describe("TermRailCard", () => {
  test("renders a linked term card with count pluralization", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(TermRailCard, {
      props: {
        count: 2,
        description: "Articles about culture.",
        href: "/categories/culture/",
        title: "Culture",
      },
      request: new Request(`${testSiteUrl}/`),
    });

    expect(view).toContain("data-term-rail-card");
    expect(view).toContain('href="/categories/culture/"');
    expect(view).toContain("Culture");
    expect(view).toContain("2 articles");
    expect(view).toContain("Articles about culture.");
  });

  test("uses a singular count label", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(TermRailCard, {
      props: {
        count: 1,
        href: "/categories/history/",
        title: "History",
      },
      request: new Request(`${testSiteUrl}/`),
    });

    expect(view).toContain("1 article");
  });
});
