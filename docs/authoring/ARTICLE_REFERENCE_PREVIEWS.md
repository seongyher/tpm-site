# Article Reference Previews

This note defines hover/tap previews for canonical article notes and
bibliography citations.

## Goal

Reference previews should reduce the cost of checking a citation or explanatory
note while reading. The feature is a progressive enhancement over normal anchor
links:

- inline note and citation markers still link to their generated reference
  entries;
- `Back N` links still return to the original marker;
- previews appear only when the page can resolve meaningful preview content;
- previews show only the useful content, without duplicate headings or
  navigation links;
- JavaScript-disabled browsers keep the current anchor-only behavior.

## Interaction Model

Inline markers open a preview of the generated note or bibliography entry.
Backlinks open a preview of the source context around the marker they target.

The source-context preview should use the nearest containing prose block, not a
hand-rolled sentence parser. Paragraph/list-item extraction is less precise, but
it is resilient to abbreviations, quotations, inline citations, and older
migrated prose.

Pointer and keyboard behavior:

- mouse hover opens the preview and leaving the marker/panel closes it;
- keyboard focus opens the preview, `Escape` closes it, and `Enter` still
  follows the anchor;
- coarse-pointer tap opens the preview first, while a repeated tap can still
  follow the underlying anchor;
- clicks outside the active marker and preview close the preview.

## Implementation Contract

The implementation should use one delegated preview controller instead of one
popover per reference marker. Reference rendering only needs stable data hooks:

- inline markers expose their target entry, kind, label, and order;
- generated note/bibliography entries mark the rendered definition content;
- backlink anchors expose their target marker, kind, and order;
- the article reference region renders one reusable preview panel.

The controller resolves previews at runtime:

1. Marker preview: clone the target entry's definition-content node.
2. Backlink preview: find the target marker, then summarize the nearest source
   prose block.
3. If either target is missing or the resolved text is empty, leave the link as
   a plain anchor and do not open the panel.

The preview panel should reuse the existing anchored positioning helper and
article popover styling direction. It should stay viewport-contained, ignore
Pagefind indexing, and avoid changing document layout. The panel is content-only:
the hovered/focused anchor itself remains the navigation affordance.

## Testing

Focused coverage should prove:

- reference markers and backlinks expose the data needed by the enhancement;
- rendered reference sections include a single reusable preview panel;
- the browser controller opens definition previews and backlink context previews;
- unresolved or empty targets do not open a stale/empty preview;
- existing anchor navigation, containment, and accessibility tests still pass.

## Design Review

The design is ready for implementation. It reuses the existing generated
reference model and anchored-positioning contract without duplicating reference
content in static HTML. The only intentionally lossy behavior is backlink
context extraction: a block-level excerpt is the correct first version because
sentence parsing would be brittle and hard to explain to authors.
