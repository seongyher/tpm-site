# Adjacent Product Survey

This file records product notes for CLIs, static-site tools, CMS products,
headless CMS products, and publishing platforms that are relevant to the TPM
CLI product strategy.

## Product Rubric

- Product category.
- Target user.
- Product model.
- Important feature set.
- Workflow assumptions.
- Strengths.
- Weaknesses or constraints.
- CLI lessons.
- Relevance to TPM CLI.

## Static Site And Framework CLIs

### Astro

- **Category:** Static-first web framework CLI.
- **Target user:** Developers building Astro sites.
- **Product model:** Project CLI over a framework build system and content
  collections.
- **Feature set:** Dev server, build, check, preview, sync content/types, add
  integrations, telemetry, docs.
- **Workflow assumptions:** User is already in a code project and comfortable
  with package managers. Content validation is framework-level, not an authoring
  product.
- **Strengths:** Clear lifecycle commands and useful content schema/type
  generation. `astro check` is a strong precedent for compiler-backed content
  validation.
- **Weaknesses/constraints:** The CLI is developer-first. It does not manage
  editorial workflows, media storage migrations, publishing adapters, or
  nontechnical authoring.
- **TPM lesson:** Build on Astro ideas but expose author/site-owner language:
  check, preview, build, export, and publish should report platform diagnostics,
  not just framework errors.

### Hugo

- **Category:** Fast static-site generator.
- **Target user:** Developers and technical site owners.
- **Product model:** File-based source compiles to static output.
- **Feature set:** New site, content creation, build, local server, modules,
  themes, deployment usually through CI or host-specific configuration.
- **Workflow assumptions:** Users work in files and deploy generated output or
  Git-triggered builds.
- **Strengths:** Speed and simple build/server model.
- **Weaknesses/constraints:** Authoring and publishing UX are outside core CLI;
  module/theme complexity can expose technical details.
- **TPM lesson:** Fast static compilers are loved when build/preview is boring.
  The opportunity is to pair fast static output with higher-level diagnostics,
  media, metadata, and publish workflows.

### Eleventy

- **Category:** Flexible static-site generator.
- **Target user:** Developers who want low framework coupling.
- **Product model:** Source files and templates compile to an output folder.
- **Feature set:** Build, watch, serve, input/output configuration, dry run,
  optional JSON output, deployment via host build commands.
- **Workflow assumptions:** Users wire build scripts and hosting themselves.
- **Strengths:** Flexible, simple, file-first, and friendly to custom pipelines.
- **Weaknesses/constraints:** The flexibility leaves authoring, media,
  deployment, and diagnostics mostly to project conventions.
- **TPM lesson:** Keep static output portable, but make the surrounding
  operational needs first-class.

### Jekyll

- **Category:** Blog-aware static-site generator.
- **Target user:** Technical bloggers and GitHub Pages users.
- **Product model:** Markdown/source files compile to `_site`.
- **Feature set:** `new`, `build`, `serve`, `clean`, `doctor`, themes, help,
  config flags.
- **Workflow assumptions:** File-based authoring and local preview.
- **Strengths:** The `doctor` command is a useful precedent for configuration
  and deprecation diagnostics.
- **Weaknesses/constraints:** Ruby ecosystem, theme/plugin compatibility, and
  GitHub Pages coupling can be confusing for nontechnical users.
- **TPM lesson:** A first-class `doctor` command should be central, but should
  speak in author/site-owner language and cover generated artifacts too.

### Docusaurus

- **Category:** Documentation/static-site generator.
- **Target user:** Developer documentation teams.
- **Product model:** React/docs framework with theme customization and static
  build output.
- **Feature set:** Start, build, serve, deploy, clear, swizzle, translations,
  heading IDs.
- **Workflow assumptions:** Developer-owned docs site with theme/component
  customization.
- **Strengths:** Explicit docs-specific operations and a customization path.
- **Weaknesses/constraints:** Swizzling can copy framework internals into user
  space, increasing maintenance burden.
- **TPM lesson:** Customization needs stable extension points. Avoid making
  users eject internals for ordinary site-specific UI needs.

### MkDocs

- **Category:** Documentation static-site generator.
- **Target user:** Documentation writers and developers.
- **Product model:** Markdown docs plus YAML config compile to static site.
- **Feature set:** New, serve, build, `gh-deploy`, dependency inspection.
- **Workflow assumptions:** Documentation-oriented file tree and GitHub Pages
  style deploys.
- **Strengths:** Small command surface that is easy to understand.
- **Weaknesses/constraints:** Publishing workflows are largely provider-specific
  and docs-centric.
- **TPM lesson:** A disciplined initial command surface is preferable to
  copying every mature CMS operation at once.

### Quarto

- **Category:** Technical publishing system.
- **Target user:** Researchers, analysts, technical writers, educators.
- **Product model:** Source documents render to many formats, including
  websites, PDFs, slides, and documents.
- **Feature set:** Render, preview, publish, multi-format output, IDE
  integration.
- **Workflow assumptions:** Users often need reproducible documents and
  multi-format publication.
- **Strengths:** Strong render/preview/publish vocabulary and multi-artifact
  model.
- **Weaknesses/constraints:** Domain is technical/academic and may be too broad
  for ordinary blog users.
- **TPM lesson:** Treat generated artifacts as a product surface. Static site,
  PDFs, feeds, metadata, search data, and deploy bundles should be inspectable.

## Deploy Provider CLIs And Hosts

### Cloudflare Wrangler And Workers Static Assets

- **Category:** Deploy/provider CLI.
- **Target user:** Developers deploying Workers, static assets, storage, and
  edge infrastructure.
- **Product model:** Provider CLI over Cloudflare platform resources.
- **Feature set:** Dev, deploy, versions, assets, bindings, logs, KV/R2/D1,
  secrets, config.
- **Workflow assumptions:** User understands Cloudflare account/project
  resources and `wrangler` configuration.
- **Strengths:** Powerful end-to-end provider operations; static assets and
  Worker code can deploy together.
- **Weaknesses/constraints:** Provider vocabulary is too technical for default
  authors and should not become the core product model.
- **TPM lesson:** Cloudflare should be a bundled deploy adapter with clear
  `publish`/`deploy` product semantics, not the CLI's root vocabulary.

### Vercel CLI

- **Category:** Deploy/provider CLI.
- **Target user:** Developers deploying web apps and static output to Vercel.
- **Product model:** Provider CLI manages projects, environments, domains,
  builds, deploys, logs, and automation.
- **Feature set:** Deploy, prebuilt deploy, dev, build, pull env, logs, DNS,
  certificates, project management.
- **Workflow assumptions:** Vercel project exists or can be linked; provider
  owns deployment environment.
- **Strengths:** Smooth deploy loop and local environment replication.
- **Weaknesses/constraints:** Provider lock-in and environment/provider concepts
  are central.
- **TPM lesson:** The CLI should support provider adapters and prebuilt static
  artifact deployment, but keep output artifacts portable.

### Netlify CLI

- **Category:** Deploy/provider CLI.
- **Target user:** Developers deploying static/Jamstack sites and functions.
- **Product model:** Provider CLI links sites, runs local dev, deploys previews
  and production, manages contexts.
- **Feature set:** Init/link/create, dev, deploy, deploy contexts,
  environment/config, continuous deployment setup.
- **Workflow assumptions:** Repository and provider project are connected for
  many advanced workflows.
- **Strengths:** Clear preview vs production deploy model and local production
  environment emulation.
- **Weaknesses/constraints:** Repo/provider integration is a lot of machinery
  for a solo author.
- **TPM lesson:** Preview and production deploy contexts are important, but
  should be framed as publishing targets with dry-run/status output.

### GitHub Pages And Actions

- **Category:** Static hosting and automation.
- **Target user:** GitHub users publishing static output.
- **Product model:** Git-backed static deploy via branch, custom workflow, or
  action artifact.
- **Feature set:** Custom domains, CNAME files, GitHub Actions workflows,
  artifact deployment.
- **Workflow assumptions:** GitHub repository is the source/history/deploy
  anchor.
- **Strengths:** Ubiquitous and portable for developers.
- **Weaknesses/constraints:** Nontechnical users can get stuck on CNAME,
  DNS, repository settings, and workflow configuration.
- **TPM lesson:** GitHub Pages should be a deploy adapter. Domain behavior and
  CNAME generation need provider-specific diagnostics.

## Git-Backed CMS And Static CMS Products

### Decap CMS

- **Category:** Open-source Git-backed CMS.
- **Target user:** Static-site teams who want a browser CMS over Git files.
- **Product model:** Admin UI edits files in Git-backed repositories.
- **Feature set:** Collections config, media gallery, backends, editorial
  workflow, draft/review/publish mapped to branches and pull requests.
- **Workflow assumptions:** Git is the persistence/workflow model.
- **Strengths:** Demonstrates a practical browser CMS over file-based static
  sites and Git workflows.
- **Weaknesses/constraints:** Product actions map directly to Git mechanics,
  which can be inappropriate for default solo authors.
- **TPM lesson:** Support Git-backed workflows, but keep Git as an optional
  adapter behind editorial actions.

### TinaCMS

- **Category:** Git-backed headless CMS and visual editor.
- **Target user:** Developers and content editors for Git-backed sites.
- **Product model:** Editing UI over Markdown, MDX, and JSON stored in Git.
- **Feature set:** Visual editing, forms, schemas, GraphQL/content API,
  Markdown/MDX/JSON storage.
- **Workflow assumptions:** Git-backed source is desirable and developers set
  up the editing experience.
- **Strengths:** Strong schema-driven editing over portable files.
- **Weaknesses/constraints:** Framework coupling and Git assumptions can be
  burdensome for simple users.
- **TPM lesson:** Schema-driven editing is core, but the platform should allow
  local-only and non-Git source adapters.

### Nuxt Studio

- **Category:** Self-hosted Git-backed CMS for Nuxt Content.
- **Target user:** Nuxt Content site owners and teams.
- **Product model:** In-production visual/code/form editor that writes content
  changes to Git and relies on CI/CD for deployment.
- **Feature set:** Visual Markdown/MDC editor, schema-generated forms, media
  library, GitHub/GitLab commits, OAuth, real-time preview, i18n, self-hosting.
- **Workflow assumptions:** Nuxt Content and Git-backed publishing.
- **Strengths:** Very close adjacent product for schema-driven static content
  editing with live preview and Git integration.
- **Weaknesses/constraints:** Tied to Nuxt; Git remains central.
- **TPM lesson:** This validates the schema-driven studio direction. TPM can
  differentiate with provider-agnostic source/media/deploy adapters, static
  artifact diagnostics, and CLI/MCP parity.

### CloudCannon

- **Category:** Commercial Git-based visual CMS for static sites.
- **Target user:** Agencies, marketing teams, and static-site teams with
  nontechnical editors.
- **Product model:** Visual CMS writes Markdown/JSON/YAML/TOML back to Git and
  can build static sites for previews.
- **Feature set:** Visual editing, content/data/source editors, Git-backed
  versioning, build/previews, editor/developer split.
- **Workflow assumptions:** Git repository remains the content source.
- **Strengths:** Strong editor autonomy without abandoning developer stacks.
- **Weaknesses/constraints:** Commercial platform and Git-centered source
  model.
- **TPM lesson:** The editor/developer split is right; TPM should make the same
  idea work for local, Git, and complex source adapters.

## Headless CMS And Managed Publishing Products

### WordPress And WP-CLI

- **Category:** Mature CMS plus operational CLI.
- **Target user:** Site owners, agencies, developers, operators.
- **Product model:** Database/server CMS with browser admin and scriptable CLI.
- **Feature set:** Posts, media, users, themes, plugins, options, database,
  imports/exports, search-replace, packages, multisite, maintenance.
- **Workflow assumptions:** WordPress installation and database are live state.
- **Strengths:** Mature operational CLI that can automate nearly every admin
  action.
- **Weaknesses/constraints:** Huge surface, mutable server state, plugin/theme
  ecosystem complexity.
- **TPM lesson:** Mature CLI scope can eventually include media, options,
  migration, users, packages/extensions, and repair, but the initial
  implementation must stay disciplined.

### Ghost And Ghost CLI

- **Category:** Managed/self-hosted publishing CMS plus operational CLI.
- **Target user:** Writers, newsletter publishers, self-hosted operators.
- **Product model:** Author-first publishing app with server operations CLI.
- **Feature set:** Editor previews for web/email/social, scheduling,
  newsletters, post settings, share previews, CLI install/update/check/backup/
  rollback/logs/config.
- **Workflow assumptions:** Ghost app/server/database is the live product.
- **Strengths:** Excellent author vocabulary and operational safety.
- **Weaknesses/constraints:** Static output and file portability are not the
  main model.
- **TPM lesson:** Copy the author language around preview/publish/schedule and
  the operational language around check/backup/rollback/logs; avoid server
  state assumptions.

### Sanity

- **Category:** Headless CMS/content lake and Studio.
- **Target user:** Developers and teams modeling structured content.
- **Product model:** Hosted content lake plus customizable Studio and CLI.
- **Feature set:** Init, dev Studio, docs search, Studio deploy, typegen,
  schema validation/extraction/deploy, dataset operations.
- **Workflow assumptions:** Hosted content APIs are source of truth.
- **Strengths:** Strong schema/typegen/data operations story.
- **Weaknesses/constraints:** Hosted content lake lock-in and API/data model.
- **TPM lesson:** Type generation, schema validation, and dataset import/export
  are useful analogues for file/static source work.

### Contentful

- **Category:** API-first headless CMS.
- **Target user:** Digital product teams with structured content workflows.
- **Product model:** Hosted spaces/environments with entries, assets, content
  models, APIs, migrations, and CLI.
- **Feature set:** CLI init, space management, import/export JSON, migration
  scripts; export support for entries, assets, content models, tags, locales,
  roles, webhooks, and more.
- **Workflow assumptions:** Hosted content and API management.
- **Strengths:** Mature import/export and migration framing.
- **Weaknesses/constraints:** Hosted data model and environment complexity.
- **TPM lesson:** Portability requires explicit export/import surfaces and
  migration plans, not just local files.

### Strapi

- **Category:** Open-source headless CMS.
- **Target user:** Developers building custom CMS-backed APIs.
- **Product model:** Server/database CMS with admin panel and cloud deploy
  options.
- **Feature set:** Scaffold, develop, build admin, start, generate resources,
  cloud login/deploy/link.
- **Workflow assumptions:** Developers own backend deployment and database.
- **Strengths:** Fast backend scaffolding and customizable CMS/API generation.
- **Weaknesses/constraints:** Deployment and environment setup can be complex
  because runtime/database/admin state are coupled.
- **TPM lesson:** Static publishing can avoid many runtime operational burdens;
  the CLI should preserve that advantage.

### Payload

- **Category:** TypeScript-first headless CMS and admin framework.
- **Target user:** Developers who want a customizable CMS inside a Next.js app.
- **Product model:** Typed collections generate admin UI, APIs, previews,
  drafts, versions, diffing, uploads, and custom components.
- **Feature set:** Admin panel, collection config, uploads/media, local API,
  previews, versions, custom UI.
- **Workflow assumptions:** Database-backed app with developer-controlled
  schema.
- **Strengths:** Type-safe admin and rich editorial features.
- **Weaknesses/constraints:** Database/server deployment and storage adapters
  add operational complexity.
- **TPM lesson:** Type-safe schema-to-UI is valuable, but static source and
  portable artifacts should remain core.

## Survey Conclusions

1. Static-site CLIs are strong at `new`/`serve`/`build`/`deploy`, but weak at
   authoring, media policy, rich diagnostics, migration, and nontechnical
   publishing.
2. Deploy-provider CLIs are strong at provider operations, but their vocabulary
   is too technical and provider-specific to become a publishing product model.
3. Git-backed CMS products prove that browser editing over files is useful, but
   often over-identify publishing with Git commits, pull requests, or CI.
4. Headless CMS products are strong at schemas, media, workflows, import/export,
   and admin UX, but often trade away static portability and introduce hosted
   data/runtime complexity.
5. Mature operational CLIs such as WP-CLI and Ghost CLI show that a publishing
   CLI eventually needs check, backup/export, logs/status, migration, repair,
   and extension management, not just build/deploy.
6. TPM's CLI opportunity is to combine the portability of static files, the
   correctness of a compiler, the diagnostics of a site doctor, and the
   provider abstraction of a studio platform.
