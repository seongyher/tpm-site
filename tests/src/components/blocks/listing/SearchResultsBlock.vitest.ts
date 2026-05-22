import { describe, expect, test } from "vitest";

import SearchResultsBlock from "../../../../../src/components/blocks/listing/SearchResultsBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("SearchResultsBlock", () => {
  test("renders static search form and result enhancement region", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(SearchResultsBlock);

    expect(view).toContain('id="search"');
    expect(view).toContain('role="search"');
    expect(view).toContain('id="search-page-input"');
    expect(view).toContain("data-search-results");
    expect(view).toContain("Search requires JavaScript");
  });
});
