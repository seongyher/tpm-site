# Feature Catalog And Competitive Matrix

This file catalogs feature patterns across adjacent products. It is working
material for the final TPM CLI product strategy report.

## Feature Areas

- Initialization and templates.
- Authoring and content editing.
- Content modeling and validation.
- Media and asset management.
- Preview and local development.
- Build, export, and static output.
- Deploy and hosting.
- Migration, import, and export.
- Diagnostics and repair.
- Collaboration, review, and history.
- Extensions, adapters, and integrations.
- CLI ergonomics and machine output.
- Auth, secrets, and provider setup.
- Governance, versioning, and compatibility.

## Competitive Matrix

| Product class                                                                     | Strong feature areas                                                                                                    | Common gaps                                                                                                             | Lessons for TPM CLI                                                                                                                                                  |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static-site generators: Astro, Hugo, Eleventy, Jekyll, Docusaurus, MkDocs, Quarto | Init, local preview, build, static output, theme/docs workflows, basic deploy commands                                  | Nontechnical authoring, media storage policy, migration, provider abstraction, rich generated-output diagnostics        | Keep static compiler speed and portability, but add publishing-specific diagnostics, artifact inspection, and adapter-aware operations.                              |
| Deploy-provider CLIs: Wrangler, Vercel, Netlify, GitHub Pages/Actions             | Auth, project linking, local provider emulation, preview/prod deploys, logs, environment variables, domains             | Provider lock-in, technical vocabulary, hidden account/resource state, confusing preview/prod differences               | Treat deploy providers as adapters. Product commands should speak publish/preview/rollback/status, while adapter commands explain provider details only when needed. |
| Git-backed CMS: Decap, Tina, Nuxt Studio, CloudCannon                             | Browser editing over files, schema/form editing, media libraries, Git commits, editorial workflow, live previews        | Git is often the source/workflow assumption; non-Git default users are underserved; asset storage can stay repo-centric | Support Git-backed workflows as optional source/history/workflow adapters. Keep editorial actions independent of Git mechanics.                                      |
| Headless CMS: Sanity, Contentful, Strapi, Payload                                 | Schemas, rich admin UI, media, workflows, import/export, migrations, typegen, APIs, roles                               | Runtime/database/hosted content model, operational burden, portability tradeoffs, pricing/lock-in                       | Copy schema-driven UX, import/export maturity, typegen, and media richness without losing static source portability.                                                 |
| Managed publishing: Ghost, WordPress                                              | Author-first editing, previews, scheduling, post settings, media, roles, operational maintenance, mature CLI automation | Server/database state, plugin/runtime complexity, static portability is secondary                                       | Copy author vocabulary and operational safety surfaces: preview, publish, schedule, backup/export, rollback, logs, check.                                            |

## Feature Area Findings

### Initialization And Templates

Patterns:

- Static-site tools provide `new`, starter templates, and local project
  scaffolding.
- Provider CLIs provide `init`, `link`, `create`, or account/project setup.
- CMS tools often scaffold both source structure and runtime/admin resources.

TPM implications:

- The CLI eventually needs `init` for a site workspace, but it should not assume
  platform source lives with site content.
- Starter selection should be typed and inspectable, not a copy/paste bundle of
  hidden assumptions.
- Default setup should be useful without Git or deploy provider configuration.
- Provider linking should be a separate capability after local site creation.

### Authoring And Content Editing

Patterns:

- Static-site CLIs generally do not solve editing; they expect text editors.
- Git-backed CMS products provide visual editors and form editors over files.
- Managed CMS products provide rich author-first editors, previews, scheduling,
  and post settings.

TPM implications:

- The CLI should not pretend to be the final GUI editor.
- It can still support author workflows through `new`/`draft`/`check`/`preview`
  style operations, content templates, and diagnostics.
- The CLI should share schemas and generated form metadata with the future GUI
  rather than maintaining separate prompts.

### Content Modeling And Validation

Patterns:

- Astro, Sanity, Payload, Contentful, and Nuxt Studio all treat schemas as core.
- Static-site tools often validate enough to build but not enough for a
  nontechnical repair workflow.
- Headless CMS tools make schema/type generation central to developer UX.

TPM implications:

- Validation is a differentiator. The CLI should expose the platform compiler's
  diagnostics clearly and in JSON.
- Schema-derived field descriptions, allowed values, and examples should power
  both CLI help and future GUI forms.
- Invalid state should fail before build/deploy, not during provider upload.

### Media And Asset Management

Patterns:

- Static-site generators generally treat assets as files.
- Git-backed CMS tools often store uploads in the repository by default.
- Headless CMS products treat media/assets as a first-class library with
  metadata, previews, transformations, and external storage options.
- Payload and Contentful show that asset export/import and storage adapters are
  complex enough to be their own domain.

TPM implications:

- Media cannot remain a repo-only assumption.
- The CLI should eventually support media inventory, validation, migration
  plans, and adapter capability checks.
- First useful CLI can start by diagnosing local media policy and generated
  image outputs.
- Later phases should add `media inspect`, `media migrate --dry-run`, and
  provider-backed media adapters.

### Preview And Local Development

Patterns:

- Static-site CLIs have `serve`, `dev`, `preview`, or `server`.
- Deploy providers emulate platform behavior locally to reduce environment
  drift.
- CMS tools provide live preview, shareable preview URLs, or production editing
  previews.

TPM implications:

- Preview should cover pages and generated artifacts: metadata, feed, sitemap,
  search data, PDFs, redirects, social images, and deploy bundle health.
- Provider emulation should be adapter-aware and optional.
- The CLI should distinguish local source preview, built-output preview, and
  deploy-provider preview.

### Build, Export, And Static Output

Patterns:

- Static-site CLIs build to an output directory.
- Quarto demonstrates multi-format rendering as a first-class concept.
- Provider CLIs can deploy prebuilt output.
- Headless CMS tools emphasize export because portability is nontrivial.

TPM implications:

- Build output should be inspectable as artifacts, not just a `dist/` folder.
- `export` should eventually produce portable site workspaces and generated
  artifacts separately.
- Static output security, metadata, feeds, and redirects should be verified
  before deploy.

### Deploy And Hosting

Patterns:

- Provider CLIs own deploys, environments, domains, logs, previews, and secrets.
- GitHub Pages/MkDocs style tools often expose a direct deploy command.
- Git-backed CMS tools often rely on CI/CD after committing changes.

TPM implications:

- The CLI should expose publish as a provider-agnostic product action with
  adapter-specific capabilities.
- First-class publish behavior needs `plan`, `status`, and eventually
  `rollback`.
- Git push/PR/CI deploy should be one workflow, not the core publishing model.

### Migration, Import, And Export

Patterns:

- Contentful, WP-CLI, and Sanity expose import/export as operational features.
- Static-site generators often leave migration to one-off scripts.
- CMS products need exports because content source and generated output are
  distinct.

TPM implications:

- Migration is a major product opportunity because static sites often accumulate
  bespoke content and asset debt.
- CLI import/export should produce plans, diagnostics, and reversible steps.
- Early implementation should include introspection foundations even if full
  importers wait.

### Diagnostics And Repair

Patterns:

- Jekyll has `doctor`; Ghost CLI checks environment problems; provider CLIs
  expose logs; headless CMS tools validate schemas.
- Few tools combine content, routes, metadata, links, media, deploy readiness,
  accessibility, and generated-output diagnostics as one product surface.

TPM implications:

- `doctor`/`check` is likely the CLI's strongest differentiator.
- Diagnostics should be author-language by default and machine-readable for CI.
- Diagnostics should include stable codes, file/route/artifact references,
  severity, and remediation.

### Collaboration, Review, And History

Patterns:

- Git-backed CMS tools map drafts/reviews to branches and PRs.
- Managed CMS products provide internal statuses, scheduling, roles, and
  revisions.
- Provider platforms provide deploy previews tied to branches/commits.

TPM implications:

- The CLI should not hard-code review as PRs.
- Source/history/workflow adapters should report capabilities.
- Product vocabulary should stay draft, preview, submit, publish, rollback,
  not branch/commit/merge unless the adapter requires details.

### Extensions, Adapters, And Integrations

Patterns:

- Astro and Docusaurus have integrations/plugins/themes.
- WP-CLI has packages and custom commands.
- CMS products expose apps/plugins/custom components.
- Provider CLIs are usually tightly coupled to one provider.

TPM implications:

- CLI commands should be backed by platform extension manifests and adapter
  capabilities.
- Bundled adapters such as Cloudflare/local/Git should be replaceable.
- Extension developers need diagnostic and manifest commands eventually.

### CLI Ergonomics And Machine Output

Patterns:

- Provider and infrastructure CLIs increasingly support automation, but human
  output often remains provider-specific.
- GitHub CLI, Terraform, kubectl, and gcloud show structured output,
  formatting, and machine-readable contracts.

TPM implications:

- Every diagnostic/build/deploy/status command should have stable JSON output.
- Human output should emphasize repair and next steps.
- The CLI should be usable by CI and future MCP/agent workflows without scraping
  prose.

### Auth, Secrets, And Provider Setup

Patterns:

- Provider CLIs handle login/linking and project context.
- CMS tools often need OAuth, API tokens, and role-specific access.
- Secrets become dangerous when exposed through flags/logs/config.

TPM implications:

- Auth must be adapter-specific and redacted by default.
- The CLI should expose active provider/account/site context before dangerous
  actions.
- Local-only workflows should not require provider login.

### Governance, Versioning, And Compatibility

Patterns:

- Mature CLIs become long-lived contracts.
- CMS import/export formats, migration scripts, machine output, and plugin APIs
  need versioning.

TPM implications:

- CLI command grammar, JSON output, diagnostic codes, generated artifact
  manifests, and extension/provider contracts need compatibility policy before
  public release.
- Experimental commands should be explicitly marked.

## Feature Priority Synthesis

### Table Stakes For A Useful First CLI

- Initialize or identify a site workspace.
- Check/doctor content, config, routes, metadata, media references, redirects,
  and generated-output readiness.
- Preview local source and built output.
- Build/export static output.
- Report diagnostics in human and JSON modes.
- Inspect routes, artifacts, config, and active site context.

### Differentiators

- One diagnostics model covering content, media, metadata, routes, deploy
  readiness, and generated artifacts.
- Provider-agnostic publishing vocabulary with adapter-specific plans.
- Media policy inspection and later media migration plans.
- Static artifact manifest and release report as first-class outputs.
- Same contracts usable by GUI, CLI, MCP, and CI.

### Later Mature Capabilities

- Git/source/history workflow adapters.
- Cloudflare, GitHub Pages, Netlify, Vercel, and custom deploy adapters.
- Importers from WordPress/Ghost/Markdown folders/headless exports.
- Media migrations between repo, local disk, cloud drive, object storage, and
  SaaS asset providers.
- Extension catalog, extension diagnostics, and scaffolded extension projects.
- Author-friendly content creation/editing prompts generated from schemas.

### Constraints To Avoid Copying

- Making Git the default product model.
- Making Cloudflare or any provider the core publishing model.
- Treating repo-local assets as the media model.
- Letting generated static output be a black box.
- Exposing framework/runtime jargon to authors.
- Shipping a huge WP-CLI-sized surface before the domain contracts are stable.
