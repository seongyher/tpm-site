# Article Share Menu

Source: `src/components/articles/actions/ArticleShareMenu.astro`

Design: `docs/ARTICLE_SHARE_MENU.md`

## Purpose

`ArticleShareMenu` renders the compact article-header `Share` utility. It
exposes copy, email, and public social share actions without loading any
third-party SDKs.

The component is a view over a normalized share model. Platform endpoint logic
belongs in `src/lib/site/share-targets.ts`, not in Astro markup.

## Public Contract

```ts
interface ArticleShareMenuViewModel {
  actions: readonly ArticleShareAction[];
  articleUrl: string;
  copyText: string;
  title: string;
}
```

Actions may be:

- `copy-link`;
- `email`;
- external targets from `src/lib/site/share-targets.ts`.

The first implementation supports Bluesky, X, Threads, Facebook, LinkedIn,
Reddit, Hacker News, and Pinterest. `ArticleShareMenu` should not know how to
build those URLs.

## Composition Relationships

```text
ArticleLayout
  articleShareMenuViewModel(...)
  ArticleHeader
    ArticleShareMenu
      ArticleShareActionRow
```

`ArticleLayout` owns canonical URL and generated social preview image data.
`ArticleHeader` owns placement beside `Cite` and `PDF` in the category/action
row above the article title. `ArticleShareMenu` owns popover markup, action
rendering, and the copy-status region.

## Layout And Responsiveness

The trigger uses visible text `Share`, the Lucide `Share2` icon, and the
accessible name `Share this article`. It should remain visually subordinate to
article metadata and may wrap in the action cluster on narrow viewports.

The panel is an anchored popover using the `article-action-menu` preset. It is a
compact vertical list, bounded by the viewport, and opening it must not push
article body content down.

## Interaction

Client behavior is deliberately narrow:

- copy the canonical article URL from a JSON-encoded data attribute;
- open configured social share targets from semantic buttons;
- report copied/error status through `aria-live`;
- ignore unrelated clicks;
- install idempotently.

Email renders as an ordinary `mailto:` link. External social targets render as
buttons instead of direct social-share anchors so browser content filters do not
hide the menu rows. Do not add platform widgets, SDK scripts, or native share
behavior.

## Accessibility

- Trigger is a semantic button with accessible name `Share this article`.
- Panel has an accessible label containing the article title.
- Copy feedback uses a polite live region.
- Action labels are visible text; icons are decorative.
- Keyboard users can open the popover, tab through actions, copy the URL, open
  social share targets, and close using normal popover behavior.

## Testable Invariants

- The share model is built by `src/lib/site/share-targets.ts` and encoded through
  pure unit tests.
- The component renders no third-party share SDK references.
- Social targets render as buttons, not direct anchors to social share domains.
- Article pages expose `Cite`, `Share`, and `PDF` as quiet header utilities.
- The share panel remains viewport-contained at mobile, tablet, and desktop
  widths.
- X includes `via=philo_meme`.
- Threads includes TPM's Threads handle in the prefilled text.
- Pinterest uses generated social preview media when available.
