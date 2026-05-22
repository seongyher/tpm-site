# HomeFeaturedSlide

Source: `src/components/blocks/home/HomeFeaturedSlide.astro`

## Purpose

`HomeFeaturedSlide` renders one normalized homepage featured item. Article
features inherit article metadata, while link features display explicit title
and link-label data.

## Intentions

- Keep article features DRY by relying on normalized article metadata.
- Let link features cover books, events, support drives, community links, and
  internal routes without new component variants.
- Use flat editorial styling with optional thumbnail media.

## Invariants

- The slide title links to the featured destination.
- Link features render their `linkLabel` action.
- Article features can render category/date metadata and description inherited
  from the article.
- The optional Markdown body is supporting copy, not duplicated metadata.
- Slide metadata, title, and media are anchored to fixed top positions so
  carousel changes do not make the feature content jump vertically.
