# FlatArticleTeaser

Source: `src/components/articles/lists/FlatArticleTeaser.astro`

## Purpose

`FlatArticleTeaser` renders one compact publishable-entry link for dense
editorial lists. It is the primitive for homepage rails such as Announcements
and Start Here where a full article card would add too much visual noise.

## Intentions

- Keep the design flat: no card shell, no background panel, no nested box.
- Show title first, then compact metadata.
- Let the title wrap to two lines without changing surrounding layout.
- Reuse the source-agnostic `PublishableListItem` data shape. The compatibility
  `ArticleListItem` name remains available for older article-only callers.
- Keep links ordinary static HTML with hover prefetch for internal routes.

## Invariants

- The component renders one article landmark.
- The title link is always present.
- Metadata is omitted entirely when no metadata exists.
- It does not fetch content, inspect collections, or branch on source
  collection.
