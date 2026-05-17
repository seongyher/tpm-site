# SemanticDetails

`SemanticDetails` renders the visible facts for optional article-like
`semantic` metadata. It keeps structured-data parity explicit: if a semantic
profile emits JSON-LD, the same normalized facts should be visible to readers.

## Ownership

- Owns a compact details surface for validated semantic metadata.
- Renders only non-empty facts supplied by `semanticDetailsViewModel()`.
- Does not decide which semantic profile is valid.
- Does not build JSON-LD.

## Accessibility

Use an `aside` with an accessible label matching the profile heading. Facts are
rendered as a real description list so labels and values remain associated.
Links remain ordinary links.

## Styling

Use quiet article-header styling: semantic foreground/muted/border tokens, no
card nesting, and compact vertical rhythm. The component should not dominate
the article header; it is supporting metadata.

## Tests

- Component rendering and empty-state behavior:
  `tests/src/components/articles/SemanticDetails.vitest.ts`.
- Normalized details and JSON-LD source data:
  `tests/src/lib/semantic-metadata.test.ts`.
