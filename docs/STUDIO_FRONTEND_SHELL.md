# Studio Frontend Shell

This document defines the first read-only Astro studio frontend shell for
Linear `IRK-184`. It is the implementation design for the static GUI shell that
later Tauri commands will package and hydrate with shared Rust operation
results.

## Goal

Create a static Astro app under `apps/studio/` that demonstrates the future
studio product shape without introducing a second CMS/source model. The shell
started by rendering read-only workspace status and diagnostics, then
Milestone 12 extended it with operation-backed authoring, preview, release,
publish-gate, rollback, credential, audit, and verification surfaces from
shared Rust operation results. It should be easy to package in Tauri, but it
must not require live credentials or providers to run.

## Non-Goals

This slice does not:

1. edit content, config, media, routes, or generated output;
2. connect credentials or provider accounts;
3. publish, rollback, deploy, or run workflow actions without a shared
   plan/apply operation;
4. parse source files in the browser;
5. define a separate GUI diagnostic or source model;
6. add package.json scripts.

## App Boundary

The studio shell lives in:

```text
apps/studio/
  astro.config.mjs
  src/
    components/
    data/
    layouts/
    pages/
    styles/
```

The app is static and uses the same component-first Astro/Tailwind standards as
the deployed site. It may import local fixture data and UI helpers, but it must
not depend on the TPM production `site/` instance as its source of truth. Later
Tauri bindings should replace fixture data with operation results from the
Rust core.

## Component Architecture

The shell should be built from focused Astro components:

- `StudioAppBar`: product title, skip link, and operation status.
- `StudioNavigation`: read-only top-level surface navigation.
- `StudioSummaryPanel`: operation summary and workspace overview.
- `OperationDetailsPanel`: Rust operation schema, timing, status, and summary
  detail lines.
- `OperationRuntimePanel`: Tauri command controls, loading/error states, and
  operation diagnostics over shared Rust operation envelopes.
- `StudioAuthoringPanel`: operation-backed settings, content, media, preview,
  release, publish, credential, audit, rollback, and verification surfaces.

Pages should compose these components; they should not own layout or operation
rendering logic directly.

## Data Model

The shell uses a local JSON fixture shaped as the Rust
`tpm-operations::OperationResult` envelope:

- schema version;
- request operation ID, interface, and workspace;
- derived status;
- summary title and detail lines;
- timing;
- diagnostic report with severity, location, message, and remediation.

The status fixture is intentionally read-only and local to the app. It is a UI
contract sample, not a source model. `IRK-186` adds Rust validation that
deserializes and round-trips the fixture through `tpm-operations`, preventing a
separate GUI diagnostic, source-root, artifact, or status model from drifting
away from the shared operation contract. `IRK-189` tightens this by requiring
the fallback fixture to be a GUI projection of the shared Rust operation
fixture, as documented in
[STUDIO_CLI_GUI_PARITY.md](./STUDIO_CLI_GUI_PARITY.md).

Milestone 12 adds `authoring-operation.json`, another Rust-validated fixture
that uses the same envelope and the `studio-authoring` payload. It represents
the first authoring/product workflow slice without giving the browser a second
CMS source model.

## Layout

The first screen should communicate the product direction:

1. top application bar with product name and read-only status;
2. left navigation for surfaces: Overview, Diagnostics, Settings, Content,
   Media, Preview, Publish, Audit, Verification;
3. main status area with workspace health and operation details;
4. diagnostics panel with severity, source/artifact reference, and remediation;
5. operation-backed panels for editor, media, preview, publish, settings,
   credentials, audit, rollback, and verification state.

The design should be quiet and operational, not a marketing page. It should
favor dense but readable information, clear hierarchy, and predictable
navigation.

## Responsive Behavior

- The shell is mobile-safe but optimized for desktop, because the future Tauri
  app is desktop-first.
- On narrow widths, navigation becomes a horizontal scroll region above the
  content.
- Main content stacks into one column.
- Cards and panels use stable spacing and avoid nested card-on-card layouts.
- Long source paths, diagnostics, and remediation text wrap without overflow.

## Accessibility

- Use semantic landmarks: header, nav, main, section, aside where appropriate.
- Use visible headings for each surface.
- Mark unavailable or gated actions with text and disabled state, not hidden
  controls.
- Preserve keyboard navigation through links/buttons.
- Use status text plus color; do not rely on color alone.

## Verification

`IRK-184` is done when:

1. `just studio-build` builds static output into `dist/studio`;
2. `just studio-dev` and `just studio-preview` are discoverable command-router
   recipes;
3. the app has no package scripts;
4. the shell uses fixture-shaped operation data and no source mutation logic;
5. tests or config checks cover the app boundary and command surface;
6. docs are linked from the related Linear issue.

## Handoff To Later Issues

- `IRK-185` packages this static app in Tauri with minimal capabilities.
- `IRK-186` validates the frontend fixture against Rust-owned operation result
  shapes.
- `IRK-187` binds read-only Tauri commands.
- `IRK-188` renders live status and diagnostics from those command results.
- `IRK-189` proves CLI and GUI fixture parity.
- `IRK-190` through `IRK-196` add the first operation-backed authoring,
  preview, release, publish, credential, audit, rollback, and verification
  surfaces. That slice is documented in
  [STUDIO_AUTHORING_OPERATIONS.md](./STUDIO_AUTHORING_OPERATIONS.md).
