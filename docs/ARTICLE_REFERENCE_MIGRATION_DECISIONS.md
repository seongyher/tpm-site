# Article Reference Migration Decisions

This report records migration decisions for article-reference cleanup. It is the
human decision layer that sits beside the generated
[`ARTICLE_REFERENCE_CONTENT_MIGRATION.md`](./ARTICLE_REFERENCE_CONTENT_MIGRATION.md)
catalog.

Every future catalog update that changes migration rules, article
classification, exception handling, or content-normalization scope should add or
update a decision record here. The catalog says what the tooling detected; this
report says what we decided to do about it and why.

## Decision Template

Use this shape for future decisions:

```md
### ARD-000: Short Decision Title

- Date: YYYY-MM-DD
- Status: Proposed | Accepted | Superseded
- Applies to: article paths, pattern names, or tooling
- Decision: one concise sentence
- Reasoning: why this is the right interpretation or migration boundary
- Consequences: what changes, what remains unresolved, and what reviewers
  should check
- Verification: scripts, tests, or review steps used to validate the decision
```

## Current Decisions

### ARD-001: Catalog Every Article Before Manual Normalization

- Date: 2026-05-05
- Status: Accepted
- Applies to:
  [`ARTICLE_REFERENCE_CONTENT_MIGRATION.md`](./ARTICLE_REFERENCE_CONTENT_MIGRATION.md)
- Decision: The migration catalog must include every article file, including
  files with no detected reference-like content.
- Reasoning: A full generated inventory prevents accidental omissions and keeps
  clean/prose-only articles visible during review.
- Consequences: The catalog is generated from repository content by
  `just references-catalog -- --write`; manual prose should not be added
  directly to generated article entries because it will be overwritten.
- Verification: The catalog generator test asserts one entry per article in its
  fixture corpus.

### ARD-002: Ordinary Prose Links Are Not Bibliography Entries

- Date: 2026-05-05
- Status: Accepted
- Applies to: Markdown links, raw URLs, and archive links across
  `site/content/articles/`
- Decision: Ordinary links remain prose links unless an article is explicitly
  edited to cite the source with a `cite-*` marker and matching `tpm-bibtex`
  entry.
- Reasoning: Links can be navigational, illustrative, archival, or incidental;
  inferring citation intent from link syntax would overstate bibliography data
  and distort author intent.
- Consequences: Articles can be marked `prose-links-only` even when they contain
  many external links. The global bibliography remains empty for those links
  until manual citation normalization promotes specific links into structured
  citation data.
- Verification: The audit and catalog tests cover prose links as inventoried
  but non-blocking content.

### ARD-003: Mechanical Cleanup Is Limited To Simple HTML Links And Paragraphs

- Date: 2026-05-05
- Status: Accepted
- Applies to:
  `site/content/articles/philosophy/an-internet-koan.md`,
  `site/content/articles/politics/social-media-freedom.mdx`
- Decision: The first mechanical pass may convert only simple raw HTML
  `<a href>` links and simple HTML paragraph wrappers into equivalent Markdown.
- Reasoning: These conversions preserve displayed text and destination while
  reducing legacy markup. They do not require deciding whether a link is a
  citation.
- Consequences: The mechanical pass converted seven simple raw HTML links and
  two simple paragraph wrappers. It intentionally did not create any `cite-*`,
  `note-*`, or `tpm-bibtex` syntax.
- Verification: `just references-migrate-mechanical -- --write` performed
  the pass; a follow-up dry run reports no remaining mechanical-safe changes.
  The script has focused tests and the site passed `just check`,
  `just build`, `just verify`, and `just validate-html`.

### ARD-004: Glossary Named Anchors Are Structural, Not Mechanical Link Cleanup

- Date: 2026-05-05
- Status: Accepted
- Applies to:
  `site/content/articles/metamemetics/glossary-1-dot-0.md`
- Decision: Raw HTML `<a name="..."></a>` anchors are not part of the
  mechanical link cleanup pass.
- Reasoning: They are in-page structural anchors used by the article's table of
  contents. Changing them requires a layout/anchor compatibility decision, not
  a citation migration.
- Consequences: `glossary-1-dot-0.md` remains `manual-required` because it has
  20 structural raw HTML anchors. A future pass may either preserve them with an
  explicit exception or migrate them to a supported heading-ID pattern after
  checking historical links.
- Verification: The mechanical migration script ignores named anchors, and the
  remaining audit reports exactly 20 raw HTML links from this article.

### ARD-005: Reference Sections Require Manual Classification Before BibTeX

- Date: 2026-05-05
- Status: Accepted
- Applies to:
  `site/content/articles/game-studies/gamergate-as-metagaming.md`,
  `site/content/articles/metamemetics/internetmemetics.md`,
  `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md`,
  `site/content/articles/metamemetics/what-is-a-meme.md`,
  `site/content/articles/philosophy/how-to-digitally-coauthor-articles-in-philosophy-class.md`,
  `site/content/articles/philosophy/postnaturalism.md`
- Decision: Reference and bibliography sections should not be automatically
  converted into `tpm-bibtex` entries without manual review.
- Reasoning: A visible reference-section entry may be a bibliography source,
  explanatory reading list item, incomplete citation, citation prose, or article
  artifact. BibTeX fields must be accurate enough to become structured site
  data.
- Consequences: Tooling can extract worklists, but a reviewer must classify each
  item before content rewrites. After classification, some renaming or insertion
  work may become scriptable.
- Verification: The audit records reference-section headings and leaves them as
  manual-review candidates.

### ARD-006: Existing Numeric Footnotes Need Note-Versus-Citation Review

- Date: 2026-05-05
- Status: Accepted
- Applies to:
  `site/content/articles/metamemetics/what-is-a-meme.md`,
  `site/content/articles/philosophy/postnaturalism.md`
- Decision: Numeric footnotes should not be mechanically renamed until each
  footnote is classified as an explanatory `note-*`, a bibliographic `cite-*`,
  or a mixed case requiring manual structure changes.
- Reasoning: Some footnotes are explanatory asides, some are source references,
  and some combine explanation with source material. Blind renaming would make
  invalid semantic states easy to create.
- Consequences: These articles remain manual-required. A later pass should
  produce an itemized classification table before applying any transformations.
- Verification: The catalog lists line-level footnote definitions and markers
  for both articles.

### ARD-007: Media Source Credits Stay Visible Until Reviewed

- Date: 2026-05-05
- Status: Accepted
- Applies to:
  `site/content/articles/memeculture/early-trash-dove.md`
- Decision: Media/source credit lines should remain visible article content
  until reviewed.
- Reasoning: Image credits are partly attribution and partly source context.
  They may need a different editorial treatment than bibliography citations.
- Consequences: The article remains manual-required with two media/source credit
  lines. A future decision should choose whether to keep them visible, convert
  them to structured image-credit metadata, or cite them as bibliography sources.
- Verification: The audit and catalog keep media/source credit lines separate
  from ordinary links and bibliography references.

### ARD-008: Stop After Mechanical Cleanup Until Review

- Date: 2026-05-05
- Status: Superseded by ARD-011 through ARD-015
- Applies to: current article-reference migration phase
- Decision: After mechanical cleanup, stop before manual citation/reference
  classification.
- Reasoning: The remaining work changes citation semantics and should be
  reviewed article by article before content rewrites.
- Consequences: The current unresolved manual-review set is eight articles:
  `gamergate-as-metagaming.md`, `early-trash-dove.md`,
  `glossary-1-dot-0.md`, `internetmemetics.md`,
  `the-memeticists-challenge-remains-open.md`, `what-is-a-meme.md`,
  `how-to-digitally-coauthor-articles-in-philosophy-class.md`, and
  `postnaturalism.md`.
- Verification: `just references-audit` reports eight manual-review
  candidates after the mechanical pass.

### ARD-009: Preserve Glossary Anchors Without Legacy Link Markup

- Date: 2026-05-05
- Status: Accepted
- Applies to:
  `site/content/articles/metamemetics/glossary-1-dot-0.md`
- Decision: Replace legacy `<a name="..."></a>` anchors with empty
  `<span id="..."></span>` anchors that preserve the historical fragment IDs.
- Reasoning: The anchors are structural navigation targets, not reader-visible
  links or bibliography data. Preserving the existing IDs avoids breaking the
  article's hand-authored table of contents while removing obsolete link
  markup.
- Consequences: The article remains semantically the same for readers and
  existing hash links, but it no longer appears as a raw-link migration
  candidate.
- Verification: `just references-audit` no longer reports raw HTML links for
  the glossary after the rewrite.

### ARD-010: Keep Image Credits Visible As Editorial Credit Prose

- Date: 2026-05-05
- Status: Accepted
- Applies to:
  `site/content/articles/memeculture/early-trash-dove.md`
- Decision: Keep image credits visible near the images, formatted as italic
  editorial prose rather than bibliography entries.
- Reasoning: These lines attribute image sources, but they are not citations
  supporting article claims. Converting them to bibliography data would
  overstate their role while hiding useful image context from readers.
- Consequences: The article keeps the same visible attribution context and no
  longer appears as a media-credit migration candidate. A future image-credit
  metadata model can still move these credits into structured image data if
  needed.
- Verification: `just references-audit` no longer reports media/source
  credit candidates for the article after the rewrite.

### ARD-011: Convert Small Claim-Tied Reference Sections To BibTeX Citations

- Date: 2026-05-05
- Status: Accepted
- Applies to:
  `site/content/articles/game-studies/gamergate-as-metagaming.md`,
  `site/content/articles/philosophy/how-to-digitally-coauthor-articles-in-philosophy-class.md`
- Decision: Replace compact reference sections with inline `cite-*` markers
  and hidden `tpm-bibtex` entries when every listed source has a clear
  claim-level citation point in the article prose.
- Reasoning: These articles already cite sources with author-year prose. Adding
  a marker at that citation point preserves reader context and lets the article
  and global bibliography render structured source data without a duplicated
  visible reference list.
- Consequences: The original reference headings were removed. The generated
  article references now own bibliography rendering for those sources. Reviewers
  should check BibTeX field accuracy, especially names and publication details.
- Verification: `just references-audit` reports no reference-section
  candidates for these articles, and `just build` succeeds with the
  generated citations.

### ARD-012: Preserve Long Historical Bibliographies As Visible Source Lists

- Date: 2026-05-05
- Status: Superseded by ARD-018
- Applies to:
  `site/content/articles/metamemetics/internetmemetics.md`,
  `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md`
- Decision: Rename long standalone bibliography sections to `Source List`
  rather than converting every entry into synthetic inline citation markers.
- Reasoning: These sections function as broad historical source inventories,
  not only claim-by-claim source notes. Forcing each entry into the current
  inline-marker model would create noisy, artificial citation markers and make
  the structured bibliography imply a tighter claim relationship than the
  article text supports.
- Consequences: The source lists remain visible for content fidelity, but their
  entries do not appear in the global bibliography until a future structured
  source-list model is designed. This is not a parser exception; it is a
  content classification decision.
- Verification: `just references-audit` reports no manual candidates for
  these articles, and the generated catalog still inventories their ordinary
  prose links and raw URLs.

### ARD-018: Convert Historical Source Lists To Bibliography-Only BibTeX

- Date: 2026-05-05
- Status: Accepted
- Applies to:
  `site/content/articles/aesthetics/we-can-have-retrieval-inference-synthesis.md`,
  `site/content/articles/metamemetics/internetmemetics.md`,
  `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md`,
  `site/content/articles/metamemetics/what-is-a-meme.md`
- Decision: Convert visible `Reference` and `Source List` sections into hidden
  `tpm-bibtex` entries. Preserve each original source-list line in a TPM
  `citation` field, and add parsed fields such as `author`, `title`, `year`,
  and `url` only when they can be recovered mechanically enough to aid sorting,
  grouping, and future export review.
- Reasoning: The user clarified that renamed source-list prose is not an
  acceptable end state when the entries can conceivably become structured
  bibliography data. Bibliography-only `tpm-bibtex` entries solve the earlier
  concern about synthetic inline markers: the article bibliography and global
  bibliography can aggregate source data without inventing artificial
  claim-level anchors.
- Consequences: The source lists no longer render as standalone Markdown
  sections. Entries with clear inline numeric references were converted to
  `[^cite-*]` markers. Broad bibliography entries without precise inline
  anchors render as bibliography-only article references with no backlinks.
  Reviewers should treat generated field extraction as conservative migration
  scaffolding; the `citation` field is the content-fidelity source of truth.
- Verification: `just references-audit -- --quiet` reports zero
  manual candidates and zero reference-section headings. The regenerated
  catalog classifies these articles as canonical references.

### ARD-013: Convert Explanatory Numeric Footnotes To Canonical Notes

- Date: 2026-05-05
- Status: Accepted
- Applies to:
  `site/content/articles/metamemetics/what-is-a-meme.md`
- Decision: Convert the article's seven numeric footnotes to descriptive
  `note-*` labels. Source markers in prose use `cite-*`, and source-list
  entries are stored in hidden `tpm-bibtex`.
- Reasoning: The footnotes are explanatory asides. Some source references are
  embedded inside those note bodies, and the current article-reference plugin
  intentionally keeps note prose separate from citation-marker collection.
  Treating those note-contained references as structured citations would require
  new renderer behavior rather than a content-only migration.
- Consequences: The notes are now canonical and release-valid. The historical
  numbered source list feeds article-local bibliography rendering and the
  global bibliography instead of remaining as a visible Markdown section.
- Verification: `just references-audit` reports no noncanonical footnotes
  for the article, and the strict Markdown build succeeds.

### ARD-014: Convert Source-Only Numeric Footnotes To BibTeX Citations

- Date: 2026-05-05
- Status: Accepted
- Applies to:
  `site/content/articles/philosophy/postnaturalism.md`
- Decision: Convert source-only numeric footnotes to repeatable `cite-*`
  markers and replace the footnote-definition reference section with hidden
  BibTeX entries.
- Reasoning: Unlike explanatory notes, these legacy footnotes are source
  citations. The canonical citation model represents repeated source use
  directly and removes the obsolete footnote-definition form.
- Consequences: Thirty-three BibTeX entries were created from the existing
  source lines. Ambiguous web-only or DOI-only references use conservative
  fallback titles and identifiers so the data remains parseable and reviewable.
  Reviewers should refine any fallback titles where better metadata is known.
- Verification: `just references-audit` reports no noncanonical footnotes
  and no reference-section heading for the article. `just build`
  succeeds with all citation markers matched to BibTeX keys.

### ARD-015: Enable Strict Legacy Footnote Validation

- Date: 2026-05-05
- Status: Accepted
- Applies to: `astro.config.ts`, published Markdown/MDX article rendering
- Decision: Enable `validateLegacyFootnotes: true` for the
  `remarkArticleReferences` plugin now that the published corpus has no
  noncanonical footnotes.
- Reasoning: The migration is only durable if future article edits fail fast
  when they introduce obsolete numeric or arbitrary footnote labels. Strict
  validation makes invalid reference syntax a build failure instead of a
  best-effort audit warning.
- Consequences: New explanatory notes must use `note-*`; new claim-level
  bibliography citations must use `cite-*` plus matching hidden BibTeX.
  Bibliography-only BibTeX entries are valid for broad source-list entries.
  Existing ordinary links remain valid article content.
- Verification: `just references-audit` reports zero manual candidates, and
  `just build` succeeds with strict validation enabled.

### ARD-016: Keep Bibliography Backlink Groups Out Of Page Landmarks

- Date: 2026-05-05
- Status: Accepted
- Applies to:
  `src/components/bibliography/BibliographySourceArticles.astro`,
  `docs/components/bibliography/BibliographySourceArticles.md`
- Decision: Render per-source "Cited by" article backlinks as a labeled content
  group, not as a repeated `section` landmark.
- Reasoning: After the corpus migration populated the global bibliography with
  many structured citation entries, repeated nested sections with the same
  accessible label created duplicate page landmarks. The backlink group is
  metadata inside one bibliography entry, not a major document region.
- Consequences: Readers still see a clear "Cited by" label and semantic list of
  article links, while assistive-technology landmark navigation stays focused
  on the page's meaningful regions.
- Verification: `just validate-html` passes on the rebuilt
  bibliography page, and `BibliographySourceArticles` has a render test for the
  non-landmark contract.

### ARD-017: Do Not Carry Article Reference Exceptions

- Date: 2026-05-05
- Status: Accepted
- Applies to: published article reference corpus
- Decision: The normalized article corpus carries no explicit parser exceptions
  or requested-permission gaps for article references.
- Reasoning: After classifying every detected legacy pattern, each article
  could either be normalized to canonical `note-*` or `cite-*` syntax, migrated
  to bibliography-only `tpm-bibtex`, or preserved as ordinary prose links
  without requiring a parser exemption.
- Consequences: Future noncanonical footnotes and visible `tpm-bibtex` blocks
  should fail tooling instead of being hidden behind temporary allowlists.
  Reviewers should treat new exceptions as a separate explicit editorial and
  technical decision.
- Verification: `just references-audit` reports zero manual-review
  candidates, zero noncanonical footnote definitions, zero noncanonical
  footnote markers, zero reference headings, and zero visible BibTeX blocks.

### ARD-019: Manual Full-Corpus Reference Audit

- Date: 2026-05-05
- Status: Accepted
- Applies to: all files under `site/content/articles/`
- Decision: Manually inspect every article for citation/source/reference
  sections, manual inline citations, and footnotes being used as citations
  after the automated audit missed real cases.
- Reasoning: The automated audit is useful as a safety net but is not the
  source of truth for editorial citation semantics. Some source-like material is
  ordinary provenance or context, while some formal citations are embedded in
  prose. That distinction requires article-by-article judgment.
- Consequences: Clear missed source links were converted to canonical
  `cite-*` markers plus hidden `tpm-bibtex`. Source-like mentions without
  enough metadata were not guessed into BibTeX; they are recorded for editorial
  review in `docs/ARTICLE_REFERENCE_MANUAL_AUDIT.md`.
- Verification: The manual audit report lists every inspected article and
  decision. Reference/content checks must pass after the clear migrations.

### ARD-020: Preserve Author-Owned Appendices And Default To Numeric Citations

- Date: 2026-05-05
- Status: Accepted
- Applies to: article reference rendering and migrated article appendices
- Decision: Inline bibliography citations render as bracketed numeric markers
  by default. Generated source labels remain structured data, but they are not
  the default body marker style. Author-owned appendices are article prose and
  must stay visible unless a specific visible-source-appendix design is
  approved.
- Reasoning: Existing articles often already include author-year prose such as
  `Knobe (2015)` or `Laal & Ghodsi (2011)`. Rendering generated author-year
  labels beside that prose duplicates the citation and harms readability.
  Appendix sections can contain source-like entries, but their headings and
  placement are part of the author's structure, not disposable bibliography UI.
- Consequences: The renderer now defaults to `[1]`-style citation markers.
  `internetmemetics.md` restores its Pepe politics appendix as visible content
  and removes the invalid BibTeX entry that encoded the appendix heading as a
  source. Structured support for visible source appendices remains deferred.
- Verification: Focused reference tests, reference/content checks, Markdown
  formatting, and the Astro build must pass after the correction.

### ARD-021: Remove Unrecoverable Placeholder Source Entries

- Date: 2026-05-05
- Status: Accepted
- Applies to:
  `site/content/articles/metamemetics/what-is-a-meme.md`,
  `src/lib/article-references/normalize.ts`
- Decision: Literal BibTeX `citation` fields must contain real display text;
  placeholder-only values such as `^` are invalid structured bibliography data.
- Reasoning: The global bibliography is source data, not a place to preserve
  broken migration artifacts. A placeholder that has no letters or digits
  cannot identify a source and should not render as a bibliography entry. When
  the original article lacks enough metadata to recover the source, preserve
  the prose claim and record the missing source for editorial review.
- Consequences: The `source-source` placeholder attached to the Mr Chad
  sentence in `what-is-a-meme.md` was removed rather than guessed. Future
  placeholder-only literal citation fields fail normalization with a
  `malformed-bibtex` diagnostic.
- Verification: Focused normalization and bibliography tests cover the invalid
  placeholder case, and the rebuilt bibliography page should contain no
  source entry whose text is `^`.
