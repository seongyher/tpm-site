# CLI, Tauri, MCP, And Just Architecture

This document applies the Rust migration to the product interfaces: CLI,
future Tauri studio, MCP, CI, and local developer commands.

## Architecture Thesis

The Rust core should expose operations. Interfaces should render operations.

```text
Rust operation crates
  -> CLI renderer
  -> Tauri command bindings
  -> MCP tools/resources
  -> CI and just recipes
  -> tests and fixtures
```

This prevents the CLI, GUI, MCP, and CI from each inventing a different model
for content, media, workflow, diagnostics, releases, and publishing.

## Operation Model

Every durable operation should have:

- typed request;
- typed result;
- stable diagnostic list;
- stable machine-output schema;
- human renderer;
- dry-run or plan mode when mutating;
- capability checks before provider-specific actions;
- fixture coverage.

Example operation shape:

```rust
pub struct CheckSiteRequest {
    pub workspace: WorkspaceRef,
    pub profile: CheckProfile,
    pub output: OutputSelection,
}

pub struct CheckSiteResult {
    pub diagnostics: DiagnosticReport,
    pub checked_surfaces: Vec<CheckedSurface>,
    pub summary: CheckSummary,
}
```

The CLI should parse flags into `CheckSiteRequest`. The Tauri app should build
the same request from GUI state. The MCP server should build the same request
from a tool call.

## Operation Readiness Levels

Use these levels to decide whether an operation is ready for CLI, MCP, Tauri,
or CI exposure.

1. **Internal operation.**
   - Rust function exists and is tested, but output is not public.
   - Safe for unit tests and internal composition.
2. **Report operation.**
   - Human and JSON renderers exist.
   - Safe for CLI review commands and CI artifacts.
3. **Plan operation.**
   - Operation can describe intended mutations or provider changes without
     applying them.
   - Safe for GUI previews, MCP proposals, and CI review.
4. **Apply operation.**
   - Operation can mutate source or provider state after explicit approval.
   - Requires rollback/recovery notes, capability checks, and stronger tests.
5. **Public operation.**
   - Operation is stable enough for documented CLI/MCP/Tauri use and versioned
     machine output.
   - Requires compatibility notes and migration policy before breaking changes.

Default rule: expose read/report operations early; expose apply operations only
after plan output and diagnostics are mature.

## CLI Design Implications

The CLI command tree should stay domain-oriented:

```text
tpm site ...
tpm content ...
tpm media ...
tpm source ...
tpm workflow ...
tpm check ...
tpm doctor ...
tpm preview ...
tpm build ...
tpm release ...
tpm publish ...
tpm import ...
tpm export ...
tpm extension ...
tpm adapter ...
tpm mcp ...
```

Implementation rules:

- `clap` structs/enums model command syntax.
- command handlers contain almost no business logic;
- shared flags are flattened structs;
- output flags are consistent across commands;
- all machine output has a `schemaVersion`;
- interactive prompts are wrappers over explicit flags/plans;
- dangerous commands are plan/apply by default.

Shared flags:

```text
--site <path>
--profile <name>
--format human|json
--quiet
--color auto|always|never
--no-progress
--plan <path>
--apply
```

Stable exit code model:

- `0`: success;
- `1`: diagnostics contain blocking errors;
- `2`: command usage/configuration error;
- `3`: provider/environment failure;
- `4`: operation cancelled or not applied;
- `5`: internal bug or invariant violation.

The exact values can change before implementation, but they must be stable once
published.

## CLI Implementation Issue Order

The CLI should not begin with every command family. Build a narrow vertical
slice that proves the architecture.

1. **Command skeleton.**
   - `tpm --help`, version output, shared output flags, and exit-code mapping.
2. **Workspace status.**
   - `tpm site status --format json` over the workspace operation.
3. **Diagnostics check.**
   - `tpm check` over the diagnostic report envelope.
4. **Doctor explanation.**
   - `tpm doctor` over the same diagnostics with richer remediation output.
5. **Report artifacts.**
   - `tpm report show` or equivalent only after release/report artifacts
     exist.
6. **Plan/apply commands.**
   - media migration, publish, repair, import, and source edits only after plan
     operations exist.

Acceptance for each command:

- help text is tested;
- JSON output is snapshot-tested;
- human output is concise and source-mapped;
- exit code matches the stable policy;
- no command handler owns domain logic.

## Tauri Studio Reuse

Tauri is a good fit because it pairs a web frontend with a Rust backend. The
frontend should own UI, editor state, and interaction. The backend should own
source access, diagnostics, media, plans, release reports, provider adapters,
and publishing operations.

Recommended Tauri layout:

```text
apps/studio/
  package.json
  src/
    routes-or-components/
    editor/
    diagnostics/
    generated-types/
  src-tauri/
    Cargo.toml
    tauri.conf.json
    capabilities/
    src/
      lib.rs
      commands/
```

Tauri command bindings should be thin:

```rust
#[tauri::command]
async fn diagnostics_run(request: CheckSiteRequest) -> Result<CheckSiteResult, StudioError> {
    tpm_operations::check_site(request).await.map_err(Into::into)
}
```

Rules:

- no site parsing in frontend code;
- no source writes without an operation plan;
- no broad filesystem permissions;
- no hidden provider actions;
- all long work emits progress events or is cancellable;
- all command request/response types are generated from Rust or shared schemas.

Tauri capabilities should be minimal:

- local file access only to selected site/media/workspace roots;
- shell access only for explicit provider/build adapters;
- network access only for configured provider adapters;
- no global "allow everything" capability.

Tauri work should not start by building editor screens. The first useful Tauri
proof is a command-binding spike that calls the same workspace/diagnostic
operations as the CLI and renders their typed results in a minimal frontend.

## MCP Reuse

The MCP server should expose the same operations to agents. It should not
become a privileged hidden editor.

MCP should start after read/report operations are stable. Write tools should
wait until plan/apply semantics, source-diff output, and audit logging are
implemented for the same operation in the CLI.

Initial MCP tools should be read-heavy:

- `site_status`;
- `run_check`;
- `run_doctor`;
- `inspect_route`;
- `inspect_media`;
- `list_diagnostics`;
- `create_release_plan`;
- `explain_diagnostic`.

Mutating tools should require plan/apply and explicit confirmation semantics:

- `plan_content_edit`;
- `apply_plan`;
- `plan_media_migration`;
- `plan_publish`;
- `apply_publish`.

MCP resources should expose:

- route registry;
- diagnostic report;
- source artifact manifest;
- release manifest;
- generated-output report;
- config schema;
- extension manifest schema.

## Just Command Layer

`just` should be the human-friendly command router for the repo.

It should answer:

- "What do I run locally?"
- "What is the fast check?"
- "What is the release check?"
- "How do I run Rust checks?"
- "How do I keep JS/Astro checks working during migration?"

It should not answer:

- "How does site doctor validate routes?"
- "How does media migration work?"
- "How does publish choose a provider?"

Those are platform/CLI questions.

Recommended first `justfile` shape:

```just
default:
    just --list

setup:
    bun install
    cargo fetch

check-fast:
    bun --silent run check:fast
    just rust-check

check:
    bun --silent run check
    just rust-check

release-check:
    bun --silent run check:release
    just rust-check

fix:
    bun run fix
    cargo fmt --all

rust-check:
    cargo fmt --all --check
    cargo check --workspace --all-targets --all-features --locked
    cargo clippy --workspace --all-targets --all-features --locked -- -D warnings
    RUSTDOCFLAGS="-D warnings" cargo doc --workspace --all-features --no-deps --document-private-items --locked
    cargo test --workspace --doc --all-features --locked
    cargo test --workspace --all-features --locked
    cargo deny check

rust-test:
    cargo test --workspace --doc --all-features --locked
    cargo test --workspace --all-features --locked

rust-coverage:
    cargo llvm-cov --workspace --all-features --summary-only

rust-audit:
    cargo deny check
    cargo audit
```

The first real `justfile` should account for commands that do not exist yet by
adding Rust recipes only after the workspace lands.

`just` recipe changes should be treated as developer UX changes. Each recipe
should document whether it is fast-local, release, review-only, mutating, or
external. This keeps it aligned with the existing QA command registry.

## Bun During Migration

Bun remains necessary for:

- Astro;
- package dependency management;
- TypeScript tests and scripts;
- Playwright/a11y/perf tests;
- Tailwind and frontend tooling.

The target is not "remove Bun immediately." The target is:

- Bun owns JS/Astro ecosystem execution.
- Cargo owns Rust crates and binaries.
- `just` owns human command discovery.
- `tpm` owns platform/product operations.

## CLI To GUI Bridge

The CLI and GUI should not communicate by scraping CLI output. They should both
use the operation crates.

Acceptable uses of CLI from GUI:

- support/debug logs;
- external user automation;
- running a sidecar binary in advanced packaging if operation crates cannot be
  linked directly for a specific platform.

Preferred architecture:

- Rust crates expose operations.
- CLI binary links operations.
- Tauri backend links operations.
- MCP binary links operations.

## Installation And Distribution

Early internal use:

- build with Cargo from source;
- run through `just` and CI.

External CLI beta:

- prebuilt binaries for macOS, Linux, and Windows;
- shell completions;
- generated command docs;
- install scripts only after supply-chain policy is defined.

Stable CLI:

- signed binaries;
- release checks;
- published crate only if the public API is ready;
- semver checks for public crates.

Future studio:

- Tauri bundles;
- auto-update strategy decided later;
- provider credential storage and OS keychain integration treated as a
  security design milestone.

## Design Recommendations

1. Build Rust operation crates first, not a standalone CLI implementation.
2. Add `just` as the repo command router early.
3. Keep Bun scripts as implementation commands until Rust parity exists.
4. Make every command's JSON output an API from the first version.
5. Make Tauri commands call the operation crates directly.
6. Make MCP read-only first, then plan/apply for mutations.
7. Keep provider-specific work behind adapters.
8. Do not let GitHub, Cloudflare, Astro, or repo-local media become core
   product assumptions.
