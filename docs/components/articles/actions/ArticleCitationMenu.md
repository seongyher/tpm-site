# Article Citation Menu

Source: `src/components/articles/actions/ArticleCitationMenu.astro`

## Purpose

`ArticleCitationMenu` lets readers generate citations for the current TPM
article. It is a quiet article-header utility with the visible label `Cite`,
the accessible name `Cite this article`, and the Lucide `Quote` icon. The
trigger lives in the article category/action row; the formats live in an anchored
popover so the feature does not reserve reading space.

It must generate citations from structured article metadata, not from rendered
DOM text.

## Public Contract

Prefer a narrow normalized view model over a content collection entry:

```ts
interface ArticleCitationMenuViewModel {
  articleId: string;
  canonicalUrl: string;
  formats: readonly GeneratedArticleCitation[];
  title: string;
}

interface GeneratedArticleCitation {
  id:
    | "apa"
    | "bibtex"
    | "chicago-author-date"
    | "chicago-notes"
    | "harvard"
    | "ieee"
    | "mla"
    | "ris";
  label:
    | "APA"
    | "BibTeX"
    | "Chicago Author-Date"
    | "Chicago Notes"
    | "Harvard"
    | "IEEE"
    | "MLA"
    | "RIS";
  text: string;
}
```

The data helper, not the component, should receive article metadata:

- title;
- structured authors when available;
- legacy byline fallback;
- publication date;
- canonical URL;
- site name.

Supported formats:

- APA;
- MLA;
- Chicago Notes;
- Chicago Author-Date;
- Harvard;
- IEEE;
- BibTeX;
- RIS.

These generators are deterministic web-article citations for TPM's own article
metadata. They are not a general-purpose citation-style processor for arbitrary
source data.

The component should receive display-ready generated strings from a helper such
as `src/lib/references/citations/article-citation.ts`. It should not hand-format citation
styles inline.

Do not include an accessed date in the first static implementation. Accessed
dates are reader-time data, while Astro output is build-time static HTML. A
future enhancement can add an optional dynamic accessed date deliberately, but
the first implementation should avoid pretending build date is reader access
date.

## Composition Relationships

```text
ArticleLayout
  ArticleHeader
    ArticleMeta
    ArticleCitationMenu
      button trigger
      citation style button group
      selected citation text block
      copy button
```

`ArticleHeader` owns placement in the category/action row. `ArticleCitationMenu`
owns the anchored popover, style selector, selected citation text, and copy control.
A small browser script may own style switching and clipboard enhancement, but
the selected citation text must remain visible and selectable if copy fails.

## Layout And Responsiveness

The trigger should sit at the inline end of the article category/action row,
aligned to the article header width. It should use a small secondary visual
scale and should wrap within that row on narrow screens if needed rather than
forcing the header to overflow.

The revealed panel is an anchored popover. Opening it must not increase article
header height or push body text down. The panel should stay close to the
trigger, align to the trigger's inline end by default, and use the shared
anchored-positioning primitive to avoid viewport overflow.

The opened popover shows a compact citation-style selector and one selected
citation text block. The style selector is visually a divided grid of style
labels, evenly distributed as rows of four where space allows. The interactive
cells remain semantic buttons for keyboard and assistive-technology support,
but they should not look like separate chunky action buttons. Selecting a style
updates the one text block in place; the component must not render one
dropdown, details section, textarea, or text box per format. The text block
should be bordered, selectable, and full-width inside the popover body. Its
width is owned by the popover container, never by the selected citation string;
changing from APA to Chicago to BibTeX may change text wrapping and height, but
must not change the panel width or the text-block width. The copy button
belongs inside the text block at the top-right corner so it is visually
attached to the exact text it copies without creating a separate action row.

## Layering And Scrolling

Use `AnchoredRoot`, `AnchoredTrigger`, `AnchoredPanel`, and native popover
behavior. Do not hand-position this component with bespoke JavaScript or
page-specific CSS.

The panel may use normal popover layering and the shared floating-panel `z`
contract. It should not introduce a new page-level stacking model.

## Interaction States

Trigger states:

- default;
- hover;
- focus-visible;
- popover open;
- disabled only if citation metadata is impossible to generate.

Copy button states:

- default;
- hover;
- focus-visible;
- copied;
- error when Clipboard API fails.

The copy action is progressive enhancement. If JavaScript is unavailable or
clipboard permission fails, readers can manually select the visible citation
text.

Format option states:

- unselected;
- selected;
- hover;
- focus-visible.

Copy state should be attached to the single copy button for the currently
selected citation text. Only one copy button should exist in the menu.

## Accessibility Semantics

Use a semantic button for the trigger. The visible label should be `Cite`, and
the trigger's accessible name should be `Cite this article`.

Each generated citation format needs:

- a visible format label;
- an `aria-pressed` style button state when selected;
- visible selectable citation text when selected;
- a copy button whose accessible label follows the selected format, such as
  `Copy BibTeX citation`;
- status text for copied/error feedback that does not rely on color alone.

Keyboard users must be able to open the popover, tab through format options,
select a format, use the copy button, and close the popover with normal browser
popover dismissal behavior. Citation text remains selectable for manual copy,
but it is not a separate tab stop.

## Content Edge Cases

Handle:

- long titles;
- titles with quotes, apostrophes, ampersands, and HTML entities;
- one author;
- multiple authors;
- anonymous authors;
- organizations and collectives;
- missing optional author metadata;
- old article dates;
- canonical URLs with trailing slashes;
- site title escaping in BibTeX and prose formats.

## Theme Behavior

Use semantic tokens. The trigger should feel like a secondary utility, not a
primary support button. The panel needs readable code/text surfaces in light and
dark mode, visible borders, and visible focus rings.

## Testable Invariants

- The trigger renders visible `Cite` text with the Lucide `Quote` icon in the
  article category/action row and exposes `Cite this article` as its accessible
  name.
- Generated citations include title, author, date, canonical URL, and site name
  where each format requires them.
- The closed popover is hidden and reserves no article-body space.
- The opened popover shows citation-style labels in a divided four-column grid
  and exactly one selected citation text block.
- Selecting a style updates the text block, selected `aria-pressed` state, and
  copy button accessible label in place.
- Selecting a style never changes the popover width or selected citation text
  block width.
- Citation text remains visible and selectable.
- The copy button sits in the top-right corner of the selected citation text
  block without covering the citation text.
- The copy button uses Lucide `Copy` and has a format-specific accessible label.
- Copy success and failure states are announced or visible.
- Long generated citations do not overflow the article reading measure or the
  viewport.
- Metadata row and citation trigger do not overlap at mobile, tablet, desktop,
  or wide widths, and opening the popover does not increase article header
  height.
- Anonymous, organization, and multiple-author articles produce deterministic
  output.

## Follow-Up Notes

- If MLA/APA/Chicago output proves too nuanced to hand-format safely, add a
  CSL/citeproc-backed formatter and keep BibTeX as the first implemented
  format.
- Do not add citation-manager export formats opportunistically. Each format
  needs tests and clearly documented field behavior.
