import { describe, expect, test } from "bun:test";

import type {
  ArticleReferenceBlockContent,
  ArticleReferenceDefinitionInput,
  ArticleReferenceInlineContent,
  ArticleReferenceOccurrenceInput,
  ParsedBibtexEntry,
} from "../../../../src/lib/article-references/model";
import {
  classifyArticleReferenceLabel,
  normalizeArticleReferences,
} from "../../../../src/lib/article-references/normalize";

describe("article reference label classification", () => {
  test("accepts canonical note and citation labels", () => {
    expect(classifyArticleReferenceLabel("note-term-scope")).toEqual({
      kind: "note",
      label: "note-term-scope",
    });
    expect(classifyArticleReferenceLabel("cite-baudrillard-1981")).toEqual({
      kind: "citation",
      label: "cite-baudrillard-1981",
    });
  });

  test("rejects noncanonical labels", () => {
    for (const label of [
      "source-1",
      "note",
      "cite-",
      "cite-Baudrillard",
      "note-term_scope",
      "note--term",
      "note-term-",
    ]) {
      expect(classifyArticleReferenceLabel(label)).toBeUndefined();
    }
  });
});

describe("article reference normalization", () => {
  test("normalizes notes and citations by first-reference order", () => {
    const result = normalizeArticleReferences(
      [
        reference("cite-second"),
        reference("note-context"),
        reference("cite-first"),
        reference("cite-second"),
      ],
      [definition("note-context", "Context note.")],
      [
        bibtex("first", {
          author: "First, A.",
          title: "First citation",
          year: "2019",
        }),
        bibtex("second", {
          author: "Second, B.",
          title: "Second citation with rich content",
          url: "https://example.com/second",
          year: "2020",
        }),
      ],
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected normalized article references.");
    }

    expect(result.data.citations.map((citation) => citation.label)).toEqual([
      "cite-second",
      "cite-first",
    ]);
    expect(result.data.notes.map((note) => note.label)).toEqual([
      "note-context",
    ]);
    expect(result.data.citations[0]?.displayLabel).toBe("Second 2020");
    expect(result.data.citations[0]?.references).toHaveLength(2);
    expect(
      result.data.citations[0]?.references.map((marker) => marker.id),
    ).toEqual(["cite-ref-second", "cite-ref-second-2"]);
    expect(result.data.citations[0]?.references[0]?.displayText).toBe("1");
    expect(result.data.notes[0]?.references[0]?.displayText).toBe("1");
    expect(result.data.citations[0]?.bibtex.key).toBe("second");

    const [firstDefinitionChild] =
      result.data.citations[0]?.definition.children ?? [];

    if (firstDefinitionChild?.kind !== "paragraph") {
      throw new Error("Expected paragraph definition content.");
    }

    expect(firstDefinitionChild.text).toContain("Second citation");
    expect(
      firstDefinitionChild.children.some((child) => child.kind === "link"),
    ).toBe(true);
  });

  test("fails invalid references before renderable data is returned", () => {
    const result = normalizeArticleReferences(
      [
        reference("source-1"),
        reference("cite-missing"),
        reference("note-repeat"),
        reference("note-repeat"),
      ],
      [
        definition("cite-missing", "Obsolete citation definition."),
        definition("note-repeat", "Repeated note."),
        definition("bad_label", "Bad label."),
        definition("cite-empty", ""),
        definition("cite-bad-display-label", "[@] Bad label."),
      ],
      [
        bibtex("unused", { title: "Bibliography-only citation" }),
        bibtex("unused", { title: "Duplicate citation" }),
      ],
    );

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("Expected diagnostics.");
    }

    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "invalid-label",
      "invalid-label",
      "citation-definition",
      "citation-definition",
      "citation-definition",
      "repeated-note-reference",
      "duplicate-bibtex-key",
      "missing-bibtex-entry",
    ]);
  });

  test("rejects malformed and empty note definitions before rendering", () => {
    const result = normalizeArticleReferences(
      [reference("note-bad-display-label"), reference("note-empty")],
      [
        definition("note-bad-display-label", "[@] Bad label."),
        definition("note-empty", ""),
      ],
      [],
    );

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("Expected malformed note definition diagnostics.");
    }

    expect(result.diagnostics).toEqual([
      {
        code: "malformed-display-label",
        label: "note-bad-display-label",
      },
      {
        code: "empty-definition",
        label: "note-empty",
      },
    ]);
  });

  test("keeps uncited BibTeX entries as bibliography-only sources", () => {
    const result = normalizeArticleReferences(
      [reference("cite-used")],
      [],
      [
        bibtex("used", { author: "Writer, A.", title: "Used", year: "2024" }),
        bibtex("source-list", {
          author: "Researcher, B.",
          title: "Source List Entry",
          year: "2020",
        }),
      ],
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected normalized bibliography-only citation.");
    }

    expect(result.data.citations.map((citation) => citation.label)).toEqual([
      "cite-used",
      "cite-source-list",
    ]);
    expect(result.data.citations[0]?.references).toHaveLength(1);
    expect(result.data.citations[1]?.references).toEqual([]);
    expect(result.data.citations[1]?.displayLabel).toBe("Researcher 2020");
  });

  test("uses literal citation fields to preserve source-list wording", () => {
    const result = normalizeArticleReferences(
      [],
      [],
      [
        bibtex("source-list", {
          author: "Researcher, B.",
          citation:
            "Researcher, B. (2020). Source List Entry. Journal, 1(2), 3-4.",
          title: "Source List Entry",
          year: "2020",
        }),
      ],
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected literal citation field to normalize.");
    }

    expect(result.data.citations[0]?.definition.children[0]?.text).toBe(
      "Researcher, B. (2020). Source List Entry. Journal, 1(2), 3-4.",
    );
  });

  test("links URL text inside literal citation fields", () => {
    const result = normalizeArticleReferences(
      [],
      [],
      [
        bibtex("source-list", {
          citation:
            "Researcher, B. (2020). Available at: <https://example.com/source path> and https://example.com/plain.",
        }),
      ],
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected literal citation URLs to normalize.");
    }

    const [definition] = result.data.citations[0]?.definition.children ?? [];

    if (definition?.kind !== "paragraph") {
      throw new Error("Expected paragraph definition content.");
    }

    const links = definition.children.filter((child) => child.kind === "link");

    expect(links).toEqual([
      {
        children: [{ kind: "text", text: "https://example.com/sourcepath" }],
        kind: "link",
        text: "https://example.com/sourcepath",
        url: "https://example.com/sourcepath",
      },
      {
        children: [{ kind: "text", text: "https://example.com/plain" }],
        kind: "link",
        text: "https://example.com/plain",
        url: "https://example.com/plain",
      },
    ]);
    expect(definition.text).toBe(
      "Researcher, B. (2020). Available at: <https://example.com/sourcepath> and https://example.com/plain.",
    );
  });

  test("derives readable citations from DOI, editor/date, and sparse BibTeX fields", () => {
    const result = normalizeArticleReferences(
      [
        reference("cite-doi-source"),
        reference("cite-edited-source"),
        reference("cite-key-only"),
      ],
      [],
      [
        bibtex("doi-source", {
          author: "Ada Lovelace",
          date: "1843-08-01",
          doi: "10.1234/example",
          title: "Analytical Notes",
        }),
        bibtex("edited-source", {
          booktitle: "Collected Meme Studies",
          date: "2021-03-04",
          editor: "Curator, C.",
          publisher: "Archive Press",
        }),
        bibtex("key-only", {}),
      ],
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected derived BibTeX citations to normalize.");
    }

    expect(
      result.data.citations.map((citation) => citation.displayLabel),
    ).toEqual(["Lovelace 1843", "Curator 2021", undefined]);

    const [doiDefinition, editedDefinition, sparseDefinition] =
      result.data.citations.map((citation) => citation.definition.children[0]);

    expect(doiDefinition?.text).toBe(
      "Ada Lovelace. Analytical Notes. 1843. 10.1234/example.",
    );
    assertInlineChildren(doiDefinition);
    expect(
      doiDefinition.children.some(
        (child) =>
          child.kind === "link" &&
          child.url === "https://doi.org/10.1234/example",
      ),
    ).toBe(true);
    expect(editedDefinition?.text).toBe(
      "Curator, C.. edited-source. Collected Meme Studies. Archive Press. 2021. ",
    );
    expect(sparseDefinition?.text).toBe("key-only. ");
  });

  test("rejects literal citation fields without source text", () => {
    const result = normalizeArticleReferences(
      [],
      [],
      [bibtex("source-placeholder", { citation: "^" })],
    );

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("Expected malformed literal citation diagnostic.");
    }

    expect(result.diagnostics).toEqual([
      {
        code: "malformed-bibtex",
        message:
          'Entry "source-placeholder" has an unusable literal citation field. Replace it with real source text or remove the entry.',
      },
    ]);
  });
});

function assertInlineChildren(
  value: ArticleReferenceBlockContent | undefined,
): asserts value is Extract<
  ArticleReferenceBlockContent,
  { readonly children: readonly ArticleReferenceInlineContent[] }
> {
  if (value === undefined || !("children" in value)) {
    throw new Error("Expected reference definition with inline children.");
  }
}

function reference(label: string): ArticleReferenceOccurrenceInput {
  return { label };
}

function definition(
  label: string,
  text: string,
  extraChildren: readonly ArticleReferenceInlineContent[] = [],
): ArticleReferenceDefinitionInput {
  return {
    children: [
      {
        children: [{ kind: "text", text }, ...extraChildren],
        kind: "paragraph",
        text: `${text}${extraChildren.map((child) => child.text).join("")}`,
      },
    ],
    label,
  };
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
