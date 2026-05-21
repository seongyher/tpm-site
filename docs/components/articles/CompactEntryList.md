# CompactEntryList

Source: `src/components/articles/CompactEntryList.astro`

## Purpose

`CompactEntryList` renders dense article-like entry lists for homepage panels,
sidebars, announcements, and curated collections.

## Public Contract

- `items: readonly CompactEntryItem[]`
- `ordered?: boolean`
- `dividers?: boolean`
- `showDescription?: boolean`
- `descriptionLines?: 1 | 2 | 3`
- `rowTitleLevel?: 3 | 4`
- `emptyText?: string`

## Invariants

- Uses `ol` by default and `ul` when `ordered={false}`.
- Renders a compact empty state when there are no items.
- Delegates each row to `CompactEntryRow`.
- Keeps dividers local to list item boundaries.
