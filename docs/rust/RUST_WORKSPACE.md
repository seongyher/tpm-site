# Rust Workspace

This repository has an additive Rust workspace for the future platform core,
CLI, MCP, and Tauri studio backend. `just` is the canonical human command
router for repository workflows. Bun remains the package manager, JavaScript
test runner, and adapter for Astro/browser ecosystem tools where Rust is not
the right boundary.

## Daily Commands

Use `just --list` as the command index.

```sh
just --list
just fix
just rust-check
just check-fast
just check
just release-check
```

`just fix` is the single automatic-fix command. It runs ESLint fixes,
Prettier code/config formatting, package sorting, Markdownlint fixes,
Markdown/MDX formatting, Rust formatting, and Clippy's machine-applicable
fixes.

The additive `tpm` CLI can be exercised through Cargo or the `just` command
router:

```sh
cargo run --package tpm-cli --bin tpm -- --help
cargo run --package tpm-cli --bin tpm -- site status --format json
just cli --help
just cli site status --format json
```

The current CLI slice supports `tpm --help`, `tpm --version`,
`tpm site status`, `tpm site doctor`, `tpm check`, `tpm doctor`,
`tpm media images`, `tpm routes redirects`, `tpm release inspect`, and
`tpm adapters inspect`. These commands are product-interface proofs over Rust
operation contracts.

Repository maintenance automation is intentionally not exposed as `tpm`
commands. Focused `just` recipes call the internal `tpm-xtask` binary when a
Rust adapter is needed for build, QA, generated-output, or migration plumbing.

The current ownership model is:

- `just <recipe>` is the source of truth for repository workflow commands.
- `tpm-xtask` owns internal repository maintenance adapters behind focused
  `just` recipes; it is not a public product CLI.
- `cargo` owns direct Rust crate formatting, type checks, lints, and tests.
- Bun owns dependency installation, JS tests, `bun audit`, and the retained
  TypeScript PDF-generation exception behind `just build-pdf`.
- Astro, Playwright, Vitest, Prettier, ESLint, Markdownlint, Lighthouse CI,
  Wrangler, and Gitleaks remain ecosystem adapters behind focused `just`
  recipes.
- Do not put domain logic in the `justfile`.

## Workspace Layout

| Path                              | Purpose                                                                                |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `Cargo.toml`                      | Root Rust workspace, shared package metadata, workspace dependencies, and lint policy. |
| `Cargo.lock`                      | Locked Rust dependency graph. Commit it because the repo ships binaries/tools.         |
| `rust-toolchain.toml`             | Pinned Rust toolchain and required components.                                         |
| `rustfmt.toml`                    | Explicit stable Rust formatting policy.                                                |
| `deny.toml`                       | Blocking `cargo-deny` supply-chain policy.                                             |
| `justfile`                        | Local command router over Rust operations and JS/Astro ecosystem adapters.             |
| `crates/tpm-core/`                | Shared domain primitives such as severity and command exit categories.                 |
| `crates/tpm-diagnostics/`         | Structured diagnostic codes, diagnostics, and reports.                                 |
| `crates/tpm-workspace/`           | Workspace and site-instance path modeling.                                             |
| `crates/tpm-operations/`          | Shared operation request/result envelopes and stable renderers.                        |
| `crates/tpm-cli/`                 | Additive CLI shell and first command grammar over operation contracts.                 |
| `crates/tpm-mcp/`                 | Transport-agnostic read-only MCP resource and safety contracts over operation results. |
| `crates/tpm-xtask/`               | Internal repository automation adapters invoked by focused `just` recipes.             |
| `tests/fixtures/rust-workspace/`  | Neutral site-like fixture for Rust workspace and future operation tests.               |
| `tests/fixtures/rust-operations/` | Stable machine-output fixtures for operation envelope compatibility tests.             |

## Blocking Rust Gates

`just rust-check` runs the current blocking Rust gates:

```sh
cargo fmt --all --check
cargo check --workspace --all-targets --all-features --locked
cargo clippy --workspace --all-targets --all-features --locked -- -D warnings
RUSTDOCFLAGS="-D warnings" cargo doc --workspace --all-features --no-deps --document-private-items --locked
cargo test --workspace --doc --all-features --locked
cargo test --workspace --all-features --locked
cargo deny check
```

These gates are intentionally strict. The workspace forbids unsafe Rust,
promotes compiler and rustdoc warnings to blocking failures, denies public API
documentation gaps, requires crate-level Rust docs, blocks broken or invalid
doc links/snippets, runs Clippy with `all`, `cargo`, `pedantic`, `nursery`, and
selected high-signal restriction lints, and treats Clippy warnings as blocking
during the gate. The supply-chain gate rejects denied advisories, yanked
crates, wildcard dependencies, disallowed licenses, and unknown registries or
git sources.

Some Clippy `restriction` lints are intentionally not enabled globally because
the group includes lints that conflict with idiomatic Rust, normal test
failure patterns, or CLI adapter needs. Add any lint escape locally, narrowly,
and with a concrete reason.

GitHub Actions runs the same gate in the blocking `Rust` job through
`just rust-check`. Use `just rust-*` or direct `cargo` commands for Rust work.
Install the local supply-chain tool with:

```sh
cargo install cargo-deny --locked
```

## Review-Only Rust Tools

These commands are useful signals, but they are not part of `just rust-check`
or the current release gate:

```sh
just coverage-rust
just rust-nextest
```

`coverage-rust` uses `cargo llvm-cov` and `llvm-tools-preview` when both are
available. `rust-nextest` prints install guidance if its Cargo subcommand is
not installed. Promote a review-only Rust tool to a blocking gate only after it
is installed in the shared environment, documented, low-noise, and represented
in the CI/local parity model.

GitHub Actions also runs `just coverage-rust` in a non-blocking
`Rust coverage review` job. The job installs `cargo-llvm-cov` and
`llvm-tools-preview` for CI evidence, but coverage remains informational.

Current policy decisions:

- `cargo test` remains the blocking Rust test runner because it is installed
  with the pinned Rust toolchain and is enough for the current small crate set.
- `cargo-nextest` remains review-only until the workspace needs retries,
  partitions, JUnit output, or timeout profiles.
- `cargo-deny` is blocking. The policy allowlist is intentionally narrow and
  should only grow when a dependency with a new license is deliberately
  accepted.
- Rust coverage remains review-only and should be used to inspect meaningful
  operation-core gaps before any percentage threshold is considered.

## Fixture Policy

`tests/fixtures/rust-workspace/` is a source fixture for Rust tests, not a copy
of the production site.

- Keep it generic and free of TPM publication branding.
- Add the smallest source files needed to prove a platform contract.
- Update fixture notes and assertions together when the fixture shape changes.
- Add separate invalid fixtures for diagnostic tests instead of breaking the
  default valid fixture.

`tests/fixtures/rust-operations/` stores exact JSON fixtures for
machine-readable operation contracts. Keep those fixtures stable and exact.
Human text renderers should usually be tested with focused assertions instead
of full snapshots so wording can improve without breaking machine contracts.

## Operation Contracts

The first operation-core crates now establish the shared contract documented in
[`RUST_OPERATION_CONTRACTS.md`](./RUST_OPERATION_CONTRACTS.md):

- diagnostics have stable codes, severity, source/artifact locations,
  remediation, optional developer notes, human rendering, and JSON rendering;
- workspace context discovers the active site root, source roots, ignored-path
  policy, and deterministic source artifact inventory;
- operation results carry schema version, request metadata, status, summary,
  timing, diagnostics, and stable human/JSON renderers.
- adapter capability reports expose provider-neutral capabilities, credential
  requirements, dry-run support, unavailable-operation diagnostics, and
  adapter boundaries through
  [`RUST_ADAPTER_RUNTIME.md`](./RUST_ADAPTER_RUNTIME.md).

The CLI, future Tauri studio, MCP server, CI reports, and generated-output
diagnostics should consume these contracts instead of inventing interface-local
models.

## Migration Policy

Early Rust crates should model stable platform domains with explicit seams:
diagnostics, workspace discovery, source inventory, route policy, media
policy, generated-output inspection, QA reports, and release artifacts.

Rules for future migrations:

1. Keep Astro rendering, browser behavior, and explicitly retained ecosystem
   adapters as the source of truth for unpromoted domains until parity is
   proven.
2. Add Rust operations behind tests and fixtures before wiring them into
   command routers.
3. Dual-run old and new implementations for behavior-sensitive migrations.
4. Promote one command owner at a time, with docs and release checks updated in
   the same change.
5. Keep CLI, MCP, Tauri, CI, and future studio workflows on shared Rust
   operation contracts instead of parallel source models.
