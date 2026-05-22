# NextArticleBlock

Source: `src/components/articles/endcap/NextArticleBlock.astro`

`NextArticleBlock` renders one chronological continuation at the end of an
article. It is not a recommendation engine. It receives a preselected
article-list item and a label from article layout logic.

## Contract

- `item` is optional. If absent, the component renders nothing.
- `label` is either `Next Article` or `Previous Article`.
- The block uses the shared `ArticleList` display so responsive image, title,
  description, and metadata behavior matches archive and related-article lists.
- The block is placed above the support call to action in `ArticleEndcap`.

## Selection Rules

Selection lives in `src/lib/content/article-continuity.ts`:

1. Sort published articles oldest to newest.
2. Select the immediate newer article for the current article.
3. If the current article is newest, fall back to the immediate older article.
4. If there is no neighbor, render no block.

Announcements are excluded. Announcement continuity belongs to announcement
routes if that product need appears later.

## Testable Invariants

- Middle articles render `Next Article` with the immediate newer article.
- The newest article renders `Previous Article` with the immediate older
  article.
- A single-article corpus renders no continuity section.
- Article pages render the continuity section before the support block and keep
  the endcap within the prose measure.
