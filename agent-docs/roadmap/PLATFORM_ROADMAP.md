# TPM Platform Roadmap

This is the authoritative long-term roadmap for the TPM Astro publishing
platform.

It should guide future design packets, implementation milestones, refactors,
tests, docs, and product decisions. It is intentionally standalone: engineers
should be able to understand the target architecture, sequencing, risks, and
verification strategy from this document alone.

The repo should mature from a high-quality TPM Astro site into a typed static
publishing platform, and ultimately into the foundation for a comprehensive
static blog studio. Authors should write ordinary content. Site owners should
configure a publication. Developers should extend clear platform domains. The
platform should compile those inputs into fast, accessible, durable,
machine-readable static output.

## End Vision

The mature platform is a static-first publishing compiler.

Site owners and authors express publication intent through a site workspace:
content, media references, redirects, theme tokens, and typed site config. That
workspace may currently be a `site/` directory and may later be materialized by
a source or media adapter. Platform code validates that intent, resolves routes
and relationships, selects media and metadata policies, renders UI from reusable
responsive primitives, and emits static artifacts with explicit contracts.

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

The far-end product is a static blog CMS/studio: a single GUI application where
non-technical users can write Markdown or MDX, edit metadata, manage media,
configure the site, preview changes, receive repairable diagnostics, and publish
static output with a button. That product should be backed by a headless studio
core that can also power a CLI and an MCP server. Git hosts, deploy providers,
build logs, API keys, OAuth flows, branches, previews, and cache invalidation
should eventually feel like implementation details behind clear product actions
such as “Save draft,” “Preview,” “Submit for review,” “Publish,” and “Rollback.”

That product must not become a separate CMS model. The studio should consume the
same site workspace contracts, schemas, compiler artifacts, route registry,
diagnostics, media policies, metadata profiles, deployment adapters, and
generated-output contracts as the CLI, MCP server, and CI. The platform compiler
is the source of truth; GUI, CLI, MCP, and CI are interfaces over it.

The detailed product vision is owned by
[STUDIO_PRODUCT_VISION.md](../studio/STUDIO_PRODUCT_VISION.md). The provider and
adapter architecture is owned by
[STUDIO_ADAPTER_MODEL.md](../studio/STUDIO_ADAPTER_MODEL.md). The focused studio
architecture and publication workspace decision is owned by
[STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md](../studio/STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md).
The extension model is owned by
[STUDIO_EXTENSION_MODEL.md](../studio/STUDIO_EXTENSION_MODEL.md). This roadmap
summarizes their implications and sequences the work; it should not duplicate
every product, adapter, workspace, or extension detail.

The end-state user paths are:

1. **Author path:** open the studio, create or edit an article, use a real-time
   Markdown/MDX editor, see author-language diagnostics, preview the page and
   generated artifacts, and submit or publish without learning Git.
2. **Site-owner path:** configure identity, theme, navigation, support links,
   social links, homepage surfaces, redirects, metadata, collections, and deploy
   providers through validated forms with sensible defaults.
3. **Developer path:** extend schemas, compiler domains, view models,
   diagnostics, components, and adapters so the studio automatically gains new
   safe authoring capabilities.
4. **Operator path:** connect provider accounts or credentials once, then let
   the platform manage previews, builds, deploys, rollbacks, cache policy, and
   release reports through explicit deployment adapters.
5. **Automation path:** use a CLI or MCP server to run the same diagnostics,
   previews, source edits, release reports, deploy proposals, and gated publish
   actions without creating a second implementation of studio behavior.

## Studio Product Model

The mature studio supports three product modes through the same compiler
contracts.

1. **Default local publisher:** a non-technical user writes, previews,
   publishes, unpublishes, restores versions, and manages media without learning
   Git, CI, frontmatter, build artifacts, or deploy-provider mechanics. This is
   the baseline product experience, not a simplified afterthought.
2. **Collaborative static publication:** a TPM-like publication can keep site
   content in a separate repo or workspace, collaborate through GitHub or other
   sync/review tools, store media in the repo or another provider, and deploy
   through Cloudflare or another deploy adapter. Platform source remains
   separate from site source.
3. **Complex publisher:** a large publication, archive, institution, or
   organization can connect its own source, media, identity, workflow, build,
   deploy, and observability systems through adapter seams instead of being
   forced into TPM's workflow.

The product vocabulary should stay editorial: save draft, preview, check,
publish, unpublish, roll back, restore version, add image, fix issue, and
connect provider. Terms such as branch, commit, pull request, CI, build
artifact, and cache invalidation belong in advanced details or provider-specific
adapters.

Publishing is a product action, not a Git action. Review is an optional
workflow policy. Repo-local assets are one media adapter, not the media model.
Cloudflare is one deploy adapter, not the deploy model. GitHub is one
source/history/review provider, not the source of truth.

The product should support a progressive adoption ladder: instant solo
publishing, domain configuration, backup/history, media externalization,
collaboration, automated publishing, and complex publisher integration. Each
step should add or migrate one capability without forcing a site rebuild.

The adapter model must cover:

1. source adapters;
2. history adapters;
3. media adapters;
4. workflow adapters;
5. build adapters;
6. deploy adapters;
7. identity and credential adapters;
8. diagnostics and observability adapters.

Each adapter reports capabilities, required credentials, dry-run behavior,
reversibility, source/output ownership, and diagnostics. GUI, CLI, MCP, and CI
must use the same capabilities so unsupported operations are hidden, rejected
early, or routed through explicit escape hatches.

Milestone planning implication:

1. Foundation milestones should define source, artifact, route, diagnostics,
   docs, metadata, media, and verifier contracts before studio surfaces depend
   on them.
2. Product-tooling milestones should design the studio core, author
   diagnostics, generated references, release reports, and provider capability
   contracts before implementing a GUI, CLI, or MCP surface.
3. Provider-specific milestones should follow provider-agnostic contracts.
   Cloudflare, Git, GitHub, and repo-local media are important adapters, not
   core assumptions.
4. GUI, CLI, and MCP milestones should be treated as interfaces over the same
   studio core. They should not create separate source, workflow, diagnostics,
   or publish models.
5. Extension milestones should make defaults replaceable. Cloudflare deploy,
   Git/GitHub backup, GitHub Pages/CNAME, PDF generation, support CTAs,
   provider embeds, and custom UI components should be modeled as bundled or
   optional capabilities rather than global platform patches.

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
- The future studio product is implied by schemas and diagnostics, but the
  roadmap must keep it explicit so earlier contracts are designed for real-time
  preview, GUI forms, publish workflows, provider connectors, and non-technical
  repair paths.

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
- **Tooling discipline:** local scripts, CI jobs, linters, compilers, test
  scopes, ignore files, and generated artifacts are fast, intentional,
  documented, and reproducible.
- **Configurability:** publication-specific choices live in site config,
  content, theme, or explicit adapters rather than hard-coded platform logic.
- **Studio readiness:** schemas, diagnostics, route previews, media policy,
  deployment actions, and documentation are structured enough for future GUI
  forms and real-time authoring workflows.
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
    -> source workspace, media library, history, and provider credentials
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
  -> studio core
    -> source, media, history, workflow, build, deploy, identity, and diagnostics adapters
    -> real-time preview, publish orchestration, rollback, and provider capability model
  -> GUI, CLI, and MCP interfaces over the same studio core
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
  metadata, feeds, PDFs, search indexes, and assets as API contracts;
- schema-driven editing, preview, diagnostics, media management, and deployment
  orchestration for a future static blog studio.

The platform should not try to become:

- a general drag-and-drop page builder detached from the static publishing
  model;
- a runtime CMS that requires server state;
- a SPA framework;
- a theme marketplace at the expense of author simplicity;
- a generic component library detached from the editorial publishing domain.

The eventual GUI product can be comprehensive without violating these
boundaries. It should be comprehensive inside the static editorial publishing
domain: content editing, MDX-aware fallbacks, media, metadata, redirects,
collections, homepage surfaces, previews, diagnostics, releases, deploys, and
rollbacks. It should not broaden into arbitrary website construction unless the
core platform deliberately expands beyond static blog publishing.

The studio should also avoid overfitting to the current TPM operations model.
Git-backed review, repo-local images, and Cloudflare deploys are important
adapters because TPM needs them, but the platform should represent them as
replaceable implementations of source, media, history, workflow, build, and
deploy contracts.

TPM should remain the production proving ground. Generality should be proven
through the docs site, fixture sites, starter templates, and future second
consumers, not by weakening TPM's concrete editorial design.

## Portability Model

Not every domain should have the same portability target. Some code should stay
TPM-specific. Some should become site-agnostic platform behavior. Some domains
may be valuable far beyond Astro, this repo, or even websites.

Use this portability gradient when designing a domain:

1. **Site-specific:** valid only for the TPM publication instance. Examples:
   TPM content, branding, copy, support/social accounts, theme overrides, and
   editorial homepage choices.
2. **Platform-specific:** reusable across site instances built by this
   publishing platform, but still tied to its opinionated editorial model.
   Examples: publishable entries, collections, article endcaps, route features,
   homepage surfaces, and layout recipes.
3. **Astro-specific adapter:** reusable across Astro sites or Astro-based
   platform instances. Examples: content collection loaders, Markdown/MDX
   transforms, Astro image adapters, Astro head rendering, and Astro component
   wrappers.
4. **Framework-agnostic core:** reusable from Astro, Next, scripts, CLIs,
   workers, tests, or non-web renderers. Examples: citation normalization,
   semantic metadata graph construction, diagnostics, route manifests, media
   policy decisions, share URL construction, and generated-output validation
   rules.
5. **Environment-agnostic core:** pure logic that avoids filesystem, DOM,
   process, network, framework, and runtime assumptions. It can run in Bun,
   Node, browsers, Workers, tests, or future tools with thin adapters.
6. **Product-agnostic library:** useful beyond editorial publishing. These
   should be rare and proven. Candidates may include structured diagnostics,
   anchored positioning math, schema-to-doc tooling, or citation utilities if
   they mature beyond the publication domain.

The preferred shape for portable domains is:

```text
pure core
  -> environment adapter
  -> framework adapter
  -> Astro integration or Astro components
  -> platform integration
  -> TPM site instance
```

For example, bibliography should not begin as an Astro-only feature. The
long-term shape could be:

```text
citation parser / source model / exporters
  -> DOI or external lookup adapter
  -> Markdown/MDX transform adapter
  -> Astro bibliography integration
  -> article/site bibliography UI
  -> TPM citation audit workflow
```

This keeps the valuable core reusable while allowing TPM and the platform to
remain opinionated at the integration layer.

Portability should be deliberate, not automatic. Before making a domain more
generic, ask:

- What exact non-TPM or non-Astro consumer is plausible?
- Which part is pure domain logic, and which part is Astro/site/UI glue?
- Can the core avoid `siteConfig`, `process.cwd()`, DOM APIs, Astro imports,
  Tailwind classes, filesystem reads, and browser globals?
- What adapters would be needed for Astro, CLI, browser, Workers, or Next?
- Would generalizing this make the current TPM product weaker or harder to
  maintain?
- Can tests prove the core without TPM content or Astro rendering?

The answer may be "do not generalize yet." That is acceptable. The important
thing is to assign each domain an explicit portability target so boundaries do
not accidentally lock useful logic into one framework or one publication.

Strong portability candidates:

| Domain                         | Likely portable core                                                                                | Likely adapters/products                                                               |
| ------------------------------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Citations and bibliography     | Source model, parser, normalizer, duplicate detection, BibTeX/RIS/CSL export, citation diagnostics  | Markdown/MDX transform, Astro integration, article bibliography UI, citation-audit CLI |
| Structured diagnostics         | Diagnostic codes, severities, source locations, remediation, JSON output                            | CLI formatter, CI reporter, future GUI diagnostics, verifier integration               |
| Metadata and semantic profiles | Schema.org graph builders, Open Graph/Twitter/Scholar data models, metadata validation              | Astro head adapter, Next metadata adapter, feed adapter, metadata audit CLI            |
| Generated-output verification  | Static artifact contracts, link/route/metadata/feed/PDF/cache validation rules                      | Astro/static-site adapter, Cloudflare adapter, CI CLI, observability importer          |
| Media policy                   | Media role decisions, alt/caption policy, social image constraints, PDF compatibility, size budgets | Astro image adapter, PDF adapter, embed provider adapters, asset audit CLI             |
| Route/entity manifests         | Canonical route model, entity relationships, redirects, visibility surfaces                         | Astro route adapter, sitemap/feed/search adapter, GUI route preview                    |
| Anchored interactions          | Placement math, disclosure state machines, focus/escape rules                                       | DOM adapter, Astro script adapter, React/Next hook adapter                             |
| Config/schema documentation    | Schema metadata, generated references, editor labels, repair hints                                  | Site config docs, GUI form generation, docs-site renderer                              |
| Editorial workflow state       | Draft/review/publish states, validation gates, preview state, publish actions                       | GUI editor, Git adapter, deploy adapter, review workflow CLI                           |
| Studio preview model           | Preview manifests, dirty-state tracking, generated artifact status, diagnostic mapping              | Local preview server, browser studio, CLI/MCP preview tools, cloud preview worker      |
| Studio action model            | Source edit commands, dry-run diffs, validation gates, publish proposals, audit events              | GUI actions, CLI commands, MCP tools, Git/deploy adapters                              |
| Performance workbench          | Budget models, payload diffing, cache policy checks, metric reports                                 | Lighthouse/Unlighthouse adapters, CI reporter, static report UI                        |
| Import/export and migration    | Canonical content/archive manifests, migration diagnostics, source maps                             | WordPress/Substack/static HTML importers, author review UI, migration CLI              |

Domains that should usually stay platform- or site-specific:

- TPM branding, theme, support CTAs, and homepage editorial composition.
- Article list visual style and reading-layout recipes, unless a second
  platform consumer proves a stable API.
- Full publishing platform orchestration, which should stay opinionated rather
  than becoming a vague site-builder framework.

## Roadmap Dependency Model

The roadmap is easiest to understand as six layers.

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
6. **Studio product systems:** GUI editing, real-time preview, media
   management, diagnostics, provider connection, publish orchestration,
   rollback, and non-technical site-owner workflows.

Work should generally move from lower layers to higher layers. Later layers can
be designed early, but implementation should avoid guessing at unfinished lower
contracts. The phases below are dependency layers, not a waterfall: shared
contracts should land before broad consumers, while design work for later
systems can begin early when it clarifies lower-level requirements.

## Roadmap Preflight: Tooling And Repo Health Baseline

**Goal:** make the QA foundation fast, scoped, reproducible, and trustworthy
before large platform refactors begin.

This preflight is part of the roadmap even though it does not change product
behavior. The planned roadmap depends on strong guardrails. If the linter,
compiler, tests, generated-output verifiers, fix scripts, ignore files, or CI
jobs are noisy, slow, overbroad, under-scoped, or hard to reproduce locally,
later platform work will be slower and riskier.

Current evidence:

- The QA pipeline is powerful but complex: linting, formatting, type checks,
  Astro diagnostics, unit/component/e2e/a11y/performance tests, markdown review,
  generated-output verification, security checks, and release checks all exist.
- CI has caught issues that should ideally be reproducible through a documented
  local command.
- Some tools may be scanning generated output, reports, caches, downloaded
  artifacts, fixture output, or other files that are not meaningful source
  inputs.
- Long-running checks may be doing work that belongs only in release or CI
  gates rather than fast local feedback.

Mature contract:

- Every script has a clear role: fast local check, focused domain check,
  mutation/fix command, release check, CI-only check, or investigation tool.
- Local release commands match CI closely enough that CI failures are
  reproducible without guessing.
- Tool scopes are explicit and justified. Linters, formatters, type checkers,
  markdown checks, HTML validators, and scanners ignore generated artifacts,
  caches, reports, dependency folders, and intentionally parked files unless a
  tool explicitly owns those paths.
- Ignore files are consistent across Git, formatters, linters, test runners,
  asset scanners, generated-output verifiers, and CI.
- Slow checks are either made faster, split into focused and release modes, or
  documented as intentionally heavy.
- The QA pipeline catches representative failures through probes or fixtures,
  so scope reductions do not silently reduce coverage.

Work:

- Audit `package.json` scripts, CI workflows, lint/format configs, TypeScript
  configs, Astro configs, Playwright configs, markdown/html validators, security
  checks, generated-output verifiers, coverage settings, and Git ignore files.
- Classify scripts by purpose and expected runtime. Remove or document obsolete
  scripts and make command names reflect their actual scope.
- Identify overbroad scans and tighten globs/excludes for generated files,
  build output, reports, caches, fixture output, downloaded artifacts,
  screenshots, coverage output, dependency folders, and parked unused assets.
- Compare local commands against CI commands and document the exact local
  reproduction path for every CI gate.
- Add or update `COMMANDS.md` and related docs so developers know which
  command to run while editing, before handoff, before release, and during CI
  failure triage.
- Measure before/after runtime for expensive checks where practical.

Tooling to add or strongly consider:

- **Script registry:** a machine-readable manifest for scripts with purpose,
  expected runtime, validation/mutation behavior, inputs, outputs, CI usage,
  owner domain, and whether the script is fast, focused, release-level,
  CI-only, or investigative.
- **CI/local parity checker:** compares GitHub Actions commands, `package.json`
  scripts, and docs so every CI gate has a local reproduction command or a
  documented CI-only reason.
- **Tool-scope verifier:** asserts that source paths remain covered while
  generated artifacts, caches, reports, dependency folders, and parked files are
  excluded for explicit reasons.
- **Diagnostic diff harness:** runs old and new versions of a verifier, linter,
  scanner, or script and compares diagnostic codes, files, severities, and
  counts before a scope or implementation change lands.
- **Failure-probe fixtures:** intentionally bad fixture inputs that prove each
  major QA layer still catches representative failures: bad frontmatter, bad
  links, missing alt text, invalid metadata, broken redirects, unsafe embeds,
  malformed citations, oversized assets, layout overflow, and invalid generated
  artifacts.
- **Generated artifact manifest checker:** verifies that every emitted public
  artifact has an owner, source, route or policy, cache role, crawler role, and
  expected verification path.
- **Package and import boundary checker:** prevents site-specific code from
  leaking into platform core, Astro adapters from leaking into pure logic, UI
  from importing filesystem/process code, and test-only helpers from becoming
  production APIs.
- **Performance and payload diff reporter:** records route-level JavaScript,
  CSS, image, font, PDF, and HTML payload changes, cache headers, and key
  Lighthouse/Unlighthouse metrics against a baseline.
- **Release health report:** summarizes changed routes, changed generated
  artifacts, redirects, metadata, PDFs, payload deltas, dependency/security
  status, known warnings, deploy readiness, and manual follow-up items.
- **Schema/docs drift generator:** generates or checks references from
  frontmatter, site config, route, feature, metadata, and extension schemas so
  docs drift is caught automatically.

Tooling sequence:

- **Preflight first:** build or formalize the script registry, CI/local parity
  checker, tool-scope verifier, diagnostic diff harness, and failure-probe
  fixture pattern before major roadmap refactors. These are the tools that make
  QA cleanup safe.
- **Phase 1 source contracts:** build the generated artifact manifest checker
  as source/artifact lifecycle work matures, then use it to declare ownership
  for routes, assets, feeds, PDFs, redirects, headers, and generated public
  files.
- **Phase 2 output engines:** extend the diagnostic diff harness and failure
  probes into verifier-module tests as metadata, references, media/PDF, search,
  feeds, and generated-output checks become more modular.
- **Phase 3 presentation and performance:** build the performance and payload
  diff reporter alongside the performance workbench, and expand visual/layout
  probes alongside the component catalog and interaction primitives.
- **Phase 4 product tooling:** build the release health report, schema/docs
  drift generator, and domain ownership reports when site doctor, public docs,
  observability, and author diagnostics consume the same schemas and
  diagnostics.
- **Phase 5 distribution:** add package/import boundary checks before internal
  package boundaries or extension points are treated as stable, and expand
  public API/doc freshness reports before publishing reusable packages or Astro
  integrations.
- **Phase 6 studio product:** add provider-adapter QA, preview/build parity,
  credential-boundary checks, and editor round-trip probes before any GUI
  publish workflow is considered production-ready.

Tooling to investigate during the audit:

- mutation testing for pure domain logic where normal coverage can be
  misleading;
- property-based tests for route, slug, visibility, metadata, citation, media,
  cache, and share-target invariants;
- visual regression tooling beyond the current component catalog and Playwright
  invariants;
- static dependency graph analysis for package-boundary planning;
- code ownership or domain ownership reports based on source paths and
  generated-output contracts;
- docs freshness and public API report tooling for future package extraction;
- local watch-mode orchestration for fast author/developer feedback;
- hosted or saved QA dashboards for release history, payload growth,
  accessibility drift, and crawler/SEO health.

Safe migration model:

1. **Inventory before changing scope.** Record each tool, its input globs, its
   ignore rules, its CI usage, and the bug classes it is expected to catch.
2. **Characterize current coverage.** Capture the current command output and
   runtime for important checks before changing configs.
3. **Add failure probes before narrowing.** For each tightened tool scope, keep
   or add a small source fixture that should fail if the check stops covering
   its intended domain.
4. **Run old and new scopes in parallel when risk is high.** Temporarily compare
   diagnostics from the current command and the proposed scoped command, then
   document intentional differences before deleting the old path.
5. **Diff diagnostics, not just exit codes.** A faster command is only valid if
   removed diagnostics are irrelevant, duplicated elsewhere, or explicitly
   deferred.
6. **Keep release checks conservative.** Fast local checks can be narrower, but
   release checks should retain broad public-output coverage until replacement
   verifiers prove equivalent or better protection.
7. **Make exclusions visible.** Any ignored path class should have a reason:
   generated output, external dependency, cache/report artifact, intentionally
   parked source, or separately verified artifact.
8. **Protect against regression.** Add tests or script assertions for tool
   config where practical, especially for ignore lists, script taxonomy,
   generated-artifact ownership, and CI/local command parity.

Verification:

- Script taxonomy and docs match `package.json`.
- Local release command reproduces CI gates or clearly documents CI-only
  exceptions.
- Lint, format, markdown, type, Astro, HTML, generated-output, and test scopes
  exclude irrelevant artifacts without dropping source coverage.
- Probe fixtures prove representative lint/type/markdown/generated-output
  failures are still caught.
- Before/after runtime and diagnostic diffs are recorded for scoped or split
  checks.
- `just review-markdown` and the final selected release command pass
  after cleanup.

## Phase 1: Source Contracts

### 1. Source And Artifact Lifecycle

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

### 2. Platform Context And Site Config Contract

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

### 3. Canonical Route, Feature, And Entity Registry

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

### 4. Article Compiler Artifact

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

### 5. Publishable Entry And Visibility Model

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

### 6. Route-Level View Models

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

### 7. Metadata, Semantics, Search, And Scholarly Engine

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

### 8. References, Citations, And Bibliography Domain

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

### 9. Media, Image, Embed, And PDF Policy Engine

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

### 10. Generated-Output Verifier Architecture

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

### 11. UI Primitives, Layout Recipes, And Component Catalog

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

### 12. Progressive Interaction Primitives

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

### 13. Performance, Payload, And Cache Workbench

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

### 14. Site Doctor And Author Diagnostics

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

### 15. Documentation System And Public Platform Docs

**Goal:** keep docs useful without creating stale parallel truth.

Current evidence:

- Root docs, `site/README.md`, public docs-site notes, platform module docs,
  command docs, audits, and generated schema already exist.
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

### 16. Test Matrix And Correctness Strategy

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

### 17. Observability And Webmaster Intelligence

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

### 18. Authoring Studio Readiness

**Goal:** make a future static blog studio a natural consumer of existing
platform contracts.

Current evidence:

- Site config, schemas, diagnostics, content collections, and author docs point
  toward a GUI, but editor workflows are not yet modeled.

Mature contract:

- The GUI does not invent a parallel CMS model. It edits the same site
  workspace source model and consumes the same schemas, diagnostics, route
  previews, and generated-output contracts as the CLI, MCP server, and CI.
- The editor can round-trip Markdown and MDX without destroying author intent.
- The studio can explain platform errors in author language and link each issue
  to a repairable field, file, asset, route, or generated artifact.
- Real-time preview, form editing, media management, and publish actions all
  compile through the same platform contracts.
- Provider details such as Git branches, commits, PRs, API keys, OAuth,
  Cloudflare projects, preview URLs, and deploy logs are modeled as typed
  adapters and product actions, not scattered UI state.

Work:

- Define editor-facing models for articles, announcements, pages, collections,
  authors, categories, redirects, support links, social links, feature flags,
  theme tokens, and asset metadata.
- Model draft, direct publish, optional review, unpublish, rollback, and
  scheduled-publish workflows as typed states.
- Design provider-neutral source, history, workflow, media, build, and deploy
  capability contracts before provider-specific Git, GitHub, Cloudflare, or
  repo-local media implementations.
- Design Git and GitHub workflows only as adapters over those contracts:
  branch creation, commit summary, pull request body, author diagnostics, and
  preview links should be provider mechanics, not the studio product model.
- Define a real-time preview contract that maps dirty editor state to route
  previews, article compiler artifacts, diagnostics, generated metadata, media
  fallbacks, and PDF eligibility without requiring a full production deploy.
- Define MDX component editing and fallback rules: which components can be
  edited visually, which are code-only escape hatches, and how PDF/search/feed
  fallbacks are surfaced to authors.
- Design provider-connection models for Git hosts, static deploy hosts, asset
  storage, analytics imports, and future identity providers.

Verification:

- State-machine tests for editorial workflows.
- Schema-generation tests for editor forms.
- Fixture diagnostics proving GUI output matches CLI output.
- Round-trip tests for Markdown, MDX, frontmatter, collections, redirects,
  media metadata, and site config.
- Provider adapter tests with mocked source, history, workflow, media, build,
  and deploy providers.

## Phase 5: Distribution And Ecosystem Readiness

### 19. Internal Package Boundaries And Extraction Candidates

**Goal:** make reusable subdomains portable before publishing anything
externally.

Current evidence:

- Several domains are already close to standalone packages: metadata profiles,
  article references, generated-output verifiers, config/site-doctor, route
  registry, media/social images, PDF/scholarly output, interaction primitives,
  and component catalog tooling.
- Some of those domains should only become Astro/platform modules, while
  others have plausible framework-agnostic or environment-agnostic cores.

Mature contract:

- Mature domains expose public interfaces and hide implementation details.
- Internal entrypoints prove boundaries before external publication.
- Extraction happens only after docs, tests, fixtures, versioning expectations,
  and at least one non-TPM consumer exist.
- Each candidate declares a portability target:
  site-agnostic platform module, Astro library, Astro integration,
  framework-agnostic core, environment-agnostic core, CLI tool, or broader
  product-agnostic library.
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
- Identify framework-agnostic cores before writing Astro adapters, especially
  for citations, metadata, diagnostics, media policy, route manifests,
  generated-output verification, and interaction state machines.
- Require each candidate to document its public API, diagnostics, fixtures,
  package boundary, current consumers, and missing blockers before extraction.

Verification:

- Import boundary checks.
- Package-level unit tests.
- Example site builds against package entrypoints.
- Candidate tests run pure cores without `site/`, Astro, DOM, filesystem, or
  process assumptions when the declared portability target requires it.

### 20. Extension Architecture

**Goal:** let future features extend the platform through deliberate extension
points instead of patching global files.

Mature contract:

- Core compiles, validates, verifies, loads extensions, and owns trust
  boundaries. Extensions add capabilities.
- Extensions declare capabilities, dependencies, feature flags, diagnostics,
  generated outputs, docs hooks, and static-output constraints.
- Extensions can add content kinds, metadata profiles, route modules, verifier
  modules, article compiler transforms, media policies, catalog fixtures,
  deployment adapters, UI components, artifact generators, importers,
  migrations, and author diagnostics.
- Official bundled extensions provide tasteful defaults without becoming core
  assumptions.
- Optional official, site, and third-party extensions use the same manifest and
  capability model with stricter permission boundaries as trust decreases.
- Custom UI components declare editor schema, static render behavior, preview
  behavior, PDF/search/feed fallbacks, accessibility expectations, hydration
  policy, required assets, and diagnostics.
- Artifact extensions such as PDF generation declare output ownership,
  metadata, media fallback policy, size budgets, cache/crawler policy, and
  verifier rules.

Work:

- Define typed extension manifests.
- Classify existing feature domains as core, essential bundled extension,
  optional official extension, site extension, or third-party/custom extension.
- Shape current candidates around extension-like contracts before extraction:
  Cloudflare deploy, GitHub Pages and `CNAME`, Git/GitHub source/history,
  repo-local media, PDF generation, Google Scholar metadata, citations,
  bibliography, support CTAs, Patreon/Discord/YouTube buttons, embeds, RSS,
  sitemap, search, social images, and importers.
- Add fixture extensions that prove enabled and disabled states.
- Enforce import boundaries so extensions cannot reach forbidden layers.
- Add extension migration hooks for adoption-ladder transitions such as local
  source to Git backup, repo-local media to external media, direct publish to
  review workflow, and local publish to automated publish.

Verification:

- Type tests and fixture builds.
- Generated-output verifier asserts extension-owned artifacts are declared.
- Capability-driven UI/CLI/MCP tests prove unsupported extension actions do not
  appear as available.
- Security and trust tests prove extensions cannot access undeclared
  credentials, filesystem paths, generated artifacts, scripts, styles, or
  external origins.
- Migration dry-run tests prove extension migrations report affected source,
  generated artifacts, diagnostics, and rollback guidance.

### 21. Deployment Adapters And Release Governance

**Goal:** make deployment policy host-portable while keeping TPM's Cloudflare
choice cleanly configured.

Current evidence:

- The current deployment targets Cloudflare Workers Static Assets with redirects
  and cache headers.
- Future platform users may need Cloudflare Pages, GitHub Pages, Netlify, S3, or
  generic static-folder output.
- Domain setup is partly external. The platform can store the intended
  canonical domain, generate domain-dependent artifacts, and emit provider
  files such as GitHub Pages `CNAME`, but DNS configuration remains external
  unless the selected adapter explicitly supports it.

Mature contract:

- Redirects, headers, cache policy, trailing slash behavior, robots, feeds,
  sitemap, PDFs, and static assets are expressed through deployment adapters
  backed by the same output contracts.
- Releases include route, redirect, metadata, payload, dependency, and manual
  launch-step reports.
- Future studio publish actions can call deployment adapters without exposing
  host-specific details to non-technical users.
- Domain-related behavior is capability-driven: configured canonical domain,
  provider-owned domain verification, DNS instructions, `CNAME` output,
  preview URLs, and production URLs are separate concepts.

Work:

- Define deployment adapter interfaces.
- Implement Cloudflare Workers Static Assets first as the reference adapter.
- Implement GitHub Pages as a deploy adapter candidate with explicit `CNAME`
  ownership when that provider is enabled.
- Add host-portable adapters as fixture-backed platform work.
- Define versioning, changelog, migration, deprecation, and compatibility
  policy for platform APIs, site config, frontmatter, output, and routes.
- Model preview deploys, production deploys, rollback, cache invalidation,
  publish status, provider diagnostics, domain status, DNS instructions, and
  launch checklists as adapter outputs.

Verification:

- Header/redirect/cache verifier tests per adapter.
- Fixture builds for at least two adapters before declaring portability mature.
- Release health report snapshots.

### 22. Security, Privacy, And Trust Policy

**Goal:** make static publishing safe by default without hiding tradeoffs.

Mature contract:

- Security headers, CSP targets, third-party origins, trusted HTML, raw embeds,
  Markdown/MDX escape hatches, JSON-LD, citation URLs, external CTAs, share
  links, downloaded assets, analytics, and dependency posture are named trust
  boundaries.
- Authors get diagnostics when content introduces new third-party origins or
  privacy-sensitive behavior.
- Future studio credentials, OAuth grants, API keys, deploy tokens, webhooks,
  analytics imports, and provider logs have explicit trust boundaries and never
  leak into generated static output.

Work:

- Define security header and CSP targets for platform output.
- Add third-party origin and embed trust diagnostics.
- Document dependency, lockfile, third-party script, asset provenance, and
  secret-scanning policy.
- Define credential-storage and provider-connection expectations for the future
  studio before any GUI publish workflow is implemented.

Verification:

- Security-header verifier tests.
- CSP smoke tests against embeds.
- Dependency/security audit in release checks.

### 23. Import, Export, Migration, And Portability

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

### 24. Localization And Inclusive Defaults

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

### 25. Starter Templates And Distribution

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

## Phase 6: Static Blog Studio Product

### 26. Comprehensive Static Blog Studio

**Goal:** turn the platform into a non-technical, GUI-based static blog CMS
without weakening the static compiler model.

Current evidence:

- Schemas, diagnostics, content collections, site config, route helpers,
  generated-output verification, author docs, and deployment scripts already
  point toward a studio.
- The current workflow still assumes technical comfort with files, Git, Bun,
  preview servers, CI, Cloudflare, and build logs.

Mature contract:

- A site owner can create and maintain a static blog from one application:
  content editing, site config, theme choices, navigation, homepage surfaces,
  collections, announcements, redirects, metadata, media, previews, diagnostics,
  deploys, and rollback.
- The GUI, CLI, and MCP server all use the same headless studio core for source
  edits, diagnostics, previews, generated-output checks, release reports,
  deploy proposals, and publish/rollback workflows.
- The headless studio core is implemented Rust-first where practical. Rust
  owns durable operation contracts, diagnostics, workspace/source models,
  release reports, CLI behavior, MCP behavior, and the future Tauri backend;
  Astro and TypeScript remain renderer/frontend adapters where they are the
  right tools.
- Authors can use a real-time WYSIWYG or split-view Markdown/MDX editor while
  the platform preserves source fidelity and exposes code escape hatches only
  when needed.
- The studio edits the same source model as the CLI and MCP server. It never
  stores canonical content in a separate database that can drift from the static
  site source.
- Provider accounts are connected through explicit adapters. Users should not
  need to understand GitHub, branches, PRs, Cloudflare projects, cache headers,
  or deploy logs unless they choose to inspect advanced details.
- Every publish action produces deterministic source changes, generated-output
  checks, preview output, release reports, and deploy artifacts.
- CLI and MCP write operations default to dry-run/proposed-diff behavior unless
  an explicit trusted workflow grants a narrow write scope.

Milestone 6 design packets:

- [`STUDIO_EDITING_SURFACES.md`](../../docs/studio/STUDIO_EDITING_SURFACES.md) owns the
  schema-driven editing, media, metadata, preview, MDX/source-view, and
  extension-surface design.
- [`STUDIO_PROVIDER_CAPABILITY_MATRIX.md`](../../docs/studio/STUDIO_PROVIDER_CAPABILITY_MATRIX.md)
  owns provider capabilities, unsupported-operation behavior, adapter
  sequencing, and Milestone 10 runtime handoff.
- [`STUDIO_PUBLISH_WORKFLOWS.md`](../../docs/studio/STUDIO_PUBLISH_WORKFLOWS.md) owns
  provider-backed publish, rollback, credential, permission, audit, and release
  workflow design.
- [`HEADLESS_STUDIO_CORE_CONTRACT.md`](../../docs/studio/HEADLESS_STUDIO_CORE_CONTRACT.md)
  owns the shared operation core and GUI/CLI/MCP/CI interface adapter
  contract.
- [`STUDIO_PROGRESSIVE_ADOPTION_PATHS.md`](../../docs/studio/STUDIO_PROGRESSIVE_ADOPTION_PATHS.md)
  owns migration and upgrade paths from simple local publishing to complex
  provider-backed workflows.
- [`CLI_PRODUCT_CONTRACT.md`](../../docs/cli/CLI_PRODUCT_CONTRACT.md) owns the future
  `tpm` command language, output contracts, safety classes, and workspace
  discovery behavior.
- [`STUDIO_MCP_SAFETY_MODEL.md`](../../docs/studio/STUDIO_MCP_SAFETY_MODEL.md) owns MCP
  resources, tools, permissions, plan/apply gates, redaction, and agent safety.
- [`STUDIO_PRODUCT_TEST_PLAN.md`](../../docs/studio/STUDIO_PRODUCT_TEST_PLAN.md) owns the
  mocked-provider product test matrix.
- [`STUDIO_PARITY_FIXTURE_STRATEGY.md`](../../docs/studio/STUDIO_PARITY_FIXTURE_STRATEGY.md)
  owns GUI/CLI/MCP/CI parity fixture strategy.

Work:

- Define the studio product architecture: local app, hosted app, desktop app,
  or hybrid model; account connection model; preview/build execution model; and
  publication workspace model.
- Define a headless studio core with explicit interfaces for source reads,
  source edits, diagnostics, preview builds, generated artifacts, release
  reports, provider actions, audit logs, and credential scopes.
- Add the Rust migration foundation described in
  [`RUST_MIGRATION_AND_CLI_PLAN.md`](../rust/RUST_MIGRATION_AND_CLI_PLAN.md):
  workspace crates, strict Rust QA, `just` orchestration, parity tests, CLI
  operation boundaries, Tauri reuse, and MCP reuse.
- Use
  [`CLI_RUST_GUI_INTEGRATION_PLAN.md`](./CLI_RUST_GUI_INTEGRATION_PLAN.md) as
  the coordination plan for CLI, Rust migration, MCP, and the Tauri/Astro GUI.
  The sequencing is: Rust operation core, CLI vertical slice, dual-run script
  migrations, adapter contracts, Tauri/Astro command-binding spike, studio
  authoring/preview, publish/release workflows, MCP automation, then packaging
  and extraction.
- Design CLI workflows for developer, CI, migration, automation, preview,
  publish, rollback, and release-report tasks. The CLI should expose the same
  domain actions as the studio instead of becoming a script wrapper around
  unrelated commands.
- Design an MCP server that gives agents safe access to the same platform
  services with read-only defaults, dry-run diffs, scoped writes, secret
  redaction, audit logs, and gated provider-backed actions.
- Build schema-driven editing surfaces for content, frontmatter, site config,
  redirects, navigation, homepage slots, collections, media, metadata profiles,
  deployment settings, and feature flags.
- Add editor experiences for common Markdown, article images, citations,
  footnotes, embeds, MDX components with visual fallbacks, and raw-code escape
  hatches.
- Add preview orchestration that can update route previews quickly while still
  using the platform compiler and diagnostics.
- Add publish orchestration over source, history, workflow, build, and deploy
  adapters: save draft, create preview, publish directly when policy allows,
  submit for review when configured, deploy, rollback, and view release health.
- Add product-level permission, audit, credential, and recovery models before
  supporting multi-user or hosted operation.

Verification:

- End-to-end product tests for non-technical author and site-owner journeys.
- Golden source-diff tests proving studio edits produce expected file changes.
- Output-parity tests proving GUI, CLI, MCP, and CI-generated changes consume
  the same source contracts and produce equivalent output.
- MCP safety tests for read-only defaults, dry-run proposals, blocked unsafe
  writes, credential redaction, audit logging, and gated publish actions.
- Provider-adapter tests using mocked Git, preview, deploy, auth, and rollback
  flows.
- Accessibility, keyboard, autosave, offline/error recovery, and data-loss
  tests for the editor.
- Security tests for credential handling, generated-output leakage, provider
  scopes, and publish authorization.

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
12. **Studio product checks** prove future GUI safety: schema-to-form parity,
    Markdown/MDX round trips, preview/build parity, provider-adapter mocks,
    publish/rollback workflows, credential-boundary tests, and non-technical
    repair-flow journeys.
13. **Tooling health checks** prove QA reliability: script taxonomy, CI/local
    parity, scoped tool inputs, ignored artifact classes, failure probes,
    runtime budgets, diagnostic diffs, artifact manifests, import-boundary
    checks, release reports, and release-gate reproducibility.

Every active milestone should identify:

- the smallest useful fast check developers can run while editing;
- the focused tests that prove the domain contract;
- the release-level checks that prove public output is safe;
- the docs checks that prove the repo teaches the new behavior;
- whether the change needs a tooling-scope comparison before replacing or
  removing an existing check;
- whether the change should update script registry data, generated artifact
  ownership, import-boundary rules, performance baselines, or release-report
  output.

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

## Milestone Breakdown Standard

This roadmap is intentionally written at product-roadmap scale. Before any
milestone becomes active implementation work, it should be broken into a small
set of concrete implementation slices with explicit dependency and verification
fields.

Recommended breakdown:

1. **Milestone scope:** one roadmap milestone or one narrow subdomain inside a
   milestone. It should name the owner domain, user impact, target contract,
   dependency stage, direct blockers, parallel-safe tracks, and exit criteria.
2. **Implementation slice:** one shippable unit of work. It should name
   affected files or modules, source contracts, generated artifacts, tests,
   docs, and expected visible or invisible behavior changes.
3. **Supporting task:** fixture setup, characterization tests, docs updates,
   script changes, migration notes, package-boundary checks, or release-report
   updates.
4. **Regression item:** a discovered invalid state or bug. It should ask why
   the bug was representable and whether a schema, type, policy, recipe, or
   verifier can prevent the class of failure.

Every active implementation slice should include:

- **Start condition:** what upstream contract, fixture, tool, or design packet
  must exist before implementation can begin.
- **Blocked by:** milestones, contracts, source maps, registries, diagnostics,
  or tool reliability work that must land first.
- **Parallel-safe with:** work that can proceed at the same time without
  writing the same source files or inventing duplicate contracts.
- **Conflict zones:** source paths, generated artifacts, public routes, schema
  names, diagnostics, or tests likely to conflict with other active work.
- **Verification:** fast local checks, focused domain tests, generated-output
  checks, browser/a11y/performance checks, docs checks, and release-level
  gates.
- **Exit criteria:** the smallest observable state that proves the milestone
  slice is complete and safe to build on.

The goal is that a milestone can be decomposed without losing the roadmap's
contracts, dependencies, and verification requirements. If a proposed
implementation item cannot state its start condition, blockers, parallel-safe
work, and exit criteria, it should remain in the roadmap until the design
packet is clearer.

## Milestone Readiness Criteria

A roadmap milestone is ready to move into `CHECKLIST.md` only when it has:

- a narrow first implementation slice;
- explicit user impact and non-goals;
- a typed contract or policy target;
- affected source paths and generated output paths;
- pre-change characterization tests where current behavior is risky;
- fixture data when platform generality matters;
- docs that must be updated;
- rollback or compatibility notes when public output may change;
- a QA impact note when it changes scripts, linters, compiler settings,
  generated-output verifiers, CI workflows, ignore files, test scopes, or
  release gates.

Checklist items should be written in this order:

1. Design packet.
2. Pre-change tests or fixtures.
3. Implementation steps in dependency order.
4. Focused verification for the changed domain.
5. Docs update.
6. Release-level verification when the milestone touches build output,
   routing, metadata, performance, accessibility, authoring behavior, or public
   generated artifacts.
7. QA migration notes when a tool scope, script, ignore rule, or CI gate changes
   from the previous behavior.

Avoid generic active checklist items such as “refactor components” or “improve
tests.” Those belong in this roadmap until they are decomposed into files,
contracts, tests, and expected output.

## Dependency Timeline

This timeline is not a calendar. It is the dependency order that should guide
active planning, parallel work, and merge sequencing. Each stage can contain
multiple implementation PRs. A later stage can start design work early, but it
should not merge broad implementation that depends on contracts still being
defined below it.

Implementation can start when a stage's required upstream contracts are stable
enough to consume directly or through fixtures. Design and characterization can
start earlier when it clarifies lower-level requirements. Broad migrations
should wait until their source contracts, diagnostic codes, and verification
probes exist.

### Planning Matrix

Use this matrix when deciding what can start, what must wait, and what can run
in parallel.

1. **Preflight QA tooling.** Start immediately. Blocks large refactors. Can run
   beside isolated bug fixes, docs work, content fixes, fixture additions, and
   roadmap design. Do not merge high-risk scope reductions without probes and
   diagnostic diffs.
2. **Milestones 1 through 3.** Start after preflight design has classified the
   relevant checks. Blocks most broad platform work because these milestones
   define source, config, route, feature, and entity vocabulary. Can be
   designed together; implementation should be sliced so source ownership,
   config context, and registry adoption do not fight over the same files.
3. **Milestone 4.** Start design with milestones 1 through 3, but implement
   after their core contracts are accepted. Blocks publishable entries,
   metadata, references, media/PDFs, and route view models. Characterization
   tests and artifact sketches can run in parallel before the final compiler
   shape lands.
4. **Milestones 5, 6, and the first slice of 10.** Start once route/entity and
   article artifact contracts can be consumed. Blocks consistent homepage,
   archive, taxonomy, feed, search, related-entry, diagnostics, and author-tool
   behavior. Can run in parallel if all tracks use the same publishable model
   and diagnostic type.
5. **Milestones 7 through 9.** Start after shared content, route, visibility,
   compiler artifact, and diagnostic contracts are stable. These can run in
   parallel with shared fixtures, but must coordinate social image, feed,
   search, PDF, Scholar, JSON-LD, bibliography, and media artifact names.
6. **Milestones 11, 12, 13, and 16.** Start characterization and catalog work
   early. Broad migration starts after route view models and component
   contracts are stable enough that UI does not consume raw content shapes.
   These tracks can run in parallel if layout recipes, interaction loading
   policy, payload budgets, and test layers are coordinated.
7. **Milestones 14, 15, 17, and 18.** Start information architecture and UX
   research early. Implementation depends on schemas, diagnostics, source
   maps, route manifests, and generated references. These tracks can run in
   parallel when they consume the same diagnostic and schema sources.
8. **Milestones 19 through 25.** Start design after internal seams have at
   least one real consumer and fixture coverage. Implement incrementally after
   source contracts, output engines, UI recipes, deployment policy, security
   policy, docs, and fixture sites are stable enough to avoid freezing weak
   APIs.
9. **Milestone 26.** Start product research and prototypes early, but treat
   production implementation as blocked by the platform contracts from the
   previous milestones. The studio must consume the compiler, schemas,
   diagnostics, media policy, route registry, deploy adapters, and release
   reports instead of inventing a parallel CMS.

### Stage 0. Preserve The Release Baseline

Purpose:

- Keep the current site releasable while roadmap work proceeds.
- Complete the tooling and repo-health preflight before large structural
  refactors begin.
- Maintain release checks, URL stability, content fidelity, and production
  observability.

Can run at any time:

- isolated bug fixes;
- author docs corrections;
- content-only fixes;
- fixture additions;
- component catalog examples that do not change public APIs;
- small tests around current behavior.

Blocks:

- Large roadmap refactors should wait until the QA/tooling preflight has made
  local checks, CI parity, tool scopes, and release gates trustworthy.
- Small fixes and scoped design work do not need to wait.

Safe parallel work:

- Tooling audit can run alongside roadmap design and isolated bug fixes.
- Actual tool-scope changes should be isolated from product refactors so
  diagnostic changes are easy to review.
- High-risk scope reductions should use the safe migration model: inventory,
  characterize, add probes, compare old and new outputs, document intentional
  differences, and only then remove the old scope.

### Stage 1. Foundation Spine

Milestones:

- Milestone 1: source and artifact lifecycle.
- Milestone 2: platform context and site config contract.
- Milestone 3: canonical route, feature, and entity registry.
- Milestone 4: article compiler artifact.

Purpose:

- Establish source identity, config context, route/entity ownership, and article
  artifact contracts.
- Create the domain language that later output engines, UI, tools, and
  adapters consume.

Blocks:

- publishable entry expansion;
- route view model standardization;
- metadata and search manifests;
- references and bibliography portability;
- media/PDF policy;
- modular generated-output verification;
- site doctor and future GUI tooling;
- deployment adapters and starter templates.

Safe parallel work:

- Milestones 1 and 2 can be designed together and implemented in adjacent
  slices.
- Milestone 3 can be designed alongside 1 and 2, but registry adoption should
  wait until source/config context ownership is clear.
- Milestone 4 can begin with characterization tests and artifact sketches while
  1 through 3 are being finalized.

Conflict risks:

- Multiple workers editing route helpers, content loaders, metadata helpers, or
  article rendering at the same time can create incompatible private models.
- Avoid broad route migrations before the registry shape is accepted.

### Stage 2. Shared Content And Output Spine

Milestones:

- Milestone 5: publishable entry and visibility model.
- Milestone 6: route-level view models.
- Milestone 10: generated-output verifier architecture.

Purpose:

- Turn source contracts into reusable output-facing models.
- Make verification modular early enough that later domains can report
  diagnostics through one format.

Blocks:

- homepage, archive, taxonomy, collection, feed, search, and related-entry
  consistency;
- site doctor diagnostics;
- generated docs and schema references;
- observability imports;
- future authoring studio previews;
- package extraction readiness.

Safe parallel work:

- Milestone 5 can proceed after enough of the route/entity registry exists to
  name publishable surfaces.
- Milestone 6 can proceed route by route, as long as each route consumes the
  same publishable and registry contracts.
- Milestone 10 should start with diagnostic types and a small verifier slice,
  then expand alongside later output engines.

Conflict risks:

- View model work and verifier work can duplicate filtering, route, and
  visibility rules if milestone 5 is not treated as the shared source.
- Diagnostics should not be invented independently by metadata, media, links,
  and author tooling.

### Stage 3. Domain Output Engines

Milestones:

- Milestone 7: metadata, semantics, search, and scholarly engine.
- Milestone 8: references, citations, and bibliography domain.
- Milestone 9: media, image, embed, and PDF policy engine.

Purpose:

- Build durable engines for machine readability, scholarly references, media
  behavior, and PDF output.
- Convert high-risk output rules into typed policies, manifests, diagnostics,
  and fixtures.

Blocks:

- advanced semantic profiles;
- citation exports and source audits;
- PDF size and eligibility policy;
- social image and feed consistency;
- search and AI-readable manifests;
- high-confidence starter templates.

Safe parallel work:

- Milestones 7, 8, and 9 can run in parallel after stages 1 and 2 define route
  identity, publishable entries, compiler artifacts, visibility, and diagnostic
  codes.
- The three tracks should share fixtures: plain article, image-heavy article,
  citation-heavy article, embed-heavy article, MDX article, feature-disabled
  site, and hostile-content site.
- Each track can expose a pure core and Astro adapter seam without publishing a
  package yet.

Conflict risks:

- Metadata and media both touch social images, feeds, search, PDF data, and
  route head output.
- References and metadata both touch citation JSON-LD, bibliography manifests,
  Scholar tags, and PDF citations.
- Coordinate public artifact names and verifier codes before implementation
  branches diverge.

### Stage 4. Presentation, Interaction, And Performance

Milestones:

- Milestone 11: UI primitives, layout recipes, and component catalog.
- Milestone 12: progressive interaction primitives.
- Milestone 13: performance, payload, and cache workbench.
- Milestone 16: test matrix and correctness strategy.

Purpose:

- Make responsive design, interaction behavior, payload policy, and visual
  regression prevention repeatable.
- Give developers primitives that make future UI work fast and hard to break.

Blocks:

- broad component migrations;
- reusable interaction package candidates;
- performance budgets as release gates;
- reliable visual and responsive design work for starter sites;
- future GUI component reuse.

Safe parallel work:

- Component catalog and layout recipe design can start immediately using
  current components, then converge on view-model contracts as stage 2 lands.
- Interaction primitives can progress independently if pure state and placement
  logic are separated from DOM adapters.
- Performance workbench can characterize current payloads and cache behavior
  early, then enforce budgets after route types and interaction policies are
  stable.
- Test matrix design should run with all three tracks so risky UI and output
  behavior gets the right test layer.

Conflict risks:

- UI migrations can conflict with route view model changes if components still
  consume raw content.
- Interaction lazy-loading and performance work can fight each other unless
  script loading policies are explicit.
- Visual standardization should avoid changing many surfaces without catalog
  fixtures and Playwright containment checks.

### Stage 5. Author And Product Tooling

Milestones:

- Milestone 14: site doctor and author diagnostics.
- Milestone 15: documentation system and public platform docs.
- Milestone 17: observability and webmaster intelligence.
- Milestone 18: authoring studio readiness.

Purpose:

- Convert platform contracts into author-facing guidance, docs, reports,
  dashboards, and future editing workflows.
- Make non-technical author and site-owner work safer while preserving the
  static source model.

Blocks:

- full studio/editor implementation;
- public platform documentation;
- release report automation;
- actionable webmaster analytics;
- third-party adoption.

Safe parallel work:

- Docs information architecture can start early, but generated references
  should wait for schemas and registries.
- Site doctor can start once diagnostic codes and source maps exist, then add
  checks as output engines mature.
- Observability can design import schemas early, but production interpretation
  should wait for route manifests and generated-output ownership.
- Authoring studio readiness should stay as schema, preview, and diagnostic
  contracts until the CLI and docs workflows prove the author model.
- Product UX research, user journeys, and prototype sketches can happen here,
  but production GUI workflows should not become a second content model.

Conflict risks:

- Tooling can accidentally become a second source of truth for config,
  visibility, metadata, routes, or diagnostics.
- Documentation can drift if generated references are not tied to the same
  schemas and registries used by the platform.

### Stage 6. Distribution, Portability, And Ecosystem

Milestones:

- Milestone 19: internal package boundaries and extraction candidates.
- Milestone 20: extension architecture.
- Milestone 21: deployment adapters and release governance.
- Milestone 22: security, privacy, and trust policy.
- Milestone 23: import, export, migration, and portability.
- Milestone 24: localization and inclusive defaults.
- Milestone 25: starter templates and distribution.

Purpose:

- Turn proven internal seams into reusable packages, adapters, integrations,
  starter templates, and public platform practices.
- Preserve TPM as the production fixture while making the platform adoptable by
  other sites and future repos.
- Make deployment and provider behavior abstract enough for the future studio
  to present simple publish actions.

Blocks:

- public package publishing;
- Astro integration releases;
- non-Astro adapters;
- production starter templates;
- supported migration/import workflows;
- full platform productization;
- comprehensive static blog studio implementation.

Safe parallel work:

- Milestone 19 should start with internal boundaries and entrypoint tests after
  stages 1 through 4 have proven stable APIs.
- Milestone 20 depends on internal extension points from milestone 19 and route
  or verifier registries from earlier stages.
- Milestone 21 depends on source/artifact ownership, route manifests, cache
  policy, and generated-output verification.
- Milestone 22 can define policy earlier, but enforcement depends on media,
  embed, deployment, and verifier contracts.
- Milestone 23 depends on source maps, route manifests, artifact ownership,
  and citation/media normalization.
- Milestone 24 should influence schemas and layout recipes early, but fixture
  implementation should wait until route/entity and component contracts are
  stable.
- Milestone 25 depends on stable config defaults, docs, deployment adapters,
  fixture sites, and release governance.

Conflict risks:

- Publishing packages before the internal APIs have second consumers can freeze
  weak abstractions.
- Extension architecture can become too abstract if it is not driven by real
  plugin candidates.
- Starter templates can become stale if docs, schemas, and release checks are
  not generated or tested together.

### Stage 7. Static Blog Studio Product

Milestones:

- Milestone 26: comprehensive static blog studio.

Purpose:

- Deliver the GUI product that makes the platform usable by non-technical
  authors and site owners from one application.
- Hide technical provider details behind clear authoring, preview, publish, and
  rollback workflows.

Blocks:

- Nothing below it should depend on the full studio product. The studio is an
  integration and productization layer over the platform, not the platform's
  source of truth.

Safe parallel work:

- Product research, UX prototypes, and editor experiments can happen earlier as
  long as they explicitly test assumptions and do not define canonical platform
  models.
- Implementation should wait for stable contracts from milestones 1 through
  25, especially schemas, diagnostics, compiler artifacts, media policy,
  deployment adapters, security policy, fixture sites, and docs.
- Early prototypes should use mocked providers or local source folders before
  credentialed hosted workflows.
- CLI and MCP planning can begin once the headless studio core contract is
  sketched, but write-capable commands and tools must wait for deployment
  adapters, security policy, audit logs, and provider-scope rules.
- The CLI should harden first as the automation and CI interface; the MCP
  server should reuse the same core after safety defaults, dry-run semantics,
  and write scopes are explicit.

Conflict risks:

- A studio-first shortcut can create a parallel CMS model, separate validation
  rules, separate preview rendering, or source changes that the CLI, MCP
  server, and CI cannot reproduce.
- Credential, provider, and publish flows can create serious security risk if
  they are treated as UI details instead of trust-boundary contracts.
- Real-time preview pressure can tempt the platform away from deterministic
  static output. Preview acceleration is good, but publish output must still
  compile through the same static contracts.
- Agent-facing tools can amplify mistakes if MCP write actions bypass the same
  diagnostics, previews, proposed diffs, audit logs, and human confirmation
  gates as GUI and CLI publish workflows.

## Parallel Planning Map

Use this map to decide what can be staffed in parallel.

1. **Roadmap preflight:** tooling and repo-health audit can run before and
   alongside design work, but tool-scope changes should be isolated from major
   product refactors.
2. **High-conflict serial work:** milestones 1, 2, 3, and the core of 4.
   These change the vocabulary everyone else uses.
3. **Parallel after foundation contracts:** milestones 5, 6, and the first
   diagnostic slice of 10.
4. **Parallel output-engine tracks:** milestones 7, 8, and 9, coordinated by
   shared compiler artifacts, route manifests, visibility policy, and
   diagnostics.
5. **Parallel UI and performance tracks:** milestones 11, 12, 13, and 16,
   coordinated by catalog fixtures, payload budgets, and route view models.
6. **Parallel author-product tracks:** milestones 14, 15, 17, and 18,
   coordinated by schemas, diagnostics, and generated references.
7. **Parallel distribution design, incremental implementation:** milestones 19
   through 25, coordinated by package-boundary reviews, fixture sites, and
   starter templates.
8. **Studio product research early, implementation late:** milestone 26 can be
   researched and prototyped early, but production implementation should depend
   on stable platform contracts rather than defining them.

## Safe Batching

Batching is useful when milestones share vocabulary, tests, fixtures, and
migration surfaces. Batching is unsafe when a later milestone would have to
guess at an unfinished lower-level contract.

Recommended design batches:

1. **Tooling and repo-health preflight:** audit and cleanup scripts, CI parity,
   tool scopes, ignore files, compiler/linter/test settings, and release gates
   before major roadmap implementation.
2. **Source contracts:** milestones 1, 2, and 3 together. These define source
   lifecycle, config/context boundaries, and route/entity ownership.
3. **Article and content model:** milestones 4, 5, and 6 together. Article
   compiler artifacts, publishable entries, and route view models should agree
   on shared vocabulary before implementation.
4. **Output engines and diagnostics:** milestones 7, 8, 9, and 10 together.
   Metadata, references, media/PDFs, and verifiers all need route/content
   artifacts and structured diagnostics.
5. **Presentation, interaction, performance, and tests:** milestones 11, 12,
   13, and 16 together. Layout recipes, interactions, performance, and tests
   share UX, accessibility, and regression controls.
6. **Author and product tooling:** milestones 14, 15, 17, and 18 together.
   Site doctor, docs, observability, and future GUI workflows should consume
   the same schemas and diagnostics.
7. **Distribution and ecosystem:** milestones 19, 20, 21, 22, 23, 24, and 25
   together at the design level. Actual implementation should stay
   incremental, fixture-driven, and blocked on proven internal seams.
8. **Static blog studio product:** milestone 26 should be designed with
   milestones 14, 18, 21, 22, and 25 in mind, but implemented as a product layer
   after the platform contracts are stable enough to prevent a parallel CMS.

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
- **QA coverage regression:** making checks faster must not silently make them
  weaker. Tightened tool scopes need probes, diagnostic diffs, documented
  exclusions, and conservative release gates.
- **Static-output regression:** any change to routes, redirects, feeds,
  metadata, PDFs, search, headers, or public files must be treated as a public
  API change.
- **Docs drift:** generate references from schemas/registries wherever
  practical and keep narrative docs audience-specific.
- **GUI parallel model:** future editor/admin tools must consume platform
  schemas and diagnostics rather than becoming a separate CMS.
- **Studio shortcut risk:** do not let the future GUI become the fastest way to
  bypass compiler contracts. If studio prototypes need behavior the platform
  cannot express, strengthen the platform model first.
- **Credential and provider risk:** Git, deploy, analytics, identity, and asset
  provider connections must have explicit scopes, storage rules, audit trails,
  and failure states before they are exposed to non-technical users.
- **Preview parity drift:** real-time preview must remain a faithful view of
  the same compiler output. Fast preview paths need parity tests against
  release builds.
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
- If this changes tooling, what proves the new scope catches the same intended
  bug classes as the old scope?
- Are ignored files ignored because they are generated artifacts, external
  dependencies, caches/reports, parked assets, or separately verified outputs?
- Would a future static blog studio be able to consume this contract without
  inventing a parallel source model?
- Does this expose enough schema, diagnostics, source maps, and preview data
  for non-technical repair flows?
- If this touches deployment, credentials, provider APIs, or previews, is the
  trust boundary explicit?
- If the change fixes a bug, why was that bug possible?
- If the change adds an abstraction, what concrete invariant or repeated domain
  concept justifies it?
- If the change affects performance, what measurement proves success?

This roadmap should be updated when implementation discovers a better domain
boundary. It should not be treated as a fossil. Its job is to preserve the
long-term direction while allowing the repo to learn from real implementation
work.
