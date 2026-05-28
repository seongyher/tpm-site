# Studio MCP Safety Model

This document is the design packet for `IRK-142`: the future CMS studio MCP
server and agent safety model.

The MCP server should expose the static publishing studio as safe, typed,
auditable tools and resources. It must not become an unrestricted remote shell,
filesystem proxy, provider API proxy, or secret exfiltration path.

Related documents:

- [HEADLESS_STUDIO_CORE_CONTRACT.md](./HEADLESS_STUDIO_CORE_CONTRACT.md)
- [STUDIO_MCP_RESOURCE_CONTRACTS.md](./STUDIO_MCP_RESOURCE_CONTRACTS.md)
- [STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md](./STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md)
- [STUDIO_PROVIDER_CAPABILITY_MATRIX.md](./STUDIO_PROVIDER_CAPABILITY_MATRIX.md)
- [SUPPLY_CHAIN_AND_SECRET_POLICY.md](./SUPPLY_CHAIN_AND_SECRET_POLICY.md)

## Goals

1. Let agents inspect source, routes, metadata, diagnostics, previews, media,
   releases, providers, and extensions through typed tools.
2. Default to read-only and dry-run behavior.
3. Require explicit scopes and apply gates for source writes, provider
   mutations, publish, rollback, migration, and destructive actions.
4. Reuse headless studio core operations.
5. Redact credentials and private provider logs everywhere.
6. Produce auditable results that match CLI, GUI, CI, and release reports.

## Non-Goals

- This document does not implement an MCP server.
- This document does not grant hosted credentials or provider access.
- This document does not allow arbitrary shell commands.
- This document does not make agents a substitute for product workflow policy.

## Resource Model

Read-only resources should expose structured snapshots:

- workspace summary;
- source inventory;
- route registry;
- editable domain descriptors;
- diagnostics;
- metadata summary;
- media usage summary;
- provider capability report;
- release report;
- extension capability report;
- test and fixture status.

Resources should be stable enough for agents to reason over without scraping
HTML or logs.

The implemented resource, tool, plan, and apply-gate contract is documented in
[`STUDIO_MCP_RESOURCE_CONTRACTS.md`](./STUDIO_MCP_RESOURCE_CONTRACTS.md). It is
transport-agnostic and wraps existing Rust operation results instead of
inventing an MCP-only diagnostics, workspace, preview, release, or publish
model.

## Tool Classes

| Tool class        | Examples                                                  | Default availability             |
| ----------------- | --------------------------------------------------------- | -------------------------------- |
| Inspect           | list diagnostics, inspect article, inspect route metadata | read-only                        |
| Plan              | propose edit, preview changes, prepare publish plan       | dry-run                          |
| Local write       | save draft, apply safe source patch                       | explicit write scope             |
| Provider read     | provider status, deploy health                            | provider read scope              |
| Provider mutation | create preview deploy, import observability               | explicit provider scope and plan |
| Publish           | publish, rollback, unpublish                              | strongest gate and audit         |
| Destructive       | revoke credential, delete remote asset                    | strongest gate, often disabled   |

Tools should call headless core operations. They should not edit files or call
providers directly.

Current implementation status:

- inspection and report tools are available for workspace status, site
  diagnostics, resource discovery, adapter-capability fallback, Studio
  settings/content/media plans, preview reports, release plans, publish plans,
  and workflow verification;
- plan tools are `plan-only` and return shared operation envelopes with
  `request.interface: "mcp"`;
- apply tools exist only as gates. They require write/publish scopes, then
  return `unsupported` until source/provider mutation operations exist in the
  shared core.

## Permission Scopes

MCP scopes should map to platform scopes:

- `inspect`;
- `diagnostics.read`;
- `source.read`;
- `source.propose`;
- `source.write`;
- `media.read`;
- `media.write`;
- `preview.run`;
- `build.run`;
- `workflow.transition`;
- `provider.status.read`;
- `deploy.preview`;
- `deploy.publish`;
- `deploy.rollback`;
- `credential.test`;
- `extension.configure`;
- `admin`.

Scope absence should omit tools where possible and return explicit diagnostics
where a caller attempts a forbidden action.

The first implemented permission set grants safe inspect/report/plan scopes by
default and withholds write/publish scopes. The withheld scopes are still
modeled so apply requests can fail before any mutation path is considered.

## Plan And Apply

Agent writes should use plan/apply.

Plan response:

- operation ID;
- proposed source diffs;
- diagnostics;
- capability requirements;
- credential requirements;
- generated-output effects;
- risk class;
- approval requirements;
- next actions.

Apply request:

- operation ID or plan ID;
- expected source snapshot;
- approval token or explicit authorization;
- selected changes;
- dry-run/apply mode.

Apply should reject stale plans, changed source snapshots, missing scopes,
blocking diagnostics, and missing credentials.

In the current transport-agnostic crate, apply tools stop earlier than this:
they reject missing write/publish scopes, and even when those scopes are
present they return `TPM-MCP-APPLY-GATE-UNAVAILABLE`. This is intentional. MCP
must not become the first implementation of source/provider mutation semantics.

## Tool Result Schema

Every tool result should use the core operation envelope:

```text
ToolResult
  status
  operationId
  diagnostics
  sourceDiffs
  artifacts
  providerReports
  auditEvents
  nextActions
  redactionSummary
```

Free-form prose may summarize, but machine-readable fields should carry the
contract.

## Secret Redaction

MCP responses must never include:

- API keys;
- OAuth tokens;
- refresh tokens;
- private keys;
- cookies;
- webhook secrets;
- signed write URLs;
- raw environment variables;
- local credential file paths when private;
- unredacted provider logs.

Provider diagnostics should include safe error codes and repair steps. Secret
values should be replaced with stable redaction markers.

## Agent Guardrails

Agents should not be able to:

- run arbitrary shell commands;
- bypass source schemas;
- bypass provider capability checks;
- write directly to generated output;
- publish without a release plan;
- mutate providers without credential scopes and audit;
- read or return secrets;
- enable third-party extensions without permission;
- silently downgrade accessibility, metadata, security, or performance checks.

The MCP server should be a typed product interface, not a repo control surface.

## Verification Plan

Later implementation should add fixtures for:

- read-only resource access;
- diagnostics inspection;
- proposed article edit;
- denied source write;
- accepted source write with audit;
- preview plan;
- publish plan denied without scope;
- publish apply with mock provider;
- provider failure;
- secret redaction;
- stale plan rejection;
- unsupported capability response.

Tests should assert that MCP results match the same diagnostic and operation
schemas used by CLI and GUI.

Current Milestone 13 tests cover the implemented subset:

- resource and tool catalog order;
- exact wrapping of shared Studio preview, release, and publish operation
  results;
- default read/report/plan access;
- missing-scope permission denial;
- apply-gate unsupported responses after explicit write/publish scopes;
- adapter-capability unsupported diagnostics;
- secret-handle redaction and absence from serialized MCP responses;
- deterministic audit events for read-only, plan-only, permission-denied,
  unsupported, and rejected apply-gate paths.

## Handoff

Milestone 13 should implement MCP resources and tools after the headless core,
CLI operation contracts, provider capability runtime, and studio publish
contracts exist. Write-capable and publish-capable tools should remain disabled
until plan/apply, audit, permission, and redaction tests pass.
