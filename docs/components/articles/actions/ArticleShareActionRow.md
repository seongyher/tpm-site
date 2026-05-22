# Article Share Action Row

Source: `src/components/articles/actions/ArticleShareActionRow.astro`

## Purpose

`ArticleShareActionRow` renders one action row in the article share menu from
the centralized share-target model.

## Public Contract

- `action: ArticleShareAction`
- `copyText: string`
- `statusId: string`

The action model, platform URLs, handles, and labels come from
`src/lib/site/share-targets.ts`; this component should only map action kinds to
markup and icons.

## Composition Relationships

Used inside `ArticleShareMenu`. The menu owns popover placement, open state,
copy status text, and grouping. This component owns row semantics and icon
selection.

## Layout And Responsiveness

Rows are compact, full-width menu actions with a fixed icon column and flexible
label column. Long labels should truncate or wrap within the menu without
changing the popover anchor.

## Layering And Scrolling

No layering. The parent menu owns popover z-index and scroll containment.

## Interaction States

Supports copy buttons, email links, and external share buttons. Rows need
default, hover, focus-visible, and long-label states. External targets open via
the article share script instead of loading third-party SDKs.

## Accessibility Semantics

Use a native `button` for copy/external popups and an `a` for email. Icons are
decorative. Copy buttons describe their status via the provided `statusId`.

## Content Edge Cases

Handle missing optional media, long article titles in generated share URLs,
social target changes, and platform URLs that need future editing in one
central helper.

## Theme Behavior

Use popover foreground, muted hover, and semantic focus tokens so rows remain
legible in light and dark themes.

## Testable Invariants

- Every configured action renders exactly one keyboard-reachable row.
- Copy actions expose copy text through the expected data attribute.
- External actions do not hard-code platform endpoint strings here.
- Rows stay contained in the share menu on mobile and desktop.

## Follow-Up Notes

- Add a new icon branch only after adding the target to
  `src/lib/site/share-targets.ts`.
