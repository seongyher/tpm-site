# Release Governance

Release governance turns a static build into a traceable platform event. A
release is not just "run build and deploy." It is a bundle of compatibility
decisions, generated-output evidence, deployment adapter results, manual launch
steps, and rollback guidance.

The implementation lives in `src/lib/release-governance.ts` and is exposed
through `src/platform/release.ts` for future CLI, MCP, studio, CI, and docs
consumers.

## Policy

Every release change should declare:

- impacted surface: deployment, frontmatter, metadata, output, platform API,
  routes, or site config;
- impact: patch, minor, security, deprecation, or breaking;
- source file or artifact;
- human-readable summary.

Breaking changes must include:

- a migration note;
- a compatibility note;
- a rollback note.

Deprecation changes must include a deprecation note. This keeps platform users
from discovering source/config/output changes only after a build, deploy, or
studio action fails.

## Release Report

`createReleaseGovernanceReport()` produces a deterministic report from:

- release ID and version;
- release changes;
- deployment adapter results;
- generated-output verification summary when available.

The report includes:

- summary counts for changes, breaking changes, blocking diagnostics, output
  errors, and output warnings;
- deployment status rows per adapter target;
- launch checklist rows for release diagnostics, generated-output
  verification, adapter manual steps, and breaking-change follow-up;
- sorted release-change rows;
- release-governance diagnostics.

`formatReleaseGovernanceMarkdownReport()` renders the report as stable Markdown
so CI artifacts, CLI output, GUI panels, and MCP tools can display the same
information.

## Diagnostics

Release-governance diagnostics are separate from generated-output diagnostics.
Generated-output diagnostics say whether the static files are correct.
Release-governance diagnostics say whether the release decision is adequately
documented and deployable.

Current diagnostics:

- `release.breaking-migration-note-missing`;
- `release.breaking-compatibility-note-missing`;
- `release.breaking-rollback-note-missing`;
- `release.deprecation-note-missing`;
- `release.deployment-blocked`.

Blocking deployment adapter results become release-governance errors. Manual
adapter steps become checklist rows. This lets a release be "build-clean" but
still clearly blocked from publish if a provider target cannot execute safely.

## Launch Checklist

The generated checklist is intentionally conservative:

- release-governance diagnostics must be resolved;
- generated-output verification must have zero errors;
- required adapter manual steps remain unchecked until a deploy operator or
  site owner completes them;
- breaking changes require confirmed migration, compatibility, and rollback
  notes.

The checklist is designed for both technical maintainers and future
non-technical studio flows. The GUI can show the same required/manual steps
without exposing Wrangler, redirects, or cache headers as loose tribal
knowledge.

## Compatibility Boundaries

Use release governance when changes touch:

- public URLs, redirects, canonical URLs, route registry, sitemap, RSS, search,
  social images, PDFs, or generated files;
- frontmatter schemas, site config schemas, semantic metadata profiles, or
  extension manifests;
- deployment adapters, cache headers, security headers, origin policies,
  provider credentials, or rollback behavior;
- package/platform entrypoints or future extractable APIs.

Patch-level implementation-only changes can still record a change row when a
maintainer wants traceability, but only breaking and deprecation changes have
strict note requirements.

## Verification

Focused tests cover:

- missing breaking-change migration, compatibility, and rollback notes;
- stable Markdown release reports;
- deployment adapter status aggregation;
- blocked deployment adapters becoming release-governance errors;
- platform entrypoint exposure.

Release-level scripts can later wrap these pure helpers to write JSON and
Markdown artifacts during `check:release` or a future `release:report`
command.
