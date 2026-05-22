import { describe, expect, test } from "vitest";

import CompactEntryRow from "../../../../../src/components/articles/lists/CompactEntryRow.astro";
import {
  createAstroTestContainer,
  testSiteUrl,
} from "../../../../helpers/astro-container";

describe("CompactEntryRow", () => {
  test("renders a compact publishable row with linked metadata and optional description", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(CompactEntryRow, {
      props: {
        item: {
          author: "Author",
          category: { href: "/categories/culture/", title: "Culture" },
          date: "May 5, 2026",
          description: "A short description for a compact panel row.",
          href: "/articles/compact-row/",
          title: "Compact Row",
        },
        showDescription: true,
      },
      request: new Request(`${testSiteUrl}/`),
    });

    expect(view).toContain("data-compact-entry-row");
    expect(view).toContain('href="/articles/compact-row/"');
    expect(view).toContain("Compact Row");
    expect(view).toContain('href="/categories/culture/"');
    expect(view).toContain("May 5, 2026");
    expect(view).toContain("Author");
    expect(view).toContain("data-compact-entry-description");
  });

  test("does not prefetch external links by default", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(CompactEntryRow, {
      props: {
        item: {
          href: "https://example.com/offsite",
          title: "Offsite",
        },
      },
      request: new Request(`${testSiteUrl}/`),
    });

    expect(view).toContain('href="https://example.com/offsite"');
    expect(view).not.toContain('data-astro-prefetch="hover"');
  });
});
