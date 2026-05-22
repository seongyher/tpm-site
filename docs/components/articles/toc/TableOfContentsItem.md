# Table Of Contents Item

Source: `src/components/articles/toc/TableOfContentsItem.astro`

## Purpose

`TableOfContentsItem` renders one in-page heading link inside
`ArticleTableOfContents`.

It must not compute heading IDs, inspect Markdown, or decide whether the TOC
should render.

## Public Contract

- `heading: ArticleHeading`
- `current?: boolean`
- `placement?: "rail" | "inline"`
- `sectionLabel?: string`

`heading` includes stable ID, text, depth, normalized nesting level, and order.
`sectionLabel` is only for inline outline numbering.

## Composition Relationships

```text
ArticleTableOfContents
  TableOfContentsItem
```

The parent owns list semantics and empty-state decisions. The item owns one
link's indentation, wrapping, current state, and focus behavior.

## Layout And Responsiveness

Items stack vertically. Indentation should be based on normalized heading level,
not raw heading depth. Long heading text wraps instead of overflowing.

Rail items are compact navigation links. Inline items are article contents
links: level 1 entries must read as primary section links, and level 2+ entries
must read as subordinate subsection links through a combination of indentation,
type weight, color, numbering, and rhythm. Indentation alone is not enough for
the inline placement.

Inline entries should display hierarchical outline labels before the link text:
`1`, `1.1`, `1.2`, `2`, etc. Rail entries should never show these section
labels.

## Layering And Scrolling

No layering. Links target existing article heading IDs.

## Interaction States

Support:

- default;
- hover;
- focus-visible;
- active;
- current location if implemented;
- long text.

## Accessibility Semantics

Render a normal anchor. Use `aria-current` only if active-section behavior is
implemented and tested for in-page navigation. Do not use role overrides.

## Content Edge Cases

Handle long text, repeated heading text with distinct IDs, punctuation, numbers,
and deeply nested headings normalized to the supported display depth.

## Theme Behavior

Use semantic link/muted tokens. Focus and current states must be visible in
light and dark mode.

## Testable Invariants

- Uses the supplied heading ID for `href`.
- Does not generate or mutate slugs.
- Wraps long text inside the rail.
- Applies stable indentation from normalized level.
- Visually distinguishes inline primary sections from inline subsections.
- Shows hierarchical section labels only for inline entries.
- Keeps focus-visible state readable.

## Follow-Up Notes

- If active-section highlighting is deferred, keep `current` optional and do not
  add dead state styling that cannot be reached.
