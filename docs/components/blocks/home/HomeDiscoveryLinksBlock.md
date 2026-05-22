# Home Discovery Links Block

Source: `src/components/blocks/home/HomeDiscoveryLinksBlock.astro`

## Purpose

`HomeDiscoveryLinksBlock` is a compact inline first-row reading navigation
strip. It quietly points to the core browsing surfaces before the homepage lead
content.

## Public Contract

- `links`: ordered `{ label, href }` list.
- Optional `title`, default `Read`.

## Composition Relationships

It appears above the homepage lead grid.

## Layout And Responsiveness

The strip stays on one line, is left-aligned, and uses intrinsic width. It has
no border bars and only minimal vertical padding. It should shrink and truncate
before it wraps or overflows. It should never become a card or a large block.
Homepage owns the small gap between this strip and the lead row so the strip
can sit directly under the site header without changing global browsing-page
spacing.

## Layering And Scrolling

No layering or custom scrolling is intended.

## Interaction States

Links use `TextLink`. Internal paths may prefetch on hover; external links must
not.

## Accessibility Semantics

The component is a `nav` with an explicit accessible label.

## Content Edge Cases

Long labels truncate at the link level and do not force horizontal overflow.

## Theme Behavior

Uses semantic foreground, muted, border, and focus tokens.

## Testable Invariants

- Homepage usage includes Articles, Archive, Authors, Collections, and Tags.
- Tags are represented only as a link to `/tags/`, not enumerated.
- Homepage usage excludes GitHub and RSS.
- The strip remains one line without horizontal overflow.
