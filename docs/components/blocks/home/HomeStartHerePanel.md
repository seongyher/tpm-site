# Home Start Here Panel

Source: `src/components/blocks/home/HomeStartHerePanel.astro`

## Purpose

`HomeStartHerePanel` gives new readers a curated path into TPM. It displays a
small ordered list of article links and must not fetch or choose articles
itself.

## Public Contract

- `items`: display-ready article list items.
- `title`: optional heading, default `Start Here`.
- `description`: optional short helper copy.

## Composition Relationships

It is normally the left panel of `HomeMastheadBlock`, sibling to the hero and
current panels. It can stand alone in catalog or future editorial layouts.

## Layout And Responsiveness

The panel is compact, wraps long titles, and clamps each title to two lines. It
uses normal flow and no fixed height.

## Layering And Scrolling

No layering or custom scrolling is intended.

## Interaction States

Article links support hover and focus-visible states through `TextLink`. Empty
state copy renders when no items are supplied.

## Accessibility Semantics

The component is a labeled `section` with an ordered list because the curated
sequence is meaningful.

## Content Edge Cases

Long article titles clamp. Missing category metadata is allowed. Empty items
render a non-link fallback.

## Theme Behavior

Uses semantic muted panel tokens and inherited link tokens.

## Testable Invariants

- Renders a labeled section and ordered list when items exist.
- Empty state does not render an empty list.
- Long titles stay inside the panel.
