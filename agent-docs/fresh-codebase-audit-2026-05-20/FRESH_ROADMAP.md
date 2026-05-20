# Fresh Comprehensive Roadmap

This roadmap is written from the fresh audit evidence in this directory before
consulting the previous roadmap. It describes the mature-state direction for
the repository as a reusable static publishing platform plus one active TPM site
instance.

## Executive Direction

The repository has already crossed the line from “Astro site” into “publishing
platform.” The next stage should make that explicit.

The end state is a static-first, Bun-first, Astro-based publishing platform that
lets site owners express publication intent through content, config, assets,
theme, and small extension points. The platform should compile that intent into
fast, accessible, semantic, verifiable static output. TPM should be one site
instance, not the architectural center of gravity.

The highest-value long-term move is to convert working conventions into
deliberate domain contracts:

- content authoring becomes a typed content compiler;
- metadata becomes a semantic output engine;
- media becomes a policy-driven asset pipeline;
- UI becomes a compact primitive/block system;
- interactions become progressive-enhancement primitives;
- generated-output checks become reusable public-output validators;
- author tooling becomes a product surface, not a collection of internal
  scripts.

## Maturity Principles For This Roadmap

- Treat generated HTML, RSS, sitemap, metadata, PDFs, redirects, search index,
  and static assets as public API.
- Treat `site/` as the author/site-owner workspace and `src/` as reusable
  platform code.
- Prefer explicit typed registries, policies, view models, adapters, and issue
  codes over scattered conditionals.
- Keep the platform static-first. Runtime JavaScript exists only for narrowly
  scoped progressive enhancement.
- Design abstractions so valid publishing intent is easy to express and invalid
  outcomes are hard or impossible to express.
- Measure important claims: payload size, Lighthouse/Core Web Vitals,
  accessibility, output validity, coverage, author-check speed, and release
  confidence.
- Make future extraction possible before actually forcing package extraction.

## Roadmap A: Site Instance Contract And Config Contexts

### Goal

Make the site-instance boundary production-grade and ready for multiple
publications, GUI editing, and eventual external site packages.

### Current State

- `site/` already owns TPM content, config, assets, theme, redirects, and
  public files.
- `examples/docs-site/` proves a second site instance can build.
- `site/config/site.json` is broad and has a generated JSON schema.
- Many helpers import the singleton `siteConfig`, which is convenient but makes
  platform modules harder to reuse or test against alternate configs.

### Mature-State Design

- Define a small set of typed platform contexts instead of one implicit global:
  routing, identity, features, homepage, support, sharing, feed, metadata,
  media, and output.
- Keep Astro pages free to use default site-instance adapters, but make core
  helpers accept explicit contexts.
- Generate config schema and human docs from the same source where practical.
- Make config defaults composable: platform defaults, site defaults, entry
  overrides, and route/page-specific overrides should have one documented
  precedence model.
- Treat the docs-site instance as a permanent compatibility fixture, not a demo
  afterthought.

### Implementation Milestones

1. Map every `siteConfig` import and classify whether it belongs in a route
   adapter, view model, or pure helper.
2. Introduce typed context objects for the highest-coupling areas first:
   routes/features, metadata/social, support/share, homepage, and feed.
3. Move pure helpers to explicit context parameters while keeping thin default
   adapters for existing routes.
4. Add tests that run core helpers against both TPM config and docs-site config.
5. Expand `site:doctor` to validate config relationships that schema alone
   cannot prove.

### Verification

- `bun run platform:check` should remain green.
- `bun run test:docs-site` should keep proving second-site compatibility.
- Unit tests should cover alternate route and feature configurations.
- Generated `site.schema.json` must stay current through `site:schema:check`.

## Roadmap B: Content Compiler And Authoring Product

### Goal

Make authoring simple enough for non-technical contributors while preserving a
strict compiler-like pipeline for content correctness.

### Current State

- Astro content collections and Zod schemas validate articles, announcements,
  authors, categories, collections, and pages.
- `PublishableEntry` unifies articles and announcements for shared surfaces.
- `site/README.md` and `AUTHOR_TUTORIAL.md` serve non-technical authors.
- `author:check` and `author:fix` are good first author-facing commands.

### Mature-State Design

- Treat content as compiled source: raw frontmatter and Markdown enter at the
  collection boundary, then normalize into stable publishable, author,
  collection, tag, reference, media, and route models.
- Make author errors precise, actionable, and path-aware.
- Preserve simple defaults: most articles need only title, description, date,
  author, tags, image, and body.
- Move advanced frontmatter into documented “power user” sections.
- Prepare for GUI editing by ensuring every author-visible option has a schema,
  label, description, default, examples, and validation message.

### Implementation Milestones

1. Create a content compiler domain map that names raw inputs, normalized
   models, and public outputs.
2. Expand `site:doctor` or a new author doctor to report cross-file issues:
   missing author aliases, collection references, feature-disabled links,
   image paths, semantic metadata visibility, PDF compatibility, and route
   collisions.
3. Make tag/category/collection/publishable diagnostics share one issue-report
   format.
4. Add generated author-facing references from schemas where the schema has
   enough metadata.
5. Add a “first PR” author workflow that validates only the changed content
   when possible, with full release checks reserved for maintainers.

### Verification

- `bun run author:check` stays fast and focused.
- Content fixtures cover happy paths and invalid paths.
- Docs-site authoring pages exercise the same commands.
- Non-technical documentation should never require editing `src/` for ordinary
  publication tasks.

## Roadmap C: Generated Output Contract And Verifier Architecture

### Goal

Turn generated-output verification into a modular validation framework with
stable issue codes, clear ownership, and reusable reports.

### Current State

- `scripts/build/verify-build.ts` already verifies a large amount of public
  output: redirects, PDFs, HTML metadata, Pagefind, social images, alt text,
  broken links, client scripts, hydration, source maps, and more.
- This matches the philosophy but concentrates many policies in one large file.

### Mature-State Design

- Split verification by output contract: HTML documents, metadata/JSON-LD,
  feeds/sitemaps, redirects, search, PDFs, assets, client scripts, and
  deployment files.
- Give every issue a stable code, severity, path, explanation, and suggested
  repair.
- Keep the CLI human-readable, but make machine-readable reports possible for
  GUI/editor integrations.
- Let future site instances opt into platform defaults while adding stricter
  local policies.

### Implementation Milestones

1. Define a shared `VerificationIssue` model and formatter.
2. Extract independent verifier modules from `verify-build.ts` without changing
   behavior.
3. Add focused unit tests for each verifier module and one end-to-end build
   verifier test.
4. Add optional JSON output for diagnostics.
5. Document generated output as a public API contract.

### Verification

- `bun run verify` output remains concise.
- Existing build verification tests remain green or become more targeted.
- New issue-code tests prevent accidental message drift.
- Release checks continue to fail on invalid public output.

## Roadmap D: Metadata, Semantics, Search, And Scholarly Output Engine

### Goal

Make machine readability a first-class, configurable platform capability.

### Current State

- Metadata is already broad: canonical URLs, Open Graph, Twitter cards,
  Schema.org JSON-LD, Scholar metadata, RSS, sitemap, social images,
  bibliography, article citations, and PDFs.
- `semantic` frontmatter supports review/event/media/book/dataset/software/FAQ
  style metadata.
- PDF export and citation menus add scholarly affordances.

### Mature-State Design

- Model metadata as a layered output engine:
  site identity, route metadata, publishable metadata, semantic metadata,
  social metadata, scholarly metadata, and generated asset metadata.
- Make each metadata type truthful by construction: visible content should
  align with machine-readable content.
- Create metadata profiles for common platform use cases: blog, scholarly
  article, review, event, documentation page, media post, dataset, software,
  collection, and announcement.
- Support validation against expected output, not just frontmatter shape.
- Keep metadata configurable enough for other publications without editing core
  components.

### Implementation Milestones

1. Define metadata profile types and profile selection rules.
2. Refactor JSON-LD/Open Graph/Scholar output into profile-driven builders.
3. Add output snapshots or structural tests for every profile.
4. Add docs for truthful metadata, common mistakes, and author-facing examples.
5. Add validation that flags hidden/inconsistent semantic claims.

### Verification

- HTML validation and generated-output checks cover metadata presence and
  structure.
- Profile tests cover article, announcement, page, collection, category, tag,
  author, and bibliography routes.
- Lighthouse/SEO scans should show fewer missing or ambiguous metadata issues.

## Roadmap E: Media, Images, Embeds, And PDF Fallback Policy

### Goal

Make media behavior predictable across web pages, social previews, RSS,
search, PDFs, and future site instances.

### Current State

- The repo strongly prefers `site/assets/` and Astro image processing.
- Article images have editorial figure behavior and inspector interactions.
- Social images are generated as constrained JPEGs.
- PDFs are generated with print CSS and MDX compatibility checks.
- Embeds are classified for SoundCloud, YouTube, and unknown iframe layouts.

### Mature-State Design

- Create a media policy layer that describes image roles: article figure,
  preview thumbnail, hero/logo, social image, PDF image, inline hover image,
  decorative asset, favicon/touch icon, and downloadable static file.
- Make role policies own dimensions, formats, alt expectations, lazy/eager
  behavior, fetch priority, cropping, PDF fallback, and output budgets.
- Replace import-string-based MDX PDF compatibility with component-declared or
  registry-declared fallback contracts.
- Create embed provider descriptors for layout, privacy, print fallback,
  allowed attributes, loading behavior, and dimensions.
- Keep authors on normal Markdown images by default.

### Implementation Milestones

1. Inventory all media roles and define a typed media policy registry.
2. Move article image thresholds/classes into named policies.
3. Add embed provider descriptors for YouTube, SoundCloud, and generic iframe.
4. Replace MDX PDF compatibility strings with a durable component/fallback
   contract.
5. Add size-budget checks for social images, article PDFs, and large static
   assets.

### Verification

- E2E article image invariants remain stable.
- Build verifier catches missing alt text, unoptimized assets, oversized social
  images, and missing PDF fallbacks.
- PDF tests include plain Markdown, MDX, embeds, hover image components, and
  no-PDF exceptions.
- Payload reports track image and PDF size budgets.

## Roadmap F: UI Primitives, Responsive Layout, And Component System

### Goal

Make common layout and interaction problems hard to recreate by providing
better primitives and stronger component contracts.

### Current State

- The component tree is reasonably decomposed.
- Component one-pagers and catalog examples exist.
- Reusable primitives include buttons, links, rails, section headers,
  containers, action popovers, anchored panels, layout bodies, page frames, and
  support/social buttons.
- Playwright tests catch many layout regressions.

### Mature-State Design

- Treat components as a domain language for publishing surfaces:
  article list, compact entry list, section header with action, rail, endcap,
  support CTA, metadata action row, prose media, page header, navigation row,
  and publishable card.
- Keep components stateless and declarative wherever possible.
- Give every reusable block a documented empty, long-content, responsive,
  dark-mode, focus, disabled/hidden, and feature-disabled state.
- Extract recurring layout strategies into primitives before they appear in
  three places.
- Make responsive safety the default: intrinsic sizing, `min-w-0`, clamp,
  stable media frames, rail controls, and no overflow.

### Implementation Milestones

1. Identify repeated block patterns still implemented separately:
   heading/action, compact entry panels, publishable teasers, rails, endcaps,
   support/action clusters, and metadata actions.
2. Promote stable patterns into primitives or typed block adapters.
3. Update component one-pagers before changing implementations.
4. Expand catalog examples for hostile content: long words, missing images,
   disabled features, empty lists, dense metadata, and narrow containers.
5. Add targeted e2e/component invariant tests for any new primitive.

### Verification

- `bun run catalog:check` remains green.
- Component one-pagers match component inventory.
- E2E layout tests cover the primitives most likely to affect multiple pages.
- Visual changes are accepted only when they improve consistency or resilience.

## Roadmap G: Progressive Interaction Primitives

### Goal

Make small client-side interactions reusable, lazy, accessible, and testable.

### Current State

- Anchored positioning and disclosure already have pure logic and browser
  adapters.
- Article citation menu, share menu, reference previews, image inspector,
  table of contents, rails, theme, search, and mobile nav use narrow scripts.

### Mature-State Design

- Formalize interaction primitives:
  anchored popover, hover/focus/tap preview, disclosure, carousel, scroll rail,
  inspector/lightbox, copy-to-clipboard, and persisted preference.
- Share one lazy-loading strategy where interaction scripts can initialize on
  first need, idle, or visibility without blocking first paint.
- Encode accessibility behavior in primitives: focus management, Escape,
  aria relationships, reduced motion, touch fallback, keyboard parity.
- Keep provider/content-specific behavior outside generic interaction cores.

### Implementation Milestones

1. Create an interaction primitive map and identify shared runtime utilities.
2. Unify anchored popover/preview/disclosure initialization patterns.
3. Add lazy/opportunistic loading policies for non-critical interactions.
4. Add test helpers for keyboard, touch/coarse pointer, resize, scroll, and
   outside-click behavior.
5. Document interaction accessibility contracts.

### Verification

- Browser-script unit tests cover pure runtime behavior with injected DOM
  dependencies.
- E2E tests cover real keyboard and pointer behavior.
- Lighthouse network dependency chains do not regress because non-critical
  scripts stay small and lazy.

## Roadmap H: Performance, Payload, And Caching Governance

### Goal

Make performance measurable, budgeted, and resistant to regression.

### Current State

- Build output is optimized after Astro build.
- Cloudflare `_headers` caches hashed `_astro` assets aggressively.
- Lighthouse, payload reports, critical CSS experiments, minify experiments,
  and post-build optimization experiments exist.
- Client JavaScript is already small and mostly explicit.

### Mature-State Design

- Define budgets for HTML, CSS, JavaScript, image payload, PDF size, total page
  weight, client script count, LCP, CLS, accessibility, and SEO.
- Treat performance experiments as a pipeline: hypothesis, experiment,
  measurement, recommendation, adoption, regression guard.
- Keep static assets cacheable and deterministic.
- Optimize for perceived speed: stable layout, correct fetch priority,
  minimized render-blocking resources, and lazy non-critical interactions.

### Implementation Milestones

1. Consolidate payload/performance scripts into a measurable governance module.
2. Define per-route and per-asset budgets with severity levels.
3. Add CI/report output that distinguishes blocking regressions from research
   warnings.
4. Graduate successful critical CSS/minification/post-build experiments into
   production policy only after measurement.
5. Add docs for performance budgets and local measurement workflow.

### Verification

- `bun run test:perf:built`, payload reports, and build verification agree on
  budget concepts.
- Budget failures produce actionable paths and suggested repairs.
- Performance docs explain when to run fast checks versus expensive scans.

## Roadmap I: Documentation Architecture And Public Platform Onboarding

### Goal

Make documentation serve authors, site owners, platform developers, and future
external users without mixing their concerns.

### Current State

- Root README, site README, author tutorial, docs-site, component one-pagers,
  platform modules, and many topic docs exist.
- Documentation is rich but historically layered.

### Mature-State Design

- Split docs by audience and stability:
  author tasks, site-owner configuration, platform developer architecture,
  component/design contracts, operations/release, generated references, and
  historical audits.
- Make docs-site the primary public documentation experience.
- Generate references from schemas, registries, component inventory, and
  script metadata where practical.
- Keep local docs useful for contributors but avoid asking non-technical
  authors to read implementation-oriented files.

### Implementation Milestones

1. Define documentation IA and status labels: current guide, reference,
   design contract, historical audit, deferred work.
2. Move or index historical planning docs so current docs are discoverable.
3. Expand docs-site with task-first guides generated from real example files.
4. Generate or verify component/docs inventories from source.
5. Add doc drift checks for schema docs, script docs, component one-pagers, and
   platform module maps.

### Verification

- `bun run review:markdown` remains green.
- Docs-site builds with the same platform as TPM.
- Documentation drift checks fail when public contracts change without docs.

## Roadmap J: Release, Deployment, Redirects, And Hosting Adapters

### Goal

Make deployment behavior explicit, host-aware, and portable without weakening
the current Cloudflare path.

### Current State

- Cloudflare Workers Static Assets are the active deployment target.
- GitHub Actions builds once, verifies, uploads the artifact, and deploys.
- Redirects are site-owned JSON plus generated Cloudflare output.
- Public files include `robots.txt`, favicons/touch icons, `_headers`,
  `CNAME`, and `.well-known/traffic-advice`.

### Mature-State Design

- Treat host output as an adapter layer:
  Cloudflare redirects/headers/static assets now, optional Pages/Netlify/S3
  adapters later.
- Keep redirects site-owned and generated from one validated source.
- Define deployment file contracts for headers, MIME types, cache policy,
  robots, well-known files, and legacy URL preservation.
- Preserve citation accuracy with legacy redirects and stable article URLs.

### Implementation Milestones

1. Document Cloudflare as the default adapter and define adapter-owned files.
2. Split redirect validation/generation into a reusable redirect module.
3. Add duplicate/collision checks for route redirects and historical URLs.
4. Add optional host adapter interface for future static hosts.
5. Expand release docs with rollback and domain-cutover checks.

### Verification

- Redirect generation tests cover site redirects, generated redirects,
  duplicate detection, and host output format.
- Build verifier catches missing deployment files.
- Cloudflare previews and deployed release remain static-only.

## Roadmap K: Standalone Module And Integration Candidates

### Goal

Prepare mature subdomains to become reusable packages or Astro integrations
when extraction becomes valuable.

### Current Candidates

- Metadata and semantic JSON-LD engine.
- Media/image/social/PDF policy engine.
- Article reference, citation, BibTeX, and bibliography system.
- Anchored positioning/disclosure/preview primitives.
- Static output verifier.
- Site-instance/config compiler and schema/doc generator.
- Authoring CLI/doctor.
- Component catalog and component contract verifier.

### Mature-State Design

- Do not extract prematurely. First create internal package-quality boundaries:
  explicit inputs/outputs, no TPM literals, no global singleton dependencies,
  no direct file-system access in pure cores, typed issue codes, docs, tests,
  and examples.
- When a subdomain can be described as a standalone problem with its own public
  API, promote it to an internal module boundary.
- Extract only when a second real consumer or clear reuse need exists.

### Implementation Milestones

1. Score each candidate against extraction readiness:
   cohesion, API clarity, dependency direction, tests, docs, examples,
   configuration, and consumer value.
2. Remove singleton/site-specific coupling from high-scoring candidates.
3. Add package-style README/API docs for candidates before physical extraction.
4. Use docs-site or fixtures as second consumers.
5. Revisit physical package/integration extraction after internal APIs settle.

### Verification

- Platform boundary checks include extraction-candidate rules.
- Candidate modules have tests that do not require TPM site config.
- Docs-site exercises reusable behavior with non-TPM content.

## Roadmap L: Security, Privacy, Accessibility, And Trust Defaults

### Goal

Make safe, accessible, privacy-conscious output the default for every site
instance.

### Current State

- Dependency audit, gitleaks, a11y tests, semantic HTML checks, alt text
  checks, no unsafe HTML linting, and static output verification exist.
- External embeds and share targets are controlled by platform components.

### Mature-State Design

- Treat accessibility, privacy, and security as platform contracts.
- Define default policies for external scripts, embeds, outbound links,
  analytics, CSP-compatible markup, robots, well-known files, and user-visible
  metadata.
- Make accessibility semantics first-class in components and content checks.
- Keep generated output usable for readers, search engines, screen readers,
  feed readers, scholar crawlers, and AI agents.

### Implementation Milestones

1. Create a trust/defaults policy document for security, privacy,
   accessibility, and machine readability.
2. Add embed/share/link policies for privacy and security attributes.
3. Expand a11y scans and generated-output checks around landmarks, headings,
   alt text, link names, forms, dialogs/popovers, and keyboard behavior.
4. Add optional site config for privacy-impacting integrations.
5. Add docs for accessibility and metadata author responsibilities.

### Verification

- A11y checks remain part of release/review workflows.
- Generated-output verifier catches missing trust/accessibility attributes.
- External integration changes require tests and docs.

## Roadmap M: Future GUI And Editor Integration Readiness

### Goal

Make a future non-technical site editor feasible without redesigning the
platform.

### Current State

- Content/config schemas exist.
- Site doctor and author checks are already command-line diagnostics.
- Site config is broad and mostly declarative.
- Docs-site demonstrates editing real site-instance files.

### Mature-State Design

- Every author/site-owner editable field should have:
  schema, default, label, help text, examples, validation, repair guidance, and
  a stable path to source.
- Diagnostics should be machine-readable.
- Preview/build should support fast incremental author feedback.
- Complex power-user features should remain available but separated from
  simple defaults.

### Implementation Milestones

1. Add metadata to config/content schemas for labels, descriptions, examples,
   and repair hints.
2. Make author/site diagnostics emit structured JSON.
3. Define a stable “site manifest” for GUI tooling: editable collections,
   fields, routes, assets, feature flags, and validation commands.
4. Add changed-file author checks for faster feedback.
5. Prototype GUI-ready docs/specs without building the GUI yet.

### Verification

- CLI and JSON diagnostics share the same issue source.
- Docs-site can be used as a GUI fixture.
- Author checks remain fast enough for iterative editing.

## Sequencing Recommendation

The roadmap should proceed in dependency order:

1. **Config contexts and content compiler.** These clarify boundaries that many
   later modules depend on.
2. **Verifier architecture and diagnostics.** This makes future refactors safer
   and gives GUI/editor work reusable issue reports.
3. **Media, metadata, and output policies.** These are high user-value domains
   and strong extraction candidates.
4. **UI primitives and interaction primitives.** These reduce layout and
   accessibility bug classes while improving developer velocity.
5. **Performance governance and documentation IA.** These turn existing
   experiments/docs into operating systems.
6. **Deployment adapters, standalone candidates, trust defaults, and GUI
   readiness.** These complete the platform productization arc.

## Pass 2 Critique

This roadmap should avoid two failure modes:

- **Over-extraction.** Many modules are extractable in spirit, but physical
  package extraction should wait until internal APIs are stable and a second
  consumer proves the value.
- **Config maximalism.** Making everything configurable can make authoring
  harder. Config should represent durable publication decisions, not every
  incidental component class.

The plan also depends on preserving existing strengths:

- Do not weaken content fidelity for abstraction cleanliness.
- Do not turn the static site into SSR or a SPA.
- Do not move site-owner concerns back into `src/`.
- Do not lose the current release/check rigor while refactoring checks.
- Do not make non-technical authors learn platform internals.

## Final Fresh-Pass Conclusion

The repo is not blocked by a single architectural defect. It is ready for a
maturity program: make existing successful patterns explicit, typed,
documented, testable, measurable, and eventually portable.

The most important fresh-pass finding is that the repository already contains
many seeds of the mature platform: site instances, content collections,
publishable models, semantic metadata, media policies, interaction primitives,
component docs/catalog, strict checks, docs-site, and release verification.
The roadmap should therefore amplify and systematize those patterns rather than
replace them wholesale.
