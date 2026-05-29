# Studio Parity Fixture Strategy

This document is the design packet for `IRK-143`: the GUI, CLI, MCP, and CI
parity fixture strategy.

The goal is to keep every interface thin over the same headless studio core.
Interfaces can differ in presentation, interaction model, and permission
surface, but they must not drift into separate source, diagnostic, preview,
release, provider, or security implementations.

Related documents:

- [HEADLESS_STUDIO_CORE_CONTRACT.md](./HEADLESS_STUDIO_CORE_CONTRACT.md)
- [CLI_PRODUCT_CONTRACT.md](../cli/CLI_PRODUCT_CONTRACT.md)
- [STUDIO_MCP_SAFETY_MODEL.md](./STUDIO_MCP_SAFETY_MODEL.md)
- [STUDIO_PRODUCT_TEST_PLAN.md](./STUDIO_PRODUCT_TEST_PLAN.md)
- [TEST_MATRIX_AND_FIXTURE_STRATEGY.md](../qa/TEST_MATRIX_AND_FIXTURE_STRATEGY.md)

## Goals

1. Define shared fixtures for GUI, CLI, MCP, and CI.
2. Compare canonical operation results, not interface rendering details.
3. Document intentional interface differences.
4. Prevent any interface from bypassing validation, capability checks, safety
   gates, source ownership, diagnostics, or redaction.
5. Assign implementation ownership to later milestones.

## Fixture Shape

Each parity fixture should include:

- fixture ID;
- workspace input;
- provider profile;
- enabled extensions;
- operation request;
- expected core result;
- expected diagnostics;
- expected source diffs;
- expected artifacts;
- expected provider reports;
- expected audit events;
- interface-specific rendering assertions;
- safety and permission expectations.

The core result is the canonical oracle. GUI, CLI, MCP, and CI should all prove
they consume or render that result without changing its meaning.

## Required Fixture Families

| Fixture family   | Canonical operation                        | Interfaces                 |
| ---------------- | ------------------------------------------ | -------------------------- |
| Inspect site     | workspace status and source inventory      | GUI, CLI, MCP, CI          |
| Check source     | diagnostics-only validation                | GUI, CLI, MCP, CI          |
| Create draft     | local source write plan/apply              | GUI, CLI, MCP              |
| Edit metadata    | schema descriptor and patch validation     | GUI, CLI, MCP              |
| Add media        | media add/materialization plan             | GUI, CLI, MCP              |
| Preview route    | preview artifacts and diagnostics          | GUI, CLI, MCP, CI          |
| Prepare review   | workflow transition plan                   | GUI, CLI, MCP              |
| Publish plan     | release and provider action plan           | GUI, CLI, MCP, CI          |
| Publish apply    | gated provider mutation                    | GUI, CLI, MCP where scoped |
| Rollback plan    | release rollback or redeploy plan          | GUI, CLI, MCP, CI          |
| Import/export    | source preservation plan                   | CLI, GUI, MCP              |
| Migration        | dry-run/source/media/provider plan         | CLI, GUI, MCP              |
| Provider failure | credential/capability/provider diagnostics | GUI, CLI, MCP, CI          |
| Secret redaction | sanitized results                          | GUI, CLI, MCP, CI          |

## Intentional Differences

| Concern         | GUI                          | CLI                           | MCP                            | CI                      |
| --------------- | ---------------------------- | ----------------------------- | ------------------------------ | ----------------------- |
| Human rendering | rich panels, forms, previews | concise terminal text         | structured tool response       | logs and annotations    |
| Machine output  | internal typed state         | `--json` and `--format`       | tool/resource schema           | artifacts and reports   |
| Interaction     | buttons, forms, previews     | flags/prompts/non-interactive | plan/apply tools               | non-interactive         |
| Write approval  | UI confirmation and policy   | prompt or `--yes` with plan   | explicit apply tool and scopes | policy gate             |
| Publish         | guided plan and apply        | explicit publish command      | gated publish tool             | release/deploy step     |
| Secrets         | never visible                | never in output               | never in responses             | never in logs/artifacts |

Differences are acceptable only when they are presentation or permission
differences over the same core operation.

## Regression Rules

No interface may:

- create its own source model;
- bypass content schemas;
- bypass route or artifact ownership;
- bypass provider capability checks;
- bypass dry-run or approval gates;
- call deploy providers directly outside core adapters;
- hide blocking diagnostics;
- write generated output as source;
- leak secrets;
- silently change metadata, accessibility, performance, or generated-output
  policy.

Tests should fail if an interface produces a source diff, diagnostic, artifact,
provider plan, or audit event that disagrees with the core fixture without an
explicit accepted-difference record.

## Snapshot And Golden Policy

Golden fixtures should snapshot:

- core operation result JSON;
- stable diagnostics;
- source diffs;
- artifact summaries;
- release reports;
- provider capability reports;
- audit events;
- redaction summaries.

Avoid brittle snapshots of timestamps, provider IDs, absolute paths, terminal
colors, DOM positions, or localized prose unless the test specifically owns
that detail.

## Implementation Ownership

- Milestone 8: define operation fixture format and CLI/core parity for first
  read/check/preview operations.
- Milestone 10: add provider capability and mock-provider parity fixtures.
- Milestone 11: prove read-only GUI consumes core operation results. The first
  concrete guard is documented in
  [STUDIO_CLI_GUI_PARITY.md](./STUDIO_CLI_GUI_PARITY.md): the CLI JSON renderer
  emits the shared `workspace.status` fixture exactly, and the Studio fallback
  fixture is the same operation envelope with only `request.interface` changed
  to `gui`.
- Milestone 12: add authoring, preview, publish, rollback, migration, and GUI
  parity fixtures.
- Milestone 13: add MCP resources/tools and safety parity fixtures.
- Milestone 14: add package/API/distribution compatibility parity fixtures.

## Handoff

Implementation should begin with a small fixture runner that can execute a core
operation and hand the same result to CLI, GUI, MCP, and CI assertions. The
fixture runner should expand only when the underlying operation exists. It
should not simulate behavior that the core has not implemented.
