# Studio GUI MVP Editor Recovery Design

This document defines the `IRK-298` article editor recovery pass. The editor
must stop feeling like a metadata form above a code card and instead feel like a
compact writing workspace with supporting metadata nearby.

The goal is a great user experience and great engineering: the interface should
make writing feel primary, and the implementation should make incorrect editor
state difficult to represent.

## Design Intent

The article editor has three layers:

1. **Title and body:** the primary writing surface.
2. **Properties:** secondary metadata that supports publication, search,
   routing, social previews, and media.
3. **Live preview:** an editor-scoped preview pane owned by the right preview
   pane, not by the global toolbar.

The title belongs in the page heading, not inside Properties. Properties is a
collapsible card because it is useful but not the center of the work. The source
editor should look like part of the page, not a card inside a card.

## Required UI Shape

### Inline Title

- The visible article heading is the editable title.
- A subtle icon button opens edit mode.
- Edit mode uses a large title input in the heading position.
- `Enter` commits a valid title.
- `Escape` cancels editing and restores the previous baseline title.
- Empty titles are invalid, show local feedback directly under the title, and
  block save/preview/publish through the existing article-title diagnostic.
- Title edits are fixture-local source-write commands; they do not mutate files.

### Properties

- The metadata panel is named `Properties`, never `Identity`.
- It is collapsible through a command-backed toggle.
- It contains frontmatter fields except title.
- It remains card-like because it is a supporting control surface.
- Collapsed state should keep a compact row with a clear expand affordance.

### Source Editor

- The source editor is full width inside the work surface.
- It has no outer panel/card border.
- It has no line numbers by default.
- It has no internal content padding; the writing surface aligns with the page
  rhythm.
- The toolbar is compact and directly attached to the source surface.
- The context menu, hotkeys, and toolbar continue to dispatch shared commands.

### Preview

- The global toolbar `Preview` button remains whole-site preview.
- Article live preview controls exist only inside the preview pane/editor flow.
- If the live preview pane is hidden, the editor can show a compact local
  recovery affordance, but not a duplicate global preview button.

## State Model

Inline title editing is reducer-owned state:

```ts
type StudioEditorTitleState = {
  readonly baseline: string;
  readonly draft: string;
  readonly mode: "editing" | "viewing";
  readonly status: "valid" | "invalid";
  readonly diagnosticCode?: "STUDIO-ARTICLE-TITLE-REQUIRED";
};
```

Properties collapse uses the existing `PanelStateFixture` shape:

```ts
editorProperties: {
  visibility: "hidden" | "visible";
}
```

Commands own all cross-surface transitions:

- `editor.title.beginEdit`
- `editor.title.update`
- `editor.title.commit`
- `editor.title.cancel`
- `editor.properties.toggle`

Invalid title draft state should set the active article to `invalid` and the
preview scenario to `preview-blocked`. Valid local title edits should mark the
article dirty and the preview stale. Cancel should restore a valid title state.

## Component Split

- `ArticleEditorScreen` composes the editor surface.
- `EditableArticleTitle` owns heading/input presentation only.
- `ArticlePropertiesPanel` owns Properties disclosure and descriptor form.
- `MarkdownEditorPanel` owns source toolbar, CodeMirror, and context menu.
- Reducer/state helpers own title validity and properties visibility.

The components should not parse frontmatter, mutate source files, or duplicate
command behavior.

## Tests

Unit tests must cover:

- title edit, update, invalid update, commit, and cancel transitions;
- invalid title blocking save/preview/publish;
- Properties collapse/expand state;
- article open restoring default editor title/properties state;
- command registry and interaction matrix synchronization.

Playwright tests must cover:

- title is edited from the heading, not from Properties;
- empty title shows local feedback and disables/blocks affected actions;
- Properties collapses and expands;
- the source editor has no line-number gutter;
- the source editor is visually flat enough to be part of the page, not a card;
- live preview toggle is only in the preview pane.

Manual visual QA must inspect the clean editor, invalid editor, collapsed
Properties state, and preview-hidden writing state before handoff.
