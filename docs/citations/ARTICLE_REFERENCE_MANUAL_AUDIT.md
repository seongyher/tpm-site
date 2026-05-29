# Article Reference Manual Audit

Date: 2026-05-05

This audit manually reviews every article in `site/content/articles/` for
source/reference/citation sections, manual inline citations, and footnotes used
as citations. Automated search was used only as a navigation aid; every article
listed below was inspected directly before a decision was recorded.

Canonical reference syntax for this project is:

- `[^note-*]` for explanatory notes.
- `[^cite-*]` for bibliographic citations.
- Hidden `tpm-bibtex` fenced blocks for structured bibliography data.

Ordinary prose links, image provenance links, selected comment links, and
internal navigation links were left as prose unless they clearly functioned as a
bibliographic source for a claim.

## Changes Made In This Pass

- `site/content/articles/history/2010-decade-review-part-2.md`: converted the
  arXiv link about fringe web communities into a canonical citation with a
  hidden BibTeX entry.
- `site/content/articles/memeculture/homesteading-the-memeosphere.md`: converted
  the Wired "Godwin's Law" source link into a canonical citation with a hidden
  BibTeX entry.
- `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md`:
  removed a citation marker from frontmatter `description`; article
  frontmatter must remain plain metadata.
- `site/content/articles/metamemetics/internetmemetics.md`: restored the
  author-owned Pepe politics appendix as visible article content and removed
  synthetic inline markers from the prose sentence that already refers readers
  to that appendix.

## Numeric Default Correction Review

After reviewing the migrated article set against author intent, inline
bibliography citations now render as numeric markers by default. Source
display labels remain in structured data, but the body marker avoids adding a
second author-year phrase after prose that already says things like
`Knobe (2015)` or `Baxandall (1985, p. 42)`.

The correction pass also checked for bibliography data that accidentally
encoded article structure. No remaining BibTeX entries encode visible headings
or appendix headings as source metadata. `internetmemetics.md` now preserves
its Pepe politics appendix as visible prose, and `postnaturalism.md` keeps its
timeline appendix visible rather than treating it as disposable bibliography
data.

Known limits left intentionally unresolved:

- locator-specific citation rendering, such as page and page-range metadata,
  needs the deferred citation-occurrence design before more intrusive content
  changes;
- visible source appendices need the deferred visible-source-appendix design
  before appendices are generated from, or synchronized with, structured
  bibliography data;
- `what-is-a-meme.md` no longer carries the unrecoverable `source-source`
  placeholder as structured bibliography data because the original source list
  only recorded `^`; replacing it would require editorial source metadata
  rather than mechanical migration.

## Needs Editorial Metadata Review

These are source-like mentions where the article does not provide enough
metadata to safely create structured BibTeX without editorial judgment.

- `site/content/articles/aesthetics/gondola-shrine.md`: Tao Te Ching translation,
  Adorno quote, Otto Rank quote, and Shunryu Suzuki mention need source
  metadata if they should enter the bibliography.
- `site/content/articles/aesthetics/kandinsky-and-loss.md`: Kandinsky's "Dance
  Curves" is source-like but lacks edition/publication metadata.
- `site/content/articles/aesthetics/the-interpretation-of-memes.md`: the Every
  Frame a Painting/Snowpiercer reference lacks source metadata.
- `site/content/articles/memeculture/homesteading-the-memeosphere.md`: Azuma
  Hiroki's otaku database argument lacks a cited source in the article.
- `site/content/articles/memeculture/the-new-years-memes.md`: Wimsatt's "genetic
  bookkeeping argument" lacks source metadata.
- `site/content/articles/metamemetics/internetmemetics.md`: Tim Tyler (2008)
  source claim lacks enough source metadata to create BibTeX safely.
- `site/content/articles/metamemetics/what-is-a-meme.md`: the Mr Chad reference
  needs real source metadata; the legacy `source-source` placeholder contained
  only `^` and was removed from structured bibliography data rather than
  guessed.
- `site/content/articles/politics/the-structure-of-hyperspatial-politics.md`:
  the FCC clarification claim and Tarleton Gillespie "politics of platforms"
  mention lack source metadata.

## Per-Article Decisions

### Aesthetics

- `aesthetics/a-short-note-on-gondola.md`: no citation/source/reference
  sections, no footnotes, and no source-like external links beyond article
  media. Decision: no action.
- `aesthetics/gondola-shrine.md`: no canonical reference section, but contains
  several source-like quotations or mentions without enough metadata. Decision:
  no automatic migration; record metadata-review items above.
- `aesthetics/kandinsky-and-loss.md`: no footnotes or reference section.
  Kandinsky's "Dance Curves" is source-like but lacks metadata. Decision:
  record for metadata review.
- `aesthetics/memes-jokes-and-visual-puns.md`: YouTube, Gestalt, perception,
  and grouping links are contextual prose links. Decision: no action.
- `aesthetics/platform-content-design.md`: original-post provenance link only.
  Decision: no action.
- `aesthetics/structure-and-content-in-drake-style-templates.md`: selected
  comment links and article-provenance links only. Decision: no action.
- `aesthetics/the-interpretation-of-memes.md`: Every Frame a Painting mention
  is source-like but has no source metadata in the article. Decision: record for
  metadata review.
- `aesthetics/tmnh.md`: no citation/source/reference sections or footnotes.
  Decision: no action.
- `aesthetics/we-can-have-retrieval-inference-synthesis.md`: already uses
  canonical `cite-*` markers and hidden `tpm-bibtex`. Decision: canonical
  reviewed, no action.

### Game Studies

- `game-studies/gamergate-as-metagaming.md`: already uses canonical citations
  and hidden BibTeX. Decision: canonical reviewed, no action.
- `game-studies/hotline-miami-and-player-complicity.md`: review essay with
  screenshots, no source/reference section or footnotes. Decision: no action.
- `game-studies/memes-are-not-jokes-they-are-diagram-games.md`: TPM Facebook
  provenance link only. Decision: no action.
- `game-studies/the-memetic-bottleneck.md`: already uses canonical citations
  and hidden BibTeX; remaining links are context or examples. Decision:
  canonical reviewed, no action.
- `game-studies/twitch-plays-pokemon.mdx`: Reddit, KYM, and related links are
  provenance/context for the article's examples. Decision: no action.
- `game-studies/undertale-review.md`: TVTropes and trailer links are context
  links, not a reference section. Decision: no action.

### History

- `history/2010-decade-review-part-1.md`: already uses canonical citations and
  hidden BibTeX. Decision: canonical reviewed, no action.
- `history/2010-decade-review-part-2.md`: the arXiv link about fringe web
  communities clearly supports a claim. Decision: migrated to canonical
  citation and hidden BibTeX.
- `history/a-golden-age-of-meme-pages-and-the-microcosm-of-art-history.md`: no
  source/reference section or footnotes. Decision: no action.
- `history/concept-jjalbang.md`: already uses bibliography-only hidden BibTeX
  for source list entries. Decision: canonical reviewed, no action.
- `history/death-of-a-meme-or-how-leo-learned-to-stop-worrying-and-love-the-bear.md`:
  external links are examples/provenance/context. Decision: no action.
- `history/facebook-groups.md`: no citation/source/reference sections,
  footnotes, or source links. Decision: no action.
- `history/jeremy-cahill-metamer-dismissed-for-serious-misconduct.md`: no
  citation/source/reference sections, footnotes, or source links. Decision: no
  action.
- `history/kym-magibon.md`: already uses a canonical citation for the YouTube
  study; remaining link is provenance. Decision: canonical reviewed, no action.
- `history/long-boys-never-grow-up.md`: Facebook links and interview material
  are evidence/provenance preserved in the article. Decision: no action.
- `history/misattributed-plato-quote-is-real-now.md`: article discusses a fake
  quote and origin page but provides no real source metadata. Decision: no
  action.
- `history/the-meta-ironic-era.md`: internal/TPM links only. Decision: no
  action.
- `history/what-we-talk-about-harambe.md`: already uses canonical citations and
  hidden BibTeX for sources. Decision: canonical reviewed, no action.
- `history/wittgensteins-most-beloved-quote-was-real-but-its-fake-now.md`:
  already uses canonical citations and hidden BibTeX. Decision: canonical
  reviewed, no action.

### Irony

- `irony/bane-loss-and-phylogeny.md`: KYM and Facebook links are context and
  provenance. Decision: no action.
- `irony/defining-normie-casual-ironist-and-autist-in-internet-subcultures.md`:
  already uses a canonical Meaningness citation; selected comment links remain
  visible prose. Decision: canonical reviewed, no action.
- `irony/post-irony-against-meta-irony.md`: Facebook, archive, and selected
  comment links are provenance/commentary; Nietzsche quote appears in selected
  comments, not as an article citation. Decision: no action.
- `irony/the-ironic-normie.md`: KYM and IEP links are contextual prose links.
  Decision: no action.
- `irony/the-quadrant-system-for-the-categorization-of-internet-memes.md`: no
  source/reference section or footnotes. Decision: no action.
- `irony/the-revised-quadrant-model.md`: origin Facebook post link is
  provenance. Decision: no action.
- `irony/when-you-drink-water.md`: visible media credit and selected comment
  links are provenance/commentary. Decision: no action.

### Memeculture

- `memeculture/a-short-note-on-the-death-of-pepe.md`: discussion-group
  provenance link only. Decision: no action.
- `memeculture/all-memes-are-from-the-future.md`: internal link only. Decision:
  no action.
- `memeculture/early-trash-dove.md`: media credits, 4chan/Everipedia links, and
  selected comment links remain visible provenance. Decision: no action.
- `memeculture/gme-frenzy-hints-at-the-new-stage-of-memecultures.md`: internal
  TPM links only. Decision: no action.
- `memeculture/homesteading-the-memeosphere.md`: Raymond and Putnam citations
  were already canonical; the Wired "Godwin's Law" link was migrated to a
  canonical citation. Azuma Hiroki mention remains metadata-review work.
- `memeculture/moe-to-memes-otaku-to-autist.md`: origin `/tpml/` link and
  uncited historical/contextual mentions only. Decision: no action.
- `memeculture/newfriends-and-the-generation-gap.md`: already uses canonical
  Dawkins and Cavalli-Sforza/Feldman citations. Decision: canonical reviewed,
  no action.
- `memeculture/the-new-years-memes.md`: Wimsatt source-like mention lacks
  metadata. Decision: record for metadata review.

### Metamemetics

- `metamemetics/glossary-1-dot-0.md`: no citation/source/reference sections or
  source footnotes. Decision: no action.
- `metamemetics/internetmemetics.md`: already uses extensive canonical
  citations and hidden BibTeX. The Pepe politics appendix is author-owned prose
  and remains visible. Tim Tyler (2008) remains an uncited source-like claim
  without enough metadata. Decision: record Tim Tyler for metadata review.
- `metamemetics/the-memeticists-challenge-remains-open.md`: already uses
  extensive canonical citations and hidden BibTeX. A citation marker in
  frontmatter was removed. Decision: canonical reviewed after cleanup.
- `metamemetics/vulliamy-response.md`: already uses a canonical Evnine
  citation; other links are article-response context. Decision: canonical
  reviewed, no action.
- `metamemetics/what-is-a-meme.md`: already uses canonical notes, citations,
  and hidden BibTeX. The `source-source` placeholder contained only `^`, so it
  was removed from structured bibliography data and recorded for metadata
  review instead of being guessed.
  Decision: record for metadata review.

### Philosophy

- `philosophy/a-school-of-internet-philosophy.md`: origin Facebook group link
  and selected-comment material only. Decision: no action.
- `philosophy/an-internet-koan.md`: source-site/provenance links but no
  bibliography section or citation footnotes. Decision: no action.
- `philosophy/how-to-digitally-coauthor-articles-in-philosophy-class.md`:
  already uses canonical citations and hidden BibTeX. Decision: canonical
  reviewed, no action.
- `philosophy/postnaturalism.md`: already uses canonical citations and hidden
  BibTeX. Decision: canonical reviewed, no action.

### Politics

- `politics/a-tale-of-two-healthcare-narratives.md`: already uses canonical
  citation data for the archived Facebook source; wall/comment links are
  provenance. Decision: canonical reviewed, no action.
- `politics/joshua-citarella-astroturfing.md`: draft article already uses
  canonical Citarella and Fisher citations. Decision: canonical reviewed, no
  action.
- `politics/on-circlejerk-part-1.md`: no source/reference section or
  footnotes; translated/provenance text remains visible. Decision: no action.
- `politics/president-parks-corruption-cult.md`: Korean translation provenance
  link only. Decision: no action.
- `politics/see-the-problem.md`: image and short text only. Decision: no
  action.
- `politics/social-media-freedom.mdx`: already uses canonical citations for
  formal sources; remaining links are context/examples/provenance. Decision:
  canonical reviewed, no action.
- `politics/the-post-pepe-manifesto.md`: no source/reference section or
  footnotes. Decision: no action.
- `politics/the-structure-of-hyperspatial-politics.md`: already uses canonical
  citations for formal sources. FCC clarification and Tarleton Gillespie
  mentions lack source metadata. Decision: canonical reviewed, record metadata
  review items.
- `politics/on-vectoralism-and-the-meme-alliance.mdx`: already uses canonical
  citations and hidden BibTeX for formal sources; remaining links are context or
  examples. Decision: canonical reviewed, no action.
