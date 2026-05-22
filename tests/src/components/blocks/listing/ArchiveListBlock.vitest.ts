import { describe, expect, test } from "vitest";

import ArchiveListBlock from "../../../../../src/components/blocks/listing/ArchiveListBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";
import { articleItems } from "../../articles/article-fixture";

describe("ArchiveListBlock", () => {
  test("renders a page heading and article list", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArchiveListBlock, {
      props: {
        description: "Essays and notes.",
        items: articleItems,
        pagefindIgnore: true,
        title: "Articles",
      },
    });

    expect(view).toContain("Articles");
    expect(view).toContain("Essays and notes.");
    expect(view).toContain("data-pagefind-ignore");
    expect(view).toContain("Article Title");
  });

  test("renders optional eyebrow text", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArchiveListBlock, {
      props: {
        eyebrow: "Category",
        items: articleItems,
        title: "History",
      },
    });

    expect(view).toContain("Category");
    expect(view).toContain("History");
  });

  test("keeps generated heading ids valid when titles start with digits", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArchiveListBlock, {
      props: {
        eyebrow: "Tag",
        items: articleItems,
        title: "4chan",
      },
    });

    expect(view).toContain('id="archive-4chan-heading"');
    expect(view).toContain('aria-labelledby="archive-4chan-heading"');
  });

  test("can render as a subsection heading when nested below a page h1", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArchiveListBlock, {
      props: {
        headingLevel: 2,
        items: articleItems,
        title: "Latest Articles",
      },
    });

    expect(view).toContain("<h2");
    expect(view).not.toContain("<h1");
  });
});
