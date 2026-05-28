import { describe, expect, test } from "bun:test";

import { parseBibtexEntries } from "../../../../src/lib/article-references/bibtex";

describe("BibTeX parser", () => {
  test("parses citation-manager-shaped entries with nested braces and quotes", () => {
    const result = parseBibtexEntries(`
@book{baudrillard-1981,
  author = {Baudrillard, Jean},
  pages = 1--2,
  title = {Simulacra and {Simulation}},
  year = "1981",
  unknown_field = {Preserved}
}

@online(web-source,
  title = {Web Source},
  url = {https://example.com/source}
)
`);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected parsed BibTeX entries.");
    }

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toMatchObject({
      entryType: "book",
      key: "baudrillard-1981",
      normalizedKey: "baudrillard-1981",
    });
    expect(result.entries[0]?.fields).toMatchObject({
      author: "Baudrillard, Jean",
      pages: "1--2",
      title: "Simulacra and {Simulation}",
      unknown_field: "Preserved",
      year: "1981",
    });
    expect(result.entries[0]?.raw).toContain("@book{baudrillard-1981");
    expect(result.entries[1]?.entryType).toBe("online");
    expect(result.entries[1]?.key).toBe("web-source");
  });

  test("ignores BibTeX comments and reports malformed entries precisely", () => {
    const ignored = parseBibtexEntries(`
% exported from a citation manager
@comment{not a bibliography item}
@preamble("ignored preamble")
@comment{Nested {ignored} \\} value}
@article{real-source, title = {Real Source}}
`);

    expect(ignored.ok).toBe(true);

    if (!ignored.ok) {
      throw new Error("Expected comments to be ignored.");
    }

    expect(ignored.entries.map((entry) => entry.key)).toEqual(["real-source"]);

    const malformed = parseBibtexEntries(
      "@book{missing-comma title = {Broken}}",
    );

    expect(malformed.ok).toBe(false);

    if (malformed.ok) {
      throw new Error("Expected malformed BibTeX diagnostics.");
    }

    expect(malformed.diagnostics[0]?.message).toContain(
      "Expected ',' after BibTeX key",
    );
    expect(malformed.diagnostics[0]?.offset).toBeGreaterThan(0);
  });

  test("reports precise diagnostics for unsupported or incomplete BibTeX syntax", () => {
    const cases = [
      ["not bibtex", "Expected a BibTeX entry starting with '@'."],
      ["@", "Expected a BibTeX entry type after '@'."],
      ["@book title = {Broken}", "Expected '{' or '(' after BibTeX type."],
      ["@book{, title = {Broken}}", "Expected a BibTeX key."],
      ["@book{source, = {Broken}}", "Expected a BibTeX field name."],
      [
        "@book{source, title {Broken}}",
        "Expected '=' after BibTeX field name.",
      ],
      ["@book{source, title = }", "Expected a BibTeX field value."],
      [
        "@book{source, title = {Broken}",
        "Expected ',' or the end of the BibTeX entry after a field value.",
      ],
      ["@book{source,", "Unterminated BibTeX entry."],
      ["@book{source, title =", "Expected a BibTeX field value."],
      ['@book{source, title = "Broken}', "Unterminated quoted BibTeX value."],
      ["@book{source, title = {Broken", "Unterminated braced BibTeX value."],
      [
        "@book{source, title = Journal # Volume}",
        "BibTeX string concatenation is not supported",
      ],
      [
        "@book{source, title = {Good} unexpected}",
        "Expected ',' or the end of the BibTeX entry after a field value.",
      ],
      ["@comment{not closed", "Unterminated ignored BibTeX entry."],
      [
        String.raw`@comment{literal \{ not closed`,
        "Unterminated ignored BibTeX entry.",
      ],
    ] as const;

    for (const [source, message] of cases) {
      const result = parseBibtexEntries(source);

      expect(result.ok).toBe(false);

      if (result.ok) {
        throw new Error(`Expected ${source} to fail.`);
      }

      expect(result.diagnostics[0]?.message).toContain(message);
    }
  });

  test("preserves escaped delimiters inside field values", () => {
    const result = parseBibtexEntries(String.raw`
@misc{escaped,
  note = {Literal \{ brace and escaped \} brace},
  title = "A \"quoted\" title"
}
`);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected escaped field values to parse.");
    }

    expect(result.entries[0]?.fields).toMatchObject({
      note: String.raw`Literal \{ brace and escaped \} brace`,
      title: String.raw`A \"quoted\" title`,
    });
  });
});
