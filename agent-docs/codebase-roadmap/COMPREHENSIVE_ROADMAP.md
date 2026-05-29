# Comprehensive Codebase Roadmap

This document synthesizes the comprehensive roadmap audit. It is intentionally
ambitious, actionable, and traceable to `COVERAGE_LEDGER.md`,
`FINDINGS_SCRATCHPAD.md`, `DOMAIN_MAP.md`, and
`agent-docs/core/ENGINEERING_PHILOSOPHY.md`.

## Executive Summary

The repo is no longer a simple Astro site. It is an emerging static publishing
platform with one mature site instance, an example docs site, a fixture site,
strict tooling, generated-output verification, a component catalog, and several
domain systems that are already large enough to become reusable modules.

The strongest parts of the codebase are the site-instance split, Astro content
collections, strict TypeScript and linting, broad tests, article references,
metadata, support for scholarly PDFs, generated-output checks, and the recent
component architecture work. The primary architectural risk is not missing
features. It is that several successful domains still share state through
implicit singletons, repeated frontmatter parsing, distributed route metadata,
and large files that have outgrown their original boundaries.

The long-term goal should be to make the repo feel like a domain-specific
language for static editorial publishing. Site owners and authors express their
intent through content and configuration. Developers express platform behavior
through typed domain primitives. The platform compiles those expressions into
static HTML, assets, feeds, metadata, PDFs, redirects, search, and validation
outputs. Invalid states should fail early, and valid states should be simple to
express.

This roadmap is intentionally ambitious. It maps the work needed to move from a
strong single-site Astro project to a production-ready platform with reusable
subsystems, clear module boundaries, strong machine readability, excellent
performance, author-friendly tooling, portable deployment targets, explicit
extension points, and a future editor/admin surface.

## Cross-Cutting Acceptance Criteria

Every milestone should preserve or improve the following product qualities.

- Author simplicity: authors should write content and minimal frontmatter
  without learning platform internals.
- Site-owner configurability: site identity, routes, features, homepage
  content, support links, social links, redirects, theme, and defaults should
  be controlled through site-owned files where practical.
- Visitor experience: generated sites should be fast, readable, navigable,
  accessible, elegant, and stable across viewport sizes and input methods.
- Machine readability: HTML, metadata, JSON-LD, feeds, sitemaps, PDFs,
  manifests, and citations should be truthful, structured, and validated.
- Static-first output: runtime JavaScript should remain deliberate, small,
  lazy where possible, and isolated to interaction boundaries.
- Type-driven correctness: invalid state should fail at schema, type, helper,
  build, or verifier boundaries before it becomes a visual or production bug.
- Measurability: each domain should define the fast local checks and rigorous
  release checks that prove the change works.
- Extractability: mature subdomains should expose narrow public interfaces so
  they can later become internal packages, Astro integrations, or reusable
  tools without rewriting the repo.

Riskier milestones should add tests and fixtures before broad refactors. A
layout, routing, metadata, or compiler change is ready only when its intended
behavior is captured in unit tests, fixture builds, generated-output
verification, and at least one browser or accessibility check where relevant.

## Execution Protocol

This roadmap is a planning handoff, not an instruction to immediately start
implementation. Each lettered milestone should go through a design packet before
code changes begin. The design packet is the point where developers decide the
exact first patch series, tests, fixtures, and migration order.

Every design packet should answer:

- What user or developer problem is being solved?
- Which domain boundary is being strengthened?
- What is the intended public contract after the milestone?
- Which current files are integration shells, source-of-truth modules, views,
  adapters, scripts, tests, and docs?
- What existing behavior must remain visually or semantically stable?
- What visible changes are acceptable for consistency, accessibility,
  performance, or platform productionization?
- Which invalid states should become impossible to represent?
- Which checks should exist before broad implementation starts?
- Which fast local checks and release checks prove the milestone is complete?
- Which docs must change, and which docs should stay untouched?

Implementation should start only after the design packet has enough detail for a
developer to make deliberate changes without rediscovering the whole domain.
High-risk milestones should add or update tests before changing behavior.

### Design Packet Template

Use this template when moving a roadmap milestone into active work:

```md
## Milestone <letter>: <name>

### Intent

<The product/platform outcome and why it matters.>

### Users And Surfaces

- Authors/site owners:
- Readers:
- Developers:
- Machines/tools:

### Current Evidence

- Source files:
- Tests:
- Docs:
- Generated outputs:
- Known bugs or pain points:

### Target Contract

- Public types/config:
- Route/content/output contract:
- Component/view contract:
- Script/CLI contract:
- Diagnostics/errors:

### Migration Plan

1. <Smallest safe step.>
2. <Next step.>
3. <Completion step.>

### Verification Plan

- Fast checks:
- Unit/script tests:
- Component/catalog tests:
- Browser/a11y/performance checks:
- Fixture builds:
- Release checks:

### Risk Controls

- Layout/performance/SEO/a11y risks:
- Backwards-compatibility risks:
- Authoring risks:
- Rollback or staged migration notes:

### Documentation Plan

- Author docs:
- Developer docs:
- Generated references:
- Historical/audit docs:
```

The template is deliberately explicit. It should prevent the roadmap from
turning into vague refactor momentum while still allowing ambitious changes.

## Roadmap

### A. Source And Artifact Lifecycle

Goal: make every file's role obvious: source, generated output, scratch data,
fixture, example, parked historical asset, or durable documentation.

Work:

- Create a source/artifact policy that covers `dist`, `dist-catalog`,
  `.astro`, `.wrangler`, `.lighthouseci`, `coverage`, `test-results`, `tmp`,
  `site/assets`, `site/public`, and `site/unused-assets`.
- Add a generated-output manifest for release builds that records routes,
  assets, PDFs, redirects, social images, cache headers, feeds, sitemap files,
  and optional feature outputs.
- Teach build verification to compare the manifest against expected source
  contracts.
- Add docs for when an author should place a file in `site/assets`,
  `site/public`, or `site/unused-assets`.

Verification:

- Script tests for manifest creation and artifact classification.
- Build verifier asserts all generated artifacts have an owning source or
  explicit passthrough reason.
- Docs checks cover asset placement examples.

### B. Platform Context And Config Adapter

Goal: make platform modules explicit about the site context they consume.

Work:

- Introduce a `PlatformContext` or smaller domain-specific contexts for site
  identity, feature flags, route config, content defaults, support, share,
  theme, and output paths.
- Keep singleton `siteConfig` and `siteInstance` at bootstrap boundaries:
  Astro config, content config, route files, top-level layouts, and scripts.
- Refactor reusable components and pure helpers to receive context or
  display-ready view models instead of importing `siteConfig`.
- Start with `SiteHeader`, `SiteFooter`, `SiteHead`, `SupportLink`,
  `navigation`, `feed`, `archive`, and `share-targets`.
- Update platform boundary checks so new core components cannot import
  publication-specific singletons unless allowlisted as integration shells.

Verification:

- Unit tests for context normalization and defaults.
- Platform boundary check enforces singleton import policy.
- Fixture site and docs-site builds prove non-TPM configuration still works.

### C. Canonical Route, Feature, And Entity Registry

Goal: declare public surfaces once and derive routes, metadata, sitemap, feed,
Pagefind, redirects, docs, and generated-output expectations from the same
registry.

Work:

- Replace scattered route/feature knowledge with a typed registry containing:
  route key, path template, output kind, feature flag, sitemap behavior,
  feed/search behavior, robots policy, navigation label, metadata defaults,
  static path provider, and generated-output contract.
- Model entity routes separately from singleton routes:
  article, announcement, author, category, collection, tag, page, feed,
  bibliography, search, archive, home, 404.
- Generate or validate route helper functions from this registry.
- Make manual redirects and legacy redirects validate against current route
  keys and entity IDs.
- Emit a machine-readable route manifest for tools, docs, and future GUI use.

Verification:

- Golden tests for the route registry and manifest.
- Redirect tests reject duplicates, invalid targets, and feature-disabled
  targets.
- Sitemap/feed/Pagefind/build verifier tests derive expectations from the same
  registry.

### D. Article Compiler Artifact Contract

Goal: turn the Markdown/MDX render pipeline into a named typed artifact instead
of a collection of plugin side effects.

Work:

- Define an `ArticleCompilerArtifact` containing rendered body, headings,
  stable heading IDs, article images, embeds, notes, citations, bibliography
  entries, footnotes, PDF compatibility facts, search metadata, and generated
  section metadata.
- Have remark/rehype plugins write into the artifact through a typed adapter.
- Feed the artifact to article pages, TOC components, references, bibliography,
  PDF generation, search indexing, and build verification.
- Encode generated sections such as `Contents`, `Notes`, and `Bibliography`
  explicitly so TOC, PDF, and page anchors cannot drift.
- Add fixtures for Markdown, MDX, citations-only, notes-only, mixed
  references, embeds, images, and unsupported MDX components.

Verification:

- Unit tests for artifact construction.
- Golden artifact snapshots for representative articles.
- E2E anchor tests for TOC/reference navigation.
- PDF tests assert artifact-backed fallback decisions.

### E. Publishable Entry And Media Model v2

Goal: make every list, feed, collection, search result, related block, and
homepage panel consume the same expressive publishable model.

Work:

- Expand `PublishableEntry` into a layered model:
  source identity, publication metadata, visibility, URLs, taxonomy, authors,
  media, summary, semantic profiles, and list-display hints.
- Support articles and announcements today while leaving room for future
  content types such as pages, reviews, events, books, videos, podcasts, or
  collection pages.
- Promote image/media decisions into a shared `PublishableMedia` contract with
  source image, social image, list thumbnail, alt text, fallback, aspect policy,
  and PDF/search compatibility.
- Refactor list components to consume the same model where practical:
  archive, category, tag, author, collection, related, next article, homepage
  flat lists, recent, and feeds.
- Make visibility surfaces explicit and extendable:
  homepage, directory, feed, search, sitemap, related, PDF, and future API.

Verification:

- Unit tests for visibility matrix and media fallback policy.
- Component tests for shared list entries across source kinds.
- Fixture site with feature-disabled and mixed-content surfaces.

### F. Route-Level View Model Layer

Goal: keep route files as orchestration and make all complex pages build
display-ready view models.

Work:

- Standardize the pattern used by `article-page-view-model.ts` and `home.ts`
  for all complex routes.
- Add view models for articles index, archive, category detail, tag detail,
  author detail, collection index/detail, bibliography, announcements, search,
  about/pages, and 404 where useful.
- Keep components declarative by passing display-ready props and variant
  tokens.
- Move repeated route-local sorting, feature gating, metadata, and empty-state
  behavior into view model helpers.

Verification:

- Unit tests for each view model with fixture content.
- Component tests use view-model fixtures rather than ad hoc local data.
- Route tests verify pages remain thin and output stays stable.

### G. Generated-Output Verifier Package

Goal: turn build verification into a modular static-site contract engine.

Work:

- Split `scripts/build/verify-build.ts` into verifier modules:
  routes, links, redirects, sitemap, feed, metadata, social images, cache
  headers, PDFs, search, scripts, CSS, assets, image alt, optional features,
  and HTML shape.
- Define a shared diagnostic type with severity, source, route, file,
  remediation, and machine-readable code.
- Make verifiers consume the route registry, content compiler artifact, asset
  manifest, and site config context.
- Provide human CLI output and JSON output for CI, docs, and future GUI use.
- Keep the current strict release gate while making individual verifier
  modules easy to test and reuse.

Verification:

- Script unit tests per verifier module.
- Golden diagnostic tests.
- Release build verifier compares JSON output against expected zero-error
  state.

### H. Site Instance Toolkit And Author Diagnostics

Goal: make author/site-owner workflows fast, friendly, and backed by the same
strict contracts as release builds.

Work:

- Expand `site-doctor` into a site-instance toolkit:
  config validation, route preview, feature summary, content summary,
  redirect validation, asset placement advice, visibility matrix, author
  profile checks, collection resolution, PDF eligibility, and metadata preview.
- Generate `site/config/site.schema.json` from the platform schema for editors
  and future GUI forms.
- Create fast author commands for common tasks:
  check one article, preview one article, list missing metadata, list broken
  local assets, validate collection items, and inspect generated URLs.
- Add structured output so a GUI can consume diagnostics directly.

Verification:

- Unit tests with fixture site instances.
- Snapshot tests for user-facing diagnostics.
- Docs examples for non-technical authors.

### I. PDF And Scholarly Output Domain

Goal: make PDF and Scholar output a robust scholarly publishing subsystem.

Work:

- Move PDF view models, compatibility policies, print selectors, image
  policies, and generation adapters into a cohesive scholarly-output domain.
- Make PDF generation consume the article compiler artifact rather than
  ad hoc page inspection where possible.
- Add PDF size budgets, image downscaling policy, unsupported media
  disclosure, and per-article eligibility diagnostics.
- Expand PDF metadata validation: document title, authors, subject,
  keywords, language, creation metadata, and canonical URL.
- Create fixtures for plain Markdown, image-heavy articles, MDX hover links,
  embeds, references, notes, and PDF-disabled articles.

Verification:

- PDF script tests for eligibility and fallbacks.
- Generated PDF smoke tests for text presence, metadata, file size, and link
  availability.
- Scholar metadata tests on article HTML and PDF URL placement.

### J. References, Citations, And Bibliography Productization

Goal: make references a dependable authoring and machine-readable subsystem.

Work:

- Normalize citations into a canonical source model with BibTeX import/export,
  display citation, sitewide source identity, DOI/URL/archive metadata, and
  citation locator support.
- Separate author syntax parsing from canonical source storage so future tools
  can help authors correct citations without touching prose.
- Add duplicate-source detection with explainable similarity signals.
- Add structured exports for site bibliography, article bibliography, RIS,
  BibTeX, CSL JSON, and future agent-readable citation manifests.
- Keep hover previews, backlinks, article bibliography sections, and sitewide
  bibliography as views over the same canonical model.

Verification:

- Parser and normalizer tests for valid and malformed citations.
- Corpus audit tests for every article reference marker.
- Golden bibliography aggregation tests.
- Optional DOI helper tests where external lookup data is cached as fixtures.

### K. Metadata, Semantics, And AI Readability

Goal: make machine readability a platform feature, not page-specific markup.

Work:

- Turn semantic metadata into profile modules:
  article, announcement, author, organization, collection, category, tag,
  review, event, book, media, dataset, software, FAQ, citation source, PDF,
  and feed item.
- Allow frontmatter to opt into advanced profiles while defaulting common
  metadata automatically.
- Emit route and entity manifests for tools and agents:
  canonical URL, title, description, type, dates, authors, tags, categories,
  images, PDF, references, language, visibility, robots, and relations.
- Add support for future `llms.txt` or content-index surfaces once the manifest
  contract is stable.
- Validate metadata against platform rules and representative search/social
  expectations.

Verification:

- Unit tests for every semantic profile.
- JSON-LD schema snapshots for route types.
- HTML validation and a11y tests confirm metadata does not harm document
  semantics.
- Generated manifest tests for fixture sites.

### L. Interaction Primitives Package

Goal: make interactive behavior small, lazy, consistent, and reusable.

Work:

- Create an interaction domain for anchored positioning, disclosure,
  popovers, citation/share/cite menus, reference previews, image inspector,
  horizontal rails, carousel controls, search reveal, mobile nav, theme, and
  header offset.
- Keep pure state machines separate from DOM adapters.
- Provide consistent keyboard, pointer, touch, reduced-motion, escape/outside
  click, focus restoration, and lazy-loading behavior.
- Define an idle/intent loading policy for optional controllers.
- Add a small test harness for interaction state machines independent of
  browser rendering.

Verification:

- Unit tests for state machines and placement algorithms.
- Playwright tests for keyboard/touch/pointer flows.
- Lighthouse and payload checks verify lazy controllers do not regress LCP or
  unused JavaScript.

### M. Layout, Responsive, And Visual Recipe System

Goal: solve recurring layout problems once and make future components hard to
break.

Work:

- Promote common layout patterns into named recipes:
  reading body, browsing body, article header action row, section header with
  action, endcap stack, media frame, split panel, horizontal rail, compact list,
  flat teaser, metadata line, prose section, and CTA row.
- Give each recipe documented constraints, responsive behavior, overflow
  behavior, focus behavior, empty states, and hostile-content fixtures.
- Add container-query variants where components should respond to parent width
  rather than viewport width.
- Standardize visible design differences intentionally: headings with action
  links, card vs flat list, compact metadata, social/brand buttons, support
  blocks, and rail controls.
- Move repeated tricky Tailwind class groups behind components or typed
  variants when repetition increases bug risk.

Verification:

- Component catalog stories for each recipe across breakpoints.
- Playwright layout invariant tests for overflow, wrapping, and alignment.
- Visual screenshots for hostile content where useful.

### N. Component Catalog And Design System Productization

Goal: make the component catalog a reliable design and platform review tool.

Work:

- Define catalog fixture tiers:
  neutral happy path, long text, missing media, many items, feature-disabled,
  dark mode, high contrast, keyboard focus, narrow container, and hostile data.
- Generate component docs from metadata where possible, and keep manual docs
  focused on intent, accessibility, and usage.
- Add catalog routes for platform domains, not only component folders.
- Use the catalog as a gate for new reusable components and layout recipes.
- Make catalog examples site-neutral so they can ship with the public platform.

Verification:

- Catalog integrity tests for all registered components.
- Component docs verification.
- E2E catalog invariant tests for layout and accessibility.

### O. Performance, Payload, And Cache Workbench

Goal: make performance experimentation repeatable and promote successful
experiments into durable gates.

Work:

- Turn payload experiment scripts into a workbench with inputs, outputs,
  comparison reports, and promotion criteria.
- Track page-type budgets for HTML bytes, CSS bytes, JS bytes, image bytes,
  total requests, LCP, CLS, accessibility, SEO, and cacheability.
- Add route-type representative pages: home, article, image-heavy article,
  citation-heavy article, archive, category, search, PDF-enabled article.
- Measure cache header behavior for hashed assets, PDFs, feeds, HTML, and
  public files.
- Keep critical CSS, preload/fetch priority, asset optimization, and JS lazy
  loading decisions evidence-based.

Verification:

- Lighthouse CI budgets plus generated performance reports.
- Payload diff tests for representative pages.
- Cache header verifier in generated-output checks.

### P. Test Matrix And Correctness Strategy

Goal: make high-velocity development safe through better fixtures and stronger
invariants.

Work:

- Add fixture site matrix:
  minimal site, TPM-like site, docs site, feature-disabled site, kitchen-sink
  site, hostile content site, and bad-config site.
- Add property tests for pure helpers where input space is large:
  routes, visibility, slugs, tags, citation keys, anchored placement, share
  URLs, metadata profiles.
- Add golden manifest tests for routes, metadata, generated output, article
  compiler artifacts, and site config schema.
- Make tests assert intentions and invariants, not incidental class strings,
  except where a class is itself part of a component contract.
- Continue treating bugs as abstraction feedback: when a bug appears, add a
  regression test and ask what type, component, or verifier could make that
  bug impossible to represent.

Verification:

- Coverage thresholds stay meaningful.
- Accountability scripts require tests for changed source areas.
- CI clearly separates fast local checks from rigorous release checks.

### Q. Documentation System And Public Platform Docs

Goal: make docs useful to authors, site owners, platform developers, and future
external users without creating stale parallel truth.

Work:

- Classify docs as author guide, site-owner guide, platform reference,
  component reference, decision record, audit, deferred work, generated
  reference, or historical migration note.
- Add doc ownership metadata and update triggers for source changes.
- Generate config, route, feature, component, and CLI references from typed
  source where possible.
- Promote `examples/docs-site` into a continuously verified public docs site.
- Keep `site/README.md` focused on non-technical site authors and keep root
  docs focused on developers/platform maintainers.

Verification:

- Docs lints for broken links and stale generated sections.
- Tests that generated docs match source schemas/registries.
- Docs-site build in CI remains green.

### R. Internal Package Boundaries And External Extraction

Goal: make reusable subdomains portable before publishing them externally.

Work:

- Create internal entrypoints or workspace-style boundaries for mature
  domains:
  config, routes, content, rendering, references, metadata, interactions,
  generated-output, testing, and performance tooling.
- Define public interfaces for each domain and keep implementation details
  private.
- Use examples/docs-site and fixture site to prove packages are not TPM-bound.
- Publish externally only after a domain has clear docs, tests, fixtures,
  versioning expectations, and at least one non-TPM consumer.

Verification:

- Import boundary checks.
- Package-level unit tests.
- Example site builds against package entrypoints.
- Public docs describe stable APIs and extension points.

### S. Extension Architecture And Plugin Contract

Goal: let future platform features extend the system through deliberate
extension points instead of patching route files, build scripts, or global
singletons.

Work:

- Define extension points for content kinds, semantic metadata profiles, route
  modules, generated-output verifiers, article compiler transforms, media
  policies, component catalog fixtures, deployment adapters, and author
  diagnostics.
- Model extension registration as typed manifests with capabilities,
  dependencies, feature flags, diagnostics, generated outputs, and docs hooks.
- Keep extension APIs explicit about build-time only behavior, static-output
  constraints, and what can or cannot import active site-instance state.
- Add compatibility rules so platform extensions can evolve without breaking
  existing site instances.
- Provide fixture extensions that prove the contract without adding production
  feature complexity.

Verification:

- Type tests and fixture tests for extension registration.
- Boundary checks prevent extensions from importing forbidden layers.
- Fixture site builds with one enabled and one disabled extension.
- Generated-output verifier asserts extension-owned artifacts are declared.

### T. Authoring Studio And Workflow Productization

Goal: make the future non-technical editing UI a natural consumer of the same
schemas, diagnostics, previews, and generated contracts used by CLI and CI.

Work:

- Define an editor-facing domain model for articles, announcements, pages,
  collections, authors, categories, redirects, support links, social links,
  feature flags, theme tokens, and asset metadata.
- Generate form schemas and human labels from platform schemas without making
  the GUI a parallel source of truth.
- Add preview contracts for one article, one collection, one homepage surface,
  one route, and one metadata/social/PDF output before full site generation.
- Model draft, review, publish, unpublish, and scheduled-publish workflows as
  states rather than ad hoc frontmatter flags.
- Design submission workflows for Git-backed content: branch creation, commit
  summary, PR body, author diagnostics, and generated preview links.

Verification:

- Schema-generation tests for editor form surfaces.
- State-machine tests for draft/review/publish workflows.
- Fixture diagnostics prove editor output matches CLI/site-doctor output.
- Docs explain how GUI concepts map back to files for power users.

### U. Import, Export, Migration, And Content Portability

Goal: make content durable and portable across platform versions, site
instances, legacy systems, and future tools.

Work:

- Define canonical import/export formats for content entries, authors,
  taxonomy, collections, assets, redirects, citations, PDFs, and generated
  metadata.
- Build migration plans for legacy sources such as WordPress exports, old TPM
  permalinks/assets, Substack-like archives, plain Markdown folders, and static
  HTML archives.
- Emit source maps from generated routes/assets back to site files so scanners,
  agents, and author tools can trace public-output problems to editable source.
- Add migration manifests that record what changed, what was inferred, and what
  still needs human review.
- Preserve historical metadata while separating it from current route policy.

Verification:

- Round-trip tests for canonical export/import fixtures.
- Migration fixture tests for representative legacy inputs.
- Generated-output diagnostics include source-file/source-line references where
  practical.
- Docs describe migration guarantees and known non-goals.

### V. Deployment Adapters, Release Governance, And Compatibility

Goal: make deployment, release, and compatibility policy explicit enough for a
public platform and multiple site instances.

Work:

- Create a deployment adapter contract for Cloudflare Workers Static Assets,
  Cloudflare Pages, GitHub Pages, Netlify, S3-compatible static hosting, and a
  generic static-folder target where feasible.
- Express redirects, headers, cache policy, trailing slash behavior, robots,
  feeds, sitemap, PDFs, and static assets through host-specific adapters backed
  by the same platform route/output contracts.
- Define versioning, changelog, migration guide, deprecation, and compatibility
  policies for platform APIs, site config, content frontmatter, generated
  output, and public routes.
- Add release health reporting: changed routes, changed redirects, changed
  metadata, payload deltas, dependency/security status, and required manual
  launch steps.
- Keep TPM-specific deployment choices in the site instance while preserving
  host-portable platform defaults.

Verification:

- Fixture builds for at least two deployment adapters.
- Header/redirect/cache verifier tests per adapter.
- Release report snapshot tests.
- Docs include upgrade guides and deprecation timelines for breaking changes.

### W. Security, Privacy, And Trust Policy

Goal: make a static site platform safe by default without hiding the tradeoffs
of embeds, analytics, external links, generated HTML, and dependencies.

Work:

- Define security headers and Content Security Policy targets for static pages,
  PDFs, images, scripts, styles, embeds, and third-party domains.
- Add privacy policy primitives for analytics, embeds, preconnect/preload,
  external CTAs, share links, and future consent surfaces.
- Audit trusted HTML, raw embeds, Markdown/MDX escape hatches, generated
  JSON-LD, citation URLs, and downloaded remote assets as named trust
  boundaries.
- Add dependency and supply-chain posture: audit policy, lockfile policy,
  third-party script policy, asset provenance, and secret-scanning expectations.
- Provide author-facing diagnostics when content introduces a new third-party
  origin, unsafe embed, missing attribution, or privacy-sensitive behavior.

Verification:

- Security-header verifier tests for generated output.
- CSP smoke tests against representative pages and embeds.
- Dependency/security audit remains part of release checks.
- Site-doctor diagnostics flag third-party origins and trust-boundary changes.

### X. Observability And Webmaster Intelligence

Goal: turn production signals into structured platform feedback instead of
one-off manual investigations.

Work:

- Define import formats for Lighthouse/Unlighthouse, Cloudflare analytics,
  Search Console, Bing, link scanners, accessibility scans, uptime checks, and
  crawler error exports.
- Normalize reports into structured diagnostics with route, source artifact,
  severity, trend, owner domain, likely root cause, and suggested remediation.
- Add dashboards or static reports for 404 trends, redirect gaps, crawlability,
  Core Web Vitals, metadata quality, social preview health, cache behavior,
  payload growth, and accessibility regressions.
- Connect diagnostics back to source maps, route registry, and generated-output
  manifests when possible.
- Distinguish bot/scanner noise from actionable platform, content, or hosting
  problems through explicit rules.

Verification:

- Parser tests for saved scanner/export fixtures.
- Golden reports for known production incidents.
- Release reports include before/after comparisons for changed route types.
- Docs explain which signals are blocking gates, review signals, or noise.

### Y. Localization, Internationalization, And Inclusive Defaults

Goal: make the platform structurally ready for publications with different
languages, locales, directions, date formats, typography needs, and accessibility
expectations.

Work:

- Add locale, language, text direction, date/time, reading-time, typography,
  route-prefix, feed, sitemap, PDF, and metadata contracts to site config and
  content schemas.
- Define translation and alternate-route relationships for future multilingual
  articles, pages, categories, tags, collections, authors, and PDFs.
- Ensure layout recipes, prose styles, nav, metadata lines, share/cite/PDF
  controls, and generated docs can handle long translated strings and RTL
  direction.
- Treat accessibility as a default contract for every locale: headings,
  landmarks, alt text, labels, focus order, reduced motion, color contrast, and
  keyboard/touch parity.
- Keep single-locale sites simple while making multilingual expansion an
  explicit, typed feature rather than a later rewrite.

Verification:

- Fixture sites for English-only, non-English, and RTL content.
- Snapshot tests for locale metadata, alternate links, sitemap/feed language,
  and PDF metadata.
- Playwright layout tests with long translated strings and RTL direction.
- A11y tests cover localized labels and document language.

### Z. Starter Templates, Distribution, And Ecosystem Readiness

Goal: make the mature platform easy to adopt, evaluate, extend, and reuse
outside the TPM site.

Work:

- Create starter site instances:
  minimal blog, editorial magazine, scholarly publication, docs site, and
  kitchen-sink demo.
- Provide scaffold commands or documented copy workflows for new site
  instances, theme setup, feature toggles, content collections, redirects,
  support/social links, deployment adapter choice, and CI setup.
- Publish platform capability manifests so humans, tools, and AI agents can
  understand what a site supports without reading implementation files.
- Define package distribution expectations for public releases:
  versioning, changelog, examples, migration guides, docs site, API reports,
  compatibility matrix, and support policy.
- Keep TPM as a strong real-world fixture while ensuring examples remain
  site-neutral and reusable.

Verification:

- Every starter builds and passes core generated-output checks.
- Scaffold output matches documented file structure.
- Example sites cover the main feature matrix without TPM-specific imports.
- Public docs and API reports are generated from the released package shape.

## Verification Strategy

The roadmap should be verified through layered checks rather than one large
release command.

1. Unit tests prove pure domain logic:
   route registries, visibility, metadata profiles, references, compiler
   artifacts, media policy, share targets, PDF eligibility, config defaults,
   and interaction state machines.
2. Component tests prove view contracts:
   responsive recipes, semantic markup, accessibility names, empty/error
   states, long-content behavior, and feature-disabled rendering.
3. Script tests prove tooling contracts:
   generated-output verifiers, site doctor, schema generation, PDF generation,
   asset audits, redirects, and payload workbench output.
4. Fixture site builds prove platform generality:
   TPM site, docs site, minimal site, feature-disabled site, kitchen-sink site,
   and hostile-content site.
5. Browser tests prove end-user behavior:
   navigation, article images, anchored surfaces, reference previews, sharing,
   PDF links, responsive rails, mobile menu, and layout containment.
6. A11y, HTML, metadata, and machine-readable tests prove external
   readability:
   valid HTML, semantic landmarks, alt text, labels, JSON-LD, Scholar tags,
   sitemap, feed, manifests, and robots policy.
7. Performance tests prove user experience:
   Lighthouse thresholds, payload budgets, cache headers, JS hydration size,
   image optimization, LCP hints, and CLS invariants.
8. Documentation checks prove maintainability:
   generated references match schemas and registries, docs-site builds, links
   resolve, and changed domains have corresponding docs updates.
9. Security, deployment, and observability checks prove production readiness:
   host-specific headers/redirects/cache behavior, dependency posture, CSP
   contracts, crawler diagnostics, and release-health reports.
10. Portability and distribution checks prove productization:
    starter sites, import/export round trips, extension fixtures, locale
    fixtures, and package/API compatibility reports.

Every milestone should identify the smallest fast check developers can run
during implementation and the release-level check that proves the feature is
safe to ship.

## Sequencing

The dependency order is:

1. Source/artifact lifecycle.
2. Platform context and route/feature registry.
3. Article compiler artifact and publishable model.
4. Route-level view models and generated-output verifier modules.
5. Site toolkit, PDF/scholarly, references, metadata, and interaction
   packages.
6. Layout recipes, component catalog, performance workbench, test matrix, docs
   system.
7. Internal package boundaries and extension contracts.
8. Deployment adapters, release governance, security/privacy, observability,
   and portability.
9. Authoring studio workflows, localization, starter templates, and external
   distribution.

This order keeps the work compounding. Earlier milestones create registries,
contexts, and artifacts that later milestones can reuse instead of inventing
parallel models.

## Safe Batching Guidance

The roadmap should be completed in dependency-aware batches, not necessarily one
letter at a time. Batching is useful when milestones share the same tests,
fixtures, and migration surface. It is unsafe when a later milestone would be
forced to guess at an earlier milestone's unfinished contract.

Recommended batches:

1. Planning/design packets for A, B, and C together.
   These establish the source lifecycle, context boundary, and route registry
   that other work should consume.
2. Implementation of A only after its design packet is complete.
   Source/artifact lifecycle is foundational and should remain small enough to
   verify in isolation.
3. Design packets for D, E, and F together.
   Article compiler artifacts, publishable entries, and route view models are
   tightly coupled and should agree on shared vocabulary before code moves.
4. Implementation of D and E in staged patches, then F as the route adaptation
   layer.
5. Design packets for G, H, I, J, and K together.
   Verifiers, author diagnostics, PDFs, references, and metadata all consume
   route/content artifacts and should agree on shared diagnostics and manifest
   shapes.
6. Implementation of G before H, I, J, and K where practical.
   A modular verifier makes later domain work easier to validate.
7. Design packets for L, M, N, O, and P together.
   Interactions, responsive recipes, catalog, performance, and test matrix
   share UX/performance/a11y risk controls.
8. Implementation of M and P before broad visual or interaction changes.
   Layout recipes and test strategy reduce regression risk for L, N, and O.
9. Design and implementation of Q and R after the core contracts stabilize.
   Docs and extraction should reflect working internal contracts, not wishful
   boundaries.
10. Design packets for S, V, and W together.
    Extension architecture, deployment adapters, and security/privacy policy
    define what outside code, hosts, and third-party origins are allowed to do.
11. Design packets for U and X together.
    Import/export/source maps and observability diagnostics should share the
    same traceability contracts from public output back to editable source.
12. Design packets for T, Y, and Z together after core schemas stabilize.
    Future editor/admin workflows, localization, and starter templates should
    consume stable platform schemas rather than inventing parallel models.
13. Implementation of mature distribution work should remain fixture-driven.
    A starter, extension, locale, or host adapter is ready only when it builds
    as a real non-TPM site and passes the relevant generated-output checks.

No valid milestone is discarded by this batching. The batches only reduce
thrash by making dependent contracts explicit before implementation begins.

## Developer Handoff Rules

When a milestone moves from this roadmap into `CHECKLIST.md`, create checklist
items in this order:

1. Design packet.
2. Pre-change tests or fixtures.
3. Implementation steps in dependency order.
4. Focused verification for the changed domain.
5. Docs update.
6. Release-level verification when the milestone touches build output,
   routing, metadata, performance, accessibility, or authoring behavior.

Checklist items should name the exact docs, tests, scripts, components, or
libraries involved whenever possible. Avoid generic items such as "refactor
components" or "improve tests"; those belong in this roadmap, not in active
implementation.

If implementation reveals a better domain boundary, update this roadmap before
continuing rather than forcing the code to match stale planning. If a bug is
found, record whether the fix should merely patch the symptom or make the bug
impossible to represent through a stronger type, schema, verifier, or layout
recipe.
