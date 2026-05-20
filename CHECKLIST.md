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
- [x] Run the agreed preflight verification set and update Linear/checklist
      status after the milestone is verified.
