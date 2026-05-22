# Home Masthead Block

Source: `src/components/blocks/home/HomeMastheadBlock.astro`

## Purpose

`HomeMastheadBlock` owns the homepage first impression. It balances curated
reading, logo identity, and current/community links in one desktop row while
preserving a clear mobile reading order.

## Public Contract

- Requires `startHereItems`, `currentLinks`, `lightImage`, `darkImage`,
  `imageAlt`, and `tagline`.
- `startHereItems` are display-ready article list items.
- `currentLinks` are compact `{ label, href, description? }` links.
- It composes `HomeStartHerePanel`, `HomeHeroBlock`, and `HomeCurrentPanel`.

## Composition Relationships

The center hero column owns identity and primary CTAs. The side panels are
subordinate editorial panels. The masthead must not rely on absolute
positioning or page-level CSS patches.

## Layout And Responsiveness

Mobile stacks Start Here, hero, and current links in normal flow. Desktop uses a
three-column grid with the center hero slightly larger than either side panel.
All columns use `minmax(0, ...)` so long text wraps instead of causing overflow.

## Layering And Scrolling

No sticky, fixed, overlay, or custom scroll behavior is intended.

## Interaction States

Links use existing link/button focus and hover states. Empty start-here or
current-link states render quiet fallback text.

## Accessibility Semantics

The child panels use section headings. The hero provides the page `h1` through
`HomeHeroBlock`. The first-viewport focus order is Start Here, hero actions,
then current links.

## Content Edge Cases

Long article titles and current-link labels clamp within the side panels.
Missing curated articles should be resolved before rendering by homepage data
helpers.

## Theme Behavior

Panels use semantic background, border, foreground, muted, and focus tokens so
light and dark themes remain readable.

## Testable Invariants

- Desktop renders Start Here, hero, and current panels in that order.
- The hero remains the center column and the logo art is bounded.
- At least one reading link and one support/community path are visible in the
  first viewport when data exists.
- The masthead has no horizontal overflow at mobile, tablet, desktop, or wide
  desktop sizes.

## Follow-Up Notes

Future splash text or richer current-status behavior should remain subordinate
to the reading funnel.
