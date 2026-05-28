# Test Matrix And Fixture Strategy

This document covers the design work for Linear issue IRK-93. It defines where
different kinds of tests belong, which fixture sites should exist, and how new
roadmap work should choose the smallest useful verification layer.

The goal is not to make every check run everywhere. The goal is to make every
important invariant have one clear owner, with higher-level tests reserved for
integration behavior that lower layers cannot prove.

## Current Inventory

### Current Check Layers

| Layer                              | Current command or source                                                             | Current role                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Content verification               | `just content-check`, `just tags-check`, `just site-doctor`, `just site-schema-check` | Fast source and authoring contract checks before expensive builds.                                                     |
| Platform boundary checks           | `just platform-check`                                                                 | Fast architectural check for site/platform separation.                                                                 |
| Asset checks                       | `just assets-locations`, `just assets-shared`, `just review-assets`                   | Fast required asset policy plus review-only duplicate/unused asset reports.                                            |
| Package and config tests           | `just package-check`, `just test-config`                                              | Fast package ordering, command-surface guard, and tool/config contract checks.                                         |
| Unit tests                         | `just test-unit`                                                                      | Pure logic, helper, script, route helper, and source-contract tests.                                                   |
| Astro component tests              | `just test-astro`                                                                     | Rendered component markup, slots, variants, data hooks, and compile-time Astro contracts.                              |
| Test accountability                | `just test-accountability`, `just test-accountability-release`                        | Ensures test files are covered by the expected command layer and blocks broad untracked test drift.                    |
| Component catalog checks           | `just catalog-check`, `just test-catalog`, `just test-catalog-site-instance`          | Verifies catalog coverage, catalog examples, and private catalog behavior against a non-TPM site instance.             |
| Build checks                       | `just build`, `just build-release`                                                    | Produces static output, PDFs, optimized assets, and Cloudflare redirect output.                                        |
| Generated-output verification      | `just verify`, `just validate-html`                                                   | Checks built files, generated routes, metadata, assets, links, and HTML validity.                                      |
| Browser invariants                 | `just test-e2e`, `just test-e2e-built`                                                | Built-site layout, routing, interaction, and browser-only integration checks.                                          |
| Accessibility checks               | `just test-a11y`, `just test-a11y-built`                                              | Axe/Playwright accessibility scans over built output.                                                                  |
| Lighthouse checks                  | `just test-perf`, `just test-perf-built`                                              | Lighthouse CI assertions and resource budgets over representative built routes.                                        |
| Docs-site checks                   | `just test-docs-site`                                                                 | Validates and builds the public documentation example site as a separate site instance.                                |
| Fixture site checks                | `just test-site-instance`                                                             | Builds the minimal non-TPM site fixture through raw/PDF/optimization stages.                                           |
| Coverage checks                    | `just coverage`, `just coverage-ts`, `just coverage-rust`                             | Review and enforcement surface for TypeScript/Astro and Rust coverage expectations.                                    |
| Rust workspace checks              | `just rust-check`, direct `cargo fmt/check/clippy/doc/test` commands                  | Additive Rust formatting, type, lint, rustdoc, doctest, unit-test, and CI gates before Rust replaces any Bun behavior. |
| Quality dispatcher                 | `just quality`, `just quality-release`                                                | Sequential blocking checks followed by nonblocking review checks.                                                      |
| Payload and optimization workbench | `just payload-check`, `just payload-report`, `just build-optimize`                    | Release-gated deterministic payload/cache budgets plus active production optimization evidence.                        |

### Current Fixture Surfaces

| Fixture surface                | Current path                                                          | What it proves today                                                                                                         |
| ------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| TPM production site instance   | `site/`                                                               | The real publication content, config, assets, redirects, metadata, and generated output.                                     |
| Minimal external site instance | `tests/fixtures/site-instance/`                                       | A small non-TPM site can build with independent config, content, assets, public files, theme, and redirects.                 |
| Public docs/example site       | `examples/docs-site/`                                                 | A larger non-TPM site can use the platform while documenting authoring, configuration, operations, and reference workflows.  |
| Starter templates              | `examples/starters/` plus `examples/docs-site/`                       | Maintained distribution examples for minimal, editorial, scholarly, docs, and broad demo adoption paths.                     |
| Component catalog              | `src/catalog/`                                                        | Isolated component, block, hostile-content, and visual-state examples outside normal page routes.                            |
| Rust workspace fixture         | `tests/fixtures/rust-workspace/`                                      | Small neutral site-like fixture for Rust workspace and future operation tests without TPM branding.                          |
| Rust operation fixtures        | `tests/fixtures/rust-operations/`                                     | Exact machine-readable JSON fixtures for Rust operation envelope compatibility.                                              |
| Reference parser fixtures      | `tests/fixtures/article-references*`                                  | Markdown/reference parser and migration behavior for notes, citations, and bibliography syntax.                              |
| Invalid and hostile examples   | `src/catalog/examples/hostile-fixtures.ts` plus focused test fixtures | Long strings, hostile content, missing metadata, invalid references, and intentionally broken source examples used by tests. |

### Current Placement

| Placement            | Current commands                                                                                     | Intended use                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Fast local           | `just check-fast`, focused `bun test`, focused `just test-astro`                                     | Cheap validation while editing; catches schema, source, and platform-contract failures early.                      |
| Normal local         | `just check`                                                                                         | Default pre-handoff gate for most code changes.                                                                    |
| Focused built output | `just build`, `just verify`, `just validate-html`, focused `just test-e2e-built`                     | Used when a change touches output, layout, metadata, links, browser behavior, or generated files.                  |
| Release blocking     | `just release-check`, `just payload-check`                                                           | Full release gate for platform/site changes, Markdown review, and deterministic route-class payload/cache budgets. |
| Review-only release  | `just quality-release` review steps: assets, accessibility, Lighthouse, all-severity audit, coverage | Nonblocking signals that should be investigated and may become blocking after budgets mature.                      |
| Investigation-only   | full-site Unlighthouse scans, ad hoc browser profiling, explicitly restored experiment harnesses     | Data collection for future budgets, experiments, and roadmap planning.                                             |

## Target Ownership Principles

1. Each invariant should have one primary test owner.
2. Lower layers should prove data and logic; higher layers should prove
   integration, browser layout, and generated output.
3. A fixture should exist because it proves a platform property, not because a
   single test needs arbitrary sample data.
4. Site-instance tests should prove cross-site generality. TPM content tests
   should prove TPM publication correctness.
5. Expensive tests should run only when they provide evidence lower layers
   cannot provide.
6. Review-only tooling should be allowed to produce useful warnings without
   blocking unrelated work.
7. A new feature is not complete until it has a documented test home.

## Target Test-Layer Ownership Matrix

| Domain                 | Primary owner                                                       | What belongs there                                                                                                                           | What does not belong there                                                                           |
| ---------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Source contracts       | Content schemas, config schemas, site doctor, content verifier      | Frontmatter shape, feature defaults, visibility rules, broken author input, route/config invariants.                                         | Browser layout, rendered CSS, or page-specific visual behavior.                                      |
| Pure domain logic      | `just test-unit`                                                    | Route builders, metadata builders, reference parsing, citation normalization, image policy helpers, budget calculators, manifest generation. | Astro slots, browser APIs, CSS layout, or filesystem-heavy workflows unless injected behind seams.   |
| Tooling orchestration  | `just test-unit` plus script-level tests                            | CLI parsing, command selection, quality workflow ordering, generated file contracts, test-accountability policy.                             | Full builds unless the command specifically owns build orchestration.                                |
| Astro component markup | `just test-astro`                                                   | Semantic HTML, slots, variants, data hooks, ARIA attributes, component-owned empty/error/long-content states.                                | End-to-end route behavior, visual screenshots, or testing private helpers through test-only exports. |
| Catalog examples       | `just catalog-check`, `just test-catalog`                           | Primitive states, component recipes, hostile content rendering, reusable block states, design-system visibility.                             | Publication-specific content correctness or source schema validation.                                |
| Built output           | `just verify`, `just validate-html`, targeted built-output tests    | Generated routes, metadata, sitemap/feed/redirect/PDF/search output, HTML validity, links, asset references.                                 | Runtime browser interaction unless browser APIs are required.                                        |
| Browser interactions   | `just test-e2e-built`                                               | Navigation, popovers, carousel controls, scroll controls, layout containment, focus behavior, hydrated or scripted UI.                       | Pure helper logic already covered by unit tests.                                                     |
| Accessibility          | `just test-a11y-built`, focused axe tests, semantic component tests | Page-level accessibility regressions, landmark/heading/focus/label issues, scanner coverage over built pages.                                | Styling preferences that are not accessibility issues.                                               |
| Performance            | `just test-perf-built`, payload reports, Unlighthouse scans         | Lighthouse assertions, route-class budgets, payload budgets, cache policy, critical request chains, Core Web Vitals.                         | Non-performance visual redesign work unless it changes measured budgets.                             |
| Docs and examples      | `just test-docs-site`, docs lint/format                             | Public author/developer docs accuracy, example-site completeness, commands and config examples.                                              | TPM-specific editorial policy unless the docs explicitly discuss it.                                 |
| Deployment             | `just build-release`, `just build-cloudflare`, deploy config tests  | Cloudflare redirect generation, worker static asset config, deploy script contracts, host compatibility files.                               | Runtime server behavior; the site remains static-first.                                              |
| Rust operation core    | `cargo test`, `just rust-check`, exact JSON fixtures                | Serializable diagnostics, workspace discovery, operation envelopes, deterministic source references, and machine contracts.                  | Browser UI behavior, Astro rendering, or provider actions before adapters exist.                     |
| Future studio/CLI/MCP  | Future contract tests plus fixture-site smoke tests                 | Serializable edit operations, generated patches, validation feedback, preview/build/deploy workflows.                                        | Direct mutation of platform internals outside stable site-instance contracts.                        |

## Target Fixture-Site Matrix

| Fixture                  | Target path or owner                                                               | Purpose                                                                                                                    | Required coverage                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Minimal external site    | `tests/fixtures/site-instance/`                                                    | Prove the platform does not require TPM content or branding.                                                               | One article, one announcement, one author, one category, one collection, one page, one asset, one redirect, one theme, one public file.           |
| Docs/example site        | `examples/docs-site/`                                                              | Prove a real public non-TPM site can teach and use the platform.                                                           | Multiple categories, authoring docs, configuration docs, operations docs, pages, assets, search/feed/PDF behavior, redirects.                     |
| Scholarly fixture        | New fixture site or docs-site scenario, depending on implementation cost           | Prove citation, bibliography, PDF, scholarly metadata, and machine-readability surfaces work without TPM-specific content. | Article with notes, citations, bibliography, generated reference sections, cite menu, PDF eligibility, Scholar metadata, site bibliography links. |
| Media-heavy fixture      | New fixture site or catalog-backed site scenario                                   | Prove images, responsive media, embeds, hover images, social images, PDF fallbacks, and asset budgets.                     | Local image, large image, figure captions, hover image fallback, YouTube/SoundCloud embed, missing optional media, social image fallback.         |
| Broken/hostile fixture   | Focused invalid fixtures plus catalog hostile examples                             | Prove bad input fails loudly and hostile content stays contained.                                                          | Missing required metadata, invalid references, invalid redirects, long strings, unsafe links, huge captions, broken feature references.           |
| Feature-disabled fixture | New fixture config over the minimal site or parameterized site-instance test       | Prove optional modules disappear coherently when disabled.                                                                 | Disabled search/feed/PDF/categories/authors/tags/collections/announcements where supported, plus sitemap/link/pruning checks.                     |
| Kitchen-sink fixture     | Long-term full platform fixture, likely derived from docs-site plus catalog states | Prove many features compose together before GUI/CLI/MCP work depends on them.                                              | Mixed content, all optional features, multiple themes, multiple page types, generated files, budget checks, accessibility scans.                  |

The fixture matrix should grow through real roadmap pressure. The immediate
implementation priority is not to create every fixture at once; it is to choose
the correct fixture whenever a new domain needs proof.

## Placement Rules

1. Put author-facing input rules in schemas, content verifiers, site doctor, or
   focused unit tests before adding browser tests.
2. Put deterministic transformation logic in pure helpers with unit tests.
3. Put reusable component state in Astro component tests and catalog examples.
4. Put generated-file contracts in build verifiers and HTML validation.
5. Put layout, focus, popover, scroll, and viewport behavior in Playwright.
6. Put accessibility guarantees in semantic component tests first, then
   page-level axe scans for integration.
7. Put payload and Core Web Vital enforcement in performance tooling; do not
   hide performance assertions in unrelated layout tests.
8. Keep full-release checks broad, but keep editing feedback fast by providing
   focused commands for each domain.
9. Promote a review-only check to release-blocking only after its signal is
   stable, actionable, and documented.

## Non-Goals

- Do not make one monolithic fixture responsible for every platform behavior.
- Do not duplicate the same assertion at unit, component, e2e, and release
  levels unless each level proves a different integration boundary.
- Do not create test-only exports. If logic needs testing, move it to a real
  typed helper with a production purpose.
- Do not use TPM content as proof that the platform is configurable.
- Do not make accessibility or performance tests depend on unrelated editorial
  content churn when a fixture can provide a stable route.

## Current Implementation Status

The command ownership manifest is now the `just` command surface plus Rust QA
operation metadata:

- `justfile` is the canonical local workflow surface.
- `COMMANDS.md` is the human command reference.
- `crates/tpm-xtask/src/tasks.rs` owns migrated internal maintenance task
  adapters.
- `just qa-registry` exposes Rust command ownership and migration-debt reports.
- `tests/config` keeps `justfile`, CI workflows, command docs, and package
  metadata aligned.
- `tests/config/fixture-site-matrix.test.ts` keeps the minimal external site
  fixture and maintained starter roots aligned with required content,
  public-file, redirect, and theme coverage.
- `just starters-check` verifies starter source files, parseable config,
  site-doctor compatibility, declared checks, and TPM branding leakage.
- The additive Rust workspace has a root `Cargo.toml`, pinned
  `rust-toolchain.toml`, strict workspace lints, `just rust-check`, and
  `tests/fixtures/rust-workspace/` for neutral Rust workspace tests.

The remaining implementation work should:

1. Add or extend fixture sites only when an implementation issue needs that
   proof.
2. Add a feature-disabled fixture before broad route-pruning or GUI work relies
   on optional modules.
3. Add a scholarly fixture before expanding citation/PDF/metadata features.
4. Add a media-heavy fixture before making broad image, embed, PDF fallback, or
   social-image budget changes.

## Verification

This design is grounded in the current `justfile`,
`crates/tpm-xtask/src/tasks.rs`, `tests/config/`,
`tests/fixtures/site-instance/`, `examples/docs-site/`, `src/catalog/`, and the
existing performance and component-audit docs. Before implementation starts,
developers should re-check those files if the command surface changes.
