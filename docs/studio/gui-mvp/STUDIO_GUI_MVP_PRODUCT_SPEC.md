# Studio GUI MVP Product Specification

This document completes the product-definition design pass for Linear
`IRK-231` and its child issues `IRK-238` through `IRK-241`.

The purpose is to define the first shippable Studio GUI MVP before visual,
component, fixture, and implementation work begins. This is a design artifact,
not an implementation plan.

## Goal

The Studio GUI MVP is a native-feeling desktop publishing studio for a
non-technical blogger.

The user should be able to:

1. create or open a site project;
2. return to the exact app state they left;
3. browse articles and site files through friendly navigation;
4. create a new article;
5. edit article metadata through visual forms;
6. edit article Markdown or MDX source in a source-faithful editor;
7. browse media, edit media metadata, and insert images into the article;
8. edit site settings through visual forms;
9. preview the true rendered site before publishing;
10. save drafts, autosave safely, and restore checkpoints;
11. publish to the recommended Cloudflare path through a preview and confirm
    flow.

The MVP is "minimum" only in the sense that it avoids collaboration,
marketplace, enterprise adapter, and WYSIWYG complexity. It must still feel
complete, polished, understandable, and safe enough to ship to real users.

## Product Promise

The default promise:

> Write your site, preview it, and publish it without learning Git, Astro,
> frontmatter, build logs, or deploy commands.

The product should feel like a desktop writing and publishing app, not a
developer control panel. Technical concepts may exist in advanced details, but
normal flows should use author language such as:

- Open site
- New article
- Save draft
- Preview
- Publish
- Restore version
- Add image
- Fix issue
- Connect Cloudflare

The GUI is one interface over the same headless operation core used by the CLI,
MCP, CI, and tests. It must not invent a separate CMS data model.

## Primary User

The primary MVP user is a solo or small-publication author who wants a static
blog but does not want to understand static-site tooling.

Assumptions:

- The user can install and open a desktop app.
- The user can choose a local folder when prompted.
- The user can write prose.
- The user can follow provider connection instructions.
- The user should not need to understand Git, GitHub, CI, Markdown
  frontmatter, Astro routes, asset pipelines, Cloudflare Workers, or build
  artifacts.

The MVP should also be good enough for TPM-like power users to recognize the
future upgrade path, but TPM-like Git-backed collaboration is not part of the
MVP.

## Product Modes

The MVP focuses on the default local publisher, while preserving upgrade paths
for later product modes.

| Mode                    | MVP behavior                                                                              | Later upgrade path                                                |
| ----------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Default local publisher | Local or app-managed site workspace, local restore checkpoints, direct Cloudflare publish | Backup/history provider, media externalization, collaboration     |
| TPM-like publication    | Can open a site-like workspace and preview/edit through the same UI where supported       | Git source/history, repo media, GitHub review, CI-backed publish  |
| Complex publisher       | Not directly implemented                                                                  | Adapter and extension seams remain visible in the operation model |

## MVP Scope

### Startup And Workspace

The app opens into the exact previous state when possible. Exact state means:

- same project;
- same screen;
- same selected article or settings page;
- same sidebar collapsed/expanded state;
- same panel sizes and collapsed panels;
- same preview route;
- same dirty/saved/autosave state;
- same editor selection and scroll position when practical;
- same window geometry where the OS allows it.

If exact restore fails, the app should fall back gracefully to recent projects
with a repairable explanation.

### Project Home

After a project is open, the user sees a calm project home with common actions:

- New article
- Open article
- Media
- Settings
- Preview
- Publish

The project home should not be a global health dashboard. Diagnostics should
appear locally when relevant or when an action is blocked.

### Article Browsing

The left sidebar contains a collapsible article/file hierarchy. It should show
articles in author language, with subtle state markers for draft, dirty,
invalid, missing media, or published state where those facts matter.

The main work pane should also include an article directory/browser surface
for deeper browsing. This surface is useful when the user clicks Articles or
Open article and wants to scan beyond the currently visible tree. It should
support:

- status tabs such as All, Published, and Drafts;
- search by title, body excerpt, category, and tag where available;
- category/tag filters;
- article previews with title, status, date, read time, author, route/source
  hint where appropriate, and a short excerpt;
- clear actions to open the editor, create a new article, and recover from
  empty/no-result states.

The directory complements the sidebar. The sidebar stays optimized for quick
navigation and current context; the directory is optimized for scanning,
filtering, and choosing what to work on next.

Right-click actions should include:

- rename;
- delete, with confirmation;
- open in file browser;
- convert to draft or publishable state where supported;
- move to another folder or category where safe;
- duplicate;
- copy public URL or source path where available.

### Article Editing

The editing view uses a two-pane layout:

- left or center editing pane;
- right preview pane.

The editing pane contains:

- schema-backed frontmatter form;
- raw Markdown/MDX editor;
- editor toolbar;
- local validation feedback;
- save/autosave status;
- checkpoint/restore affordance.

The preview pane renders the true site route, not an approximate Markdown
preview. If the preview is stale or blocked, the state should be visible.

### Settings

Settings are visual forms generated from schemas or schema-like descriptors.
The MVP should include first-class settings surfaces for:

- site identity;
- canonical URL/domain;
- navigation;
- social/support links;
- authors;
- categories/tags;
- homepage or featured content where supported;
- theme basics;
- Cloudflare connection and publish target.

Invalid settings should be rejected at the field level before they become
canonical source.

### Media

The media browser should show thumbnails and let the user:

- browse images;
- view a full image;
- edit alt text;
- edit caption/description where supported;
- inspect usage where fixture data exists;
- insert an image at the current editor cursor;
- replace or reveal an image where supported.

The MVP may use fixture-backed media data in the first implementation, but the
design must reflect the future media adapter model.

### Preview

Preview must represent the rendered site route. It should support:

- previewing the current article route from the editor;
- previewing the home page from project-level publish actions;
- browsing within the preview where practical;
- showing stale, loading, blocked, and failed states.

### Publish

Publish is a multi-step flow:

1. User clicks Publish.
2. The app builds or simulates a publish preview.
3. The preview opens at the current article route when publishing from the
   editor, otherwise at the home page.
4. The user can browse the preview.
5. The user clicks Confirm.
6. A modal explains the destination, changes, warnings, required provider, and
   rollback/checkpoint facts.
7. The user confirms or cancels.
8. The app applies the publish operation through the configured deploy
   provider.

No interface should jump directly from "Publish" to a provider mutation without
a plan and explicit approval.

## Fixture-Backed Prototype Definition

The next implementation milestone should build a fixture-backed GUI prototype.

That prototype should:

- be fully navigable;
- be visually polished;
- include realistic data and state transitions;
- demonstrate startup, project home, article editor, media, settings, preview,
  publish, validation, autosave, and recovery flows;
- use fixture data shaped like future Rust operation results;
- avoid real filesystem writes, real credentials, and real deploys;
- avoid creating a throwaway frontend-only source model.

The prototype is allowed to simulate user actions visually. It is not allowed
to pretend that simulated behavior is production backend behavior.

## Non-Goals

The MVP does not include:

- WYSIWYG MDX editing;
- full rich-text round-trip editing;
- collaboration;
- comments or editorial assignment;
- GitHub backup/sync;
- GitHub pull-request review;
- plugin marketplace;
- third-party extension install flows;
- multiple deploy providers;
- complex enterprise workflow adapters;
- MCP write tools;
- hosted SaaS control plane;
- real-time multi-user editing;
- direct source editing outside the modeled editor surface;
- provider-specific debug dashboards;
- broad filesystem, shell, network, or credential permissions in the frontend.

## Source Map

| Source                                                    | What it owns for this MVP                                                                                                                |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `agent-docs/studio/STUDIO_PRODUCT_VISION.md`              | Product north star, product modes, progressive adoption ladder                                                                           |
| `agent-docs/roadmap/PLATFORM_ROADMAP.md`                  | Long-term compiler/studio direction and interface parity                                                                                 |
| `agent-docs/core/ENGINEERING_PHILOSOPHY.md`               | Typed domain model, invalid-state prevention, thin adapters                                                                              |
| `docs/studio/HEADLESS_STUDIO_CORE_CONTRACT.md`            | Shared operation core and GUI/CLI/MCP/CI adapter boundaries                                                                              |
| `docs/studio/STUDIO_EDITING_SURFACES.md`                  | Schema-driven editing, media, metadata, preview, source-view concepts                                                                    |
| `docs/studio/STUDIO_PUBLISH_WORKFLOWS.md`                 | Plan/apply publish, rollback, credential, audit workflow                                                                                 |
| `docs/studio/STUDIO_PROVIDER_CAPABILITY_MATRIX.md`        | Provider capability and unsupported-operation behavior                                                                                   |
| `docs/studio/STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md`  | Credentials, permission, scope, redaction, audit boundaries                                                                              |
| `docs/studio/STUDIO_PROGRESSIVE_ADOPTION_PATHS.md`        | Upgrade paths from solo local publishing to complex providers                                                                            |
| `docs/studio/STUDIO_FRONTEND_SHELL.md`                    | Current read-only Astro Studio shell and existing GUI boundary                                                                           |
| `docs/rust/RUST_OPERATION_CONTRACTS.md`                   | Current operation envelope, diagnostics, and fixture expectations                                                                        |
| `docs/studio/gui-mvp/STUDIO_GUI_MVP_VISUAL_REFERENCES.md` | Primary and supplemental visual reference images for Studio GUI style, layout, improved/rough mockup inspiration, and state presentation |

## Acceptance Criteria

The product definition is ready when:

1. a designer can understand the product without knowing the repo;
2. an engineer can distinguish MVP work from later studio work;
3. the scope covers a real user journey from opening a project to publishing;
4. the non-goals prevent WYSIWYG, collaboration, GitHub, additional provider,
   and backend expansion from entering the first GUI milestone;
5. every planned screen can be mapped to a product reason;
6. the fixture-backed prototype is clearly defined;
7. GUI behavior remains an interface over shared operation contracts.
