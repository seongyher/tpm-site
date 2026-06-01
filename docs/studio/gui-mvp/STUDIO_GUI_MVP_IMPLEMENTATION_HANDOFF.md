# Studio GUI MVP Implementation Handoff

This document completes the implementation handoff plan for Linear `IRK-237`
and its child issue `IRK-265`.

It translates the completed Milestone 15 design work into the proposed next
implementation milestone: a high-fidelity, fixture-backed Studio GUI prototype.
The prototype should be visually polished, navigable, interactive, and
testable, but it must not add real source writes, real credentials, real
provider mutations, or live Cloudflare publishing.

## Proposed Next Milestone

Name:

> 16. Studio GUI MVP Fixture-Backed Prototype

Goal:

> Build the first high-fidelity Studio GUI MVP prototype inside the existing
> Astro/Tauri Studio app. It should use fixture-shaped operation data,
> shadcn/Radix/lucide/CodeMirror-style infrastructure, and a typed command and
> state model to demonstrate the complete user journey from startup through
> article editing, media, settings, preview, publish confirmation, and
> recovery states.

Why this milestone matters:

1. It turns the product/design plan into a working product surface.
2. It lets designers, engineers, and users evaluate navigation, density,
   layout, validation, publish safety, and workflow clarity before real source
   writes or provider mutations exist.
3. It proves the Studio GUI can stay an interface over operation-shaped data
   instead of becoming a browser-only CMS model.
4. It creates the component, fixture, command, accessibility, and visual QA
   foundation for later real operation binding.

## Scope Boundary

The milestone implements a fixture-backed product prototype only.

In scope:

- React workspace mounted inside the existing Astro Studio app.
- Studio design tokens and shell layout.
- Fixture model and fixture files shaped like future operation results.
- Navigable startup, recent projects, project home, article directory,
  article editor, media, settings, preview, publish, and restore states.
- Interactive state transitions over fixtures.
- Editor shell using CodeMirror or the selected source editor wrapper.
- shadcn/Radix/lucide-based UI primitives and interactions.
- Toolbar, command palette, hotkeys, context menus, and tooltip presentation
  where feasible for the prototype.
- Accessibility, keyboard, responsive, and screenshot verification for key
  states.

Out of scope:

- real source writes;
- broad frontend filesystem access;
- real folder open/save implementation;
- real Cloudflare authentication;
- real Cloudflare deploys;
- live Git/GitHub review workflows;
- real provider mutation;
- WYSIWYG MDX;
- collaboration;
- extension marketplace behavior.

## Required Inputs

Implementation should start only after these Milestone 15 documents are
complete and attached to the relevant Linear issues:

- [STUDIO_GUI_MVP_PRODUCT_SPEC.md](./STUDIO_GUI_MVP_PRODUCT_SPEC.md)
- [STUDIO_GUI_MVP_VISUAL_LANGUAGE.md](./STUDIO_GUI_MVP_VISUAL_LANGUAGE.md)
- [STUDIO_GUI_MVP_NAVIGATION_AND_SCREEN_STATES.md](./STUDIO_GUI_MVP_NAVIGATION_AND_SCREEN_STATES.md)
- [STUDIO_GUI_MVP_DEPENDENCY_DECISIONS.md](./STUDIO_GUI_MVP_DEPENDENCY_DECISIONS.md)
- [STUDIO_GUI_MVP_COMPONENT_ARCHITECTURE.md](./STUDIO_GUI_MVP_COMPONENT_ARCHITECTURE.md)
- [STUDIO_GUI_MVP_FIXTURE_STATE_MODEL.md](./STUDIO_GUI_MVP_FIXTURE_STATE_MODEL.md)
- [STUDIO_GUI_MVP_FIGMA_HANDOFF.md](./STUDIO_GUI_MVP_FIGMA_HANDOFF.md)
- [STUDIO_GUI_MVP_VISUAL_REFERENCES.md](./STUDIO_GUI_MVP_VISUAL_REFERENCES.md)
- [STUDIO_GUI_MVP_ENGINEERING_SPEC.md](./STUDIO_GUI_MVP_ENGINEERING_SPEC.md)
- [STUDIO_GUI_MVP_INTERACTION_STATE_MATRIX.md](./STUDIO_GUI_MVP_INTERACTION_STATE_MATRIX.md)

If Figma mockups are available before implementation starts, use them as visual
input. They are not blockers for building the fixture and component
foundation, but they are blockers for final visual polish unless the team
explicitly accepts using the current reference image set as the visual source
of truth.

## Current Implementation Status

Milestone 16 now implements the fixture-backed Studio GUI prototype in
`apps/studio`.

Implemented:

- bounded React workspace mounted from the static Astro Studio app;
- Studio shell, toolbar, sidebar, resizable/collapsible panes, preview rail,
  and native-toolbar placeholders;
- operation-shaped fixture graph and pure view models for startup, recent
  projects, project home, article directory, article editor, media, settings,
  preview, publish, and restore states;
- shared command registry for toolbar actions, hotkeys, command palette,
  context menus, dropdown menus, and disabled/blocked reasons;
- source-editor shell with CodeMirror and command-backed Markdown
  transformations;
- descriptor-backed article and settings forms with local validation and
  actionable diagnostics;
- media browser with local fixture assets, selected detail pane, alt/caption
  fields, warning states, and fixture-only insert flow;
- publish preview, confirmation, progress, success, blocked, and failed states
  with redacted credential references and no provider mutation;
- restore checkpoint selection, confirmation, completion, and unavailable
  capability states;
- Playwright coverage for required MVP screen states, keyboard behavior,
  sidebar resizing, command surfaces, dialogs, high text zoom, reduced motion,
  and axe accessibility scans;
- unit coverage for fixture validation, view models, command availability,
  reducers, editor transformations, pane policy, interaction-state matrix
  invariants, and visual contrast tokens.

Accepted fixture-prototype differences:

- previews are rendered from fixture view models, not live Astro route output;
- article saves, media insertion, restore, and publish transitions mutate only
  in-memory fixture state;
- Cloudflare credentials and deploys are represented by redacted fixture
  references only;
- the app does not open real folders, write real source files, call provider
  APIs, or require broad Tauri capabilities;
- the visual source of truth is the written GUI MVP docs plus the committed
  reference image library until approved Figma mockups replace or refine it.

The next operation-binding milestone should preserve these component,
command, fixture, diagnostic, and test seams while replacing selected fixture
transitions with Rust/Tauri operations behind the same contracts.

## Definition Of Done

The prototype milestone is complete when:

1. `apps/studio` builds and previews the fixture-backed GUI.
2. The GUI remains static-build compatible and Tauri-package compatible.
3. The app renders every required MVP screen and state from fixtures.
4. The app uses a component hierarchy aligned with the engineering spec.
5. The article directory/browser exists as a main-pane surface.
6. The article editor shows frontmatter forms, source editor, toolbar, status,
   preview, invalid-field state, and preview-collapsed state.
7. Media and settings surfaces render realistic fixture data and local
   validation states.
8. Publish uses preview, confirm, progress, blocked, failed, and success
   states; no provider mutation exists.
9. Command records power toolbar, hotkey, context menu, and command palette
   actions where practical.
10. Pane collapse, responsive behavior, long content, and compact layouts are
    tested or manually screenshot-verified.
11. Accessibility checks cover shell landmarks, labels, forms, dialogs,
    tooltips, context menus, keyboard navigation, and focus restoration.
12. Fixture and state tests cover high-risk pure logic without test-only
    exports.
13. Docs and Linear issues are updated with scope decisions, accepted
    differences, and follow-up blockers.

## Proposed Implementation Issues

### 1. Dependency And React Workspace Setup

Goal: install and configure only the GUI dependencies required for the
prototype, then mount a bounded React workspace inside the existing Astro
Studio shell.

Likely tasks:

- add `@astrojs/react`, React, and React DOM;
- add only needed shadcn/Radix components;
- add lucide React icons;
- add CodeMirror dependencies or selected wrapper;
- add resizable, command, tooltip, context menu, and dialog primitives;
- update Astro Studio config without touching the public site app;
- document dependency ownership and bundle/performance concerns.

Blocks:

- all React component implementation;
- shadcn/Radix component composition;
- CodeMirror editor implementation.

Parallel-safe work before completion:

- fixture model design can start from documents;
- visual token CSS planning can start.

### 2. Studio Tokens, UI Primitives, And App Shell Foundation

Goal: create the design-token and primitive foundation for the Studio product.

Likely tasks:

- encode neutral palette, typography, radius, spacing, focus, and state tokens;
- create or install shadcn primitives;
- implement `StudioApp`, provider wrappers, and shell skeleton;
- preserve `just studio-build`, `just studio-check`, and Tauri build surfaces;
- prove no package scripts are reintroduced.

Blocks:

- screen implementation;
- visual QA;
- responsive pane work.

### 3. Fixture Schema, Fixture Files, And State Model

Goal: create the fixture data model that powers the prototype without
inventing a throwaway CMS model.

Likely tasks:

- define runtime fixture validators plus TypeScript types where practical;
- add fixture files for startup, recent projects, project home, article
  directory, article editor, media, settings, preview, publish, and restore;
- keep source references, diagnostics, provider summaries, credentials, and
  operation mapping explicit;
- add pure fixture loading and validation tests.

Blocks:

- realistic screen rendering;
- state transition tests;
- visual fixture screenshots.

Parallel-safe work:

- app shell can proceed with placeholder fixtures if contracts are stable;
- command registry can define initial command IDs.

### 4. Command Registry, State Reducer, And Session Restore Model

Goal: centralize commands and fixture state transitions so toolbar buttons,
hotkeys, context menus, command palette, and screen controls do not fork
behavior.

Likely tasks:

- create command record type with ID, label, shortcut, availability, disabled
  reason, safety class, and handler;
- create app reducer/router for active screen, selected article/media/settings,
  panel sizes, directory filters, editor state, preview state, and publish
  state;
- model exact session restore and restore-failed states;
- add pure tests for command availability and state transitions.

Blocks:

- meaningful toolbar/hotkey/context menu interactions;
- publish flow transitions;
- exact restore demo.

### 5. Workspace Shell, Toolbar, Sidebar, And Resizable Panes

Goal: implement the desktop app frame that all screens share.

Likely tasks:

- implement toolbar with back/forward, search/command, saved status, preview,
  publish, and context-sensitive actions;
- implement collapsible/resizable sidebar;
- implement preview/details pane with collapse behavior;
- implement sidebar primary nav and article tree shell;
- preserve keyboard and tooltip behavior for icon controls;
- add layout tests or Playwright snapshots for wide, compact, collapsed, and
  long-title states.

Blocks:

- final screen composition;
- responsive and visual QA.

### 6. Startup, Recent Projects, And Project Home Screens

Goal: implement the first user journey and exact restore fallback surfaces.

Likely tasks:

- first-launch welcome screen;
- recent projects list;
- missing-folder recovery row;
- project home action grid;
- recent work and draft summaries;
- local provider status summary where fixture data exists.

Blocks:

- onboarding and restore flow QA.

Parallel-safe after shell/fixtures:

- can proceed independently of article editor internals.

### 7. Article Directory And Article Tree Workflows

Goal: implement the main-pane article browser plus persistent sidebar article
navigation.

Likely tasks:

- status tabs or segmented control;
- search input;
- category/tag filters;
- article cards or rows from `ArticleDirectoryResult` view models;
- no articles and no results states;
- warning markers;
- Open Editor and New Article actions;
- article tree row selected/dirty/draft/invalid states;
- context menu shell for article actions.

Blocks:

- smooth article browsing and editor entry.

### 8. Article Editor, Metadata Forms, Source Editor, And Editor Commands

Goal: implement the primary writing surface.

Likely tasks:

- descriptor-backed article metadata form;
- invalid field state with local validation;
- CodeMirror source editor;
- editor toolbar;
- editor context menu;
- editor status strip and autosave state;
- preview-collapsed writing mode;
- command transformations for bold, italic, link, heading, quote, code,
  lists, image insert, and footnote placeholder where supported.

Blocks:

- article editing visual QA;
- media insert integration;
- publish-from-current-article flow.

### 9. Preview Pane And Preview State Screens

Goal: represent true-rendered-preview behavior over fixtures without creating
a second Markdown preview model.

Likely tasks:

- preview pane toolbar and route label;
- desktop/mobile tab or mode if included in the design;
- ready, stale, loading, blocked, and failed states;
- full-screen or dominant publish preview mode;
- diagnostics banner/list in preview context;
- focus return after preview actions.

Blocks:

- publish preview flow;
- article editor split-screen acceptance.

### 10. Media Browser, Media Detail, And Insert Flow

Goal: implement the image-management surface.

Likely tasks:

- media grid/list;
- search and Add button placeholder;
- selected thumbnail state;
- missing-alt warning state;
- media detail pane with large preview, alt, caption, dimensions, size,
  type, usage list, insert, replace, reveal, and overflow menu;
- insert image command that changes fixture editor state only.

Blocks:

- article image insertion demo;
- media accessibility QA.

### 11. Settings Forms

Goal: implement visual site settings surfaces from descriptor-like data.

Likely tasks:

- settings section navigation;
- site identity, domain, navigation, social/support, authors, categories,
  homepage, theme, and publishing sections;
- autosave status;
- advanced disclosure;
- invalid field state;
- shared field renderer with article metadata forms where practical.

Blocks:

- site-owner workflow acceptance.

### 12. Publish Preview, Confirm, Progress, Success, Blocked, And Failed Flows

Goal: implement the complete publish workflow visually over fixtures.

Likely tasks:

- Publish button routes to preview preparation state;
- preview starts at current article route when invoked from editor and home
  page otherwise;
- confirm publish modal includes destination, checkpoint, summary, warnings,
  cancel, and publish actions;
- publishing progress state;
- success with URL and checkpoint path;
- blocked missing-credential flow with Connect Cloudflare action;
- retryable failure state.

Blocks:

- MVP end-to-end journey acceptance.

### 13. Restore Version Flow

Goal: show safe version restore behavior without implementing history writes.

Likely tasks:

- checkpoint list;
- checkpoint detail;
- restore confirmation;
- restore/cancel actions;
- source-diff placeholder where fixture data exists;
- recovery copy for unavailable history capability.

Blocks:

- safe-save and recovery product promise acceptance.

### 14. Accessibility, Keyboard, Context Menu, Tooltip, And Responsive Hardening

Goal: make the prototype behave like a real desktop app, not a screenshot.

Likely tasks:

- keyboard traversal through shell, sidebar, article directory, editor,
  dialogs, menus, media, settings, and publish;
- screen-reader labels for icon controls and form fields;
- tooltip labels with shortcut pills;
- focus trap and return for dialogs/context menus;
- reduced-motion handling;
- long text, compact width, collapsed panes, and high zoom checks;
- no pointer-only required actions.

Blocks:

- prototype readiness.

### 15. Visual QA, Tests, Docs, And Linear Handoff

Goal: finish the milestone with evidence and next-step clarity.

Likely tasks:

- unit tests for pure reducers, commands, filters, and state machines;
- fixture/schema tests;
- component accessibility tests where available;
- Playwright screenshots for required states;
- `just studio-check`, `just studio-build`, relevant unit/browser checks, and
  release-facing checks as appropriate;
- docs updates for implemented component/fixture/test decisions;
- Linear issues moved to In Review with relevant docs attached.

Blocks:

- milestone closeout.

## Sequencing And Parallelization

Start in this order:

1. dependency and React setup;
2. tokens/shell foundation;
3. fixture schema and command/state model.

Once those foundations are stable, the following tracks can proceed in
parallel:

- startup/project home;
- article directory and article tree;
- article editor and preview;
- media browser;
- settings forms;
- publish and restore flows.

The final hardening track should begin early with the first shell components,
but it cannot finish until all screens exist.

## Blocker Rules

Use these blocker rules when creating Linear issues:

1. Any screen implementation that needs React or shadcn is blocked by
   dependency setup.
2. Any screen that renders real data is blocked by fixture schema or a scoped
   placeholder fixture decision.
3. Any interaction that appears in multiple surfaces is blocked by the command
   registry, unless explicitly implemented as a local throwaway interaction
   with a short expiry.
4. Article editor implementation is blocked by the editor dependency choice and
   fixture article document shape.
5. Media insert is blocked by editor command model and media fixtures.
6. Publish confirm/progress/success is blocked by publish fixture state and
   command/state transitions.
7. Final visual QA is blocked by all target screens existing.
8. Final accessibility QA is blocked by all interactive controls existing, but
   accessibility requirements must be applied as each component is built.

Do not mark real provider work, real source writes, real credential storage,
or Cloudflare deployment as blocked by this milestone. They are out of scope
for the prototype milestone.

## Linear Planning Shape

When this handoff is transferred into Linear, create one parent milestone issue
for the fixture-backed prototype and child issues that mirror the proposed
implementation issues above.

Recommended structure:

1. parent issue: "Studio GUI MVP fixture-backed prototype";
2. foundation child issues: dependencies, tokens/shell, fixtures, command
   registry;
3. product-surface child issues: startup/project home, article directory,
   editor/preview, media, settings, publish, restore;
4. hardening child issues: accessibility/keyboard/responsive behavior,
   visual QA/testing/docs handoff.

Use the blocker rules in this document for Linear dependencies. Avoid creating
real-operation, provider, credential, deploy, or source-write issues as
children of this prototype milestone; those belong to later operation-binding
milestones after the fixture UI proves the product shape.

## Verification Plan

The implementation milestone should verify:

- `just studio-check`;
- `just studio-build`;
- focused unit tests for fixture/state/command logic;
- focused component tests for forms, labels, disabled states, dialogs, and
  menus;
- Playwright screenshot coverage for the required screen states;
- axe/accessibility review for the core shell and high-risk flows;
- no package script reintroduction;
- no broad Tauri capabilities;
- no real credentials, provider mutations, or source writes;
- docs/checklist/Linear handoff updated.

Run heavier release checks at milestone closeout, or earlier if the
implementation touches shared repository tooling, Rust operations, Tauri
capabilities, or public site code.

## Risks And Open Questions

- Figma mockups may arrive after implementation starts. Build foundations from
  written specs, then use Figma as polish input before final QA.
- CodeMirror wrapper choice may affect bundle size and control. Prefer direct
  integration or a thin wrapper, and keep the editor command model ours.
- A full tree dependency may be more than the MVP needs. Use true tree
  infrastructure only if keyboard and ARIA tree semantics are required.
- Command palette scope could grow too quickly. Seed the command model, but
  expose only MVP commands in the visible UI.
- Publish UI could imply real deploy support. Keep fixture language clear and
  avoid enabling real provider capability in this milestone.
- Settings descriptors may drift from real schemas. Keep descriptor fixtures
  shaped like future operation/schema-derived descriptors.
- Visual references may disagree with later Figma output. Written contracts and
  final approved Figma should override generated screenshot noise.
- Accessibility could become late cleanup. Treat labels, focus, keyboard, and
  invalid states as component acceptance criteria from day one.

## Handoff Summary

Milestone 16 should produce a working, high-fidelity, fixture-backed Studio GUI
that demonstrates the full MVP product path while preserving the operation-core
architecture. It should make the next later milestone obvious: replacing
selected fixture transitions with real Rust/Tauri operations behind the same
components, commands, diagnostics, and provider capability model.
