import { describe, expect, test } from "vitest";

import CompactEntryPanel from "../../../../../src/components/blocks/shared/CompactEntryPanel.astro";
import {
  createAstroTestContainer,
  testSiteUrl,
} from "../../../../helpers/astro-container";

describe("CompactEntryPanel", () => {
  test("renders a framed compact entry panel with linked heading", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(CompactEntryPanel, {
      props: {
        description: "A concise panel description.",
        headingId: "compact-panel-heading",
        items: [
          {
            href: "/articles/start/",
            title: "Start Here",
          },
        ],
        title: "Start Here",
        titleHref: "/collections/start-here/",
      },
      request: new Request(`${testSiteUrl}/`),
    });

    expect(view).toContain("data-compact-entry-panel");
    expect(view).toContain('aria-labelledby="compact-panel-heading"');
    expect(view).toContain('href="/collections/start-here/"');
    expect(view).toContain("A concise panel description.");
    expect(view).toContain("data-compact-entry-list");
  });
});
