# Article List

Source: `src/components/articles/lists/ArticleList.astro`

## Purpose

`ArticleList` renders a reusable flat editorial list of article summaries.

It is the shared display primitive for archive pages, category pages, author
pages, search results, homepage sections, and article-end discovery. Filtering,
sorting, and route construction happen before data reaches this component.

## Public Contract

- `items: readonly ArticleListItem[]`
- `pagefindIgnore?: boolean`

Public props should remain narrow and semantic. Do not add broad configuration
objects or boolean clusters when a named variant or a smaller component would
make invalid states harder to express.

## Composition Relationships

```text
Archive / Category / Search / Author / Discovery block
  ArticleList
    list row
      ArticleCard
```

`ArticleList` owns list semantics, separator rhythm, vertical spacing,
empty-state handling, and optional Pagefind opt-out behavior. It does not fetch
content, filter by category, filter by author, choose images, or infer routes.

## Layout And Responsiveness

The list should look like an editorial index, not a card grid. Repeated rows
use full-width separators and whitespace for structure. Do not add enclosing
cards around individual rows.

Responsive behavior:

- Mobile: image-backed rows stay two-column and concise, with metadata merged
  into the text column and a compact square thumbnail on the right.
- Tablet: rows preserve the same anatomy while giving text priority over media.
- Desktop and wider: rows use a wider rectangular thumbnail and more generous
  spacing without changing the information order.
- No-image rows expand their text area instead of rendering placeholders.
- Row height should be predictable enough for scanning. The title and excerpt
  clamp to sensible defaults rather than allowing one item to dominate a dense
  list.
- Long titles should shrink through stable density variants before the two-line
  clamp truncates. This keeps moderately long titles readable while preserving
  row rhythm and thumbnail alignment. The minimum title-size variant is reserved
  for hostile or very long titles that would otherwise waste the available
  two-line space before ellipsis.
- Long descriptions should shrink through their own stable density variants
  before the three-line clamp truncates. The description lower bound is
  `text-sm` with a tighter line height; after that the ellipsis fallback wins.
- The list row minimum height and optional media frame should be sized around
  the three-line excerpt budget, so increasing excerpt capacity remains an
  intentional rhythm change rather than a hidden overflow risk.

The component must respect a readable measure, keep metadata visually
subordinate to the article title/body, and allow long titles, author names,
tags, and images to wrap without layout collision.

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
- keeps article title, metadata, tags, and links semantically associated.
- renders separators consistently without double borders or nested card boxes.
- keeps image-backed rows bounded and lets no-image rows expand naturally.
- keeps mobile rows as condensed editorial rows rather than switching to a
  stacked teaser.
- keeps title and description density variants, including the title minimum and
  description tight variants, active across list surfaces before title two-line
  and description three-line clamps apply.
- keeps article body, continuation, and support surfaces in the intended order.
- can be reused by `AuthorArticleList` with prefiltered author-specific data.
- renders a useful empty state only when the parent supplies one or the design
  chooses a default for that page type.

## Follow-Up Notes

- Keep this component boring and reusable. Page-specific section headings,
  filters, and explanatory copy belong in parent browsing blocks.
