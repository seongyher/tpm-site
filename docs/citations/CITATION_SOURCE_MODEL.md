# Citation Source Model

This document defines the target citation source model for article notes,
citations, bibliography pages, generated PDFs, Scholar metadata, export formats,
and reference previews.

The current authoring syntax remains:

- `note-*` references for explanatory notes;
- `cite-*` references for bibliography sources;
- hidden `tpm-bibtex` blocks for structured citation metadata.

The platform should normalize those inputs into one source model and then render
that model into every output surface.

## Goals

- Preserve author intent while making malformed or ambiguous citation data
  visible through diagnostics.
- Keep BibTeX as an accepted authoring format without letting raw BibTeX leak
  into every output component.
- Deduplicate identical sources across articles without silently merging
  genuinely different or ambiguous sources.
- Support BibTeX, RIS, CSL-like exports, site bibliography grouping, Scholar
  metadata, article PDFs, hover previews, and backlinks from the same data.
- Make citation audit work actionable: each diagnostic should identify the
  source key, article, field, and suggested fix whenever possible.

## Normalized Source Shape

The normalized source model should be framework-neutral data. The exact
TypeScript shape can evolve, but it should express these concepts explicitly:

| Field group       | Examples                                                                 | Notes                                                             |
| ----------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Identity          | source key, normalized key, canonical fingerprint, duplicate confidence  | Distinguish exact identity from probable duplicate identity.      |
| Source type       | article, book, chapter, web page, video, social post, dataset, software  | Derived from BibTeX entry type plus known fields.                 |
| Contributors      | author, editor, translator, organization, publisher                      | Preserve order and role. Avoid flattening everything to a string. |
| Titles            | title, subtitle, container title, series title                           | Map BibTeX `journal` / `booktitle` / `series` into roles.         |
| Publication facts | year, date, access date, volume, issue, pages, edition, publisher, place | Keep exact values when available; do not invent missing facts.    |
| Identifiers       | DOI, ISBN, ISSN, arXiv, PubMed, URL, archive URL, original URL           | Normalize for duplicate detection and exports.                    |
| Locators          | page cited, timestamp, section, paragraph, figure, quote                 | Locators belong to usage markers when they differ per citation.   |
| Display           | fallback prose, short label, generated label, visible source text        | Rendering should consume normalized display data.                 |
| Relationships     | article usages, marker IDs, backlink IDs, article URLs                   | Needed for site bibliography and hover/backlink previews.         |
| Audit state       | verified, ambiguous, editorial review, migrated best-effort, broken URL  | Should be optional metadata or diagnostics, not hidden certainty. |

## Field Mapping

BibTeX parsing should remain permissive enough to accept common citation-manager
output, but normalization should map fields into explicit roles.

Important mappings:

- `@article`: article-like source with `journal`, `volume`, `number`, `pages`,
  `doi`, and `url`.
- `@book`: book-like source with `publisher`, `address`, `edition`, `isbn`, and
  optional `translator`.
- `@inbook` / `@incollection`: chapter-like source with `booktitle`, `editor`,
  `publisher`, `pages`, and parent-book identifiers.
- `@inproceedings`: conference-like source with `booktitle`, `organization`,
  `publisher`, and event/publication dates.
- `@online`: web-native source with `url`, `urldate`, `date`, `organization`,
  `archiveurl`, and `archivedate`.
- `@misc`: fallback source type only when no better source type is available.

Unsupported or unknown BibTeX fields should be preserved in an `extraFields`
bucket for round-trip/audit purposes while still producing diagnostics when a
field looks like a typo of a known field.

## Duplicate Identity

Duplicate detection should be tiered:

1. Exact identifier match: normalized DOI, ISBN, arXiv, PubMed, canonical URL,
   or archive/original URL pair.
2. Strong bibliographic fingerprint: source type, normalized contributor,
   normalized title, normalized year/date, and container title when present.
3. Weak possible duplicate: title and contributor match but dates, containers,
   URLs, or editions differ.
4. No merge: insufficient identity facts or conflicting facts.

Only tiers 1 and 2 should merge automatically. Tier 3 should produce a possible
duplicate diagnostic or audit cluster. Tier 4 should remain separate.

## Diagnostics

Citation diagnostics should be precise enough to guide author or maintainer
action. The diagnostic model should cover:

- malformed BibTeX syntax;
- duplicate BibTeX keys inside one article;
- cite marker without matching BibTeX entry;
- BibTeX entry without matching cite marker;
- unsupported or discouraged source type;
- missing required fields for a source type;
- likely field typos or legacy migration fields;
- ambiguous source identity;
- weak duplicate clusters;
- invalid DOI/ISBN/URL/date syntax;
- broken or inaccessible URLs when a URL check is explicitly run;
- locator data attached to the wrong level;
- source metadata that is more specific than verified facts justify.

Diagnostics must distinguish blocking build failures from non-blocking audit
findings. Syntax, missing keys, duplicate keys, and invalid marker contracts are
blocking. Ambiguous metadata and possible duplicates are usually audit findings
unless a downstream output would be misleading.

## Output Consumers

Every citation output should consume normalized sources:

- article references render visible bibliography entries and backlink IDs;
- hover previews render compact source display or backlink context;
- site bibliography groups normalized duplicate sources;
- `Cite` menu exports article-level citation formats;
- PDF output renders references and PDF metadata;
- Scholar tags receive flattened citation reference strings;
- BibTeX and RIS exports serialize from normalized fields;
- future CSL JSON output serializes from the same model;
- generated-output verifiers compare outputs against normalized source facts.

Current implementation ownership:

- `src/lib/article-references/source.ts` owns normalized source fields,
  identity confidence, BibTeX export, RIS export, and CSL-like export data.
- `src/lib/bibliography.ts` consumes normalized source identity and display
  fields for sitewide bibliography grouping and source rendering.
- `src/lib/article-pdf.ts` consumes normalized source fields for flattened
  Scholar `citation_reference` strings used by PDF and metadata output.
- Article reference rendering, backlink previews, and footnote/citation
  previews consume normalized article reference data produced by the Markdown
  reference pipeline; source display should stay derived from the same BibTeX
  entries rather than a separate prose-only model.
- Cross-output coverage lives in
  `tests/src/lib/citation-cross-output.test.ts` and article route fixture
  coverage lives in `tests/src/pages/articles/[...slug].vitest.ts`. Together
  they cover citation-heavy output surfaces and articles without references.

## Authoring Rules

Author-facing docs should keep the simple rules:

- use `cite-*` for cited bibliography sources;
- put source metadata in `tpm-bibtex`;
- prefer verified structured fields;
- do not invent fields;
- leave uncertain sources conservative and explain uncertainty in PR notes.

The platform should carry the complexity: parsing, normalization, diagnostics,
exports, deduplication, and generated-output verification.

## Verification

Implementation should add:

- unit fixtures for each supported source type;
- malformed BibTeX fixtures;
- duplicate identity fixtures for exact, strong, weak, and no-merge cases;
- export snapshots for BibTeX, RIS, and future CSL-like output;
- bibliography grouping tests;
- article/PDF/Scholar/reference-preview integration tests for pages with
  citations, notes, both, and neither.
