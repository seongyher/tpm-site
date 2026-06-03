# Studio GUI MVP Engineering Specification

This document completes the consolidated engineering design pass for Linear
`IRK-276`.

It is the developer-facing blueprint for the first shippable Studio GUI MVP
and the next high-fidelity, fixture-backed GUI prototype milestone. It
consolidates the Milestone 15 product, visual, navigation, dependency,
component, fixture, and designer handoff work into one implementation-oriented
specification.

This is not an implementation patch. It defines what the next implementation
milestone should build and how developers should keep that work aligned with
the shared Studio operation model.

## Source Documents

This specification consolidates:

- [STUDIO_GUI_MVP_PRODUCT_SPEC.md](./STUDIO_GUI_MVP_PRODUCT_SPEC.md)
- [STUDIO_GUI_MVP_VISUAL_LANGUAGE.md](./STUDIO_GUI_MVP_VISUAL_LANGUAGE.md)
- [STUDIO_GUI_MVP_NAVIGATION_AND_SCREEN_STATES.md](./STUDIO_GUI_MVP_NAVIGATION_AND_SCREEN_STATES.md)
- [STUDIO_GUI_MVP_DEPENDENCY_DECISIONS.md](./STUDIO_GUI_MVP_DEPENDENCY_DECISIONS.md)
- [STUDIO_GUI_MVP_COMPONENT_ARCHITECTURE.md](./STUDIO_GUI_MVP_COMPONENT_ARCHITECTURE.md)
- [STUDIO_GUI_MVP_FIXTURE_STATE_MODEL.md](./STUDIO_GUI_MVP_FIXTURE_STATE_MODEL.md)
- [STUDIO_GUI_MVP_FIGMA_HANDOFF.md](./STUDIO_GUI_MVP_FIGMA_HANDOFF.md)
- [STUDIO_GUI_MVP_VISUAL_REFERENCES.md](./STUDIO_GUI_MVP_VISUAL_REFERENCES.md)
- [STUDIO_GUI_MVP_INTERACTION_STATE_MATRIX.md](./STUDIO_GUI_MVP_INTERACTION_STATE_MATRIX.md)
- [STUDIO_GUI_MVP_ELEVATED_QUALITY_STANDARD.md](./STUDIO_GUI_MVP_ELEVATED_QUALITY_STANDARD.md)
- [HEADLESS_STUDIO_CORE_CONTRACT.md](../HEADLESS_STUDIO_CORE_CONTRACT.md)
- [STUDIO_EDITING_SURFACES.md](../STUDIO_EDITING_SURFACES.md)
- [STUDIO_PUBLISH_WORKFLOWS.md](../STUDIO_PUBLISH_WORKFLOWS.md)
- [STUDIO_PROVIDER_CAPABILITY_MATRIX.md](../STUDIO_PROVIDER_CAPABILITY_MATRIX.md)
- [STUDIO_PARITY_FIXTURE_STRATEGY.md](../STUDIO_PARITY_FIXTURE_STRATEGY.md)
- [STUDIO_PRODUCT_TEST_PLAN.md](../STUDIO_PRODUCT_TEST_PLAN.md)
- [RUST_OPERATION_CONTRACTS.md](../../rust/RUST_OPERATION_CONTRACTS.md)
- [RUST_ADAPTER_RUNTIME.md](../../rust/RUST_ADAPTER_RUNTIME.md)

If a visual reference contradicts a written contract, follow the written
contract. If two written contracts conflict, preserve the headless operation
core, source-truth, capability, credential, and plan/apply safety contracts.
If an older GUI MVP document permits a lower-quality interaction or visual
state than the elevated quality standard, update the older document and follow
the higher product and engineering bar.

## Product Target

The Studio GUI MVP is a native-feeling desktop publishing studio for a
non-technical blogger. The default user should be able to open or create a
site, write an article, add media, edit settings, preview the real generated
site, save safely, restore checkpoints, and publish to Cloudflare through a
confirmable preview flow without learning Git, Astro, frontmatter, build logs,
or deploy commands.

The MVP is minimum only in feature scope. It must still feel like a finished
product:

1. calm, polished, and native-feeling;
2. safe enough that invalid source is hard to create;
3. clear enough that a non-technical author understands what to do next;
4. structured enough that later real operations can replace fixtures without a
   rewrite;
5. testable enough that layout, accessibility, keyboard, command, fixture, and
   state regressions are caught early.

The prototype must not rely on explanatory scaffolding to make unfinished
screens understandable. Page titles, subheads, placeholder controls, and
status panels should appear only when they serve an author task, validation
state, navigation need, or safety decision.

## Product Non-Goals

The MVP and next fixture-backed prototype do not include:

1. real source writes;
2. real filesystem open/save implementation;
3. real provider credentials;
4. real Cloudflare deploys;
5. live Git/GitHub review flows;
6. WYSIWYG MDX editing;
7. collaboration;
8. extension marketplace installation;
9. multiple deploy providers;
10. broad frontend filesystem, shell, network, provider, or credential
    permissions;
11. browser-side source parsing as the canonical source model.

Simulated interactions are allowed in the fixture prototype only when the UI
clearly remains fixture-backed and the fixture shape maps to future Rust
operation results.

## Architecture Boundary

The GUI is an interface over the Studio operation core. It must not become a
parallel CMS.

```text
Astro static Studio shell
  mounts a bounded React Studio workspace
    renders fixture-shaped operation results
    dispatches typed UI commands
    renders future Tauri/Rust operation results

Rust operation core
  owns workspace/source references
  owns operation envelopes
  owns diagnostics
  owns capability reports
  owns provider and credential state
  owns plan/apply safety
```

### Must Be Shared With CLI, MCP, And CI

The GUI should consume the same concepts used by CLI, MCP, and CI:

- operation request/result envelopes;
- source references;
- diagnostics;
- provider capabilities;
- credential references and redaction;
- preview state;
- publish plan/apply state;
- source diffs and checkpoints;
- release and audit summaries;
- fixture/golden contracts.

### Must Stay GUI-Specific

The GUI owns presentation and interaction:

- app shell composition;
- pane layout and collapse state;
- visual tokens;
- React component composition;
- tooltips and shortcut display;
- editor widget integration;
- local form draft state;
- focus restoration;
- DOM accessibility behavior;
- Playwright screenshot states.

The GUI must not own canonical source policy, provider mutation policy,
credential secrets, build output truth, deploy behavior, or generated-output
verification.

## Implementation Surface

The next implementation milestone should work in `apps/studio/` and should
preserve the existing Astro/Tauri boundary.

Current baseline to preserve:

- `apps/studio` already builds as a static Astro Studio shell.
- `apps/studio/src-tauri` already packages the shell in a minimal Tauri app.
- read-only operation fixtures and authoring operation fixtures already exist.
- Tauri capabilities are intentionally narrow.
- `just studio-build`, `just studio-check`, `just studio-tauri-build`, and
  related checks must remain valid command-router surfaces.

The fixture-backed GUI prototype can evolve the current shell substantially,
but it must preserve the core invariant: the GUI renders operation-shaped data
and dispatches typed commands. It must not replace existing operation parity
with a browser-only source model.

Recommended shape:

```text
apps/studio/src/
  components/
    ui/
    shell/
    navigation/
    editor/
    forms/
    media/
    preview/
    publish/
    feedback/
  data/
    fixtures/
  state/
  commands/
  models/
  screens/
  styles/
```

Astro should own static packaging and the page that mounts the interactive
workspace. React should own the interactive Studio app. Rust/Tauri should own
source, provider, and operation truth.

Do not replace the public site architecture with React. Keep this React
surface scoped to the Studio product.

## Dependency Decisions

Use mature, common infrastructure for solved UI problems:

| Need                  | Decision                                                             |
| --------------------- | -------------------------------------------------------------------- |
| Frontend shell        | Astro static app                                                     |
| Interactive workspace | Bounded React island/app through Astro                               |
| UI primitives         | shadcn/Radix source-owned components                                 |
| Icons                 | lucide React icons                                                   |
| Resizable panes       | shadcn Resizable / `react-resizable-panels`                          |
| Dialogs/menus         | shadcn/Radix Dialog, AlertDialog, DropdownMenu, ContextMenu, Tooltip |
| Command palette       | shadcn Command / `cmdk` with Studio-owned command registry           |
| Forms                 | shadcn fields plus Studio field descriptors                          |
| Editor                | CodeMirror 6 for source-faithful Markdown/MDX editing                |
| Tree                  | React Aria Tree or equivalent if true tree semantics are implemented |
| Hotkeys               | Central command registry plus a small hotkey integration             |
| Tauri capabilities    | Narrow Rust/Tauri command boundaries, not broad frontend permissions |
| Credentials           | Credential references in fixtures; real secure storage later         |

Hand-roll Studio domain logic:

- command registries;
- field descriptors;
- article directory view models;
- source references;
- editor command transformations;
- preview state machine;
- publish state machine;
- autosave/checkpoint state machine;
- capability-to-action availability rules;
- author-language diagnostics.

Do not hand-roll focus traps, context menu mechanics, tooltip mechanics,
resizable panes, native dialogs, secret storage, or editor transaction
primitives.

## Visual And Layout Contract

The visual direction is a quiet native desktop tool:

- neutral app surfaces;
- sparse, meaningful color;
- rounded selected rows and controls;
- subtle dividers;
- compact icon-leading rows;
- visible but quiet primary actions;
- fast functional motion;
- tooltips with shortcut hints;
- no decorative gradients, orbs, or marketing-page composition.

Use the generated Studio references as the primary target. Use the improved
mockup references as the strongest supplemental reference, especially for the
article directory. Use Codex only as a secondary quality reference for
restraint and polish.

### Token Decisions

Use these token values as the starting point for implementation and Figma
mapping. Developers may adjust exact values only when visual QA shows a clear
reason, and changes should stay inside this restrained palette.

| Token              | Starting value | Use                                      |
| ------------------ | -------------- | ---------------------------------------- |
| App background     | `#F4F4F2`      | Window background                        |
| Sidebar background | `#E7E7E4`      | Left navigation and secondary rails      |
| Panel background   | `#FFFFFF`      | Main work panes, forms, dialogs          |
| Panel muted        | `#F7F7F5`      | Inset strips, code blocks, inactive rows |
| Border             | `#DADAD6`      | Pane dividers and low-emphasis outlines  |
| Text               | `#242424`      | Primary text                             |
| Muted text         | `#6F6F6B`      | Secondary labels and metadata            |
| Subtle text        | `#A0A09B`      | Section labels and disabled text         |
| Accent blue        | `#4C91F8`      | Primary action, focus, selected action   |
| Accent blue text   | `#0F3B75`      | Text on pale blue selection surfaces     |
| Success            | `#2D8A57`      | Saved, connected, published, valid       |
| Warning            | `#A86D13`      | Needs attention, recoverable warning     |
| Danger             | `#B63F35`      | Destructive or blocking state            |

Typography:

- UI font: `Inter`, `ui-sans-serif`, `system-ui`, `-apple-system`,
  `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`;
- editor font: `Geist Mono`, `ui-monospace`, `SFMono-Regular`, `Menlo`,
  `Monaco`, `Consolas`, monospace.

Spacing and shape:

- use an 8 px base rhythm;
- use 12 px compact row padding;
- use 16 px panel padding;
- use 20-24 px screen gutters;
- use 8-10 px radius for buttons, inputs, and selected rows;
- use 10-12 px radius for dialogs, menus, and visible panel edges.

### Core Layout

```text
Native window chrome
Studio toolbar
Workspace layout
  Left sidebar: 260-300 px default, 56 px icon-collapsed
  Main work pane: flexible, minimum useful width around 420 px
  Right preview/details pane: 36-44 percent default, minimum around 320 px
Overlay layer
```

### Responsive Rules

The product is desktop-first but not fixed-width.

1. Wide desktop shows sidebar, work pane, and preview/details pane.
2. Medium desktop collapses the preview before shrinking the editor into a
   cramped layout.
3. Narrow desktop allows icon-collapsed sidebar and one dominant work pane.
4. Toolbars move lower-priority actions into a menu before wrapping badly.
5. Text must not overlap controls.
6. Article directory filters wrap deliberately.
7. Compact layouts should switch density or collapse panes rather than copy
   the squeezed prototype references.

## Screen Inventory

The fixture prototype must represent these screens and states.

1. First launch: start with no site. Include empty recent list, create/open
   actions, and hover/focus states.
2. Recent projects: restore or repair previous sites. Include available
   projects, missing-folder recovery, locate, and remove actions.
3. Project home: show common actions after a project is open. Include recent
   work, drafts, provider status, and empty summaries.
4. Article directory: browse/search/filter articles beyond the sidebar tree.
   Include all/published/drafts filters, search, category/tag filters, empty
   state, no-result state, and article warning markers.
5. Article editor: edit article metadata and source with rendered preview.
   Include clean, dirty, autosaving, saved, invalid, and preview-collapsed
   states.
6. Editor context menu: act on a selection or cursor using the same commands
   as toolbar and hotkeys. Include selection, cursor, and image-markdown
   targets.
7. Media browser: browse images and select media. Include grid/list, selected,
   missing-alt, and empty states.
8. Media detail: edit media metadata and insert into the current article.
   Include selected image, usage list, insert, replace, and reveal actions.
9. Settings: edit site settings through schema-backed forms. Include saved,
   dirty, invalid, and advanced-disclosure states.
10. Publish preview: show the true rendered site before provider mutation.
    Include preparing, ready, warning, blocked, and failed states.
11. Confirm publish: require explicit approval before deploy. Include
    destination, checkpoint, summary, warnings, cancel, and confirm.
12. Publishing progress: show apply state after confirmation. Include
    publishing, non-destructive cancel state, and disabled actions.
13. Publish success: show final public URL and restore path. Include view site,
    restore checkpoint, and done actions.
14. Publish blocked: explain why publish cannot proceed. Include missing
    credential, diagnostics, and connect-provider action.
15. Restore version: choose and restore a checkpoint through a future history
    operation. Include checkpoint list, selected checkpoint, restore, and
    cancel.
16. Tooltip and shortcut examples: prove icon-only controls are
    understandable. Include action label, optional description, and shortcut
    pill.

## Component Hierarchy

Target top-level composition:

```text
StudioApp
  StudioProviders
  StudioShell
    NativeToolbarBridge
    AppToolbar
    WorkspaceLayout
      WorkspaceSidebar
      WorkPane
      PreviewPane
    OverlayLayer
```

### State Ownership

| State                            | Owner                                                |
| -------------------------------- | ---------------------------------------------------- |
| Current screen                   | `StudioApp` reducer/router                           |
| Panel sizes and collapse         | `WorkspaceLayout`, persisted through session fixture |
| Article directory filters/search | directory state, persisted through session fixture   |
| Article tree expansion           | sidebar state, persisted per project                 |
| Selected article/media/settings  | app session state                                    |
| Editor buffer and selection      | editor state linked to draft operation model         |
| Frontmatter draft values         | form state over field descriptors                    |
| Canonical source                 | future Rust/source operation, not UI                 |
| Preview route/status             | preview state machine                                |
| Publish plan/apply               | publish state machine                                |
| Credentials                      | credential reference/status, future secure provider  |
| Toasts, dialogs, context menus   | overlay manager and command registry                 |

### Major Component Families

- `WorkspaceSidebar`: project switcher, primary nav, article tree, utilities.
- `ArticleTreePanel`: article navigation view over an article tree view model.
- `ArticlesDirectoryScreen`: browse/filter/search results in the main pane.
- `ArticleEditorScreen`: metadata descriptors, CodeMirror source editor, and
  editor status.
- `PreviewPane`: true rendered route preview and preview diagnostics.
- `MediaScreen`: media grid/search/detail/insert flow.
- `SettingsScreen`: section nav and descriptor-backed forms.
- `PublishFlowScreen`: preview, confirm, apply, result, recovery.
- `CommandPalette`: command registry rendering and invocation.
- `Feedback` components: validation, blocked action, autosave, checkpoint,
  tooltips, dialogs, toasts.

No major screen should be implemented as one giant component. Extract pure
view-model logic into real modules when tests need it. Do not add test-only
exports.

## Fixture And State Contract

The next prototype should begin with fixture files shaped like future Rust
operation results. The fixture model should include:

- session and exact restore state;
- workspace/provider summaries;
- article tree and article directory;
- article documents with field descriptors;
- Markdown/MDX body source;
- media library and media details;
- settings descriptors;
- preview state;
- publish state;
- credential references;
- diagnostics.

Required fixture states:

1. first launch;
2. recent projects with missing project recovery;
3. project home;
4. populated article directory;
5. filtered/search article directory;
6. empty/no-result article directory;
7. article editor clean;
8. article editor dirty/autosaving/saved;
9. article editor invalid field;
10. editor context menu states;
11. media grid and selected image;
12. media missing alt text;
13. settings saved/dirty/invalid;
14. preview ready/stale/blocked/failed;
15. publish preview/confirm/success;
16. publish blocked by missing Cloudflare connection;
17. publish failed with retry path;
18. restore checkpoint flow.

Canonical source should normally be valid. Temporary working copies may be
invalid while the user edits, but invalid values must remain draft values until
validation accepts them.

## Operation Mapping

Every visible action should map to a future operation family.

| GUI action                | Future operation family                    |
| ------------------------- | ------------------------------------------ |
| Create/open site          | workspace discover/create/read             |
| Restore exact session     | session/app state read                     |
| Browse articles           | source inventory and article directory     |
| Open article              | get editor document                        |
| Edit metadata             | propose patch and validate patch           |
| Save draft/autosave       | write draft and checkpoint                 |
| Restore version           | history list, restore plan, restore apply  |
| Insert image              | media resolve and document patch           |
| Edit media alt/caption    | media metadata patch                       |
| Edit settings             | config patch and validation                |
| Preview route             | preview route/build preview                |
| Publish preview           | publish plan                               |
| Confirm publish           | publish apply                              |
| Cloudflare connect/status | provider capability and credential status  |
| Show blocked action       | diagnostics and capability action behavior |

The UI may simulate these actions in fixtures, but it should keep operation
names, state transitions, and diagnostics aligned with the future Rust core.

## Command Model

Toolbar buttons, hotkeys, context menus, command palette entries, and native
menu items should dispatch the same command model.

Examples:

- `article.open`
- `article.create`
- `article.saveDraft`
- `article.restoreVersion`
- `format.bold`
- `format.italic`
- `insert.link`
- `insert.image`
- `insert.heading`
- `insert.footnote`
- `preview.open`
- `preview.togglePane`
- `publish.prepare`
- `publish.confirm`
- `settings.open`
- `media.open`
- `media.insertSelected`

Command records should include:

- stable ID;
- user-facing label;
- optional shortcut;
- current availability;
- disabled/blocked reason;
- safety class where applicable;
- telemetry/audit hint where applicable;
- handler that dispatches a state transition or future operation request.

Do not scatter direct string edits or source mutations through UI event
handlers.

## Validation And Error Contract

Errors should appear where the user can fix them.

### Field Validation

- show invalid state on the exact field;
- associate error text with the field for screen readers;
- keep invalid draft value local;
- reject invalid canonical source;
- explain the repair in author language;
- keep generated-output effects in the typed descriptor model, but hide them by
  default in author forms. Show them only in explicit advanced/debug surfaces or
  consequential review flows where output consequences change the user's
  decision.

### Action Blocking

Blocked actions should show one of:

1. disabled control with tooltip or inline reason;
2. local warning banner;
3. blocked action dialog when the action is broad or consequential;
4. repair action such as "Go to title" or "Connect Cloudflare".

Publish must never go directly from button to provider mutation. It must follow
preview, plan, confirm, apply.

### Recoverable Failure

If the app can safely recover without user judgment, it should do so quietly.
If recovery requires judgment, show the user a choice with clear consequence
text. If recovery is not automatic, show source, route, or provider context and
next steps.

## Accessibility Requirements

The MVP must be designed and tested as a keyboard-first desktop tool.

Required coverage:

- semantic landmarks for shell regions;
- labelled icon-only buttons;
- tooltips that are supplemental, not the only required label;
- keyboard access for sidebar, article tree, directory, editor commands,
  dialogs, context menus, settings, media browser, and publish flow;
- focus trapping in dialogs and focus return after close;
- `aria-invalid`, descriptions, and error associations for forms;
- status announcements for autosave, preview, and publish changes;
- non-color state indicators;
- reduced-motion support;
- long title, long filename, long diagnostic, and high text zoom resilience.

## Testing Strategy For The Prototype

The fixture-backed implementation milestone should add tests at the seams where
bugs would otherwise be easy to introduce.

### Unit And Contract Tests

Cover:

- state reducers;
- command availability;
- article directory filtering;
- field descriptor rendering rules;
- editor command transformations;
- preview state transitions;
- publish state transitions;
- fixture schema validation;
- operation-envelope projection rules.

### Component Tests

Cover:

- form labels and validation messages;
- sidebar/tree keyboard behavior;
- dialog focus behavior;
- context menu keyboard behavior;
- tooltip labels and shortcut display;
- disabled/blocked states;
- long content wrapping.

### Playwright And Visual QA

Capture fixture-backed screenshots for:

- first launch;
- recent projects missing-folder recovery;
- project home;
- article directory default and compact;
- article editor default;
- article editor invalid;
- article editor preview collapsed;
- media browser/detail;
- settings;
- publish preview;
- confirm publish modal;
- publishing progress;
- publish blocked;
- publish success.

Use screenshot tests and manual visual review to verify that panes collapse
instead of squeezing, controls do not overlap, and reference visual intent is
preserved.

### Parity And Safety Tests

Where operation data exists, prove the GUI consumes shared operation fixtures
instead of creating local source/provider/diagnostic models. Where only GUI MVP
fixtures exist, keep them shaped for future Rust validation and document that
they are temporary design fixtures.

## Definition Of Done For The Next Prototype

The fixture-backed GUI prototype is complete when:

1. the app is navigable through all MVP screens;
2. all required fixture states render;
3. the visual language matches the Studio reference direction;
4. sidebars and preview/details panes are collapsible and responsive;
5. the article directory/browser is implemented as a real screen;
6. article metadata, editor, preview, settings, media, and publish flows are
   visually coherent;
7. toolbar, hotkeys, command palette, and context menu share command records
   where practical;
8. invalid states are represented as draft or blocked states, not canonical
   source;
9. publish uses preview, plan, confirm, and apply states;
10. accessibility, keyboard, tooltip, responsive, and screenshot checks cover
    the high-risk states;
11. no real source writes, credentials, or provider mutations are introduced;
12. docs and Linear issues reflect any implementation-scope refinements.

## Implementation Risks

| Risk                                         | Required mitigation                                                              |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| Prototype creates a frontend-only CMS model  | Keep fixtures operation-shaped and source references explicit                    |
| Components become large and hard to test     | Build from screen, block, component, primitive layers with typed props           |
| Editor commands become string hacks          | Centralize commands and test pure transformations                                |
| Reference mockup code is ported directly     | Rebuild using Astro/React/shadcn/Radix/CodeMirror/Tauri architecture             |
| Responsive behavior copies squeezed mockups  | Implement explicit collapse thresholds and compact density states                |
| Publish flow appears production-backed       | Label fixture behavior and keep real provider mutation out of scope              |
| Accessibility is added after layout is fixed | Design keyboard, focus, labels, and invalid states with each component family    |
| Figma mockups drift from implementation      | Map Figma components to Studio component families and preserve written contracts |

## Engineering Handoff

Start implementation from the fixtures and component shell, not from provider
calls.

Recommended first implementation sequence:

1. dependency and shadcn/Radix setup;
2. Studio React mount inside the existing Astro shell;
3. token/style foundation;
4. fixture schema and fixture files;
5. app shell, toolbar, sidebar, and resizable layout;
6. project home and article directory;
7. article editor, metadata form, CodeMirror panel, and preview pane;
8. media browser/detail;
9. settings forms;
10. publish preview/confirm/progress/result flow;
11. accessibility, keyboard, tooltip, context menu, responsive, and visual QA;
12. documentation and Linear handoff updates.

The detailed issue breakdown and blockers are owned by
[STUDIO_GUI_MVP_IMPLEMENTATION_HANDOFF.md](./STUDIO_GUI_MVP_IMPLEMENTATION_HANDOFF.md).
