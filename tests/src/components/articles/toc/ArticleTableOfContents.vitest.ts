import { describe, expect, test } from "vitest";

import ArticleTableOfContents from "../../../../../src/components/articles/toc/ArticleTableOfContents.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

const headings = [
  {
    depth: 2,
    href: "#first-heading",
    id: "first-heading",
    level: 1,
    order: 0,
    text: "First Heading",
  },
  {
    depth: 3,
    href: "#nested-heading",
    id: "nested-heading",
    level: 2,
    order: 1,
    text: "Nested Heading",
  },
] as const;

describe("ArticleTableOfContents", () => {
  test("renders a labeled rail details navigation for useful heading lists", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleTableOfContents, {
      props: { headings },
    });

    expect(view).toContain('aria-label="Article table of contents"');
    expect(view).toContain("data-article-toc");
    expect(view).toContain('data-article-toc-placement="rail"');
    expect(view).toContain("<details");
    expect(view).toContain("open");
    expect(view).toContain('href="#first-heading"');
    expect(view).toContain('href="#nested-heading"');
  });

  test("renders an inline placement for narrow reading bodies", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleTableOfContents, {
      props: { headings, placement: "inline" },
    });

    expect(view).toContain('data-article-toc-placement="inline"');
    expect(view).toContain("xl:hidden");
    expect(view).toMatch(/<details[^>]* open/u);
    expect(view).toContain("data-toc-inline-heading");
    expect(view).toContain("Contents");
    expect(view).toContain("Hide");
    expect(view).toContain('data-toc-link-placement="inline"');
    expect(view).toContain('data-toc-section-label="1"');
    expect(view).toContain('data-toc-section-label="1.1"');
    expect(view).not.toContain("border-s");
  });

  test("keeps rail placement unnumbered", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleTableOfContents, {
      props: { headings, placement: "rail" },
    });

    expect(view).toContain('data-article-toc-placement="rail"');
    expect(view).not.toContain("data-toc-section-label");
    expect(view).toContain("border-s");
  });

  test("renders compact inline collapsed markup when explicitly closed", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleTableOfContents, {
      props: { headings, initiallyOpen: false, placement: "inline" },
    });

    expect(view).toContain('data-article-toc-placement="inline"');
    expect(view).toContain("data-toc-inline-closed-label");
    expect(view).toContain("Show Contents");
    expect(view).not.toContain("<details open");
    expect(view).not.toContain("border-s");
  });

  test("renders collapsed markup when initially closed", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleTableOfContents, {
      props: { headings, initiallyOpen: false },
    });

    expect(view).toContain("<details");
    expect(view).not.toContain("<details open");
  });

  test("renders nothing for too few headings", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleTableOfContents, {
      props: { headings: [headings[0]] },
    });

    expect(view).not.toContain("data-article-toc");
  });
});
