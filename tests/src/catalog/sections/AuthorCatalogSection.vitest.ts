import { describe, expect, test } from "vitest";

import AuthorCatalogSection from "../../../../src/catalog/sections/AuthorCatalogSection.astro";
import { createAstroTestContainer } from "../../../helpers/astro-container";
import { articleItems } from "../../components/articles/article-fixture";
import {
  authorProfileFixture,
  authorSummaryFixture,
} from "../../components/authors/author-fixture";

describe("AuthorCatalogSection", () => {
  test("renders author catalog examples from a domain section", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(AuthorCatalogSection, {
      props: {
        articles: articleItems,
        primarySummary: authorSummaryFixture,
        profile: authorProfileFixture,
        profiles: [authorProfileFixture],
        summaries: [authorSummaryFixture],
      },
    });

    expect(view).toContain("Author Components");
    expect(view).toContain("src/components/authors/AuthorLink.astro");
    expect(view).toContain("src/components/authors/AuthorByline.astro");
    expect(view).toContain("src/components/authors/AuthorSocialLinks.astro");
    expect(view).toContain("src/components/authors/AuthorProfileHeader.astro");
    expect(view).toContain("src/components/authors/AuthorBioBlock.astro");
    expect(view).toContain("src/components/authors/AuthorArticleList.astro");
    expect(view).toContain("src/components/authors/AuthorsIndexPage.astro");
    expect(view).toContain("src/components/authors/AuthorPage.astro");
    expect(view).toContain("Seong-Young Her");
    expect(view).toContain("Legacy Author String");
  });
});
