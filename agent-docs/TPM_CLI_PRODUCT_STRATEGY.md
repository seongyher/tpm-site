# TPM CLI Product Strategy

This report applies the general CLI design research to the TPM platform CLI.

It is product-specific, but it is not a final command reference. The goal is to
decide what job the CLI should own, where it fits in the static publishing
platform, what adjacent products teach us, what should be built first, and what
contracts must exist before implementation.

## Executive Summary

The TPM CLI should be a static publishing operations interface over the TPM
platform compiler.

It should help terminal-comfortable site owners, publication teams, CI systems,
extension/adapter developers, and future GUI/MCP surfaces turn a site workspace
into validated, previewable, inspectable, deployable static output.

The CLI's product-market fit is not "run Astro with nicer commands" and not
"wrap Cloudflare deploy." Its strongest value is publication-level confidence:
one product surface that can explain whether content, config, routes, media,
metadata, feeds, redirects, PDFs, search data, social images, release artifacts,
and deploy targets are correct before a site is published.

The complete CLI should make these domains feel like one coherent static
publishing system:

1. site workspaces and typed configuration;
2. content lifecycle and publication visibility;
3. media inventory, optimization, dedupe, and migration;
4. source storage, history, backups, and sync;
5. editorial workflow and review/publish policy;
6. diagnostics and repair planning;
7. preview, build, release, artifact, and preservation workflows;
8. provider-neutral publishing, verification, and rollback;
9. import/export and migration from legacy sources;
10. extension, adapter, automation, CI, and MCP interfaces.

The first implementation slice should prove the architecture with diagnostics,
workspace status, build/export, preview, and release reports, but the product
vision is the full control plane above.

The CLI must stay thin. It should translate user intent into typed platform
operations, then render human or machine output. It should not create a
parallel CMS/source/workflow/deploy model.

Implementation direction is now Rust-first. The CLI should be a Rust binary
over shared Rust operation crates, not a Bun script or TypeScript wrapper. The
same operation crates should later power the MCP server, CI integrations, and
Tauri studio backend. The Rust migration plan is documented in
[`RUST_MIGRATION_AND_CLI_PLAN.md`](./RUST_MIGRATION_AND_CLI_PLAN.md).

## Product Thesis

The TPM CLI is for users and teams who want static-site performance,
portability, and versionability, but also want the operational confidence of a
real publishing system.

The thesis:

> A static publishing CLI should not only build files. It should validate a
> publication, explain repairable problems, expose generated artifacts, plan
> provider actions, and produce stable machine-readable reports from the same
> contracts used by the GUI studio, MCP server, CI, and extensions.

This positions the CLI between existing product classes:

- more publishing-aware than static-site generator CLIs;
- more portable and static-first than hosted CMS CLIs;
- less provider-specific than deploy CLIs;
- less Git-assumptive than Git-backed CMS tools;
- more automation-ready than a GUI-only studio.

## Evidence Base

This report uses:

- the evergreen [CLI Design Guide](./CLI_DESIGN_GUIDE.md);
- platform roadmap and studio docs:
  [PLATFORM_ROADMAP.md](./PLATFORM_ROADMAP.md),
  [STUDIO_PRODUCT_VISION.md](./STUDIO_PRODUCT_VISION.md),
  [STUDIO_ADAPTER_MODEL.md](./STUDIO_ADAPTER_MODEL.md), and
  [STUDIO_EXTENSION_MODEL.md](./STUDIO_EXTENSION_MODEL.md);
- platform contracts:
  [PLATFORM_MODULES.md](../docs/PLATFORM_MODULES.md),
  [DEPLOYMENT_ADAPTER_CONTRACT.md](../docs/DEPLOYMENT_ADAPTER_CONTRACT.md),
  [EXTENSION_ARCHITECTURE.md](../docs/EXTENSION_ARCHITECTURE.md),
  [IMPORT_EXPORT_AND_PRESERVATION_POLICY.md](../docs/IMPORT_EXPORT_AND_PRESERVATION_POLICY.md),
  [MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md](../docs/MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md),
  [STUDIO_READINESS_CONTRACTS.md](../docs/STUDIO_READINESS_CONTRACTS.md), and
  [GENERATED_OUTPUT_VERIFIER_CONTRACT.md](../docs/GENERATED_OUTPUT_VERIFIER_CONTRACT.md);
- official docs and product references for adjacent tools including
  [Astro CLI](https://v4.docs.astro.build/en/reference/cli-reference/),
  [Astro content collections](https://v6.docs.astro.build/en/guides/content-collections),
  [Wrangler](https://developers.cloudflare.com/workers/wrangler/commands/),
  [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/),
  [Vercel CLI](https://vercel.com/docs/cli),
  [Netlify CLI](https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/),
  [Hugo](https://gohugo.io/getting-started/usage/),
  [Jekyll](https://jekyllrb.com/docs/usage/),
  [Docusaurus CLI](https://docusaurus.io/docs/3.5.2/cli),
  [MkDocs CLI](https://www.mkdocs.org/user-guide/cli/),
  [Quarto](https://quarto.org/docs/websites/),
  [WP-CLI](https://wordpress.org/cli/),
  [Ghost publishing](https://ghost.org/help/publishing-content/),
  [Ghost CLI](https://docs.ghost.org/ghost-cli/),
  [Decap editorial workflows](https://decapcms.org/docs/editorial-workflows/),
  [TinaCMS](https://tina.io/docs/),
  [Nuxt Studio](https://nuxt.studio/),
  [CloudCannon](https://cloudcannon.com/ai-info/),
  [Webflow CMS](https://help.webflow.com/hc/en-us/articles/33961307099027-Intro-to-the-Webflow-CMS),
  [Squarespace blogging](https://support.squarespace.com/hc/en-us/articles/206543727-Blogging-with-Squarespace),
  [Sanity CLI](https://www.sanity.io/docs/cli-reference),
  [Contentful CLI](https://github.com/contentful/contentful-cli),
  [Strapi Content Manager](https://docs.strapi.io/cms/features/content-manager),
  [Payload](https://payloadcms.com/docs/admin/overview), and
  [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Supporting notes live in
[`cli-product-research/`](./cli-product-research/).

The detailed researched feature matrix is
[`FEATURE_COMPARISON_MATRIX.md`](./cli-product-research/FEATURE_COMPARISON_MATRIX.md).

The explicit alternatives, tradeoffs, and rejected pivots are in
[`DESIGN_DECISION_REVIEW.md`](./cli-product-research/DESIGN_DECISION_REVIEW.md).

Realistic command-flow examples with files, routes, plans, reports, and tool
behavior are in
[`USER_JOURNEY_DESIGNS.md`](./cli-product-research/USER_JOURNEY_DESIGNS.md).

Rust migration, strict tooling, `just`, Tauri, and MCP implications are in
[`RUST_MIGRATION_AND_CLI_PLAN.md`](./RUST_MIGRATION_AND_CLI_PLAN.md).

The cross-interface implementation sequence for CLI, Rust migration, MCP, and
the Tauri/Astro GUI is in
[`CLI_RUST_GUI_INTEGRATION_PLAN.md`](./CLI_RUST_GUI_INTEGRATION_PLAN.md).

## Market And Product Landscape

### Static-Site Generator CLIs

Products surveyed: Astro, Hugo, Eleventy, Jekyll, Docusaurus, MkDocs, Quarto.

Static-site CLIs are excellent at the core lifecycle: create, serve/dev,
build/render, preview/serve, and sometimes deploy. They are usually
developer-first and file-first. Their main product promise is fast static output
from source files.

Lessons to copy:

- keep build/preview fast and boring;
- make local development straightforward;
- preserve static output portability;
- include a `doctor` or check-like diagnostic surface;
- expose generated output as a normal product artifact.

Constraints to avoid:

- assuming users are comfortable debugging framework internals;
- leaving media, metadata, redirects, and generated-output correctness as
  project-specific scripts;
- treating the output folder as the only release contract.

### Deploy Provider CLIs

Products surveyed: Wrangler/Cloudflare, Vercel CLI, Netlify CLI, GitHub Pages
and Actions.

Deploy CLIs are strong at provider-specific setup: login, project linking,
environment variables, deploys, previews, domains, logs, and account resources.
They are not publishing products; they expose the provider's world model.

Lessons to copy:

- support project/provider linking;
- distinguish preview and production deploys;
- expose logs/status;
- support prebuilt output deployment;
- surface active account/project context before dangerous actions.

Constraints to avoid:

- making a provider's vocabulary the root product language;
- requiring Cloudflare, GitHub, Netlify, Vercel, or any provider for local
  authoring;
- hiding provider capability gaps until after upload;
- tying publish to Git push by default.

### Git-Backed Static CMS Products

Products surveyed: Decap CMS, TinaCMS, Nuxt Studio, CloudCannon.

Git-backed CMS products prove there is real demand for editing static content
with a friendly UI while preserving file-based source. They also show a common
trap: Git can leak into the editorial model.

Lessons to copy:

- schema-generated forms;
- visual/code editing over Markdown/MDX/JSON/YAML;
- media libraries for file-based sites;
- real-time preview;
- publishing workflows for teams;
- source changes written back to durable storage.

Constraints to avoid:

- assuming Git is the only source/history/review model;
- mapping publish directly to branch/PR/commit for all users;
- assuming repository-local media is the only media model;
- requiring a production website to be the editing surface.

### No-Code Site CMS Products

Products surveyed: Webflow, Squarespace.

No-code site CMSs are the strongest evidence for the default user experience:
users can create a site, edit content, manage blog posts, work with media,
preview, publish, schedule, invite collaborators, and manage domains without
learning static-site internals.

Lessons to copy:

- simple default authoring and publishing;
- visible publish states such as draft, queued, scheduled, published,
  unpublished, archived, and needs review;
- staging/production distinctions in author language;
- roles and publishing permissions for collaborators;
- backups/restore points as product concepts, not Git concepts.

Constraints to avoid:

- locking site source, media, generated output, deploy targets, and migration
  paths into one vendor;
- hiding release artifacts and generated-output verification from users;
- making automation, local workflows, and extension seams secondary.

### Headless CMS And Managed Publishing Products

Products surveyed: WordPress/WP-CLI, Ghost/Ghost CLI, Sanity, Contentful,
Strapi, Payload.

These tools are mature around authoring, structured content, media, roles,
workflows, import/export, operational maintenance, and admin UX. They usually
trade away some of the static compiler's portability and simplicity by
introducing runtime services, hosted content spaces, databases, or provider
APIs.

Lessons to copy:

- author-first terms: preview, publish, schedule, post settings, restore,
  rollback;
- operational safety: check, backup, logs, rollback, update, repair;
- schema/type generation;
- media as a first-class domain;
- import/export and migration as mature product surfaces.

Constraints to avoid:

- requiring a hosted content database;
- turning a static-site tool into a server CMS;
- copying huge operational command surfaces before contracts are stable;
- making no-code authoring depend on terminal workflows.

## Product Opportunity

Existing tools make different parts of the problem easy, but none combine the
specific blend TPM needs:

- static compiler portability;
- author-language diagnostics;
- schema-driven content/config validation;
- generated artifact inspection;
- media policy and migration planning;
- provider-neutral publish plans;
- CLI/GUI/MCP/CI parity;
- extension/provider capability contracts.

The best opportunity is the "publication doctor plus release artifact" niche:
a serious static publishing operations tool that can answer, "Is this site safe
and correct to publish, and what exactly will be generated?"

This is a real pain because static-site failures often happen outside the
obvious page view:

- old URLs and redirects break;
- social previews use wrong or oversized images;
- RSS/feed/sitemap output drifts;
- PDFs or generated artifacts get too large;
- media remains remote or unoptimized;
- metadata is missing;
- deploy targets cannot represent headers or redirects;
- CI passes but author-facing output is wrong;
- local deploy differs from provider deploy.

The CLI should make these problems inspectable and repairable.

## Feature Matrix Conclusions

The feature comparison matrix shows that adjacent products cluster into several
useful but incomplete shapes:

- static-site CLIs make build/preview fast but leave authoring, media,
  migration, release verification, and provider-neutral publishing to project
  scripts;
- deploy CLIs make provider operations powerful but expose provider vocabulary
  instead of publication vocabulary;
- Git-backed CMS/studio products make static content editable but often turn
  Git into the source, history, and workflow model;
- no-code site products make default authoring simple but usually hide source,
  generated output, migration, automation, and deploy portability inside the
  vendor model;
- managed/headless CMS products prove that roles, versions, workflows, media,
  imports, and APIs are real needs, but they usually introduce a runtime,
  database, hosted content space, or external frontend integration.

The TPM CLI should use those lessons to make complexity feel simpler rather
than making the product smaller. The durable language should be:

- **site** for the site-owner workspace;
- **content** for entries and visibility;
- **media** for source assets, derivatives, metadata, migration, and providers;
- **source** for storage, history, backup, sync, and restore;
- **workflow** for submit, review, approval, rejection, policy, and publishing
  state;
- **check/doctor** for shared diagnostics and repair planning;
- **preview/build/release** for source, output, artifacts, and release bundles;
- **publish** for provider-neutral plan/apply/verify/status/rollback;
- **import/export** for migration and preservation;
- **extension/adapter/MCP** for ecosystem, automation, and agent surfaces.

The comparison argues for one repeated interaction pattern across dangerous or
complex operations:

1. inspect current state;
2. create a plan;
3. review human and machine output;
4. apply explicitly;
5. verify;
6. save a report.

That single pattern should cover publish, migration, repair, import, source
rewrite, media movement, and rollback. It lets default users stay on a simple
path while still giving power users and complex publishers precise control.

## Design Decision Recommendations

The CLI strategy should be read as a product and architecture recommendation,
not only as a possible command list. The central design decision is:

> The CLI is a command-language projection of versioned platform operations.
> Each command should load a workspace context, create or execute a typed
> operation, emit a typed result, and render that result for humans or machines.

This keeps the CLI thin and prevents drift between CLI, GUI, MCP, CI, and
extension behavior. Command handlers should not own source parsing, media
policy, diagnostics, release logic, deploy semantics, or provider behavior.
They should invoke shared operations and render results.

The major product decisions are:

1. **Use publishing domains, not implementation domains.** `site`, `content`,
   `media`, `source`, `workflow`, `check`, `doctor`, `preview`, `build`,
   `release`, `publish`, `import`, `export`, `extension`, `adapter`, and `mcp`
   are stronger durable concepts than `astro`, `wrangler`, `git`, `dist`, or
   `frontmatter`.
2. **Make `publish` canonical and keep `deploy` provider-level.** Users publish
   a release to a target. A provider adapter may deploy it.
3. **Keep `release` first-class.** A release manifest is the audit boundary
   between source, generated output, verification, provider plans, rollback,
   and preservation.
4. **Keep `check` and `doctor` separate but backed by one diagnostics model.**
   `check` gates; `doctor` explains and plans repair.
5. **Keep `source` separate from `workflow`.** Source/history answers where
   state lives and how it syncs. Workflow answers how work is submitted,
   reviewed, approved, rejected, and promoted.
6. **Make `media` first-class.** Media inventory, policy, optimization,
   generated derivatives, accessibility, storage providers, migrations, and
   source rewrites are too important to hide inside article commands.
7. **Use both `extension` and `adapter` deliberately.** An extension is a
   package/composition boundary. An adapter implements a capability such as
   source, media, workflow, build, deploy, identity, diagnostics, or
   observability.
8. **Use plan/apply for risky operations.** Mutating, remote-changing, bulk,
   destructive, import, migration, repair, publish, and rollback operations
   should produce reviewable plans. Simple flows may create plans implicitly,
   but the underlying safety model should remain plan-backed.
9. **Design machine output from the first implementation.** Human output,
   versioned JSON, stable exit codes, and streaming output where needed are
   architecture, not polish.
10. **Use profiles for policy/config and targets for publish destinations.** A
    profile answers how the site is checked or built. A target answers where a
    release is published.
11. **Use `content` as the canonical entry domain.** Article, post, page,
    announcement, collection, and future custom types should live under typed
    content operations, while examples and aliases can still use friendly
    article/post language.
12. **Make guided flows wrappers over exact operations.** Prompts can help TTY
    users with setup, publish, repair, migration, and import, but every answer
    must map to flags, config, files, stdin, or saved plans.
13. **Expose config through shared typed schemas.** CLI config commands should
    explain source, defaults, overrides, profiles, validation, and downstream
    effects instead of creating a separate config model.
14. **Keep the public product language platform-driven, not Astro-specific.**
    Astro can remain the first compiler implementation, but commands should
    speak routes, entries, media, metadata, diagnostics, releases, and publish
    targets.

Several hard pivots were considered and rejected:

- a GUI-only product would still need scripts, and those scripts would become
  an accidental CLI without interface discipline;
- a Cloudflare-first CLI would overfit the product to one deploy provider;
- a GitHub-first workflow would exclude default users and complex publishers;
- an Astro-specific CLI would overfit durable product language to the current
  renderer/compiler substrate;
- a database-first headless CMS would weaken the current static compiler model
  unless treated later as an optional source adapter;
- a tiny CLI that omits media, release, workflow, and import would be simpler
  only by refusing the hard publishing problems that make the product useful.

The detailed alternatives and tradeoffs are recorded in
`agent-docs/cli-product-research/DESIGN_DECISION_REVIEW.md`.

## User Segments And Jobs

### Default Local Publisher

The default local publisher is GUI-first. They may only encounter the CLI
through studio internals or support. The CLI still matters because its contracts
should power the GUI.

Jobs:

- create a site;
- write, preview, publish, unpublish, restore, and roll back;
- add media;
- connect a domain/provider;
- receive repairable diagnostics.

CLI implication:

- Do not design the CLI as the default user's required interface.
- Do design CLI operations so the GUI can reuse them.

### Terminal-Comfortable Site Owner

This is the first direct CLI user.

Jobs:

- open or initialize a site workspace;
- check content/config/media/routes/metadata;
- preview and build;
- inspect generated artifacts;
- publish through configured adapters later;
- export source or release artifacts.

CLI implication:

- The first release should be excellent for this user.

### Collaborative Publication Team

This is the TPM-like user.

Jobs:

- keep site source separate from platform source;
- run local and CI checks with identical diagnostics;
- preview changes before publishing;
- use optional Git/GitHub workflows;
- produce release reports for review;
- eventually move media out of the repo.

CLI implication:

- JSON diagnostics and release reports are early architecture requirements.

### CI And Automation

Jobs:

- check, build, export, and publish non-interactively;
- produce machine-readable diagnostics;
- fail with stable exit codes;
- avoid prompts and hidden side effects.

CLI implication:

- Machine output cannot be added later. It must be part of early design.

### Extension And Adapter Developer

Jobs:

- validate extension manifests;
- inspect adapter capabilities;
- run fixtures;
- prove compatibility with platform contracts.

CLI implication:

- Extension commands can wait, but the CLI architecture should assume them.

### Future GUI Studio And MCP Consumers

Jobs:

- run the same checks, previews, artifact inspections, and publish plans as the
  CLI.

CLI implication:

- The CLI must not create separate business logic.

### Complex Publisher

Jobs:

- integrate custom source, media, workflow, identity, build, deploy, and
  observability systems.

CLI implication:

- Capability-driven adapters and machine-readable reports matter more than
  GitHub-specific conveniences.

## Realistic Journey Design Summary

The command language should be tested against realistic journeys, not only
against abstract command families. The detailed journey designs are in
`agent-docs/cli-product-research/USER_JOURNEY_DESIGNS.md`.

Representative journeys:

1. **Default first blog:** a non-technical user creates
   `~/Sites/mina-field-notes`, writes `site/content/articles/first-summer-walk.md`,
   ingests `site/assets/articles/first-summer-walk/lake-trail.jpg`, previews,
   checks, and publishes without learning Git, frontmatter, or provider jargon.
2. **Publish blocker repair:** a terminal-comfortable owner runs
   `tpm check all --strict`, receives diagnostics for
   `site/redirects.json` and a missing image alt text, creates a route repair
   plan, and manually fixes the human-authored alt text.
3. **TPM-like scholarly article:** a collaborative team creates
   `site/content/articles/baudrillard-and-reaction-memes.md`, checks changed
   metadata/citations/media/social previews, creates a release candidate, and
   submits it through a GitHub workflow adapter.
4. **Media externalization:** a growing publication moves files such as
   `site/assets/articles/concept-jjalbang/ascii-jjalbang.png` to
   `/Volumes/TPM-Media`, reviews a media migration plan, rewrites references,
   and proves generated output did not regress.
5. **Legacy import:** a user imports
   `~/Downloads/wordpress-export-2025-12-31.xml`, preserves old URLs as
   redirects, generates a human review report, and applies only after
   unsupported embeds and weak citations are visible.
6. **CI publish:** automation runs `check`, `build`, `release create`,
   `publish plan`, and `publish apply` with `--ci`, saved JSON/NDJSON reports,
   stable exit codes, and no prompts.
7. **Extension and adapter work:** developers validate extension manifests,
   inspect contributed capabilities, and run fixtures before support CTAs,
   media adapters, workflow adapters, or publish adapters become installable.
8. **MCP and support:** agents and support engineers inspect diagnostics,
   routes, media, provider context, and repair plans without receiving unsafe
   mutation permissions or secret values.
9. **Backup and typed config:** solo publishers add GitHub backup without
   adopting review workflow, and site owners change support/social defaults
   through schema-driven config plans instead of brittle manual edits.

These journeys sharpen the implementation target:

- command specs should include file/artifact examples, not only syntax;
- every mutating command needs a clear safety level and plan/report behavior;
- route, media, metadata, citation, release, provider, and support diagnostics
  need stable codes and author-language remediation;
- the first implementation slice can be narrow, but its operation model must
  be compatible with the mature journeys.

## Command Surface Direction

This section is directional, not a final command spec. Examples use `tpm` as a
placeholder.

### Command Families

The mature CLI should center these domains:

- site workspace, configuration, theme, and provider connections;
- content creation, listing, visibility, restoration, and entry-level checks;
- media inventory, ingest, optimization, dedupe, migration, and reference
  rewrites;
- source storage, history, backup, restore, sync, and diff;
- workflow submit, review, approval, rejection, policy, and publishing state;
- diagnostics and repair planning through `check` and `doctor`;
- preview, build, release, artifact inspection, preservation, and static
  output verification;
- provider-neutral publish plans, apply, status, verify, logs, and rollback;
- import/export from legacy sources and portable archive formats;
- extension, adapter, and MCP surfaces.

Implementation can be phased, but the final grammar should not collapse these
domains into framework commands, provider commands, or one-off scripts.

### Vocabulary

Prefer product words:

- site;
- article;
- media;
- preview;
- check;
- publish;
- rollback;
- artifact;
- release;
- provider;
- target.

Use technical words only in advanced/provider details:

- Astro;
- Cloudflare;
- Git;
- branch;
- pull request;
- Worker;
- frontmatter;
- `dist`.

### Output

Human output should be concise and repair-oriented:

```text
Site check failed: 3 issues

Error ROUTE_REDIRECT_TARGET_MISSING
File: site/redirects.json
Route: /old-url/
Fix: point this redirect to an existing route or remove it.
```

Machine output should be stable JSON with schema version, status, diagnostics,
artifact references, and command context.

### Safety

Risk should determine friction:

- read-only inspect commands: no confirmation;
- source edits/config writes: dry-run and clear file list;
- production publish/media migration/import apply: explicit plan, target
  identity, and non-interactive approval path;
- provider actions: show active provider, account, project/site, URL, and
  rollback capability before execution.

### Interactivity

Prompts are allowed only in TTY mode. Every prompt must have a flag/config/stdin
equivalent. CI must never hang.

## Future Help Contract

This section drafts the final-form `--help` output as if the mature CLI already
existed. It is not an implementation commitment for the first release. It is a
product contract that forces the long-term vision into coherent command
families, vocabulary, safety defaults, and user journeys.

The help text should read like a real tool, but the implementation should still
be phased. Commands can be marked experimental during development, but the
final grammar should already point at the mature publishing system we intend to
build.

### Root Help

```text
tpm - manage, validate, publish, and automate static publications

Usage:
  tpm <command> [subcommand] [options]

Core workflows:
  site          Create, open, configure, upgrade, and inspect site workspaces
  content       Create, list, validate, publish, unpublish, and restore entries
  media         Inventory, ingest, optimize, dedupe, and migrate media assets
  source        Connect source/history providers and manage site snapshots
  workflow      Submit, review, approve, reject, and inspect publishing work
  check         Validate content, config, routes, media, metadata, and output
  doctor        Explain problems and produce repair plans
  preview       Preview source, built output, releases, and generated artifacts
  build         Compile the publication into verified static output
  release       Create, inspect, diff, verify, archive, and restore releases
  publish       Plan, publish, verify, inspect, and roll back deploy targets

Migration and ecosystem:
  import        Plan and apply imports from legacy sources
  export        Export source, archives, releases, and preservation reports
  extension     Install, list, validate, and test platform extensions
  adapter       Inspect source, media, workflow, build, and deploy adapters
  mcp           Serve the platform operation model over MCP

Information:
  status        Show the active site, profile, source, release, and target state
  help          Show help for a command
  completion    Generate shell completion scripts
  version       Show CLI, platform, schema, and adapter versions

Global options:
  --site <path>              Site workspace to operate on
  --profile <name>           Config profile, such as local, preview, production
  --config <file>            Additional config file
  --format <text|json|ndjson>
                             Output format
  --output <path>            Write reports, plans, archives, or artifacts
  --ci                       Disable prompts and use CI-safe output defaults
  --dry-run                  Plan the operation without changing source/output
  --yes                      Approve a previously displayed or saved plan
  --no-color                 Disable ANSI color
  --quiet                    Show only essential output
  --verbose                  Show adapter and diagnostic detail

Examples:
  tpm site init --starter personal-blog
  tpm content new article
  tpm preview
  tpm check --strict
  tpm media inventory
  tpm build --profile production
  tpm release create --from build
  tpm publish plan --target cloudflare-production
  tpm publish apply --plan ./release/publish-plan.json --yes
  tpm workflow submit --provider github
  tpm import wordpress --plan ./wordpress-export.xml
  tpm mcp serve --profile local

Run "tpm help <command>" for command-specific help.
```

### Site Help

```text
tpm site - create and manage site workspaces

Usage:
  tpm site <command> [options]

Commands:
  init          Create a new site workspace from a starter
  open          Register or inspect an existing site workspace
  status        Show site identity, config, source roots, providers, and health
  config        Show, explain, set, unset, validate, plan, or apply typed config
  theme         Inspect or update theme tokens and publication branding
  connect       Connect source, media, workflow, build, or deploy providers
  upgrade       Plan and apply platform/schema migrations
  doctor        Explain workspace/config problems and repair options
  export        Export the site source as a portable workspace archive

Examples:
  tpm site init --starter personal-blog --name "Mina's Photos"
  tpm site status
  tpm site config explain social.defaultImage
  tpm site connect deploy cloudflare
  tpm site upgrade --plan
```

User-journey fit:

- Default local publisher: creates a useful site without seeing platform source.
- TPM-like team: keeps site workspace separate from platform internals.
- Complex publisher: connects custom providers without changing the core model.

### Content Help

```text
tpm content - create and manage publication entries

Usage:
  tpm content <command> [entry] [options]

Commands:
  new           Create an article, announcement, page, collection, or author
  list          List entries by type, state, author, category, tag, or route
  show          Show normalized entry metadata, routes, references, and status
  edit          Open an entry in the configured editor or studio bridge
  check         Validate selected entries and related references
  draft         Move an entry into draft state
  publish       Mark an entry publishable in the source model
  unpublish     Remove an entry from publishable surfaces without deleting it
  restore       Restore a previous source/history snapshot when supported
  diff          Compare entry source, metadata, rendered output, or revisions

Examples:
  tpm content new article --title "A Short Note"
  tpm content list --type article --state draft
  tpm content show articles/a-short-note --format json
  tpm content check --changed
  tpm content unpublish articles/old-post --reason "Needs revision"
```

User-journey fit:

- Default local publisher: gets article creation and publish/unpublish behavior
  without learning frontmatter.
- TPM-like team: checks changed content before review.
- Complex publisher: maps source-history restore/diff to custom adapters.

### Media Help

```text
tpm media - manage media inventory, policy, optimization, and migration

Usage:
  tpm media <command> [options]

Commands:
  inventory     List all referenced, generated, remote, missing, and unused media
  check         Validate media policy, alt text, captions, size, format, and use
  ingest        Add files or provider assets to the active media library
  optimize      Generate optimized derivatives according to media policy
  dedupe        Find duplicate or near-duplicate media candidates
  unused        Report source or generated media that no surface references
  migrate       Plan or apply migration between media providers
  provider      List, connect, inspect, or disconnect media providers
  rewrite       Plan source reference rewrites after media migration

Examples:
  tpm media inventory
  tpm media check --strict
  tpm media ingest ./photos/*.jpg --role article-image
  tpm media migrate --from git --to r2 --plan
  tpm media migrate --plan ./media-plan.json --apply --yes
```

User-journey fit:

- Default local publisher: outgrows repo-local media and receives a guided
  migration plan.
- TPM-like team: identifies large, remote, unused, or unoptimized images before
  release.
- Complex publisher: connects S3, R2, DAM, NAS, or custom media adapters.

### Source And Workflow Help

```text
tpm source - manage source storage, history, snapshots, and backups

Usage:
  tpm source <command> [options]

Commands:
  status        Show active source provider and sync state
  connect       Connect local folder, Git, GitHub, GitLab, or custom providers
  snapshot      Create a source snapshot through the active provider
  backup        Back up source to a configured provider
  restore       Restore source from a snapshot when supported
  diff          Compare source snapshots, branches, or provider revisions
  sync          Pull/push source through a provider when supported

tpm workflow - manage editorial and publishing workflows

Usage:
  tpm workflow <command> [options]

Commands:
  status        Show active workflow provider, current work, and blockers
  submit        Submit local changes or a release candidate for review
  approve       Approve a submitted change when provider policy allows it
  reject        Reject or request changes with a reason
  publish       Promote approved work to a publishable release
  history       Show workflow events, approvals, and publish decisions
  policy        Inspect workflow rules and required checks

Examples:
  tpm source connect github --repo example/site-content
  tpm source snapshot --message "Before media migration"
  tpm workflow submit --provider github --title "New essay"
  tpm workflow status
  tpm workflow approve --item current
```

User-journey fit:

- Default local publisher: can stay local, then add invisible backup/history
  later.
- TPM-like team: uses Git/GitHub as adapters for sync, review, and publishing.
- Complex publisher: maps submit/approve/publish to an internal workflow
  provider without making Git mandatory.

### Check And Doctor Help

```text
tpm check - validate a publication and fail when it is not ready

Usage:
  tpm check [scope] [options]

Scopes:
  all           Content, config, routes, media, metadata, output, providers
  content       Entries, references, slugs, visibility, dates, citations
  routes        Routes, redirects, canonical URLs, old URLs, sitemap
  media         References, optimization, alt/caption policy, generated assets
  metadata      SEO, social previews, structured data, feeds, machine data
  output        Built HTML, links, cache headers, PDFs, search, artifacts
  providers     Connected adapter capabilities, auth, targets, domains

Options:
  --strict                  Enable release-blocking rules
  --changed                 Check only changed source and dependent artifacts
  --profile <name>          Use profile-specific policies
  --format <text|json|ndjson>
                            Output format
  --output <path>           Write diagnostic report

Examples:
  tpm check
  tpm check all --strict --profile production
  tpm check media --format json --ci

tpm doctor - explain problems and create repair plans

Usage:
  tpm doctor [scope] [options]

Commands and options:
  --explain <code>          Explain one diagnostic code
  --fix                     Include safe automatic fixes when available
  --plan <path>             Write a repair plan
  --apply <path>            Apply a previously reviewed repair plan

Examples:
  tpm doctor
  tpm doctor --explain MEDIA_REMOTE_SOURCE
  tpm doctor routes --fix --plan ./repair-plan.json
```

User-journey fit:

- Default local publisher: receives plain-language repair guidance.
- TPM-like team: gets stable local/CI diagnostics with identical codes.
- Complex publisher: consumes diagnostics as JSON/NDJSON in internal systems.

### Preview, Build, And Release Help

```text
tpm preview - preview source, built output, releases, and artifacts

Usage:
  tpm preview [target] [options]

Targets:
  source        Preview source through the local platform compiler
  build         Preview the latest built static output
  release       Preview a saved release bundle
  artifact      Preview a feed, sitemap, PDF, search index, social image, etc.
  provider      Open or create a provider preview when supported

Examples:
  tpm preview
  tpm preview build
  tpm preview artifact social-image --route /articles/a-short-note/

tpm build - compile a publication into verified static output

Usage:
  tpm build [options]

Options:
  --profile <name>          Build with a profile such as preview or production
  --output <path>           Output directory or release staging directory
  --report <path>           Write build and artifact report
  --no-pdf                  Skip optional PDF generation when policy allows it

Examples:
  tpm build
  tpm build --profile production --report ./release/build-report.json

tpm release - create, inspect, verify, diff, archive, and restore releases

Usage:
  tpm release <command> [options]

Commands:
  create        Create a release bundle from source or built output
  inspect       Show release manifest, artifacts, checks, and provider readiness
  verify        Verify a release against output/security/performance policies
  diff          Compare releases by source, route, artifact, or output changes
  archive       Create a preservation archive for a release
  restore       Restore source/output from a release when supported

Examples:
  tpm release create --from build
  tpm release inspect latest
  tpm release diff previous latest
  tpm release archive latest --output ./archives/tpm-release.zip
```

User-journey fit:

- Default local publisher: previews and publishes without thinking about build
  internals.
- TPM-like team: uses release reports for review.
- Complex publisher: treats release bundles as portable artifacts that can
  flow through internal systems.

### Publish Help

```text
tpm publish - plan, apply, verify, inspect, and roll back publish targets

Usage:
  tpm publish <command> [options]

Commands:
  targets       List configured publish targets and adapter capabilities
  plan          Create a publish plan from a release and target
  preview       Publish or open a provider preview when supported
  apply         Apply a reviewed publish plan
  status        Show target status, active release, URLs, and provider health
  verify        Verify a published target against expected release output
  rollback      Roll back to a previous release when supported
  logs          Show provider logs when supported

Options:
  --target <name>           Publish target, such as local, preview, production
  --release <id>            Release to publish
  --plan <path>             Read or write a publish plan
  --yes                     Apply a reviewed plan without prompting

Examples:
  tpm publish targets
  tpm publish plan --target cloudflare-production --release latest
  tpm publish apply --plan ./release/publish-plan.json --yes
  tpm publish status --target production
  tpm publish rollback --target production --to previous
```

User-journey fit:

- Default local publisher: eventually clicks a GUI "Publish" button backed by
  the same plan/apply operation.
- TPM-like team: deploys validated releases through Cloudflare.
- Complex publisher: plugs in deploy targets without changing the product
  command vocabulary.

### Import, Export, Extension, Adapter, And MCP Help

```text
tpm import - plan and apply imports from legacy or external sources

Usage:
  tpm import <source> [options]

Sources:
  wordpress     Import from WordPress export files or APIs
  ghost         Import from Ghost exports or APIs
  substack      Import from supported Substack exports
  markdown      Import from Markdown/MDX folders
  html          Import from static HTML or crawled archives
  custom        Import through a source adapter

Examples:
  tpm import wordpress --plan ./wordpress.xml
  tpm import markdown ./old-blog --plan ./import-plan.json
  tpm import apply ./import-plan.json --yes

tpm export - export source, generated output, archives, and reports

Usage:
  tpm export <kind> [options]

Kinds:
  source        Portable site workspace source
  release       Generated release bundle
  archive       Preservation archive with source maps and manifests
  report        Diagnostics, media, metadata, routes, or release reports

Examples:
  tpm export source --output ./site-source.zip
  tpm export archive --release latest

tpm extension - manage platform extensions

Usage:
  tpm extension <command> [options]

Commands:
  list          List installed and available extensions
  add           Add an extension from a package, path, or registry
  remove        Remove an extension when no dependent config remains
  check         Validate extension manifests and compatibility
  capabilities  Show extension-provided commands, adapters, UI, and policies
  test          Run extension fixtures against platform contracts

tpm adapter - inspect provider adapters

Usage:
  tpm adapter <command> [kind] [options]

Kinds:
  source        Source/history adapters
  media         Media storage adapters
  workflow      Editorial workflow adapters
  build         Build/render adapters
  deploy        Publish/deploy adapters
  identity      Credential and identity adapters

Commands:
  list          List configured and available adapters
  show          Show capabilities, limits, and required credentials
  check         Validate adapter config and required capabilities
  test          Run adapter fixture checks

tpm mcp - expose platform operations to agent tools

Usage:
  tpm mcp <command> [options]

Commands:
  serve         Start an MCP server backed by the active site workspace
  tools         List available MCP tools and safety levels
  check         Validate MCP tool schemas and operation permissions

Examples:
  tpm extension check
  tpm adapter show deploy cloudflare
  tpm mcp serve --profile local
```

User-journey fit:

- Default local publisher: benefits from bundled extensions without seeing
  extension complexity.
- TPM-like team: validates Cloudflare, GitHub, support UI, PDF, and other
  bundled extensions/adapters.
- Complex publisher: integrates custom source, media, workflow, deploy,
  identity, diagnostics, and UI capabilities.

### Help Contract Conclusions

The mature command surface implies several product decisions:

1. `site`, `content`, `media`, `source`, `workflow`, `release`, and `publish`
   are first-class domains.
2. `publish` is the product action; provider-specific deploy behavior lives
   behind target/adapter capabilities.
3. Git is represented by `source` and `workflow` adapters, not by top-level
   product assumptions.
4. Media has to be a first-class domain because repository-local media is only
   one phase of the user journey.
5. `check` and `doctor` are not secondary commands; they are the safety system
   for authors, CI, GUI, MCP, migrations, and deploys.
6. `release` is the bridge between static output and trustworthy publishing.
7. `extension`, `adapter`, and `mcp` keep the platform open without forcing
   every user to care about extension internals.

## Platform Contract Mapping

The CLI should sit on top of platform contracts:

| CLI area                | Platform domain                                                  |
| ----------------------- | ---------------------------------------------------------------- |
| workspace status        | site instance, site config, platform context                     |
| content checks          | content schemas, publishable entries, diagnostics                |
| source/history          | source adapters, snapshots, sync, diffs, backup/restore          |
| workflow                | workflow adapters, editorial state, policy gates, approvals      |
| route inspection        | route registry, feature routes, redirect policy                  |
| media checks            | media policy, article image policy, social images                |
| metadata checks         | metadata graph, semantic metadata, SEO/social/scholarly profiles |
| artifact reports        | generated-output verifier, source artifacts, release governance  |
| build/export            | platform compiler, release artifact builder                      |
| publish/deploy          | deployment adapter contract                                      |
| import/export           | preservation policy and import/export contracts                  |
| extension checks        | extension manifests and catalog lifecycle                        |
| security/release health | static output security, supply chain, performance budgets        |

Missing or immature seams before a real public CLI:

1. CLI operation planning layer.
2. Explicit workspace context object.
3. Versioned diagnostic JSON schema.
4. Release artifact builder.
5. Credential/provider context model.
6. Media inventory and migration planner.
7. Import/export plan ledger.

## Initial Implementation Slice

The first implementation slice should prove the thesis with a narrow surface
without defining the product vision down to that slice.

Recommended first implementation:

1. `status`-style workspace orientation.
2. `check`/`doctor` diagnostics.
3. JSON diagnostics.
4. static build/export command over platform contracts.
5. release/artifact report generation.
6. local preview.
7. route/media/metadata/config inspection.
8. help examples and shell completion if practical.

Explicitly defer:

- full GUI editing;
- full deploy provider matrix;
- media migration apply;
- legacy import apply;
- extension scaffolding;
- GitHub PR workflow automation;
- user/role management;
- scheduling.

## Phase Plan

### Phase 1: Diagnostic And Release Foundation

Build the operation layer, workspace context, diagnostics schema, status/check,
build/export, artifact reports, and local preview.

Success:

- this repo can dogfood the CLI for release review;
- CI can consume JSON diagnostics;
- generated output is inspectable without manually opening `dist/`.

### Phase 2: Publish Adapter Foundation

Add provider-neutral publish plan, static-folder export target, Cloudflare
reference adapter, provider target context, dry-run/execute modes, and deploy
status.

Success:

- publishing is a product action over release artifacts;
- Cloudflare is bundled but not hard-coded as the model.

### Phase 3: Media And Migration Planning

Add media inventory, media diagnostics, remote/oversized/unoptimized/unused
media detection, and media migration plans.

Success:

- users can see why media is risky before asset storage becomes unmanageable.

### Phase 4: Source, History, And Workflow Adapters

Add local and Git source/history adapters, optional GitHub/GitLab workflow
adapters, submit/review/publish capabilities, and source snapshot reports.

Success:

- Git supports TPM-like teams without becoming mandatory.

### Phase 5: Extension And Adapter Developer UX

Add extension list/check/capabilities, manifest validation, adapter capability
inspection, and fixture checks.

Success:

- extension developers can validate against the same contracts core uses.

### Phase 6: Importers And Complex Publisher Integration

Add import plan/apply for selected sources, preservation ledgers, custom
adapter integration, and large-site reporting.

Success:

- legacy migrations become planned, diagnosable, and reviewable.

### Phase 7: GUI And MCP Parity

Expose the same operation contracts to GUI and MCP surfaces.

Success:

- CLI, GUI, MCP, CI, and extensions share diagnostics, artifacts, release
  plans, and provider actions.

## Risk Register

| Risk                                      | Mitigation                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| Git becomes the product model             | Treat Git as source/history/workflow adapter. Use editorial vocabulary. |
| Cloudflare becomes the product model      | Keep publish provider-neutral; Cloudflare is reference adapter.         |
| CLI wraps Bun scripts directly            | Add operation planning layer and typed platform contracts.              |
| Diagnostics diverge across surfaces       | Use one versioned diagnostics schema.                                   |
| Media remains repo-local                  | Add inventory and migration planning.                                   |
| Destructive publish/migration is too easy | Plan-first, explicit target identity, confirmation, saved plans.        |
| JSON output is added late                 | Make machine output part of the first implementation.                   |
| Importers lose historical metadata        | Preservation ledger and manual-review states.                           |
| Secrets leak through flags/logs           | Credential references, redaction, no secret flags by default.           |
| Huge command surface ships early          | Keep early implementation disciplined; add compatibility tests.         |

## Validation Plan

### Documentation

- Every command has examples.
- Every mutating command documents dry-run/plan and non-interactive behavior.
- Config precedence and active context are documented.
- JSON schemas are documented before use.

### Tests

- parser grammar;
- invalid flag combinations;
- workspace context;
- config precedence;
- diagnostics schema;
- release artifact schema;
- JSON output;
- exit code classes;
- stdout/stderr separation;
- no-prompt CI behavior;
- safety classification.

### Fixtures

- default local site;
- TPM-like collaborative site;
- starter site;
- malformed content/config;
- broken media;
- broken redirects/routes;
- metadata/social/feed/PDF failures;
- mock provider unsupported capability states;
- extension manifest errors.

### Dogfooding

- run the CLI on this repo's active site;
- compare output against existing release checks;
- use the release report in PR/release review;
- retire direct user-facing Bun scripts only when CLI replacements are better.

## Handoff Conclusions

The next design packet should not start by naming every command. It should
design the Phase 1 operation contracts:

1. workspace context;
2. diagnostic report schema;
3. status/check operation;
4. build/export operation;
5. release/artifact report;
6. human and JSON renderers;
7. command parser/help contract;
8. fixture and compatibility tests.

After that, command names can be finalized with real implementation constraints
in view.
