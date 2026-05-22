import { describe, expect, test } from "vitest";

import ArticleReferenceDefinitionContent from "../../../../../src/components/articles/references/ArticleReferenceDefinitionContent.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleReferenceFixture } from "../reference-fixtures";

describe("ArticleReferenceDefinitionContent", () => {
  test("renders preserved rich definition content", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(
      ArticleReferenceDefinitionContent,
      {
        props: {
          blocks: articleReferenceFixture.citations[0].definition.children,
        },
      },
    );

    expect(view).toContain("<em");
    expect(view).toContain("data-article-reference-definition-content");
    expect(view).toContain(">Simulacra</em>");
    expect(view).toContain('href="https://example.com/source"');
    expect(view).toContain("<code");
    expect(view).toContain("1981");
  });
});
