# Studio Tauri Read-Only Commands

This document defines the `IRK-187` command boundary for binding the first Rust
operations into the Tauri studio shell.

## Goal

Expose the first read-only Rust operation envelopes to the GUI without creating
a browser-side source parser, a second diagnostic model, or a Tauri-specific
workspace model.

## Commands

The Tauri shell registers two commands:

| Command       | Rust operation            | Interface |
| ------------- | ------------------------- | --------- |
| `site_status` | `run_workspace_status(.)` | `gui`     |
| `check_site`  | `run_workspace_check(.)`  | `gui`     |

The command names are intentionally snake case because Tauri invokes command
functions by their Rust function names when commands are defined in a separate
module. The names are GUI adapter names; the serialized operation IDs remain
the Rust operation IDs such as `workspace.status` and `workspace.check`.

## Adapter Boundary

The Tauri command layer is thin:

1. choose the current workspace start path;
2. call the shared Rust operation with `OperationInterface::Gui`;
3. return the serialized `OperationResult` envelope directly to the frontend.

It must not:

1. read source files directly;
2. parse Markdown, config, routes, assets, or generated output in the browser;
3. change diagnostic severities or status derivation;
4. add publish, rollback, credential, provider, shell, or filesystem plugin
   permissions;
5. return a GUI-only command result shape.

## Workspace Assumption

This first binding uses the process current directory as the workspace start
path. In development, `just studio-tauri-dev` runs from `apps/studio`, and the
Rust workspace discovery walks upward to the repository root. In packaged
contexts, this is still a first-slice assumption; future workspace selection
and provider-backed source roots belong in the later workspace/provider
milestones.

Tests call the same adapter helpers with explicit fixture paths so success and
failure behavior do not depend on the developer's current directory.

## Permission Posture

The Tauri v2 command model allows registered commands to be invoked by app
webviews by default, while capabilities control plugin/core permissions and
remote access. This `IRK-187` slice registered only the two read-only commands.
Later Milestone 12 work adds authoring and publish-plan commands, but those
commands still return local Rust operation envelopes and grant no filesystem,
shell, network, credential, provider, publish, or rollback permissions.

Reference:
[Tauri capabilities](https://v2.tauri.app/security/capabilities/) and
[calling Rust from the frontend](https://v2.tauri.app/develop/calling-rust/).

If future slices add more commands, remote windows, plugins, or mutating
operations, the command permission model must be revisited before those
commands become invokable from the frontend.

## Verification

`IRK-187` is complete when:

1. `site_status` and `check_site` are registered through Tauri's
   `invoke_handler`;
2. both commands return Rust `OperationResult` envelopes with `gui` interface
   metadata;
3. Rust tests cover success and diagnostic failure states;
4. focused configuration tests prove command registration and no broad
   permissions;
5. `just studio-tauri-build --debug --no-bundle --ci` succeeds;
6. `just rust-check`, `just typecheck`, `just test-config`, and relevant docs
   checks pass.

## Handoff

`IRK-188` renders these command results in the frontend through the boundary
documented in [STUDIO_READ_ONLY_RENDERING.md](./STUDIO_READ_ONLY_RENDERING.md).
It keeps the same operation envelope shape already validated in `IRK-186`; the
only intended change is the data source.
