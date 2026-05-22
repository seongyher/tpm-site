# HomeFeaturedCarousel

Source: `src/components/blocks/home/HomeFeaturedCarousel.astro`

## Purpose

`HomeFeaturedCarousel` owns the homepage Featured slot. It shows one featured
item at a time while keeping the first item available as static HTML when
JavaScript is unavailable.

The component exposes an accessible label but does not render a visible
`Featured` heading on the homepage. The surrounding homepage layout already
communicates the slot; removing the heading saves vertical space and keeps the
feature itself primary.

`HomeFeaturedCarouselControls` owns the previous/next buttons and indicator
row. The parent carousel owns the viewport, enhancement script, empty/single
item behavior, and accessible region label.

## Intentions

- Keep Featured calm and editorial, not promotional clutter.
- Render no controls for zero or one item.
- Reveal controls only after the browser script is active.
- Use real buttons for previous, next, and item indicators.
- Place previous, next, and item indicators in one bottom control row.
- Keep the carousel region stable so rotation does not shift the page.
- Fit the homepage wide second-row lead cell without changing height when
  slides change.

## Interaction

When multiple featured items exist, `src/scripts/home-featured-carousel.ts`
enhances the static markup:

- rotates on a slow interval when motion is allowed;
- pauses on focus, hover, pointer interaction, and manual control use;
- disables auto-rotation for reduced-motion users;
- hides inactive slides from keyboard and screen readers;
- keeps enhanced inactive slides laid out invisibly in the same grid cell so
  the viewport height is based on the largest slide instead of the active
  slide.

## Invariants

- The first slide is visible in static HTML.
- Before enhancement, inactive slides are `hidden`; after enhancement, inactive
  slides are laid out invisibly, `aria-hidden`, and inert.
- Controls are keyboard reachable only when enhancement is active.
- The viewport height is owned by the carousel's layout contract, not by
  whichever slide is currently active.
- The viewport top-aligns the active slide; slide changes must not move the
  metadata, title, or media anchors up and down.
- The component has an accessible name even when no visible heading is
  rendered.
- The carousel and Announcements cell align through the parent lead grid row,
  not through component-specific margin offsets.
- No React or framework island is required.
