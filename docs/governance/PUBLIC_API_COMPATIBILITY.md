# Public API Compatibility

This document records the Milestone 14 compatibility policy for public or
package-like boundaries. It supports `IRK-205` and `IRK-216`.

## Current Decision

No Rust crate is externally published yet. The workspace intentionally keeps
`publish = false` at the workspace package level. That means Milestone 14
should harden package-like boundaries without pretending they already have
crates.io compatibility commitments.

Current stability tiers:

| Tier                    | Meaning                                                   | Current members                                                                  |
| ----------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Product artifact        | May be distributed to users, but crate API stays private. | `tpm` CLI binary, future packaged Studio app.                                    |
| Private package-like    | Crate has clear seams and internal consumers.             | `tpm-core`, `tpm-diagnostics`, `tpm-workspace`, `tpm-operations`, `tpm-mcp`.     |
| App/private adapter     | Useful only inside this repo/app boundary.                | `tpm-xtask`, `tpm-studio`, Tauri commands, Astro route/layout/component glue.    |
| Internal public TS seam | Stable import path for repo examples and future adapters. | `src/platform/*` entrypoints covered by `examples/platform-entrypoint-consumer`. |
| Deferred candidate      | Plausible future package, not stable enough yet.          | metadata, references, media, output verifier, interactions, UI primitives.       |

## Compatibility Rules

Private package-like crates must:

- keep crate-level docs and public item docs passing under
  `RUSTDOCFLAGS="-D warnings"`;
- use explicit public types only when cross-crate consumers need them;
- keep public enums and structs domain-shaped rather than generic plumbing;
- include tests for stable JSON fixtures or command output where automation
  consumes them;
- avoid exposing implementation-only helper functions as public API;
- keep `publish = false` until an explicit release decision changes it.

Product artifacts must:

- document user-facing commands, safety behavior, and exit status;
- provide generated or checked help/reference documentation;
- include a smoke test for the packaged artifact shape;
- avoid promising library API compatibility unless a library package is
  intentionally published.

Internal public TypeScript seams must:

- be imported by maintained examples or tests;
- avoid active-site singletons and TPM publication literals;
- export domain contracts, constructors, and adapters rather than broad barrel
  files;
- keep package-boundary tests in release checks before being advertised as
  reusable.

## Semver And API Checks

`cargo-semver-checks` is not blocking today because there is no published crate
baseline to compare against. The first crate that becomes externally
published must add:

1. a chosen baseline strategy, such as checking against the previous Git tag or
   published crates.io version;
2. a focused `just` recipe for the semver check;
3. CI/release integration for the public crate only;
4. release governance notes for breaking, deprecated, or migration-relevant
   changes;
5. documentation explaining which APIs are stable and which are internal.

The check should stay scoped to public crates. Internal crates should not carry
fake semver guarantees that slow down necessary architecture work.

## Breaking Change Policy

Breaking changes to public or package-like boundaries require:

- an impacted-surface entry in release governance;
- a migration note;
- a compatibility note;
- rollback or fallback guidance when applicable;
- updated generated command/API docs and examples.

For private package-like crates, this policy is a review discipline. For
public crates or binaries, it becomes a release requirement.

## Verification

Current blocking verification:

- `just rust-check` for docs, lints, tests, and supply-chain policy;
- `just platform-check` for TypeScript platform import boundaries;
- `just docs-references-check` for generated platform reference drift;
- `just cli-reference-check` for generated CLI command reference drift;
- `just distribution-check` for current public-distribution invariants.

Future public-crate verification:

- `cargo-semver-checks` for published Rust crates;
- package/API snapshots for TypeScript package entrypoints if any are
  published;
- external consumer examples that import only supported entrypoints.
