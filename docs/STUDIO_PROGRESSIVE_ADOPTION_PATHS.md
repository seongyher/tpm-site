# Studio Progressive Adoption Paths

This document is the design packet for `IRK-147`: migration and upgrade paths
from simple local publishing to advanced provider-backed publishing without
rebuilding the site or losing source truth.

The studio should let users adopt more sophisticated storage, media, workflow,
and deploy models one concern at a time. The simple default should remain
excellent. Advanced paths should be additive and reversible where practical.

Related documents:

- [STUDIO_PRODUCT_VISION.md](../agent-docs/STUDIO_PRODUCT_VISION.md)
- [STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md](../agent-docs/STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md)
- [STUDIO_ADAPTER_MODEL.md](../agent-docs/STUDIO_ADAPTER_MODEL.md)
- [STUDIO_PROVIDER_CAPABILITY_MATRIX.md](./STUDIO_PROVIDER_CAPABILITY_MATRIX.md)

## Goals

1. Make simple local publishing the default path.
2. Let users add backup, history, external media, collaboration, automated
   publishing, and complex integrations without source drift.
3. Treat migrations as planned, dry-run operations with source diffs,
   diagnostics, rollback, and export snapshots.
4. Keep GitHub, Cloudflare, external drives, Google Drive, S3-like storage, and
   enterprise providers as examples, not requirements.

## Adoption Ladder

| Rung                       | User need                                 | Added capability                                         | Expected migration                                             |
| -------------------------- | ----------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| 1. Instant solo publishing | write and publish with no technical setup | app-managed workspace, local history, recommended deploy | create workspace, connect provider, publish                    |
| 2. Domain configuration    | use a custom domain                       | canonical domain config, DNS guidance                    | update site config and provider target                         |
| 3. Backup and history      | avoid data loss                           | source/history provider                                  | export or sync workspace to provider                           |
| 4. Media externalization   | avoid bloated source storage              | media provider                                           | move media, rewrite media references, materialize build inputs |
| 5. Collaboration           | multiple editors                          | source sync, workflow policy, identity                   | connect shared source/history/workflow providers               |
| 6. Automated publishing    | avoid one local publish machine           | build/deploy provider or CI                              | move build/publish from local app to provider-backed workflow  |
| 7. Complex integration     | use existing enterprise systems           | custom source/media/workflow/build/deploy adapters       | configure provider profiles and extension seams                |

Each rung should be independently useful. Users should not be forced into a
large platform migration just to solve one problem.

## Migration Operation Model

Every migration should produce:

- migration ID;
- source workspace snapshot;
- affected source references;
- provider capability report;
- credential requirement report;
- dry-run plan;
- source diffs;
- media reference rewrites when applicable;
- generated-output effects;
- diagnostics;
- rollback plan or limitation;
- export snapshot;
- audit event.

The product should show a human summary first and advanced details on demand.

## Migration Safety Rules

1. Dry-run first.
2. Never delete the only source copy without an export snapshot.
3. Never rewrite media references without usage and materialization checks.
4. Never assume provider write support until capabilities and credentials are
   checked.
5. Keep partial migrations recoverable.
6. Emit user-language diagnostics for blocked migrations.
7. Preserve canonical route, metadata, feed, search, PDF, and redirect behavior
   unless the user explicitly changes it.

## Key Migration Paths

### App-Managed Source To Git Or External Source

Used when a default user wants backup, history, or collaboration.

Plan:

1. Export source workspace snapshot.
2. Validate source with current schemas.
3. Create provider target or identify existing target.
4. Write source through source adapter.
5. Create restore point or history record.
6. Verify provider source reads back to the same logical workspace.
7. Switch workspace source adapter.

Git is one possible source/history provider. The GUI should explain this as
"Back up this site" or "Sync this site," not as "create repository" unless the
user opens advanced details.

### Repo-Local Media To External Media Provider

Used when a site outgrows source-repo assets.

Plan:

1. Inventory media and usage.
2. Detect originals, optimized derivatives, public passthrough files, and
   unused assets.
3. Upload or move media to provider.
4. Create stable media IDs.
5. Rewrite article/config media references.
6. Verify materialized build inputs.
7. Run preview and generated-output checks.
8. Keep rollback snapshot with original references.

The media provider must support materialization or declare an explicit
unoptimized escape hatch.

### Local Direct Publish To Provider-Backed Publish

Used when a user wants CI, hosted build, or a different deploy path.

Plan:

1. Inspect current deploy target and release artifact.
2. Check new provider capabilities and credentials.
3. Create preview or dry-run deploy plan.
4. Verify redirects, headers, caching, domains, and rollback support.
5. Publish when approved.
6. Store previous target and rollback notes.

Cloudflare can be the recommended bundled deploy provider, but not the only
model.

### Solo Publish To Optional Review

Used when a team starts collaborating.

Plan:

1. Enable workflow provider.
2. Define workflow states and allowed transitions.
3. Map product actions to provider mechanics.
4. Verify source write and review comment capabilities.
5. Require review only for configured surfaces or roles.
6. Keep direct publish available where policy allows it.

Review should be a workflow policy. It should never be forced on a personal
blog.

### Static Site Import

Used when a user migrates from another blog or static site.

Plan:

1. Import into an isolated workspace.
2. Preserve original source and generated references.
3. Normalize content and media through import diagnostics.
4. Map routes and redirects.
5. Validate metadata and public URLs.
6. Generate preview and difference report.
7. Apply when the user accepts the conversion.

Importers should optimize for preservation first and polish second.

## Failure And Recovery

Failure states:

- provider unavailable;
- insufficient credentials;
- unsupported capability;
- source conflict;
- media materialization failure;
- generated-output regression;
- partial provider write;
- rollback unavailable.

Recovery responses:

- retry after provider status changes;
- reconnect or rescope credentials;
- choose another provider;
- keep current provider and export snapshot;
- roll back source changes;
- restore previous workspace source;
- continue with manual steps.

No migration should strand the user between two incompatible states without a
known recovery path or explicit limitation.

## Verification Plan

Later implementation should add fixtures for:

- local publisher to Git-backed source/history;
- repo-local media to external media provider;
- direct local publish to provider-backed deploy;
- solo publish to review workflow;
- provider failure during migration;
- partial media upload;
- rollback after failed migration;
- export snapshot correctness;
- generated-output parity before and after migration;
- user-language migration diagnostics.

## Handoff

Milestone 10 should implement adapter capability runtime. Milestone 12 should
implement real migration plans for source, media, workflow, and deploy paths.
Import/export and preservation policy should remain aligned with
[IMPORT_EXPORT_AND_PRESERVATION_POLICY.md](./IMPORT_EXPORT_AND_PRESERVATION_POLICY.md).
