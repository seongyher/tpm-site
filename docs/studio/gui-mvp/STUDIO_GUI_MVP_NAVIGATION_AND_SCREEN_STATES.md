# Studio GUI MVP Navigation And Screen-State Inventory

This document completes the navigation and screen-state design pass for Linear
`IRK-233` and its child issues `IRK-246` through `IRK-250`.

The goal is to specify what appears when, how users move through the app, and
which states the fixture-backed prototype must represent.

Use `docs/studio/gui-mvp/STUDIO_GUI_MVP_VISUAL_REFERENCES.md` as the visual reference for the
screen layouts named here. The improved Studio mockup screenshots are useful
for desktop composition, product feel, and the article directory/browser
concept. The rough Studio mockup screenshots remain useful supplemental
references. The mockups are not authoritative for responsive behavior. The
written state inventory and collapse rules remain authoritative for states
that are not represented, or are only roughly shown, in the images.

## Navigation Model

The Studio has four persistent navigation ideas:

1. **Window/session navigation:** restore exact state, back, forward, recent
   projects.
2. **Workspace navigation:** project home, article tree, media, settings,
   preview, publish.
3. **Document navigation:** selected article, frontmatter fields, editor
   cursor, preview route, checkpoints.
4. **Command navigation:** command palette, hotkeys, context menus, native
   app menu.

The user should not need to understand the file system to navigate, but the UI
may expose file actions where helpful.

## App Regions

```text
AppWindow
  NativeToolbar
  StudioToolbar
  LeftSidebar
  MainWorkPane
  RightPreviewPane
  OverlayLayer
```

### NativeToolbar

Owned by Tauri/native shell where practical.

Expected actions:

- New site
- Open site
- Save draft
- Preview
- Publish
- Back
- Forward
- Toggle sidebar
- Toggle preview
- Command palette

### StudioToolbar

Rendered inside the app for context-specific actions. It should stay compact
and defer to native menus where OS conventions matter.

### LeftSidebar

Primary navigation and content tree:

- project identity/current project;
- primary tabs: Articles, Media, Settings;
- article hierarchy;
- quick-open/search;
- contextual row actions;
- bottom utility settings/account area.

### MainWorkPane

Current primary work:

- welcome/recent projects;
- project home;
- article editor;
- settings forms;
- media browser;
- publish preview flow.

### RightPreviewPane

Rendered route preview, media detail, diagnostics detail, or publish preview.
It is collapsible and resizable.

Responsive rule: collapse secondary panes before allowing the editor, preview,
toolbar, or article tree to become cramped. Playwright inspection of the rough
mockup at compact widths showed why this matters: visually preserving every
desktop region can truncate important content and make panes feel squeezed.

## Startup Flows

### First Launch

State:

- no project selected;
- main panel shows welcome;
- actions: Create site, Open site, Learn basics;
- recent projects area is empty or hidden.

Copy:

- "Create a site or open an existing one."
- "You can publish later after connecting Cloudflare."

### Returning User With Restorable State

The app restores:

- project;
- screen;
- selected article/settings/media item;
- panel sizes;
- collapsed panels;
- preview route;
- dirty/saved state;
- editor cursor and scroll where practical;
- window geometry where supported.

The UI should not flash the welcome screen first if exact restore is available.

### Returning User With Missing Project

State:

- recent project exists but source is unavailable;
- show recent projects list and an inline problem row;
- actions: Locate project, Remove from recent, Create new site.

Copy:

- "We could not find this site folder. Locate it to continue."

## Project Home

Project home appears after opening a project without a selected document, or
when clicking the project root.

Primary actions:

- New article
- Open article
- Media
- Settings
- Preview site
- Publish

Secondary information:

- recently edited articles;
- drafts;
- last published status when fixture data exists;
- provider connection state only when relevant.

Do not show a global health dashboard. If the project has blocking issues,
show a small local notification with "Review issues" and a count.

## Articles Directory

The Articles primary nav item should open a main-pane directory/browser when
the user is not already editing a specific article. The improved Studio mockup
is a strong reference for this surface.

Purpose:

- let users scan more content than the sidebar can comfortably expose;
- help users find drafts, published pieces, categories, and stale/problem
  articles;
- provide a friendly route into the editor without exposing the filesystem.

Controls:

- status segmented control: All, Published, Drafts;
- search by title, body excerpt, category, tag, and author where indexed;
- category/tag filters;
- create article action;
- optional view toggle later if card and list modes both prove useful.

Article result content:

- title;
- status badge;
- category/tag signal;
- date;
- read time or word count where available;
- author;
- excerpt/snippet derived by the model, not parsed inside the view component;
- warning marker if an article has a local issue;
- primary Open Editor action.

States:

- populated;
- no articles yet;
- no filter/search results;
- loading/indexing;
- invalid/problem article marker;
- selected/hover/focused card or row;
- compact layout where filters wrap cleanly and cards/list rows remain
  readable.

The directory complements the sidebar tree. The sidebar remains the persistent
quick-navigation context, while the directory is the richer browse/manage
screen.

## Sidebar And Article Tree

Tree behavior:

- folders/categories are expandable;
- articles are selectable;
- selected row uses a subtle filled pill;
- dirty/draft/invalid indicators are compact;
- long titles truncate with tooltip;
- keyboard supports arrow navigation, enter to open, and context menu key
  where available.

Context menu actions:

- Open
- Rename
- Duplicate
- Move to...
- Convert to draft
- Copy public URL
- Reveal in file browser
- Delete...

States:

- empty articles;
- many articles;
- nested folders;
- selected article;
- dirty article;
- invalid article;
- article with missing media;
- unavailable source;
- context menu open;
- rename in progress.

## Article Editor Flow

### Opening An Article

Layout:

- sidebar remains visible unless collapsed;
- main pane shows metadata form and editor;
- preview pane shows rendered route;
- toolbar shows article actions.

Toolbar actions:

- Save draft
- Preview
- Insert image
- Restore version
- Publish
- More

### Frontmatter Form

The form should show human fields, not raw frontmatter:

- Title
- Subtitle/description
- Author
- Date
- Category
- Tags
- Featured image
- Draft/publish state
- Social/metadata options where MVP-supported

States:

- pristine;
- dirty;
- invalid field;
- advanced field hidden;
- advanced field disclosed;
- saved;
- autosaving;
- autosave failed.

Invalid inputs are rejected locally. The canonical source should not accept
invalid field values.

### Raw Markdown/MDX Editor

The MVP uses a source-faithful editor with preview, not WYSIWYG.

Editor actions:

- Bold
- Italic
- Link
- Heading 1/2/3
- Quote
- Code/code block
- Bulleted list
- Numbered list
- Insert image
- Insert footnote or citation where available
- Clear formatting where safe
- Paste as plain text

Context menu with selection:

- Bold
- Italic
- Link
- Heading
- Quote
- Code
- List
- Insert image

Context menu with no selection:

- Insert image here
- Insert link
- Insert heading
- Insert code block
- Insert footnote
- Paste as plain text
- Open preview at this section where heading mapping is available

Context menu on image Markdown:

- Open image
- Edit alt text
- Replace image
- Reveal in media library

### Preview Pane

Preview states:

- loading;
- ready;
- stale because source changed;
- blocked by invalid metadata;
- blocked by unsupported MDX;
- failed to render;
- route not found;
- collapsed;
- full-screen publish preview.

Preview should start at the selected article route. If no article is selected,
preview starts at the home page.

## Media Flow

Media tab states:

- empty media library;
- thumbnail grid;
- list view;
- search/filter;
- selected media detail;
- full image viewer;
- image missing;
- unsupported image type;
- missing alt text;
- inserted into current article.

Media detail fields:

- preview image;
- filename/title;
- alt text;
- caption;
- dimensions/size where available;
- usage list where fixture data exists;
- actions: Insert, Replace, Reveal, Copy path/reference.

Insert action:

1. User places cursor in editor.
2. User opens Media.
3. User selects image.
4. User clicks Insert.
5. The app inserts Markdown image syntax at the previous cursor.
6. The editor returns focus and the preview becomes stale/loading.

## Settings Flow

Settings are grouped by intent:

- Site identity
- Domain
- Navigation
- Social and support
- Authors
- Categories and tags
- Homepage
- Theme basics
- Publishing

States:

- field pristine;
- field dirty;
- invalid field;
- saved;
- autosaving;
- provider not connected;
- provider connected;
- insufficient permission;
- advanced details disclosed.

The default view should show beginner-safe settings. Advanced settings remain
available but visually secondary.

## Publish Flow

### Publish From Article Editor

1. User clicks Publish.
2. The app validates current article and site settings.
3. The app creates a publish preview.
4. The preview opens at the current article route.
5. User browses preview.
6. User clicks Confirm publish.
7. Modal summarizes destination, warnings, checkpoint, and rollback facts.
8. User confirms.
9. Publish runs.
10. Success shows public URL and checkpoint.

### Publish From Project Home

Same flow, but preview starts at home page.

### Publish Blockers

Blocked states:

- Cloudflare not connected;
- credential expired;
- insufficient publish permission;
- required site setting missing;
- blocking article metadata issue;
- build/preview failed;
- unsupported provider capability;
- publish already in progress.

Blocked action display:

- show concise reason;
- show repair action when available;
- keep technical details behind disclosure.

## Restore Version Flow

Restore version should feel like checkpoints, not Git.

Flow:

1. User opens Restore version.
2. A list of checkpoints appears with time, label, and brief change summary.
3. User selects a checkpoint.
4. The app shows a preview/diff summary where available.
5. User restores or cancels.

MVP fixture can simulate this visually. Real history adapter behavior belongs
to later implementation.

## Command Palette

Command palette opens with `Command+K` or `Ctrl+K`.

It should include:

- open article;
- new article;
- open media;
- open settings;
- preview current page;
- publish;
- save draft;
- restore version;
- toggle sidebar;
- toggle preview.

Commands should respect state. A disabled command needs a short reason.

## Screen-State Coverage Matrix

| Surface           | Required states                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------- |
| Startup           | first launch, exact restore, restore failed, recent projects                                |
| Project home      | empty, populated, dirty project state, provider not connected                               |
| Article directory | populated, empty, no search results, filtered, invalid article marker, selected/hover/focus |
| Sidebar           | collapsed, expanded, selected, context menu, rename, empty, many items                      |
| Article editor    | pristine, dirty, autosaving, saved, invalid field, unsupported body                         |
| Preview           | loading, ready, stale, blocked, failed, collapsed, full-screen                              |
| Media             | empty, grid, selected detail, missing image, invalid alt, insert success                    |
| Settings          | pristine, dirty, invalid, saved, advanced disclosed, provider issue                         |
| Publish           | previewing, confirm modal, publishing, success, recoverable failure, blocked                |
| Restore           | checkpoint list, selected checkpoint, restore success, restore unavailable                  |

## Acceptance Criteria

The navigation and state inventory is ready when:

1. every MVP journey has a named entry point and exit state;
2. empty, loading, dirty, invalid, blocked, success, and failure states are not
   afterthoughts;
3. the publish flow always uses preview and confirm steps;
4. technical failures have author-language local presentations;
5. fixture data can cover every required state without real backend wiring.
