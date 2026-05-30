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

## Active Milestone 15: Studio GUI MVP Design And Implementation Handoff

This pass completes Linear Milestone 15 through the designer-facing
Figma-ready screen specification, consolidated engineering design
specification, and implementation handoff for the next fixture-backed GUI
prototype milestone. It is design and research work only: no real source
writes, file-open/save implementation, credentialed publish flow, or backend
operation wiring should be added here.

### M15.0 Planning And Source Refresh

- [x] Re-read the Milestone 15 Linear issues and current Studio, roadmap,
      engineering philosophy, component, adapter, operation, and Tauri docs.
- [x] Review current Studio shell/dependency state and the visual references
      provided for this milestone.
- [x] Research current UI/editor/Tauri dependency options from authoritative
      sources before making build-vs-buy recommendations.
- [x] Keep this checklist updated issue-by-issue and add finer milestones if
      the design work reveals missing steps.

### M15.1 IRK-231 Product Definition

- [x] Write the Studio GUI MVP product brief covering scope, user promise,
      non-goals, fixture-backed prototype definition, source constraints, and
      acceptance criteria.
- [x] Review the product brief for audience fit, scope creep, missing
      non-goals, contradiction with existing roadmap docs, and readiness for
      downstream visual/flow work; refine until no useful improvements remain.
- [x] Verify the product definition satisfies `IRK-238` through `IRK-241`.

### M15.2 IRK-232 Visual Language

- [x] Write the Studio GUI visual language spec covering reference analysis,
      palette, typography, spacing, surfaces, controls, tooltips, keyboard
      hints, motion, validation, errors, and recovery presentation.
- [x] Review the visual spec for designer usability, consistency with the
      provided visual references, accessibility, meaningful color use,
      non-copying language, and concrete token guidance; refine until stable.
- [x] Verify the visual language satisfies `IRK-242` through `IRK-245`.

### M15.3 IRK-233 Navigation And Screen States

- [x] Write the Studio GUI navigation flow and screen-state inventory covering
      startup, exact session restore, project home, sidebar/tree, article
      editing, settings, media, preview, publish, autosave, failure, and
      recovery flows.
- [x] Review the flow inventory for happy-path bias, missing empty/loading/
      dirty/invalid/blocked states, user-language clarity, and implementation
      relevance; refine until complete.
- [x] Verify the screen-state inventory satisfies `IRK-246` through
      `IRK-250`.

### M15.4 IRK-234 Dependency And Build-Vs-Buy Decisions

- [x] Write the dependency decision report covering Astro/React, shadcn/Radix,
      editor options, file tree/context menu/command palette/hotkeys, Tauri
      plugins, and hand-rolled domain-policy boundaries.
- [x] Review the dependency report for source-backed claims, hidden bundle/
      accessibility/security risks, premature lock-in, and unclear fallback
      paths; refine until implementation-ready.
- [x] Verify the dependency decisions satisfy `IRK-251` through `IRK-255`.

### M15.5 IRK-235 Component Architecture

- [x] Write the Studio GUI component architecture spec covering app shell,
      pane layout, sidebar/tree, editor/frontmatter/preview, settings, media,
      publish, feedback, props/data shapes, state ownership, and accessibility
      responsibilities.
- [x] Review the component spec for oversized components, unclear ownership,
      missing sub-components, weak responsive behavior, and poor test seams;
      refine until developers can implement without guessing.
- [x] Verify the component architecture satisfies `IRK-256` through
      `IRK-260`.

### M15.6 IRK-236 Fixture, State, And Operation Shapes

- [x] Write the fixture/state model covering projects, session restore,
      articles, frontmatter descriptors, settings, media, preview, publish,
      credential, recovery, autosave, validation, and operation mapping.
- [x] Review the fixture/state spec for throwaway frontend-only models,
      invalid state, missing transition guards, weak source-truth boundaries,
      and drift from Rust/Tauri operation contracts; refine until stable.
- [x] Verify the fixture/state model satisfies `IRK-261` through `IRK-264`.

### M15.7 IRK-268 Designer And Figma Handoff

- [x] Write the Figma-ready designer handoff package with plain-English
      product brief, glossary, visual reference annotations, frame list,
      dimensions, layout anatomy, color palette, components, states,
      interactions, tooltips, copy examples, and acceptance criteria.
- [x] Review the Figma handoff as if handed to a designer with no technical
      context: check ambiguity, missing frames, missing states, unclear visual
      tokens, weak annotations, and gaps between product flows and mockup
      requirements; refine until no useful improvements remain.
- [x] Verify the designer handoff satisfies `IRK-269` through `IRK-275`.

### M15.8 Linear And Handoff

- [x] Attach relevant design documents to the corresponding Linear issues and
      any other issues where the documents are useful context.
- [x] Move completed Milestone 15 issues through `IRK-268` and their completed
      child issues to In Review.
- [x] Leave `IRK-276` and `IRK-237` untouched unless the user explicitly asks
      to continue from Figma handoff into engineering implementation handoff.
- [x] Summarize completed documents, remaining milestone 15 work, and any
      open risks.

### M15.9 Generated Visual Reference Refinement

- [x] Import the generated Studio GUI reference images into repo-tracked docs
      assets with stable descriptive filenames.
- [x] Re-review all Milestone 15 design docs against the new visual reference
      set and refine only where it improves handoff quality.
- [x] Update the designer handoff so the generated Studio mockups are the
      primary visual reference and Codex remains only secondary polish
      inspiration.
- [x] Verify the revised docs and checklist with focused documentation checks.
- [x] Attach the new visual reference assets and updated docs to the relevant
      Linear issues, then add a project/status note describing the refinement.

### M15.10 Rough Studio Mockup Reference Refinement

- [x] Inspect the rough Studio mockup visually with Playwright and screenshots,
      noting what is useful direction versus generated/mockup noise.
- [x] Import the rough mockup screenshots into repo-tracked docs assets with a
      clear folder name and stable descriptive filenames.
- [x] Re-review the Studio GUI MVP docs against the rough mockup and refine
      only where it improves designer or implementation handoff quality.
- [x] Verify the revised docs and checklist with focused documentation checks.
- [x] Attach the rough mockup references and any updated docs to the relevant
      Linear issues, then add a project/status note describing the refinement.

### M15.11 Improved Studio Mockup Reference Refinement

- [x] Run the improved Studio mockup in an isolated temp workspace and capture
      Playwright screenshots for key screens.
- [x] Read the improved mockup source to extract design intentions, screen
      states, and interaction ideas without treating prototype code as an
      implementation plan.
- [x] Import the improved mockup screenshots into repo-tracked docs assets with
      a clear folder name and stable descriptive filenames.
- [x] Re-review the Studio GUI MVP docs against the improved mockup, with
      special attention to the article directory/browser design.
- [x] Verify the revised docs and checklist with focused documentation checks.
- [x] Attach the improved mockup references and any updated docs to the
      relevant Linear issues, then add a project/status note describing the
      refinement.

### M15.12 IRK-276 Consolidated Engineering Design Specification

- [x] Read the completed Milestone 15 product, visual, navigation,
      dependency, component, fixture, Figma handoff, visual reference, Studio
      core, Tauri, and roadmap docs.
- [x] Write the engineering-facing Studio GUI MVP design specification,
      consolidating final scope, non-goals, screen inventory, visual tokens,
      dependency decisions, component hierarchy, fixture/state model,
      operation mapping, accessibility, keyboard, responsive, tooltip, context
      menu, validation, and error/recovery requirements.
- [x] Objectively review the engineering spec for implementation ambiguity,
      missing states, contradictions with the designer handoff, weak operation
      boundaries, oversized component risks, missing test seams, and scope
      creep; refine until developers can start the prototype without guessing.
- [x] Verify the engineering spec with focused documentation checks before
      updating Linear.

### M15.13 IRK-237 And IRK-265 Implementation Handoff Plan

- [x] Read the completed engineering design specification and relevant
      fixture, parity, Tauri, product-test, and dependency docs.
- [x] Write the next implementation milestone handoff plan, including the
      milestone name, goal, definition of done, implementation issue
      breakdown, sequencing, blockers, dependency setup plan, fixture plan,
      visual QA, accessibility, keyboard, responsive, tooltip, context menu,
      and screenshot test plan.
- [x] Objectively review the handoff for fake precision, missing blockers,
      unsafe implementation scope, missing non-goals, weak QA gates, and
      unclear parallelization; refine until it is ready to create or update
      Linear implementation issues.
- [x] Verify the handoff with focused documentation checks before updating
      Linear.

### M15.14 Linear And Final Milestone Verification

- [x] Attach the consolidated engineering spec and implementation handoff docs
      to `IRK-276`, `IRK-237`, `IRK-265`, and any other Linear issues where
      they are useful context.
- [x] Move completed Milestone 15 remaining issues to In Review.
- [x] Run final focused verification for the Milestone 15 docs and checklist.
- [x] Summarize Milestone 15 completion, remaining risks, and the next
      implementation milestone.

## Active Milestone 14: Packaging, Extraction, And Public Distribution

This pass implements Linear Milestone 14 issue-by-issue. The goal is to turn
proven Rust, CLI, MCP, Tauri, and platform seams into documented, verified,
distribution-ready boundaries without publishing premature packages or leaking
TPM-specific assumptions.

### M14.0 Context And Design Synthesis

- [x] Re-read Milestone 14 Linear issues, package-boundary docs, release
      governance, Rust workspace/tooling docs, CLI product contract, Tauri
      studio docs, MCP safety/resource docs, and the platform roadmap.
- [x] Design the implementation order, public/private boundary criteria,
      compatibility policy, examples, release pipeline checks, Tauri packaging
      plan, advanced Rust QA policy, and final readiness gate.
- [x] Review and refine the design until implementation can proceed without
      premature extraction or hidden public API commitments.

### IRK-204: Identify Proven Package And Crate Extraction Candidates

- [x] Audit current Rust crates, platform entrypoints, examples, docs, CLI,
      MCP, Tauri, and operation contracts for actual consumer evidence.
- [x] Classify candidates as public, private-package-like, internal-only,
      deferred, or rejected with reasons and revisit triggers.
- [x] Update package-boundary documentation with current Milestone 14
      decisions and verification expectations.
- [x] Verify docs and focused boundary checks before updating Linear.

### IRK-205 And IRK-216: Public API Docs And Compatibility Checks

- [x] Define the public API/stability contract for any accepted public or
      externally consumed Rust/package boundaries.
- [x] Add or document compatibility checks such as semver/API checks only where
      a real public compatibility promise exists.
- [x] Keep internal crates and repo-only tools out of fake public API policy.
- [x] Verify focused Rust/docs checks before updating Linear.

### IRK-206: External Consumer Examples

- [x] Add or update external consumer examples for accepted public/stable
      entrypoints without TPM content, routes, branding, or private paths.
- [x] Add verification proving examples consume only stable/public seams and do
      not drift.
- [x] Document the example contract and handoff expectations.
- [x] Verify focused example, docs, and release-facing checks before updating
      Linear.

### IRK-207: CLI Release Pipeline And Generated Command Documentation

- [x] Design the CLI distribution slice, supported artifact expectations,
      generated/help documentation, smoke tests, and install/update docs.
- [x] Add generated or checked CLI command documentation from the actual CLI
      command model.
- [x] Add reproducible local release/smoke checks for the current CLI binary
      without turning repo `just` recipes into product CLI behavior.
- [x] Verify focused CLI, docs, and Rust checks before updating Linear.

### IRK-208: Tauri Studio Packaging, Signing, And Update Plan

- [x] Define platform targets, unsigned local packaging checks,
      signing/notarization/update-channel requirements, and credential policy.
- [x] Add or document Tauri packaging verification that is safe without
      private signing credentials.
- [x] Document packaged-app smoke tests for startup, status, diagnostics, and
      authoring workflows.
- [x] Verify focused Studio/Tauri/docs checks before updating Linear.

### IRK-215, IRK-217, And IRK-218: Advanced Rust QA Hardening

- [x] Evaluate public API, Miri, sanitizer, fuzzing, mutation, dependency
      cleanup, unsafe inventory, and binary-size tooling against current crate
      maturity and false-positive cost.
- [x] Adopt low-noise commands or review-only policies where useful, with
      clear promotion triggers and ownership.
- [x] Reject or defer noisy/theatrical checks with concrete reasons.
- [x] Verify focused Rust/docs checks before updating Linear.

### IRK-209: Public Distribution Readiness Verification

- [x] Add a single distribution-readiness checklist/report covering package
      boundaries, examples, CLI artifacts/docs, Tauri packaging, security,
      supply chain, release governance, and TPM-leakage risks.
- [x] Add or wire focused verification into `just` where practical without
      overloading the normal release gate with noisy optional tools.
- [x] Run focused checks plus release checks, fix issues, attach docs to
      relevant Linear issues, and move completed issues to In Review.

## Active Milestone 12: Studio Authoring, Preview, Release, And Publish

This pass implements Linear Milestone 12 issue-by-issue. The goal is to move
the Studio from a read-only shell to operation-backed authoring, media,
preview, release, publish, rollback, credential, and audit workflows without
creating a GUI-only CMS/source model.

### M12.0 Design Synthesis And Scope

- [x] Re-read Milestone 12 Linear issues, studio editing/publish/provider
      docs, headless core contract, parity fixture strategy, Rust operation
      contracts, and Rust engineering guidance.
- [x] Design the Milestone 12 operation slice, payloads, GUI surfaces, CLI/Tauri
      bindings, plan/apply safety, diagnostics, fixtures, and verification
      gates.
- [x] Review and refine the design until the implementation can proceed
      without hidden blockers or a second studio model.

### IRK-190: Schema-Driven Site Settings Surfaces

- [x] Model settings descriptors from site/config intent with schema/default/
      diagnostic metadata and provider capability effects.
- [x] Render settings in the Studio from operation payload data and keep
      unsupported or write-requiring controls capability-aware.
- [x] Add focused tests proving settings descriptors are deterministic,
      source-referenced, and not GUI-only state.
- [x] Verify focused Rust, Studio, and docs checks before updating Linear.

### IRK-191: Content List And Source-Faithful Markdown/MDX Editor

- [x] Model content inventory, editor documents, source references, draft/write
      plan state, source-diff metadata, and conflict/data-loss diagnostics.
- [x] Render content list and editor/source-view surfaces in the Studio without
      rewriting Markdown or MDX source.
- [x] Add focused tests for deterministic content listing, source fidelity,
      plan/apply gating, and GUI operation consumption.
- [x] Verify focused Rust, Studio, and docs checks before updating Linear.

### IRK-192: Media Library And Media Reference Picker

- [x] Model media library entries, usage, alt/caption policy, reference picker
      choices, materialization status, and provider capability diagnostics.
- [x] Render media library and picker surfaces in the Studio from operation
      payload data.
- [x] Add focused tests for repo-local, missing, unsupported, and
      materialization-required media states.
- [x] Verify focused Rust, Studio, and docs checks before updating Linear.

### IRK-193: Preview Orchestration With Output Parity

- [x] Model diagnostics-only, route-preview, artifact-preview, and full-build
      preview plans over the shared operation/build contracts.
- [x] Render preview status, route/artifact targets, media requirements,
      generated-output effects, and parity warnings in the Studio.
- [x] Add focused tests proving preview output is deterministic and tied to
      release/build contracts rather than GUI-only simulation.
- [x] Verify focused Rust, Studio, and docs checks before updating Linear.

### IRK-194: Release Manifest, Health Report, And Publish Plan View

- [x] Model release manifests, health reports, affected routes/assets/metadata,
      provider capabilities, manual steps, and publish plans.
- [x] Render release and publish-plan review surfaces in product language with
      no credential requirement for dry-run review.
- [x] Add focused tests proving CLI/GUI consume the same publish-plan payloads
      and provider limitations are visible.
- [x] Verify focused Rust, Studio, and docs checks before updating Linear.

### IRK-195: Publish Apply, Rollback, Credentials, And Audit Logs

- [x] Model explicit apply gates, credential references, rollback plans,
      restore notes, audit events, failed publish states, and recovery paths.
- [x] Render apply/rollback/audit surfaces in the Studio while keeping secret
      values redacted and provider-specific behavior behind adapters.
- [x] Add focused tests for approval requirements, credential redaction, audit
      records, rollback limitations, and failed-publish recovery.
- [x] Verify focused Rust, Studio, and docs checks before updating Linear.

### IRK-196: Verify Studio Authoring And Publish Product Workflows

- [x] Add product-level workflow verification over settings, content, media,
      preview, release, publish, rollback, diagnostics, and capability states.
- [x] Add/update docs for the implemented Milestone 12 operation and GUI slice.
- [x] Run focused checks plus release checks, fix issues, attach docs to
      relevant Linear issues, and move completed issues to In Review.

## Active Milestone 11: Tauri/Astro Studio Shell And Read-Only Product Slice

This pass implements as much of Linear Milestone 11 as can be completed before
the next real blocker. Work proceeds issue-by-issue so later GUI slices consume
the same Rust operation contracts as the CLI instead of creating a parallel
CMS/source model.

### IRK-184: Create Astro Studio Frontend Shell

- [x] Design the static Astro studio shell, including layout, read-only
      invariants, fixture/mock strategy, command surface, responsive behavior,
      accessibility requirements, and verification gates.
- [x] Review and refine the design until it is implementation-ready and does
      not imply editing, provider, credential, or publish behavior.
- [x] Add the studio frontend app structure and static shell.
- [x] Add command-router recipes for building, developing, and previewing the
      studio shell without reintroducing package scripts.
- [x] Add focused tests or configuration checks proving the shell is static,
      fixture-friendly, and separate from the current site source model.
- [x] Verify the shell build and relevant docs/check gates, then update
      Linear with status and documentation links.

### IRK-185: Create Tauri Shell With Minimal Capabilities

- [x] Reassess blockers after IRK-184, read current Tauri guidance, and decide
      whether the minimal shell can be implemented cleanly in this pass.
- [x] If unblocked, design the Tauri shell, capability files, security
      assumptions, and verification gates.
- [x] If unblocked, implement the minimal Tauri shell and static frontend
      packaging.
- [x] Verify the Tauri shell build, strict Rust gate, cargo-deny policy,
      focused config tests, and documentation updates.
- [x] Update Linear with status and documentation links.

### IRK-186: Generate Or Validate Frontend Operation Types

- [x] Design the frontend operation type strategy so the studio shell consumes
      Rust-owned operation envelopes without a parallel GUI source or
      diagnostic model.
- [x] Replace the hand-maintained frontend operation interface with a
      Rust-shaped JSON operation fixture and a thin TypeScript import adapter.
- [x] Refactor the studio shell components to render the shared operation
      envelope while preserving the component-first Astro/Tailwind structure.
- [x] Add Rust validation proving the frontend fixture deserializes into
      `tpm-operations`, round-trips without unknown fields, and derives the
      expected status from diagnostics.
- [x] Update focused configuration tests and docs for the validated operation
      fixture strategy.
- [x] Verify the studio frontend, Tauri shell, Rust gates, and docs/check
      gates, then update Linear with status and documentation links.

### IRK-187 Through IRK-189: Later Read-Only GUI Slice

- [x] Reassess after IRK-186 and only proceed when the required operation-type
      binding conditions are satisfied.

### IRK-187: Bind Site Status And Check Site Through Tauri Commands

- [x] Design the read-only Tauri command boundary, including command names,
      operation mapping, workspace assumptions, permission posture,
      success/failure tests, and handoff to live rendering.
- [x] Register `site_status` and `check_site` Tauri commands as thin adapters
      over Rust operation functions with `OperationInterface::Gui`.
- [x] Add command tests covering successful fixture workspaces and diagnostic
      failure states without browser-side source parsing.
- [x] Update focused config tests and docs for command registration, command
      scope, and verification expectations.
- [x] Verify Studio build/typecheck, Tauri debug build, Rust gates, focused
      config tests, and docs/check gates, then update Linear with status and
      documentation links.

### IRK-188 Through IRK-189: Later Read-Only GUI Slice

- [x] Reassess after IRK-187 and only proceed when the required live command
      result rendering conditions are satisfied.

### IRK-188: Render Status And Diagnostics In The Studio GUI

- [x] Design the read-only operation rendering boundary, including static
      fallback, Tauri invoke behavior, loading/error/empty states,
      accessibility expectations, and verification gates.
- [x] Add the operation runtime panel and browser controller so the GUI renders
      fixture fallback in browser preview and live read-only Tauri operation
      results in the desktop shell.
- [x] Add focused tests for rendering state helpers, command wiring,
      accessibility markers, and the absence of a separate GUI diagnostic
      model.
- [x] Update docs and config tests for the live read-only rendering handoff.
- [x] Verify Studio build/typecheck, Tauri debug build, Rust gates, focused
      frontend tests, config tests, docs/check gates, then update Linear with
      status and documentation links.

### IRK-189: Verify CLI And GUI Consume The Same Operation Fixtures

- [x] Reassess after IRK-188 and only proceed when the GUI live-rendering slice
      is verified.
- [x] Design the CLI/GUI parity guard so it compares shared operation envelope
      data while allowing only intentional interface-specific request metadata.
- [x] Make the Studio fallback fixture a GUI projection of the shared Rust
      `workspace.status` operation fixture.
- [x] Add Rust tests proving the CLI JSON renderer emits the shared fixture and
      the GUI fixture remains the same operation data with `interface: gui`.
- [x] Update Studio parity docs and focused config tests for the fixture
      contract and non-goals.
- [x] Verify focused CLI/GUI parity tests, Studio checks, Rust gates, docs
      checks, and release checks, then update Linear with status and
      documentation links.

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

## Active Milestone 13: MCP Automation And Agent Safety

This pass implements as much of Milestone 13 as is currently unblocked. The
read-only MCP resource skeleton is startable now. Read-only tools and write
safety can only advance to the point where they consume the shared operation
model without inventing capability or publish/apply contracts that belong to
Milestones 10 and 12.

### Milestone 13.1: Read Relevant Contracts And Design Skeleton

- [x] Read the MCP safety model, headless core contract, Rust operation
      contracts, Rust engineering guide, and Linear issue details for
      `IRK-197`, `IRK-199`, `IRK-201`, `IRK-200`, `IRK-202`, and `IRK-203`.
- [x] Confirm which Milestone 13 issues are truly unblocked and record
      blockers for the rest.
- [x] Design the first read-only MCP resource skeleton around existing
      operation envelopes rather than a parallel MCP-only model.

### Milestone 13.2: Implement `IRK-197` Read-Only MCP Resources

- [x] Add an additive Rust MCP crate with read-only resource descriptors,
      permission defaults, response envelopes, and redaction summary.
- [x] Wrap existing operation artifacts as MCP resources for workspace status,
      site diagnostics, release inspection, media image report, and route
      redirect report.
- [x] Add unsupported adapter-capability resource diagnostics that defer to the
      future Milestone 10 capability registry.
- [x] Add tests for resource catalog shape, permission denial, operation
      wrapping, unsupported capability diagnostics, and redaction.
- [x] Update docs and verify focused Rust checks.

### Milestone 13.3: Advance Unblocked MCP Tool And Safety Work

- [x] Re-check `IRK-199` after `IRK-197`; implement only tool pieces that do
      not require the Milestone 10 capability registry.
- [x] Re-check `IRK-201` after `IRK-197`; implement only permission, audit, and
      redaction pieces that do not require identity/credential boundaries from
      Milestone 10.
- [x] Record remaining blockers for `IRK-199`, `IRK-201`, `IRK-200`,
      `IRK-202`, and `IRK-203`.

Remaining blocker notes:

- `IRK-199`: provider-aware adapter capability inspection still waits for
  `IRK-181`; the unblocked read-only status, diagnostics, resource catalog,
  and unsupported capability fallback are implemented.
- `IRK-201`: response-local read-only permission, redaction, and audit events
  are implemented; identity, credential references, persisted audit storage,
  and write/publish safety gates still wait for `IRK-180` and later
  plan/apply work.
- `IRK-200`: waits for `IRK-199` plus the release/publish plan model.
- `IRK-202`: waits for publish/apply maturity and the completed MCP safety
  model.
- `IRK-203`: waits for read-only and write-capable MCP surfaces plus GUI/CLI
  parity fixtures.

### Milestone 13.4: Linear And Handoff

- [x] Attach relevant docs to completed/partially advanced Milestone 13 issues.
- [x] Move completed issues to In Review and leave blocked issues in their
      correct state with blocker context.
- [x] Run appropriate final checks and summarize completed work plus remaining
      blockers.

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

## Active Docs Organization Pass

### Docs Organization 1: Structure And Move Plan

- [x] Inventory root-level docs and choose stable domain directories.
- [x] Move docs and reference assets into the new directory structure.
- [x] Inventory `agent-docs/` root files and choose planning/philosophy
      directories.
- [x] Move `agent-docs/` files into the new directory structure.

### Docs Organization 2: Reference Repair

- [x] Update AGENTS, README, COMMANDS, docs, code, and tests for new paths.
- [x] Add or update a docs index so future docs have an obvious home.
- [x] Add or update an `agent-docs/` index and repair references after the
      planning-doc moves.

### Docs Organization 3: Verification

- [x] Scan for stale old-path references.
- [x] Run docs checks and fix any issues.
- [x] Re-run stale reference scans and checks after `agent-docs/` reorg.
