# Site Head

Source: `src/components/seo/SiteHead.astro`

## Purpose

`SiteHead` serves as a metadata component for machine-readable publication surfaces.

## Public Contract

- `canonicalPath: string`
- `description: string`
- `image?: SocialPreviewImage | undefined`
- `metadata: RouteMetadata`
- `structuredData?: readonly (JsonLdNode | undefined)[]`
- `title: string`
- `type?: "website" | "article"`
- `webPageMainEntity?: JsonLdNode | undefined`

Public props should remain narrow and semantic. Do not add broad configuration
objects or boolean clusters when a named variant or a smaller component would
make invalid states harder to express.

`webPageMainEntity` is reserved for route page types whose Schema.org contract
requires a primary entity. Author profile routes use it to satisfy
`ProfilePage.mainEntity`; generic pages should omit it.

## Composition Relationships

It composes local components: `../../lib/routes`, `../../lib/seo`. Parent blocks should pass normalized props and slots rather than asking this component to fetch global content directly.

## Layout And Responsiveness

The component should follow normal flow, use Tailwind tokens, and keep responsive behavior local to the component.

## Layering And Scrolling

The component should avoid creating a stacking context unless it owns an overlay,
sticky region, or popover. Any `z-index`, sticky offset, fixed size, or scroll
container is part of this component's public design and needs an invariant test.

## Interaction States

Default, long-content, missing optional content, hover, focus-visible, and dark-mode states should be represented in the catalog when relevant.

## Accessibility Semantics

Output machine-readable metadata safely and deterministically without duplicating critical document titles or canonical references incorrectly.

## Content Edge Cases

Test or catalog long titles, long words, dense content, empty content, missing
optional fields, and unusual punctuation whenever this component renders user or
author-provided content.

## Theme Behavior

Use semantic color tokens and Tailwind utilities. Light and dark mode must keep
text readable, borders visible when they communicate structure, focus rings
visible, and CTAs distinguishable from neutral actions.

## Testable Invariants

- renders without horizontal overflow at mobile, tablet, desktop, and wide desktop widths.
- preserves readable text and visible focus/hover states in light and dark themes.
- handles long content without clipping or overlapping neighboring components.
- outputs valid escaped JSON or metadata.
- uses canonical URLs derived from route helpers/site config.
- emits `ProfilePage.mainEntity` for author profile routes.
- image metadata, when present, points to a generated social preview image with
  declared width, height, MIME type, and alt text.

## Follow-Up Notes

- No component-specific brittle decision is known yet; add one here when implementation review finds a questionable or fragile choice.
