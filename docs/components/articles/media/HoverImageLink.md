# Hover Image Link

Source: `src/components/articles/media/HoverImageLink.astro`

## Purpose

`HoverImageLink` is the stable author-facing MDX wrapper for an inline
hover-image preview link.

## Public Contract

- `alt?: string`
- `expanded?: boolean`
- `image: ImageMetadata`
- `label: string`

Public props should remain narrow and semantic. Do not add broad configuration
objects or boolean clusters when a named variant or a smaller component would
make invalid states harder to express.

## Composition Relationships

It composes `./HoverImageCard.astro` and forwards the author-facing props
unchanged.

## Layout And Responsiveness

The component must stay inline inside article prose. It must not add paragraph
or block wrappers around the trigger.

## Layering And Scrolling

The component should avoid creating a stacking context unless it owns an overlay,
sticky region, or popover. Any `z-index`, sticky offset, fixed size, or scroll
container is part of this component's public design and needs an invariant test.

## Interaction States

Default, long-content, missing optional content, hover, focus-visible, and dark-mode states should be represented in the catalog when relevant. Disabled, invalid, pressed/current, active, and keyboard states should be visible where the component supports them.

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

- Preserves the author-facing `image`, `label`, `alt`, and `expanded` API.
- Emits the native anchored preview component without React hydration.
- Keeps the trigger inline with surrounding prose.

## Follow-Up Notes

- No component-specific brittle decision is known yet; add one here when implementation review finds a questionable or fragile choice.
