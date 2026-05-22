# Article Tags

Source: `src/components/articles/header/ArticleTags.astro`

## Purpose

`ArticleTags` renders canonical article tags as linked badges in the final
secondary metadata surface at the bottom of an article.

## Public Contract

- `tags?: readonly string[] | undefined`

Public props should remain narrow and semantic. Do not add broad configuration
objects or boolean clusters when a named variant or a smaller component would
make invalid states harder to express.

## Composition Relationships

It composes local components: `../ui/Badge`. Parent blocks should pass
canonical tag labels rather than asking this component to normalize or fetch
content directly.

## Layout And Responsiveness

The component must respect a readable prose measure, stay visually subordinate
to the article body and endcap, and allow dense or long tags to wrap without
layout collision.

## Layering And Scrolling

The component should avoid creating a stacking context unless it owns an overlay,
sticky region, or popover. Any `z-index`, sticky offset, fixed size, or scroll
container is part of this component's public design and needs an invariant test.

## Interaction States

Default, long-content, missing optional content, hover, focus-visible, and dark-mode states should be represented in the catalog when relevant. Empty lists, missing image/description, many tags, one-item lists, and dense lists should have catalog examples or tests where applicable.

## Accessibility Semantics

Use semantic HTML first, preserve heading order when headings are rendered, and
keep focus-visible states intact for linked tag badges. Each tag link uses the
visible tag label as its accessible name.

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
- links each tag to its canonical `/tags/[tag]/` page.
- renders after prose, support, same-category discovery, related surfaces, and
  `ArticleReferences` when notes or bibliography exist.
- remains the final visible article surface when tags exist.

## Follow-Up Notes

- Tags are intentionally secondary and should render last, not in the top
  article header or before article-end discovery.
