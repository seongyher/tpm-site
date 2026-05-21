# EntryMetaLine

Source: `src/components/articles/EntryMetaLine.astro`

## Purpose

`EntryMetaLine` renders compact metadata with consistent separators and optional
linked items.

## Public Contract

- `items: readonly (string | { label: string; href?: string; prefetch?: ... })[]`
- `as?: "div" | "p"`
- `separator?: string`
- `hideWhenEmpty?: boolean`

## Invariants

- Empty labels are removed before rendering.
- Empty output disappears by default.
- Separators are decorative and not links.
- Linked metadata uses `TextLink` and preserves wrapping.
