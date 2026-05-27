# Platform Module Boundaries

The platform is reusable engine code. A site instance supplies content, assets,
theme tokens, public files, redirects, and configuration. Platform modules
should make those boundaries obvious enough that future maintainers, site
owners, authors, and GUI tooling can reason about the system without learning
incidental TPM implementation details.

## Domain Map

- Content model
  Owns loading, validating, normalizing, sorting, and aggregating publishable
  entries and editorial metadata. Current modules: `announcements`, `archive`,
  `article-compiler`, `article-continuity`, `article-list`,
  `article-page-view-model`,
  `article-view`, `authors`, `collections`, `content`,
  `content-route-view-models`,
  `content-schemas`, `feed`, `home`, `listing-route-view-models`,
  `publishable`, and `tags`.
  The publishable-entry contract is documented in
  [`PUBLISHABLE_ENTRY_MODEL.md`](./PUBLISHABLE_ENTRY_MODEL.md).
- Routes and features
  Owns URL construction, static path helpers, optional feature routes,
  navigation, metadata contracts, SEO, social previews, share targets, support
  CTAs, site config, site instance paths, and redirects. Current modules:
  `feature-routes`, `metadata`, `metadata-graph`, `navigation`,
  `platform-context`, `semantic-profile-kinds`,
  `route-registry`, `routes`, `semantic-metadata`, `seo`, `share-targets`,
  `site-config`,
  `site-config-defaults`, `site-instance`, `site-redirects`,
  `source-artifacts`, `static-paths`, and `support`.
  Route view-model responsibilities are documented in
  [`ROUTE_VIEW_MODELS.md`](./ROUTE_VIEW_MODELS.md).
  Metadata graph and semantic profile responsibilities are documented in
  [`METADATA_GRAPH_AND_SEMANTIC_PROFILES.md`](./METADATA_GRAPH_AND_SEMANTIC_PROFILES.md).
- Article rendering
  Owns prose-adjacent article view helpers such as embed media layout, image
  policy, title fitting, and table-of-contents data. Current modules:
  `article-image-policy`, `article-list-title-fit`, `article-toc`, and
  `embed-media`.
- Media policy
  Owns cross-surface media roles, provider adapters, output policies,
  fallbacks, media diagnostics, and generated media artifact expectations.
  Current modules: `media-policy` and `social-images`. Related article image,
  embed, PDF, and publishable media helpers consume or will consume the same
  policy contracts; the target contract is documented in
  [`MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md`](./MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md).
- PDF and scholarly output
  Owns article PDF compatibility, PDF output metadata, and PDF generation
  inputs. Current modules: `article-pdf` and `article-pdf-compatibility`.
- Output verification
  Owns shared generated-output diagnostic types, verifier module contracts,
  author-facing diagnostic taxonomy and source mapping, diagnostic aggregation,
  route-class performance budgets, cache policy evidence, performance workbench
  policy, release governance, static-output security policy, supply-chain
  policy, and machine-readable release-report shapes.
  Current modules: `author-diagnostics`, `output-verification`,
  `performance-budgets`, `performance-workbench`, `release-governance`, and
  `static-output-security`, `supply-chain-policy`, and `third-party-origins`.
  Release governance is documented in
  [`RELEASE_GOVERNANCE.md`](./RELEASE_GOVERNANCE.md).
  Static-output trust boundaries and security headers are documented in
  [`STATIC_OUTPUT_SECURITY.md`](./STATIC_OUTPUT_SECURITY.md).
  Future studio credential, provider permission, redaction, audit, and recovery
  contracts are documented in
  [`STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md`](./STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md).
  Supply-chain and secret posture is documented in
  [`SUPPLY_CHAIN_AND_SECRET_POLICY.md`](./SUPPLY_CHAIN_AND_SECRET_POLICY.md).
- Deployment adapters
  Own provider-neutral deployment request/result contracts and provider-specific
  adapter implementations that consume release artifacts without leaking host
  mechanics across the platform. Current module: `deployment-adapters`. The
  adapter contract is documented in
  [`DEPLOYMENT_ADAPTER_CONTRACT.md`](./DEPLOYMENT_ADAPTER_CONTRACT.md).
- Observability
  Owns provider-neutral webmaster, scanner, analytics, performance, security,
  and crawler finding models plus deterministic route-linked report helpers,
  author-diagnostic bridges, and release-health comparison helpers.
  Current modules: `observability`, `observability-diagnostics`, and
  `observability-reports`.
  The import and report contract is documented in
  [`OBSERVABILITY_AND_WEBMASTER_REPORTS.md`](./OBSERVABILITY_AND_WEBMASTER_REPORTS.md).
- Studio readiness
  Owns studio-facing editor model descriptors, source-field mappings,
  editorial workflow state transitions, schema-to-form descriptors, preview
  request/response shells, provider-neutral workflow capabilities, mocked
  workflow adapters, and future GUI/CLI/MCP contracts that must consume
  existing platform source contracts instead of a parallel CMS model. Current
  modules: `studio-forms`, `studio-models`, and `studio-workflows`. The
  readiness contract is documented in
  [`STUDIO_READINESS_CONTRACTS.md`](./STUDIO_READINESS_CONTRACTS.md).
- Extension architecture
  Owns typed extension manifests, capability families, extension points,
  permission declarations, disabled behavior, dependency/conflict declarations,
  migration declarations, and manifest validation diagnostics. Current module:
  `extensions`. The extension manifest contract is documented in
  [`EXTENSION_ARCHITECTURE.md`](./EXTENSION_ARCHITECTURE.md).
- References and bibliography
  Owns canonical note/citation parsing, BibTeX parsing, generated article
  citations, and global bibliography data. Current modules:
  `article-references/*`, `bibliography`, and `citations/article-citation`.
  The target citation normalization contract is documented in
  [`CITATION_SOURCE_MODEL.md`](./CITATION_SOURCE_MODEL.md).
- Interaction primitives
  Owns browser-independent positioning/disclosure logic shared by navigation,
  popovers, clipboard surfaces, and hover/tap surfaces. Current modules:
  `anchored-disclosure`, `anchored-positioning`, `browser-clipboard`, and
  `interaction-primitives`.
- Import/export
  Owns preservation-aware migration fixtures, source-map proof shapes, and
  future import/export contracts that let CLI, MCP, studio, and migration tools
  share one source model. Current module: `migration-fixtures`. The import,
  export, preservation, and fixture contract is documented in
  [`IMPORT_EXPORT_AND_PRESERVATION_POLICY.md`](./IMPORT_EXPORT_AND_PRESERVATION_POLICY.md).
- Localization
  Owns locale, route-prefix, direction, long-string, label, metadata, feed,
  search, PDF, and diagnostic fixture contracts for future localization work.
  Current modules: `inclusive-defaults` and `localization-fixtures`. The
  localization contract is documented in
  [`LOCALIZATION_CONTRACTS.md`](./LOCALIZATION_CONTRACTS.md).
- Starter templates
  Owns maintained starter-template descriptors, personas, feature matrices,
  declared checks, and distribution-readiness source contracts.
  Current module: `starter-templates`. The starter matrix is documented in
  [`STARTER_TEMPLATES.md`](./STARTER_TEMPLATES.md).
- Shared utilities
  Owns small generic helpers that do not own domain behavior. Current modules:
  `html` and `utils`.

When a new `src/lib` module is added, it should either fit one of these domains
or the domain map should be expanded deliberately. A file that cannot be named
in this map usually means the abstraction is too vague or the module is doing
work in the wrong layer.

## Boundary Rules

- Platform modules may read site-specific values only through typed adapters:
  `site-config`, `site-instance`, content loaders, or explicit component props.
- Platform modules must not import from `site/` directly. The only core
  exception is `BaseLayout` importing `@site/theme.css`, because the theme file
  is the site-owned CSS token implementation.
- Site assets are accessed through content frontmatter, Markdown/MDX asset
  references, or the `@site/assets` alias in site-owned content. Reusable core
  modules should not import a concrete site asset.
- TPM publication identity, URLs, handles, support links, and editorial copy
  belong in the site instance, not reusable platform code.
- The private component catalog is a platform review surface. It must use
  platform-owned fixture assets and neutral example data instead of depending
  on live TPM assets or copy.
- Route, feature, Pagefind, sitemap, HTML validation, and build verification
  expectations should derive from the same feature model.
- Author-facing behavior should prefer defaults and validation over repeated
  frontmatter. Site owners should configure defaults in `site/config/site.json`.

## CI Invariants

`just platform-check` verifies the current enforceable subset:

- every `src/lib` module is assigned to a platform domain;
- every `src/platform` internal entrypoint is assigned to a platform domain;
- reusable core `src/` files do not contain obvious TPM-specific identity,
  support, or social literals;
- reusable core `src/` files do not import unsupported site-instance aliases or
  paths.
- platform entrypoints only re-export local entrypoints or `src/lib` domain
  modules, so they cannot bypass package seams by reaching into pages,
  layouts, components, site content, scripts, tests, or provider-specific
  tooling.

This is intentionally not a full architectural proof. It is a narrow guardrail
around the failure modes that are easiest to reintroduce while platformizing.
Catalog source files are included in this check because the catalog now uses
generic platform fixture data.

## Internal Entrypoints

`src/platform/` contains the current internal public entrypoints. They are
private to the repo for now, but they are shaped like package APIs so future
fixtures, examples, CLI, MCP, studio, and extraction work can consume stable
domain seams instead of incidental implementation files.

Current entrypoints:

- `src/platform/deployment.ts`
  Exposes provider-neutral deployment result types and the Cloudflare Workers
  Static Assets reference adapter.
- `src/platform/diagnostics.ts`
  Exposes author-facing diagnostics and generated-output diagnostics.
- `src/platform/extensions.ts`
  Exposes extension manifests, capability families, permissions, and manifest
  validation helpers.
- `src/platform/import-export.ts`
  Exposes preservation-aware migration fixture helpers and source-map contracts.
- `src/platform/interactions.ts`
  Exposes browser-independent anchored positioning and interaction-policy
  contracts.
- `src/platform/localization.ts`
  Exposes locale fixture reports for generated-output and future layout
  coverage.
- `src/platform/media.ts`
  Exposes site-neutral media roles, fallbacks, embed classification, and media
  diagnostics.
- `src/platform/references.ts`
  Exposes pure article-reference, citation, BibTeX, RIS, and source
  normalization contracts.
- `src/platform/release.ts`
  Exposes release-governance reports, diagnostics, launch checklist, and
  compatibility policy helpers.
- `src/platform/routes.ts`
  Exposes route-registry helpers that take explicit site configuration instead
  of importing route files.
- `src/platform/security.ts`
  Exposes static-output trust-boundary policy, security header assessment,
  third-party origin diagnostics, and supply-chain policy helpers.
- `src/platform/starters.ts`
  Exposes maintained starter-template descriptors and acceptance criteria.

These entrypoints intentionally avoid active-site singleton exports. Modules
that still depend on current `site/`, cwd, environment, Astro collections, or
filesystem state should stay behind adapters until their inputs are explicit
enough to be consumed by non-TPM fixtures.

## Design Review

The boundary is deliberately conservative. It does not create a package system,
workspace split, plugin API, or GUI layer yet. Those would add maintenance
weight before the site-instance contract has settled. The current design keeps
the useful pressure where it belongs: clear domains, typed adapters,
site-owned configuration, repeatable example-site proof, and checks that catch
new TPM leakage before it lands in reusable code.
