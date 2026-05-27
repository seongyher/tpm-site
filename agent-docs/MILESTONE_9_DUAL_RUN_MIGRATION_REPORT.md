# Milestone 9 Dual-Run Migration Report

This milestone moves deterministic tooling toward Rust operations and `just`
without blindly porting accidental script behavior. The corrected target state
is a cleaner command surface:

- `just` is the human command router for Rust and cross-tool QA orchestration;
- GitHub Actions calls `just` recipes instead of package scripts;
- `package.json` no longer exposes the developer workflow surface;
- Rust operations provide typed, reusable reports for CLI, future Tauri GUI,
  MCP, CI, and generated-output tooling;
- Bun remains the package manager and JS test runner, plus an adapter for
  Astro/browser ecosystem tools where Rust is not the right boundary;
- old repository-owned TypeScript tooling remains only as explicitly
  classified, time-boxed fallback debt until each replacement has parity
  evidence or an explicitly accepted improvement.

The full command-surface inventory, end-state policy, and fallback rules are in
[`MILESTONE_9_COMMAND_SURFACE_MIGRATION.md`](./MILESTONE_9_COMMAND_SURFACE_MIGRATION.md).

## Migration Classification

| Domain                          | Current owner                                              | Target owner                                         | Disposition                      | Preserve                                                          | Cleanup target                                                    |
| ------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| Site doctor                     | `site:doctor`                                              | `tpm site doctor`                                    | Rust replacement, dual-run first | Author-facing diagnostics and JSON/quiet behavior                 | Move stable relationship checks behind shared Rust diagnostics    |
| Image assets                    | `assets:*`, `review:assets`                                | `tpm media images`                                   | Rust replacement, dual-run first | Location policy and review-only duplicate evidence                | Unify media inventory so image policy checks scan once            |
| Redirects                       | `build:cloudflare`                                         | `tpm routes redirects`                               | Rust replacement, dual-run first | Legacy permalink redirects, configured redirects, provider limits | Split provider-neutral route policy from Cloudflare formatting    |
| QA registry and diagnostic diff | `test:config`, `diagnostics:diff`                          | `tpm qa registry`, `tpm qa diagnostics-diff`         | Rust replacement, dual-run first | CI/local parity and normalized diagnostic comparison              | Track `just` ownership without preserving package-script wrappers |
| Generated output verification   | `verify`, `validate:html`                                  | `tpm output verify`                                  | Rust report bridge               | Release diagnostics for generated artifacts                       | Split verifier evidence into reusable reports before replacement  |
| Rust package wrappers           | `rust:check`, `rust:coverage`, `rust:deny`, `rust:nextest` | `just rust-*`                                        | Delete candidate, promoted now   | Same Rust gates                                                   | Remove package scripts that only delegate to `just`               |
| Astro renderer ecosystem        | `build:raw`, `typecheck:astro`, `test:astro`               | `just` wrappers over Astro tools when promoted later | Ecosystem wrapper                | Astro rendering and content collection behavior                   | Do not rewrite framework-owned behavior into Rust                 |

## Implemented Rust Operation Surface

The additive CLI now exposes these milestone 9 report commands:

```sh
just cli migration baseline
just cli site doctor
just cli media images
just cli routes redirects
just cli qa registry
just cli qa diagnostics-diff expected.json actual.json
just cli output verify
```

These commands share the operation envelope documented in
[`docs/RUST_OPERATION_CONTRACTS.md`](../docs/RUST_OPERATION_CONTRACTS.md):
stable operation IDs, interface metadata, status, summary details, timings, and
structured diagnostics with source or artifact locations.

## Accepted Differences During Dual Run

Dual-run reports are intentionally not full replacements yet.

- `tpm media images` does not replace every review-only image script behavior.
  It establishes a shared media inventory and reports location violations plus
  duplicate groups as the first durable media-policy slice.
- `tpm routes redirects` reports the merged redirect rule set and Cloudflare
  static redirect limits. `build:cloudflare` still writes deploy artifacts.
- `tpm output verify` is an inventory/report bridge. The TypeScript verifier
  still owns deep generated-output checks for metadata, links, PDFs, scripts,
  and HTML validation.
- `tpm qa registry` reports ownership and migration debt. TypeScript registry
  tests still verify package-script and CI drift.
- `tpm qa diagnostics-diff` matches normalized diagnostic records by tool,
  code, severity, file, route, and message, and compares aggregate counts.
- Rust package-script wrappers were removed because they only delegated to
  `just`. This is an intentional command-surface cleanup, not a behavior
  reduction.

## Verification Expectations

Before milestone 9 handoff, verify:

```sh
cargo fmt --all --check
cargo check --workspace --all-targets --all-features --locked
cargo clippy --workspace --all-targets --all-features --locked -- -D warnings
cargo test --workspace --all-features --locked
just test-config
just docs-references-check --quiet
just release-check
```

The full release gate remains the final authority before handoff. Any future
promotion from dual-run report to source-of-truth command must document parity
evidence, accepted differences, updated command ownership, and release-check
results in the same change.
