import { describe, expect, test } from "vitest";

import PageCatalogSection from "../../../../src/catalog/sections/PageCatalogSection.astro";
import { createAstroTestContainer } from "../../../helpers/astro-container";

describe("PageCatalogSection", () => {
  test("renders page component catalog examples from a domain section", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(PageCatalogSection);

    expect(view).toContain("Page Components");
    expect(view).toContain("src/components/pages/PageHeader.astro");
    expect(view).toContain("src/components/pages/PageProse.astro");
    expect(view).toContain("src/components/pages/MarkdownPage.astro");
    expect(view).toContain("About the catalog review site.");
  });
});
