# Hover Image Paragraph

Source: `src/components/articles/media/HoverImageParagraph.astro`

## Purpose

`HoverImageParagraph` renders the legacy paragraph shape used by existing MDX
articles: a hover-image link followed by continuation text.

## Public Contract

- `after: string`
- `alt?: string`
- `expanded?: boolean`
- `image: ImageMetadata`
- `label: string`

Public props should remain narrow and semantic. Do not add broad configuration
objects or boolean clusters when a named variant or a smaller component would
make invalid states harder to express.

## Composition Relationships

It composes `./HoverImageLink.astro` and appends the `after` text in the same
paragraph.

## Layout And Responsiveness

The component must keep the preview link and `after` copy in one paragraph so
the original sentence reads naturally.

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

- Renders exactly one paragraph wrapper.
- Keeps the hover-image link inline with the continuation text.
- Preserves the author-facing `after`, `image`, `label`, `alt`, and `expanded`
  API.

## Follow-Up Notes

- No component-specific brittle decision is known yet; add one here when implementation review finds a questionable or fragile choice.
