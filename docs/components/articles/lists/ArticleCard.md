# Article Card

Source: `src/components/articles/lists/ArticleCard.astro`

## Purpose

`ArticleCard` renders one flat editorial article row in archive, category,
author, search, related-reading, and homepage list contexts.

## Public Contract

- `author?: string | undefined`
- `authors?: readonly AuthorSummary[] | undefined`
- `category?: ArticleCardCategory | undefined`
- `date?: string | undefined`
- `description?: string | undefined`
- `href: string`
- `image?: { alt: string; src: ImageMetadata } | undefined`
- `title: string`

Public props should remain narrow and semantic. Do not add broad configuration
objects or boolean clusters when a named variant or a smaller component would
make invalid states harder to express.

## Composition Relationships

```text
ArticleList / discovery blocks
  ArticleCard
    PublishableMediaFrame
    ArticleCardBody
      TextLink
      ArticleMeta
```

`ArticleCard` coordinates the rich row shell. `PublishableMediaFrame` owns
linked optimized media/fallback behavior, and `ArticleCardBody` owns text,
kicker, title/excerpt fit variants, and author metadata.

`ArticleCard` should consume an already-normalized article summary. It should
not compute category routes, author routes, publication status, image choice,
or search snippets internally.

## Layout And Responsiveness

The default visual treatment is flat, editorial, and row-based. Do not wrap
normal list rows in card boxes, shaded surfaces, or nested framed containers.
`ArticleList` owns separators between rows; `ArticleCard` owns the internal row
anatomy.

Responsive behavior:

- Mobile: use a condensed two-column version of the desktop row whenever an
  image exists. The text column contains category/date metadata, title, excerpt,
  and byline. The right column contains a compact square thumbnail. No-image
  rows collapse to one text column.
- Tablet: keep the same anatomy and enlarge the thumbnail only when doing so
  does not crowd the text column.
- Desktop and wider: use a flexible text column and a bounded rectangular
  thumbnail column. The image is vertically centered against the clamped text
  group so long excerpts do not leave it visually stranded.
- No-image rows must not reserve an empty media column. Text expands into the
  available row space while preserving the same scannable rhythm and minimum
  row height.
- Titles and descriptions are intentionally clamped in list contexts. The title
  remains the primary link and should get more space than the excerpt; excerpts
  should be concise enough that repeated rows keep a predictable height.
- Article-list titles should shrink through stable density variants before the
  two-line ellipsis fallback applies. The minimum title size is an emergency
  state for very long or unbreakable list titles, not the normal presentation.
- Article-list descriptions should use their own stable density variants before
  the three-line ellipsis fallback applies. The tight description variant is a
  hard readability floor for hostile excerpts; it keeps `text-sm` and only
  tightens line-height.
- The row itself should be sized for that three-line description budget. Do not
  raise the description clamp without also increasing row rhythm, media frame
  size, and invariant tests.
- Title and description shrink behavior should be derived from pure helpers and
  fixed class variants, not browser text measurement, so row positioning
  remains stable during rendering and hydration-free builds.

The component must respect a readable measure, keep metadata visually
subordinate to the article title/body, and allow long titles, author names,
tags, and images to wrap without layout collision.

## Layering And Scrolling

The component should avoid creating a stacking context unless it owns an overlay,
sticky region, or popover. Any `z-index`, sticky offset, fixed size, or scroll
container is part of this component's public design and needs an invariant test.

## Interaction States

Default, image-backed, no-image, long-content, missing optional content, hover,
focus-visible, and dark-mode states should be represented in the catalog when
relevant. Empty lists, missing image/description, many tags, one-item lists, and
dense lists should have catalog examples or tests where applicable.

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
- keeps optional image media bounded and prevents missing-image rows from
  leaving blank media space.
- uses square thumbnails on small screens and rectangular thumbnails at larger
  widths.
- keeps image-backed rows and no-image rows on the same vertical rhythm without
  forcing a placeholder thumbnail.
- shrinks dense article-list titles through documented variants, including the
  minimum emergency size, then clamps to two lines with an ellipsis after the
  minimum readable size is reached.
- keeps metadata, excerpt, byline, and optional thumbnail aligned when title
  density changes.
- shrinks dense descriptions through documented variants, keeps `text-sm` as
  the readable floor, then clamps to three lines so dense lists remain
  scannable.
- keeps article body, continuation, and support surfaces in the intended order.
- uses the same metadata/byline component as the article header so author
  linking stays consistent across archive, category, author, and related lists.

## Follow-Up Notes

- Search-result highlighting belongs to a dedicated snippet/highlight boundary,
  not raw HTML strings inside the article title.
