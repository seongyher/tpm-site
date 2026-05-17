# Deferred Work

The milestone blocks below were copied from the previous `CHECKLIST.md` so
deferred work keeps its exact original wording and checkbox state.

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
