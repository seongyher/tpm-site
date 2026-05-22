# Category Rail Block

Source: `src/components/blocks/terms/CategoryRailBlock.astro`

## Purpose

`CategoryRailBlock` renders category navigation as a compact one-row horizontal
rail. It is for surfaces where categories should remain discoverable without
spending the vertical space of a full overview grid.

## Public Contract

- `emptyText?: string`
- `items: readonly SectionNavItem[]`
- `railId?: string`
- `title?: string`
- Native section attributes may be forwarded for labels and stable test hooks.

## Composition Relationships

It adapts category navigation data into the generic `TermRailBlock`, which in
turn composes `ScrollRail` and `TermRailCard`. `HomeCategoryOverviewBlock` is
now a homepage adapter over this same rail contract.

## Layout And Responsiveness

The block renders one horizontal row at every viewport width. Category tiles
share one width and height, stretch evenly when space is available, and scroll
horizontally when the category set does not fit. It does not render a visible
heading; callers provide an accessible section label through `title` or
`aria-label`.

## Interaction States

Native horizontal scrolling works without JavaScript. The previous and next
icon buttons progressively enhance the rail when JavaScript runs and only appear
when there is more content to reveal in that direction.

## Accessibility Semantics

The section owns a label, each category remains a normal link, and the scroll
buttons announce their direction and controlled rail. Focus-visible states must
remain visible on both links and controls.

## Testable Invariants

- Keeps all category tiles in one row.
- Keeps category tiles equal width and height.
- Hides inactive edge fades and controls at the corresponding rail edge.
- Preserves native scrolling and keyboard navigation without JavaScript.
- Uses a compact empty state when no categories are available.
