# Article Table Of Contents

Source: `src/components/articles/toc/ArticleTableOfContents.astro`

## Purpose

`ArticleTableOfContents` renders article-local heading navigation in either the
reading margin rail or an in-flow article contents section. It helps readers
stay oriented inside long articles after global category navigation moves into
site navigation.

It must not parse Markdown source, fetch article content, or render global
category discovery.

## Public Contract

- `headings: readonly ArticleHeading[]`
- `label?: string`
- `initiallyOpen?: boolean`
- `placement?: "rail" | "inline"`

`ArticleHeading` should be normalized outside this component and include:

- stable heading ID;
- display text;
- heading depth;
- normalized nesting level;
- original order.

The normalized input includes Astro-rendered Markdown headings plus generated
article apparatus headings when they exist. `ArticleFootnotes` contributes a
`Notes` `h2` with `id="article-references-notes-heading"` when notes exist.
`ArticleBibliography` contributes a `Bibliography` `h2` with
`id="article-references-bibliography-heading"` when citations exist. These
generated headings are included intentionally so footnotes and bibliography are
reachable through the same article-local navigation instead of depending on an
incidental Markdown-only extraction pass.

Render nothing when there are too few useful headings.

## Composition Relationships

```text
ReadingBody
  MarginSidebarLayout
    ContentRail
      ArticleTableOfContents
        TableOfContentsToggle
        TableOfContentsItem
  article content
    ArticleTableOfContents placement="inline"
    ArticleProse
```

`ArticleLayout` or the article route passes normalized headings. The TOC owns
article-local navigation markup. `MarginSidebarLayout` and `ContentRail` own
rail geometry and sticky behavior.

## Layout And Responsiveness

Mobile/tablet base: no persistent side rail. Render the inline placement near
the top of the article body as an article-native contents section. It should
start open by default because the section is useful orientation, not secondary
chrome. When open, it should feel like article structure: a concise `Contents`
heading, hierarchical section links, visibly subordinate subsections, and
enough rhythm to separate it from the article body. Inline numbering should use
article-outline labels such as `1`, `1.1`, `1.2`, and `2`, so readers can scan
major sections and subsections as one outline. When collapsed, it should be
intentionally tiny: only a one-line `Show Contents` summary with minimal
vertical padding and no leftover section spacing, border, or rule. Hiding the
rail must not cause the reading column to drift off center.

The inline placement must not inherit the rail's visual language. Do not render
the rail side border, rail indentation, sidebar-density styling, or persistent
rail chrome in the article flow. Numbering belongs only to the inline article
contents section, not the rail.

Desktop: render in the left margin rail only when at least two useful headings
exist and there is enough room for a symmetric reading grid. The rail starts
compact on constrained desktop widths and may widen on larger screens. The rail
must not squeeze, overlap, or visually pull article prose off center.

Short viewport: the rail must stay below the sticky header and become scrollable
if its content is taller than available space.

## Layering And Scrolling

The TOC does not own sticky positioning directly; `ContentRail` does. Links use
hash navigation to existing heading IDs. Global document `scroll-padding-top`
keeps heading targets below the sticky header.

## Interaction States

Use native `details`/`summary` for hide/show:

- open;
- collapsed;
- focus-visible summary;
- long-heading wrapping;
- current section as progressive enhancement.

The rail summary should stay terse: `Hide` when open and `Show Contents` when
collapsed. The inline summary should expose the open section as `Contents` with
a compact `Hide` affordance; when closed, it should show only
`Show Contents`.

Do not require JavaScript for basic navigation or hide/show behavior.
`src/scripts/article-table-of-contents.ts` only enhances visible active-section
state and must not be required for hash links or disclosure behavior to work.

## Accessibility Semantics

Render a labeled navigation region such as
`aria-label="Article table of contents"`.
Use normal anchor links. Do not use app-menu roles.

The summary/toggle text must be visible and keyboard reachable. Rail visible
state text is intentionally terse: `Hide` when open and `Show Contents` when
collapsed. Inline open state may show a `Contents` label because it is the
article's contents section, not a persistent rail. Do not render a redundant
visible `Article Contents` label above the rail list. If active section
highlighting is available, use
`data-current="true"` for styling and `aria-current="location"` for the active
in-page anchor.

## Content Edge Cases

Handle:

- no headings;
- one heading;
- no references;
- notes only;
- citations only;
- both notes and citations;
- many headings;
- duplicate heading text;
- long heading text;
- skipped heading levels;
- headings with punctuation;
- heading links after article images or embeds;
- browser zoom and narrow desktop widths.

## Theme Behavior

Use quiet semantic tokens. TOC text should be readable but secondary to article
prose. Current/focus states must be visible in light and dark mode.

## Testable Invariants

- Renders nothing when heading count is below the useful threshold.
- Uses normalized heading IDs without generating its own slugs.
- Preserves article heading order.
- Does not include article title/H1.
- Includes generated Notes and Bibliography headings when those sections render.
- Does not include generated reference headings when their corresponding
  section is empty.
- Keeps long headings inside rail width.
- Hide/show works without JavaScript.
- Rail never overlaps prose or hides under the sticky header.
- Inline placement is visible whenever the rail is hidden by responsive
  constraints.
- Inline placement starts open by default.
- Inline open state visually distinguishes primary sections from subsections.
- Inline section links use hierarchical outline numbering; rail items are not
  numbered.
- Inline collapsed state is compact and does not leave a large article-body gap.
- Reading content remains centered with the TOC visible, hidden by responsive
  constraints, or collapsed with the native disclosure.
- Links navigate to visible heading targets.
- Current-section highlighting follows scroll position and direct hash/TOC
  navigation without changing static navigation behavior.

## Follow-Up Notes

- Active-section scrollspy is progressive enhancement. Do not make the static
  TOC dependent on it.
