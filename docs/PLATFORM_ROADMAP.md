# Platform Vision And Roadmap

The long-term goal is to turn this repository into a static-first blogging
platform where The Philosopher's Meme is one configured site instance, not the
shape of the engine itself.

The platform serves site owners and authors. It should hide technical detail,
provide strong defaults, validate mistakes early, and expose a small set of
durable contracts that future tools and a future GUI can edit safely.

The TPM site serves readers. Its content, theme, navigation, support links,
social links, legacy redirects, and editorial choices belong in the site
instance. Those choices should not leak into reusable platform modules.

## Current State

The project is in the middle of the split:

- `src/` contains the Astro platform engine: layouts, components, schemas,
  routes, content helpers, build tooling, PDF generation, search integration,
  bibliography behavior, and verification scripts.
- `site/` contains the TPM instance: content, assets, public files, redirects,
  theme tokens, and validated site config.
- `site/config/site.json` owns identity, routes, navigation, homepage settings,
  share handles, support links, feature flags, and content defaults.
- `tests/fixtures/site-instance/` proves a non-TPM instance can build through
  the same platform path.

The split is useful but not complete. Optional route pruning, Pagefind globs,
HTML validation, and build verification now share the same feature model. Site
instances now provide `theme.css` for semantic color, typography, radius, and
shadow tokens, while platform CSS keeps the reusable token API and print
contract.

## End State

The end state is a reusable Astro/Tailwind platform with one or more site
instances:

```text
platform/
  src/
  scripts/
  tests/
  docs/

site/
  config/
  content/
  assets/
  public/
```

The platform provides:

- typed config and content schemas;
- article, announcement, collection, category, tag, author, bibliography, RSS,
  search, PDF, share, support, and navigation modules;
- reusable responsive components and blocks;
- build, verify, lint, image, PDF, search, payload, and release tooling;
- optional feature modules with clear enable/disable behavior;
- generated contracts for editors and future GUI tooling.

The site instance provides:

- content and editorial collections;
- site identity, routes, navigation, homepage configuration, and feature
  choices;
- theme and branding;
- support and social links;
- public files and static assets;
- legacy redirects or compatibility data when needed.

## Roadmap

### 1. Platform Contract Hardening

Make the config surface explicit and machine-readable before adding more
features.

- Add source-contract modules for source/artifact ownership, platform context,
  route/entity/feature registry metadata, and compiled article facts so future
  tools can consume the platform without duplicating path, route, and article
  policy.
- Generate JSON Schema for `site/config/site.json`.
- Add `site:doctor` for webmaster-friendly validation.
- Validate route/nav/feature/homepage/content-default relationships.
- Keep error messages actionable and non-technical.

The first version of this contract is intentionally conservative: it validates
the current platform surface and catches relationship mistakes, while leaving
route pruning and theme contracts to later milestones.

### 2. Public Documentation Example Site

Add a real example site instance that also hosts public platform documentation
and tutorials.

- Use the platform to document itself.
- Keep the example independent from TPM voice, content, branding, and support
  links.
- Run it in CI as a second platform consumer.
- Use it to catch TPM-specific assumptions earlier than the live site does.
- Optimize the first-run path so users can run the site, add an article,
  customize the homepage, change theme tokens, and validate the site quickly.

The example lives at `examples/docs-site/` and is documentation-oriented: it
exercises config, articles, announcements, authors, categories, collections,
pages, assets, search, feeds, and PDFs while teaching the same contracts.
`bun run docs-site:dev` serves it locally, and
`bun run test:docs-site` validates and builds it with
`SITE_INSTANCE_ROOT=examples/docs-site`.

### 3. Multi-Site Command Cleanup

Make command workflows explicitly site-instance aware.

- Avoid shared `dist` output collisions between site-instance builds.
- Make build, verify, Pagefind, HTML validation, and release previews read the
  same route/feature model.
- Keep TPM, fixture, and example site checks repeatable.

The platform now recognizes `SITE_OUTPUT_DIR` alongside `SITE_INSTANCE_ROOT`.
Raw builds, PDFs, optimization, verification, and HTML validation use that
output directory by default, and the fixture/docs site checks build into
isolated subdirectories under `dist/`.

### 4. Feature Modularity And Route Pruning

Disabled features should not leave incoherent surfaces behind.

- Hide UI for disabled modules.
- Prune disabled optional route output after Astro's static build, because
  Astro route files remain platform-owned while the site instance controls
  feature availability.
- Remove disabled routes from generated sitemap files and remove the Pagefind
  search index when search is disabled.
- Generate Pagefind globs, HTML validation targets, build verification
  requirements, and broken-link expectations from the same feature model.
- Keep article links to optional surfaces conditional so pruning does not create
  broken category, author, tag, announcement, collection, feed, or search links.

The pruning boundary is intentionally post-build for now. Route files still
live in `src/pages/` so the platform can provide one complete feature set, and
site instances can turn optional modules off without asking authors to edit
platform code.

### 5. Theme And Branding Extraction

Move TPM visual identity out of the platform engine.

- Split platform base CSS from site theme tokens.
- Load a required site-instance `theme.css` after platform base styles and
  before platform print styles.
- Move colors, typography, radii, shadows, and semantic tone into site-owned
  theme files while keeping component-facing token names stable.
- Keep logos, fallback imagery, and editorial assets under site-owned assets or
  content frontmatter.

The current file contract is documented in `docs/SITE_THEME_CONTRACT.md`.

### 6. Authoring Workflow Hardening

Make author-facing content management simple and repairable.

- Keep frontmatter small and defaults-driven.
- Improve docs and tooling for articles, announcements, collections, tags,
  citations, images, PDFs, social previews, visibility, and redirects.
- Prefer validation and focused repair scripts over hidden runtime behavior.

The current command contract is documented in `docs/AUTHORING_WORKFLOW.md`.

### 7. Platform Module Organization

Keep reusable code organized around durable domains.

- Content and publishable model.
- Routes and feature model.
- Navigation and homepage blocks.
- Search and feeds.
- PDF and scholarly metadata.
- Bibliography and citation tooling.
- Theme and branding.
- Site diagnostics.

The current module map and enforceable boundary rules live in
`docs/PLATFORM_MODULES.md`. New reusable modules should either fit that map or
expand it deliberately with tests.

### 8. Configurability And Customization

Make customization deliberate rather than incidental.

- Prefer validated site config for stable site-wide editorial choices.
- Prefer component props for local presentation choices.
- Keep layout mechanics and third-party endpoint builders platform-owned.
- Record deferred customization instead of adding speculative options.

The current candidate audit and low-risk extraction plan live in
`docs/PLATFORM_CONFIGURABILITY_AUDIT.md`.

### 9. Public Platform Cleanup

Remove remaining TPM assumptions from platform-owned review and documentation
surfaces.

- Keep live TPM instance tests where they intentionally verify the TPM site.
- Move platform QA fixtures, catalog assets, docs-site identity, and example
  copy away from TPM-specific branding.
- Prove private catalog builds work against a non-TPM site instance.

The current cleanup plan lives in `docs/PUBLIC_PLATFORM_CLEANUP.md`.

### 10. Public Documentation Site

The docs-site instance should be organized as focused public documentation, not
a fixture with a few sample pages.

- Keep pages task-oriented and short.
- Front-load commands and file paths.
- Teach by editing real site-instance files.
- Link from onboarding pages into deeper authoring, configuration, operations,
  and reference material.

The current documentation-site plan lives in
`docs/PUBLIC_DOCUMENTATION_SITE.md`.

### 11. Future GUI

The GUI is intentionally deferred. It should edit the same contracts that the
site instance already uses: JSON config, Markdown/MDX content, assets, and
validated collections. The work above prepares that GUI without committing to a
specific app architecture yet.

## Design Principles

- Prefer serializable config over platform constants.
- Prefer type-checked helpers over stringly coupled route and feature logic.
- Prefer clear site-owner defaults over repeated frontmatter.
- Prefer docs-site and fixture proof over assumptions about generality.
- Keep route pruning and theme extraction deliberate, because both have broad
  build and UX consequences.
