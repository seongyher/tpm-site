import { describe, expect, test } from "bun:test";

import {
  articleScholarMetaViewModel,
  scholarPublicationDate,
} from "../../../src/lib/article-scholar-meta";
import { articleEntry } from "../../helpers/content";

describe("article Scholar metadata", () => {
  test("formats Scholar publication dates with UTC calendar fields", () => {
    expect(scholarPublicationDate(new Date("2021-11-30T23:58:10.000Z"))).toBe(
      "2021/11/30",
    );
  });

  test("builds Scholar metadata from structured authors when available", () => {
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
      }),
    ).toEqual({
      abstract: "A cluster definition.",
      authors: ["Claudia Vulliamy"],
      keywords: ["memes", "definition"],
      language: "en",
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

    expect(articleScholarMetaViewModel({ article }).authors).toEqual([
      "Legacy Author",
    ]);
  });
});
