# SectionHeader

Source: `src/components/ui/SectionHeader.astro`

## Purpose

`SectionHeader` renders a reusable section heading with optional eyebrow,
description, and right-side action link or action slot.

## Public Contract

- `headingId: string`
- `title: string`
- `headingLevel?: 1 | 2 | 3 | 4`
- `size?: "compact" | "page" | "section" | "subsection"`
- `layout?: "split" | "stacked"`
- `eyebrow?: string`
- `description?: string`
- `actionHref?: string`
- `actionLabel?: string`
- Named `action` slot can replace the action link.

## Invariants

- Renders a real heading with the supplied ID.
- The action area wraps without overlapping the heading.
- Optional regions disappear without dangling separators.
- Action links use the shared `TextLink` treatment.
