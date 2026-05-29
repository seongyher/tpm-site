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
- old repository-owned TypeScript tooling has been removed from the active
  command surface except the retained PDF generator exception.

The full command-surface inventory, end-state policy, and fallback rules are in
[`MILESTONE_9_COMMAND_SURFACE_MIGRATION.md`](./MILESTONE_9_COMMAND_SURFACE_MIGRATION.md).

## Migration Classification

| Domain                          | Current owner                                              | Target owner                                | Disposition                    | Preserve                                                          | Cleanup target                                                    |
| ------------------------------- | ---------------------------------------------------------- | ------------------------------------------- | ------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| Site doctor                     | `site:doctor`                                              | `tpm site doctor`                           | Rust product operation         | Author-facing diagnostics and JSON/quiet behavior                 | Move stable relationship checks behind shared Rust diagnostics    |
| Image assets                    | `assets:*`, `review:assets`                                | `tpm media images`                          | Rust product operation         | Location policy and review-only duplicate evidence                | Unify media inventory so image policy checks scan once            |
| Redirects                       | `build:cloudflare`                                         | `tpm routes redirects`                      | Rust product operation         | Legacy permalink redirects, configured redirects, provider limits | Split provider-neutral route policy from Cloudflare formatting    |
| QA registry and diagnostic diff | `test:config`, `diagnostics:diff`                          | `just qa-registry`, `just diagnostics-diff` | Internal Rust task             | CI/local parity and normalized diagnostic comparison              | Track `just` ownership without preserving package-script wrappers |
| Generated output verification   | `verify`, `validate:html`                                  | `just output-verify`, `just _xtask verify`  | Internal Rust task             | Release diagnostics for generated artifacts                       | Deepen verifier evidence into reusable reports                    |
| Rust package wrappers           | `rust:check`, `rust:coverage`, `rust:deny`, `rust:nextest` | `just rust-*`                               | Delete candidate, promoted now | Same Rust gates                                                   | Remove package scripts that only delegate to `just`               |
| Astro renderer ecosystem        | `build:raw`, `typecheck:astro`, `test:astro`               | `just` wrappers over Astro tools            | Ecosystem adapter              | Astro rendering and content collection behavior                   | Do not rewrite framework-owned behavior into Rust                 |
| PDF generation                  | `build:pdf`                                                | `just build-pdf`                            | Retained TypeScript exception  | Existing PDF artifact behavior                                    | Redesign, port, or remove in a future PDF-specific decision       |

## Implemented Rust Operation Surface

The additive CLI now exposes these milestone 9 report commands:

```sh
just migration-baseline
just cli site doctor
just cli media images
just cli routes redirects
just qa-registry
just diagnostics-diff expected.json actual.json
just output-verify
```

These commands share the operation envelope documented in
[`docs/rust/RUST_OPERATION_CONTRACTS.md`](../../docs/rust/RUST_OPERATION_CONTRACTS.md):
stable operation IDs, interface metadata, status, summary details, timings, and
structured diagnostics with source or artifact locations.

## Accepted Differences After Promotion

The migration intentionally promotes a cleaner command surface rather than an
exact reproduction of every deleted TypeScript script.

- `tpm media images` does not replace every review-only image script behavior.
  It establishes a shared media inventory and reports location violations plus
  duplicate groups as the first durable media-policy slice.
- `tpm routes redirects` reports the merged redirect rule set and
  `just build-cloudflare` writes Cloudflare Static Assets redirects through the
  internal `tpm-xtask` adapter.
- `just verify` owns the active generated-output gate through internal
  `tpm-xtask` plumbing. It preserves the highest-value release checks now and
  should be deepened as reusable diagnostics in future generated-output work.
- `just build-optimize` keeps the verified generated-output raster pruning
  behavior through internal `tpm-xtask` plumbing. The old TypeScript JS/CSS/SVG
  optimization experiments were not retained as release behavior.
- `just payload-report` and `just payload-check` provide a Rust raw payload
  report and basic generated-output guard through internal `tpm-xtask`
  plumbing. Compressed route-class budgets remain future Rust payload policy
  work.
- `just qa-registry` reports ownership and migration debt. `tests/config`
  guards command-surface drift now that the TypeScript registry is gone.
- `just diagnostics-diff` matches normalized diagnostic records by tool,
  code, severity, file, route, and message, and compares aggregate counts.
- Historical payload experiment and citation audit commands are removed from
  the visible `just` surface; direct internal `tpm-xtask` calls to those names
  return usage errors so they cannot create false-positive review evidence.
- `just build-pdf` remains the sole TypeScript automation exception.

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
promotion from internal Rust task adapter to public product command must
document command language, accepted differences, updated ownership, and
release-check results in the same change.
