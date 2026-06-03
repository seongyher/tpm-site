# Studio GUI MVP Visual Language

This document completes the visual-language design pass for Linear `IRK-232`
and its child issues `IRK-242` through `IRK-245`.

The intended audience is both product/design and implementation. It explains
what the GUI should feel like, why those choices fit the Studio product, and
which tokens/states a designer or developer should use.

## Design Thesis

The Studio should feel like a calm native desktop tool for writing and
publishing, not a marketing site, developer dashboard, or generic admin panel.

The primary visual direction is the generated Studio GUI reference set:

- `docs/studio/gui-mvp/STUDIO_GUI_MVP_VISUAL_REFERENCES.md`
- `docs/studio/gui-mvp/assets/reference/welcome.png`
- `docs/studio/gui-mvp/assets/reference/recent-projects.png`
- `docs/studio/gui-mvp/assets/reference/project-home.png`
- `docs/studio/gui-mvp/assets/reference/article-editing-split-preview.png`
- `docs/studio/gui-mvp/assets/reference/article-editing-full.png`
- `docs/studio/gui-mvp/assets/reference/article-editing-error.png`
- `docs/studio/gui-mvp/assets/reference/media-browser.png`
- `docs/studio/gui-mvp/assets/reference/settings.png`
- `docs/studio/gui-mvp/assets/reference/publish-confirm-dialog.png`
- `docs/studio/gui-mvp/assets/reference/improved-studio-mockup/`
- `docs/studio/gui-mvp/assets/reference/rough-studio-mockup/`
- `docs/studio/gui-mvp/STUDIO_GUI_MVP_DENSITY_AND_HIERARCHY_RECOVERY.md`
- `docs/studio/gui-mvp/STUDIO_GUI_MVP_NON_EDITOR_POLISH_DESIGN.md`

These generated images and improved/rough mockup screenshots are closer to the
desired product than the earlier Codex screenshots because they show the actual
Studio product shape: startup, recent projects, article navigation, article
directory browsing, editor/preview split, media browser, settings forms,
validation, publish confirmation, and publishing progress.

The reference set establishes:

- quiet neutral surfaces;
- mostly monochrome UI;
- color used only when meaningful;
- compact icon-first actions;
- rounded selection pills and controls;
- resizable and collapsible side panels;
- subtle dividers instead of heavy borders;
- tooltips that explain labels and shortcuts;
- fast, fluid, low-drama motion;
- obvious primary actions without visual shouting.

The improved Studio mockup screenshots are the closest supplemental visual
reference for product feel. They are especially useful for the richer article
directory/browser, project-home density, calm top toolbar, soft gray sidebar,
white work surface, compact form/editor density, large readable preview pane,
and modal publishing flow. The earlier rough mockup remains useful for the
same desktop-tool mood. Neither mockup is a responsive design spec or source
implementation plan.

Codex remains a secondary quality reference for native-app restraint,
low-clutter controls, tooltip polish, and motion. The Studio must not copy
Codex branding, chat metaphors, code-review layout, or developer-specific
affordances. The Studio-specific reference images are the primary visual
target; Codex is only a quality bar.

## Product Feel

The Studio should feel:

- simple, but not empty;
- professional, but not corporate;
- native, but not OS-mimicking;
- author-first, but not toy-like;
- safe, but not alarmist;
- powerful, but not cluttered.

Common actions should be visible and out of the way. Advanced details should be
available through disclosure, command palette, context menu, or detailed error
view, not forced into the default screen.

## Minimum Sufficient Detail

The Studio should assume competent users. Visible UI copy should provide the
minimum amount of detail needed for a user to confidently understand and act.
Do not fill the interface with headings, subheadings, helper descriptions, or
instructional copy that restate what the selected navigation, control label,
icon, placement, or visible action already makes obvious.

This rule is about respect and density. A useful utility gives authors clear
actions and fast feedback without narrating the interface back to them.
Additional detail belongs only where it changes the user's decision:

- unfamiliar domain terms;
- destructive or irreversible actions;
- disabled, blocked, warning, or error states;
- publish, restore, credential, provider, or migration boundaries;
- first-use flows where the next step is otherwise genuinely ambiguous.

When extra context is useful but not essential, prefer a tooltip, accessible
description, disclosure row, detail pane, or confirmation dialog over permanent
visible clutter. Every visible word should earn its space.

The Studio should not narrate obvious screens back to the user. Avoid headers
and helper copy that simply restate the current navigation item, such as
"Articles" followed by "Browse articles." Use screen-level labels only when
they anchor a complex task, distinguish a mode, or provide safety-critical
context. A compact utility surface should make ordinary actions clear through
layout, labels, icons, and state, not explanatory clutter.

The same rule applies even more strongly to menus, context menus, popovers,
and other compact utility surfaces. Do not put visible headings such as
"Article actions", "Cursor actions", "Publish options", or similarly obvious
labels at the top of a menu when the trigger, placement, and menu items already
make the context clear. Keep the accessible name on the menu surface and use a
tooltip on the trigger when useful, but do not spend visible pixels telling the
user what they just opened. A visible heading belongs in a compact menu only
when it communicates a non-obvious mode, risk boundary, or mixed-context
choice that the actions themselves cannot communicate.

This is a repeated failure mode and should be treated as a design defect, not
as a harmless copy choice. A menu or context menu whose first visible element
only names the menu is not ready for review. The correct pattern is:

- the trigger exposes the purpose through icon, label, tooltip, or placement;
- the menu has an accessible name for assistive technology;
- the visible menu content starts with the available actions, grouped only
  when grouping changes understanding;
- obvious action descriptions are omitted from visible rows;
- headings appear only when they add information the trigger and actions do not
  already provide.

Permanent chrome must stay compact. The app toolbar, sidebar, icon controls,
search fields, filter rows, and action clusters are always competing with the
author's writing and preview space. Their default density should follow the
recovery contract in
`STUDIO_GUI_MVP_DENSITY_AND_HIERARCHY_RECOVERY.md`: roughly 48-52px toolbar
height, 32px icon controls, 16px icons, compact sidebar rows, and no large
screen-heading stacks that repeat selected navigation.

The article directory is a useful example of this balance. It can expose
status tabs, search, category filters, article previews, and metadata in the
main work pane without making the sidebar carry every browsing task. Treat it
as a browse/manage surface that complements the persistent article tree, not
as a replacement for quick navigation.

The same density standard applies to non-editor product surfaces. Settings
should feel like a compact inspector, media should open directly as a browser,
project home should privilege action and recent work over explanation, and
publish/restore should keep concise safety context without visible prototype
language.

## Visual Principles

### Color

Use a neutral palette as the default. Color should indicate action, state, or
risk.

Recommended palette for mockups:

| Token              | Suggested value | Purpose                                  |
| ------------------ | --------------- | ---------------------------------------- |
| App background     | `#F4F4F2`       | Main window background                   |
| Sidebar background | `#E7E7E4`       | Left navigation surface                  |
| Panel background   | `#FFFFFF`       | Editor, preview, forms, modal surfaces   |
| Panel muted        | `#F7F7F5`       | Inset strips, inactive rows, code blocks |
| Border             | `#DADAD6`       | Dividers and low-emphasis outlines       |
| Text               | `#242424`       | Primary text                             |
| Muted text         | `#6F6F6B`       | Secondary labels and metadata            |
| Subtle text        | `#A0A09B`       | Section labels and disabled text         |
| Accent blue        | `#4C91F8`       | Primary action, focus, selected action   |
| Accent blue text   | `#0F3B75`       | Text on pale blue surfaces               |
| Success            | `#2D8A57`       | Saved, published, valid                  |
| Warning            | `#A86D13`       | Needs attention, recoverable warning     |
| Danger             | `#B63F35`       | Destructive or blocked action            |

Rules:

- Do not use decorative gradients or colored backgrounds.
- Do not make the app a one-hue theme.
- Use blue for interactive primary or selected action, not for all links and
  metadata.
- Use red only for destructive or truly blocking states.
- Use green only for completed/saved/published state.
- Pair all color with text, icon, or shape.

### Typography

Use system UI typography for native familiarity:

- primary font: `Inter`, `ui-sans-serif`, `system-ui`, `-apple-system`,
  `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`;
- code/editor font: `Geist Mono`, `ui-monospace`, `SFMono-Regular`, `Menlo`,
  `Monaco`, `Consolas`, monospace.

Scale:

| Use                                   | Size     | Weight                   |
| ------------------------------------- | -------- | ------------------------ |
| Window title / selected article title | 16-18 px | 600                      |
| Panel heading                         | 14-16 px | 600                      |
| Body text                             | 14 px    | 400                      |
| Sidebar row                           | 14 px    | 400 or 500 when selected |
| Field label                           | 13 px    | 500                      |
| Metadata / helper text                | 12-13 px | 400                      |
| Keyboard shortcut pill                | 12 px    | 500                      |

Avoid large hero typography. The Studio is a tool surface.

### Layout And Spacing

The default desktop layout:

```text
native window chrome
  app toolbar
  main workspace
    left sidebar
    center work pane
    right preview/details pane
```

Spacing rules:

- Use 8 px as the base rhythm.
- Use 12 px for compact row padding.
- Use 16 px for panel padding.
- Use 20-24 px for larger screen gutters.
- Keep dense lists compact but not cramped.
- Give editor and preview panes enough breathing room.

Panel rules:

- Sidebars can have soft tinted backgrounds.
- Main work panes should usually be white.
- Dividers should be 1 px or hairline.
- Avoid card-in-card nesting.
- Use panels as structural surfaces, not decorative floating cards.
- When a pane starts to feel crowded, collapse a secondary panel or move
  secondary actions behind a menu before shrinking field labels, toolbar
  buttons, or preview content into unreadable states.

### Radius And Shape

Use a consistent small radius system:

| Surface                         | Radius                         |
| ------------------------------- | ------------------------------ |
| Window/panel edge where visible | 10-12 px                       |
| Buttons, inputs, selected rows  | 8-10 px                        |
| Small badges, shortcut pills    | 999 px or 6 px depending shape |
| Media thumbnails                | 8 px                           |
| Menus, tooltips, dialogs        | 10-12 px                       |

Do not over-round large content panels. Rounded shapes should feel soft and
native, not bubbly.

### Icons

Use lucide-style outline icons for actions and navigation. Icons should be:

- consistent stroke width;
- visually quiet;
- paired with text when meaning is not obvious;
- used alone only for familiar controls or with tooltip support.

Common icon groups:

- project/site: folder, panel, home;
- writing: file-text, plus, pencil;
- media: image, upload, replace;
- preview/publish: eye, send/upload-cloud, check;
- state: check, alert-triangle, x-circle, clock;
- layout: panel-left, panel-right, columns, maximize;
- navigation: arrow-left, arrow-right, search.

### Tooltips And Keyboard Hints

Every icon-only button needs a tooltip. Tooltips should include:

- plain action label;
- optional one-line clarification;
- keyboard shortcut when available.

Examples:

- `Toggle side panel    Option+Command+B`
- `Save draft    Command+S`
- `Open command palette    Command+K`
- `Insert image at cursor`

Tooltips must not be the only place where a required action is discoverable.

### Motion

Motion should be fast and functional:

- panel collapse/expand: 120-180 ms;
- hover/focus transitions: 100-150 ms;
- modal/menu open: 100-150 ms;
- resize should track pointer immediately;
- use reduced-motion preferences.

Avoid decorative animation. Motion should explain continuity, not entertain.

## Interaction States

Every reusable component must design these states where applicable:

- default;
- hover;
- focused;
- active/pressed;
- selected;
- disabled;
- loading;
- dirty;
- saved;
- invalid;
- warning;
- blocked;
- destructive.

Selected rows use subtle filled backgrounds, not heavy outlines. Invalid fields
show local messages. Blocked operations use a dialog or inline blocked state
depending on scope.

## Error And Recovery Language

Most errors should be local:

- field validation appears under the field;
- editor syntax or unsupported-content feedback appears near the editor;
- media issues appear on the media item or insertion flow;
- publish blockers appear in the publish preview or confirm modal.

Use modals only when:

- the user initiated an action;
- the action cannot proceed;
- the next decision needs explicit user judgment;
- a destructive action needs confirmation.

Use toasts only for:

- save complete;
- autosave recovered;
- non-blocking completion;
- undoable low-risk events.

Avoid a global "project health" dashboard in the MVP. If something is wrong,
show it where the user encounters it.

## Copy Tone

Copy should be short, direct, and non-technical.

Use:

- "Connect Cloudflare to publish this site."
- "This article needs a title before it can be published."
- "The image is missing alt text."
- "We saved a checkpoint before publishing."

Avoid:

- "Provider capability unsupported."
- "Frontmatter validation failed."
- "Build artifact materialization error."
- "Mutation requires apply mode."

Technical details may appear behind "Details" for power users.

## Anti-Patterns

Do not:

- create a developer dashboard;
- show raw build logs by default;
- copy mockup prototype code, AI Studio boilerplate, remote image URLs,
  generated icon names, glyph artifacts, or placeholder content;
- rely on color alone;
- hide primary publishing actions in menus;
- use large marketing cards;
- use dark blue/purple gradient theming;
- create nested panels that feel like card stacks;
- expose Git, CI, branch, or deploy implementation terms in default flows;
- build custom menu, dialog, tooltip, or resizable mechanics when mature
  primitives exist;
- let the UI imply that invalid canonical source can be saved.

## Acceptance Criteria

The visual language is ready when:

1. a designer can create mockups without guessing palette, radius, spacing, or
   interaction states;
2. developers can map the visual choices to shadcn/Radix-style primitives;
3. color usage is meaningful and restrained;
4. accessibility expectations are visible in the design language;
5. errors and validation are local, actionable, and author-language first;
6. the design direction uses the Studio-specific reference set as its primary
   visual anchor without treating any mockup as an exact implementation
   screenshot.
