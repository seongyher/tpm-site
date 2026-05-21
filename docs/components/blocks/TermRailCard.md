# TermRailCard

Source: `src/components/blocks/TermRailCard.astro`

## Purpose

`TermRailCard` adapts `TermCard` for one-row horizontal discovery rails.

## Public Contract

- `href: string`
- `title: string`
- `count: number`
- `description?: string`
- `singularLabel?: string`
- `pluralLabel?: string`

## Invariants

- Uses centered term-card alignment.
- Preserves a stable rail item height.
- Uses `snap-start` so scroll controls land predictably.
- Does not fetch or normalize term data itself.
