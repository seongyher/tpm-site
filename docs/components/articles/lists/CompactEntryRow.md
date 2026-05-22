# CompactEntryRow

Source: `src/components/articles/lists/CompactEntryRow.astro`

## Purpose

`CompactEntryRow` renders one dense publishable-entry teaser with title,
metadata, and optional description.

## Public Contract

- `item: CompactEntryItem`
- `titleLevel?: 3 | 4`
- `showDescription?: boolean`
- `descriptionLines?: 1 | 2 | 3`

## Invariants

- Title links use `TextLink`.
- Metadata is normalized through `EntryMetaLine`.
- Optional descriptions clamp to the requested line count.
- Long titles remain bounded inside compact panels.
