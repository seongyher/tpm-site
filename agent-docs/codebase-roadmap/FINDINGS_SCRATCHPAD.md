# Findings Scratchpad

This document captures raw audit observations before they are synthesized into
the final roadmap.

## Raw Observations

- The repository already has a real platform/site split. `site/` owns TPM
  content, config, theme, public files, redirects, and assets. `src/` owns the
  platform, and `tests/fixtures/site-instance` plus `examples/docs-site` prove
  the split can support more than one site instance.
- `src/lib/site-config.ts`, `src/content.config.ts`, and
  `src/lib/content-schemas.ts` give the platform a strong typed config/content
  boundary. The next maturity step is to make more platform code accept an
  explicit config/context instead of importing the singleton.
- Several reusable components still import `siteConfig` directly:
  `SiteHeader`, `SiteFooter`, `SiteHead`, and `SupportLink`. These are
  legitimate integration points today, but they are also the clearest place to
  tighten the reusable platform boundary.
- Route, feature, metadata, sitemap, feed, Pagefind, redirects, navigation,
  social previews, and generated-output expectations all have typed helpers,
  but their canonical state is distributed across several files:
  `site-config-defaults`, `site-config`, `feature-routes`, `routes`,
  `metadata`, `navigation`, `feed`, `seo`, and build scripts.
- `src/lib/article-page-view-model.ts` is a good route-level composition seam.
  It also shows how much article route state is now display-ready before it
  reaches visual components: references, TOC, support, PDF, share, social image,
  related entries, continuity, tags, and metadata.
- `src/lib/home.ts` is similarly strong. It produces a homepage view model from
  content collections and site config. This pattern should become the default
  for all complex routes.
- The article rendering pipeline carries derived data through Markdown/MDX,
  remark/rehype plugins, route view models, article components, PDF generation,
  bibliography pages, and build verification. The behavior works, but the
  contract is not yet expressed as one named "article compiler artifact".
- `scripts/build/verify-build.ts` is valuable but monolithic. It validates
  routes, links, redirects, metadata, images, scripts, PDFs, optional features,
  search surfaces, and output files. Its size is a sign that generated-output
  validation deserves its own internal package shape.
- `scripts/build/generate-article-pdfs.ts`,
  `scripts/build/generate-cloudflare-redirects.ts`, and
  `scripts/build/verify-build.ts` each read source files or frontmatter in
  their own way. A shared tool-side content reader would reduce drift.
- `src/lib/anchored-positioning.ts` is already a high-quality standalone
  interaction primitive: typed presets, pure placement logic, browser adapter,
  lazy loader, and tests. It is a strong candidate for internal package
  extraction.
- `src/lib/metadata.ts` and `src/lib/semantic-metadata.ts` are another mature
  subdomain. The platform can become unusually strong at machine readability if
  semantic profiles become an explicit product feature.
- `src/lib/article-references/**`, `src/lib/bibliography.ts`, and
  `src/lib/citations/article-citation.ts` now form a substantial references
  system. The citation audit history shows this domain needs careful canonical
  data workflows, not just rendering helpers.
- The component catalog and `docs/components/**` are significant. They turn
  components into a reviewed product surface, but the catalog lifecycle needs
  explicit ownership so it does not become stale documentation.
- The style system is healthy: Tailwind v4 tokens in `src/styles/global.css`,
  site overrides in `site/theme.css`, and print contracts in
  `src/styles/print.css`. The next step is validation and reusable layout
  recipes, not more one-off CSS.
- CI is thoughtfully staged. It already distinguishes blocking quality,
  generated-output verification, browser tests, catalog proof, security audit,
  a11y/Lighthouse review signals, and deploy. The next step is using build
  artifacts and measurements as long-lived trend data.
- The docs corpus is broad. It contains design docs, migration decisions,
  audits, author docs, platform docs, and generated component docs. The docs
  system needs a lifecycle and ownership map so docs remain an asset rather
  than a second source of truth.
- `examples/docs-site` is more than an example. It is the seed of a public
  platform docs site and a compatibility fixture for a non-TPM publication.
- `site/unused-assets` exists and is useful, but source asset lifecycle could
  become more explicit: source, optimized output, parked historical asset,
  generated social image, and public passthrough all have different contracts.
- The repo has many excellent tests for current behavior. The next testing
  leap is fixture breadth: minimal site, feature-disabled site, maximal/kitchen
  sink site, hostile content site, and generated-output golden manifests.
- A mature public platform needs explicit extension architecture. The first
  roadmap pass covered internal package boundaries, but not enough about how
  future content kinds, metadata profiles, route modules, generated-output
  verifiers, compiler transforms, media policies, and deployment adapters
  register themselves without reaching into global state.
- Future GUI/admin tooling should be treated as a product surface now, even if
  it is not implemented soon. Site config schemas, diagnostics, previews,
  draft/review/publish state, asset metadata, and PR submission workflows need
  to be designed so a non-technical editor can eventually consume them without
  a second model.
- Content portability deserves its own domain. Import/export, migration
  manifests, source maps from generated output to source files, and legacy
  archive adapters are central to the "durable editorial platform" goal.
- Deployment portability and release governance are broader than Cloudflare.
  Headers, redirects, cache policy, robots, feeds, sitemap, PDFs, and static
  assets should be expressible through host adapters backed by shared route and
  output contracts.
- Security, privacy, and trust are platform domains. CSP, third-party embeds,
  analytics, external origins, raw HTML, generated JSON-LD, downloaded assets,
  dependency posture, and secret-scanning expectations should be explicit
  contracts rather than incidental checks.
- Webmaster observability should become structured platform feedback.
  Lighthouse, Cloudflare, Search Console, Bing, link scanners, and a11y reports
  can all map back to routes, source files, and owning domains if the platform
  emits the right manifests.
- Localization and inclusive defaults are not current TPM needs, but a mature
  blogging platform should model language, direction, alternate routes, date
  formats, PDF/feed metadata, translated labels, and long-string layout stress
  before they become a rewrite.
- Productization also needs starter templates and distribution rules. A
  platform is not fully mature until new site instances can be scaffolded,
  examples are site-neutral, releases have compatibility expectations, and
  external users can understand the feature matrix.

## Repeated Patterns

- Singleton imports are convenient at top-level integration points, but they
  blur platform/library boundaries when used inside reusable components and
  pure helpers.
- Several domains have a core pure model plus impure adapters. The codebase is
  healthiest where this split is explicit: quality runner, social image
  optimizer adapter, support view models, article share view models, and
  anchored positioning.
- Route helpers, feature flags, and metadata are all trying to describe the
  same public surface. Drift becomes possible when each subsystem has its own
  partial registry.
- Build scripts often know platform invariants that application code also
  knows. These invariants should move into shared typed modules or generated
  manifests.
- Author-facing simplicity is usually achieved when a domain has:
  content schema defaults, a normalized view model, component primitives, build
  verification, and docs. Tags, homepage collections, support CTAs, PDFs, and
  references are examples.
- The most error-prone UI work tends to involve layout constraints, horizontal
  overflow, hover/touch/keyboard parity, media sizing, and responsive wrapping.
  These deserve reusable primitives and test fixtures, not repeated local
  Tailwind reasoning.
- Mature files that have grown large are not necessarily bad. They are signals
  that a subdomain may be ready for internal packaging, smaller modules,
  generated docs, and stronger public contracts.

## Roadmap Candidates

- Create a platform context/config adapter so reusable code receives identity,
  routes, features, support, share, and defaults explicitly.
- Define a canonical route/feature/entity registry that feeds static paths,
  redirects, sitemap, feed, metadata, Pagefind, navigation, validation, and
  docs.
- Promote the article render pipeline into a named compiler artifact contract
  containing headings, references, bibliography data, images, embeds,
  compatibility notes, and generated sections.
- Split generated-output verification into a package-like verifier domain with
  route, link, redirect, metadata, image, script, PDF, feed, and asset modules.
- Create a shared tool-side source reader for scripts so tools stop manually
  parsing frontmatter in different ways.
- Expand publishable entries into a fully general display model for articles,
  announcements, collection items, category entries, tag entries, author pages,
  related items, feed items, and future content types.
- Productize the site-instance toolkit: config schema generation, site doctor,
  author checks, content migration helpers, redirect validation, asset
  lifecycle tools, and docs-site generation.
- Extract interaction primitives such as anchored positioning/disclosure,
  popovers, previews, rails, and menu behavior into an internal package.
- Build a layout recipe layer for page frames, reading bodies, rails, section
  stacks, split headers, endcaps, horizontal rails, and responsive media frames.
- Turn semantic metadata into platform profiles: article, review, event, book,
  media, dataset, software, FAQ, author, organization, collection, and
  citation source.
- Create AI and agent readability surfaces: route/entity manifests,
  content-index JSON, structured citation export, and a documented `llms.txt`
  style policy when the contract is stable.
- Formalize the component catalog as a product: fixtures, hostile states,
  responsive snapshots, accessibility states, visual review, and generated
  component docs.
- Promote performance experiments into persistent budgets and scorecards:
  critical CSS, asset payload, JS hydration, cache headers, LCP image hints,
  bundle/payload trends, and page-type budgets.
- Define a docs lifecycle: source-of-truth docs, historical decision records,
  generated reference docs, deferred docs, and public docs-site docs.
- Create internal package boundaries before external extraction:
  `platform/config`, `platform/routes`, `platform/content`,
  `platform/rendering`, `platform/references`, `platform/metadata`,
  `platform/interactions`, `platform/generated-output`, `platform/testing`.
- Define a typed extension architecture for content kinds, route modules,
  semantic profiles, verifier modules, compiler transforms, interaction
  controllers, media policies, deployment adapters, diagnostics, and docs hooks.
- Design an editor/admin data model that consumes generated schemas,
  diagnostics, previews, state machines, and Git-backed submission workflows.
- Build content portability around canonical export/import formats, migration
  manifests, source maps, and adapters for legacy systems.
- Add deployment adapter and release-governance contracts so the platform can
  target multiple static hosts while producing changelogs, compatibility
  reports, cache/redirect/header verification, and upgrade guides.
- Treat security/privacy/trust as a verifiable domain with CSP, third-party
  origin, embed, analytics, dependency, and unsafe-boundary policies.
- Normalize webmaster and scanner exports into structured observability
  diagnostics that distinguish noise from actionable platform/content/hosting
  issues.
- Add localization and inclusive-default contracts for language, locale,
  direction, alternate routes, date formats, metadata, feeds, PDFs, and layout
  stress tests.
- Create starter templates and distribution infrastructure for minimal blog,
  editorial, scholarly, docs, and kitchen-sink site instances.

## Open Questions

- How far should the public platform docs site go before the repo is split into
  separate public/private repositories?
- Should site config eventually become a generated JSON schema plus GUI form
  schema, or should those remain separate products?
- Which semantic metadata profiles should be first-class in author docs versus
  advanced platform extensions?
- What is the desired public API shape for future extractable modules:
  internal workspace packages, Astro integrations, standalone npm packages, or
  a mix?
- Which generated-output manifests are most useful to external tools and AI
  agents without creating privacy or maintenance problems?
- What performance budgets should be global, and which should be page-type
  specific?
- What plugin/extension API should exist before the platform has external
  consumers, and what should remain internal until proven by real use?
- Which deployment adapters are mandatory for a mature first public release,
  and which can be documented as future host integrations?
- Which editor/admin workflows are core to the platform contract versus a
  separate application built on top of the platform contracts?
- How much localization support should be built into the core before the first
  multilingual site instance exists?
