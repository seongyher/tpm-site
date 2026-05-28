# Studio CLI/GUI Parity

This document defines the `IRK-189` parity guard for the first read-only Studio
GUI slice.

## Goal

The CLI and GUI should behave as thin interfaces over the same Rust operation
envelope. They may differ in presentation and request metadata, but they must
not invent separate source, diagnostic, provider, or workspace models.

## Current Fixture Contract

The shared operation fixture is:

- `tests/fixtures/rust-operations/workspace-status-warning.json`

The Studio fallback fixture is:

- `apps/studio/src/data/read-only-operation.json`

The Studio fixture must remain an exact GUI projection of the shared operation
fixture. The only intentional difference is:

- `request.interface` is `test` in the shared fixture;
- `request.interface` is `gui` in the Studio fixture.

Every other field should match exactly. This gives the static browser preview a
deterministic operation result with diagnostics while keeping the GUI tied to
the same envelope used by CLI JSON output and Rust tests.

## Test Ownership

The parity guard has two sides:

1. `crates/tpm-cli/src/lib.rs` deserializes the shared fixture into
   `OperationResult` and verifies the CLI JSON renderer emits the exact same
   JSON.
2. `apps/studio/src-tauri/tests/frontend_operation_fixture.rs` deserializes the
   Studio fixture into `OperationResult` and verifies it matches the shared
   fixture after changing only `request.interface` to `gui`.

These tests intentionally compare operation envelope data, not DOM layout,
terminal colors, button positions, or prose outside the operation fixture.

## Non-Goals

This parity slice does not prove authoring, preview, publish, provider,
credential, media, or editor behavior. Those operations need their own shared
fixtures once the underlying Rust operation exists.

The Studio GUI still renders a static fallback in browser preview and invokes
live Tauri commands only inside the desktop shell. Live command tests remain
owned by `apps/studio/src-tauri/src/commands.rs`.

## Future Expansion

When new operation families are added, create or promote a shared Rust
operation fixture first. Then add interface checks that prove CLI, GUI, MCP,
and CI consume or render the same canonical result with only documented
presentation or permission differences.
