# Article Reference Backlinks

Source: `src/components/articles/references/ArticleReferenceBacklinks.astro`

## Purpose

`ArticleReferenceBacklinks` renders return links from a note or bibliography
entry back to the inline marker or markers that referenced it.

It exists so footnotes and bibliography entries share accessible backlink
behavior instead of hand-rolling slightly different return links.

## Public Contract

- `references: readonly ArticleReferenceMarker[]`
- `kind: "note" | "citation"`

The component should render nothing when `references` is empty, though empty
references should normally be impossible after validation.

Each marker should include a stable ID and order. The component does not compute
IDs or validate reference relationships.

## Composition Relationships

Target ownership:

```text
ArticleFootnotes
  ArticleReferenceBacklinks

ArticleBibliography
  ArticleReferenceBacklinks
```

`ArticleFootnotes` and `ArticleBibliography` own where backlinks appear inside
each entry. `ArticleReferenceBacklinks` owns backlink labels, compact rendering,
wrapping, and focus behavior.

This component should not know about article layout, tags, support blocks, or
global bibliography pages.

## Layout And Responsiveness

Backlinks should be compact and visually secondary. A single backlink may render
as one small text/icon link. Multiple backlinks should wrap cleanly and remain
easy to target.

Do not use hover-only affordances. The visible target must remain usable on
touch and keyboard.

## Layering And Scrolling

No custom layering is intended. Links point to inline marker IDs in the article
prose. Hash navigation must not place markers under the sticky header if global
scroll-margin behavior applies.

## Interaction States

Support default, hover, focus-visible, active, visited where appropriate, and
target-related states inherited from hash navigation.

## Accessibility Semantics

Each backlink must have an accessible name that distinguishes note and citation
returns, for example:

- `Back to note reference 1`
- `Back to citation reference 2`

If a compact glyph is used visually, include screen-reader text. Do not rely on
title attributes for accessible names.

## Content Edge Cases

Handle:

- one backlink;
- many backlinks;
- large order numbers;
- repeated citation references;
- empty array defensively;
- narrow containers;
- touch input.

Repeated note references should fail before rendering, so note backlinks will
usually contain one marker.

## Theme Behavior

Use semantic text/link tokens. Focus rings and hover states must remain visible
in light and dark mode.

## Testable Invariants

- Renders nothing for an empty marker array.
- Renders one link per marker.
- Generates `href` values pointing to marker IDs.
- Uses accessible names that include note/citation kind and marker order.
- Wraps multiple links without horizontal overflow.
- Keeps focus-visible styles readable in light and dark mode.

## Follow-Up Notes

- If inline markers later use richer labels, backlink accessible names should
  remain stable and not depend on visual marker text alone.
