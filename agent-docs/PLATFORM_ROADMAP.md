# TPM Platform Roadmap

This is the authoritative long-term roadmap for the TPM Astro publishing
platform.

It should guide future design packets, implementation milestones, refactors,
tests, docs, and product decisions. It is intentionally standalone: engineers
should be able to understand the target architecture, sequencing, risks, and
verification strategy from this document alone.

The repo should mature from a high-quality TPM Astro site into a typed static
publishing platform. Authors should write ordinary content. Site owners should
configure a publication. Developers should extend clear platform domains. The
platform should compile those inputs into fast, accessible, durable,
machine-readable static output.

## End Vision

The mature platform is a static-first publishing compiler.

Site owners and authors express publication intent through a small site
directory: content files, assets, redirects, theme tokens, and a typed site
config. Platform code validates that intent, resolves routes and relationships,
selects media and metadata policies, renders UI from reusable responsive
primitives, and emits static artifacts with explicit contracts.

The ideal author path is boring:

1. Add an article, announcement, page, author, asset, collection, or config
   change in `site/`.
2. Run a fast check that explains any issue in author language.
3. Preview the generated page and generated artifacts.
4. Submit the change with confidence that release checks cover routing,
   metadata, accessibility, performance, PDFs, feeds, redirects, and links.

The ideal developer path is similarly safe:

1. Work inside typed platform domains with narrow public interfaces.
2. Add features by composing domain contracts rather than patching route files.
3. Prove behavior through fast unit tests, fixture sites, component catalog
   examples, generated-output verifiers, and browser checks.
4. Treat every recurring bug as a hint that a schema, type, policy, layout
   recipe, or verifier should make that bug impossible or difficult to express.

## Current Foundation

The repo is already past the prototype stage. It has enough structure to build
from rather than replace wholesale.

Current strengths:

- `site/` already acts as a publication instance containing content, config,
  assets, public files, redirects, and theme overrides.
- `src/` already contains reusable platform behavior: content schemas,
  routing, metadata, references, media policy, PDF generation, UI components,
  interactions, and generated-output helpers.
- Astro content collections and Zod schemas validate much of the author-facing
  input at build time.
- Articles and announcements already share a publishable-entry model for many
  listing, feed, homepage, and discovery surfaces.
- Metadata is already serious: canonical URLs, Open Graph, Twitter cards,
  Schema.org JSON-LD, Google Scholar tags, RSS, sitemap, PDFs, social images,
  bibliography, and article citation output.
- Article references, footnotes, citations, hover previews, and the sitewide
  bibliography are already coherent enough to be treated as a domain.
- UI work has moved toward primitives and blocks: buttons, links, section
  headers, scroll rails, action popovers, article lists, support CTAs, layout
  bodies, page frames, and a component catalog.
- Runtime JavaScript remains small and mostly progressive: anchored surfaces,
  image inspector, reference previews, share/cite menus, search, theme, rails,
  mobile nav, TOC controls, and carousel behavior.
- Verification is unusually strong: linting, type checks, unit tests, component
  tests, e2e tests, a11y checks, performance checks, generated-output
  verification, security checks, markdown review, component catalog checks, and
  test accountability all exist.
- `examples/docs-site/` proves that the platform can serve at least one
  non-TPM site instance.

Current architectural risks:

- Some platform helpers still depend on implicit active-site singletons rather
  than explicit contexts.
- Route, feature, entity, metadata, sitemap, feed, redirect, and generated
  artifact policy is centralized in places but not yet represented by one
  canonical registry.
- The article render pipeline is rich but not yet exposed as a single typed
  compiler artifact that downstream systems can consume.
- Generated-output verification is valuable but too large and monolithic for
  future reuse, GUI diagnostics, or external package extraction.
- Media, PDFs, embeds, social images, and article images work well but need a
  more explicit policy model to avoid future drift.
- Documentation is strong but split across author guides, developer docs,
  audits, plans, generated references, and historical notes without a fully
  formal lifecycle.
- Several subdomains are extractable in spirit but still need internal
  package-quality boundaries before becoming reusable libraries or Astro
  integrations.

## Platform Qualities

Every roadmap milestone should improve at least one of these qualities without
regressing the others.

- **Content fidelity:** historical article content and metadata remain
  traceable, even when route policy or display output changes.
- **Author simplicity:** common writing and configuration tasks do not require
  application-code edits.
- **Static-first output:** pages, feeds, metadata, PDFs, manifests, and assets
  are generated at build time unless the project explicitly changes direction.
- **Machine readability:** HTML, JSON-LD, feeds, sitemaps, PDFs, manifests,
  citations, and metadata are treated as public output contracts.
- **Accessibility:** semantic HTML comes first; ARIA, focus management, labels,
  keyboard behavior, and reduced-motion behavior are explicit where needed.
- **Performance:** payloads, caching, images, hydration, critical resources,
  layout stability, and perceived load time are measured and budgeted.
- **Configurability:** publication-specific choices live in site config,
  content, theme, or explicit adapters rather than hard-coded platform logic.
- **Developer velocity:** abstractions should make intentional changes easy and
  make accidental invalid states hard to express.
- **Extractability:** mature subdomains should have portable boundaries so they
  can become internal packages, Astro integrations, or reusable tools.
- **Verification:** every domain has fast local checks and release-level checks
  that prove generated output is safe.

## Domain Hierarchy

The platform should be understood as a hierarchy of domains. Work should name
the domain it is strengthening and avoid crossing unrelated domains without a
design reason.

```text
static editorial publishing platform
  -> site instance
    -> identity, theme, config, redirects, public files
    -> content, authors, categories, tags, collections, assets
    -> author workflow and site-owner workflow
  -> platform generator
    -> source/artifact lifecycle
    -> route, feature, and entity registry
    -> content compiler and publishable model
    -> article renderer and page view models
    -> metadata, social previews, search, feeds, and machine readability
    -> references, citations, bibliography, and scholarly output
    -> media, images, embeds, PDFs, and asset policy
    -> component system, layout recipes, and catalog
    -> progressive interaction primitives
    -> generated-output verification
    -> performance and payload tooling
    -> author diagnostics and future GUI model
    -> deployment adapters and release governance
    -> security, privacy, accessibility, and trust policy
    -> observability and webmaster intelligence
    -> import/export and migration portability
    -> localization and inclusive defaults
    -> starter templates and distribution
```

The target architecture should let a developer say “add a semantic metadata
profile,” “add a publishable surface,” “add an embed provider,” “add a route
feature,” or “add an article compiler output” rather than editing unrelated
pages, components, scripts, and docs by hand.

## Product Boundaries

The goal is not to become a generic website builder. The mature platform should
remain an opinionated static editorial publishing system.

The platform should be excellent at:

- article-like content, announcements, pages, authors, taxonomy, collections,
  feeds, search, citations, bibliography, scholarly PDFs, social previews,
  semantic metadata, and fast static output;
- publication-level configuration for identity, routes, navigation, theme,
  support links, social links, metadata, homepage surfaces, redirects, and
  deployment policy;
- reusable editorial UI primitives that make reading, browsing, citing,
  sharing, and supporting the publication feel coherent;
- generated-output validation that treats public HTML, routes, redirects,
  metadata, feeds, PDFs, search indexes, and assets as API contracts.

The platform should not try to become:

- a general drag-and-drop page builder;
- a runtime CMS that requires server state;
- a SPA framework;
- a theme marketplace at the expense of author simplicity;
- a generic component library detached from the editorial publishing domain.

TPM should remain the production proving ground. Generality should be proven
through the docs site, fixture sites, starter templates, and future second
consumers, not by weakening TPM's concrete editorial design.

## Roadmap Dependency Model

The roadmap is easiest to understand as five layers.

1. **Source contracts:** site instance, config contexts, route/entity registry,
   source/artifact lifecycle, and content compiler artifacts.
2. **Output engines:** publishable entries, metadata, references, media/PDFs,
   generated-output verifiers, redirects, feeds, and manifests.
3. **Presentation systems:** layout recipes, UI primitives, component catalog,
   progressive interactions, and responsive behavior.
4. **Product tooling:** site doctor, author diagnostics, documentation, release
   reports, performance workbench, observability imports, migration tooling, and
   future GUI/editor contracts.
5. **Distribution systems:** internal package boundaries, extension contracts,
   deployment adapters, starter sites, localization readiness, security/privacy
   defaults, and public platform documentation.

Work should generally move from lower layers to higher layers. Later layers can
be designed early, but implementation should avoid guessing at unfinished lower
contracts.

## Phase 1: Source Contracts

### A. Source And Artifact Lifecycle

**Goal:** make the boundary between editable source files, processed build
inputs, generated artifacts, and parked legacy assets explicit.

Current evidence:

- The repo already separates `site/assets/`, `site/public/`,
  `site/unused-assets/`, and generated `dist/`.
- Verification scripts catch many output failures, but there is no single
  source/artifact manifest that explains what each file is for.

Mature contract:

- Every source asset, static public file, generated artifact, and unused asset
  has a known role.
- Generated output diagnostics can trace public URLs back to editable source
  files where practical.
- Asset placement advice is tool-backed: authors know whether a file belongs in
  processed assets, public files, downloads, or unused assets.

Work:

- Define a source/artifact manifest model for content, assets, public files,
  generated routes, PDFs, social images, feeds, redirects, and static headers.
- Add inventory checks for unused processed assets, accidental raw image leaks,
  missing public files, and generated artifacts with no declared owner.
- Record which generated outputs are cacheable, user-facing, crawler-facing, or
  internal release artifacts.

Verification:

- Unit tests for manifest generation.
- Build verifier checks for orphaned public output and accidental raw assets.
- Fixture-site tests for processed assets, public files, downloads, and parked
  unused assets.

### B. Platform Context And Site Config Contract

**Goal:** replace implicit singleton site assumptions with typed config
contexts that can support TPM, docs examples, fixture sites, and future users.

Current evidence:

- `site/config/site.json` already carries a large amount of publication intent.
- `src/lib/site-config.ts` and related helpers centralize much of the loading,
  but many callers still implicitly consume the active site instance.

Mature contract:

- Platform helpers accept a `PlatformContext` or narrower domain context instead
  of reaching for global site state.
- Config is layered: platform defaults, theme defaults, site overrides, feature
  overrides, and environment/deployment choices.
- Schema output supports editors and future GUI forms without becoming a second
  source of truth.

Work:

- Define context types for site config, route registry, content compiler,
  output policy, feature flags, theme tokens, deployment adapter, and
  diagnostics.
- Normalize config once at the boundary and pass typed contexts into platform
  domains.
- Generate editor-friendly schema and docs from the same source schema.
- Add config fixture sites that cover minimal, TPM-like, feature-disabled, and
  hostile configurations.

Verification:

- Unit tests for config defaults and override behavior.
- Boundary tests that catch platform domains importing active-site singletons.
- Fixture-site builds proving non-TPM configs work.

### C. Canonical Route, Feature, And Entity Registry

**Goal:** make routes, feature availability, entity kinds, and generated outputs
discoverable through one typed registry.

Current evidence:

- Route helpers exist in `src/lib/routes.ts`, feature helpers exist elsewhere,
  and generated endpoints/pages encode related policy independently.
- Redirects, feeds, sitemap, metadata, navigation, and verifier scripts all need
  overlapping URL knowledge.

Mature contract:

- Every public route has a route definition with canonical URL, parameters,
  entity kind, visibility surfaces, generated artifacts, redirects, metadata
  responsibilities, and host-adapter needs.
- Route and entity manifests can be consumed by verifiers, docs, agents, future
  GUI tooling, and release reports.

Work:

- Create a typed route/entity/feature registry that covers articles,
  announcements, pages, authors, categories, tags, collections, bibliography,
  archive, feeds, PDFs, search data, social images, public static files, and
  special well-known files.
- Use the registry in route generation, metadata, sitemap, RSS, redirects,
  navigation, generated-output verification, and docs.
- Add compatibility rules for historical permalinks and feature-disabled routes.

Verification:

- Golden route manifest snapshots.
- Redirect and sitemap tests generated from registry data.
- Build verifier fails on undocumented public routes or generated artifacts.

### D. Article Compiler Artifact

**Goal:** make rendered article output a typed build artifact rather than a set
of ad hoc computations scattered across layouts, scripts, and verifiers.

Current evidence:

- Articles already pass through rich Markdown/MDX, image, reference, TOC, PDF,
  and metadata processing.
- Many downstream systems need the same article facts: headings, references,
  images, embeds, citations, links, PDF eligibility, social image, description,
  and visibility.

Mature contract:

- Each article compiles into a stable artifact with source identity, rendered
  HTML, headings, references, citations, links, images, embeds, media policy,
  semantic metadata, PDF compatibility, search text, related entities, and
  diagnostics.
- HTML views, PDFs, feeds, search, manifests, bibliography, and verifiers
  consume the artifact instead of reparsing page output.

Work:

- Define the artifact schema and diagnostics.
- Move article-specific transformations behind the compiler boundary.
- Keep Markdown/MDX authoring simple while making MDX fallback behavior explicit
  for PDFs, search, and metadata.
- Add source maps from rendered output back to content files where practical.

Verification:

- Golden artifact snapshots for plain Markdown, MDX, image-heavy,
  citation-heavy, embed-heavy, PDF-disabled, and malformed fixtures.
- Verifier tests consume artifacts instead of duplicating extraction logic.
- Existing article pages remain stable through route/output snapshots.

## Phase 2: Output Engines

### E. Publishable Entry And Visibility Model

**Goal:** make every list, feed, collection, search result, related block,
homepage panel, and recommendation surface consume the same expressive
publishable model.

Current evidence:

- Articles and announcements share much behavior but still differ in places.
- Visibility settings exist, but future content types and surfaces will need
  clearer semantics.

Mature contract:

- `PublishableEntry` expresses source kind, publication dates, route, title,
  description, authors, taxonomy, media, semantic profiles, visibility,
  ordering hints, and display hints.
- Visibility is explicit for homepage, directory, collections, feed, search,
  sitemap, related, PDF, external manifests, and future APIs.
- The model supports articles and announcements now while leaving room for
  reviews, events, books, media entries, podcasts, datasets, and pages.

Work:

- Expand the publishable model into layered source, display, visibility, media,
  and metadata contracts.
- Refactor list and discovery blocks to consume publishable view models where
  practical.
- Add validation that impossible visibility combinations are rejected or clearly
  diagnosed.

Verification:

- Unit tests for visibility matrix and display normalization.
- Component tests for mixed source kinds and feature-disabled surfaces.
- Fixture-site tests for homepage, archive, collection, feed, and search
  inclusion rules.

### F. Route-Level View Models

**Goal:** keep routes thin and make complex pages render from display-ready view
models.

Current evidence:

- `article-page-view-model.ts` and homepage helpers show the intended pattern.
- Several routes still combine loading, sorting, metadata, empty-state, and
  component-prop shaping.

Mature contract:

- Route files orchestrate loading and static paths, then pass view models to
  layouts and blocks.
- View models own sorting, grouping, filtering, feature gating, empty states,
  metadata inputs, and component props.

Work:

- Add view models for article index, archive, category detail, tag detail,
  author detail, collection index/detail, bibliography, announcements, pages,
  search, and 404 where useful.
- Standardize metadata and navigation inputs through route-level view models.
- Use fixture data in component tests rather than ad hoc local objects.

Verification:

- Unit tests for each view model.
- Route smoke tests for metadata and empty-state output.
- Component tests assert view contract behavior instead of route internals.

### G. Metadata, Semantics, Search, And Scholarly Engine

**Goal:** make machine-readable output a platform engine with automatic
defaults and optional advanced profiles.

Current evidence:

- Metadata, semantic metadata, social images, feeds, PDF metadata, and Scholar
  tags are already substantial.
- Advanced schemas such as reviews, events, books, media, datasets, and
  software are long-term platform needs, not TPM-specific needs.

Mature contract:

- Route/entity profiles generate truthful metadata automatically from content
  and config.
- Frontmatter can opt into advanced profiles without forcing all authors to
  learn schema vocabulary.
- The platform emits HTML metadata, Open Graph, Twitter cards, JSON-LD, Scholar
  tags, feed metadata, PDFs, and machine-readable manifests consistently.

Work:

- Define semantic profile modules for organization, website, article,
  announcement, author, collection, category, tag, review, event, book, media,
  dataset, software, citation source, PDF, feed item, and search record.
- Add route/entity manifests containing canonical URL, type, title,
  description, dates, authors, tags, categories, images, references, PDF,
  language, visibility, robots, and relationships.
- Consider future `llms.txt` or content-index surfaces after the manifest
  contract is stable.

Verification:

- JSON-LD snapshots for each profile.
- HTML metadata tests for route types.
- Search/social/Scholar/PDF metadata verifiers.
- Fixture-site tests for profile opt-in and defaults.

### H. References, Citations, And Bibliography Domain

**Goal:** make citations and references a dependable scholarly subsystem rather
than best-effort transformed prose.

Current evidence:

- The reference system supports canonical markers, hover previews, article
  references, site bibliography, and citation menus.
- Legacy migration produced citations that need manual audit and stronger
  canonicalization.

Mature contract:

- Author syntax parsing, canonical source identity, display rendering, export
  formats, hover previews, backlinks, and site bibliography are separate views
  of one source model.
- Duplicate detection and source-quality diagnostics help authors correct data.

Work:

- Normalize citations into canonical source records with BibTeX import/export,
  DOI/URL/archive metadata, locator metadata, source identity, and display
  citation.
- Add duplicate-source detection with explainable similarity signals.
- Export article and site bibliography as BibTeX, RIS, CSL JSON, and
  agent-readable manifests.
- Keep hover previews and bibliography views minimal UI layers over canonical
  source data.

Verification:

- Parser, normalizer, and malformed-input tests.
- Corpus audit tests for every article reference marker.
- Golden bibliography aggregation snapshots.
- DOI lookup fixtures where external data is used for validation.

### I. Media, Image, Embed, And PDF Policy Engine

**Goal:** make media behavior policy-driven across HTML, lists, social previews,
RSS/search, PDFs, and future editors.

Current evidence:

- Article images, social images, hover images, embeds, PDF fallbacks, and asset
  optimization have each been improved, but they remain a high-risk domain.
- Generated PDFs and public dist assets exposed size and fallback issues.

Mature contract:

- Every media item has source identity, alt/caption policy, display frame,
  optimization plan, social preview role, PDF/search compatibility, external
  origin trust boundary, and fallback behavior.
- Embeds use provider policies and fall back to static links or snapshots where
  needed.
- PDFs are generated only when size, compatibility, metadata, and fallback
  policy are acceptable.

Work:

- Create media policy records for article images, list thumbnails, social
  images, hover images, embeds, downloads, and PDFs.
- Add provider adapters for generic embeds, SoundCloud, YouTube, and future
  providers.
- Add PDF eligibility diagnostics, image downscaling policy, unsupported media
  disclosures, and PDF size budgets.
- Feed media decisions through Astro image optimization where practical.

Verification:

- Unit tests for media policy and fallback selection.
- PDF smoke tests for text, links, metadata, image inclusion, and size.
- Asset verifier checks raw/unoptimized output and social-image constraints.
- E2E tests for image inspector, embeds, and layout containment.

### J. Generated-Output Verifier Architecture

**Goal:** turn build verification into a modular static-site contract engine.

Current evidence:

- `verify-build` and related scripts catch real production issues.
- Verifier logic is valuable but too monolithic for future product tooling.

Mature contract:

- Verifier modules consume route registry, compiler artifacts, media policies,
  config contexts, and source/artifact manifests.
- Diagnostics have stable codes, severity, route, source file, public artifact,
  explanation, and remediation.
- Human CLI output, JSON output, release reports, docs, and future GUI tooling
  all use the same diagnostic model.

Work:

- Split verifiers into modules for routes, links, redirects, sitemap, feeds,
  metadata, social images, PDFs, search, scripts, CSS, assets, cache headers,
  image alt, optional features, public files, and HTML shape.
- Add diagnostic aggregation, filtering, and JSON output.
- Connect diagnostics to source maps where available.

Verification:

- Unit tests per verifier module.
- Golden diagnostic tests.
- Release build verifier asserts a zero-error generated-output state.

## Phase 3: Presentation And Interaction Systems

### K. UI Primitives, Layout Recipes, And Component Catalog

**Goal:** solve common layout and component problems once, then make future UI
changes faster and safer.

Current evidence:

- The repo already has many useful primitives: `Button`, `LinkText`,
  `SectionHeader`, `ScrollRail`, `SectionStack`, article list pieces, social
  CTAs, and anchored surfaces.
- Layout issues repeatedly show up around spacing, responsive containment,
  horizontal rails, action rows, media frames, and generated prose.

Mature contract:

- Reusable components own responsive behavior, spacing, wrapping, focus states,
  dark mode, accessibility semantics, hostile-content behavior, and empty
  states.
- Named layout recipes express repeated patterns: reading body, browsing body,
  section header with action, article header action row, endcap stack, media
  frame, split panel, horizontal rail, flat teaser, metadata line, CTA row, and
  prose section.
- The component catalog is a design review and regression tool, not just a
  component list.

Work:

- Promote repeated Tailwind class clusters into typed primitives or layout
  recipes where repetition creates risk.
- Add catalog fixtures for happy path, long text, missing media, many items,
  feature-disabled, dark mode, high contrast, keyboard focus, narrow container,
  and hostile data.
- Make catalog examples site-neutral where possible.

Verification:

- Component catalog integrity tests.
- Component tests for variants, empty states, accessibility names, and hostile
  content.
- Playwright layout invariants for overflow, wrapping, and alignment.

### L. Progressive Interaction Primitives

**Goal:** keep interactive behavior small, lazy, accessible, and consistent.

Current evidence:

- Anchored positioning, cite/share menus, reference previews, image inspector,
  horizontal rails, carousel controls, mobile nav, theme, and header offset all
  solve overlapping interaction problems.

Mature contract:

- Pure state machines and placement algorithms are separate from DOM adapters.
- Optional controllers load on intent, visibility, or idle according to policy.
- Keyboard, pointer, touch, reduced-motion, escape/outside click, focus
  restoration, and lazy-loading behavior are consistent across surfaces.

Work:

- Create an interaction domain for anchored surfaces, disclosures, popovers,
  reference previews, image inspector, rails, carousel, search reveal, mobile
  nav, and theme.
- Make scripts opportunistically lazy without delaying first required use.
- Keep the browser payload measurable and route-type aware.

Verification:

- Unit tests for state machines and placement logic.
- Playwright tests for keyboard, touch, pointer, and focus flows.
- Lighthouse/payload checks for unused JavaScript and critical-path impact.

### M. Performance, Payload, And Cache Workbench

**Goal:** make performance experimentation repeatable and promote successful
experiments into durable gates.

Current evidence:

- Lighthouse, Unlighthouse, payload checks, image optimization audits, cache
  headers, and long-term hashed asset caching have all been investigated.
- Performance choices need a shared measurement surface so fixes are not
  guesswork.

Mature contract:

- Representative route types have budgets for HTML bytes, CSS bytes, JS bytes,
  image bytes, requests, LCP, CLS, accessibility, SEO, cacheability, and
  generated artifacts.
- Experiments record inputs, outputs, and promotion criteria.
- Cache headers are host-adapter output, not a one-off deployment detail.

Work:

- Build a performance workbench for home, article, image-heavy article,
  citation-heavy article, archive, category, search, and PDF-enabled article.
- Track payload diffs and cache behavior for hashed assets, PDFs, feeds, HTML,
  and public files.
- Keep critical CSS, preload/fetch priority, asset optimization, and JS lazy
  loading evidence-based.

Verification:

- Lighthouse CI budgets.
- Payload diff reports.
- Cache-header verifier in generated-output checks.
- Regression tests for carousel timing, layout stability, and media dimensions.

## Phase 4: Product Tooling

### N. Site Doctor And Author Diagnostics

**Goal:** make strict platform contracts friendly to non-technical authors and
site owners.

Current evidence:

- `site-doctor`, content verification, schema generation, and author docs exist.
- Future GUI tooling needs structured diagnostics rather than console-only
  output.

Mature contract:

- Authors can check one article, one collection, one asset, one route, or the
  whole site and receive clear remediation.
- Diagnostics are structured, human-readable, and GUI-readable.

Work:

- Expand site-doctor to validate config, route previews, feature summary,
  content summary, redirect rules, asset placement, visibility matrix, author
  profiles, collection resolution, PDF eligibility, metadata previews, third
  party origins, and generated URLs.
- Add fast author commands for common workflows.
- Generate form schemas and labels for future GUI surfaces.

Verification:

- Fixture-site tests for good and bad author inputs.
- Snapshot tests for diagnostic wording.
- Docs examples for non-technical authors.

### O. Documentation System And Public Platform Docs

**Goal:** keep docs useful without creating stale parallel truth.

Current evidence:

- Root docs, `site/README.md`, public docs-site notes, platform module docs,
  package scripts, audits, and generated schema already exist.
- Documentation has multiple audiences and needs explicit ownership.

Mature contract:

- Docs are classified by audience and update trigger: author guide, site-owner
  guide, platform reference, component reference, decision record, audit,
  deferred work, generated reference, historical migration note.
- Config, route, feature, component, and CLI references are generated from
  source where possible.
- `examples/docs-site` becomes a continuously verified public docs site.

Work:

- Add documentation ownership metadata and source-change triggers.
- Generate references from typed schemas/registries.
- Keep `site/README.md` author-focused and root docs developer-focused.
- Promote docs examples into tested public platform documentation.

Verification:

- Markdown review, broken-link checks, generated-doc drift checks, docs-site
  build, and changed-domain doc accountability.

### P. Test Matrix And Correctness Strategy

**Goal:** make high-velocity development safe through better fixtures and
stronger invariants.

Current evidence:

- Unit, component, e2e, a11y, perf, markdown, verifier, and accountability
  checks already form a strong quality culture.
- Platform productization needs more fixture sites and domain-specific golden
  outputs.

Mature contract:

- Tests assert intentions and invariants, not incidental implementation
  details, except where implementation details are explicit contracts.
- Bugs trigger regression tests and a design question: what type, schema,
  verifier, policy, or primitive should make this bug hard to repeat?

Work:

- Add fixture site matrix: minimal, TPM-like, docs, feature-disabled,
  kitchen-sink, hostile-content, and bad-config.
- Add property tests for routes, visibility, slugs, tags, citation keys,
  anchored placement, share URLs, metadata profiles, and cache policies.
- Add golden tests for route manifests, compiler artifacts, metadata,
  generated output, config schema, and diagnostics.

Verification:

- Coverage thresholds remain meaningful.
- Accountability scripts require tests for changed source areas.
- CI separates fast local checks from rigorous release checks.

### Q. Observability And Webmaster Intelligence

**Goal:** turn production signals into structured platform feedback.

Current evidence:

- The project has already used Cloudflare 404s, Bing reports, Search Console,
  link scanners, Lighthouse, Unlighthouse, and accessibility scans to find real
  issues.
- These investigations are currently manual and case-specific.

Mature contract:

- Scanner and analytics exports normalize into diagnostics with route, source
  artifact, severity, trend, likely root cause, owner domain, and remediation.
- Bot/scanner noise is classified by rule instead of personal memory.

Work:

- Add import formats for Lighthouse/Unlighthouse, Cloudflare analytics, Search
  Console, Bing, link scanners, a11y scans, uptime checks, and crawler errors.
- Generate static reports for 404 trends, redirect gaps, crawlability, Core Web
  Vitals, metadata quality, social previews, cache behavior, payload growth, and
  accessibility regressions.
- Connect diagnostics to route registry and source/artifact manifests.

Verification:

- Parser tests for saved scanner fixtures.
- Golden incident reports.
- Release reports include before/after comparisons for changed route types.

### R. Authoring Studio Readiness

**Goal:** make a future GUI a natural consumer of existing platform contracts.

Current evidence:

- Site config, schemas, diagnostics, content collections, and author docs point
  toward a GUI, but editor workflows are not yet modeled.

Mature contract:

- The GUI does not invent a parallel CMS model. It edits the same site instance
  files and consumes the same schemas, diagnostics, route previews, and
  generated-output contracts as CLI and CI.

Work:

- Define editor-facing models for articles, announcements, pages, collections,
  authors, categories, redirects, support links, social links, feature flags,
  theme tokens, and asset metadata.
- Model draft, review, publish, unpublish, and scheduled-publish workflows as
  typed states.
- Design Git-backed submission workflows: branch creation, commit summary, PR
  body, author diagnostics, and preview links.

Verification:

- State-machine tests for editorial workflows.
- Schema-generation tests for editor forms.
- Fixture diagnostics proving GUI output matches CLI output.

## Phase 5: Distribution And Ecosystem Readiness

### S. Internal Package Boundaries And Extraction Candidates

**Goal:** make reusable subdomains portable before publishing anything
externally.

Current evidence:

- Several domains are already close to standalone packages: metadata profiles,
  article references, generated-output verifiers, config/site-doctor, route
  registry, media/social images, PDF/scholarly output, interaction primitives,
  and component catalog tooling.

Mature contract:

- Mature domains expose public interfaces and hide implementation details.
- Internal entrypoints prove boundaries before external publication.
- Extraction happens only after docs, tests, fixtures, versioning expectations,
  and at least one non-TPM consumer exist.
- Extraction follows a ladder:
  local domain module, internal package boundary, private workspace package,
  reusable Astro library, Astro integration when build hooks are required, or
  CLI package when the value is validation/migration/reporting.
- Reusable does not mean vague. Extracted domains should remain specific to
  static editorial publishing and should not inherit TPM copy, config,
  filenames, or branding.

Work:

- Create internal entrypoints or workspace-style boundaries for config, routes,
  content compiler, metadata, references, media, interactions, generated-output
  verification, testing, and performance tooling.
- Use examples and fixture sites to prove non-TPM use.
- Identify future Astro integration candidates where the boundary is stable.
- Require each candidate to document its public API, diagnostics, fixtures,
  package boundary, current consumers, and missing blockers before extraction.

Verification:

- Import boundary checks.
- Package-level unit tests.
- Example site builds against package entrypoints.

### T. Extension Architecture

**Goal:** let future features extend the platform through deliberate extension
points instead of patching global files.

Mature contract:

- Extensions declare capabilities, dependencies, feature flags, diagnostics,
  generated outputs, docs hooks, and static-output constraints.
- Extensions can add content kinds, metadata profiles, route modules, verifier
  modules, article compiler transforms, media policies, catalog fixtures,
  deployment adapters, and author diagnostics.

Work:

- Define typed extension manifests.
- Add fixture extensions that prove enabled and disabled states.
- Enforce import boundaries so extensions cannot reach forbidden layers.

Verification:

- Type tests and fixture builds.
- Generated-output verifier asserts extension-owned artifacts are declared.

### U. Deployment Adapters And Release Governance

**Goal:** make deployment policy host-portable while keeping TPM's Cloudflare
choice cleanly configured.

Current evidence:

- The current deployment targets Cloudflare Workers Static Assets with redirects
  and cache headers.
- Future platform users may need Cloudflare Pages, GitHub Pages, Netlify, S3, or
  generic static-folder output.

Mature contract:

- Redirects, headers, cache policy, trailing slash behavior, robots, feeds,
  sitemap, PDFs, and static assets are expressed through deployment adapters
  backed by the same output contracts.
- Releases include route, redirect, metadata, payload, dependency, and manual
  launch-step reports.

Work:

- Define deployment adapter interfaces.
- Implement Cloudflare Workers Static Assets first as the reference adapter.
- Add host-portable adapters as fixture-backed platform work.
- Define versioning, changelog, migration, deprecation, and compatibility
  policy for platform APIs, site config, frontmatter, output, and routes.

Verification:

- Header/redirect/cache verifier tests per adapter.
- Fixture builds for at least two adapters before declaring portability mature.
- Release health report snapshots.

### V. Security, Privacy, And Trust Policy

**Goal:** make static publishing safe by default without hiding tradeoffs.

Mature contract:

- Security headers, CSP targets, third-party origins, trusted HTML, raw embeds,
  Markdown/MDX escape hatches, JSON-LD, citation URLs, external CTAs, share
  links, downloaded assets, analytics, and dependency posture are named trust
  boundaries.
- Authors get diagnostics when content introduces new third-party origins or
  privacy-sensitive behavior.

Work:

- Define security header and CSP targets for platform output.
- Add third-party origin and embed trust diagnostics.
- Document dependency, lockfile, third-party script, asset provenance, and
  secret-scanning policy.

Verification:

- Security-header verifier tests.
- CSP smoke tests against embeds.
- Dependency/security audit in release checks.

### W. Import, Export, Migration, And Portability

**Goal:** make content durable across platform versions, site instances, legacy
systems, and future tools.

Mature contract:

- Content, authors, taxonomy, collections, assets, redirects, citations, PDFs,
  and generated metadata have canonical import/export formats.
- Migrations record what was changed, inferred, preserved, and left for human
  review.
- Public-output diagnostics can trace issues back to editable source.

Work:

- Define import/export formats and source maps.
- Add migration fixtures for WordPress exports, old TPM permalinks/assets,
  Substack-like archives, plain Markdown folders, and static HTML archives.
- Preserve historical metadata separately from current route policy.

Verification:

- Round-trip tests.
- Migration fixture tests.
- Diagnostics include source-file/source-line references where practical.

### X. Localization And Inclusive Defaults

**Goal:** make non-English and multilingual publications possible without a
later rewrite.

Mature contract:

- Locale, language, text direction, date/time, reading-time, typography,
  route-prefix, feed, sitemap, PDF, metadata, and alternate-route relationships
  are typed platform concepts.
- Single-locale sites stay simple.

Work:

- Add locale contracts to config and content schemas.
- Ensure layout recipes, prose, nav, metadata lines, share/cite/PDF controls,
  generated docs, and PDFs tolerate long translated strings and RTL direction.
- Treat accessibility as a locale-independent default.

Verification:

- English-only, non-English, and RTL fixture sites.
- Snapshot tests for language metadata, alternate links, sitemap/feed language,
  and PDF metadata.
- Playwright layout tests with long translated strings and RTL.

### Y. Starter Templates And Distribution

**Goal:** make the platform easy to adopt and evaluate outside TPM.

Mature contract:

- New site instances can start from documented templates and verified example
  sites.
- Platform capabilities are discoverable by humans, tools, and AI agents.

Work:

- Create starter site instances for minimal blog, editorial magazine, scholarly
  publication, docs site, and kitchen-sink demo.
- Add scaffold workflows or documented copy workflows for new site instances.
- Define public release expectations: versioning, changelog, examples,
  migration guides, docs site, API reports, compatibility matrix, and support
  policy.

Verification:

- Every starter builds and passes core generated-output checks.
- Scaffold output matches documented structure.
- Example sites cover the feature matrix without TPM imports.

## Verification Strategy

The roadmap should be verified through layered checks. No single test type can
prove the whole platform.

1. **Unit tests** prove pure domain logic: route registries, visibility,
   metadata profiles, references, compiler artifacts, media policy, share
   targets, PDF eligibility, config defaults, diagnostics, and interaction
   state machines.
2. **Script tests** prove tooling contracts: generated-output verifiers, site
   doctor, schema generation, PDF generation, asset audits, redirects, payload
   workbench output, migration tooling, and release reports.
3. **Component tests** prove view contracts: semantic markup, accessibility
   names, empty/error states, long-content behavior, feature-disabled
   rendering, and variant behavior.
4. **Component catalog fixtures** prove design-system resilience: dark mode,
   high contrast, keyboard focus, missing media, many items, narrow containers,
   hostile strings, and long translated labels.
5. **Fixture site builds** prove platform generality: TPM site, docs site,
   minimal site, feature-disabled site, kitchen-sink site, bad-config site,
   hostile-content site, and locale/RTL sites.
6. **Browser tests** prove end-user behavior: navigation, article images,
   anchored surfaces, reference previews, sharing, PDF links, responsive rails,
   mobile menu, carousel stability, and layout containment.
7. **Accessibility and semantic tests** prove external readability: landmarks,
   headings, labels, alt text, focus order, valid HTML, JSON-LD, Scholar tags,
   sitemap, feeds, manifests, and robots policy.
8. **Performance tests** prove visitor experience: Lighthouse thresholds,
   payload budgets, cache headers, JavaScript size, image optimization, LCP
   hints, CLS invariants, and generated PDF size.
9. **Security and deployment tests** prove production readiness: headers,
   redirects, cache behavior, CSP expectations, dependency posture,
   third-party-origin diagnostics, and host adapter output.
10. **Documentation checks** prove maintainability: generated references match
    schemas/registries, docs-site builds, markdown links resolve, and changed
    domains update the relevant docs.
11. **Portability checks** prove productization: starter sites, extension
    fixtures, package entrypoint tests, import/export round trips, migration
    fixtures, and compatibility reports.

Every active milestone should identify:

- the smallest useful fast check developers can run while editing;
- the focused tests that prove the domain contract;
- the release-level checks that prove public output is safe;
- the docs checks that prove the repo teaches the new behavior.

## Implementation Protocol

Every roadmap item should enter active work through a design packet before code
changes. A design packet should state:

- the roadmap milestone and smaller subdomain being touched;
- the user-facing goal for authors, site owners, visitors, developers, and
  tools;
- the current source files, tests, docs, generated artifacts, and known pain
  points;
- the target public contract after the change;
- affected source domains and generated-output contracts;
- typed interfaces, schemas, manifests, policies, or registries being added or
  changed;
- invalid states the change should make impossible;
- visible UX changes, if any;
- performance, accessibility, SEO, machine-readability, and payload risks;
- pre-change tests or fixtures;
- implementation sequence;
- focused verification and release-level verification;
- docs that must change.

The packet should be concrete enough for another engineer to implement the
first patch without rediscovering the domain. If the packet cannot name the
source files, tests, artifacts, and output contracts involved, the milestone is
not ready for implementation.

For risky domains, write tests and fixtures before broad refactors. For visual
or responsive work, add component catalog examples and Playwright invariants.
For generated output, add golden manifests or verifier diagnostics.

## Milestone Readiness Criteria

A roadmap milestone is ready to move into `CHECKLIST.md` only when it has:

- a narrow first implementation slice;
- explicit user impact and non-goals;
- a typed contract or policy target;
- affected source paths and generated output paths;
- pre-change characterization tests where current behavior is risky;
- fixture data when platform generality matters;
- docs that must be updated;
- rollback or compatibility notes when public output may change.

Checklist items should be written in this order:

1. Design packet.
2. Pre-change tests or fixtures.
3. Implementation steps in dependency order.
4. Focused verification for the changed domain.
5. Docs update.
6. Release-level verification when the milestone touches build output,
   routing, metadata, performance, accessibility, authoring behavior, or public
   generated artifacts.

Avoid generic active checklist items such as “refactor components” or “improve
tests.” Those belong in this roadmap until they are decomposed into files,
contracts, tests, and expected output.

## Recommended Sequencing

The strongest dependency-aware sequence is:

1. Source/artifact lifecycle, platform context, route/entity registry.
2. Article compiler artifact, publishable entry model, route view models.
3. Generated-output verifier architecture.
4. Metadata engine, references domain, media/PDF policy engine.
5. UI layout recipes, component catalog, interaction primitives, performance
   workbench, and test matrix.
6. Site doctor, author diagnostics, docs system, and observability imports.
7. Internal package boundaries and extension architecture.
8. Deployment adapters, release governance, security/privacy, import/export,
   localization, starter templates, and GUI readiness.

This order keeps later work from inventing private models that should have been
shared lower in the stack.

## Safe Batching

The roadmap does not need to be implemented one letter at a time. Batching is
useful when milestones share vocabulary, tests, fixtures, and migration
surfaces. Batching is unsafe when a later milestone would have to guess at an
unfinished lower-level contract.

Recommended batches:

1. **Source contracts design:** A, B, and C together. These define source
   lifecycle, config/context boundaries, and route/entity ownership.
2. **Article/content model design:** D, E, and F together. Article compiler
   artifacts, publishable entries, and route view models should agree on
   shared vocabulary before implementation.
3. **Output engine design:** G, H, I, and J together. Metadata, references,
   media/PDFs, and verifiers all need route/content artifacts and structured
   diagnostics.
4. **Presentation and performance design:** K, L, M, and P together. Layout
   recipes, interactions, performance, and tests share UX, accessibility, and
   regression controls.
5. **Author/product tooling design:** N, O, Q, and R together. Site doctor,
   docs, observability, and future GUI workflows should consume the same
   schemas and diagnostics.
6. **Distribution design:** S, T, U, V, W, X, and Y together at the design
   level. Actual implementation should stay incremental and fixture-driven.

Implementation should still proceed in small patches. A batch is permission to
design shared contracts together, not permission to ship a giant refactor.

## Critical Risks And Countermeasures

- **Config maximalism:** do not expose every implementation detail as config.
  Prefer author defaults, named policies, and advanced escape hatches.
- **Premature extraction:** internal entrypoints should prove portability before
  public packages or integrations are promised.
- **Route drift:** centralize route/entity definitions before expanding
  generated output and deployment adapters.
- **Verifier duplication:** verifiers should consume compiler artifacts and
  registries rather than reparsing output independently where avoidable.
- **Visual inconsistency:** promote repeated layouts into recipes before adding
  more bespoke block designs.
- **Performance regression:** every interaction and media feature needs payload,
  cache, and Lighthouse evidence.
- **Static-output regression:** any change to routes, redirects, feeds,
  metadata, PDFs, search, headers, or public files must be treated as a public
  API change.
- **Docs drift:** generate references from schemas/registries wherever
  practical and keep narrative docs audience-specific.
- **GUI parallel model:** future editor/admin tools must consume platform
  schemas and diagnostics rather than becoming a separate CMS.
- **TPM dilution:** platform generality must not weaken TPM as the real
  production fixture. Generality should be proven through examples and fixture
  sites, not by making TPM's design less intentional.
- **Package theater:** extraction work should produce boundaries, tests, docs,
  and second consumers before publishing packages or integrations.
- **Migration loss:** historical metadata, redirects, migrated assets, citation
  intent, and legacy route evidence should remain traceable even when current
  display behavior changes.

## Review Checklist For Future Roadmap Work

Before moving roadmap work into implementation, ask:

- Which audience benefits first: authors, site owners, readers, developers, or
  tools?
- Which guardrails cannot regress: content fidelity, URL stability,
  accessibility, metadata truthfulness, performance, or static output?
- Is this behavior platform behavior or TPM site-instance behavior?
- Which domain owns the source of truth?
- Does the change introduce or remove a public generated-output contract?
- Can invalid states be prevented by a schema, type, registry, policy, or
  verifier?
- Are pure core logic and impure adapters separated?
- Are components receiving view models instead of raw content/config where
  practical?
- Does the component own responsive behavior, empty states, focus behavior, and
  long-content behavior?
- Are tests written at the smallest useful layer?
- Does a fixture site need to prove non-TPM behavior?
- Does this help or hurt future extraction into internal packages, Astro
  libraries, Astro integrations, CLIs, or starter templates?
- If the change fixes a bug, why was that bug possible?
- If the change adds an abstraction, what concrete invariant or repeated domain
  concept justifies it?
- If the change affects performance, what measurement proves success?

This roadmap should be updated when implementation discovers a better domain
boundary. It should not be treated as a fossil. Its job is to preserve the
long-term direction while allowing the repo to learn from real implementation
work.
