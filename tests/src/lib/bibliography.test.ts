import { describe, expect, test } from "bun:test";

import type {
  ArticleCitation,
  ArticleReferenceLabel,
} from "../../../src/lib/article-references/model";
import { bibliographyEntriesFromArticleReferences } from "../../../src/lib/bibliography";
import { articleEntry } from "../../helpers/content";

describe("bibliography aggregation", () => {
  test("groups sources by normalized DOI and preserves citing article backlinks", () => {
    const entries = bibliographyEntriesFromArticleReferences([
      {
        article: articleEntry({
          data: { date: new Date("2021-01-01T00:00:00.000Z") },
          id: "earlier-article",
        }),
        references: {
          citations: [
            citation("baudrillard-1981", {
              author: "Baudrillard, Jean",
              doi: "10.1000/ABC",
              title: "Simulacra and Simulation",
              year: "1981",
            }),
          ],
          notes: [],
        },
      },
      {
        article: articleEntry({
          data: { date: new Date("2022-01-01T00:00:00.000Z") },
          id: "later-article",
        }),
        references: {
          citations: [
            citation("local-baudrillard-key", {
              author: "Baudrillard, Jean",
              doi: "https://doi.org/10.1000/abc",
              title: "Simulacra and Simulation",
              year: "1981",
            }),
          ],
          notes: [],
        },
      },
    ]);

    const [entry] = entries;

    expect(entries).toHaveLength(1);
    expect(entry?.sourceKey).toBe("doi:10.1000/abc");
    expect(entry?.sourceUrl).toBe("https://doi.org/10.1000/abc");
    expect(entry?.sourceArticles.map((article) => article.href)).toEqual([
      "/articles/later-article/",
      "/articles/earlier-article/",
    ]);
    expect(entry?.sourceArticles[0]?.markerIds).toEqual([
      "cite-ref-local-baudrillard-key",
    ]);
  });

  test("merges repeated source backlinks within the same article", () => {
    const entries = bibliographyEntriesFromArticleReferences([
      {
        article: articleEntry({
          data: { date: new Date("2023-01-01T00:00:00.000Z") },
          id: "repeated-source-article",
        }),
        references: {
          citations: [
            citation("first-marker", {
              author: "Writer, A.",
              doi: "10.1000/repeated",
              title: "Repeated Source",
              year: "2023",
            }),
            citation("second-marker", {
              author: "Writer, A.",
              doi: "10.1000/repeated",
              title: "Repeated Source",
              year: "2023",
            }),
          ],
          notes: [],
        },
      },
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.sourceArticles).toHaveLength(1);
    expect(entries[0]?.sourceArticles[0]?.markerIds).toEqual([
      "cite-ref-first-marker",
      "cite-ref-second-marker",
    ]);
  });

  test("groups sources by exact URL before falling back to fingerprints", () => {
    const entries = bibliographyEntriesFromArticleReferences([
      {
        article: articleEntry({ id: "first" }),
        references: {
          citations: [
            citation("source-a", {
              author: "Author, One",
              title: "Shared URL Source",
              url: "https://example.com/shared",
              year: "2020",
            }),
            citation("source-b", {
              author: "Author, One",
              title: "Shared Fingerprint Source",
              year: "2020",
            }),
          ],
          notes: [],
        },
      },
      {
        article: articleEntry({ id: "second" }),
        references: {
          citations: [
            citation("local-source-a", {
              author: "Author, One",
              title: "Different title with the same URL",
              url: "https://example.com/shared",
              year: "2022",
            }),
            citation("local-source-b", {
              author: "Author, One",
              title: "Shared Fingerprint Source",
              year: "2020",
            }),
          ],
          notes: [],
        },
      },
    ]);

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.sourceArticles.length)).toEqual([2, 2]);
    expect(entries.map((entry) => entry.sourceKey)).toEqual([
      "fingerprint:book:author, one:2020:shared fingerprint source",
      "url:https://example.com/shared",
    ]);
  });

  test("keeps incomplete source records separate instead of guessing duplicates", () => {
    const entries = bibliographyEntriesFromArticleReferences([
      {
        article: articleEntry({ id: "first" }),
        references: {
          citations: [citation("fragment-a", { note: "Incomplete source" })],
          notes: [],
        },
      },
      {
        article: articleEntry({ id: "second" }),
        references: {
          citations: [citation("fragment-b", { note: "Incomplete source" })],
          notes: [],
        },
      },
    ]);

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.sourceKey)).toEqual([
      "exact\nbook\nfragment-a\nnote=incomplete source",
      "exact\nbook\nfragment-b\nnote=incomplete source",
    ]);
  });

  test("ignores articles without normalized citations", () => {
    expect(
      bibliographyEntriesFromArticleReferences([
        {
          article: articleEntry({ id: "no-references" }),
          references: undefined,
        },
        {
          article: articleEntry({ id: "notes-only" }),
          references: { citations: [], notes: [] },
        },
      ]),
    ).toEqual([]);
  });
});

function citation(
  key: string,
  fields: Readonly<Record<string, string>>,
): ArticleCitation {
  const label = `cite-${key}` as ArticleReferenceLabel;
  const sourceText = sourceTextFromFields(fields, key);

  return {
    bibtex: {
      entryType: "book",
      fields,
      key,
      normalizedKey: key.toLowerCase(),
      raw: `@book{${key}}`,
    },
    definition: {
      children: [
        {
          children: [{ kind: "text", text: sourceText }],
          kind: "paragraph",
          text: sourceText,
        },
      ],
    },
    id: label,
    kind: "citation",
    label,
    order: 1,
    references: [
      {
        backlinkId: `cite-backref-${key}`,
        displayText: fieldValue(fields, "year") ?? key,
        entryId: label,
        id: `cite-ref-${key}`,
        kind: "citation",
        label,
        order: 1,
      },
    ],
  };
}

function sourceTextFromFields(
  fields: Readonly<Record<string, string>>,
  fallback: string,
): string {
  return [
    fieldValue(fields, "author"),
    fieldValue(fields, "title") ?? fallback,
    fieldValue(fields, "publisher"),
    fieldValue(fields, "year"),
    fieldValue(fields, "url"),
    fieldValue(fields, "doi"),
  ]
    .filter((value) => value !== undefined && value !== "")
    .join(". ");
}

function fieldValue(
  fields: Readonly<Record<string, string>>,
  name: string,
): string | undefined {
  return Object.entries(fields).find(([key]) => key === name)?.[1];
}
