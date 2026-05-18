# Citation BibTeX Manual Inspection

Date: 2026-05-17

This is the human review layer on top of
`docs/CITATION_BIBTEX_AUDIT.md`. The structural audit proves that the corpus
has 246 parsed BibTeX entries. This pass manually inspected all 246 inventory
rows in order and checked source file blocks where the compact inventory hid
important structured fields.

This report is not the final canonical source correction pass. It identifies
visible mistakes, suspicious entries, duplicate/merge work, and cleanup order so
the correction pass can proceed without skipping any citation.
The manual source-verification standard for that correction pass is defined in
`docs/CITATION_CANONICAL_VERIFICATION.md`; the per-entry lookup ledger is
`docs/CITATION_CANONICAL_VERIFICATION_LEDGER.md`.

## Coverage Proof

- Structural source: `bun run references:bibtex:audit -- --json`.
- Manual working inventory: rows 1 through 246 from the parsed audit inventory.
- Entries manually inspected: 246 of 246.
- Article source files with hidden `tpm-bibtex` blocks inspected: 23 of 23.
- Inline citation markers missing BibTeX entries: 0.
- Parser diagnostics blocking review: 0.

The manual review is complete when every range in the ledger below is accounted
for. The row ranges are contiguous and end at row 246.

## Manual Review Ledger

|    Rows | Entries | Article                                                                      | Manual status                                                                                                                                                                                                                                                                                                                                                                                    |
| ------: | ------: | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|     1-7 |       7 | `aesthetics/we-can-have-retrieval-inference-synthesis.md`                    | Source lookup and correction batch applied. Entries now use structured `@book`, `@article`, and `@inbook` shapes; row 6's malformed title is fixed.                                                                                                                                                                                                                                              |
|    8-11 |       4 | `game-studies/gamergate-as-metagaming.md`                                    | Source lookup and correction batch applied. Scholarly book/article records now include identifiers and row 10 is normalized to an `@online` Overland source.                                                                                                                                                                                                                                     |
|   12-16 |       5 | `game-studies/the-memetic-bottleneck.md`                                     | Source lookup and correction batch applied. Eisner and Sperber are structured as book/chapter records; McCloud, Shifman, and Claussen are normalized as online sources; Shifman remains duplicate-merge-ready with other rows.                                                                                                                                                                   |
|   17-19 |       3 | `history/2010-decade-review-part-1.md`                                       | Rows 17 and 19 received a conservative cleanup pass; row 18 is corrected to the ACM/arXiv proceedings source and marked duplicate-merge-ready with row 20. Row 19 still needs an edition/translation decision.                                                                                                                                                                                   |
|      20 |       1 | `history/2010-decade-review-part-2.md`                                       | Corrected to the ACM/arXiv proceedings source and marked duplicate-merge-ready with row 18.                                                                                                                                                                                                                                                                                                      |
|   21-23 |       3 | `history/concept-jjalbang.md`                                                | Source lookup and correction batch applied. Namu Wiki and Money Today are normalized; the Facebook group permalink remains ambiguous because public metadata is limited. Bibliography-only usage still needs a project decision.                                                                                                                                                                 |
|      24 |       1 | `history/kym-magibon.md`                                                     | Inspected and normalized as a YouTube source, but still needs editorial/source recovery because the title `Study of Magibon` is too generic and public lookup did not recover canonical video metadata.                                                                                                                                                                                          |
|   25-35 |      11 | `history/what-we-talk-about-harambe.md`                                      | Source lookup and correction batch applied. Web articles now include organizations/dates, social posts have provider/access metadata, and the dead Vine/Facebook sources are explicitly marked ambiguous.                                                                                                                                                                                        |
|   36-38 |       3 | `history/wittgensteins-most-beloved-quote-was-real-but-its-fake-now.md`      | Source lookup and correction batch applied. Malcolm and Hanson now have structured source metadata; Dribble remains ambiguous because richer public metadata is not recoverable from lookup.                                                                                                                                                                                                     |
|      39 |       1 | `irony/defining-normie-casual-ironist-and-autist-in-internet-subcultures.md` | Source lookup and correction batch applied. The Meaningness source now has author/date/provider/access metadata.                                                                                                                                                                                                                                                                                 |
|   40-42 |       3 | `memeculture/homesteading-the-memeosphere.md`                                | Source lookup and correction batch applied. Raymond is structured as a `First Monday` article, Godwin has Wired date/provider metadata, and the Putnam video remains ambiguous pending upload metadata.                                                                                                                                                                                          |
|   43-44 |       2 | `memeculture/newfriends-and-the-generation-gap.md`                           | Source lookup and correction batch applied. Book sources now include publication location and ISBN data.                                                                                                                                                                                                                                                                                         |
|  45-119 |      75 | `metamemetics/internetmemetics.md`                                           | Source lookup and correction batches applied for all rows. Entries now use structured article/book/chapter/proceedings/online shapes with explicit duplicate-ready, edition ambiguity, archive ambiguity, DOI2BIB/Crossref sanity-check, and editorial-review notes. Duplicate overlap with `the-memeticists-challenge-remains-open` still needs reconciliation after rows 120-161 are verified. |
| 120-161 |      42 | `metamemetics/the-memeticists-challenge-remains-open.md`                     | Source lookup and correction batch applied. Generic `@misc` records are now structured as article/book/chapter/online entries; duplicates with `internetmemetics.md` are marked duplicate-merge-ready, and Aunger edited-volume chapter page/date ambiguities remain explicit in the canonical ledger.                                                                                           |
|     162 |       1 | `metamemetics/vulliamy-response.md`                                          | Source lookup and correction applied. The Evnine PDF citation is now a structured `@article` with journal, pages, DOI, and retained author-PDF URL; duplicate-ready with row 163.                                                                                                                                                                                                                |
| 163-179 |      17 | `metamemetics/what-is-a-meme.md`                                             | First correction batch applied after source lookup. The severe mechanical field splits are fixed; rows 164, 170, 172, 177, and 179 still carry ambiguity/editorial-review notes in the canonical verification ledger.                                                                                                                                                                            |
| 180-184 |       5 | `philosophy/how-to-digitally-coauthor-articles-in-philosophy-class.md`       | Source lookup and correction batch applied. Alfano/Jockers/Knobe/Laal-Ghodsi now include identifiers and page/DOI data where available; Weatherson is normalized to an `@online` dated blog post.                                                                                                                                                                                                |
| 185-217 |      33 | `philosophy/postnaturalism.md`                                               | Second correction batch applied. The remaining Clark/Chalmers, Hintikka, Haack, and Rorty completion rows are now structured; Cummins remains explicitly ambiguous for anthology page evidence; Plato edition policy remains editorial-review.                                                                                                                                                   |
|     218 |       1 | `politics/a-tale-of-two-healthcare-narratives.md`                            | Source lookup completed. Archive-only source still lacks recoverable author/date/canonical title metadata, so it remains ambiguous rather than invented.                                                                                                                                                                                                                                         |
| 219-220 |       2 | `politics/joshua-citarella-astroturfing.md`                                  | Source lookup completed. Fisher is verified as a k-punk web source; the Citarella Instagram permalink remains ambiguous because public metadata is dynamic.                                                                                                                                                                                                                                      |
| 221-237 |      17 | `politics/on-vectoralism-and-the-meme-alliance.mdx`                          | Source lookup completed. Web article sources are verified/clean where possible; Adblock Plus was normalized to the canonical blog URL/author/date; Meme Alliance pages and the Wark multi-video source remain explicitly unresolved.                                                                                                                                                             |
| 238-240 |       3 | `politics/social-media-freedom.mdx`                                          | Source lookup and correction batch applied. Dibbell and Bratton are now web/video sources with expanded author names; R. v. Elliott remains a legal `@misc`; Bratton lacks a stable date.                                                                                                                                                                                                        |
| 241-246 |       6 | `politics/the-structure-of-hyperspatial-politics.mdx`                        | Source lookup and correction batch applied. Conway now exposes Datamation volume/issue/pages; Barbrook/Cameron is structured as a `Science as Culture` article with DOI; OILab remains undated but verified-clean.                                                                                                                                                                               |

## Definite Visible Mistakes

These can be fixed without waiting for a complete style policy because the
current entries are visibly wrong or internally inconsistent.

|     Rows | Keys                                                                                                                                                                            | Problem                                                                                                                                                                            |
| -------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|        6 | `wollheim-r-1980-criticism-as-retrieval`                                                                                                                                        | Resolved in the aesthetics correction batch. The entry is now an `@inbook` for `Criticism as Retrieval` in `Art and Its Objects`, with pages and DOI.                              |
|   18, 20 | `zannettou-caulfield-2018-origins-of-memes`, `zannettou-s-2018-origins-of-memes`                                                                                                | Resolved as duplicate-merge-ready. Both entries now use the ACM/arXiv proceedings metadata; merge keys only after cross-article duplicate policy is applied.                       |
|       24 | `magibon-study-2011`                                                                                                                                                            | Title `Study of Magibon` is too generic to identify the source reliably. Needs real video/source title and contributor metadata.                                                   |
|       28 | `wardell-b-trejo-d-harambe-vine`                                                                                                                                                | Missing date and points at a dead Vine URL. Needs archive or replacement canonical source.                                                                                         |
|  47, 121 | `aunger-r-2001-darwinizing-culture-the-status-of`, `aunger-r-2000-darwinizing-culture-the-status-of`                                                                            | Both rows are now structured and duplicate-merge-ready. Remaining work is a cross-article 2000/2001 date convention and canonical-key decision for the shared edited volume.       |
|  48, 122 | `aunger-r-2002-the-electric-meme-a-new`                                                                                                                                         | Both rows are now structured and duplicate-merge-ready; shared source identity can be standardized in the duplicate cleanup pass.                                                  |
|  53, 123 | `blackmore-s-1999-the-meme-machine-oxford-oxford`, `blackmore-s-j-1999-the-meme-machine`                                                                                        | Both rows are now structured and duplicate-merge-ready; shared source identity can be standardized in the duplicate cleanup pass.                                                  |
|  59, 126 | `claidere-n-scott-2014-how-darwinian-is-cultural-evolution`, `claidiere-n-scott-2014-how-darwinian-is-cultural-evolution`                                                       | Both rows are now structured and duplicate-merge-ready. The source fields use canonical author spelling; the duplicate cleanup pass can decide whether to normalize migrated keys. |
|       61 | `cullen-b-1998-parasite-ecology-and-the-evolution`                                                                                                                              | Resolved in the `internetmemetics.md` rows 61-80 batch. The structured source uses the 1999 edited volume while retaining the migrated key/citation's 1998 trace.                  |
|       65 | `dawkins-r-1993-viruses-of-the-mind`                                                                                                                                            | Resolved in the `internetmemetics.md` rows 61-80 batch. The entry is now an `@inbook` with editor, booktitle, publisher, and page metadata.                                        |
|       84 | `heylighen-f-1998-what-makes-a-meme-successful`                                                                                                                                 | Resolved in the `internetmemetics.md` rows 81-100 batch. The entry is now an `@inproceedings` source with the corrected title and page range `418--423`.                           |
|       95 | `milner-r-2012-the-world-made-meme`                                                                                                                                             | Resolved in the `internetmemetics.md` rows 81-100 batch. The entry is now the 2012 University of Kansas dissertation, not the later 2016 MIT Press book.                           |
| 105, 144 | `segev-e-nissenbaum-2015-families-and-networks-of-internet`                                                                                                                     | Both rows are now structured and duplicate-merge-ready; shared source identity can be standardized in the duplicate cleanup pass.                                                  |
| 108, 145 | `shifman-l-2013b-memes-in-digital-culture`, `shifman-l-2013-memes-in-digital-culture`                                                                                           | Both rows are now structured and duplicate-merge-ready; shared source identity can be standardized in the duplicate cleanup pass.                                                  |
| 109, 146 | `shifman-l-2015-memeology-festival-05`, `shifman-l-2015-november-10`                                                                                                            | Both rows are now structured and duplicate-merge-ready; shared source identity can be standardized in the duplicate cleanup pass.                                                  |
| 110, 148 | `shifman-l-thelwall-2009-assessing-global-diffusion-with-web`, `shifman-l-and-2009-assessing-global-diffusion-with-web`                                                         | Both rows are now structured and duplicate-merge-ready; shared source identity can be standardized in the duplicate cleanup pass.                                                  |
|      115 | `wiggins-b-bowers-2014-memes-as-genre-a-structural`                                                                                                                             | Resolved in the `internetmemetics.md` rows 101-119 batch. The entry now uses the corrected title, journal, volume, issue, pages, and DOI.                                          |
| 135, 154 | `lynch-a-1996-the-population-memetics-of-bird`, `lynch-a-1996-the-population-memetics-of-bird-2`                                                                                | Exact duplicate inside the same article; row 154 is unused and marked duplicate-merge-ready.                                                                                       |
|      157 | `williams-g-c-1966-adaptation-and-natural-selection-a`                                                                                                                          | Resolved in the `the-memeticists-challenge-remains-open.md` batch. The entry now includes Princeton University Press publisher/location metadata.                                  |
|  158-161 | `blackmore-s-2000-the-memes-eye-view`, `dawkins-r-1986-the-blind-watchmaker`, `hull-d-2000-taking-memetics-seriously`, `sperber-d-2000-an-objection-to-the-memetic-approach`    | Source structure is now explicit. Blackmore and Hull remain ambiguous only for exact edited-volume chapter page/DOI metadata; Dawkins and Sperber are structured.                  |
|  163-166 | `evnine-simon-j-2018-303-318`, `dawkins-richard-the-1989-189-201`, `shifman-limor-memes-2015-shifman-limor-memes-in-digital`, `milner-ryan-the-2016-milner-ryan-the-world-made` | Resolved in the first correction batch. Row 164 still needs exact edition/page verification before being marked fully verified.                                                    |
|  174-179 | `kuipers-giselinde-media-2002-450-470`, `milner-ryan-logics-in-the-world-made-meme`, `weitz-morris-the-1956-27-35`, `wittgenstein-ludwig-philosophical-1953-translated-by-e`    | Mostly resolved in the first correction batch. Row 179 remains an edition/year ambiguity because the article cites a 1997 Blackwell printing of a 1953 work.                       |
|      187 | `taylor-francis-2018-philosophical-method`                                                                                                                                      | Resolved in the `postnaturalism.md` correction batch. DOI metadata identified the Bickle article and supplied journal fields.                                                      |
| 198, 203 | `plato-republic-book-ix`, `plato-republic-book-i`                                                                                                                               | Incomplete classical text citations. Need edition/translator/source, or a deliberate project convention for classical works.                                                       |
| 199, 202 | `tipton-2014-philosophical-biology`, `tipton-2014-parts-of-animals`                                                                                                             | Duplicate same book under two keys. Book metadata is now structured; merge keys only after locator/reference policy is decided.                                                    |
|      201 | `springer-2007-darwin-aristotle`                                                                                                                                                | Resolved in the `postnaturalism.md` correction batch. DOI metadata identified the Johnson article and supplied journal fields.                                                     |
|      217 | `springer-2012-slime-mold-network`                                                                                                                                              | Resolved in the `postnaturalism.md` correction batch. DOI metadata identified the Johansson/Zou conference paper and supplied proceedings fields.                                  |
|      218 | `archive-8kozz-healthcare-narrative`                                                                                                                                            | Archive-only metadata. Lookup did not recover canonical source details; remains ambiguous by design rather than invented.                                                          |
|      226 | `wark-m-what-if-this-is-not-still-capitalism`                                                                                                                                   | Citation names multiple video lectures but stores only one URL structurally. Needs either multiple related entries or a field strategy for multiple URLs.                          |
|      241 | `conway-m-1968-how-do-committees-invent`                                                                                                                                        | Resolved. Datamation volume/issue/page data is now exposed in structured fields.                                                                                                   |

## Repeated Cleanup Patterns

### Transitional `citation` field

204 entries still rely on `citation = {...}` as display evidence. This is the
main reason the sitewide bibliography cannot yet be treated as clean structured
data. During cleanup, retain the literal `citation` as evidence until a
canonical source record is created, then remove it when the structured fields
are enough.

### Generic `@misc`

5 entries remain generic `@misc`. The remaining cases are mostly intentional
or policy-bound edge cases such as legal/classical/edition sources where the
project does not yet have a more specific citation type. Future cleanup should
still prefer stable source shapes when the source shape is known:

- `@book` for monographs and edited volumes;
- `@article` for journal and magazine articles;
- `@incollection` or `@inproceedings` for chapters and conference papers;
- `@online` or a project-supported equivalent for web pages, videos, posts,
  archived pages, and encyclopedia pages.

### DOI strings trapped in prose

The original high-priority DOI-backed rows have been normalized during the
canonical correction pass. Any remaining missing identifiers are mostly
non-DOI books, web pages, classical texts, legal documents, or policy-bound
edge cases rather than obvious DOI strings trapped in prose.

### Duplicate source identity

The structural audit currently reports 39 duplicate candidate clusters. The
manual pass agrees that
the following are especially likely true duplicates:

- Aunger, `Darwinizing Culture`;
- Aunger, `The Electric Meme`;
- Dawkins, `The Selfish Gene`;
- Lynch, `The Population Memetics of Bird Song`;
- Shifman, `Memes in Digital Culture`;
- Shifman, `Memeology Festival 05`;
- Shifman and Thelwall, `Assessing Global Diffusion with Web Memetics`;
- Segev et al., `Families and Networks of Internet Memes`;
- Zannettou et al., `On the Origins of Memes`;
- Tipton, `Philosophical Biology in Aristotle's Parts of Animals`.

Duplicate cleanup should not blindly delete entries. First choose canonical
source metadata, then update all article entries to the same key/source shape,
then re-run the structural audit to confirm aggregation improved.

### Bibliography-only entries

Rows 21-23, 40-41, 45, 47, 50, 52, 56, 61-62, 68-70, 72, 74-79, 82-84,
87-88, 90-91, 93-95, 97, 100, 102, 112, 116, and 154 have zero inline marker
uses. Some are intentionally source-list entries from visible bibliographies,
especially in `internetmemetics.md`; others are suspicious. Before deleting any
unused entry, decide whether the article should preserve bibliography-only
source lists as a supported authoring mode.

## Priority Cleanup Order

1. Resolve exact/near duplicate source identities across
   `internetmemetics.md`, `the-memeticists-challenge-remains-open.md`, and
   smaller articles.
2. Decide project policy for remaining edge cases: classical-text editions,
   legal decisions, bibliography-only source lists, and multi-URL video
   citations.
3. Normalize web, video, social, and archive records: add dates when available,
   archive dead URLs, and decide how to represent multi-URL sources.
4. Decide the supported behavior for bibliography-only entries before removing
   any zero-marker source records.

## Correction Pass Verification

Each correction pass should end with:

1. `bun run references:bibtex:audit -- --write --quiet`
2. A diff review of `docs/CITATION_BIBTEX_AUDIT.md` to prove marker/entry
   coverage did not regress.
3. Sitewide bibliography inspection for duplicate collapse.
4. Article-level inspection for at least one affected article page.
5. `bun run check:release` before handoff if article source files changed.
