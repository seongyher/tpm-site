# Anchored Positioning System

## Purpose

This document defines the reusable positioning primitive for UI surfaces that
must stay visually related to another element. Current consumers are desktop
category dropdowns, header search reveal, constrained mobile navigation,
article hover-image previews, and the article citation menu. Future consumers
may include tooltips, contextual help, share panels, command palettes, and
editorial annotations.

The design goal is not to patch one navigation bug. The goal is to make a whole
class of placement bugs hard to represent:

- a panel should appear close to the thing that opened it;
- a panel should know which edge or axis it is aligned to;
- a header-attached panel should snap to the sticky header bottom with no
  visible gap and no header overlap;
- a trigger-attached panel should remain visually tethered to its trigger;
- collision fallback should be deterministic, visible in state, and tested;
- viewport containment should never be mistaken for correct placement.

Components should declare relationships and choose named positioning presets.
They should not hand-place themselves with local `fixed`, `inset`, `mx-auto`,
magic offsets, or one-off transforms.

## Current Audit Findings

The current popup implementation has architectural positioning mistakes:

- `CategoryDropdown` uses a fixed full-width wrapper with a centered inner
  panel. This keeps the panel visible, but detaches it from the hovered
  category trigger.
- `SearchReveal` uses a hand-written inset value. It can drift vertically from
  the sticky header bottom and can appear on the wrong inline side when the
  trigger position changes.
- `MobileMenu` is viewport constrained, which is correct for a mobile shell
  panel, but that strategy is wrong for trigger-aligned desktop dropdowns.
- Existing e2e tests check that panels stay inside the viewport and below the
  header, but they do not check exact trigger/panel alignment or no-gap header
  snapping.
- Popup positioning is split across individual components, so fixes in one
  panel do not make other panels safer.

These are not isolated styling bugs. They show that positioning needs a shared
primitive, shared contracts, and relationship-focused tests.

## Migration Inventory

Anchored positioning is for trigger-attached floating surfaces, not ordinary
layout. Migration scope should stay narrow so normal document flow, sticky
layout, and internal component layout remain simple CSS/Tailwind.

### Required Migrations

- `src/components/navigation/CategoryDropdown.astro`: must migrate because it
  renders a trigger-attached desktop preview panel. The current implementation
  uses a fixed full-width wrapper and centered inner panel, which keeps the
  panel visible but detaches it from the category trigger.
- `src/components/navigation/SearchReveal.astro`: must migrate because it
  reveals a header-attached floating search surface. Native popover may own
  disclosure, but placement still needs the shared contract so the panel snaps
  to the header bottom and aligns to the search trigger's logical edge.
- `src/components/navigation/MobileMenu.astro`: must migrate because it is a
  constrained header-attached shell panel. It should use the shared mobile
  preset so it stays viewport-safe, scrolls on short screens, and does not
  depend on the sandwich trigger's horizontal position.
- `src/components/articles/media/HoverImageCard.astro` and its Astro wrappers: must
  migrate because article hover-image previews are inline trigger-attached
  floating previews. Native Astro markup plus the `inline-hover-preview` preset
  removes unnecessary hydration while preserving robust positioning.
- `src/components/articles/actions/ArticleCitationMenu.astro`: must use anchored
  positioning because it is a trigger-attached utility surface. The citation
  trigger lives in the article metadata row, but the menu must not reserve
  article-flow space or detach from the trigger when opened.

### Components That Should Stay Out Of Scope

- `SiteHeader`: sticky header layout is structural page anatomy, not an
  anchored floating surface.
- `ContentRail`, `MarginSidebarLayout`, and article table-of-contents rail
  components: these are sticky/sidebar layout primitives. They should stay in
  normal flow with CSS/Tailwind constraints.
- `ArticleTableOfContents`, `SectionNavItem`, and other native
  `details`/`summary` sections: these are in-flow disclosures, not floating
  anchored panels.
- `SearchForm`: its absolutely positioned icon is internal input layout, not a
  trigger-attached surface.
- `ThemeToggle`, `SupportLink`, buttons, links, badges, cards, media frames,
  article references, footnotes, and bibliography components: these are normal
  controls or document-flow content.
- Skip links: fixed accessibility affordances should remain independent of the
  anchored positioning system.

### Future Candidates

Use the anchored system for future share panels, tooltips, annotations,
contextual help, or floating filters only when they are genuinely
trigger-attached floating surfaces. Do not migrate a component simply because it
uses `position: sticky`, `position: absolute` for internal decoration, or a
responsive layout constraint.

## Source Notes

Modern browser primitives are useful but not enough by themselves.

- HTML `popover` gives top-layer rendering, light-dismiss behavior, and
  declarative controls for non-modal surfaces. It does not automatically choose
  this site's product-specific alignment rules.
- Popovers render in the top layer and are not constrained by parent `position`
  or `overflow`, so code must intentionally place them.
- CSS anchor positioning is designed for tethering positioned elements to
  anchors and includes overflow fallback concepts. It is promising, but this
  project should keep a pure geometry model and tests so browser support or
  syntax changes do not hide intent.
- Floating UI is a useful mental model: initial placement plus small operations
  like offset, flip, shift, size, and hide. This project does not need to adopt
  that library by default, but the design should borrow the separation of
  placement, middleware-like operations, and DOM adapters.

References:

- [MDN: Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
- [MDN: `popover` global attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover)
- [MDN: CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning)
- [Floating UI: Middleware](https://floating-ui.com/docs/middleware)
- [Floating UI: Offset](https://floating-ui.com/docs/offset)
- [Floating UI: Flip](https://floating-ui.com/docs/flip)
- [Floating UI: Shift](https://floating-ui.com/docs/shift)

## Vocabulary

- **Reference**: the rectangle that a floating element relates to. Usually the
  trigger.
- **Trigger**: the interactive element that opens or reveals a surface.
- **Block anchor**: the rectangle used for vertical placement. Header-attached
  popups use the sticky header as block anchor.
- **Inline anchor**: the rectangle used for horizontal placement. Header
  popups usually use the trigger as inline anchor.
- **Floating element**: the panel, menu, preview, tooltip, or surface being
  positioned.
- **Placement**: the preferred side and alignment, such as `bottom-start`,
  `bottom-end`, `top-start`, or `viewport-fill`.
- **Preset**: a named product contract that maps a component use case to
  placement, fallback, sizing, and interaction behavior.
- **Offset**: logical gap between the floating element and its anchor. Header
  attached surfaces usually use `0`.
- **Safe gutter**: the minimum spacing preserved between the floating element
  and viewport or boundary edges.
- **Boundary**: the rectangle the floating element must fit within. Usually the
  viewport.
- **Collision fallback**: deterministic placement adjustment when the preferred
  placement would overflow a boundary.
- **Shift**: move along an axis to stay inside a boundary while preserving the
  preferred side.
- **Flip**: move to the opposite side or opposite alignment when preferred
  placement does not fit.
- **Size constraint**: returned max inline/block size that lets long content
  scroll internally rather than escaping the viewport.
- **Detached state**: a state where the floating element had to clamp so far
  that it no longer meaningfully points at its reference.

## Design Principles

- Prefer semantic HTML and normal document flow before adding floating UI.
- Prefer CSS/Tailwind tokens for layout, sizing, borders, theme, and overflow.
- Use JavaScript only for measured relationships that CSS cannot express
  reliably across browsers today.
- Keep measured geometry tiny, generic, and isolated.
- Keep geometry pure and unit-testable.
- Keep content, semantics, and interaction state in the component that owns the
  surface.
- Keep placement in a shared primitive so components cannot drift apart.
- Model impossible or invalid states in TypeScript types rather than comments.
- Return explicit placement state for tests and debugging.
- Do not allow centered fallback unless a preset explicitly asks for center
  alignment.

## Non-Goals

- Do not introduce a broad application overlay framework.
- Do not use React, shadcn, Radix, or a large dependency only to position simple
  static-site navigation.
- Do not make all anchored surfaces modal.
- Do not force every anchored surface into the same visual width.
- Do not hide placement bugs with page-level `overflow-hidden`.
- Do not put component content, route data, or visual variants inside the
  geometry engine.

## Layered Architecture

The system has five layers. Each layer must stay narrow.

```text
Component wrapper
  chooses preset and owns content/state/semantics

Anchored primitive contract
  data attributes, CSS variables, slots, size tokens

DOM adapter
  measures browser rectangles and writes placement output

Pure positioning engine
  computes placement from serializable input

Placement operations
  offset, align, flip, shift, size, clamp, hide/detach
```

### 1. Pure Positioning Engine

Add pure TypeScript under `src/lib/anchored-positioning.ts` or a small
`src/lib/anchored-positioning/` folder if the model grows.

The engine accepts serializable inputs and returns serializable output. It must
not read `window`, `document`, CSS, component props, or DOM state.

Recommended first-pass model:

```ts
interface Rect {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

type Side = "top" | "right" | "bottom" | "left";
type Alignment = "start" | "center" | "end";

type Placement = `${Side}-${Alignment}` | Side | "viewport-fill";

type Fallback =
  | "none"
  | "shift"
  | "flip"
  | "flip-alignment"
  | "shift-then-size"
  | "size-then-shift";

interface AnchoredPositionInput {
  readonly boundaryRect: Rect;
  readonly blockAnchorRect: Rect;
  readonly fallback: readonly Fallback[];
  readonly floatingSize: Pick<Rect, "height" | "width">;
  readonly inlineAnchorRect: Rect;
  readonly offset: number;
  readonly placement: Placement;
  readonly safeGutter: number;
}

interface AnchoredPositionResult {
  readonly detached: boolean;
  readonly maxHeight: number;
  readonly maxWidth: number;
  readonly placement: Placement;
  readonly state: readonly AnchoredPositionState[];
  readonly x: number;
  readonly y: number;
}

type AnchoredPositionState =
  | "preferred"
  | "shifted-inline-start"
  | "shifted-inline-end"
  | "flipped-side"
  | "flipped-alignment"
  | "sized-block"
  | "sized-inline"
  | "clamped"
  | "detached";
```

The split between `blockAnchorRect` and `inlineAnchorRect` is essential. Header
popups vertically attach to the full sticky header but horizontally attach to
the trigger. This is a core primitive, not a component hack.

### 2. Placement Operations

Implement the engine as small operations, not a single opaque function:

- `initialPlacement`: compute the preferred `x`, `y`, and side/alignment.
- `offset`: apply logical gap along the main axis.
- `flipSide`: move to the opposite side only for presets that allow it.
- `flipAlignment`: change start to end or end to start when that preserves
  trigger relationship better than shifting.
- `shiftIntoBoundary`: move within the boundary while preserving side.
- `sizeToBoundary`: return max dimensions when content must scroll internally.
- `detectDetach`: mark when clamping breaks the trigger relationship enough
  that a caret/arrow or strong visual tether would be dishonest.

Operations should be deterministic and order-specific. Each preset should list
the ordered operations it uses.

### 3. Presets

Components should choose presets instead of setting geometry manually.

Presets are the product-level API:

```ts
type AnchoredPreset =
  | "header-dropdown"
  | "header-search-start"
  | "header-search-end"
  | "mobile-shell-panel"
  | "inline-hover-preview";
```

Presets map to:

- preferred placement;
- block anchor source;
- inline anchor source;
- offset token;
- safe gutter token;
- allowed fallbacks;
- size strategy;
- no-JavaScript fallback expectations;
- interaction assumptions.

### 4. DOM Adapter

Add the smallest processed browser script needed to connect DOM elements to the
pure engine.

Responsibilities:

- find roots through stable data attributes;
- read preset and optional sizing attributes;
- measure trigger, block anchor, inline anchor, floating element, and boundary;
- call the pure engine;
- write placement values as CSS custom properties and data attributes;
- update on open, resize, scroll, font/layout changes, header resize, viewport
  orientation changes, and visual viewport changes when available;
- avoid owning content, route data, visual variants, or component semantics.

Suggested attributes:

```html
<div data-anchor-root data-anchor-preset="header-dropdown">
  <a data-anchor-trigger href="/categories/culture/">Culture</a>
  <div data-anchor-panel>...</div>
</div>
```

Suggested output:

```html
<div
  data-anchor-panel
  data-anchor-placement="bottom-start"
  data-anchor-state="preferred"
  style="
    --anchor-x: 128px;
    --anchor-y: 96px;
    --anchor-max-width: 384px;
    --anchor-max-height: 512px;
  "
>
  ...
</div>
```

The adapter may use inline styles for computed variables because these are
runtime measurements, not design tokens. Component styles should consume those
variables with Tailwind-compatible static classes or small global utilities.

### 5. Component Wrappers

Components own semantics, content, slots, labels, and state. They do not own
placement math.

Examples:

- `CategoryDropdown` chooses `header-dropdown`.
- `SearchReveal` chooses `header-search-start` or `header-search-end` based on
  which header utility cluster contains it.
- `MobileMenu` chooses `mobile-shell-panel`, which intentionally uses zero
  horizontal safe gutter so the mobile shell spans the viewport below the
  sticky header.
- article hover-image components choose `inline-hover-preview`.

Component docs should list the preset they use and the visible relationships
that preset guarantees.

### 6. Reusable Primitive Components

Implementation should prefer small Astro primitives over repeated data-attribute
markup where that improves correctness.

Candidate primitives:

- `src/components/ui/AnchoredRoot.astro`: wraps one anchored relationship,
  validates the preset prop, and emits `data-anchor-root` plus
  `data-anchor-preset`.
- `src/components/ui/AnchoredTrigger.astro`: forwards native link or button
  attributes, emits `data-anchor-trigger`, and does not alter semantics.
- `src/components/ui/AnchoredPanel.astro`: emits `data-anchor-panel`, consumes
  shared CSS variables, and owns the static Tailwind classes that every
  anchored panel needs to avoid overflow.

These primitives should stay thin. They should not know about categories,
search, mobile navigation, article images, or route data. Their job is to make
the markup contract hard to get wrong. Product components still own labels,
links, contents, and interaction semantics.

If the implementation can keep the contract clearer with direct attributes in
simple components, that is acceptable. The invariant is that all anchored
surfaces share the same attributes, CSS variable names, geometry adapter, and
tests.

## CSS And Tailwind Strategy

The goal is not “no JavaScript at any cost.” The goal is no component-level
pixel wrangling and minimal generic measurement where required.

CSS/Tailwind owns:

- panel display, border, background, shadow, radius, color, typography;
- static max width tokens and responsive width caps;
- overflow behavior from returned max sizes;
- visibility and state styling through `data-*` variants;
- reduced-motion behavior;
- z-index/top-layer visual design;
- focus, hover, current, open, disabled, and dark-mode states.

The DOM adapter owns only measured coordinates and runtime size limits:

- `--anchor-x`;
- `--anchor-y`;
- `--anchor-max-width`;
- `--anchor-max-height`;
- `data-anchor-placement`;
- `data-anchor-state`.

Avoid arbitrary per-component values. If a gap or gutter is needed, make it a
token consumed by presets. Header-attached popups should use an offset of `0`
unless the design explicitly wants a visible separation.

CSS anchor positioning can be used as a progressive enhancement if it satisfies
the same contracts and tests. The implementation must not rely on untested
browser fallback behavior. If CSS anchor positioning is used, keep the pure
engine as either the tested fallback or the reference model for expected
behavior.

## Performance Guardrails

Anchored positioning must preserve the site's static-first performance model.
Hover-image previews should remain native Astro markup. Do not reintroduce
React/Radix hydration or a heavier custom runtime only to position the preview.
They should render as image-only media, not as card-like popovers.

Required performance patterns:

- Use one shared processed Astro browser script for anchored positioning.
- Do not hydrate layout regions or anchored surfaces only to place them.
- Do not add React, Radix, Floating UI, or another positioning dependency for
  the first implementation.
- Do not measure every anchored surface on page load.
- Measure only the currently opening or open surface.
- Use event delegation where practical instead of adding large numbers of
  duplicated listeners.
- Use passive listeners for scroll/pointer events unless cancellation is
  explicitly required.
- Batch DOM reads and writes with `requestAnimationFrame` so layout reads
  happen together and CSS-variable writes happen together.
- Do not poll for geometry changes.
- Use `ResizeObserver`, `visualViewport`, scroll, resize, font/layout, and
  open-state signals only to invalidate or recompute open surfaces.
- Recompute after resize, scroll, header-size changes, font/layout changes, and
  visual viewport changes only while a relevant surface is open.
- Write runtime output only to CSS variables and state attributes such as
  `--anchor-x`, `--anchor-y`, `--anchor-max-width`,
  `--anchor-max-height`, `data-anchor-placement`, and
  `data-anchor-state`.
- Avoid forced layout loops where a write immediately triggers another
  synchronous measurement.
- Keep the script independent of content fetching, route data, search indexing,
  image loading, and component-specific state.
- Clean up observers/listeners for closed or disconnected surfaces.

Lighthouse-sensitive expectations:

- No unexpected increase in shipped client JavaScript beyond the small shared
  adapter.
- No layout shift from opening or closing an anchored surface.
- No long task from scanning or measuring anchored surfaces.
- No accessibility regression from replacing framework popovers with native
  Astro markup and a shared adapter.
- No SEO regression: navigation links remain normal crawlable links and
  no-JavaScript fallbacks remain useful.

## Dependency Decision

Do not add Floating UI for the first implementation. The site has a small set
of known anchored relationships, and a narrow pure engine plus a tiny DOM
adapter should be easier to audit, test, and keep static-site friendly.

Reconsider a dependency only if one of these becomes true:

- the pure engine starts recreating a large amount of well-tested collision
  behavior;
- requirements expand to many nested, arrowed, virtual, or scroll-container
  anchored surfaces;
- browser support forces complex cross-browser workarounds;
- tests show repeated bugs in homegrown collision behavior despite the narrow
  scope.

If a dependency is added later, keep this design as the product contract. A
library may replace the internals, but components should still choose named
presets and tests should still assert the same relationships.

## Placement Presets

### `header-dropdown`

Use for desktop category discovery in the second header row.

Rules:

- Block anchor: full sticky header.
- Inline anchor: category trigger.
- Preferred placement: `bottom-start`.
- Offset: `0`.
- Fallback order: `flip-alignment`, `shift-then-size`.
- Panel top equals sticky header bottom.
- Panel never overlaps the sticky header.
- Start edge aligns to trigger start when there is room.
- Near the right edge, end edge aligns to trigger end before clamping.
- If both alignments overflow, clamp to safe gutters and mark state.
- Do not center as fallback.
- Trigger remains a normal link; hover/focus reveals the panel, click
  navigates.

### `header-search-start`

Use when the search trigger lives in the header's inline-start utility cluster.

Rules:

- Block anchor: full sticky header.
- Inline anchor: search trigger.
- Preferred placement: `bottom-start`.
- Offset: `0`.
- Fallback order: `shift-then-size`.
- Panel top equals sticky header bottom with no visible gap.
- Panel start edge aligns to trigger start when there is room.
- Panel width is capped by content measure and safe gutters.

### `header-search-end`

Use when the search trigger lives in the header's inline-end utility cluster.

Rules:

- Block anchor: full sticky header.
- Inline anchor: search trigger.
- Preferred placement: `bottom-end`.
- Offset: `0`.
- Fallback order: `shift-then-size`.
- Panel top equals sticky header bottom with no visible gap.
- Panel end edge aligns to trigger end when there is room.
- Panel width is capped by content measure and safe gutters.

### `mobile-shell-panel`

Use for constrained-width navigation.

Rules:

- Block anchor: full sticky header.
- Inline anchor: viewport boundary, not trigger.
- Preferred placement: `viewport-fill` below the header.
- Offset: `0`.
- Fallback order: `size-then-shift`.
- Panel fills between safe inline gutters.
- Panel top equals sticky header bottom.
- Panel scrolls internally on short viewports.
- Trigger position must not affect whether the panel stays on screen.
- Support remains outside the panel when visible in the mobile header.
- Search and theme controls stay in the panel's top utility area.

### `inline-hover-preview`

Use for article hover-image previews and similar inline editorial previews.

Rules:

- Block anchor: trigger.
- Inline anchor: trigger.
- Preferred placement: `bottom-start`.
- Offset: tokenized prose preview gap.
- Fallback order: `flip`, `shift-then-size`.
- Panel remains visually related to the inline trigger.
- Panel is an image-only preview surface with no background or padding.
- Panel may overlap prose, but should not cover the trigger itself.
- Panel should not become a centered viewport overlay.
- Long images respect max dimensions and viewport gutters.

## Collision And Sizing Rules

Collision behavior must be deterministic.

Horizontal flow:

1. Compute preferred x from placement.
2. If the panel fits inside boundary minus safe gutters, return preferred.
3. If preset allows alignment flip, try the opposite alignment.
4. If the flipped alignment fits, return `flipped-alignment`.
5. If neither alignment fits, shift into the boundary.
6. If shifting breaks the relationship beyond the preset's detach threshold,
   mark `detached`.

Vertical flow:

1. Compute preferred y from placement and offset.
2. Header-attached panels do not flip above the header.
3. Header-attached panels size to available height and scroll internally.
4. Trigger-attached previews may flip to the opposite side when preferred side
   does not fit.
5. If neither side fits, size to boundary and mark state.

Sizing flow:

1. Respect component max width/max height tokens.
2. Apply boundary-derived max width/max height.
3. Return final max dimensions for CSS to consume.
4. Components own internal scrolling styles.

## Accessibility And Interaction

- Use links for navigation and buttons for toggles.
- Do not use ARIA `menu` patterns for ordinary document navigation.
- Category dropdowns must work through hover, keyboard focus, and normal link
  navigation.
- Search reveal must expose a labeled search form and place focus into the
  search input when opened.
- Mobile navigation must have a clear accessible name and predictable focus
  order.
- Escape/light-dismiss behavior is desirable for popovers, but must not be the
  only way to close a surface.
- Hover behavior must be forgiving enough to move from trigger to panel without
  accidental close.
- Reduced-motion should remove transitions that could obscure placement.
- Theme changes must not affect geometry.

## No-JavaScript Behavior

No-JavaScript behavior may be simpler, but navigation must remain possible:

- category trigger links still navigate to category pages;
- `Articles`, `About`, support, and footer links remain normal links;
- mobile fallback must either remain navigable or degrade to visible links;
- search may require the normal `/search/` route if reveal enhancement is
  unavailable.

Any limitation must be documented in the relevant component one-pager.

## Testing Plan

The previous tests failed because they asserted visibility and containment, but
not intended relationships. New tests must assert both.

### Unit Tests

Unit tests target the pure engine and operations. They should not use Happy DOM.
Pass plain rectangles to pure functions.

Required test tables:

- every preset maps to the expected placement, anchors, fallbacks, offset, and
  sizing strategy;
- `bottom-start`, `bottom-end`, `top-start`, `top-end`, center alignment, and
  viewport-fill initial placement;
- split block/inline anchors where header bottom differs from trigger bottom;
- start, center, end, left-edge, right-edge, and nearly off-screen references;
- panel narrower than trigger, wider than trigger, and wider than available
  boundary;
- safe-gutter clamping on both inline edges;
- alignment flip for right-edge category dropdowns;
- no side flip for header-attached panels;
- side flip for inline hover previews;
- size constraints for short viewports;
- deterministic placement state output;
- detach detection when clamping breaks the trigger relationship;
- exact boundary behavior at one-pixel and subpixel tolerances.

Unit tests should verify that current known-bad geometry is impossible to
return for the relevant preset. For example, `header-dropdown` with a left-edge
trigger must not return a centered x unless the panel is so wide that it is
explicitly clamped.

### Render Tests

Astro render tests prove components opt into the shared contract:

- `CategoryDropdown` emits `data-anchor-root`, `data-anchor-trigger`,
  `data-anchor-panel`, and `data-anchor-preset="header-dropdown"`;
- `SearchReveal` emits a header search preset and matching trigger/panel
  relationship attributes;
- `MobileMenu` emits `data-anchor-preset="mobile-shell-panel"`;
- article hover-image components emit
  `data-anchor-preset="inline-hover-preview"`;
- components do not emit local centered fixed wrappers, `mx-auto` positioning
  wrappers, or component-specific final `top`/`left` placement when using the
  shared system;
- accessible names, links, buttons, and current-page attributes remain correct.

Render tests do not prove geometry. They prove components cannot bypass the
shared geometry boundary.

### Playwright E2E Invariants

Browser tests must be failure-driven. Before changing positioning code, add at
least one test that fails against each known bug:

- category dropdowns currently appear centered instead of trigger-aligned;
- search reveal currently has a vertical gap below the header;
- search reveal currently appears on the wrong inline side of its trigger;
- header-attached surface top edges can drift from the sticky header bottom;
- viewport-contained panels can still violate trigger/panel relationships.

Use a viewport matrix that includes:

- mobile: 390 x 844;
- short mobile: 390 x 560;
- tablet: 768 x 1024;
- laptop split screen: at least two widths where desktop category navigation is
  visible but constrained, such as 900-1100 px if the desktop category nav
  remains visible there;
- desktop: 1280 x 900;
- wide desktop: 2560 x 1200.

Resolution coverage is necessary but not sufficient. Each width should exercise
meaningful trigger positions:

- first visible trigger near inline start;
- middle trigger where preferred alignment has room;
- last visible trigger near inline end;
- trigger after scroll, where sticky header geometry is current;
- trigger after resizing from a different layout mode.

Header category dropdown tests:

- first, middle, and last visible category;
- panel top equals header bottom within a small tolerance;
- panel does not overlap the header;
- preferred inline edge aligns with trigger edge when there is room;
- right-edge fallback aligns panel end to trigger end;
- clamped panels preserve safe viewport gutters;
- moving pointer from trigger to panel keeps panel open long enough to use;
- keyboard focus opens preview and reaches preview links;
- clicking category text navigates to the category page;
- panel is topmost at points inside the panel and does not hide the trigger.

Search reveal tests:

- opening search places panel top at header bottom with no visible gap;
- panel aligns to the search trigger's logical edge;
- panel stays in viewport at every tested width;
- input receives focus after opening;
- search trigger and panel remain on the same side in desktop layout;
- no horizontal overflow appears while panel is open.

Mobile navigation tests:

- support remains visible in the mobile header while panel is open;
- panel top equals header bottom;
- panel fills between safe gutters and never opens off-screen from a left-side
  trigger;
- search and theme controls appear at the top of the panel;
- panel scrolls internally on short viewports;
- RSS is absent from the mobile panel;
- keyboard focus order enters the panel predictably.

Article hover preview tests:

- preview appears near the trigger, not centered in the viewport;
- panel does not cover the trigger;
- panel stays within viewport gutters when possible;
- panel flips or clamps according to preset;
- long images respect max dimensions.

Global anchored-surface tests:

- use shared geometry helpers instead of repeated raw coordinate assertions;
- no route-level horizontal overflow while a surface is open;
- light and dark mode keep borders, text, and focus indicators visible;
- behavior still works after scroll;
- behavior still works after resize from desktop to constrained widths and
  back;
- active panel is not hidden beneath another stacking context.

### E2E Helper Requirements

Use named helpers so tests read like design assertions. Current helpers include:

- `expectTopAlignedToBottom(panel, anchor, tolerance)`;
- `expectInlineStartAligned(trigger, panel, tolerance)`;
- `expectInlineEndAligned(trigger, panel, tolerance)`;
- `expectViewportContained(page, panel, label, gutter)`;
- `expectPanelBelowHeader(page, panel)`;
- `expectElementAtViewportPoint(locator, point, label)`;

Add more helpers only when a new invariant repeats across multiple specs.

Raw coordinate expectations scattered through tests are discouraged. Named
helpers keep intent reviewable and harder to weaken accidentally.

## Documentation Requirements

Implementation must update:

- `docs/components/navigation/CategoryDropdown.md`;
- `docs/components/navigation/SearchReveal.md`;
- `docs/components/navigation/MobileMenu.md`;
- article hover-image component docs if hover images migrate;
- `docs/navigation/header-and-articles-hub.md`;
- component catalog examples for every placement preset.

## Critical Review And Edge Cases

Potential mistakes to avoid:

- **Centering as fallback**: Centering made panels visible but wrong. Centering
  is allowed only in presets that explicitly ask for center alignment.
- **Top-layer without positioning**: Native popover solves layering, not
  product placement.
- **Header height assumptions**: two-row desktop header, one-row mobile header,
  font loading, and future density changes must not require new pixel offsets.
- **Single-anchor thinking**: header popups need block-axis anchoring to the
  header and inline-axis anchoring to the trigger.
- **Containment-only tests**: a panel can be contained and still be wrong.
- **Viewport-only thinking**: panel position must satisfy trigger relationship,
  header relationship, and viewport boundaries together.
- **Unowned scripts**: the DOM adapter must not fetch content, mutate route
  state, or own component semantics.
- **Hover-only access**: hover menus need keyboard and touch fallbacks.
- **Short viewports**: panels must scroll internally instead of extending below
  the viewport.
- **Over-generalization**: keep the primitive generic, but keep product presets
  explicit. Do not force every component to expose raw placement options.
- **Untested progressive enhancement**: CSS anchor positioning is welcome only
  if the same contract remains covered by tests.

## Development Handoff

The implementation milestone is ready when developers can:

1. add the pure anchored positioning engine and operation tests;
2. add the preset definitions and preset tests;
3. add the generic DOM adapter;
4. update anchored components to emit shared data attributes;
5. remove local fixed/centered positioning from those components;
6. add catalog examples for all presets and placement states;
7. add e2e relationship tests that fail on the current centered dropdown bug
   and search gap/alignment bug;
8. update component docs with the final implementation contract.
