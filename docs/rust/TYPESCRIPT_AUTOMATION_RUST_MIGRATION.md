# TypeScript Automation To Rust Migration

This ledger tracks the migration that removes repository-owned TypeScript
automation from the developer and CI command surface. TypeScript remains valid
for Astro/frontend source, frontend tests, framework configuration, and the
retained PDF generator exception. Repository workflows should be reachable
through `just`, with durable deterministic logic owned by Rust operations or
small internal Rust task adapters. Internal repository automation lives in
`crates/tpm-xtask/`; it is intentionally separate from the user-facing `tpm`
product CLI.

## Migration Rules

- `just` is the human command router.
- Rust owns deterministic repository logic, diagnostics, generated-output
  checks, source validation, reports, and future CLI/GUI/MCP reusable
  contracts.
- `tpm-xtask` owns internal repository maintenance adapters behind focused
  `just` recipes. Do not expose repo maintenance commands through the public
  `tpm` CLI unless they become product workflows.
- Astro, Vitest, Playwright, ESLint, Prettier, Markdownlint, Wrangler,
  Lighthouse CI, Gitleaks, Pagefind, Bun install/test/audit, and similar tools
  remain ecosystem adapters when they are the correct implementation boundary.
- `scripts/build/generate-article-pdfs.ts` is the explicit legacy exception.
  It remains behind `just build-pdf` and is not ported or deleted in this
  migration.
- A TypeScript automation file may be deleted only after its `just` recipe has
  a replacement and focused verification has passed or the command is
  intentionally removed as obsolete review tooling.

## Replacement Ledger

| Old TypeScript automation                                             | `just` surface                                       | Target owner                                                                        | Status   |
| --------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| `scripts/build/build-raw.ts`                                          | `build-raw`                                          | Rust task adapter over Astro/Pagefind ecosystem tools                               | Replaced |
| `scripts/build/build-output-optimizer.ts`                             | `build-optimize`                                     | Rust generated-output raster-pruning task with accepted narrower optimization scope | Replaced |
| `scripts/build/optimize-build-output.ts`                              | `build-optimize`                                     | Rust generated-output raster-pruning task with accepted narrower optimization scope | Replaced |
| `scripts/build/generate-cloudflare-redirects.ts`                      | `build-cloudflare`                                   | Rust redirect writer                                                                | Replaced |
| `scripts/build/generate-article-pdfs.ts`                              | `build-pdf`                                          | Retained TypeScript PDF exception                                                   | Keep     |
| `scripts/build/validate-html.ts`                                      | `validate-html`                                      | Rust task adapter over `html-validate`                                              | Replaced |
| `scripts/build/verify-build.ts` and `scripts/build/verify-build/*.ts` | `verify`                                             | Rust generated-output verifier                                                      | Replaced |
| `scripts/content/verify-content.ts`                                   | `content-check`                                      | Rust content verifier                                                               | Replaced |
| `scripts/content/normalize-tags.ts`                                   | `tags-check`, `tags-normalize`                       | Rust tag normalizer                                                                 | Replaced |
| `scripts/content/audit-article-references.ts`                         | none                                                 | Retired review-only command removed from active `just` surface                      | Removed  |
| `scripts/content/audit-bibtex-citations.ts`                           | none                                                 | Retired review-only command removed from active `just` surface                      | Removed  |
| `scripts/content/catalog-article-references.ts`                       | none                                                 | Retired review-only command removed from active `just` surface                      | Removed  |
| `scripts/content/migrate-mechanical-article-references.ts`            | none                                                 | Retired review-only command removed from active `just` surface                      | Removed  |
| `scripts/site/generate-site-config-schema.ts`                         | `site-schema`, `site-schema-check`                   | Rust schema check/write adapter                                                     | Replaced |
| `scripts/site/site-doctor.ts`                                         | `site-doctor`                                        | Rust site doctor                                                                    | Promoted |
| `scripts/site/verify-starter-templates.ts`                            | `starters-check`                                     | Rust starter verifier                                                               | Replaced |
| `scripts/assets/verify-image-asset-locations.ts`                      | `assets-locations`                                   | Rust media verifier                                                                 | Replaced |
| `scripts/assets/find-shared-assets.ts`                                | `assets-shared`                                      | Rust shared-asset verifier                                                          | Replaced |
| `scripts/assets/find-duplicate-images.ts`                             | `assets-duplicates`                                  | Rust duplicate-image verifier                                                       | Replaced |
| `scripts/assets/find-unused-images.ts`                                | `assets-unused`                                      | Rust unused-image verifier                                                          | Replaced |
| `scripts/docs/generate-platform-references.ts`                        | `docs-references`, `docs-references-check`           | Rust documentation reference checker                                                | Replaced |
| `scripts/quality/diagnostic-diff.ts`                                  | `diagnostics-diff`                                   | Rust diagnostic diff                                                                | Promoted |
| `scripts/quality/qa-command-registry.ts`                              | `qa-registry`, `test-config`                         | Rust operation plus config tests                                                    | Replaced |
| `scripts/quality/qa-failure-probes.ts`                                | `test-config`                                        | Retired with config guard coverage retained                                         | Removed  |
| `scripts/quality/verify-component-catalog.ts`                         | `catalog-check`                                      | Rust catalog accountability verifier                                                | Replaced |
| `scripts/quality/verify-platform-boundaries.ts`                       | `platform-check`                                     | Rust platform boundary verifier                                                     | Replaced |
| `scripts/testing/sync-astro-test-store.ts`                            | `test-astro`                                         | Rust setup adapter                                                                  | Replaced |
| `scripts/testing/verify-test-accountability.ts`                       | `test-accountability`, `test-accountability-release` | Rust source/test accountability verifier                                            | Replaced |
| `scripts/testing/run-randomized-tests.ts`                             | `test-flake`                                         | Rust test runner adapter                                                            | Replaced |
| `scripts/testing/run-catalog-tests.ts`                                | `test-catalog`                                       | Rust catalog test orchestrator                                                      | Replaced |
| `scripts/testing/verify-test-coverage.ts`                             | private `coverage-verify` behind `coverage-ts`       | Rust LCOV coverage verifier                                                         | Replaced |
| `scripts/payload/report-payload.ts`                                   | `payload-check`, `payload-report`                    | Rust payload report and budget verifier                                             | Replaced |
| `scripts/payload/minify-html-experiment.ts`                           | none                                                 | Retired review-only command removed from active `just` surface                      | Removed  |
| `scripts/payload/run-critical-css-experiment.ts`                      | none                                                 | Retired review-only command removed from active `just` surface                      | Removed  |
| `scripts/payload/run-minify-html-experiments.ts`                      | none                                                 | Retired review-only command removed from active `just` surface                      | Removed  |
| `scripts/payload/run-post-build-optimization-experiments.ts`          | none                                                 | Retired review-only command removed from active `just` surface                      | Removed  |
| `scripts/payload/run-vite-build-experiments.ts`                       | none                                                 | Retired review-only command removed from active `just` surface                      | Removed  |

## Accepted Differences

This migration was not a blind port of every TypeScript implementation detail.
The command surface now prefers Rust-owned repository logic, but a few old
script behaviors were intentionally narrowed or retired:

- `build-pdf` remains the only repository-owned TypeScript automation
  exception. The underlying file is
  `scripts/build/generate-article-pdfs.ts`, with its test moved to
  `tests/build/generate-article-pdfs.test.ts`.
- `build-optimize` now performs the active, verified generated-output cleanup:
  removing unreferenced hashed Astro raster assets from `_astro/`. The old
  TypeScript optimizer's extra JS/CSS/SVG minification paths were experimental
  and are not part of the promoted release contract.
- `payload-report` and `payload-check` now provide a Rust-owned raw payload
  report and basic generated-output guard. Compressed-size and route-class
  budget research remains design input for future Rust payload policy instead
  of a retained TypeScript script.
- `site-schema` and `docs-references` now validate or rewrite the existing
  repository artifacts from Rust. They do not regenerate those artifacts from
  TypeScript/Zod source code.
- Reference audits and payload experiment runners were review-only tools. Their
  recipes are absent from `just --list`, and direct internal `tpm-xtask` calls
  to those old names fail with a retired-task usage error instead of succeeding
  as no-ops.
- The TypeScript QA command registry and failure-probe metadata were removed.
  `justfile`, Rust operation reports, and `tests/config` now guard command
  ownership and CI/local parity.

## Verification Ledger

| Check                                                                           | Purpose                                                                 | Status                         |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------ |
| `just test-config`                                                              | Baseline command registry/config guard before command ownership changes | Passed before migration edits  |
| `cargo check --workspace --all-targets --all-features --locked`                 | Rust compile gate while porting tasks                                   | Passed during migration        |
| `cargo clippy --workspace --all-targets --all-features --locked -- -D warnings` | Strict Rust lint gate while porting tasks                               | Passed during migration        |
| `just check-fast`                                                               | Cheap command-surface and source/config gate after command swap         | Passed during migration        |
| `just test-unit`                                                                | JS/TS/Astro unit tests after deleting `tests/scripts`                   | Passed during migration        |
| `just test-catalog`                                                             | Catalog build plus current Playwright catalog invariant suite           | Passed outside sandbox         |
| `just verify`                                                                   | Generated-output verifier after same-site HTTP content cleanup          | Passed: 308 HTML files checked |
| `just rust-check`                                                               | Blocking Rust quality gate after Rust ports                             | Passed                         |
| `just check`                                                                    | Normal local validation after command-surface swap                      | Passed                         |
| `just release-check`                                                            | Full release gate before handoff                                        | Passed outside sandbox         |
| `just coverage-rust`                                                            | Review-only Rust coverage after ports                                   | Passed: 71.53% line coverage   |

`just release-check` was run outside the filesystem sandbox because the release
gate launches Playwright/Chromium for PDF generation and browser tests. The
gate passed with the internal `tpm-xtask` split in place, no public product CLI
surface for internal repository maintenance, the current catalog Playwright
suite, generated-output
verification, E2E tests, Bun audit, Gitleaks, Rust docs, Clippy, Cargo tests,
and `cargo-deny`.

The remaining Rust coverage gap is concentrated in `tpm-xtask` external command
adapter code. That code is intentionally thin IO/process orchestration behind
`just` recipes. Pure helper behavior, task dispatch, catalog target constants,
and user-facing/internal command boundaries are unit-tested; adapter behavior is
covered by focused recipe checks and the release gate. Future changes should
continue extracting pure planning logic from task adapters before adding tests,
rather than adding brittle tests around spawned process plumbing.
