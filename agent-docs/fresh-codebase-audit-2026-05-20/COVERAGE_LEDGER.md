# Coverage Ledger

This ledger tracks the fresh audit coverage. It distinguishes tracked source
from ignored generated/local artifacts.

## Audit Standard

- Reread `agent-docs/ENGINEERING_PHILOSOPHY.md`.
- Apply the philosophy as the standard for platform/site separation,
  typed-domain architecture, static output, author UX, reader UX,
  generated-output safety, accessibility, performance, docs, and testing.

## Initial Inventory

- Tracked files: 1,349 total.
- Tracked files excluding the previous roadmap directory:
  1,344 files.
- Ignored local/generated artifacts are present and intentionally inventoried
  only as artifact hygiene:
  `.astro/`, `.lighthouseci/`, `coverage/`, `dist/`, `dist-catalog/`,
  `node_modules/`, `test-results/`, and `tmp/`.

## Coverage Method

- Text-source files are reviewed by domain and with targeted file reads.
- Repeated component/test/doc families are reviewed structurally, with examples
  from each family and inventory checks for the full family.
- Binary image assets are covered by inventory, directory placement, and
  pipeline checks rather than content inspection.
- Generated or ignored output is covered as build-artifact hygiene and pipeline
  evidence, not as source architecture.

## Domain Coverage

- [x] Engineering philosophy reread.
- [x] Root configuration and repository policy.
- [x] Astro configuration, content collections, routes, and layouts.
- [x] Site instance configuration, content, assets, public files, and theme.
- [x] Platform libraries in `src/lib`.
- [x] Components, blocks, primitives, layouts, navigation, article, media,
      author, bibliography, page, and SEO components.
- [x] Browser scripts and Markdown/rehype/remark transforms.
- [x] Styles and theme contract.
- [x] Build, content, asset, quality, testing, site, and payload scripts.
- [x] Tests, fixtures, coverage/accountability policy, and e2e/a11y/perf
      strategy.
- [x] Documentation and author/developer onboarding.
- [x] Example docs site and fixture site instance.
- [x] Ignored generated/local artifacts.
- [x] Fresh roadmap iteration pass 1.
- [x] Fresh roadmap iteration pass 2.
- [x] Fresh roadmap final critique.
- [x] Prior roadmap comparison.
- [x] Platform roadmap iteration pass 1.
- [x] Platform roadmap iteration pass 2.
- [x] Platform roadmap final critique.

## Coverage Notes

### Root And Tooling

- Read `package.json`, Astro, TypeScript, ESLint, Knip, Playwright,
  Lighthouse, Wrangler, GitHub workflow, and security workflow configuration.
- Reviewed script surface by category: author checks, build/release, catalog,
  docs-site, payload experiments, markdown/assets review, platform checks,
  release checks, a11y, e2e, performance, and coverage.
- Reviewed custom ESLint rule groups for component purity, typed strictness,
  Tailwind constraints, documentation, security, MDX, data, tests, and project
  path restrictions.

### Astro, Content, Routes, And Layouts

- Read `astro.config.ts`, `src/content.config.ts`, all `src/pages/` routes,
  `src/layouts/BaseLayout.astro`, and `src/layouts/ArticleLayout.astro`.
- Reviewed key route helpers: `routes`, `static-paths`, `feature-routes`,
  `metadata`, `seo`, `social-images`, `feed`, and `site-redirects`.
- Checked that route files mostly compose content loaders, view models,
  layouts, and blocks rather than implementing heavy business logic directly.

### Site Instance

- Read `site/config/site.json`, generated `site.schema.json`, redirects,
  `site/theme.css`, public files, content inventory, and asset inventory.
- Confirmed the site instance contains articles, announcements, authors,
  categories, collections, pages, assets, public compatibility files, and theme
  overrides.
- Confirmed `examples/docs-site/` is a second site instance used as both public
  documentation and a platform consumer.

### Platform Libraries

- Read the complete `src/lib` inventory and representative or central modules
  from every current domain: content model, route/features, article rendering,
  PDF/scholar output, references/bibliography, interaction primitives, and
  utilities.
- Paid special attention to site-instance coupling, global singleton config
  use, typed view models, registries, policy helpers, and pure/impure seams.

### Components And UI

- Inventoried every component under `src/components`.
- Read representative components from all families: article, author,
  bibliography, blocks, layout, media, navigation, pages, SEO, and UI.
- Reviewed the private component catalog configuration and catalog
  completeness verifier.
- Reviewed component one-pager docs and component inventory structure.

### Browser Scripts And Markdown Transforms

- Read `src/scripts` inventory and representative interactive scripts for
  anchored positioning, reference previews, article sharing, image inspection,
  article table of contents, horizontal rails, carousel, search, header offset,
  and theme behavior.
- Read article-image rehype/remark transform and article-reference remark
  transforms.

### Scripts And Verification

- Inventoried `scripts/`.
- Read representative high-leverage scripts: build verifier, content verifier,
  platform boundary checker, component catalog checker, site doctor, quality
  runner, test accountability, and coverage verifier.
- Reviewed asset, content, PDF, payload, and Cloudflare redirect script
  coverage through file inventory and test layout.

### Tests And Fixtures

- Inventoried tests across config, ESLint rule tests, unit tests, scripts,
  pages, layouts, e2e, accessibility, fixtures, and type tests.
- Reviewed accountability and coverage policy files.
- Confirmed a mirrored test/accountability culture exists for nearly every
  source file, with explicit exceptions for content, assets, docs, CSS, and
  generated/supporting material.

### Documentation

- Read root `README.md`, `site/README.md`, public docs-site plan,
  `docs/PLATFORM_MODULES.md`, component docs README/inventory, and
  representative docs by topic.
- Inventoried documentation across authoring, articles, citations, PDFs,
  sharing, platformization, component architecture, performance, metadata,
  Cloudflare, site anatomy, tags, and deferred work.

### Ignored Artifacts

- Inventoried ignored local/generated directories:
  `.astro/`, `.lighthouseci/`, `coverage/`, `dist/`, `dist-catalog/`,
  `node_modules/`, `test-results/`, and `tmp/`.
- Treated ignored artifacts as build evidence or scratch hygiene rather than
  source architecture.
