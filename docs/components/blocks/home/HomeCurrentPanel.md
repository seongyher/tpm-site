# Home Current Panel

Source: `src/components/blocks/home/HomeCurrentPanel.astro`

## Purpose

`HomeCurrentPanel` surfaces current project, community, and support links in the
homepage masthead. It is not a full social directory.

## Public Contract

- `links`: compact `{ label, href, description? }` items.
- `title`: optional heading, default `What’s Current`.
- `description`: optional panel summary.

## Composition Relationships

It is normally the right panel of `HomeMastheadBlock`. Social/support links that
need stronger promotion should be homepage promo slots, not extra panel chrome.

## Layout And Responsiveness

The panel is compact, clamps long labels/descriptions, and stacks in normal flow
on mobile.

## Layering And Scrolling

No layering or custom scrolling is intended.

## Interaction States

Links support hover and focus-visible states through `TextLink`. Empty state
copy renders when no links exist.

## Accessibility Semantics

The component is a labeled `section` with a list of links.

## Content Edge Cases

Long labels and descriptions clamp without forcing horizontal overflow. Missing
descriptions are allowed.

## Theme Behavior

Uses semantic muted panel tokens and inherited link tokens.

## Testable Invariants

- Renders current/community/support links as reachable anchors.
- Empty state does not render an empty list.
- Long labels stay inside the panel.
