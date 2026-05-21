# Progressive Interaction Primitives

This document covers the design pass for IRK-85 and IRK-87. It connects the
existing anchored positioning and anchored disclosure systems with the other
small browser scripts used by the site.

The goal is not to build a broad client application framework. The goal is to
keep each interaction static-first, tiny, accessible, measurable, and backed by
a shared policy so future UI work does not accidentally add brittle or
inaccessible JavaScript.

## Interaction Families

### Anchored Surfaces

Owned by:

- `src/lib/anchored-positioning.ts`
- `src/scripts/anchored-positioning-loader.ts`
- `src/scripts/anchored-positioning.ts`
- `src/lib/anchored-disclosure.ts`
- `src/scripts/anchored-disclosure.ts`

Surfaces include category previews, search reveal, mobile shell panels,
hover-image previews, citation menus, share menus, and future tooltip-like
panels.

The contract is:

- components declare `data-anchor-*` relationships and a named preset;
- the loader warms the positioning engine on idle or first intent;
- the pure placement engine computes geometry;
- the DOM adapter writes CSS variables and data state;
- disclosure state is separate from placement state.

### Article Action Menus

Owned by:

- `ActionPopover`
- `ActionMenuItem`
- `ArticleHeaderActionRow`
- `ArticleHeaderActionTrigger`
- `ArticleHeaderActionLink`
- `src/scripts/article-citation-copy.ts`
- `src/scripts/article-share.ts`

Cite and Share menus should share action-surface primitives and clipboard
status helpers. They should not load third-party SDKs, reserve article-flow
space, or fork endpoint URL generation into components.

### Article Reading Enhancements

Owned by:

- article table of contents script;
- reference preview script;
- image inspector script.

These scripts enhance existing article markup. Links, images, reference
targets, and contents links must remain meaningful when JavaScript is absent.

### Navigation And Discovery Enhancements

Owned by:

- horizontal scroll rail script;
- home featured carousel script;
- mobile/header/search scripts.

Rails must remain manually scrollable without JavaScript. Carousel slides are
static article links first; JavaScript only improves controls and selected
state. The carousel must not start timed rotation by default.

### Global Document State

Owned by:

- theme script;
- site-header offset script.

These scripts may run early because they affect document-level rendering and
layout state. They should remain small and must not fetch content or hydrate
large regions.

## Loading Policy

The canonical policy is encoded in
`src/lib/interaction-primitives.ts`. Every `src/scripts/*.ts` file must have a
registry entry that names:

- the interaction surface ID;
- the script path;
- the load policy;
- keyboard and touch expectations;
- reduced-motion behavior;
- no-JavaScript fallback.

Load policies:

- `immediate-document-state`: tiny scripts needed before or during initial
  document rendering, currently theme state.
- `idle-warmup-or-intent`: a small loader may load the heavier module on idle
  or first interaction.
- `content-gated`: script is included only when its owning component appears
  on the route.
- `page-only`: script is included only by the one page that owns the
  interaction.

## Accessibility Policy

Every content-gated or page-only interaction needs:

- keyboard access;
- touch or coarse-pointer access;
- no-JavaScript fallback;
- visible focus states;
- reduced-motion behavior when movement is animated;
- native semantics before ARIA;
- Escape/outside-click/focus restoration behavior for dismissible surfaces
  where applicable.

Hover-only behavior is not a valid primary interaction. Hover can enhance fine
pointers only when click/tap and keyboard paths exist.

## Payload Policy

Interaction scripts should be:

- processed Astro scripts or route/page-only scripts;
- small and dependency-free unless a future product requirement justifies a
  library;
- installed once per document;
- event-delegated when multiple instances can exist;
- measurable through route-class payload reporting.

New scripts must update the registry and add focused unit tests before broad
browser tests. If a script changes first-load behavior, verify the payload
report and Lighthouse route sample before promotion.

## Verification

Required checks:

- `tests/src/lib/interaction-primitives.test.ts` keeps script policy coverage
  aligned with `src/scripts`.
- Script unit tests cover pure state and DOM adapter behavior.
- Playwright tests cover browser-only behavior such as focus, popovers, rails,
  carousel controls, previews, and no horizontal overflow.
- Payload reports keep script additions visible by route class.
