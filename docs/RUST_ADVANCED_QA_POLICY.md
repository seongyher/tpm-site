# Rust Advanced QA Policy

This document records the Milestone 14 policy for advanced Rust QA and static
analysis tooling. It supports `IRK-215`, `IRK-217`, and `IRK-218`.

The goal is strict, useful quality automation. The goal is not to collect
noisy tools that produce more ceremony than safety.

## Current Blocking Baseline

Blocking Rust gates remain:

- `cargo fmt --all --check`;
- `cargo check --workspace --all-targets --all-features --locked`;
- `cargo clippy --workspace --all-targets --all-features --locked -- -D warnings`;
- `RUSTDOCFLAGS="-D warnings" cargo doc --workspace --all-features --no-deps --document-private-items --locked`;
- `cargo test --workspace --doc --all-features --locked`;
- `cargo test --workspace --all-features --locked`;
- `cargo deny check`.

This baseline already enforces documentation, lints, tests, locked
dependencies, and supply-chain policy.

## Tool Classifications

| Tool or family            | Current classification          | Reason                                                                                          | Promotion trigger                                                                      |
| ------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `cargo-semver-checks`     | Deferred until public baseline  | No crate is externally published yet, so there is no meaningful published API baseline.         | First crate gets a public compatibility promise.                                       |
| `cargo-machete`           | Review-only candidate           | Useful for dependency cleanup, but macro/bin/lib layouts can create false positives.            | Dependency graph stabilizes or crate extraction adds public dependency review needs.   |
| `cargo-udeps`             | Deferred/review-only            | Nightly cost and false positives are not justified for routine CI today.                        | A dependency cleanup pass finds recurring drift that `cargo-machete` cannot cover.     |
| unsafe inventory/geiger   | Review-only evidence            | Workspace forbids unsafe code, but dependencies may contain unsafe; inventory is not proof.     | Public distribution or dependency review needs third-party unsafe evidence.            |
| `cargo-bloat`/binary size | Release-artifact review         | Useful for CLI/Studio artifacts, too noisy for every local check.                               | CLI or Studio artifacts become public release artifacts.                               |
| Miri                      | Targeted/deferred               | Valuable for unsafe/FFI or tricky memory-model code; current workspace forbids unsafe.          | Unsafe-adjacent dependencies, FFI, or critical pure data-structure logic appears.      |
| sanitizers                | Targeted/deferred               | Similar to Miri; useful only when native/FFI/unsafe-adjacent boundaries justify the cost.       | Native provider adapters, FFI, or low-level parsing appears.                           |
| property tests            | Adopt for parser/policy domains | Strong fit for parsers, path normalization, import/export, route policy, and operation parsing. | When a domain owns broad input spaces or repeated edge-case bugs.                      |
| fuzzing                   | Scheduled for parser/importers  | Useful once Rust owns untrusted or semi-structured input parsing.                               | Rust importers, Markdown/frontmatter parsers, BibTeX parser, or provider input parser. |
| mutation testing          | Review-only targeted            | Useful for mature pure policy crates, but runtime can be high and noisy.                        | A stable pure crate becomes public or bug-prone enough to justify mutation evidence.   |

## Adopted Commands

Milestone 14 adopts local review commands that are safe to run when the tools
are installed:

```sh
just rust-public-api-check
just rust-dependency-review
just rust-binary-size-review
```

These commands should print installation guidance when the optional tool is not
installed. They should not become blocking until the corresponding promotion
trigger is met.

## Blocking Promotion Rules

Promote an advanced tool from review-only to blocking only when all are true:

1. it protects a real public or high-risk boundary;
2. it has low noise in local and CI environments;
3. it has documented ownership and failure policy;
4. it has a stable installation story;
5. it catches a class of bugs not already covered by types, tests, Clippy,
   cargo-deny, docs, or release checks.

If a tool mostly generates judgment evidence, keep it review-only and attach it
to release readiness rather than blocking every local developer.
