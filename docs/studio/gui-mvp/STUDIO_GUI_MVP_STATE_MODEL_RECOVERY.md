# Studio GUI MVP State Model Recovery

This document records the `IRK-296` design decision for repairing the Studio
fixture GUI state model before broader visual polish.

## Goal

Make the known shell/navigation defects structurally difficult to reintroduce:

1. hidden panes leave no visible rail, resize handle, label, or layout sliver;
2. article live preview is available only in the article editor;
3. whole-site preview is a separate flow from article live preview;
4. only one sidebar item is selected at a time;
5. sidebar folder expansion is real fixture state, not decorative markup;
6. article clicks transition deterministically on the first click.

## Design Decisions

### Pane Vocabulary

Use `visible` and `hidden` for pane visibility in code. The previous
`expanded`/`collapsed` vocabulary made a rail look valid. `hidden` means the
region is not part of the workspace layout.

```ts
type PanelVisibility = "hidden" | "visible";
```

The workspace layout derives a list of rendered regions from the state:

```ts
type StudioWorkspaceRegion = "preview" | "sidebar" | "work";

function studioWorkspaceRegions(state: StudioAppState) {
  return [
    ...(state.sidebar.visibility === "visible" ? ["sidebar" as const] : []),
    "work" as const,
    ...(livePreviewVisible(state) ? ["preview" as const] : []),
  ];
}
```

The render tree follows the region list. It does not render hidden panels with
`sr-only`, `display: none`, or a small collapsed size.

### Article Preview Scope

`pane.togglePreview` is an article-editor command. Outside article editing it
is disabled with a human reason. The global toolbar does not show that command;
the preview pane owns its own toggle.

The global `preview.open` command starts the whole-site preview flow. It should
not toggle the editor preview pane.

### Active Location And Sidebar Selection

Sidebar selection derives from one active location selector. Opening an
article selects the article row only. Opening the article directory selects the
Articles nav item. Opening media, settings, project home, startup, publish, or
restore selects their corresponding nav context.

```ts
type SidebarSelection =
  | { readonly kind: "article"; readonly articleId: string }
  | { readonly kind: "nav"; readonly id: string };
```

Visual components consume the selector rather than independently comparing
screen and article IDs.

### Folder State

Article tree folder collapse/expand is stateful and command-backed. The MVP
does not need persistence beyond fixture session state yet, but it should use
the same reducer path as other visible interactions.

The reducer stores collapsed folder IDs:

```ts
readonly collapsedArticleTreeNodeIds: readonly string[];
```

The `articleTree.toggleFolder` command toggles one folder ID. Unknown IDs are
safe no-ops with a failed command result rather than UI-local mutation.

### Article Switching

Article rows dispatch one command with an explicit `articleId`. The reducer
fully resets editor draft source and editor cursor for the selected article.
The button should occupy the whole row so ordinary clicks do not miss the
actual hit target.

## Verification

Unit tests should prove:

- pane visibility uses only `visible` or `hidden`;
- hidden panes are absent from `studioWorkspaceRegions`;
- preview visibility is false outside article-editor states;
- `pane.togglePreview` is disabled outside article editing;
- opening an article selects only that article row;
- opening the article directory selects only the Articles nav item;
- toggling a folder updates `collapsedArticleTreeNodeIds`;
- opening an article with explicit `articleId` always lands on that article.

Playwright tests should prove:

- clicking Toggle side panel removes the sidebar from the DOM-visible layout;
- no "Sidebar collapsed" or "Preview collapsed" rail appears;
- article preview toggle is absent from the global toolbar;
- preview pane toggle exists in the preview pane when article preview is
  visible;
- opening media/settings/project home removes article live preview;
- only one sidebar selected element exists;
- clicking a sidebar article row opens the article on first click;
- folder rows collapse and expand their children.

## Non-Goals

This recovery slice does not redesign the article editor, directory cards,
settings, media, publish, restore, or overall density. It only fixes the state
and layout foundations those later slices depend on.
