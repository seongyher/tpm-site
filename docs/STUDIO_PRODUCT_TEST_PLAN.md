# Studio Product Test Plan

This document is the design packet for `IRK-139`: the mocked-provider studio
product test plan that should exist before a real static blog studio ships.

This is a planning document. It does not implement mocked providers or the real
test suite. Later studio, adapter, CLI, GUI, MCP, and CI milestones own
implementation.

Related documents:

- [STUDIO_EDITING_SURFACES.md](./STUDIO_EDITING_SURFACES.md)
- [STUDIO_PROVIDER_CAPABILITY_MATRIX.md](./STUDIO_PROVIDER_CAPABILITY_MATRIX.md)
- [STUDIO_PUBLISH_WORKFLOWS.md](./STUDIO_PUBLISH_WORKFLOWS.md)
- [HEADLESS_STUDIO_CORE_CONTRACT.md](./HEADLESS_STUDIO_CORE_CONTRACT.md)
- [TEST_MATRIX_AND_FIXTURE_STRATEGY.md](./TEST_MATRIX_AND_FIXTURE_STRATEGY.md)

## Goals

1. Map high-risk product workflows to fixtures before implementation.
2. Require mocked source, media, workflow, build, deploy, identity, and
   observability providers.
3. Prove GUI, CLI, MCP, and CI consume the same contracts.
4. Cover accessibility, data-loss, offline/recovery, credential, provider, and
   output-parity risks.
5. Assign later implementation ownership by milestone.

## Test Personas

| Persona                      | Risk to cover                                                |
| ---------------------------- | ------------------------------------------------------------ |
| Default local author         | accidental data loss, confusing diagnostics, publish failure |
| Site owner                   | bad config, metadata regression, provider credential issues  |
| TPM-like collaborator        | source conflicts, review workflow, repo/media assumptions    |
| Operator                     | deploy, rollback, release health, credential scope           |
| Power user                   | source view, advanced metadata, imports, migrations          |
| Complex publisher integrator | unsupported capabilities, custom providers, workflow engines |
| Agent/automation user        | unsafe writes, secret leakage, interface drift               |

## Mock Providers

The test suite should provide network-free mock providers for:

- local source;
- Git-like source/history;
- app-managed local history;
- local media;
- external media with materialization;
- external media without materialization;
- direct workflow;
- review workflow;
- local build;
- preview deploy;
- production deploy;
- rollback-capable deploy;
- rollback-limited deploy;
- credential states;
- observability import.

Each mock provider should expose both happy-path and failure capabilities.

## Core Workflow Tests

| Workflow             | Required assertions                                        | Owning milestones |
| -------------------- | ---------------------------------------------------------- | ----------------- |
| Create first site    | workspace created, defaults valid, no provider required    | 11, 12            |
| Create article draft | source reference, draft state, no publish leak             | 8, 12             |
| Edit metadata        | schema descriptors, diagnostics, generated-output effects  | 8, 12             |
| Add media            | media ID, alt/caption policy, materialization diagnostics  | 10, 12            |
| Preview route        | same core artifacts as CLI, media fallbacks visible        | 8, 11, 12         |
| Check site           | diagnostics match CLI/CI, stable source references         | 8, 11             |
| Direct publish       | release artifact, provider plan, audit, public URL         | 10, 12            |
| Optional review      | submit/approve/request changes without Git assumptions     | 10, 12            |
| Rollback             | rollback plan, provider limits, restore notes              | 10, 12            |
| Migration            | dry-run plan, source/media diffs, rollback/export snapshot | 12                |
| MCP proposed edit    | read-only default, plan/apply gate, audit                  | 13                |

## Failure And Recovery Tests

Required scenarios:

- blocking source diagnostics;
- missing image;
- oversized media;
- external media cannot be materialized;
- unsupported MDX component;
- provider unavailable;
- insufficient credential scope;
- revoked credential;
- disabled extension;
- unsupported preview;
- unsupported rollback;
- source conflict;
- stale apply plan;
- partial migration;
- interrupted publish;
- corrupt local draft cache;
- no network.

Each failure should produce a repairable diagnostic or an explicit limitation.

## Accessibility And UX Tests

Future GUI tests should cover:

- keyboard-only article editing;
- keyboard-only provider connection and publish plan review;
- screen-reader labels and descriptions for diagnostics;
- focus restoration after modal/panel/preview actions;
- long titles, long filenames, and long diagnostics;
- narrow desktop and mobile-sized layouts where applicable;
- autosave status and recovery messages;
- no hidden required actions available only through pointer interaction.

## Security Tests

Required security assertions:

- no credentials in source;
- no credentials in generated output;
- no credentials in release reports;
- no credentials in CLI JSON;
- no credentials in MCP responses;
- no raw provider logs with secrets;
- third-party extensions cannot access credentials without scope;
- publish and provider mutations require plan/apply gates;
- destructive operations require strongest confirmation.

## Output-Parity Tests

The same source fixture and operation request should produce equivalent core
results when reached through GUI, CLI, MCP, and CI.

Artifacts to compare:

- diagnostics;
- source diffs;
- route preview targets;
- metadata summaries;
- media materialization reports;
- release artifacts;
- provider plans;
- audit events.

Interface-specific rendering may differ. Canonical operation results should not.

## Test Gate Placement

Suggested placement:

- fast unit and contract tests: local development and PR;
- fixture provider tests: PR and release;
- GUI smoke tests: PR for critical flows, full suite in release;
- a11y tests: PR for core surfaces, full suite in release;
- security redaction tests: PR and release;
- full provider matrix: release and nightly-style checks;
- performance-sensitive preview tests: release and targeted runs.

## Later Ownership

- Milestone 8: operation core fixtures and CLI vertical slice tests.
- Milestone 10: provider capability runtime and mock provider contracts.
- Milestone 11: read-only GUI status/check/diagnostics tests.
- Milestone 12: real authoring, preview, release, publish, rollback, and
  migration tests.
- Milestone 13: MCP resource/tool safety and parity tests.
- Milestone 14: packaging, extraction, public API, and distribution tests.

## Handoff

Implementation should start with mocked providers and deterministic fixtures,
not real credentials or live provider calls. The first production GUI slice is
only ready when its behavior can be proven with this matrix or a documented
subset of it.
