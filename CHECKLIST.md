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

## Active Milestone 7: Rust Workspace And QA Foundation

This phase implements Linear milestone 7 additively. Rust, Cargo, and `just`
must not replace existing Bun/Astro behavior until later parity milestones prove
the replacement is safe.

### Milestone 700: IRK-157 Add Rust Workspace Infrastructure

- [x] Read relevant Rust migration, QA, CLI/Tauri/Just, fixture, and repo
      philosophy docs.
- [x] Add root Cargo workspace files, pinned toolchain, minimal initial crates,
      and lockfile without changing site behavior.
- [x] Verify direct Rust formatting, check, lint, and tests pass.
- [x] Verify generated site output is unchanged or explain any intentional
      difference.

### Milestone 701: IRK-158 Add Strict Rust QA Baseline

- [x] Add strict but low-noise workspace lint policy.
- [x] Add initial `cargo-deny` policy file and keep unavailable tooling out of
      default blocking gates.
- [x] Add review-only Rust QA commands for coverage and optional external
      cargo tools.
- [x] Verify blocking Rust QA commands pass with installed stable tooling.

### Milestone 702: IRK-159 Add Just Command Router

- [x] Add a root `justfile` with discoverable repository, Bun, and Rust
      recipes.
- [x] Keep `just` recipes as orchestration only; domain logic stays in Bun,
      Cargo, or future `tpm` commands.
- [x] Verify `just --list`, focused recipes, and default check recipes work.

### Milestone 703: IRK-160 Create Neutral Rust Fixture Workspace

- [x] Add a small non-TPM Rust fixture workspace for future Rust parity and
      diagnostic tests.
- [x] Add fixture ownership notes and tests that prove the initial workspace
      model can consume it without TPM branding.
- [x] Verify fixture tests run through Rust QA.

### Milestone 704: IRK-161 Document Rust Contributor Workflow

- [x] Add contributor documentation for Cargo, `just`, Bun, review-only Rust
      tooling, and additive migration policy.
- [x] Update AGENTS/readme-style guidance only where it helps contributors use
      the new tooling correctly.
- [x] Verify docs match actual commands.

### Milestone 705: IRK-162 Verify Additive Rust Foundation

- [x] Run direct Rust checks.
- [x] Run relevant `just` recipes.
- [x] Run existing Bun checks needed to prove the Rust foundation is additive.
- [x] Confirm review-only tools are documented as review-only.
- [x] Update Linear issues to In Review and attach relevant docs.

## Active CLI Design Research

This research phase produces an evergreen, evidence-backed guide to excellent
CLI design. It is intentionally not a TPM CLI product spec. The final document
should be useful for future CLI design work in this repo and in unrelated
projects.

### Milestone 500: Research Scope And Source Plan

- [x] Define the research questions, source quality bar, source categories,
      evidence-strength labels, and evaluation rubric.
- [x] Create supporting research documents for source logging, case-study
      notes, anti-patterns, and synthesis notes.
- [x] Verify the scope excludes TPM-specific command design while still
      producing principles useful for later CLI contracts.
      Added `agent-docs/cli-design-research/` scaffolding and
      `agent-docs/CLI_DESIGN_GUIDE.md`. Verified with markdown lint and
      `git diff --check`.

### Milestone 501: Authoritative Guidance Review

- [x] Review standards, platform guidance, expert CLI design guides,
      accessibility/scriptability guidance, and developer-experience sources.
- [x] Record source claims, credibility, limits, and whether each source should
      influence the final guide.
- [x] Verify claims against primary sources where possible.
      Recorded standards, platform docs, expert guidance, and official CLI
      docs in `agent-docs/cli-design-research/SOURCE_LOG.md`. Verified with
      markdown lint and `git diff --check`.

### Milestone 502: Best-In-Class CLI Discovery And Case Studies

- [x] Identify CLIs that are repeatedly praised, influential, or instructive
      from evidence rather than assumption.
- [x] Evaluate selected CLIs with the research rubric.
- [x] Include critiques of popular CLIs where evidence shows UX tradeoffs.
      Added evidence-backed case studies for `gh`, Terraform, `kubectl`,
      `gcloud`, `rg`, `fd`, `jq`, and Git. Verified with markdown lint and
      `git diff --check`.

### Milestone 503: Anti-Patterns And Tradeoff Review

- [x] Identify common CLI UX failures, unsafe patterns, automation hazards,
      documentation failures, and provider/auth pitfalls.
- [x] Separate universal anti-patterns from context-dependent tradeoffs.
- [x] Verify each anti-pattern is supported by evidence or marked as
      judgment-based.
      Added anti-pattern and tradeoff notes for output contracts,
      non-interactive safety, destructive operations, flags, inference,
      side effects, secrets, color/accessibility, state recovery,
      documentation, compatibility, and scope. Verified with markdown lint and
      `git diff --check`.

### Milestone 504: Draft Evergreen CLI Design Guide

- [x] Write the first full guide from the research notes.
- [x] Include principles, concrete necessities, examples, tradeoffs,
      evidence-strength notes, and a reusable review rubric.
- [x] Keep the guide general-purpose and avoid a TPM-specific section.
      Drafted `agent-docs/CLI_DESIGN_GUIDE.md` from the research notes and
      added synthesis notes. Verified with markdown lint and whitespace checks.

### Milestone 505: Iterative Refinement And Fact Checking

- [x] Critique the draft for unsupported claims, missing sources,
      contradictions, weak recommendations, and overfitting.
- [x] Run multiple refinement passes until the guide is practical,
      evidence-backed, evergreen, and implementation-useful.
- [x] Verify citations, markdown quality, and checklist completion before
      handoff.
      Removed project-specific example text, added agent/automation readiness,
      added a reusable command contract template, checked for TPM-specific
      drift, reviewed source links, and verified with markdown review and
      whitespace checks.

## Active TPM CLI Product Strategy Research

This research phase applies the evergreen CLI design guide to the future TPM
platform CLI. It should survey adjacent products, catalog their feature sets,
identify product-market-fit opportunities, and produce a product/design report
that can become command specs and Linear implementation issues later.

### Milestone 506: Product Research Scope And Rubric

- [x] Define target users, product questions, source quality bar, comparison
      criteria, and report structure.
- [x] Create supporting docs for source notes, product survey, feature catalog,
      user jobs, opportunity synthesis, command principles, platform mapping,
      and phase/risk planning.
- [x] Verify the research is product-specific without prematurely specifying
      final commands.
      Added `agent-docs/cli-product-research/` scaffolding and
      `agent-docs/TPM_CLI_PRODUCT_STRATEGY.md`. Verified with markdown lint and
      `git diff --check`.

### Milestone 507: Adjacent Product Survey

- [x] Research representative CLIs and adjacent CMS/static-site products from
      authoritative sources where possible.
- [x] Record product model, target users, feature set, workflow assumptions,
      strengths, weaknesses, and relevance.
- [x] Include CLI and non-CLI products so the product strategy is not trapped
      in terminal-first assumptions.
      Researched static-site CLIs, deploy-provider CLIs, Git-backed static CMS
      products, headless CMS tools, managed publishing tools, and docs
      publishing tools. Recorded sources in
      `agent-docs/cli-product-research/SOURCE_LOG.md` and product notes in
      `agent-docs/cli-product-research/PRODUCT_SURVEY.md`. Verified with
      markdown lint and `git diff --check`.

### Milestone 508: Feature Catalog And Competitive Matrix

- [x] Catalog feature sets across initialization, authoring, content modeling,
      media, preview, build, deploy, migration, diagnostics, collaboration,
      extensions, automation, machine output, and governance.
- [x] Identify repeated patterns, gaps, and places where existing tools make
      difficult work too technical.
- [x] Separate lessons to copy from constraints to avoid.
      Added the competitive matrix, feature area findings, table stakes,
      differentiators, mature capabilities, and constraints to avoid in
      `agent-docs/cli-product-research/FEATURE_CATALOG.md`. Verified with
      markdown lint and `git diff --check`.

### Milestone 509: User Segments, Jobs, And Opportunities

- [x] Map default users, terminal-comfortable owners, publication teams,
      CI/automation, extension developers, future GUI/MCP consumers, and
      complex publishers to concrete jobs.
- [x] Identify product opportunities where the CLI can make hard workflows
      unusually easy.
- [x] Draft the CLI product thesis and non-goals.
      Added user segment/job mapping to
      `agent-docs/cli-product-research/USER_JOBS.md` and opportunity synthesis,
      thesis, differentiators, and non-goals to
      `agent-docs/cli-product-research/OPPORTUNITY_SYNTHESIS.md`. Verified with
      markdown lint and `git diff --check`.

### Milestone 510: Command Surface Principles And Platform Mapping

- [x] Apply `agent-docs/CLI_DESIGN_GUIDE.md` to TPM CLI grammar, output modes,
      interactivity, safety, auth, config, diagnostics, and compatibility.
- [x] Map proposed CLI responsibility areas to platform contracts and identify
      missing seams.
- [x] Ensure the CLI is an interface over studio/platform contracts, not a
      parallel source/workflow model.
      Added command surface notes in
      `agent-docs/cli-product-research/COMMAND_SURFACE_NOTES.md` and platform
      contract mapping in `agent-docs/cli-product-research/PLATFORM_MAPPING.md`.
      Verified with markdown lint and `git diff --check`.

### Milestone 511: Implementation Phase Plan, Risks, And Validation

- [x] Define initial implementation scope, later phases, and explicit deferrals.
- [x] Record risks around provider lock-in, Git assumptions, asset storage,
      destructive deploys, migration correctness, command compatibility,
      secrets, hidden network effects, and UX confusion.
- [x] Define validation through docs examples, fixtures, help/output tests,
      JSON/schema tests, CI, dogfooding, and usability walkthroughs.
      Added initial implementation scope, phase plan, risks, non-goals, and
      validation plan in
      `agent-docs/cli-product-research/PHASE_RISKS_VALIDATION.md`. Verified
      with markdown lint and `git diff --check`.

### Milestone 512: Final Report Refinement And Verification

- [x] Write the final TPM CLI product strategy report from research notes.
- [x] Iterate for weak claims, missing evidence, over-specific commands, bad
      product assumptions, and alignment with the platform roadmap.
- [x] Verify markdown quality, source links, checklist completion, and handoff
      readiness.
      Added `agent-docs/TPM_CLI_PRODUCT_STRATEGY.md` as the standalone TPM CLI
      product strategy report. Replaced the weak Eleventy mirror citation with
      the official 11ty docs, reviewed the report against the roadmap and
      platform contracts, and verified with markdown lint and
      `git diff --check`.

### Milestone 513: Future Help Contract Draft

- [x] Add a final-form `tpm --help` draft to the product strategy report.
- [x] Make the help output concrete enough to express the full CLI vision
      across default local publishing, TPM-like collaboration, complex
      publishers, automation, extensions, and MCP.
- [x] Verify the help draft is realistic, coherent, and aligned with the
      platform roadmap before using it as the next design target.
      Added a `Future Help Contract` section to
      `agent-docs/TPM_CLI_PRODUCT_STRATEGY.md` with root help, global options,
      command-family help, user-journey fit notes, and product conclusions.
      Refined the report to lead with the full CLI control-plane vision rather
      than the first implementation slice. Verified with focused markdown lint
      and `git diff --check`.

### Milestone 514: Feature Matrix Scope And Source Expansion

- [x] Define the products, feature categories, evidence labels, and matrix
      notation for a researched comparison matrix.
- [x] Re-read existing CLI product research and identify gaps that need more
      primary-source verification.
- [x] Add or update source notes for products and features that materially
      affect the matrix.
      Reviewed the existing CLI strategy research, defined matrix notation in
      `agent-docs/cli-product-research/FEATURE_COMPARISON_MATRIX.md`, and
      expanded `SOURCE_LOG.md` with additional official docs for integrations,
      media, static CMS editing, no-code CMS publishing, managed CMS workflows,
      and versioning.

### Milestone 515: Product Feature Survey

- [x] Survey adjacent static-site, deploy, Git-backed CMS, managed CMS,
      headless CMS, and studio products from official docs where possible.
- [x] Record which features are native, partial, plugin/provider-specific,
      developer-only, GUI-only, or absent.
- [x] Capture caveats that matter to a blog/article publishing product, not
      just raw feature presence.
      Surveyed static-site CLIs, deploy CLIs, Git-backed CMS/studios, no-code
      site CMSs, managed CMSs, and headless CMSs. Recorded nuanced feature
      markings in `FEATURE_COMPARISON_MATRIX.md`.

### Milestone 516: Comparison Matrix And Feature Taxonomy

- [x] Create a feature comparison matrix that compares relevant products to the
      mature TPM CLI/platform vision.
- [x] Include nuanced cells rather than only yes/no where the UX or product
      model materially differs.
- [x] Organize features around user jobs: create, write, preview, validate,
      media, publish, collaborate, migrate, extend, automate, and govern.
      Added three feature matrices for static/deploy tooling, static
      CMS/no-code products, and managed/headless CMS products, plus a feature
      taxonomy and coverage synthesis table.

### Milestone 517: CLI Language And UX Synthesis

- [x] Use the matrix to refine the CLI language: which concepts deserve
      first-class commands, adapters, profiles, plans, reports, or GUI/MCP
      backing.
- [x] Identify ways TPM can make complex behavior simpler without removing
      extensibility.
- [x] Update the CLI strategy report with the refined comparison conclusions.
      Added design-language implications and matrix conclusions to
      `FEATURE_COMPARISON_MATRIX.md`, and added a `Feature Matrix Conclusions`
      section to `agent-docs/TPM_CLI_PRODUCT_STRATEGY.md`.

### Milestone 518: Matrix Refinement And Verification

- [x] Critique the matrix for weak claims, missing caveats, false equivalence,
      overfitting to current TPM needs, and command-language ambiguity.
- [x] Iterate until the matrix is useful for product design and future command
      specs.
- [x] Verify markdown quality, source links, checklist completion, and handoff
      readiness.
      Replaced stale small-scope framing in the CLI product research docs with
      implementation-slice language, corrected source links, refined the
      matrix conclusions, and verified with focused markdown lint,
      `bun --silent run review:markdown`, and `git diff --check`.

### Milestone 519: CLI Design Decision Critique Scope

- [x] Re-read the engineering philosophy, platform roadmap, studio vision,
      evergreen CLI guide, CLI product strategy, and feature matrix.
- [x] Identify the high-impact CLI design decisions that need explicit
      alternatives, recommendations, justifications, and tradeoffs.
- [x] Verify the critique scope is broad enough to allow hard pivots if the
      current product direction is weak.
      Re-read the relevant philosophy, roadmap, studio, CLI guide, product
      strategy, and comparison matrix docs. Identified the missing design
      decision layer and scoped the critique around hard-pivot review, command
      grammar, product vocabulary, platform operation contracts, and safety.

### Milestone 520: CLI Alternatives And Tradeoff Review

- [x] For each high-impact CLI design decision, list viable options rather than
      only the current momentum.
- [x] Recommend one option with clear justification, explicit tradeoffs, and
      mitigation steps.
- [x] Call out rejected hard pivots and explain why they are weaker for the
      end-state studio/CLI/MCP product.
      Added
      `agent-docs/cli-product-research/DESIGN_DECISION_REVIEW.md` with
      option-by-option critiques, recommendations, tradeoffs, mitigations, and
      rejected pivots for CLI product model, grammar, publish/deploy,
      releases, check/doctor, source/workflow, media, extensions/adapters,
      plan/apply, machine output, profiles/targets, GUI/CLI/MCP parity,
      import/export, product packaging, content language, guided flows,
      config, Astro boundaries, and MCP timing.

### Milestone 521: CLI Strategy Refinement

- [x] Update the CLI product strategy and supporting research docs with the
      critique findings.
- [x] Make sure the recommended command language is elegant, ambitious,
      user-centered, and aligned with shared platform operation contracts.
- [x] Verify the help contract and phase plan still follow from the refined
      design decisions.
      Updated `agent-docs/TPM_CLI_PRODUCT_STRATEGY.md` with the shared
      operation-model thesis, explicit design recommendations, and rejected
      pivots. Cross-linked the design decision review from the strategy,
      feature matrix, and research index. Verified the future help contract and
      phase plan still follow from the refined command language.

### Milestone 522: CLI Critique Verification And Handoff

- [x] Objectively re-read the updated documents for weak claims, missing
      alternatives, contradictions, fake precision, and overfitting.
- [x] Iterate until no further design improvements are apparent.
- [x] Run markdown and whitespace verification before handoff.
      Performed a second critique pass and added missing decisions for content
      vocabulary, guided flows, typed config, Astro boundaries, and MCP timing.
      Corrected supporting publish/deploy terminology drift in the command
      surface, feature catalog, and opportunity synthesis notes. Verified with
      `bunx prettier --write` on the touched docs,
      `bun --silent run review:markdown`, and `git diff --check`.

### Milestone 523: CLI Journey Design Scope

- [x] Re-read the CLI strategy, decision review, user jobs, command notes, and
      phase plan for places where abstract recommendations need concrete
      examples.
- [x] Identify realistic journeys across default local publishers,
      terminal-comfortable owners, collaborative publications, automation,
      migration, media growth, extension developers, MCP, and complex
      publishers.
- [x] Verify the examples use realistic files, paths, commands, user goals, and
      platform operations without becoming fake implementation promises.
      Re-read the CLI strategy packet and identified concrete journeys for
      default publishing, diagnostics repair, TPM-like article review, media
      externalization, legacy imports, CI publish, extension development, MCP
      troubleshooting, complex publishers, support debugging, backup/history,
      and typed config changes.

### Milestone 524: CLI Journey Design Draft

- [x] Add a dedicated journey design report with concrete scenario narratives,
      command flows, expected files/artifacts, and explanations of what the tool
      does.
- [x] Include both happy paths and repair paths so diagnostics, plans, machine
      output, media, releases, source/workflow, import/export, and adapters are
      exercised.
- [x] Keep examples aligned with the mature command language and shared
      operation model.
      Added
      `agent-docs/cli-product-research/USER_JOURNEY_DESIGNS.md` with realistic
      user goals, filenames, routes, plans, reports, command flows, tool
      behavior, design requirements, a journey coverage matrix, and command-spec
      implications.

### Milestone 525: CLI Journey Design Integration And Verification

- [x] Cross-link the journey report from the CLI strategy and research index.
- [x] Objectively critique the journey examples for missing user goals,
      unrealistic commands, unclear tool behavior, and design drift.
- [x] Iterate until no further improvements are apparent, then run markdown and
      whitespace verification.
      Cross-linked the journey report from `agent-docs/TPM_CLI_PRODUCT_STRATEGY.md`
      and `agent-docs/cli-product-research/README.md`. Added a journey summary
      to the main strategy. Iterated on gaps for backup/history and typed config
      plans, then aligned the config help contract and decision review. Verified
      with `bunx prettier --write`, `bun --silent run review:markdown`, and
      `git diff --check`.

### Milestone 526: Rust Migration Research Scope And Repo Audit

- [x] Re-read platform, CLI, studio, and QA docs for migration implications.
- [x] Audit the current Bun/TypeScript scripts, platform modules, QA gates,
      generated artifacts, and adapter seams for Rust migration candidates.
- [x] Separate Rust-core candidates, Astro/TS adapter work, browser-bound work,
      and orchestration-only work.
      Added a Rust migration repo audit in
      `agent-docs/rust-migration-research/REPO_MIGRATION_AUDIT.md`, covering
      current script domains, first/second/third wave migration candidates,
      TypeScript/Astro boundaries, and the recommended first implementation
      slice.

### Milestone 527: Rust Tooling And Library Research

- [x] Research Rust workspace, CLI, diagnostics, config/schema, testing,
      property/fuzz testing, coverage, security, supply-chain, linting,
      formatting, docs, Tauri, MCP, and `just` tooling from primary docs where
      practical.
- [x] Identify recommended libraries and tools, alternatives, tradeoffs, and
      adoption timing.
- [x] Verify recommendations support strictness, developer velocity, parity
      testing, and eventual Tauri GUI reuse.
      Added `agent-docs/rust-migration-research/RUST_TOOLING_STRICTNESS.md`,
      `agent-docs/rust-migration-research/CLI_TAURI_JUST_ARCHITECTURE.md`, and
      `agent-docs/rust-migration-research/SOURCE_LOG.md`, with recommendations
      for Cargo workspace setup, rustup, Clippy/rustfmt, nextest, llvm-cov,
      cargo-deny, cargo-audit, property/fuzz tests, snapshots, CLI libraries,
      Tauri capabilities, MCP timing, and `just` command orchestration.

### Milestone 528: Rust Migration Architecture And Implementation Plan

- [x] Write the Rust-first platform/core migration plan, crate layout, adapter
      boundaries, operation protocol, `just` orchestration model, CLI plan, and
      Tauri path.
- [x] Define safe migration sequencing with parity tests, comparison mode,
      fixture strategy, quality gates, and rollback points.
- [x] Call out concrete dependencies/tooling to add, when to add them, and
      which current scripts/domains they replace.
      Added the authoritative plan in
      `agent-docs/RUST_MIGRATION_AND_CLI_PLAN.md`, then cross-linked it from
      `agent-docs/TPM_CLI_PRODUCT_STRATEGY.md`,
      `agent-docs/PLATFORM_ROADMAP.md`, and `AGENTS.md`.

### Milestone 529: Rust Migration Plan Critique And Verification

- [x] Critique the plan for overreach, underreach, duplicated logic, missing
      tests, weak boundaries, poor developer UX, and hidden TypeScript/Astro
      coupling.
- [x] Iterate until the docs are implementation-ready and clearly actionable.
- [x] Run markdown and whitespace verification before handoff.
      Removed fake precision around the initial Rust version, tightened YAML
      dependency guidance, clarified MCP SDK timing, and verified with
      `bunx prettier --write`, `bun --silent run review:markdown`, and
      `git diff --check`.

### Milestone 530: Rust Migration Linear Readiness Pass

- [x] Re-read the Rust migration plan, migration audit, tooling strictness
      plan, CLI/Tauri/Just architecture notes, CLI strategy, and platform
      roadmap for Linear planning gaps.
- [x] Add issue-ready sequencing, blockers, acceptance criteria, promotion
      gates, and open implementation decisions where the docs were too broad.
- [x] Verify the updated docs and checklist before handoff.
      Added a Linear planning breakdown to
      `agent-docs/RUST_MIGRATION_AND_CLI_PLAN.md`, a migration-readiness table
      to `agent-docs/rust-migration-research/REPO_MIGRATION_AUDIT.md`, tool
      decision states to
      `agent-docs/rust-migration-research/RUST_TOOLING_STRICTNESS.md`, and
      operation readiness / CLI issue ordering to
      `agent-docs/rust-migration-research/CLI_TAURI_JUST_ARCHITECTURE.md`.

### Milestone 531: Rust QA Tooling Evaluation

- [x] Re-read `AGENTS.md`, the engineering philosophy, the Rust migration
      plan, and existing Rust tooling notes for repo-specific goals.
- [x] Treat `/Users/irk/Downloads/deep-research-report (2).md` as untrusted
      input, then verify candidate tools and claims against primary sources.
- [x] Write a project-specific Rust QA/static-analysis report with goals,
      staged adoption states, blocking versus review-only guidance, command
      profiles, and implementation notes.
      Added
      `agent-docs/rust-migration-research/RUST_QA_TOOLING_EVALUATION.md` and
      cross-linked it from the Rust migration plan, Rust tooling strictness
      notes, and `AGENTS.md`.

### Milestone 532: CLI, Rust, And Tauri/Astro GUI Integration Plan

- [x] Re-read `AGENTS.md`, the engineering philosophy, the CLI strategy, Rust
      migration plan, studio product vision, adapter model, extension model,
      Rust/Tauri architecture notes, and current platform/script structure.
- [x] Verify the Tauri/Astro stack assumptions against official docs and map
      them to the repo's static-first operation-core model.
- [x] Write a coherent high-level plan that coordinates CLI, Rust migration,
      MCP, `just`, adapter contracts, and the Tauri/Astro GUI into one
      issue-ready sequence.
      Added `agent-docs/CLI_RUST_GUI_INTEGRATION_PLAN.md` and cross-linked it
      from the roadmap, CLI strategy, Rust migration plan, and `AGENTS.md`.

### Milestone 533: CLI/Rust/GUI Planning Readiness Audit

- [x] Re-read the CLI, Rust migration, Tauri/Astro GUI, studio, adapter, and
      extension planning docs for consistency before implementation issue
      breakdown.
- [x] Identify planning-readiness gaps around decision records, tradeoffs,
      promotion gates, first GUI proof acceptance criteria, and open questions.
- [x] Patch the integration and Rust QA plans so implementation issues can be
      created without implying a parallel GUI/CLI/MCP model or overly noisy
      first Rust gates.

## Active Milestone 5 Execution

Milestone 5 is the distribution and ecosystem readiness layer. It should finish
the platform seams needed before the static blog studio product work begins.
Studio GUI/CLI/MCP product issues live in Milestone 6, not here.

### Milestone 400: Milestone 5 Refresh And Execution Plan

- [x] Re-read the Milestone 5 Linear issues, engineering philosophy, platform
      roadmap, extension model, deployment adapter contract, import/export
      policy, localization contract, and relevant source modules.
- [x] Confirm the issue sequence and blockers after the studio issues were
      moved to Milestone 6.
- [x] Break the Milestone 5 issues into checklist milestones that can be
      implemented and verified one at a time.

### Milestone 401: IRK-113 Internal Entrypoints And Import Boundaries

- [x] Select the internal entrypoint domains that are ready for real use based
      on the extraction criteria design.
- [x] Add internal entrypoints or workspace-style seams for accepted candidates
      without leaking TPM content, active `site/`, cwd, or singleton config
      assumptions into reusable cores.
- [x] Add import-boundary and public-shape tests, then verify release checks
      still pass after consumers use explicit entrypoints.
      Added `src/platform/diagnostics.ts`, `src/platform/interactions.ts`,
      `src/platform/media.ts`, `src/platform/references.ts`, and
      `src/platform/routes.ts`. Platform checks now enforce owned
      `src/platform` entrypoints and entrypoint import boundaries. Verified
      with focused platform-boundary and entrypoint tests,
      `bun --silent run platform:check`, `bun --silent run typecheck`,
      `bun --silent run review:markdown`, and `git diff --check`.

### Milestone 402: IRK-114 Non-TPM Fixture And Example Consumers

- [x] Build or update fixture/example consumers that import internal entrypoints
      without TPM imports, copy, assets, or branding.
- [x] Document candidate APIs, current consumers, portability target, remaining
      blockers, and rejected extraction paths.
- [x] Verify fixture/example builds and boundary checks prove real non-TPM use.
      Added `examples/platform-entrypoint-consumer/` as a non-TPM consumer of
      the accepted `src/platform/*` seams and documented candidate evidence in
      `docs/PACKAGE_BOUNDARIES_AND_EXTRACTION_CRITERIA.md`. Verified with
      focused example/entrypoint/platform-boundary tests,
      `bun --silent run platform:check`, `bun --silent run typecheck`,
      `bun --silent run review:markdown`, and `git diff --check`.

### Milestone 403: IRK-115 Typed Extension Manifest Design

- [x] Re-read extension, adapter, roadmap, route registry, verifier, and
      package-boundary docs before changing extension contracts.
- [x] Define typed extension manifest, capability families, allowed extension
      points, forbidden access, ordering, dependencies, conflicts,
      disabled-state, deprecation, and migration rules.
- [x] Add type-level positive and negative fixtures and docs that explain how
      extension capabilities map to platform domains.
      Added `src/lib/extensions.ts`, `src/platform/extensions.ts`,
      `docs/EXTENSION_ARCHITECTURE.md`, and extension manifest fixtures for
      runtime validation, platform entrypoint use, and type-level rejection of
      invalid enum values. Verified with focused extension/platform-boundary
      tests, `bun --silent run platform:check`, `bun --silent run typecheck`,
      `bun --silent run review:markdown`, and `git diff --check`.

### Milestone 404: IRK-116 Fixture Extensions And Disabled-State Tests

- [x] Add at least two site-agnostic fixture extensions across different
      extension-point types.
- [x] Verify enabled, disabled, missing dependency, incompatible feature flag,
      and conflicting output states.
- [x] Ensure extension-owned artifacts and diagnostics are declared and cleanly
      removed when disabled.
      Added site-agnostic fixture manifests for PDF artifacts, UI components,
      metadata profiles, dependency states, and conflicting generated outputs.
      Added `resolveExtensionManifests()` so disabled extensions drop active
      capabilities/artifacts and missing dependency, feature, and generated
      artifact conflicts are diagnostic states. Verified with focused extension
      tests, `bun --silent run typecheck`, `bun --silent run review:markdown`,
      `bun --silent run platform:check`, and `git diff --check`.

### Milestone 405: IRK-117 Extension Boundary Enforcement

- [x] Enforce forbidden imports, forbidden layer access, undeclared generated
      outputs, undeclared routes, incompatible capabilities, and missing docs
      hooks for extensions.
- [x] Route extension diagnostics through the shared verifier/site-doctor/report
      diagnostic model where appropriate.
- [x] Verify boundary and generated-output tests fail with actionable extension
      diagnostics.
      Extended `platform:check` with future `extensions/` and
      `site/extensions/` import-boundary checks. Added extension diagnostics for
      undeclared generated outputs/routes, missing docs hooks, and conversion
      into generated-output diagnostics. Verified with focused extension and
      platform-boundary tests, `bun --silent run typecheck`,
      `bun --silent run review:markdown`, `bun --silent run platform:check`,
      and `git diff --check`.

### Milestone 406: IRK-145 Extension Catalog And Lifecycle

- [x] Define extension classes, lifecycle states, bundled/default boundaries,
      safe-disable, uninstall, migration, config ownership, generated-output
      ownership, docs generation, diagnostic ownership, and trust-boundary
      rules.
- [x] Classify concrete defaults and optional capabilities such as Cloudflare,
      local source/history/media, metadata, RSS, sitemap, PDF, citations, CTAs,
      embeds, share targets, importers, and advanced metadata profiles.
- [x] Verify catalog fixtures and docs explain ownership, disabled states, and
      upgrade paths.
      Added extension catalog entries/reference rows over the manifest
      resolver, lifecycle and trust-boundary classifications, safe-disable
      fields, generated-output/docs/diagnostic ownership fields, and
      fixture-backed coverage for bundled, optional official, site, third-party,
      disabled, incompatible, migration, installable, unavailable, removed, and
      deprecated states. Documented default/core boundaries and product-surface
      rules in `docs/EXTENSION_ARCHITECTURE.md`. Verified with focused
      extension/platform-boundary tests, `bun --silent run typecheck`,
      `bun --silent run platform:check`, `bun --silent run review:markdown`,
      and `git diff --check`.

### Milestone 407: IRK-119 Cloudflare Deployment Adapter

- [x] Re-read deployment, source/artifact, redirect, header/cache, release, and
      Cloudflare configuration docs before implementation.
- [x] Implement Cloudflare Workers Static Assets as the reference deployment
      adapter around redirects, headers, cache policy, static assets, generated
      outputs, preview/production metadata, and release reports.
- [x] Verify adapter tests preserve current TPM deployment behavior while
      keeping Cloudflare-specific logic out of generic platform code.
      Added provider-neutral deployment adapter contracts,
      `src/lib/deployment-adapters.ts`, and `src/platform/deployment.ts`.
      The Cloudflare Workers Static Assets adapter parses `wrangler.toml`,
      `_headers`, and generated `_redirects`; reports capabilities, provider
      facts, URLs, manual steps, and diagnostics; preserves dry-run behavior;
      and blocks execute deploys without credential references. Updated
      deployment and platform-module docs. Verified with focused deployment,
      platform-boundary, Wrangler, static-public-file, and redirect-generator
      tests, `bun --silent run typecheck`, `bun --silent run platform:check`,
      `bun --silent run review:markdown`, and `git diff --check`.

### Milestone 408: IRK-120 Second Deployment Adapter Fixture

- [x] Compare candidate non-Cloudflare adapter capabilities and choose the
      smallest fixture that proves portability.
- [x] Add a second adapter path or static-folder fixture with explicit
      diagnostics for unsupported or degraded capabilities.
- [x] Verify header, redirect, cache, canonical, and artifact expectations
      across at least two adapter outputs.
      Added the generic static-folder adapter as the provider-free portability
      fixture. It shares the deployment result contract with Cloudflare while
      reporting manual or unsupported capabilities for headers, redirects,
      immutable cache policy, production upload, custom domains, preview
      deploys, cache purge, and rollback. Added explicit diagnostics for
      manual publish steps, unsupported preview, degraded redirects, degraded
      headers, degraded cache policy, and manual rollback. Verified with
      focused deployment tests, `bun --silent run typecheck`,
      `bun --silent run platform:check`, `bun --silent run review:markdown`,
      and `git diff --check`.

### Milestone 409: IRK-121 Release Governance And Launch Reports

- [x] Define versioning, changelog, migration, deprecation, and compatibility
      policy for platform APIs, site config, frontmatter, output, routes, and
      adapters.
- [x] Generate or model release health sections for routes, redirects,
      metadata, payload, dependency/security, launch steps, deploy status,
      rollback, cache invalidation, and provider diagnostics.
- [x] Verify stable release report snapshots and breaking-change/migration
      fixtures.
      Added `src/lib/release-governance.ts`, `src/platform/release.ts`, and
      `docs/RELEASE_GOVERNANCE.md`. Release reports now model compatibility
      changes, breaking-change migration/compatibility/rollback requirements,
      deprecation notes, deployment adapter statuses, manual launch checklist
      items, generated-output summaries, and blocked deployment diagnostics.
      Verified with focused release-governance, deployment-adapter,
      platform-entrypoint, and platform-boundary tests,
      `bun --silent run typecheck`, `bun --silent run platform:check`,
      `bun --silent run review:markdown`, and `git diff --check`.

### Milestone 410: IRK-122 Static Output Trust Boundary Design

- [x] Inventory current headers, CSP posture, embeds, raw HTML,
      Markdown/MDX escape hatches, JSON-LD, citation URLs, external CTAs,
      share links, downloaded assets, analytics, and third-party scripts.
- [x] Define static-output trust boundaries, secure defaults, site-owner
      overrides, documented escape hatches, and verifier-facing policy states.
- [x] Verify policy fixtures cover accepted, warned, rejected, and intentionally
      relaxed states.
      Added static-output trust-boundary policy, global security headers,
      platform security entrypoint coverage, and
      `docs/STATIC_OUTPUT_SECURITY.md`. Verified with focused security and
      boundary tests, `bun --silent run typecheck`,
      `bun --silent run platform:check`, `bun --silent run review:markdown`,
      and `git diff --check`.

### Milestone 411: IRK-123 Third-Party Origin And Provenance Diagnostics

- [x] Add diagnostics for new third-party origins, remote embeds, raw HTML,
      external scripts, downloaded assets, citation URLs, analytics imports,
      and asset provenance.
- [x] Report whether each origin is required, optional, user-triggered,
      passive, blocked by CSP, or privacy-sensitive.
- [x] Verify source mappings, site-doctor output, and security verifier checks
      explain origin risks in author/site-owner language.
      Added `src/lib/third-party-origins.ts` and platform security exports for
      source-mapped third-party origin classification, CSP mismatch checks,
      privacy-sensitive passive-origin warnings, disallowed-origin errors,
      external-script errors, raw-HTML warnings, and downloaded-asset provenance
      warnings. Updated `docs/STATIC_OUTPUT_SECURITY.md`. Verified with focused
      origin/security/boundary tests, `bun --silent run typecheck`,
      `bun --silent run platform:check`, `bun --silent run review:markdown`,
      and `git diff --check`.

### Milestone 412: IRK-124 Dependency, Lockfile, Secret, And Supply-Chain Policy

- [x] Inventory dependency audit commands, lockfile behavior, ignored files,
      secret-scanning coverage, third-party script policy, asset provenance,
      and environment-variable use.
- [x] Document which checks belong in local, PR, release, and future package or
      starter-template workflows.
- [x] Verify release checks include the intended security posture without
      slowing normal local iteration unnecessarily.
      Added `src/lib/supply-chain-policy.ts` and platform security exports for
      dependency audit, lockfile, ignored secret env, `PUBLIC_*` secret-name,
      generated-output secret redaction, third-party script, and asset
      provenance policy. Added `docs/SUPPLY_CHAIN_AND_SECRET_POLICY.md` and
      linked it from `PACKAGE_SCRIPTS.md`. Verified with focused
      supply-chain/security/boundary tests, `bun --silent run typecheck`,
      `bun --silent run platform:check`, `bun --silent run review:markdown`,
      and `git diff --check`.

### Milestone 413: IRK-127 Migration Fixtures For Legacy And External Sources

- [x] Add fixture inputs for WordPress exports, old TPM permalinks/assets,
      Substack-like archives, plain Markdown folders, and static HTML archives.
- [x] Include redirects, historical metadata, remote assets, citation edge
      cases, embeds, taxonomy, authors, migrated frontmatter, and explicit
      human-review states.
- [x] Verify deterministic migration fixture outputs, source maps, public URL
      preservation, and review diagnostics.
      Added preservation-aware migration fixture contracts in
      `src/lib/migration-fixtures.ts`, exposed them through
      `src/platform/import-export.ts`, and added representative fixtures for
      WordPress, legacy TPM, Substack-like, Markdown-folder, and static HTML
      imports. Updated `docs/IMPORT_EXPORT_AND_PRESERVATION_POLICY.md`.
      Verified with focused migration fixture, platform entrypoint, and
      boundary tests, `bun --silent run typecheck`,
      `bun --silent run platform:check`, `bun --silent run review:markdown`,
      and `git diff --check`.

### Milestone 414: IRK-128 Round-Trip Migration Diagnostics And Docs

- [x] Add native round-trip tests for import/export where preservation is
      expected.
- [x] Add diagnostics for lossy conversions, inferred metadata, missing assets,
      weak citations, invalid redirects, unsupported embeds, and source-record
      mappings.
- [x] Document migration reports, human-review queues, supported sources, and
      limits without promising perfect conversion.
      Added migration review report generation, round-trip status modeling,
      stable Markdown report output, unsupported-case diagnostics for missing
      assets and invalid redirects, and platform entrypoint coverage. Updated
      `docs/IMPORT_EXPORT_AND_PRESERVATION_POLICY.md`. Verified with focused
      migration/report/platform tests, `bun --silent run typecheck`,
      `bun --silent run platform:check`, `bun --silent run review:markdown`,
      and `git diff --check`.

### Milestone 415: IRK-130 Locale, Long-String, And RTL Fixtures

- [x] Add English-only, non-English, multilingual, long-string, and RTL fixture
      coverage for route, metadata, feed, search, PDF, docs, and layout
      behavior where current contracts can support it.
- [x] Add formatting, label, and alternate-language snapshots where practical.
- [x] Verify high-risk component/layout behavior catches overflow, overlap,
      direction, and missing-label diagnostics.
      Added localization fixture contracts, representative fixtures, snapshots,
      missing-label/missing-translation/long-string/RTL/prefix diagnostics, and
      the platform localization entrypoint. Documented the fixture limits in
      `docs/LOCALIZATION_CONTRACTS.md` and `docs/PLATFORM_MODULES.md`.
      Verified with focused localization/platform/boundary tests,
      `bun --silent run typecheck`, `bun --silent run platform:check`,
      `bun --silent run review:markdown`, and `git diff --check`.

### Milestone 416: IRK-131 Inclusive Defaults Documentation And Hardening

- [x] Update author/developer docs and component/layout guidance for locale
      defaults, long strings, RTL, localized labels, language metadata, and
      no-overflow expectations.
- [x] Feed localization findings into generated references, site doctor, and
      component/catalog guidance where appropriate.
- [x] Verify docs examples build and match schema behavior.
      Added inclusive-default diagnostics for language/locale metadata and
      non-English sites using default English platform labels, exposed the
      helper through the localization platform seam, added catalog RTL and long
      translated label fixtures, hardened shared button wrapping, and updated
      author/component/localization docs. Verified with focused
      inclusive-default/site-doctor/platform/catalog/button tests,
      `bun --silent run typecheck`, `bun --silent run platform:check`,
      `bun --silent run review:markdown`, and `git diff --check`.

### Milestone 417: IRK-132 Starter Template Matrix

- [x] Define starter personas, acceptance criteria, and feature matrix for
      minimal blog, editorial magazine, scholarly publication, docs site, and
      kitchen-sink demo.
- [x] Specify expected content, config, theme, metadata, routes, media,
      citations, collections, feeds, PDFs, deployment settings, diagnostics,
      and intentionally absent capabilities per starter.
- [x] Verify starter scope avoids TPM branding/content leakage and gives
      implementation clear goals.
      Added the canonical starter matrix in `src/lib/starter-templates.ts`,
      exposed it through `src/platform/starters.ts`, and documented personas,
      capability levels, acceptance checks, and intentionally absent surfaces in
      `docs/STARTER_TEMPLATES.md`. Verified with starter matrix/platform tests
      and the starter source verifier.

### Milestone 418: IRK-133 Starter Template Implementation

- [x] Build starter site instances for minimal blog, editorial magazine,
      scholarly publication, docs site, and kitchen-sink demo.
- [x] Keep starters small but representative, using shared platform APIs
      instead of TPM shortcuts.
- [x] Verify every starter builds and passes its declared generated-output
      checks without TPM imports, copy, or branding.
      Added maintained starter site instances under `examples/starters/` and
      reused the existing docs-site starter. Verified source contracts with
      `bun --silent run starters:check`, focused tests, and serial `build:raw`
      smoke checks for minimal blog, editorial magazine, scholarly publication,
      and kitchen-sink starters.

### Milestone 419: IRK-134 Scaffold Workflow And Distribution Docs

- [x] Define scaffold or documented copy workflows for choosing, customizing,
      checking, and deploying a starter site instance.
- [x] Document template selection, config, authoring, deployment adapter
      choice, release checks, generated references, and migration/deprecation
      expectations.
- [x] Verify docs examples and starter structures remain in sync.
      Documented the supported copy-based scaffold workflow, future CLI/MCP/
      studio contract, starter update policy, and deprecation expectations in
      `docs/STARTER_TEMPLATES.md`; cross-linked the starter platform seam in
      platform/module and fixture strategy docs.

### Milestone 420: IRK-135 Starter Release Compatibility

- [x] Add starter builds to the appropriate release or fixture verification
      layer.
- [x] Verify starters against deployment adapters, security policy, metadata,
      feeds, generated docs, diagnostics, and compatibility matrix.
- [x] Verify release reports identify starter regressions clearly.
      Added `bun run starters:check`, wired it into `check:fast`, added focused
      verifier tests, and made raw builds clear Astro's content cache with
      `astro build --force` so multi-site starter smoke checks do not inherit
      stale content-store data.

### Milestone 421: Milestone 5 Release Verification And Linear Handoff

- [x] Run focused tests for every Milestone 5 domain and fix any failures.
- [x] Run `bun --silent run check:release` and fix any issues.
- [x] Attach relevant docs to Linear issues, add status comments where useful,
      and move completed Milestone 5 issues to `In Review`.
      Verified starter, localization, inclusive-default, platform-boundary,
      accountability, lint, catalog, and release behavior with focused tests,
      `bun --silent run check:fast`, `bun --silent run lint`,
      `bun --silent run deadcode`, `bun --silent run test:catalog`,
      `bun --silent run check:release`, and `git diff --check`. Fixed the
      catalog invariant selector so the ArticleList test targets the intended
      catalog example rather than the RTL companion example.
      Attached starter/distribution handoff docs and review comments to
      `IRK-33`, `IRK-132`, `IRK-133`, `IRK-134`, and `IRK-135`, then moved
      those issues to `In Review`.

## Active Milestone 4 Execution

### Milestone 300: Milestone 4 Refresh And Dependency Plan

- [x] Re-read the engineering philosophy, platform roadmap, documentation
      lifecycle, generated references, public docs, diagnostics, observability,
      and studio product docs.
- [x] Re-read the Milestone 4 Linear issues and confirm the dependency order
      for site doctor, documentation, observability, and studio-readiness work.
- [x] Break the remaining Milestone 4 issues into checklist milestones that can
      be implemented and verified one at a time.

### Milestone 301: IRK-98 Site Doctor Coverage Design

- [x] Inventory current `site:doctor`, author-diagnostic taxonomy, source
      artifacts, route registry, generated-output verifier, and site config
      schemas to identify checks that belong in the site doctor rather than the
      release verifier.
- [x] Update or add design documentation for site-doctor responsibilities,
      diagnostic ownership, JSON output expectations, fixture strategy, and
      author-facing remediation language.
- [x] Verify the design avoids duplicate release-verifier ownership and is
      implementation-ready before changing the checker.
      Verified with `bun --silent run review:markdown` and `git diff --check`;
      design added in `docs/SITE_DOCTOR.md`.

### Milestone 302: IRK-98 Site Doctor Coverage Implementation

- [x] Expand `site:doctor` checks across site config, content roots,
      authors/categories/collections, redirects, routes, assets/media policy,
      metadata, feeds/search, and generated-artifact expectations where those
      checks can be resolved from source contracts.
- [x] Emit stable shared author diagnostics for new checks while preserving the
      existing concise human output.
- [x] Add focused tests and mistake fixtures that prove clean sites are quiet
      and common author/site-owner mistakes are actionable.
      Added source-side checks for configured logo files, article/announcement
      author references, article category metadata, collection item references,
      homepage draft collections, redirect parsing, redirect chains, redirect
      conflicts, and Cloudflare redirect limits. Rendered output remains owned
      by generated-output verifier modules. Verified with focused
      site-doctor/author-diagnostics tests, `bun --silent run site:doctor`, and
      `bun --silent run typecheck`.

### Milestone 303: IRK-99 Author Command UX And JSON Reports

- [x] Add `site:doctor` command affordances for machine-readable JSON and
      author-friendly human output, including success/failure summary counts.
- [x] Document common diagnostic examples, repair owners, JSON output shape, and
      when authors should use `author:check` versus developer release checks.
- [x] Verify CLI output, quiet mode, JSON output, and documentation examples
      with focused tests.
      Added `site:doctor --json`, kept default human output stable, documented
      author command usage, and verified with focused site-doctor tests,
      `bun --silent run site:doctor -- --json`,
      `bun --silent run review:markdown`, and `bun --silent run typecheck`.

### Milestone 304: IRK-100 Diagnostic Fixtures And Release Integration

- [x] Add fixture-driven diagnostic tests for representative broken source
      inputs, generated-output mappings, and author-visible remediation.
- [x] Integrate site-doctor diagnostics into release/report surfaces only where
      they add source-side value without duplicating verifier failures.
- [x] Run focused diagnostic, docs, and release checks before closing the
      site-doctor chain.
      Site doctor remains in `author:check`, `check:fast`, and the
      `check:release` path through `check`; package-script coverage now locks
      that integration. Verified with focused package/QA/site-doctor tests and
      `bun --silent run check:fast`.

### Milestone 305: IRK-105 Observability Import Schema Design

- [x] Design privacy-conscious import schemas for Lighthouse/Unlighthouse,
      Cloudflare analytics, Search Console, Bing, link scanners, accessibility
      scans, uptime checks, crawler errors, dependency/security reports, and
      generic manual findings.
- [x] Define normalized fields for route/source/artifact mapping, severity,
      trend, confidence, owner domain, likely root cause, remediation, and noise
      classification.
- [x] Verify the design is provider-neutral and suitable for future static
      reports, diagnostics, CLI, MCP, and studio consumers.
      Added `docs/OBSERVABILITY_AND_WEBMASTER_REPORTS.md`; verified with
      `bun --silent run review:markdown`.

### Milestone 306: IRK-105 Observability Import Implementation

- [x] Implement typed observability import models, parsers, normalization
      helpers, redaction rules, and fixture tests for supported import shapes.
- [x] Keep provider-specific parsing thin around a normalized observability
      finding model.
- [x] Verify parser fixtures, redaction behavior, and invalid input handling.
      Added `src/lib/observability.ts` with provider-neutral finding/report
      models, Lighthouse/status/webmaster/link-scanner parsers, URL redaction,
      route normalization, summary aggregation, and focused fixture tests.
      Verified with `bun --silent test tests/src/lib/observability.test.ts`
      and `bun --silent run typecheck`.

### Milestone 307: IRK-106 Route-Linked Webmaster Reports

- [x] Design static webmaster reports for 404 trends, redirect gaps,
      crawlability, Core Web Vitals, metadata quality, social previews, cache,
      payload, and accessibility findings.
- [x] Implement route-linked report generation that connects observability
      findings to route registry entries, source artifacts, output artifacts,
      diagnostics, noise classifications, and remediation docs.
- [x] Add golden report tests and verify report output is deterministic and
      author/site-owner readable.
      Added route-linked observability report contracts, route/source matching,
      deterministic Markdown report formatting, and exact report fixture tests.
      Verified with focused observability report tests,
      `bun --silent run review:markdown`, and `bun --silent run typecheck`.

### Milestone 308: IRK-103 Public Docs IA And Author Paths

- [x] Update the public documentation IA around author, site owner, deploy
      operator, developer, extension author, and future studio-user journeys.
- [x] Write or update author paths for articles, announcements, pages,
      collections, authors, images, citations, redirects, metadata, PDFs,
      social/support links, and deploy changes.
- [x] Verify docs keep beginner paths simple while routing advanced work to
      appropriate platform references.
      Expanded `docs/PUBLIC_DOCUMENTATION_SITE.md` with audience definitions,
      first-success journey, target public docs page map, and common author,
      announcement, collection, image, redirect, and site-setting paths.
      Verified with `bun --silent run review:markdown`.

### Milestone 309: IRK-104 Docs Drift, Link, And Build Verification

- [x] Add or extend docs drift checks, generated-reference checks, docs links,
      and docs-site build verification so public docs fail clearly when stale.
- [x] Preserve root README as developer-focused and `site/README.md` as
      author/site-owner-focused.
- [x] Verify docs checks with focused tests and existing docs build scripts.
      Added `docs:check`, promoted documentation-site verification into
      release and CI contracts, updated QA registry and package-script docs,
      regenerated generated platform references, refreshed the docs-site schema,
      and added docs-site public static compatibility files. Verified with
      `bun --silent run docs:check`, focused package/QA/generated-reference
      tests, `bun --silent run review:markdown`, and
      `bun --silent run check:fast`.

### Milestone 310: IRK-107 Observability Diagnostics And Release Health

- [x] Connect observability reports to author diagnostics where a source-side
      fix exists, preserving separate classifications for crawler noise,
      external issues, and unclear findings.
- [x] Add release-health report sections for before/after scanner comparisons
      and changed route classes where useful.
- [x] Document incident/noise triage and verify golden incident reports.
      Added `src/lib/observability-diagnostics.ts` with a narrow
      source-repairable diagnostic bridge, release-health diff model, route
      class summaries, and deterministic Markdown report formatting. Updated
      observability docs with bridge criteria and incident/noise triage.
      Verified with focused observability diagnostics/report tests,
      `bun --silent run typecheck`, and `bun --silent run review:markdown`.

### Milestone 311: IRK-108 Studio Editor Models And State Workflows

- [x] Design studio-facing models for articles, announcements, pages,
      collections, authors, categories, redirects, support/social links, feature
      flags, theme tokens, and asset metadata without creating a parallel CMS
      source model.
- [x] Model draft, review, publish, unpublish, scheduled, rollback, and preview
      states as explicit discriminated workflows over platform source
      contracts.
- [x] Verify every editable field maps to source/config/schema/diagnostic and
      generated-artifact ownership.
      Added `docs/STUDIO_READINESS_CONTRACTS.md` with editable domains, field
      ownership, editor model layers, discriminated workflow states,
      schema-to-form, preview, provider-neutral workflow, MDX fallback, and
      round-trip parity contracts. Verified with
      `bun --silent run review:markdown`.

### Milestone 312: IRK-108 Studio Model Implementation

- [x] Implement typed studio editor models, state transitions, source mappings,
      and repairable diagnostic hooks over existing platform contracts.
- [x] Add state-machine and model normalization tests for representative
      content, config, redirect, media, and homepage edits.
- [x] Verify no runtime GUI implementation or provider-specific workflow is
      introduced in this milestone.
      Added `src/lib/studio-models.ts` with editable-domain source references,
      JSON-ready editor documents, field descriptors, diagnostic-to-field
      lookup, and pure workflow transition validation. Added focused
      `tests/src/lib/studio-models.test.ts` coverage for source mappings,
      representative field families, diagnostics, and valid/invalid state
      transitions. Updated platform boundaries and module docs. Verified with
      focused studio model tests, `bun --silent run typecheck`,
      `bun --silent run review:markdown`, and `bun --silent run check:fast`.

### Milestone 313: IRK-109 Schema-To-Form And Preview Contracts

- [x] Design form contracts for frontmatter, site config, redirects,
      navigation, homepage, collections, metadata, media, and deployment.
- [x] Design preview contracts that map dirty editor state to route previews,
      compiler artifacts, diagnostics, metadata output, media fallbacks, and PDF
      eligibility.
- [x] Verify MDX fallback rules and unsupported component behavior are explicit.
      Tightened `docs/STUDIO_READINESS_CONTRACTS.md` with deterministic form
      descriptor rules, extension/provider-owned deployment settings, dirty
      state patches, preview statuses, and MDX editability classes. Verified
      with `bun --silent run review:markdown`.

### Milestone 314: IRK-109 Contract Implementation And Tests

- [x] Implement schema-to-form descriptors, preview request/response contracts,
      dirty-state normalization, and diagnostics for unsupported preview states.
- [x] Add round-trip tests proving form descriptors and preview contracts remain
      stable for current source schemas.
- [x] Verify contracts are serializable for future GUI, CLI, and MCP consumers.
      Added `src/lib/studio-forms.ts` with form descriptor grouping,
      JSON-compatible dirty patches, preview request/response shells,
      unsupported/unknown-field diagnostics, and provider-capability preview
      statuses. Added focused tests for descriptor serialization, patch
      normalization, preview responses, unavailable capabilities, and
      unsupported source states. Updated platform boundary docs and checks.
      Verified with focused studio tests, `bun --silent run typecheck`,
      `bun --silent run review:markdown`, and `bun --silent run check:fast`.

### Milestone 315: IRK-110 Provider-Agnostic Workflow Adapters

- [x] Design provider-neutral actions for save draft, preview, submit, review,
      publish, unpublish, schedule, rollback, deploy status, cache, release, and
      audit events.
- [x] Implement capability descriptors and mocked adapters for local direct
      publish, optional review workflows, and provider-specific mechanics
      without making GitHub or pull requests the product model.
- [x] Add mocked-provider state-machine tests and golden source-diff fixtures.
      Added `src/lib/studio-workflows.ts` with provider family/capability
      descriptors, bundled direct/review/provider-backed workflow profiles,
      operation capability checks, deterministic mocked workflow execution,
      provider-neutral events, and source/release diff summaries. Added tests
      covering capability checks, direct publish, optional review, unsupported
      actions, invalid transitions, and source-diff fixtures. Verified with
      focused studio tests, `bun --silent run typecheck`,
      `bun --silent run review:markdown`, and `bun --silent run check:fast`.

### Milestone 316: IRK-111 Studio Round-Trip And Parity Fixtures

- [x] Add round-trip fixtures for Markdown, MDX, frontmatter, collections,
      redirects, media metadata, site config, and workflow state.
- [x] Prove studio-shaped edits compile to the same outputs as CLI/source edits
      under mocked providers and without network access.
- [x] Run release checks and update Milestone 4 Linear issue statuses after
      local verification passes.
  - Completed: Added `tests/src/lib/studio-roundtrip.test.ts` covering
    Markdown article frontmatter, MDX body patch intent, collection ordering,
    site config patches, redirects, media metadata, and mocked provider
    workflows. Verified Milestone 4 with focused studio/observability tests
    and the full `bun --silent run check:release` gate.

### Milestone 317: Comprehensive Coverage Baseline And Exception Audit

- [x] Run the repository coverage and accountability gates to establish the
      current missing-coverage baseline.
- [x] Inspect approved coverage/accountability exceptions and identify any that
      have become stale after the Milestone 4 refactor.
- [x] Rank low-coverage files by genuine testable behavior rather than raw
      percentages alone.
  - Completed: `bun --silent run coverage` passes at 842 tests. The approved
    CSS coverage exception remains valid because style behavior is enforced by
    browser, accessibility, responsive, style-contract, and release checks.
    Remaining low-coverage files are concentrated in process, browser, build,
    and experimental-tooling seams.

### Milestone 318: Coverage Improvements For Testable Seams

- [x] Add or strengthen tests for genuine behavior gaps at public seams, with
      no test-only exports or brittle import-only tests.
- [x] Refactor only where coverage reveals a poor seam between pure logic and
      browser/process/file-system edges.
- [x] Keep process/browser/generated-output gaps documented only when they are
      not worth modeling with unit fixtures.
  - Completed: Expanded behavior coverage for anchored disclosures, studio
    workflows, observability diagnostics, author diagnostics, tag
    normalization, article reference previews, site config schema generation,
    content route view models, route helpers, bibliography aggregation, article
    citation formatting, article image frontmatter parsing, and article
    reference display-label parsing. Narrowed observability diagnostics types
    so author-repairable findings cannot carry unreachable owners.

### Milestone 319: Coverage Verification And Handoff

- [x] Re-run focused tests, coverage verification, accountability checks, and
      release checks after coverage improvements.
- [x] Report any remaining missing or low coverage with concrete
      justifications so it can be inspected manually.
  - Completed: Focused tests, `bun --silent run coverage`,
    `bun --silent run typecheck`, and `bun --silent run check:release` pass
    after coverage improvements.

### Milestone 320: Remaining Coverage Gap Design Pass

- [x] Re-examine remaining coverage gaps as possible design feedback, not just
      percentage misses.
- [x] Add focused tests for genuine behavior gaps at stable public seams.
- [x] Refactor or simplify any uncovered branch that indicates dead code,
      impossible state, or poor separation of concerns.
- [x] Re-run coverage and quality checks, then document justified residual
      gaps.
      Completed: Removed the obsolete proof-only article-reference plugin,
      narrowed anchored positioning to supported top/bottom placements,
      preserved unknown block `value` text in article-reference serialization,
      and added public-seam tests for disclosure fallback behavior, anchored
      positioning lazy-loader scheduling, article image edge cases, reference
      serialization, and reference preview fallback/close behavior. Remaining
      low-coverage files are primarily process/browser orchestration scripts,
      generated-output verifiers, payload experiments, and defensive no-op
      branches where unit tests would be brittle or duplicate existing release
      checks.

### Milestone 226: IRK-101 Documentation Lifecycle Design

- [x] Re-read the Milestone 4 documentation roadmap, source-contract docs, docs
      site notes, and current author/developer docs to ground the lifecycle
      design in existing repo contracts.
- [x] Define the documentation audience model, document kinds, ownership rules,
      update triggers, and generated-reference lifecycle for the platform.
- [x] Verify the design does not overreach into downstream generated-reference,
      docs-site IA, or drift-checker implementation issues.
      Documented in `docs/DOCUMENTATION_LIFECYCLE.md`; the downstream boundary
      section keeps `IRK-102`, `IRK-103`, and `IRK-104` out of this design.

### Milestone 227: IRK-101 Documentation Inventory And Ownership Map

- [x] Inventory the current documentation surfaces and classify them by
      audience, document kind, source of truth, update trigger, and verification
      owner.
- [x] Identify planned generated references and record the schema, registry, or
      manifest that must own each generated reference.
- [x] Verify every existing and planned documentation family has a clear
      ownership path without creating stale parallel truth.
      `docs/DOCUMENTATION_LIFECYCLE.md` now records placement rules, the
      current documentation map, a documentation ownership matrix, generated
      reference owners, update triggers, and verification owners.

### Milestone 228: IRK-101 Verification And Handoff

- [x] Run focused documentation checks for the new lifecycle documentation.
      Verified with `bun --silent run review:markdown` and `git diff --check`.
- [x] Update this checklist with verified completion notes and record any
      downstream implementation boundaries for `IRK-102`, `IRK-103`, and
      `IRK-104`.
      Downstream generated references, docs-site diagnostic links, and
      documentation drift/link tooling remain intentionally scoped to those
      later issues.

### Milestone 220: IRK-9-IRK-12 Source Contracts Closeout Design

- [x] Re-read the current source-contract implementation against the Milestone
      1 Linear goals for source/artifact ownership, platform context, route
      registry, and article compiler artifacts.
- [x] Update `docs/SOURCE_CONTRACTS.md` so it describes the implemented
      closeout contracts, invariants, diagnostics, tests, and remaining
      boundaries without relying on earlier "first implementation target"
      language.
- [x] Verify the design is implementation-ready: no public URL churn, no
      reader-facing layout changes, explicit compatibility shims for current
      pages/scripts, and clear test ownership for every contract.

### Milestone 221: IRK-9 Source And Artifact Lifecycle Closeout

- [x] Expand the source/artifact manifest so source roots, generated outputs,
      ownership, required/optional placement, and verifier-facing artifact
      roles share one typed vocabulary.
- [x] Use the manifest in site/admin diagnostics or release-facing code where
      ownership rules were still duplicated.
- [x] Add focused coverage for default, fixture, and generated-output artifact
      contracts before marking this milestone complete.

### Milestone 222: IRK-10 Platform Context Closeout

- [x] Add narrow platform-context slices for source artifacts, route registry,
      and article compiler consumers while preserving singleton compatibility.
- [x] Normalize explicit context creation so fixture and future multi-site tools
      can compose config, paths, source artifacts, and routes without implicit
      filesystem/process reads.
- [x] Add focused coverage for default and injected contexts.

### Milestone 223: IRK-11 Route, Feature, And Entity Registry Closeout

- [x] Promote route/entity/feature/output metadata into the registry, including
      generated-output roles, route patterns, discovery surfaces, and disabled
      feature diagnostics.
- [x] Migrate route-output path helpers and optional-feature consumers away
      from duplicated route-shape logic where practical.
- [x] Add focused coverage for configured routes, disabled features, route
      ownership, generated output paths, and verifier/site-doctor integration.

### Milestone 224: IRK-12 Article Compiler Artifact Closeout

- [x] Expand the article compiler artifact to include source facts, canonical
      route facts, generated output facts, discovery/surface eligibility, PDF
      eligibility, references, and table-of-contents facts.
- [x] Move downstream article view, Scholar/PDF, and page view model consumers
      onto the artifact for those facts without changing reader-facing output.
- [x] Add focused coverage for content defaults, frontmatter overrides,
      references, table of contents, output paths, and surface eligibility.

### Milestone 225: Milestone 1 Verification And Linear Handoff

- [x] Run focused tests for source artifacts, platform context, route registry,
      article compiler, site doctor, and build verifier.
- [x] Run release checks and fix any regressions.
- [x] Update all completed Milestone 1 Linear issues to `In Review` after local
      verification passes.

### Milestone 226: Milestone 2 Execution Plan And Shared Contract Review

- [x] Translate Linear Milestone 2 into checklist milestones for publishable
      entries, route view models, generated-output verifiers, metadata,
      citations, media/PDF policy, and release verification.
- [x] Re-read the Milestone 2 source docs and current implementations for
      shared vocabulary, cross-domain dependencies, and blocker risks.
- [x] Verify the checklist sequence is dependency-safe before implementation
      begins.

### Milestone 227: IRK-57 Publishable Entry Model Design

- [x] Define the layered publishable-entry contract across source facts, route
      facts, display facts, discovery/visibility surfaces, taxonomy, media,
      ordering, metadata, and diagnostics.
- [x] Confirm the design covers articles and announcements now while leaving
      clean extension points for pages, reviews, events, books, media, datasets,
      and future platform users.
- [x] Verify the design is implementation-ready and does not duplicate route,
      metadata, media, or verifier ownership.

### Milestone 228: IRK-57 Publishable Entry Model Implementation

- [x] Expand `src/lib/publishable.ts` and direct consumers around the layered
      publishable-entry contract without changing public reader-facing output.
- [x] Add or update focused unit tests for publishable conversion, indexing,
      display list items, source facts, route facts, taxonomy facts, and media
      facts.
- [x] Update publishable-entry docs before marking the milestone complete.

### Milestone 229: IRK-58 Publishable Visibility Matrix

- [x] Implement explicit visibility surfaces and defaults for homepage,
      directory, collections, feeds, search, sitemap, related content, PDFs, and
      future external/API manifests where applicable.
- [x] Add schema and diagnostic coverage for invalid or unsupported visibility
      states while preserving permissive defaults.
- [x] Verify all publishable filtering uses the shared visibility matrix.

### Milestone 230: IRK-59 Publishable Consumer Migration

- [x] Migrate lists, feeds, search, homepage discovery, collections, related
      content, and archive-style surfaces to consume normalized publishable view
      models where practical.
- [x] Remove duplicated article/announcement shaping logic that now belongs in
      publishable helpers.
- [x] Verify behavior with focused publishable, feed, search, collection, home,
      archive, and route tests.

### Milestone 231: IRK-60 Publishable Fixtures And Documentation

- [x] Add representative publishable fixtures for articles, announcements,
      hidden entries, collection-only entries, image fallbacks, and future-kind
      extension expectations where useful.
- [x] Document author-facing visibility defaults and developer-facing
      publishable ownership boundaries.
- [x] Run focused publishable checks and mark the publishable model complete.

### Milestone 232: IRK-61 Route View-Model Contract Design

- [x] Inventory current routes and classify their source inputs, route params,
      sorting/filtering, metadata inputs, empty states, navigation, and component
      prop responsibilities.
- [x] Define the route view-model contract so route files orchestrate and typed
      helpers prepare display-ready data.
- [x] Verify the design composes with publishable entries, route registry,
      article compiler artifacts, metadata, and verifier diagnostics.

### Milestone 233: IRK-62 Core Listing And Taxonomy View Models

- [x] Implement typed view models for listing, archive, categories, tags,
      authors, collections, announcements, search, and related taxonomy-style
      routes where applicable.
- [x] Move route-level shaping out of pages and into pure helpers without
      changing visible layout or URL behavior.
- [x] Add focused view-model and page tests for sorting, filtering, empty
      states, feature flags, metadata inputs, and component props.

### Milestone 234: IRK-63 Article, Page, Bibliography, And Homepage View Models

- [x] Bring article, Markdown page, bibliography, and homepage route composition
      into the shared route view-model pattern.
- [x] Ensure complex routes consume compiler artifacts, publishable models,
      metadata helpers, media facts, and support/navigation config through clear
      seams.
- [x] Verify route output and component props with focused tests.

### Milestone 235: IRK-64 Route Snapshot And Consumer Coverage

- [x] Add route view-model fixtures or snapshots that lock public route behavior
      without making tests brittle.
- [x] Add component-consumer tests proving route view models pass stable,
      explicit props into blocks/layouts.
- [x] Update route view-model docs and verify the route-model migration is
      complete.

### Milestone 236: IRK-66 Route-Family Verifier Modules

- [x] Design the route-family verifier split around focused modules,
      diagnostic ownership, and legacy report compatibility.
- [x] Split route, link, redirect, feed, and sitemap checks into focused
      verifier modules using the shared output diagnostic API.
- [x] Preserve existing release-check behavior and human/JSON output while
      moving logic out of the monolithic verifier.
- [x] Add golden diagnostics for missing routes, broken links, redirect fallback
      errors, feed errors, sitemap policy mistakes, and canonical route
      mistakes.
- [x] Verify focused verifier tests and the build verifier gate.

### Milestone 237: IRK-67 Public-Output Verifier Modules

- [x] Design the public-output split around common HTML inspection helpers,
      focused diagnostic modules, and legacy report compatibility.
- [x] Split HTML, metadata/social/JSON-LD, PDF, asset/client-script, and
      content-leak checks into focused verifier modules using shared
      diagnostics.
- [x] Identify existing cache, search, and security coverage; add focused
      modules only where the current release gate has real checks to preserve.
- [x] Reuse route registry, artifact manifest, article compiler artifacts,
      metadata facts, and media facts instead of duplicating source rules.
- [x] Add focused diagnostics for existing semantic HTML,
      metadata/social/JSON-LD, PDF, asset, search-output leak, and catalog
      checks; keep cache/security categories documented until concrete
      generated-output contracts land.
- [x] Verify focused public-output tests and the build verifier gate.

### Milestone 238: IRK-68 Verifier Compatibility And Release Fixtures

- [x] Add golden diagnostic fixtures and compatibility wrappers that prove the
      modular verifier is equivalent to or stronger than the previous release
      gate.
- [x] Update generated-output verifier docs with module ownership and extension
      guidance.
- [x] Run focused verifier checks and relevant release checks before closing the
      verifier split.

### Milestone 239: IRK-69 Metadata Graph And Semantic Profile Design

- [x] Define metadata graph nodes for site, organization, pages, articles,
      announcements, authors, categories, tags, collections, bibliography
      entries, media, citations, and generated artifacts.
- [x] Define semantic profile contracts for article, scholarly, review, book,
      media, event, dataset, software, FAQ, organization/site, breadcrumb,
      list/search/archive, and future extension profiles.
- [x] Verify the design separates automatic defaults from optional author/site
      metadata and avoids untruthful or over-specific structured data.

### Milestone 240: IRK-70 Metadata Graph Generation

- [x] Generate head tags, canonical URLs, robots policy, OG/Twitter data,
      JSON-LD, Scholar metadata, feed/search metadata, and route metadata from
      the normalized metadata graph.
- [x] Preserve current public metadata output unless an improvement is explicit
      and covered by tests.
- [x] Add focused metadata snapshot and pure helper tests.

### Milestone 241: IRK-71 Advanced Semantic Profile Config

- [x] Add safe frontmatter and site-config support for advanced semantic
      profiles such as reviews, books, media, events, datasets, software, and
      FAQ-like content.
- [x] Validate advanced fields at schema boundaries and keep author-facing
      defaults simple.
- [x] Document the author and developer interface for semantic profiles.

### Milestone 242: IRK-72 Metadata Verification And Machine-Readability Checks

- [x] Add generated-output checks for route metadata completeness, JSON-LD
      validity, stable entity IDs, robots/discovery alignment, social previews,
      Scholar tags, feeds, and search records.
- [x] Add fixtures covering normal, hidden, semantic-profile, and feature-flagged
      metadata cases.
- [x] Verify metadata remains static-first and does not add runtime JavaScript.

### Milestone 243: IRK-73 Citation Source Model Design

- [x] Define a normalized citation source model covering BibTeX/RIS/CSL-like
      data, web/video/book/article fields, identifiers, locators, access dates,
      archive URLs, notes, backlinks, and duplicate identity.
- [x] Define citation diagnostics for malformed syntax, missing fields,
      unsupported types, ambiguous author intent, duplicate sources, and broken
      URLs.
- [x] Verify the design aligns with article-reference authoring docs,
      bibliography output, PDFs, metadata, and hover previews.

### Milestone 244: IRK-74 Citation Export And Duplicate Detection

- [x] Improve BibTeX, RIS, and CSL-style export around the normalized citation
      source model.
- [x] Improve sitewide bibliography duplicate detection without merging
      ambiguous sources silently.
- [x] Add focused tests for export formatting, identifiers, duplicate clusters,
      and legacy transitional fields.
      Implemented `src/lib/article-references/source.ts` as the normalized
      source/export layer and updated bibliography grouping to use explicit
      exact/strong/weak identity confidence. Verified with
      `bun test tests/src/lib/article-references/source.test.ts tests/src/lib/bibliography.test.ts`,
      `bun --silent run platform:check`, `bun --silent run typecheck`,
      `bun --silent run lint -- --quiet src/lib/article-references/source.ts src/lib/bibliography.ts tests/src/lib/article-references/source.test.ts tests/src/lib/bibliography.test.ts scripts/quality/verify-platform-boundaries.ts`,
      `bunx prettier --check src/lib/article-references/source.ts src/lib/bibliography.ts tests/src/lib/article-references/source.test.ts tests/src/lib/bibliography.test.ts docs/CITATION_SOURCE_MODEL.md docs/PLATFORM_MODULES.md CHECKLIST.md scripts/quality/verify-platform-boundaries.ts --log-level warn`,
      and
      `bunx markdownlint-cli2 docs/CITATION_SOURCE_MODEL.md docs/PLATFORM_MODULES.md CHECKLIST.md`.

### Milestone 245: IRK-75 Citation Diagnostics And Audit Fixtures

- [x] Add malformed-input fixtures for broken BibTeX, missing contributor/date,
      unsupported source types, duplicate keys, ambiguous locators, and legacy
      migration uncertainty.
- [x] Surface citation diagnostics through the shared verifier or content-audit
      path as appropriate.
- [x] Verify diagnostics are actionable without forcing false certainty.
      Added structured citation audit diagnostics to
      `scripts/content/audit-bibtex-citations.ts`, including blocking parser,
      missing-entry, and duplicate-key diagnostics plus review-only flags for
      transitional and uncertain source data. Regenerated
      `docs/CITATION_BIBTEX_AUDIT.md`. Verified with
      `bun test tests/scripts/content/audit-bibtex-citations.test.ts`,
      `bun --silent run lint -- --quiet scripts/content/audit-bibtex-citations.ts tests/scripts/content/audit-bibtex-citations.test.ts`,
      `bun --silent run typecheck`,
      `bunx prettier --check scripts/content/audit-bibtex-citations.ts tests/scripts/content/audit-bibtex-citations.test.ts docs/CITATION_BIBTEX_AUDIT.md CHECKLIST.md --log-level warn`,
      `bunx markdownlint-cli2 docs/CITATION_BIBTEX_AUDIT.md CHECKLIST.md`,
      and `bun run references:bibtex:audit -- --write --quiet`.

### Milestone 246: IRK-76 Citation Cross-Output Verification

- [x] Verify bibliography, article references, citation/footnote previews,
      backlinks, PDFs, metadata, and export surfaces all consume the normalized
      citation model.
- [x] Add cross-output tests for citation-heavy pages and pages without
      citations.
- [x] Update citation docs and run focused reference checks.
      Updated `docs/CITATION_SOURCE_MODEL.md` with current normalized-source
      consumer ownership, moved bibliography and Scholar/PDF citation reference
      rendering onto normalized source fields, and added cross-output coverage.
      Verified with
      `bun test tests/src/lib/citation-cross-output.test.ts tests/src/lib/bibliography.test.ts tests/src/lib/article-pdf.test.ts`,
      `bun --silent run test:astro -- 'tests/src/pages/articles/[...slug].vitest.ts'`,
      `bun --silent run typecheck`,
      `bun --silent run lint -- --quiet src/lib/bibliography.ts src/lib/article-pdf.ts tests/src/lib/citation-cross-output.test.ts 'tests/src/pages/articles/[...slug].vitest.ts'`,
      `bunx prettier --check docs/CITATION_SOURCE_MODEL.md CHECKLIST.md src/lib/bibliography.ts src/lib/article-pdf.ts tests/src/lib/citation-cross-output.test.ts 'tests/src/pages/articles/[...slug].vitest.ts' --log-level warn`,
      and `bunx markdownlint-cli2 docs/CITATION_SOURCE_MODEL.md CHECKLIST.md`.

### Milestone 247: IRK-77 Media Policy And Provider Adapter Design

- [x] Define media policy records for article images, inline images, hover
      images, list thumbnails, social images, PDF images, embeds, fallbacks,
      downloads, and generated artifacts.
- [x] Define provider adapter shapes for YouTube, SoundCloud, hover images, PDF
      fallbacks, no-JS fallbacks, search/feed fallbacks, and future providers.
- [x] Verify media policy ownership is compatible with metadata, PDFs, image
      optimization, generated-output verifiers, and author-facing docs.
      Added `docs/MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md` and linked it from
      `docs/PLATFORM_MODULES.md`. The design defines media roles, surfaces,
      source records, policy records, provider adapter shape, initial adapters,
      diagnostics, ownership boundaries, implementation sequence, and
      verification requirements. Verified with
      `bunx prettier --check docs/MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md docs/PLATFORM_MODULES.md CHECKLIST.md --log-level warn`
      and
      `bunx markdownlint-cli2 docs/MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md docs/PLATFORM_MODULES.md CHECKLIST.md`.

### Milestone 248: IRK-78 Media Policy Implementation

- [x] Implement image, social-preview, PDF, embed, search, feed, and fallback
      policy selection through shared media policy helpers.
- [x] Migrate existing media/embed components and generated outputs to consume
      policy results where practical.
- [x] Add focused media policy tests for alt/caption, dimensions, formats,
      optimization path, provider fallbacks, no-JS fallback, and PDF eligibility.
      Added `src/lib/media-policy.ts` as the shared media policy vocabulary and
      migrated article image policy, social preview transforms, embed
      classification/layout, publishable media fallbacks, and MDX PDF fallback
      compatibility through it. Updated platform module ownership and media
      policy docs. Verified with
      `bun test tests/scripts/quality/verify-platform-boundaries.test.ts tests/src/lib/media-policy.test.ts tests/src/lib/article-image-policy.test.ts tests/src/lib/embed-media.test.ts tests/src/lib/social-images.test.ts tests/src/lib/article-pdf-compatibility.test.ts`,
      `bun --silent run test:astro -- tests/src/components/articles/PublishableMediaFrame.vitest.ts tests/src/components/media/EmbedFrame.vitest.ts tests/src/components/media/ResponsiveIframe.vitest.ts tests/src/components/media/SoundCloudEmbed.vitest.ts tests/src/components/media/YouTubeEmbed.vitest.ts`,
      `bun --silent run platform:check`, `bun --silent run typecheck`,
      `bun --silent run lint -- --quiet src/lib/media-policy.ts src/lib/article-image-policy.ts src/lib/embed-media.ts src/lib/social-images.ts src/lib/article-pdf-compatibility.ts src/components/articles/PublishableMediaFrame.astro tests/src/lib/media-policy.test.ts tests/src/lib/article-image-policy.test.ts tests/src/lib/embed-media.test.ts tests/src/lib/social-images.test.ts tests/src/lib/article-pdf-compatibility.test.ts scripts/quality/verify-platform-boundaries.ts`,
      `bunx prettier --check src/lib/media-policy.ts src/lib/article-image-policy.ts src/lib/embed-media.ts src/lib/social-images.ts src/lib/article-pdf-compatibility.ts src/components/articles/PublishableMediaFrame.astro tests/src/lib/media-policy.test.ts tests/src/lib/article-image-policy.test.ts tests/src/lib/embed-media.test.ts tests/src/lib/social-images.test.ts tests/src/lib/article-pdf-compatibility.test.ts docs/MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md docs/PLATFORM_MODULES.md CHECKLIST.md scripts/quality/verify-platform-boundaries.ts --log-level warn`,
      and
      `bunx markdownlint-cli2 docs/MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md docs/PLATFORM_MODULES.md CHECKLIST.md`.

### Milestone 249: IRK-79 PDF Eligibility And Media Diagnostics

- [x] Add explicit PDF eligibility and image-size diagnostics from media policy
      records and generated artifacts.
- [x] Enforce or report sensible PDF/media budgets without degrading article
      output or forcing authors into technical decisions.
- [x] Verify diagnostics cover missing images, oversized outputs, unsupported
      embeds, missing fallbacks, and social/PDF media mismatches.
      Added media-policy PDF diagnostics for unloaded printable images,
      unoptimized printable image sources, unsupported MDX component PDF
      fallbacks, missing embed fallbacks, and oversized generated PDF artifacts.
      PDF generation and generated-output verification now consume those
      diagnostics while preserving existing human-readable issue text. Updated
      media and verifier docs. Verified with
      `bun test tests/src/lib/media-policy.test.ts tests/scripts/build/generate-article-pdfs.test.ts tests/scripts/build/public-output-verifiers.test.ts tests/scripts/build/build-verifier.test.ts`,
      `bun --silent run typecheck`,
      `bun --silent run lint -- --quiet src/lib/media-policy.ts scripts/build/generate-article-pdfs.ts scripts/build/verify-build.ts scripts/build/verify-build/pdf-verifier.ts tests/src/lib/media-policy.test.ts tests/scripts/build/generate-article-pdfs.test.ts tests/scripts/build/public-output-verifiers.test.ts tests/scripts/build/build-verifier.test.ts`,
      `bunx prettier --check src/lib/media-policy.ts scripts/build/generate-article-pdfs.ts scripts/build/verify-build.ts scripts/build/verify-build/pdf-verifier.ts tests/src/lib/media-policy.test.ts tests/scripts/build/generate-article-pdfs.test.ts tests/scripts/build/public-output-verifiers.test.ts tests/scripts/build/build-verifier.test.ts docs/MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md docs/GENERATED_OUTPUT_VERIFIER_CONTRACT.md CHECKLIST.md --log-level warn`,
      and
      `bunx markdownlint-cli2 docs/MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md docs/GENERATED_OUTPUT_VERIFIER_CONTRACT.md CHECKLIST.md`.

### Milestone 250: IRK-80 Media Output Verification

- [x] Verify article images, hover images, embeds, social images, PDFs, search,
      feeds, and asset outputs across representative routes.
- [x] Add browser, PDF, asset-audit, and generated-output checks that protect
      accessible optimized media output.
- [x] Update media/PDF docs and run focused media checks.
      Added scoped generated-output checks for article, hover, and publishable
      media images, embed fallback output, and immutable generated-asset cache
      headers. Updated the media policy and generated-output verifier docs,
      explicit media data contracts, verifier tests, and golden diagnostics.
      Verified with
      `bun test tests/scripts/build/build-verifier.test.ts tests/scripts/build/public-output-verifiers.test.ts tests/scripts/build/verify-build.test.ts`,
      `bun --silent run typecheck`,
      `bun --silent run lint -- --quiet scripts/build/verify-build.ts scripts/build/verify-build/html-verifier.ts scripts/build/verify-build/asset-verifier.ts tests/scripts/build/build-verifier.test.ts tests/scripts/build/public-output-verifiers.test.ts tests/scripts/build/verify-build.test.ts src/components/articles/HoverImageCard.astro src/components/articles/PublishableMediaFrame.astro`,
      `bunx prettier --check scripts/build/verify-build.ts scripts/build/verify-build/html-verifier.ts scripts/build/verify-build/asset-verifier.ts tests/scripts/build/build-verifier.test.ts tests/scripts/build/public-output-verifiers.test.ts tests/scripts/build/verify-build.test.ts tests/fixtures/build-verifier/golden-diagnostic-report.json src/components/articles/HoverImageCard.astro src/components/articles/PublishableMediaFrame.astro docs/MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md docs/GENERATED_OUTPUT_VERIFIER_CONTRACT.md CHECKLIST.md --log-level warn`,
      and
      `bunx markdownlint-cli2 docs/MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md docs/GENERATED_OUTPUT_VERIFIER_CONTRACT.md CHECKLIST.md`.

### Milestone 251: Milestone 2 Release Verification And Linear Handoff

- [x] Run focused tests for publishables, route view models, verifier modules,
      metadata, citations, media/PDF policy, and affected pages/components.
- [x] Run full release checks and fix any regressions.
- [x] Update docs, checklist notes, and Milestone 2 Linear statuses after local
      verification passes.
      Verified Milestone 2 with focused output-engine, citation, metadata,
      media/PDF, route view-model, feed, and verifier tests; added missing
      mirrored tests for build-verifier modules and semantic profile kinds so
      accountability checks cover the new source files. Fixed release-gate
      formatting and dead-code findings by formatting drifted files and
      narrowing internal type/helper exports. Final verification passed with
      `bun --silent run test:accountability:release`,
      `bun --silent run typecheck`, `bun --silent run deadcode`, and
      `bun --silent run check:release`.

### Milestone 179: Engineering Philosophy Synthesis

- [x] Synthesize the repo's long-term code-health philosophy across platform
      separation, pure/impure boundaries, UI/logic separation, type-driven
      design, defensive coding, testing, performance, accessibility, and
      authoring simplicity.
- [x] Extend the synthesis with product audience goals, fearless velocity,
      domain-expressive architecture, bug-class elimination, proactive layout
      hardening, efficiency, measurement, and documentation/API policy.
- [x] Add domain hierarchy and extractability/productization principles so
      mature subdomains can be designed toward future Astro libraries,
      integrations, modules, or CLIs without premature extraction.
- [x] Add concrete do/don't examples and review prompts so future refactor
      planning can use the document as a decision aid.
- [x] Add final usage and conflict-resolution guidance so the philosophy helps
      future planning without encouraging abstraction for its own sake.
- [x] Link the document from `AGENTS.md` so future agents discover it during
      normal repository orientation.
      Documented in `agent-docs/ENGINEERING_PHILOSOPHY.md`.

### Milestone 180: Comprehensive Codebase Roadmap Audit

- [x] Create organized roadmap working docs for coverage tracking, raw
      findings, domain mapping, and final synthesis.
      Created under `agent-docs/codebase-roadmap/`.
- [x] Inventory repo configuration, site instance files, Astro routes/layouts,
      components, platform libraries, styles, scripts, tests, docs, and
      generated-output contracts.
      Coverage is recorded in
      `agent-docs/codebase-roadmap/COVERAGE_LEDGER.md`.
- [x] Audit each domain against `agent-docs/ENGINEERING_PHILOSOPHY.md`,
      capturing concrete evidence, roadmap candidates, risks, dependencies,
      and verification paths.
      Raw observations are recorded in
      `agent-docs/codebase-roadmap/FINDINGS_SCRATCHPAD.md` and
      `agent-docs/codebase-roadmap/DOMAIN_MAP.md`.
- [x] Synthesize the final ambitious roadmap for platform productionization,
      productization, component architecture, content/compiler pipeline,
      tooling, testing, performance, accessibility, metadata, and future
      extractable modules.
      Final roadmap written in
      `agent-docs/codebase-roadmap/COMPREHENSIVE_ROADMAP.md`.
- [x] Cross-check the final roadmap against the coverage ledger and philosophy
      guardrails, then run focused documentation checks before handoff.
      `bun --silent run review:markdown` passes.

### Milestone 181: Roadmap Execution Plan Refinement

- [x] Rework the comprehensive roadmap so it is clearly a planning and handoff
      document, not an instruction to begin implementation immediately.
- [x] Add a repeatable design-packet template for each roadmap milestone:
      intended contracts, affected users, risk level, tests, docs,
      performance/accessibility/SEO checks, and approval criteria.
- [x] Add milestone sequencing guidance that explains dependencies and safe
      batching without skipping any valid long-term work.
- [x] Add an explicit developer handoff protocol for turning roadmap items into
      future checklist implementation milestones.
- [x] Run documentation checks after the roadmap refinement.
      `bun --silent run review:markdown` passes.

### Milestone 182: Mature Platform Roadmap Gap Pass

- [x] Reread `agent-docs/ENGINEERING_PHILOSOPHY.md` against the comprehensive
      roadmap with the mature platform/product vision in mind.
- [x] Add missing long-term roadmap domains for extension architecture,
      authoring studio workflows, content portability, deployment adapters,
      release governance, security/privacy, observability, localization, and
      starter/distribution readiness.
- [x] Update the domain map, findings scratchpad, and coverage ledger so the
      added roadmap work remains traceable to the audit process.
- [x] Rerun documentation checks after the roadmap gap pass.
      `bun --silent run review:markdown` passes.

### Milestone 183: Fresh Comprehensive Codebase Audit

- [x] Reread `agent-docs/ENGINEERING_PHILOSOPHY.md` and use it as the
      independent audit standard.
- [x] Create a new audit workspace that does not reuse the previous roadmap
      files.
- [x] Inventory tracked source, content, docs, tests, tooling, config, site
      instance files, and ignored generated/local artifacts.
- [x] Inspect every tracked file or file family with explicit coverage notes,
      separating text-source review from binary/generated artifact inventory.
- [x] Write and iterate a fresh roadmap/audit document from the new evidence
      only.
- [x] After the fresh roadmap is complete, compare it with the prior roadmap
      and synthesize the standalone `agent-docs/PLATFORM_ROADMAP.md`.
- [x] Critique and refine the platform roadmap through multiple passes, then
      run documentation checks before handoff.

### Milestone 184: Linear Sub-Issue Planning - IRK-8 Roadmap Preflight

- [x] Break `IRK-8` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 185: Linear Sub-Issue Planning - IRK-9 Source And Artifact Lifecycle

- [x] Break `IRK-9` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 186: Linear Sub-Issue Planning - IRK-10 Platform Context

- [x] Break `IRK-10` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 187: Linear Sub-Issue Planning - IRK-11 Route Registry

- [x] Break `IRK-11` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 188: Linear Sub-Issue Planning - IRK-12 Article Compiler Artifact

- [x] Break `IRK-12` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 189: Linear Sub-Issue Planning - IRK-13 Publishable Entry Model

- [x] Break `IRK-13` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 190: Linear Sub-Issue Planning - IRK-14 Route-Level View Models

- [x] Break `IRK-14` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 191: Linear Sub-Issue Planning - IRK-15 Generated-Output Verifiers

- [x] Break `IRK-15` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 192: Linear Sub-Issue Planning - IRK-16 Metadata Engine

- [x] Break `IRK-16` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 193: Linear Sub-Issue Planning - IRK-17 References And Bibliography

- [x] Break `IRK-17` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 194: Linear Sub-Issue Planning - IRK-18 Media And PDF Policy

- [x] Break `IRK-18` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 195: Linear Sub-Issue Planning - IRK-19 UI Primitives And Catalog

- [x] Break `IRK-19` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 196: Linear Sub-Issue Planning - IRK-20 Interaction Primitives

- [x] Break `IRK-20` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 197: Linear Sub-Issue Planning - IRK-21 Performance Workbench

- [x] Break `IRK-21` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 198: Linear Sub-Issue Planning - IRK-22 Test Matrix

- [x] Break `IRK-22` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 199: Linear Sub-Issue Planning - IRK-23 Site Doctor

- [x] Break `IRK-23` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 200: Linear Sub-Issue Planning - IRK-24 Documentation System

- [x] Break `IRK-24` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 201: Linear Sub-Issue Planning - IRK-25 Observability

- [x] Break `IRK-25` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 202: Linear Sub-Issue Planning - IRK-26 Studio Readiness

- [x] Break `IRK-26` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 203: Linear Sub-Issue Planning - IRK-27 Package Boundaries

- [x] Break `IRK-27` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 204: Linear Sub-Issue Planning - IRK-28 Extension Architecture

- [x] Break `IRK-28` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 205: Linear Sub-Issue Planning - IRK-29 Deployment Adapters

- [x] Break `IRK-29` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 206: Linear Sub-Issue Planning - IRK-30 Security And Trust Policy

- [x] Break `IRK-30` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 207: Linear Sub-Issue Planning - IRK-31 Migration And Portability

- [x] Break `IRK-31` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 208: Linear Sub-Issue Planning - IRK-32 Localization

- [x] Break `IRK-32` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 209: Linear Sub-Issue Planning - IRK-33 Starter Templates

- [x] Break `IRK-33` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 210: Linear Sub-Issue Planning - IRK-34 Static Blog Studio

- [x] Break `IRK-34` into specific child issues with meaningful blockers,
      parallel-safe work, verification, and exit criteria.
- [x] Verify the child issue set is actionable without fake precision.

### Milestone 211: Linear Studio CLI And MCP Planning

- [x] Add Linear work for a shared headless studio core with GUI, CLI, and MCP
      adapters over the same platform services.
- [x] Add CLI workflow planning for developer, CI, migration, automation,
      preview, publish, rollback, and release-report operations.
- [x] Add MCP planning for safe agent/tool access with read-only defaults,
      dry-run/proposed-diff behavior, write scopes, audit logs, secret
      redaction, and gated provider-backed actions.
- [x] Add cross-interface parity planning so GUI, CLI, and MCP cannot drift into
      separate implementations.

### Milestone 212: Roadmap Studio CLI And MCP Refresh

- [x] Refresh the platform roadmap against the engineering philosophy.
- [x] Update the roadmap so the final studio product explicitly includes GUI,
      CLI, and MCP adapters over one headless studio core.
- [x] Call out CLI/MCP safety, parity, deployment, and verification
      expectations before auditing Linear dependencies.

### Milestone 213: Linear Roadmap Dependency Audit

- [x] Review TPM Linear issues against the roadmap dependency model.
- [x] Fix inaccurate blocker/blocking relationships or obvious issue metadata
      mistakes.
- [x] Re-check changed issues and confirm the plan can guide parallel work.

### Milestone 214: QA Preflight Planning And Linear Hygiene

- [x] Treat `IRK-8` as the active roadmap preflight parent and `IRK-36` through
      `IRK-40` as the concrete work sequence.
- [x] Ignore or resolve superseded `IRK-35` before implementation tracking so it
      does not confuse the active preflight plan.
- [x] Define the local audit artifacts needed for the preflight work before
      changing any QA behavior.
- [x] Create or update the preflight design/audit document with the command,
      config, CI, scope, risk, probe, and cleanup sections needed for the
      remaining preflight milestones.

### Milestone 215: IRK-36 QA Inventory

- [x] Inventory `package.json` scripts and classify each package command.
- [x] Inventory GitHub Actions workflows and map every CI command to a local
      script or CI-only reason.
- [x] Inventory lint, format, TypeScript, Astro, Playwright, Vitest, coverage,
      markdown, HTML, security, performance, generated-output, and content
      verification configs.
- [x] Inventory Git, formatter, linter, test, validator, and tool ignore files
      or exclude lists.
- [x] Classify each command by purpose, owner domain, inputs, outputs, CI usage,
      mutation behavior, expected runtime, and whether it is fast local,
      focused, release-level, CI-only, mutation/fix, or investigative.
- [x] Identify stale commands, undocumented CI gates, overbroad scans, duplicate
      checks, and scope risks without changing tool behavior.
- [x] Verify the inventory covers every script and every CI command before
      unblocking registry, probes, and diagnostic-diff work.

### Milestone 216: IRK-37 Script Registry And CI Parity

- [x] Design the script registry and CI/local parity contract from the completed
      QA inventory.
- [x] Add or update machine-readable and human-readable script references so
      command purpose, scope, runtime expectation, and CI reproduction path are
      explicit.
- [x] Verify script docs and registry data match `package.json` and CI.

### Milestone 217: IRK-38 Failure-Probe Fixtures

- [x] Design the failure-probe fixture location and execution model so probes do
      not leak into production content or generated output.
- [x] Add intentionally bad fixture inputs for representative QA layers without
      letting those fixtures contaminate normal site content or release output.
- [x] Verify each probe is caught by the intended script or verifier.
- [x] Document which bug class each probe protects before any scope narrowing.

### Milestone 218: IRK-39 Diagnostic Diff Harness

- [x] Design the diagnostic record shape used for command/verifier comparisons.
- [x] Build a diagnostic comparison path for risky QA changes that compares
      diagnostic codes, files, severities, and counts instead of only exit
      codes.
- [x] Document that any high-risk `IRK-40` scope replacement must characterize
      current behavior with the harness before narrowing.
- [x] Document how to interpret intentional diagnostic differences.

### Milestone 219: IRK-40 QA Scope Cleanup And Final Command Map

- [x] Decide which scope changes are safe now versus deferred based on inventory,
      probes, and diagnostic diffs.
- [x] Tighten overbroad tool scopes only after inventory, registry, probes, and
      diagnostic diff support are complete enough to preserve coverage.
- [x] Update `PACKAGE_SCRIPTS.md` and related docs with the final command map
      for editing, handoff, release, CI reproduction, and investigation.
- [x] Record before/after runtime and diagnostic differences for scoped or split
      checks.
      Verified with focused `HomeFeaturedCarousel`, `HomeFeaturedSlide`,
      `BrandButton`, and `PublishableMediaFrame` tests, built-output checks for
      `fetchpriority="high"`, and `bun run check:release`.

### Milestone 170: Lighthouse Article List Image Payload Tuning

- [x] Add context-specific image sizing options to publishable media.
- [x] Update article cards to use thumbnail-specific dimensions, `sizes`, and
      any safe list-thumbnail-only quality tuning.
- [x] Recheck article, author, category, tag, and archive list routes for
      reduced image-delivery waste without visible quality regressions.
      Verified with `PublishableMediaFrame` and `ArticleCard` component tests,
      built-output inspection on article, author, category, and tag routes, and
      `bun run check:release`.

### Milestone 171: Lighthouse Hosting And Analytics Policy

- [x] Inspect repository-owned Cloudflare/static configuration and document
      which Lighthouse analytics/cache/CSP findings are first-party versus
      Cloudflare/dashboard policy.
- [x] Add or update project docs with the caching, analytics, CSP, and
      production-measurement decision so future maintainers do not treat
      third-party scanner noise as app-code regressions.
- [x] Verify no first-party caching or metadata regressions were introduced.
      Documented in `docs/performance/unlighthouse-audit-2026-05-17.md` and
      `docs/CLOUDFLARE_WORKERS_MIGRATION.md`; verified with
      `bun run check:release`.

### Milestone 172: Lighthouse Bounded Performance Experiments

- [x] Try lazy-but-opportunistic anchored positioning with first-intent loading,
      idle warmup, and a shared one-time module install.
- [x] Browser-test header dropdowns, citation/share popovers, hover cards, and
      reference previews from a cold page.
- [x] Run an automated critical-CSS experiment on a build copy, record measured
      tradeoffs, and keep it only if it improves cold-load metrics without
      brittle style drift, dark-mode flash, or payload regressions.
- [x] Optionally compare current Astro prefetch behavior against a narrower
      policy if time and evidence justify it.
- [x] Run release checks and update the audit report with implemented outcomes,
      rejected experiments, and follow-up recommendations.
      Verified with anchored-positioning loader tests, anchored/hover/article
      action browser coverage in `bun run check:release`, the reproducible
      `bun run payload:critical-css:experiment` report, and the documented
      decision not to adopt critical CSS or prefetch policy changes in this
      pass.

### Milestone 173: Citation BibTeX Audit

- [x] Inventory every article `[^cite-*]` marker and every hidden
      `tpm-bibtex` entry with a reproducible script so the audit can prove
      complete coverage.
- [x] Write a developer-ready citation audit report that identifies malformed,
      under-structured, duplicated, and externally unverifiable migrated
      citations before manual cleanup begins.
- [x] Add focused tests for the audit script and update package-script docs so
      future citation cleanup can rerun the same checks.
      Verified with `bun test tests/scripts/content/audit-bibtex-citations.test.ts --reporter=dots`,
      `bun --silent run typecheck:tools`,
      `bun --silent run lint -- scripts/content/audit-bibtex-citations.ts tests/scripts/content/audit-bibtex-citations.test.ts`,
      `bun --silent run lint:packages`,
      `bunx prettier --check scripts/content/audit-bibtex-citations.ts tests/scripts/content/audit-bibtex-citations.test.ts package.json PACKAGE_SCRIPTS.md CHECKLIST.md docs/CITATION_BIBTEX_AUDIT.md --log-level warn`,
      `bunx markdownlint-cli2 CHECKLIST.md PACKAGE_SCRIPTS.md docs/CITATION_BIBTEX_AUDIT.md`,
      and `bun run references:bibtex:audit -- --write --quiet`.

### Milestone 174: Manual Citation BibTeX Inspection

- [x] Use the full 246-entry BibTeX inventory from Milestone 173 as the
      no-skips checklist for a human review pass.
- [x] Manually inspect every parsed citation entry article by article, record
      concrete visible mistakes, and distinguish structural cleanup from
      source-canonical verification work.
- [x] Write the manual inspection report with coverage proof, prioritized issue
      classes, and exact follow-up actions for citation cleanup.
- [x] Verify the report and checklist with formatting, markdown, and diff
      checks before handoff.
      Documented in `docs/CITATION_BIBTEX_MANUAL_INSPECTION.md`; verified with
      `bunx prettier --check docs/CITATION_BIBTEX_MANUAL_INSPECTION.md docs/CITATION_BIBTEX_AUDIT.md CHECKLIST.md --log-level warn`,
      `bunx markdownlint-cli2 docs/CITATION_BIBTEX_MANUAL_INSPECTION.md docs/CITATION_BIBTEX_AUDIT.md CHECKLIST.md`,
      and `git diff --check`.

### Milestone 175: Citation Verification Rules And Ledger Design

- [x] Define the target BibTeX/BibLaTeX-like conventions for TPM citations,
      including allowed entry types, required/recommended fields, web/video/social
      source rules, archive handling, locator policy, and unresolved-source
      notation.
- [x] Replace the earlier triage framing with an explicit canonical
      verification workflow: every citation must be syntactically sane,
      manually checked against online source evidence, and reviewed against the
      article author's likely intent.
- [x] Produce a per-entry verification ledger shape that records source lookup
      evidence, confidence, corrections needed, and unresolved questions for
      all 246 entries.
      Documented in `docs/CITATION_CANONICAL_VERIFICATION.md` with the 246-row
      no-skips ledger initialized in
      `docs/CITATION_CANONICAL_VERIFICATION_LEDGER.md`.

### Milestone 176: Citation Canonical Verification Pass

- [x] Manually verify every BibTeX entry in the 246-entry inventory against
      online evidence, using the Milestone 175 ledger as a no-skips checklist.
- [x] Record per-entry findings for syntax/field quality, literal citation
      correctness, source identity, duplicate identity, and author-intent
      sanity.
- [x] Mark entries as corrected-ready, ambiguous, unrecoverable, or requiring
      editorial review before changing article source.
- [x] Complete the first high-risk source lookup batches for
      `what-is-a-meme.md` and `postnaturalism.md`, recording verified,
      ambiguous, duplicate-ready, and editorial-review rows in the canonical
      ledger.
- [x] Complete the first `internetmemetics.md` source lookup batch for rows
      45-60, recording structured DOI/book/chapter/web evidence and duplicate
      identities in the canonical ledger.
- [x] Complete the `internetmemetics.md` source lookup batch for rows 61-80,
      recording structured chapter/book/article/web evidence, duplicate
      identities, and edition/archive ambiguities in the canonical ledger.
- [x] Complete the `internetmemetics.md` source lookup batch for rows 81-100,
      recording DOI2BIB/Crossref article evidence, SEP/KYM/web source shapes,
      and ambiguity/editorial-review notes for dynamic, conference, and
      preprint-like sources in the canonical ledger.
- [x] Complete the remaining `internetmemetics.md` source lookup batch for
      rows 101-119, recording DOI2BIB/Crossref article evidence,
      book/web/SEP evidence, duplicate-ready Shifman/Segev source identities,
      and residual Sober edition ambiguity in the canonical ledger.
- [x] Complete `the-memeticists-challenge-remains-open.md` source lookup
      batches for rows 120-161, explicitly reconciling duplicates with
      `internetmemetics.md`, including OUP edited-volume ambiguities,
      Journal of Memetics source shapes, DOI-backed article records, and
      duplicate-ready Shifman/Segev/Lynch/Edmonds source identities.
- [x] Complete the remaining article lookup batches for rows 162-246, covering
      Vulliamy, philosophy/classroom sources, politics sources, and
      bibliography-only edge cases.

### Milestone 177: Citation Source Correction Batches

- [x] Correct citation entries article by article, starting with visibly broken
      mechanical migrations such as `what-is-a-meme.md` and placeholder
      records in `postnaturalism.md`.
- [ ] Normalize duplicates only after source identity is verified, preserving
      author intent and article-specific locator needs.
- [x] Re-run the structural audit after each batch to prove citation coverage,
      parser diagnostics, and sitewide bibliography aggregation do not regress.
      Final verification used `bun run references:bibtex:audit -- --write --quiet`.
- [x] Correct the severe mechanical field splits in `what-is-a-meme.md`,
      including scholarly DOI-backed sources, Know Your Meme web pages, and
      ambiguous social/video/classical cases.
- [x] Correct the highest-risk `postnaturalism.md` placeholders and source
      shapes, including DOI-backed article/chapter records, web/encyclopedia
      source types, and duplicate-ready Tipton book records.
- [x] Correct the duplicated Zannettou/Caulfield origins-of-memes source in
      both decade-review articles, including the author list, proceedings
      fields, DOI, and duplicate-merge ledger status.
- [x] Correct the aesthetics source batch in
      `we-can-have-retrieval-inference-synthesis.md`, including structured
      book, article, and in-book records for Baxandall, Haack, Hull, Lewens,
      and Wollheim sources.
- [x] Correct the GamerGate source batch, including publisher identifiers,
      journal DOI metadata, and the Overland web article source shape.
- [x] Correct the memetic-bottleneck source batch, including the Eisner book,
      Sperber chapter DOI, Shifman duplicate-ready web source, and GDC talk
      metadata.
- [x] Correct the first history source batch, including conservative cleanup
      for the memetic-history video, Benjamin source, jjalbang sources, and
      the Magibon video placeholder.
- [x] Correct the Harambe source batch, including article dates, source
      organizations, social-post metadata, and explicit ambiguity notes for the
      dead Vine and Facebook sources.
- [x] Correct the Wittgenstein quote source batch, including Malcolm book
      metadata, Hanson article metadata, and an explicit ambiguous note for the
      Dribble source.
- [x] Correct the Chapman/Raymond/Putnam/Godwin and generation-gap source
      batch, including web source dates and ISBN metadata where recoverable.
- [x] Correct `internetmemetics.md` rows 45-60, including DOI-backed article
      records, Aunger/Bloch/Boyd/Richerson/Conte chapter and volume metadata,
      duplicate-ready book records, and web sources with explicit ambiguity
      where canonical metadata is limited.
- [x] Correct `internetmemetics.md` rows 61-80 after canonical lookup,
      including Dawkins book/chapter records, Cullen/Davison/Dennett source
      shapes, Journal of Memetics web-journal entries, and archived wiki
      sources with explicit ambiguity notes.
- [x] Correct `internetmemetics.md` rows 81-100 after canonical lookup,
      including DOI-backed article records, SEP/KYM/web source normalization,
      the Milner dissertation correction, and explicit ambiguity/editorial
      review notes for weakly recoverable sources.
- [x] Correct `internetmemetics.md` rows 101-119 after canonical lookup,
      including DOI-backed article records, Bloomsbury/MIT Press book
      metadata, Spreadable/Wired/Urban Dictionary web sources, SEP archive
      metadata, and duplicate-ready Shifman/Segev source records.
- [x] Correct `the-memeticists-challenge-remains-open.md` rows 120-161 after
      canonical lookup and duplicate reconciliation, converting generic
      `@misc` records into structured article/book/chapter/online entries
      while leaving unresolved edited-volume page/date questions explicit in
      the ledger.
- [x] Correct the remaining rows 162-246 after canonical lookup, leaving only
      explicit ambiguity/editorial-review notes where public source metadata or
      project citation policy is insufficient.

### Milestone 178: Citation Release Verification

- [x] Inspect affected article bibliographies and the sitewide bibliography for
      corrected rendering, clickable source URLs, duplicate collapse, and
      stable backlink behavior.
      Spot-checked affected built article bibliography output and
      `/bibliography/` for hidden raw BibTeX leakage, source URLs, and backlink
      anchors after the release build.
- [x] Run citation audit, formatting, markdown, content verification, build, and
      release checks before handoff.
      Verified with `bun run references:bibtex:audit -- --write --quiet`,
      `git diff --check`, and `bun run check:release`.
- [x] Update author-facing citation docs with the final source-authoring rules
      and unresolved-source guidance.
      Updated `docs/ARTICLE_REFERENCE_AUTHORING.md` with source-type, field,
      and uncertainty guidance.

### Milestone 179: IRK-93 Test Matrix Inventory

- [x] Inventory the current test layers, fixture sites, release gates, catalog
      checks, accessibility checks, performance checks, and generated-output
      verifiers.
- [x] Identify which current checks are fast local checks, focused local checks,
      release gates, CI checks, review-only checks, or investigation-only
      tooling.
- [x] Verify the inventory is grounded in current scripts, tests, docs, and
      existing fixture-site behavior before designing the target matrix.
      Documented in `docs/TEST_MATRIX_AND_FIXTURE_STRATEGY.md` and verified
      against `package.json`, `scripts/testing/*`,
      `scripts/quality/run-quality.ts`, `tests/fixtures/site-instance/`,
      `examples/docs-site/`, and `src/catalog/`. Formatting and markdown lint
      passed with `bunx prettier --check docs/TEST_MATRIX_AND_FIXTURE_STRATEGY.md --log-level warn`
      and `bunx markdownlint-cli2 docs/TEST_MATRIX_AND_FIXTURE_STRATEGY.md`.

### Milestone 180: IRK-93 Fixture-Site And Test-Layer Design

- [x] Define the target test-layer ownership matrix for source contracts,
      output engines, UI, interactions, performance, diagnostics, docs,
      deployment, and future studio workflows.
- [x] Define the required fixture-site matrix for minimal, docs/example,
      scholarly, media-heavy, broken/hostile, feature-disabled, and
      kitchen-sink scenarios.
- [x] Document local/release/CI placement rules and the non-goals that prevent
      monolithic or duplicated tests.
- [x] Verify the design is developer-ready and gives new roadmap work a clear
      test home before implementation.
      Documented in `docs/TEST_MATRIX_AND_FIXTURE_STRATEGY.md`. The design
      gives each domain a primary owner, names the fixture-site matrix, and
      defines placement rules/non-goals for future implementation issues.
      Verified with `bunx prettier --check docs/TEST_MATRIX_AND_FIXTURE_STRATEGY.md --log-level warn`
      and `bunx markdownlint-cli2 docs/TEST_MATRIX_AND_FIXTURE_STRATEGY.md`.

### Milestone 181: IRK-89 Performance Baseline Inventory

- [x] Inventory the current performance tooling, Lighthouse/Unlighthouse
      findings, payload reports, cache policy, PDF budget checks, and
      representative route classes.
- [x] Collect or cite current build-output and Lighthouse evidence for the
      first budget pass without inventing unsupported thresholds.
- [x] Verify the baseline inventory distinguishes current evidence from future
      enforcement work.
      Documented in `docs/performance/route-class-performance-budgets.md`.
      Evidence was collected from `lighthouserc.json`,
      `docs/performance/unlighthouse-audit-2026-05-17.md`,
      `site/public/_headers`, PDF/social-preview verifier policy, and fresh
      local output from `bun --silent run build` plus
      `bun --silent run payload:report -- --top 12`. The doc distinguishes
      existing enforcement from warning-only and future route-class work.

### Milestone 182: IRK-89 Route-Class Performance Budget Design

- [x] Define route classes, representative baseline routes, viewport/device
      profiles, metrics, and warning/failure threshold policy.
- [x] Define how HTML, CSS, JS, image, font, PDF, total transfer, LCP, CLS, TBT,
      cache-header, and critical-request-chain budgets should be measured and
      enforced.
- [x] Document how performance budgets integrate with local checks, release
      checks, CI, experiment workflows, and future implementation issues.
- [x] Verify the design is evidence-based, measurable, and ready to unblock
      performance workbench implementation.
      Documented in `docs/performance/route-class-performance-budgets.md`.
      The design defines route classes, baseline routes, Core Web Vitals,
      Lighthouse, payload, PDF, image/media, cache, critical-chain, and rollout
      policy, with acceptance criteria for future implementation.
      Verified with `bunx prettier --check docs/performance/route-class-performance-budgets.md --log-level warn`
      and `bunx markdownlint-cli2 docs/performance/route-class-performance-budgets.md`.

### Milestone 179: IRK-65 Verifier Diagnostic Design And Inventory

- [x] Inventory current generated-output verifier issue buckets,
      `site:doctor` diagnostics, and release-check expectations.
- [x] Define the shared diagnostic model, verifier module API, diagnostic
      identity, and JSON/human-output expectations without weakening current
      release checks.
- [x] Update platform documentation with the verifier contract and any module
      boundary changes before implementation begins.
      Documented in `docs/GENERATED_OUTPUT_VERIFIER_CONTRACT.md`.

### Milestone 180: IRK-65 Diagnostic Model And Module API

- [x] Add the typed reusable diagnostic model and verifier module runner with
      stable categories, severities, locations, remediation, evidence, and
      machine-readable report helpers.
- [x] Add an adapter from the current build verifier issue buckets into the
      shared diagnostic model so existing diagnostics can map into the new
      contract without losing useful information.
- [x] Preserve existing human-readable verifier CLI output while adding
      machine-readable JSON output suitable for future site doctor, GUI, CLI,
      and MCP consumers.
      Implemented `src/lib/output-verification.ts`, mapped current
      `verify-build` buckets into structured diagnostics, and added
      `bun run verify -- --json` support while preserving the existing default
      human report.

### Milestone 181: IRK-65 Focused Verification Coverage

- [x] Add unit coverage for diagnostic creation, module aggregation, blocking
      severity detection, diagnostic identities, and report formatting.
- [x] Add build-verifier coverage proving every current issue bucket maps to a
      structured diagnostic and JSON output does not replace the existing human
      report.
- [x] Verify the new diagnostic API is pure/testable and does not introduce
      site-specific coupling into reusable platform modules.
      Verified with
      `bun test tests/config/package-scripts.test.ts tests/src/lib/output-verification.test.ts tests/scripts/build/build-verifier.test.ts tests/scripts/quality/verify-platform-boundaries.test.ts`,
      `bun --silent run platform:check`, `bun --silent run typecheck`,
      `bun --silent run lint -- --quiet`, `bun --silent run format`, and
      `bun --silent run format:markdown`.

### Milestone 182: IRK-65 Release Verification And Handoff

- [x] Run focused tests and relevant repository checks for the new verifier
      contract.
- [x] Fix any issues, update docs/checklist completion notes, and record the
      remaining blockers for the later verifier module split work.
      Verified with
      `bun test tests/config/package-scripts.test.ts tests/src/lib/output-verification.test.ts tests/scripts/build/build-verifier.test.ts tests/scripts/quality/verify-platform-boundaries.test.ts`,
      `bun --silent run check:fast`, `bun --silent run typecheck`,
      `bun --silent run lint -- --quiet`, `bun --silent run deadcode`,
      `bun --silent run format`, `bun --silent run format:markdown`,
      `git diff --check`, and `bun --silent run check`. Later verifier module
      splits remain blocked on the route/entity registry and article compiler
      artifact contracts.
- [x] Run the agreed preflight verification set and update Linear/checklist
      status after the milestone is verified.

### Milestone 226: IRK-90/94/95 Milestone 3 Execution Design

- [x] Re-read the active Linear issues, performance budget design, test-matrix
      strategy, QA preflight docs, package scripts, and engineering philosophy
      against the current branch.
- [x] Define the concrete implementation sequence for performance reporting,
      invariant tests, and QA command/accountability updates without adding
      fake precision or hard-gating noisy metrics.
- [x] Verify the design is implementation-ready: no public route changes,
      deterministic report contracts, explicit test ownership, and clear
      release-check expectations. Existing design docs are sufficient:
      `docs/performance/route-class-performance-budgets.md`,
      `docs/TEST_MATRIX_AND_FIXTURE_STRATEGY.md`, `agent-docs/QA_PREFLIGHT.md`,
      `agent-docs/ENGINEERING_PHILOSOPHY.md`, and `PACKAGE_SCRIPTS.md`.

### Milestone 227: IRK-90 Route-Class Payload Report Contract

- [x] Add typed route-class and budget-report data for representative route
      classes, generated artifacts, payload metrics, and cache-policy results.
- [x] Extend `payload:report` so it emits machine-readable and human-readable
      route-class payload, asset, PDF, and cache-header evidence from built
      output.
      Implemented with `src/lib/performance-budgets.ts` and
      `scripts/payload/report-payload.ts`.
- [x] Add focused tests for the report contract, route classification, cache
      policy checks, PDF warning thresholds, and CLI output.
      Verified with
      `bun test tests/src/lib/performance-budgets.test.ts tests/scripts/payload/report-payload.test.ts tests/scripts/payload/run-post-build-optimization-experiments.test.ts tests/config/lighthouserc.test.ts --reporter=dots`
      and `bun --silent run test:config`.

### Milestone 228: IRK-90 Performance Workbench Documentation And Verification

- [x] Update performance documentation and package-script docs so the payload
      workbench explains hard budgets, warning-only measurements, investigation
      outputs, and current release placement.
      Updated `docs/performance/route-class-performance-budgets.md` and
      `PACKAGE_SCRIPTS.md`.
- [x] Run focused payload/report checks on fixture build output and a local
      build where needed.
      Verified on generated output with `bun --silent run build` and
      `bun --silent run payload:report -- --top 1 --json`.
- [x] Verify the workbench reports actionable route/class/metric evidence
      without promoting noisy Lighthouse metrics into hard failures.

### Milestone 229: IRK-94 Core Platform Invariant Test Expansion

- [x] Inventory stable pure domains that can gain non-brittle property/table
      coverage without test-only exports.
- [x] Add or strengthen tests for route/slug behavior, visibility or surface
      policy, metadata defaults, citation normalization, media/cache policy,
      share targets, redirects, config defaults, and generated report
      contracts where practical.
- [x] Refactor only where a real production seam makes the logic cleaner and
      more testable.
      Added focused invariant coverage to route-registry, redirect, share
      target, social-image, article-PDF, performance-budget, and payload-report
      tests without adding test-only exports. No production refactor was needed
      beyond the performance-budget module already introduced for IRK-90.

### Milestone 230: IRK-94 Invariant Test Verification

- [x] Run focused unit/config tests for each touched invariant domain.
- [x] Verify the new tests fail invalid states or contract drift rather than
      incidental implementation details.
- [x] Update any changed docs or accountability rules caused by new production
      seams.
      Verified with
      `bun test tests/src/lib/route-registry.test.ts tests/src/lib/site-redirects.test.ts tests/src/lib/share-targets.test.ts tests/src/lib/social-images.test.ts tests/src/lib/article-pdf.test.ts tests/src/lib/performance-budgets.test.ts tests/scripts/payload/report-payload.test.ts tests/config/lighthouserc.test.ts --reporter=dots`.
      No additional docs/accountability changes were needed for these
      invariant-only test additions.

### Milestone 231: IRK-95 QA Command Taxonomy And Coverage Accountability

- [x] Update the QA command registry, accountability docs, and package-script
      documentation so each major domain has a fast/focused and release/CI
      check or a documented exception.
- [x] Add tests proving package scripts, CI parity, command classes, mutation
      categories, and domain coverage remain aligned.
- [x] Verify the command taxonomy helps developers choose the right check while
      preserving the stronger release gate.
      Added `qaDomainCoverageRegistry` to
      `scripts/quality/qa-command-registry.ts`, updated
      `PACKAGE_SCRIPTS.md`, `docs/TEST_MATRIX_AND_FIXTURE_STRATEGY.md`, and
      `agent-docs/QA_PREFLIGHT.md`, and extended registry tests so package
      scripts, CI jobs, command domains, and documented exceptions stay
      aligned. Verified with
      `bun test tests/scripts/quality/qa-command-registry.test.ts tests/config/package-scripts.test.ts --reporter=dots`
      and `bun --silent run test:config`.

### Milestone 232: Milestone 3 Release Verification And Handoff

- [x] Run focused checks for payload reporting, command taxonomy,
      accountability, and invariant tests.
- [x] Run the release check suite and fix any issues.
- [x] Update checklist and Linear statuses after all Milestone 3 work is
      verified.
      Verified with focused suites for route registry, redirects, share
      targets, social images, article PDFs, performance budgets, payload
      reports, Lighthouse route config, QA command registry, and package-script
      documentation; `bun --silent run test:config`;
      `bun --silent run platform:check`;
      `bun --silent run typecheck:tools`;
      `bun --silent run lint -- --quiet`;
      `bun --silent run deadcode`;
      `git diff --check`; and `bun --silent run check:release`.
      Fixed release-gate findings for platform-boundary ownership, tooling
      type safety, import/order linting, and dead-code exports before the final
      release run passed. Updated Linear statuses for IRK-90, IRK-94, and
      IRK-95 to In Review.

### Milestone 233: IRK-81 UI Primitive And Layout Recipe Design

- [x] Re-audit repeated UI, layout, catalog, and responsive patterns against
      the current component tree and component one-pagers.
- [x] Define the stable primitive and layout recipe contracts that should guide
      the remaining component catalog and standardization work.
- [x] Verify the design is implementation-ready: no duplicate component
      vocabulary, clear ownership boundaries, realistic edge states, and clear
      testable invariants.
      Documented in `docs/components/PRIMITIVE_LAYOUT_RECIPE_CONTRACTS.md`,
      refreshed `docs/components/INVENTORY.md`, and added missing component
      one-pagers for current UI/action, compact-entry, term-rail, and SEO
      components. Verified with focused Prettier and markdownlint checks.

### Milestone 234: IRK-82 Component Catalog Fixture Matrix

- [x] Define and implement catalog fixture coverage for primitive, layout,
      interaction, long-content, missing-content, dark-mode, focus, and hostile
      states.
- [x] Ensure catalog coverage uses neutral platform fixture data instead of
      publication-specific TPM content where possible.
- [x] Verify catalog integrity and focused catalog tests pass after the fixture
      matrix is updated.
      Added UI primitive catalog examples for `ActionMenuItem`,
      `ActionPopover`, `BrandButton`, branded CTA wrappers, and `ScrollRail`,
      using neutral example data and existing platform assets. Verified with
      focused catalog tests, `catalog:check`, and Prettier.

### Milestone 235: IRK-83 Primitive Standardization Pass

- [x] Standardize section, list, rail, card, CTA, metadata, and action-surface
      patterns through existing or new primitives where repetition creates
      drift risk.
- [x] Update affected component one-pagers and catalog examples so the public
      contracts match the implementation.
- [x] Verify component render tests and focused layout/catalog checks pass.
      Standardized `SupportBlock` on `SectionHeader` instead of duplicating
      heading/description markup, updated its one-pager, and verified focused
      support/catalog component tests plus Prettier.

### Milestone 236: IRK-84 Responsive And Semantic Component Verification

- [x] Add or strengthen component, catalog, and Playwright invariants for
      responsive containment, semantic HTML, focus behavior, no horizontal
      overflow, and hostile content.
- [x] Verify the checks prove component intentions rather than incidental
      markup.
- [x] Run the focused component/catalog/e2e verification required by the
      standardized primitives.
      Added `tests/config/component-docs.test.ts` so component one-pagers and
      the inventory stay aligned with `src/components`. Verified with focused
      component-doc tests, Prettier, and `test:config`.

### Milestone 237: IRK-85 Interaction Primitive Design

- [x] Design the shared interaction primitive model for anchored surfaces,
      disclosures, previews, share/cite menus, rails, carousel, mobile nav,
      search reveal, and theme behavior.
- [x] Separate pure state/placement contracts from DOM adapter contracts and
      identify route-aware lazy-loading policy.
- [x] Verify the design is implementation-ready with clear keyboard, touch,
      reduced-motion, no-JS, accessibility, and payload expectations.
      Added `docs/navigation/interaction-primitives.md` and
      `src/lib/interaction-primitives.ts` to define typed script loading,
      fallback, keyboard, touch, and reduced-motion policy across all
      progressive interaction surfaces.

### Milestone 238: IRK-86 Interaction Consolidation Pass

- [x] Consolidate anchored, disclosure, preview, share, cite, rail, and carousel
      behavior around shared contracts where current duplication creates risk.
- [x] Preserve existing public behavior while making scripts easier to reason
      about and test.
- [x] Verify focused unit/script tests pass for the consolidated interaction
      domains.
      Consolidated duplicate article citation/share clipboard parsing and copy
      status reporting into `src/lib/browser-clipboard.ts`. Existing Cite and
      Share public behavior is preserved by focused script tests.

### Milestone 239: IRK-87 Interaction Lazy-Loading And Accessibility Policy

- [x] Add or update the policy that determines when interaction scripts load on
      intent, visibility, idle, or immediate need.
- [x] Encode accessibility expectations for keyboard, pointer, touch, reduced
      motion, outside click, escape, focus restoration, and no-JS fallback.
- [x] Verify route payload expectations and focused interaction tests align
      with the policy.
      Added registry coverage that requires every `src/scripts/*.ts` browser
      script to have a loading and accessibility policy. Verified with focused
      interaction policy, clipboard, anchored loader, carousel, Cite, and Share
      tests plus markdown/format checks.

### Milestone 240: IRK-88 Interaction Regression Verification

- [x] Add or strengthen browser checks for keyboard, touch, no-JS-compatible
      markup, payload-sensitive interaction loading, and route-level
      regressions.
- [x] Verify interaction behavior remains accessible and stable in built output.
- [x] Run the focused interaction, accessibility, and payload checks needed to
      close the interaction track.
      Added explicit policy coverage for every browser script, centralized
      shared clipboard/status behavior for Cite and Share menus, and ran the
      full focused script regression suite:
      `bun test tests/src/scripts/anchored-disclosure.test.ts
tests/src/scripts/anchored-positioning.test.ts
tests/src/scripts/anchored-positioning-loader.test.ts
tests/src/scripts/article-citation-copy.test.ts
tests/src/scripts/article-image-inspector.test.ts
tests/src/scripts/article-reference-previews.test.ts
tests/src/scripts/article-share.test.ts
tests/src/scripts/article-table-of-contents.test.ts
tests/src/scripts/home-featured-carousel.test.ts
tests/src/scripts/horizontal-scroll-rail.test.ts
tests/src/scripts/search-page.test.ts
tests/src/scripts/site-header-offset.test.ts
tests/src/scripts/theme.test.ts tests/src/lib/browser-clipboard.test.ts
tests/src/lib/interaction-primitives.test.ts --reporter=dots`.

### Milestone 241: IRK-91 Performance Experiment Workflow

- [x] Standardize the experiment workflow for critical CSS, preload, fetch
      priority, cache, payload, and post-build optimization investigations.
- [x] Ensure experiments produce comparable inputs, outputs, promotion
      criteria, rollback notes, and nonblocking diagnostics.
- [x] Verify experiment scripts and docs make accepted optimizations
      evidence-based instead of guesswork.
      Added `docs/performance/performance-workbench.md` and
      `src/lib/performance-workbench.ts` so performance experiments have typed
      tracks, evidence commands, promotion gates, and rollback rules. Verified
      with focused performance workbench, route budget, payload report,
      Lighthouse config, and QA registry tests plus markdown lint.

### Milestone 242: IRK-92 Performance Budget Promotion

- [x] Promote stable route-class payload/cache budgets into appropriate release
      checks while keeping noisy Lighthouse metrics warning-only until stable.
- [x] Update package-script docs, performance docs, and QA registry entries for
      the promoted budget checks.
- [x] Verify focused performance and config tests pass before release checks.
      Added `payload:check` and wired it into `check:release` after the release
      build and before generated-output verification. The check fails on
      deterministic route-class, PDF, or cache-header `fail`/`missing` states
      while leaving warnings as review evidence. Updated package-script docs,
      performance docs, QA registry metadata, and focused tests for package
      scripts, payload reporting, performance policy, Lighthouse route-class
      coverage, and QA command ownership.

### Milestone 243: IRK-96 Fixture Sites And Failure-Probe Verification

- [x] Verify fixture-site coverage and intentional failure probes against the
      target test matrix.
- [x] Add or adjust fixture/probe coverage only where a current invariant lacks
      a clear owner.
- [x] Verify focused fixture/probe commands and accountability tests pass.
      Added a fixture-site matrix test for the minimal external site and a
      payload-budget failure probe for the new deterministic performance gate.
      Verified with `bun --silent run test:config`,
      `bun --silent run test:site-instance`, and
      `bun --silent run test:catalog:site-instance`.

### Milestone 244: Milestone 3 Final Release Verification And Linear Handoff

- [x] Run focused checks for all Milestone 3 tracks touched in this pass.
- [x] Run release checks and fix any issues.
- [x] Update checklist completion notes, relevant docs, and Linear issue
      statuses after the milestone is verified.
      Verified Milestone 3 with focused build-verifier, interaction,
      performance, fixture, catalog, and config tests. Fixed the release gate
      client-script allowlist so the intentional `ArticleShareMenu` script is
      explicitly allowed only on article pages, then reran
      `bun --silent run check:release` successfully.

### Milestone 245: IRK-97 Author Diagnostic Taxonomy Design

- [x] Re-read the site-doctor, generated-output verifier, source-contract,
      documentation lifecycle, and author-facing docs to ground the diagnostic
      taxonomy in existing contracts.
- [x] Design author/site-owner diagnostic categories, ownership, source
      mapping, severity, remediation, related-docs, and JSON/human output
      expectations without expanding site-doctor checks from `IRK-98`.
- [x] Critique and iterate on the diagnostic design until it is specific
      enough to guide implementation and future GUI/CLI/MCP consumers.
      Added `docs/AUTHOR_DIAGNOSTICS.md` as the current diagnostic taxonomy
      contract. The design keeps generated-output diagnostics as a lower-level
      source, maps existing verifier categories into author-facing categories,
      separates repair ownership from fixability, and leaves site-doctor check
      expansion to `IRK-98`.

### Milestone 246: IRK-97 Diagnostic Taxonomy Contract And Verification

- [x] Implement the diagnostic taxonomy as a typed platform contract that can
      map current site-doctor and generated-output diagnostics without creating
      a parallel diagnostic model.
- [x] Add focused tests proving representative validator/verifier diagnostics
      map into author-facing categories, ownership, severity, remediation, and
      source references.
- [x] Update docs and verify the taxonomy is understandable to non-technical
      authors while still preserving developer/platform ownership.
      Added `src/lib/author-diagnostics.ts`,
      `docs/AUTHOR_DIAGNOSTICS.md`, and focused tests for generated-output and
      site-doctor mapping. Existing `site:doctor` human output is unchanged;
      `siteDoctorAuthorDiagnostics()` now exposes the JSON-ready taxonomy for
      future author tooling. Verified with
      `bun test tests/src/lib/author-diagnostics.test.ts tests/scripts/site/site-doctor.test.ts --reporter=dots`
      and `bun --silent run typecheck:tools`.

### Milestone 247: IRK-102 Generated Reference Design

- [x] Re-read the documentation lifecycle, source contracts, route registry,
      site config schema, metadata profile, media policy, and script registry
      sources to identify generated-reference owners.
- [x] Design generated/checkable references for site config, frontmatter,
      routes, features, visibility, metadata profiles, media/PDF policy,
      extension points, and script registry where current source contracts are
      mature enough.
- [x] Critique and iterate on the generated-reference design so it avoids
      stale parallel truth and does not pull in blocked public docs IA or docs
      drift work from `IRK-103`/`IRK-104`.
      Added `docs/GENERATED_REFERENCES.md` as the generated-reference contract.
      The design creates one generated platform reference under
      `docs/generated/`, adds write/check commands, and keeps public docs IA and
      broader docs link/drift verification scoped to later issues.

### Milestone 248: IRK-102 Generated Reference Implementation

- [x] Implement generated or checked reference output from source-of-truth
      schemas/registries with readable author-facing material where relevant.
- [x] Add focused tests or check commands proving generated references match
      the current platform contracts and fail when stale.
- [x] Update docs and package-script references for the generated-reference
      workflow.
      Added `scripts/docs/generate-platform-references.ts`,
      `docs/generated/platform-reference.md`, `docs:references`, and
      `docs:references:check`. The generated reference now derives site-config
      fields, content frontmatter fields, routes/features/output surfaces,
      visibility surfaces, semantic profiles, media/PDF policy vocabulary,
      source artifacts, and QA command domains from current source contracts.
      The drift check is part of `check:fast`, and focused generator/QA/package
      tests prove stale output fails. Verified with
      `bun test tests/scripts/docs/generate-platform-references.test.ts tests/src/lib/author-diagnostics.test.ts tests/scripts/site/site-doctor.test.ts tests/config/package-scripts.test.ts tests/scripts/quality/qa-command-registry.test.ts --reporter=dots`,
      `bun --silent run docs:references:check -- --quiet`,
      `bun --silent run typecheck:tools`, `bun --silent run platform:check`,
      and `bun --silent run check:fast`.

### Milestone 249: IRK-97/IRK-102 Final Verification And Handoff

- [x] Run focused diagnostic/reference/docs tests and fix any issues.
- [x] Run release checks and fix any issues.
- [x] Update the checklist with verification notes and record the remaining
      Milestone 4 blocker state after `IRK-97` and `IRK-102` are complete.
      Verified with focused diagnostic/reference tests, `typecheck:tools`,
      `lint`, `deadcode`, `docs:references:check`, `platform:check`,
      `check:fast`, and full `bun --silent run check:release`. Fixed release
      findings for import ordering, stricter object-index safety, generated
      reference formatting, and public export accountability before the final
      release gate passed. `IRK-97` and `IRK-102` are complete locally. The
      next Milestone 4 implementation work can start from the issues unblocked
      by the diagnostic taxonomy and generated-reference contracts; previously
      blocked observability and studio-readiness work should still respect
      their specific Linear blockers.

### Milestone 250: Studio Product Vision Documentation Scope

- [x] Re-read the engineering philosophy, platform roadmap, current checklist,
      and relevant product-planning context before changing Linear issues.
- [x] Define the documentation outputs needed to clarify the studio/CMS product
      vision, default author experience, TPM collaboration mode, complex
      publisher mode, and provider/adapter boundaries.
- [x] Verify the scope is documentation-only and leaves Linear issue updates
      for a later pass.
      This pass will add a focused studio product vision doc, update roadmap
      and philosophy docs only where needed, and leave Linear issue creation or
      edits for a later approval step.

### Milestone 251: Studio Product Vision And Adapter Architecture Docs

- [x] Write the product vision docs that describe target users, default UX,
      power-user UX, complex publisher UX, media/source/workflow/deploy
      boundaries, and end-product non-goals.
- [x] Define the adapter architecture clearly enough to prevent GitHub,
      repo-local assets, Cloudflare, or review workflows from becoming hidden
      platform assumptions.
- [x] Critique and iterate on the docs until the vision is concrete enough to
      drive later issue updates without overplanning unknown publisher
      workflows.
      Added `agent-docs/STUDIO_PRODUCT_VISION.md` and
      `agent-docs/STUDIO_ADAPTER_MODEL.md`. The docs define three product
      modes, default editorial UX, provider-neutral adapter categories,
      capability-driven UI/CLI/MCP behavior, media materialization, and a later
      issue-translation checklist.

### Milestone 252: Roadmap And Philosophy Alignment

- [x] Update the platform roadmap so the long-term studio, CLI, MCP, media,
      source, workflow, and deployment plans reflect the clarified product
      model.
- [x] Update the engineering philosophy only where needed so future agents
      preserve the clarified product boundaries and adapter discipline.
- [x] Verify the updated docs agree with each other and do not create stale
      parallel sources of truth.
      Updated `agent-docs/PLATFORM_ROADMAP.md`,
      `agent-docs/ENGINEERING_PHILOSOPHY.md`, and `AGENTS.md` so the roadmap,
      repo philosophy, and agent operating manual point to the new studio
      vision. After review, the engineering philosophy keeps the general
      "intent before mechanics" principle, while concrete GitHub, Cloudflare,
      repo-local media, and review-workflow guidance lives in the studio docs.

### Milestone 253: Studio Vision Documentation Verification

- [x] Run focused documentation checks for the new and updated docs.
- [x] Inspect the docs for ambiguity, bad assumptions, missing blockers, and
      unclear sequencing before handoff.
- [x] Update this checklist with completion notes and leave Linear issues
      untouched until the user approves issue updates.
      Verified with `bun --silent run review:markdown` and `git diff --check`.
      The final pass replaced remaining physical `site/` assumptions with the
      broader site workspace model, reframed older Git-backed workflow language
      as provider-specific adapter work, and left Linear issue updates
      untouched for the next planning step.

### Milestone 254: Progressive Adoption And Extension Scope

- [x] Re-read the studio vision, adapter model, roadmap extension section, and
      current product-planning notes about default-to-enterprise user journeys.
- [x] Define the documentation updates needed for progressive adoption, domain
      setup boundaries, bundled extensions, custom UI components, and
      extension/package seams.
- [x] Verify this remains a documentation/design pass only, with no Linear
      issue updates or implementation changes.
      This pass will add a focused studio extension model doc, update the
      studio product vision with the adoption ladder and domain boundaries, and
      align the roadmap extension milestone around concrete bundled and custom
      extension examples.

### Milestone 255: Studio Extension Architecture Documentation

- [x] Write or update docs that define core, official bundled extensions,
      optional official extensions, site extensions, and third-party/custom
      extensions.
- [x] Capture extension contracts for UI components, deploy providers, media
      providers, PDF generation, metadata profiles, importers, verifiers, and
      diagnostics.
- [x] Critique the model against concrete examples such as Patreon/Discord
      buttons, PDF generation, Cloudflare deploy, GitHub Pages/CNAME, and
      custom MDX/editor components.
      Added `agent-docs/STUDIO_EXTENSION_MODEL.md` and linked it from
      `AGENTS.md`. The model defines core, bundled default, optional official,
      site, and third-party extension classes, plus manifest, capability,
      UI-component, artifact, deploy/domain, migration, and trust contracts.

### Milestone 256: Progressive Adoption Roadmap Alignment

- [x] Update the studio product vision so the default journey can upgrade from
      local one-click publishing to backup, external media, collaboration,
      automated publishing, and complex publisher integrations.
- [x] Update the platform roadmap and related docs so extension architecture,
      adapters, domain setup, and migration tooling support the adoption ladder.
- [x] Verify the docs explain what is core, what is bundled by default, and
      what should remain replaceable.
      Updated `agent-docs/STUDIO_PRODUCT_VISION.md`,
      `agent-docs/STUDIO_ADAPTER_MODEL.md`, and
      `agent-docs/PLATFORM_ROADMAP.md` with the adoption ladder, domain setup
      boundary, extension linkages, concrete bundled-extension candidates, and
      migration hooks for backup, media, collaboration, and automated publish.

### Milestone 257: Extension Vision Documentation Verification

- [x] Run focused documentation checks for the new and updated docs.
- [x] Inspect the docs for overfitting, overgeneralization, ambiguous extension
      boundaries, and missing migration paths.
- [x] Update this checklist with completion notes and leave Linear issue
      updates for the later planning pass.
      Verified with `bun --silent run review:markdown` and `git diff --check`.
      The final pass added the default Cloudflare launch scenario while keeping
      Cloudflare as a bundled deploy extension, not core. Linear issue updates
      remain intentionally untouched.

### Milestone 258: Milestone 5 Parallel Track Planning

- [x] Re-read the engineering philosophy, platform roadmap, studio product
      vision, adapter model, extension model, and the unblocked Milestone 5
      Linear issues before changing docs.
- [x] Break `IRK-112`, `IRK-118`, `IRK-126`, and `IRK-129` into granular
      checklist milestones with explicit design outputs and verification.
- [x] Verify the Milestone 5 parallel track only covers work that does not
      depend on unfinished Milestone 4 issues.
      The active Milestone 5 track is limited to `IRK-112`, `IRK-118`,
      `IRK-126`, and `IRK-129`; extension architecture, security enforcement,
      starter templates, and studio architecture remain downstream or
      prep-only until their blockers are complete.

### Milestone 259: IRK-112 Package Boundary And Extraction Criteria Design

- [x] Inventory internal extraction candidates across config, routes, compiler,
      metadata, references, media, interactions, generated-output verification,
      diagnostics, testing, and performance tooling.
- [x] Define portability targets, extraction readiness criteria, current
      consumers, dependency boundaries, and missing blockers for each candidate.
- [x] Verify the candidate matrix rejects vague package extraction and is
      traceable to the roadmap and engineering philosophy.
      Added `docs/PACKAGE_BOUNDARIES_AND_EXTRACTION_CRITERIA.md` with a
      boundary ladder, readiness criteria, candidate matrix, explicit
      non-candidates, dependency rules, and verification plan for later
      entrypoint/package work.

### Milestone 260: IRK-118 Deployment Adapter And Release Artifact Design

- [x] Define deployment adapter inputs, outputs, capability reporting,
      credential requirements, dry-run behavior, unsupported-operation
      diagnostics, and provider-owned manual steps.
- [x] Define the release artifact contract for route, redirect, metadata,
      payload, dependency, generated-output, launch-step, provider diagnostic,
      and release-health reports.
- [x] Verify Cloudflare remains the reference bundled adapter while static
      folder export and GitHub Pages-style deployments remain possible through
      the same contract.
      Added `docs/DEPLOYMENT_ADAPTER_CONTRACT.md` with release artifact
      schema groups, adapter request/result contracts, capability reporting,
      product actions, provider profiles, diagnostics, and implementation
      verification fixtures.

### Milestone 261: IRK-126 Import/Export And Preservation Design

- [x] Define canonical import/export envelopes for content, authors, taxonomy,
      collections, assets, redirects, citations, PDFs, generated metadata, and
      platform diagnostics.
- [x] Define source maps, preservation records, migration reports, human-review
      queues, and stable/experimental field policy for migration tooling.
- [x] Verify the format supports round-trip fixtures and legacy-source
      migration without turning migrations into one-off scripts.
      Added `docs/IMPORT_EXPORT_AND_PRESERVATION_POLICY.md` with a canonical
      export envelope, record kinds, source maps, preservation states, review
      queues, asset/citation policies, security constraints, and round-trip
      verification plan.

### Milestone 262: IRK-129 Localization Contract Design

- [x] Define locale, language, text direction, formatting, route-prefix,
      feed/sitemap, metadata, PDF, alternate-route, and localized-label
      contracts.
- [x] Identify current English/date/string assumptions that future
      implementation must migrate behind typed locale helpers or config.
- [x] Verify single-locale sites stay simple while non-English, multilingual,
      and RTL fixture states have a clear path.
      Added `docs/LOCALIZATION_CONTRACTS.md` with locale profiles, content
      locale behavior, route modes, metadata propagation, label registry,
      formatting policy, RTL considerations, diagnostics, and fixture plan.

### Milestone 263: Milestone 5 Parallel Track Verification

- [x] Run focused documentation checks for the new Milestone 5 design docs.
- [x] Review the docs together for consistency, missing blockers, premature
      implementation promises, and conflicts with the studio adapter/extension
      model.
- [x] Update this checklist with completion notes and leave downstream
      implementation issues blocked until their design dependencies are done.
      Verification passed with `bun --silent run review:markdown` and
      `git diff --check`. The four design docs stay at the contract/planning
      layer and leave implementation, packaging, adapters, migrations, and
      localization fixtures to downstream issues.

### Milestone 264: Metadata Schema Contract Audit And Enforcement

- [x] Audit every emitted metadata surface against authoritative contracts:
      Schema.org JSON-LD, Google structured data, Google Scholar, Open Graph,
      Twitter cards, RSS, sitemap, canonical URLs, and robots metadata.
- [x] Document the metadata schema contracts in `docs/` with authoritative
      source links, required fields, recommended fields, source data,
      fallbacks, and enforcement strategy.
- [x] Fix the known `ProfilePage.mainEntity` rich-result issue and any other
      concrete metadata defects found during the audit.
- [x] Add typed metadata builders, validators, verifier checks, or tests that
      make documented metadata contracts difficult or impossible to violate.
- [x] Run focused metadata verification and the relevant release checks before
      marking the milestone complete.
