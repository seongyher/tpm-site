# Studio Read-Only Operation Rendering

This document defines the `IRK-188` rendering boundary for the first live
operation results in the Studio GUI.

## Goal

Render read-only Rust operation results in the Astro/Tauri studio shell while
preserving the same component architecture, Tailwind standards, and shared
operation envelope used by CLI, MCP, CI, and tests.

## Rendering Model

The GUI uses progressive enhancement:

1. Astro renders a validated fixture fallback at build time.
2. The browser controller keeps controls disabled in normal browser preview.
3. Inside Tauri, the controller enables the read-only command buttons.
4. Clicking a command invokes `site_status` or `check_site`.
5. The returned `OperationResult` updates the operation summary, status,
   diagnostics, and empty/error/loading state text.

This keeps the page useful as static HTML and avoids a second browser-side
source model.

## Component Boundary

`OperationRuntimePanel` owns the live read-only operation surface:

- native buttons for keyboard-accessible command triggers;
- an `aria-live` status region for fallback, loading, ready, and error states;
- an error region for command failures;
- an empty diagnostics state;
- rendered operation summary, status, workspace, details, and diagnostics.

The controller in `apps/studio/src/controllers/operation-runtime.ts` owns DOM
updates and Tauri invocation. Astro components stay declarative, and the
controller uses `textContent` and DOM element creation rather than `innerHTML`.

## State Design

The renderer has four explicit states:

| State      | Meaning                                                         |
| ---------- | --------------------------------------------------------------- |
| `fallback` | Browser/static preview is rendering the validated JSON fixture. |
| `loading`  | A read-only Tauri command is running.                           |
| `ready`    | A read-only Tauri command returned an operation result.         |
| `error`    | Tauri invocation failed; the panel keeps the fallback visible.  |

The state helper is a typed union so new states must be named and rendered
explicitly.

## Accessibility

The read-only command controls use native buttons. Buttons are disabled until
the Tauri runtime is detected, so browser preview cannot present a broken
interactive control. The status text uses `role="status"` and `aria-live` to
announce loading, ready, fallback, and error state changes.

Diagnostics render severity, stable code, source/artifact reference when
present, message, and remediation. Severity is visible as text and color.

## Verification

`IRK-188` is complete when:

1. the page renders `OperationRuntimePanel`;
2. the frontend controller imports Tauri `invoke` explicitly through
   `@tauri-apps/api/core`;
3. fixture fallback, loading, ready, error, and empty diagnostics states are
   represented in typed helpers and focused tests;
4. no separate GUI diagnostic model exists;
5. Studio build/typecheck, Tauri debug build, Rust gates, config tests, and
   docs checks pass.

## Handoff

`IRK-189` compares CLI and GUI operation fixture behavior. The GUI is verified
as a renderer of shared operation envelopes, not as a second source of truth for
workspace inspection or diagnostics. The concrete guard is documented in
[STUDIO_CLI_GUI_PARITY.md](./STUDIO_CLI_GUI_PARITY.md).
