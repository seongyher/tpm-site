# Studio MCP Resource Contracts

This document records the implemented Milestone 13 MCP contract slice. It is
the implementation handoff for `IRK-197`, `IRK-199`, `IRK-200`, `IRK-201`,
`IRK-202`, and `IRK-203`.

Related documents:

- [STUDIO_MCP_SAFETY_MODEL.md](./STUDIO_MCP_SAFETY_MODEL.md)
- [HEADLESS_STUDIO_CORE_CONTRACT.md](./HEADLESS_STUDIO_CORE_CONTRACT.md)
- [RUST_OPERATION_CONTRACTS.md](../rust/RUST_OPERATION_CONTRACTS.md)
- [STUDIO_PROVIDER_CAPABILITY_MATRIX.md](./STUDIO_PROVIDER_CAPABILITY_MATRIX.md)
- [STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md](./STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md)

## Purpose

The MCP implementation is deliberately transport-agnostic. It lives in
`crates/tpm-mcp` and models resource descriptors, tool descriptors, permission
defaults, response envelopes, operation-result wrapping, plan-only reports,
apply gates, unsupported diagnostics, redaction summaries, and deterministic
response-local audit events.

This crate does not yet run an MCP server. It defines the domain contract that
a future server can expose over the Model Context Protocol without inventing a
second diagnostics, workspace, or provider model.

## Current Tool Catalog

The implemented tool catalog is transport-agnostic. Report and plan tools call
the same resource functions instead of re-running unrelated MCP-only logic.
Apply tools are present as explicit gates and reject mutation until shared
operation-core apply support exists:

| Tool name               | Backing resource or behavior                                                |
| ----------------------- | --------------------------------------------------------------------------- |
| `site_status`           | Wraps `tpm://resources/workspace/status`                                    |
| `site_diagnostics`      | Wraps `tpm://resources/site/diagnostics`                                    |
| `resource_catalog`      | Returns the current resource descriptors                                    |
| `adapter_capabilities`  | Returns the same unsupported capability-registry diagnostic as the resource |
| `settings_change_plan`  | Wraps `tpm://resources/studio/settings-plan`                                |
| `source_edit_plan`      | Wraps `tpm://resources/studio/content-plan`                                 |
| `media_change_plan`     | Wraps `tpm://resources/studio/media-plan`                                   |
| `preview_report`        | Wraps `tpm://resources/studio/preview-report`                               |
| `release_plan`          | Wraps `tpm://resources/studio/release-plan`                                 |
| `publish_plan`          | Wraps `tpm://resources/studio/publish-plan`                                 |
| `workflow_verify`       | Wraps `tpm://resources/studio/workflow-verify`                              |
| `apply_settings_change` | Apply gate; returns unsupported until source mutation apply exists          |
| `apply_source_edit`     | Apply gate; returns unsupported until source mutation apply exists          |
| `apply_media_change`    | Apply gate; returns unsupported until media mutation apply exists           |
| `apply_publish`         | Apply gate; returns unsupported until provider publish apply exists         |

The tool layer proves command shape, permission gates, response envelopes,
redaction propagation, audit semantics, and diagnostics mapping for
agent-facing inspection and planning. It does not introduce live mutation,
provider-specific tools, or a second capability model.

## Current Resource Catalog

The implemented resource catalog exposes:

| Resource URI                             | Backing operation or status                                          |
| ---------------------------------------- | -------------------------------------------------------------------- |
| `tpm://resources/workspace/status`       | `workspace.status` operation result                                  |
| `tpm://resources/site/diagnostics`       | `site.doctor` operation result                                       |
| `tpm://resources/studio/settings-plan`   | `studio.settings.inspect` operation result                           |
| `tpm://resources/studio/content-plan`    | `studio.content.editor` operation result                             |
| `tpm://resources/studio/media-plan`      | `studio.media.library` operation result                              |
| `tpm://resources/studio/preview-report`  | `studio.preview.plan` operation result                               |
| `tpm://resources/studio/release-plan`    | `studio.release.plan` operation result                               |
| `tpm://resources/studio/publish-plan`    | `studio.publish.apply` operation result as a gated plan              |
| `tpm://resources/studio/workflow-verify` | `studio.workflow.verify` operation result                            |
| `tpm://resources/release/inspect`        | `release.inspect` operation result                                   |
| `tpm://resources/media/images`           | `media.images` operation result                                      |
| `tpm://resources/routes/redirects`       | `routes.redirects` operation result                                  |
| `tpm://resources/adapter-capabilities`   | unsupported diagnostic until Milestone 10 capability registry exists |

The resources wrap existing `OperationResult` data with `interface: "mcp"`.
They do not reformat the operation into a separate MCP-specific model. Studio
plan/report resources expose the shared `StudioAuthoringPayload` operation
payload with `request.interface: "mcp"`.

## Permission Defaults

The current permission model is intentionally small and read-only:

- `inspect`
- `diagnostics.read`
- `source.read`
- `source.propose`
- `media.read`
- `preview.run`
- `routes.read`
- `release.read`
- `provider.status.read`

Missing scopes return a `permission-denied` resource response with
`TPM-MCP-PERMISSION-DENIED`. The response has no payload and includes an
actionable remediation.

Additional apply-capable scopes are modeled but not granted by default:

- `source.write`
- `media.write`
- `deploy.publish`
- `deploy.rollback`
- `build.run`
- `workflow.transition`
- `credential.test`
- `extension.configure`
- `admin`

No tool currently mutates source, providers, credentials, or generated output.
Apply tools require the relevant write/publish scope before reaching the apply
gate, then return `unsupported` with `TPM-MCP-APPLY-GATE-UNAVAILABLE` until
the shared mutation operation exists.

## Unsupported Capability Resource

`tpm://resources/adapter-capabilities` is present in the catalog so agents can
discover the intended resource URI. Reading it currently returns
`unsupported` with `TPM-MCP-CAPABILITY-REGISTRY-MISSING`.

This is deliberate. Milestone 10 owns the canonical provider capability
registry. MCP must consume that registry once it exists rather than creating a
parallel capability model.

## Redaction

MCP resource payloads are serialized through JSON and passed through a
conservative string redaction step before being returned. The response includes
a `redaction` summary with a count of redacted values.

The redaction pass protects obvious secret-like strings containing markers such
as `token`, `secret`, `api_key`, `authorization`, `password`, and bearer-token
forms. This is a first safety layer, not the final credential model. Milestone
10 and later publish/apply work must still model credential references,
provider scopes, and audit records explicitly.

## Audit Events

Every current resource read and tool call emits a deterministic audit event in
the response. These events record:

- action: `resource-read` or `tool-call`;
- interface: `mcp`;
- target resource URI or tool name;
- safety class: `read-only`, `plan-only`, or `apply-gate`;
- outcome: `completed`, `permission-denied`, or `unsupported`;
- required, granted, and missing scopes;
- credential access: `none` or `reference-only`;
- mutation: `none`, `planned`, or `rejected`;
- redaction summary.

This is the current safety envelope, not the final persisted audit log. The
events intentionally do not invent actor identity, timestamps, credential
references, approval IDs, plan IDs, or storage locations before the relevant
Milestone 10 and publish/apply contracts exist.

## Response Shape

Every resource response contains:

- `schemaVersion`
- `resource`
- `status`
- optional `payload`
- `diagnostics`
- `redaction`
- `auditEvents`

`payload.operationResult` is the existing operation envelope when a backing
operation exists. `diagnostics` contains resource-level diagnostics and, for
operation-backed resources, the same diagnostics emitted by the operation.

Tool responses use the same schema discipline with `tool`, `status`, optional
`result`, `diagnostics`, `redaction`, and `auditEvents`.

## Verification

The current crate tests cover:

- stable catalog order and resource URI shape;
- workspace status operation wrapping with `interface: "mcp"`;
- permission-denied behavior;
- unsupported capability diagnostics;
- secret-like JSON string redaction;
- read-only audit events for completed and permission-denied responses.

Later Milestone 13 work should add transport-level MCP tests only after an MCP
server runtime is introduced. Until then, parity should compare these resource
responses and underlying operation fixtures.

The current tool tests cover:

- stable tool catalog order and names;
- `site_status` wrapping the workspace-status resource;
- `resource_catalog` returning resource descriptors;
- permission-denied behavior for tools;
- adapter-capability tool fallback while the capability registry is missing;
- Studio report tools wrapping shared Studio operation resources;
- exact operation-result parity for Studio preview, release, and publish plan
  resources;
- apply tools denying missing write/publish scopes before any mutation path;
- apply tools returning unsupported after permission until operation-core
  mutation exists;
- credential secret handles staying absent from serialized MCP publish-plan
  responses;
- audit events for read-only, plan-only, permission-denied, unsupported, and
  apply-gated responses.

## Blocked Follow-Up

`IRK-199` has an initial read-only tool slice for status, diagnostics,
resource discovery, and adapter-capability fallback.

`IRK-201` now covers permission gates, redaction summaries, and deterministic
response-local audit events for the current MCP contract surface. The full
credential/audit integration for persisted audit storage and live providers
belongs to future provider/runtime work.

`IRK-202` intentionally stops at apply gates. Real source writes, provider
publishes, rollbacks, and credential tests must be implemented in the shared
operation core first, then exposed through MCP as thin adapters.
