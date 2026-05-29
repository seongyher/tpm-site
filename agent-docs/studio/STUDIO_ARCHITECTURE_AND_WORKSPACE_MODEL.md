# Studio Architecture And Workspace Model

This document is the design packet for `IRK-136`: defining the static blog
studio product architecture and publication workspace model.

The goal is to make the future GUI studio a product interface over the static
publishing compiler, not a parallel CMS source model. The same source
contracts, diagnostics, adapter capabilities, route previews, compiler
artifacts, media policies, extension manifests, release reports, and
generated-output verifiers must be usable by GUI, CLI, MCP, CI, and future
hosted or enterprise surfaces.

Related source documents:

- [STUDIO_PRODUCT_VISION.md](./STUDIO_PRODUCT_VISION.md)
- [STUDIO_ADAPTER_MODEL.md](./STUDIO_ADAPTER_MODEL.md)
- [STUDIO_EXTENSION_MODEL.md](./STUDIO_EXTENSION_MODEL.md)
- [CLI_RUST_GUI_INTEGRATION_PLAN.md](../roadmap/CLI_RUST_GUI_INTEGRATION_PLAN.md)
- [PLATFORM_ROADMAP.md](../roadmap/PLATFORM_ROADMAP.md)
- [STUDIO_READINESS_CONTRACTS.md](../../docs/studio/STUDIO_READINESS_CONTRACTS.md)

## Design Goals

The architecture must satisfy these goals:

1. Preserve static source truth. Canonical site content, config, redirects,
   media references, theme intent, and extension config live in a portable
   publication workspace, not only in an app database.
2. Keep the default user experience simple. A non-technical author should be
   able to write, preview, publish, restore, and manage media without learning
   Git, Astro, frontmatter, CI, build logs, or deploy-provider mechanics.
3. Keep advanced workflows possible. TPM-like teams and complex publishers
   should be able to swap source, history, media, workflow, build, deploy,
   identity, credential, and observability providers without rebuilding the
   site.
4. Keep GUI, CLI, MCP, and CI on one operation model. Interfaces may render
   results differently, but they should call the same core operations and
   consume the same diagnostics.
5. Make provider lock-in avoidable. Cloudflare can be the excellent bundled
   default deploy path. Git/GitHub can be excellent optional source, history,
   backup, sync, and review adapters. Neither should become the product model.
6. Make migration a first-class path. Users should be able to move one concern
   at a time, such as media storage, history, source sync, workflow, or deploy
   provider, with dry-run plans and diagnostics.
7. Keep implementation risks visible. The first product slice should prove the
   operation and workspace boundaries before introducing rich editing,
   credentials, provider publishing, or MCP write actions.

## Architecture Decision

Recommendation: build a local-first, desktop-first hybrid architecture over a
headless operation core, with CLI and MCP surfaces sharing the same core and a
hosted collaboration/control-plane model reserved for later.

The product shape is:

```text
Headless operation core
  -> publication workspace adapters
  -> media/history/workflow/build/deploy/identity adapters
  -> diagnostics, release reports, extension capabilities
  -> CLI renderer
  -> Tauri command bridge
  -> MCP tools/resources
  -> CI/release checks

Tauri desktop shell
  -> Astro static studio frontend
  -> calls operation core through typed commands
  -> renders editor, preview, diagnostics, plans, releases, and settings
```

The first complete user-facing GUI should be a Tauri desktop app with an Astro
frontend. This gives default users local-first source ownership and native
filesystem/provider access without requiring a hosted account on day one. It
also lets the future GUI reuse Rust operation code, native credential
boundaries, and the same command/result model as the CLI.

The product can later add hosted collaboration or managed services as provider
profiles. Hosted services should coordinate capabilities, previews, identity,
workflow, storage, or deployment. They should not become the only canonical
place where source truth exists.

### Architecture Options Considered

| Option                           | Strengths                                                                 | Risks                                                                                 | Decision                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Pure local web app               | Simple distribution and no native shell.                                  | Browser sandbox makes filesystem, credential, build, and provider access awkward.     | Not enough for the default publish workflow without extra services or unsafe workarounds.                      |
| Desktop app with Tauri           | Local-first, native permissions, Rust operation reuse, strong packaging.  | Requires native app distribution and careful permission design.                       | Recommended first polished GUI shell.                                                                          |
| Hosted SaaS-first app            | Easiest collaboration, centralized accounts, managed background services. | Can pull the product toward a hosted CMS database and provider lock-in.               | Valuable later as an optional profile, not the first architecture.                                             |
| Git-backed CMS first             | Strong version history and developer familiarity.                         | Leaks Git concepts into default author UX and makes GitHub feel canonical.            | Useful as an optional source/history/workflow adapter, not the product model.                                  |
| Provider-specific app first      | Fastest path to an excellent Cloudflare or GitHub flow.                   | Hard-codes provider assumptions into UX and implementation.                           | Cloudflare and GitHub should be bundled adapters/extensions behind provider-neutral contracts.                 |
| Hybrid phased architecture       | Lets default, TPM-like, and complex-publisher modes share one core.       | Requires capability models and adapter seams before some product work feels concrete. | Recommended. Start desktop/local-first, add CLI/MCP/CI parity, then add hosted/collaboration profiles later.   |
| Full custom backend from day one | Enables real-time collaboration and managed accounts immediately.         | Creates a second source model too early and increases operational burden.             | Defer until source/workspace/export contracts prove how hosted state remains a cache, coordinator, or adapter. |

## Product Modes

The studio supports three product modes through the same compiler contracts.

### Default Local Publisher

The default user installs or opens the studio, creates a blog, connects the
recommended publish provider when ready, writes a post, previews it, and clicks
publish.

The product should own:

- sensible default workspace creation;
- app-managed local source/history/media defaults;
- author-language diagnostics;
- guided domain configuration;
- one-click preview and publish through configured providers;
- restore points and rollback plans;
- export and backup paths.

The product should hide by default:

- Git branches and commits;
- pull requests;
- build artifacts;
- frontmatter;
- image materialization;
- provider cache invalidation;
- deploy logs unless needed for repair.

### Collaborative Static Publication

This is the TPM-like mode.

A team may keep the site workspace in a separate Git repository or shared
directory, use GitHub for sync, review, or backup, store media in the repo or
another provider, and deploy through Cloudflare or another deploy adapter.

The same product actions still apply:

- Save draft.
- Preview.
- Check site.
- Submit for review.
- Publish.
- Roll back.
- Restore version.

Adapters translate those actions into provider mechanics. "Submit for review"
may mean a GitHub pull request for TPM. It must not mean that universally.

### Complex Publisher

Complex publishers may bring their own identity, media, workflow, archive,
compliance, deploy, CDN, analytics, and editorial systems.

The platform should support them by making these concerns adapter-owned:

1. source;
2. history;
3. media;
4. workflow;
5. build;
6. deploy;
7. identity and credentials;
8. diagnostics and observability.

The core does not need to predict every enterprise workflow. It needs stable
operation contracts, capability reporting, extension manifests, dry-run plans,
audit records, export paths, and diagnostics that make integration possible.

## Publication Workspace Model

A publication workspace is the logical source package for one site instance.
It is not the platform implementation repo and it is not necessarily a
physical `site/` folder forever.

Current TPM source happens to live in:

```text
site/
  config/
  content/
  assets/
  public/
  theme.css
```

Future source adapters may store the same logical workspace in a local folder,
Git repository, app-managed directory, cloud folder, content API, or enterprise
system. The compiler should receive a materialized logical workspace with the
same source intent.

### Workspace Layers

The studio should distinguish these layers explicitly.

| Layer                        | Purpose                                                                                  | Authority                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Source workspace             | Content, config, redirects, theme intent, media references, extension config.            | Canonical source.                                           |
| Media identity store         | Stable media records, role metadata, provenance, alt/caption policy, storage references. | Canonical media intent when the media adapter owns records. |
| History and restore store    | Versions, restore points, diffs, release notes, audit history.                           | Canonical history when the history adapter owns versions.   |
| Provider account connections | Credentials, OAuth grants, provider scopes, account metadata, connection diagnostics.    | Canonical provider state, never canonical content.          |
| Materialized build input     | Temporary local build tree and media derivatives required by Astro/static rendering.     | Derived.                                                    |
| Preview cache                | Incremental or partial preview output, dirty-state previews, route previews.             | Derived.                                                    |
| Generated output             | Static HTML, assets, feeds, sitemaps, search data, PDFs, manifests, redirects, reports.  | Derived public artifact.                                    |
| Release report and audit log | What was built, checked, published, warned, rolled back, or skipped.                     | Generated record; exportable.                               |
| Provider-owned artifacts     | Deploy IDs, preview URLs, cache states, external review IDs, provider logs.              | Provider-owned, referenced by source or release records.    |

Canonical content must not live only in a private studio database. The studio
may maintain local indexes, caches, draft buffers, provider state, or app
settings, but those must be exportable or reproducible from the workspace and
provider adapters.

### Source References

Every editable object should have a stable source reference.

A source reference should identify:

- workspace ID;
- source adapter;
- editable domain, such as article, page, config, redirect, media, or theme;
- source artifact key;
- source path or provider record locator;
- schema owner;
- source owner;
- repair owner;
- generated-output effects.

The GUI should render friendly names. CLI/MCP/CI should preserve the same
machine-readable references so diagnostics and operation plans point to the
same source.

### Source Ownership

Ownership is domain-specific, not provider-specific.

Examples:

- Article body and basic article metadata are author-owned.
- Site identity, navigation, redirects, homepage surfaces, and deploy settings
  are site-owner-owned.
- Provider credentials are operator-owned.
- Extension manifests and custom components are developer- or maintainer-owned.
- Generated output is compiler-owned.
- Provider logs and deploy IDs are provider-owned.

The studio should use ownership to route diagnostics and protect unsafe edits.
For example, a missing image alt text diagnostic can be author-fixable, while
a broken deploy token is operator-fixable.

## Account And Provider Connection Model

Provider connections are capabilities, not hidden global state.

A provider connection should expose:

- provider family;
- capabilities;
- credential requirements;
- permission scopes;
- connection health;
- source/output ownership;
- dry-run support;
- reversibility;
- destructive actions;
- audit behavior;
- unsupported-operation diagnostics.

Credential material should remain adapter-scoped and secret-safe. The studio
may store credentials in an OS keychain, local encrypted store, hosted secret
store, environment adapter, or enterprise identity provider depending on the
profile. Credentials should never become ordinary site config, public output,
or browser-visible state.

The default profile can guide the user through Cloudflare connection because
Cloudflare is the recommended bundled deploy extension. That must still appear
as a deploy provider with capabilities, not as a core assumption.

## Preview And Build Execution Model

Preview and build are operations over source intent.

The preview flow should be:

```text
current source + dirty patches
  -> validate source and field descriptors
  -> resolve route targets and generated-output effects
  -> resolve and materialize media where required
  -> run preview build or partial renderer
  -> return preview URLs/artifacts and diagnostics
```

The release build flow should be:

```text
source snapshot
  -> materialize build input
  -> run full static build
  -> verify generated output
  -> produce release report
  -> publish or hand off to deploy plan
```

Fast previews may use caches, partial builds, or preview-only renderers, but
final truth must come from deterministic platform contracts. A preview result
should always explain whether it is complete, degraded, blocked by diagnostics,
or unavailable because a provider capability is missing.

## Offline And Error Recovery

The default desktop product should work locally when possible and degrade
clearly when provider capabilities are unavailable.

Expected recovery behavior:

| Failure or offline state       | Expected behavior                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| No network                     | Continue local writing, local preview when possible, queue provider checks, mark publish unavailable. |
| Missing or expired credentials | Preserve source changes, block provider actions, explain the account repair step.                     |
| Failed save                    | Keep draft buffer, show source target and recovery options, avoid losing dirty state.                 |
| Source conflict                | Show diff and conflict owner; do not overwrite without an explicit resolution plan.                   |
| Missing media                  | Preserve reference, show media diagnostic, allow replacement or provider repair.                      |
| Failed build                   | Keep source unchanged, return diagnostics and logs mapped to source/artifact owners.                  |
| Failed publish                 | Preserve release candidate, expose retry/rollback/restore options depending on provider support.      |
| Partial provider outage        | Hide or disable unsupported actions based on capability health; keep local work available.            |
| Extension failure              | Isolate extension diagnostics, preserve source, and expose disable/retry behavior where safe.         |

Mutating operations should use plan/apply semantics where practical. A plan
shows source changes, provider actions, credentials required, diagnostics,
risks, and rollback support. Apply performs the approved action and records the
result.

## Progressive Adoption Model

Each adoption step should add or migrate one capability at a time.

| Step | User intent               | Capability added or migrated                                         | Rebuild required?                        |
| ---- | ------------------------- | -------------------------------------------------------------------- | ---------------------------------------- |
| 1    | Start a blog              | Local/app-managed source, local history, local media, default theme. | No                                       |
| 2    | Publish publicly          | Deploy provider connection, likely bundled Cloudflare.               | No site rebuild; release build required. |
| 3    | Use a custom domain       | Canonical domain config and provider/DNS status diagnostics.         | No                                       |
| 4    | Avoid data loss           | Backup/history provider, such as Git/GitHub or another adapter.      | No                                       |
| 5    | Outgrow local/repo media  | Media provider migration and materialization policy.                 | No                                       |
| 6    | Invite collaborators      | Shared source/history/workflow profile, conflict and review policy.  | No                                       |
| 7    | Automate publishing       | Build/deploy workflow adapter, CI or hosted build profile.           | No                                       |
| 8    | Integrate complex systems | Custom source/media/workflow/deploy/identity/observability adapters. | No                                       |

Migration tooling should provide:

- dry-run plans;
- affected source and media references;
- provider capability checks;
- source maps;
- diagnostics;
- rollback or recovery expectations;
- post-migration verification.

If a migration requires changing source format, the change should be explicit,
reviewable, and exportable. The user should not need to recreate the site.

## Product Surface Traceability

Every product surface should trace to platform contracts instead of owning its
own source model.

| Product surface      | Platform contracts it consumes                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| Create site          | starter profiles, site config schema, theme tokens, extension defaults, workspace adapter.       |
| Edit article/page    | content collections, publishable model, source references, field descriptors, diagnostics.       |
| Edit site settings   | site config schema, route registry, metadata profiles, feature flags, generated references.      |
| Manage media         | media references, media roles, media adapter capabilities, materialization policy, diagnostics.  |
| Manage redirects     | redirect parser, route registry, redirect verifier, deploy artifact contracts.                   |
| Manage metadata      | metadata profiles, JSON-LD/Open Graph/Twitter/Scholar contracts, route/entity registries.        |
| Preview route        | preview contract, compiler artifacts, route preview targets, media materialization, diagnostics. |
| Check site           | diagnostic taxonomy, site doctor, generated-output verifiers, content/config validators.         |
| Publish              | release report, build adapter, deploy adapter, provider capabilities, credential adapter.        |
| Unpublish            | publishable visibility, route/redirect policy, workflow adapter, deploy adapter capabilities.    |
| Roll back or restore | history adapter, release reports, source diffs, deploy rollback capabilities.                    |
| Submit for review    | workflow adapter, source diff, diagnostics, review policy, optional provider artifacts.          |
| Import/export        | import/export envelope, source maps, preservation policy, media and citation normalization.      |
| Domain configuration | site config, canonical URL policy, deploy/domain extension, provider diagnostics.                |
| Extension management | extension manifest, capability registry, permissions, generated-output ownership, diagnostics.   |
| CLI commands         | operation requests/results, diagnostics, human/JSON renderers, plan/apply policy.                |
| MCP tools            | operation requests/results, permission scopes, audit records, redaction, dry-run plans.          |
| CI/release checks    | same validators, verifiers, release reports, source references, generated-output contracts.      |

## User Journey Fixtures

Future implementation should prove the architecture with user journey fixtures.

### Default Author Fixture

Scenario:

1. Create a local blog workspace.
2. Add `content/articles/my-first-post.md`.
3. Drag in `media/sunrise.jpg`.
4. Add alt text and a caption.
5. Preview article, social card, and listing inclusion.
6. Publish through the default deploy provider.
7. Restore the previous version after editing the title.

The fixture should prove no Git, frontmatter, provider logs, or build artifacts
are required in the default UI.

### Site Owner Fixture

Scenario:

1. Change site name, canonical domain, homepage collections, navigation,
   support links, and social links.
2. Preview metadata, sitemap, RSS, and route changes.
3. Receive diagnostics for a domain/provider mismatch.

The fixture should prove settings are schema-driven and generated-output
effects are visible before publish.

### Collaborator And Reviewer Fixture

Scenario:

1. Author proposes an article edit.
2. Reviewer requests changes through the configured workflow adapter.
3. Author resolves diagnostics and resubmits.
4. Review is approved and published.

The fixture should prove review is optional and provider-specific mechanics are
hidden behind workflow capabilities.

### Maintainer Fixture

Scenario:

1. Add or update an extension.
2. Review declared capabilities, permissions, generated artifacts, diagnostics,
   scripts, styles, and external origins.
3. Verify source and generated-output ownership before enabling it.

The fixture should prove extensions cannot silently patch global output.

### Operator Fixture

Scenario:

1. Connect a deploy provider.
2. Test credentials and permission scopes.
3. Review a publish plan.
4. Run a dry-run deploy.
5. Apply publish and inspect the release report.
6. Retry or roll back after a simulated provider failure.

The fixture should prove provider credentials, deployment, rollback, and audit
records are adapter-owned and never leak into ordinary site source or public
output.

### Complex Publisher Fixture

Scenario:

1. Use a custom source adapter.
2. Use external media materialization.
3. Route review through an external workflow adapter.
4. Build remotely.
5. Deploy through a custom deploy adapter.
6. Import observability diagnostics.

The fixture should prove the studio still speaks product actions and operation
results while provider mechanics remain external.

## First Product Slice

The first implementation slice after this design should be intentionally narrow.

Recommended first slice:

1. Load a publication workspace through an explicit workspace descriptor.
2. Read site status and provider capability summaries.
3. Run read-only diagnostics.
4. Render the result in CLI and a minimal Tauri/Astro GUI shell from the same
   operation result fixture.
5. Prove source references, diagnostics, and capability states are identical
   across CLI, GUI, and test fixtures.

The first slice should not include:

- rich article editing;
- source mutation;
- provider credential storage beyond mocked capability states;
- real publish/apply;
- MCP write tools;
- collaboration workflows;
- hosted account sync;
- marketplace extension loading.

This is not a lack of ambition. It is the safest way to prove the central
architecture before adding write paths and provider side effects.

## Advanced Escape Hatches

The studio should support advanced behavior without making it the default.

Valid escape hatches:

- source editor for Markdown/MDX and code-only components;
- advanced metadata editor;
- provider logs and raw operation output;
- manual source export and import;
- manual media reference repair;
- custom extension manifests;
- custom workflow, build, deploy, media, source, or history adapters;
- CLI access to operation plans and JSON output;
- MCP read-only inspection and later gated write proposals.

Escape hatches must be explicit. They should not let users silently bypass
schema validation, generated-output checks, source maps, security policy,
credential redaction, or release reports.

## Non-Goals For This Architecture Slice

This design does not require:

- implementing the GUI;
- implementing provider credentials;
- implementing hosted collaboration;
- replacing Bun/Astro scripts with Rust;
- extracting public packages;
- adding a marketplace;
- making all content visually editable;
- making Cloudflare, GitHub, or repo-local media mandatory;
- storing canonical content in a studio-only database.

## Implications For Downstream Milestone 6 Issues

The downstream milestone 6 work should use this document as its architecture
input.

1. Schema-driven editing and preview surfaces should consume source
   references, field descriptors, editor documents, preview contracts, media
   policy, and generated-output effects.
2. Provider-backed publish, rollback, credential, and audit flows should use
   operation plan/apply, provider capability reporting, credential adapters,
   release reports, and history/deploy rollback capabilities.
3. The provider capability matrix should be expressed as data consumed by GUI,
   CLI, MCP, CI, and docs/reference generation.
4. The headless studio core should expose operation requests/results that can
   be rendered by CLI, Tauri/Astro GUI, MCP, and CI without source-model drift.
5. The CLI and MCP designs should be product interfaces over the headless core,
   not wrappers around repo-local scripts or direct file mutations.
6. The mocked-provider test plan should prove default author, site owner,
   collaborator/reviewer, maintainer, and complex-publisher fixtures.
7. Progressive adoption migration design should start from the adoption ladder
   and migration expectations in this document.

## Verification Plan

This architecture is ready for handoff when:

1. Every named product surface traces to platform contracts.
2. The workspace model distinguishes canonical source from caches,
   materialized build input, generated output, provider artifacts, and release
   reports.
3. User journey fixtures cover default author, site owner,
   collaborator/reviewer, maintainer, and complex publisher roles.
4. Progressive adoption scenarios add or migrate one capability at a time
   without a site rebuild.
5. Cloudflare, Git/GitHub, repo-local media, and review workflows are described
   as adapters/extensions rather than core assumptions.
6. The first product slice is narrow enough to implement without credentials,
   provider side effects, or rich editing.
7. No canonical content is stored only in a separate database that can drift
   from the workspace.
