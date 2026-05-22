import type { ArticleReferenceDiagnostic } from "./model";

/**
 * Checks whether pure reference normalization returned blocking diagnostics.
 *
 * @param diagnostics Diagnostics returned by normalization.
 * @returns Whether at least one blocking diagnostic exists.
 */
export function hasArticleReferenceDiagnostics(
  diagnostics: readonly ArticleReferenceDiagnostic[],
): boolean {
  return diagnostics.length > 0;
}

/**
 * Converts a normalized diagnostic into an author-readable message.
 *
 * @param diagnostic Normalization diagnostic.
 * @returns Human-readable explanation and repair hint.
 */
export function articleReferenceDiagnosticMessage(
  diagnostic: ArticleReferenceDiagnostic,
): string {
  switch (diagnostic.code) {
    case "citation-definition":
      return `Article citation "[^${diagnostic.label}]" uses an obsolete Markdown footnote definition. Remove the definition and add a matching entry to a hidden "tpm-bibtex" fenced block.`;
    case "duplicate-bibtex-key":
      return `Duplicate BibTeX key "${diagnostic.key}". Keep exactly one BibTeX entry for each cited source.`;
    case "duplicate-definition":
      return `Duplicate article reference definition "[^${diagnostic.label}]". Keep exactly one definition for each note or citation.`;
    case "empty-definition":
      return `Article reference "[^${diagnostic.label}]" has an empty definition. Add note or citation content after the definition marker.`;
    case "id-collision":
      return `Article reference generated duplicate HTML ID "${diagnostic.id}". Rename one reference label so generated IDs are unique.`;
    case "invalid-label":
      return `Invalid article reference label "[^${diagnostic.label}]". Use lowercase "[^note-...]" for explanatory notes or "[^cite-...]" for bibliography citations.`;
    case "malformed-bibtex":
      return `Malformed BibTeX in a "tpm-bibtex" block. ${diagnostic.message}`;
    case "malformed-display-label":
      return `Malformed display label in "[^${diagnostic.label}]". Use a valid leading "[@Display Label]" marker or remove the marker.`;
    case "missing-bibtex-entry":
      return `Article citation "[^${diagnostic.label}]" has no matching BibTeX entry. Add "@...{${diagnostic.key}, ...}" inside a hidden "tpm-bibtex" fenced block.`;
    case "missing-definition":
      return `Article reference "[^${diagnostic.label}]" is used but has no matching definition. Add a "[^${diagnostic.label}]:" definition.`;
    case "repeated-note-reference":
      return `Article note "[^${diagnostic.label}]" is referenced more than once. Notes may only be referenced once; use a cite-* label for repeatable citations.`;
    case "unreferenced-definition":
      return `Article reference definition "[^${diagnostic.label}]" is never used. Reference it in the article body or remove the definition.`;
  }
}
