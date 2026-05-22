import { describe, expect, test } from "vitest";

import ArticleCitationMenu from "../../../../../src/components/articles/actions/ArticleCitationMenu.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("ArticleCitationMenu", () => {
  test("renders an anchored citation popover with style buttons and one selected citation", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleCitationMenu, {
      props: {
        citation: {
          articleId: "article-title",
          canonicalUrl: "https://example.com/articles/article-title/",
          formats: [
            {
              id: "apa",
              label: "APA",
              text: "Author. (2022). Article Title.",
            },
            {
              id: "bibtex",
              label: "BibTeX",
              text: "@online{article-title}",
            },
            {
              id: "mla",
              label: "MLA",
              text: '"Article Title." The Philosopher\'s Meme.',
            },
          ],
          title: "Article Title",
        },
      },
    });

    expect(view).toContain('aria-label="Cite this article"');
    expect(view).toContain(">Cite</span>");
    expect(view).toContain("lucide-quote");
    expect(view).toContain("lucide-copy");
    expect(view).toContain("data-article-citation-menu");
    expect(view).toContain('data-anchor-preset="article-citation-menu"');
    expect(view).toContain("data-article-citation-trigger");
    expect(view).toContain('popover="auto"');
    expect(view).toContain("data-article-citation-panel");
    expect(view).toMatch(/\[(?:&|&#38;|&amp;):not\(:popover-open\)\]:hidden/);
    expect(view).toContain(
      "width: min(30rem, var(--anchor-max-width, calc(100vw - 2rem)));",
    );
    expect(view).toContain("data-article-citation-style-selector");
    expect(view).toContain("grid-cols-4");
    expect(view).toContain("gap-px");
    expect(view).toContain("bg-border");
    expect(view).toContain("data-article-citation-style-button");
    expect(view).toContain('data-article-citation-format-id="apa"');
    expect(view).toContain('data-article-citation-format-id="bibtex"');
    expect(view).toContain('data-article-citation-format-label="APA"');
    expect(view).toContain('aria-pressed="true"');
    expect(view).toContain('aria-pressed="false"');
    expect(view).toContain("data-article-citation-copy-text");
    expect(view).toContain("data-article-citation-text-block");
    expect(view).toContain("relative block w-full min-w-0 max-w-full");
    expect(view).toContain('id="article-citation-article-title-selected"');
    expect(view).toContain("absolute top-1.5 right-1.5");
    expect(view).toContain("empty:hidden");
    expect(view).toContain("Author. (2022). Article Title.");
    expect(view).toContain("@online{article-title}");
    expect(view).not.toContain("<textarea");
    expect(view).not.toContain("<details");
    expect(view).not.toContain("<summary");
    expect(view).toContain("Copy APA citation");
    expect(view).not.toContain("Copy BibTeX citation");
    expect(view).not.toContain("Copy MLA citation");
  });
});
