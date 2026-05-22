import { describe, expect, test } from "bun:test";

import {
  articlePdfEnabled,
  articlePdfHref,
  articlePdfOutputPath,
  articlePdfViewModel,
  articleScholarMetaViewModel,
  scholarPublicationDate,
} from "../../../../src/lib/articles/article-pdf";
import { articleEntry } from "../../../helpers/content";

describe("article PDF helpers", () => {
  test("build same-directory public and output paths from article slugs", () => {
    expect(articlePdfHref("what-is-a-meme")).toBe(
      "/articles/what-is-a-meme/what-is-a-meme.pdf",
    );
    expect(articlePdfOutputPath("what-is-a-meme")).toBe(
      "articles/what-is-a-meme/what-is-a-meme.pdf",
    );
  });

  test("derives PDF paths from configurable article route roots", () => {
    expect(articlePdfHref("post", "/writing")).toBe("/writing/post/post.pdf");
    expect(articlePdfOutputPath("post", "/writing")).toBe(
      "writing/post/post.pdf",
    );
    expect(articlePdfHref("post", "/")).toBe("/post/post.pdf");
    expect(articlePdfOutputPath("post", "/")).toBe("post/post.pdf");
  });

  test("formats Scholar publication dates with UTC calendar fields", () => {
    expect(scholarPublicationDate(new Date("2021-11-30T23:58:10.000Z"))).toBe(
      "2021/11/30",
    );
  });

  test("builds Scholar metadata and PDF data from structured authors when available", () => {
    const article = articleEntry({
      data: {
        author: "Legacy Author",
        description: "A cluster definition.",
        tags: ["memes", "definition"],
        title: "What Is A Meme?",
      },
      date: new Date("2021-11-30T23:58:10.000Z"),
      id: "what-is-a-meme",
    });

    expect(
      articleScholarMetaViewModel({
        article,
        authors: [
          {
            displayName: "Claudia Vulliamy",
            href: "/authors/claudia-vulliamy/",
            id: "claudia-vulliamy",
            type: "person",
          },
        ],
        site: "https://thephilosophersmeme.com",
      }),
    ).toEqual({
      abstract: "A cluster definition.",
      authors: ["Claudia Vulliamy"],
      keywords: ["memes", "definition"],
      language: "en",
      pdf: {
        articleUrl: "https://thephilosophersmeme.com/articles/what-is-a-meme/",
        authors: ["Claudia Vulliamy"],
        citationPdfUrl:
          "https://thephilosophersmeme.com/articles/what-is-a-meme/what-is-a-meme.pdf",
        pdfHref: "/articles/what-is-a-meme/what-is-a-meme.pdf",
        pdfOutputPath: "articles/what-is-a-meme/what-is-a-meme.pdf",
        publicationDate: new Date("2021-11-30T23:58:10.000Z"),
        publicationDateForScholar: "2021/11/30",
        title: "What Is A Meme?",
      },
      publicationDate: new Date("2021-11-30T23:58:10.000Z"),
      publicationDateForScholar: "2021/11/30",
      references: [],
      title: "What Is A Meme?",
    });
  });

  test("derives deterministic citation_reference values from article references", () => {
    const article = articleEntry({ id: "cited-article" });

    expect(
      articleScholarMetaViewModel({
        article,
        articleReferences: {
          citations: [
            {
              bibtex: {
                entryType: "article",
                fields: {},
                key: "source",
                normalizedKey: "source",
                raw: "@article{source}",
              },
              definition: {
                children: [
                  {
                    children: [],
                    kind: "paragraph",
                    text: "Author. Source title.",
                  },
                ],
              },
              displayLabel: "1",
              id: "cite-source",
              kind: "citation",
              label: "cite-source",
              order: 1,
              references: [],
            },
          ],
          notes: [],
        },
      }).references,
    ).toEqual(["Author. Source title."]);
  });

  test("falls back to the legacy byline when structured authors are unavailable", () => {
    const article = articleEntry({
      data: {
        author: "Legacy Author",
      },
      id: "legacy-byline",
    });

    expect(articlePdfViewModel({ article })?.authors).toEqual([
      "Legacy Author",
    ]);
  });

  test("omits PDF data when an article explicitly disables generated PDFs", () => {
    const article = articleEntry({
      data: {
        author: "Legacy Author",
        pdf: false,
      },
      id: "web-only",
    });

    expect(articlePdfEnabled(article)).toBe(false);
    expect(articlePdfViewModel({ article })).toBeUndefined();
    expect(articleScholarMetaViewModel({ article })).toMatchObject({
      authors: ["Legacy Author"],
      pdf: undefined,
      title: "Sample Article",
    });
  });
});
