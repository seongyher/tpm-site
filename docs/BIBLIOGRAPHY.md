# Bibliography Technical Design

## Purpose

This document defines how The Philosopher's Meme turns article citation data
into a global bibliography page.

The core decision is that article citations are structured source data, not
prose references. Authors paste BibTeX into hidden `tpm-bibtex` Markdown fences;
the remark plugin parses those entries and exposes normalized citation data to
article components and bibliography routes.

Author-facing syntax examples live in
[ARTICLE_REFERENCE_AUTHORING.md](./ARTICLE_REFERENCE_AUTHORING.md). Corpus audit
rules and current migration status live in
[ARTICLE_REFERENCE_CORPUS_AUDIT.md](./ARTICLE_REFERENCE_CORPUS_AUDIT.md) and
[ARTICLE_REFERENCE_CORPUS_AUDIT_REPORT.md](./ARTICLE_REFERENCE_CORPUS_AUDIT_REPORT.md).

## Data Source

The global bibliography must consume normalized article-reference data produced
by `docs/remark-plugins/article-references.md`.

Canonical article source:

````md
Claim text.[^cite-baudrillard-1981]

```tpm-bibtex
@book{baudrillard-1981,
  author = {Baudrillard, Jean},
  title = {Simulacra and Simulation},
  year = {1981}
}
```
````

Rules:

- `tpm-bibtex` blocks are authoring data and never render directly.
- The key part of each `cite-*` marker must match a BibTeX key. The BibTeX key
  itself should not include the `cite-` prefix.
- `note-*` footnotes are explanatory notes, not bibliography sources.
- Ordinary inline links are not bibliography entries.
- Legacy reference sections are migration input only.

## Corpus Survey

The published corpus has been normalized so legacy numeric footnotes and
claim-tied reference sections no longer remain as build-valid source syntax.
Current article-reference data comes from explicit `cite-*` markers, `note-*`
definitions, and hidden `tpm-bibtex` blocks.

The corpus still contains ordinary inline links, archive links, and raw URLs.
These patterns are not reliable structured bibliography data. They stay article
prose unless an article is explicitly edited to cite a source with a `cite-*`
marker plus BibTeX entry. Historical source-list sections have been migrated
only when doing so preserves author intent. Author-owned appendices remain
visible prose until a separate visible-source-appendix model is designed.

## Global Bibliography Model

The global page uses data derived from normalized article citations:

```ts
interface BibliographyEntry {
  display: BibliographyDisplayFields;
  id: string;
  sourceArticles: readonly BibliographySourceArticle[];
  sourceContent: readonly ArticleReferenceBlockContent[];
  sourceKey: string;
  sourceText: string;
  sourceUrl: string | undefined;
}

interface BibliographySourceArticle {
  articleId: string;
  date: string;
  href: string;
  markerIds: readonly string[];
  publishedAt: Date;
  title: string;
}

interface BibliographyDisplayFields {
  authors: string | undefined;
  containerTitle: string | undefined;
  doi: string | undefined;
  fallbackText: string;
  publisher: string | undefined;
  sourceUrl: string | undefined;
  title: string | undefined;
  year: string | undefined;
}
```

`ParsedBibtexEntry` remains inside the article-reference data boundary.
Bibliography helpers derive serializable display fields, rich rendered source
content, and source-article relationships so UI components do not need to know
BibTeX syntax. The rich `sourceContent` preserves generated source links, such
as URL and DOI links, so the global bibliography does not degrade links into
plain text.

Conceptually, each entry is derived from:

```ts
interface BibliographyEntrySource {
  citation: ParsedBibtexEntry;
  sourceArticles: readonly BibliographySourceArticle[];
}
```

## Deduplication

Do not use fuzzy source deduplication.

Initial grouping rules should be deterministic:

- prefer exact DOI match when present;
- otherwise prefer exact URL match when present;
- otherwise group only exact normalized fingerprints built from entry type,
  title, author/editor field, and year;
- if fields are too incomplete to build a confident fingerprint, keep entries
  separate.

If the corpus later needs manual deduplication, add explicit canonical source
IDs rather than guessing from similar prose.

## Page Anatomy

The bibliography page is a browsing page:

```text
BrowsingBody
  BibliographyPage
    PageHeader
    optional intro
    BibliographyList
      BibliographyEntry
        BibliographySourceArticles
    optional BibliographyFilters
```

Reader goals:

- scan all cited sources;
- see which article cited each source;
- navigate from a source to articles that cite it;
- search or filter when the list becomes large.

The first implementation should prioritize deterministic sorting, clear source
rendering, and article back-links before adding complex filters.

## Component Boundaries

- Routes load article data and normalized reference metadata.
- `src/lib/references/bibliography` aggregates and sorts source data.
- Bibliography components receive display-ready entries.
- Components do not parse Markdown or BibTeX.
- Article-local reference components and the global bibliography share the same
  normalized citation data.

Existing component one-pagers in `docs/components/bibliography/` remain the
component-level contract and should be updated if implementation changes their
public props or responsibilities.

## Sorting

Default sort should be stable and reader-oriented:

1. author/editor display field;
2. year, oldest to newest within the same author unless design review chooses
   reverse chronological;
3. title;
4. stable source ID.

Missing author or year sorts after known values within the same comparison
level.

## Validation And Enforcement

Before corpus normalization:

- parser fixtures should be strict;
- published articles may use documented exceptions;
- review checks can report legacy reference sections.

After normalization:

- missing citation BibTeX entries fail;
- uncited BibTeX entries render as bibliography-only sources;
- duplicate BibTeX keys fail;
- malformed BibTeX fails;
- note definitions must be valid and referenced;
- raw visible `bibtex` fences can be rejected if they would confuse authoring.

Diagnostics must tell authors whether to add a BibTeX entry, rename a marker,
convert a prose note, or leave an ordinary link alone.

## SEO And Search

The bibliography page should have:

- canonical URL `/bibliography/`;
- ordinary page metadata;
- sitemap inclusion;
- Pagefind indexing unless later disabled for noise;
- no JSON-LD until the source model is rich enough to make it useful.

Each entry should link to source articles. External source URLs should be
ordinary links when present, but the bibliography remains useful for non-URL
sources.

## Testing Requirements

Unit tests:

- aggregation from multiple article citation datasets;
- deterministic sorting;
- exact DOI/URL/fingerprint grouping;
- fallback display fields for missing optional metadata;
- duplicate-looking but non-identical sources remain separate.

Render/component tests:

- empty bibliography state;
- one source, many sources, and many articles for one source;
- long titles, long URLs, missing authors, missing years;
- source article back-links.

Browser/accessibility tests:

- `/bibliography/` has one H1, semantic lists, and no horizontal overflow;
- source and article links are keyboard reachable;
- light/dark mode contrast remains readable;
- no raw BibTeX text appears as a prose block.

## Open Decisions

- Which prose citation styles should be available on the global bibliography
  page, if any, versus only in the article-local citation feature.
- Whether to add CSL JSON export after the internal model stabilizes.
- Whether filters are necessary for the first release or should wait until the
  source list is large enough to justify them.
