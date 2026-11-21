import { describe, expect, test } from "bun:test";

import {
  articleApaCitation,
  articleBibtexCitation,
  articleChicagoAuthorDateCitation,
  articleChicagoNotesCitation,
  articleCitationMenuViewModel,
  articleHarvardCitation,
  articleIeeeCitation,
  articleMlaCitation,
  articleRisCitation,
} from "../../../../src/lib/citations/article-citation";
import { citationTitleParts } from "../../../../src/lib/citations/citation-preview";

const publishedAt = new Date("2022-04-06T23:58:10.000Z");

describe("article citation helpers", () => {
  test("generates deterministic popular citation formats from structured author data", () => {
    const input = {
      articleId: "wittgensteins-most-beloved-quote-was-real-but-its-fake-now",
      authors: [
        {
          displayName: "Seong-Young Her",
          type: "person",
        },
      ],
      canonicalUrl:
        "https://thephilosophersmeme.com/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/",
      legacyAuthor: "Fallback Author",
      publishedAt,
      title: "Wittgenstein's Most Beloved Quote Was Real, But It's Fake Now",
    } as const;

    expect(articleBibtexCitation(input)).toContain(
      "@online{site-wittgensteins-most-beloved-quote-was-real-but-its-fake-now,",
    );
    expect(articleBibtexCitation(input)).toContain(
      "  author = {Seong-Young Her},",
    );
    expect(articleBibtexCitation(input)).toContain("  date = {2022-04-06},");
    expect(articleApaCitation(input)).toBe(
      "Her, S.-Y. (2022, April 6). Wittgenstein's Most Beloved Quote Was Real, But It's Fake Now. The Philosopher's Meme. https://thephilosophersmeme.com/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/",
    );
    expect(articleMlaCitation(input)).toBe(
      "Her, Seong-Young. \"Wittgenstein's Most Beloved Quote Was Real, But It's Fake Now.\" The Philosopher's Meme, 6 Apr. 2022, https://thephilosophersmeme.com/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/.",
    );
    expect(articleChicagoNotesCitation(input)).toBe(
      "Her, Seong-Young. \"Wittgenstein's Most Beloved Quote Was Real, But It's Fake Now.\" The Philosopher's Meme. April 6, 2022. https://thephilosophersmeme.com/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/.",
    );
    expect(articleChicagoAuthorDateCitation(input)).toBe(
      "Her, Seong-Young. 2022. \"Wittgenstein's Most Beloved Quote Was Real, But It's Fake Now.\" The Philosopher's Meme. April 6, 2022. https://thephilosophersmeme.com/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/.",
    );
    expect(articleHarvardCitation(input)).toBe(
      "Her, S.-Y. (2022) 'Wittgenstein's Most Beloved Quote Was Real, But It's Fake Now', The Philosopher's Meme, 6 April 2022. Available at: https://thephilosophersmeme.com/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/.",
    );
    expect(articleIeeeCitation(input)).toBe(
      "S.-Y. Her, \"Wittgenstein's Most Beloved Quote Was Real, But It's Fake Now,\" The Philosopher's Meme, Apr. 6, 2022. [Online]. Available: https://thephilosophersmeme.com/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/",
    );
    expect(articleRisCitation(input)).toBe(
      [
        "TY  - ELEC",
        "TI  - Wittgenstein's Most Beloved Quote Was Real, But It's Fake Now",
        "AU  - Her, Seong-Young",
        "T2  - The Philosopher's Meme",
        "DA  - 2022-04-06",
        "UR  - https://thephilosophersmeme.com/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/",
        "ER  -",
      ].join("\n"),
    );
  });

  test("marks the correct title when author, article, and publication names match", () => {
    const title = "What is a meme? 🗞️";
    const canonicalUrl = "https://example.com/articles/what-is-a-meme/";
    const { formats } = articleCitationMenuViewModel({
      articleId: "what-is-a-meme",
      authors: [{ displayName: title, type: "organization" }],
      canonicalUrl,
      publishedAt,
      siteTitle: title,
      title,
    });

    expect(
      Object.fromEntries(
        formats.map(({ id, italicTitle, text }) => [
          id,
          citationTitleParts(text, italicTitle)?.before,
        ]),
      ),
    ).toEqual({
      apa: `${title} (2022, April 6). `,
      mla: `${title}. "${title}." `,
      "chicago-notes": `${title}. "${title}." `,
      "chicago-author-date": `${title}. 2022. "${title}." `,
      harvard: `${title} (2022) '${title}', `,
      ieee: undefined,
      bibtex: undefined,
      ris: undefined,
    });

    expect(
      formats.flatMap(({ italicTitle, text }) => {
        const parts = citationTitleParts(text, italicTitle);

        return parts === undefined ? [] : [parts.title];
      }),
    ).toEqual([title, title, title, title, title]);
  });

  test("escapes BibTeX fields and falls back to legacy bylines", () => {
    const citation = articleBibtexCitation({
      articleId: "Symbols & Things",
      canonicalUrl: "https://example.com/articles/symbols/",
      legacyAuthor: "A. Writer & B. Writer",
      publishedAt,
      siteTitle: "TPM & Friends",
      title: "Symbols {and} 100% Meme_Tests",
    });

    expect(citation).toContain("@online{site-symbols-things,");
    expect(citation).toContain("  author = {A. Writer and B. Writer},");
    expect(citation).toContain(
      "  title = {Symbols \\{and\\} 100\\% Meme\\_Tests},",
    );
    expect(citation).toContain("  organization = {TPM \\& Friends},");
  });

  test("handles organizations, anonymous entries, and more than two authors deterministically", () => {
    expect(
      articleMlaCitation({
        articleId: "organization",
        authors: [
          {
            displayName: "The Philosopher's Meme",
            type: "organization",
          },
        ],
        canonicalUrl: "https://example.com/articles/organization/",
        publishedAt,
        title: "Organizational Writing",
      }).startsWith('The Philosopher\'s Meme. "Organizational Writing."'),
    ).toBe(true);

    expect(
      articleMlaCitation({
        articleId: "many",
        authors: [
          { displayName: "First Author", type: "person" },
          { displayName: "Second Author", type: "person" },
          { displayName: "Third Author", type: "person" },
        ],
        canonicalUrl: "https://example.com/articles/many/",
        publishedAt,
        title: "Many Authors",
      }).startsWith('Author, First, et al. "Many Authors."'),
    ).toBe(true);

    expect(
      articleCitationMenuViewModel({
        articleId: "anonymous",
        canonicalUrl: "https://example.com/articles/anonymous/",
        publishedAt,
        title: "Anonymous Article",
      }).formats.map((format) => format.id),
    ).toEqual([
      "apa",
      "mla",
      "chicago-notes",
      "chicago-author-date",
      "harvard",
      "ieee",
      "bibtex",
      "ris",
    ]);
  });
});
