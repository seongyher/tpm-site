# Studio Provider Capability Matrix

This document is the design packet for `IRK-146`: the provider capability
matrix and adapter sequencing model for the future studio, CLI, MCP, and CI
surfaces.

The matrix lets every interface know what a configured provider can do before
an action is shown, attempted, blocked, or routed through an explicit escape
hatch. Runtime implementation belongs to Milestone 10.

Related documents:

- [STUDIO_PRODUCT_VISION.md](../agent-docs/STUDIO_PRODUCT_VISION.md)
- [STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md](../agent-docs/STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md)
- [STUDIO_ADAPTER_MODEL.md](../agent-docs/STUDIO_ADAPTER_MODEL.md)
- [STUDIO_EXTENSION_MODEL.md](../agent-docs/STUDIO_EXTENSION_MODEL.md)
- [DEPLOYMENT_ADAPTER_CONTRACT.md](./DEPLOYMENT_ADAPTER_CONTRACT.md)
- [STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md](./STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md)

## Goals

1. Represent provider behavior as explicit capabilities, not UI assumptions.
2. Keep Cloudflare, GitHub, local files, repo-local media, object storage, and
   enterprise systems as provider profiles behind one model.
3. Make unsupported operations predictable: hidden, disabled with repair,
   rejected with diagnostics, or available through an explicit escape hatch.
4. Give GUI, CLI, MCP, CI, tests, and release reports the same capability data.
5. Hand runtime registry implementation to Milestone 10 without requiring it in
   this planning milestone.

## Capability Record

A capability record should be data shaped like this:

```text
ProviderCapability
  id
  family
  operation
  status
  required inputs
  outputs
  required scopes
  credential state requirements
  dry-run support
  reversibility
  destructive behavior
  audit requirements
  diagnostics
  supported interfaces
  mock-provider fixture requirements
```

Capability status values:

- `supported`;
- `unsupported`;
- `manual`;
- `partial`;
- `unknown-until-authenticated`;
- `disabled-by-policy`;
- `requires-extension`.

Unsupported status should never be discovered by a late provider stack trace.

## Capability Families

| Family        | Core capabilities                                                                         | Required outputs                                          |
| ------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Source        | read workspace, write draft, write source patch, diff, export, import, conflict detection | source references, source diffs, diagnostics              |
| History       | create restore point, list versions, diff versions, restore version                       | version references, restore plan, audit event             |
| Media         | resolve, upload, relink, materialize build input, inspect usage, migrate storage          | media references, materialization manifest, diagnostics   |
| Workflow      | save draft, mark ready, submit, approve, request changes, reject, schedule, transition    | workflow state, transition diagnostics, review references |
| Build         | run diagnostics-only check, preview build, full build, artifact verification              | build logs, compiler diagnostics, artifact references     |
| Deploy        | check, preview, publish, rollback, cache policy, domain status                            | deploy plan, URLs, provider IDs, rollback report          |
| Identity      | authenticate, test connection, list account context, revoke                               | credential references, connection health, audit event     |
| Diagnostics   | import provider diagnostics, normalize logs, attach source references                     | diagnostic records with stable codes                      |
| Observability | import analytics, crawl errors, performance data, release health                          | observability report, linked routes/artifacts             |
| Metadata      | inspect metadata, validate profiles, preview social/search/scholarly output               | metadata summary, schema diagnostics                      |
| Artifacts     | produce feed, sitemap, PDF, search, social image, release report                          | artifact manifest entries and verifier results            |
| Extension UI  | render settings, provide components, expose editor surfaces                               | extension descriptors, capability declarations            |

## Interface Behavior

Every interface should consume the same capability report.

| Operation state    | GUI behavior                                        | CLI behavior                     | MCP behavior                   | CI behavior                  |
| ------------------ | --------------------------------------------------- | -------------------------------- | ------------------------------ | ---------------------------- |
| Supported          | show enabled action                                 | run command                      | expose tool if scoped          | run step                     |
| Unsupported        | hide if irrelevant, or show unavailable explanation | fail before work with diagnostic | omit tool or return diagnostic | fail planning step           |
| Manual             | show manual instructions                            | print manual steps               | return manual-step result      | warn or fail based on policy |
| Partial            | show warning and limitations                        | return warning status            | return degraded capability     | warn and report limitation   |
| Unknown until auth | show connect/test prompt                            | request credential test          | require credential scope       | block until secret exists    |
| Disabled by policy | show policy explanation                             | fail with policy code            | deny tool                      | fail gate                    |
| Requires extension | offer install/enable path                           | report missing extension         | omit tool                      | fail or skip by policy       |

Default users should see product language. Advanced details can include provider
terms such as branch, token scope, deploy ID, or cache purge.

## Provider Profiles

### Default Local Publisher

Expected default profile:

- app-managed or local source;
- app-managed local history;
- local or app-managed media;
- direct publish workflow;
- local build;
- bundled Cloudflare deploy as recommended publish provider;
- no required Git provider;
- no required review workflow.

Unsupported or later capabilities should be shown as upgrade paths, not
failures.

### TPM-Like Static Publication

Expected profile:

- separate site workspace or repository;
- Git or GitHub source/history;
- repo-local media initially, with external media migration available later;
- optional GitHub review workflow;
- Cloudflare deploy;
- CI/release checks;
- advanced artifact and release reporting.

The profile must not make GitHub or Cloudflare core. They are bundled adapters.

### Complex Publisher

Expected profile:

- custom source provider;
- custom history or audit log;
- external media or DAM;
- enterprise identity;
- workflow engine;
- hosted or remote build;
- custom deploy target;
- observability import.

The platform should ask for provider capabilities and adapt. It should not
assume the internals of the publisher.

## Sequencing Rules

Provider-backed operations should follow this order:

1. Load workspace and source references.
2. Resolve configured providers and enabled extensions.
3. Query capability reports.
4. Resolve credential references and scope state.
5. Materialize source and media inputs where needed.
6. Run source validation and diagnostics.
7. Run preview or build request.
8. Verify generated artifacts.
9. Produce dry-run plan.
10. Require approval for source writes, provider mutations, publish, rollback,
    migration, and destructive operations.
11. Execute through adapters.
12. Emit audit events, release reports, provider reports, and recovery notes.

Interfaces may render these steps differently, but they should not skip them.

## Unsupported Operation Policy

Unsupported operations should choose one of four behaviors:

1. **Hidden:** the action is irrelevant for the configured provider and would
   confuse the user.
2. **Disabled with explanation:** the user can repair or enable the missing
   capability.
3. **Rejected with diagnostic:** a caller attempted an unsafe or impossible
   operation.
4. **Explicit escape hatch:** a power user can proceed with a declared manual
   or unoptimized path.

Example: external media that cannot be materialized should block optimized
image generation with a diagnostic, but may allow an explicit unoptimized
escape hatch if the site owner accepts the output and performance tradeoff.

## Mock-Provider Fixtures

Milestone 10 and later studio milestones should include mock providers for:

- fully supported local source/media/build/deploy;
- missing credentials;
- insufficient scope;
- revoked credential;
- unsupported preview;
- manual deploy only;
- partial rollback;
- provider down;
- conflicting source state;
- external media requiring materialization;
- disabled extension capability.

Mock providers must require no network and no real credentials.

## Runtime Handoff

Milestone 10 should implement:

- typed provider capability records;
- provider registry and extension integration;
- interface-safe capability query API;
- mock-provider capability fixtures;
- unsupported-operation diagnostics;
- capability snapshots for GUI, CLI, MCP, and CI tests.

This document is complete when implementation can build that runtime without
rediscovering provider taxonomy or product behavior.
