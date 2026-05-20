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
