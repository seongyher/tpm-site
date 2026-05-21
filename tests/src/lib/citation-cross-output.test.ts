import { describe, expect, test } from "bun:test";

import { articleScholarMetaViewModel } from "../../../src/lib/article-pdf";
import type {
  ArticleReferenceData,
  ArticleReferenceOccurrenceInput,
  ParsedBibtexEntry,
} from "../../../src/lib/article-references/model";
import { normalizeArticleReferences } from "../../../src/lib/article-references/normalize";
import {
  citationSourceBibtexExport,
  citationSourceCslJson,
  citationSourceRisExport,
  normalizedCitationSource,
} from "../../../src/lib/article-references/source";
import { bibliographyEntriesFromArticleReferences } from "../../../src/lib/bibliography";
import { articleEntry } from "../../helpers/content";

describe("citation cross-output model", () => {
  test("feeds one normalized source into bibliography, Scholar metadata, and exports", () => {
    const article = articleEntry({
      data: {
        title: "Cited Article",
      },
      id: "cited-article",
    });
    const references = normalizedReferences();
    const [citation] = references.citations;

    if (citation === undefined) {
      throw new Error("Expected normalized citation fixture.");
    }

    const source = normalizedCitationSource(citation.bibtex);
    const [bibliographyEntry] = bibliographyEntriesFromArticleReferences([
      { article, references },
    ]);
    const scholar = articleScholarMetaViewModel({
      article,
      articleReferences: references,
    });

    expect(source.identity).toEqual({
      confidence: "exact",
      key: "doi:10.1086/288811",
    });
    expect(bibliographyEntry?.sourceKey).toBe(source.identity.key);
    expect(bibliographyEntry?.sourceUrl).toBe("https://doi.org/10.1086/288811");
    expect(bibliographyEntry?.display).toMatchObject({
      authors: "Hull, David L.",
      containerTitle: "Philosophy of Science",
      doi: "10.1086/288811",
      title: "A Matter of Individuality",
      year: "1978",
    });
    expect(bibliographyEntry?.sourceArticles[0]?.markerIds).toEqual([
      "cite-ref-hull-1978",
      "cite-ref-hull-1978-2",
    ]);
    expect(scholar.references).toEqual([
      "Hull, D. L. (1978). A Matter of Individuality. Philosophy of Science.",
    ]);
    expect(citationSourceBibtexExport(source)).toContain(
      "  doi = {10.1086/288811},",
    );
    expect(citationSourceRisExport(source)).toContain("DO  - 10.1086/288811");
    expect(citationSourceCslJson(source)).toMatchObject({
      DOI: "10.1086/288811",
      "container-title": "Philosophy of Science",
      type: "article-journal",
    });
  });

  test("keeps no-reference articles quiet across citation outputs", () => {
    const article = articleEntry({ id: "plain-article" });
    const references: ArticleReferenceData = { citations: [], notes: [] };

    expect(
      bibliographyEntriesFromArticleReferences([{ article, references }]),
    ).toEqual([]);
    expect(
      articleScholarMetaViewModel({ article, articleReferences: references })
        .references,
    ).toEqual([]);
  });
});

function normalizedReferences(): ArticleReferenceData {
  const result = normalizeArticleReferences(
    [reference("cite-hull-1978"), reference("cite-hull-1978")],
    [],
    [
      bibtex("hull-1978", {
        author: "Hull, David L.",
        citation:
          "Hull, D. L. (1978). A Matter of Individuality. Philosophy of Science.",
        doi: "10.1086/288811",
        journal: "Philosophy of Science",
        number: "3",
        pages: "335--360",
        title: "A Matter of Individuality",
        volume: "45",
        year: "1978",
      }),
    ],
  );

  if (!result.ok) {
    throw new Error("Expected normalized citation fixture.");
  }

  return result.data;
}

function reference(label: string): ArticleReferenceOccurrenceInput {
  return { label };
}

function bibtex(
  key: string,
  fields: Readonly<Record<string, string>>,
): ParsedBibtexEntry {
  return {
    entryType: "article",
    fields,
    key,
    normalizedKey: key.toLowerCase(),
    raw: `@article{${key}}`,
  };
}
