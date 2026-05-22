import { describe, expect, test } from "vitest";

import ArticleFootnotes from "../../../../../src/components/articles/references/ArticleFootnotes.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleReferenceFixture } from "../reference-fixtures";

describe("ArticleFootnotes", () => {
  test("renders ordered notes with backlinks and rich content", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleFootnotes, {
      props: { notes: articleReferenceFixture.notes },
    });

    expect(view).toContain(">Notes<");
    expect(view).toContain('id="note-context"');
    expect(view).toContain("<ol");
    expect(view).toContain("Context with");
    expect(view).toContain("Back to note reference 1");
    expect(view).not.toContain("Internal note label");
  });

  test("renders nothing for an empty note array", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleFootnotes, {
      props: { notes: [] },
    });

    expect(view.trim()).toBe("");
  });
});
