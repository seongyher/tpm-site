# Headless Studio Core Contract

This document is the design packet for `IRK-140`: the headless studio core and
interface adapter contract.

The studio should have one canonical operation core. GUI, CLI, MCP, CI, and
future integrations should be thin interfaces over that core, not separate
implementations that each edit files, run shell commands, or call providers
directly.

Related documents:

- [STUDIO_PRODUCT_VISION.md](../../agent-docs/studio/STUDIO_PRODUCT_VISION.md)
- [STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md](../../agent-docs/studio/STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md)
- [STUDIO_ADAPTER_MODEL.md](../../agent-docs/studio/STUDIO_ADAPTER_MODEL.md)
- [STUDIO_EXTENSION_MODEL.md](../../agent-docs/studio/STUDIO_EXTENSION_MODEL.md)
- [STUDIO_PROVIDER_CAPABILITY_MATRIX.md](./STUDIO_PROVIDER_CAPABILITY_MATRIX.md)
- [STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md](./STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md)

## Goals

1. Define the shared service boundary for studio behavior.
2. Keep source, schema, diagnostics, preview, media, release, provider,
   extension, and audit logic in core contracts.
3. Keep GUI, CLI, MCP, and CI adapters thin and interface-specific.
4. Make operation results deterministic, JSON-serializable, and testable.
5. Prevent interface drift by giving every interface the same operation and
   diagnostic shapes.

## Core Owns

The headless core should own:

- workspace discovery and source references;
- schema descriptor lookup;
- source read/write plans;
- draft patch normalization;
- source diffs;
- content and config validation;
- diagnostics and repair metadata;
- media reference operations and materialization requests;
- metadata, PDF, search, feed, and social artifact preview summaries;
- preview orchestration;
- build and release artifact requests;
- provider capability checks;
- deploy adapter calls through provider contracts;
- extension capability checks;
- import, export, and migration plans;
- audit events;
- operation result envelopes.

The core should not own:

- GUI layout, components, or editor widgets;
- CLI terminal formatting;
- MCP transport details;
- CI runner details;
- provider-specific SDK mechanics;
- credential secret values;
- arbitrary shell execution.

## Operation Envelope

All interfaces should call core operations with a normalized envelope:

```text
StudioOperationRequest
  operation id
  operation kind
  workspace reference
  actor/interface
  source references
  patches or parameters
  provider target
  credential references
  requested output mode
  safety class
  dry-run/apply mode
  correlation id
```

Every operation returns:

```text
StudioOperationResult
  operation id
  status
  diagnostics
  source diffs
  preview artifacts
  release artifacts
  provider reports
  audit events
  manual steps
  next actions
  interface hints
```

Statuses:

- `ok`;
- `ok-with-warnings`;
- `blocked`;
- `failed`;
- `unsupported`;
- `requires-approval`;
- `requires-credentials`;
- `partial`.

Result shapes should be suitable for CLI `--json`, MCP tool results, GUI state,
CI logs, and tests.

## Operation Families

### Workspace

- discover workspace;
- inspect source inventory;
- inspect generated artifact ownership;
- export workspace;
- import workspace;
- validate workspace health.

### Editing

- get editor document;
- propose patch;
- validate patch;
- write draft;
- write source change;
- diff source;
- restore source version.

### Media

- add media;
- replace media;
- resolve media reference;
- materialize media for build;
- inspect media usage;
- migrate media provider;
- report missing or unsupported media.

### Preview And Build

- diagnostics-only preview;
- route preview;
- artifact preview;
- full build;
- release artifact creation;
- generated-output verification.

### Metadata And Artifacts

- inspect route metadata;
- inspect social preview;
- inspect feed/search/PDF state;
- validate metadata profile;
- list generated artifacts and owners.

### Providers

- list provider capabilities;
- test provider connection;
- create provider action plan;
- apply provider mutation;
- import provider diagnostics;
- fetch release health.

### Workflow And Release

- save draft;
- mark ready;
- submit for review;
- approve or request changes;
- publish plan;
- publish apply;
- unpublish plan;
- rollback plan;
- rollback apply;
- release report.

### Extensions

- list extensions;
- inspect extension capabilities;
- validate extension config;
- enable or disable extension plan;
- run extension-owned diagnostics.

## Safety Classes

The core should classify every operation:

- read-only;
- local write;
- source write;
- provider read;
- provider mutation;
- publish;
- destructive;
- agent write.

Adapters may render safety differently, but they may not downgrade it. Apply
mode is blocked for mutating operations unless the required plan, diagnostics,
credentials, capability checks, and approvals exist.

## Interface Adapters

### GUI Adapter

The GUI adapter renders editor documents, diagnostics, preview states, plans,
and release reports. It should call core operations through typed commands and
never own source policy.

### CLI Adapter

The CLI adapter translates command arguments into core operation requests and
renders human or JSON output. It should not be a wrapper around current Bun
scripts.

### MCP Adapter

The MCP adapter exposes read-only resources, diagnostics, proposed diffs, and
gated write/publish tools. It should never be a remote shell.

### CI Adapter

The CI adapter runs deterministic checks, build verification, release reports,
and provider-free or provider-scoped gates. It should be non-interactive and
machine-readable.

## Invalid-State Prevention

Core models should use discriminated states:

- source patch state;
- editorial workflow state;
- credential state;
- capability state;
- preview state;
- publish plan state;
- release state;
- rollback state.

Avoid nullable bundles where impossible combinations can be represented. If an
operation requires a release artifact, that requirement belongs in the type or
runtime validator for that operation.

## Diagnostics

Every diagnostic should include:

- stable code where practical;
- severity;
- source or artifact reference;
- responsible owner;
- cause;
- remediation;
- related capability or credential state if applicable;
- interface-safe message;
- machine-readable details.

The same diagnostic should be renderable in GUI, CLI, MCP, CI, and release
reports.

## Verification Plan

Later implementation should add:

- core operation contract fixtures;
- interface adapter golden tests over the same operation results;
- invalid-state fixtures that fail at the core layer;
- capability fixtures proving GUI/CLI/MCP/CI hide, disable, or reject actions
  consistently;
- no-shell/no-provider-bypass tests;
- source-diff and audit-event snapshots;
- JSON schema compatibility checks for operation outputs.

## Handoff

Milestone 8 should implement the first operation core and CLI vertical slice.
Milestone 10 should implement provider capability runtime. Milestones 11, 12,
and 13 should build GUI, authoring/publish, and MCP behavior as adapters over
this core.
