# Article Meta

Source: `src/components/articles/header/ArticleMeta.astro`

## Purpose

`ArticleMeta` renders compact article metadata for article headers, article
cards, archive lists, and related-reading surfaces.

It owns metadata rhythm and ordering, but it does not look up content. Parents
pass normalized dates, categories, and author summaries.

## Public Contract

- `author?: string | undefined`
- `authors?: readonly AuthorSummary[] | undefined`
- `date?: Date | undefined`
- `formattedDate?: string | undefined`

`authors` is preferred when structured author metadata exists. `author` remains
the preserved legacy byline fallback while article frontmatter still uses a
single display string.

Public props should remain narrow and semantic. Do not add broad configuration
objects or boolean clusters when a named variant or a smaller component would
make invalid states harder to express.

## Composition Relationships

```text
ArticleHeader / ArticleCard / ArticleList surfaces
  ArticleMeta
    AuthorByline
      AuthorLink
```

`ArticleMeta` owns date/author grouping and separator punctuation around the
metadata group. `AuthorByline` owns author ordering, author links, multi-author
punctuation, and legacy author fallback.

## Layout And Responsiveness

The component must respect a readable prose measure, keep metadata visually subordinate to the article title/body, and allow long titles, author names, tags, and images to wrap without layout collision.

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
- keeps article body, continuation, and support surfaces in the intended order.
- preserves author order and uses links only for known structured authors.
- falls back to legacy author text without creating broken author links.

## Follow-Up Notes

- Author handling should become structured after `site/content/authors/` is in
  place. Do not keep both `author` and `authors` as permanent public API unless
  a compatibility requirement is explicitly approved.
