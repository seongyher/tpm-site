# Source Contracts

This document defines the Milestone 1 source-contract layer for the platform.
The goal is to make the platform's core inputs, generated outputs, routes,
feature ownership, and article render facts explicit enough for tests, scripts,
future example sites, CLI tools, MCP tools, and a future CMS studio to consume
safely.

The contracts are intentionally behavior-preserving. They do not redesign public
URLs, article rendering, route pruning, or reader-facing layout. They make the
current behavior explicit, typed, testable, and reusable.

## Principles

- Keep site-instance choices in `site/` and reusable platform contracts in
  `src/` or `scripts/`.
- Prefer typed values over repeated strings for source roots, generated
  artifacts, feature routes, and article render facts.
- Preserve compatibility singleton exports while adding explicit context seams
  for tests, scripts, future multi-site tooling, and future GUI tooling.
- Characterize current behavior before moving data behind a new boundary.
- Make invalid locations, disabled-feature links, duplicate routes, missing
  outputs, and article metadata drift fail with specific diagnostics.
- Keep source contracts static-first and framework-light. The same contracts
  should be usable by Bun scripts without an Astro runtime.

## Contract 1: Source And Artifact Manifest

The source/artifact manifest names the repository locations and generated output
families the platform knows how to read, write, verify, or expose.

Each manifest entry has:

- a stable `key`;
- a lifecycle `kind`;
- an owner: `author`, `site-owner`, or `platform`;
- a role such as `content`, `config`, `processed-asset`, `public-static`,
  `generated-route`, `generated-feed`, `generated-search`, or `generated-pdf`;
- an absolute path and project-relative path;
- whether the location is required for a valid site instance;
- whether the entry is editable source, parked source, generated output, or
  copied public static output.

Required invariants:

- Editable author/site-owner files live under the active site instance.
- Processed images and reusable visual assets live under `site/assets/`.
- Public files are only for root files that must be copied untouched.
- `dist` and alternate `SITE_OUTPUT_DIR` values are generated outputs.
- Generated output families are declared even when their concrete files are
  feature-dependent.
- Parked assets are source-owned but excluded from normal asset optimization.
- Build verifiers, site doctor, and release reports use this manifest vocabulary
  instead of re-declaring ownership rules.

## Contract 2: Platform Context

The platform context makes one active site explicit while preserving current
default imports for Astro pages and scripts.

The full context contains:

- resolved `SiteInstancePaths`;
- normalized `SiteConfig`;
- a source/artifact manifest for those paths and config;
- a route registry for that config.

Narrow context slices exist so modules can depend only on what they need:

- source/artifact consumers receive paths plus manifest data;
- route consumers receive config plus route registry entries;
- article compiler consumers receive article defaults, feature flags, and route
  facts rather than reading global state directly.

Required invariants:

- Tests and tooling can compose contexts from explicit paths/config without
  re-reading process state.
- Default singleton exports remain compatibility shims for current Astro routes
  and scripts.
- New reusable helpers should accept explicit context or narrow config inputs
  instead of importing singleton config when practical.

## Contract 3: Route, Entity, And Feature Registry

The route registry is the canonical place to describe public route surfaces and
their owning features.

Each registry entry has:

- the site route key;
- the entity kind represented by the route;
- an optional feature key when disabling a feature should prune or hide the
  route;
- whether the route is enabled for the current config;
- configured route path;
- route pattern/cardinality;
- generated output kind and output path;
- generated artifact family;
- discovery surfaces such as HTML, navigation, sitemap, feed, search, metadata,
  validation, redirect fallback, and disabled-feature diagnostics.

Required consumers:

- URL helpers and route-output helpers;
- optional route pruning and disabled-feature diagnostics;
- sitemap, feed, search, Pagefind, and HTML validation targets;
- generated-output verification;
- historical permalink and configured-link diagnostics.

The registry does not mean every configured route path is already a dynamic
Astro route. It records the platform's current route contract and gives later
route-pruning and route-renaming work one source of truth.

## Contract 4: Article Compiler Artifact

The article compiler artifact is the single compiled fact set for one article
after content schema validation and Markdown/MDX processing inputs are known.

The artifact contains:

- stable article ID, slug, source path, source format, and source collection;
- normalized title, description, date, category, author text, tags, draft state,
  and visibility;
- canonical article path, route key, HTML output path, and optional PDF output
  path;
- resolved image/social image facts that downstream components need;
- table-of-contents facts;
- reference and bibliography facts;
- PDF and scholarly metadata eligibility;
- discovery/surface eligibility for directory, feed, homepage, search, sitemap,
  and PDF output.

Required invariants:

- Downstream article page, layout, Scholar/PDF, search/feed/sitemap, and
  verifier code should consume the artifact for facts it owns.
- The artifact should not do rendering IO or parse generated HTML.
- Source facts and generated-output facts must be explicit so future GUI/CLI/MCP
  tools can explain what one article will produce.
- Optional features and frontmatter overrides must be represented as typed facts
  rather than scattered boolean checks.

## Verification Policy

Each contract has focused unit coverage. Release-level checks are required
after integration changes.

Required focused coverage:

- source/artifact manifest: default and fixture site paths, generated output
  families, required/optional placement, and site-doctor integration;
- platform context: default and injected contexts, route registry context, and
  fixture config/path composition;
- registry: configured routes, optional features, route ownership, generated
  output paths, route surfaces, and disabled-feature diagnostics;
- article artifact: article view-model characterization, reference/PDF/table of
  contents fixtures, visibility/default policy, and downstream output facts.

Final verification should use focused tests first, then `bun --silent run
check:release` before Linear status handoff.
