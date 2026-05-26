# User Segments And Jobs-To-Be-Done

This file maps likely CLI users and adjacent studio users to concrete jobs and
success criteria.

## Segments

- Default local publisher.
- Terminal-comfortable site owner.
- Collaborative publication team.
- CI and automation.
- Extension and adapter developer.
- Future GUI studio and MCP consumers.
- Complex publisher or institution.

## Segment: Default Local Publisher

This user is mostly GUI-first, but the CLI still matters because it may power
the studio internally or become an advanced escape hatch.

Jobs:

- Create a site without understanding framework source.
- Write, preview, publish, unpublish, restore, and roll back.
- Add images without learning image optimization, public paths, or storage.
- Connect a domain or publish provider through guided steps.
- Recover from broken content/config with plain-language diagnostics.

CLI relevance:

- Indirect interface for GUI/studio operations.
- Direct interface only for support, advanced troubleshooting, or migration.

Success criteria:

- They never need to know Git, Astro, Wrangler, frontmatter, build logs, or
  asset pipelines to succeed.
- If they see CLI output, it explains a problem and next step in editorial
  language.

## Segment: Terminal-Comfortable Site Owner

This user can run terminal commands but does not want to maintain platform
internals.

Jobs:

- Create or open a site workspace.
- Add content from templates.
- Validate the entire site before publishing.
- Preview locally.
- Build static output.
- Deploy through configured providers.
- Inspect routes, redirects, metadata, feeds, PDFs, and media outputs.
- Export or back up source and generated output.

CLI relevance:

- Primary direct interface.
- This is the first direct implementation's most important user.

Success criteria:

- Common workflows are one or two obvious commands.
- Diagnostics are precise enough to fix content/config without reading source
  code.
- Provider details stay behind adapters until needed.

## Segment: Collaborative Publication Team

This user group resembles TPM: multiple people, site content likely in a repo,
checks in CI, deploys through a configured provider.

Jobs:

- Keep site workspace separate from platform source.
- Run checks locally and in CI with identical diagnostics.
- Preview changes before merge/publish.
- Use GitHub or another source/history provider without making Git the product
  model.
- Manage media even if repo-local assets eventually move elsewhere.
- Produce release reports for review.

CLI relevance:

- Direct interface for maintainers and CI.
- Indirect interface for GUI review/publish workflows later.

Success criteria:

- CI output, local output, and future GUI diagnostics share stable codes.
- Generated artifacts can be inspected before review.
- Workflow adapters can support direct publish, PR review, or custom policy.

## Segment: CI And Automation

This is not a person, but it is a first-class consumer.

Jobs:

- Validate content/config/routes/media/metadata/generated artifacts.
- Build or export static output.
- Produce JSON diagnostics and release reports.
- Deploy with non-interactive, explicit approval.
- Fail loudly with stable exit codes and artifacts.

CLI relevance:

- Direct interface.

Success criteria:

- No prompts in automation.
- Stable JSON output.
- Deterministic exits.
- stdout/stderr separation.
- Secrets redacted.
- Commands can run without local editor/browser assumptions.

## Segment: Extension And Adapter Developer

This user builds deploy adapters, media adapters, importers, diagnostics,
generated artifacts, or UI/studio extensions.

Jobs:

- Scaffold extension/adapters.
- Validate manifests and capability declarations.
- Run fixture tests against platform contracts.
- Inspect diagnostics and generated outputs owned by an extension.
- Verify compatibility with platform versions.

CLI relevance:

- Direct interface in later phases.

Success criteria:

- Extension boundaries are explicit.
- Invalid manifests fail before runtime.
- Test fixtures are easy to run.
- Docs are generated or linked from manifest metadata.

## Segment: Future GUI Studio And MCP Consumers

These consumers should use the same platform contracts as the CLI.

Jobs:

- Run checks and previews.
- Produce structured diagnostics.
- Create/update content and config through validated schemas.
- Plan and execute publish operations.
- Inspect artifacts, routes, media, and deploy status.

CLI relevance:

- The CLI is a proving ground for contracts, not a separate implementation.

Success criteria:

- No separate source model.
- No separate diagnostics model.
- No separate deploy model.
- Command planning logic can be reused by GUI/MCP where appropriate.

## Segment: Complex Publisher Or Institution

This user has unknown source, media, identity, workflow, build, deploy, and
observability systems.

Jobs:

- Integrate platform compiler with existing systems.
- Use custom source/media/workflow/deploy adapters.
- Enforce compliance, approval, identity, and audit requirements.
- Run large migrations and media inventories.
- Generate machine-readable diagnostics and artifacts for other systems.

CLI relevance:

- Direct interface for operators and adapter developers.
- Integration surface for bespoke automation.

Success criteria:

- Adapter boundaries are capability-driven.
- Unsupported operations are rejected early.
- Large outputs can stream or write artifacts.
- The platform does not assume GitHub, Cloudflare, repo-local media, or local
  disk as the only valid environment.

## Jobs-To-Be-Done Summary

| Job                   | Current adjacent-product pain                                                                  | TPM CLI opportunity                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Create a site         | Static tools scaffold code projects; CMS tools create runtime apps or hosted spaces            | Create a site workspace as publishing source, separate from platform source.                                             |
| Check a site          | Existing tools validate pieces: build, schema, provider config, or server env                  | One diagnostics model for content, config, routes, metadata, media, links, feeds, PDFs, redirects, and deploy readiness. |
| Preview safely        | SSG preview covers pages; CMS preview covers editor state; provider preview covers deployments | Distinguish source preview, built-output preview, generated artifact preview, and provider preview.                      |
| Publish/deploy        | Provider CLIs expose provider vocabulary; Git-backed CMS maps publish to Git                   | Product action with provider adapters and dry-run plan/status output.                                                    |
| Manage media          | Repo assets are simple but fragile; CMS media libraries are rich but hosted/runtime-bound      | Media policy, inventory, diagnostics, and adapter migration without locking into repo assets.                            |
| Migrate/import/export | Static sites rely on scripts; headless CMS has export tooling but hosted models                | Planned import/export with diagnostics and preservation guarantees.                                                      |
| Collaborate           | Git-backed CMS often exposes Git mechanics; managed CMS hides portability                      | Optional source/history/workflow adapters over editorial vocabulary.                                                     |
| Automate              | Many tools require parsing human output or provider-specific logs                              | Stable JSON diagnostics, release reports, artifact manifests, and exit codes.                                            |

## Product Thesis Draft

The TPM CLI should be a static publishing operations interface over the TPM
platform compiler.

It should help terminal-comfortable site owners, teams, CI systems, and future
studio/MCP surfaces turn a site workspace into validated, previewable,
inspectable, deployable static output. Its strongest differentiation is not
that it can run a build; it is that it can explain whether a publication is
correct across content, routes, media, metadata, generated artifacts, and
provider readiness before users publish.

## Non-Goals Draft

- Do not build a general shell framework.
- Do not wrap every Bun script directly.
- Do not require Git, GitHub, Cloudflare, or repo-local assets for default use.
- Do not expose Astro internals as the product model.
- Do not make the CLI the final GUI editor.
- Do not ship a huge operational surface before contracts are stable.
- Do not make commands that the future GUI/MCP cannot reuse conceptually.
