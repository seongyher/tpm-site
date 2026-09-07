# Deferred Work

The milestone blocks below were copied from the previous `CHECKLIST.md` so
deferred work keeps its exact original wording and checkbox state.

## Native Dependabot Bun Lockfile Updates

Reason deferred: as of September 7, 2026, Dependabot's Bun updater bundles Bun
1.3.14 and rejects lockfile versions above 1. This project requires Bun 1.4.2
for correct TypeScript package alias resolution and now tracks `bun.lock`
version 2. [Upstream PR #16071](https://github.com/dependabot/dependabot-core/pull/16071)
adds lockfile v2/v3 support but remains open and proposes Bun 1.4.0, which still
has the alias bug. Native Bun updates cannot yet preserve this dependency
graph reliably.

Temporary workflow: retain `package-ecosystem: npm` for grouped manifest update
proposals. Before merging a dependency PR, regenerate `bun.lock` using the Bun
version pinned in `package.json` with `bun install --lockfile-only`, then run
`bun install --frozen-lockfile` and the relevant repository checks. Keep the
frozen-lockfile CI gate enabled.

Resume trigger: resume when GitHub's deployed Bun updater supports lockfile
version 2 and bundles Bun 1.4.2 or later with the TypeScript alias fix. An
upstream merge or parser-only version bump is insufficient.

- [ ] Verify both prerequisites in the deployed Dependabot updater image.
- [ ] Switch the root updater to `package-ecosystem: bun` and update the
      dependency automation invariant test.
- [ ] Verify a generated update preserves both TypeScript compiler aliases,
      includes the matching `bun.lock` changes, and passes frozen installation
      and repository checks before removing the manual regeneration guidance.

## Milestone 70: Asset Inlining Delivery Strategy Follow-Up

- [ ] Design whether `assetsInlineLimit: 0` is desirable despite changing
      Astro processed scripts from inlined page scripts into external static
      assets.
- [ ] Evaluate the tradeoff with Lighthouse, browser network waterfalls,
      repeat-page cache behavior, no-JavaScript fallback behavior, and existing
      static-page client-script verification policy.
- [ ] If the delivery model is approved, update build verification to encode
      the new allowed script contract instead of treating the extra scripts as
      accidental hydration.
- [ ] Rerun `bun run payload:vite:experiments`, browser tests, accessibility
      tests, and release checks before adopting the config.

## Sätteri Markdown Processor Migration Evaluation

Reason deferred: Astro 7 made Sätteri the default Markdown processor, but this
project intentionally keeps the unified/remark/rehype pipeline during the
dependency upgrade so article references, editorial image handling, and MDX
output stay stable. Porting those plugins is a semantic content-compiler
migration, not a dependency-maintenance task.

Resume trigger: resume if unified support becomes a maintenance or compatibility
blocker, if Sätteri offers a measurable build or authoring benefit, or if
Markdown rendering is being revisited after the article reference and image
pipelines are stable.

- [ ] Inventory the current unified-only behavior, including
      `remarkArticleReferences`, `remarkArticleImageMarkers`,
      `rehypeArticleImages`, GFM, SmartyPants, MDX renderer behavior, generated
      heading IDs, and reference/backlink markup.
- [ ] Build a rendered-output comparison harness for representative articles:
      plain Markdown, citation-heavy, image-heavy, legacy footnotes, and MDX
      with custom components.
- [ ] Prototype equivalent Sätteri MDAST/HAST plugins and compare generated
      HTML, table of contents data, search output, RSS output, PDFs, and global
      bibliography aggregation against the unified pipeline.
- [ ] Measure build performance and dependency simplification separately from
      output fidelity so the migration has a clear reason beyond following a
      default.
- [ ] Migrate only after fixture tests, release checks, and representative
      visual spot checks show the article compiler output remains acceptable.

## Citation Occurrence Metadata And Locators

Reason deferred: page/chapter/range locators are a real gap in the citation
domain model, but they need a careful syntax and renderer design before
implementation.

Resume trigger: resume when citation rendering is revisited, especially before
normalizing articles that already use prose citations with page references.

- [ ] Design citation occurrences as structured uses of a source, separate from
      the BibTeX/source record.
- [ ] Support occurrence-level locator metadata such as `p. 70`,
      `pp. 251-252`, chapters, sections, figures, or other source positions.
- [ ] Ensure multiple occurrences of the same source still group under one
      bibliography entry.
- [ ] Design authoring syntax for locators that is easy to write and hard to
      confuse with the source key.
- [ ] Define rendering for numeric and author-year citation styles, including
      examples such as `[4, p. 70]` and `[Knobe 2015, p. 70]`.
- [ ] Add parser, renderer, bibliography, and regression tests before enabling
      article migrations that depend on locator metadata.

## Visible Source Appendices With Structured Bibliography Data

Reason deferred: some articles contain author-owned appendices or source-list
sections that should remain visible prose while optionally feeding the
structured bibliography. This needs a separate design from inline citation
markers.

Resume trigger: resume before converting or normalizing article appendices,
source lists, or bibliography-like sections that are part of the article's
visible structure.

- [ ] Design an authoring model for visible source appendices that preserves the
      original article section and heading.
- [ ] Decide whether appendix entries can be auto-generated from structured
      data, manually written as prose plus hidden data, or both.
- [ ] Ensure appendix/source-list entries can contribute to the global
      bibliography without inventing inline citation occurrences.
- [ ] Define how generated article bibliography sections interact with
      author-owned appendices so readers do not see duplicate or confusing
      source lists.
- [ ] Add parser, rendering, bibliography aggregation, and regression tests
      before migrating article appendices into this model.

## Article PDF Document Pipeline Replacement

Reason deferred: the current Chrome/Playwright PDF generator is acceptable as a
temporary release path, but it is not the ideal long-term foundation for clean,
scholarly article PDFs. Replacing it needs a separate design and experiment
phase so PDF generation can become document-first instead of browser-print
first.

Resume trigger: resume after the current release path is stable, or sooner if
PDF brittleness, CI browser provisioning, PDF size, image handling, or Scholar
compatibility becomes a repeated blocker.

- [ ] Design a normalized `ArticleDocument` model that can feed PDF output
      without depending on rendered website HTML as the source of truth.
- [ ] Evaluate Pandoc/LaTeX, Typst, and any other credible document-first
      renderer against representative articles: plain Markdown, citation-heavy,
      image-heavy, and MDX with fallback components.
- [ ] Define how article images, footnotes, bibliography, table of contents,
      canonical URLs, Scholar metadata, and unsupported interactive media map
      into the PDF document model.
- [ ] Design an MDX fallback contract so article-specific components can render
      clean PDF-safe output or explicitly opt out.
- [ ] Compare generated PDF quality, file size, CI complexity, dependency
      footprint, and maintenance cost against the current Playwright pipeline.
- [ ] Replace the Chrome-based generator only after the new pipeline passes the
      release gates and produces better scholarly PDFs for the representative
      article set.

## AI-Friendly Content Surfaces

Reason deferred: public machine-readable indexes, route/entity manifests, and
possible `llms.txt` support are valuable platform work, but they should wait
until the typed metadata, structured-data, and route identity model is stable
enough to expose as a durable public contract.

Resume trigger: resume when admin UI work, public content APIs, agent/tool
integrations, `llms.txt`, or external machine-readable content indexing becomes
an active platform goal.

- [ ] Define stable entity `@id` policy for site, publisher, authors, articles,
      announcements, collections, categories, tags, and bibliography sources.
- [ ] Add a public content index endpoint for route discovery and article
      metadata, generated from canonical content data and route helpers.
- [ ] Add a route/entity manifest for platform tooling and future admin UI
      work.
- [ ] Decide whether to add `llms.txt`, including what it promises and how it
      remains current.
- [ ] Add endpoint schema tests, built-output checks for stable IDs and
      canonical URLs, and visibility/robots leak checks before publishing
      machine-readable indexes.
