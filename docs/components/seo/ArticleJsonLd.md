# Article Json Ld

Source: `src/components/seo/ArticleJsonLd.astro`

## Purpose

`ArticleJsonLd` emits deterministic machine-readable metadata for an article.

It should reflect the same canonical URL, title, dates, category, images, and
authors that visible article surfaces use.

If an article opts into validated `semantic` frontmatter, the component emits a
JSON-LD graph containing the base `BlogPosting` plus the semantic profile node.
The base article links to semantic nodes through `about`.

## Public Contract

- `article: ArticleEntry`
- `authors?: readonly AuthorSummary[] | undefined`
- `category?: CategorySummary | undefined`
- `image?: SocialPreviewImage | undefined`

Public props should remain narrow and semantic. Do not add broad configuration
objects or boolean clusters when a named variant or a smaller component would
make invalid states harder to express.

## Composition Relationships

```text
ArticleLayout / SEO head boundary
  ArticleJsonLd
    route helpers
    SEO helpers
    semantic metadata helpers
```

This component should consume normalized article and author summaries from the
route or article view model. It should not free-text match author names or fetch
author profiles itself.

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
- uses the same generated social preview image as Open Graph/Twitter metadata
  instead of deriving a raw source image from article frontmatter.
- emits structured `Person` or `Organization` author objects only when author
  metadata supports that interpretation.
- falls back conservatively while legacy `author` strings still exist.
- emits optional semantic profile nodes only from validated frontmatter, never
  from prose inference or arbitrary JSON-LD.

## Follow-Up Notes

- Do not infer personal websites, social profiles, avatars, or real identities
  in JSON-LD. Public author metadata requires explicit content-owner approval.
- Keep semantic JSON-LD paired with visible `SemanticDetails` output so hidden
  machine-only facts do not drift away from the reader-facing page.
