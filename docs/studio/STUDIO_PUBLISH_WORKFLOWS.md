# Studio Publish Workflows

This document is the design packet for `IRK-138`: provider-backed publish,
rollback, credential, permission, and audit flows for the future static blog
studio.

Publishing should be a product workflow over typed source and provider
contracts. It should not become a GitHub pull request flow, a Cloudflare deploy
button, a shell command wrapper, or a hidden set of provider mutations.

Related documents:

- [STUDIO_PRODUCT_VISION.md](../../agent-docs/studio/STUDIO_PRODUCT_VISION.md)
- [STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md](../../agent-docs/studio/STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md)
- [STUDIO_ADAPTER_MODEL.md](../../agent-docs/studio/STUDIO_ADAPTER_MODEL.md)
- [STUDIO_PROVIDER_CAPABILITY_MATRIX.md](./STUDIO_PROVIDER_CAPABILITY_MATRIX.md)
- [DEPLOYMENT_ADAPTER_CONTRACT.md](../operations/DEPLOYMENT_ADAPTER_CONTRACT.md)
- [STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md](./STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md)

## Goals

1. Make direct publish the excellent default for a solo local publisher.
2. Keep review optional and adapter-owned.
3. Require dry-run plans for source writes, provider mutations, publish,
   rollback, migration, and destructive operations.
4. Preserve source truth and generated-output determinism.
5. Emit audit and release records without leaking credentials.
6. Support GitHub, Cloudflare, static export, and complex workflow engines as
   provider profiles, not product assumptions.

## Workflow Vocabulary

Default product labels:

- Save draft
- Preview
- Check site
- Publish
- Unpublish
- Submit for review
- Approve
- Request changes
- Roll back
- Restore version
- View release health

Advanced details may mention provider terms such as commit, pull request,
deployment ID, cache purge, build log, credential scope, or webhook response.

## Operation State Machine

The normalized workflow state should be discriminated:

```text
draft
ready
in-review
changes-requested
approved
scheduled
publishing
published
publish-failed
unpublished
rollback-proposed
rollback-applied
```

Invalid states should be unrepresentable:

- `scheduled` requires a publish time.
- `in-review`, `changes-requested`, and `approved` require a workflow
  reference.
- `publishing` requires a release plan.
- `published` requires a release reference or explicit direct-publish marker.
- `rollback-proposed` requires a restore target and rollback plan.

Preview is not a publication state. It is an operation over source or dirty
draft state.

## Plan And Apply Flow

Every mutating publish workflow should follow this shape:

1. Resolve workspace and source references.
2. Resolve providers and capabilities.
3. Resolve credentials and scopes.
4. Create source diff or source write plan.
5. Run diagnostics and generated-output checks.
6. Materialize media and build inputs.
7. Build or select release artifact.
8. Create provider action plan.
9. Present dry-run result and warnings.
10. Require approval where safety class demands it.
11. Apply source changes and provider mutations through adapters.
12. Emit audit events and release report.
13. Store restore point and rollback notes.

No interface should publish by jumping directly from a button to provider API
calls.

## Direct Publish

Direct publish is the default solo-user path.

Required behavior:

- run diagnostics before publish;
- create or reuse a release artifact;
- create restore point where history is available;
- show a concise plan before external provider mutation;
- allow approval with clear consequence text;
- publish through the configured deploy adapter;
- report public URL, warnings, manual steps, and rollback options;
- preserve source truth in the workspace.

Direct publish should not require Git, GitHub, pull requests, or CI.

## Optional Review

Review is a workflow policy. It is not the definition of publishing.

Review operations:

- submit for review;
- approve;
- request changes;
- reject;
- publish approved release;
- withdraw submission;
- resubmit.

Provider profiles:

- local review for simple teams;
- GitHub pull request for TPM-like teams;
- webhook or enterprise workflow engine for complex publishers;
- no review for solo users.

The product action is the same. Provider mechanics differ.

## Rollback And Restore

Rollback restores public output. Restore version restores source.

Rollback plan should include:

- current release reference;
- target release reference;
- provider capability report;
- source effects, if any;
- generated artifacts affected;
- expected public URL state;
- manual steps;
- limitations.

If a provider cannot direct-rollback, the fallback is usually redeploying a
known previous release artifact. The UI and CLI must call this out.

Restore version should operate through the history adapter and produce a source
diff before applying.

## Credentials And Permissions

Publish workflows use credential references, never secret values.

Required checks:

- credential state is connected;
- required scopes are present;
- provider account matches the target;
- credential storage profile matches runtime policy;
- third-party extension permissions are explicitly granted;
- audit event can be emitted.

Credential failure states:

- missing;
- expired;
- revoked;
- insufficient scope;
- provider unreachable;
- disabled by policy;
- untrusted extension.

Default user copy should say what to do next: connect provider, reconnect,
grant publish permission, choose a different provider, or use manual export.

## Audit Events

Every source write, provider mutation, publish, rollback, credential test,
credential revoke, and destructive action should emit an audit event.

Audit event fields:

- event ID;
- operation ID;
- timestamp;
- actor or interface;
- workspace;
- source references;
- provider;
- credential reference ID and scopes, not secret values;
- safety class;
- dry-run or execute mode;
- diagnostics summary;
- release or restore reference;
- result.

Audit logs should be exportable and redacted.

## Provider Profiles

### Local Static Export

- writes generated output to a local folder;
- no provider credential required;
- rollback is manual unless history stores previous output;
- useful for default users, debugging, and portable export.

### Cloudflare Deploy

- bundled deploy adapter;
- publish uploads static output;
- preview may create provider preview deployment when supported;
- rollback depends on provider capability or redeploying a previous artifact;
- credential scopes are required for publish and rollback.

### GitHub Review

- source/history/workflow provider, not a deploy requirement;
- "submit for review" may open a pull request;
- "approve" may mark review approval;
- publish may be a later CI/deploy step;
- default users should not need to know this path.

### Complex Workflow Engine

- receives source diff, release plan, diagnostics, and artifacts;
- decides internal approvals externally;
- returns workflow state and diagnostics;
- publish may occur in a separate provider pipeline.

## Verification Plan

Later implementation should add mocked-provider tests for:

- direct publish success;
- direct publish blocked by diagnostics;
- missing, expired, revoked, and insufficient-scope credentials;
- provider down and retry;
- unsupported preview or rollback;
- optional review submit/approve/request changes/reject;
- publish after approval;
- rollback by provider and rollback by redeploy;
- source restore with source diff;
- audit log redaction;
- release report generation;
- no secrets in source, logs, generated output, or snapshots.

Golden source-diff tests should prove publish workflows create deterministic
source changes before provider calls.

## Handoff

Milestone 10 should implement provider capability runtime and adapters.
Milestone 12 should implement real authoring, release, publish, rollback, and
credentialed flows over this workflow model. CLI and MCP implementations should
consume the same operation state and audit contracts.
