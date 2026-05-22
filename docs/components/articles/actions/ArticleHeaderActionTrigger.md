# ArticleHeaderActionTrigger

Source: `src/components/articles/actions/ArticleHeaderActionTrigger.astro`

## Purpose

`ArticleHeaderActionTrigger` renders an anchored button trigger for article
header popovers such as Cite and Share.

## Public Contract

- `label: string`
- `type?: HTML button type`, defaulting to `button`.
- Default slot renders visible icon/label content.
- `aria-label` defaults to `label`.

## Invariants

- Uses `AnchoredTrigger` as a native button.
- Shares visual styling with article header links.
- Does not own panel positioning; anchored primitives and adapters do.
