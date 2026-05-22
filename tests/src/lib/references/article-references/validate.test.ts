import { describe, expect, test } from "bun:test";

import {
  articleReferenceDiagnosticMessage,
  hasArticleReferenceDiagnostics,
} from "../../../../../src/lib/references/article-references/validate";

describe("article reference diagnostics", () => {
  test("reports whether diagnostics are present", () => {
    expect(hasArticleReferenceDiagnostics([])).toBe(false);
    expect(
      hasArticleReferenceDiagnostics([
        {
          code: "invalid-label",
          label: "source-1",
          source: "reference",
        },
      ]),
    ).toBe(true);
  });

  test("formats author-readable messages with repair hints", () => {
    const messages = [
      articleReferenceDiagnosticMessage({
        code: "citation-definition",
        label: "cite-baudrillard-1981",
      }),
      articleReferenceDiagnosticMessage({
        code: "duplicate-definition",
        label: "cite-baudrillard-1981",
      }),
      articleReferenceDiagnosticMessage({
        code: "duplicate-bibtex-key",
        key: "baudrillard-1981",
      }),
      articleReferenceDiagnosticMessage({
        code: "empty-definition",
        label: "note-context",
      }),
      articleReferenceDiagnosticMessage({
        code: "id-collision",
        id: "article-reference-cite-baudrillard-1981",
      }),
      articleReferenceDiagnosticMessage({
        code: "invalid-label",
        label: "source-1",
        source: "reference",
      }),
      articleReferenceDiagnosticMessage({
        code: "malformed-display-label",
        label: "cite-baudrillard-1981",
      }),
      articleReferenceDiagnosticMessage({
        code: "malformed-bibtex",
        message: "Expected a BibTeX key. (offset 6)",
      }),
      articleReferenceDiagnosticMessage({
        code: "missing-bibtex-entry",
        key: "baudrillard-1981",
        label: "cite-baudrillard-1981",
      }),
      articleReferenceDiagnosticMessage({
        code: "missing-definition",
        label: "note-context",
      }),
      articleReferenceDiagnosticMessage({
        code: "repeated-note-reference",
        label: "note-context",
      }),
      articleReferenceDiagnosticMessage({
        code: "unreferenced-definition",
        label: "note-context",
      }),
    ];

    expect(messages).toEqual([
      'Article citation "[^cite-baudrillard-1981]" uses an obsolete Markdown footnote definition. Remove the definition and add a matching entry to a hidden "tpm-bibtex" fenced block.',
      'Duplicate article reference definition "[^cite-baudrillard-1981]". Keep exactly one definition for each note or citation.',
      'Duplicate BibTeX key "baudrillard-1981". Keep exactly one BibTeX entry for each cited source.',
      'Article reference "[^note-context]" has an empty definition. Add note or citation content after the definition marker.',
      'Article reference generated duplicate HTML ID "article-reference-cite-baudrillard-1981". Rename one reference label so generated IDs are unique.',
      'Invalid article reference label "[^source-1]". Use lowercase "[^note-...]" for explanatory notes or "[^cite-...]" for bibliography citations.',
      'Malformed display label in "[^cite-baudrillard-1981]". Use a valid leading "[@Display Label]" marker or remove the marker.',
      'Malformed BibTeX in a "tpm-bibtex" block. Expected a BibTeX key. (offset 6)',
      'Article citation "[^cite-baudrillard-1981]" has no matching BibTeX entry. Add "@...{baudrillard-1981, ...}" inside a hidden "tpm-bibtex" fenced block.',
      'Article reference "[^note-context]" is used but has no matching definition. Add a "[^note-context]:" definition.',
      'Article note "[^note-context]" is referenced more than once. Notes may only be referenced once; use a cite-* label for repeatable citations.',
      'Article reference definition "[^note-context]" is never used. Reference it in the article body or remove the definition.',
    ]);
  });
});
