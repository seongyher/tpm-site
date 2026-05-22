# Article Footnotes

Source: `src/components/articles/references/ArticleFootnotes.astro`

## Purpose

`ArticleFootnotes` renders explanatory article notes from normalized
`note-*` definitions. It presents author-provided asides without mixing them
with bibliography citations.

It must not classify labels, parse display labels, or decide which notes exist.
Those responsibilities belong to the article references plugin and
normalization layer.

## Public Contract

- `notes: readonly ArticleNote[]`
- `headingId?: string`
- `heading?: string`

`heading` should default to `Notes`. The component should render nothing when
`notes` is empty.

Each `ArticleNote` should include:

- stable entry ID;
- stable label;
- numeric order;
- optional display label metadata;
- one source reference marker;
- rich definition content.

Repeated `note-*` references are invalid before rendering, so this component
should not have to represent many source markers for one note.

## Composition Relationships

Target ownership:

```text
ArticleReferences
  ArticleFootnotes
    ArticleReferenceBacklinks
```

`ArticleReferences` owns whether this section appears and where it sits relative
to bibliography. `ArticleFootnotes` owns section heading, ordered-list
structure, entry IDs, note content placement, and backlink placement.

`ArticleFootnotes` should not render bibliography entries and should not render
support/discovery CTAs.

## Layout And Responsiveness

Use the article reading measure. Notes should be visually secondary to prose:
smaller or quieter treatment is acceptable, but text must remain readable.

Entries stack vertically with enough rhythm for scanning. Long notes and long
words wrap inside the reading column. The section should not create a nested
card surface unless the broader article design explicitly chooses framed
apparatus.

## Layering And Scrolling

No custom layering is intended. Each note entry should have a stable target ID
that works with hash navigation and sticky-header scroll offsets.

## Interaction States

Interactive descendants are links and backlinks only. They need default, hover,
focus-visible, visited where appropriate, and target states.

The optional note display label is metadata. The default note renderer should
still render naked superscript numeric markers unless a later component design
intentionally changes note presentation.

## Accessibility Semantics

Render a visible heading and an ordered list. Numbering communicates reading
order and matches inline note markers.

Each note entry should be reachable from its inline marker. Each entry should
include a backlink to the source marker with accessible text such as "Back to
note reference 1"; do not rely on a bare arrow symbol without a label.

Do not use ARIA where semantic headings, lists, and links are sufficient.

## Content Edge Cases

Handle:

- one note;
- many notes;
- long explanatory notes;
- rich Markdown content;
- optional display labels that are not displayed by default;
- unusual punctuation;
- long unbroken words;
- `[@...]` later in the note body that remains ordinary content.

Repeated note references should never reach this component; they are validation
errors.

## Theme Behavior

Use semantic tokens. Note text, numbering, borders, backlinks, target states,
and focus rings must be readable in both light and dark mode.

## Testable Invariants

- Renders nothing for an empty note array.
- Renders a visible `Notes` heading by default.
- Renders an ordered list with entry order matching normalized note order.
- Uses stable entry IDs that match inline marker hrefs.
- Inline note markers are naked clickable superscript numbers, not bracketed
  citation-style markers.
- Renders one backlink for each note.
- Does not render optional display labels as primary markers by default.
- Preserves rich note content.
- Does not overflow horizontally with long note text.
- Maintains keyboard focus visibility for backlinks.

## Follow-Up Notes

- If note display labels become visible later, update this one-pager before
  changing implementation. The current contract preserves labels as metadata
  while rendering notes numerically.
