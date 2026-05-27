# Rust Migration And CLI Implementation Plan

This document defines the Rust-first migration path for the TPM platform,
repository tooling, CLI, MCP surface, and future Tauri studio.

It does not implement Rust yet. It exists so the first Rust commits can be
small, safe, testable, and aligned with the long-term product architecture.

## Executive Summary

Rust is the right default language for the durable platform core, the CLI, the
future MCP server, and the future Tauri desktop application backend.

The migration should not be a small wrapper around existing Bun scripts. The
target is a Rust-first headless static publishing engine with thin adapters for
Astro, TypeScript, browser JavaScript, Playwright, and provider CLIs where those
tools are still the best or only way to do the work.

The recommended direction:

1. Add a Rust workspace and `justfile` without replacing behavior.
2. Port pure, platform-shaped domains first: diagnostics, workspace discovery,
   source artifacts, route and redirect policy, media inventory, generated
   output verification, QA registry, and release reports.
3. Build the CLI as a command-language projection of shared Rust operations.
4. Keep Astro rendering and browser/component tests in TypeScript until there
   is a concrete replacement.
5. Use parity tests and dual-run reports before any Rust command replaces an
   existing Bun script.
6. Reuse the same Rust core from CLI, MCP, Tauri commands, CI, and future
   studio workflows.

Supporting research:

- [`CLI_RUST_GUI_INTEGRATION_PLAN.md`](./CLI_RUST_GUI_INTEGRATION_PLAN.md)
  coordinates the Rust core, CLI, MCP, Tauri/Astro GUI, adapter contracts, and
  issue sequencing as one implementation plan.
- [`rust-migration-research/RUST_QA_TOOLING_EVALUATION.md`](./rust-migration-research/RUST_QA_TOOLING_EVALUATION.md)
  evaluates Rust QA/static-analysis tools, blocking versus review-only gates,
  and staged command profiles.
- [`rust-migration-research/RUST_TOOLING_STRICTNESS.md`](./rust-migration-research/RUST_TOOLING_STRICTNESS.md)
  summarizes the selected Rust tooling and library posture.

This is aggressive, but feasible. The current repo already has the right
seams: many scripts expose pure functions, the platform has `src/platform/*`
entrypoints, diagnostics are already structured, and the roadmap already treats
CLI, GUI, MCP, and CI as interfaces over one compiler.

## North Star

The Rust core should become the stable publishing compiler:

```text
site workspace intent
  -> typed source and configuration model
  -> diagnostics and repair plans
  -> route, media, metadata, workflow, release, and deploy plans
  -> Astro/static renderer adapters where needed
  -> verified static artifacts
```

The CLI, MCP server, Tauri app, CI scripts, and future GUI should call the same
operation layer. They should differ only in input/output presentation,
interactive affordances, and provider connection details.

## Non-Negotiable Invariants

- Preserve article content, author intent, redirects, and historical metadata.
- Do not make a Rust implementation source of truth until it passes parity
  checks against the current TypeScript/Bun behavior.
- Keep generated output deterministic and verifiable.
- Keep author diagnostics actionable, stable, and source-mapped.
- Keep Astro and browser-specific logic behind adapters.
- Keep unsafe Rust forbidden by default.
- Keep machine output versioned from the first CLI implementation.
- Keep local authoring possible without Git, GitHub, Cloudflare, or a hosted
  content service.

## Target Directory Structure

The first Rust workspace should be additive.

```text
Cargo.toml
rust-toolchain.toml
deny.toml
justfile
.cargo/
  config.toml
crates/
  tpm-core/
  tpm-diagnostics/
  tpm-workspace/
  tpm-config/
  tpm-content/
  tpm-routes/
  tpm-media/
  tpm-output/
  tpm-release/
  tpm-adapters/
  tpm-qa/
  tpm-cli/
  tpm-mcp/
apps/
  studio/
    src-tauri/
```

The first commit does not need every crate. The intended destination matters
because it prevents early Rust code from becoming another script pile.

### Crate Responsibilities

`tpm-core`
: Shared domain primitives, typed IDs, severity levels, path policy, stable
operation result shells, and common serialization helpers.

`tpm-diagnostics`
: Author-facing and developer-facing diagnostics, stable diagnostic codes,
source spans, remediation text, report aggregation, and renderers.

`tpm-workspace`
: Workspace discovery, site root detection, source artifact inventory, path
normalization, ignored-path policy, and source/provider context loading.

`tpm-config`
: Site config model, schema generation, profile merging, defaults, feature
policy, and config diagnostics.

`tpm-content`
: Source entry inventory, frontmatter parsing, publishable-entry models,
collections, authors, categories, tags, and content diagnostics.

`tpm-routes`
: Route registry, canonical URL construction, redirects, legacy permalink
policy, sitemap/feed route expectations, and URL stability checks.

`tpm-media`
: Media roles, source inventory, derivative expectations, remote/local
provider abstractions, alt/caption policy, optimization plans, and migration
plans.

`tpm-output`
: Generated-output inspection: HTML, links, metadata, feeds, sitemap, PDFs,
assets, cache policy, hydration boundaries, and release artifact evidence.

`tpm-release`
: Release manifest, release reports, compatibility policy, preservation
artifacts, deployment preflight, rollback metadata, and diff summaries.

`tpm-adapters`
: Provider-neutral traits and first bundled adapters for local filesystem,
repo-local media, Cloudflare Static Assets, Git/GitHub source/history where
needed, and Astro build invocation.

`tpm-qa`
: QA command registry, command graph, CI parity model, failure probes,
diagnostic diffing, and test accountability.

`tpm-cli`
: Thin `clap` binary that parses user intent, loads workspace context, calls
shared operations, and renders human/JSON output.

`tpm-mcp`
: MCP server over the same operation layer. It should expose tools/resources
for diagnostics, source inspection, plans, release reports, and safe edits.

`apps/studio/src-tauri`
: Tauri shell and desktop-specific permissions, command bindings, and native
packaging. It should call the same Rust operation crates rather than re-owning
publishing logic.

## What To Migrate First

The best first Rust targets are deterministic, pure or nearly pure tools whose
output can be compared against current scripts.

1. Workspace and source artifact inventory.
2. Diagnostic report model and renderers.
3. Site doctor relationship checks.
4. Image asset location, duplicate, shared, and unused-asset inventory.
5. Redirect rule generation and duplicate/limit checking.
6. Route registry validation and public URL construction.
7. Generated-output verification report data model.
8. Build artifact inventory and cache/header policy verification.
9. QA command registry and CI parity reporting.
10. Release report and generated artifact manifest shells.

These domains already operate like compilers: read structured source or output,
normalize it, validate it, and emit reports.

## What Should Stay TypeScript/Astro Initially

Some domains are not good first Rust targets because they are tied to the
current renderer, browser APIs, or JavaScript ecosystem.

- Astro pages, layouts, components, content collection rendering, and MDX
  component wiring.
- Rehype and remark plugins until the Markdown/MDX compiler boundary is
  redesigned.
- Browser scripts for interactions such as anchored positioning, article
  previews, theme, search, and carousel behavior.
- Playwright, axe, Lighthouse, and Astro component tests.
- Astro build invocation and Pagefind indexing, except as Rust orchestration
  around external commands.
- PDF generation until the current browser/Astro assumptions are replaced by a
  deliberate artifact pipeline.
- Build-output minification that relies directly on Lightning CSS, SVGO, Oxc,
  or Astro-generated asset details, unless Rust owns only orchestration and
  verification.

This is not a retreat from Rust. It is the correct adapter boundary.

## CLI Architecture

The CLI must be a product interface, not a script bundle.

The command handler shape should be:

```text
parse command
  -> load workspace context
  -> construct typed operation request
  -> execute operation
  -> render operation result
  -> return stable exit code
```

The operation layer should be usable by:

- CLI commands;
- Tauri commands;
- MCP tools;
- CI wrappers;
- tests and fixtures;
- future GUI forms and preview flows.

The CLI should use `clap` derive for typed command definitions, `ValueEnum` for
closed vocabularies, flattened structs for shared flags, and generated shell
completion/man/help artifacts once the command surface stabilizes.

The CLI should use the command language already designed in
`agent-docs/TPM_CLI_PRODUCT_STRATEGY.md`: `site`, `content`, `media`,
`source`, `workflow`, `check`, `doctor`, `preview`, `build`, `release`,
`publish`, `import`, `export`, `extension`, `adapter`, and `mcp`.

## `just` Architecture

`just` should become the repository command UX. It should not replace Cargo,
Bun, Astro, Playwright, or the future TPM CLI. It should route humans and CI to
the correct command without requiring them to remember implementation details.

Recommended first recipes:

```text
just
just list
just setup
just check
just check-fast
just release-check
just fix
just docs
just build
just preview
just rust-check
just rust-test
just rust-coverage
just rust-audit
just js-check
just site-check
just cli --help
```

Design rules:

- `just` recipes call tools; they do not own domain logic.
- Recipes should be short and discoverable.
- Keep Bun scripts during migration, but prefer `just` as the public command
  surface once introduced.
- Use `just --list` as the human command index.
- Keep CI and local recipes aligned through the QA command registry.

## Rust Tooling Baseline

The first Rust setup should include:

- `rust-toolchain.toml` pinned to stable with `rustfmt`, `clippy`, and
  `llvm-tools-preview`.
- Root `Cargo.toml` workspace with resolver 3, shared package metadata,
  workspace dependencies, and workspace lints.
- `.cargo/config.toml` only for repo-wide non-secret settings.
- `deny.toml` for advisories, licenses, duplicate bans, and allowed sources.
- `rustfmt.toml` with stable formatting policy once real Rust code exists.
- `nextest.toml` once test profiles need timeouts, retries, partitions, or CI
  JUnit output.

Blocking baseline commands:

```text
cargo fmt --all --check
cargo check --workspace --all-targets --all-features --locked
cargo clippy --workspace --all-targets --all-features --locked -- -D warnings
RUSTDOCFLAGS="-D warnings" cargo doc --workspace --all-features --no-deps --document-private-items --locked
cargo test --workspace --doc --all-features --locked
cargo test --workspace --all-features --locked
cargo deny check
```

Review-only or scheduled commands:

```text
cargo llvm-cov --workspace --all-features --summary-only
cargo nextest run --workspace --all-features --locked
cargo audit
cargo machete
```

Coverage should begin as evidence, not as a brittle percentage gate. `cargo
audit` is useful if it provides earlier or clearer RustSec signal than
`cargo-deny`, but it should not duplicate `cargo-deny` as a noisy blocking
gate without a reason. `cargo machete` is intentionally imprecise and should
remain review-only until dependency behavior is understood.

Fuzzing, mutation testing, semver checks, public API checks, and binary
attestation tools should be added when the relevant crates, parsers, public
APIs, or release binaries exist, not before.

## Strictness Policy

The default Rust workspace should be strict.

Recommended root lint stance:

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

Important nuance: strictness should catch likely mistakes, not forbid normal
Rust. `pedantic` and `nursery` are enabled because the current pinned Rust
slice can absorb the signal. The full `restriction` group stays off because it
contains contradictory or anti-idiomatic lints; cherry-pick restriction lints
that prevent real repo bug classes. Allowances should be local, documented, and
tied to specific design reasons.

## Dependency Recommendations

Initial runtime and library dependencies:

- `clap` with `derive` for CLI parsing.
- `serde`, `serde_json`, and `toml` for typed data.
- YAML support only where current source contracts require it, and only after
  choosing a maintained parser deliberately.
- `schemars` for JSON Schema generation from Rust config/source models.
- `thiserror` for library error enums.
- `miette` for rich, source-mapped CLI diagnostics.
- `camino` for UTF-8 paths at platform boundaries.
- `ignore` for Git-aware file walking.
- `walkdir` only where `ignore` is too heavy or not appropriate.
- `globset` for repository-owned glob policies.
- `url` for URL parsing and normalization.
- `time` or `jiff` for explicit date/time handling.
- `tracing` and `tracing-subscriber` for structured logs.
- `tempfile` and `assert_fs` for tests.
- `insta`, `trycmd`, `assert_cmd`, and `predicates` for CLI and report tests.
- `proptest` for path, route, redirect, media-policy, and config merge
  invariants.

Provider/network dependencies should be added later and only behind adapter
crates:

- `reqwest` or provider SDKs for network APIs;
- `tokio` only in crates that genuinely need async/network/server behavior;
- `rmcp` for the MCP crate when the operation model is ready;
- Tauri dependencies only under `apps/studio/src-tauri`.

## Migration Sequence

This sequence is intentionally issue-friendly. Each phase should become a
Linear milestone or milestone group. Each deliverable below can become an
issue, and larger deliverables should be split into the concrete sub-issues
listed in the planning breakdown.

### Phase 1: Add The Rust Toolchain Without Replacing Behavior

Deliverables:

- root Rust workspace;
- pinned toolchain;
- strict baseline lints;
- `justfile`;
- initial CI/local commands;
- empty or minimal `tpm-core`, `tpm-diagnostics`, `tpm-workspace`, and
  `tpm-cli` crates;
- docs explaining command ownership and migration policy.

Verification:

- Rust checks pass.
- Existing Bun release checks pass.
- `just check` delegates to current release gates.
- No existing generated output changes.
- Rust checks are additive and cannot mask an existing Bun/TypeScript failure.

### Phase 2: Port Pure Foundations In Parallel

Deliverables:

- workspace discovery and path normalization;
- diagnostic model and report renderer;
- source artifact manifest;
- QA registry representation;
- initial CLI `check`, `doctor`, and `site status` stubs over real Rust
  operations.

Verification:

- Golden fixtures compare Rust reports against existing script outputs.
- Snapshot tests cover human and JSON output.
- Property tests cover paths and route/url normalization.
- Existing scripts remain source of truth.
- Rust JSON output uses the versioned report envelope defined before command
  promotion.

### Phase 3: Dual-Run High-Value Scripts

Deliverables:

- Rust implementations for site doctor, image asset location, redirects,
  route expectations, and selected generated-output verification modules;
- comparison commands that run TypeScript and Rust implementations together;
- diagnostic diff reports for mismatches.

Verification:

- Dual-run comparison passes on the active TPM site and fixture sites.
- CI can run Rust checks as review-only before blocking.
- Docs record every accepted difference.
- Each dual-run command has a machine-readable mismatch report and points to
  the source file, generated artifact, or policy that caused the mismatch.

### Phase 4: Promote Rust-Owned Commands

Deliverables:

- `just` and package scripts call Rust commands for promoted domains;
- old TypeScript scripts are removed, parked, or kept as explicit fallback for
  one release cycle;
- generated docs and command references point to the Rust CLI.

Verification:

- Full release checks pass.
- Output snapshots stay stable.
- CI/local parity registry is updated.
- No source-content behavior changes without explicit migration notes.
- The promoted command has one documented rollback path: old script fallback,
  revert plan, or explicit acceptance that rollback is not needed because the
  old implementation was removed after parity.

### Phase 5: Build Product Interfaces Over The Rust Core

Deliverables:

- CLI release/build/publish plan commands;
- MCP tools/resources for diagnostics and artifact inspection;
- Tauri command bindings over the same operation crates;
- extension and adapter developer commands.

Verification:

- CLI, MCP, and Tauri command tests call shared operation fixtures.
- Machine output is versioned.
- Provider adapters report capabilities and dry-run plans.
- GUI flows do not bypass the CLI/MCP operation model.
- CLI, MCP, Tauri, and CI use the same operation request/result types or
  generated schemas for the operation being exposed.

### Phase 6: Extract Product-Grade Libraries When Proven

Deliverables:

- package-boundary docs for candidate crates;
- semver checks for published APIs;
- generated API docs;
- examples consuming crates outside the app workspace;
- optional Astro integration wrappers.

Verification:

- External examples build.
- `cargo-semver-checks` guards public crates.
- API docs include examples and error behavior.
- No TPM site assumptions leak into published crates.

## Linear Planning Breakdown

This section is the starting point for creating Linear issues. It intentionally
uses implementation-neutral issue titles so work can be parallelized without
locking in exact file names too early.

### Milestone Group 1: Rust Workspace And Command Foundation

Goal: introduce Rust and `just` without changing site behavior.

Blocking issue candidates:

1. **Add Rust workspace infrastructure.**
   - Scope: root `Cargo.toml`, `rust-toolchain.toml`, initial crates,
     `.cargo/config.toml` if needed, and no-op/example tests.
   - Blocks: every Rust implementation issue.
   - Acceptance: `cargo fmt`, `cargo check`, `cargo clippy`, and `cargo test`
     run locally through `just` or direct commands.
2. **Add strict Rust QA baseline.**
   - Scope: workspace lints, first `cargo-deny` policy, `cargo-llvm-cov`
     command, and documented review-only versus blocking status.
   - Blocks: promoting Rust checks into CI/release gates.
   - Acceptance: Rust QA produces low-noise output on an empty/minimal
     workspace and does not weaken existing Bun checks.
3. **Add `just` as command router.**
   - Scope: discoverable recipes that delegate to current Bun checks and new
     Rust checks.
   - Blocks: future docs that tell developers to use `just` by default.
   - Acceptance: `just --list`, `just check`, `just check-fast`, and Rust
     recipes are documented and deterministic.
4. **Define versioned CLI report envelope.**
   - Scope: JSON output shape, schema-version field, diagnostic list,
     operation metadata, summary, and exit-code policy.
   - Blocks: real CLI report commands and parity snapshots.
   - Acceptance: documented schema plus tests for serialization stability.

Parallel issue candidates:

1. **Create first neutral Rust fixture workspace.**
   - Scope: small site-like fixture used by Rust tests without TPM branding.
   - Acceptance: fixture can drive workspace discovery and diagnostic tests.
2. **Document Rust contributor workflow.**
   - Scope: README/AGENTS/docs updates explaining Cargo, `just`, Bun, and
     migration policy.
   - Acceptance: new contributors can run the additive Rust checks.

### Milestone Group 2: Shared Operation And Diagnostics Core

Goal: create the operation model that CLI, MCP, Tauri, CI, and tests will
share.

Blocking issue candidates:

1. **Implement core diagnostic model.**
   - Scope: severities, stable codes, source locations, remediation, related
     docs, report aggregation, human renderer, JSON renderer.
   - Blocks: site doctor, generated-output verifier, CLI check, MCP resources,
     and Tauri diagnostics.
   - Acceptance: snapshots for human and JSON output; no TPM literals in the
     core crate.
2. **Implement workspace context model.**
   - Scope: repo root, active site root, content/assets/public/config/output
     paths, source artifact inventory, ignored paths, and path display policy.
   - Blocks: almost every Rust migration target.
   - Acceptance: fixture tests cover TPM-like, starter-like, and missing-path
     workspaces.
3. **Implement operation request/result shell.**
   - Scope: operation IDs, timing, status, diagnostics, warnings, machine
     output envelope, and renderer abstraction.
   - Blocks: CLI command handlers and Tauri/MCP wrappers.
   - Acceptance: one sample operation can render stable human and JSON output.

Parallel issue candidates:

1. **Add CLI skeleton over operations.**
   - Scope: `tpm` binary, `--help`, shared output flags, color/progress policy,
     and no-op `site status` wired to the operation shell.
   - Acceptance: `trycmd`/snapshot tests cover help and JSON output.
2. **Add operation fixture strategy.**
   - Scope: fixture layout, golden report policy, snapshot review policy, and
     parity-diff artifact naming.
   - Acceptance: documented and exercised by at least one Rust operation.

### Milestone Group 3: First Dual-Run Migrations

Goal: port small deterministic scripts while TypeScript remains source of
truth.

Candidate issues should be run in this order unless another issue is clearly
unblocked:

1. **Dual-run site doctor.**
   - Blocks: CLI `doctor` promotion.
   - Acceptance: Rust and TypeScript produce equivalent blocking/warning
     diagnostics for active and fixture sites.
2. **Dual-run image asset location verification.**
   - Blocks: media inventory and media migration planning.
   - Acceptance: Rust and TypeScript agree on scanned images, ignored paths,
     and violations.
3. **Dual-run Cloudflare/static redirect generation.**
   - Blocks: route/redirect policy promotion.
   - Acceptance: Rust emits byte-equivalent `_redirects` output or documented
     accepted differences.
4. **Dual-run QA registry and diagnostic diff.**
   - Blocks: using Rust to orchestrate command parity and future CI planning.
   - Acceptance: Rust report covers current script classes, CI usage, runtime,
     mutation behavior, and parity metadata.

### Milestone Group 4: Command Promotion And Release Artifacts

Goal: make Rust commands source of truth for proven domains.

Issue candidates:

1. Promote site doctor.
2. Promote image asset location verification.
3. Promote redirect generation.
4. Promote QA registry reporting.
5. Add release manifest shell and generated-output report bridge.
6. Update package scripts, `just`, docs, and CI parity registry.

Acceptance for every promotion:

- old and new outputs have passed dual-run parity;
- package scripts and `just` call the promoted command;
- release checks pass;
- docs name the new command;
- rollback path is documented;
- TypeScript fallback is removed or explicitly time-boxed.

### Milestone Group 5: Product Interface Expansion

Goal: grow from migration tooling into product surfaces.

Issue candidates:

1. CLI check/doctor/status/report commands over Rust operations.
2. CLI release inspect/diff/archive commands.
3. CLI media inventory and migration plan commands.
4. Provider-neutral publish plan command.
5. MCP read-only diagnostics/resources.
6. Tauri command bindings for workspace/status/diagnostics.
7. Extension/adapter inspection commands.

Acceptance:

- commands share operation request/result contracts;
- JSON output is versioned and tested;
- mutating operations are plan/apply;
- provider capabilities are explicit;
- GUI/MCP/CLI do not duplicate operation logic.

## Cross-Cutting Planning Rules

- **No replacement without parity.** Every migrated command starts as additive,
  then dual-run, then promoted.
- **No provider lock-in.** Cloudflare, GitHub, repo-local assets, and Astro are
  adapters or current implementations, not the product model.
- **No hidden source writes.** Mutating operations produce plans unless they are
  intentionally tiny, local, and reversible.
- **No untracked schema drift.** Rust-owned models must produce schemas or
  generated bindings for TypeScript/Astro consumers.
- **No broad permissions.** Tauri, MCP, shell, filesystem, and provider access
  should be scoped to the operation.
- **No fake coverage.** Tests should follow real seams. Do not create
  test-only exports or abstractions whose only job is improving coverage.

## Open Decisions Before Implementation

These should be resolved or deliberately deferred before creating implementation
issues from this plan.

1. **Initial crate count.**
   Recommendation: start with four crates: `tpm-core`, `tpm-diagnostics`,
   `tpm-workspace`, and `tpm-cli`. Add domain crates as real code demands.
2. **Rust MSRV.**
   Recommendation: pin stable in `rust-toolchain.toml` first, then set
   `rust-version` once the initial toolchain and dependency floor are known.
3. **YAML parser choice.**
   Recommendation: do not add YAML until a source contract requires it. Use
   JSON/TOML first.
4. **Cargo-deny license policy.**
   Recommendation: start permissive but explicit; tighten after dependency
   graph is real.
5. **CLI binary name.**
   Recommendation: use `tpm` internally unless product naming changes before
   public release.
6. **CI promotion timing.**
   Recommendation: Rust checks are blocking only after the additive workspace
   is clean and fast. Dual-run mismatch reports can be review-only first.

## Parity Testing Strategy

Every migrated script should move through four states:

1. **Observed:** TypeScript behavior is documented with fixtures and snapshots.
2. **Replicated:** Rust emits equivalent structured results.
3. **Compared:** Dual-run tooling detects behavior differences.
4. **Promoted:** Rust becomes the called command after parity is stable.

Use these test types:

- unit tests for pure domain functions;
- fixture tests for active and synthetic site instances;
- snapshot tests for human and JSON reports;
- `trycmd` tests for command examples and docs;
- property tests for route/path/media/config invariants;
- fuzz tests for parsers and importers once the Rust parser surface exists;
- generated-output parity tests before replacing verification scripts.

## Tauri Path

The Tauri app should be a shell over the Rust operation crates.

The Rust backend should expose Tauri commands such as:

```text
workspace_open
workspace_status
diagnostics_run
content_list
content_plan_edit
content_apply_edit
media_inventory
media_plan_migration
release_plan
publish_plan
publish_apply
```

The frontend should not parse source files, own route policy, or invent a
parallel publishing model. It should render operation state, diagnostics,
preview URLs, forms generated from schemas, and plans produced by the Rust
core.

Tauri capability files should be explicit and minimal. File, shell, network,
dialog, and provider permissions should be granted by workflow need, not by
global convenience.

## MCP Path

The MCP server should expose the same operation model to agents:

- resources for site config, route registry, source artifacts, release
  manifests, diagnostics, and generated-output reports;
- tools for check, doctor, plan repair, inspect route, inspect media, create
  release plan, and preview safe source edits;
- prompts only for high-level guidance, never as hidden business logic.

The MCP crate should wait until the Rust operation model is stable enough that
tool calls are wrappers, not a new implementation.

## Risks And Mitigations

1. **Cross-language schema drift.**
   Generate JSON Schema from Rust where Rust owns the model, then validate that
   TypeScript/Astro consumes the same schema or generated TypeScript bindings.

2. **Astro content collection coupling.**
   Keep Astro as a renderer adapter until source models are explicitly
   separated from Astro collection APIs.

3. **Duplicated diagnostics.**
   Move diagnostic codes and report shapes early. Scripts can call old logic,
   but they should converge on one report model.

4. **CLI command sprawl.**
   Keep handlers thin and operation-driven. Do not add one-off commands that
   bypass typed operations.

5. **Rust compile-time drag.**
   Split crates by domain, avoid unnecessary default features, run focused
   `cargo check -p` locally, use nextest profiles, and keep heavy provider
   dependencies behind optional adapter crates.

6. **Unsafe or native dependency creep.**
   Forbid unsafe in workspace code by default, run `cargo deny`, prefer pure
   Rust libraries when quality is sufficient, and isolate native dependencies
   in adapter crates.

7. **Overfitting to TPM.**
   Test every platform crate against a fixture site and at least one neutral
   example. Keep TPM copy and paths outside reusable crates.

## Implementation Readiness Checklist

Before writing Rust implementation code:

- [ ] Add the workspace and `justfile` as additive infrastructure.
- [ ] Decide crate names and initial crate graph.
- [ ] Pin Rust toolchain and components.
- [ ] Add Rust QA commands to local and CI gates as non-replacing checks.
- [ ] Add a parity-test policy to the docs.
- [ ] Pick the first two migration targets: diagnostics/workspace, then site
      doctor or image asset locations.
- [ ] Create fixtures for active TPM site plus one neutral starter/example.
- [ ] Define versioned JSON output envelope for CLI reports.
- [ ] Document allowed dependency/license policy in `deny.toml`.

## Supporting Research

The supporting research packet is in
[`rust-migration-research/`](./rust-migration-research/):

- [Repo Migration Audit](./rust-migration-research/REPO_MIGRATION_AUDIT.md)
- [Rust Tooling Strictness](./rust-migration-research/RUST_TOOLING_STRICTNESS.md)
- [CLI, Tauri, And Just Architecture](./rust-migration-research/CLI_TAURI_JUST_ARCHITECTURE.md)
- [Source Log](./rust-migration-research/SOURCE_LOG.md)
