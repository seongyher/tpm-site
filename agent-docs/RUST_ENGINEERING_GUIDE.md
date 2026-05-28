# Rust Engineering Guide

This guide translates the repo engineering philosophy into concrete Rust
practice. It should guide Rust work in the platform core, CLI, MCP server,
Tauri backend, internal `xtask` automation, and any future extractable Rust
libraries.

This is not a checklist to satisfy mechanically. It is a set of defaults,
examples, and review heuristics meant to make correct Rust easier to write and
easier to recognize. Follow the intent over the letter: use the smallest
pattern that protects a real invariant, keeps seams clear, and improves future
change safety.

## Goals

Rust in this repository should help us build a durable static publishing
platform, not merely replace TypeScript scripts.

The goals are:

1. Make valid platform behavior easy to express and invalid behavior impossible,
   rejected early, or forced through an explicit escape hatch.
2. Keep messy edges thin by separating pure domain logic from filesystem,
   process, network, provider, UI, and environment adapters.
3. Use typed domain models, newtypes, enums, exhaustive matching, and validated
   constructors to encode publishing invariants.
4. Keep CLI, MCP, Tauri, CI, and future studio surfaces on the same operation
   contracts instead of creating parallel source or workflow models.
5. Keep developer velocity high through narrow APIs, fast focused tests,
   actionable diagnostics, strict compiler/lint gates, and predictable command
   surfaces.
6. Treat documentation, examples, and diagnostics as product surfaces.
7. Keep dependencies boring, deliberate, supply-chain checked, and replaceable
   behind small seams.
8. Avoid unsafe Rust. The workspace forbids it by default, and that policy
   should remain the default for all platform code.

Use this guide with:

- [ENGINEERING_PHILOSOPHY.md](./ENGINEERING_PHILOSOPHY.md)
- [PLATFORM_ROADMAP.md](./PLATFORM_ROADMAP.md)
- [RUST_MIGRATION_AND_CLI_PLAN.md](./RUST_MIGRATION_AND_CLI_PLAN.md)
- [CLI_RUST_GUI_INTEGRATION_PLAN.md](./CLI_RUST_GUI_INTEGRATION_PLAN.md)
- [rust-migration-research/RUST_ENGINEERING_RESEARCH_NOTES.md](./rust-migration-research/RUST_ENGINEERING_RESEARCH_NOTES.md)
- [docs/RUST_WORKSPACE.md](../docs/RUST_WORKSPACE.md)
- [docs/RUST_OPERATION_CONTRACTS.md](../docs/RUST_OPERATION_CONTRACTS.md)

## How To Use This Guide

Use this guide as a biasing layer for judgment. It should help developers and
agents notice risks earlier and choose safer shapes faster. It should not
encourage abstraction for its own sake.

Good use:

- "This value crosses a route boundary, so a validated newtype prevents a real
  class of mistakes."
- "These booleans are mutually exclusive states, so an enum will make future
  states explicit."
- "This function mixes file IO and validation, so split the pure plan from the
  adapter."
- "This provider error reaches CLI, MCP, and GUI, so convert it into a
  structured diagnostic."

Bad use:

- "Every string needs a newtype."
- "Every struct needs a builder."
- "Every adapter needs a trait before there are two implementations."
- "Every lifecycle needs typestate."
- "Every public type must implement every common trait even when the trait
  would lie."

The test is practical: does the pattern make valid changes more local,
obvious, and testable while making invalid behavior impossible or noisy? If the
pattern increases ceremony without protecting an invariant, choose a simpler
shape.

## Research Basis

This guide synthesizes the current repo policy with the following Rust
references:

1. [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/about.html),
   including every topical page from naming through necessities.
2. [Microsoft Rust Guidelines for Agents](https://microsoft.github.io/rust-guidelines/agents/all.txt).
3. [Rust Language Cheat Sheet](https://cheats.rs/).
4. [Rust Design Patterns](https://rust-unofficial.github.io/patterns/).
5. [Canonical Rust Best Practices](https://canonical.github.io/rust-best-practices/).
6. [Blessed.rs crate list](https://blessed.rs/crates).
7. [Ferrous Systems Elements of Rust](https://github.com/ferrous-systems/elements-of-rust).
8. [mre/idiomatic-rust](https://github.com/mre/idiomatic-rust).

These sources mostly agree with our existing direction: idiomatic Rust is
boring, explicit, type-directed, exhaustively checked, well documented, and
tooling-backed. The project-specific conclusion is that Rust should become the
language of platform invariants and operation contracts.

## Core Position

Rust code should form the typed operation core of the platform. Interface
surfaces should be thin.

| Surface                 | Responsibility                                                               |
| ----------------------- | ---------------------------------------------------------------------------- |
| `tpm-core`              | Cross-domain primitives that are genuinely shared.                           |
| `tpm-diagnostics`       | Stable diagnostic data, rendering, redaction, and codes.                     |
| `tpm-workspace`         | Workspace/site path modeling, discovery, inventory, and ignored-path policy. |
| `tpm-operations`        | Operation request/result envelopes and interface-neutral contracts.          |
| `tpm-cli`               | Public CLI command grammar and rendering over shared operations.             |
| `tpm-xtask`             | Internal repo automation adapters behind `just`; not product behavior.       |
| Future MCP/Tauri crates | Interface adapters over the same operation contracts.                        |

The CLI, MCP server, Tauri backend, CI reports, and GUI should call shared
operations. They should not reimplement content discovery, diagnostics, publish
planning, media materialization, or deploy safety in interface-specific code.

## Domain Modeling

### Prefer Domain Types Over Primitive Parameters

Use Rust's type system to make the publishing domain explicit.

Prefer:

- `ArticleSlug`, `RoutePath`, `CanonicalUrl`, `LegacyRedirectSource`;
- `DiagnosticCode`, `SourceLocation`, `ArtifactLocation`;
- `MediaRole`, `MediaReference`, `MaterializedAsset`;
- `ProviderCapability`, `UnsupportedOperation`, `PublishPlan`;
- `WorkspaceRoot`, `SiteRoot`, `SourceRoot`, `OutputArtifactPath`.

Avoid passing naked `String`, `PathBuf`, `bool`, or unrelated `Option<T>` values
through platform APIs when the domain meaning matters.

Good Rust platform code should let the compiler distinguish:

- a source path from a generated artifact path;
- a canonical route from a legacy redirect source;
- a draft from a published entry;
- a dry-run plan from an applied operation;
- a recoverable provider diagnostic from an internal programming error.

Technically valid but against policy:

```rust
pub fn redirect(from: String, to: String) -> Result<(), RedirectError> {
    if !from.starts_with('/') || !to.starts_with('/') {
        return Err(RedirectError::InvalidPath);
    }

    // The strings can still be swapped by the caller, and every consumer has
    // to remember the same route rules.
    Ok(())
}
```

Better when this boundary recurs:

```rust
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LegacyRedirectSource(String);

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CanonicalRoute(String);

pub fn redirect(
    from: LegacyRedirectSource,
    to: CanonicalRoute,
) -> Result<RedirectRule, RedirectError> {
    Ok(RedirectRule { from, to })
}
```

This is not permission to wrap every string. Use the stronger type when the
distinction protects a route, artifact, provider, diagnostic, credential, or
other real domain boundary.

### Use Newtypes For Static Distinctions

The Rust API Guidelines specifically call out newtypes as a way to provide
static distinctions and hide implementation details. In this repo, use
newtypes when two values share a representation but must not be mixed.

Good candidates:

- route and URL strings;
- diagnostic codes;
- operation schema versions;
- provider IDs;
- workspace-relative paths;
- author-facing labels after validation;
- redacted secret handles;
- media hashes and cache keys.

Keep newtypes cheap and readable:

```rust
#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct DiagnosticCode(String);

impl DiagnosticCode {
    /// Creates a diagnostic code after validating the stable code format.
    ///
    /// # Errors
    ///
    /// Returns an error when the code is empty or does not match the stable
    /// diagnostic-code grammar.
    pub fn try_new(value: impl Into<String>) -> Result<Self, DiagnosticCodeError> {
        let value = value.into();
        validate_diagnostic_code(&value)?;
        Ok(Self(value))
    }

    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}
```

Do not use newtypes as ceremony. Use them when they protect a real boundary,
make a recurring concept discoverable, or prevent a known bug class.

When validation is part of the invariant, keep fields private and validate at
construction:

```rust
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProviderId(String);

impl ProviderId {
    /// Creates a provider ID from a site or extension manifest value.
    ///
    /// # Errors
    ///
    /// Returns an error when the ID is empty or contains unsupported
    /// characters.
    pub fn try_new(value: impl Into<String>) -> Result<Self, ProviderIdError> {
        let value = value.into();
        if value.is_empty() || !value.bytes().all(is_provider_id_byte) {
            return Err(ProviderIdError::Invalid(value));
        }

        Ok(Self(value))
    }

    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

fn is_provider_id_byte(byte: u8) -> bool {
    byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-'
}
```

Avoid exposing `pub value: String` unless the type is a passive normalized data
contract and invalid values cannot be constructed through normal code paths.

### Model State With Enums, Not Boolean Clusters

When states are mutually exclusive, model them as enums.

Prefer:

```rust
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PublishMode {
    DraftPreview,
    SubmitForReview,
    PublishNow,
}
```

Avoid:

```rust
pub struct PublishOptions {
    pub draft: bool,
    pub review: bool,
    pub publish: bool,
}
```

The enum forces callers and future maintainers to handle every state. This is
especially important for:

- operation status;
- provider capability support;
- source ownership;
- publish plan/apply lifecycle;
- credential availability;
- media materialization state;
- diagnostic severity;
- output format;
- backup/history mode.

Use exhaustive matching inside the crate when adding a variant should force a
compiler error in every relevant decision point. Use wildcard matches only
when variants are intentionally grouped and the grouping is named in a helper.

Good:

```rust
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ProviderSupport {
    Supported,
    Unsupported { reason: UnsupportedReason },
    RequiresCredential { scope: CredentialScope },
}

pub fn publish_button_state(support: &ProviderSupport) -> PublishButtonState {
    match support {
        ProviderSupport::Supported => PublishButtonState::Enabled,
        ProviderSupport::Unsupported { reason } => {
            PublishButtonState::Disabled(reason.remediation())
        }
        ProviderSupport::RequiresCredential { scope } => {
            PublishButtonState::NeedsCredential(scope.clone())
        }
    }
}
```

Against policy:

```rust
pub struct ProviderSupport {
    pub supported: bool,
    pub needs_credentials: bool,
    pub unsupported_reason: Option<String>,
}
```

The struct allows contradictory states such as `supported: true` with
`unsupported_reason: Some(...)`. Use this simpler shape only if the values are
not mutually exclusive and the combinations are meaningful.

### Validate At Boundaries, Normalize Once

Parse and validate at the first boundary where untrusted or stringly data
enters Rust:

- CLI arguments;
- site/workspace files;
- provider responses;
- JSON fixtures;
- MCP requests;
- Tauri commands;
- environment variables;
- process output.

After validation, pass typed normalized values through the core. Do not repeat
ad hoc validation in every consumer.

If a value is only valid after construction, its fields should usually be
private. Give callers access through methods that preserve invariants.

### Use Builders Only For Real Construction Complexity

The Rust API Guidelines recommend builders for complex construction. In this
repo, a builder is appropriate when a value has many optional fields, staged
defaults, or conditional invariants.

Use simple `new`, `try_new`, `from_*`, or `parse` constructors when the required
inputs are clear.

Builder candidates:

- operation request envelopes;
- provider capability descriptors;
- rich diagnostics;
- publish plans;
- test fixtures with many optional overrides.

Avoid builders that merely hide a long list of required fields. That usually
means the domain model needs smaller subtypes.

### Consider Typestate Sparingly

Typestate can make lifecycle mistakes unrepresentable, but it can also make
APIs noisy. Use it when a state transition is central to correctness.

Good candidates:

- `PublishPlan<DryRun>` to `PublishPlan<Approved>` to `PublishResult`;
- `Workspace<Discovered>` to `Workspace<Validated>`;
- `MediaAsset<Referenced>` to `MediaAsset<Materialized>`.

Avoid typestate when an enum, validated constructor, or operation result is
clearer.

## Crate And Module Boundaries

### Keep Pure Core Logic Below Adapters

The core should be deterministic and easy to test. Messy APIs should be
adapters around it.

Pure core modules may:

- parse already-loaded text;
- validate typed values;
- plan operations;
- compute routes;
- compare artifact inventories;
- format stable JSON;
- produce diagnostics.

Adapter modules may:

- read and write files;
- run subprocesses;
- inspect the environment;
- talk to provider APIs;
- call Astro/Bun/Wrangler;
- access credentials;
- print human output.

The adapter should load raw input, call a pure operation, and render/apply the
result. It should not contain hidden policy.

Technically valid but against policy:

```rust
pub fn check_redirects_file(path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let text = std::fs::read_to_string(path)?;

    for line in text.lines() {
        if !line.starts_with('/') {
            eprintln!("bad redirect: {line}");
        }
    }

    Ok(())
}
```

This mixes file IO, parsing, diagnostics, and terminal output. It is difficult
to reuse from CLI, MCP, Tauri, and CI.

Better:

```rust
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RedirectPlan {
    pub rules: Vec<RedirectRule>,
    pub diagnostics: DiagnosticReport,
}

pub fn plan_redirects(source: &str) -> RedirectPlan {
    let rules = parse_redirect_rules(source);
    let diagnostics = validate_redirect_rules(&rules);

    RedirectPlan { rules, diagnostics }
}

pub fn check_redirects_file(path: &Path) -> Result<RedirectPlan, RedirectIoError> {
    let source = std::fs::read_to_string(path)?;
    Ok(plan_redirects(&source))
}
```

Tests should target `plan_redirects` first. The filesystem adapter gets a much
smaller test or broader integration coverage.

### Keep Interfaces Thin

`tpm-cli` should parse commands, create operation requests, call operations, and
render results. The future MCP and Tauri surfaces should do the same.

If the same behavior appears in CLI and GUI code, move it into an operation.
If the same validation appears in an adapter and a test, move it into a typed
helper. If an operation needs a provider, define a small provider trait or
request object at the operation boundary.

CLI handlers should look boring:

```rust
pub fn run_site_doctor(args: SiteDoctorArgs) -> CommandOutcome {
    let request = SiteDoctorRequest::from_args(args);
    let result = site_doctor(request);

    render_operation_result(result)
}
```

If `run_site_doctor` starts inspecting files, sorting diagnostics, or deciding
provider capabilities, the domain logic is in the wrong place.

### Put Traits Near Consumers Until Extension Needs Are Clear

Traits are useful seams, but large trait hierarchies are expensive. Prefer
concrete types and generic functions until there are multiple implementations
or a real adapter boundary.

Use traits when:

- a provider adapter must be swapped;
- tests need an in-memory provider with the same contract;
- an extension point is part of the product design;
- the trait name expresses a real domain role.

Avoid traits named `Manager`, `Service`, or `Factory` unless the name is
domain-specific and justified. Prefer names such as `SourceProvider`,
`MediaStore`, `PublishWorkflow`, `DeployTarget`, or `DiagnosticSink`.

Use a trait when it clarifies a real extension boundary:

```rust
pub trait DeployTarget {
    fn capabilities(&self) -> DeployCapabilities;
    fn plan_publish(&self, artifact: &StaticArtifact) -> PublishPlan;
}
```

Avoid vague abstraction:

```rust
pub trait DeployManager {
    fn handle(&self, data: String) -> String;
}
```

The second version hides the domain and gives reviewers no way to verify
capabilities, diagnostics, redaction, dry-run behavior, or reversibility.

### Design For Extractability Before Extraction

The roadmap expects some subdomains to become reusable libraries, Astro
integrations, CLI modules, or Tauri/MCP components. Before extraction:

- remove TPM-specific assumptions from the core;
- keep active-site/cwd assumptions at adapters;
- avoid importing Astro, UI, or repo automation from portable crates;
- document stable contracts;
- add fixture tests that do not depend on TPM content;
- identify public API compatibility expectations.

Do not publish a package merely because code is reusable in theory. First make
the internal boundary library-quality.

## API Design Rules

### Follow Rust Naming And Conversion Conventions

Use Rust API Guideline naming conventions:

- `UpperCamelCase` for types, traits, and enum variants;
- `snake_case` for functions, methods, modules, and locals;
- `new` for a primary infallible constructor;
- `try_new` for a validating constructor;
- `parse`/`FromStr` for string parsing;
- `as_` for cheap borrowed views;
- `to_` for potentially allocating or expensive conversions;
- `into_` for owned conversions;
- `iter`, `iter_mut`, and `into_iter` for collections.

Use getters without `get_` unless the method behaves like indexed lookup:

- `route.path()`;
- `diagnostic.code()`;
- `report.diagnostics()`;
- `inventory.get(path)` only when lookup can fail.

### Implement Standard Traits Deliberately

Public domain types should usually derive or implement:

- `Debug` for all public types;
- `Clone`, `Eq`, `PartialEq`, `Ord`, `PartialOrd`, `Hash` where meaningful;
- `Serialize`/`Deserialize` for machine-readable operation contracts;
- `Display` only when there is exactly one obvious human representation;
- `From`, `TryFrom`, `AsRef`, and `FromStr` when they express real conversion;
- `Default` only when there is a real semantic default.

Do not derive traits mechanically when they imply a false contract. For example,
ordering diagnostic reports may need an explicit stable sort key rather than a
derived field-order comparison.

### Prefer Private Fields For Public Types

Public structs should usually have private fields and validated constructors.
This preserves future compatibility and prevents invalid states.

Exceptions are simple data-transfer types that are purely serialized operation
results and whose fields are already fully normalized. Even then, prefer a
constructor or builder when callers could produce an invalid result.

### Be Intentional About Generic Parameters And Trait Objects

Use generics when the operation benefits from static dispatch and precise type
relationships. Use trait objects when heterogeneous providers or runtime
selection are part of the domain.

Do not over-genericize public APIs. Heavy generic signatures can obscure the
domain. If repeated bounds become unreadable, introduce a named trait only when
the trait has a clear domain role.

### Use `#[must_use]` For Values That Represent Work

Use `#[must_use]` on:

- builders;
- operation plans;
- diagnostics reports;
- rendered output values;
- values whose ignored result likely means lost work.

Do not add `#[must_use]` to every trivial getter. Warnings should stay useful.

## Error And Diagnostic Policy

### Separate Internal Errors From Author Diagnostics

Rust errors are not automatically product diagnostics.

Use Rust `Result<T, E>` for recoverable internal operations. Convert failures
into structured diagnostics when the user, author, CI, MCP client, or GUI needs
to understand and fix the issue.

A good author-facing diagnostic should include:

- stable code when practical;
- severity;
- file/source/artifact location;
- cause in author language;
- concrete remediation;
- optional developer note when useful;
- redacted provider or environment context when needed.

Use structured errors for operation-core failures and structured diagnostics
for user-repairable conditions:

```rust
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MediaReferenceError {
    Empty,
    RemoteUrlNotAllowed { value: String },
}

pub fn validate_media_reference(value: &str) -> Result<MediaReference, MediaReferenceError> {
    if value.is_empty() {
        return Err(MediaReferenceError::Empty);
    }

    if value.starts_with("http://") || value.starts_with("https://") {
        return Err(MediaReferenceError::RemoteUrlNotAllowed {
            value: value.to_owned(),
        });
    }

    MediaReference::try_new(value)
}

pub fn media_reference_diagnostic(error: MediaReferenceError) -> Diagnostic {
    match error {
        MediaReferenceError::Empty => Diagnostic::error("media.reference.empty")
            .with_message("Media reference is empty.")
            .with_remediation("Choose a local site asset or remove the field."),
        MediaReferenceError::RemoteUrlNotAllowed { value } => {
            Diagnostic::error("media.reference.remote-url")
                .with_message(format!("Remote media reference is not allowed: {value}"))
                .with_remediation("Download the media into the site asset workspace.")
        }
    }
}
```

Avoid returning `String`, `Box<dyn Error>`, or provider SDK errors from shared
operation crates when the caller needs to branch, redact, render, test, or
stabilize the failure.

### Avoid Panics In Production Paths

The workspace denies `unwrap` and `expect`; keep that policy. Production code
should not panic for invalid content, missing files, provider failures, bad
input, or unsupported operations.

Use panics only for:

- impossible internal invariant failures after exhaustive validation;
- test failures with clear messages;
- genuinely unrecoverable programmer errors where returning a diagnostic would
  hide a bug.

Even then, prefer modeling the state so the panic cannot be reached.

### Preserve Error Context Without Leaking Secrets

Operation errors should include enough context to debug:

- which command/operation was attempted;
- which provider or adapter was involved;
- which path/artifact/route was affected;
- what remediation is available.

They must not leak secrets, tokens, raw credentials, or private provider data.
Any provider-facing error type should have an explicit redaction path before it
can be rendered by CLI, MCP, GUI, CI, or logs.

Prefer typed redaction:

```rust
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CredentialSecret(String);

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RedactedCredential(String);

impl CredentialSecret {
    #[must_use]
    pub fn redacted(&self) -> RedactedCredential {
        RedactedCredential("<redacted>".to_owned())
    }
}
```

Do not rely on "remember not to print this string" as a security boundary.

### Let Callers Decide Presentation

Core operations should return structured results. Human text, JSON, MCP
resources, GUI views, and CI annotations should be renderers over those results.
Do not bake CLI prose into core types.

## Functional And Control-Flow Style

### Use Functional Patterns For Clarity, Not Cleverness

Rust's iterators, `Option`, `Result`, and pattern matching support concise,
typed code. Use them when they make the domain clearer.

Good:

- `collect::<Result<Vec<_>, _>>()` when gathering validated items;
- `map`, `filter`, and `flat_map` for simple transformations;
- tuple matches for decision tables;
- `?` to keep error paths flat;
- `let ... else` for early exits;
- exhaustive `match` for domain states.

Avoid:

- deeply nested combinator chains;
- clever lifetime gymnastics to save one allocation in non-hot paths;
- point-free code that hides the domain;
- mutation scattered through a long function.

Local mutation is fine when it is clearer, especially for report assembly or
adapter code. The core question is whether the reader can see the domain
decision.

### Keep Rightward Pressure Low

Prefer early returns, `?`, `let ... else`, helper functions, and named
intermediate values over deeply nested matches or closures. Rust strictness
should improve clarity, not produce dense code nobody wants to change.

### Match Exhaustively On Internal Domain States

Exhaustive matching is a change-safety tool. When a new state is added, the
compiler should point to the code that needs a decision.

Avoid wildcard arms for internal enums unless:

- the wildcard is intentionally grouping future values;
- the enum is external and may add variants;
- the function is explicitly a fallback renderer.

If a wildcard is necessary, add a short comment explaining why grouping is
correct.

## Dependency Policy

### Prefer Boring Crates And Standard Library Defaults

The current dependency set is intentionally small. Keep it that way.

Before adding a crate, ask:

1. Does this solve a real domain problem we should not own?
2. Is it widely used, maintained, documented, and supply-chain acceptable?
3. Does it reduce complexity more than it adds?
4. Can it stay behind a narrow seam if we later replace it?
5. Will it complicate Tauri, MCP, CI, or cross-platform packaging?

Blessed.rs is useful for discovering common crates, not for approving them.
Cargo-deny remains the enforcement layer for licenses, advisories, yanked
versions, and source policy.

### Good Current Defaults

Current workspace dependencies are appropriate:

- `clap` for typed CLI command parsing;
- `serde`/`serde_json` for operation contracts;
- workspace crates for internal platform boundaries.

Likely future candidates by use case:

- `thiserror` when error enums become repetitive enough to justify it;
- `camino` if UTF-8 paths become a major cross-platform contract;
- `schemars` if Rust-owned operation/config schemas need JSON Schema output;
- `proptest` for parser/path/route/policy invariants;
- `insta` only for stable machine contracts, not broad human prose snapshots;
- `miette` only if its diagnostic model fits our cross-interface diagnostic
  contract without taking over the domain.

Do not add these preemptively. Use them when the domain pressure is real.

### Keep Dependency Types Out Of Stable Contracts

Do not leak dependency-specific types through operation-core public APIs unless
the dependency is intentionally part of the stable contract.

Often okay inside an adapter:

```rust
fn parse_args() -> clap::ArgMatches {
    clap::Command::new("tpm").get_matches()
}
```

Usually wrong in shared operation contracts:

```rust
pub fn run_operation(matches: clap::ArgMatches) -> OperationResult {
    // Core behavior now depends on a CLI parser type.
}
```

Better:

```rust
pub struct SiteDoctorRequest {
    pub workspace: WorkspaceRoot,
    pub format: OutputFormat,
}

pub fn run_operation(request: SiteDoctorRequest) -> OperationResult {
    site_doctor(request)
}
```

This keeps MCP, Tauri, CI, tests, and CLI on one operation shape.

## Tooling Policy

The current Rust gate is intentionally strict:

- `cargo fmt --all --check`;
- `cargo check --workspace --all-targets --all-features --locked`;
- `cargo clippy --workspace --all-targets --all-features --locked -- -D warnings`;
- rustdoc with warnings as errors and private items documented;
- doctests;
- workspace tests;
- `cargo deny check`.

The workspace already denies unsafe Rust, missing docs, missing `Debug`, many
future-incompatible patterns, `unwrap`, `expect`, `todo`, `unimplemented`,
debug printing, wildcard imports, and other high-signal issues.

Future tooling should be adopted according to maturity and signal:

| Tool                  | Default use                           | Promote when                                                                 |
| --------------------- | ------------------------------------- | ---------------------------------------------------------------------------- |
| `cargo llvm-cov`      | Review-only coverage signal.          | Coverage thresholds become low-noise and enforce meaningful gaps.            |
| `cargo-nextest`       | Review-only faster runner.            | We need retries, partitions, JUnit output, or timeout profiles.              |
| `proptest`            | Add for high-value invariant domains. | Route/media/path/provider state spaces need generative coverage.             |
| `cargo-fuzz`          | Targeted parser/security work.        | We own complex parsers or untrusted input surfaces.                          |
| Miri                  | Review/security tool.                 | Unsafe or concurrency-sensitive abstractions are introduced.                 |
| `cargo-semver-checks` | Future public API tool.               | Crates become externally versioned or consumed outside the repo.             |
| `cargo-machete`       | Review dependency hygiene.            | Dependency graph grows enough for unused dependencies to become noisy.       |
| `cargo-geiger`        | Review unsafe dependency exposure.    | Dependency graph grows or public security posture needs an unsafe inventory. |
| `cargo-vet`           | Future supply-chain trust.            | The project ships public binaries or reusable packages at broader scale.     |

Do not weaken current lints to land a migration faster. If a lint is noisy,
use a narrow, reasoned allow at the smallest scope and document why the rule
does not fit that case.

## Testing Policy

### Tests Follow Seams

The best Rust tests should exercise pure domain logic without filesystem,
process, network, or UI coupling.

Good tests cover:

- parsed command grammar;
- workspace discovery decisions with temp fixtures;
- route and redirect normalization;
- operation request/result serialization;
- diagnostic codes and rendering;
- provider capability matrices;
- publish plan state transitions;
- media materialization planning;
- redaction behavior;
- unsupported-operation behavior.

Avoid:

- test-only public exports;
- tests that assert long human prose snapshots;
- broad subprocess tests when a pure parser or planner can be tested directly;
- mocks that duplicate implementation details rather than domain contracts.

If a function is hard to test, first ask whether it mixes concerns. Missing
coverage is often a design signal.

### Use Fixture Strategy Deliberately

Use three fixture types:

1. Small source fixtures for workspace and content behavior.
2. Exact JSON fixtures for machine-readable operation contracts.
3. Focused invalid fixtures for diagnostics and recovery paths.

Keep human renderer tests focused on important fragments and stable structure.
Keep machine output exact.

### Test Behavior, Invariants, And Failure Modes

Each Rust domain should have tests for:

- normal path;
- empty/minimal input;
- invalid input;
- unsupported provider/capability;
- path normalization and platform separators when applicable;
- deterministic sorting;
- JSON compatibility when output is a contract;
- redaction when secrets or credentials are involved.

For state machines, use table tests. For parsers and route/path policies,
consider property tests once the input space grows.

Table-driven tests are the right default for enum/state behavior:

```rust
#[test]
fn unsupported_provider_capabilities_disable_publish_actions() {
    let cases = [
        (
            ProviderSupport::Supported,
            PublishButtonState::Enabled,
        ),
        (
            ProviderSupport::Unsupported {
                reason: UnsupportedReason::MissingCapability("deploy".into()),
            },
            PublishButtonState::Disabled(Remediation::ConnectDeployProvider),
        ),
        (
            ProviderSupport::RequiresCredential {
                scope: CredentialScope::Deploy,
            },
            PublishButtonState::NeedsCredential(CredentialScope::Deploy),
        ),
    ];

    for (support, expected) in cases {
        assert_eq!(publish_button_state(&support), expected);
    }
}
```

Machine-readable operation output should use exact fixture tests:

```rust
#[test]
fn site_status_json_matches_contract_fixture() {
    let result = site_status(valid_fixture_workspace());
    let json = render_json(&result);

    assert_json_eq(json, include_str!("fixtures/site-status.json"));
}
```

Human output should usually use focused assertions:

```rust
#[test]
fn site_status_human_output_names_workspace_and_status() {
    let result = site_status(valid_fixture_workspace());
    let output = render_human(&result);

    assert!(output.contains("site.status"));
    assert!(output.contains("success"));
}
```

Avoid broad snapshots of prose unless the prose itself is the contract.

### Coverage Is A Signal, Not A Game

Maximize meaningful coverage without brittle tests. Remaining uncovered code
should usually be:

- tiny process/IO adapter glue;
- platform-specific command spawning;
- defensive branches that are only reachable through dependency failure;
- code protected by broader integration/release gates.

When uncovered code remains, document the reason near the coverage exception
or in the relevant accountability file. Do not hide weak seams behind
exceptions.

## Documentation Policy

Rust documentation is part of the product contract.

Crates should explain:

- what domain they own;
- what they deliberately do not own;
- how they relate to CLI, MCP, Tauri, CI, and `just`;
- which types are stable operation contracts;
- which modules are adapters.

Public items should document:

- what invariant the type/function represents;
- when to use it;
- what errors mean;
- what panics can occur, ideally none;
- whether output is stable;
- relevant examples.

Use structured rustdoc sections where appropriate:

- `# Errors`
- `# Panics`
- `# Examples`
- `# Compatibility`
- `# Security`

Examples should be realistic but small. Prefer `?` over `unwrap` or `expect` in
docs, matching the Rust API Guidelines and repo lint policy.

Comments should explain why and contract, not restate the code. If a comment
is required to explain a tangled expression, consider extracting a named helper
or domain type instead.

## Security And Safety

### Unsafe Rust Is Forbidden By Default

The workspace has `unsafe_code = "forbid"`. Keep that policy.

If a future dependency or platform integration appears to require unsafe Rust,
the default answer is to avoid owning that code. Prefer established crates,
provider SDKs, or safe abstractions. Any proposal to allow unsafe code must be
a separate design decision with:

- a reason safe Rust cannot satisfy the requirement;
- the smallest possible unsafe boundary;
- safety comments;
- Miri/fuzz tests when applicable;
- security review;
- dependency and supply-chain review.

### Treat Secrets As A Typed Domain

Secrets should never be strings passed through generic output paths. Model:

- secret references;
- redacted display values;
- credential source;
- credential scope;
- permission grants;
- audit events.

The compiler should make it difficult to render raw secrets accidentally.

### Provider Boundaries Need Explicit Trust Levels

Provider data is external input. Validate and normalize it before it enters
core operation contracts. Do not let provider-specific error shapes, IDs, or
capabilities leak into platform-generic models unless wrapped in typed
provider fields.

## Review Heuristics

When reviewing Rust changes, ask:

1. Does this add a domain concept or just a generic helper?
2. Can invalid state be represented? If yes, should it be?
3. Are raw strings, paths, booleans, or option clusters crossing a domain
   boundary?
4. Is IO/process/provider code separated from pure planning and validation?
5. Are all state variants handled exhaustively?
6. Is the error recoverable, and if so does it become an actionable diagnostic?
7. Does the type expose fields that should be private?
8. Does the API follow Rust naming and conversion conventions?
9. Can this be tested without subprocesses or filesystem effects?
10. Are JSON fixtures exact where output is a machine contract?
11. Are docs, examples, and failure modes up to date?
12. Would this code still make sense if reused by CLI, MCP, GUI, and CI?
13. Is there a narrow seam for replacing a provider or dependency later?
14. Does the fastest way to use the API produce valid behavior?

## Technically Valid But Against Repo Policy

Rust permits many shapes that are still wrong for this platform. These examples
are not universal Rust mistakes; they are usually poor fits for TPM's goals.

### Type-Erased Errors In Core APIs

Against policy:

```rust
pub fn discover_workspace(path: &Path) -> Result<Workspace, Box<dyn std::error::Error>> {
    // Convenient, but callers cannot branch, redact, or turn failures into
    // stable diagnostics without downcasting or string matching.
}
```

Better:

```rust
pub fn discover_workspace(path: &Path) -> Result<Workspace, WorkspaceDiscoveryError> {
    // The error enum can preserve source context and convert into diagnostics.
}
```

Binary adapters may use broader application error types at the outer edge, but
shared operation crates should expose domain-shaped errors.

### Meaningless Defaults

Against policy:

```rust
#[derive(Default)]
pub struct PublishPlan {
    pub target: Option<DeployTargetId>,
    pub artifact: Option<StaticArtifact>,
}
```

This creates a "plan" with no target and no artifact. If that state is invalid,
do not derive `Default`.

Better:

```rust
impl PublishPlan {
    pub fn try_new(
        target: DeployTargetId,
        artifact: StaticArtifact,
    ) -> Result<Self, PublishPlanError> {
        Ok(Self { target, artifact })
    }
}
```

### Wildcard Matches That Hide Policy

Against policy:

```rust
match status {
    OperationStatus::Success => ExitCategory::Ok,
    _ => ExitCategory::Failure,
}
```

This makes a future `OperationStatus::PartialSuccess` silently fail as a generic
error without a deliberate decision.

Better:

```rust
match status {
    OperationStatus::Success => ExitCategory::Ok,
    OperationStatus::Failed => ExitCategory::Failure,
    OperationStatus::Blocked => ExitCategory::Blocked,
}
```

### Premature Trait Hierarchies

Against policy:

```rust
pub trait WorkspaceService {
    fn execute(&self, request: WorkspaceRequest) -> WorkspaceResponse;
}
```

This gives us a generic dispatch tunnel before we know the domain operations.

Better:

```rust
pub fn discover_workspace(request: WorkspaceDiscoveryRequest) -> WorkspaceDiscoveryResult {
    // Start concrete. Introduce a trait only when provider substitution or
    // extension loading is real.
}
```

### Test-Only Public API

Against policy:

```rust
pub fn parse_private_manifest_for_test_only(source: &str) -> Manifest {
    parse_manifest(source)
}
```

Better:

```rust
fn parse_manifest(source: &str) -> Manifest {
    // Private pure helper.
}

#[cfg(test)]
mod tests {
    use super::parse_manifest;
}
```

If another crate genuinely needs the helper, promote it as a real domain API
with docs and compatibility expectations.

### Shared Mutable State As A First Answer

Against policy:

```rust
pub struct Diagnostics {
    inner: std::sync::Arc<std::sync::Mutex<Vec<Diagnostic>>>,
}
```

This may be correct for a concurrent sink, but it should not be the default.
Prefer returning owned reports from pure operations, then merging reports at a
known boundary.

## Bug Response Policy

When a Rust bug is found, do more than patch the symptom.

Ask:

1. Why was the bug representable?
2. Which type, enum, constructor, schema, adapter seam, diagnostic, or test
   could make the bug impossible or noisy?
3. Did the bug cross from an impure edge into pure core without validation?
4. Did multiple surfaces duplicate the same policy?
5. Would a property test, table test, fixture, or contract test catch the bug
   class?
6. Did a dependency, provider, or environment assumption leak into core logic?

The fix should usually include one of:

- a stronger type;
- a more explicit enum state;
- a validated constructor;
- a centralized policy helper;
- a diagnostic;
- a fixture;
- a regression test;
- a narrower adapter boundary.

Small bugs still deserve small fixes. But recurring bugs are abstraction
feedback.

## Anti-Patterns To Avoid

Avoid these unless a design document explicitly justifies them:

- stringly typed route, provider, diagnostic, media, or workflow identifiers;
- public structs with unvalidated mutable fields;
- `bool` parameters that choose domain behavior;
- `Option` clusters where an enum state is clearer;
- wildcard enum matches hiding future states;
- CLI handlers that perform domain policy directly;
- MCP or Tauri code with separate operation models;
- provider-specific types leaking into core contracts;
- exact snapshots of human prose;
- public APIs created only for tests;
- large trait hierarchies before real adapter pressure exists;
- dependency additions that save little code but expand supply-chain risk;
- hidden cloning or allocation in APIs that look cheap;
- broad `#[allow]` attributes;
- comments that compensate for unclear domain modeling;
- panics for author/site-owner/provider errors;
- secrets as printable strings.

## Pre-Implementation Checklist For Rust Work

Before implementing substantial Rust work:

1. Name the domain concept and the crate/module that owns it.
2. Identify pure core logic and impure adapters.
3. Identify input boundaries and validation rules.
4. Decide which states must be enums, newtypes, builders, or typestates.
5. Define diagnostics and remediations for recoverable failures.
6. Define JSON/human output contracts if an operation returns artifacts.
7. Write or update design docs for new operation/provider/product contracts.
8. Add focused tests for pure logic before wiring interfaces.
9. Add fixture tests for machine-readable output.
10. Keep CLI/MCP/Tauri/CI code as renderers or adapters over shared operations.
11. Run the relevant focused checks, then `just rust-check` or broader release
    checks before handoff.

The guiding rule is simple: Rust should make the platform easier to change by
making the domain harder to misuse.
