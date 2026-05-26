# Studio Adapter Model

This document defines the provider and adapter model behind the future static
publishing studio described in
[STUDIO_PRODUCT_VISION.md](./STUDIO_PRODUCT_VISION.md).
Adapters are often packaged and exposed through extensions, as described in
[STUDIO_EXTENSION_MODEL.md](./STUDIO_EXTENSION_MODEL.md).

The goal is to keep the product simple for default users while making the
platform adaptable for TPM, technical collaborators, and complex publishers.

## Core Principle

The studio should expose editorial actions. Adapters should handle provider
mechanics.

Product action:

```text
Publish this article.
```

Adapter mechanics:

```text
write files -> commit -> open pull request -> run CI -> merge -> deploy
write files -> build locally -> upload worker assets -> purge cache
write source record -> enqueue external review -> receive approval -> deploy
```

Those mechanics can vary by installation. The core product action should not.

## Adapter Boundary Rules

1. Platform contracts define intent.
2. Adapters implement provider-specific mechanics.
3. Adapters report capabilities and diagnostics.
4. Adapters never become hidden global assumptions.
5. Default adapters may be excellent, but they remain replaceable.

Any adapter should be able to answer:

- What capabilities do you support?
- What credentials or local permissions do you require?
- What source or output artifacts do you read?
- What source or output artifacts do you write?
- What diagnostics can you produce?
- Which operations are dry-run capable?
- Which operations are reversible?
- Which operations are destructive or publish externally?

## Canonical Studio Operations

The studio core should normalize user actions into a small set of operations.

Source operations:

- read workspace;
- write draft;
- write config change;
- write media reference;
- diff change;
- validate source;
- restore version;
- export source;
- import source.

Build operations:

- materialize build inputs;
- run fast preview compile;
- run full static build;
- generate artifacts;
- verify artifacts;
- produce release report.

Workflow operations:

- save draft;
- mark ready;
- submit for review;
- approve;
- request changes;
- reject;
- publish;
- unpublish;
- roll back.

Provider operations:

- authenticate;
- test connection;
- upload artifact;
- deploy release;
- invalidate cache;
- fetch logs;
- fetch public status.

Not every adapter supports every operation. Unsupported operations must be
declared as capabilities, not discovered by failure.

## Adapter Types

### Source Adapter

Owns where editable site source lives.

Examples:

- local directory;
- separate site Git repository;
- app-managed local workspace;
- cloud drive folder;
- content API;
- enterprise content system.

Required capabilities:

- list files or records;
- read source content;
- write proposed changes or drafts;
- identify changed sources;
- provide stable source references for diagnostics;
- export a portable source snapshot.

Optional capabilities:

- branch or workspace isolation;
- remote sync;
- locking;
- conflict detection;
- source provenance.

Rule: platform source code is not site source. A site workspace must be usable
without including the platform implementation repo.

### History Adapter

Owns versions, restore points, diffs, and rollback history.

Examples:

- invisible local history;
- Git commits;
- database revisions;
- cloud object versions;
- enterprise audit log.

Required capabilities:

- create restore point;
- list relevant versions;
- diff versions;
- restore a version or produce a restore proposal;
- identify who or what made a change when known.

Optional capabilities:

- signed commits;
- retention policy;
- named releases;
- release notes;
- audit export.

Rule: default users should see "versions" and "restore," not commits and
branches.

### Media Adapter

Owns media identity, storage, lookup, materialization, and derivative policy.

Examples:

- repo-local assets;
- local media folder;
- app-managed media library;
- external drive or NAS;
- object storage;
- SaaS media library;
- enterprise DAM.

Required capabilities:

- resolve a media reference;
- provide metadata such as type, size, dimensions, and source when available;
- materialize or stream an asset for build-time processing;
- report missing, inaccessible, unsupported, oversized, or unsafe assets;
- preserve stable media IDs independent of storage paths.

Optional capabilities:

- upload;
- search;
- deduplicate;
- generate derivatives;
- track usage;
- enforce licensing or provenance fields;
- provide alt text suggestions.

Astro-specific note:

Astro image optimization needs local or otherwise resolvable build-time inputs.
Remote or external media should therefore be adapted into a materialized build
input, derivative manifest, or explicit unoptimized escape hatch before the
Astro renderer needs it.

Rule: media storage is a provider detail. Article source should reference media
intent and identity, not blindly depend on a physical repo path forever.

### Workflow Adapter

Owns editorial state transitions beyond simple direct publishing.

Examples:

- direct publish;
- local draft review;
- GitHub pull request;
- email approval;
- webhook to external system;
- enterprise workflow engine.

Required capabilities:

- declare supported states;
- declare allowed transitions;
- validate whether a transition is permitted;
- attach diagnostics or review comments to source locations where possible.

Optional capabilities:

- assignees;
- approvals;
- scheduled publish;
- legal/compliance review;
- external issue links;
- notifications.

Rule: review is optional. Solo publishing should not inherit a newsroom approval
model. Large publishers should not be forced into GitHub pull requests.

### Build Adapter

Owns how the static compiler is run.

Examples:

- local Bun/Astro build;
- CI build;
- remote build service;
- preview-only partial build;
- fixture build;
- future incremental preview builder.

Required capabilities:

- run a declared build/check target;
- provide logs;
- provide structured diagnostics;
- expose generated artifact locations;
- distinguish preview, release, and investigation modes.

Optional capabilities:

- incremental rebuild;
- persistent cache;
- parallel site builds;
- resource limits;
- build cancellation.

Rule: build results should be normalized into compiler artifacts and
diagnostics regardless of where the build ran.

### Deploy Adapter

Owns where static output is published.

Examples:

- Cloudflare Workers Static Assets;
- Cloudflare Pages;
- Netlify;
- static object storage plus CDN;
- local folder export;
- enterprise deploy target.

Required capabilities:

- validate credentials or connection;
- receive a deployable artifact;
- publish or dry-run a release;
- return public URLs;
- return deploy diagnostics;
- expose rollback support when available.

Optional capabilities:

- cache headers;
- cache purge;
- preview deployments;
- custom domains;
- route rules;
- redirects;
- environment variables;
- deployment logs.

Rule: Cloudflare can be the TPM/default deploy adapter, but deploy policy must
not be Cloudflare-only in the core.

### Identity And Credential Adapter

Owns authentication and secrets for providers.

Examples:

- local encrypted credential store;
- OAuth account connection;
- environment variables;
- OS keychain;
- hosted secrets manager;
- enterprise SSO.

Required capabilities:

- identify credential requirements;
- test connection without leaking secrets;
- pass scoped credentials to provider adapters;
- report missing or insufficient permissions.

Optional capabilities:

- OAuth refresh;
- organization membership;
- role mapping;
- credential rotation;
- audit logging.

Rule: secret handling must be explicit and adapter-scoped. No studio, CLI, MCP,
or build path should leak secrets into public generated output.

The shared credential, scope, redaction, audit, and recovery contract is
defined in
[`../docs/STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md`](../docs/STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md).

### Diagnostics And Observability Adapter

Owns how diagnostics, release reports, crawler feedback, and runtime/public
output health are collected and displayed.

Examples:

- local release report;
- CI annotations;
- studio issue panel;
- MCP diagnostic query;
- Cloudflare analytics importer;
- Google Search Console import;
- Bing Webmaster Tools import.

Required capabilities:

- normalize diagnostics into the author diagnostic taxonomy;
- preserve source references where possible;
- distinguish author-fixable, site-owner-fixable, developer-fixable, and
  external/provider issues;
- preserve severity and confidence.

Optional capabilities:

- trend history;
- route health dashboards;
- crawler issue import;
- performance history;
- accessibility history;
- release comparisons.

Rule: diagnostics are product UI, not just logs.

## Capability Model

Adapters should expose capabilities as data so the GUI, CLI, and MCP can show
only valid actions.

Example capability categories:

```text
source.read
source.write
source.diff
source.restore
history.versions
media.upload
media.materialize
workflow.review
workflow.schedule
build.preview
build.release
deploy.preview
deploy.publish
deploy.rollback
diagnostics.import
```

The studio should use these capabilities to avoid invalid UI states. If an
adapter cannot roll back, the UI should not offer one-click rollback as though
it will work.

## Provider Profiles

A provider profile is a named bundle of adapters and defaults.

Potential profiles:

1. **Local solo profile:** local source, local history, local media, local
   build, configured deploy provider.
2. **TPM profile:** Git source/history, repo or configured media, Bun/Astro
   build, Cloudflare deploy, GitHub review when desired.
3. **Publication team profile:** remote source, external media provider,
   workflow provider, CI build, deploy provider, observability importer.
4. **Export-only profile:** local source, local build, no deploy provider,
   static folder export.

Profiles are convenience presets, not hard-coded product modes.

## Source Workspace Shape

The logical site workspace should remain portable.

Current repo shape:

```text
site/
  config/
  content/
  assets/
  public/
  theme.css
```

Future source adapters may not store this exact physical tree, but they should
be able to materialize an equivalent logical workspace for the compiler.

The platform should distinguish:

- canonical editable source;
- temporary materialized build input;
- generated output;
- provider-specific cache;
- parked or unused source;
- release report artifacts.

## Media Materialization Flow

External media should flow through an explicit materialization step.

```text
article references media ID
  -> media adapter resolves provider record
  -> media policy selects role and derivative requirements
  -> build adapter materializes input or derivative manifest
  -> Astro/image/PDF/social rendering consumes materialized media
  -> output verifier checks generated assets and references
```

This keeps the compiler static while allowing media to live outside Git.

## Workflow State Model

The core state model should be small and extensible.

Baseline states:

```text
draft
ready
published
unpublished
failed
rolled-back
```

Optional review states:

```text
submitted
in-review
changes-requested
approved
rejected
scheduled
```

The state machine should be policy-driven. A solo publisher can move from
`ready` to `published`. A publication can require `approved` before `published`.
An external workflow adapter can map these states to its own system.

## CLI And MCP Boundaries

The CLI and MCP server should expose the same operation model as the GUI.

CLI examples:

- `check`
- `preview`
- `publish`
- `rollback`
- `import`
- `export`
- `media audit`
- `diagnostics`

MCP examples:

- list routes;
- inspect diagnostics;
- propose source edit;
- add media reference;
- explain metadata;
- run check;
- create publish proposal.

Rules:

- CLI and MCP call the same studio core.
- CLI and MCP respect adapter capabilities and credentials.
- MCP write/publish operations should be gated, auditable, and dry-run capable
  by default.
- No interface should bypass source validation or generated-output checks.

## Development Implications

Future implementation issues should avoid names like "Git-backed publishing"
unless the issue is specifically about the Git adapter.

Better issue names:

- Source workspace adapter contract
- History adapter contract
- Media materialization contract
- Workflow state and transition contract
- Deploy adapter contract
- Cloudflare deploy adapter
- Git source/history adapter
- GitHub review workflow adapter
- Studio publish action model
- CLI publish command over studio core
- MCP diagnostics and publish proposal tools

This naming keeps provider mechanics subordinate to platform intent.

## Verification Expectations

Adapter work should be verified with:

- capability tests;
- fixture adapters;
- dry-run behavior tests;
- diagnostics mapping tests;
- failure probes for missing credentials, missing media, invalid source,
  unsupported operations, failed builds, failed deploys, and irreversible
  actions;
- docs generated from adapter contracts where practical;
- GUI/CLI/MCP parity tests once those interfaces exist.

The target is not just working providers. The target is a platform where
unsupported or dangerous actions are impossible to trigger accidentally.
