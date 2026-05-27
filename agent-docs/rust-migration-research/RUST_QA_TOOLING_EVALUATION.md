# Rust QA Tooling Evaluation

This report evaluates Rust tooling for the planned Rust-first TPM platform
core, CLI, MCP surface, and future Tauri studio. It uses
`/Users/irk/Downloads/deep-research-report (2).md` only as untrusted input for
questions to investigate. The recommendations below are project-specific and
grounded in repo goals, the engineering philosophy, and primary tooling
documentation.

## Goals

The Rust toolchain should make this repository stricter, safer, and faster to
change.

The target is not "use every Rust tool." The target is deterministic automated
evaluation that protects repo health while improving developer velocity.

The QA system should:

1. Preserve the repo's non-negotiables: content fidelity, URL stability,
   truthful metadata, accessibility, deterministic generated output, and
   static-first publishing behavior.
2. Make good changes easy and bad changes hard by encoding policy in schemas,
   types, lints, diagnostics, fixtures, and generated-output checks.
3. Keep messy edges thin: IO, provider APIs, filesystem walking, browser
   behavior, Astro rendering, and deployment should remain adapters around
   pure typed Rust operations where Rust owns the domain.
4. Let CLI, MCP, Tauri, CI, and future GUI workflows share one operation layer
   and one set of quality gates.
5. Use strict blocking checks only when they are deterministic, low-noise, and
   directly tied to correctness, safety, security, compatibility, or release
   confidence.
6. Keep slower, nightly-only, process-heavy, or false-positive-prone tools in
   scheduled/review lanes until they prove enough value to become blockers.
7. Avoid weakening existing Bun/Astro checks during migration. Rust gates are
   additive until parity proves a Rust command can replace a TypeScript/Bun
   command.

## Research Method

Source priority:

1. Official Rust, Cargo, rustup, rustdoc, and Clippy documentation.
2. Official tool documentation, project docs, or primary project repositories.
3. Ecosystem docs such as docs.rs when a library's own documentation lives
   there.
4. The external deep-research report only as a list of candidate tools to
   verify, never as authority.

The main conclusion from the research is that TPM should use a layered QA
profile:

1. **Immediate baseline:** official Rust/Cargo checks, pinned toolchain,
   workspace policy, curated Clippy, lockfile determinism, `cargo-deny`, and
   low-noise test/coverage commands.
2. **CLI baseline:** command-output snapshots, transcript tests, machine
   output schema checks, and generated shell help/completion/manpage checks.
3. **Parser/importer baseline:** property tests and fuzzing when Rust owns
   untrusted or semi-structured inputs.
4. **Public crate baseline:** rustdoc strictness, semver checks, public API
   diffs, and MSRV policy once crates become published or externally consumed.
5. **Release/security hardening:** dependency review, unsafe inventory,
   mutation tests, benchmarks, binary provenance, and advanced analyzers where
   the risk profile justifies them.

## Recommended Baseline

### Toolchain And Workspace

Adopt with the first Rust workspace:

```toml
[toolchain]
channel = "stable"
profile = "default"
components = ["rustfmt", "clippy", "llvm-tools-preview"]
```

Project rules:

- commit `Cargo.lock`;
- use `--locked` in CI/release Rust commands;
- use a root Cargo workspace with resolver `3`, workspace package metadata,
  workspace dependencies, and workspace lints;
- add `rust-version` only after the initial supported Rust version is chosen;
- keep an explicit stable `rustfmt.toml` once the workspace has real Rust code
  so formatting policy is deterministic and review-neutral;
- use `.cargo/config.toml` only for repo-wide non-secret settings.

Primary sources:

- Cargo workspaces document `workspace.package`, `workspace.dependencies`, and
  `workspace.lints`: <https://doc.rust-lang.org/cargo/reference/workspaces.html>
- Cargo manifest documentation covers package metadata and `rust-version`:
  <https://doc.rust-lang.org/cargo/reference/manifest.html>
- Cargo command docs define `--locked` as lockfile enforcement:
  <https://doc.rust-lang.org/cargo/commands/cargo.html>
- rustup documents repository toolchain files:
  <https://rust-lang.github.io/rustup/overrides.html>

### Blocking Rust Commands

Current blocking profile:

```text
cargo fmt --all --check
cargo check --workspace --all-targets --all-features --locked
cargo clippy --workspace --all-targets --all-features --locked -- -D warnings
RUSTDOCFLAGS="-D warnings" cargo doc --workspace --all-features --no-deps --document-private-items --locked
cargo test --workspace --doc --all-features --locked
cargo test --workspace --all-features --locked
cargo deny check
```

Keep `cargo nextest` review-only until Rust test volume, timeout control,
partitioning, or CI reporting needs justify another installed tool. Standard
`cargo test` remains the blocking runner for the current additive workspace,
with doc tests checked separately so public documentation examples stay honest.

Primary sources:

- Cargo tests: <https://doc.rust-lang.org/cargo/commands/cargo-test.html>
- cargo-nextest: <https://nexte.st/>
- cargo-deny: <https://embarkstudios.github.io/cargo-deny/>

### Coverage

Use `cargo-llvm-cov` from the first real Rust crates, but do not start with
coverage percentage thresholds.

Recommended early command:

```text
cargo llvm-cov --workspace --all-features --summary-only
```

When nextest is the default Rust runner, prefer the supported nextest coverage
mode after verifying it in the actual workspace:

```text
cargo llvm-cov nextest --workspace --all-features --summary-only
```

Coverage policy:

- use coverage to find missing seams, dead code, and untested branches;
- prefer invariant/property/snapshot tests over brittle line chasing;
- require explanations for intentionally uncovered branches;
- promote thresholds only after the Rust crates have stable responsibilities.

Primary source:

- cargo-llvm-cov: <https://github.com/taiki-e/cargo-llvm-cov>

## Lint Policy

Use strict workspace lint inheritance. The default is to enable every stable,
high-signal check that catches likely mistakes at compile, lint, or
documentation time. Any omitted check needs a concrete reason.

Recommended starting point:

```toml
[workspace.lints.rust]
future_incompatible = { level = "deny", priority = -1 }
missing_debug_implementations = "deny"
missing_docs = "deny"
missing_unsafe_on_extern = "deny"
nonstandard_style = { level = "deny", priority = -1 }
rust_2018_idioms = { level = "deny", priority = -1 }
rust_2024_compatibility = { level = "deny", priority = -1 }
unsafe_code = "forbid"
unsafe_op_in_unsafe_fn = "deny"
unreachable_pub = "deny"
unused_lifetimes = "deny"
unused_qualifications = "deny"
warnings = "deny"

[workspace.lints.rustdoc]
bare_urls = "deny"
broken_intra_doc_links = "deny"

[workspace.lints.clippy]
all = { level = "warn", priority = -1 }
allow_attributes_without_reason = "deny"
cargo = { level = "warn", priority = -1 }
dbg_macro = "deny"
expect_used = "deny"
mem_forget = "deny"
nursery = { level = "warn", priority = -1 }
pedantic = { level = "warn", priority = -1 }
print_stderr = "deny"
print_stdout = "deny"
todo = "deny"
unimplemented = "deny"
unwrap_used = "deny"
wildcard_imports = "deny"
```

Policy details:

- `pedantic` and `nursery` are enabled because the current Rust slice is small,
  pinned to a toolchain, and can absorb the extra documentation and style
  requirements without adding noise.
- Do not globally enable all Clippy `restriction` lints. Clippy's own
  documentation describes the group as opt-in and it includes lints that
  conflict with normal Rust idioms or test failure patterns.
- Omit `unused_crate_dependencies` for now because package-level dependencies
  are shared by lib and bin targets; the current `tpm-cli` package layout makes
  that lint produce false positives for the binary target.
- Keep `panic` out of the global policy for now because tests and invariant
  constructors can use panic as an assertion failure mechanism. Revisit this if
  library code starts using recoverable panics.
- Keep all allowances local, narrow, and justified.
- Treat `unsafe_code = "forbid"` as the normal rule. If unsafe or FFI ever
  becomes necessary, isolate it in a crate with a written safety contract and
  extra dynamic-analysis gates.

Primary sources:

- Rustc lints: <https://doc.rust-lang.org/rustc/lints/index.html>
- Clippy lint groups: <https://doc.rust-lang.org/clippy/lints.html>

### Custom `cfg` Policy

Use explicit `check-cfg` discipline for any custom configuration flags.

Rules:

- no ad hoc `cfg(fuzzing)`, `cfg(tauri)`, `cfg(mcp)`, or provider cfgs without
  declaring expected names/values;
- pair `cargo::rustc-cfg` emitted from build scripts with
  `cargo::rustc-check-cfg`;
- make `unexpected_cfgs` warnings blocking once custom cfgs exist.

Primary source:

- rustc `--check-cfg`: <https://doc.rust-lang.org/rustc/check-cfg.html>

## Supply Chain And Dependency Governance

### Blocking Baseline

Use `cargo-deny` from the first Rust workspace commit.

Blocking domains:

- advisories;
- licenses;
- bans/duplicate dependency policy;
- allowed sources.

Initial `deny.toml` should allow common permissive licenses, deny unknown
sources, document exceptions, and start duplicate dependencies as either warn
or deny based on the first real dependency graph.

### Review-Only Or Later

Use these deliberately:

- `cargo audit`: useful RustSec advisory check, but redundant as a blocking
  gate if `cargo-deny` advisories already block. Keep as scheduled review if it
  provides earlier or clearer advisory signal.
- `cargo vet`: high-value once the dependency graph stabilizes and the team is
  ready to maintain audit policy. Not first-day baseline.
- `cargo crev`: interesting distributed-review model, but not a practical
  baseline unless the team commits to that workflow.
- `cargo tree -d`: built into Cargo and useful for duplicate dependency review.
  Make it blocking only after the initial graph is understood.
- `cargo udeps`: accurate but nightly-only. Use scheduled/review mode.
- `cargo machete`: fast but intentionally imprecise. Use as review-only; do
  not remove dependencies without confirmation.
- `cargo outdated`: scheduled maintenance signal, not per-PR blocking.
- `cargo geiger`: useful unsafe inventory for dependency review, not proof of
  safety and not a routine blocker.
- `cargo auditable`: useful when shipping binaries because it embeds dependency
  data into executables. Add with binary release packaging.

Primary sources:

- cargo-deny: <https://embarkstudios.github.io/cargo-deny/>
- RustSec/cargo-audit: <https://rustsec.org/> and
  <https://github.com/rustsec/rustsec>
- cargo-vet: <https://mozilla.github.io/cargo-vet/>
- cargo-crev: <https://github.com/crev-dev/cargo-crev>
- cargo-udeps: <https://github.com/est31/cargo-udeps>
- cargo-machete: <https://github.com/bnjbvr/cargo-machete>
- cargo-geiger: <https://github.com/geiger-rs/cargo-geiger>
- cargo-auditable: <https://github.com/rust-secure-code/cargo-auditable>

## Testing Strategy

### Normal Tests

Use ordinary Rust tests for pure units and crate integration behavior. Use
nextest for the default workspace runner once tests exist.

Test expectations:

- pure domain crates get focused unit tests;
- operation crates get integration tests over fixture workspaces;
- adapter crates get contract tests and failure-mode tests;
- no test-only public exports;
- tests should follow real seams, not force bad abstraction.

### Snapshot Tests

Use `insta` for:

- diagnostic reports;
- JSON operation envelopes;
- route and redirect reports;
- generated-output verification summaries;
- release reports;
- CLI help after the command language stabilizes.

Snapshots must be treated as public contract evidence, not a way to bless
incidental output churn.

### CLI Tests

Adopt when `tpm-cli` exists:

- `assert_cmd` for focused command assertions;
- `trycmd` for transcript tests and examples embedded in docs;
- `predicates` for output assertions;
- `tempfile` or `assert_fs` for isolated site workspaces.

Every stable machine-output mode should have schema/version checks and
snapshot coverage. Human output can be snapshot-tested when it is intended to
be stable documentation.

Primary sources:

- insta: <https://insta.rs/>
- assert_cmd: <https://docs.rs/assert_cmd/>
- trycmd: <https://docs.rs/trycmd/>

### Property Tests

Use `proptest` when example tests cannot adequately cover invariants.

Good TPM candidates:

- route and redirect normalization;
- path normalization and workspace containment;
- source artifact classification;
- media role selection;
- feature/profile/config merge rules;
- diagnostic aggregation and severity rollups;
- release manifest round trips.

Property tests should encode durable invariants, not implementation trivia.

Primary source:

- proptest: <https://docs.rs/proptest/latest/proptest/>

### Fuzzing And Dynamic Analysis

Adopt with Rust-owned parsers/importers:

- `cargo-fuzz` plus `arbitrary` for untrusted or semi-structured inputs;
- Miri for unsafe/FFI or memory-model-sensitive code;
- sanitizers for unsafe/FFI/parser-heavy crates when nightly CI lanes are
  justified;
- `cargo-careful` as targeted hardening, not routine CI;
- `loom` only for concurrency-heavy operation/server code.

Likely fuzz targets once Rust owns them:

- BibTeX/citation import;
- Markdown/frontmatter import;
- legacy redirect/permalink import;
- media manifests;
- external publication migration formats.

Primary sources:

- Rust Fuzz Book/cargo-fuzz: <https://rust-fuzz.github.io/book/cargo-fuzz.html>
- arbitrary: <https://docs.rs/arbitrary/latest/arbitrary/>
- Miri: <https://github.com/rust-lang/miri>
- Rust sanitizer support:
  <https://doc.rust-lang.org/beta/unstable-book/compiler-flags/sanitizer.html>
- loom: <https://docs.rs/loom/latest/loom/>

## Public API And Documentation Gates

Do not apply public-crate gates before a public API exists. Add them when a
crate is published, extracted, or externally consumed.

Already blocking in the current workspace:

- rustdoc warnings as errors for public docs;
- `missing_docs` as a blocking workspace lint;
- `RUSTDOCFLAGS="-D warnings" cargo doc --workspace --all-features --no-deps --document-private-items --locked`.

Adopt with public/package-like crates:

- `cargo-semver-checks` against the published baseline;
- public API snapshots/reviews;
- `cargo-msrv` after a real MSRV policy exists;
- `cargo-deadlinks` for documentation link integrity.

Primary sources:

- rustdoc lints:
  <https://doc.rust-lang.org/rustdoc/lints.html>
- cargo-semver-checks:
  <https://github.com/obi1kenobi/cargo-semver-checks>
- cargo-public-api:
  <https://github.com/Enselic/cargo-public-api>
- cargo-msrv: <https://github.com/foresterre/cargo-msrv>
- cargo-deadlinks: <https://github.com/deadlinks/cargo-deadlinks>

## CLI, MCP, Tauri, And `just`

### CLI Stack

Adopt for the CLI:

- `clap` derive for typed command definitions;
- `ValueEnum` for closed vocabularies;
- `miette` for rich diagnostics with codes/spans/help;
- `thiserror` in shared crates;
- `anyhow` only at executable/application boundaries;
- `tracing` for structured logs and debug output;
- `clap_complete` and `clap_mangen` once command names stabilize.

The CLI should never require tools to parse human output. Stable machine output
must be versioned Serde structs.

Primary sources:

- clap: <https://docs.rs/clap/latest/clap/>
- miette: <https://docs.rs/miette/>
- thiserror: <https://docs.rs/thiserror/>
- anyhow: <https://docs.rs/anyhow/>
- tracing: <https://docs.rs/tracing/>
- clap_complete: <https://docs.rs/clap_complete/>
- clap_mangen: <https://docs.rs/clap_mangen/>

### MCP And Tauri

Keep MCP and Tauri as interfaces over the same operation crates.

Rules:

- no separate Tauri business-logic layer;
- no separate MCP domain model;
- Tauri commands should be thin permissioned adapters over operation crates;
- MCP tools/resources should expose diagnostics, plans, artifacts, and safe
  operations through the same request/result types;
- use capability-scoped filesystem/shell access in Tauri;
- test Tauri command adapters with mock/runtime support when available.

Primary sources:

- Tauri capabilities:
  <https://v2.tauri.app/security/capabilities/>
- Tauri calling Rust:
  <https://v2.tauri.app/develop/calling-rust/>
- Model Context Protocol SDK docs:
  <https://modelcontextprotocol.io/docs/sdk>
- Rust MCP SDK: <https://github.com/modelcontextprotocol/rust-sdk>

### `just`

Use `just` as the repository command router, not the domain engine.

Rules:

- `just` recipes call tools and shared commands;
- recipes stay short and discoverable;
- `just --list` should be the human command index;
- `just check` should route to the current release-quality gate;
- `just rust-*` recipes should make the Rust migration easy to run without
  replacing Bun/Astro checks prematurely.

Primary source:

- just manual: <https://just.systems/man/en/>

## Adoption Matrix

| Tool or practice                            | Timing                         | Blocking status                         | Why                                                           |
| ------------------------------------------- | ------------------------------ | --------------------------------------- | ------------------------------------------------------------- |
| `rust-toolchain.toml`                       | First Rust commit              | Blocking via CI setup                   | Reproducible toolchain and developer parity                   |
| Committed `Cargo.lock` + `--locked`         | First Rust commit              | Blocking                                | Deterministic dependency resolution                           |
| Cargo workspace metadata/dependencies/lints | First Rust commit              | Blocking                                | Central policy, less drift, easier crate extraction           |
| `cargo fmt --all --check`                   | First Rust commit              | Blocking                                | Zero-debate style gate                                        |
| `cargo check`                               | First Rust commit              | Blocking                                | Fast compiler feedback across targets/features                |
| Curated Clippy + `-D warnings`              | First Rust commit              | Blocking once clean                     | Low-noise correctness and maintainability guard               |
| `unsafe_code = "forbid"`                    | First Rust commit              | Blocking                                | Unsafe requires explicit design exception                     |
| `cargo-deny`                                | First Rust commit              | Blocking                                | Advisory, license, source, and dependency policy              |
| `cargo-nextest`                             | Once tests are non-trivial     | Blocking                                | Faster, richer test runner for CI/developers                  |
| `cargo-llvm-cov`                            | First real crates              | Review first, later blocking generation | Coverage insight without brittle thresholds                   |
| `insta`                                     | CLI/report outputs exist       | Blocking for stable outputs             | Snapshot public report and CLI contracts                      |
| `assert_cmd` / `trycmd`                     | CLI exists                     | Blocking                                | CLI behavior and docs transcript coverage                     |
| `proptest`                                  | Invariant-heavy logic exists   | Blocking for relevant crates            | Better guard for normalization/policy domains                 |
| `cargo-fuzz` + `arbitrary`                  | Rust parsers/importers exist   | Scheduled/security lane                 | Robustness for untrusted and semi-structured inputs           |
| Miri/sanitizers/`cargo-careful`             | Unsafe/FFI/critical parsers    | Targeted review or scheduled            | Dynamic hardening where the risk justifies nightly cost       |
| `cargo-semver-checks` / public API checks   | Public/extracted crates        | Blocking for release                    | Preserve external compatibility                               |
| `cargo-msrv`                                | MSRV policy exists             | Scheduled or release                    | Validate compatibility promise                                |
| `cargo-vet`                                 | Dependency graph stabilizes    | Later governance gate                   | Human dependency audit policy                                 |
| `cargo-machete` / `cargo-udeps`             | Dependencies stabilize         | Review-only first                       | Useful dependency cleanup with false-positive/nightly caveats |
| `cargo-geiger`                              | Dependency reviews             | Review-only                             | Unsafe inventory, not proof                                   |
| `cargo-outdated`                            | Maintenance cadence exists     | Scheduled only                          | Dependency update signal, not per-PR correctness              |
| `criterion` / `cargo-bloat`                 | Hot paths or binary packaging  | Review/perf lane                        | Performance evidence without slowing routine CI               |
| `cargo-mutants`                             | Core policy crates stabilize   | Scheduled or targeted pre-release       | Test quality audit where runtime cost is justified            |
| Kani/Prusti/MIRAI                           | Critical algorithms justify it | Targeted research lane                  | Formal-ish assurance only for high-value domains              |
| Rudra                                       | Never baseline                 | Reject                                  | Archived; not a practical maintenance fit for this repo       |

## Suggested Command Profiles

### Fast Local Rust Loop

```text
just rust-fmt
just rust-cargo-check
just rust-clippy
just rust-doc
just rust-doc-test
just rust-test
```

Equivalent direct commands:

```text
cargo fmt --all
cargo check --workspace --all-targets --all-features --locked
cargo clippy --workspace --all-targets --all-features --locked -- -D warnings
RUSTDOCFLAGS="-D warnings" cargo doc --workspace --all-features --no-deps --document-private-items --locked
cargo test --workspace --doc --all-features --locked
cargo test --workspace --all-features --locked
```

### Rust Release Gate

```text
cargo fmt --all --check
cargo check --workspace --all-targets --all-features --locked
cargo clippy --workspace --all-targets --all-features --locked -- -D warnings
RUSTDOCFLAGS="-D warnings" cargo doc --workspace --all-features --no-deps --document-private-items --locked
cargo test --workspace --doc --all-features --locked
cargo test --workspace --all-features --locked
cargo deny check
```

### Scheduled Rust Maintenance

```text
cargo audit
cargo tree -d
cargo outdated
cargo +nightly udeps --workspace --all-targets --all-features
cargo machete
cargo geiger
cargo report future-incompatibilities
```

### Parser/Security Hardening

```text
cargo +nightly fuzz run <target>
cargo +nightly miri test
cargo mutants --package <core-policy-crate>
```

These commands should be added only after the relevant crates and targets
exist.

## Implementation Notes For Linear Planning

The first Rust tooling issue should not try to add every tool at once.

Recommended issue breakdown:

1. Add pinned Rust workspace and minimal crates.
2. Add strict workspace lint policy and rustfmt/clippy/check/test commands.
3. Add `cargo-deny` policy and dependency governance docs.
4. Add `just` recipes that call existing Bun gates and new Rust gates.
5. Add coverage command and coverage exception policy for Rust.
6. Add CLI testing libraries when the first real `tpm-cli` command lands.
7. Add property testing when the first normalization/policy crate lands.
8. Add fuzzing when Rust owns its first parser/importer.
9. Add public API/semver gates only when there is an extracted or published
   crate boundary.

Promotion rule for any non-baseline tool:

1. Introduce as manual or scheduled review.
2. Record noise, runtime, false positives, and actual bugs found.
3. Document exceptions and ownership.
4. Promote to blocking only when failures are deterministic, actionable, and
   rare.

## Open Decisions Before Implementation

1. Choose the initial Rust version once the first Rust workspace is introduced.
   Until then, use `stable` in research docs and avoid fake MSRV precision.
2. Decide whether the first CI Rust profile runs nextest immediately or starts
   with `cargo test` until test volume justifies nextest installation.
3. Decide the initial license allowlist for `deny.toml`.
4. Decide whether repo-wide spellcheck (`typos`) belongs in the Rust migration
   gate or in the broader QA tooling roadmap. It is useful, but it touches
   non-Rust docs/content and should not create authoring noise.
5. Decide when Rust coverage should become a blocking generated artifact
   rather than a review-only report.

## Bottom Line

The strongest TPM path is a strict but staged Rust QA stack:

1. Use official compiler, workspace, lint, lockfile, and toolchain controls as
   the foundation.
2. Make `cargo-deny`, curated Clippy, formatting, tests, and lockfile
   determinism blocking from the beginning.
3. Use nextest and llvm-cov for scalable tests and coverage evidence.
4. Add snapshots, command transcript tests, and machine-output schemas when
   the CLI exists.
5. Add property tests and fuzzing when Rust owns policy-heavy logic and
   parsers.
6. Add semver/public API gates when crates become real package boundaries.
7. Keep noisy or costly tools in review lanes until they earn blocking status.

This gives the repo the strictness it needs without making routine development
fragile. It also aligns with the larger product vision: one typed, testable,
deterministic operation core that can support CLI, MCP, Tauri, CI, and future
studio workflows without duplicating domain logic.
