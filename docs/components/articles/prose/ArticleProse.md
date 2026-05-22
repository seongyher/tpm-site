# Article Prose

Source: `src/components/articles/prose/ArticleProse.astro`

## Purpose

`ArticleProse` contains Tailwind Typography rules, readable measure, and shared
progressive enhancement hooks for rendered article Markdown or MDX prose.

## Public Contract

- `enableImageInspector?: boolean`

Public props should remain narrow and semantic. Do not add broad configuration
objects or boolean clusters when a named variant or a smaller component would
make invalid states harder to express.

## Composition Relationships

```text
ArticleLayout
  ArticleProse
    rendered Markdown/MDX body
    article image inspector enhancement
```

`ArticleProse` should not parse Markdown source or inspect image paths. The
article-image rehype plugin owns generated Markdown image anatomy. `ArticleProse`
owns the prose wrapper and installs the shared client-side enhancement that lets
inspectable figures open in a full-screen image viewer.

## Layout And Responsiveness

The component must respect a readable prose measure and start cleanly after the
article header. The first rendered prose child should not add extra top margin;
hero/media-specific spacing belongs to an explicit media component, not to a
permanent prose offset.

Markdown image sizing is not a page-level patch. The simplified editorial image
contract is owned by the article-image rehype plugin and the shared
`ArticleImage` helper. `ArticleProse` may provide fallback prose image safety
classes, but it must not be the only layer responsible for bounding generated
article media.

## Layering And Scrolling

The component should avoid creating a stacking context unless it owns an
overlay, sticky region, or popover. Anchor offset is owned globally through
document `scroll-padding-top`, not by per-heading margins in prose, so direct
hash navigation and TOC links share one sticky-header contract.

## Interaction States

Default prose, first-child prose, Markdown image, linked image, full-screen
image inspector, no-JavaScript preview, hover/focus, and dark-mode states should
be represented in the catalog or tests when relevant.

## Accessibility Semantics

Use semantic HTML first, preserve heading order when headings are rendered, and
keep focus-visible states intact for any interactive descendants. The image
inspector must support keyboard operation, `Escape` close, icon close-button
focus, and focus return to the trigger.

## Content Edge Cases

Test or catalog long titles, long words, dense content, empty content, missing
optional fields, and unusual punctuation whenever this component renders user or
author-provided content.

## Theme Behavior

Use semantic color tokens and Tailwind utilities. Light and dark mode must keep
text readable, borders visible when they communicate structure, focus rings
visible, and CTAs distinguishable from neutral actions.

## Testable Invariants

- renders without horizontal overflow at mobile, tablet, desktop, and wide
  desktop widths.
- preserves readable text and visible focus/hover states in light and dark
  themes.
- handles long content without clipping or overlapping neighboring components.
- keeps article title, metadata, tags, and links semantically associated.
- keeps article body close to the header when no hero image is rendered.
- lets article media components own their own spacing when a hero/media surface
  is present.
- installs article image inspection behavior without hydrating a framework
  island.
- installs the image inspector only for articles with inspectable generated or
  explicit article images.
- keeps inspectable image behavior progressive: the prose preview remains useful
  if JavaScript fails.
- does not make article routes or visual components parse Markdown source for
  image metadata.

## Follow-Up Notes

- No component-specific brittle decision is known yet; add one here when
  implementation review finds a questionable or fragile choice.
- Article TOC data should come from Astro's rendered heading metadata or a
  normalized view model, not from this component querying rendered DOM or
  parsing Markdown source.
- Keep this component aligned with
  `docs/rehype-plugins/article-images.md`; that technical design is the source
  of truth for default Markdown image behavior.
