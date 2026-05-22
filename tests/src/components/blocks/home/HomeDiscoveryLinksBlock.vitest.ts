import { describe, expect, test } from "vitest";

import HomeDiscoveryLinksBlock from "../../../../../src/components/blocks/home/HomeDiscoveryLinksBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("HomeDiscoveryLinksBlock", () => {
  test("renders one-line reading navigation without enumerating tags", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeDiscoveryLinksBlock, {
      props: {
        links: [
          { href: "/articles/", label: "Articles" },
          { href: "/articles/all/", label: "Archive" },
          { href: "/collections/", label: "Collections" },
          { href: "/authors/", label: "Authors" },
          { href: "/tags/", label: "Tags" },
        ],
      },
    });

    expect(view).toContain("data-home-discovery-links");
    expect(view).toContain("Read");
    expect(view).toContain("/articles/");
    expect(view).toContain("/articles/all/");
    expect(view).toContain("/collections/");
    expect(view).toContain("/tags/");
    expect(view).toContain("Authors");
    expect(view).toContain("w-fit");
    expect(view).toContain("flex-nowrap");
    expect(view).toContain("truncate");
    expect(view).toContain("py-0");
    expect(view).not.toContain("border-y");
    expect(view).not.toContain("justify-between");
    expect(view).not.toContain("GitHub");
    expect(view).not.toContain("RSS");
    expect(view).not.toContain("memeculture");
  });
});
