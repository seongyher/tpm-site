# Article Share Menu

## Purpose

The article share menu gives readers a broad, lightweight set of public sharing
actions from the article header. It should feel like the existing `Cite` and
`PDF` utilities: compact, secondary, static-first, and available without
shipping third-party share SDKs.

The menu is not a social-follow block and not a generated share-image feature.
Its job is to get the canonical article URL into another place with as little
reader friction and as little runtime cost as possible.

## Product Scope

Initial actions:

- copy link;
- email;
- Bluesky;
- X;
- Threads;
- Facebook;
- LinkedIn;
- Reddit;
- Hacker News;
- Pinterest.

Explicitly excluded from the first implementation:

- native share, because the requested interface is a predictable article menu
  rather than operating-system share sheet behavior;
- Discord, Instagram, TikTok, and YouTube, because they do not provide a
  reliable normal web article-share target for this use case;
- embed, because a useful embed requires a separate rich-card route or iframe
  contract and a simple blockquote snippet does not add enough value;
- generated shareable images, because that is a separate composition,
  rendering, and download feature.

## Endpoint Ownership

External share endpoints are not under project control. They must be isolated in
one pure helper module rather than spread through Astro markup.

The helper should expose a normalized view model:

```ts
interface ArticleShareMenuViewModel {
  actions: readonly ArticleShareAction[];
  articleUrl: string;
  copyText: string;
  title: string;
}

type ArticleShareAction =
  | { id: "copy-link"; kind: "copy"; label: "Copy link"; copyText: string }
  | { id: "email"; kind: "email"; label: "Email"; href: string }
  | {
      id: ArticleShareExternalTargetId;
      kind: "external";
      label: string;
      href: string;
    };
```

The component receives that model and only renders the actions. It should not
know how to build platform URLs. Future endpoint changes should be contained to
the helper and its tests.

Prefer `URL` and `URLSearchParams` over manual query-string concatenation.
Use one target definition list so adding, removing, reordering, or disabling a
platform is a data change with focused tests.

Endpoint source notes:

- Bluesky and X have public web-intent documentation.
- LinkedIn and Pinterest support lightweight link/share flows without requiring
  project-owned SDKs, though their composer behavior is controlled by those
  platforms.
- Threads web intents have changed domains and documentation visibility over
  time; keep that endpoint in the same data structure so it can be changed or
  removed without component edits.

## Share Text Policy

Use the canonical URL for every share. Use the article title for destinations
that accept a title or text.

Attribution:

- X uses `via=philo_meme`, which is the platform-supported attribution field.
- Threads includes `@the_philosophers_meme` in the prefilled text.
- Other public targets should avoid injected handles unless the platform has a
  durable first-class field for attribution. Do not pollute Reddit, Hacker
  News, LinkedIn, or Facebook titles with promotional handles.

Pinterest may include the article social preview image as `media` when one is
available. The image should come from the generated social preview image model,
not from raw frontmatter.

## Component Composition

```text
ArticleLayout
  socialPreviewImageViewModel(...)
  articleShareMenuViewModel(...)
  ArticleHeader
    ArticleMeta
    ArticleCitationMenu
    ArticleShareMenu
    PDF action
```

`ArticleLayout` owns canonical URL and social image data. `ArticleHeader` owns
placement in the category/action row above the article title. `ArticleShareMenu`
owns the trigger, anchored popover, email link, social target buttons, copy
button, and status text.

The menu should use the shared anchored positioning primitives. If article
header action popovers need a shared preset, create a semantically named article
action preset rather than hand-positioning another panel.

## Interaction

The trigger:

- visible label `Share`;
- accessible name `Share this article`;
- secondary muted styling matching `Cite`;
- hides from PDF/print output.

Copy link:

- uses a local browser script and the Clipboard API;
- reports copied/error status with `aria-live`;
- leaves the canonical URL available in the DOM for manual copy if the
  Clipboard API fails.

External share targets:

- render as semantic buttons that open the configured target URL on click;
- are ordered and enabled by `site/config/site.json` `share.targets`;
- avoid direct social-share `href` anchors, because common privacy and content
  filters hide links to known share endpoints and can make menu items disappear;
- do not load external scripts;
- preserve keyboard and assistive-technology navigation.

Email:

- renders as a normal `mailto:` link;
- includes article title as subject and title plus URL in the body.

## Layout And Responsiveness

The share trigger joins the article header action cluster and may wrap below
metadata on narrow screens. It must not force article metadata or header text to
overflow.

The menu is a compact vertical list with icons, platform labels, and one
logical action per row. It should use semantic tokens, readable focus rings,
and no decorative card-in-card treatment. The panel width should be stable and
bounded by the viewport. Opening the panel must not push article content down.

## Accessibility

Required semantics:

- trigger is a semantic button with `aria-label="Share this article"`;
- popover has an accessible label that includes the article title;
- copy status uses `aria-live="polite"`;
- external share buttons have visible labels and accessible names matching their
  platform action;
- icon-only affordances are decorative with `aria-hidden="true"`;
- all actions are reachable and usable by keyboard.

## Testing Requirements

Unit tests:

- URL builders encode titles, descriptions, URLs, punctuation, ampersands, and
  unicode correctly;
- target ordering is deterministic;
- X includes `via=philo_meme`;
- Threads includes `@the_philosophers_meme`;
- Pinterest uses generated social preview media only when provided;
- no unsupported destinations leak into the model.

Component tests:

- `ArticleShareMenu` renders the trigger, popover, copy action, email link, and
  expected platform actions from a view model;
- social share targets are buttons, not direct anchors to social domains;
- it does not contain third-party scripts or SDK markup;
- `ArticleHeader` includes `Share` beside `Cite` and `PDF` in the
  category/action row when a share model is provided.

Browser/script tests:

- copy link writes the canonical URL and reports success;
- copy failures show a useful manual-copy message;
- unrelated clicks are ignored;
- installing the enhancement twice is idempotent.

E2E tests:

- representative article pages expose `Cite`, `Share`, and `PDF` header
  actions without horizontal overflow;
- opening the share menu keeps the panel within the viewport at mobile, tablet,
  and desktop widths;
- share links use expected hosts and do not inject third-party scripts.
- social targets are present even when direct social-share anchors would be
  hidden by browser content filters.

## Critical Review

The design intentionally avoids platform SDKs. That keeps payload and privacy
costs low, but means platform composer behavior may change outside our control.
The mitigation is a single endpoint-definition module with tests that document
the current contract.

Threads is less stable than X, Bluesky, Reddit, or Hacker News. It should be
implemented as a normal target definition that can be removed or edited without
changing component code.

Pinterest depends on a usable preview image. Because articles now already have
generated social preview images, the share menu should reuse that pipeline
instead of creating another image path.

No additional design work is needed before implementation as long as the
endpoint helper remains isolated, the menu has no third-party scripts, and the
tests cover every endpoint contract.
