# Findings Notes

These are fresh-pass notes. They intentionally avoid relying on the previous
roadmap until the final synthesis phase.

## Philosophy Baseline

The engineering philosophy asks the platform to behave like a typed compiler
for editorial publishing:

- author/site input is parsed, validated, normalized, modeled, rendered, and
  verified;
- reusable platform code belongs in `src/`;
- TPM-specific content, config, assets, and theme belong in `site/`;
- repeated domain concepts should become typed registries, policies, view
  models, primitives, and tests;
- generated output is a public API;
- reader-facing output must stay fast, semantic, accessible, and
  machine-readable;
- authors should not need to understand Astro internals to publish.

## Raw Observations

### Repository Shape

- The tracked source already has an explicit site-instance split: `site/` for
  TPM content/config/assets and `src/` for platform code.
- There is a strong verification culture: release checks cover content,
  platform boundaries, catalog, unit/component tests, build, generated output,
  HTML validation, e2e, audit, and secrets.
- The working tree contains ignored local/generated directories
  (`tmp/`, `dist-catalog/`, `.lighthouseci/`) that should be treated as
  artifact hygiene, not platform source.

### Root, Config, And Deployment

- `package.json` is a useful command map but it has become a product surface in
  its own right: author checks, release checks, docs-site, catalog, payload
  experiments, PDF generation, Cloudflare redirects, a11y, Lighthouse, asset
  review, and coverage all live in one flat script namespace.
- `astro.config.ts` is appropriately static-first and site-instance-aware. It
  wires redirects, Markdown transforms, sitemap, image output, prefetch, and
  Tailwind. This is a high-leverage integration point and should stay thin.
- `site/config/site.json` is a strong publication-level configuration surface:
  features, routes, homepage labels, identity, support, navigation, share
  targets, and defaults are already site-owned.
- `site/config/site.schema.json` is generated, which is good for editor tooling
  and future GUI work.
- `wrangler.toml` is intentionally small and uses Cloudflare Workers Static
  Assets. `site/public/_headers` owns hashed-asset caching and public-file
  headers.

### Site Instance And Author Surface

- Most normal publication changes are already expressible under `site/`:
  articles, announcements, authors, categories, collections, pages, config,
  theme, public files, and assets.
- Announcements and articles share a near-common schema, while announcements
  remain a separate source collection. That matches the author mental model.
- Collections provide ordered curation without making articles carry all
  ordering responsibility in frontmatter.
- Category folder names still encode historical implementation detail:
  `memeculture` is displayed as `Culture`. This is handled, but it is an
  example of source-path policy becoming visible to site owners.
- `site/README.md` is author-oriented and helpful. It still contains enough
  metadata detail that a future public docs site should split it into task
  pages plus references.

### Content Compiler

- `src/content.config.ts` and `src/lib/content-schemas.ts` already use Astro
  content collections and Zod schemas to fail invalid frontmatter early.
- `src/lib/publishable.ts` is an important unifying seam: articles and
  announcements can feed shared list, search, RSS, and homepage surfaces.
- `src/lib/article-page-view-model.ts` is a good route-data assembler and
  already supports dependency injection in tests. It is also a sign that page
  routes need explicit domain services rather than more ad hoc loader calls.
- Many helpers default to the global `siteConfig` singleton. That is convenient
  for Astro pages, but it is the main long-term obstacle to standalone library
  extraction, multi-site compilation, and precise tests for alternate site
  configs.
- Legacy author matching, legacy permalink metadata, inert legacy banners, and
  redirects are intentionally preserved. They should remain isolated in
  content/domain adapters instead of leaking into UI primitives.

### Routing, Metadata, And Machine Output

- Route helpers centralize URL construction, feature routes, static path
  helpers, canonical metadata, RSS, sitemap participation, JSON-LD, social
  images, Scholar/PDF metadata, and share targets.
- `src/lib/semantic-metadata.ts` is already a generalized platform feature
  rather than a TPM-specific enhancement. It is a strong candidate for a future
  reusable module or Astro integration.
- The share-target registry is clean enough to maintain changing external
  share endpoints. It should eventually be configurable as provider policies
  rather than a hard-coded list plus site config choices.
- The generated output verifier treats HTML, metadata, redirects, PDFs,
  Pagefind, social images, source maps, client script count, hydration, and
  broken links as public API. This matches the philosophy but the verifier is
  large enough to deserve a typed issue-code architecture.

### Article References, Bibliography, And Citations

- The reference system has mature domain modeling: canonical note/citation
  labels, hidden BibTeX blocks, inline markers, generated bibliography,
  article citation menu formats, reference previews, global bibliography, and
  validation.
- The BibTeX parser/normalizer is intentionally project-owned and narrow. This
  is appropriate for a static build pipeline but should be treated as a
  specialized subdomain with explicit limits.
- Citation correctness remains partly editorial and cannot be fully solved by
  syntax validation. The current citation audit docs and scripts should evolve
  toward a durable citation QA workflow.
- Reference hover previews use progressive enhancement and anchored
  positioning. The underlying interaction primitives are extractable.

### Media, Images, Embeds, PDFs, And Assets

- The image pipeline strongly favors `site/assets/` so Astro can validate and
  optimize assets. Asset-location/shared/duplicate/unused checks enforce this.
- Article image policy is centralized enough to avoid most prose-image layout
  bugs, but it is still encoded as class strings and policy thresholds rather
  than a named media-policy model.
- PDF export is an important second rendering target. It has metadata,
  print CSS, compatibility checks, and author opt-out. MDX component fallback
  compatibility is currently a registry of import strings, which works but is
  brittle for long-term extension.
- Embed handling is simple and useful: SoundCloud and YouTube go through media
  components and layout classifiers. This can grow into a small provider
  registry for embeds, print fallback, privacy, and dimensions.

### Components, Layout, And Design System

- Component files are generally small. Largest components are not extreme, and
  recent refactors produced useful primitives: `Button`, `SectionHeader`,
  `ScrollRail`, `ActionPopover`, anchored popover primitives,
  `PriorityInlineRow`, `SectionStack`, and branded CTA buttons.
- Component docs and the private catalog provide a design-contract loop:
  one-pager, catalog example, implementation, tests.
- Some repeated site patterns are now covered by primitives, but block-level
  composition still has duplicated “compact list with heading/action,” “rail
  with controls,” “publishable teaser,” and “endcap discovery” concepts.
- Layout bugs caught in Playwright are a sign that responsive layout primitives
  should keep getting stronger. The repo already has the right direction:
  reusable rails, reading bodies, page frames, and article cards.
- SEO components are intentionally non-visual and route-only. They are covered
  by page render/tests rather than catalog examples, which is sensible.

### Browser Interaction

- Interactive behavior is mostly small processed scripts rather than large
  hydrated islands. This is consistent with static-first Astro goals.
- Anchored positioning/disclosure code is browser-independent where practical
  and then adapted by small scripts. This is one of the best examples of the
  target pure-core/impure-adapter pattern.
- Current interactive domains include popovers, citation/reference previews,
  article image inspector, share menu, TOC toggles, horizontal rails, mobile
  nav/search/theme, and home carousel. These can be understood as one
  “progressive disclosure and anchored surfaces” subdomain.

### Scripts, Checks, And Developer Velocity

- The quality pipeline is strong and deliberately staged: fast checks, normal
  checks, release checks, review-only checks, and quiet quality dispatchers.
- Script code has good dependency-injected seams in several places
  (`runQualityWorkflow`, site doctor, coverage verifier, accountability
  verifier, platform boundary verifier).
- `verify-build.ts` and some audit scripts are large policy bundles. They work,
  but they are harder to treat as reusable libraries or to extend safely than
  smaller typed validators with stable issue codes.
- Payload and critical CSS experiments are present in `scripts/payload` and
  ignored `tmp/`. The repo has the right tooling mindset but needs a clearer
  “experiment graduates to policy” path.

### Tests And Regression Prevention

- Tests are broad: config, ESLint config, platform libs, scripts, routes,
  layouts, pages, Astro components, e2e, a11y, perf, type-level tests, fixtures,
  and docs-site/site-instance builds.
- Test accountability is unusually strong. Every tracked file must have a
  mirrored test or a documented exception.
- Coverage review is broad and uses explicit exceptions. CSS and generated/
  external boundaries are tested via browser/HTML/a11y/perf checks instead of
  line coverage.
- E2E tests encode layout invariants for article images, anchors, component
  layout, hover previews, PDF buttons, search, and catalog. This aligns with
  the “bugs should become impossible to represent” philosophy.

### Documentation

- Root and site READMEs serve different audiences; that is correct.
- `docs/components/` is a useful component-contract catalog. The docs-site
  example is the right direction for public platform onboarding.
- Documentation is rich but fragmented across design audits, implementation
  plans, migrated decisions, and current reference. The next maturity step is
  stronger audience separation: non-technical author docs, site-owner config
  docs, developer module docs, and historical planning docs.
- `docs/platform/PLATFORM_MODULES.md` and `scripts/quality/verify-platform-boundaries.ts`
  duplicate the module map by design. This catches drift but should eventually
  share a generated source of truth.

### Examples And Productization

- `examples/docs-site/` is a second consumer of the platform. That is a major
  productization proof point because it validates site-instance swapping.
- The docs-site has its own config, redirects, content, authors, categories,
  collections, pages, public files, and theme. This proves more than a fixture.
- The platform still lives as one application repo, not extractable packages.
  That is fine for now, but several subdomains are mature enough to plan as
  future libraries/integrations.

### Initial Questions Resolved

- Ordinary site-owner changes are mostly expressible in `site/`, but
  capabilities like new share providers, new embed providers, new MDX PDF
  fallbacks, and deeper metadata policies still require platform code.
- Domain concepts are usually normalized before rendering, but some global
  singleton config and hard-coded provider/policy registries limit reuse.
- Generated outputs are verified rigorously, but the verifier itself is ready
  for modularization.
- UI primitives are much stronger than earlier project history suggests, but
  layout primitives can keep expanding to eliminate recurring responsive bugs.
- Docs are improving by audience, but the documentation system still needs a
  clearer public/platform/current-vs-historical split.
