# Search Results Block

Source: `src/components/blocks/listing/SearchResultsBlock.astro`

## Purpose

`SearchResultsBlock` owns the search page surface and the live result region
enhanced by Pagefind.

## Public Contract

- `description?: string`
- `headingId?: string`
- `title?: string`

Public props should remain narrow and semantic. Do not add broad configuration
objects or boolean clusters when a named variant or a smaller component would
make invalid states harder to express.

## Composition Relationships

It composes local components: `../navigation/SearchForm` and the browser
enhancement in `../../scripts/search-page`. Parent blocks should pass
normalized props and slots rather than asking this component to fetch global
content directly.

## Layout And Responsiveness

The block should size itself from content, use the shared page measure unless
intentionally wider, and remain composable in the homepage, archive, search, and
category flows. Dynamic Pagefind results should follow the same flat editorial
list direction as `ArticleList`: separator rhythm, no card boxes, readable
titles/excerpts, title and description density variants, concise clamped text,
and no horizontal overflow. Search results usually lack thumbnail metadata, so
they should use the no-image row fallback rather than inventing placeholder
media. Result rows should keep the same larger rhythm as article-list rows so
three-line excerpts do not crowd titles, metadata, or focus outlines.

## Layering And Scrolling

The component should avoid creating a stacking context unless it owns an overlay,
sticky region, or popover. Any `z-index`, sticky offset, fixed size, or scroll
container is part of this component's public design and needs an invariant test.

## Interaction States

Default, long-content, missing optional content, hover, focus-visible, and dark-mode states should be represented in the catalog when relevant. Empty lists, missing image/description, many tags, one-item lists, and dense lists should have catalog examples or tests where applicable.

## Accessibility Semantics

Use semantic HTML first, preserve heading order when headings are rendered, and keep focus-visible states intact for any interactive descendants.

## Content Edge Cases

Test or catalog long titles, long words, dense content, empty content, missing
optional fields, and unusual punctuation whenever this component renders user or
author-provided content.

## Theme Behavior

Use semantic color tokens and Tailwind utilities. Light and dark mode must keep
text readable, borders visible when they communicate structure, focus rings
visible, and CTAs distinguishable from neutral actions.

## Testable Invariants

- renders without horizontal overflow at mobile, tablet, desktop, and wide desktop widths.
- preserves readable text and visible focus/hover states in light and dark themes.
- handles long content without clipping or overlapping neighboring components.
- aligns with the intended page measure or documents why it is wider.
- renders Pagefind results as flat list rows, not boxed cards.
- shrinks then clamps dynamic result titles and excerpts so live search remains
  easy to scan.
- keeps sanitized `<mark>` highlights readable inside result excerpts.
- renders empty and missing-content states without throwing or leaving broken layout.

## Follow-Up Notes

- No component-specific brittle decision is known yet; add one here when implementation review finds a questionable or fragile choice.
