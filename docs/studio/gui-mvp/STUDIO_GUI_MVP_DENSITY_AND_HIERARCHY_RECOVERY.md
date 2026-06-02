# Studio GUI MVP Density And Hierarchy Recovery

This document defines the Milestone 16 density and hierarchy recovery pass for
the fixture-backed Studio GUI. It applies the elevated quality standard to the
shell, common controls, sidebar, and high-traffic work surfaces.

The goal is not to make the UI smaller everywhere. The goal is to make every
visible element earn its space, make common work easier to scan, and make
clutter difficult to reintroduce.

## Product Direction

Studio is a native-feeling writing and publishing utility. The default density
should be compact enough for repeated daily work while preserving comfortable
hit targets, clear focus states, and readable content.

The interface should not narrate itself. Authors do not need repeated page
titles, subtitles, and category labels that restate the navigation item they
just selected. Use persistent navigation, selected state, labels, tooltips,
form validation, and confirmation dialogs as the primary explanatory surfaces.

## Density Principles

1. Permanent chrome should be compact. The toolbar and sidebar are always
   present, so their controls should be modest and predictable.
2. Screen headings should be used only when they anchor a real task, mode, or
   safety boundary. Do not render a large heading just to repeat the selected
   sidebar item.
3. Helper copy should answer a question the user likely has. Remove copy that
   merely says what a screen is for.
4. Cards are for bounded objects or decision surfaces. Search/filter strips,
   toolbars, and routine nav lists should usually be unframed.
5. Repeated lists should be scan-first. Rows and cards need stable dimensions,
   uniform thumbnails, and compact metadata.
6. Status is useful when local and timely. Do not use banners to announce
   expected healthy state unless the state affects the next action.
7. Prototype disclaimers do not belong in primary product surfaces. Safety
   constraints should be encoded in disabled actions, confirmations,
   diagnostics, and tests.

## Shared Control Targets

Use these as implementation defaults:

| Surface                 | Target                                          |
| ----------------------- | ----------------------------------------------- |
| App toolbar             | `48-52px` tall, compact gaps, no row wrapping   |
| Icon-only buttons       | `32px` square, `16px` icons, tooltip required   |
| Text buttons in toolbar | `32-36px` high, short labels                    |
| Sidebar rows            | `30-34px` high, `16px` icons                    |
| Sidebar section padding | `8-12px` vertical, `12px` horizontal            |
| Search/input controls   | `32-36px` high for chrome, larger in forms only |
| Utility badges          | Small pills that do not dominate row height     |
| Primary content gutters | `20-24px` on desktop, smaller at compact widths |

These targets are not pixel-perfect test assertions. They are a product
contract: permanent chrome should never feel like a marketing landing page or
demo dashboard.

## Copy Rules

Remove:

- "Browse, filter, and open articles."
- "Media / Browse images..."
- "Project settings / Settings / Update site details..."
- fixture/prototype disclaimers in common product flows;
- repeated title + category + subheading stacks.

Keep:

- field labels;
- state-specific validation;
- confirmation copy before destructive or public actions;
- empty-state copy that tells the user what to do next;
- tooltips for icon-only or compact controls;
- short mode labels where the same screen can be in multiple modes.

## Screen-Specific Direction

### Article Directory

The directory should open directly into browsing. The toolbar should carry
search, status filters, result count, and the new-article action. Results
should appear without a large explanatory header or a framed filter card.

The card-heavy redesign belongs to the article directory recovery issue, but
this pass should remove obvious heading clutter and make the current cards less
dominant.

### Media

The media screen should open as a browser: search, add action, view toggle, and
media grid/detail. Do not show a large "Media" title or explanatory paragraph.
The selected detail pane already provides context.

### Settings

Settings should behave like a compact inspector. The left settings section list
must have intrinsic height and must not stretch to match a tall form. The main
section panel should show the active section and fields without a redundant
page heading stack.

### Project Home

Project home can keep a modest title because it is a landing surface, but the
real work is the action grid and recent content. Avoid large spacing that
pushes these actions below the fold.

### Publish And Restore

Publishing and restoring are safety-critical flows, so they may keep concise
mode labels and confirmation copy. Avoid development-facing fixture language in
visible product copy; the implementation and tests can prove that the fixture
does not mutate real providers or files.

## Engineering Requirements

1. Prefer shared primitive changes for global density: button sizes, icon
   sizes, toolbar spacing, sidebar row spacing, and panel defaults.
2. Screen-specific changes should remove clutter or encode clear layout
   invariants, not patch one screenshot.
3. Tests should assert product invariants: no duplicate explanatory copy,
   hidden panes absent, one sidebar selection, stable visible anchors, no
   horizontal overflow, and no toolbar overlap.
4. Avoid brittle pixel tests. Use broad thresholds for permanent chrome only
   when they catch meaningful regressions.
5. Visual inspection is required before handoff. The inspection should include
   at least project home, article directory, media, settings, and article
   editor with preview.
