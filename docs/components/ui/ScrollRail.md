# ScrollRail

Source: `src/components/ui/ScrollRail.astro`

## Purpose

`ScrollRail` owns the horizontal scrolling viewport, edge fades, and real
previous/next controls for one-row discovery rails.

## Public Contract

- `railId: string`
- `previousLabel: string`
- `nextLabel: string`
- `viewportClass?: HTMLAttributes<"div">["class"]`
- `listClass?: HTMLAttributes<"ul">["class"]`
- Default slot renders `li` children.

## Invariants

- The viewport remains scrollable without JavaScript.
- Controls are real buttons for users who cannot horizontally scroll.
- Edge fades and controls appear only when overflow exists in that direction.
- Items stay in a single row and do not force page-level horizontal overflow.
