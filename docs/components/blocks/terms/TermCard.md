# Term Card

Source: `src/components/blocks/terms/TermCard.astro`

## Purpose

`TermCard` renders one linked browse term such as a category, tag, collection,
or future series. It is the shared cell used by term grids and rails.

## Public Contract

- `align?: "center" | "start"`
- `count: number`
- `description?: string | undefined`
- `href: string`
- `itemNoun?: string`
- `itemNounPlural?: string`
- `title: string`
- Native `li` attributes may be forwarded.

## Invariants

- Renders as a semantic list item.
- Keeps the term title as the primary link.
- Pluralizes the count from the provided noun labels.
- Handles long labels and optional descriptions without horizontal overflow.
