import { describe, expect, test } from "vitest";

import CompactEntryList from "../../../../../src/components/articles/lists/CompactEntryList.astro";
import {
  createAstroTestContainer,
  testSiteUrl,
} from "../../../../helpers/astro-container";

describe("CompactEntryList", () => {
  test("renders compact entries in caller order with divider rhythm", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(CompactEntryList, {
      props: {
        items: [
          {
            date: "May 5, 2026",
            href: "/articles/first/",
            title: "First",
          },
          {
            href: "/announcements/second/",
            title: "Second",
          },
        ],
      },
      request: new Request(`${testSiteUrl}/`),
    });

    expect(view).toContain("data-compact-entry-list");
    expect(view).toContain("border-b");
    expect(view.indexOf("First")).toBeLessThan(view.indexOf("Second"));
  });

  test("renders a compact empty state", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(CompactEntryList, {
      props: {
        emptyText: "Nothing here.",
        items: [],
      },
      request: new Request(`${testSiteUrl}/`),
    });

    expect(view).toContain("data-compact-entry-empty");
    expect(view).toContain("Nothing here.");
    expect(view).not.toContain("data-compact-entry-list");
  });
});
