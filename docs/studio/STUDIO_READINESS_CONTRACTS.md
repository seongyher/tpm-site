# Studio Readiness Contracts

This document defines the Milestone 4 contracts that make a future studio,
CLI, MCP server, or GUI editor a consumer of the platform compiler rather than
a parallel CMS.

The contracts are intentionally static-first. They do not implement a runtime
studio, real provider integration, or real-time preview server. They define the
typed seams those products will consume.

## Principles

- The source of truth remains the site workspace: content files, site config,
  redirects, theme tokens, assets, public files, and generated artifacts.
- Studio models describe editable intent over that source. They do not invent a
  second database-shaped content model.
- Every editable field must know its source owner, schema owner, repair owner,
  and generated-output effects.
- Editorial state is explicit and discriminated. Invalid states such as a
  scheduled entry with no publish date or an approved review with blocking
  diagnostics should be impossible to represent in the normalized model.
- Provider mechanics are adapter-owned. Branches, commits, pull requests,
  deploy logs, cache invalidation, and credentials may be exposed as advanced
  details, but the default product language remains editorial.
- Preview and publish flows consume the same source contracts, compiler
  artifacts, route registry, diagnostics, media policy, metadata contracts, and
  generated-output verifiers used by CLI and CI.

## Editable Domains

The first studio contract covers the current editable source domains.

| Domain               | Source owner      | Source location                                          | Schema or contract owner                                                 | Generated effects                                                                 |
| -------------------- | ----------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Articles             | author            | `site/content/articles/`                                 | article frontmatter schema, publishable model, article compiler artifact | article route, metadata, feed/search/sitemap, PDF eligibility, social previews    |
| Announcements        | author            | `site/content/announcements/`                            | announcement schema, publishable model                                   | announcement route, homepage, feed/search/sitemap, metadata                       |
| Pages                | author            | `site/content/pages/`                                    | page schema and route view models                                        | page route, metadata, search/sitemap                                              |
| Collections          | author            | `site/content/collections/`                              | editorial collection schema and collection helpers                       | collection routes, homepage featured/start-here surfaces                          |
| Authors              | author            | `site/content/authors/`                                  | author schema and author helpers                                         | author routes, article bylines, metadata                                          |
| Categories           | site owner        | `site/content/categories/`                               | category schema and category helpers                                     | category routes, navigation, discovery surfaces                                   |
| Redirects            | site owner        | `site/config/redirects.json`                             | redirect parser and route registry                                       | redirect fallback pages, Cloudflare redirect files                                |
| Site config          | site owner        | `site/config/site.json`                                  | site config schema, route registry, feature registry                     | navigation, routes, metadata, support/share/feed/search/PDF behavior              |
| Support/social links | site owner        | `site/config/site.json`                                  | support/share config schemas                                             | support CTAs, share menus, metadata `sameAs`                                      |
| Theme tokens         | site owner        | `site/theme.css`                                         | theme boundary and design-token policy                                   | visual theme across generated routes                                              |
| Assets and media     | author/site owner | `site/assets/`, `site/public/`, external future adapters | source artifact manifest and media policy                                | optimized images, public static files, social previews, PDF/search/feed fallbacks |

The table is descriptive, not a new schema. Implementation should expose these
facts as JSON-ready descriptors derived from existing contracts.

## Editable Field Mapping

The first implementation should describe fields at the granularity needed for
forms, diagnostics, and previews. It does not need to expose every nested Zod
rule, but it must identify the platform owner for each editable field family.

| Editable field family                                                                                                                   | Source path                                                       | Validation owner                 | Diagnostic owner                                       | Generated-output owner                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| Article title, description, author, dates, image, image alt, tags, semantic metadata, visibility, draft, PDF flag, and legacy permalink | article frontmatter                                               | article schema                   | content schema, site doctor, generated-output verifier | article compiler, publishable, metadata, PDF, feed/search/sitemap        |
| Article category and slug                                                                                                               | article file path                                                 | route/content helpers            | site doctor and route diagnostics                      | route registry, article compiler, taxonomy lists                         |
| Announcement title, description, author, dates, image, image alt, semantic metadata, visibility, draft, and legacy permalink            | announcement frontmatter                                          | announcement schema              | content schema, site doctor, generated-output verifier | publishable, metadata, homepage, feed/search/sitemap                     |
| Page title, description, draft, hero, and start-here links                                                                              | page frontmatter                                                  | page schema                      | content schema, site doctor, generated-output verifier | page route view models, metadata, search/sitemap                         |
| Collection title, description, draft, ordered item references, and item notes                                                           | collection frontmatter                                            | editorial collection schema      | content schema and site doctor                         | collection pages and homepage collection surfaces                        |
| Author display name, aliases, type, bio, website, and social links                                                                      | author frontmatter                                                | author schema                    | content schema and site doctor                         | author pages, bylines, metadata                                          |
| Category title, description, and order                                                                                                  | category frontmatter                                              | category schema                  | content schema and site doctor                         | category pages, navigation, taxonomy lists                               |
| Redirect source and target                                                                                                              | `redirects.json` record key/value                                 | redirect parser                  | site doctor and redirect verifier                      | redirect fallback pages and platform deploy outputs                      |
| Identity, routes, feature flags, homepage, navigation, metadata, share, support, and content defaults                                   | `site.json` fields                                                | site config schema               | site doctor, route registry, generated-output verifier | all route, metadata, discovery, support, share, feed/search/PDF behavior |
| Theme token values                                                                                                                      | `site/theme.css` token declarations                               | theme boundary policy            | future theme verifier                                  | generated CSS and visual theme                                           |
| Media path, role, alt text, dimensions, source placement, and public/static behavior                                                    | content frontmatter, Markdown/MDX, `site/assets/`, `site/public/` | content schemas and media policy | site doctor, asset audit, generated-output verifier    | optimized assets, social previews, PDFs, search/feed fallbacks           |

The author-facing studio can collapse these into simpler forms, but the
machine-readable model should retain the field family, source path, owner, and
output effects so diagnostics and previews can point to the right repair.

## Editor Model Layers

Studio-facing models have four layers.

1. **Source reference:** stable identity for the source being edited. It names
   the editable domain, source artifact key, source path or config path,
   source owner, and schema owner.
2. **Field descriptor:** one repairable field or group of fields. It includes a
   field path, label, help text, input kind, required/default facts, source
   mapping, diagnostics categories, and generated-output effects.
3. **Editor document:** a normalized view of one editable source document or
   config section. It contains descriptors, current values, draft values when
   present, source status, and diagnostics.
4. **Workflow envelope:** editorial state, preview state, provider capability
   requirements, validation gates, pending operation, and rollback/history
   facts around an editor document.

The GUI can render these descriptors, but the contracts must remain useful to
CLI and MCP consumers. Everything in the public contract should be
JSON-serializable.

## Editorial Workflow States

The studio model distinguishes source editability from public publication.

Supported normalized states:

- `draft`: editable source is not intended for public output.
- `ready`: source is valid enough to preview or publish, but not yet public.
- `in-review`: source is under an optional workflow policy.
- `changes-requested`: review exists but cannot publish until repaired.
- `approved`: review policy allows publishing.
- `scheduled`: source is valid and has a future publish time.
- `published`: source is public on configured discovery surfaces.
- `unpublished`: source is intentionally hidden or removed from public output.
- `rollback-proposed`: a previous version or release can be restored, but the
  restore has not been applied.

Workflow state must be represented as a discriminated union. Required state
facts belong on the relevant state, not as nullable fields elsewhere:

- `in-review`, `changes-requested`, and `approved` require a review reference.
- `scheduled` requires a scheduled publish time.
- `published` requires a release reference or explicit direct-publish marker.
- `rollback-proposed` requires a restore point and target source changes.

Preview is not a publication state. It is an operation over current source or
dirty editor state. A draft, review candidate, scheduled entry, or published
entry can all have a preview.

## Schema-To-Form Contract

Forms should be generated from source contracts plus studio descriptors.

Field descriptors should include:

- stable field ID;
- source domain and source artifact key;
- path within frontmatter, config, redirect record, or theme token source;
- author-facing label and optional help text;
- input kind such as text, textarea, date, boolean, select, multi-select,
  URL/path, image, reference, token, or hidden advanced field;
- default value and required/optional status when known;
- validation severity and diagnostic category;
- generated-output surfaces affected by the field;
- whether the field is beginner-safe, advanced, code-only, or extension-owned.

This layer should not duplicate Zod parsing rules. It should describe how the
future UI should ask for values while the existing schemas remain authoritative
for validation.

Form descriptor outputs should be stable across CLI, MCP, and GUI consumers:

- one form descriptor per editor document;
- one section for each source field family that authors understand as a unit;
- deterministic field ordering;
- values represented as JSON-compatible scalars, arrays, records, or null;
- advanced fields included but marked so default UIs can collapse them;
- extension-owned fields included only when the extension declares a schema and
  generated-output ownership.

Deployment settings should follow the same contract, but they are not core site
fields. A deploy provider extension should declare its provider-specific
schema, form descriptors, required credentials, and diagnostics. The platform
core should only expose the provider capability slot and common publish action
model.

## Preview Contract

A preview request describes dirty editor intent and expected output surfaces.

Preview inputs:

- editor document reference;
- proposed field patches or source changes;
- route preview targets;
- requested artifacts such as HTML, metadata, search, feed excerpt, social
  image, PDF eligibility, or diagnostics only;
- provider capability requirements when source/media/build is not local.

Dirty editor state should be represented as patches against a source
reference. Each patch names the field path, proposed JSON value, whether the
change is a draft-only value, and the expected source-write strategy. The
preview contract should reject patches for unknown fields or fields marked
`code-only` unless the caller explicitly requests source editing.

Preview outputs:

- preview status;
- route preview URL or output path where available;
- compiler artifact references;
- generated metadata summary;
- media and PDF fallback status;
- author diagnostics;
- unsupported-component diagnostics for MDX or extension-owned components.

Preview statuses:

- `ready`: preview output was produced from current source or dirty state.
- `diagnostics`: preview output is blocked or degraded by repairable
  diagnostics.
- `unsupported`: the requested preview includes code-only or unsupported
  source that cannot be safely rendered by the current surface.
- `unavailable`: a provider capability or local build/materialization step is
  missing.

Real-time preview acceleration may later cache partial builds, but final
preview truth must still come from deterministic platform contracts.

## MDX And Code-Only Escape Hatches

MDX components are valid content, but not all components will be visually
editable.

Component editing classes:

- `visual`: component has a descriptor, schema, preview behavior, and
  fallbacks.
- `fallback-only`: component renders in source/HTML but only exposes simplified
  PDF/search/feed/preview behavior.
- `code-only`: component is intentionally edited as source, not form fields.
- `unsupported`: component can be detected but not safely edited or previewed.

Unsupported and code-only states must be explicit diagnostics. The studio
should never silently drop MDX behavior or pretend a component is editable when
only source editing is safe.

## Provider-Neutral Workflow Contract

Workflow providers expose capabilities, not product assumptions.

Provider families:

- source;
- history;
- media;
- workflow;
- build;
- deploy;
- identity and credentials;
- diagnostics and observability.

Capabilities are data. A workflow action should declare required capability IDs
and whether the action supports dry run, retry, rollback, external side effects,
credential requirements, and destructive behavior.

Default solo publishing can be a local direct-publish workflow. GitHub pull
requests can be an advanced workflow adapter. Neither should become the
canonical product model.

## Round-Trip And Parity Contract

Studio-shaped edits must preserve source fidelity.

Required fixture classes:

- Markdown article frontmatter and body edits;
- MDX article with visual, fallback-only, and code-only component behavior;
- announcement edits;
- collection item ordering and notes;
- site config route/support/share/feature changes;
- redirect additions and invalid redirect diagnostics;
- media metadata and missing-media diagnostics;
- preview-only dirty state;
- provider mocked publish, review, rollback, and failed credential states.

Parity means a source edit made through a studio descriptor compiles to the
same platform artifacts and diagnostics as the equivalent CLI/file edit.

## Verification

Milestone 4 is complete when focused tests prove:

- editable source descriptors map to current source artifact keys and schema
  owners;
- workflow transitions accept valid transitions and reject invalid ones;
- form descriptors are deterministic and JSON-serializable;
- preview contracts are deterministic and diagnostic-bearing;
- mocked providers expose capabilities and state transitions without network or
  credentials;
- round-trip fixtures preserve source identity and compile through the same
  contracts as CLI edits;
- platform boundary checks know the new studio-readiness modules.
