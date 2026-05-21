# ArticleHeaderActionRow

Source: `src/components/articles/ArticleHeaderActionRow.astro`

## Purpose

`ArticleHeaderActionRow` is the compact utility row for article header actions:
Cite, Share, PDF, and future article-level tools.

## Public Contract

- Accepts native `div` attributes.
- Default slot renders action controls.

## Invariants

- Uses the shared article-header action row classes.
- Excludes itself from generated PDFs with `data-pdf-exclude`.
- Keeps actions in one compact row that can wrap safely on narrow viewports.
