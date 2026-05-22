# Article Endcap

Source: `src/components/articles/endcap/ArticleEndcap.astro`

## Purpose

`ArticleEndcap` offers dignified after-article continuation through support,
more-in-category links, and related reading.

## Public Contract

- `categoryHref?: string | undefined`
- `categoryTitle?: string | undefined`
- `idPrefix?: string`
- `authorProfiles?: readonly AuthorProfile[] | undefined`
- `moreInCategory?: readonly ArticleListItem[] | undefined`
- `related?: readonly ArticleListItem[] | undefined`

Public props should remain narrow and semantic. Do not add broad configuration
objects or boolean clusters when a named variant or a smaller component would
make invalid states harder to express.

## Composition Relationships

```text
EndcapStack
  ArticleEndcap
    SupportBlock
    MoreInCategoryBlock
    RelatedArticlesBlock
    optional AuthorBioBlock
```

`ArticleEndcap` owns editorial continuation surfaces only. References,
bibliography, and tags are article apparatus/final metadata and live outside
this component.

## Layout And Responsiveness

The component must respect a readable prose measure, keep continuation surfaces
visually subordinate to the article body, and render support before
same-category discovery, followed by related reading and optional author bio
surfaces when useful author profile metadata exists.

## Layering And Scrolling

The component should avoid creating a stacking context unless it owns an overlay,
sticky region, or popover. Any `z-index`, sticky offset, fixed size, or scroll
container is part of this component's public design and needs an invariant test.

## Interaction States

Default, long-content, missing optional content, hover, focus-visible, and dark-mode states should be represented in the catalog when relevant. Empty lists, missing image/description, many tags, one-item lists, and dense lists should have catalog examples or tests where applicable.

## Accessibility Semantics

Use semantic HTML first, preserve heading order when headings are rendered, and
keep focus-visible states intact for any interactive descendants. The endcap is
an article-scoped `aside` rather than a `footer`, so article pages keep a single
site-level contentinfo/footer landmark.

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
- renders Support The Philosopher's Meme before More in Category.
- renders related discovery after same-category discovery.
- renders author bio surfaces only when there is real approved profile
  metadata, never placeholder text.
- leaves article apparatus such as notes/bibliography and final metadata such
  as tags outside the endcap.

## Follow-Up Notes

- No component-specific brittle decision is known yet; add one here when implementation review finds a questionable or fragile choice.
