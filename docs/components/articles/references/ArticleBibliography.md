# Article Bibliography

Source: `src/components/articles/references/ArticleBibliography.astro`

## Purpose

`ArticleBibliography` renders article-local bibliography entries from
normalized `cite-*` markers and parsed BibTeX source data. It keeps source
citations separate from explanatory notes and gives every in-body citation a
clear destination.

It must not infer citations from inline prose links, parse raw Markdown source,
or deduplicate global sources. It consumes normalized citation data.

## Public Contract

- `citations: readonly ArticleCitation[]`
- `headingId?: string`
- `heading?: string`

`heading` should default to `Bibliography`. The component should render nothing
when `citations` is empty.

Each `ArticleCitation` should include:

- stable entry ID;
- stable label;
- numeric order;
- zero or more source reference markers;
- parsed BibTeX entry data;
- display-ready citation text generated from BibTeX fields;
- fallback text for incomplete but renderable sources.

Repeated `cite-*` references are valid, so citations may have multiple source
markers/backlinks. Bibliography-only sources are also valid when an article's
historical source list is structured as `tpm-bibtex` without a precise inline
claim marker; those entries render without backlinks.

## Composition Relationships

Target ownership:

```text
ArticleReferences
  ArticleBibliography
    ArticleReferenceBacklinks
```

`ArticleReferences` owns where bibliography appears relative to notes and tags.
`ArticleBibliography` owns section heading, ordered-list structure, entry IDs,
generated citation display placement, and backlink placement.

`ArticleBibliography` should not render explanatory notes, related articles,
support CTAs, or global bibliography-page grouping/filtering.

## Layout And Responsiveness

Use the article reading measure. Bibliography entries should be scannable and
quietly academic/editorial. They should not look like promotional cards.

Entries stack vertically. Long URLs, source titles, author lists, and display
labels must wrap without horizontal overflow. Rich Markdown content such as
emphasis, links, inline code, and punctuation must keep readable spacing.

## Layering And Scrolling

No custom layering is intended. Each bibliography entry should have a stable
target ID that works with hash navigation and sticky-header scroll offsets.

## Interaction States

Interactive descendants are source links and backlinks. They need default,
hover, focus-visible, visited where appropriate, and target states.

If a citation has `displayLabel`, inline citation markers may render with that
label. The bibliography entry itself should render generated citation display
content from parsed source data. It must not expose raw BibTeX unless a future
explicit export/debug surface is designed.

Inline citation markers must stay visually distinct from explanatory footnote
markers. Citations use citation-specific marker styling, currently bracketed
generated labels when possible, while notes use naked superscript numbers.

## Accessibility Semantics

Render a visible heading and an ordered list. Numbering communicates first
citation order and matches numeric inline citation markers when no display label
is provided.

Each citation entry should be reachable from every inline citation marker. Each
entry should include backlinks for each source marker with accessible text such
as "Back to citation reference 2". Multiple backlinks should remain concise and
usable.

Use semantic links and lists before ARIA. Do not use a table unless the
bibliography page design later requires tabular metadata.

## Content Edge Cases

Handle:

- one citation;
- many citations;
- repeated citation references;
- citation with display label;
- citation without display label;
- source links;
- non-URL sources;
- long titles;
- long URLs;
- many backlinks for one citation;
- unusual punctuation;
- incomplete optional BibTeX fields with stable fallback display.

## Theme Behavior

Use semantic tokens. Bibliography text, numbering, source links, borders,
backlinks, target states, and focus rings must be readable in both light and
dark mode.

## Testable Invariants

- Renders nothing for an empty citation array.
- Renders a visible `Bibliography` heading by default.
- Renders an ordered list with entry order matching first citation order.
- Uses stable entry IDs that match inline marker hrefs.
- Inline citation markers are citation-styled and do not reuse the naked
  superscript footnote presentation.
- Supports multiple backlinks for repeated citations.
- Renders generated bibliography display content from parsed BibTeX data.
- Does not render raw `tpm-bibtex` source data.
- Does not overflow horizontally with long URLs or source titles.
- Maintains keyboard focus visibility for source links and backlinks.

## Follow-Up Notes

- Global `/bibliography/` pages may reuse lower-level citation entry/backlink
  pieces later, but this component is article-local and should not own global
  grouping, filtering, or source deduplication.
