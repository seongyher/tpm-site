# Studio GUI MVP Invariant Test Recovery

This document defines the invariant test pass for `IRK-302`. It turns the
Milestone 16 recovery feedback into executable guards so the fixture-backed GUI
does not regress into broken layout states, double selections, sticky previews,
or oversized unstable browsing surfaces.

The goal is a great user experience and great engineering: tests should encode
the product model, not freeze incidental pixels.

## Testing Goals

1. Prove hidden panes are absent from both state-derived layout and the rendered
   DOM.
2. Prove sidebar selection is derived from one active location.
3. Prove article live preview is scoped to article editing only.
4. Prove article-tree folder expansion and article selection respond through
   command-backed state on the first interaction.
5. Prove compact chrome and browsing surfaces keep stable geometry without
   horizontal overflow.
6. Prove visible workspace panes remain adjacent after resize and pane content
   stays bounded inside its own pane instead of painting over neighboring
   panes.
7. Prove screen-specific controls have labels, disabled reasons, keyboard
   access, and non-color-only feedback.
8. Keep tests tied to public product seams: commands, reducers, selectors,
   visible roles, semantic labels, and stable `data-testid` anchors.

## What Belongs In Unit Tests

Unit tests should guard pure state and command rules:

- command IDs stay synchronized with the interaction matrix;
- unavailable commands return disabled or blocked reasons and preserve state;
- hidden sidebar and preview panes are excluded from workspace regions;
- non-editor screens cannot render article live preview;
- navigation commands clear editor-only preview participation;
- sidebar selection returns one selected target for the active location;
- article-tree folder toggles reject missing or non-folder targets;
- command availability stays precise for article, media, settings, publish, and
  restore contexts.

These tests should not require React, DOM, browser storage, Tauri, or local
filesystem access.

## What Belongs In Playwright Tests

Browser tests should guard rendered product behavior:

- hidden sidebar and preview states leave no visible rail, label, or resize
  handle;
- exactly one sidebar item is selected after representative navigation and
  article switching;
- clicking an article row in the sidebar opens that article on the first click;
- collapsing an article-tree folder removes its child article rows and expanding
  restores them;
- editor live preview disappears when navigating to directory, media, settings,
  project home, publish, restore, or startup screens;
- sidebar, work, and preview pane boxes stay non-overlapping after compact
  viewport resize interactions;
- pane roots do not have wider immediate content that can visibly leak across
  neighboring pane boundaries;
- article-directory thumbnails use a uniform social-preview aspect ratio;
- settings section navigation keeps intrinsic height instead of stretching to
  match taller forms;
- toolbar, sidebar, dialogs, menus, tooltips, and diagnostics expose accessible
  names and avoid horizontal overflow.

Pixel thresholds are allowed only for product invariants such as toolbar height,
minimum sidebar width, and thumbnail aspect ratio. Avoid asserting arbitrary
spacing or full screenshot equality in this milestone.

## Current And Deferred Invariants

The following invariants are enforceable now:

- hidden means hidden for sidebar and preview panes;
- one visible sidebar selection;
- preview scoped to article editor screens;
- compact toolbar and sidebar sizing;
- compact resized workspace panes remain adjacent and content-bounded;
- settings navigation height stability;
- article-directory thumbnail geometry;
- article-directory row geometry;
- article-tree folder expansion;
- inline title editing as the canonical title editing surface;
- collapsible Properties card replacing the old Identity card;
- flat full-width source editor with no line numbers by default;
- command availability and disabled reasons;
- all required fixture screen states render through the Studio shell.

The following invariants are intentionally completed by later Milestone 16
recovery issues and should receive same-patch tests there:

- complete interaction audit after all screen polish lands (`IRK-301`).

## Definition Of Done For IRK-302

- The tests would have caught the known pane, selection, preview-scope,
  thumbnail, settings-layout, and pane-overlap regressions.
- No test-only exports are introduced.
- Stable semantic anchors added for tests are also useful product semantics or
  accessibility anchors.
- Focused Studio unit tests, Studio type checks, Studio Playwright tests, docs
  checks, and relevant coverage review pass or have justified review-only gaps.
