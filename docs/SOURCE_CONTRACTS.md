# Source Contracts

This document tracks the Milestone 1 source-contract work. The goal is to make
the platform's core inputs, generated outputs, routes, feature ownership, and
article render facts explicit enough for tests, scripts, future examples, CLI
tools, MCP tools, and a future CMS studio to consume safely.

## Local Planning Notes

Linear contains the detailed Milestone 1 breakdown. The local roadmap currently
lives at `docs/PLATFORM_ROADMAP.md`; some Linear descriptions still reference
the older `agent-docs/PLATFORM_ROADMAP.md` path. `AGENTS.md` is the active
repo engineering policy in this checkout.

Implementation should update this document, `CHECKLIST.md`, and any affected
public docs as contracts become real code.

## Principles

- Keep site-instance choices in `site/` and platform contracts in `src/` or
  `scripts/`.
- Prefer typed values over repeated strings for source roots, feature routes,
  generated artifacts, and article render facts.
- Keep compatibility singleton exports while adding explicit context seams.
- Characterize current behavior before moving data behind a new boundary.
- Make invalid locations, disabled-feature links, duplicate routes, missing
  outputs, and article metadata drift fail with specific diagnostics.
- Do not change public URLs or reader-facing output as part of contract
  extraction unless a later milestone explicitly approves it.

## Contract 1: Source And Artifact Manifest

The source/artifact manifest names the repository locations the platform knows
how to read or write.

### Source Kinds

- `site-root`: active site instance root.
- `site-config`: editable JSON config for one site instance.
- `site-theme`: editable CSS theme contract for one site instance.
- `content-collection`: editable Markdown, MDX, or data collection roots.
- `processed-asset`: source assets that should pass through Astro's asset
  pipeline.
- `public-static`: files copied directly to the site root without image
  processing.
- `parked-legacy-asset`: intentionally unused or preserved source material.
- `generated-output`: build output owned by the platform.

### Required Ownership Rules

- Editable author/site-owner files live under the active site instance.
- Processed images and reusable visual assets live under `site/assets/`.
- Public files are only for root files that must be copied untouched.
- `dist` and alternate `SITE_OUTPUT_DIR` values are generated outputs.
- Parked assets are source-owned but excluded from normal asset optimization.
- Build verifiers and release reports should use the same manifest vocabulary
  instead of re-declaring ownership rules.

### First Implementation Target

Add a small `src/lib/source-artifacts.ts` module that builds a manifest from
`SiteInstancePaths`. It should be pure, testable, and usable by scripts without
Astro runtime assumptions. The first integration should replace duplicated
asset-root logic in `scripts/assets/verify-image-asset-locations.ts`.

Implemented in `src/lib/source-artifacts.ts`. The image asset location verifier
now reads the processed asset root from the manifest instead of duplicating the
site path policy.

## Contract 2: Platform Context

The platform context makes the active site explicit while preserving existing
default imports for Astro pages and scripts.

### Context Values

- `paths`: resolved `SiteInstancePaths`.
- `config`: parsed `SiteConfig`.
- `routes`: route helpers derived from `config`.

### Boundary Rules

- Platform helpers should accept explicit context inputs when used by tests,
  scripts, or future multi-site tooling.
- Default singleton exports can remain as compatibility shims for current Astro
  pages.
- New domain helpers should avoid reading process environment or filesystem
  state directly when the caller can provide context.

### First Implementation Target

Add a typed context helper that can compose paths and config in tests without
re-reading global state. Use it in new registry and manifest helpers first;
deeper singleton migration should be incremental.

Implemented in `src/lib/platform-context.ts`. The default `platformContext`
keeps current Astro pages and scripts stable, while `createPlatformContext()`
allows tests and future tools to inject paths and config explicitly.

## Contract 3: Route, Entity, And Feature Registry

The registry is the canonical place to describe public route surfaces and their
owning features.

### Registry Values

- site route key;
- entity kind, when a route indexes or renders a publishable entity;
- optional feature key, when disabling a feature should prune the route;
- configured route path;
- generated output kind: directory or file;
- generated output path relative to the build output root.

### Required Consumers

- URL helpers;
- optional route pruning;
- sitemap, feed, search, Pagefind, and HTML validation targets;
- generated-output verification;
- historical permalink and disabled-feature diagnostics.

### First Implementation Target

Promote the route metadata currently embedded in `feature-routes.ts` into a
registry module with tests. Keep existing public helper names where practical
so pages do not churn.

Implemented in `src/lib/route-registry.ts`. `feature-routes.ts` is now a
compatibility wrapper over the canonical registry.

## Contract 4: Article Compiler Artifact

The article compiler artifact should represent the single compiled fact set for
an article after content schema validation and Markdown/MDX processing inputs
are known.

### Artifact Facts

- stable article ID and canonical path;
- normalized title, description, date, category, author text, and visibility;
- resolved image/social image facts;
- table-of-contents facts;
- reference and bibliography facts;
- PDF/scholarly metadata eligibility;
- search/feed/sitemap eligibility;
- downstream related-content and support/endcap facts where they are derived
  from article identity.

### First Implementation Target

Start by characterizing the facts already produced by `articleViewModel()` and
`articlePageViewModel()`. Introduce a typed artifact only after tests prove the
current facts and optional-feature behavior are stable.

Implemented in `src/lib/article-compiler.ts` for stable article identity,
display metadata, visibility, PDF eligibility, reference data, and
table-of-contents facts. `article-view`, `article-page-view-model`, and
`article-pdf` now consume the artifact for those facts.

## Verification Policy

Each contract milestone should include focused unit tests first. Release-level
checks are required after integration milestones:

- source/artifact manifest: default and fixture site paths, asset location
  checks, platform-boundary check;
- platform context: default and injected context tests, fixture config tests;
- registry: configured route tests, optional feature tests, generated-output
  path tests;
- article artifact: article view-model characterization tests, reference/PDF
  fixture tests, downstream verifier tests.

Final verification should use `bun --silent run check` and, when build-output
logic changes, `bun --silent run build:release`, `bun --silent run verify`, and
`bun --silent run validate:html`.
