# Studio Authoring Operations

This document defines the Milestone 12 implementation slice for real Studio
authoring, preview, release, publish, rollback, credential, and audit
workflows.

Milestone 12 should move the Studio beyond read-only status panels, but it
must still preserve the core product rule: GUI, CLI, MCP, CI, and tests are
interfaces over the same operation contracts. The GUI may render forms,
editors, pickers, plans, and confirmations, but the source model, capability
policy, diagnostics, preview plans, publish plans, and audit records belong to
the shared operation core.

Related contracts:

- [HEADLESS_STUDIO_CORE_CONTRACT.md](./HEADLESS_STUDIO_CORE_CONTRACT.md)
- [STUDIO_EDITING_SURFACES.md](./STUDIO_EDITING_SURFACES.md)
- [STUDIO_PROVIDER_CAPABILITY_MATRIX.md](./STUDIO_PROVIDER_CAPABILITY_MATRIX.md)
- [STUDIO_PUBLISH_WORKFLOWS.md](./STUDIO_PUBLISH_WORKFLOWS.md)
- [STUDIO_PARITY_FIXTURE_STRATEGY.md](./STUDIO_PARITY_FIXTURE_STRATEGY.md)
- [RUST_ADAPTER_RUNTIME.md](../rust/RUST_ADAPTER_RUNTIME.md)

## Goals

1. Add deterministic operation payloads for settings, content, media, preview,
   release, publish, rollback, credentials, audit, and product verification.
2. Render those payloads in the Studio from shared operation results rather
   than GUI-local source state.
3. Keep source truth in the workspace and represent edits as source references,
   draft buffers, source diffs, dry-run plans, and explicit apply operations.
4. Use provider capability status to enable, disable, or explain actions before
   work starts.
5. Emit repairable diagnostics and redacted audit/credential data that can be
   consumed by CLI, GUI, MCP, CI, and tests.

## Non-Goals

1. Do not connect real provider credentials.
2. Do not publish to Cloudflare, GitHub, or any external provider.
3. Do not add a rich WYSIWYG editor dependency.
4. Do not rewrite Markdown or MDX source automatically.
5. Do not bypass the shared Rust operation envelope from the Studio frontend.

## Operation Families

Milestone 12 introduces Studio operation payloads under the existing
`OperationResult` envelope.

| Linear issue | Operation intent                      | Payload responsibility                                                        |
| ------------ | ------------------------------------- | ----------------------------------------------------------------------------- |
| `IRK-190`    | settings inspection and edit plan     | Field descriptors, defaults, source refs, capability effects                  |
| `IRK-191`    | content inventory and editor document | Content entries, Markdown/MDX source buffers, draft/write plans, source diffs |
| `IRK-192`    | media library and picker              | Media entries, usages, alt/caption policy, materialization state              |
| `IRK-193`    | preview orchestration                 | Preview modes, generated artifact targets, parity and capability diagnostics  |
| `IRK-194`    | release and publish plan              | Release manifest, health report, affected artifacts, provider action plan     |
| `IRK-195`    | apply/rollback/audit                  | Approval gates, credential references, rollback plan, audit events, recovery  |
| `IRK-196`    | product verification                  | Workflow checklist proving authoring and publishing surfaces stay coherent    |

The first implementation is provider-neutral and deterministic. It should use
mock provider profiles and the current workspace layout. Later real providers
can implement the same contracts without changing the GUI model.

## Source And Safety Model

Every authoring surface should expose:

- source reference;
- source status;
- editor visibility level;
- provider capability effects;
- generated-output effects;
- diagnostics;
- planned mutations, if any.

Mutating behavior must be plan-first:

1. inspect source and provider capabilities;
2. produce a deterministic dry-run plan;
3. show diagnostics, source diffs, provider effects, manual steps, and audit
   requirements;
4. require explicit approval before apply;
5. emit audit events and recovery notes.

The Studio can render disabled or simulated apply surfaces in this milestone,
but operation payloads must already make the approval, credential, capability,
rollback, and audit boundaries explicit.

## GUI Surface Requirements

The Studio frontend should stop labeling the authoring surfaces as merely
future/unavailable. It should render operation-backed panels for:

1. settings;
2. content and editor;
3. media;
4. preview;
5. release and publish plan;
6. apply, rollback, credentials, and audit;
7. workflow verification.

Each panel should show source/capability-backed data, not instructions about
how the feature will work someday. Controls that would mutate source or
providers should be disabled until explicit apply support exists, with product
language that explains the next action.

## Verification Requirements

Milestone 12 is complete when:

1. Rust operation payloads serialize deterministically and have focused tests.
2. Studio frontend data is validated against Rust-owned operation fixtures.
3. Tauri commands expose the new operation results as thin GUI adapters.
4. CLI commands can inspect the same payloads where useful for parity.
5. Tests prove credential secret handles are redacted.
6. Tests prove unsupported and apply-required actions are surfaced before
   mutation.
7. Documentation describes the implemented operation slice and remaining
   provider handoffs.

## Blocker Policy

If an operation cannot actually mutate yet, it should still model the plan and
return `requires-approval`, `requires-credentials`, `unsupported`, or
`partial` status through the shared operation result. It should not pretend the
operation succeeded, and it should not hide the blocked condition in frontend
copy.
