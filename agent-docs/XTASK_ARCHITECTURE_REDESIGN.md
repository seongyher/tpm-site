# Xtask Architecture Redesign

This document defines the target architecture for `crates/tpm-xtask`, the
internal Rust automation crate behind repository `just` recipes. The goal is to
turn xtask from a monolithic script port into a maintainable, typed, highly
tested command adapter layer.

## Goals

- Keep internal repository automation separate from the user-facing `tpm` CLI.
- Preserve public `just` behavior while improving the Rust implementation
  underneath it.
- Replace the monolithic `tasks.rs` shape with domain modules that are small
  enough to understand, test, and evolve independently.
- Prefer parse-don't-verify argument models: command handlers should parse raw
  strings into typed request models before any behavior runs.
- Separate pure planning and verification from filesystem, process, and stdout
  side effects.
- Make coverage gaps actionable. Low coverage should point to a missing test,
  a bad seam, dead code, or a documented process-boundary exception.
- Keep future CLI, GUI, MCP, and CI needs in mind without exposing internal
  repository maintenance as product functionality.

## Current Problems

`crates/tpm-xtask/src/tasks.rs` is too broad. It currently owns:

- top-level command dispatch;
- usage text;
- argument parsing;
- workspace discovery;
- process execution;
- content checks;
- tag normalization;
- route and HTML target planning;
- redirect generation;
- image inventory;
- asset reference scanning;
- generated-output cleanup;
- docs/reference checks;
- catalog/platform checks;
- test orchestration;
- coverage verification wiring;
- payload reports;
- shared filesystem and glob helpers;
- a large mixed test module.

This creates predictable failure modes:

- similar help, argument, and error handling is duplicated across tasks;
- many functions verify strings inline instead of parsing typed options once;
- pure rules are mixed with filesystem/process execution;
- tests have to reach into a giant module instead of focused domain seams;
- coverage is low because many branches are process glue, repeated adapters, or
  logic that should have been extracted;
- adding a new task requires knowing unrelated details in the same file.

## Target Module Shape

The first stable target is a crate shaped like this:

```text
crates/tpm-xtask/src/
  lib.rs
  main.rs
  command.rs             typed task names and registry metadata
  dispatch.rs            top-level internal dispatcher
  args.rs                shared argument parsers and option helpers
  execution.rs           process execution adapters
  workspace.rs           xtask workspace/root/output discovery adapter
  operation_adapter.rs   shared tpm-operations output bridge
  routes.rs              route, redirect, and HTML target planning
  content.rs             content verification adapters and pure checks
  tags.rs                tag normalization model and mutation planner
  media.rs               image inventory, reference scanning, asset reports
  generated_output.rs    build output checks, optimization, validation plans
  docs.rs                generated-reference checks
  tests.rs               test orchestration planners
  payload.rs             payload report and budget planning
  accountability.rs      existing focused module
  coverage.rs            existing focused module
```

The exact module names can change during implementation, but the direction
should not: domain rules leave `tasks.rs`, side effects become adapters, and
tests move next to the focused modules they exercise.

## Command Contract

The human command surface remains `just`. `tpm-xtask` is internal plumbing.
Every public recipe that calls xtask should still be discoverable through
`just --list`.

Each xtask task should eventually be represented by a typed spec:

```rust
pub(crate) struct TaskSpec {
    pub(crate) name: &'static str,
    pub(crate) usage: &'static str,
    pub(crate) domain: TaskDomain,
    pub(crate) mutation: MutationPolicy,
}
```

The spec should be the single source for task name, help text, command-domain
classification, and mutation policy when practical. This prevents help text,
registry docs, and command tests from drifting.

## Parse-First Task Pattern

Each task should follow this shape:

```text
raw args
  -> parse into TaskOptions or usage error
  -> build a pure Plan/ReportInput where possible
  -> execute side-effect adapter
  -> render a typed result
```

Examples:

- `build-raw` parses `BuildRawOptions`, plans the Astro and Pagefind commands,
  then executes the planned commands.
- `validate-html` parses `ValidateHtmlOptions`, computes validation targets as
  pure data, then runs the validator.
- `tags-normalize` parses `TagOptions`, builds a deterministic
  `TagNormalizationPlan`, then writes only when requested.
- `build-cloudflare` parses `CloudflareRedirectOptions`, produces a
  `RedirectManifest`, then writes `_redirects`.

Raw `Vec<String>` should not be passed deep into domain code. Unknown flags,
missing values, and mutually exclusive options should be rejected at the parser
boundary.

## Pure Planning Seams

Every task that runs external commands or touches the filesystem should expose
at least one pure seam when useful:

- options parser;
- command plan builder;
- source artifact classifier;
- route/redirect formatter;
- diagnostic/report builder;
- output path planner;
- mutation plan.

Tests should target these seams with meaningful assertions. Process execution
itself can remain thin and lightly tested because it delegates to external
tools.

## Coverage Policy

Coverage should push design quality up, not encourage fake tests.

Expected policy:

- test parsers, planners, classifiers, formatters, and report builders;
- refactor mixed process/domain code when coverage is blocked by bad seams;
- keep process execution wrappers thin;
- avoid test-only exports;
- avoid tests that merely execute branches without asserting behavior;
- require a nearby `Coverage note:` for genuinely untestable process,
  generated-output, browser, or platform boundary paths;
- report any added or relied-on coverage notes during handoff.

Rust-specific note: `cargo-llvm-cov` supports file exclusion through
`--ignore-filename-regex` and function/module exclusion through Rust's
`#[coverage(off)]` attribute, but the Rust coverage attribute is still
unstable. Because this repo pins stable Rust, prefer refactors, tests, and
documented `Coverage note:` comments over function-level ignore attributes.
Use file-pattern coverage excludes only for generated code, test harnesses,
process entrypoints, or similarly untestable boundaries with explicit
justification.

Reference docs:

- [cargo-llvm-cov README: exclude files and code](https://docs.rs/crate/cargo-llvm-cov/latest/source/README.md#exclude-file-from-coverage)
- [Rust Unstable Book: `coverage_attribute`](https://doc.rust-lang.org/beta/unstable-book/language-features/coverage-attribute.html)

## Migration Sequence

1. Stabilize command surface language.
   - Public commands: `coverage`, `coverage-ts`, `coverage-rust`.
   - Private implementation adapters stay hidden from `just --list`.
   - Config tests protect against command drift.

2. Extract shared operation adapter.
   - Move operation output format parsing and rendering into a focused module.
   - Test format, site, positional, and error parsing.

3. Extract shared argument and task-spec model.
   - Centralize help detection, value parsing, usage text, and task metadata.
   - Replace scattered `wants_help`/`value_arg` use over time.

4. Extract process execution and workspace adapters.
   - Keep filesystem/process code narrow and explicitly impure.
   - Pure planners should not call `Command`, read env, or write stdout.

5. Extract highest-coverage-impact domains first.
   - `routes.rs`: redirect formatting, route target planning, Cloudflare output.
   - `media.rs`: image collection, reference scanning, shared/unused/duplicate
     reports.
   - `content.rs` and `tags.rs`: frontmatter parsing, content validation, tag
     normalization.
   - `generated_output.rs`: HTML validation targets and output cleanup plans.

6. Convert task functions into thin adapters.
   - Each task becomes parse -> plan/report -> execute/render.
   - `tasks.rs` should shrink to a dispatcher or disappear in favor of
     `dispatch.rs`.

7. Raise and audit coverage after each extraction.
   - Add meaningful tests near the extracted modules.
   - Document any coverage notes.
   - Keep `just coverage-rust`, `just rust-check`, and `just test-config`
     passing.

## Acceptance Criteria

The redesign is successful when:

- `tasks.rs` no longer owns multiple unrelated domains;
- new task behavior can be tested without invoking external commands;
- command help, names, and recipes cannot drift silently;
- public `just` behavior is unchanged unless intentionally documented;
- Rust coverage improves materially and remaining gaps have explanations;
- no internal maintenance task leaks into the user-facing `tpm` CLI;
- docs and tests explain the command ownership model.

## First Implementation Slice

For the current pass, implement the safe first slices:

- make coverage commands explicit and ergonomic;
- update docs, CI, and config tests for the command surface;
- extract `operation_adapter.rs` as a focused, tested module;
- extract `frontmatter.rs`, `routes.rs`, `redirects.rs`, and `tags.rs` so
  parser, planner, formatter, and normalization rules have local tests;
- add this design as the guide for future deeper extraction;
- run Rust coverage and record remaining `tasks.rs` gaps rather than hiding
  them.

The deeper domain extractions should follow this design, but they do not need
to all happen in a single risky patch. The key is that future work should move
steadily toward this architecture instead of adding more behavior to
`tasks.rs`.
