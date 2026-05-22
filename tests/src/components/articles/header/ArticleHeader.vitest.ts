import { describe, expect, test } from "vitest";

import ArticleHeader from "../../../../../src/components/articles/header/ArticleHeader.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("ArticleHeader", () => {
  test("renders article title, category, metadata, and description without tags", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleHeader, {
      props: {
        author: "Seong-Young Her",
        category: {
          href: "/categories/history/",
          title: "History",
        },
        citation: {
          articleId: "article-title",
          canonicalUrl: "https://example.com/articles/article-title/",
          formats: [
            {
              id: "bibtex",
              label: "BibTeX",
              text: "@online{article-title}",
            },
          ],
          title: "Article Title",
        },
        date: new Date("2022-04-06T23:58:10.000Z"),
        description: "Article description.",
        formattedDate: "April 6, 2022",
        pdf: {
          articleUrl: "https://thephilosophersmeme.com/articles/article-title/",
          authors: ["Seong-Young Her"],
          citationPdfUrl:
            "https://thephilosophersmeme.com/articles/article-title/article-title.pdf",
          pdfHref: "/articles/article-title/article-title.pdf",
          pdfOutputPath: "articles/article-title/article-title.pdf",
          publicationDate: new Date("2022-04-06T23:58:10.000Z"),
          publicationDateForScholar: "2022/04/06",
          title: "Article Title",
        },
        semanticDetails: {
          heading: "Review details",
          items: [{ label: "Reviewed", value: "Example Book" }],
        },
        share: {
          actions: [
            {
              copyText:
                "https://thephilosophersmeme.com/articles/article-title/",
              icon: "copy-link",
              id: "copy-link",
              kind: "copy",
              label: "Copy link",
            },
          ],
          articleUrl: "https://thephilosophersmeme.com/articles/article-title/",
          copyText: "https://thephilosophersmeme.com/articles/article-title/",
          title: "Article Title",
        },
        title: "Article Title",
      },
    });

    expect(view).toContain("<h1");
    expect(view).toContain("Article Title");
    expect(view).toContain("/categories/history/");
    expect(view).toContain('data-astro-prefetch="hover"');
    expect(view).toContain("data-article-kicker-row");
    expect(view).toContain("data-article-category-link");
    expect(view).toContain("data-article-meta-row");
    expect(view).toContain('aria-label="Cite this article"');
    expect(view).toContain(">Cite</span>");
    expect(view).toContain('data-anchor-preset="article-citation-menu"');
    expect(view).toContain('aria-label="Share this article"');
    expect(view).toContain(">Share</span>");
    expect(view).toContain('data-anchor-preset="article-action-menu"');
    expect(view).toContain('aria-label="Save PDF"');
    expect(view).toContain(">PDF</span>");
    expect(view).toContain('data-article-pdf-link="true"');
    expect(view).toContain('href="/articles/article-title/article-title.pdf"');
    expect(view).toContain("download");
    expect(view).toContain("print:hidden");
    expect(view).toContain("data-pdf-exclude");
    expect(view).toContain("data-article-pdf-canonical");
    expect(view).toContain("data-article-pdf-disclaimer");
    expect(view).toContain(
      "https://thephilosophersmeme.com/articles/article-title/",
    );
    expect(view).toContain("static export of the canonical web article");
    expect(view).toContain("Article description.");
    expect(view).toContain("data-semantic-details");
    expect(view).toContain("Review details");
    expect(view).toContain("Example Book");
    expect(view).not.toContain("Article tags");
  });

  test("omits the PDF action and print canonical line when PDF data is unavailable", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleHeader, {
      props: {
        author: "Seong-Young Her",
        citation: {
          articleId: "article-title",
          canonicalUrl: "https://example.com/articles/article-title/",
          formats: [
            {
              id: "bibtex",
              label: "BibTeX",
              text: "@online{article-title}",
            },
          ],
          title: "Article Title",
        },
        date: new Date("2022-04-06T23:58:10.000Z"),
        formattedDate: "April 6, 2022",
        title: "Article Title",
      },
    });

    expect(view).toContain('aria-label="Cite this article"');
    expect(view).not.toContain('aria-label="Share this article"');
    expect(view).not.toContain('aria-label="Save PDF"');
    expect(view).not.toContain("data-article-pdf-link");
    expect(view).not.toContain("data-article-pdf-canonical");
    expect(view).not.toContain("data-article-pdf-disclaimer");
  });
});
