# Article Card Body

Source: `src/components/articles/lists/ArticleCardBody.astro`

## Purpose

`ArticleCardBody` owns the text column inside a rich `ArticleCard`: category
and date kicker, title link, optional description, and author metadata.

It exists so `ArticleCard` can stay focused on row composition while media and
text fit policies are tested separately.

## Public Contract

- `author?: string | undefined`
- `authors?: readonly AuthorSummary[] | undefined`
- `category?: { href: string; title: string } | undefined`
- `date?: string | undefined`
- `description?: string | undefined`
- `hasImage?: boolean`
- `href: string`
- `title: string`

## Invariants

- Does not render media or choose images.
- Uses the article-list title and description fit helpers.
- Omits optional regions without dangling separators.
- Keeps category, date, title, excerpt, and author metadata in one scannable
  text stack.
