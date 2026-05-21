# PublishableOpenGraphMeta

Source: `src/components/seo/PublishableOpenGraphMeta.astro`

## Purpose

`PublishableOpenGraphMeta` emits article-style Open Graph metadata for
publishable entries.

## Public Contract

- `author: string`
- `publishedAt: Date`
- `updatedAt?: Date`
- `section?: string`
- `tags?: readonly string[]`

## Invariants

- Emits publication and modified times as ISO strings.
- Omits optional metadata when missing.
- Emits each tag as `article:tag`.
- Does not render visible UI or fetch content.
