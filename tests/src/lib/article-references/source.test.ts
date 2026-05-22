import { describe, expect, test } from "bun:test";

import type { ParsedBibtexEntry } from "../../../../src/lib/article-references/model";
import {
  citationSourceBibtexExport,
  citationSourceCslJson,
  citationSourceIdentity,
  citationSourceIdentityKey,
  citationSourceRisExport,
  normalizedCitationSource,
} from "../../../../src/lib/article-references/source";

describe("citation source normalization", () => {
  test("normalizes article source fields and exact DOI identity", () => {
    const source = normalizedCitationSource(
      bibtex("article", "hull-1978", {
        author: "Hull, David L.",
        doi: "https://doi.org/10.1086/288811",
        journal: "Philosophy of Science",
        number: "3",
        pages: "335--360",
        title: "A Matter of Individuality",
        volume: "45",
        year: "1978",
      }),
    );

    expect(source).toMatchObject({
      authors: ["Hull, David L."],
      containerTitle: "Philosophy of Science",
      doi: "10.1086/288811",
      identity: {
        confidence: "exact",
        key: "doi:10.1086/288811",
      },
      pages: "335--360",
      sourceType: "article",
      title: "A Matter of Individuality",
      year: "1978",
    });
  });

  test("uses strong identities for verified fingerprints and exact keys for weak matches", () => {
    const strong = bibtex("book", "first", {
      author: "Author, Example",
      title: "Same Source",
      year: "2020",
    });
    const weak = bibtex("book", "second", {
      author: "Author, Example",
      title: "Same Source",
    });

    expect(citationSourceIdentity(strong)).toEqual({
      confidence: "strong",
      key: "fingerprint:book:author, example:2020:same source",
    });
    expect(citationSourceIdentity(weak)).toEqual({
      confidence: "weak",
      key: "possible:book:author, example:same source",
    });
    expect(citationSourceIdentityKey(weak)).toBe(
      "exact\nbook\nsecond\nauthor=author, example\ntitle=same source",
    );
  });

  test("exports normalized sources as BibTeX, RIS, and CSL-like JSON", () => {
    const source = normalizedCitationSource(
      bibtex("online", "video-source", {
        author: "Creator, Example",
        date: "2024-03-02",
        title: "Example Video",
        url: "https://example.com/video",
        urldate: "2026-05-20",
      }),
    );

    expect(citationSourceBibtexExport(source)).toBe(
      [
        "@online{video-source,",
        "  author = {Creator, Example},",
        "  date = {2024-03-02},",
        "  title = {Example Video},",
        "  url = {https://example.com/video},",
        "  urldate = {2026-05-20},",
        "}",
      ].join("\n"),
    );
    expect(citationSourceRisExport(source)).toBe(
      [
        "TY  - ELEC",
        "AU  - Creator, Example",
        "TI  - Example Video",
        "PY  - 2024",
        "DA  - 2024-03-02",
        "UR  - https://example.com/video",
        "Y2  - 2026-05-20",
        "ER  -",
      ].join("\n"),
    );
    expect(citationSourceCslJson(source)).toEqual({
      URL: "https://example.com/video",
      accessed: { "date-parts": [[2026, 5, 20]] },
      author: [{ family: "Creator", given: "Example" }],
      id: "video-source",
      issued: { "date-parts": [[2024, 3, 2]] },
      title: "Example Video",
      type: "webpage",
    });
  });

  test("normalizes source type variants and defensive export fallbacks", () => {
    const typeCases = [
      ["article", "article", "JOUR", "article-journal"],
      ["book", "book", "BOOK", "book"],
      ["dataset", "dataset", "DATA", "dataset"],
      ["inbook", "chapter", "CHAP", "chapter"],
      ["incollection", "chapter", "CHAP", "chapter"],
      ["inproceedings", "conference-paper", "CPAPER", "paper-conference"],
      ["proceedings", "conference-paper", "CPAPER", "paper-conference"],
      ["software", "software", "COMP", "software"],
      ["www", "web", "ELEC", "webpage"],
      ["misc", "misc", "GEN", "document"],
    ] as const;

    expect(
      typeCases.map(([entryType]) => {
        const source = normalizedCitationSource(
          bibtex(entryType, `${entryType}-source`, {
            title: "Typed Source",
          }),
        );

        return {
          cslType: citationSourceCslJson(source).type,
          risType: citationSourceRisExport(source).split("\n").at(0),
          sourceType: source.sourceType,
        };
      }),
    ).toEqual(
      typeCases.map(([, sourceType, risType, cslType]) => ({
        cslType,
        risType: `TY  - ${risType}`,
        sourceType,
      })),
    );

    const chapter = normalizedCitationSource(
      bibtex("incollection", "chapter-source", {
        booktitle: "Collected Work",
        editor: "Editor, Example and Mononym",
        isbn: "978-0-00-000000-0",
        pages: "10--20",
        publisher: "Example Press",
        title: "{Nested} Source",
        year: "2020",
      }),
    );

    expect(chapter).toMatchObject({
      containerTitle: "Collected Work",
      editors: ["Editor, Example", "Mononym"],
      identity: {
        confidence: "exact",
        key: "isbn:978-0-00-000000-0",
      },
      isbn: "978-0-00-000000-0",
      publisher: "Example Press",
      title: "Nested Source",
    });
    expect(citationSourceBibtexExport(chapter)).toContain(
      "  title = {\\{Nested\\} Source},",
    );
    expect(citationSourceCslJson(chapter)).toMatchObject({
      ISBN: "978-0-00-000000-0",
      "container-title": "Collected Work",
      editor: [{ family: "Editor", given: "Example" }, { literal: "Mononym" }],
      issued: { "date-parts": [[2020]] },
      page: "10--20",
      publisher: "Example Press",
      type: "chapter",
    });

    const invalidDates = citationSourceCslJson(
      normalizedCitationSource(
        bibtex("software", "bad-dates", {
          author: "No Comma Name",
          date: "2024-13-40",
          title: "Bad Dates",
          urldate: "not-a-date",
        }),
      ),
    );

    expect(invalidDates).toEqual({
      author: [{ literal: "No Comma Name" }],
      id: "bad-dates",
      title: "Bad Dates",
      type: "software",
    });
  });
});

function bibtex(
  entryType: string,
  key: string,
  fields: Readonly<Record<string, string>>,
): ParsedBibtexEntry {
  return {
    entryType,
    fields,
    key,
    normalizedKey: key.toLowerCase(),
    raw: `@${entryType}{${key}}`,
  };
}
