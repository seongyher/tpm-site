# Table Of Contents Toggle

Source: `src/components/articles/toc/TableOfContentsToggle.astro`

## Purpose

`TableOfContentsToggle` provides the visible hide/show control for article
contents.

It should make the TOC adaptable without requiring a hydrated component for the
basic collapsed/open behavior.

## Public Contract

- `label?: string`
- `openLabel?: string`
- `closedLabel?: string`
- `placement?: "rail" | "inline"`

The preferred implementation is a native `summary` inside a parent `details`.
If the final implementation needs a separate button, update this one-pager
before adding JavaScript state.

## Composition Relationships

```text
ArticleTableOfContents
  details
    TableOfContentsToggle
    TableOfContentsItem list
```

`ArticleTableOfContents` owns the disclosure wrapper. This component owns the
visible state text and accessible name.

## Layout And Responsiveness

The toggle should be compact and touch-friendly. It must not shift the reading
column when opened or closed.

Rail placement uses compact navigation text: `Hide` when open and
`Show Contents` when closed.

Inline placement has two visual states. When open, the summary row should read
as a small article section header with `Contents` as the dominant label and a
quiet `Hide` affordance. When closed, the summary should collapse to only the
one-line `Show Contents` affordance with minimal vertical padding and no
section-like spacing.

## Layering And Scrolling

No layering. It participates in the sticky rail controlled by `ContentRail`.

## Interaction States

Support:

- open;
- closed;
- hover;
- focus-visible;
- active;
- reduced motion.

Avoid animated height transitions unless they are clearly useful and respect
`prefers-reduced-motion`.

## Accessibility Semantics

Use native disclosure semantics through `summary`. The accessible name should
identify the region as article contents. Rail visible text should only show the
current action/state. Inline open visible text may show `Contents` plus `Hide`
because the inline placement is part of article structure.

## Content Edge Cases

Handle short labels, localized/long labels, icon absence, and browser default
summary marker differences.

## Theme Behavior

Use semantic foreground/muted/border tokens. Focus rings must be visible in
light and dark mode.

## Testable Invariants

- Toggle is keyboard reachable.
- Toggle changes disclosure state without JavaScript.
- Accessible name identifies article contents without rendering a redundant
  visible rail label.
- Inline closed state renders only the compact `Show Contents` affordance.
- Focus-visible state is clear.
- Open/closed state does not change primary content measure.

## Follow-Up Notes

- State persistence is intentionally not required. If persistence is requested,
  use the smallest possible client boundary and update this design first.
