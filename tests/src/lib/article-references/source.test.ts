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
