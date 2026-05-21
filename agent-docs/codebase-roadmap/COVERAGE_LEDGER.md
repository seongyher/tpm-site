# Coverage Ledger

This ledger tracks codebase audit coverage. It exists to prove that the final
roadmap considered the whole repo rather than only familiar hot spots.

Status values:

- `Pending`: not inspected yet.
- `Inventory`: structure and files identified.
- `Audited`: reviewed against the engineering philosophy.
- `Synthesized`: findings represented in the final roadmap.

## Coverage Matrix

| Area                                                       | Status      | Evidence                                                                                                                      | Notes                                                                                                                                                                  |
| ---------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repo configuration and package scripts                     | Synthesized | `package.json`, `PACKAGE_SCRIPTS.md`, `.github/workflows/*.yml`                                                               | Strong Bun-first script surface. Roadmap focuses on command taxonomy, artifact lifecycle, and CI signal routing.                                                       |
| Astro, Vite, Tailwind, TypeScript, lint, formatting config | Synthesized | `astro.config.ts`, `tsconfig*.json`, `eslint.config.ts`, `prettier.config.mjs`, `lighthouserc.json`, `components.json`        | Config is strict and modern. Roadmap focuses on centralizing generated contracts and making config outputs measurable.                                                 |
| Cloudflare/deployment/static asset config                  | Synthesized | `wrangler.toml`, `.github/workflows/ci.yml`, `site/public/_headers`, `site/public/.well-known/traffic-advice`                 | Worker static assets are configured. Roadmap adds deployment invariants and cache contract verification as first-class checks.                                         |
| Site instance config and theme                             | Synthesized | `site/config/site.json`, `site/config/redirects.json`, `site/theme.css`, `src/lib/site-config.ts`, `src/lib/site-instance.ts` | The site instance model is strong. Roadmap hardens schema generation, context injection, and GUI-ready config contracts.                                               |
| Site content collections                                   | Synthesized | `site/content/**`, `src/content.config.ts`, `src/lib/content-schemas.ts`, `src/lib/content.ts`                                | Content collections are already native Astro. Roadmap improves compiler artifacts, source metadata, and author diagnostics.                                            |
| Site assets, public files, and unused assets               | Synthesized | `site/assets/**`, `site/public/**`, `site/unused-assets/**`, asset scripts                                                    | Asset placement is explicit. Roadmap adds stronger asset manifests, source/derived lifecycle rules, and optimized-image contracts.                                     |
| Routes and endpoints                                       | Synthesized | `src/pages/**/*.astro`, `src/pages/feed.xml.ts`, `src/lib/routes.ts`, `src/lib/feature-routes.ts`, `src/lib/static-paths.ts`  | Route helpers exist, but route/feature/metadata ownership is spread. Roadmap creates a canonical route and feature registry.                                           |
| Layouts                                                    | Synthesized | `src/layouts/BaseLayout.astro`, `src/layouts/ArticleLayout.astro`, `src/components/layout/**`                                 | Layouts mostly orchestrate correctly. Roadmap extracts page recipes and removes remaining singleton config from reusable shells.                                       |
| Components by domain                                       | Synthesized | `src/components/{articles,authors,bibliography,blocks,layout,media,navigation,seo,ui}`                                        | Component count is healthy after refactors. Roadmap continues toward portable primitives, recipes, and consistent content surfaces.                                    |
| UI primitives                                              | Synthesized | `src/components/ui/**`, `src/lib/anchored-positioning.ts`, `src/scripts/anchored-positioning-loader.ts`                       | Several primitives are mature. Roadmap identifies extractable interaction and brand/action primitives.                                                                 |
| Platform libraries in `src/lib`                            | Synthesized | 46 files, about 10k lines in `src/lib/**`                                                                                     | Library domains are useful but unevenly sized. Roadmap formalizes subdomain packages and pure/context boundaries.                                                      |
| Markdown, MDX, remark/rehype, and content pipeline         | Synthesized | `src/remark-plugins/**`, `src/rehype-plugins/**`, `src/lib/article-references/**`, `src/lib/article-page-view-model.ts`       | The compiler pipeline works. Roadmap turns plugin side-channel data into a typed article compiler artifact.                                                            |
| Styles, tokens, prose, print, and theme layers             | Synthesized | `src/styles/global.css`, `src/styles/print.css`, `site/theme.css`, `docs/SITE_THEME_CONTRACT.md`                              | Token model is clear. Roadmap adds theme validation, recipe tokens, and print/prose contracts as reusable platform surfaces.                                           |
| Client interactions and islands                            | Synthesized | `src/scripts/*.ts`, component scripts, Playwright interaction tests                                                           | Hydration boundaries are small. Roadmap packages interaction controllers and expands lazy/opportunistic loading contracts.                                             |
| Scripts and generated-output tooling                       | Synthesized | 40 scripts, especially `scripts/build/**`, `scripts/content/**`, `scripts/quality/**`, `scripts/site/**`                      | Powerful tooling exists, but several scripts parse content independently. Roadmap creates shared source readers and diagnostic contracts.                              |
| Tests and fixtures                                         | Synthesized | `tests/src/**`, `tests/e2e/**`, `tests/a11y/**`, `tests/scripts/**`, `tests/fixtures/**`, `examples/docs-site/**`             | Test coverage is broad. Roadmap adds fixture site matrix, golden manifests, property tests, and regression dashboards.                                                 |
| Documentation and author workflow                          | Synthesized | `README.md`, `site/README.md`, `AUTHOR_TUTORIAL.md`, `docs/**`, `agent-docs/**`, `examples/docs-site/**`                      | Documentation is extensive. Roadmap adds docs ownership, lifecycle, generated references, and productized docs-site workflow.                                          |
| Generated-output contracts                                 | Synthesized | `scripts/build/verify-build.ts`, `validate-html.ts`, `lighthouserc.json`, `tests/scripts/build/**`                            | Build verification is comprehensive but monolithic. Roadmap splits verifiers by contract and publishes machine-readable manifests.                                     |
| Performance, payload, and caching surfaces                 | Synthesized | `docs/performance/**`, `scripts/payload/**`, `site/public/_headers`, Lighthouse config                                        | Good experimental base. Roadmap promotes winning experiments into measurable gates and persistent budgets.                                                             |
| Accessibility, semantic HTML, and machine readability      | Synthesized | `agent-docs/METADATA_SEMANTICS_ACCESSIBILITY_AUDIT.md`, `src/lib/metadata.ts`, `src/lib/semantic-metadata.ts`, a11y tests     | Metadata and semantics are strong. Roadmap creates extensible semantic profiles and AI-readable content manifests.                                                     |
| Future extractability/package candidates                   | Synthesized | `docs/PLATFORM_MODULES.md`, platform boundary checker, mature lib domains                                                     | Multiple candidates are ready for internal package boundaries before external publication.                                                                             |
| Mature product/platform gap pass                           | Synthesized | `agent-docs/ENGINEERING_PHILOSOPHY.md`, roadmap gap reread                                                                    | Added first-class roadmap domains for extensions, authoring studio, import/export, deployment governance, security/privacy, observability, localization, and starters. |

## Inventory Notes

- Source code is concentrated in `src/components`, `src/lib`, `src/pages`,
  `src/layouts`, `src/styles`, `scripts`, `site`, and `tests`.
- Generated/local artifacts such as `dist`, `dist-catalog`, `.astro`,
  `.wrangler`, `.lighthouseci`, `coverage`, `test-results`, and `tmp` should be
  treated as output or scratch state, not source architecture.
- `src/components` contains 145 files: articles 41, UI 26, blocks 24,
  navigation 16, layout 12, authors 8, media 5, SEO 5, bibliography 5, and
  pages 3.
- `src/lib` contains 46 files. The largest domains are article references,
  anchored positioning, metadata, semantic metadata, routes, article citation,
  home, site config, bibliography, and article page view models.
- `scripts` contains 40 files. Build verification, PDF generation, content
  verification, asset audits, payload experiments, site diagnostics, and quality
  orchestration are all substantial enough to deserve explicit domain
  ownership.
- `tests` contains broad unit, component, script, e2e, accessibility, catalog,
  and fixture coverage. This is a platform asset, not just a regression suite.
- `examples/docs-site` and `tests/fixtures/site-instance` are important
  evidence that the site-instance/platform split is already real. They should
  become stronger productization fixtures over time.
