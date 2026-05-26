# Rust Workspace

This repository now has an additive Rust workspace for the future platform
core, CLI, MCP, and Tauri studio backend. Rust does not replace the existing
Bun/Astro site pipeline yet. A Rust command may replace an existing Bun or
TypeScript command only after a later parity milestone proves equivalent
behavior and updates the documented command owner.

## Daily Commands

Use `just --list` as the command index.

```sh
just --list
just rust-check
just check-fast
just check
```

The current ownership model is:

- `bun run <script>` remains the source of truth for existing Astro, content,
  build, browser, accessibility, performance, and release checks.
- `cargo` owns direct Rust crate formatting, type checks, lints, and tests.
- `just` is only orchestration. Do not put domain logic in the `justfile`.

## Workspace Layout

| Path                             | Purpose                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| `Cargo.toml`                     | Root Rust workspace, shared package metadata, workspace dependencies, and lint policy. |
| `Cargo.lock`                     | Locked Rust dependency graph. Commit it because the repo ships binaries/tools.         |
| `rust-toolchain.toml`            | Pinned Rust toolchain and required components.                                         |
| `deny.toml`                      | Initial `cargo-deny` supply-chain policy. Review-only until promoted.                  |
| `justfile`                       | Local command router over Bun and Cargo commands.                                      |
| `crates/tpm-core/`               | Shared domain primitives such as severity and command exit categories.                 |
| `crates/tpm-diagnostics/`        | Structured diagnostic codes, diagnostics, and reports.                                 |
| `crates/tpm-workspace/`          | Workspace and site-instance path modeling.                                             |
| `crates/tpm-cli/`                | Additive CLI shell that proves the binary boundary.                                    |
| `tests/fixtures/rust-workspace/` | Neutral site-like fixture for Rust workspace and future operation tests.               |

## Blocking Rust Gates

`just rust-check` runs the current blocking Rust gates:

```sh
cargo fmt --all --check
cargo check --workspace --all-targets --all-features --locked
cargo clippy --workspace --all-targets --all-features --locked -- -D warnings
cargo test --workspace --doc --all-features --locked
cargo test --workspace --all-features --locked
```

These gates are intentionally strict and low-noise. The workspace forbids
unsafe Rust, treats Clippy warnings as blocking during the gate, and avoids
blanket experimental lint groups that would make routine edits noisy.

## Review-Only Rust Tools

These commands are useful signals, but they are not part of `just rust-check`
or the current release gate:

```sh
just rust-coverage
just rust-deny
just rust-nextest
```

`rust-coverage` uses `cargo llvm-cov` and `llvm-tools-preview` when both are
available. `rust-deny` and `rust-nextest` print install guidance if their Cargo
subcommands are not installed. Promote a review-only Rust tool to a blocking
gate only after it is installed in the shared environment, documented,
low-noise, and represented in the CI/local parity model.

## Fixture Policy

`tests/fixtures/rust-workspace/` is a source fixture for Rust tests, not a copy
of the production site.

- Keep it generic and free of TPM publication branding.
- Add the smallest source files needed to prove a platform contract.
- Update fixture notes and assertions together when the fixture shape changes.
- Add separate invalid fixtures for diagnostic tests instead of breaking the
  default valid fixture.

## Migration Policy

Early Rust crates should model stable platform domains with explicit seams:
diagnostics, workspace discovery, source inventory, route policy, media
policy, generated-output inspection, QA reports, and release artifacts.

Rules for future migrations:

1. Keep Astro rendering, browser behavior, and existing Bun scripts as the
   source of truth until parity is proven.
2. Add Rust operations behind tests and fixtures before wiring them into
   command routers.
3. Dual-run old and new implementations for behavior-sensitive migrations.
4. Promote one command owner at a time, with docs and release checks updated in
   the same change.
5. Keep CLI, MCP, Tauri, CI, and future studio workflows on shared Rust
   operation contracts instead of parallel source models.
