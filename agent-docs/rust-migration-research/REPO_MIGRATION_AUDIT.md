# Repo Migration Audit For Rust

This audit maps the repository to Rust migration candidates from the
pre-migration baseline. It was based on the package-script command surface,
`scripts/`, `src/platform/`, representative source modules, the platform
roadmap, and the CLI strategy at the time it was written.

Status note: the current repository now has a Rust workspace, a canonical
`just` command router, and no package scripts. Use
`agent-docs/MILESTONE_9_COMMAND_SURFACE_MIGRATION.md`,
`agent-docs/MILESTONE_9_DUAL_RUN_MIGRATION_REPORT.md`, and `COMMANDS.md` for
the current command state. This document remains useful as migration rationale
and historical baseline.

## Current State

At the time of this audit, the repo was Bun-first. `package.json` owned the
public command surface and contained many mature quality gates:

- source/content checks;
- Astro builds and static output optimization;
- generated-output verification;
- HTML validation;
- route, feed, sitemap, PDF, metadata, link, media, and cache checks;
- component catalog builds;
- Playwright, a11y, performance, and component tests;
- markdown review and docs generation;
- dependency/security/audit gates;
- QA command registry and CI parity checks.

The later migration added the Rust workspace, `Cargo.toml`, `rust-toolchain.toml`,
`deny.toml`, and `justfile`.

The TypeScript code is already unusually migration-friendly because many
scripts separate pure logic from process IO. Examples include:

- `scripts/site/site-doctor.ts`
- `scripts/content/verify-content.ts`
- `scripts/assets/verify-image-asset-locations.ts`
- `scripts/build/generate-cloudflare-redirects.ts`
- `scripts/build/verify-build.ts`
- `scripts/testing/verify-test-coverage.ts`
- `scripts/quality/run-quality.ts`
- `scripts/quality/qa-command-registry.ts`

## Migration Categories

### Category 1: High-Confidence Rust Core Candidates

These should be migrated first because they are deterministic and mostly
framework-independent.

| Domain                                         | Current files                                                                                           | Rust destination                                 | Reason                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Workspace discovery and source artifacts       | `src/lib/site-instance.ts`, `src/lib/source-artifacts.ts`                                               | `tpm-workspace`                                  | All CLI, GUI, MCP, and CI workflows need the same workspace context.                         |
| Diagnostics                                    | `src/lib/author-diagnostics.ts`, `src/lib/output-verification.ts`, `scripts/quality/diagnostic-diff.ts` | `tpm-diagnostics`                                | Stable diagnostic codes and reports should be shared by all surfaces.                        |
| Site doctor                                    | `scripts/site/site-doctor.ts`                                                                           | `tpm-config`, `tpm-workspace`, `tpm-diagnostics` | Already has pure issue functions and JSON output.                                            |
| Image asset location                           | `scripts/assets/verify-image-asset-locations.ts`                                                        | `tpm-media`, `tpm-workspace`                     | File inventory, glob policy, Git ignore semantics, and remediation reports map well to Rust. |
| Redirect generation                            | `scripts/build/generate-cloudflare-redirects.ts`, `src/lib/site-redirects.ts`                           | `tpm-routes`, `tpm-adapters`                     | Pure route rules plus provider formatting and limit checks.                                  |
| Route registry checks                          | `src/lib/route-registry.ts`, `src/platform/routes.ts`                                                   | `tpm-routes`                                     | Canonical URL construction is a core compiler concern.                                       |
| QA command registry                            | `scripts/quality/qa-command-registry.ts`                                                                | `tpm-qa`                                         | It is structured metadata and should drive `just`, CI, CLI, and docs.                        |
| Release reports                                | `src/platform/release.ts`, `src/lib/release-governance.ts`                                              | `tpm-release`                                    | Release artifacts should become a durable CLI/studio boundary.                               |
| Static output security and supply chain policy | `src/platform/security.ts`, `src/lib/static-output-security.ts`, `src/lib/supply-chain-policy.ts`       | `tpm-output`, `tpm-release`                      | Policy checks are deterministic and report-oriented.                                         |
| Starter and example validation                 | `src/platform/starters.ts`, `scripts/site/verify-starter-templates.ts`                                  | `tpm-workspace`, `tpm-config`                    | Fixture/starter contracts need to be reusable outside Astro internals.                       |

### Category 2: Good Rust Candidates After Contracts Stabilize

These are valuable but should follow the first core crates because they need
more careful cross-language contracts.

| Domain                                | Current files                                                                                         | Why later                                                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Content schema and config schema      | `src/lib/content-schemas.ts`, `src/lib/site-config.ts`, `scripts/site/generate-site-config-schema.ts` | Rust should own schema generation eventually, but Astro still consumes Zod/content collections today. |
| Article references and BibTeX         | `src/lib/article-references/*`, `scripts/content/audit-bibtex-citations.ts`                           | Strong Rust fit, but requires careful preservation and canonicalization tests.                        |
| Media policy and social images        | `src/lib/media-policy.ts`, `src/lib/social-images.ts`, `src/platform/media.ts`                        | Rust should own policy, but Astro image optimization remains adapter-owned.                           |
| Generated-output verification modules | `scripts/build/verify-build/*`                                                                        | Highly valuable, but should be migrated module by module with snapshot parity.                        |
| Observability reports                 | `src/lib/observability*.ts`                                                                           | Good fit once diagnostics and route models are stable in Rust.                                        |
| Import/export and preservation        | `src/platform/import-export.ts`, `src/lib/migration-fixtures.ts`                                      | Excellent Rust fit, but should be fuzzed and fixture-heavy.                                           |
| Extension manifest validation         | `src/platform/extensions.ts`, `src/lib/extensions.ts`                                                 | Good fit after schema and diagnostics crates exist.                                                   |

### Category 3: Rust Orchestration, Not Core Logic

These can be wrapped by Rust/CLI/`just`, but should not be rewritten first.

| Domain              | Current files                                                                       | Recommended approach                                                               |
| ------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Astro build         | `scripts/build/build-raw.ts`                                                        | Rust may orchestrate `bunx astro build`; Astro remains renderer.                   |
| Pagefind indexing   | `scripts/build/build-raw.ts`                                                        | Keep external command invocation behind build adapter.                             |
| PDF generation      | `scripts/build/generate-article-pdfs.ts`                                            | Keep current path until PDF artifact contract is redesigned.                       |
| Build optimization  | `scripts/build/optimize-build-output.ts`, `scripts/build/build-output-optimizer.ts` | Rust can verify and orchestrate; direct JS minifier libraries stay adapter-owned.  |
| Docs generation     | `scripts/docs/generate-platform-references.ts`                                      | Use Rust once schemas/entrypoints are Rust-owned; otherwise keep TypeScript.       |
| Payload experiments | `scripts/payload/*`                                                                 | Keep exploratory performance experiments outside core until a stable tool emerges. |

### Category 4: Stay TypeScript Or Browser-Bound

These should remain TypeScript unless the renderer or frontend framework
changes.

- `src/pages/**/*`
- `src/layouts/**/*`
- `src/components/**/*`
- `src/scripts/**/*`
- `src/remark-plugins/**/*`
- `src/rehype-plugins/**/*`
- Astro content collection integration in `src/content.config.ts`
- Playwright, axe, Lighthouse, and Astro component tests
- Tailwind, shadcn, and browser interaction tests

Rust should influence these through generated schemas, contracts, artifacts,
and diagnostics, not by forcing browser/UI code into Rust.

## Script Migration Recommendations

### First Wave

1. `scripts/site/site-doctor.ts`
2. `scripts/assets/verify-image-asset-locations.ts`
3. `scripts/build/generate-cloudflare-redirects.ts`
4. `scripts/quality/qa-command-registry.ts`
5. `scripts/quality/diagnostic-diff.ts`

Why: these are relatively isolated, report-oriented, and easy to dual-run.

### Second Wave

1. `scripts/content/verify-content.ts`
2. `scripts/assets/find-duplicate-images.ts`
3. `scripts/assets/find-shared-assets.ts`
4. `scripts/assets/find-unused-images.ts`
5. selected `scripts/build/verify-build/*` modules.

Why: these have larger source/output inventories but still match Rust well.

### Third Wave

1. `scripts/testing/verify-test-coverage.ts`
2. `scripts/testing/verify-test-accountability.ts`
3. `scripts/site/verify-starter-templates.ts`
4. `scripts/docs/generate-platform-references.ts`
5. `scripts/content/audit-article-references.ts`
6. `scripts/content/audit-bibtex-citations.ts`

Why: these should follow once the Rust operation, diagnostics, schema, and
fixture contracts are stable.

## TypeScript To Rust Contract Pressure Points

### Site Config

Today the repo relies on TypeScript/Zod shapes. A Rust-first core needs one
canonical config schema. The recommended endpoint is Rust structs plus
`serde`/`schemars` emitting JSON Schema, with TypeScript generated or validated
from that schema.

### Astro Collections

Astro collection APIs should remain renderer input. The Rust core should define
source entry models and emit diagnostics/artifacts that Astro can consume, not
depend on `astro:content`.

### Markdown And MDX

Markdown/MDX parsing is the riskiest migration area. Do not move it early. The
first Rust work should inventory files and frontmatter, not fully render MDX.

### Images

Rust should own media intent, inventory, provider policy, and migration plans.
Astro can keep owning optimized derivative generation until a better media
compiler is designed.

### Generated Output

Rust can inspect `dist/` very effectively. This should be the bridge between
current Astro output and future Rust release verification.

## First Implementation Slice

The best first slice:

1. Add Rust workspace and `justfile`.
2. Add `tpm-core`, `tpm-diagnostics`, `tpm-workspace`, and `tpm-cli`.
3. Implement workspace discovery and a diagnostic envelope.
4. Add `tpm site status --json`.
5. Add `just rust-check`, `just rust-test`, and `just check` delegation.
6. Add tests and snapshots.
7. Do not replace any Bun script.

This creates the foundation with minimal risk and proves the CLI/Tauri/MCP
reuse model immediately.

## Linear-Ready Migration Readiness Table

Use this table when turning the audit into issues. "Ready" means implementation
can start after the Rust workspace exists. "Needs contract" means the work is
valid, but another model must be settled first.

| Candidate                            | Readiness                         | Primary blocker                                  | Best verification                                      |
| ------------------------------------ | --------------------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| Workspace discovery                  | Ready                             | Rust workspace infrastructure                    | Fixture tests for TPM-like and neutral site roots      |
| Diagnostic envelope                  | Ready                             | Stable report shape decision                     | Snapshot tests for human and JSON reports              |
| `site:doctor` parity                 | Ready after diagnostics/workspace | Diagnostic envelope and workspace paths          | Dual-run diagnostic comparison                         |
| Image asset location parity          | Ready after workspace             | Git-aware path walking and glob policy           | Dual-run file inventory comparison                     |
| Redirect generation parity           | Ready after route helpers         | Route model and current redirect fixture         | Byte-equivalent `_redirects` or accepted diff report   |
| QA command registry                  | Ready                             | Rust data model for script metadata              | Snapshot of registry and CI parity report              |
| Diagnostic diff                      | Ready after diagnostics           | Shared diagnostic report model                   | Fixtures with added/removed/changed diagnostics        |
| Content verification                 | Needs contract                    | Source entry/frontmatter model                   | Fixture sites and parity against current verifier      |
| Duplicate/shared/unused asset audits | Needs contract                    | Media inventory model                            | File inventory snapshots and known duplicate fixtures  |
| Generated-output verification        | Needs contract                    | Output diagnostic model and route registry       | Module-by-module parity against `dist/` fixtures       |
| Config/schema generation             | Needs contract                    | Rust-owned site config model and schema strategy | Generated schema snapshot and TypeScript consumer test |
| Article references/BibTeX            | Needs contract                    | Citation preservation and parser policy          | Canonical fixtures, property tests, fuzz targets       |
| Import/export                        | Needs contract                    | Source manifest and preservation policy          | Round-trip fixtures, source maps, fuzz tests           |
| Extension manifest validation        | Needs contract                    | Rust schema and capability model                 | Valid/invalid manifest fixture matrix                  |

## Recommended Issue Splitting

Avoid giant "migrate scripts to Rust" issues. Split by promotion state.

For each migrated domain, use this pattern:

1. **Observe current behavior.**
   - Add fixtures and snapshots around the TypeScript script if missing.
2. **Implement Rust equivalent.**
   - Keep output additive and do not change package scripts.
3. **Add dual-run comparison.**
   - Produce a mismatch report rather than only an exit code.
4. **Promote command.**
   - Update `just`, package scripts, docs, CI parity registry, and fallback
     plan.

This pattern keeps review size manageable and makes blockers explicit.

## Audit Gaps To Revisit After Deep Research

The external Rust tooling research may change some QA details. Revisit these
before implementation:

- whether `cargo-vet` should join or replace parts of the supply-chain plan;
- whether Miri, sanitizer jobs, or cargo-geiger should be blocking,
  review-only, or deferred;
- whether `cargo-udeps` is worth nightly usage or whether `cargo machete` is
  sufficient;
- whether `cargo-mutants` is valuable enough for targeted policy crates;
- whether `time` or `jiff` is the better date/time crate for publishing dates;
- whether the MCP Rust SDK is mature enough for early Milestone Group 5 work.
