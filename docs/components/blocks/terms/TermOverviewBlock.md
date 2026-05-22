# Term Overview Block

Source: `src/components/blocks/terms/TermOverviewBlock.astro`

## Purpose

`TermOverviewBlock` renders a reusable browsing overview for article-grouping
terms such as categories, tags, and editorial collection indexes. It owns the
shared visual pattern, not the domain-specific data lookup.

## Public Contract

- `columns?: "compact" | "default"`
- `description?: string | undefined`
- `headingLevel?: 1 | 2`
- `headingId?: string`
- `items: readonly TermOverviewItem[]`
- `itemNoun?: string`
- `itemNounPlural?: string`
- `title?: string`

`TermOverviewItem`:

- `count: number`
- `description?: string | undefined`
- `href: string`
- `title: string`

## Composition Relationships

`CategoryOverviewBlock` adapts category navigation data into this component.
The tags and collections index routes adapt their summaries into this
component. Parents fetch and normalize data; `TermOverviewBlock` only renders
the provided terms.

`TermOverviewBlock` renders each item through `TermCard`. `TermCard` owns the
shared linked term cell, count pluralization, description placement, and
alignment variants used by both grid and rail adapters.

## Layout And Responsiveness

The block uses the browsing page measure supplied by its parent. It renders one
column by default, two columns in compact contexts at small widths, and four
columns on wide screens for default density.

Term cells are flat bordered list items. They are not nested cards and should
not create a bespoke page width. Long labels and descriptions wrap inside the
cell without horizontal overflow.

## Layering And Scrolling

No overlay, sticky, fixed, or custom scroll behavior is intended.

## Interaction States

Term links have hover and focus-visible states. Empty lists render a quiet empty
state rather than an empty grid. Long labels, many terms, one term, and missing
descriptions are valid states.

## Accessibility Semantics

The block renders a labeled section, a heading, and a semantic list. The caller
chooses `headingLevel` so pages keep one `h1`. Links use their visible term
label as the accessible name.

## Content Edge Cases

The component must handle long labels, punctuation, encoded terms, zero counts,
missing descriptions, empty lists, many terms, and dense article counts.

## Theme Behavior

Use semantic color tokens for background, border, text, muted text, link states,
and focus rings. Light and dark mode must preserve readable labels and visible
cell boundaries.

## Testable Invariants

- renders a single heading at the requested level;
- renders each term as a link with the correct `href`;
- pluralizes the configured item noun correctly;
- renders an empty state when no items exist;
- handles long labels without horizontal overflow;
- preserves focus-visible link styling.

## Follow-Up Notes

- Keep this component domain-neutral. If category or tag behavior starts
  leaking into it, move that behavior back into the caller adapter.
