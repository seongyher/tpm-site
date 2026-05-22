import { describe, expect, test } from "vitest";

import EntryMetaLine from "../../../../../src/components/articles/lists/EntryMetaLine.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("EntryMetaLine", () => {
  test("renders separated metadata without dangling separators", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(EntryMetaLine, {
      props: {
        items: ["Culture", "", "May 5, 2026", "Author"],
      },
    });

    expect(view).toContain("<p");
    expect(view).toContain("Culture");
    expect(view).toContain("May 5, 2026");
    expect(view).toContain("Author");
    expect(view.match(/aria-hidden="true"/gu)).toHaveLength(2);
  });

  test("supports linked items and reserved empty rows", async () => {
    const container = await createAstroTestContainer();
    const linkedView = await container.renderToString(EntryMetaLine, {
      props: {
        items: [{ href: "/categories/culture/", label: "Culture" }],
      },
    });
    const emptyView = await container.renderToString(EntryMetaLine, {
      props: {
        as: "div",
        hideWhenEmpty: false,
        items: [],
      },
    });

    expect(linkedView).toContain('href="/categories/culture/"');
    expect(emptyView).toContain("<div");
    expect(emptyView).toContain('aria-hidden="true"');
  });
});
