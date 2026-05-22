# Article Reference Inline Content

Source: `src/components/articles/references/ArticleReferenceInlineContent.astro`

## Purpose

`ArticleReferenceInlineContent` renders one normalized inline node from a
footnote or citation definition.

## Public Contract

- `content: ArticleReferenceInlineContent`

Supported node kinds include text, inline code, line break, link, emphasis,
strong, and fallback text nodes.

## Composition Relationships

Used by `ArticleReferenceDefinitionContent` and other reference surfaces that
need consistent inline rendering. Parent components own block rhythm.

## Layout And Responsiveness

Inline content should wrap naturally inside paragraphs. Links and code must not
force horizontal overflow in reference sections or hover previews.

## Layering And Scrolling

No layering or scroll behavior.

## Interaction States

Links expose hover and focus-visible states. Other inline nodes are static.

## Accessibility Semantics

Use native inline semantics. Links must keep their `href`, optional `title`,
visible focus, and readable text.

## Content Edge Cases

Handle long URLs, empty labels, nested emphasis/strong content, inline code,
line breaks, and punctuation-heavy citation text.

## Theme Behavior

Use semantic link and code tokens. Do not hard-code colors that break dark mode.

## Testable Invariants

- Links are clickable and keyboard focusable.
- Long link text does not overflow reference surfaces.
- Inline code remains readable at prose scale.
- Nested inline content renders as plain inline text when a rich child label is
  needed.

## Follow-Up Notes

- The current link label flattening is intentionally conservative. Revisit only
  if reference previews need richer inline children inside links.
