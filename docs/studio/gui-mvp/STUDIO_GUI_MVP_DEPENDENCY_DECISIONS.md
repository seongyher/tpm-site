# Studio GUI MVP Dependency And Build-Vs-Buy Decisions

This document completes the dependency research pass for Linear `IRK-234` and
its child issues `IRK-251` through `IRK-255`.

The goal is to avoid hand-rolling solved UI infrastructure while keeping the
Studio domain model, operation contracts, validation, publishing safety, and
state machines owned by the platform.

## Research Sources

Primary references used:

- [Astro React integration](https://docs.astro.build/en/guides/integrations-guide/react/)
- [shadcn/ui components](https://ui.shadcn.com/docs/components)
- [shadcn Sidebar](https://ui.shadcn.com/docs/components/sidebar)
- [shadcn Resizable](https://ui.shadcn.com/docs/components/resizable)
- [shadcn Context Menu](https://ui.shadcn.com/docs/components/context-menu)
- [shadcn Command](https://ui.shadcn.com/docs/components/command)
- [shadcn Tooltip](https://ui.shadcn.com/docs/components/tooltip)
- [CodeMirror reference](https://codemirror.net/docs/ref/)
- [CodeMirror configuration example](https://codemirror.net/examples/config/)
- [Monaco editor repository](https://github.com/microsoft/monaco-editor)
- [Tiptap Markdown docs](https://tiptap.dev/docs/editor/markdown/api/editor)
- [ProseMirror overview](https://prosemirror.net/)
- [React Aria Tree](https://react-aria.adobe.com/Tree)
- [React Complex Tree accessibility](https://rct.lukasbach.com/docs/guides/accessibility)
- [TanStack Hotkeys React docs](https://tanstack.com/hotkeys/latest/docs/framework/react/react-hotkeys)
- [Tauri calling Rust](https://v2.tauri.app/develop/calling-rust/)
- [Tauri capabilities](https://v2.tauri.app/security/capabilities/)
- [Tauri dialog plugin](https://v2.tauri.app/plugin/dialog/)
- [Tauri file system plugin](https://v2.tauri.app/plugin/file-system/)
- [Tauri store plugin](https://v2.tauri.app/plugin/store/)
- [Tauri stronghold plugin](https://v2.tauri.app/plugin/stronghold/)
- [Tauri opener plugin](https://v2.tauri.app/plugin/opener/)
- [Tauri window state plugin](https://v2.tauri.app/plugin/window-state/)

## Current Repo Facts

- The public site is Astro-first and static-first.
- `apps/studio/` already exists as a static Astro frontend shell.
- `apps/studio/src-tauri/` already exists as a minimal Tauri shell.
- The current package has Tailwind v4, Astro, Tauri, lucide-astro, and shadcn
  configuration.
- React and `@astrojs/react` are not currently installed.
- The current `components.json` uses shadcn `new-york`, Tailwind variables,
  TypeScript/TSX, no RSC, and lucide icons.
- The improved and rough Studio mockup prototypes are reference material only.
  They should not be ported because they rely on generated placeholder
  content, remote image URLs, one-off frontend state, and mockup-specific
  implementation shortcuts.

## Recommendation Summary

Use Astro as the Studio frontend shell and introduce a bounded React app island
for the interactive Studio workspace. Use shadcn/Radix-style components for
standard UI infrastructure. Use CodeMirror 6 for the MVP source-faithful
Markdown/MDX editor. Use Tauri plugins only behind narrow Rust/Tauri command
boundaries and capability files.

Do not use WYSIWYG/rich-text dependencies in the MVP. They are attractive
later, but they create Markdown/MDX round-trip and schema-drift risks before
the source-faithful MVP is proven.

## Dependency Matrix

| Requirement               | Recommendation                                                                                                                 | Fallback                                                            | Hand-roll?                   | Reason                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| Studio app shell          | Astro static app                                                                                                               | Vite React shell inside Tauri only if Astro blocks the island model | No                           | Current repo already has Astro static shell and Tauri packaging                            |
| Interactive GUI workspace | React island/app inside Astro via `@astrojs/react`                                                                             | Plain custom elements for tiny interactions only                    | No for app state             | shadcn/Radix ecosystem assumes React; editor/layout interactions justify React             |
| UI primitives             | shadcn/Radix source-owned components                                                                                           | Direct Radix primitives if shadcn component is too broad            | No                           | Mature accessible primitives, source-owned customization, Tailwind fit                     |
| Icons                     | `lucide-react` for React GUI                                                                                                   | existing `lucide-astro` for static Astro-only pieces                | No                           | Matches shadcn icon library and current visual direction                                   |
| Resizable panels          | shadcn Resizable over `react-resizable-panels`                                                                                 | direct `react-resizable-panels`                                     | No                           | Resize/collapse/persistence mechanics are solved infrastructure                            |
| Sidebar shell             | shadcn Sidebar adapted to desktop app                                                                                          | custom shell using Radix primitives                                 | Mostly no                    | Collapsible/offcanvas patterns and accessibility are mature                                |
| Dialogs/modals            | shadcn Dialog/AlertDialog                                                                                                      | direct Radix Dialog                                                 | No                           | Focus trapping and aria behavior should not be custom                                      |
| Tooltips                  | shadcn Tooltip                                                                                                                 | direct Radix Tooltip                                                | No                           | Icon controls require accessible tooltips with shortcut labels                             |
| Context menus             | shadcn ContextMenu                                                                                                             | direct Radix ContextMenu                                            | No                           | Right-click and keyboard context menus are tricky to implement correctly                   |
| Command palette           | shadcn Command over `cmdk`                                                                                                     | custom command renderer over `cmdk`                                 | Domain registry only         | Search/filter/focus mechanics are solved; command definitions are ours                     |
| Forms                     | shadcn Field/Input/Select/Switch/Checkbox/Textarea                                                                             | direct Radix plus custom wrappers                                   | Domain descriptors only      | Form controls are solved; schema descriptor mapping is platform-owned                      |
| Toasts                    | shadcn Sonner                                                                                                                  | Radix Toast if needed                                               | No                           | Feedback infrastructure is solved                                                          |
| Media grid                | shadcn primitives plus Studio domain wrappers                                                                                  | TanStack virtual if very large grids later                          | Domain layout yes            | MVP media library is domain-specific but should use common primitives                      |
| Article tree              | React Aria Tree for accessible browse/select; consider React Complex Tree when rename/drag/drop/virtualization become required | shadcn Sidebar + Collapsible only for shallow fixture prototype     | Avoid full custom tree       | Tree keyboard/ARIA behavior is easy to get wrong                                           |
| Markdown/MDX editor       | CodeMirror 6, likely through a thin React wrapper such as `@uiw/react-codemirror` or a direct wrapper                          | Monaco for code-heavy power-user source mode                        | Command layer is ours        | CodeMirror is source-faithful, extensible, transaction-based, and lighter than IDE editors |
| Rich/WYSIWYG editor       | Defer                                                                                                                          | Tiptap/Milkdown research later                                      | No in MVP                    | ProseMirror-based editors are powerful but risk Markdown/MDX round-trip drift              |
| Hotkeys                   | A small command registry plus a hook/library such as TanStack Hotkeys or react-hotkeys-hook                                    | app-level keydown manager if dependency is too immature             | Registry yes, key parsing no | Shortcuts must be centralized and inspectable                                              |
| Native open folder/file   | Tauri dialog plugin through Rust/Tauri command boundary                                                                        | OS-specific Rust only if plugin is insufficient                     | No                           | Native file dialogs are provider/native concerns                                           |
| Open external files/URLs  | Tauri opener plugin through command boundary                                                                                   | Rust OS opener helper                                               | No                           | Avoid direct browser shell assumptions                                                     |
| App/session state         | Tauri window-state and store plugins plus Rust-owned session model                                                             | Rust file in app data dir                                           | State machine yes            | Persistence mechanics are solved; exact restore semantics are ours                         |
| Credentials               | Tauri Stronghold or OS keychain strategy later                                                                                 | provider-specific secure storage later                              | No secret storage custom     | Never store secrets in source or frontend fixtures                                         |
| Filesystem writes         | Rust std/tokio filesystem through core operations; frontend fs plugin only where scoped and justified                          | Tauri fs plugin with narrow scope                                   | Source writes are ours       | Frontend should not receive broad filesystem power                                         |
| Preview surface           | iframe/webview-style rendered route preview in GUI                                                                             | external browser preview for early debug                            | Preview orchestration yes    | Must show true generated route, not approximate Markdown                                   |
| Testing                   | Playwright for GUI flows, axe for a11y, Rust fixtures for operation parity                                                     | Tauri WebDriver later                                               | No                           | Existing repo already uses browser and Rust checks                                         |

## Editor Decision

Choose CodeMirror 6 for the MVP.

Why:

- It edits source text directly.
- Its state is immutable and transaction-based.
- It has extension points for keymaps, lint, tooltips, decorations, and
  language support.
- It can preserve Markdown/MDX source instead of converting to a rich-text
  document model.
- It is suitable for toolbar/context-menu commands that operate on selections.

Do not use Tiptap or Milkdown for the MVP's primary editor. They may be strong
future candidates for WYSIWYG, but the MVP explicitly chooses raw editing plus
preview. ProseMirror/Tiptap's structured document model is a benefit for rich
editing and a liability for source-faithful MDX round-tripping.

Do not use Monaco as the default MVP editor. Monaco is excellent for code-like
editing, but the Studio is an authoring product. Monaco may be useful later for
advanced source view, config editing, or code-heavy MDX escape hatches.

## React And Astro Decision

Use Astro for the app shell and static packaging. Add React only for the
interactive Studio workspace.

Rules:

- Do not migrate the public site to a React app.
- Do not make Astro own mutable app state.
- Keep the Studio React surface behind `apps/studio`.
- Keep domain state in operation-shaped fixtures and future Rust/Tauri
  operation results.
- Use Astro pages/layouts to mount the shell and React app, not to duplicate
  editor logic.

## shadcn/Radix Decision

Use shadcn/Radix for standard interactive primitives:

- Button
- Sidebar
- Resizable
- Tooltip
- Dialog
- AlertDialog
- ContextMenu
- DropdownMenu
- Menubar
- Command
- Field/Input/Select/Switch/Checkbox/Textarea
- ScrollArea
- Separator
- Badge
- Skeleton
- Toast/Sonner

Project rule:

> We own the component source, but we do not own solved interaction mechanics.

If a shadcn component is too broad, use direct Radix or React Aria primitives
rather than hand-rolling focus, keyboard, aria, portal, resize, or menu logic.

## What We Should Hand-Roll

Hand-roll the domain layer:

- Studio operation request/result adapters;
- editor command registry;
- schema descriptor to form section mapping;
- source reference model;
- article tree view model;
- media reference model;
- autosave/checkpoint state machine;
- preview state machine;
- publish plan/confirm/apply state machine;
- capability-to-UI availability rules;
- local author-language diagnostics;
- fixture data shaped like future Rust operations;
- Figma/component token mapping.

These are product/compiler concepts, not generic UI infrastructure.

## What We Should Not Hand-Roll

Do not hand-roll:

- modal focus traps;
- context menus;
- tooltips;
- dropdown menus;
- command palette filtering;
- resizable split panes;
- native file dialogs;
- secret storage;
- tree keyboard navigation if full tree semantics are required;
- editor text selection/range transaction primitives;
- toast stack mechanics;
- form control accessibility primitives.

Do not port visual-reference prototype code into the product. Rebuild the product using
the selected Astro/React/shadcn/Radix/lucide/CodeMirror/Tauri architecture so
the GUI stays aligned with accessibility, testability, and operation-contract
boundaries.

## Risks And Mitigations

| Risk                                               | Mitigation                                                                                                            |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| React app grows into a parallel CMS model          | Keep all domain data operation-shaped and fixture-backed                                                              |
| shadcn components introduce bundle bloat           | Install only needed components; avoid large blocks; measure later                                                     |
| Tree dependency is overkill for simple sidebar     | Start with React Aria Tree if true tree semantics are needed; otherwise use shallow grouped list in fixture prototype |
| CodeMirror commands become string hacks            | Centralize editor actions as typed commands over selections                                                           |
| Tauri plugins grant too much power                 | Add only narrow capabilities; prefer Rust core operations for source writes                                           |
| Tooltip/context menu behavior becomes pointer-only | Require keyboard equivalents and visible command palette coverage                                                     |
| Figma spec drifts from implementation              | Map Figma components to planned shadcn/Radix/Studio components                                                        |

## Acceptance Criteria

The dependency decisions are ready when:

1. every MVP UI need has a recommended dependency or explicit hand-roll reason;
2. source-backed references are listed;
3. accessibility, keyboard behavior, maintenance, bundle, license, theming,
   and Tauri/Astro compatibility have been considered;
4. no solved infrastructure is assigned to custom implementation without a
   product-specific reason;
5. no dependency is asked to own platform domain policy.
