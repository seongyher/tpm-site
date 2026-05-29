# Studio GUI MVP Component Architecture

This document completes the component architecture design pass for Linear
`IRK-235` and its child issues `IRK-256` through `IRK-260`.

The goal is to make the fixture-backed Studio GUI implementation modular from
the first commit. Components should be small, typed, and composable. Domain
state should live in fixture/operation-shaped models, not be discovered inside
view components.

## Target Component Model

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

The top-level React app should be mounted from the Astro Studio shell. Astro
owns static packaging and initial page layout. React owns interactive Studio
state and composition. Rust/Tauri operations own source and provider truth.

Use `docs/studio/gui-mvp/STUDIO_GUI_MVP_VISUAL_REFERENCES.md` as the component composition
anchor. The generated reference images show the intended shell, sidebar,
editor/preview split, settings form, media detail pane, publish modal, and
error-state composition. The improved Studio mockup screenshots add the
strongest current reference for the article directory/browser, toolbar density,
calm sidebars, editor/preview proportions, and publish progress. Component
behavior and ownership still come from this architecture document when a
mockup is ambiguous.

## Directory Shape

Proposed `apps/studio/src` shape for the next implementation milestone:

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

`components/ui` contains shadcn/Radix wrappers and local design primitives.
Domain components live outside `ui`.

## App Shell

### `StudioApp`

Owns:

- root providers;
- fixture data loading;
- global app state reducer;
- route/screen selection;
- keyboard command registration.

Must not own:

- source parsing;
- provider mechanics;
- filesystem access;
- publishing rules;
- validation policy outside fixture/state transitions.

### `StudioShell`

Composes the visible app:

- toolbar;
- sidebar;
- main pane;
- preview pane;
- overlay layer.

Props:

- `session`;
- `workspace`;
- `activeScreen`;
- `layoutState`;
- `commandRegistry`;

### `WorkspaceLayout`

Uses shadcn Resizable for:

- left sidebar;
- main work pane;
- right preview pane.

Responsibilities:

- panel min/max sizes;
- collapsed state;
- resize persistence hooks;
- reduced-motion behavior;
- keyboard-accessible collapse controls.

Must not own screen content.

## Navigation Components

### `WorkspaceSidebar`

Composes:

- `ProjectSwitcher`
- `SidebarPrimaryNav`
- `ArticleTreePanel`
- `SidebarUtilityNav`

States:

- expanded;
- icon-collapsed;
- hidden on compact windows;
- unavailable project;
- search active.

### `ArticleTreePanel`

Owns article navigation display, not article source.

Sub-components:

- `ArticleTreeToolbar`
- `ArticleTreeSearch`
- `ArticleTree`
- `ArticleTreeNode`
- `ArticleTreeStatusBadge`
- `ArticleTreeContextMenu`
- `ArticleRenameInlineForm`

Data:

- `ArticleTreeViewModel`;
- selected article ID;
- expanded node IDs;
- status markers.

Actions:

- open article;
- rename;
- duplicate;
- move;
- convert to draft;
- reveal;
- delete;

All actions dispatch commands. Components do not mutate source.

### `CommandPalette`

Uses shadcn Command.

Consumes:

- `CommandRegistry`;
- current app state;
- disabled reasons.

The command registry is platform-owned. The UI only renders and invokes
available commands.

## Article Directory Components

### `ArticlesDirectoryScreen`

Screen composition:

- `ArticlesDirectoryHeader`
- `ArticleDirectoryFilters`
- `ArticleDirectorySearch`
- `ArticleDirectoryResults`
- `ArticleDirectoryEmptyState`

Purpose:

- browse and choose articles outside the compact sidebar tree;
- scan status, metadata, and excerpts;
- create a new article;
- recover from empty/no-result states.

Props:

- `ArticleDirectoryViewModel`;
- active filters/search query;
- command callbacks.

Must not own:

- Markdown parsing;
- source indexing;
- category policy;
- article status derivation;
- source writes.

### `ArticleDirectoryFilters`

Composes:

- status segmented control;
- category/tag chips;
- search input;
- optional view-mode toggle if both card and list modes are implemented.

Filter state should be explicit and serializable so exact session restore can
restore the user's browse context.

### `ArticleCard` / `ArticleResultRow`

The improved mockup uses article cards with thumbnails/snippets. Cards are
acceptable here because they are repeated content items, but the final product
may choose a denser list mode for large publications. Both forms should render
from the same view model.

Data:

- article ID;
- title;
- status;
- category/tags;
- date;
- read time/word count;
- author;
- excerpt;
- warning/diagnostic summary;
- optional thumbnail/featured image summary.

Actions:

- open editor;
- context menu;
- quick publishability details where available.

The excerpt should be precomputed in the model or fixture. Do not strip
Markdown in the view component.

## Editor Components

### `ArticleEditorScreen`

Screen composition:

- `ArticleEditorToolbar`
- `ArticleMetadataForm`
- `MarkdownEditorPanel`
- `EditorStatusStrip`
- optional `RestoreVersionPanel`

Props:

- `ArticleDocumentViewModel`;
- `EditorSessionState`;
- `PreviewState`;
- command callbacks.

Must not parse raw frontmatter in the component. It receives descriptors and
values.

### `ArticleMetadataForm`

Composes schema-backed form sections:

- `FormSection`
- `FieldRenderer`
- `ValidationMessage`
- `AdvancedFieldDisclosure`

Field renderer variants:

- text;
- textarea;
- date;
- select;
- multi-select/tags;
- toggle;
- image reference;
- author reference;
- category reference;
- URL;
- slug/source path, advanced only.

Invalid inputs:

- show local visual state;
- keep draft value local;
- do not write invalid canonical source;
- surface generated-output effects where useful.

### `MarkdownEditorPanel`

Wraps CodeMirror.

Sub-components:

- `MarkdownEditorToolbar`
- `CodeMirrorEditor`
- `EditorContextMenu`
- `EditorDiagnosticsGutter`
- `EditorCommandHint`

Owned state:

- editor selection;
- cursor location;
- scroll position;
- local transaction state;
- temporary invalid source buffer.

Not owned:

- canonical source write;
- schema validation;
- media materialization;
- publish readiness.

Editor commands must use a centralized `EditorCommand` model so toolbar,
hotkeys, context menus, and command palette invoke the same behavior.

## Preview Components

### `PreviewPane`

States:

- hidden;
- collapsed;
- loading;
- ready;
- stale;
- blocked;
- failed;
- full-screen publish preview.

Sub-components:

- `PreviewToolbar`
- `RoutePreviewFrame`
- `PreviewStateBanner`
- `PreviewDiagnosticsList`
- `PreviewOpenExternalButton`

Preview renders the true route output where available. It must not be a second
Markdown renderer.

## Media Components

### `MediaScreen`

Composes:

- `MediaToolbar`
- `MediaSearch`
- `MediaGrid`
- `MediaDetailPane`
- `MediaInsertButton`

### `MediaGrid`

Uses:

- stable thumbnail sizing;
- virtualized list only if fixtures prove a large-library need;
- accessible selection.

### `MediaDetailPane`

Fields:

- image preview;
- title/filename;
- alt text;
- caption;
- dimensions/size;
- usage;
- provider/source status.

Actions:

- insert at cursor;
- replace;
- reveal;
- copy reference.

## Settings Components

### `SettingsScreen`

Composes:

- `SettingsNav`
- `SettingsSection`
- `SettingsForm`
- `SettingsSaveBar`

Sections:

- Site identity
- Domain
- Navigation
- Social and support
- Authors
- Categories and tags
- Homepage
- Theme basics
- Publishing

Settings forms use the same `FieldRenderer` infrastructure as article
metadata.

## Publish Components

### `PublishFlowScreen`

State-driven screen for:

- preparing preview;
- preview ready;
- confirm modal;
- publishing;
- success;
- recoverable failure;
- blocked.

Sub-components:

- `PublishPreviewShell`
- `PublishPlanSummary`
- `PublishWarningList`
- `PublishConfirmDialog`
- `PublishProgress`
- `PublishResultPanel`
- `PublishRecoveryActions`

Publishing is always plan then apply. The UI cannot call a provider directly.

## Feedback Components

Use shadcn/Radix primitives for:

- `Tooltip`
- `Dialog`
- `AlertDialog`
- `ContextMenu`
- `DropdownMenu`
- `Toast`
- `Badge`
- `Skeleton`
- `Progress`

Studio domain wrappers:

- `ActionAvailabilityHint`
- `ValidationMessage`
- `BlockedActionDialog`
- `RecoveryActionList`
- `AutosaveIndicator`
- `CheckpointBadge`

## State Ownership

| State                            | Owner                                                       |
| -------------------------------- | ----------------------------------------------------------- |
| Current screen                   | `StudioApp` reducer/router                                  |
| Panel sizes/collapse             | `WorkspaceLayout`, persisted through session model          |
| Article directory filters/search | directory state, persisted through session model            |
| Article tree expansion           | sidebar state, persisted per project                        |
| Selected article                 | app session state                                           |
| Editor buffer                    | editor state, linked to draft operation model               |
| Frontmatter draft values         | form state, validated by descriptors                        |
| Canonical source                 | future Rust/source operation, not UI                        |
| Preview route/status             | preview state machine                                       |
| Publish plan/apply               | publish state machine                                       |
| Credentials                      | credential reference/status fixture, future secure provider |
| Toasts/modals                    | overlay manager                                             |

## Accessibility Responsibilities

Every component family must own its accessibility contract:

- App shell: landmarks, skip targets, window title.
- Sidebar/tree: keyboard selection, aria labels, expanded state.
- Toolbar: icon labels, shortcut tooltips.
- Forms: labels, descriptions, invalid state, error association.
- Editor: keyboard shortcuts, context menu access, focus restoration.
- Preview: title, loading/blocked status announcements.
- Dialogs: title, description, focus trap, escape/cancel behavior.
- Toasts: non-blocking announcements only.
- Publish: confirmation copy and safe focus return.

## Responsive And Minimum Size Rules

Desktop-first does not mean fixed-width only.

Required behavior:

- At wide widths, show sidebar, editor, and preview.
- At medium widths, allow preview collapse.
- At narrow desktop widths, keep sidebar collapsible and preview hidden behind
  a tab/action.
- At minimum size, one primary work pane remains usable.
- Text never overlaps controls.
- Toolbar buttons collapse into icon buttons with tooltips before wrapping into
  broken rows.
- Do not copy the improved or rough mockup's compact-width squeezing.
  Implement explicit panel collapse thresholds, directory density changes, and
  stateful layout persistence instead.

## Test Seams

Good tests should target:

- pure state reducers;
- command availability;
- article-directory filtering and result view models;
- field descriptor rendering;
- editor command transformations;
- preview state transitions;
- publish state transitions;
- component accessibility roles;
- keyboard navigation for shell/sidebar/tree/dialogs;
- visual fixture states through Playwright screenshots.

Do not add test-only exports. Move pure logic into real modules when a test
needs it.

## Acceptance Criteria

The component architecture is ready when:

1. no major screen is a single giant component;
2. every major component has a clear owner and non-owner list;
3. off-the-shelf primitives are identified;
4. Studio-specific domain components are identified;
5. state ownership is explicit;
6. accessibility and responsive behavior are component responsibilities;
7. fixture data requirements are clear enough for the next implementation
   milestone.
