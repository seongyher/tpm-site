# Studio Editing Surfaces

This document is the design packet for `IRK-137`: schema-driven editing,
media, metadata, and preview surfaces for the future static blog studio.

The studio should let non-technical authors edit a static site without learning
repository structure, frontmatter, Astro, image pipelines, or provider details.
Power users and complex publishers still need source-level escape hatches, but
those escape hatches must use the same source, schema, diagnostic, media,
preview, and extension contracts as the default GUI.

Related documents:

- [STUDIO_PRODUCT_VISION.md](../../agent-docs/studio/STUDIO_PRODUCT_VISION.md)
- [STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md](../../agent-docs/studio/STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md)
- [STUDIO_ADAPTER_MODEL.md](../../agent-docs/studio/STUDIO_ADAPTER_MODEL.md)
- [STUDIO_EXTENSION_MODEL.md](../../agent-docs/studio/STUDIO_EXTENSION_MODEL.md)
- [STUDIO_READINESS_CONTRACTS.md](./STUDIO_READINESS_CONTRACTS.md)

## Goals

1. Make author and site-owner editing possible through product language:
   article, image, author, category, homepage, redirect, metadata, support
   link, provider, and publish setting.
2. Keep source truth in the publication workspace. The GUI may hold draft
   buffers and indexes, but source contracts remain canonical.
3. Generate editing surfaces from schemas plus studio descriptors, not from
   hand-built one-off forms.
4. Preserve advanced source editing and extension-owned UI without making the
   default user learn those details.
5. Make preview, validation, metadata, PDF, feed, search, media, and extension
   fallback behavior visible in author language.
6. Keep every future interface on the same model: GUI, CLI, MCP, CI, and tests
   should all understand the same editable source references and diagnostics.

## Non-Goals

- This document does not implement a GUI, editor, preview server, media
  provider, or schema descriptor runtime.
- This document does not choose a final editor library.
- This document does not replace Astro content schemas. It describes the
  studio-facing layer that should be derived from them.

## Surface Model

Every editable surface should be represented by an editor document:

```text
EditorDocument
  source reference
  source status
  source owner
  schema owner
  sections
  fields
  draft patches
  diagnostics
  generated-output effects
  required provider capabilities
  extension ownership
```

The GUI renders this model as friendly forms, editors, and previews. The CLI
and MCP can inspect the same model as structured data.

### Source References

A source reference identifies the thing being edited:

- workspace ID;
- source adapter ID;
- domain, such as article, page, redirect, site config, media, or theme;
- source key, such as content entry ID or config path;
- stable path or provider locator;
- source owner and repair owner;
- schema owner;
- generated-output effects.

Diagnostics, preview requests, source diffs, and audit events should all point
to source references. This prevents the GUI from inventing its own state model.

### Field Descriptors

Field descriptors are not raw Zod rules. They are authoring descriptors derived
from source schemas, platform policy, and extension manifests.

Each descriptor should include:

- stable field ID;
- source path;
- label and help text;
- input kind;
- default and required facts;
- beginner, advanced, code-only, or extension-owned visibility;
- validation owner;
- diagnostic category;
- generated-output effects;
- preview cost;
- safety class.

Default forms show beginner-safe fields first. Advanced fields remain available
without becoming the default experience.

## Editable Domains

| Domain              | Default surface                                                           | Advanced surface                                                                  | Generated effects                                                      |
| ------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Articles            | title, subtitle, body, author, date, category, image, tags, draft/publish | slug/source path, legacy permalink, metadata profiles, PDF flags, raw frontmatter | article route, metadata, feeds, sitemap, search, PDFs, social previews |
| Announcements       | title, body, date, image, visibility                                      | route details, metadata profiles, raw frontmatter                                 | announcement routes, homepage modules, feeds, search, sitemap          |
| Pages               | title, body, route label, hero/media, draft                               | custom page metadata, raw frontmatter                                             | page routes, metadata, sitemap, search                                 |
| Authors             | display name, bio, aliases, website, social links                         | author type, canonical IDs, raw frontmatter                                       | author pages, bylines, JSON-LD, metadata                               |
| Categories and tags | display name, description, order                                          | redirects, aliases, raw category records                                          | taxonomy pages, navigation, discovery                                  |
| Collections         | title, description, ordered items, item notes                             | collection type, advanced visibility, raw frontmatter                             | collection pages, homepage rails, related surfaces                     |
| Redirects           | from, to, reason                                                          | status policy, compatibility notes, raw record                                    | redirect files, verifier reports, deploy adapter compatibility         |
| Site config         | identity, domain, nav, support, social, homepage, feature toggles         | route policy, metadata defaults, config source                                    | global metadata, navigation, feeds, PDFs, support, share, discovery    |
| Theme               | color, typography, logo, density where supported                          | raw token editing                                                                 | global CSS and visual previews                                         |
| Media               | add, replace, alt, caption, role, usage                                   | provider IDs, provenance, derivative policy                                       | optimized images, social images, PDFs, feed/search fallbacks           |
| Providers           | connect, status, test, default target                                     | scopes, credentials, provider diagnostics                                         | source, media, build, deploy, workflow, observability operations       |
| Extensions          | enable, configure, preview capability                                     | manifest fields, source schema additions                                          | custom UI, artifacts, metadata, media, diagnostics                     |

## Editor Modes

### Simple Form Mode

Simple form mode is the default for site configuration, article metadata,
media metadata, redirects, authors, categories, collections, providers, and
extension settings.

Rules:

- group fields by author intent rather than file structure;
- use author language;
- show generated-output effects only where useful;
- keep warnings close to the field that can repair them;
- support long text, long filenames, many tags, and empty states;
- keep keyboard and screen-reader flow coherent.

### Markdown Writing Mode

Markdown writing mode is the default for article, page, and announcement body
text.

The product should support:

- source-faithful Markdown editing;
- preview pane or preview route;
- paste and drag-drop media insertion;
- citation, footnote, and embed helpers;
- outline/table-of-contents assistance;
- validation for links, images, references, and unsupported syntax;
- autosave and restore points.

The editor should not rewrite Markdown unexpectedly. Formatter actions should
be explicit and reversible.

### MDX And Component Mode

MDX is valid content, but not all MDX is visually editable.

Component classes:

- `visual`: editable with a descriptor and preview behavior;
- `fallback-only`: renders, but only exposes simplified metadata/PDF/feed
  behavior;
- `code-only`: source editing is the supported editor;
- `unsupported`: detected, blocked, or degraded with diagnostics.

The GUI should never silently drop unsupported MDX behavior. It should show
what is editable, what is source-only, and what affects generated artifacts.

### Source View

Source view is an explicit escape hatch for power users. It should be available
when the current source adapter permits it, but it should not be required for
normal authoring.

Source view must:

- preserve source formatting as much as practical;
- show diagnostics by source location;
- produce source diffs before write;
- reject writes that violate schemas unless the user enters an explicit
  advanced escape path;
- keep raw code edits out of beginner flows.

## Media Workflows

Media is a domain, not a path convention.

Supported provider classes:

- repo-local or workspace-local media;
- app-managed local media;
- external folder or external drive;
- cloud drive;
- object storage;
- SaaS media library;
- enterprise DAM.

Common actions:

- add media;
- replace media;
- set alt text and caption;
- choose role, such as article image, inline image, social image, author image,
  logo, PDF asset, or extension asset;
- inspect usage;
- relink missing media;
- migrate storage;
- materialize build input;
- mark explicit unoptimized escape hatch.

Media diagnostics should identify:

- missing asset;
- inaccessible asset;
- unsupported type;
- oversized asset;
- absent alt text when required;
- public-file passthrough where optimized asset is expected;
- remote media that cannot be materialized;
- provider capability missing.

## Preview Orchestration

Preview should be an operation over source intent and dirty patches.

Preview input:

- editor document reference;
- draft patches;
- requested route or artifact surface;
- media materialization requirements;
- extension capability requirements;
- preview speed target, such as diagnostics-only, route preview, or full build.

Preview output:

- status: `ready`, `diagnostics`, `unsupported`, or `unavailable`;
- route preview URL or output path when available;
- diagnostics with source references;
- generated metadata summary;
- media status;
- PDF/search/feed/social fallback status;
- release or artifact references when produced.

Fast preview can use caches, but final truth must remain the platform compiler
and generated-output contracts.

## Accessibility And Responsive Behavior

Editing surfaces must be designed for:

- keyboard-only operation;
- screen-reader labels and descriptions;
- focus restoration after preview, modal, and provider flows;
- large text and long-content states;
- narrow desktop, mobile, and split-pane layouts;
- offline, provider-down, and source-conflict states;
- autosave recovery and no data loss.

Complex editors may use richer controls, but every action must have a semantic
fallback and a clear textual diagnostic.

## Verification Plan

Later implementation should add fixtures for:

- every editable domain in the table above;
- schema-to-form descriptor parity;
- beginner versus advanced field visibility;
- Markdown body editing with images, citations, footnotes, links, and embeds;
- MDX `visual`, `fallback-only`, `code-only`, and `unsupported` components;
- missing, oversized, remote, inaccessible, and externalized media;
- preview output matching CLI/core artifact results;
- autosave, conflict, offline, and recovery behavior;
- keyboard and screen-reader flows;
- extension-disabled and capability-missing fallbacks.

The fixture contract belongs to the later studio implementation and parity
milestones. This design gives those milestones the surface inventory and
expected invariants.

## Handoff

Implementation should happen after the headless operation core and provider
capability runtime exist. The first implementation slice should render
read-only descriptors and diagnostics, then add safe local draft edits, then
add media and preview, then provider-backed writes and publish flows.
