# Home Featured Carousel Controls

Source: `src/components/blocks/home/HomeFeaturedCarouselControls.astro`

## Purpose

`HomeFeaturedCarouselControls` renders the previous button, indicator buttons,
and next button for the homepage featured carousel.

## Public Contract

- `itemCount: number`

## Invariants

- Keeps controls in previous, indicators, next order.
- Uses real buttons with accessible names.
- Preserves the `data-home-featured-*` hooks consumed by
  `src/scripts/home-featured-carousel.ts`.
- Starts hidden so controls only appear after progressive enhancement.
