# Article References

Source: `src/components/articles/references/ArticleReferences.astro`

## Purpose

`ArticleReferences` renders the article-local reference surfaces produced by the
article references remark plugin. It is the article-page owner for explanatory
footnotes and bibliography entries after prose/support/discovery and before
tags.

It must not parse Markdown, inspect article source, fetch global content, or
infer citation data from inline links. It receives normalized reference data
from the article route/layout.

## Public Contract

- `references: ArticleReferenceData`
- `headingIdPrefix?: string`

`ArticleReferenceData` is produced by `src/lib/references/article-references/` and contains
separate `notes` and `citations` arrays. The component should render nothing
when both arrays are empty.

The public contract should remain data-driven and narrow. Do not add booleans
such as `showNotes`, `showBibliography`, or `useCitationLabels` unless a
documented presentation variant truly requires them.

## Composition Relationships

Target hierarchy:

```text
ArticleLayout
  ArticleHeader
  ArticleProse
  ArticleEndcap
    SupportBlock
    MoreInCategoryBlock
    RelatedArticlesBlock
  ArticleReferences
    ArticleFootnotes
      ArticleReferenceBacklinks
    ArticleBibliography
      ArticleReferenceBacklinks
  ArticleTags
```

`ArticleLayout` owns where `ArticleReferences` appears. `ArticleReferences`
owns whether notes, bibliography, or both render. `ArticleFootnotes` owns note
section markup. `ArticleBibliography` owns citation section markup. Backlink
rendering should be delegated to a small component so notes and citations share
consistent return-link behavior.

`ArticleReferences` should not be owned by `ArticleEndcap`. Support and
same-category discovery are continuation surfaces; notes and bibliography are
article apparatus. They should be adjacent but separate.

## Layout And Responsiveness

The component must respect the same readable article measure as `ArticleProse`,
`ArticleEndcap`, and `ArticleTags`. It should use a restrained vertical rhythm:
clearly separated from discovery surfaces, but not visually louder than the
article body.

On narrow screens, notes and bibliography stack in normal document flow. On
desktop and wide screens, they should still stay in the article reading column
unless a future article anatomy design explicitly moves them into a side rail.

Long bibliography URLs, long titles, and repeated backrefs must wrap without
horizontal overflow.

## Layering And Scrolling

No sticky, fixed, absolute, popover, or custom `z-index` behavior is intended.
Reference links may be hash targets, so headings and entries should work with
global scroll-margin/sticky-header behavior.

## Interaction States

The component itself has no client-side interaction. Descendant links need
default, hover, focus-visible, visited where appropriate, and target states.

Empty states:

- no notes and no citations: render nothing;
- notes only: render only `ArticleFootnotes`;
- citations only: render only `ArticleBibliography`;
- both: render notes first, bibliography second.

## Accessibility Semantics

Use semantic sectioning with visible headings. The component should not create a
landmark that competes with the main article or site footer.

The note and bibliography headings must be linkable or targetable if references
point to them. Inline markers rendered by the plugin must link to entries inside
these sections, and backlink components must return readers to the exact source
reference where feasible.

When notes or citations exist, their generated section headings also
participate in article table-of-contents data. The default heading IDs are
`article-references-notes-heading` and
`article-references-bibliography-heading`; if `headingIdPrefix` changes, the
TOC normalization call must receive the same prefix so links and rendered
sections stay in sync.

Inline note and citation markers must not share the same visual treatment.
Explanatory notes are naked clickable superscript numbers. Bibliographic
citations are citation-styled bracketed numbers by default. Generated
author-year labels remain structured data for future explicit style overrides,
but the body default is numeric to avoid duplicating author-written prose
citations. This distinction is part of the reading contract, not an incidental
style choice.

## Content Edge Cases

Handle:

- no references;
- notes only;
- citations only;
- many notes;
- many citations;
- repeated citation references;
- long display labels;
- long source titles;
- long URLs;
- generated citation display content from parsed BibTeX fields;
- unusual punctuation;
- incomplete optional BibTeX fields with fallback text.

## Theme Behavior

Use semantic tokens and Tailwind utilities. Light and dark mode must keep
section headings, entry text, inline links, borders, focus rings, and target
states readable.

Reference surfaces are secondary apparatus; avoid CTA styling and avoid colors
that compete with the support block.

## Testable Invariants

- Renders nothing when `notes` and `citations` are empty.
- Renders notes before bibliography when both exist.
- Renders after `ArticleEndcap` and before `ArticleTags`.
- Keeps notes and bibliography within the article reading measure.
- Does not create horizontal overflow with long labels, titles, or URLs.
- Preserves normalized note content and generated citation display content from
  the normalized model.
- Keeps note markers naked and superscripted while keeping citation markers
  visually distinct.
- Includes visible Notes and Bibliography headings in article-local TOC data
  when their sections render.
- Keeps every entry target ID unique.
- Keeps every backlink target associated with the originating inline marker.
- Maintains visible focus states in light and dark mode.

## Integration Notes

`src/pages/articles/[...slug].astro` reads normalized data from
`render(article).remarkPluginFrontmatter` with
`articleReferencesFromFrontmatter()` and passes it to `ArticleLayout`.
`ArticleLayout` renders this component after `ArticleEndcap` and before
`ArticleTags`.
