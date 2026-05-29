# Studio Product Vision

This document defines the product vision for the future static publishing
studio. It clarifies the intended author, site-owner, and publisher experience
before we update planning issues.

The studio is the product interface over the same static publishing compiler
described in [PLATFORM_ROADMAP.md](../roadmap/PLATFORM_ROADMAP.md) and
[ENGINEERING_PHILOSOPHY.md](../core/ENGINEERING_PHILOSOPHY.md). It should not become
a separate CMS data model.

The focused architecture and publication workspace decision is owned by
[STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md](./STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md).

## Product North Star

The end product is a comprehensive static blog CMS/studio.

The default user should be able to create, preview, publish, unpublish, revise,
and redeploy a static blog without understanding Git, Astro, Markdown
frontmatter, Cloudflare Workers, build logs, image optimization, metadata,
feeds, redirects, or CI.

The advanced user should be able to keep the same compiler and contracts while
swapping in source, media, history, workflow, build, and deploy providers that
match their needs.

The platform promise:

> The user expresses publishing intent. The platform validates that intent,
> compiles it into fast static output, explains repairable problems in human
> language, and publishes through configured providers.

## Market Context

The studio should learn from existing publishing tools without inheriting their
constraints.

Observed product patterns:

- Managed publishing tools optimize for writing and publishing but often hide
  portability and build details. Ghost, for example, emphasizes a clean editor,
  post settings, previews, scheduling, and restorable post edits.
- Git-backed CMS tools preserve static-site workflows but can leak Git concepts
  into the editorial experience. Decap CMS describes itself as a wrapper around
  a Git workflow, while TinaCMS is explicitly Git-backed.
- Static-site visual CMS tools try to combine static output, Git history, and
  non-technical editing. CloudCannon presents visual, content, data, and source
  editors for non-technical editors, with Git-backed versioning.
- Headless CMS products expose stronger content, schema, media, and workflow
  systems, but usually introduce a hosted content database as the source of
  truth. Sanity and Contentful both treat media/assets and schemas as central
  product surfaces.

Useful references:

- [Ghost publishing docs](https://ghost.org/help/publishing-content/)
- [Ghost post settings docs](https://ghost.org/help/post-settings/)
- [WordPress media library docs](https://wordpress.com/support/media/)
- [Decap CMS overview](https://decapcms.org/docs/intro/)
- [TinaCMS docs](https://tina.io/docs/)
- [CloudCannon static site CMS overview](https://cloudcannon.com/static-site-cms/)
- [Sanity Studio docs](https://www.sanity.io/docs/studio)
- [Sanity assets docs](https://www.sanity.io/docs/content-lake/assets)
- [Contentful assets docs](https://www.contentful.com/help/media/managing-assets/)

The TPM opportunity is a hybrid:

1. As simple as managed blogging for default users.
2. As portable as file-based static sites for power users.
3. As extensible as a headless CMS for complex publishers.
4. As fast, cacheable, and verifiable as a static compiler.

## Progressive Adoption Ladder

The product should not force users to choose between a toy default mode and an
enterprise mode. It should let users upgrade one concern at a time.

The adoption ladder:

1. **Instant solo publishing:** the user downloads the GUI, creates a site,
   connects the recommended deploy provider, writes a post, clicks publish, and
   receives a public URL. Source, history, media, metadata, and deploy details
   are handled by defaults.
2. **Domain configuration:** the user configures the intended canonical domain
   in the studio and follows provider/DNS instructions outside the app where
   needed. Generated metadata, feeds, sitemap, PDFs, and links use the
   configured domain.
3. **Backup and history:** the user worries about data loss, connects GitHub or
   another source/history provider, and gets backup/version history without
   needing to understand Git as the product model.
4. **Media externalization:** the user outgrows source-repo or local app media
   storage and migrates media to an external folder, drive, cloud storage, or
   media provider through a dry-run migration.
5. **Collaboration:** multiple people edit the site. Source sync, ownership,
   media handoff, diagnostics, and preview behavior become shared without
   requiring everyone to understand the full build/deploy stack.
6. **Automated publishing:** publishing moves from one local user clicking
   publish to a configured build/deploy workflow such as CI, a hosted build
   provider, or a custom publish adapter.
7. **Complex publisher integration:** source, media, identity, workflow, build,
   deploy, observability, compliance, and review systems are provider-specific
   extensions over stable platform contracts.

Each rung should be useful on its own. Moving up the ladder should feel like
"connect a new capability" or "migrate this concern," not "rebuild your site."

Default choices should be:

- useful immediately;
- tasteful and opinionated;
- explainable in author language;
- replaceable later;
- migratable with dry-run plans and diagnostics;
- exportable so users can leave without losing source or generated output.

## Product Modes

The studio should support three product modes through the same underlying
compiler contracts.

### 1. Default Local Publisher

This is the simplest possible user.

They may have no technical experience. They can buy a domain, follow clear
instructions to connect credentials or a provider account, write articles, and
click publish. They should not need to know what Git, GitHub, CI, Cloudflare
Workers, Markdown frontmatter, or image pipelines are.

The product should feel like:

1. Create a site.
2. Write a post.
3. Add images.
4. Preview.
5. Publish.
6. Undo or roll back if needed.

Default requirements:

- local-first or app-managed source storage;
- invisible version history;
- one-click preview and publish;
- author-language diagnostics;
- automatic metadata, feeds, sitemap, social previews, search, redirects, PDFs,
  and image optimization where configured;
- no required review process;
- no required Git host;
- no required repository asset model;
- no exposed build/deploy jargon unless something fails and needs repair.

This mode should be excellent, not a toy. It is the product baseline.

### 2. Collaborative Static Publication

This is the TPM-like user.

They may use GitHub to sync a separate site workspace, keep source content in a
repo, collaborate with multiple editors, run checks in CI, and deploy through
Cloudflare. They may currently keep assets in the repo, but should be able to
move media to a different storage provider later.

The product should feel like:

1. Edit in the studio, local editor, or repo.
2. Preview the same static output.
3. Run or see the same diagnostics.
4. Submit, review, merge, or publish through the configured workflow.
5. Keep platform source separate from site source.

Requirements:

- site workspace can be a standalone repo or directory;
- platform source is not part of the site workspace;
- Git is an optional source/history adapter, not the product model;
- pull request review is an optional workflow adapter, not the definition of
  publishing;
- repo-local assets are one media adapter, not the only media model;
- Cloudflare is one deploy adapter, not the only deploy model.

### 3. Complex Publisher

This is an unknown large publisher, institution, archive, magazine, or
organization.

They may have custom identity, editorial workflow, media storage, review,
approval, compliance, analytics, archive, CDN, and deploy systems. We should not
pretend to know those systems in advance.

The platform should support them by exposing stable extension seams:

- source adapters;
- media adapters;
- history adapters;
- workflow adapters;
- build adapters;
- deploy adapters;
- identity and credential adapters;
- diagnostics and observability adapters.

The product should not force them into TPM's workflow or a GitHub-centric
workflow. It should provide contracts they can implement.

## Default User Experience

The default product vocabulary should be editorial, not infrastructural.

Preferred labels:

- Save draft
- Preview
- Check site
- Publish
- Unpublish
- Roll back
- Restore version
- Add image
- Replace image
- Fix issue
- Connect domain
- Connect publish provider

Avoid exposing these terms to default users unless they open advanced details:

- commit
- branch
- pull request
- CI
- worker
- build artifact
- frontmatter
- schema validation
- image materialization
- cache invalidation

### Default Launch Scenario

The likely first polished launch path should be:

1. Download or open the studio.
2. Create a site from the default blog profile.
3. Connect Cloudflare as the recommended bundled deploy extension.
4. Write the first post.
5. Preview.
6. Publish.
7. Receive a public URL.
8. Configure a custom domain when ready.

This should not make Cloudflare part of core. It means Cloudflare is the first
excellent default deploy extension. A user who later needs GitHub Pages,
Netlify, S3/CDN, static folder export, or a custom provider should migrate
through deploy extension contracts rather than rebuild their site.

### First-Run Experience

The first-run flow should collect only what is needed to create a useful site:

1. Site name.
2. Author or publication identity.
3. Theme starter or default style.
4. Optional domain and publish provider setup.
5. Optional social/support links.

Everything else should have sensible defaults and remain editable later.

### Domain Experience

Domain setup is partly internal and partly external.

The studio should own:

- canonical domain configuration;
- generated canonical URLs;
- metadata, feeds, sitemap, PDFs, redirects, and social previews that depend on
  the configured domain;
- diagnostics for mismatched or missing domain configuration;
- provider-specific generated files where applicable, such as GitHub Pages
  `CNAME`.

The studio should not pretend to own external DNS unless the selected deploy or
DNS provider adapter can actually manage it. When DNS steps are external, the
GUI should explain the task clearly and verify status where provider
capabilities allow.

### Writing Experience

The editor should allow:

- title;
- subtitle or description;
- body content;
- images with alt text and captions;
- author;
- publish date or schedule;
- tags/categories;
- collection placement;
- visibility controls;
- social preview override when needed;
- PDF eligibility override when needed;
- advanced metadata only when relevant.

The user should not need to write YAML for ordinary work. The platform can still
store Markdown/MDX plus structured metadata internally or on disk.

### Preview Experience

Preview should show:

- article page;
- mobile and desktop views;
- social preview;
- PDF preview when enabled;
- feed/search/listing inclusion when relevant;
- diagnostics grouped by what the user can fix.

Preview should be fast enough that editing feels continuous. When a full static
build is too expensive, the studio should use incremental or partial preview
contracts that remain faithful to the final compiler output.

### Publish Experience

Publishing is a product action, not a Git action.

The default publish flow:

1. Save current source state.
2. Run the required checks.
3. Build or preview the deployable output.
4. Publish through the configured deploy adapter.
5. Record a restore point.
6. Report the final public URL and any warnings.

Review can be inserted before publish, but it is optional:

```text
Draft -> Preview -> Publish
Draft -> Preview -> Submit for review -> Approved -> Publish
Draft -> Preview -> Submit to external workflow -> External approved -> Publish
```

No implementation should assume "submit for review" means "open a GitHub pull
request."

## Media Experience

Media is a primary product surface.

Default users should be able to drag in an image, add alt text or captions, and
trust the platform to optimize it for article pages, social previews, PDFs,
search, feeds, and generated assets.

Advanced users should be able to choose where media lives:

- local app storage;
- site workspace;
- separate media directory;
- external drive;
- NAS;
- object storage;
- SaaS media library;
- DAM or enterprise asset system.

The platform must preserve the compiler requirement that build-time image
optimization needs a local or materialized asset. Remote media should therefore
flow through a media adapter that can resolve, cache, transform, or materialize
the asset before the static build needs it.

Media authoring requirements:

- stable media IDs separate from physical storage paths;
- alt text and caption policy;
- source/provenance fields where useful;
- role-based derivatives for article display, social previews, PDFs, and
  thumbnails;
- diagnostics for missing, inaccessible, oversized, unsupported, or
  unoptimizable media;
- migration path from repo-local media to another storage provider.

## Metadata Experience

Metadata should be powerful but mostly automatic.

Default users should get correct:

- canonical URLs;
- titles and descriptions;
- Open Graph and Twitter cards;
- Schema.org JSON-LD;
- RSS and sitemap inclusion;
- social images;
- search data;
- PDF metadata;
- accessibility-relevant labels;
- basic author and publication identity.

Advanced users should be able to add or override structured metadata through
guided forms. Examples include review metadata, scholarly metadata, events,
books, videos, datasets, products, organizations, and custom social previews.

The principle:

> Metadata is configuration with truthful defaults, not a pile of manual tags.

## Source, History, And Portability

The site workspace should be a portable source model.

It may be stored in:

- a local directory;
- a Git repository;
- app-managed local storage;
- cloud storage;
- a database-backed source provider;
- an enterprise content system.

Regardless of storage, the platform should expose the same logical operations:

- read workspace;
- write draft change;
- validate change;
- diff change;
- restore version;
- export source;
- import source;
- materialize build input;
- publish output.

Git is an excellent adapter for TPM and many technical users. It is not the
universal source model.

## Extensions

The studio should have a core plus extensions architecture. The core validates,
compiles, governs, and verifies. Extensions add capabilities.

Extension categories:

- essential bundled extensions for a good out-of-the-box blog;
- optional official extensions such as PDF generation, scholarly metadata,
  support CTAs, deploy providers, source/history providers, media providers,
  embeds, and importers;
- site extensions for publication-specific UI and workflow;
- third-party extensions with explicit permissions and trust boundaries.

Examples:

- Patreon, Discord, and YouTube buttons are UI component extensions, not core
  platform behavior.
- PDF generation is an official artifact extension, not required for every
  blog.
- Cloudflare deploy is a bundled deploy extension, not the deploy model.
- GitHub Pages deploy can be a deploy extension that owns `CNAME` output.
- Git/GitHub backup and review are source/history/workflow extensions, not the
  definition of collaboration.

The detailed extension model is owned by
[STUDIO_EXTENSION_MODEL.md](./STUDIO_EXTENSION_MODEL.md).

## CLI And MCP

The studio core should also power a CLI and an MCP server.

The CLI is for:

- local author workflows;
- migrations;
- audits;
- release checks;
- scripted imports;
- publishing from a terminal;
- power-user automation.

The MCP server is for:

- AI-assisted editing;
- safe source changes through platform contracts;
- diagnostics explanations;
- metadata and route queries;
- controlled publish proposals;
- content, media, and configuration operations.

Neither should reimplement the platform. They should call the same studio core,
compiler contracts, diagnostics, and adapters as the GUI.

## Non-Goals

The studio should not become:

- a generic drag-and-drop website builder;
- a runtime CMS that requires server-rendered pages;
- a hosted-only SaaS model that makes source export secondary;
- a GitHub-only editorial UI;
- a Cloudflare-only deploy UI;
- a media system that assumes all assets live in Git;
- a workflow system that assumes every publication wants review and approval;
- a second data model separate from the static publishing compiler.

## Design Rules For Future Issues

Future issues should follow these rules:

1. Name the product action first, then the adapter mechanics.
2. Separate default-user behavior from advanced adapters.
3. Treat GitHub, Cloudflare, repo assets, and PRs as replaceable adapters.
4. Keep source workspace and platform source separate.
5. Keep media identity separate from storage location.
6. Make review workflow optional and policy-driven.
7. Expose author-language diagnostics for every repairable failure.
8. Preserve static output as the generated public artifact.
9. Prefer capability detection over provider-specific assumptions.
10. Avoid fake precision for unknown complex publisher workflows.
11. Prefer extension-shaped capabilities over global platform patches.
12. Require migration paths when a default storage, media, workflow, or deploy
    choice is likely to be outgrown.

## Issue Translation Checklist

Use this checklist before creating or updating planning issues.

Every studio, CLI, MCP, provider, or workflow issue should state:

1. Which product mode it serves: default local publisher, collaborative static
   publication, complex publisher, or shared platform foundation.
2. Which user action it improves: write, preview, check, publish, unpublish,
   roll back, restore, import, export, configure, connect provider, or manage
   media.
3. Whether the work belongs in product UI, studio core, platform compiler,
   adapter contract, provider adapter, generated-output verifier, or docs.
4. Which assumptions are forbidden: GitHub-only, Git-only, Cloudflare-only,
   repo-local-media-only, PR-only review, or platform-source-as-site-source.
5. Which diagnostics are needed for default users and which advanced details
   are only exposed when a provider-specific failure occurs.
6. Which interfaces must share the behavior: GUI, CLI, MCP, CI, local scripts,
   or generated docs.
7. Which capabilities gate the UI or command: source, history, media, workflow,
   build, deploy, identity, or diagnostics.
8. Which open questions are real blockers and which are intentionally deferred
   until a later provider or product design.

If an issue cannot answer these questions yet, it should be a design issue, not
an implementation issue.

## Planning Corrections From This Vision

The current roadmap and issue set may contain older phrasing that over-centers
software-engineer workflows. Later planning updates should correct that drift.

Likely corrections:

1. Rename Git-backed publishing/review work unless the issue specifically
   implements a Git or GitHub adapter.
2. Split provider-agnostic source, history, workflow, media, build, and deploy
   contracts from provider-specific implementations.
3. Treat direct publish as the default solo-user path.
4. Treat submit/review/approval as optional workflow policy.
5. Treat repo-local media as the initial TPM media adapter, not the final media
   model.
6. Make every CLI and MCP issue depend on the same studio core contracts rather
   than inventing command-specific behavior.
7. Preserve Cloudflare as an important deploy adapter while keeping deploy
   policy provider-neutral.
8. Reframe optional features such as PDFs, support buttons, embed providers,
   and advanced metadata as extension candidates with explicit contracts.
9. Add upgrade/migration issues for local source to Git backup, repo media to
   external media, direct publish to review workflow, and local publish to
   automated publish.

## Open Product Questions

These questions should be answered during design of later roadmap milestones,
not guessed now:

- What is the first supported default storage model for a non-technical local
  publisher?
- How much version history should the app manage invisibly before exposing
  advanced history controls?
- Which media provider should be first after repo-local media?
- Which deploy provider should be first after Cloudflare?
- Which extension capabilities are bundled in the default install, and which
  require explicit enablement?
- What is the first extension trust model: local-only, official-only,
  signed packages, or a broader registry?
- How should credentials be stored for local, hosted, CLI, and MCP contexts?
- What is the smallest real-time preview architecture that stays faithful to
  final static output?
- What is the first review workflow beyond direct publish?
- How should MDX component fallbacks be edited and previewed in the GUI?

These are product design questions, not blockers for documenting the vision.
