# Studio Frontend Operation Types

This document defines the `IRK-186` strategy for connecting the first Astro
studio frontend shell to Rust-owned operation result shapes.

## Goal

The studio frontend should render the same operation envelopes that the CLI,
future Tauri commands, MCP tools, CI reports, and fixtures consume. The GUI may
own presentation view models, layout, labels, and component state, but it must
not define a parallel operation request, result, diagnostic, source, artifact,
or provider model.

## Current Slice

The current read-only shell does not have live Tauri commands yet. Until
`IRK-187` binds real commands, the frontend consumes a local JSON fixture that
uses the Rust `tpm-operations::OperationResult` shape:

```text
apps/studio/src/data/read-only-operation.json
  schemaVersion
  request.operationId
  request.interface
  request.workspace
  status
  summary.title
  summary.details
  timing.durationMs
  diagnostics.diagnostics[]
```

The companion TypeScript module may import that JSON and expose inferred types
from the literal fixture. It must not re-declare the operation envelope as a
hand-maintained TypeScript interface.

## Why Validation Instead Of Generated Bindings Now

There are two reasonable approaches:

1. Generate TypeScript bindings from Rust types.
2. Validate frontend fixtures against Rust-owned JSON contracts and infer
   TypeScript types from the checked fixture.

Generated bindings are the likely long-term direction once the operation model
has richer studio-specific result types. For this first read-only shell, the
fixture is intentionally small and static. Validating it directly against
`tpm-operations` gives us a strict contract now without adding a premature code
generation pipeline.

This is an explicit staged decision, not a lower standard. `IRK-187` and later
operation bindings should revisit generated bindings or JSON Schema generation
when live commands and multiple result shapes exist.

## Required Invariants

1. The Rust operation crate remains the source of truth for the operation
   envelope.
2. The frontend fixture must deserialize into `tpm_operations::OperationResult`.
3. The fixture must round-trip through Rust serialization without unknown
   fields, accidental frontend-only fields, or naming drift.
4. The serialized `status` must match `OperationStatus::from_report`.
5. The request interface for this shell fixture must be `gui`.
6. Components may derive UI labels and panels from the operation envelope, but
   they may not reintroduce source roots, artifacts, diagnostics, or status as
   independent GUI contracts.
7. The app remains component-first Astro/Tailwind. The page composes focused
   panels; it does not own operation-rendering logic directly.

## Frontend Boundary

Allowed frontend-owned structures:

- navigation item labels and disabled state;
- local status badge tone labels;
- future-surface placeholder copy;
- layout composition and responsive behavior;
- component props that reference inferred fixture types.

Disallowed frontend-owned structures:

- `StudioOperationResult` interfaces that duplicate Rust fields;
- GUI-only diagnostic, source root, artifact, workflow, provider, or credential
  models;
- hard-coded operation status rules that disagree with Rust diagnostics;
- mutation-shaped fixture fields such as write, publish, credential, rollback,
  or provider-apply data.

## Verification

`IRK-186` is complete when:

1. the frontend consumes a JSON operation fixture rather than a hand-maintained
   operation interface;
2. a Rust integration test parses and round-trips that fixture through
   `tpm-operations`;
3. focused configuration tests reject obvious parallel-model regressions;
4. `just studio-build` succeeds;
5. `just studio-tauri-build --debug --no-bundle --ci` succeeds;
6. Rust checks pass;
7. docs explain the staged validation approach and the future generated-binding
   handoff.

## Handoff

`IRK-187` should replace the local fixture with read-only Tauri commands that
return the same operation envelope shape. `IRK-188` should render live status
and diagnostics by swapping the data source, not by changing the frontend's
domain model. `IRK-189` compares GUI and CLI fixture behavior over the same
Rust operation results; see
[STUDIO_CLI_GUI_PARITY.md](./STUDIO_CLI_GUI_PARITY.md).
