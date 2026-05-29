# Studio GUI MVP Figma-Ready Designer Handoff

This document completes the designer handoff pass for Linear `IRK-268` and its
child issues `IRK-269` through `IRK-275`.

The intended audience is a visual/product designer who may not know Astro,
Rust, Tauri, MDX, frontmatter, Cloudflare internals, Git, or this repository.
It should be possible to create faithful Figma mockups from this document
without guessing the product behavior or screen inventory.

## One-Page Product Brief

Studio is a desktop app for writing and publishing a static blog.

The default user is not technical. They want to open their site, write an
article, add images, preview the site, and click publish. The product should
hide technical details unless the user needs them to fix a problem.

The MVP should show these capabilities visually:

- open or create a site project;
- restore the exact previous session;
- browse articles in a left sidebar;
- edit article settings in friendly forms;
- edit Markdown/MDX text in a raw editor;
- see a true rendered preview beside the editor;
- browse images and insert one into the article;
- edit site settings;
- save drafts and autosave;
- restore a previous checkpoint;
- publish through a preview and confirmation flow.

The design should feel calm, minimal, native, and professional. Use the
generated Studio GUI reference images as the primary visual reference for
layout, spacing, neutral color, side panels, editor/preview composition,
settings forms, media browsing, validation, and publish confirmation. Use the
improved Studio mockup screenshots as the closest supplemental visual
direction, especially for the article directory/browser and overall
desktop-tool mood. Use the rough Studio mockup screenshots as earlier
supplemental direction. Use Codex only as secondary inspiration for native-app
polish, tooltip quality, restraint, and motion. Do not copy Codex branding,
chat layout, or code-review details.

## Glossary

| Term             | Designer-facing meaning                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| Site project     | The user's blog/site inside the app                                       |
| Article          | A post the user writes and publishes                                      |
| Article settings | Friendly fields such as title, author, date, category, tags, image        |
| Markdown/MDX     | The text format in the editor; treat it as article text with some symbols |
| Preview          | The real webpage version of the site or article                           |
| Draft            | Saved work that is not published yet                                      |
| Checkpoint       | A previous saved version the user can restore                             |
| Media library    | The place where images are browsed and inserted                           |
| Publish          | The action that sends the finished site to the web                        |
| Cloudflare       | The recommended publishing provider for the MVP                           |
| Invalid field    | A form value the app will not save as final source                        |
| Blocked action   | An action the app cannot do until the user fixes something                |

Avoid putting technical words such as Git, branch, commit, CI, build artifact,
frontmatter, provider mutation, or operation envelope in visible default UI.

## Visual Reference Direction

Primary visual references:

| Screen                       | Reference file                                                           | What it shows                                                          |
| ---------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Welcome                      | `docs/studio/gui-mvp/assets/reference/welcome.png`                       | first launch, centered startup actions, empty recent sites             |
| Recent projects              | `docs/studio/gui-mvp/assets/reference/recent-projects.png`               | recent projects table and missing-folder recovery                      |
| Project home                 | `docs/studio/gui-mvp/assets/reference/project-home.png`                  | open-project action grid and recent content summaries                  |
| Article editing with preview | `docs/studio/gui-mvp/assets/reference/article-editing-split-preview.png` | metadata form, Markdown editor, and rendered preview split             |
| Article editing full width   | `docs/studio/gui-mvp/assets/reference/article-editing-full.png`          | preview-collapsed focused writing mode                                 |
| Article editing with error   | `docs/studio/gui-mvp/assets/reference/article-editing-error.png`         | local validation, disabled publish, and preview warning                |
| Media browser                | `docs/studio/gui-mvp/assets/reference/media-browser.png`                 | media grid, detail pane, metadata, usage list, insert action           |
| Settings                     | `docs/studio/gui-mvp/assets/reference/settings.png`                      | settings subnavigation, visual forms, autosaved status                 |
| Publish confirm dialog       | `docs/studio/gui-mvp/assets/reference/publish-confirm-dialog.png`        | publish preview, modal confirmation, destination, checkpoint, warnings |

The full visual reference catalog is
`docs/studio/gui-mvp/STUDIO_GUI_MVP_VISUAL_REFERENCES.md`.

Closest supplemental improved mockup references:

| Screen                        | Reference file                                                                         | What it shows                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Improved project home         | `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/project-home.png`         | utility-first project home, top toolbar, soft sidebar, recent work                           |
| Improved article directory    | `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/article-directory.png`    | article browser with status tabs, search, category filters, previews, and open-editor action |
| Improved article editor       | `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/article-editor.png`       | collapsible properties, source editor toolbar, saved status, and resizable preview           |
| Improved media library        | `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/media-library.png`        | grid/list toggle, search, add action, selected state, warning marker                         |
| Improved settings             | `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/settings.png`             | settings section nav, autosave status, beginner-safe form, advanced disclosure               |
| Improved publish confirmation | `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/publish-confirmation.png` | confirmation modal with destination, checkpoint, summary, warnings                           |

Supplemental rough mockup references:

| Screen                             | Reference file                                                                              | What it shows                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Rough project home                 | `docs/studio/gui-mvp/assets/reference/rough-studio-mockup/project-home.png`                 | quiet desktop shell, soft sidebar, restrained action grid        |
| Rough article editor split preview | `docs/studio/gui-mvp/assets/reference/rough-studio-mockup/article-editor-split-preview.png` | editor/preview proportions, compact frontmatter, toolbar density |
| Rough article editor focused       | `docs/studio/gui-mvp/assets/reference/rough-studio-mockup/article-editor-focused.png`       | focused writing with preview de-emphasized                       |
| Rough settings                     | `docs/studio/gui-mvp/assets/reference/rough-studio-mockup/settings.png`                     | settings subnav, calm forms, autosave notice                     |
| Rough media library                | `docs/studio/gui-mvp/assets/reference/rough-studio-mockup/media-library.png`                | media grid density and selected-image treatment                  |
| Rough publish confirmation         | `docs/studio/gui-mvp/assets/reference/rough-studio-mockup/publish-confirmation.png`         | dimmed publish preview with centered confirmation modal          |
| Rough publishing progress          | `docs/studio/gui-mvp/assets/reference/rough-studio-mockup/publishing-progress.png`          | simple blocking progress modal                                   |

Borrow from the generated Studio references:

- left sidebar with soft gray background;
- compact rows with icons and text;
- selected row as a rounded filled pill;
- sparse use of blue for primary action;
- top controls that are visible but quiet;
- resizable/collapsible side and right panels;
- clear tooltips with shortcuts;
- subtle dividers between major panes;
- white main content area;
- low-noise status colors;
- fast motion with minimal flourish.

Refine from the generated references where needed:

- toolbar labels should be context-aware, so `Save draft` belongs on article
  editing surfaces but settings/media can rely on autosave or
  context-specific labels;
- project home action cards should stay subtle and utility-first rather than
  becoming colorful dashboard tiles;
- welcome may use a centered panel because it is an empty/startup state, but
  normal work screens should feel like tools rather than landing pages;
- generated names, article topics, and image content are placeholders;
- rough mockup screenshots are directional only. They are not responsive
  specs, they should not define exact copy, and their generated HTML details
  should not be treated as implementation guidance.
- improved mockup screenshots are also directional. The article directory is a
  strong product pattern, but the designer should still apply the written
  responsive, accessibility, and component requirements.

Do not borrow from Codex or the generated references:

- chat input as the primary interaction;
- code diff as a central product surface;
- "Review" terminology;
- developer project naming;
- exact icon placement or branding;
- exact generated copy, publication name, or article content;
- a split that makes the app feel like a code review tool;
- rough mockup artifacts such as Material Symbols names, CDN setup, leaked
  markdown fences, encoding glitches, or squeezed compact layouts.
- improved mockup artifacts such as AI Studio boilerplate, remote image URLs,
  generated source comments, placeholder copy, or one-off frontend behavior.

## Figma File Structure

Recommended pages:

1. `00 Cover And Product Brief`
2. `01 Visual Tokens`
3. `02 Components`
4. `03 Startup And Project`
5. `04 Article Editing`
6. `05 Media And Settings`
7. `06 Publish And Recovery`
8. `07 Compact And Collapsed States`

## Frame Sizes

Create mockups at:

| Frame                  | Size       | Purpose                          |
| ---------------------- | ---------- | -------------------------------- |
| Desktop default        | 1440 x 900 | Primary target                   |
| Desktop compact        | 1280 x 800 | Common laptop window             |
| Minimum usable desktop | 1024 x 768 | Stress layout and panel collapse |

Optional if time permits:

- 1512 x 982 for MacBook-style desktop;
- 1728 x 1117 for wide desktop.

The MVP is desktop-first. Mobile phone frames are not required for this
handoff.

## Required Frames

### 1. First Launch

Purpose: user has never opened a site.

Layout:

- simple centered main panel;
- actions: Create site, Open site;
- small note that publishing can be connected later;
- no sidebar tree yet.

States:

- empty recent projects;
- file open action hover.

### 2. Recent Projects / Restore Failed

Purpose: user returns but exact restore is not possible.

Layout:

- recent projects list;
- one unavailable project row with warning;
- actions: Locate, Remove, Create new site.

Copy:

- "We could not find this site folder. Locate it to continue."

### 3. Project Home

Purpose: project is open but no article selected.

Layout:

- left sidebar visible;
- top toolbar visible;
- main panel shows common actions;
- optional recent drafts list;
- publish button in toolbar.

Actions:

- New article
- Open article
- Media
- Settings
- Preview
- Publish

### 4. Articles Directory / Browser

Purpose: user wants to browse, search, filter, and choose an article beyond
the compact sidebar tree.

Layout:

- left sidebar remains visible as persistent quick navigation;
- main pane shows an article directory header;
- Create Article action is visible;
- status segmented control shows All, Published, Drafts with counts;
- search field supports title/body/category/tag search;
- category/tag filter chips appear below or near search;
- results appear as readable article cards or dense rows.

Each result should show:

- status badge;
- title;
- date;
- read time or word count;
- category/tag signal;
- author;
- short excerpt;
- warning marker when applicable;
- clear Open Editor action.

States:

- populated;
- no articles yet;
- no search/filter results with Reset filters action;
- hover/focus/selected result;
- compact width with filters wrapping cleanly.

Use `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/article-directory.png`
as the closest visual reference. It is a browse/manage surface that complements
the sidebar tree; it should not replace the sidebar or become a colorful
analytics dashboard.

### 5. Article Editor Default

Purpose: user is editing an article.

Layout:

- left sidebar with selected article;
- center editor pane;
- right preview pane;
- top toolbar with Save draft, Preview, Publish;
- article settings form above or beside Markdown editor depending layout.

The frame should clearly show:

- title field;
- author/category/date/tags fields;
- raw Markdown editor;
- editor toolbar;
- rendered article preview.

### 6. Article Editor With Invalid Field

Purpose: frontmatter/form validation is local and visual.

Show:

- invalid title or date field;
- inline validation message;
- preview/publish blocked indicator;
- Publish button disabled or blocked with explanation.

Copy:

- "Add a title before publishing this article."

### 7. Article Editor With Sidebar Collapsed

Purpose: compact writing mode.

Show:

- icon-only sidebar rail;
- tooltip-ready controls;
- editor and preview gain space;
- selected article still visible in toolbar/breadcrumb.

### 8. Article Editor With Preview Collapsed

Purpose: focused writing.

Show:

- preview pane collapsed into right rail/tab;
- button to reopen preview;
- editor uses available width.

### 9. Editor Context Menu

Purpose: right-click or keyboard context menu over selected text.

Menu items:

- Bold
- Italic
- Link
- Heading
- Quote
- Code
- Bulleted list
- Numbered list
- Insert image

Show shortcut hints where appropriate.

### 10. Media Browser

Purpose: user browses images.

Layout:

- sidebar still visible;
- main pane grid/list of thumbnails;
- media toolbar with Add, Search, View toggle;
- selected image may open detail in right pane.

States:

- ready images;
- image missing alt text badge;
- selected image.

### 11. Media Detail / Insert Image

Purpose: user edits image metadata and inserts image.

Show:

- large image preview;
- alt text field;
- caption field;
- usage list;
- Insert into article button;
- Replace and Reveal actions.

### 12. Settings

Purpose: site owner edits site settings.

Layout:

- settings section nav;
- form fields;
- save/autosave status;
- beginner-safe defaults with advanced disclosure.

Required sections in side nav:

- Site identity
- Domain
- Navigation
- Social and support
- Authors
- Categories
- Homepage
- Theme
- Publishing

### 13. Publish Preview

Purpose: user clicked Publish and sees the rendered site before confirmation.

Layout:

- preview becomes dominant or full-screen within app;
- starts at current article route if publishing from editor;
- starts at home page if publishing from project home;
- top bar shows Cancel and Confirm publish.

Show:

- preview route label;
- warnings count if any;
- Confirm publish button.

### 14. Confirm Publish Modal

Purpose: explicit approval before deploy.

Modal includes:

- destination: Cloudflare/site URL;
- what will happen;
- checkpoint/restore note;
- warnings;
- primary action: Publish;
- secondary action: Cancel.

Copy:

- "We will publish this site to Cloudflare and save a checkpoint first."

### 15. Publishing In Progress

Purpose: publish has been confirmed and is running.

Show:

- modal or focused overlay;
- destination;
- current step label;
- progress indicator;
- disabled or carefully scoped Cancel action;
- clear "Publishing" state on the primary action.

Copy:

- "Publishing to Cloudflare..."

### 16. Publish Success

Purpose: publish finished.

Show:

- success state;
- public URL;
- View site;
- Restore checkpoint;
- Done.

### 17. Publish Blocked / Cloudflare Not Connected

Purpose: user cannot publish yet.

Show:

- blocked publish state;
- explanation;
- Connect Cloudflare action;
- Cancel.

Copy:

- "Connect Cloudflare before publishing this site."

### 18. Restore Version

Purpose: user wants to return to a previous version.

Show:

- checkpoint list;
- selected checkpoint details;
- Restore button;
- Cancel.

### 19. Tooltip And Shortcut Detail

Purpose: specify tooltip style.

Show hover tooltip for:

- Toggle side panel;
- Save draft;
- Publish;
- Toggle preview.

Tooltip should include keyboard shortcut pill.

## Layout Anatomy

### Desktop Default

```text
Window chrome
Toolbar: 44-52 px high
Sidebar: 260-300 px default, 56 px collapsed
Main pane: flexible, min 420 px
Preview pane: 36-44 percent default, min 320 px, collapsible
```

Use dividers between panes. Resizable handles should be discoverable on hover
and keyboard focus.

### Compact Desktop

Rules:

- collapse preview before breaking the editor;
- allow sidebar icon collapse;
- move less common actions into More menu;
- keep Save, Preview, Publish reachable;
- avoid wrapping toolbar into two awkward rows;
- treat the improved and rough mockup compact Playwright captures as cautionary
  examples: if content starts truncating important titles, squeezing filters,
  or squeezing preview/editor columns, the final design should collapse panes
  or switch density rather than preserve every region at once.

## Component Inventory

Create Figma components for:

- Icon button
- Text button
- Primary publish button
- Sidebar row
- Sidebar section label
- Article tree row
- Article directory filter bar
- Article directory status tab
- Article directory result card/row
- Status badge
- Tooltip
- Context menu
- Command palette item
- Text input
- Textarea
- Select
- Toggle
- Tag input
- Validation message
- Editor toolbar button
- Editor status strip
- Media thumbnail
- Media detail field
- Dialog/modal
- Toast
- Divider/resizer handle
- Preview toolbar
- Autosave indicator
- Checkpoint row

## Component States

Each relevant component should include variants for:

- default;
- hover;
- focused;
- pressed;
- selected;
- disabled;
- loading;
- dirty;
- saved;
- invalid;
- warning;
- success;
- destructive.

## Copy Examples

Buttons:

- Create site
- Open site
- New article
- Save draft
- Preview
- Publish
- Confirm publish
- Connect Cloudflare
- Restore version
- Insert image

Empty states:

- "No articles yet."
- "Add your first image."
- "Create a site or open an existing one."

Validation:

- "Add a title before publishing this article."
- "Choose a valid date."
- "Alt text helps readers understand this image."

Publish:

- "Preview is ready."
- "We will publish this site to Cloudflare and save a checkpoint first."
- "Published successfully."
- "Connect Cloudflare before publishing this site."

Recovery:

- "We could not find this site folder. Locate it to continue."
- "Autosave failed, but your changes are still in this window."

## Acceptance Criteria For Designer Mockups

Mockups are acceptable when:

1. all required frames exist;
2. desktop default and compact layouts are represented;
3. sidebar, editor, preview, media, settings, publish, and restore flows are
   visually clear;
4. color palette and typography match this spec;
5. all primary components have reusable variants;
6. tooltips and keyboard shortcut presentation are shown;
7. invalid, dirty, loading, blocked, success, and empty states are included;
8. publish uses preview and confirm, not a single direct action;
9. technical terms are absent from default user-facing copy;
10. a developer can map the mockup components to the planned component
    architecture.
