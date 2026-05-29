# Studio GUI MVP Visual References

This document catalogs the Studio GUI reference images that now serve as the
primary visual reference library for the MVP design handoff.

The images are not exact implementation screenshots. They are visual direction
artifacts that show the target product feel, layout density, screen anatomy,
and state presentation. Treat them as the strongest reference for style and
composition, while keeping the written product, component, fixture, and
operation specs authoritative for behavior.

## Reference Priority

1. Use the generated Studio GUI images in this directory as the baseline
   reference for the MVP's screen inventory.
2. Use the improved Studio mockup screenshots as the closest current
   supplemental reference for product feel, toolbar/sidebar density, the richer
   article directory/browser mode, split editor/preview controls, settings
   form structure, and publish modal progression.
3. Use the rough Studio mockup screenshots as an earlier supplemental style
   reference for the calm desktop-tool feel, toolbar density, sidebar
   treatment, editor/preview proportions, and publish modal composition.
4. Use Codex only as a secondary quality reference for restraint, native-app
   polish, motion, tooltips, and low-clutter interaction.
5. Prefer the written specs when an image contradicts product behavior,
   accessibility, operation safety, or implementation boundaries.

## Baseline Generated Asset Inventory

| Reference                   | File                                                                     | Use                                                                     |
| --------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Welcome                     | `docs/studio/gui-mvp/assets/reference/welcome.png`                       | First-launch empty state and centered startup action panel              |
| Recent projects             | `docs/studio/gui-mvp/assets/reference/recent-projects.png`               | Recent-project restore, missing-folder recovery, startup list density   |
| Project home                | `docs/studio/gui-mvp/assets/reference/project-home.png`                  | Open-project home screen, action grid, recent content summaries         |
| Article editor with preview | `docs/studio/gui-mvp/assets/reference/article-editing-split-preview.png` | Default editor and true rendered preview split                          |
| Article editor full width   | `docs/studio/gui-mvp/assets/reference/article-editing-full.png`          | Focused editor mode with preview collapsed                              |
| Article editor error        | `docs/studio/gui-mvp/assets/reference/article-editing-error.png`         | Local validation, disabled publish, preview warning, field-level repair |
| Media browser               | `docs/studio/gui-mvp/assets/reference/media-browser.png`                 | Media grid, detail pane, metadata, usage list, insert action            |
| Settings                    | `docs/studio/gui-mvp/assets/reference/settings.png`                      | Settings subnavigation, schema-like forms, autosaved settings           |
| Publish confirm dialog      | `docs/studio/gui-mvp/assets/reference/publish-confirm-dialog.png`        | Publish preview, modal confirmation, destination, checkpoint, warnings  |

## Improved Studio Mockup Inventory

These screenshots were captured with Playwright from an improved rough Studio
prototype. They are visually closer to the intended app direction than the
earlier rough mockup and are especially useful for the article directory
concept. They are still not authoritative for source code, exact behavior,
copy, icon choice, dependency choices, image URLs, or responsive rules.

| Reference                          | File                                                                                        | Use                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Improved project home              | `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/project-home.png`              | Calm project home with utility action cards, recent work lists, and provider status                              |
| Improved article directory         | `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/article-directory.png`         | Rich article browser with status tabs, search, category filters, card previews, metadata, and open-editor action |
| Improved compact article directory | `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/compact-article-directory.png` | Stress reference showing why compact layouts need deliberate collapse and responsive rules                       |
| Improved article editor            | `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/article-editor.png`            | Source editor with collapsible properties, toolbar, saved status, and resizable rendered preview                 |
| Improved media library             | `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/media-library.png`             | Grid/list media browser, search, add action, selected state, and warning marker                                  |
| Improved settings                  | `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/settings.png`                  | Settings subnavigation, autosave status, beginner-safe form fields, and advanced disclosure                      |
| Improved publish confirmation      | `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/publish-confirmation.png`      | Confirmation modal with destination, checkpoint, summary, warnings, and dimmed context                           |
| Improved sidebar collapsed         | `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/sidebar-collapsed.png`         | Collapsed sidebar/reference shell behavior                                                                       |

Source-read design intentions from the improved prototype:

- global shell combines restore/back-forward navigation, command/search
  affordance, saved state, and primary publish actions;
- sidebar is both collapsible and resizable, with a persistent article tree
  and compact state markers;
- Articles opens a richer directory/browser screen instead of only expanding
  the sidebar tree;
- article editing separates title/properties, Markdown source editing,
  formatting commands, autosave status, and rendered route preview;
- preview pane can be shown/hidden, resized, and switched between desktop and
  mobile-preview modes;
- media uses grid/list browsing, search, selected state, warning markers, and
  future insertion semantics;
- settings use section navigation, autosave feedback, beginner-safe visible
  fields, and advanced disclosure;
- publish has confirm, progress, and complete states with destination,
  checkpoint, summary, warnings, and disabled/careful controls during apply.

## Rough Studio Mockup Inventory

These screenshots came from a rough Studio mockup. They are visually close to
the desired direction and are useful for mood, density, and composition. They
are not authoritative for responsive behavior, implementation details, exact
copy, icon choice, or component mechanics.

| Reference                          | File                                                                                        | Use                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Rough project home                 | `docs/studio/gui-mvp/assets/reference/rough-studio-mockup/project-home.png`                 | Quiet desktop shell, sidebar density, centered project-home work area, restrained action cards       |
| Rough article editor split preview | `docs/studio/gui-mvp/assets/reference/rough-studio-mockup/article-editor-split-preview.png` | Strong editor/preview proportions, compact frontmatter surface, editor toolbar, true-preview feeling |
| Rough article editor focused       | `docs/studio/gui-mvp/assets/reference/rough-studio-mockup/article-editor-focused.png`       | Focused writing composition and preview-collapsed/editor-dominant direction                          |
| Rough settings                     | `docs/studio/gui-mvp/assets/reference/rough-studio-mockup/settings.png`                     | Settings subnavigation, calm form spacing, autosave notice, advanced disclosure                      |
| Rough media library                | `docs/studio/gui-mvp/assets/reference/rough-studio-mockup/media-library.png`                | Large visual media grid, selected image treatment, compact media toolbar                             |
| Rough publish confirmation         | `docs/studio/gui-mvp/assets/reference/rough-studio-mockup/publish-confirmation.png`         | Dimmed publish preview, centered confirm modal, destination/checkpoint/summary/warnings hierarchy    |
| Rough publishing progress          | `docs/studio/gui-mvp/assets/reference/rough-studio-mockup/publishing-progress.png`          | Simple blocking progress modal with destination and status                                           |

## What To Preserve

- Neutral native desktop shell with a quiet top toolbar.
- Left sidebar that stays useful without becoming visually heavy.
- Compact rows, icon-leading labels, and rounded selected states.
- Sparse, meaningful color: blue for primary/selected action, green for saved
  or successful state, red/orange only for blocking or warning state.
- Editor and preview split that clearly separates source editing from rendered
  site output.
- Local validation that appears near the field and at the blocked action.
- Publish flow that previews first, then uses a confirm modal with destination,
  checkpoint, summary, warnings, and final action.
- Article directory/browser as a richer main-pane way to browse, filter, and
  scan articles. It should complement the sidebar tree rather than replace it.
  Preserve status tabs, search, category filters, metadata, snippets, and clear
  "open editor" action, while letting the final design choose card/list density.
- Media browser with useful thumbnails, metadata, usage context, and an
  obvious insert path.
- Settings as calm visual forms with local save state and advanced options
  behind disclosure.
- Work screens that feel like a real desktop tool: top toolbar, side
  navigation, one dominant work area, optional secondary pane, and restrained
  local feedback.

## Refinements To Keep In Mind

- Toolbar labels must stay context-aware. `Save draft` fits article editing,
  but settings and media should use autosave status or context-specific labels.
- Project home action cards should remain useful and scannable, but should not
  drift into a colorful SaaS dashboard. Keep colored icon tiles subtle.
- Welcome can use a centered panel because it is an onboarding/empty state.
  Normal work surfaces should feel like a tool, not a landing page.
- Generated content names, images, and copy are placeholders. Preserve the
  product pattern, not the exact publication.
- If the final app needs a smaller width than these 1586 px reference frames,
  preserve hierarchy by collapsing panels before shrinking controls into
  crowded rows.
- The rough mockup is not a responsive design. Playwright inspection at compact
  widths showed squeezing rather than deliberate layout adaptation, so the
  written collapse rules remain authoritative.
- Do not copy generated prototype artifacts from any mockup, including AI
  Studio boilerplate, CDN setup, remote image URLs, generated source comments,
  Material Symbols icon names, garbled glyphs, leaked markdown fences, literal
  placeholder copy, or one-off frontend state models.
- Implement with the planned shadcn/Radix/lucide/CodeMirror/Tauri architecture,
  not by porting mockup HTML.

## Baseline Generated Reference Images

### Welcome

![Welcome Studio startup screen](./assets/reference/welcome.png)

### Recent Projects

![Recent projects with missing-folder recovery](./assets/reference/recent-projects.png)

### Project Home

![Project home with common actions and recent drafts](./assets/reference/project-home.png)

### Article Editing With Preview

![Article editor with metadata form, Markdown editor, and rendered preview](./assets/reference/article-editing-split-preview.png)

### Article Editing Full Width

![Article editor with preview collapsed](./assets/reference/article-editing-full.png)

### Article Editing With Error

![Article editor with local title validation and blocked publish state](./assets/reference/article-editing-error.png)

### Media Browser

![Media browser with thumbnail grid and media detail pane](./assets/reference/media-browser.png)

### Settings

![Settings form with subnavigation and autosaved state](./assets/reference/settings.png)

### Publish Confirm Dialog

![Publish preview with confirm publish dialog](./assets/reference/publish-confirm-dialog.png)

## Improved Studio Mockup Reference Images

### Improved Project Home

![Improved project home with action cards and recent work](./assets/reference/improved-studio-mockup/project-home.png)

### Improved Article Directory

![Improved article directory with filters and article cards](./assets/reference/improved-studio-mockup/article-directory.png)

### Improved Compact Article Directory

![Improved compact article directory stress reference](./assets/reference/improved-studio-mockup/compact-article-directory.png)

### Improved Article Editor

![Improved article editor with properties, source editor, and preview](./assets/reference/improved-studio-mockup/article-editor.png)

### Improved Media Library

![Improved media library with grid, search, add action, and selected state](./assets/reference/improved-studio-mockup/media-library.png)

### Improved Settings

![Improved settings with section navigation and autosaved form](./assets/reference/improved-studio-mockup/settings.png)

### Improved Publish Confirmation

![Improved publish confirmation dialog](./assets/reference/improved-studio-mockup/publish-confirmation.png)

### Improved Sidebar Collapsed

![Improved shell with sidebar collapsed](./assets/reference/improved-studio-mockup/sidebar-collapsed.png)

## Rough Studio Mockup Reference Images

### Rough Project Home

![Rough project home desktop composition](./assets/reference/rough-studio-mockup/project-home.png)

### Rough Article Editor With Split Preview

![Rough article editor with source editing and rendered preview](./assets/reference/rough-studio-mockup/article-editor-split-preview.png)

### Rough Article Editor Focused

![Rough article editor focused writing composition](./assets/reference/rough-studio-mockup/article-editor-focused.png)

### Rough Settings

![Rough settings form and subnavigation](./assets/reference/rough-studio-mockup/settings.png)

### Rough Media Library

![Rough media library grid](./assets/reference/rough-studio-mockup/media-library.png)

### Rough Publish Confirmation

![Rough publish confirmation modal over preview](./assets/reference/rough-studio-mockup/publish-confirmation.png)

### Rough Publishing Progress

![Rough publishing progress modal](./assets/reference/rough-studio-mockup/publishing-progress.png)
