# Term Rail Block

Source: `src/components/blocks/terms/TermRailBlock.astro`

## Purpose

`TermRailBlock` renders a horizontal rail of generic browse terms. Category
rails adapt category data into this component; future tag, collection, or
series rails should do the same.

## Public Contract

- `emptyText?: string`
- `items: readonly TermRailItem[]`
- `itemNoun?: string`
- `itemNounPlural?: string`
- `railId?: string`
- `title?: string`
- Native `section` attributes may be forwarded.

`TermRailItem`:

- `count: number`
- `description?: string | undefined`
- `href: string`
- `title: string`

## Invariants

- Delegates scroll mechanics, controls, and edge fades to `ScrollRail`.
- Renders term cells through `TermRailCard` and `TermCard`.
- Keeps the rail domain-neutral; category dropdown previews stay outside this
  abstraction.
