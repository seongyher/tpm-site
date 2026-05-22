import { describe, expect, test } from "vitest";

import ArticleReferenceBacklinks from "../../../../../src/components/articles/references/ArticleReferenceBacklinks.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleReferenceFixture } from "../reference-fixtures";

describe("ArticleReferenceBacklinks", () => {
  test("renders one accessible return link per marker", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleReferenceBacklinks, {
      props: {
        kind: "citation",
        references: articleReferenceFixture.citations[0].references,
      },
    });

    expect(view).toContain('href="#cite-ref-baudrillard-1981"');
    expect(view).toContain('href="#cite-ref-baudrillard-1981-2"');
    expect(view).toContain("data-article-reference-backlink");
    expect(view).toContain(
      'data-reference-marker-id="cite-ref-baudrillard-1981"',
    );
    expect(view).toContain('data-reference-entry-id="cite-baudrillard-1981"');
    expect(view).toContain("Back to citation reference 1");
    expect(view).toContain("Back to citation reference 2");
  });

  test("renders nothing for an empty marker array", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleReferenceBacklinks, {
      props: { kind: "note", references: [] },
    });

    expect(view.trim()).toBe("");
  });
});
