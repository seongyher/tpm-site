# Home Category Overview Block

Source: `src/components/blocks/home/HomeCategoryOverviewBlock.astro`

## Purpose

`HomeCategoryOverviewBlock` adapts the shared `CategoryRailBlock` for homepage
category discovery while staying inside the same comfortable content measure as
the surrounding homepage sections.

## Public Contract

- `items: readonly SectionNavItem[]`
- `title?: string`

Public props should remain narrow and semantic. Do not add broad configuration
objects or boolean clusters when a named variant or a smaller component would
make invalid states harder to express.

## Composition Relationships

It composes `./CategoryRailBlock.astro`. Parent blocks should pass normalized
props and slots rather than asking this component to fetch global content
directly.

## Layout And Responsiveness

The block renders one horizontal row at every viewport width. Items share one
tile width and height. The shared width should be the smallest content-aware
width the largest item needs, then stretch evenly when the rail has extra room.
Items never wrap into a second row, and the rail scrolls horizontally when the
full list does not fit. The section width still comes from `BrowsingBody`, so it
aligns with homepage featured, discovery, and recent sections.

The homepage instance does not render a visible `Categories` heading. The block
keeps an accessible section label and uses centered category names so the rail
reads as a compact navigation strip rather than a stack of cards.

## Layering And Scrolling

The rail owns a local horizontal scroll container and two absolutely positioned
control affordances. Those controls may use a small local `z-index` above the
rail and subtle edge fades, but they must not escape the component or overlap
neighboring homepage sections.

## Interaction States

Default, long-content, missing optional content, hover, focus-visible,
horizontal overflow, and dark-mode states should be represented in the catalog
when relevant. Empty lists, one-item lists, and dense lists should have catalog
examples or tests where applicable.

The previous/next buttons are progressive enhancement. They are hidden by
default so no-JavaScript users never see inert buttons; native horizontal
scrolling and keyboard focus remain available. When JavaScript runs, each edge
control appears only when there is more content in that direction. At the left
edge, the first item is fully visible with no left fade. At the right edge, the
last item is fully visible with no right fade.

## Accessibility Semantics

Use semantic HTML first, preserve heading order when headings are rendered, and
keep focus-visible states intact for any interactive descendants. The homepage
usage labels the section without a visible heading so the page keeps one `h1`
and avoids spending first-screen space on redundant section copy.

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
- aligns with the homepage featured, discovery, and recent measures.
- keeps every category item on one row and scrolls horizontally when needed.
- keeps category items equal width and height while letting the shared width
  stretch evenly to available space.
- centers category labels inside their rail items.
- reveals each functional previous/next icon button only when there is more
  content in that direction.
- keeps the first and last item clear at the corresponding scroll edge by
  hiding the inactive edge fade and control.
- keeps native horizontal scrolling and keyboard navigation usable without
  JavaScript.
- renders empty and missing-content states without throwing or leaving broken layout.

## Follow-Up Notes

- No component-specific brittle decision is known yet; add one here when implementation review finds a questionable or fragile choice.
