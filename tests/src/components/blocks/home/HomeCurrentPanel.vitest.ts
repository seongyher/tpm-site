import { describe, expect, test } from "vitest";

import HomeCurrentPanel from "../../../../../src/components/blocks/home/HomeCurrentPanel.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("HomeCurrentPanel", () => {
  test("renders current project and support links", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeCurrentPanel, {
      props: {
        links: [
          {
            description: "Help fund the project.",
            href: "https://patreon.com/thephilosophersmeme",
            label: "Support TPM",
          },
        ],
      },
    });

    expect(view).toContain("data-home-current-panel");
    expect(view).toContain("What");
    expect(view).toContain("Support TPM");
    expect(view).toContain("https://patreon.com/thephilosophersmeme");
  });

  test("renders a useful empty state", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeCurrentPanel, {
      props: { links: [] },
    });

    expect(view).toContain("Current updates will appear here.");
    expect(view).not.toContain("<ul");
  });
});
