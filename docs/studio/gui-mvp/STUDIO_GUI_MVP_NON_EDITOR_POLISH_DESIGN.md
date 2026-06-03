# Studio GUI MVP Non-Editor Polish Design

This document defines the IRK-300 polish pass for settings, media, publish,
restore, project home, recent projects, and startup screens. It applies the
elevated quality standard to the surfaces outside the article editor.

The goal is a product-quality fixture GUI: compact, useful, visually honest,
and fully inspectable. The user should feel like they are using a calm desktop
publishing tool, not a narrated prototype.

## Product Principles

1. Keep ordinary screens direct. A selected sidebar item, field labels, and
   visible controls already tell the user where they are.
2. Use mode labels only when they prevent confusion: publish preview, restore
   confirmation, missing project recovery, and blocking diagnostics.
3. Replace prototype explanations with product behavior. The fixture must not
   mutate files or providers, but that belongs in tests, docs, and disabled
   future controls, not in normal user-facing copy.
4. Keep control density native and compact. Permanent and repeated controls
   should be small enough that work content stays primary.
5. Make controls honest. Dead controls should either dispatch a meaningful
   fixture command, open a visible fixture state, or be disabled with a precise
   tooltip/reason.
6. Avoid layout coupling. Navigation columns, filters, and sidebars should keep
   intrinsic dimensions instead of stretching to match unrelated content.
7. Keep validation local. Show errors near fields, selected media, or publish
   confirmation rather than with broad global dashboards.

## Screen Designs

### Settings

Settings behaves like a compact inspector. The section list is an intrinsic
height navigation column. It must not stretch when a taller section, such as
Homepage, is selected.

Design requirements:

- remove the global saved banner in the healthy state because the toolbar
  already communicates saved state;
- keep a compact local alert only for dirty, autosaving, or invalid states;
- keep the active section heading small and local to the form card;
- keep advanced options collapsed and compact;
- use descriptor-driven field validation and local helper/error text;
- verify the settings nav column keeps a stable height across sections.

### Media

Media opens directly as a browser: add/search/view controls, grid or list, and
a detail pane. It should not show a title/subtitle stack that repeats the
selected nav item.

Design requirements:

- toolbar contains Add, search, grid/list toggle, and a compact result count;
- Add, Replace, Reveal, Copy, and overflow actions must be either visible
  fixture states or disabled with a useful reason;
- grid thumbnails use stable aspect ratios and dimensions;
- detail pane uses selected image, metadata fields, facts, and usage list as
  the information hierarchy;
- missing alt text is a local state that disables insertion until fixed;
- no redundant "Media library / Media / Browse..." copy.

### Publish

Publishing is a safety-critical flow and may keep concise mode labels. It must
still feel like a real publish workflow, not a provider test harness.

Design requirements:

- publish preview shows a compact route/status header and whole-site preview;
- confirmation remains explicit before publish apply;
- progress, success, blocked, and failed states are distinct;
- copy should describe what will happen, not that a prototype will avoid doing
  it;
- provider/credential/checkpoint details stay in the plan summary;
- fixture-only safety remains verified by tests and command safety classes.

### Restore

Restore is a safety-critical history workflow. The screen should be compact
and concrete: checkpoints, selected checkpoint details, confirmation, and
result.

Design requirements:

- header identifies the article and history mode without a large marketing
  title stack;
- checkpoint list uses compact rows with selected state;
- selected detail explains the restore target and source reference;
- confirmation copy states the consequence before restore;
- unavailable history is a capability state with a repair path, not an app
  error;
- remove visible prototype language from normal restore states.

### Project Home

Project home is a launch pad after opening a site. It can keep a modest title,
but actions and recent work should dominate.

Design requirements:

- keep the action grid compact;
- shorten action descriptions to verbs or concrete outcomes;
- keep recent article rows scannable;
- provider connection appears as a small status/action row, not a dashboard;
- all action cards dispatch commands that change visible state.

### Startup And Recent Projects

Startup should be friendly without teaching the whole product. Recent projects
should be a compact table/list with clear recovery for missing project paths.

Design requirements:

- first launch keeps Create site and Open site primary;
- recent-project missing rows include Locate and Remove actions;
- More/options controls are disabled or wired to a visible fixture menu/state;
- missing project recovery is inline and actionable;
- no project-health dashboard or technical workspace language.

## Interaction And State Invariants

The polish pass must preserve these invariants:

- settings section navigation height is independent of selected form height;
- no healthy non-editor screen shows redundant heading/subheading stacks;
- media insertion is impossible without both selected media and valid alt text;
- publish cannot skip preview and confirmation;
- restore cannot skip checkpoint selection and confirmation;
- dead future controls expose disabled reasons instead of appearing broken;
- visible actions dispatch shared command IDs;
- all major states are reachable through screen deep links and inspected
  visually before handoff.

## Test And Visual Verification

Required tests:

- settings nav stability across at least two sections with different form
  heights;
- no redundant media heading/subheading copy in the media browser;
- media missing-alt disables insertion and fixing the field enables insertion;
- representative project home actions open their target screens;
- recent-project missing recovery actions change fixture state;
- publish preview to confirmation to progress to success;
- restore checkpoint selection to confirmation to restored state.

Required manual screenshots:

- project home;
- first launch;
- recent projects with missing project;
- settings saved and settings invalid;
- media grid, media list, and missing-alt detail;
- publish preview, confirm, progress, success, blocked, and failed where
  fixture states exist;
- restore ready, confirm, restored, and unavailable where fixture states exist.
