# Article Reference Definition Content

Source: `src/components/articles/references/ArticleReferenceDefinitionContent.astro`

## Purpose

`ArticleReferenceDefinitionContent` renders structured footnote and citation
definition blocks that were normalized by the article reference pipeline.

## Public Contract

- `blocks: readonly ArticleReferenceBlockContent[]`

The component renders trusted structured nodes, not raw Markdown or HTML
strings. It must not parse article source.

## Composition Relationships

Used inside article reference sections and reference hover previews. It composes
`ArticleReferenceInlineContent` for inline children and owns block-level
wrapping, code blocks, and simple indentation.

## Layout And Responsiveness

The component is max-width aware, breaks long words, and allows code blocks to
scroll horizontally inside their own frame rather than overflowing the article
measure or popover.

## Layering And Scrolling

No overlay behavior. Scrolling is limited to inline code-block overflow.

## Interaction States

Links inside rendered reference content own hover and focus-visible states.
The component itself has no expanded, selected, or loading state.

## Accessibility Semantics

Use normal text, paragraph, and code semantics. Link text should remain visible
and keyboard reachable.

## Content Edge Cases

Handle long URLs, long source titles, inline code, code blocks, line breaks,
heading-like source labels, and empty block arrays without producing invalid
layout.

## Theme Behavior

Use semantic text, muted, border, and code background tokens so reference
content remains legible in light and dark themes.

## Testable Invariants

- Long URLs wrap or scroll without page overflow.
- Code blocks stay contained.
- Links remain clickable and focus-visible.
- Empty or minimal reference content does not render broken markup.

## Follow-Up Notes

- If reference content gains richer node kinds, add explicit rendering and
  tests rather than falling back to unsafe HTML.
