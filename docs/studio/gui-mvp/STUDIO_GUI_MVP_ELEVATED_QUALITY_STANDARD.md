# Studio GUI MVP Elevated Quality Standard

This document defines the recovery quality bar for the fixture-backed Studio
GUI MVP. It exists because a fixture prototype is not valuable if it only
checks product-scope boxes. The prototype must feel like a credible product,
make intended states easy to understand, make invalid UI states impossible or
noisy, and give later operation-backed implementation work a strong foundation.

The goal is a great user experience and great engineering.

## Purpose

Use this document for Milestone 16 recovery work and future Studio GUI
implementation reviews. It complements the product, visual, component,
fixture, interaction, and engineering specs in this directory. When those
documents conflict with this quality standard, resolve the conflict in favor of
the higher user-experience and engineering bar, then update the older document
so the design stays coherent.

This is not a request to polish superficial styling. The product should be
pleasant, compact, predictable, and useful. The implementation should encode
the product model so simple layout and navigation bugs are difficult to
represent.

## What Went Wrong

The first implementation pass exposed several quality failures:

- It represented hidden panes as visible collapsed rails, which made "hidden"
  not mean hidden.
- It allowed multiple sidebar items to appear selected at once because top
  navigation selection and article selection were modeled as separate visual
  facts instead of one active location.
- It placed the article title in a generic properties form even though the
  title is the primary editable document heading.
- It made the source editor look like a framed card with line numbers and
  internal padding, competing with the actual writing surface.
- It left fixture controls visible without complete visual state feedback.
- It used headings and descriptions as scaffolding, wasting space and making a
  utility app feel like a narrated demo.
- It did not visually inspect enough states before handoff.

The lesson is structural: do not patch isolated symptoms when the underlying
model permits bad states. Replace foundations when they encode the wrong
invariant.

## Product Design Standard

The Studio GUI is a native-feeling publishing utility. It should be quiet,
compact, and direct. The author is here to create and publish; the interface
should make the next meaningful action obvious without explaining ordinary
concepts.

Design goals:

1. Use space intentionally. Every visible element needs a job: navigation,
   editing, preview, feedback, or action.
2. Prefer blank space over clutter. Empty space can improve focus; repeated
   titles and explanatory copy usually cannot.
3. Apply minimum sufficient detail. Assume competent users and show only the
   visible copy needed for confident action. Extra explanation belongs only
   where it changes a decision, clarifies unfamiliar domain language, names a
   risk boundary, or makes an error/blocker actionable.
4. Keep the author work primary. Article content, article properties, preview,
   media, and publish state are the main surfaces.
5. Be compact by default. Dense does not mean cramped; it means common tasks
   fit without unnecessary scrolling.
6. Explain only where the user needs help. Use labels, tooltips, inline
   validation, and confirmation dialogs instead of page-level narration.
7. Make state visually honest. Hidden things are hidden, disabled actions look
   disabled, selected things are singular, and dangerous actions have
   confirmation.
8. Separate workflow meanings. Live article preview is part of writing; whole
   site preview is part of publishing and inspection.
9. Prefer native utility patterns. Toolbars, sidebars, split panes, menus,
   context menus, keyboard shortcuts, and dialogs should behave predictably.
10. Use color sparingly. Blue marks primary/selected action, green marks saved
    or success, orange marks warning, red marks blocking errors.
11. Iterate visually. A screen is not done until it survives actual browsing,
    resizing, interaction, and screenshot review.

Anti-patterns:

- Page headers that restate the selected navigation item.
- Subheads that explain obvious screens, such as "Browse articles".
- Visible menu, popover, or context-menu headings that restate the trigger,
  such as "Article actions", "Cursor actions", or "Publish options". Preserve
  accessible names and trigger tooltips, but do not waste visible menu space on
  labels that merely describe the menu as a menu. This has recurred enough that
  it is now an explicit review failure: compact utility surfaces should start
  with useful controls unless a visible heading communicates a non-obvious mode
  or risk boundary.
- Visible helper descriptions under obvious menu actions, such as explaining
  "Insert image" with "Open the media browser for image insertion." Compact
  menus and context menus should show action labels, shortcuts, state, and
  disabled reasons; descriptions belong in tooltips, detail panels, or flows
  where ambiguity or risk genuinely requires more context.
- Placeholder controls that do not change visible state.
- Cards for everything.
- Nested card-on-card layouts.
- Large buttons in permanent toolbars when compact controls communicate enough.
- Local notices for expected, non-exceptional states.
- Decorative density that pushes useful data off screen.

## Engineering Standard

The Studio app should be modeled as a small, typed publishing state machine.
The UI should render from canonical state and pure view models, not from
uncoordinated local booleans.

Engineering goals:

1. Make invalid UI state unrepresentable where practical.
2. Keep one canonical active location.
3. Keep pane visibility in the layout model, not as CSS afterthoughts.
4. Keep source data, draft form state, layout state, overlays, and command
   state separate.
5. Use commands as the only cross-surface transition surface.
6. Keep reducers and selectors pure and testable.
7. Keep impure work at the edge: DOM measurement, local storage, browser
   APIs, Tauri APIs, future filesystem, and provider calls.
8. Use component props that express the domain, not a pile of booleans.
9. Let tests follow real seams without adding test-only exports.
10. Encode recurring product rules in helpers, view models, policies, and
    tests so future components do not have to remember them.

### State Shape

Prefer discriminated unions and derived selectors over parallel booleans.

Avoid:

```ts
interface PaneState {
  readonly isCollapsed: boolean;
  readonly isVisible: boolean;
  readonly showRail: boolean;
}
```

Better:

```ts
type PaneVisibility = "hidden" | "visible";

interface WorkspaceLayoutState {
  readonly preview: PaneVisibility;
  readonly sidebar: PaneVisibility;
}

function visibleWorkspaceRegions(
  state: WorkspaceLayoutState,
): readonly WorkspaceRegion[] {
  return [
    ...(state.sidebar === "visible" ? ["sidebar" as const] : []),
    "work" as const,
    ...(state.preview === "visible" ? ["preview" as const] : []),
  ];
}
```

If a pane is hidden, the region list must not include that pane. The render
tree should follow the region list rather than render a hidden pane and hide
its contents.

### Selection

There should be one active location. Sidebar visual selection should derive
from that location.

Avoid:

```ts
const selectedNav = selectedNavId(state);
const selectedArticle = state.activeArticleId === node.articleId;
```

Better:

```ts
type StudioLocation =
  | { readonly kind: "article"; readonly articleId: string }
  | { readonly kind: "articles" }
  | { readonly kind: "media" }
  | { readonly kind: "project-home" }
  | { readonly kind: "settings" };

function selectedSidebarItem(location: StudioLocation): SidebarSelection {
  return location.kind === "article"
    ? { kind: "article", articleId: location.articleId }
    : { kind: "nav", id: location.kind };
}
```

An article editor location should select the article item, not both the article
item and the Articles navigation item.

### Screen-Scoped Preview

There are two preview concepts:

1. Article live preview: scoped to article editing only.
2. Whole-site preview: a separate screen opened from the global Preview
   command.

The article preview pane must not persist onto media, settings, project home,
article directory, publish, restore, or startup screens. The whole-site preview
must not masquerade as the editor preview pane.

### Component Structure

Components should be small enough that their invariants are obvious:

- Shell owns global toolbar, visible regions, and overlay layer.
- Sidebar owns navigation and tree presentation.
- Work pane routes to screen surfaces.
- Screen components compose product sections.
- Product sections compose small primitives and forms.
- Reducers and selectors own state transitions and product rules.

Use explicit component names that communicate product responsibility. Avoid
generic "content" and "panel" wrappers when a domain component would make the
intent clearer.

## Surface Quality Bars

### Shell And Toolbar

The shell should feel like a focused desktop app:

- fixed, compact toolbar;
- small icon buttons with tooltips and shortcuts;
- one global Preview command for whole-site preview;
- no article preview toggle in the global toolbar;
- primary Publish action visible when a project is open;
- disabled controls with useful reasons;
- no dead controls;
- back/forward controls may be disabled in the fixture prototype, but they
  must visibly communicate that state.

### Sidebar

The sidebar should be compact and reliable:

- one selected item at a time;
- article tree folders collapse and expand;
- article selection always responds on first click;
- icons are modest and aligned;
- item heights are compact but keyboard-accessible;
- no duplicate selection for parent nav and child article;
- hidden sidebar removes the sidebar from layout;
- startup sidebar and project sidebar use the same visual language.

### Article Editor

The editor should center the writing task:

- editable article title is the main heading, not a field inside Properties;
- title edit affordance is clear but subtle;
- Properties card is collapsible and contains secondary frontmatter;
- Properties card is named "Properties";
- source editor is flat, full-width, and visually integrated with the page;
- no line numbers by default;
- no internal card padding around the source editor;
- editor toolbar is compact and directly connected to the source surface;
- article live preview is available only inside article editing;
- invalid title or field states are local and actionable.

### Article Directory

The directory should help users browse and open content quickly:

- compact default layout;
- uniform social-preview thumbnails;
- stable card/list dimensions;
- no layout shifts from varied image dimensions;
- useful metadata visible without excessive copy;
- filters and search are available without overwhelming the default view;
- cards are clickable and keyboard-accessible;
- article tree and directory selection stay coherent.

### Media

The media browser should be visual and practical:

- thumbnail grid uses stable aspect ratios;
- selected media opens a details pane with preview, alt text, caption, file
  facts, usage, and insert actions;
- metadata validation is local and clear;
- the screen does not waste space explaining what a media library is;
- insertion actions are visible only when there is an article context or show a
  clear disabled reason.

### Settings

Settings should feel like a desktop preferences page:

- compact category rail;
- category rail has fixed content height and does not stretch to match large
  cards;
- forms reject invalid values locally;
- advanced options are progressive disclosure;
- no headings or copy that restate the selected settings category.

### Publish

Publishing should build confidence:

- Publish opens a whole-site preview flow, not the editor live preview;
- current article route is used as the preview start when publishing from the
  article editor;
- otherwise preview starts at the home page;
- confirm dialog explains destination, checkpoint, summary, warnings, and
  final action;
- provider mutation is fixture-only until real publish operations exist;
- every publish state has a visible, testable fixture state.

### Restore

Restore should be simple and safe:

- checkpoints are understandable without Git terminology;
- selecting a checkpoint previews what will happen;
- destructive source replacement requires confirmation;
- unavailable restore capability is a clear state, not a broken screen.

## Interaction Completeness Standard

Every visible control needs one of these outcomes:

1. It performs a visible state transition.
2. It opens a visible menu, dialog, popover, or focused state.
3. It is disabled and explains why.
4. It is explicitly removed from the fixture prototype.

Fixture-backed does not mean static. The prototype must show the full intended
interaction model even if the underlying data changes only in memory.

## Test Standard

Use tests to enforce product invariants, not only implementation details.

Unit tests should cover:

- reducers for all command transitions;
- selectors for active location, selected sidebar item, pane regions, toolbar
  commands, and preview scope;
- view models for article editor, directory, media, settings, publish, and
  restore states;
- invalid input cases and blocked command reasons;
- fixture validation and operation-shaped payload assumptions.

Playwright tests should cover:

- startup exact restore state;
- project home navigation;
- sidebar hide/show with no residual rail;
- preview hide/show only on article editor;
- article click always opens article on first click;
- only one sidebar item is selected;
- folder collapse and expand;
- global Preview opens whole-site preview;
- Publish opens publish preview and confirmation states;
- Properties collapse and expand;
- title edit mode and invalid title feedback;
- media details and insert disabled/enabled states;
- settings category switching without layout shift;
- context menu and hotkeys for editor commands;
- high text zoom, reduced motion, keyboard navigation, and axe checks.

Visual QA should include:

- screenshot before and after every high-risk interaction;
- desktop and narrower viewport passes;
- manual comparison against visual references and docs;
- explicit inspection for wasted headings, oversized controls, dead UI,
  broken selection, pane remnants, layout shift, and awkward density.

Do not add test-only exports. If a pure seam is hard to test, that is design
feedback: extract a real reducer, selector, view model, or policy that the app
itself uses.

## Visual QA Process

Before handoff:

1. Start the Studio preview.
2. Open the app with Playwright.
3. Capture baseline screenshots for startup, recent projects, project home,
   article directory, article editor, article editor with preview, media,
   settings, publish preview, publish confirmation, restore, and error states.
4. For each interaction, state the intended result before clicking or typing.
5. Perform the interaction.
6. Capture the after screenshot.
7. Inspect the before/after pair.
8. Fix any mismatch, visual awkwardness, dead control, spacing waste, or state
   dishonesty.
9. Repeat until no obvious defects appear during a normal browsing pass.

Automated tests are required but not sufficient. A GUI can pass tests and
still feel careless. Manual visual inspection is part of done.

## Definition Of Done For Recovery

Milestone 16 recovery is done only when:

1. The elevated quality standard is written and attached to the recovery
   issues.
2. The app no longer contains known low-quality states from the first pass.
3. Pane visibility, active location, article selection, preview scope, and
   command availability are encoded as testable product invariants.
4. Every visible control in the fixture prototype has visible behavior or a
   disabled reason.
5. The editor, directory, sidebar, toolbar, media, settings, publish, restore,
   startup, and project home screens match the compact utility direction.
6. Unit and Playwright tests cover the critical invariants.
7. Manual Playwright visual inspection has been performed and documented.
8. Release checks pass.
9. Relevant docs and Linear issues are updated.

## Review Questions

Use these questions during implementation and review:

- Is this element earning its screen space?
- Would a non-technical author understand what to do next without being
  patronized?
- Is the product state represented once and derived everywhere else?
- Can this bug class be made impossible instead of patched?
- Does this control work, explain why it cannot work, or need to disappear?
- Does this screen still look polished after five minutes of real browsing?
- Can a future operation-backed implementation reuse this seam without
  rewriting the UI model?
- Would this abstraction make the next valid change faster and safer?
