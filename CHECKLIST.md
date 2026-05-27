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
