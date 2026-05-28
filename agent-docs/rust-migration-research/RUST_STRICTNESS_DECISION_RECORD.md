# Rust Strictness Decision Record

This document records the strictness policy for Rust compiler lints, Clippy
lints, rustfmt policy, and Rust static-analysis tooling in this repository.

The goal is not to collect impressive tools. The goal is deterministic
automated enforcement that keeps the Rust workspace safe, maintainable,
portable, and fast to change.

## Goals

The Rust workspace should support the repo-wide engineering philosophy:

- make good changes easy and bad changes hard;
- make invalid state unrepresentable wherever practical;
- separate pure typed domain logic from filesystem, process, network, browser,
  and deployment adapters;
- use small, testable seams with high coverage;
- forbid hidden unsafe assumptions by default;
- keep CLI, MCP, Tauri, CI, and GUI work on shared operation contracts;
- keep developer workflows fast enough that the safest path is the convenient
  path.

The strictness posture is:

1. Start from "enable every useful check."
2. Only reject a lint or tool when there is a specific reason.
3. If a useful lint exposes cleanup, adopt the lint with the cleanup in the
   same implementation pass rather than postponing the cleanup.
4. Prefer blocking gates when the signal is deterministic, low-noise, and
   directly tied to correctness, safety, security, compatibility, or release
   confidence.
5. Prefer review-only gates when the tool is slow, nightly-only,
   false-positive-prone, provider/environment-sensitive, or useful only during
   focused investigations.

## Evidence Used

Primary references:

- Rustc lint docs: <https://doc.rust-lang.org/rustc/lints/index.html>
- Rustc allowed-by-default lints:
  <https://doc.rust-lang.org/rustc/lints/listing/allowed-by-default.html>
- Cargo lint configuration:
  <https://doc.rust-lang.org/cargo/reference/manifest.html#the-lints-section>
- Cargo workspace inheritance:
  <https://doc.rust-lang.org/cargo/reference/workspaces.html>
- Clippy usage and lint groups:
  <https://doc.rust-lang.org/clippy/usage.html>
- Clippy lint list:
  <https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html>
- rustfmt configuration:
  <https://rust-lang.github.io/rustfmt/>
- cargo-deny:
  <https://embarkstudios.github.io/cargo-deny/>
- cargo-nextest: <https://www.nexte.st/>
- cargo-llvm-cov: <https://github.com/taiki-e/cargo-llvm-cov>
- cargo-machete:
  <https://docs.rs/crate/cargo-machete/latest/source/README.md>
- cargo-udeps: <https://github.com/est31/cargo-udeps>
- cargo-hack: <https://github.com/taiki-e/cargo-hack>
- Miri: <https://github.com/rust-lang/miri>
- cargo-fuzz: <https://rust-fuzz.github.io/book/cargo-fuzz.html>
- cargo-mutants: <https://mutants.rs/>
- proptest: <https://github.com/proptest-rs/proptest>
- loom: <https://github.com/tokio-rs/loom>
- cargo-vet: <https://mozilla.github.io/cargo-vet/>
- cargo-auditable: <https://github.com/rust-secure-code/cargo-auditable>
- cargo-semver-checks: <https://docs.rs/cargo-semver-checks>
- cargo-public-api: <https://github.com/cargo-public-api/cargo-public-api>
- cargo-geiger: <https://github.com/geiger-rs/cargo-geiger>
- Taplo: <https://taplo.tamasfe.dev/cli/introduction.html>
- Kani: <https://model-checking.github.io/kani/>
- Rust sanitizers:
  <https://doc.rust-lang.org/unstable-book/compiler-flags/sanitizer.html>

Local evidence:

- `rustc -W help` from the pinned `1.95.0` toolchain.
- `cargo clippy -- -W help` from the pinned `1.95.0` toolchain.
- Trial runs with selected allow-by-default rustc lints and Clippy restriction
  lints against the current workspace.

Re-run the inventory after every Rust toolchain upgrade. Rust and Clippy lint
sets change over time.

## Current Baseline

The workspace already has a strong baseline:

- Rust edition `2024`, resolver `3`, Rust `1.95.0`.
- `cargo fmt --all --check`.
- `cargo check --workspace --all-targets --all-features --locked`.
- `cargo clippy --workspace --all-targets --all-features --locked -- -D warnings`.
- `RUSTDOCFLAGS="-D warnings" cargo doc --workspace --all-features --no-deps
--document-private-items --locked`.
- `cargo test --workspace --doc --all-features --locked`.
- `cargo test --workspace --all-features --locked`.
- `cargo deny check`.

Current workspace lint groups:

- rustc default warnings are blocking through `warnings = "deny"`;
- rustc default deny lints remain blocking by default;
- `future_incompatible`, `nonstandard_style`, `rust_2018_idioms`, and
  `rust_2024_compatibility` are denied;
- `missing_docs`, `missing_debug_implementations`, `unreachable_pub`,
  `unused_lifetimes`, and `unused_qualifications` are denied;
- `unsafe_code = "forbid"`;
- rustdoc warnings are promoted to errors, and every stable rustdoc lint that
  protects documentation correctness, navigability, or crate-level orientation
  is explicitly denied;
- Clippy `all`, `cargo`, `nursery`, and `pedantic` are enabled and promoted to
  errors by `-D warnings`;
- selected Clippy restriction lints are already denied.

Clippy explicitly warns that `clippy::restriction` should not be enabled as a
whole because it contains lints that restrict valid Rust, can contradict each
other, and should be cherry-picked for the codebase. This record follows that
guidance while still applying an enable-first review to every restriction lint.

## Decision Categories

| Decision                      | Meaning                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| Already blocking              | Covered by the current workspace lint config or command gate.                                   |
| Enable now                    | Add as a blocking lint/tool; current code is expected to pass.                                  |
| Enable with immediate cleanup | Add as blocking and fix the current violations in the same change.                              |
| Review-only                   | Add a recipe/report, but do not make it blocking yet.                                           |
| Do not enable globally        | Do not add as a workspace-wide blocking rule; use targeted local policy if needed.              |
| Not available on stable       | The lint/tool requires nightly or an unstable feature and cannot be a stable blocking rule now. |

## Rustc Lint Decisions

All warn-by-default rustc lints are already blocking through
`warnings = "deny"`. All deny-by-default rustc lints are already blocking by
default. The table below covers the allow-by-default rustc lints in Rust 1.95.

| Lint                                            | Decision                      | Reason                                                                                                                                                                   |
| ----------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `absolute-paths-not-starting-with-crate`        | Do not enable globally        | Style-only. It can make imports noisier without improving safety. Route and module clarity should be handled by module organization, not a global path-style ban.        |
| `ambiguous-negative-literals`                   | Enable now                    | Prevents precedence confusion in numeric expressions. Low noise.                                                                                                         |
| `closure-returning-async-block`                 | Enable now                    | Encourages the clearer async-closure form when applicable. Low noise and useful for future async adapters.                                                               |
| `deprecated-in-future`                          | Enable now                    | Catches future deprecation work before it becomes churn during a toolchain update.                                                                                       |
| `deprecated-safe-2024`                          | Already blocking              | Included in `rust_2024_compatibility`.                                                                                                                                   |
| `deref-into-dyn-supertrait`                     | Enable now                    | High-signal trait-object edge case. Low expected noise.                                                                                                                  |
| `edition-2024-expr-fragment-specifier`          | Already blocking              | Included in `rust_2024_compatibility`.                                                                                                                                   |
| `elided-lifetimes-in-paths`                     | Already blocking              | Included in `rust_2018_idioms`.                                                                                                                                          |
| `explicit-outlives-requirements`                | Already blocking              | Included in `rust_2018_idioms`.                                                                                                                                          |
| `ffi-unwind-calls`                              | Enable now                    | FFI boundaries should be explicit and rare; warning on unwind ABI calls supports the unsafe-by-default policy.                                                           |
| `fuzzy-provenance-casts`                        | Not available on stable       | Present in `rustc -W help`, but stable `1.95.0` rejects it as an unstable lint. Also mostly redundant while `unsafe_code` is forbidden.                                  |
| `if-let-rescope`                                | Already blocking              | Included in `rust_2024_compatibility`.                                                                                                                                   |
| `impl-trait-overcaptures`                       | Already blocking              | Included in `rust_2024_compatibility`.                                                                                                                                   |
| `impl-trait-redundant-captures`                 | Enable now                    | Removes needless precise-capture syntax when it appears. Low noise.                                                                                                      |
| `keyword-idents-2018`                           | Do not enable globally        | Edition 2024 code already rejects current keyword conflicts where relevant. Extra legacy keyword checks are not useful enough for this workspace.                        |
| `keyword-idents-2024`                           | Already blocking              | Included in `rust_2024_compatibility`.                                                                                                                                   |
| `let-underscore-drop`                           | Enable with immediate cleanup | Current tests use `let _ = fs::remove_dir_all(...)`. The lint is correct: ignored cleanup results should be explicit helper behavior, not accidental destructor discard. |
| `linker-messages`                               | Do not enable globally        | Linker warnings can be platform/toolchain-specific and are not a stable source-level policy. Investigate if a release build emits one.                                   |
| `lossy-provenance-casts`                        | Not available on stable       | Stable `1.95.0` rejects it as an unstable lint. Also mostly redundant while `unsafe_code` is forbidden.                                                                  |
| `macro-use-extern-crate`                        | Enable now                    | Macro imports should use the module system. Low noise.                                                                                                                   |
| `meta-variable-misuse`                          | Enable now                    | Macro misuse should fail early. Low noise.                                                                                                                               |
| `missing-copy-implementations`                  | Do not enable globally        | `Copy` is an API promise, not an automatic quality improvement. Derive it deliberately on small value types.                                                             |
| `missing-debug-implementations`                 | Already blocking              | Explicitly denied.                                                                                                                                                       |
| `missing-docs`                                  | Already blocking              | Explicitly denied.                                                                                                                                                       |
| `missing-unsafe-on-extern`                      | Already blocking              | Explicitly denied and included in `rust_2024_compatibility`.                                                                                                             |
| `multiple-supertrait-upcastable`                | Not available on stable       | Stable `1.95.0` rejects it as an unstable lint. Reconsider if it stabilizes.                                                                                             |
| `must-not-suspend`                              | Not available on stable       | Stable `1.95.0` rejects it as an unstable lint. Reconsider if it stabilizes.                                                                                             |
| `non-ascii-idents`                              | Enable now                    | Source identifiers should be ASCII for reviewability and spoofing resistance. User-facing Unicode belongs in content, not identifiers.                                   |
| `non-exhaustive-omitted-patterns`               | Not available on stable       | Stable `1.95.0` rejects it as unstable. Reconsider if it stabilizes.                                                                                                     |
| `redundant-imports`                             | Enable now                    | Removes import clutter. Low noise.                                                                                                                                       |
| `redundant-lifetimes`                           | Enable now                    | Removes needless lifetime noise. Low noise.                                                                                                                              |
| `resolving-to-items-shadowing-supertrait-items` | Not available on stable       | Stable `1.95.0` rejects it as unstable.                                                                                                                                  |
| `rust-2021-incompatible-closure-captures`       | Do not enable globally        | Legacy edition migration lint. Current workspace is edition 2024 and already blocks 2024 compatibility issues.                                                           |
| `rust-2021-incompatible-or-patterns`            | Do not enable globally        | Legacy edition migration lint. Not useful for current 2024 source.                                                                                                       |
| `rust-2021-prefixes-incompatible-syntax`        | Do not enable globally        | Legacy edition migration lint. Not useful for current 2024 source.                                                                                                       |
| `rust-2021-prelude-collisions`                  | Do not enable globally        | Legacy edition migration lint. Not useful for current 2024 source.                                                                                                       |
| `rust-2024-guarded-string-incompatible-syntax`  | Already blocking              | Included in `rust_2024_compatibility`.                                                                                                                                   |
| `rust-2024-incompatible-pat`                    | Already blocking              | Included in `rust_2024_compatibility`.                                                                                                                                   |
| `rust-2024-prelude-collisions`                  | Already blocking              | Included in `rust_2024_compatibility`.                                                                                                                                   |
| `shadowing-supertrait-items`                    | Not available on stable       | Stable `1.95.0` rejects it as unstable.                                                                                                                                  |
| `single-use-lifetimes`                          | Enable now                    | Single-use lifetimes usually add noise instead of clarity. Low noise.                                                                                                    |
| `tail-expr-drop-order`                          | Already blocking              | Included in `rust_2024_compatibility`.                                                                                                                                   |
| `trivial-casts`                                 | Enable now                    | Removes redundant casts. Low noise.                                                                                                                                      |
| `trivial-numeric-casts`                         | Enable now                    | Removes redundant numeric casts. Low noise.                                                                                                                              |
| `unit-bindings`                                 | Enable now                    | Unit bindings are usually leftover code or unclear intent.                                                                                                               |
| `unnameable-types`                              | Enable now                    | Public or effectively public APIs should not expose unnameable types.                                                                                                    |
| `unqualified-local-imports`                     | Do not enable globally        | Style-only and often makes local modules noisier. Use explicit `crate::`/`self::` when it clarifies a boundary.                                                          |
| `unreachable-pub`                               | Already blocking              | Explicitly denied.                                                                                                                                                       |
| `unsafe-attr-outside-unsafe`                    | Already blocking              | Included in `rust_2024_compatibility`.                                                                                                                                   |
| `unsafe-code`                                   | Already blocking              | Explicitly forbidden.                                                                                                                                                    |
| `unsafe-op-in-unsafe-fn`                        | Already blocking              | Explicitly denied and included in `rust_2024_compatibility`.                                                                                                             |
| `unstable-features`                             | Enable now                    | The stable repo should not accidentally depend on nightly feature gates.                                                                                                 |
| `unused-crate-dependencies`                     | Do not enable globally        | Current lib/bin/test package layout produces false positives. Use dependency-specific tools (`cargo-machete`, `cargo-udeps`) as review signals instead.                  |
| `unused-extern-crates`                          | Already blocking              | Included in `rust_2018_idioms`.                                                                                                                                          |
| `unused-import-braces`                          | Enable now                    | Removes import clutter. Low noise.                                                                                                                                       |
| `unused-lifetimes`                              | Already blocking              | Explicitly denied.                                                                                                                                                       |
| `unused-macro-rules`                            | Enable now                    | Catches dead macro arms that default warnings do not currently catch.                                                                                                    |
| `unused-qualifications`                         | Already blocking              | Explicitly denied.                                                                                                                                                       |
| `unused-results`                                | Do not enable globally        | Too broad for a mixed CLI/tooling workspace. Prefer `#[must_use]`, `unused_must_use`, `let_underscore_must_use`, and domain-specific result handling.                    |
| `variant-size-differences`                      | Do not enable globally        | Performance/layout heuristic. It can force boxing or indirection where a typed enum is clearer. Use targeted profiling if a large enum matters.                          |

### Recommended Rustc Additions

Add these as workspace rust lints:

```toml
ambiguous_negative_literals = "deny"
closure_returning_async_block = "deny"
deprecated_in_future = "deny"
deref_into_dyn_supertrait = "deny"
ffi_unwind_calls = "deny"
impl_trait_redundant_captures = "deny"
let_underscore_drop = "deny"
macro_use_extern_crate = "deny"
meta_variable_misuse = "deny"
non_ascii_idents = "deny"
redundant_imports = "deny"
redundant_lifetimes = "deny"
single_use_lifetimes = "deny"
trivial_casts = "deny"
trivial_numeric_casts = "deny"
unit_bindings = "deny"
unnameable_types = "deny"
unstable_features = "deny"
unused_import_braces = "deny"
unused_macro_rules = "deny"
```

Immediate cleanup needed:

- replace ignored test cleanup expressions such as
  `let _ = fs::remove_dir_all(...)` with a small explicit helper or explicit
  `drop(...)` only where discarding the result is intentional and harmless.

## Rustdoc Lint Decisions

Rustdoc output is part of the Rust platform surface. Public Rust APIs should be
documented as intentionally as CLI output, operation envelopes, or generated
site artifacts.

The stable policy is to deny every rustdoc lint that catches broken links,
invalid rendered documentation, missing crate orientation, or ambiguous prose.
Documentation examples are also desirable by default for meaningful public
APIs, but `rustdoc::missing_doc_code_examples` is unstable on Rust `1.95.0`.
It cannot be a stable blocking lint until it stabilizes or the repo deliberately
adds a separate custom documentation-examples checker.

| Lint                                    | Decision                | Reason                                                                                                                                           |
| --------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rustdoc::bare_urls`                    | Already blocking        | Bare URLs should be rendered as explicit links.                                                                                                  |
| `rustdoc::broken_intra_doc_links`       | Already blocking        | Broken internal documentation links make generated docs misleading.                                                                              |
| `rustdoc::invalid_codeblock_attributes` | Enable now              | Invalid code-fence attributes usually mean examples or snippets will render/test incorrectly.                                                    |
| `rustdoc::invalid_html_tags`            | Enable now              | Invalid HTML in docs should fail before publication.                                                                                             |
| `rustdoc::invalid_rust_codeblocks`      | Enable now              | Rust code blocks in docs should parse or be explicitly marked as text/ignore/no_run when appropriate.                                            |
| `rustdoc::missing_crate_level_docs`     | Enable now              | Every crate should explain its role in the workspace and future platform.                                                                        |
| `rustdoc::missing_doc_code_examples`    | Not available on stable | The lint exists in rustdoc help but stable `1.95.0` rejects it as unstable. Revisit on toolchain upgrades or enforce through a custom checker.   |
| `rustdoc::private_doc_tests`            | Do not enable globally  | Private doctest behavior is less useful while docs are built with `--document-private-items`; add targeted doctests where private examples help. |
| `rustdoc::private_intra_doc_links`      | Enable now              | Public docs should not rely on private items as link targets.                                                                                    |
| `rustdoc::redundant_explicit_links`     | Enable now              | Keeps docs easier to maintain by removing redundant explicit link targets.                                                                       |
| `rustdoc::unescaped_backticks`          | Enable now              | Ambiguous backticks make docs render poorly and should be fixed early.                                                                           |

### Recommended Rustdoc Additions

Add these as workspace rustdoc lints:

```toml
invalid_codeblock_attributes = "deny"
invalid_html_tags = "deny"
invalid_rust_codeblocks = "deny"
missing_crate_level_docs = "deny"
private_intra_doc_links = "deny"
redundant_explicit_links = "deny"
unescaped_backticks = "deny"
```

Do not add `missing_doc_code_examples` on stable Rust yet. Keep the product
policy that meaningful public APIs should include examples, but enforce it in
review and revisit automation after every Rust toolchain upgrade.

## Clippy Lint Decisions

Current Clippy groups already cover `clippy::all`, `clippy::cargo`,
`clippy::nursery`, and `clippy::pedantic`, and `cargo clippy` promotes their
warnings to errors with `-D warnings`.

The table below covers every Rust 1.95 `clippy::restriction` lint. Restriction
lints are the main remaining Clippy surface because they are allow-by-default
and intentionally require project-specific review.

| Lint                                   | Decision                      | Reason                                                                                                                                                  |
| -------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `absolute_paths`                       | Do not enable globally        | Style-only. `std::` and `crate::` clarity is sometimes better than forced relative imports.                                                             |
| `arbitrary_source_item_ordering`       | Do not enable globally        | Source order should reflect domain reading order. Rustfmt should own mechanical ordering only where stable.                                             |
| `as_conversions`                       | Do not enable globally        | Too broad. The enabled pedantic cast lints already catch lossy, truncating, sign-loss, precision-loss, and pointer-alignment casts.                     |
| `inline_asm_x86_att_syntax`            | Do not enable globally        | Inline assembly is already blocked by `unsafe_code = "forbid"`.                                                                                         |
| `inline_asm_x86_intel_syntax`          | Do not enable globally        | Inline assembly is already blocked by `unsafe_code = "forbid"`.                                                                                         |
| `assertions_on_result_states`          | Do not enable globally        | Test assertion style lint. Prefer clear assertions, but do not block valid tests globally.                                                              |
| `allow_attributes`                     | Enable now                    | Prefer `expect` or a reasoned local allowance. Helps avoid stale or blanket suppressions.                                                               |
| `allow_attributes_without_reason`      | Already blocking              | Explicitly denied.                                                                                                                                      |
| `as_pointer_underscore`                | Do not enable globally        | Covered enough by cast/pointer lints and unsafe policy. Rare low-value style check.                                                                     |
| `as_underscore`                        | Do not enable globally        | Type inference in casts can be acceptable in local contexts; loss-prone casts are already covered.                                                      |
| `fn_to_numeric_cast_any`               | Do not enable globally        | Function-pointer numeric casts are already covered by safer default/pedantic lints when problematic.                                                    |
| `cfg_not_test`                         | Do not enable globally        | The future platform will use feature/provider cfgs. `unexpected_cfgs` and declared `check-cfg` are the right guardrails.                                |
| `cognitive_complexity`                 | Do not enable globally        | Arbitrary threshold. Use large-file/refactor audits and coverage pressure for design problems.                                                          |
| `create_dir`                           | Do not enable globally        | `create_dir` is valid when parent existence is an invariant. Do not force recursive creation everywhere.                                                |
| `dbg_macro`                            | Already blocking              | Explicitly denied.                                                                                                                                      |
| `default_numeric_fallback`             | Do not enable globally        | Too noisy in tests and simple counters. Use explicit types for domain values where ambiguity matters.                                                   |
| `default_union_representation`         | Do not enable globally        | Union use is outside the safe Rust policy and already constrained by `unsafe_code`.                                                                     |
| `disallowed_script_idents`             | Do not enable globally        | `non_ascii_idents` is the stronger source-identifier policy.                                                                                            |
| `doc_include_without_cfg`              | Do not enable globally        | Low relevance until docs start including external files in Rustdoc. Revisit when that pattern appears.                                                  |
| `doc_paragraphs_missing_punctuation`   | Do not enable globally        | Punctuation is style, not safety. Public docs are already required and rustdoc warnings are blocking.                                                   |
| `unnecessary_safety_doc`               | Do not enable globally        | Unsafe APIs are forbidden; redundant.                                                                                                                   |
| `mem_forget`                           | Already blocking              | Explicitly denied.                                                                                                                                      |
| `else_if_without_else`                 | Do not enable globally        | Style-only and can make simple conditionals worse.                                                                                                      |
| `empty_drop`                           | Enable now                    | Empty `Drop` implementations are suspicious and should be explicit if ever needed.                                                                      |
| `empty_enum_variants_with_brackets`    | Enable now                    | Clear style signal with no downside.                                                                                                                    |
| `empty_structs_with_brackets`          | Enable with immediate cleanup | Current code has unit-like structs written with braces. Unit structs are clearer.                                                                       |
| `big_endian_bytes`                     | Do not enable globally        | Endianness APIs are explicit; use domain tests for binary formats if they appear.                                                                       |
| `host_endian_bytes`                    | Do not enable globally        | Same as above.                                                                                                                                          |
| `little_endian_bytes`                  | Do not enable globally        | Same as above.                                                                                                                                          |
| `error_impl_error`                     | Enable now                    | Error types should implement the standard `Error` trait directly and clearly.                                                                           |
| `exhaustive_enums`                     | Do not enable globally        | The repo intentionally uses closed enums to make invalid state unrepresentable. Public crate semver policy can handle externally exposed enums later.   |
| `exhaustive_structs`                   | Do not enable globally        | Closed structs are a useful invariant for operation models. Public semver policy can handle external APIs later.                                        |
| `exit`                                 | Enable now                    | CLI/process exit should be centralized through typed exit categories, not scattered calls.                                                              |
| `field_scoped_visibility_modifiers`    | Do not enable globally        | Internal DTOs often use `pub(crate)` fields deliberately. Requiring wrapper methods everywhere would add boilerplate without safety.                    |
| `lossy_float_literal`                  | Enable now                    | Low-noise numeric correctness lint.                                                                                                                     |
| `pointer_format`                       | Do not enable globally        | Pointer formatting is rare and not part of current domain safety.                                                                                       |
| `impl_trait_in_params`                 | Do not enable globally        | Harms ergonomic APIs such as `parse(value: impl Into<String>)` without improving correctness.                                                           |
| `renamed_function_params`              | Do not enable globally        | Style-only and can reduce clarity, for example forcing `fmt`'s parameter name to `f` instead of `formatter`.                                            |
| `if_then_some_else_none`               | Enable now                    | Encourages simpler optional-expression structure.                                                                                                       |
| `implicit_return`                      | Do not enable globally        | Opposes idiomatic Rust expression style.                                                                                                                |
| `indexing_slicing`                     | Enable with immediate cleanup | Indexing and slicing can panic. Adopt with safe-access cleanup or narrow, justified local allowances where bounds are proved nearby.                    |
| `multiple_inherent_impl`               | Enable now                    | Keeps type behavior easier to audit. Split by trait impls or modules instead of scattered inherent impls.                                               |
| `module_name_repetitions`              | Do not enable globally        | Domain names intentionally repeat for clarity across crates/modules.                                                                                    |
| `iter_over_hash_type`                  | Enable now                    | Deterministic output matters. Iterating hash maps/sets should be explicit and sorted unless nondeterminism is harmless and locally justified.           |
| `large_include_file`                   | Enable now                    | Prevents accidental binary bloat from included files.                                                                                                   |
| `let_underscore_must_use`              | Enable with immediate cleanup | Ignored `must_use` results should be explicit and rare. Current test cleanup should use a helper.                                                       |
| `let_underscore_untyped`               | Enable with immediate cleanup | Ignored values should have intentional handling, especially around `Result`.                                                                            |
| `decimal_literal_representation`       | Do not enable globally        | Literal-base style policy with low safety value.                                                                                                        |
| `infinite_loop`                        | Do not enable globally        | Event loops or watch loops may be valid in future CLI/studio adapters. Require local structure, not a global ban.                                       |
| `rest_pat_in_fully_bound_structs`      | Enable now                    | Keeps struct patterns honest when every field is already named.                                                                                         |
| `try_err`                              | Enable now                    | Simpler error-return style.                                                                                                                             |
| `wildcard_enum_match_arm`              | Enable with immediate cleanup | Exhaustive enum handling is central to invalid-state prevention. Wildcards should not hide new variants.                                                |
| `clone_on_ref_ptr`                     | Enable now                    | Makes shared ownership clones explicit.                                                                                                                 |
| `expect_used`                          | Already blocking              | Explicitly denied; local allowances require reasons.                                                                                                    |
| `filetype_is_file`                     | Enable with immediate cleanup | Current file walking should decide what to do with directories, files, and other file types explicitly.                                                 |
| `get_unwrap`                           | Already blocking              | `unwrap_used` already blocks the underlying pattern.                                                                                                    |
| `map_err_ignore`                       | Enable now                    | Error context should not be silently discarded.                                                                                                         |
| `map_with_unused_argument_over_ranges` | Enable now                    | Low-noise iterator correctness/style signal.                                                                                                            |
| `return_and_then`                      | Enable now                    | Simpler result/control-flow style.                                                                                                                      |
| `string_lit_chars_any`                 | Do not enable globally        | Micro-style lint. Not enough safety value.                                                                                                              |
| `unwrap_used`                          | Already blocking              | Explicitly denied.                                                                                                                                      |
| `verbose_file_reads`                   | Enable now                    | Prefer direct read helpers where appropriate.                                                                                                           |
| `min_ident_chars`                      | Do not enable globally        | Short names like `i`, `x`, `id`, and `io` are often clearer in small scopes.                                                                            |
| `separated_literal_suffix`             | Do not enable globally        | Contradicts `unseparated_literal_suffix`. Choose one style.                                                                                             |
| `unneeded_field_pattern`               | Enable with immediate cleanup | Removes repetitive struct pattern boilerplate.                                                                                                          |
| `unseparated_literal_suffix`           | Enable now                    | Prefer `10_u32`-style suffix separation for readability. This intentionally rejects `separated_literal_suffix`.                                         |
| `missing_assert_message`               | Do not enable globally        | Assertion messages are useful when failure is ambiguous, but many focused tests are clearer without forced text.                                        |
| `missing_asserts_for_indexing`         | Enable with immediate cleanup | If indexing remains, prove bounds with nearby assertions or replace it with safe access.                                                                |
| `missing_docs_in_private_items`        | Do not enable globally        | Too noisy. Public docs are required; private code should be clarified through names, module docs, and focused comments where needed.                    |
| `missing_inline_in_public_items`       | Do not enable globally        | Inline hints are performance policy, not a global documentation/correctness rule.                                                                       |
| `missing_trait_methods`                | Do not enable globally        | Default trait methods can be intentional extension points.                                                                                              |
| `mixed_read_write_in_expression`       | Enable now                    | Avoids confusing mutation/read order.                                                                                                                   |
| `mod_module_files`                     | Do not enable globally        | Contradicts `self_named_module_files`; current module layout should be chosen by domain navigability.                                                   |
| `self_named_module_files`              | Do not enable globally        | Contradicts `mod_module_files`; current module layout should be chosen by domain navigability.                                                          |
| `multiple_unsafe_ops_per_block`        | Do not enable globally        | Unsafe code is forbidden, so this is redundant.                                                                                                         |
| `mutex_atomic`                         | Enable now                    | Prefer atomics over mutexes for atomic values.                                                                                                          |
| `mutex_integer`                        | Enable now                    | Prefer atomics or explicit state types over mutex-wrapped integers.                                                                                     |
| `non_zero_suggestions`                 | Enable now                    | Encourages stronger non-zero types where applicable.                                                                                                    |
| `arithmetic_side_effects`              | Do not enable globally        | Too noisy for counters, lengths, and simple arithmetic. Use checked/domain types where overflow matters. Release builds already enable overflow checks. |
| `float_arithmetic`                     | Do not enable globally        | Future visual/performance code may legitimately use floats. Use module-level restrictions for money, counts, or exact domains.                          |
| `float_cmp_const`                      | Do not enable globally        | Covered enough by `float_cmp` from pedantic where relevant; exact constants can be acceptable in tests.                                                 |
| `integer_division`                     | Do not enable globally        | Valid in counts, pages, chunking, and ratios. Use domain tests for rounding behavior.                                                                   |
| `integer_division_remainder_used`      | Do not enable globally        | Same as above.                                                                                                                                          |
| `modulo_arithmetic`                    | Do not enable globally        | Valid for indexing, chunking, and cyclic behavior when tested.                                                                                          |
| `panic_in_result_fn`                   | Do not enable globally        | Tests and invariant constructors may intentionally panic. Production fallibility should be governed by API design and tests.                            |
| `panic`                                | Do not enable globally        | Panics in tests and impossible-state assertions are valid. Use targeted review for production panics.                                                   |
| `todo`                                 | Already blocking              | Explicitly denied.                                                                                                                                      |
| `unimplemented`                        | Already blocking              | Explicitly denied.                                                                                                                                      |
| `unreachable`                          | Do not enable globally        | `unreachable!` can document impossible states after exhaustive parsing. Prefer `match` exhaustiveness, but do not ban globally.                         |
| `partial_pub_fields`                   | Do not enable globally        | Internal models may intentionally expose selected fields. Public crate API policy can revisit later.                                                    |
| `pathbuf_init_then_push`               | Enable now                    | Prefer clearer direct path construction.                                                                                                                |
| `pattern_type_mismatch`                | Do not enable globally        | Very noisy around normal reference matching. Not enough signal for this repo.                                                                           |
| `precedence_bits`                      | Enable now                    | Bitwise precedence bugs are hard to spot in review.                                                                                                     |
| `pub_use`                              | Do not enable globally        | Re-export style is part of platform boundary design. Do not ban globally.                                                                               |
| `question_mark_used`                   | Do not enable globally        | Opposes idiomatic error propagation.                                                                                                                    |
| `needless_raw_strings`                 | Do not enable globally        | String literal style is local readability.                                                                                                              |
| `deref_by_slicing`                     | Enable now                    | Prefer explicit dereference where slicing is only used to coerce.                                                                                       |
| `redundant_test_prefix`                | Do not enable globally        | Test naming convention is a local readability choice.                                                                                                   |
| `redundant_type_annotations`           | Enable now                    | Removes noise when inference is clear.                                                                                                                  |
| `ref_patterns`                         | Do not enable globally        | Pattern references can be the clearest way to express borrowing.                                                                                        |
| `same_name_method`                     | Enable now                    | Avoids confusing inherent/trait method name collisions.                                                                                                 |
| `semicolon_inside_block`               | Do not enable globally        | Contradicts `semicolon_outside_block`; choose one style.                                                                                                |
| `semicolon_outside_block`              | Enable now                    | Prefer punctuation outside blocks where this lint applies.                                                                                              |
| `shadow_reuse`                         | Do not enable globally        | Controlled shadowing is idiomatic for parse/normalize steps.                                                                                            |
| `shadow_same`                          | Do not enable globally        | Same as above.                                                                                                                                          |
| `shadow_unrelated`                     | Do not enable globally        | Same as above.                                                                                                                                          |
| `single_call_fn`                       | Do not enable globally        | Small single-use helpers are often the right seam for testability and readability.                                                                      |
| `single_char_lifetime_names`           | Do not enable globally        | Short lifetimes are idiomatic when the relationship is simple.                                                                                          |
| `alloc_instead_of_core`                | Do not enable globally        | This is not a `no_std` project.                                                                                                                         |
| `std_instead_of_alloc`                 | Do not enable globally        | This is not a `no_std` project.                                                                                                                         |
| `std_instead_of_core`                  | Do not enable globally        | This is not a `no_std` project.                                                                                                                         |
| `str_to_string`                        | Enable now                    | Prefer `to_owned()` or `String::from` style where appropriate.                                                                                          |
| `string_add`                           | Enable with immediate cleanup | Avoids allocation/ownership surprises. Current code has a simple replacement candidate.                                                                 |
| `string_slice`                         | Enable with immediate cleanup | String slicing can panic on UTF-8 boundaries. Use safe APIs or locally prove byte boundaries.                                                           |
| `suspicious_xor_used_as_pow`           | Enable now                    | Catches a common operator misconception.                                                                                                                |
| `tests_outside_test_module`            | Do not enable globally        | Integration tests under `crates/*/tests/` are conventional and should remain valid.                                                                     |
| `rc_buffer`                            | Enable now                    | `Rc<Vec<_>>`/similar shapes often point to the wrong ownership abstraction.                                                                             |
| `rc_mutex`                             | Enable now                    | `Rc<Mutex<_>>` is usually a confused single-thread/shared-mutable design.                                                                               |
| `undocumented_unsafe_blocks`           | Do not enable globally        | Unsafe code is forbidden; this is redundant.                                                                                                            |
| `unnecessary_safety_comment`           | Do not enable globally        | Unsafe code is forbidden; this is redundant.                                                                                                            |
| `non_ascii_literal`                    | Do not enable globally        | User-facing text, tests, and content fixtures may need Unicode. Source identifiers are covered by `non_ascii_idents`.                                   |
| `unnecessary_self_imports`             | Enable now                    | Removes import clutter.                                                                                                                                 |
| `unused_result_ok`                     | Enable now                    | Calling `.ok()` and discarding the result should be deliberate and rare.                                                                                |
| `unused_trait_names`                   | Enable with immediate cleanup | Anonymous trait imports should use `as _` so intent is clear.                                                                                           |
| `unwrap_in_result`                     | Do not enable globally        | Redundant with `unwrap_used`/`expect_used` plus local test allowances; would mostly add noise in tests returning `Result`.                              |
| `pub_with_shorthand`                   | Do not enable globally        | Contradicts the preferred shorthand policy.                                                                                                             |
| `pub_without_shorthand`                | Enable now                    | Prefer visibility shorthands such as `pub(crate)` when they express the same boundary.                                                                  |
| `print_stderr`                         | Already blocking              | Explicitly denied.                                                                                                                                      |
| `print_stdout`                         | Already blocking              | Explicitly denied.                                                                                                                                      |
| `use_debug`                            | Do not enable globally        | Debug formatting is appropriate in diagnostics, test failure output, and developer-facing reports.                                                      |

### Recommended Clippy Additions

Add these Clippy restriction lints as blocking lints.

Expected to pass or require only small cleanup:

```toml
allow_attributes = "deny"
clone_on_ref_ptr = "deny"
deref_by_slicing = "deny"
empty_drop = "deny"
empty_enum_variants_with_brackets = "deny"
empty_structs_with_brackets = "deny"
error_impl_error = "deny"
exit = "deny"
filetype_is_file = "deny"
if_then_some_else_none = "deny"
iter_over_hash_type = "deny"
large_include_file = "deny"
let_underscore_must_use = "deny"
let_underscore_untyped = "deny"
lossy_float_literal = "deny"
map_err_ignore = "deny"
map_with_unused_argument_over_ranges = "deny"
missing_asserts_for_indexing = "deny"
mixed_read_write_in_expression = "deny"
multiple_inherent_impl = "deny"
mutex_atomic = "deny"
mutex_integer = "deny"
non_zero_suggestions = "deny"
pathbuf_init_then_push = "deny"
precedence_bits = "deny"
pub_without_shorthand = "deny"
rc_buffer = "deny"
rc_mutex = "deny"
redundant_type_annotations = "deny"
rest_pat_in_fully_bound_structs = "deny"
return_and_then = "deny"
same_name_method = "deny"
semicolon_outside_block = "deny"
str_to_string = "deny"
string_add = "deny"
string_slice = "deny"
suspicious_xor_used_as_pow = "deny"
try_err = "deny"
unneeded_field_pattern = "deny"
unnecessary_self_imports = "deny"
unseparated_literal_suffix = "deny"
unused_result_ok = "deny"
unused_trait_names = "deny"
verbose_file_reads = "deny"
wildcard_enum_match_arm = "deny"
```

Immediate cleanup needed:

- replace ignored cleanup results with explicit helper behavior;
- rewrite unit-like structs with unit struct syntax;
- remove wildcard enum match arms where the enum is closed;
- replace string addition with clearer append/format construction;
- handle non-regular file types deliberately in workspace walking;
- convert anonymous trait imports to `as _`;
- replace direct indexing/slicing with safe access or local proof.

## Rustfmt Decisions

Current stable rustfmt policy is good:

```toml
edition = "2024"
style_edition = "2024"
max_width = 100
hard_tabs = false
tab_spaces = 4
newline_style = "Unix"
force_explicit_abi = true
reorder_imports = true
reorder_modules = true
use_field_init_shorthand = true
use_try_shorthand = true
```

Decisions:

- Keep `cargo fmt --all --check` blocking.
- Keep `cargo fmt --all` inside `just fix`.
- Do not enable unstable rustfmt options. The official rustfmt docs classify
  many options as unstable; depending on nightly rustfmt would make formatting
  less deterministic for a repo that otherwise pins stable Rust.
- Revisit only when a desired option stabilizes or when formatting drift cannot
  be solved by stable rustfmt.

## External Tool Decisions

| Tool                  | Decision                                          | Reason                                                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cargo-deny`          | Already blocking; tighten duplicate policy        | Best current blocking supply-chain gate for advisories, yanks, bans, licenses, and sources. Change `bans.multiple-versions` from `warn` to `deny` during implementation; current `cargo tree -d` showed no duplicate dependency versions.      |
| `cargo-audit`         | Do not add separately as blocking                 | `cargo-deny` already uses the RustSec advisory database and gives broader policy coverage. Use `cargo audit bin` only with auditable release artifacts if needed.                                                                              |
| `cargo-llvm-cov`      | Review-only, already present                      | Coverage is essential as a signal, but percentage thresholds need stable crate responsibilities. Keep running it and use gaps to drive tests/refactors.                                                                                        |
| `cargo-nextest`       | Review-only                                       | Useful for speed, retries, timeouts, and CI reporting once Rust tests grow. Not necessary as the blocking runner while the workspace is small.                                                                                                 |
| `cargo-machete`       | Add review-only                                   | Fast unused-dependency heuristic. Useful because `unused_crate_dependencies` has false positives in mixed lib/bin/test layouts.                                                                                                                |
| `cargo-udeps`         | Add review-only                                   | More compile-aware unused-dependency signal than machete, but requires nightly to run. Not a stable blocking gate.                                                                                                                             |
| `cargo-hack`          | Add review-only now; promote when features matter | Cargo features create untested combinations. Current crates have little feature surface, so feature-matrix runs are low-value today; add a recipe before optional provider/Tauri/MCP features become real.                                     |
| `cargo-geiger`        | Add review-only dependency-unsafe inventory       | Local unsafe is already forbidden, but dependencies can contain unsafe. Use as a visibility/reporting tool, not a blocker until the dependency policy defines acceptable thresholds.                                                           |
| Miri                  | Review-only targeted tests                        | Excellent for undefined behavior detection, but it is nightly/interpreter-based and most valuable when unsafe or tricky concurrency exists. Local unsafe is forbidden, so run targeted Miri when adding low-level code or dependency wrappers. |
| Rust sanitizers       | Review-only targeted tests                        | Nightly/target-specific. Useful for FFI, unsafe, concurrency, and binary integration tests, not a stable global gate for current safe Rust crates.                                                                                             |
| `cargo-fuzz`          | Review-only targeted fuzzing                      | Add when Rust owns parsers/importers for untrusted or semi-structured inputs. Not globally useful until fuzz targets exist.                                                                                                                    |
| `proptest`            | Add selectively in invariant-heavy crates         | Property testing is a test-design dependency, not a global command. Add when invariants are clearer than enumerated examples, especially parsers, path policies, route policies, and operation state transitions.                              |
| `loom`                | Add only for concurrency primitives               | Valuable for custom concurrent code. Do not add globally until the repo owns concurrency abstractions; Tauri/provider adapters may eventually justify it.                                                                                      |
| Kani                  | Review-only targeted verification                 | Valuable for critical pure algorithms and state machines. Too heavy and proof-oriented for a global blocking gate today.                                                                                                                       |
| `cargo-mutants`       | Review-only scheduled signal                      | Strong test-quality signal, but slow and not deterministic enough for every PR. Use scheduled/focused runs for mature pure crates.                                                                                                             |
| `cargo-semver-checks` | Add when Rust crates expose stable external APIs  | Important once crates become package/public API boundaries. Premature for internal-only crates.                                                                                                                                                |
| `cargo-public-api`    | Add when public API snapshots matter              | Useful alongside semver checks when public Rust crates are shipped. Premature for internal-only crates.                                                                                                                                        |
| `cargo-auditable`     | Add for release binaries                          | Useful when distributing compiled Rust CLI/studio binaries because it embeds dependency metadata. Pair with binary vulnerability scanning such as `cargo audit bin` during release verification.                                               |
| `cargo-vet`           | Investigate before external distribution          | Strong supply-chain review model, but it requires a human audit workflow. Add when dependency review ownership exists.                                                                                                                         |
| `cargo-hakari`        | Do not add now                                    | Useful for very large workspaces with feature unification/build-time pressure. Current Rust workspace is small. Reconsider if dependency feature churn slows builds.                                                                           |
| `cargo-bloat`         | Review-only performance investigation             | Useful when binary size becomes a release concern. Not a correctness/static-analysis blocker.                                                                                                                                                  |
| `cargo-msrv`          | Do not add now                                    | The repo intentionally pins latest stable Rust for strictness and velocity. MSRV discovery matters only if shipping libraries to downstream Rust consumers with older compiler support.                                                        |
| `cargo-careful`       | Review-only targeted investigation                | Extra runtime checks are useful for unsafe/precondition-heavy code. Current local unsafe policy makes this nonessential.                                                                                                                       |
| Taplo                 | Add if TOML drift appears during implementation   | Rust configuration lives in TOML and is not formatted by rustfmt. Add behind `just` if Cargo, deny, or rustfmt TOML starts drifting during the strictness implementation.                                                                      |

## Immediate Implementation Plan

When implementing this decision record:

1. Add the recommended rustc and Clippy lints to `[workspace.lints.*]`.
2. Run `just rust-check`.
3. Fix every resulting violation directly, not by broad allowances.
4. Add local `#[expect(..., reason = "...")]` or `#[allow(..., reason = "...")]`
   only where the lint is genuinely wrong for the specific code.
5. Tighten `cargo-deny` duplicate-version policy to blocking if it still passes
   on the current dependency graph.
6. Add `cargo-machete`, `cargo-udeps`, `cargo-hack`, `cargo-geiger`,
   `cargo-mutants`, Miri, fuzzing, Kani, semver, public API, TOML formatting,
   and auditable-binary work only through explicit `just` recipes and
   documentation so the command surface stays discoverable.
7. Keep blocking gates deterministic and low-noise; keep heavy or nightly-only
   tools review-only until they prove stable enough to promote.

## Non-Blocking Follow-Up Questions

These are not reasons to delay useful lints. They are design questions for
future tool promotion:

- What coverage thresholds are useful once Rust crate boundaries stabilize?
- Which parser/importer domains need fuzz targets first?
- Which operation contracts deserve public API snapshots before external
  package extraction?
- What dependency-unsafe report is acceptable for release artifacts?
- When the CLI/studio binary ships, which release path owns auditable binary
  generation and verification?
