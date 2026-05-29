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
- Use `clap` for command parsing, generated help, typed options, enum values,
  and parser errors instead of maintaining a local parser.
- Prefer parse-don't-verify argument models: command handlers should parse raw
  strings into typed request models before any behavior runs.
- Separate pure planning and verification from filesystem, process, and stdout
  side effects.
- Make coverage gaps actionable. Low coverage should point to a missing test,
  a bad seam, dead code, or a documented process-boundary exception.
- Keep future CLI, GUI, MCP, and CI needs in mind without exposing internal
  repository maintenance as product functionality.

## Handoff Status

This design is active. The first parser/dispatch implementation slice is
complete: `tpm-xtask` now uses a typed `clap` command tree, active commands are
parsed before dispatch, retired task compatibility is isolated, and repeated
manual help/value parsing has been removed from active command dispatch. There
are no known architectural blockers for the remaining extraction work.

The remaining implementation risks are ordinary migration risks: accidentally
changing command behavior while extracting task domains, moving side effects
too deep into domain modules, and preserving old process glue longer than
needed. The sections below name the intended behavior, accepted cleanups, and
verification requirements so those risks remain testable.

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

## Documented CLI Patterns To Follow

The redesign should follow normal Rust CLI patterns instead of inventing an
xtask-specific parser.

Use `clap` as the parser and command-spec layer because its derive API supports
the exact shapes this crate needs:

- `Parser` for the top-level invocation;
- `Subcommand` for the internal task enum;
- `Args` for each task's typed options;
- `ValueEnum` for constrained values such as output formats;
- `CommandFactory` for generated command metadata and help;
- `Parser::try_parse_from` so tests and `run<I, S, W>` can parse supplied
  argv without reading process globals;
- `clap::error::ErrorKind` for centralized help, version, usage, and parser
  failure handling.

Use `clap` derive as the default. Use the builder API only where derive cannot
express a requirement cleanly, such as command metadata introspection during
registry tests. Do not keep a parallel hand-written parser after a command
family has moved to `clap`.

Important constraints:

- Do not use `allow_external_subcommands` as a shortcut for unknown task
  handling. Unknown tasks should fail early and clearly.
- Do not accept arbitrary trailing args unless the task is explicitly a
  pass-through adapter to a known external tool. Those tasks should store the
  pass-through values in a clearly named field such as `extra_args`.
- Do not put side effects, workspace discovery, or command execution in `clap`
  value parsers. Parser code should parse and validate argument shape only.
- Do not rely on generated help as product documentation. Help should be
  accurate, but `just --list`, `COMMANDS.md`, and task-specific docs remain the
  developer-facing command references.
- Do not call `clap::Error::exit()` or `clap::Error::print()` from library
  code. Render parser errors through the repository's output sink so tests can
  assert behavior without process exits or global stdout/stderr writes.
- Keep xtask output plain and deterministic by default. Do not introduce ANSI
  color unless a later developer-facing design explicitly asks for it.

Reference docs:

- [clap derive reference](https://docs.rs/clap/latest/clap/_derive/)
- [clap derive tutorial](https://docs.rs/clap/latest/clap/_derive/_tutorial/index.html)
- [clap `Parser`](https://docs.rs/clap/latest/clap/trait.Parser.html)
- [clap `Error`](https://docs.rs/clap/latest/clap/error/struct.Error.html)
- [clap `ErrorKind`](https://docs.rs/clap/latest/clap/error/enum.ErrorKind.html)

## Target Module Shape

The first stable target is a crate shaped like this:

```text
crates/tpm-xtask/src/
  lib.rs
  main.rs
  cli/
    mod.rs               public parse wrapper for xtask invocations
    commands.rs          clap Parser/Subcommand command tree
    args.rs              shared Args and ValueEnum types
    compatibility.rs     retired-task and legacy boundary handling
    error.rs             clap Error -> CommandExit/output adapter
  command.rs             retired-task metadata and command-surface checks
  dispatch.rs            maps parsed commands to domain handlers
  execution.rs           process execution adapters
  workspace.rs           xtask workspace/root/output discovery adapter
  operation_adapter.rs   shared tpm-operations output bridge
  routes.rs              route, redirect, and HTML target planning
  content.rs             content verification adapters and pure checks
  tags.rs                tag normalization model and mutation planner
  media.rs               image inventory, reference scanning, asset reports
  generated_output.rs    build output checks, optimization, validation plans
  docs.rs                generated-reference checks
  test_orchestration.rs  test-accountability, flake, and catalog planners
  payload.rs             payload report and budget planning
  accountability.rs      existing focused module
  coverage.rs            existing focused module
```

The exact module names can change during implementation, but the direction
should not: domain rules leave `tasks.rs`, side effects become adapters, and
tests move next to the focused modules they exercise.

`cli/` should own parsing and generated help. `dispatch.rs` should receive a
parsed command enum and route it to the correct handler. Domain modules should
receive typed options or domain requests, never raw argv.

The `cli/` module should remain adapter-shaped. It can depend on `clap`.
Domain modules should not expose `clap` types in their public or crate-visible
interfaces. Convert parsed CLI options into domain request types before calling
planning or verification code.

## Command Contract

The human command surface remains `just`. `tpm-xtask` is internal plumbing.
Every public recipe that calls xtask should still be discoverable through
`just --list`.

Each active xtask task should be represented by a `clap` subcommand variant:

```rust
use clap::{Args, Parser, Subcommand, ValueEnum};

#[derive(Debug, Parser)]
#[command(
    name = "tpm-xtask",
    about = "Internal repository automation for TPM development"
)]
pub(crate) struct XtaskCli {
    #[command(subcommand)]
    pub(crate) command: XtaskCommand,
}

#[derive(Debug, Subcommand)]
pub(crate) enum XtaskCommand {
    #[command(name = "build-raw")]
    BuildRaw(BuildRawArgs),

    #[command(name = "coverage-verify", hide = true)]
    CoverageVerify(QuietArgs),
}

#[derive(Debug, Args)]
pub(crate) struct BuildRawArgs {
    #[arg(long = "dir")]
    pub(crate) output_dir: Option<std::path::PathBuf>,

    #[arg(long)]
    pub(crate) quiet: bool,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, ValueEnum)]
pub(crate) enum OperationFormat {
    Text,
    Json,
    Ndjson,
}
```

The `clap` command tree becomes the single source for task names, help text,
argument shapes, valid values, aliases, and hidden/private command visibility.
Domain classification and mutation policy can remain a small typed registry
layer when those concepts are useful for tests, reporting, or safety review.
That registry should reference parsed command variants, not duplicate parser
strings.

Command naming rules:

- Preserve existing hyphenated task names with explicit
  `#[command(name = "...")]` annotations so `just` recipes do not drift.
- Keep private implementation adapters hidden from normal help and from the
  visible developer command index.
- Keep removed historical tasks in a small compatibility module only if they
  still need a deliberate usage error; do not model removed tasks as active
  parser variants.
- Do not expose xtask tasks through the product `tpm` CLI. Promotion to the
  product CLI requires a separate product-shaped operation contract.

`clap` metadata is enough for parser shape and help. Keep higher-level policy
outside the parser:

- mutation safety belongs in a command policy registry or operation request;
- command ownership belongs in command-surface tests and docs;
- product promotion belongs in `tpm` CLI and operation-contract docs;
- retired-command compatibility belongs in a small explicit adapter, not in
  the active parser enum.

## Current Command Inventory

The first parser migration should cover the full active xtask surface instead
of leaving a second parser for unhandled task families. The active commands are
finite and mostly simple.

| Command family                | Parser shape                                  | Notes                                                              |
| ----------------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| `assets-locations`            | `--quiet`                                     | Strict parser should reject unknown flags.                         |
| `assets-shared`               | `--quiet`                                     | Strict parser should reject unknown flags.                         |
| `assets-duplicates`           | `--quiet`, `--fail-on-duplicates`             | Review mode remains controlled by the just recipe.                 |
| `assets-unused`               | `--quiet`, `--fail-on-unused`                 | Review mode remains controlled by the just recipe.                 |
| `build-raw`                   | `--dir <path>`, `--quiet`                     | External Astro/Pagefind execution stays in process adapter.        |
| `build-optimize`              | `--dir <path>`, `--quiet`                     | Output cleanup plan should be pure.                                |
| `build-cloudflare`            | `--dir <path>`, `--quiet`                     | Redirect artifact generation should use typed redirect model.      |
| `catalog-check`               | `--quiet`                                     | Browser execution stays impure.                                    |
| `content-check`               | `--quiet`                                     | Content checks should move toward pure source diagnostics.         |
| `coverage-verify`             | `--quiet`                                     | Remains internal/review-supporting.                                |
| `diagnostics-diff`            | `<expected> <actual>`, shared operation flags | Exactly two positional paths.                                      |
| `docs-references`             | `--quiet`                                     | Mutating generated-reference update.                               |
| `docs-references-check`       | `--quiet`                                     | Non-mutating generated-reference check.                            |
| `migration-baseline`          | shared operation flags                        | No positionals.                                                    |
| `output-verify`               | shared operation flags                        | No positionals.                                                    |
| `payload-report`              | `--dir <path>`, `--quiet`                     | Current code also reads `--dist`; resolve as an accepted cleanup.  |
| `payload-check`               | `--dir <path>`, `--quiet`                     | Same `--dir`/`--dist` cleanup as `payload-report`.                 |
| `platform-check`              | `--quiet`                                     | Boundary checks should be pure where practical.                    |
| `qa-registry`                 | shared operation flags                        | No positionals.                                                    |
| `site-schema`                 | `--output <path>`, `--quiet`                  | Mutating schema generation.                                        |
| `site-schema-check`           | `--output <path>`, `--quiet`                  | Non-mutating schema freshness check.                               |
| `starters-check`              | `--quiet`                                     | Starter registry checks should stay site-neutral.                  |
| `sync-astro-test-store`       | no args                                       | Reject all args.                                                   |
| `tags-check`                  | `--quiet`                                     | Non-mutating tag normalization plan.                               |
| `tags-normalize`              | `--quiet`                                     | Mutating tag normalization apply.                                  |
| `test-accountability`         | `--quiet`                                     | Normal accountability mode.                                        |
| `test-accountability-release` | `--quiet`                                     | Release accountability mode; no separate hand-written parser.      |
| `test-catalog`                | explicit pass-through args                    | Use named `extra_args`, not broad unknown-subcommand handling.     |
| `test-flake`                  | `--runs <count>`, `--seed <seed>`             | Parse `runs` as a non-zero count if practical.                     |
| `validate-html`               | `--dir <path>`                                | HTML target planning should stay pure.                             |
| `verify`                      | `--dir <path>`, `--quiet`                     | Generated-output verification should move to focused module seams. |

Shared operation flags are: `--site <path>`, `--format <text|json|ndjson>`,
`--json`, `--ci`, `--quiet`, `--verbose`, and `--no-color`. `--json` should
become a deterministic alias for `--format json`; if both `--json` and
`--format` are supplied, prefer a usage error over the current order-dependent
manual-parser behavior.

## Accepted Behavior Cleanups

The migration should preserve intended public `just` behavior, but it should
not preserve accidental parser bugs.

Accepted changes:

- Unknown flags should become usage errors for every command unless a command
  explicitly owns a pass-through boundary.
- Missing option values should become usage errors from the parser boundary.
- `--json` and `--format <format>` should no longer be order-dependent.
- `payload-report` and `payload-check` should standardize on the documented
  `--dir <path>` flag. If `--dist` compatibility is kept, it should be a
  hidden alias with a removal note and a test.
- Empty `tpm-xtask` input should render top-level help and return
  `CommandExit::UsageError`, preserving current intent.
- `tpm-xtask help` and `tpm-xtask --help` should render help and return
  `CommandExit::Success`.

Any accepted difference should be named in the implementation PR summary so
reviewers can distinguish intended cleanup from regression.

## Retired Command Compatibility

Retired task names should not be active `clap` subcommands. Keep them in a
small compatibility adapter if the explicit retired-task message is still
valuable.

Recommended flow:

```text
raw argv after binary name
  -> if first arg is a known retired ASCII task, render retired-task message
  -> otherwise prepend binary name and call XtaskCli::try_parse_from
  -> dispatch active command
```

Rules:

- Inspect only the first command token for retired-task compatibility.
- If the first token is not valid Unicode, defer to `clap` so invalid UTF-8 is
  handled consistently.
- Do not allow retired tasks to accept flags or perform work.
- Keep tests for a known retired command, an unknown command, and an active
  command whose name is close to a retired command.

## Parse-First Task Pattern

Each task should follow this shape:

```text
raw args
  -> parse through XtaskCli::try_parse_from
  -> map parser result into CommandExit and output text
  -> dispatch parsed XtaskCommand
  -> build a pure Plan/ReportInput where possible
  -> execute side-effect adapter
  -> render a typed result
```

Examples:

- `build-raw` parses `BuildRawArgs`, builds a `BuildRawPlan` for the Astro and
  Pagefind commands, then executes the planned commands.
- `validate-html` parses `ValidateHtmlArgs`, computes validation targets as
  pure data, then runs the validator.
- `tags-normalize` parses `TagsArgs`, builds a deterministic
  `TagNormalizationPlan`, then writes only when requested.
- `build-cloudflare` parses `BuildCloudflareArgs`, produces a
  `RedirectManifest`, then writes `_redirects`.

Raw `Vec<String>` should not be passed deep into domain code. Unknown flags,
missing values, and mutually exclusive options should be rejected at the parser
boundary.

The public testable entrypoint can stay generic:

```rust
pub fn run<I, S, W>(args: I, output: W) -> io::Result<CommandExit>
where
    I: IntoIterator<Item = S>,
    S: Into<std::ffi::OsString> + Clone,
    W: Write,
```

Internally, prepend the binary name and call `XtaskCli::try_parse_from`. Do not
call `std::env::args_os()` except in `main.rs`.

Parser error handling should be centralized:

- `DisplayHelp` and `DisplayVersion` render successfully using
  `clap::Error::render()` and `CommandExit::Success`.
- `DisplayHelpOnMissingArgumentOrSubcommand` should render help and return a
  usage error unless the command intentionally treats empty input as success.
- unknown commands, invalid values, missing values, and conflicts return
  `CommandExit::UsageError`.
- parser output should come from `clap`, with only a thin adapter to fit the
  repository's `CommandExit` and testable output sink.
- library code should never call process-exiting `clap` methods.

Per-task `help` string checks should disappear. Support `--help`, `-h`, and
the normal `clap` help subcommand. If a legacy `just <recipe> help` form is
kept temporarily, it should be a narrow boundary rewrite with an expiry note,
not repeated inside every handler.

Pass-through task pattern:

```text
known xtask flags
  -> clap parses typed xtask options
  -> remaining explicitly configured pass-through args
  -> external command plan
```

Use this only for tasks whose purpose is to call a specific external tool, such
as Playwright-backed catalog checks. The pass-through boundary must be obvious
in the argument type so reviewers can tell which values are validated by xtask
and which values are delegated to the external tool.

Example pass-through shape:

```rust
#[derive(Debug, Args)]
pub(crate) struct TestCatalogArgs {
    #[arg(long)]
    pub(crate) quiet: bool,

    #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
    pub(crate) extra_args: Vec<std::ffi::OsString>,
}
```

Only use this shape when the command's purpose is explicit delegation. Most
tasks should reject unknown flags.

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

`clap` changes what parser tests should assert. Avoid brittle full help
snapshots. Prefer stable invariants:

- each active recipe-parsed task accepts its documented flags;
- unknown flags fail before side effects;
- enum-like values use `ValueEnum` and reject unsupported values;
- help output contains command name, required arguments, and high-level
  purpose;
- hidden/internal commands are not advertised where they should not be;
- removed commands return the explicit retired-task message if the
  compatibility behavior is retained.

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

2. Add `clap` as the xtask parser dependency.
   - Add `clap` with `derive` at the workspace dependency layer.
   - Introduce `cli/` with `XtaskCli`, `XtaskCommand`, and first shared
     `Args`/`ValueEnum` types.
   - Keep command names stable for every `just _xtask ...` caller.
   - Add parser tests before replacing task-family parsing.

3. Build the parser before changing behavior.
   - Model every active command in `XtaskCommand`.
   - Add shared `QuietArgs`, `OutputDirArgs`, `OperationArgs`, and other
     repeated arg structs only where reuse reduces duplication.
   - Add a compatibility adapter for retired tasks.
   - Add parser tests for every command family.

4. Replace dispatch with parsed commands.
   - Change `run<I, S, W>` to parse `OsString`-like args through `clap`.
   - Dispatch on `XtaskCommand`, not raw names.
   - Keep the existing task bodies temporarily if needed, but pass typed args
     or converted request structs into them.
   - Delete `wants_help`, `value_arg`, and active-task string parsing once no
     active command uses them.

5. Extract process execution and workspace adapters.
   - Keep filesystem/process code narrow and explicitly impure.
   - Pure planners should not call `Command`, read env, or write stdout.

6. Extract highest-coverage-impact domains first.
   - `routes.rs`: redirect formatting, route target planning, Cloudflare output.
   - `media.rs`: image collection, reference scanning, shared/unused/duplicate
     reports.
   - `content.rs` and `tags.rs`: frontmatter parsing, content validation, tag
     normalization.
   - `generated_output.rs`: HTML validation targets and output cleanup plans.

7. Convert task functions into thin adapters.
   - Each task becomes parse -> plan/report -> execute/render.
   - `tasks.rs` should shrink to a dispatcher or disappear in favor of
     `dispatch.rs`.

8. Raise and audit coverage after each extraction.
   - Add meaningful tests near the extracted modules.
   - Document any coverage notes.
   - Keep `just coverage-rust`, `just rust-check`, and `just test-config`
     passing.

## Acceptance Criteria

The redesign is successful when:

- `tasks.rs` no longer owns multiple unrelated domains;
- `clap` owns active task parsing, help, enum values, and usage errors;
- no repeated `wants_help` or `value_arg` pattern remains in migrated command
  families;
- new task behavior can be tested without invoking external commands;
- command help, names, and recipes cannot drift silently;
- public `just` behavior is unchanged unless intentionally documented;
- Rust coverage improves materially and remaining gaps have explanations;
- no internal maintenance task leaks into the user-facing `tpm` CLI;
- docs and tests explain the command ownership model;
- pass-through args exist only where explicitly justified;
- parser strictness catches invalid command shapes before side effects run.

## Developer Handoff Checklist

Before the implementation is considered ready for review:

1. Add `clap` with `derive` as a workspace dependency and wire it only into
   `tpm-xtask`.
2. Add `cli/commands.rs`, `cli/args.rs`, `cli/error.rs`, and
   `cli/compatibility.rs`.
3. Model all active xtask commands with typed `clap` variants.
4. Preserve retired-task messages through the compatibility adapter or
   deliberately remove the compatibility with a documented reason.
5. Replace top-level string dispatch with parsed command dispatch.
6. Delete the active-command manual parser helpers once no active command uses
   them.
7. Add tests for:
   - every active command's accepted flags;
   - unknown commands and unknown flags;
   - help and empty input behavior;
   - retired command compatibility;
   - pass-through behavior for `test-catalog`;
   - accepted behavior cleanups such as `--json`/`--format` conflicts and
     payload `--dir`.
8. Run `just rust-check`, `just test-config`, and `just coverage-rust`.
9. Run the broader gate required by the handoff policy for the actual code
   change.
10. Update `COMMANDS.md`, `docs/rust/RUST_WORKSPACE.md`, and this design doc if the
    implementation intentionally changes any command behavior.

## Completed First Implementation Slice

The first implementation focused on parser/dispatch architecture, not on
extracting every domain at once.

Completed:

1. Add `clap` and the `cli/` module.
2. Model every active command and retired-command compatibility behavior.
3. Replace top-level string dispatch with parsed command dispatch.
4. Convert command args into typed request structs before calling existing task
   bodies or extracted domain planners.
5. Delete manual active-command parser helpers once replaced.
6. Add parser and command-surface tests.
7. Run the Rust and config checks named in the handoff checklist.

The key first win was making invalid command shapes impossible or noisy before
side effects run. The deeper domain extractions now follow behind that stable
typed command boundary.
