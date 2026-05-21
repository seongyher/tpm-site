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
