# FlatArticleList

Source: `src/components/articles/lists/FlatArticleList.astro`

## Purpose

`FlatArticleList` groups compact publishable-entry links under a concise
heading. It is for narrow homepage and sidebar surfaces, not full archive
pages.

## Public Contract

- `title`: visible section heading.
- `titleHref?: string`: optional destination for a linked heading.
- `items`: normalized publishable entries.
- `emptyText?`: quiet empty-state copy.
- `headingLevel?`: `2` by default, `3` for nested contexts.

## Intentions

- Prefer separators and whitespace over cards.
- Keep section headings short.
- Make headings linkable when the list is a preview of a fuller directory, such
  as Start Here or Announcements on the homepage.
- Use the shared `FlatArticleTeaser` for each item.
- Accept normalized publishable items from articles, announcements,
  collections, related-content helpers, author pages, tag pages, or future
  compact discovery surfaces.
- Render a quiet empty state when no items are available.

## Responsive Behavior

The list is a single column at every width. Parent layouts decide whether the
list sits in a thin rail or full-width mobile stack.

## Invariants

- The section is labelled by its heading.
- If `titleHref` is provided, the visible heading link is the section label.
- Items render in caller-provided order.
- The component introduces no client JavaScript.
- The component does not own article, announcement, collection, or fallback
  selection logic.
