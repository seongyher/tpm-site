# Home Recent Posts Block

Source: `src/components/blocks/home/HomeRecentPostsBlock.astro`

## Purpose

`HomeRecentPostsBlock` gives returning readers a compact list of fresh articles
near a homepage editorial row.

## Public Contract

- `items`: display-ready article list items.
- Optional `title`, default `Most Recent`.

## Composition Relationships

It normally occupies the narrower side of the homepage promo/latest row. The
larger feed lower on the homepage uses `ArticleList`.

## Layout And Responsiveness

The block is a dense vertical list. It does not render thumbnails so it can fit
in the one-third desktop column and stack cleanly on mobile.

## Layering And Scrolling

No layering or custom scrolling is intended.

## Interaction States

Article title links use normal hover and focus-visible states.

## Accessibility Semantics

The component is a labeled `section` with an ordered list.

## Content Edge Cases

Long titles clamp to two lines. Category or date may be missing. Empty state
renders when no items exist.

## Theme Behavior

Uses semantic foreground, muted, border, and focus tokens.

## Testable Invariants

- Renders compact article links without thumbnails.
- Empty state does not render an empty list.
- Titles and metadata stay contained in narrow columns.
