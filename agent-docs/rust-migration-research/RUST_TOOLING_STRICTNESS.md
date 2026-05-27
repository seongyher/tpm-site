# Rust Tooling And Strictness Plan

This document recommends Rust tooling, libraries, lints, test strategy, and
adoption timing for the TPM Rust migration.

See
[`RUST_QA_TOOLING_EVALUATION.md`](./RUST_QA_TOOLING_EVALUATION.md) for the
deeper source-checked evaluation of Rust QA/static-analysis tools, blocking
versus review-only adoption states, and staged command profiles.

## Tooling Principles

1. Use Rust's compiler and type system as the first QA layer.
2. Keep strictness maximally high and explainable.
3. Prefer stable toolchain checks for normal CI.
4. Add nightly-only tools only for targeted, non-blocking review jobs.
5. Avoid cargo-tool sprawl until a tool has a clear job in the repo.
6. Treat every public command/report as an API with fixtures and snapshots.
7. Treat omitted compile-time or static-analysis checks as exceptions that need
   concrete justification.

## Required Baseline

### Toolchain

Use `rust-toolchain.toml`.

Recommended initial shape:

```toml
[toolchain]
channel = "stable"
profile = "default"
components = ["rustfmt", "clippy", "llvm-tools-preview"]
```

Rationale:

- `default` includes standard local developer tooling.
- CI can still install a minimal profile explicitly if speed matters.
- `llvm-tools-preview` supports `cargo-llvm-cov`.

### Cargo Workspace

Use a virtual workspace at repo root:

```toml
[workspace]
members = ["crates/*"]
resolver = "3"

[workspace.package]
edition = "2024"
license = "MIT"
repository = "https://github.com/seongyher/tpm-site"

[workspace.lints.rust]
unsafe_code = "forbid"

[workspace.dependencies]
serde = { version = "1", features = ["derive"] }
```

Add `rust-version` when the initial toolchain is selected. It should match the
oldest Rust version the workspace commits to supporting, not an arbitrary
placeholder.

### Formatting

Use `cargo fmt --all --check` in CI and `cargo fmt --all` in local fixes.

Keep an explicit stable `rustfmt.toml` once real Rust code exists. The file
should mostly encode rustfmt defaults plus project choices such as edition,
line width, Unix newlines, shorthand use, import/module reordering, and
explicit ABI formatting. Avoid unstable rustfmt options in normal CI.

### Linting

Required local and CI command:

```text
cargo clippy --workspace --all-targets --all-features --locked -- -D warnings
```

Recommended lint policy:

- compiler warnings, future-incompatible lints, idiom lints, public-doc gaps,
  rustdoc warnings, and missing debug implementations are blocking;
- workspace `unsafe_code = "forbid"` and `unsafe_op_in_unsafe_fn = "deny"`;
- Clippy `all`, `cargo`, `pedantic`, and `nursery` are enabled in normal gates;
- selected restriction lints are enabled for known repo problems;
- local `allow` only with a clear reason;
- no blanket `allow` at crate root without a design note.

Suggested selected Clippy lints:

```toml
[workspace.lints.clippy]
all = { level = "warn", priority = -1 }
allow_attributes_without_reason = "deny"
cargo = { level = "warn", priority = -1 }
dbg_macro = "deny"
expect_used = "deny"
mem_forget = "deny"
nursery = { level = "warn", priority = -1 }
pedantic = { level = "warn", priority = -1 }
print_stdout = "deny"
print_stderr = "deny"
todo = "deny"
unimplemented = "deny"
unwrap_used = "deny"
wildcard_imports = "deny"
```

Nuance:

- Do not enable the whole `restriction` group globally. It contains lints that
  intentionally fight idiomatic Rust, normal tests, or CLI adapter needs.
- `unused_crate_dependencies` should remain out of the blocking policy until
  package layout prevents lib/bin false positives.
- `panic` should remain out of the global policy until tests and invariant
  constructors have a stricter failure strategy.
- `print_stdout` and `print_stderr` are denied by default; CLI output should go
  through explicit writers so commands stay testable.

## Testing Stack

### Unit And Integration Tests

Use standard Rust unit and integration tests for pure logic and crate-level
behavior.

Run:

```text
cargo test --workspace --all-features --locked
cargo test --workspace --doc --all-features --locked
```

### Nextest

Use `cargo-nextest` as the default Rust test runner once Rust test volume,
timeout control, partitioning, or CI reporting needs justify the extra tool.

Run:

```text
cargo nextest run --workspace --all-features --locked
```

Recommended later `nextest.toml` uses:

- CI profile with no fail-fast;
- per-test timeout defaults;
- serial groups for tests that touch global resources;
- JUnit output for CI;
- retries only for explicitly quarantined flaky tests.

### Coverage

Use `cargo-llvm-cov`.

Early command:

```text
cargo llvm-cov --workspace --all-features --summary-only
```

Later commands:

```text
cargo llvm-cov --workspace --all-features --lcov --output-path coverage/rust.lcov
cargo llvm-cov --workspace --all-features --html
```

Coverage policy:

- use coverage to find missing tests, not to reward brittle line chasing;
- require coverage for new pure domains before promotion;
- justify exceptions with the same discipline as current JS coverage
  exceptions.

### Snapshot Tests

Use `insta` for report, diagnostic, JSON, and command output snapshots.

Use snapshots for:

- human diagnostics;
- JSON reports;
- release manifests;
- route and redirect reports;
- generated-output verifier summaries;
- CLI help once the command surface stabilizes.

### CLI Tests

Use:

- `assert_cmd` for focused command assertions;
- `trycmd` for command transcript tests embedded in Markdown/reference docs;
- `predicates` for output matching;
- `assert_fs` or `tempfile` for isolated workspaces.

The CLI docs should be executable where practical.

### Property Tests

Use `proptest` for invariants where examples are not enough:

- route normalization;
- redirect merge/deduplication;
- relative/absolute path normalization;
- glob matching;
- media role selection;
- feature flag/profile merging;
- diagnostic aggregation;
- release manifest round trips.

Property tests should encode invariants, not random implementation trivia.

### Fuzzing

Use `cargo-fuzz` later for parsers/importers:

- BibTeX parsing;
- legacy citation parsing;
- frontmatter/import parsing;
- redirect parsing;
- external migration formats;
- large media manifest inputs.

Fuzz targets should be added when Rust owns these parsers. Do not add fuzzing
for code that is still just shelling out to TypeScript/Astro.

### Mutation Testing

Consider `cargo-mutants` after key pure crates are stable. Use it selectively
for route, diagnostic, media, config, and release-policy crates. Do not put it
in the normal release gate until runtime and noise are understood.

## Supply Chain And Security

### `cargo-deny`

Use `cargo-deny` from the first Rust workspace commit.

Required checks:

- advisories;
- licenses;
- duplicate/banned crates;
- sources.

Initial `deny.toml` policy:

- allow common permissive licenses such as MIT, Apache-2.0, BSD-2-Clause,
  BSD-3-Clause, ISC, and Unicode license variants where needed;
- deny unknown sources;
- warn or deny duplicate versions depending on initial dependency graph;
- explicitly document exceptions.

### `cargo-audit`

Use `cargo audit` in addition to `cargo-deny` if it catches advisories sooner
or fits existing audit conventions. It is simpler and maps directly to RustSec
advisories.

### Unused Dependencies

Use `cargo machete` as a review check after dependencies stabilize.

Do not treat every `cargo machete` finding as automatically correct; it is fast
but intentionally imprecise. Confirm before removing dependencies.

### Semver And Public API

Use `cargo-semver-checks` only when crates become public package candidates or
have stable internal consumers that need API compatibility.

Until then, API shape should be enforced by compile tests, fixture consumers,
and docs.

## Recommended Library Stack

### Core Domain

- `serde`, `serde_json`, and `toml` for typed report/config serialization.
- YAML parser only if existing source contracts require YAML, and only after
  checking current crate maintenance status.
- `schemars` for JSON Schema.
- `thiserror` for library errors.
- `miette` for diagnostics with codes, spans, severity, and help.
- `camino` for UTF-8 paths.
- `url` for URL policy.
- `time` or `jiff` for date/time logic.

### Files And Globs

- `ignore` for Git-aware walking.
- `globset` for compiled glob policies.
- `walkdir` for simple traversal only when Git ignore support is not needed.
- `tempfile` and `assert_fs` for tests.

### CLI

- `clap` with derive.
- `clap_complete` once completions are supported.
- `clap_mangen` once manpages are shipped.
- `anstream` and `anstyle` if CLI coloring needs explicit control.
- `supports-color` or equivalent only if terminal capability handling exceeds
  `miette`/`clap` defaults.

### Output And Reporting

- `insta` for snapshots.
- `serde_json` for machine output.
- `toml` for config.
- `tracing` and `tracing-subscriber` for logs.

### Async And Networking

- Avoid async in core crates.
- Add `tokio` only where provider adapters, MCP, or Tauri need it.
- Add `reqwest` only in provider/network crates.

## Quality Gates By Stage

### Stage 1: Rust Workspace Exists

Blocking:

- `cargo fmt --all --check`
- `cargo check --workspace --all-targets --all-features --locked`
- `cargo clippy --workspace --all-targets --all-features --locked -- -D warnings`
- `RUSTDOCFLAGS="-D warnings" cargo doc --workspace --all-features --no-deps --document-private-items --locked`
- `cargo test --workspace --doc --all-features --locked`
- `cargo test --workspace --all-features --locked`
- `cargo deny check`

Review-only:

- `cargo llvm-cov --workspace --all-features --summary-only`
- `cargo machete`

### Stage 2: Multiple Crates And CLI Exists

Blocking candidates once installed and stable:

- `cargo nextest run --workspace --all-features --locked`
- CLI snapshot tests
- docs command transcript tests

Review-only:

- coverage thresholds or drift reports;
- mutation/fuzz targets for changed parser/policy crates.

### Stage 3: Public/Extracted Crates Exist

Blocking once public or extracted crates exist:

- `cargo doc --workspace --all-features --no-deps`
- rustdoc broken links and warnings as errors;
- `cargo-semver-checks` against published baseline.

Review-only:

- public API snapshots;
- package size and dependency tree reports.

## Documentation Policy For Rust

All public library functions should document:

- what domain concept they represent;
- errors;
- panics if any;
- safety if unsafe is ever introduced;
- examples for stable public APIs.

CLI commands should have:

- concise `--help`;
- longer docs generated from the same command tree;
- machine-output schema docs;
- examples that are tested when practical.

## Adoption Timing

Add immediately with the first Rust workspace:

- Cargo workspace;
- rust-toolchain;
- rustfmt;
- clippy;
- nextest or standard tests;
- cargo-deny;
- cargo-llvm-cov;
- just recipes for Rust checks.

Add when CLI commands exist:

- `assert_cmd`;
- `trycmd`;
- `insta`;
- completions/manpage generation.

Add when parsers/importers exist:

- `proptest`;
- `cargo-fuzz`.

Add when crates are public or package-like:

- rustdoc strict checks;
- `cargo-semver-checks`;
- public API docs/examples;
- release packaging with `cargo-dist` or equivalent.

## Tool Decision States

Use these states when adding tools to Linear. This avoids bikeshedding every
tool during implementation.

| State                          | Meaning                                                                                  | Examples today                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Adopt immediately              | High value, low ambiguity, stable, and useful from the first Rust workspace.             | `rustfmt`, Clippy, Cargo checks, `cargo-deny`, `cargo-llvm-cov`, `nextest` once tests exist |
| Adopt with CLI                 | Valuable once command output exists.                                                     | `trycmd`, `assert_cmd`, `insta`, `clap_complete`, `clap_mangen`                             |
| Adopt with parser/importer     | Valuable when Rust owns input parsing.                                                   | `proptest`, `cargo-fuzz`, targeted Miri or sanitizer jobs                                   |
| Adopt with public crates       | Valuable when APIs become compatibility commitments.                                     | `cargo-semver-checks`, public API snapshots, rustdoc warnings as errors                     |
| Review-only first              | Potentially useful but noisy, slow, nightly-only, or dependent on real dependency graph. | `cargo machete`, mutation testing, cargo-bloat, cargo-geiger, cargo-udeps                   |
| Reject unless evidence changes | Duplicative, abandoned, too noisy, or not aligned with the repo's risk profile.          | To be filled after the deeper Rust tooling research                                         |

## Blocking Versus Review-Only Policy

Default blocking checks should be:

- deterministic;
- low-noise;
- stable-channel friendly;
- quick enough for normal CI;
- directly tied to correctness, security, or release confidence.

Default review-only checks should be:

- experimental;
- slow;
- dependent on nightly;
- high-signal but occasionally false-positive;
- useful for release hardening but too noisy for every edit.

Promotion rule:

1. run review-only for at least one milestone;
2. record failure modes and false positives;
3. document allowed exceptions;
4. promote to blocking only when failures are actionable and rare.

## Strictness Anti-Patterns

Avoid these:

- enabling every Clippy lint group without reading what it means;
- treating coverage percentage as a substitute for invariant tests;
- adding nightly-only tools to the normal developer path before proving value;
- making `just check` slower than the current release gate without a measurable
  confidence gain;
- letting cargo tools scan generated output, vendored artifacts, or JS build
  products unless that is the explicit test subject;
- weakening lint or security checks globally to silence one crate;
- choosing dependencies before the domain model requires them.
