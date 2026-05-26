# Opportunity Synthesis

This file records product-market-fit hypotheses, user pain points, and
opportunities where the TPM CLI can make difficult publishing work unusually
easy.

## Working Questions

- What do adjacent products make too technical?
- What do adjacent products make too locked-in?
- What workflows are easy in one product class but hard in another?
- What should TPM make boring, inspectable, and safe?
- What should the CLI intentionally not own?

## What Adjacent Products Make Too Technical

- Connecting content correctness to generated-output correctness.
- Understanding why a static build succeeded but metadata/social/feed/PDF/link
  output is wrong.
- Debugging provider deployment configuration and preview vs production
  differences.
- Migrating media out of a repository or into a different storage provider.
- Preserving old URLs, redirects, RSS, and citation links during migrations.
- Knowing whether generated static output is safe, cacheable, accessible, and
  machine-readable.
- Translating schema/frontmatter errors into author actions.
- Separating platform source from site source.

## What Adjacent Products Make Too Locked-In

- Git-backed CMS tools often make Git the source/history/workflow model.
- Deploy CLIs make one provider's resources the product vocabulary.
- Headless CMS products store content in hosted content spaces/databases.
- Managed publishing products optimize authoring but can reduce source
  portability.
- Static-site generators keep output portable but leave operations up to
  bespoke project scripts.

## Workflows TPM Can Make Easy

### One Site Health Command

Run one command and get a publication-level answer:

- content valid;
- config valid;
- media references valid;
- routes and redirects valid;
- metadata/social previews valid;
- feeds and sitemaps valid;
- generated artifacts valid;
- deploy adapter ready;
- release report ready.

This is the clearest product-market-fit opportunity because it combines static
compiler rigor with author-language repair.

### Artifact Inspection

Make generated output visible:

- routes;
- redirects;
- RSS/feed entries;
- sitemap URLs;
- metadata profiles;
- JSON-LD entities;
- social images;
- PDFs;
- search data;
- media derivatives;
- deploy bundle.

Most static-site workflows treat generated output as a folder. TPM can treat it
as a typed release artifact.

### Provider-Agnostic Publish Plan

Before publishing, show:

- target provider and site;
- source workspace;
- artifact bundle;
- route/domain changes;
- redirects affected;
- cache policy;
- irreversible actions;
- rollback capability;
- credentials/account context.

This borrows Terraform's plan/apply safety but uses publishing vocabulary.

### Media Inventory And Migration

Make media boring:

- list media sources and generated derivatives;
- detect oversized/unoptimized/unreferenced/remote media;
- identify source ownership;
- plan repo-to-external migration;
- update references safely;
- preserve alt/caption/metadata.

This solves a real scaling path from hobby blog to team publication.

### Import With Preservation Diagnostics

Import should not just copy files. It should explain:

- content mapped;
- metadata preserved;
- unknown fields;
- missing assets;
- old URLs and redirects;
- citation/reference uncertainty;
- manual review needed.

This is a future differentiator for migration from legacy blogs.

## Product-Market-Fit Hypothesis

The CLI fits best as a serious static publishing operations tool: not a
developer-only static-site generator CLI, not a hosted CMS CLI, and not a
provider deploy wrapper.

The target niche is users and teams that want static-site performance,
portability, and versionability, but also want the operational confidence of a
real CMS: diagnostics, previews, media policy, migrations, publish planning,
metadata correctness, and machine-readable release reports.

## Product Promise

The user gives the platform a site workspace and a publishing intent. The CLI
explains whether that intent is valid, previews what will be generated, builds
portable static artifacts, and publishes through configured adapters only after
the plan is clear.

## Differentiators

1. Publication-level diagnostics instead of framework-only build errors.
2. Static artifact manifest instead of opaque `dist/` output.
3. Provider-agnostic publish plans instead of provider-specific deployment
   commands as the root model.
4. Media policy and migration as first-class concerns.
5. Same contracts for CLI, GUI, MCP, and CI.
6. Author-language repair by default, structured JSON for automation.

## Opportunity Constraints

- The CLI must stay useful before the GUI exists.
- The CLI must not overfit to TPM's current repo layout.
- The CLI must not force Git workflows onto simple users.
- The CLI must not pretend to solve visual editing.
- The CLI must not bypass platform contracts for convenience.
- The CLI must remain small enough for users to learn.
