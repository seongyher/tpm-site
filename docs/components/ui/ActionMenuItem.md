# ActionMenuItem

Source: `src/components/ui/ActionMenuItem.astro`

## Purpose

`ActionMenuItem` renders one icon-plus-label row inside an action popover. It
keeps copy, email, share, and other menu actions visually and semantically
consistent.

## Public Contract

- `as?: "button"` renders a native button and defaults `type="button"`.
- `as: "a"` requires `href`.
- Default slot renders the label.
- Named `icon` slot renders the leading icon.

## Invariants

- Preserves button/link semantics rather than using a generic clickable `div`.
- Keeps a stable two-column icon/label grid.
- Provides hover and focus-visible states through semantic tokens.
- Allows long labels to shrink or wrap inside the label column.
