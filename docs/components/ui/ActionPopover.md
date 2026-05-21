# ActionPopover

Source: `src/components/ui/ActionPopover.astro`

## Purpose

`ActionPopover` composes the anchored-surface primitives into a reusable menu
surface for article actions and similar small command lists.

## Public Contract

- `popoverId: string`
- `panelLabel: string`
- `preset: AnchoredPreset`
- `panelWidth?: string`
- `panelAttributes?: HTMLAttributes<"div">`
- Named `trigger` slot renders the semantic trigger.
- Default slot renders menu content.

## Invariants

- Uses one `AnchoredRoot` and one `AnchoredPanel`.
- Panel remains hidden when the native popover is closed.
- Width is clamped by `--anchor-max-width`.
- Does not hard-code article, citation, or share behavior.
