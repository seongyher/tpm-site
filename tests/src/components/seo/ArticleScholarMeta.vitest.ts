import { describe, expect, test } from "vitest";

import ArticleScholarMeta from "../../../../src/components/seo/ArticleScholarMeta.astro";
import { createAstroTestContainer } from "../../../helpers/astro-container";

describe("ArticleScholarMeta", () => {
  test("renders Highwire/Google Scholar article metadata", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleScholarMeta, {
      props: {
        metadata: {
          abstract: "Article abstract.",
          authors: ["First Author", "Second Author"],
          keywords: ["memes", "philosophy"],
          language: "en",
          pdf: {
            articleUrl:
              "https://thephilosophersmeme.com/articles/article-title/",
            authors: ["First Author", "Second Author"],
            citationPdfUrl:
              "https://thephilosophersmeme.com/articles/article-title/article-title.pdf",
            pdfHref: "/articles/article-title/article-title.pdf",
            pdfOutputPath: "articles/article-title/article-title.pdf",
            publicationDate: new Date("2022-04-06T23:58:10.000Z"),
            publicationDateForScholar: "2022/04/06",
            title: "Article Title",
          },
          publicationDate: new Date("2022-04-06T23:58:10.000Z"),
          publicationDateForScholar: "2022/04/06",
          references: ["Author. Source title."],
          title: "Article Title",
        },
      },
    });

    expect(view).toContain('name="citation_title" content="Article Title"');
    expect(view).toContain('name="citation_language" content="en"');
    expect(view).toContain(
      'name="citation_abstract" content="Article abstract."',
    );
    expect(view).toContain(
      'name="citation_keywords" content="memes; philosophy"',
    );
    expect(view).toContain('name="citation_author" content="First Author"');
    expect(view).toContain('name="citation_author" content="Second Author"');
    expect(view).toContain(
      'name="citation_publication_date" content="2022/04/06"',
    );
    expect(view).toContain(
      'name="citation_pdf_url" content="https://thephilosophersmeme.com/articles/article-title/article-title.pdf"',
    );
    expect(view).toContain(
      'name="citation_reference" content="Author. Source title."',
    );
  });

  test("keeps base Scholar metadata when PDF output is disabled", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleScholarMeta, {
      props: {
        metadata: {
          abstract: "Article abstract.",
          authors: ["First Author"],
          keywords: [],
          language: "en",
          pdf: undefined,
          publicationDate: new Date("2022-04-06T23:58:10.000Z"),
          publicationDateForScholar: "2022/04/06",
          references: [],
          title: "Article Title",
        },
      },
    });

    expect(view).toContain('name="citation_title" content="Article Title"');
    expect(view).toContain('name="citation_author" content="First Author"');
    expect(view).toContain(
      'name="citation_publication_date" content="2022/04/06"',
    );
    expect(view).not.toContain("citation_pdf_url");
    expect(view).not.toContain("citation_keywords");
    expect(view).not.toContain("citation_reference");
  });
});
