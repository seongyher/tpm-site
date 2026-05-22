# CompactEntryPanel

Source: `src/components/blocks/shared/CompactEntryPanel.astro`

## Purpose

`CompactEntryPanel` wraps a heading, optional description, and compact entry
list for homepage and sidebar-style discovery panels.

## Public Contract

- `headingId: string`
- `title: string`
- `items: readonly CompactEntryItem[]`
- `description?: string`
- `titleHref?: string`
- `ordered?: boolean`
- `showDescription?: boolean`
- `emptyText?: string`

## Invariants

- Renders a labelled `section`.
- Title can be plain text or a `TextLink`.
- Delegates list behavior and empty state to `CompactEntryList`.
- Keeps panel padding and border local to the block.
