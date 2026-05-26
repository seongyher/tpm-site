# Feature Comparison Matrix

This matrix compares relevant blog/site publishing features across adjacent
products and the mature TPM CLI/platform vision.

The purpose is product design, not procurement. The matrix should help us make
the CLI language smaller, clearer, and more expressive by showing where other
products expose complexity, hide important operations, or solve only one part
of the publishing lifecycle.

## Reading Key

| Mark         | Meaning                                                                  |
| ------------ | ------------------------------------------------------------------------ |
| **Target**   | First-class in the mature TPM platform/CLI vision.                       |
| **Native**   | Product supports this directly in its core product model.                |
| **Partial**  | Product supports part of the feature, but with important limits.         |
| **Plugin**   | Supported through plugins, integrations, themes, or custom code.         |
| **Provider** | Supported inside one hosting/provider model.                             |
| **Manual**   | Possible through user scripts, project conventions, or external tooling. |
| **GUI**      | Supported primarily through GUI/studio/admin UX, not as a CLI operation. |
| **Dev**      | Developer-oriented; not a simple author/site-owner feature.              |
| **No**       | Not a meaningful supported feature for the product class.                |

Cells may combine marks when a feature exists but the user experience differs
from our target. For example, **GUI/Git** means the product supports the
feature through a browser UI, but Git remains the source/workflow assumption.

## Product Groups

The matrix uses product groups to stay readable:

- **Static-site CLIs:** Astro, Hugo, Eleventy, Jekyll, Quarto.
- **Deploy CLIs:** Cloudflare Wrangler, Vercel CLI, Netlify CLI, GitHub
  Pages/Actions.
- **Static CMS/studios:** Decap CMS, TinaCMS, Nuxt Studio, CloudCannon.
- **No-code site CMSs:** Webflow, Squarespace.
- **Managed/headless CMSs:** WordPress/WP-CLI, Ghost, Sanity, Contentful,
  Strapi, Payload.

Primary sources are recorded in
[`SOURCE_LOG.md`](./SOURCE_LOG.md). Important source families include official
CLI docs for static-site and deploy tools, official CMS/admin docs for managed
systems, and official no-code publishing docs for Webflow and Squarespace.

## Feature Taxonomy

The features are organized around user jobs:

1. Create or open a site.
2. Configure the site without editing platform code.
3. Write and manage articles/pages.
4. Preview and validate changes.
5. Manage media and generated assets.
6. Build static output and inspect artifacts.
7. Publish, verify, and roll back.
8. Collaborate, review, and keep history.
9. Import, export, and preserve content.
10. Extend, automate, and integrate with other systems.

## Matrix 1: Static-Site And Deploy Tooling

These tools are strongest around build, preview, and deployment. They generally
do not solve nontechnical authoring, media migration, publication-level
diagnostics, or provider-neutral publishing.

| Feature                             | TPM target                            | Astro                   | Hugo              | Eleventy        | Jekyll              | Quarto               | Wrangler                | Vercel                   | Netlify                  | GitHub Pages         |
| ----------------------------------- | ------------------------------------- | ----------------------- | ----------------- | --------------- | ------------------- | -------------------- | ----------------------- | ------------------------ | ------------------------ | -------------------- |
| Create site/starter                 | Target: `site init` starters          | Native/Dev              | Native/Dev        | Manual/Dev      | Native/Dev          | Native/Dev           | No                      | Partial/provider project | Partial/provider project | Manual               |
| Site config explanation             | Target: typed config explain          | Dev                     | Dev               | Dev             | Dev                 | Dev                  | Provider config         | Provider config          | Provider config          | Provider config      |
| Content collections/schema          | Target: author-facing schemas         | Native/Dev              | Partial           | Manual          | Partial             | Partial              | No                      | No                       | No                       | No                   |
| Article/page creation               | Target: `content new` templates       | Manual                  | Native/Dev        | Manual          | Native/Dev          | Native/Dev           | No                      | No                       | No                       | No                   |
| Visual authoring                    | Future GUI; CLI backs it              | No                      | No                | No              | No                  | No                   | No                      | No                       | No                       | No                   |
| Draft/schedule/review state         | Target: source/workflow adapters      | Manual                  | Manual            | Manual          | Partial/frontmatter | Partial              | No                      | No                       | No                       | Git/manual           |
| Media library                       | Target: media domain                  | Manual                  | Partial/resources | Manual          | Static files        | Manual               | R2/provider only        | Provider assets limited  | Provider assets limited  | Manual               |
| Media inventory/dedupe/migration    | Target: first-class plans             | Manual                  | Manual            | Manual          | Manual              | Manual               | No                      | No                       | No                       | No                   |
| Local preview                       | Target: source/build/release previews | Native                  | Native            | Native          | Native              | Native               | Provider dev            | Native/provider          | Native/provider          | Actions/manual       |
| Built-output preview                | Target                                | Native                  | Native/manual     | Native/manual   | Native              | Native               | Provider                | Native                   | Native                   | Manual               |
| Static build/render                 | Target                                | Native                  | Native            | Native          | Native              | Native               | No                      | Provider build/deploy    | Provider build/deploy    | Actions/manual       |
| Generated artifact manifest         | Target: release artifact model        | Partial build output    | Manual            | Partial JSON    | Manual              | Partial multi-output | Provider output         | Provider output          | Provider output          | Actions artifact     |
| Publication-level check             | Target: `check`/`doctor`              | Partial framework check | Manual            | Partial dry-run | Partial `doctor`    | Partial              | Provider validation     | Provider validation      | Provider validation      | Actions status       |
| JSON/NDJSON diagnostics             | Target stable schema                  | Partial                 | Manual            | Partial         | Manual              | Partial              | Provider JSON/logs      | Provider/logs            | Provider/logs            | Actions APIs         |
| Social/feed/PDF/search verification | Target output verifier                | Manual/plugins          | Manual/plugins    | Manual/plugins  | Manual/plugins      | Partial PDF/docs     | No                      | No                       | No                       | No                   |
| Provider-neutral publish plan       | Target                                | Manual                  | Manual            | Manual          | Manual              | Manual               | No/provider-specific    | No/provider-specific     | No/provider-specific     | No/provider-specific |
| Preview deploys                     | Target through adapters               | Manual                  | Manual            | Manual          | Manual              | Provider-specific    | Provider                | Provider                 | Provider                 | Provider/actions     |
| Production deploy                   | Target through adapters               | Manual                  | Manual            | Manual          | Manual              | Native publish       | Native provider         | Native provider          | Native provider          | Native/actions       |
| Rollback/status/logs                | Target through adapters               | Manual                  | Manual            | Manual          | Manual              | Provider-specific    | Provider                | Provider                 | Provider                 | Actions/manual       |
| Extension/plugin model              | Target extensions/adapters            | Native integrations     | Native modules    | Native plugins  | Native plugins      | Native extensions    | Provider plugins/config | Provider integrations    | Provider integrations    | Actions              |
| Machine automation                  | Target                                | Dev CLI                 | Dev CLI           | Dev CLI         | Dev CLI             | Dev CLI              | Native/Provider         | Native/Provider          | Native/Provider          | Native/Provider      |

### Static-Site And Deploy Lessons

- Static-site CLIs prove that `init`, `preview`, and `build` should stay fast
  and boring.
- Deploy CLIs prove that `link`, `status`, `logs`, preview deploys, and
  production deploys are useful, but provider vocabulary should not be the
  product vocabulary.
- TPM's opportunity is the missing layer between build and deploy:
  publication-level diagnostics, artifact inspection, release reports, media
  policy, and provider-neutral publish plans.

## Matrix 2: Static CMS, Studio, And No-Code Site Products

These products are strongest around editing and author experience. Git-backed
static CMS tools preserve file workflows but often assume Git. No-code site
CMSs are very approachable but tend to lock source, deployment, and automation
inside the vendor model.

| Feature                         | TPM target                               | Decap                      | TinaCMS                          | Nuxt Studio            | CloudCannon                 | Webflow                    | Squarespace               |
| ------------------------------- | ---------------------------------------- | -------------------------- | -------------------------------- | ---------------------- | --------------------------- | -------------------------- | ------------------------- |
| No-code site creation           | Future GUI over `site init`              | Partial/Git setup          | Partial/Git setup                | Partial/Nuxt           | Partial/developer setup     | Native/GUI                 | Native/GUI                |
| File/source portability         | Target source adapters                   | Native/Git                 | Native/Git                       | Native/Git             | Native/Git                  | No/vendor DB               | No/vendor DB              |
| Platform/source separation      | Target                                   | Partial                    | Partial                          | Partial                | Partial                     | No                         | No                        |
| Schema/form editing             | Target GUI; CLI schema source            | Native config              | Native schema                    | Native schema          | Native data/editor config   | Native CMS fields          | Partial settings/forms    |
| Visual editing                  | Future GUI                               | Partial/admin forms        | Partial/visual editing           | Native                 | Native                      | Native                     | Native                    |
| Markdown/MDX authoring          | Target                                   | Native Markdown            | Native Markdown/MDX              | Native MDC/Markdown    | Native depending SSG        | No/native rich CMS         | No/native rich editor     |
| Drafts                          | Target                                   | Native editorial workflow  | Git/content state                | Git/content state      | Native editing sessions/Git | Native CMS states          | Native                    |
| Scheduled publishing            | Target through workflow/publish adapters | No/core                    | No/core                          | Provider/Git dependent | Partial/provider dependent  | Native CMS item scheduling | Native blog scheduling    |
| Review/approval                 | Target workflow adapters                 | Native Git workflow        | Partial/Git                      | Git workflow           | Native collaborative review | Native roles/permissions   | Native needs-review/roles |
| Roles/permissions               | Target identity adapters                 | Provider/backend dependent | TinaCloud/Git dependent          | Auth/team dependent    | Native                      | Native                     | Native                    |
| Live preview                    | Target source/build/release              | Partial                    | Native/in-app                    | Native real-time       | Native                      | Native                     | Native                    |
| Media library                   | Target media domain                      | Native/repo media          | Native repo or external provider | Native                 | Native                      | Native assets              | Native assets             |
| External media providers        | Target adapters                          | Plugin/manual              | Native custom provider           | Limited/provider       | Provider integrations       | No/vendor asset system     | No/vendor asset system    |
| Media inventory/migration plans | Target                                   | No                         | No                               | No                     | No                          | No                         | No                        |
| Full static build ownership     | Target                                   | External SSG/host          | External framework               | Nuxt Content           | External SSG/build          | Vendor hosted              | Vendor hosted             |
| Artifact/release reports        | Target                                   | No                         | No                               | No                     | Partial build logs          | No                         | No                        |
| Provider-neutral deploy         | Target                                   | Git/host dependent         | Git/host dependent               | Git/host dependent     | Git/host integrations       | Vendor hosted              | Vendor hosted             |
| Custom domain setup             | Target via deploy adapters               | Host dependent             | Host dependent                   | Host dependent         | Host dependent              | Native                     | Native                    |
| Import/export                   | Target preservation plans                | Partial Git files          | Partial Git files                | Partial Git files      | Git/files                   | Partial CSV/API            | Partial import/export     |
| Old URL/redirect preservation   | Target migration diagnostics             | Manual                     | Manual                           | Manual                 | Manual                      | Native/manual redirects    | Native/manual redirects   |
| Extension/custom UI             | Target extensions                        | Widgets/backends           | Fields/components                | Nuxt modules           | Editing config/components   | App/custom code limits     | Extensions/integrations   |
| CLI and JSON automation         | Target first-class                       | Limited                    | Dev tooling                      | Dev tooling            | Limited                     | API/limited                | Limited                   |

### Static CMS And No-Code Lessons

- The simplest user experiences come from GUI products, but they often trade
  away source portability and provider neutrality.
- Git-backed static CMSs keep content portable, but Git mechanics leak into
  editorial workflow.
- TPM should treat the CLI as the same operation language used by the GUI, not
  as the author's required daily interface.
- `source`, `workflow`, `media`, and `publish` adapters are the clean way to
  preserve no-code defaults while still supporting TPM-like teams and complex
  publishers.

## Matrix 3: Managed And Headless CMS Products

These products are strongest around mature content management: roles, versions,
media, custom content models, imports, APIs, and operations. Their tradeoff is
that they usually introduce a database, hosted content space, or runtime system
that is not a portable static publishing workspace.

| Feature                         | TPM target                      | WordPress/WP-CLI             | Ghost                          | Sanity                            | Contentful                     | Strapi                          | Payload                 |
| ------------------------------- | ------------------------------- | ---------------------------- | ------------------------------ | --------------------------------- | ------------------------------ | ------------------------------- | ----------------------- |
| Rich authoring UI               | Future GUI                      | Native                       | Native                         | Native Studio                     | Native web app/Studio          | Native admin                    | Native admin            |
| CLI for content operations      | Target                          | Native WP-CLI                | Partial operational CLI/API    | Native CLI/Dev                    | Native CLI/API                 | Native CLI/Dev                  | Dev tooling             |
| Custom content types/schemas    | Target typed schemas            | Native/custom fields/plugins | Partial                        | Native schemas                    | Native content models          | Native content types            | Native collections      |
| Draft/publish state             | Target                          | Native                       | Native                         | Native draft/published            | Native entry states            | Native draft/publish            | Native drafts           |
| Scheduling                      | Target workflow/publish adapter | Native                       | Native                         | Plugin/custom                     | Native/limited by workflows    | Partial/plugin                  | Custom/plugin           |
| Versions/revisions              | Target source/history adapters  | Native revisions             | Partial/member/published state | Native history                    | Native versioning              | Partial                         | Native versions         |
| Roles/permissions               | Target identity adapters        | Native                       | Native                         | Native                            | Native                         | Native RBAC                     | Native access control   |
| Workflow/review                 | Target workflow adapters        | Plugins/native roles         | Partial                        | Native releases/workflows by plan | Native tasks/workflows by plan | Native releases/review features | Custom/workflow plugins |
| Media library                   | Target media domain             | Native                       | Native                         | Native assets                     | Native assets                  | Native media library            | Native uploads          |
| External media/storage          | Target media adapters           | Plugins                      | Limited/storage config         | Asset pipeline/custom             | Hosted assets/APIs             | Providers/plugins               | Storage adapters        |
| Media inventory/migration plans | Target                          | Plugins/manual               | Import/export                  | APIs/manual                       | Export/API                     | Manual/API                      | Manual/API              |
| Preview                         | Target                          | Native/theme/plugin          | Native previews                | Native preview/custom             | Native preview APIs            | Native preview                  | Native live preview     |
| Static build/output ownership   | Target                          | Plugin/static export         | Headless/static integration    | External frontend                 | External frontend              | External frontend               | External frontend       |
| Generated artifact reports      | Target                          | Plugin/manual                | No                             | No                                | No                             | No                              | No                      |
| Provider-neutral publish plan   | Target                          | No                           | No                             | No                                | No                             | No                              | No                      |
| Import/export/migration         | Target planned imports          | Native/WP-CLI                | Native import/export           | APIs/CLI                          | CLI export/import/migration    | APIs/plugins                    | APIs/seed/custom        |
| Old URL/redirect preservation   | Target diagnostics              | Plugins/manual               | Manual                         | External frontend                 | External frontend              | External frontend               | External frontend       |
| Extension ecosystem             | Target extensions/adapters      | Native plugins               | Integrations                   | Plugins/apps                      | Apps/extensions                | Plugins                         | Plugins                 |
| Machine-readable automation     | Target                          | Native CLI/API               | API/CLI                        | Native CLI/API                    | Native CLI/API                 | CLI/API                         | API/dev                 |
| Source portability              | Target                          | Database export              | Ghost export                   | Hosted content lake               | Hosted content space           | Database                        | Database/files          |

### Managed And Headless Lessons

- Mature CMSs prove that roles, versions, workflows, media, imports, and APIs
  are real publishing needs, not edge cases.
- They also show why TPM should not make a database or hosted content space the
  default source model.
- TPM should copy the expressive content/workflow/media vocabulary while
  preserving static output, source portability, provider-neutral publishing,
  and generated-output verification.

## Feature Coverage Synthesis

| User need             | Best existing examples                                        | Common product friction                                           | TPM design target                                                                  |
| --------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Start a site easily   | Webflow, Squarespace, Astro/Hugo starters                     | No-code tools lock source; SSG starters expose code               | `site init` plus GUI starter flow creates site source without platform source.     |
| Write articles simply | Ghost, WordPress, Squarespace, CloudCannon                    | Static tools assume editors/files; CMS tools lock runtime/source  | GUI editor later; CLI `content new/list/check` uses same schemas.                  |
| Keep content portable | Astro/Hugo/Jekyll, Decap/Tina/CloudCannon                     | Portability often means Git and developer setup                   | Source adapters: local by default, Git optional, custom source possible.           |
| Preview safely        | Static CLIs, Ghost, Webflow, Nuxt Studio                      | Preview means different things: source, build, provider, or draft | `preview source/build/release/artifact/provider` makes preview target explicit.    |
| Validate everything   | Astro check, Jekyll doctor, provider build logs               | Checks are framework/provider scoped                              | `check` validates publication intent, generated artifacts, and provider readiness. |
| Explain/fix issues    | Jekyll doctor, Ghost CLI checks                               | Repair is usually technical or environment-specific               | `doctor` gives author-language causes and repair plans.                            |
| Manage media at scale | Headless CMS assets, Tina media, Webflow assets               | Static sites lack inventory/migration; hosted CMSs own assets     | `media inventory/check/optimize/migrate/rewrite` with adapters.                    |
| Publish confidently   | Webflow publish, Netlify/Vercel/Wrangler deploy               | Provider terms leak; Git/CI often hides output differences        | `publish plan/apply/verify/status/rollback` over release artifacts.                |
| Collaborate           | Decap, CloudCannon, Webflow, WordPress                        | Git or vendor workflow dominates                                  | `workflow` adapters expose submit/review/approve/publish without hard-coding Git.  |
| Migrate old sites     | WordPress/Ghost/Contentful exports                            | Imports lose URLs/media/metadata or require bespoke scripts       | `import --plan`, preservation reports, URL/media/citation diagnostics.             |
| Automate safely       | WP-CLI, Contentful CLI, deploy CLIs                           | Machine output differs by product and often provider-specific     | Stable JSON/NDJSON diagnostics, plans, reports, and exit codes.                    |
| Extend platform       | Astro integrations, WordPress plugins, Sanity/Contentful apps | Plugin models often couple to one runtime/vendor                  | Extension/adapter contracts with capability inspection and fixtures.               |

## Design Language Implications

The comparison points toward a small number of durable nouns and verbs.

### Durable Nouns

- **Site:** the author/site-owner workspace, not the platform source tree.
- **Content:** entries such as articles, announcements, pages, authors,
  collections, and reusable data.
- **Media:** source assets, references, derivatives, generated social images,
  external provider objects, and migration state.
- **Source:** the durable storage/history model for site source.
- **Workflow:** editorial state and approval policy.
- **Preview:** an explicit view of source, build, release, artifact, or
  provider output.
- **Build:** compiling a publication into static output.
- **Release:** a named bundle of output, manifests, diagnostics, and policy
  results.
- **Publish target:** a configured destination for applying a release.
- **Plan:** a reviewed, serializable description of changes before mutation.
- **Report:** a durable human/machine artifact from checks, builds, releases,
  imports, media operations, or publish operations.
- **Adapter:** a capability-bound implementation of source, media, workflow,
  build, deploy, identity, diagnostics, or observation.
- **Extension:** a packaged set of adapters, components, policies, or commands.

### Durable Verbs

- `init`, `open`, `connect`, `status`, `explain`, `check`, `doctor`,
  `preview`, `build`, `create`, `inspect`, `verify`, `plan`, `apply`,
  `publish`, `rollback`, `restore`, `import`, `export`, `migrate`, `sync`,
  `diff`, `archive`, `test`.

These words should remain stable across CLI, GUI, MCP, docs, and automation.
Provider-specific verbs such as deploy, branch, commit, PR, Worker, environment,
space, or collection should appear only inside adapter details unless they are
the user's explicit chosen provider model.

## What TPM Can Make Simpler

### One Concept For Safe Mutation: Plan Then Apply

Many products have separate mental models for migration, deploy, import,
publish, and repair. TPM should normalize them:

1. inspect current state;
2. create a plan;
3. review human and JSON output;
4. apply explicitly;
5. verify;
6. record a report.

This keeps complex operations powerful without making the default interface
dangerous or noisy.

### One Diagnostic Shape Across Surfaces

Static tools, deploy tools, and CMS tools usually report errors differently.
TPM should have one diagnostic schema with:

- stable code;
- severity;
- file/source reference;
- route/artifact/provider reference when applicable;
- cause;
- remediation;
- owner audience;
- machine-readable metadata.

The CLI can render this as concise text. GUI and MCP can render the same data
without inventing a parallel model.

### One Source-Agnostic Workflow Vocabulary

Git-backed tools prove Git workflows are useful. No-code tools prove Git is
not an acceptable default concept for many authors. TPM should keep editorial
verbs stable:

- draft;
- submit;
- review;
- approve;
- reject;
- publish;
- rollback;
- restore.

Git, GitHub, GitLab, local history, or custom enterprise systems are adapters
behind those verbs.

### One Media Model That Survives Growth

Default users can start with local/repo media. Teams can move to external
storage. Enterprises can connect custom asset systems. The CLI should keep the
same media vocabulary:

- inventory;
- check;
- ingest;
- optimize;
- dedupe;
- migrate;
- rewrite;
- verify.

The adapter changes; the user language does not.

### One Release Model For Static Output

Static-site tools usually produce a folder. CMSs usually hide output behind
runtime publishing. TPM should make static output a first-class release:

- source snapshot;
- routes;
- redirects;
- generated assets;
- metadata graph;
- feeds/sitemap/search/PDF/social images;
- cache/security headers;
- diagnostics;
- publish readiness.

This is how TPM can make static publishing feel safer than both raw SSGs and
opaque hosted CMSs.

## Matrix Conclusions For Command Design

1. Keep `site`, `content`, `media`, `source`, `workflow`, `check`, `doctor`,
   `preview`, `build`, `release`, `publish`, `import`, `export`, `extension`,
   `adapter`, and `mcp` as the major command families.
2. Do not collapse `source` and `workflow` into Git commands. Git is only one
   source/history/workflow adapter.
3. Do not collapse `publish` into Cloudflare, Vercel, Netlify, GitHub Pages, or
   any other deploy provider.
4. Do not hide media under content. Media is a scaling, migration, accessibility,
   and output correctness domain.
5. Do not hide generated files in `dist/`. Releases and artifact reports are a
   core differentiator.
6. Prefer default commands with few flags, then let `--profile`, adapters,
   config, saved plans, and reports carry complexity.
7. Preserve a simple author journey:
   `site init -> content new -> preview -> check -> publish`.
8. Preserve a power-user journey:
   `source connect -> media migrate --plan -> release create -> publish plan`.
9. Preserve a complex-publisher journey:
   `adapter show -> workflow submit -> release verify -> publish apply`.
10. Ensure every mature command can be rendered as human output, JSON/NDJSON,
    GUI state, MCP tool result, and CI artifact from the same operation model.

The explicit option-by-option critique behind these conclusions is in
[`DESIGN_DECISION_REVIEW.md`](./DESIGN_DECISION_REVIEW.md). Use that document
when a later command-spec milestone is tempted to collapse command families or
replace publishing vocabulary with provider/framework vocabulary.
