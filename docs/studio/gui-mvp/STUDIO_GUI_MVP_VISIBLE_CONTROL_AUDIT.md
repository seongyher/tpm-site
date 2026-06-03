# Studio GUI MVP Visible Control Audit

This document is the IRK-301 control inventory for the fixture-backed Studio
GUI. It records what each visible interaction is supposed to do, which command
or local state owns it, and how unfinished product capabilities are represented
without silent no-ops.

The goal is a GUI that can be explored like a coherent product. Fixture-backed
does not mean inert: every visible control must either produce a visible
fixture state, update meaningful local form/editor state, or be visibly
disabled with an author-readable reason.

## Global Invariants

1. Shared commands own cross-surface transitions. Toolbars, menus, hotkeys,
   context menus, and command palette entries must dispatch a
   `StudioCommandId`.
2. Local controls own only local, visible draft state: field values, media alt
   text/captions, search inputs, and editor text buffers.
3. Visible copy follows minimum sufficient detail. Assume competent users; do
   not add headings, helper text, or action descriptions that merely restate
   navigation, placement, labels, icons, or obvious actions.
4. Future controls stay disabled with a specific reason. They must not look
   active if no visible fixture state exists.
5. Hidden panes are absent from the layout. Collapsed rails are not allowed.
6. One sidebar item is selected at a time, derived from canonical app
   location.
7. Disabled and blocked commands preserve state and expose an actionable
   reason through command availability or a disabled title/tooltip.
8. Compact menus and context menus keep visible pixels for actions. They may
   have accessible names and trigger tooltips, but they must not show redundant
   headings such as "Article actions", "Cursor actions", or "Publish options"
   unless the heading communicates a non-obvious mode or risk boundary.
   Treat this as a hard acceptance criterion: any compact menu that visibly
   names itself before presenting actions fails the audit.
9. Compact command rows do not show helper descriptions for self-explanatory
   actions. Keep labels, shortcuts, state, and disabled reasons; move any
   genuinely useful explanation to a tooltip, detail pane, or confirmation
   flow.

## Shell And Toolbar

| Visible control   | Owner                    | Intended result                                                             |
| ----------------- | ------------------------ | --------------------------------------------------------------------------- |
| Back / Forward    | Disabled fixture control | Visible but disabled until navigation history is modeled.                   |
| Toggle side panel | `pane.toggleSidebar`     | Removes or restores the sidebar region; no sliver or rail remains.          |
| Command search    | `commandPalette.open`    | Opens command palette with focus in the search input.                       |
| Create site       | `project.createSite`     | Opens project home from startup states.                                     |
| Save draft        | `article.saveDraft`      | Marks the active valid article as saved; blocked for invalid article state. |
| Preview           | `preview.open`           | Opens whole-site preview flow; article live preview toggle is not global.   |
| Publish           | `publish.prepare`        | Opens publish preview and plan; invalid article state blocks it.            |
| Publish options   | Command dropdown         | Shows publish/preview command rows with shared availability reasons.        |

## Sidebar

| Visible control                    | Owner                                                                       | Intended result                                                                                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Workspace label                    | Static fixture label                                                        | Shows current workspace without a dropdown affordance until multi-workspace switching is modeled.                                                                  |
| Home / Articles / Media / Settings | `project.openHome`, `article.directory.open`, `media.open`, `settings.open` | Opens the corresponding product screen and updates single sidebar selection.                                                                                       |
| New article                        | `article.create`                                                            | Opens the fixture draft article in the editor.                                                                                                                     |
| Article folder row                 | `articleTree.toggleFolder`                                                  | Collapses or expands the folder; child article rows are removed/restored.                                                                                          |
| Article row                        | `article.open` with `articleId`                                             | Opens that article on the first click.                                                                                                                             |
| Article row actions                | `ArticleActionMenu`                                                         | Opens a real menu; Open editor dispatches `article.open`; Restore version is enabled only for the selected article; source file actions are disabled with reasons. |
| Trash                              | Disabled fixture control                                                    | Disabled until deleted-item history exists.                                                                                                                        |
| Startup Recent Projects            | `project.showRecent`                                                        | Opens recent projects.                                                                                                                                             |
| Startup Templates / Learn / Cloud  | Disabled fixture controls                                                   | Visible roadmap affordances only; disabled with reasons until those screens are modeled.                                                                           |

## Article Directory

| Visible control         | Owner                                                       | Intended result                                                                                                                      |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Status segmented filter | `article.directory.setStatusFilter`                         | Updates directory filter and visible results.                                                                                        |
| Search articles         | `article.directory.setSearch`                               | Updates search query and result/empty state.                                                                                         |
| New article             | `article.create`                                            | Opens the fixture draft article.                                                                                                     |
| Category/tag chips      | `article.directory.setCategory`, `article.directory.setTag` | Toggles filter values and visible result set.                                                                                        |
| Reset filters           | `article.directory.resetFilters`                            | Clears search/status/category/tag filters.                                                                                           |
| Open editor             | `article.open` with `articleId`                             | Opens the selected article in editor.                                                                                                |
| Row actions             | `ArticleActionMenu`                                         | Opens a real menu; Open editor works for the row; Restore and source file actions are disabled unless their required context exists. |

## Article Editor

| Visible control        | Owner                                        | Intended result                                                                           |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Edit title             | `editor.title.beginEdit`                     | Replaces title heading with inline edit input.                                            |
| Title input            | `editor.title.update`                        | Updates title draft, local validity, article state, and preview state.                    |
| Apply / Cancel title   | `editor.title.commit`, `editor.title.cancel` | Applies valid title or restores baseline title.                                           |
| Properties disclosure  | `editor.properties.toggle`                   | Shows/hides the secondary frontmatter card.                                               |
| Properties form fields | Local descriptor draft state                 | Updates visible form values; invalid descriptor states show local feedback.               |
| Source editor          | `editor.updateSource`                        | Updates source draft, marks article dirty, and marks preview stale.                       |
| Formatting toolbar     | Source-editor command IDs                    | Applies pure Markdown transforms, updates source draft, and marks preview stale.          |
| Editor context menu    | Source-editor command IDs                    | Uses the same commands as the toolbar for selected text, cursor, and image-context cases. |
| Open preview notice    | `pane.togglePreview`                         | Restores article live preview only inside article editing.                                |

## Preview Pane

| Visible control          | Owner                    | Intended result                                                                  |
| ------------------------ | ------------------------ | -------------------------------------------------------------------------------- |
| Desktop / Mobile preview | `preview.setViewport`    | Switches reducer-owned preview viewport and visibly changes route preview frame. |
| Open preview externally  | Disabled fixture command | Disabled until the desktop shell opener is connected; no invisible success.      |
| Toggle preview           | `pane.togglePreview`     | Hides the article live preview region entirely.                                  |
| More preview actions     | Disabled fixture control | Disabled until preview extensions exist.                                         |
| Refresh / Retry preview  | `preview.open`           | Returns stale/loading/failed preview fixture states to ready where allowed.      |

## Media

| Visible control                              | Owner                            | Intended result                                                                                    |
| -------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| Add                                          | Disabled fixture control         | Disabled until writable media source operations exist.                                             |
| Search media                                 | `media.setSearch`                | Updates media query and visible grid/list.                                                         |
| Grid / List view                             | `media.setViewMode`              | Switches media browser layout.                                                                     |
| Media card/list row                          | `media.open` with `mediaId`      | Selects that media item and updates detail pane.                                                   |
| Alt text / caption fields                    | Local media metadata draft state | Updates visible metadata draft and missing-alt status.                                             |
| Insert into article                          | `media.insertSelected`           | Inserts Markdown image and returns to article editor; disabled without active article or alt text. |
| Replace / Reveal / Copy / More media actions | Disabled fixture controls        | Disabled with reasons until writable/local media operations or extensions exist.                   |

## Settings

| Visible control       | Owner                                    | Intended result                                                       |
| --------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| Settings section rows | `settings.open` with `settingsSectionId` | Opens the selected section and keeps the nav column intrinsic-height. |
| Settings form fields  | Local descriptor draft state             | Updates visible draft values and dirty/invalid local notices.         |
| Advanced options      | Native `<details>`                       | Reveals future advanced settings copy without requiring app state.    |

## Publish

| Visible control       | Owner                                                | Intended result                                                   |
| --------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| Cancel                | `publish.cancel`                                     | Exits publish flow to editor or project home.                     |
| Confirm publish       | `publish.openConfirm`                                | Opens confirmation dialog only after publish preview is prepared. |
| Dialog close / Cancel | `publish.closeConfirm`                               | Returns to publish preview without applying.                      |
| Dialog Publish        | `publish.confirm`                                    | Advances to publish progress fixture state.                       |
| Complete publish      | `publish.finish`                                     | Advances to publish success fixture state.                        |
| Done                  | `publish.done`                                       | Leaves publish success state.                                     |
| Retry publish         | `publish.retry`                                      | Returns failed publish to progress fixture state.                 |
| Review preview        | `publish.prepare`                                    | Rebuilds/reopens publish preview from failure state.              |
| Connect Cloudflare    | `settings.open` with publishing section              | Opens publishing settings repair surface.                         |
| View site             | External link                                        | Uses the redacted fixture published URL; not a provider mutation. |
| Restore checkpoint    | `article.restoreVersion` when article context exists | Opens checkpoint restore for the active article.                  |

## Restore And Recent Project Recovery

| Visible control                 | Owner                                     | Intended result                                              |
| ------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| Recent Open                     | `project.openSite` with `recentProjectId` | Opens available project home or missing-project recovery.    |
| Recent Locate                   | `recovery.locateProject`                  | Restores known fixture project home.                         |
| Recent Remove                   | `recovery.removeRecent`                   | Dismisses the missing recent project from the visible list.  |
| Checkpoint row                  | `restore.selectCheckpoint`                | Changes selected checkpoint fixture state.                   |
| Review restore                  | `restore.confirm`                         | Opens restore confirmation state.                            |
| Restore                         | `restore.confirm` from confirm state      | Marks selected checkpoint restored.                          |
| Restore Cancel / Back to editor | `restore.cancel`                          | Returns to selected checkpoint or exits restore flow safely. |

## Accepted Future-Control Pattern

The MVP may show a small number of future controls when they are important to
the final product language: file actions, external preview, templates, cloud
account navigation, trash, and extension menus. They are acceptable only when
disabled with a precise reason. If a future control starts to dominate space or
create visual clutter, remove it from the fixture surface until a real state is
modeled.
