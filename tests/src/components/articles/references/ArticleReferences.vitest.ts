import { describe, expect, test } from "vitest";

import ArticleReferences from "../../../../../src/components/articles/references/ArticleReferences.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleReferenceFixture } from "../reference-fixtures";

describe("ArticleReferences", () => {
  test("renders notes before bibliography when both are present", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleReferences, {
      props: { references: articleReferenceFixture },
    });

    expect(view.indexOf(">Notes<")).toBeLessThan(
      view.indexOf(">Bibliography<"),
    );
    expect(view).toContain("data-article-references");
    expect(view).toContain("data-article-reference-preview");
    expect(view).toContain("note-context");
    expect(view).toContain("cite-baudrillard-1981");
  });

  test("renders only notes or only bibliography when one side is empty", async () => {
    const container = await createAstroTestContainer();
    const notesOnly = await container.renderToString(ArticleReferences, {
      props: {
        references: {
          citations: [],
          notes: articleReferenceFixture.notes,
        },
      },
    });
    const citationsOnly = await container.renderToString(ArticleReferences, {
      props: {
        references: {
          citations: articleReferenceFixture.citations,
          notes: [],
        },
      },
    });

    expect(notesOnly).toContain(">Notes<");
    expect(notesOnly).not.toContain(">Bibliography<");
    expect(citationsOnly).not.toContain(">Notes<");
    expect(citationsOnly).toContain(">Bibliography<");
  });

  test("renders nothing when no references exist", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleReferences, {
      props: { references: { citations: [], notes: [] } },
    });

    expect(view.trim()).toBe("");
  });
});
