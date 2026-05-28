# Checklist

This file tracks implementation milestones. It may keep completed items when
they are useful context. Explicitly deferred work belongs in
[DEFERRED.md](./DEFERRED.md).

## Working Rules

- Move postponed work to `DEFERRED.md` with a resume trigger instead of leaving
  stale unchecked milestones here.
- Move deferred work back into this file before implementation begins.
- Add or update design docs before implementing new components, substantial
  layout behavior, or non-component technical systems.
- Verify each milestone before marking it complete.
- Do not edit `site/content/articles/` unless the current task explicitly asks
  for article-content changes.

## Active Rust Engineering Guide

This pass synthesizes the repo engineering philosophy, current Rust lint/tool
policy, and external Rust guidance into a project-specific guide for durable
Rust platform work.

- [x] Re-read local repo philosophy, roadmap, Rust workspace docs, and Rust
      strictness/tooling policy.
- [x] Research requested Rust idiom, API, best-practice, pattern, crate, and
      safety references.
- [x] Write a project-specific Rust engineering guide covering domain modeling,
      seams, errors, diagnostics, tests, docs, tooling, dependencies, and
      anti-patterns.
- [x] Review the guide against the repo philosophy and update discoverability
      docs if needed.

## Active Rust Engineering Guide Deepening

This pass turns the first Rust guide draft into a research-backed judgment and
style guide with concrete examples, anti-examples, and source notes. The goal
is to steer developers toward correct Rust without encouraging mechanical
over-application of abstractions.

- [x] Re-check the guide's framing so it reads as judgment guidance rather than
      a rigid rulebook.
- [x] Read the requested Rust references in a source-by-source pass, including
      every Rust API Guidelines topic page.
- [x] Record research notes and non-obvious implications for TPM's Rust
      operation-core work.
- [x] Add realistic code examples and anti-examples for type-driven design,
      pure/impure seams, diagnostics, adapter boundaries, tests, and
      dependency/tooling policy.
- [x] Review the revised guide for overzealous or misleading instructions and
      verify documentation checks.

## Active Milestone 10: Adapter Contracts And Provider Capability Runtime

This pass implements provider-neutral adapter contracts and capability
inspection so future GUI, CLI, MCP, and CI surfaces can ask what a configured
provider can do before showing or executing provider-backed actions.

### M10.0 Design Synthesis And Scope

- [x] Re-read Milestone 10 Linear issues, adapter/capability/security docs,
      Rust operation contracts, and Rust engineering guidance.
- [x] Confirm the implementation shape keeps adapter contracts in shared Rust
      operation code and does not hard-code Cloudflare, GitHub, repo-local
      assets, or TPM assumptions into core behavior.
- [x] Break Milestone 10 into issue-level implementation milestones with
      verification steps.

### M10.1 Source And History Adapter Contracts (IRK-177)

- [x] Model source/history provider capabilities, local-only behavior,
      restore/review support, and unsupported-operation diagnostics.
- [x] Add tests proving local source/history works without Git and Git/GitHub
      behavior remains optional provider behavior.
- [x] Verify focused Rust checks for source/history contracts.

### M10.2 Media And Materialization Adapter Contracts (IRK-178)

- [x] Model media provider capabilities for read/write/optimize/cache/
      materialize/migrate/delete behavior.
- [x] Model build-time materialization, source hashes, cache invalidation, and
      unsupported media diagnostics.
- [x] Verify focused Rust checks for media contracts.

### M10.3 Workflow, Build, And Deploy Adapter Contracts (IRK-179)

- [x] Model workflow/build/deploy capabilities, dry-run publish and rollback
      plans, manual steps, and bundled reference adapter boundaries.
- [x] Add tests proving Cloudflare-like and static export behavior are adapter
      profiles rather than core truth.
- [x] Verify focused Rust checks for workflow/build/deploy contracts.

### M10.4 Identity, Credential, Diagnostics, And Observability Boundaries (IRK-180)

- [x] Model non-secret identity and credential references, credential
      requirements, redaction, diagnostics import, and observability import
      contracts.
- [x] Add tests proving credentials are never modeled as site content and
      redacted output cannot expose secret values.
- [x] Verify focused Rust checks for identity/credential/diagnostic contracts.

### M10.5 Capability Registry And Unsupported Diagnostics (IRK-181)

- [x] Implement a capability registry that combines configured adapters into a
      stable capability report for local-only, TPM-like, and complex publisher
      profiles.
- [x] Implement unsupported-operation diagnostics with provider, capability,
      cause, and remediation.
- [x] Add fixture-style tests for supported, unsupported, partial, manual,
      unknown-until-authenticated, and disabled-by-policy states.

### M10.6 Adapter And Extension Inspection Commands (IRK-182)

- [x] Add CLI/report operation output that lists configured adapters,
      capabilities, credential requirements, dry-run support, unsupported
      operations, and bundled/default/extension boundaries.
- [x] Ensure JSON output is versioned and tested without creating a separate
      CLI-only model.
- [x] Verify CLI command and operation fixture tests.

### M10.7 Mocked-Provider Runtime Verification (IRK-183)

- [x] Add mocked adapter profiles for local-only, TPM-like, and complex
      publisher configurations.
- [x] Verify dry-run plan fixtures, secret/credential boundaries, unsupported
      diagnostics, and capability-driven CLI/report output.
- [x] Run Rust checks, documentation checks, and release-relevant checks before
      handoff.

### M10.8 Linear Handoff

- [x] Attach relevant docs to Milestone 10 issues.
- [x] Add completion comments and move IRK-177 through IRK-183 and parent
      IRK-152 to In Review.

## Active TypeScript Automation To Rust Migration

This migration removes repository-owned TypeScript automation scripts from the
developer and CI command surface. TypeScript remains allowed for Astro/frontend
code and frontend tests. PDF generation is the explicit legacy exception:
`scripts/build/generate-article-pdfs.ts` and the `build-pdf` recipe stay as-is
and are not ported to Rust in this migration.

## Active Rust Strictness Decision Audit

This pass documents the decision process for Rust compiler lints, Clippy
restriction lints, rustfmt policy, and external Rust static-analysis tooling.
Implementation belongs in a follow-up pass after the decision record is
reviewed.

- [x] Inventory current Rust workspace lint, formatting, supply-chain, and
      command gates.
- [x] Check the pinned Rust 1.95 rustc and Clippy lint lists against primary
      docs.
- [x] Classify every allow-by-default rustc lint and every Clippy restriction
      lint as already covered, enable now, enable with immediate cleanup, not
      available on stable, or do not enable globally.
- [x] Classify candidate Rust QA/static-analysis tools as blocking,
      review-only, release-only, not currently useful, or future public-API
      tooling.
- [x] Write
      `agent-docs/rust-migration-research/RUST_STRICTNESS_DECISION_RECORD.md`
      with explicit justifications.

## Active Rust Strictness Implementation

This pass turns the accepted strictness decisions into blocking repo policy,
cleans up every real issue surfaced by the new checks, and verifies local gates
against the failing GitHub CI signal before handoff.

- [x] Enable accepted workspace rustc and Clippy lints from the strictness
      decision record.
- [x] Tighten Rust supply-chain duplicate dependency policy after verifying the
      current workspace has no duplicate crate versions.
- [x] Run the strict Rust gate and fix all actionable failures without
      weakening lint policy.
- [x] Inspect the failing GitHub CI check and apply any missing local fix.
- [x] Run release checks after strictness and CI fixes are complete.

## Active Rustdoc Example Strictness

This pass treats public Rust documentation as a product surface. Public APIs
should include a useful code example by default, and any exception should be
explicitly justified at the item.

- [x] Enable stricter stable rustdoc lints for crate docs, backticks, and
      explicit warn-by-default documentation checks.
- [x] Verify the desired doc-example lint status and document why
      `rustdoc::missing_doc_code_examples` cannot be a stable blocking lint
      yet.
- [x] Add useful examples or justified local exceptions for every new rustdoc
      failure.
- [x] Run Rust and release-relevant checks after the rustdoc policy change.

## Active Large-File Refactor Pass

This pass reduces high-risk large files without changing product behavior. The
goal is to improve navigability, testability, and future change safety by
splitting mixed responsibilities behind stable public import paths and command
surfaces.

### Milestone LF01: Design And Scope

- [x] Write a concise design for the large-file splits, including invariants,
      module boundaries, migration order, and verification gates.
- [x] Review the design against the engineering philosophy and refine it until
      the implementation scope is clear and behavior-preserving.
- [x] Break the selected refactors into implementation milestones before code
      changes.

### Milestone LF02: Xtask Structural Split

- [x] Split the monolithic xtask task implementation into focused internal
      modules while preserving `just` behavior and public crate entrypoints.
- [x] Move reusable filesystem, workspace, external-command, content, asset,
      redirect, and generated-output helpers behind testable seams.
- [x] Move remaining command adapters out of the xtask root so `tasks.rs`
      stays a router over focused task modules.
- [x] Keep the user-facing `tpm` CLI separate from internal repository
      automation.
- [x] Run focused Rust tests after the split.

### Milestone LF03: Component Catalog Structural Split

- [x] Split the private component catalog into section modules over existing
      fixture modules
      while preserving rendered catalog behavior.
- [x] Extract the remaining article catalog section so the catalog root stays
      page-level orchestration instead of a mixed section implementation.
- [x] Keep catalog sections narrow, domain-oriented, and easy to extend.
- [x] Run catalog/accountability checks after the split.

### Milestone LF04: Platform Domain Split Review

- [x] Re-check `extensions`, `studio-models`, metadata/media policy, deployment
      adapters, and AST plugin files after the first splits.
- [x] Confirm no additional high-confidence behavior-preserving platform splits
      should be taken in this pass without contract-level domain work.
- [x] Record any intentionally deferred large-file candidates with reasons and
      resume triggers.

### Milestone LF05: Verification And Handoff

- [x] Run formatting, type/Rust gates, coverage signals, docs checks, catalog
      checks, and release checks as appropriate for the touched surfaces.
- [x] Update docs if the new module organization changes developer-facing
      guidance.
- [x] Report completed splits and any remaining justified large files.

## Active Rust And Just Tooling Quality Pass

This pass tightens the newly migrated Rust/`just` tooling after the command
surface swap. The goal is to remove false confidence, restore high-signal QA
semantics where migration placeholders were too weak, and improve maintainable
Rust seams without reintroducing TypeScript automation.

### Milestone TQ01: Restore High-Signal Test And Coverage Accountability

- [x] Replace placeholder Rust test-accountability behavior with source-file,
      mirrored-test, documented-ignore, unmatched-rule, and release-exception
      checks.
- [x] Replace placeholder Rust coverage verification with LCOV inventory,
      approved-exception, mirrored-test, and missing-file checks.
- [x] Add focused Rust tests for parsing, matching, missing coverage, and
      release-blocking behavior.
- [x] Verify focused accountability and coverage recipes.

### Milestone TQ02: Remove False-Confidence Retired Command Behavior

- [x] Remove retired review-only recipes from the visible `just --list`
      command surface.
- [x] Make direct internal `tpm-xtask` calls to removed task names fail with a
      clear usage error instead of succeeding as no-ops.
- [x] Update performance workbench command ownership and command-surface docs
      so active commands and historical reports are not conflated.
- [x] Verify command-surface and performance workbench tests.

### Milestone TQ03: Improve Xtask Dispatch Shape

- [x] Introduce a typed internal task parser so dispatch is exhaustive and old
      task names are explicitly classified.
- [x] Keep the user-facing `tpm` CLI separate from internal repository
      automation.
- [x] Add Rust tests for task parsing, unknown task handling, and removed task
      handling.
- [x] Verify Rust checks after dispatch changes.

### Milestone TQ04: Redesign Xtask Task Architecture

- [x] Write a design for replacing the monolithic `tasks.rs` shape with
      domain modules, typed task specs, parser-first argument models, and
      testable plan/execution seams.
- [x] Iterate on the design until it names invariants, migration sequence,
      coverage expectations, coverage-ignore policy, risks, and verification
      gates.
- [x] Implement the initial architecture passes from the design, prioritizing
      coverage-blocking repetition, parse-don't-verify seams, and pure logic
      extraction without changing public `just` behavior.
- [x] Add focused Rust tests for the extracted pure seams and command/task
      contracts.
- [x] Verify Rust coverage, Rust gates, command-surface tests, docs checks,
      and release checks before handoff.

### Milestone TQ05: Implement Xtask Clap Parser And Dispatch

- [x] Add `clap` as a Rust workspace dependency for `tpm-xtask` only and
      introduce the focused `cli/` parser modules from the design.
- [x] Model every active xtask command and retained retired-command
      compatibility behavior with typed parser coverage.
- [x] Replace top-level string dispatch and repeated help/value parsing with
      parsed command dispatch.
- [x] Preserve intended `just` behavior while applying documented parser
      cleanups such as strict unknown flags and deterministic format conflicts.
- [x] Add focused tests for active command args, help behavior, unknown flags,
      retired commands, pass-through args, and accepted cleanups.
- [x] Verify Rust checks, command-surface tests, coverage signals, and relevant
      docs after the migration.

### Milestone TQ06: Workspace Coverage Remediation Pass

- [x] Re-run Rust coverage and identify meaningful testable gaps across the
      full Rust workspace, not only `tpm-xtask`.
- [x] Re-run TypeScript/Astro coverage and identify meaningful testable gaps
      outside Rust, including parser, workflow, catalog, and content-domain
      helpers.
- [x] Improve coverage in already modular crates with focused tests for
      uncovered behavior, edge cases, and failure modes.
- [x] Refactor hard-to-test Rust seams where missing coverage points to weak
      separation of concerns, especially process-heavy task orchestration.
- [x] Extract or isolate reusable xtask path, filesystem, content, media, and
      external-command planning seams out of direct dispatcher behavior with
      private tests.
- [x] Add meaningful tests without test-only exports, brittle
      command-execution assertions, weakened runtime code, or broad ignores.
- [x] Add narrow `Coverage note:` comments only for genuinely untestable
      process/IO boundaries that remain after refactoring.
- [x] Re-run TypeScript/Astro and Rust coverage and continue iterating until no
      sensible coverage improvements remain anywhere in the workspace.
- [x] Run the full release gate and document remaining coverage gaps before
      handoff.

### Milestone TQ07: Final Whole-Workspace Coverage Audit

- [x] Re-run current-tree aggregate coverage after the latest type and test
      fixes.
- [x] Classify the remaining TypeScript/Astro and Rust gaps as actionable
      tests, refactor candidates, defensive invariants, or external/process
      boundaries.
- [x] Add any remaining useful tests or refactors without test-only exports or
      brittle command assertions.
- [x] Add or keep narrow coverage notes only where the gap is genuinely
      untestable in unit coverage.
- [x] Re-run aggregate coverage, docs checks, and release checks after the
      final pass.
- [x] Report final coverage totals and remaining justified gaps before handoff.

### Milestone TS00: Inventory, Tracking, And Parity Strategy

- [x] Create a durable replacement map documenting every TypeScript automation
      script, replacement Rust operation or deletion, command recipe, parity
      evidence, and final status.
- [x] Add temporary parity scaffolding where old TypeScript behavior must be
      compared with Rust behavior before deletion, and document accepted
      differences where an exact port is not the desired end state.
- [x] Classify each script as Rust replacement, ecosystem adapter, obsolete
      deletion, or PDF legacy exception.
- [x] Run baseline command/config tests before changing command ownership.

### Milestone TS01: Build Raw Replacement

- [x] Replace `scripts/build/build-raw.ts` with a Rust-owned command or
      operation that invokes the Astro/Pagefind ecosystem adapters.
- [x] Preserve environment-variable behavior and generated-output
      expectations.
- [x] Add Rust tests for argument handling and build adapter planning.
- [x] Verify the `build-raw` recipe and remove the TypeScript script/test.

### Milestone TS02: Build Optimize Replacement

- [x] Replace `scripts/build/optimize-build-output.ts` and reusable optimizer
      logic with Rust-owned generated-output optimization or an accepted
      no-op/removal decision.
- [x] Preserve verified output semantics or document accepted differences.
- [x] Add Rust tests for optimization planning and output safety.
- [x] Verify the `build-optimize` recipe and remove migrated TypeScript files.

### Milestone TS03: Cloudflare Redirect Generation Replacement

- [x] Replace `scripts/build/generate-cloudflare-redirects.ts` with Rust
      redirect output generation.
- [x] Preserve generated `_redirects` behavior, manual redirects, legacy
      permalink handling, duplicate detection, and Cloudflare limits.
- [x] Add Rust tests for generated file output and failure cases.
- [x] Verify the `build-cloudflare` recipe and remove the TypeScript script/test.

### Milestone TS04: Content Verification Replacement

- [x] Replace `scripts/content/verify-content.ts` with Rust content/source
      verification.
- [x] Preserve article, page, author, announcement, category, collection,
      image, reference, and MDX/PDF-compatibility diagnostics where still
      relevant, with accepted differences documented for narrower source
      checks.
- [x] Add Rust fixtures and tests for valid and invalid content states.
- [x] Verify the `content-check` recipe and remove the TypeScript script/test.

### Milestone TS05: Tag Normalization Replacement

- [x] Replace `scripts/content/normalize-tags.ts` with Rust tag dry-run/write
      behavior.
- [x] Preserve safe source mutation behavior and deterministic output.
- [x] Add Rust tests for dry-run, write mode, and no-op behavior.
- [x] Verify `tags-check`, `tags-normalize`, and remove the TypeScript
      script/test.

### Milestone TS06: Site Config Schema Replacement

- [x] Replace `scripts/site/generate-site-config-schema.ts` with Rust schema
      generation/check behavior.
- [x] Preserve generated schema contents or document accepted differences.
- [x] Add Rust tests for check/write modes and schema path handling.
- [x] Verify `site-schema`, `site-schema-check`, and remove the TypeScript
      script/test.

### Milestone TS07: Starter Template Verification Replacement

- [x] Replace `scripts/site/verify-starter-templates.ts` with Rust starter
      verification.
- [x] Preserve starter registry, generic-copy, source-contract, and fixture
      checks where still active.
- [x] Add Rust tests for valid and invalid starter fixtures.
- [x] Verify `starters-check` and remove the TypeScript script/test.

### Milestone TS08: Asset Location Replacement

- [x] Replace `scripts/assets/verify-image-asset-locations.ts` with Rust media
      location checks.
- [x] Preserve ignore-file behavior and generated-directory exclusions.
- [x] Add Rust tests for misplaced, ignored, and valid image assets.
- [x] Verify `assets-locations` and remove the TypeScript script/test.

### Milestone TS09: Shared Asset Replacement

- [x] Replace `scripts/assets/find-shared-assets.ts` with Rust shared-asset
      policy checks.
- [x] Preserve reference counting and allowlist behavior.
- [x] Add Rust tests for shared asset violations and accepted cases.
- [x] Verify `assets-shared` and remove the TypeScript script/test.

### Milestone TS10: Duplicate Asset Replacement

- [x] Replace `scripts/assets/find-duplicate-images.ts` with Rust duplicate
      image review behavior.
- [x] Preserve review-only status, hash/group output, and ignore behavior.
- [x] Add Rust tests for duplicate groups and ignored duplicates.
- [x] Verify `assets-duplicates`/`review-assets` and remove the TypeScript
      script/test.

### Milestone TS11: Unused Asset Replacement

- [x] Replace `scripts/assets/find-unused-images.ts` with Rust unused image
      review behavior.
- [x] Preserve review/fail modes and ignore behavior.
- [x] Add Rust tests for used, unused, ignored, and generated assets.
- [x] Verify `assets-unused`/`review-assets` and remove the TypeScript
      script/test.

### Milestone TS12: Generated Output Verification Replacement

- [x] Replace `scripts/build/verify-build.ts` and all verifier modules except
      behavior tied solely to retained PDF generation with Rust output
      verification.
- [x] Preserve link, metadata, feed, sitemap, HTML, route, redirect, asset,
      content-output, and static-output diagnostics.
- [x] Add Rust fixtures and tests for representative valid and invalid output.
- [x] Verify `verify` and remove migrated TypeScript verifier files/tests.

### Milestone TS13: HTML Validation Replacement

- [x] Replace `scripts/build/validate-html.ts` with Rust-owned validation
      orchestration or a direct ecosystem adapter where appropriate.
- [x] Preserve representative HTML validation and failure reporting.
- [x] Add Rust tests for selected file planning and validator invocation.
- [x] Verify `validate-html` and remove the TypeScript script/test.

### Milestone TS14: Docs Reference Generation Replacement

- [x] Replace `scripts/docs/generate-platform-references.ts` with Rust
      generated-reference check/write behavior.
- [x] Preserve generated docs contents or document accepted differences.
- [x] Add Rust tests for command/platform reference generation.
- [x] Verify `docs-references`, `docs-references-check`, and remove the
      TypeScript script/test.

### Milestone TS15: Component Catalog Verification Replacement

- [x] Replace `scripts/quality/verify-component-catalog.ts` with Rust catalog
      accountability checks.
- [x] Preserve component catalog source/accountability rules.
- [x] Add Rust tests for catalog coverage and missing examples.
- [x] Verify `catalog-check` and remove the TypeScript script/test.

### Milestone TS16: Platform Boundary Verification Replacement

- [x] Replace `scripts/quality/verify-platform-boundaries.ts` with Rust
      platform/site boundary checks.
- [x] Preserve import boundary and TPM-neutrality diagnostics.
- [x] Add Rust tests for valid and violating imports/content.
- [x] Verify `platform-check` and remove the TypeScript script/test.

### Milestone TS17: Astro Test Store Sync Replacement

- [x] Replace `scripts/testing/sync-astro-test-store.ts` with Rust or remove
      it if the behavior is obsolete under current Astro tests.
- [x] Preserve required Astro container test setup behavior.
- [x] Add Rust or config tests for the setup contract.
- [x] Verify `test-astro` and remove the TypeScript script/test.

### Milestone TS18: Test Accountability Replacement

- [x] Replace `scripts/testing/verify-test-accountability.ts` with Rust source
      accountability verification.
- [x] Preserve release-mode behavior and permission-exception handling.
- [x] Add Rust tests for mirrored files, ignored files, and release failures.
- [x] Verify `test-accountability`, `test-accountability-release`, and remove
      the TypeScript script/test.

### Milestone TS19: Flake Runner Replacement

- [x] Replace `scripts/testing/run-randomized-tests.ts` with Rust test-runner
      orchestration or remove it if obsolete.
- [x] Preserve randomized command planning where useful.
- [x] Add Rust tests for command generation and seed handling.
- [x] Verify `test-flake` and remove the TypeScript script/test.

### Milestone TS20: Catalog Test Runner Replacement

- [x] Replace `scripts/testing/run-catalog-tests.ts` with Rust orchestration.
- [x] Preserve catalog build/playwright command sequencing and argument
      forwarding.
- [x] Add Rust tests for command planning.
- [x] Verify `test-catalog` and remove the TypeScript script/test.

### Milestone TS21: Coverage Verification Replacement

- [x] Replace `scripts/testing/verify-test-coverage.ts` with Rust coverage
      accountability verification.
- [x] Preserve LCOV parsing, approved exceptions, and source accountability.
- [x] Add Rust tests for covered, uncovered, ignored, and exception cases.
- [x] Verify `coverage-verify`, `coverage`, and remove the TypeScript
      script/test.

### Milestone TS22: Payload Report Replacement

- [x] Replace `scripts/payload/report-payload.ts` with Rust payload report and
      budget checks.
- [x] Preserve route-class budgets, gzip/Brotli/raw measurement, cache-header
      evidence, and check mode, with accepted differences documented for the
      initial Rust raw-size report.
- [x] Add Rust tests for payload metrics and budget failures.
- [x] Verify `payload-check`, `payload-report`, and remove the TypeScript
      script/test.

### Milestone TS23: Payload Experiment Replacement Or Deletion

- [x] Replace or explicitly delete `scripts/payload/minify-html-experiment.ts`.
- [x] Replace or explicitly delete
      `scripts/payload/run-critical-css-experiment.ts`.
- [x] Replace or explicitly delete
      `scripts/payload/run-minify-html-experiments.ts`.
- [x] Replace or explicitly delete
      `scripts/payload/run-post-build-optimization-experiments.ts`.
- [x] Replace or explicitly delete
      `scripts/payload/run-vite-build-experiments.ts`.
- [x] Verify payload experiment recipes are Rust-owned, ecosystem adapters, or
      removed from `just`.

### Milestone TS24: Reference Tooling Replacement

- [x] Replace `scripts/content/audit-article-references.ts` with Rust
      reference audit behavior.
- [x] Replace `scripts/content/audit-bibtex-citations.ts` with Rust BibTeX
      citation audit behavior.
- [x] Replace `scripts/content/catalog-article-references.ts` with Rust
      catalog generation behavior.
- [x] Replace `scripts/content/migrate-mechanical-article-references.ts` with
      Rust dry-run/write migration behavior.
- [x] Add Rust tests for reference diagnostics, catalog output, and migration
      safety.
- [x] Verify reference recipes and remove the TypeScript scripts/tests.

### Milestone TS25: QA Metadata And Diff Replacement

- [x] Replace `scripts/quality/qa-command-registry.ts` with Rust or durable
      data generated/validated by Rust.
- [x] Replace `scripts/quality/diagnostic-diff.ts` with Rust diagnostic diff
      behavior.
- [x] Replace `scripts/quality/qa-failure-probes.ts` with Rust/data-owned
      failure-probe metadata.
- [x] Preserve CI/local parity, command-domain coverage, failure-probe
      accountability, and diagnostic snapshot comparison tests.
- [x] Verify `test-config`, `qa-registry`, `diagnostics-diff`, and remove
      migrated TypeScript files/tests.

### Milestone TS26: Command Surface Swap And TypeScript Script Deletion

- [x] Update `justfile` so no recipe calls `bun scripts/...` except
      `build-pdf`.
- [x] Delete migrated `scripts/**/*.ts` automation files and obsolete
      `tests/scripts/**/*.ts` tests.
- [x] Keep `scripts/build/generate-article-pdfs.ts` and necessary PDF support
      untouched as the explicit legacy exception.
- [x] Verify no docs or script help direct users to deleted TypeScript scripts.

### Milestone TS26A: Product CLI And Internal Xtask Split

- [x] Remove internal repository maintenance task plumbing from the
      user-facing `tpm` product CLI.
- [x] Add an internal `tpm-xtask` Rust crate for migrated repository
      automation behind focused `just` recipes.
- [x] Update `justfile` so named workflows call private `_xtask` plumbing
      instead of a public CLI maintenance subcommand.
- [x] Add Rust tests proving internal maintenance commands are rejected by the
      user-facing CLI and `tpm-xtask` is explicitly internal.
- [x] Update command, Rust workspace, operation, and migration docs for the
      product/internal command split.

### Milestone TS27: Rust Coverage And Quality Gates

- [x] Run Rust coverage after each major port and add tests until no genuine
      useful coverage improvements remain.
- [x] Run `just rust-check`, `just test-config`, and focused recipes after each
      command group is promoted.
- [x] Run `just check` and `just release-check` before handoff.
- [x] Document any remaining uncovered Rust branches with justification.

### Milestone TS28: Documentation And Replacement Report

- [x] Update `AGENTS.md`, `COMMANDS.md`, Rust workspace docs, roadmap docs, and
      generated platform references for the final command ownership model.
- [x] Document every old TypeScript script and its Rust replacement, deletion,
      ecosystem adapter status, or PDF legacy exception.
- [x] Remove outdated package-script/`bun scripts/...` guidance from active
      docs.
- [x] Verify docs checks and generated-reference drift checks pass.

## Active Milestone 9: Dual-Run Rust Migrations And Command Promotion

This phase migrates deterministic TypeScript/Bun tooling toward Rust and `just`
through observed behavior, parity-protected cleanup, dual-run reports,
accepted-difference documentation, and command promotion. The goal is not a
blind port. Current scripts provide baseline evidence; promoted replacements
should preserve correct and compatibility-critical behavior while cleaning up
accidental, duplicated, overbroad, or obsolete script behavior.

### Milestone 900: Milestone 9 Planning And Guardrails

- [x] Re-read milestone 9 Linear issues, Rust operation docs, QA fixture docs,
      command-router docs, and relevant current scripts.
- [x] Confirm blockers from milestone 8 are complete and identify any narrow
      blockers discovered during implementation.
- [x] Keep this checklist aligned with issue-level milestones and any new
      sub-milestones discovered while implementing.

### Milestone 901: IRK-170 Baseline And Script Classification

- [x] Inventory first-migration script domains and classify each as Rust
      replacement, JS/Astro ecosystem command behind `just`, obsolete/delete
      candidate, or temporary shim.
- [x] Capture current behavior, output shape, known quirks, cleanup targets,
      parity targets, and accepted-difference policy in a durable report.
- [x] Add tests or fixtures that keep the migration baseline deterministic and
      useful for downstream dual-run work.
- [x] Verify downstream Rust migration work has concrete parity and cleanup
      targets before marking IRK-170 complete.

### Milestone 902: IRK-171 Dual-Run Site Doctor Operation

- [x] Implement a Rust site-doctor operation over shared diagnostics and
      workspace/source contracts.
- [x] Compare the Rust operation against current `site:doctor` behavior for
      the active site and fixtures.
- [x] Document accepted differences and ensure TypeScript remains source of
      truth until promotion.
- [x] Add focused Rust and command-surface tests for success, warning, and
      failure paths.

### Milestone 903: IRK-172 Dual-Run Image Asset Verification

- [x] Implement Rust image asset inventory and location/shared/unused/duplicate
      verification report shells where practical.
- [x] Compare Rust evidence against current asset scripts and document accepted
      non-ported areas or intentional cleanup differences.
- [x] Keep media policy output compatible with future media inventory commands.
- [x] Add fixture or operation tests for ignored paths, valid assets, and
      violations.

### Milestone 904: IRK-173 Dual-Run Redirect Generation And Route Policy

- [x] Implement Rust redirect inventory/generation checks and Cloudflare static
      redirect policy limits.
- [x] Compare Rust redirect output against current generated `_redirects`
      output or document accepted differences.
- [x] Keep route/redirect policy provider-neutral enough for deployment
      adapters.
- [x] Add tests for legacy permalink parsing, configured redirects, duplicate
      handling, and output formatting.

### Milestone 905: IRK-174 Dual-Run QA Registry And Diagnostic Diff

- [x] Implement Rust QA command registry and diagnostic diff representations
      that mirror or improve current TypeScript behavior.
- [x] Compare registry and diff outputs against current script behavior.
- [x] Preserve CI/local parity visibility and avoid weakening existing gates.
- [x] Add tests for command classification, CI mapping, diagnostic comparison,
      and intentional cleanup decisions.

### Milestone 906: IRK-175 Generated-Output Verification Report Bridge

- [x] Add a Rust-owned generated-output report shell without replacing the
      existing verifier wholesale.
- [x] Bridge selected current verifier evidence into shared diagnostics/report
      shape where practical.
- [x] Identify verifier modules to port later and document accepted non-ported
      areas.
- [x] Add tests proving the report shape is useful for release reports, CLI,
      GUI, MCP, and CI consumers.

### Milestone 907: IRK-219 Command Inventory And End-State Policy

- [x] Inventory every current `package.json` script and custom repository
      TypeScript/Bun script.
- [x] Classify each command as Rust-owned, `just` orchestration over a
      JS/Astro ecosystem tool, temporary TypeScript fallback, review-only
      experiment, or obsolete/delete candidate.
- [x] Define the milestone 9 end-state policy for allowed package scripts,
      allowed Bun usage, and remaining TypeScript tooling debt.
- [x] Verify the policy is explicit enough to guide command promotion,
      cleanup, CI migration, docs, and follow-up issue state.

### Milestone 908: IRK-229 Ergonomic `just` Command Surface

- [x] Design the human command menu for setup, development, authoring,
      source checks, formatting, linting, tests, builds, release checks,
      review-only checks, Rust gates, CLI, docs, and deploy operations.
- [x] Implement aggregate and focused `just` recipes without putting domain
      logic in the `justfile`.
- [x] Ensure `just --list` is useful enough to replace package scripts as the
      developer command index.
- [x] Verify representative focused and aggregate `just` recipes work.

### Milestone 909: IRK-220 `just` Command Registry And CI Parity

- [x] Replace package-script registry assumptions with a command registry that
      classifies `just` recipes and any remaining direct tool adapters.
- [x] Keep CI/local parity, command domain coverage, runtime, mutation, and
      review/blocking metadata explicit.
- [x] Add or update tests that fail when `justfile`, CI workflows, or the
      command registry drift.
- [x] Verify registry tests and generated references are green.

### Milestone 910: IRK-221 CI, Docs, And Developer Workflow Migration

- [x] Move GitHub Actions command invocations from package scripts to `just`
      recipes while preserving artifact reuse and review-only behavior.
- [x] Update root, site, agent, Rust, QA, and generated-reference docs so
      human-facing instructions use `just`.
- [x] Keep ecosystem tool setup explicit: Bun installs JS dependencies,
      Astro/browser tools remain adapters, Rust/CLI checks use Cargo through
      `just`.
- [x] Verify CI workflow tests, docs reference checks, and config tests pass.

### Milestone 911: IRK-222 Through IRK-225 Tooling Ports And Fallbacks

- [x] Promote already-proven Rust operations for author/content/site,
      media/assets, routes/redirects, QA diagnostics, and generated-output
      report surfaces where parity evidence exists.
- [x] Move deterministic repository-owned orchestration into `just` or Rust
      and remove package-script wrappers for those paths.
- [x] Classify any remaining repository-owned TypeScript tools as
      time-boxed fallbacks with explicit owner, reason, and promotion target.
- [x] Keep JS/Astro ecosystem commands behind `just` recipes when Rust is not
      the right boundary.
- [x] Verify no source-content behavior changed without migration notes.

### Milestone 912: IRK-228 And IRK-226 Retire Legacy Script Surface

- [x] Remove package-script entries that have migrated to `just`.
- [x] Remove obsolete repository-owned TypeScript/Bun orchestration helpers
      that are no longer called.
- [x] Add a no-regression guard preventing new package scripts without an
      explicit, reviewed exception.
- [x] Verify package ordering, dead-code checks, command-registry checks, and
      focused tests pass.

### Milestone 913: IRK-230 And IRK-227 Final Docs, Verification, And Linear Closeout

- [x] Update final milestone 9 docs with package-script shrinkage, remaining
      Bun/TypeScript adapters, accepted differences, and follow-up debt.
- [x] Run focused command, Rust, registry, docs, and config checks.
- [x] Run the full release gate and fix any issues.
- [x] Attach relevant docs to Linear issues and move completed milestone 9
      issues to In Review.
- [x] Summarize completed work, accepted differences, remaining adapters, and
      follow-up blockers.

## Active Rust Coverage Pass

This pass raises Rust coverage as close to 100% useful coverage as practical.
Uncovered code should be treated as design feedback: add tests where seams are
clean, refactor where coverage is blocked by mixed concerns, and leave only
explicitly justified gaps.

### Milestone R01: Measure And Classify Coverage Gaps

- [x] Run detailed Rust coverage and identify uncovered lines/branches by
      crate and module.
- [x] Classify each gap as missing useful coverage, defensive/external glue,
      or design friction requiring refactor.
- [x] Decide whether uncovered code should get tests, refactors, or an
      explicit remaining-gap justification.

### Milestone R02: Improve Rust Test Coverage

- [x] Add focused Rust tests for uncovered behavior without test-only exports
      or brittle output snapshots.
- [x] Refactor any poorly separated Rust code where coverage gaps reveal mixed
      concerns or awkward seams.
- [x] Re-run coverage until no genuine useful coverage improvements remain.

### Milestone R03: Verify And Report

- [x] Run blocking Rust gates and relevant release checks after coverage
      changes.
- [x] Record final Rust coverage status and justify any remaining uncovered
      code.

## Active Milestone 8: Operation Core And CLI Vertical Slice

This phase implements as much of Linear milestone 8 as is currently unblocked.
The goal is to establish shared Rust operation contracts for diagnostics,
workspace discovery, operation results, fixtures, CLI, MCP, GUI, and CI without
replacing existing Bun/Astro behavior.

### Milestone 800: Milestone 8 Planning And Dependency Check

- [x] Re-read the Rust workspace, CLI/Rust/GUI integration, roadmap, and
      Linear milestone 8 issue docs.
- [x] Confirm which milestone 8 issues are genuinely unblocked and which must
      remain blocked by earlier CLI/product milestones.
- [x] Keep this checklist aligned with any new sub-milestones discovered while
      implementing.

### Milestone 801: IRK-163 Core Diagnostic Model

- [x] Design the shared diagnostic contract for CLI, GUI, MCP, CI, and
      generated-output consumers.
- [x] Implement typed severities, stable codes, source/artifact locations,
      author/developer-facing messages, remediations, serialization, and
      human/JSON rendering without interface-specific imports.
- [x] Add focused Rust tests for empty, warning, error, location, remediation,
      human output, and machine output cases.
- [x] Verify the diagnostic crate remains platform-neutral and can feed future
      operation results.

### Milestone 802: IRK-164 Workspace Context And Source Artifact Model

- [x] Design workspace discovery, active site root discovery, source root
      modeling, path display, ignored path policy, and source artifact
      inventory boundaries.
- [x] Implement deterministic workspace/source artifact models for TPM-like,
      starter-like, and missing-path workspaces.
- [x] Add fixture tests for valid, alternate, and invalid workspace states.
- [x] Verify no cwd singleton, TPM-only, Astro-page, or CLI-only assumptions
      leak into the workspace crate.

### Milestone 803: IRK-210 Rust CI And QA Hardening

- [x] Review dedicated Rust CI, local/CI parity, cargo-deny promotion,
      nextest policy, and Rust coverage timing.
- [x] Implement the unblocked blocking-gate and documentation updates.
- [x] Leave review-only or blocked tooling explicitly documented when a tool is
      not ready to promote.
- [x] Verify QA registry, docs, and CI workflow metadata stay in sync.

### Milestone 804: IRK-165 Operation Request And Result Shell

- [x] Design the shared operation envelope after diagnostic and workspace
      contracts exist.
- [x] Implement typed operation IDs, metadata, timing, status, diagnostics,
      warnings, summaries, schema versioning, and human/JSON output.
- [x] Add a sample operation/test fixture that exercises success, warning, and
      failure output without depending on CLI/GUI/MCP code.
- [x] Verify the envelope can be consumed by the future CLI command surface.

### Milestone 805: IRK-166 Operation Fixture And Snapshot Strategy

- [x] Design fixture/snapshot rules for Rust operations, CLI output, GUI/MCP
      consumers, and CI diagnostics.
- [x] Add operation fixture docs and initial stable fixture/snapshot tests.
- [x] Verify the strategy avoids brittle snapshots while still protecting
      machine-readable contracts.

### Milestone 806: IRK-167 CLI Skeleton And Command Grammar

- [x] Re-read the accepted CLI product strategy, Rust operation contracts,
      Rust workspace docs, and current `tpm-cli` crate before implementation.
- [x] Replace the additive placeholder CLI shell with a thin command grammar
      over typed operation requests/results.
- [x] Add shared command parsing for help, version, workspace selection, output
      format, and first-slice command families without owning domain logic in
      command handlers.
- [x] Add focused tests for help, version, shared flags, usage failures, exit
      code mapping, and sample operation wiring.
- [x] Verify the CLI skeleton remains additive and does not replace Bun/Astro
      behavior.

### Milestone 807: IRK-168 First CLI Commands

- [x] Implement `tpm site status --format json` over the workspace operation
      contract.
- [x] Implement `tpm check --format json` over the same diagnostic/result
      envelope without claiming full release-check parity.
- [x] Implement `tpm doctor` with remediation-focused human output over shared
      diagnostics.
- [x] Implement `tpm release inspect` as a read-only release/output inspection
      operation with explicit transitional diagnostics.
- [x] Add human and JSON output tests, fixture-site coverage, and failure-path
      tests for the first command slice.

### Milestone 808: IRK-169 Final Operation Core And CLI Slice Verification

- [x] Verify Rust unit tests, doctests, formatting, clippy, and supply-chain
      gates.
- [x] Verify command handlers stay thin and all command output comes from
      shared operation contracts or explicit CLI renderers.
- [x] Verify docs and command references match the implemented first slice.
- [x] Run broader release checks if practical for the touched surfaces.

### Milestone 809: Milestone 8 Linear Closeout

- [x] Run focused Rust, QA registry, and documentation checks.
- [x] Run broader release checks if practical for the touched surfaces.
- [x] Attach relevant docs to completed Linear issues and move completed
      issues to In Review.
- [x] Summarize completed work and remaining blockers.
