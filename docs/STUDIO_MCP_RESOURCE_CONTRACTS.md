# Studio MCP Resource Contracts

This document records the first implemented Milestone 13 MCP slice. It is the
implementation handoff for `IRK-197` and a constraint document for later MCP
tools, permission gates, and write-capable plan/apply work.

Related documents:

- [STUDIO_MCP_SAFETY_MODEL.md](./STUDIO_MCP_SAFETY_MODEL.md)
- [HEADLESS_STUDIO_CORE_CONTRACT.md](./HEADLESS_STUDIO_CORE_CONTRACT.md)
- [RUST_OPERATION_CONTRACTS.md](./RUST_OPERATION_CONTRACTS.md)
- [STUDIO_PROVIDER_CAPABILITY_MATRIX.md](./STUDIO_PROVIDER_CAPABILITY_MATRIX.md)
- [STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md](./STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md)

## Purpose

The first MCP implementation is deliberately read-only and transport-agnostic.
It lives in `crates/tpm-mcp` and models resource descriptors, permission
defaults, response envelopes, operation-result wrapping, unsupported-resource
diagnostics, and redaction summaries.

This crate does not yet run an MCP server. It defines the domain contract that
a future server can expose over the Model Context Protocol without inventing a
second diagnostics, workspace, or provider model.

## Current Tool Catalog

The implemented read-only tool catalog is also transport-agnostic. Tools call
the same resource functions instead of re-running unrelated MCP-only logic:

| Tool name              | Backing resource or behavior                                                |
| ---------------------- | --------------------------------------------------------------------------- |
| `site_status`          | Wraps `tpm://resources/workspace/status`                                    |
| `site_diagnostics`     | Wraps `tpm://resources/site/diagnostics`                                    |
| `resource_catalog`     | Returns the current read-only resource descriptors                          |
| `adapter_capabilities` | Returns the same unsupported capability-registry diagnostic as the resource |

The tool layer is intentionally small. It proves the command shape,
permission gate, response envelope, redaction propagation, and diagnostics
mapping for agent-facing inspection. It does not introduce mutating tools,
provider-specific tools, or a second capability model.

## Current Resource Catalog

The implemented read-only catalog exposes:

| Resource URI                           | Backing operation or status                                          |
| -------------------------------------- | -------------------------------------------------------------------- |
| `tpm://resources/workspace/status`     | `workspace.status` operation result                                  |
| `tpm://resources/site/diagnostics`     | `site.doctor` operation result                                       |
| `tpm://resources/release/inspect`      | `release.inspect` operation result                                   |
| `tpm://resources/media/images`         | `media.images` operation result                                      |
| `tpm://resources/routes/redirects`     | `routes.redirects` operation result                                  |
| `tpm://resources/adapter-capabilities` | unsupported diagnostic until Milestone 10 capability registry exists |

The resources wrap existing `OperationResult` data with `interface: "mcp"`.
They do not reformat the operation into a separate MCP-specific model.

## Permission Defaults

The current permission model is intentionally small and read-only:

- `inspect`
- `diagnostics.read`
- `source.read`
- `media.read`
- `routes.read`
- `release.read`
- `provider.status.read`

Missing scopes return a `permission-denied` resource response with
`TPM-MCP-PERMISSION-DENIED`. The response has no payload and includes an
actionable remediation.

No write, provider mutation, publish, rollback, credential rotation, or
destructive scope exists in this slice.

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

Every current resource read and tool call emits a deterministic read-only audit
event in the response. These events record:

- action: `resource-read` or `tool-call`;
- interface: `mcp`;
- target resource URI or tool name;
- safety class: `read-only`;
- outcome: `completed`, `permission-denied`, or `unsupported`;
- required, granted, and missing scopes;
- credential access: `none`;
- mutation: `none`;
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
- read-only audit events for completed and permission-denied tool calls.

## Blocked Follow-Up

`IRK-199` has an initial read-only tool slice for status, diagnostics,
resource discovery, and adapter-capability fallback. Full provider-aware
adapter-capability inspection remains blocked on `IRK-181`.

`IRK-201` can build on the permission and redaction primitives after the
read-only resource skeleton exists. This slice now covers read-only permission
gates, redaction summaries, and deterministic response-local audit events. The
full credential/audit integration still depends on the Milestone 10 identity
and credential boundaries.
