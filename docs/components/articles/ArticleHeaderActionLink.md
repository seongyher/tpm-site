# ArticleHeaderActionLink

Source: `src/components/articles/ArticleHeaderActionLink.astro`

## Purpose

`ArticleHeaderActionLink` renders link-style article header utilities such as
the PDF action while preserving the shared action-row visual contract.

## Public Contract

- `href: string`
- `label: string`
- Default slot renders icon and visible label content.
- `aria-label` defaults to `label`.

## Invariants

- Uses `TextLink` with the article-header action classes.
- Keeps the action semantically a link.
- Does not own article action ordering; `ArticleHeaderActionRow` does.
