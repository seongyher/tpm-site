import { describe, expect, test } from "bun:test";

import { articleCatalogExamples } from "../../../../src/catalog/examples/article.examples";

describe("article catalog examples", () => {
  test("cover article components with stable component paths", () => {
    const paths = articleCatalogExamples.map(
      (example) => example.componentPath,
    );

    expect(paths).toContain(
      "src/components/articles/header/ArticleHeader.astro",
    );
    expect(paths).toContain(
      "src/components/articles/actions/ArticleShareMenu.astro",
    );
    expect(paths).toContain("src/components/articles/lists/ArticleList.astro");
    expect(paths).toContain(
      "src/components/articles/lists/CompactEntryList.astro",
    );
    expect(paths).toContain(
      "src/components/articles/lists/CompactEntryRow.astro",
    );
    expect(paths).toContain(
      "src/components/articles/endcap/ArticleEndcap.astro",
    );
    expect(paths).toContain(
      "src/components/articles/endcap/NextArticleBlock.astro",
    );
    expect(paths).toContain(
      "src/components/articles/toc/ArticleTableOfContents.astro",
    );
    expect(paths).toContain(
      "src/components/articles/toc/TableOfContentsItem.astro",
    );
    expect(paths).toContain(
      "src/components/articles/toc/TableOfContentsToggle.astro",
    );
    expect(paths).toContain("src/components/blocks/shared/SupportBlock.astro");
    expect(new Set(paths).size).toBe(paths.length);
  });
});
