# Citation BibTeX Audit

Generated from repository content on May 21, 2026.

Historical tooling note: the `just references-*` audit commands used to
generate this report were retired from the active command surface during the
Rust/`just` migration. This document remains source material for manual
citation cleanup; restoring automated citation audit commands should be an
explicit new tooling task.

This report inventories every article `[^cite-*]` marker and every hidden
`tpm-bibtex` entry under `site/content/articles/`. It is a structural
audit, not the final source-correction pass: every inventory row still
needs human verification against the canonical source before editing the
article citation data.

Canonical verification rules live in
`docs/CITATION_CANONICAL_VERIFICATION.md`; the per-entry source lookup
ledger lives in `docs/CITATION_CANONICAL_VERIFICATION_LEDGER.md`.

## Coverage Proof

- Articles scanned: 60
- Articles with citation markers: 22
- Articles with hidden BibTeX: 23
- Hidden `tpm-bibtex` blocks: 23
- Inline citation marker occurrences: 297
- Unique inline citation keys: 201
- Parsed BibTeX entries in full inventory: 246
- Used BibTeX entries: 208
- Bibliography-only BibTeX entries: 38
- Missing BibTeX entries for inline markers: 0
- Parser diagnostics: 0
- Citation audit diagnostics: 568
- Duplicate candidate clusters: 39

Coverage is complete when the scanned article count matches the article
corpus, every parsed BibTeX entry appears exactly once in the full
inventory, every inline marker is either attached to an entry or listed in
the missing-entry table, and parser diagnostics are zero.

## BibTeX Field Model

- The classic BibTeX model defines entry-type-specific required and
  optional fields, such as `author`, `title`, `journal`, `year`,
  `publisher`, `booktitle`, `pages`, and `note`.
- Modern web citations commonly need BibLaTeX-style fields such as `url`,
  `urldate`, `doi`, `date`, `journaltitle`, and `organization`.
- TPM currently accepts parser-compatible BibTeX-like data and stores
  unknown fields, but `citation = {...}` is a transitional migration field.
  It is useful evidence for cleanup, not a clean final source model.
- Authoring references: [BibTeXing](https://texdoc.org/serve/btxdoc/0)
  for classic BibTeX field expectations and
  [biblatex](https://texdoc.org/serve/biblatex/0) for modern web and
  identifier fields.

## High-Level Findings

- 204 entries still use the transitional `citation` field.
- 0 entries are effectively literal citation strings rather than structured BibTeX.
- 0 entries use unsupported source types.
- 5 entries are `@misc`; many probably need a more specific type after verification.
- 0 entries appear to attach usage-specific locator data to source records.
- 1 entries lack a structured contributor field such as `author`, `editor`, or `organization`.
- 16 entries lack a structured date field.
- 26 entries lack a structured identifier such as `url`, `doi`, `isbn`, or `issn`.
- 39 probable duplicate clusters need manual comparison before sitewide bibliography aggregation can be trusted.
- 0 inline citation keys have no matching BibTeX entry.

## Citation Diagnostics

- Error diagnostics: 0
- Review diagnostics: 568

- `citation-field-transitional`: 204
- `duplicate-candidate`: 46
- `generic-misc-type`: 5
- `missing-contributor`: 1
- `missing-date`: 16
- `missing-structured-identifier`: 26
- `missing-url-field`: 22
- `needs-external-verification`: 246
- `possible-entry-type-upgrade`: 2

Detailed diagnostics are available from
`just references-bibtex-audit -- --json`; the inventory table below
keeps per-entry review flags beside the source records authors need to
repair.

## Required Cleanup Strategy

1. Work article by article, using the full inventory below as the checklist.
2. For each row, search for the canonical source and rewrite the entry into
   structured BibTeX fields instead of relying on a literal `citation`
   string.
3. Prefer specific types (`@article`, `@book`, `@incollection`, `@online`,
   etc.) over generic `@misc` when the source shape is known.
4. Merge duplicate clusters only after confirming they refer to the same
   source. Similar titles and reused URLs are review signals, not automatic
   proof.
5. Re-run `just references-bibtex-audit -- --write` after each cleanup
   pass to prove that no citation markers or entries were skipped.

## Article Coverage

<!-- prettier-ignore-start -->

| Article | Markers | Unique markers | BibTeX entries | Missing entries | Unused entries | Parse diagnostics | Duplicate keys |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `site/content/articles/aesthetics/a-short-note-on-gondola.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/aesthetics/gondola-shrine.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/aesthetics/kandinsky-and-loss.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/aesthetics/memes-jokes-and-visual-puns.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/aesthetics/platform-content-design.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/aesthetics/structure-and-content-in-drake-style-templates.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/aesthetics/the-interpretation-of-memes.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/aesthetics/tmnh.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/aesthetics/we-can-have-retrieval-inference-synthesis.md` | 18 | 7 | 7 | 0 | 0 | 0 | None |
| `site/content/articles/game-studies/gamergate-as-metagaming.md` | 12 | 4 | 4 | 0 | 0 | 0 | None |
| `site/content/articles/game-studies/hotline-miami-and-player-complicity.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/game-studies/memes-are-not-jokes-they-are-diagram-games.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/game-studies/the-memetic-bottleneck.md` | 5 | 5 | 5 | 0 | 0 | 0 | None |
| `site/content/articles/game-studies/twitch-plays-pokemon.mdx` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/game-studies/undertale-review.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/history/2010-decade-review-part-1.md` | 4 | 3 | 3 | 0 | 0 | 0 | None |
| `site/content/articles/history/2010-decade-review-part-2.md` | 1 | 1 | 1 | 0 | 0 | 0 | None |
| `site/content/articles/history/a-golden-age-of-meme-pages-and-the-microcosm-of-art-history.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/history/concept-jjalbang.md` | 0 | 0 | 3 | 0 | 3 | 0 | None |
| `site/content/articles/history/death-of-a-meme-or-how-leo-learned-to-stop-worrying-and-love-the-bear.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/history/facebook-groups.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/history/kym-magibon.md` | 1 | 1 | 1 | 0 | 0 | 0 | None |
| `site/content/articles/history/long-boys-never-grow-up.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/history/misattributed-plato-quote-is-real-now.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/history/the-meta-ironic-era.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/history/what-we-talk-about-harambe.md` | 11 | 11 | 11 | 0 | 0 | 0 | None |
| `site/content/articles/history/wittgensteins-most-beloved-quote-was-real-but-its-fake-now.md` | 3 | 3 | 3 | 0 | 0 | 0 | None |
| `site/content/articles/irony/bane-loss-and-phylogeny.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/irony/defining-normie-casual-ironist-and-autist-in-internet-subcultures.md` | 1 | 1 | 1 | 0 | 0 | 0 | None |
| `site/content/articles/irony/post-irony-against-meta-irony.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/irony/the-ironic-normie.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/irony/the-quadrant-system-for-the-categorization-of-internet-memes.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/irony/the-revised-quadrant-model.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/irony/when-you-drink-water.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/memeculture/a-short-note-on-the-death-of-pepe.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/memeculture/all-memes-are-from-the-future.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/memeculture/early-trash-dove.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/memeculture/gme-frenzy-hints-at-the-new-stage-of-memecultures.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/memeculture/homesteading-the-memeosphere.md` | 1 | 1 | 3 | 0 | 2 | 0 | None |
| `site/content/articles/memeculture/moe-to-memes-otaku-to-autist.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/memeculture/newfriends-and-the-generation-gap.md` | 2 | 2 | 2 | 0 | 0 | 0 | None |
| `site/content/articles/memeculture/the-new-years-memes.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/metamemetics/glossary-1-dot-0.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/metamemetics/internetmemetics.md` | 84 | 43 | 75 | 0 | 32 | 0 | None |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 64 | 41 | 42 | 0 | 1 | 0 | None |
| `site/content/articles/metamemetics/vulliamy-response.md` | 1 | 1 | 1 | 0 | 0 | 0 | None |
| `site/content/articles/metamemetics/what-is-a-meme.md` | 17 | 17 | 17 | 0 | 0 | 0 | None |
| `site/content/articles/philosophy/a-school-of-internet-philosophy.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/philosophy/an-internet-koan.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/philosophy/how-to-digitally-coauthor-articles-in-philosophy-class.md` | 5 | 5 | 5 | 0 | 0 | 0 | None |
| `site/content/articles/philosophy/postnaturalism.md` | 35 | 33 | 33 | 0 | 0 | 0 | None |
| `site/content/articles/politics/a-tale-of-two-healthcare-narratives.md` | 1 | 1 | 1 | 0 | 0 | 0 | None |
| `site/content/articles/politics/joshua-citarella-astroturfing.md` | 2 | 2 | 2 | 0 | 0 | 0 | None |
| `site/content/articles/politics/on-circlejerk-part-1.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 20 | 17 | 17 | 0 | 0 | 0 | None |
| `site/content/articles/politics/president-parks-corruption-cult.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/politics/see-the-problem.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/politics/social-media-freedom.mdx` | 3 | 3 | 3 | 0 | 0 | 0 | None |
| `site/content/articles/politics/the-post-pepe-manifesto.md` | 0 | 0 | 0 | 0 | 0 | 0 | None |
| `site/content/articles/politics/the-structure-of-hyperspatial-politics.mdx` | 6 | 6 | 6 | 0 | 0 | 0 | None |

## Duplicate Review Clusters

### 1. citation: `aunger r 2002 the electric meme a new theory of how we think new york free press`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 214 | `aunger-r-2002-the-electric-meme-a-new` | The Electric Meme: A New Theory of How We Think |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 168 | `aunger-r-2002-the-electric-meme-a-new` | The Electric Meme: A New Theory of How We Think |

### 2. citation: `dawkins r 1976 the selfish gene oxford oxford university press`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 422 | `dawkins-r-1976-the-selfish-gene-oxford-oxford` | The Selfish Gene |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 222 | `dawkins-r-1976-the-selfish-gene` | The Selfish Gene |

### 3. citation: `lynch a 1996 the population memetics of bird song semioticon retrieved from`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 306 | `lynch-a-1996-the-population-memetics-of-bird` | The Population Memetics of Bird Song |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 512 | `lynch-a-1996-the-population-memetics-of-bird-2` | The Population Memetics of Bird Song |

### 4. citation: `zannettou s caulfield t blackburn j de cristofaro e sirivianos m stringhini g suarez tangil g 2018 on the origins of me...`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/history/2010-decade-review-part-1.md` | 40 | `zannettou-caulfield-2018-origins-of-memes` | On the Origins of Memes by Means of Fringe Web Communities |
| `site/content/articles/history/2010-decade-review-part-2.md` | 72 | `zannettou-s-2018-origins-of-memes` | On the Origins of Memes by Means of Fringe Web Communities |

### 5. doi: `10.1002/asi.21185`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 889 | `shifman-l-thelwall-2009-assessing-global-diffusion-with-web` | Assessing Global Diffusion with Web Memetics: The Spread and Evolution of a Popular Joke |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 449 | `shifman-l-and-2009-assessing-global-diffusion-with-web` | Assessing Global Diffusion with Web Memetics: The Spread and Evolution of a Popular Joke |

### 6. doi: `10.1093/acprof:oso/9780192632449.001.0001`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 202 | `aunger-r-2001-darwinizing-culture-the-status-of` | Darwinizing Culture: The Status of Memetics as a Science |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 156 | `aunger-r-2000-darwinizing-culture-the-status-of` | Darwinizing Culture: The Status of Memetics as a Science |

### 7. doi: `10.1093/acprof:oso/9780192632449.003.0008`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/game-studies/the-memetic-bottleneck.md` | 116 | `sperber-d-2000-an-objection-to-the-memetic-approach` | An Objection to the Memetic Approach to Culture |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 585 | `sperber-d-2000-an-objection-to-the-memetic-approach` | An objection to the memetic approach to culture |

### 8. doi: `10.1093/aesthj/ayy021`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/vulliamy-response.md` | 18 | `evnine-s-2018-the-anonymity-of-a-murmur` | The Anonymity of a Murmur: Internet (and Other) Memes |
| `site/content/articles/metamemetics/what-is-a-meme.md` | 190 | `evnine-simon-j-2018-303-318` | The Anonymity of a Murmur: Internet (and Other) Memes |

### 9. doi: `10.1098/rstb.2013.0368`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 337 | `claidere-n-scott-2014-how-darwinian-is-cultural-evolution` | How Darwinian Is Cultural Evolution? |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 210 | `claidiere-n-scott-2014-how-darwinian-is-cultural-evolution` | How Darwinian is cultural evolution? |

### 10. doi: `10.1111/jcc4.12120`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 833 | `segev-e-nissenbaum-2015-families-and-networks-of-internet` | Families and Networks of Internet Memes: The Relationship Between Cohesiveness, Uniqueness, and Quiddity Concreteness |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 405 | `segev-e-nissenbaum-2015-families-and-networks-of-internet` | Families and Networks of Internet Memes: The Relationship Between Cohesiveness, Uniqueness, and Quiddity Concreteness |

### 11. doi: `10.1145/3278532.3278550`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/history/2010-decade-review-part-1.md` | 40 | `zannettou-caulfield-2018-origins-of-memes` | On the Origins of Memes by Means of Fringe Web Communities |
| `site/content/articles/history/2010-decade-review-part-2.md` | 72 | `zannettou-s-2018-origins-of-memes` | On the Origins of Memes by Means of Fringe Web Communities |

### 12. doi: `10.1162/posc_a_00057`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 325 | `burman-j-t-2012-the-misunderstanding-of-memes-biography` | The Misunderstanding of Memes: Biography of an Unscientific Object, 1976--1999 |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 188 | `burman-j-t-2012-the-misunderstanding-of-memes-biography` | The misunderstanding of memes: Biography of an unscientific object, 1976--1999 |

### 13. doi: `10.7551/mitpress/9429.001.0001`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 869 | `shifman-l-2013b-memes-in-digital-culture` | Memes in Digital Culture |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 417 | `shifman-l-2013-memes-in-digital-culture` | Memes in Digital Culture |
| `site/content/articles/metamemetics/what-is-a-meme.md` | 214 | `shifman-limor-memes-2015-shifman-limor-memes-in-digital` | Memes in Digital Culture |

### 14. title: `an objection to the memetic approach to culture`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/game-studies/the-memetic-bottleneck.md` | 116 | `sperber-d-2000-an-objection-to-the-memetic-approach` | An Objection to the Memetic Approach to Culture |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 585 | `sperber-d-2000-an-objection-to-the-memetic-approach` | An objection to the memetic approach to culture |

### 15. title: `assessing global diffusion with web memetics the spread and evolution of a popular joke`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 889 | `shifman-l-thelwall-2009-assessing-global-diffusion-with-web` | Assessing Global Diffusion with Web Memetics: The Spread and Evolution of a Popular Joke |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 449 | `shifman-l-and-2009-assessing-global-diffusion-with-web` | Assessing Global Diffusion with Web Memetics: The Spread and Evolution of a Popular Joke |

### 16. title: `cultural transmission and evolution a quantitative approach`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/memeculture/newfriends-and-the-generation-gap.md` | 38 | `cavalli-sforza-feldman-1981-cultural-transmission` | Cultural Transmission and Evolution: A Quantitative Approach |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 200 | `cavalli-sforza-l-1981-cultural-transmission-and-evolution-a` | Cultural Transmission and Evolution: A Quantitative Approach |

### 17. title: `darwinizing culture the status of memetics as a science`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 202 | `aunger-r-2001-darwinizing-culture-the-status-of` | Darwinizing Culture: The Status of Memetics as a Science |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 156 | `aunger-r-2000-darwinizing-culture-the-status-of` | Darwinizing Culture: The Status of Memetics as a Science |

### 18. title: `families and networks of internet memes the relationship between cohesiveness uniqueness and quiddity concreteness`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 833 | `segev-e-nissenbaum-2015-families-and-networks-of-internet` | Families and Networks of Internet Memes: The Relationship Between Cohesiveness, Uniqueness, and Quiddity Concreteness |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 405 | `segev-e-nissenbaum-2015-families-and-networks-of-internet` | Families and Networks of Internet Memes: The Relationship Between Cohesiveness, Uniqueness, and Quiddity Concreteness |

### 19. title: `how darwinian is cultural evolution`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 337 | `claidere-n-scott-2014-how-darwinian-is-cultural-evolution` | How Darwinian Is Cultural Evolution? |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 210 | `claidiere-n-scott-2014-how-darwinian-is-cultural-evolution` | How Darwinian is cultural evolution? |

### 20. title: `memeology festival 05 memes as ritual virals as transmission in praise of blurry boundaries`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/game-studies/the-memetic-bottleneck.md` | 106 | `shifman-l-2015-memeology-festival-05` | Memeology Festival 05. Memes as Ritual, Virals as Transmission? In Praise of Blurry Boundaries |
| `site/content/articles/metamemetics/internetmemetics.md` | 879 | `shifman-l-2015-memeology-festival-05` | Memeology Festival 05: Memes as Ritual, Virals as Transmission? In Praise of Blurry Boundaries |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 427 | `shifman-l-2015-november-10` | Memeology Festival 05: Memes as Ritual, Virals as Transmission? In Praise of Blurry Boundaries |

### 21. title: `memes in digital culture`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 869 | `shifman-l-2013b-memes-in-digital-culture` | Memes in Digital Culture |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 417 | `shifman-l-2013-memes-in-digital-culture` | Memes in Digital Culture |
| `site/content/articles/metamemetics/what-is-a-meme.md` | 214 | `shifman-limor-memes-2015-shifman-limor-memes-in-digital` | Memes in Digital Culture |

### 22. title: `on the origins of memes by means of fringe web communities`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/history/2010-decade-review-part-1.md` | 40 | `zannettou-caulfield-2018-origins-of-memes` | On the Origins of Memes by Means of Fringe Web Communities |
| `site/content/articles/history/2010-decade-review-part-2.md` | 72 | `zannettou-s-2018-origins-of-memes` | On the Origins of Memes by Means of Fringe Web Communities |

### 23. title: `philosophical biology in aristotle s parts of animals`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/philosophy/postnaturalism.md` | 327 | `tipton-2014-parts-of-animals` | Philosophical Biology in Aristotle's Parts of Animals |
| `site/content/articles/philosophy/postnaturalism.md` | 295 | `tipton-2014-philosophical-biology` | Philosophical Biology in Aristotle's Parts of Animals |

### 24. title: `philosophical investigations`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/history/wittgensteins-most-beloved-quote-was-real-but-its-fake-now.md` | 80 | `dribble-h-2004-philosophical-investigations` | Philosophical Investigations |
| `site/content/articles/metamemetics/what-is-a-meme.md` | 357 | `wittgenstein-ludwig-philosophical-1953-translated-by-e` | Philosophical Investigations |

### 25. title: `richard dawkins on the internet s hijacking of the word meme`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 901 | `solon-o-2013-richard-dawkins-on-the-internet` | Richard Dawkins on the internet's hijacking of the word 'meme' |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 461 | `solon-o-2013-june-20` | Richard Dawkins on the internet's hijacking of the word 'meme' |

### 26. title: `the anonymity of a murmur internet and other memes`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/vulliamy-response.md` | 18 | `evnine-s-2018-the-anonymity-of-a-murmur` | The Anonymity of a Murmur: Internet (and Other) Memes |
| `site/content/articles/metamemetics/what-is-a-meme.md` | 190 | `evnine-simon-j-2018-303-318` | The Anonymity of a Murmur: Internet (and Other) Memes |

### 27. title: `the electric meme a new theory of how we think`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 214 | `aunger-r-2002-the-electric-meme-a-new` | The Electric Meme: A New Theory of How We Think |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 168 | `aunger-r-2002-the-electric-meme-a-new` | The Electric Meme: A New Theory of How We Think |

### 28. title: `the meme machine`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 268 | `blackmore-s-1999-the-meme-machine-oxford-oxford` | The Meme Machine |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 178 | `blackmore-s-j-1999-the-meme-machine` | The Meme Machine |

### 29. title: `the misunderstanding of memes biography of an unscientific object 1976 1999`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 325 | `burman-j-t-2012-the-misunderstanding-of-memes-biography` | The Misunderstanding of Memes: Biography of an Unscientific Object, 1976--1999 |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 188 | `burman-j-t-2012-the-misunderstanding-of-memes-biography` | The misunderstanding of memes: Biography of an unscientific object, 1976--1999 |

### 30. title: `the population memetics of bird song`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 306 | `lynch-a-1996-the-population-memetics-of-bird` | The Population Memetics of Bird Song |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 512 | `lynch-a-1996-the-population-memetics-of-bird-2` | The Population Memetics of Bird Song |

### 31. title: `the revealed poverty of the gene meme analogy why memetics per se has failed to produce substantive results`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 539 | `edmonds-b-2005-the-revealed-poverty-of-the` | The Revealed Poverty of the Gene-Meme Analogy: Why Memetics per se Has Failed to Produce Substantive Results |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 492 | `edmonds-b-2005-the-revealed-poverty-of-the` | The revealed poverty of the gene-meme analogy – why memetics per se has failed to produce substantive results |

### 32. title: `the selfish gene`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/memeculture/newfriends-and-the-generation-gap.md` | 28 | `dawkins-r-1976-the-selfish-gene` | The Selfish Gene |
| `site/content/articles/metamemetics/internetmemetics.md` | 422 | `dawkins-r-1976-the-selfish-gene-oxford-oxford` | The Selfish Gene |
| `site/content/articles/metamemetics/internetmemetics.md` | 474 | `dawkins-r-1989-the-selfish-gene-oxford-oxford` | The Selfish Gene |
| `site/content/articles/metamemetics/internetmemetics.md` | 495 | `dawkins-r-2006-the-selfish-gene-30th-anniversary` | The Selfish Gene |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 222 | `dawkins-r-1976-the-selfish-gene` | The Selfish Gene |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 232 | `dawkins-r-2006-the-selfish-gene-30th-anniversary` | The Selfish Gene |

### 33. title: `three challenges for the survival of memetics`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 529 | `edmonds-b-2002-three-challenges-for-the-survival` | Three Challenges for the Survival of Memetics |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 502 | `edmonds-b-2002-three-challenges-for-the-survival` | Three Challenges for the Survival of Memetics |

### 34. url: `http://cfpm.org/jom-emit/2002/vol6/edmonds_b_letter.html`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 529 | `edmonds-b-2002-three-challenges-for-the-survival` | Three Challenges for the Survival of Memetics |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 502 | `edmonds-b-2002-three-challenges-for-the-survival` | Three Challenges for the Survival of Memetics |

### 35. url: `http://cfpm.org/jom-emit/2005/vol9/edmonds_b.html`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 539 | `edmonds-b-2005-the-revealed-poverty-of-the` | The Revealed Poverty of the Gene-Meme Analogy: Why Memetics per se Has Failed to Produce Substantive Results |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 492 | `edmonds-b-2005-the-revealed-poverty-of-the` | The revealed poverty of the gene-meme analogy – why memetics per se has failed to produce substantive results |

### 36. url: `https://arxiv.org/abs/1805.12512`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/history/2010-decade-review-part-1.md` | 40 | `zannettou-caulfield-2018-origins-of-memes` | On the Origins of Memes by Means of Fringe Web Communities |
| `site/content/articles/history/2010-decade-review-part-2.md` | 72 | `zannettou-s-2018-origins-of-memes` | On the Origins of Memes by Means of Fringe Web Communities |

### 37. url: `https://culturedigitally.org/2015/11/memeology-festival-05-memes-as-ritual-virals-as-transmission-in-praise-of-blurry-b...`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/game-studies/the-memetic-bottleneck.md` | 106 | `shifman-l-2015-memeology-festival-05` | Memeology Festival 05. Memes as Ritual, Virals as Transmission? In Praise of Blurry Boundaries |
| `site/content/articles/metamemetics/internetmemetics.md` | 879 | `shifman-l-2015-memeology-festival-05` | Memeology Festival 05: Memes as Ritual, Virals as Transmission? In Praise of Blurry Boundaries |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 427 | `shifman-l-2015-november-10` | Memeology Festival 05: Memes as Ritual, Virals as Transmission? In Praise of Blurry Boundaries |

### 38. url: `https://semioticon.com/virtuals/imitation/alynch_paper.pdf`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 306 | `lynch-a-1996-the-population-memetics-of-bird` | The Population Memetics of Bird Song |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 512 | `lynch-a-1996-the-population-memetics-of-bird-2` | The Population Memetics of Bird Song |

### 39. url: `https://www.wired.com/story/richard-dawkins-memes`

| Article | Line | Key | Title / citation |
| --- | ---: | --- | --- |
| `site/content/articles/metamemetics/internetmemetics.md` | 901 | `solon-o-2013-richard-dawkins-on-the-internet` | Richard Dawkins on the internet's hijacking of the word 'meme' |
| `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 461 | `solon-o-2013-june-20` | Richard Dawkins on the internet's hijacking of the word 'meme' |

## Missing BibTeX Entries

No inline citation markers are missing BibTeX entries.

## Full Citation Inventory

| # | Article | Line | Key | Type | Used | Fields | Flags | Review text |
| ---: | --- | ---: | --- | --- | ---: | --- | --- | --- |
| 1 | `site/content/articles/aesthetics/we-can-have-retrieval-inference-synthesis.md` | 32 | `baxandall-m-1985-patterns-of-intention` | `book` | 5 | `author`, `citation`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `needs-external-verification` | Patterns of Intention: On the Historical Explanation of Pictures |
| 2 | `site/content/articles/aesthetics/we-can-have-retrieval-inference-synthesis.md` | 42 | `haack-r-1982-wittgenstein-s-pragmatism` | `article` | 1 | `author`, `citation`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | Wittgenstein's Pragmatism |
| 3 | `site/content/articles/aesthetics/we-can-have-retrieval-inference-synthesis.md` | 53 | `hull-d-l-1978-a-matter-of-individuality` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | A Matter of Individuality |
| 4 | `site/content/articles/aesthetics/we-can-have-retrieval-inference-synthesis.md` | 65 | `lewens-t-2004-organisms-and-artifacts-design-in` | `book` | 1 | `author`, `citation`, `isbn`, `publisher`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Organisms and Artifacts: Design in Nature and Elsewhere |
| 5 | `site/content/articles/aesthetics/we-can-have-retrieval-inference-synthesis.md` | 75 | `wollheim-r-1968-art-and-its-objects` | `book` | 5 | `author`, `citation`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | Art and Its Objects |
| 6 | `site/content/articles/aesthetics/we-can-have-retrieval-inference-synthesis.md` | 84 | `wollheim-r-1980-criticism-as-retrieval` | `inbook` | 2 | `author`, `booktitle`, `citation`, `doi`, `edition`, `pages`, `publisher`, `title`, `year` | `citation-field-transitional`, `needs-external-verification` | Criticism as Retrieval |
| 7 | `site/content/articles/aesthetics/we-can-have-retrieval-inference-synthesis.md` | 96 | `wollheim-r-1984-art-interpretation-and-the-creative` | `article` | 3 | `author`, `citation`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | Art, Interpretation, and the Creative Process |
| 8 | `site/content/articles/game-studies/gamergate-as-metagaming.md` | 14 | `boluk-lemieux-2017` | `book` | 4 | `author`, `date`, `isbn`, `location`, `publisher`, `title`, `url`, `year` | `needs-external-verification` | Metagaming: Playing, Competing, Spectating, Cheating, Trading, Making, and Breaking Videogames |
| 9 | `site/content/articles/game-studies/gamergate-as-metagaming.md` | 25 | `chess-shaw-2015` | `article` | 2 | `author`, `date`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `needs-external-verification` | A Conspiracy of Fishes, or, How We Learned to Stop Worrying About #GamerGate and Embrace Hegemonic Masculinity |
| 10 | `site/content/articles/game-studies/gamergate-as-metagaming.md` | 37 | `keogh-2014` | `online` | 1 | `author`, `date`, `organization`, `title`, `url`, `urldate` | `needs-external-verification` | Game of moans: the death throes of the male ‘gamer’ |
| 11 | `site/content/articles/game-studies/gamergate-as-metagaming.md` | 46 | `mortensen-2018` | `article` | 5 | `author`, `date`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `needs-external-verification` | Anger, Fear, and Games: The Long Event of #GamerGate |
| 12 | `site/content/articles/game-studies/the-memetic-bottleneck.md` | 88 | `eisner-w-comics-and-sequential-art` | `book` | 1 | `author`, `citation`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | Comics and Sequential Art |
| 13 | `site/content/articles/game-studies/the-memetic-bottleneck.md` | 98 | `mccloud-s-infinite-canvas` | `online` | 1 | `author`, `citation`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | The Infinite Canvas |
| 14 | `site/content/articles/game-studies/the-memetic-bottleneck.md` | 106 | `shifman-l-2015-memeology-festival-05` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Memeology Festival 05. Memes as Ritual, Virals as Transmission? In Praise of Blurry Boundaries |
| 15 | `site/content/articles/game-studies/the-memetic-bottleneck.md` | 116 | `sperber-d-2000-an-objection-to-the-memetic-approach` | `inbook` | 1 | `author`, `booktitle`, `citation`, `doi`, `editor`, `location`, `pages`, `publisher`, `title`, `url`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | An Objection to the Memetic Approach to Culture |
| 16 | `site/content/articles/game-studies/the-memetic-bottleneck.md` | 130 | `claussen-a-unpopular-opinion-all-narrative-is-linear` | `online` | 1 | `author`, `citation`, `note`, `organization`, `title`, `type`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Unpopular Opinion: All Narrative is Linear |
| 17 | `site/content/articles/history/2010-decade-review-part-1.md` | 30 | `her-zharova-2015-six-eras-of-memetic-history` | `online` | 2 | `author`, `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Six Eras of Memetic History |
| 18 | `site/content/articles/history/2010-decade-review-part-1.md` | 40 | `zannettou-caulfield-2018-origins-of-memes` | `inproceedings` | 1 | `author`, `booktitle`, `citation`, `doi`, `pages`, `publisher`, `title`, `url`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | On the Origins of Memes by Means of Fringe Web Communities |
| 19 | `site/content/articles/history/2010-decade-review-part-1.md` | 52 | `benjamin-w-1935-the-work-of-art` | `misc` | 1 | `author`, `citation`, `origdate`, `title`, `year` | `citation-field-transitional`, `generic-misc-type`, `missing-structured-identifier`, `needs-external-verification` | The Work of Art in the Age of Mechanical Reproduction |
| 20 | `site/content/articles/history/2010-decade-review-part-2.md` | 72 | `zannettou-s-2018-origins-of-memes` | `inproceedings` | 1 | `author`, `booktitle`, `citation`, `doi`, `pages`, `publisher`, `title`, `url`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | On the Origins of Memes by Means of Fringe Web Communities |
| 21 | `site/content/articles/history/concept-jjalbang.md` | 20 | `namuwiki-jjalbang` | `online` | 0 | `citation`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | 짤방 |
| 22 | `site/content/articles/history/concept-jjalbang.md` | 28 | `moneytoday-2009-gaejoogi` | `online` | 0 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | 추억의 스타 '개죽이' 지금은... |
| 23 | `site/content/articles/history/concept-jjalbang.md` | 38 | `international-meme-studies-jjalbang` | `online` | 0 | `citation`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Original post about jjalbang |
| 24 | `site/content/articles/history/kym-magibon.md` | 14 | `magibon-study-2011` | `online` | 1 | `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Study of Magibon |
| 25 | `site/content/articles/history/what-we-talk-about-harambe.md` | 44 | `goodall-ifaw-2016-harambe-killing` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Jane Goodall, Azzedine Downes Together Offer Thoughts on Tragic Harambe Killing |
| 26 | `site/content/articles/history/what-we-talk-about-harambe.md` | 54 | `gervais-r-2016-harambe-tweet` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Harambe Tweet |
| 27 | `site/content/articles/history/what-we-talk-about-harambe.md` | 64 | `wardell-b-2016-dicks-out-for-harambe-tweet` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Dicks Out for Harambe Tweet |
| 28 | `site/content/articles/history/what-we-talk-about-harambe.md` | 74 | `wardell-b-trejo-d-harambe-vine` | `online` | 1 | `author`, `citation`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Harambe Vine |
| 29 | `site/content/articles/history/what-we-talk-about-harambe.md` | 83 | `robinson-j-2016-harambe-mcharambeface` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Gorilla Named Harambe McHarambeface After Chinese Zoo Visitors Are Asked to Choose One |
| 30 | `site/content/articles/history/what-we-talk-about-harambe.md` | 93 | `kriss-s-2016-the-harambe-variations` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | The Harambe Variations |
| 31 | `site/content/articles/history/what-we-talk-about-harambe.md` | 103 | `feldman-b-2016-harambe-forever` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | The Dark Internet Humor of Harambe Jokes |
| 32 | `site/content/articles/history/what-we-talk-about-harambe.md` | 113 | `collins-m-2010-post-irony-is-real` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Post-irony is real, and so what? |
| 33 | `site/content/articles/history/what-we-talk-about-harambe.md` | 123 | `lettuce-dog-2016-harambe-racism` | `online` | 1 | `author`, `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Harambe Racism Argument |
| 34 | `site/content/articles/history/what-we-talk-about-harambe.md` | 133 | `griffin-a-2016-cincinnati-zoo-harambe-memes` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Cincinnati Zoo Asks People to Stop Making Harambe Memes |
| 35 | `site/content/articles/history/what-we-talk-about-harambe.md` | 143 | `griffin-a-2016-cincinnati-zoo-deletes-social-media` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Harambe: Cincinnati Zoo Deletes Its Facebook and Twitter Accounts After Being Bombarded by Memes |
| 36 | `site/content/articles/history/wittgensteins-most-beloved-quote-was-real-but-its-fake-now.md` | 71 | `malcolm-n-1958-ludwig-wittgenstein-a-memoir` | `book` | 1 | `author`, `citation`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | Ludwig Wittgenstein: A Memoir |
| 37 | `site/content/articles/history/wittgensteins-most-beloved-quote-was-real-but-its-fake-now.md` | 80 | `dribble-h-2004-philosophical-investigations` | `online` | 1 | `author`, `citation`, `organization`, `title`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `duplicate-candidate`, `needs-external-verification` | Philosophical Investigations |
| 38 | `site/content/articles/history/wittgensteins-most-beloved-quote-was-real-but-its-fake-now.md` | 88 | `hanson-c-2004-armchair-philosopher-pens-two-books` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Armchair Philosopher Pens Two Books |
| 39 | `site/content/articles/irony/defining-normie-casual-ironist-and-autist-in-internet-subcultures.md` | 47 | `chapman-d-geeks-mops-sociopaths` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Geeks, MOPs, and Sociopaths in Subculture Evolution |
| 40 | `site/content/articles/memeculture/homesteading-the-memeosphere.md` | 42 | `raymond-e-s-1998-homesteading-the-noosphere` | `article` | 0 | `author`, `citation`, `journal`, `number`, `title`, `url`, `urldate`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Homesteading the Noosphere |
| 41 | `site/content/articles/memeculture/homesteading-the-memeosphere.md` | 54 | `putnam-h-bad-philosophy-is-omnipresent` | `online` | 0 | `author`, `citation`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Bad philosophy is omnipresent |
| 42 | `site/content/articles/memeculture/homesteading-the-memeosphere.md` | 63 | `godwin-m-1994-meme-counter-meme` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Meme, Counter-meme |
| 43 | `site/content/articles/memeculture/newfriends-and-the-generation-gap.md` | 28 | `dawkins-r-1976-the-selfish-gene` | `book` | 1 | `author`, `citation`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The Selfish Gene |
| 44 | `site/content/articles/memeculture/newfriends-and-the-generation-gap.md` | 38 | `cavalli-sforza-feldman-1981-cultural-transmission` | `book` | 1 | `author`, `citation`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Cultural Transmission and Evolution: A Quantitative Approach |
| 45 | `site/content/articles/metamemetics/internetmemetics.md` | 179 | `alvarez-a-2004-memetics-an-evolutionary-theory-of` | `article` | 0 | `author`, `citation`, `journal`, `pages`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Memetics: An Evolutionary Theory of Cultural Transmission |
| 46 | `site/content/articles/metamemetics/internetmemetics.md` | 190 | `atran-s-2001-the-trouble-with-memes-inference` | `article` | 0 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | The Trouble with Memes: Inference Versus Imitation in Cultural Creation |
| 47 | `site/content/articles/metamemetics/internetmemetics.md` | 202 | `aunger-r-2001-darwinizing-culture-the-status-of` | `book` | 0 | `citation`, `date`, `doi`, `editor`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Darwinizing Culture: The Status of Memetics as a Science |
| 48 | `site/content/articles/metamemetics/internetmemetics.md` | 214 | `aunger-r-2002-the-electric-meme-a-new` | `book` | 2 | `author`, `citation`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The Electric Meme: A New Theory of How We Think |
| 49 | `site/content/articles/metamemetics/internetmemetics.md` | 224 | `baldwin-j-1898-on-selective-thinking` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | On Selective Thinking |
| 50 | `site/content/articles/metamemetics/internetmemetics.md` | 236 | `baron-a-2012-the-history-of-know-your` | `online` | 0 | `author`, `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | The History of Know Your Meme |
| 51 | `site/content/articles/metamemetics/internetmemetics.md` | 246 | `benzon-w-1996-culture-as-an-evolutionary-arena` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Culture as an Evolutionary Arena |
| 52 | `site/content/articles/metamemetics/internetmemetics.md` | 258 | `benzon-w-2013-cultural-evolution-some-terminology` | `online` | 0 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Cultural Evolution: Some Terminology |
| 53 | `site/content/articles/metamemetics/internetmemetics.md` | 268 | `blackmore-s-1999-the-meme-machine-oxford-oxford` | `book` | 4 | `author`, `citation`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The Meme Machine |
| 54 | `site/content/articles/metamemetics/internetmemetics.md` | 278 | `bloch-m-2001-a-well-disposed-social-anthropologist` | `inbook` | 1 | `author`, `booktitle`, `citation`, `doi`, `editor`, `location`, `pages`, `publisher`, `title`, `year` | `citation-field-transitional`, `needs-external-verification` | A Well-Disposed Social Anthropologist's Problems with Memes |
| 55 | `site/content/articles/metamemetics/internetmemetics.md` | 291 | `borzsei-l-2013-makes-a-meme-instead-a` | `article` | 1 | `author`, `citation`, `journal`, `number`, `pages`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Makes a Meme Instead: A Concise History of Internet Memes |
| 56 | `site/content/articles/metamemetics/internetmemetics.md` | 302 | `boyd-r-richerson-2001-memes-universal-acid-or-a` | `inbook` | 0 | `author`, `booktitle`, `citation`, `doi`, `editor`, `location`, `pages`, `publisher`, `title`, `year` | `citation-field-transitional`, `needs-external-verification` | Memes: Universal Acid or a Better Mousetrap? |
| 57 | `site/content/articles/metamemetics/internetmemetics.md` | 315 | `brewer-j-2016-a-forty-year-update-on` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | A Forty Year Update On Meme Theory |
| 58 | `site/content/articles/metamemetics/internetmemetics.md` | 325 | `burman-j-t-2012-the-misunderstanding-of-memes-biography` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The Misunderstanding of Memes: Biography of an Unscientific Object, 1976--1999 |
| 59 | `site/content/articles/metamemetics/internetmemetics.md` | 337 | `claidere-n-scott-2014-how-darwinian-is-cultural-evolution` | `article` | 2 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | How Darwinian Is Cultural Evolution? |
| 60 | `site/content/articles/metamemetics/internetmemetics.md` | 349 | `conte-r-2001-memes-through-social-minds-in` | `inbook` | 1 | `author`, `booktitle`, `citation`, `doi`, `editor`, `location`, `pages`, `publisher`, `title`, `year` | `citation-field-transitional`, `needs-external-verification` | Memes Through (Social) Minds |
| 61 | `site/content/articles/metamemetics/internetmemetics.md` | 362 | `cullen-b-1998-parasite-ecology-and-the-evolution` | `inbook` | 0 | `author`, `booktitle`, `citation`, `editor`, `location`, `pages`, `publisher`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Parasite Ecology and the Evolution of Religion |
| 62 | `site/content/articles/metamemetics/internetmemetics.md` | 375 | `cullen-b-1993-the-darwinian-resurgence-and-the` | `article` | 0 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | The Darwinian Resurgence and the Cultural Virus Critique |
| 63 | `site/content/articles/metamemetics/internetmemetics.md` | 387 | `davison-p-2012-the-language-of-internet-memes` | `inbook` | 1 | `author`, `booktitle`, `citation`, `doi`, `editor`, `location`, `pages`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | The Language of Internet Memes |
| 64 | `site/content/articles/metamemetics/internetmemetics.md` | 400 | `dennett-d-1998-memes-myths-misunderstandings-and-misgivings` | `online` | 1 | `author`, `citation`, `note`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Memes: Myths, Misunderstandings and Misgivings |
| 65 | `site/content/articles/metamemetics/internetmemetics.md` | 410 | `dawkins-r-1993-viruses-of-the-mind` | `inbook` | 2 | `author`, `booktitle`, `citation`, `editor`, `location`, `pages`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | Viruses of the Mind |
| 66 | `site/content/articles/metamemetics/internetmemetics.md` | 422 | `dawkins-r-1976-the-selfish-gene-oxford-oxford` | `book` | 3 | `author`, `citation`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The Selfish Gene |
| 67 | `site/content/articles/metamemetics/internetmemetics.md` | 432 | `dawkins-r-1982a-the-extended-phenotype-oxford-oxford` | `book` | 3 | `author`, `citation`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `needs-external-verification` | The Extended Phenotype: The Gene as the Unit of Selection |
| 68 | `site/content/articles/metamemetics/internetmemetics.md` | 442 | `dawkins-r-1982b-replicators-and-vehicles` | `inbook` | 0 | `author`, `booktitle`, `citation`, `editor`, `pages`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | Replicators and Vehicles |
| 69 | `site/content/articles/metamemetics/internetmemetics.md` | 453 | `dawkins-r-1983-universal-darwinism` | `inbook` | 0 | `author`, `booktitle`, `citation`, `editor`, `pages`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | Universal Darwinism |
| 70 | `site/content/articles/metamemetics/internetmemetics.md` | 464 | `dawkins-r-1986-the-blind-watchmaker-oxford-oxford` | `book` | 0 | `author`, `citation`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `needs-external-verification` | The Blind Watchmaker: Why the Evidence of Evolution Reveals a Universe Without Design |
| 71 | `site/content/articles/metamemetics/internetmemetics.md` | 474 | `dawkins-r-1989-the-selfish-gene-oxford-oxford` | `book` | 1 | `author`, `citation`, `edition`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The Selfish Gene |
| 72 | `site/content/articles/metamemetics/internetmemetics.md` | 485 | `dawkins-r-2003-a-devil-s-chaplain-reflections` | `book` | 0 | `author`, `citation`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `needs-external-verification` | A Devil's Chaplain: Reflections on Hope, Lies, Science, and Love |
| 73 | `site/content/articles/metamemetics/internetmemetics.md` | 495 | `dawkins-r-2006-the-selfish-gene-30th-anniversary` | `book` | 2 | `author`, `citation`, `edition`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The Selfish Gene |
| 74 | `site/content/articles/metamemetics/internetmemetics.md` | 506 | `dennett-d-1995-darwin-s-dangerous-idea-sciences` | `article` | 0 | `author`, `citation`, `journal`, `number`, `pages`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Darwin's Dangerous Idea |
| 75 | `site/content/articles/metamemetics/internetmemetics.md` | 518 | `dirlam-d-k-2005-using-memetics-to-grow-memetics` | `article` | 0 | `author`, `citation`, `journal`, `number`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Using Memetics to Grow Memetics |
| 76 | `site/content/articles/metamemetics/internetmemetics.md` | 529 | `edmonds-b-2002-three-challenges-for-the-survival` | `article` | 0 | `author`, `citation`, `journal`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Three Challenges for the Survival of Memetics |
| 77 | `site/content/articles/metamemetics/internetmemetics.md` | 539 | `edmonds-b-2005-the-revealed-poverty-of-the` | `article` | 0 | `author`, `citation`, `journal`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The Revealed Poverty of the Gene-Meme Analogy: Why Memetics per se Has Failed to Produce Substantive Results |
| 78 | `site/content/articles/metamemetics/internetmemetics.md` | 549 | `encyclopaedia-dramatica-2014-encyclopaedia-dramatica-about` | `online` | 0 | `archivedate`, `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Encyclopaedia Dramatica: About |
| 79 | `site/content/articles/metamemetics/internetmemetics.md` | 559 | `encyclopaedia-dramatica-2015-forced-meme` | `online` | 0 | `archivedate`, `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Forced Meme |
| 80 | `site/content/articles/metamemetics/internetmemetics.md` | 569 | `fahlman-s-1982-original-bboard-thread-in-which` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Original Bboard Thread in which :-) was Proposed |
| 81 | `site/content/articles/metamemetics/internetmemetics.md` | 579 | `google-trends-2016a-compare-memes-jesus-https-www` | `online` | 1 | `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Compare: memes, jesus |
| 82 | `site/content/articles/metamemetics/internetmemetics.md` | 588 | `gatherer-d-1998-why-the-thought-contagion-metaphor` | `article` | 0 | `author`, `citation`, `journal`, `number`, `pages`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Why the Thought Contagion Metaphor is Retarding the Progress of Memetics |
| 83 | `site/content/articles/metamemetics/internetmemetics.md` | 600 | `gray-r-d-2007-the-pleasures-and-perils-of` | `article` | 0 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | The Pleasures and Perils of Darwinizing Culture (with Phylogenies) |
| 84 | `site/content/articles/metamemetics/internetmemetics.md` | 612 | `heylighen-f-1998-what-makes-a-meme-successful` | `inproceedings` | 0 | `address`, `author`, `booktitle`, `citation`, `pages`, `publisher`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | What Makes a Meme Successful? Selection Criteria for Cultural Evolution |
| 85 | `site/content/articles/metamemetics/internetmemetics.md` | 624 | `hull-d-1980-individuality-and-selection-annual-review` | `article` | 2 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Individuality and Selection |
| 86 | `site/content/articles/metamemetics/internetmemetics.md` | 636 | `huntington-h-e-2013-big-bird-binders-full-of` | `misc` | 1 | `address`, `author`, `citation`, `date`, `organization`, `title`, `type`, `year` | `citation-field-transitional`, `generic-misc-type`, `missing-structured-identifier`, `needs-external-verification` | Big Bird, Binders Full of Women \& Bayonets and Horses: The Diffusion of Internet Memes in Mainstream Media Coverage of the 2012 U.S. Presidential Campaign |
| 87 | `site/content/articles/metamemetics/internetmemetics.md` | 647 | `knobel-m-lankshear-2005-memes-and-affinities-cultural-replication` | `inbook` | 0 | `author`, `booktitle`, `citation`, `editor`, `pages`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | Online Memes, Affinities, and Cultural Production |
| 88 | `site/content/articles/metamemetics/internetmemetics.md` | 658 | `know-your-meme-2008-about` | `online` | 0 | `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | About |
| 89 | `site/content/articles/metamemetics/internetmemetics.md` | 667 | `know-your-meme-2015-milhouse-is-not-a-meme` | `online` | 1 | `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Milhouse Is Not a Meme |
| 90 | `site/content/articles/metamemetics/internetmemetics.md` | 676 | `lamm-e-2012-inheritance-systems-stanford-encyclopedia-of` | `online` | 0 | `author`, `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Inheritance Systems |
| 91 | `site/content/articles/metamemetics/internetmemetics.md` | 686 | `lewens-t-2013-cultural-evolution-stanford-encyclopedia-of` | `online` | 0 | `author`, `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Cultural Evolution |
| 92 | `site/content/articles/metamemetics/internetmemetics.md` | 696 | `lloyd-e-2012-units-and-levels-of-selection` | `online` | 2 | `author`, `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Units and Levels of Selection |
| 93 | `site/content/articles/metamemetics/internetmemetics.md` | 706 | `marcus-o-r-2016-loving-ebola-chan-internet-memes` | `article` | 0 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Loving Ebola-chan: Internet memes in an epidemic |
| 94 | `site/content/articles/metamemetics/internetmemetics.md` | 718 | `marshall-g-1998-the-internet-and-memetics` | `online` | 0 | `author`, `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | The Internet and memetics |
| 95 | `site/content/articles/metamemetics/internetmemetics.md` | 728 | `milner-r-2012-the-world-made-meme` | `misc` -> `online` | 0 | `author`, `citation`, `institution`, `title`, `type`, `url`, `year` | `citation-field-transitional`, `possible-entry-type-upgrade`, `generic-misc-type`, `needs-external-verification` | The World Made Meme: Discourse and Identity in Participatory Media |
| 96 | `site/content/articles/metamemetics/internetmemetics.md` | 738 | `milner-r-2013a-hacking-the-social-internet-memes` | `article` | 1 | `author`, `citation`, `journal`, `number`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Hacking the Social: Internet Memes, Identity Antagonism, and the Logic of Lulz |
| 97 | `site/content/articles/metamemetics/internetmemetics.md` | 748 | `milner-r-2013b-media-lingua-franca-fixity-novelty` | `inproceedings` | 0 | `author`, `booktitle`, `citation`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Media Lingua Franca: Fixity, Novelty, and Vernacular Creativity in Internet Memes |
| 98 | `site/content/articles/metamemetics/internetmemetics.md` | 758 | `milner-r-2015-memes-are-dead-long-live` | `online` | 3 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Memes are Dead; Long Live Memetics |
| 99 | `site/content/articles/metamemetics/internetmemetics.md` | 768 | `miltner-k-2014-there-s-no-place-for` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `title`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | There's No Place for Lulz on LOLCats: The Role of Genre, Gender, and Group Identity in the Interpretation and Enjoyment of an Internet Meme |
| 100 | `site/content/articles/metamemetics/internetmemetics.md` | 779 | `miltner-k-2011-srsly-phenomenal` | `misc` | 1 | `author`, `citation`, `institution`, `title`, `type`, `year` | `citation-field-transitional`, `generic-misc-type`, `missing-structured-identifier`, `needs-external-verification` | Srsly Phenomenal: An Investigation into the Appeal of LOLcats |
| 101 | `site/content/articles/metamemetics/internetmemetics.md` | 788 | `mitchell-p-2012-contagious-metaphor-bloomsbury-academic` | `book` | 1 | `address`, `author`, `citation`, `isbn`, `publisher`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Contagious Metaphor |
| 102 | `site/content/articles/metamemetics/internetmemetics.md` | 799 | `o-brien-m-2010-cultural-traits-as-units-of` | `article` | 0 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Cultural traits as units of analysis |
| 103 | `site/content/articles/metamemetics/internetmemetics.md` | 811 | `phillips-w-2012a-in-defense-of-memes-article` | `online` | 2 | `author`, `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | In Defense of Memes |
| 104 | `site/content/articles/metamemetics/internetmemetics.md` | 821 | `phillips-w-2012b-the-house-that-fox-built` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | The House That Fox Built: Anonymous, Spectacle, and Cycles of Amplification |
| 105 | `site/content/articles/metamemetics/internetmemetics.md` | 833 | `segev-e-nissenbaum-2015-families-and-networks-of-internet` | `article` | 5 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Families and Networks of Internet Memes: The Relationship Between Cohesiveness, Uniqueness, and Quiddity Concreteness |
| 106 | `site/content/articles/metamemetics/internetmemetics.md` | 845 | `shifman-l-2012-an-anatomy-of-a-youtube` | `article` | 2 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | An anatomy of a YouTube meme |
| 107 | `site/content/articles/metamemetics/internetmemetics.md` | 857 | `shifman-l-2013a-memes-in-a-digital-world` | `article` | 11 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Memes in a Digital World: Reconciling with a Conceptual Troublemaker |
| 108 | `site/content/articles/metamemetics/internetmemetics.md` | 869 | `shifman-l-2013b-memes-in-digital-culture` | `book` | 5 | `author`, `citation`, `doi`, `isbn`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Memes in Digital Culture |
| 109 | `site/content/articles/metamemetics/internetmemetics.md` | 879 | `shifman-l-2015-memeology-festival-05` | `online` | 4 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Memeology Festival 05: Memes as Ritual, Virals as Transmission? In Praise of Blurry Boundaries |
| 110 | `site/content/articles/metamemetics/internetmemetics.md` | 889 | `shifman-l-thelwall-2009-assessing-global-diffusion-with-web` | `article` | 2 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Assessing Global Diffusion with Web Memetics: The Spread and Evolution of a Popular Joke |
| 111 | `site/content/articles/metamemetics/internetmemetics.md` | 901 | `solon-o-2013-richard-dawkins-on-the-internet` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Richard Dawkins on the internet's hijacking of the word 'meme' |
| 112 | `site/content/articles/metamemetics/internetmemetics.md` | 911 | `sterelny-k-1999-dawkins-bulldog` | `article` | 0 | `author`, `citation`, `journal`, `number`, `pages`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Dawkins' Bulldog |
| 113 | `site/content/articles/metamemetics/internetmemetics.md` | 923 | `uhlir-v-stella-2012-who-needs-memetics-possible-developments` | `article` | 1 | `author`, `citation`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | Who needs memetics? Possible developments of the meme concept and beyond |
| 114 | `site/content/articles/metamemetics/internetmemetics.md` | 934 | `urban-dictionary-2009-forced-meme` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | forced meme |
| 115 | `site/content/articles/metamemetics/internetmemetics.md` | 944 | `wiggins-b-bowers-2014-memes-as-genre-a-structural` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Memes as genre: A structurational analysis of the memescape |
| 116 | `site/content/articles/metamemetics/internetmemetics.md` | 956 | `wilkins-j-s-2014-replication-and-reproduction-stanford-encyclopedia` | `online` | 0 | `author`, `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Replication and Reproduction |
| 117 | `site/content/articles/metamemetics/internetmemetics.md` | 966 | `sperber-d-1985-anthropology-and-psychology` | `article` | 3 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Anthropology and Psychology: Towards an Epidemiology of Representations |
| 118 | `site/content/articles/metamemetics/internetmemetics.md` | 978 | `sober-e-1980-evolution-population-thinking-and-essentialism` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Evolution, Population Thinking, and Essentialism |
| 119 | `site/content/articles/metamemetics/internetmemetics.md` | 990 | `sober-e-1984-the-nature-of-selection` | `book` | 1 | `author`, `citation`, `isbn`, `publisher`, `title`, `year` | `citation-field-transitional`, `needs-external-verification` | The Nature of Selection: Evolutionary Theory in Philosophical Focus |
| 120 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 146 | `aunger-r-1999-a-report-on-the-conference` | `article` | 1 | `author`, `citation`, `journal`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | A Report on the Conference ``Do Memes Account for Culture?'' Held at King's College, Cambridge |
| 121 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 156 | `aunger-r-2000-darwinizing-culture-the-status-of` | `book` | 1 | `citation`, `date`, `doi`, `editor`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Darwinizing Culture: The Status of Memetics as a Science |
| 122 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 168 | `aunger-r-2002-the-electric-meme-a-new` | `book` | 1 | `author`, `citation`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The Electric Meme: A New Theory of How We Think |
| 123 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 178 | `blackmore-s-j-1999-the-meme-machine` | `book` | 1 | `author`, `citation`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The Meme Machine |
| 124 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 188 | `burman-j-t-2012-the-misunderstanding-of-memes-biography` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `duplicate-candidate`, `needs-external-verification` | The misunderstanding of memes: Biography of an unscientific object, 1976--1999 |
| 125 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 200 | `cavalli-sforza-l-1981-cultural-transmission-and-evolution-a` | `book` | 1 | `author`, `citation`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Cultural Transmission and Evolution: A Quantitative Approach |
| 126 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 210 | `claidiere-n-scott-2014-how-darwinian-is-cultural-evolution` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `duplicate-candidate`, `needs-external-verification` | How Darwinian is cultural evolution? |
| 127 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 222 | `dawkins-r-1976-the-selfish-gene` | `book` | 1 | `author`, `citation`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The Selfish Gene |
| 128 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 232 | `dawkins-r-2006-the-selfish-gene-30th-anniversary` | `book` | 1 | `author`, `citation`, `edition`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The Selfish Gene |
| 129 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 243 | `dawkins-r-1982-the-extended-phenotype-the-long` | `book` | 1 | `author`, `citation`, `isbn`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `needs-external-verification` | The Extended Phenotype: The Long Reach of the Gene |
| 130 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 253 | `reader-s-and-1999-do-animals-have-memes-journal` | `article` | 1 | `author`, `citation`, `journal`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Do animals have memes? |
| 131 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 263 | `dawkins-r-2014-2014-what-scientific-idea-is` | `online` | 1 | `author`, `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Essentialism |
| 132 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 273 | `harms-w-f-2004-information-and-meaning-in-evolutionary` | `book` | 10 | `author`, `citation`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | Information and Meaning in Evolutionary Processes |
| 133 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 282 | `henrich-j-and-2002-on-modeling-cognition-and-culture` | `article` | 2 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | On Modeling Cognition and Culture: Why cultural evolution does not require replication of representations |
| 134 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 294 | `henrich-j-boyd-2008-five-misunderstandings-about-cultural-evolution` | `article` | 3 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | Five Misunderstandings About Cultural Evolution |
| 135 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 306 | `lynch-a-1996-the-population-memetics-of-bird` | `online` | 1 | `author`, `citation`, `organization`, `title`, `url`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The Population Memetics of Bird Song |
| 136 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 315 | `lynch-a-and-1993-a-population-memetics-approach-to` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | A Population Memetics Approach to Cultural Evolution in Chaffinch Song: Meme Diversity Within Populations |
| 137 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 327 | `lynch-a-and-1994-a-population-memetics-approach-to` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | A population memetics approach to cultural evolution in chaffinch song: differentiation among populations |
| 138 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 339 | `lynch-a-plunkett-1989-a-model-of-cultural-evolution` | `article` | 2 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | A Model of Cultural Evolution of Chaffinch Song Derived with the Meme Concept |
| 139 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 351 | `neri-f-and-2012-memetic-algorithms-and-memetic-computing` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | Memetic algorithms and memetic computing optimization: A literature review |
| 140 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 362 | `okasha-s-2006-evolution-and-the-levels-of` | `book` | 1 | `author`, `citation`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | Evolution and the Levels of Selection |
| 141 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 371 | `pang-ching-j-2018-the-effect-of-isolation-fragmentation` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | The effect of isolation, fragmentation, and population bottlenecks on song structure of a Hawaiian honeycreeper |
| 142 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 383 | `ritt-n-2004-selfish-sounds-and-linguistic-evolution` | `book` | 1 | `author`, `citation`, `doi`, `isbn`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | Selfish Sounds and Linguistic Evolution: A Darwinian Approach to Language Change |
| 143 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 393 | `sebastian-gonzalez-e-2017-birdsong-meme-diversity-in-a` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | Birdsong meme diversity in a habitat landscape depends on landscape and species characteristics |
| 144 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 405 | `segev-e-nissenbaum-2015-families-and-networks-of-internet` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `duplicate-candidate`, `needs-external-verification` | Families and Networks of Internet Memes: The Relationship Between Cohesiveness, Uniqueness, and Quiddity Concreteness |
| 145 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 417 | `shifman-l-2013-memes-in-digital-culture` | `book` | 5 | `author`, `citation`, `doi`, `isbn`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Memes in Digital Culture |
| 146 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 427 | `shifman-l-2015-november-10` | `online` | 3 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Memeology Festival 05: Memes as Ritual, Virals as Transmission? In Praise of Blurry Boundaries |
| 147 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 437 | `shifman-l-2018-testimonial-rallies-and-the-construction` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | Testimonial rallies and the construction of memetic authenticity |
| 148 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 449 | `shifman-l-and-2009-assessing-global-diffusion-with-web` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `duplicate-candidate`, `needs-external-verification` | Assessing Global Diffusion with Web Memetics: The Spread and Evolution of a Popular Joke |
| 149 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 461 | `solon-o-2013-june-20` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Richard Dawkins on the internet's hijacking of the word 'meme' |
| 150 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 471 | `sterelny-k-2006-memes-revisited` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | Memes Revisited |
| 151 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 483 | `sterelny-k-and-1999-sex-and-death-an-introduction` | `book` | 1 | `author`, `citation`, `location`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | Sex and Death: An Introduction to Philosophy of Biology |
| 152 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 492 | `edmonds-b-2005-the-revealed-poverty-of-the` | `article` | 1 | `author`, `citation`, `journal`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The revealed poverty of the gene-meme analogy – why memetics per se has failed to produce substantive results |
| 153 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 502 | `edmonds-b-2002-three-challenges-for-the-survival` | `article` | 1 | `author`, `citation`, `journal`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Three Challenges for the Survival of Memetics |
| 154 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 512 | `lynch-a-1996-the-population-memetics-of-bird-2` | `online` | 0 | `author`, `citation`, `organization`, `title`, `url`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The Population Memetics of Bird Song |
| 155 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 521 | `weng-l-flammini-2012-competition-among-memes-in-a` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | Competition among memes in a world with limited attention |
| 156 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 534 | `wilkins-j-s-2005-is-meme-a-new-idea` | `article` | 3 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | Is “meme” a new “idea”? Reflections on Aunger |
| 157 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 546 | `williams-g-c-1966-adaptation-and-natural-selection-a` | `book` | 1 | `address`, `author`, `citation`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | Adaptation and Natural Selection: A Critique of Some Current Evolutionary Thought |
| 158 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 555 | `blackmore-s-2000-the-memes-eye-view` | `inbook` | 1 | `author`, `booktitle`, `citation`, `editor`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | The memes' eye view |
| 159 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 565 | `dawkins-r-1986-the-blind-watchmaker` | `book` | 1 | `address`, `author`, `citation`, `isbn`, `publisher`, `title`, `year` | `citation-field-transitional`, `needs-external-verification` | The Blind Watchmaker |
| 160 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 575 | `hull-d-2000-taking-memetics-seriously` | `inbook` | 2 | `author`, `booktitle`, `citation`, `editor`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | Taking memetics seriously: Memetics will be what we make it |
| 161 | `site/content/articles/metamemetics/the-memeticists-challenge-remains-open.md` | 585 | `sperber-d-2000-an-objection-to-the-memetic-approach` | `inbook` | 2 | `author`, `booktitle`, `citation`, `doi`, `editor`, `pages`, `publisher`, `title`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | An objection to the memetic approach to culture |
| 162 | `site/content/articles/metamemetics/vulliamy-response.md` | 18 | `evnine-s-2018-the-anonymity-of-a-murmur` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | The Anonymity of a Murmur: Internet (and Other) Memes |
| 163 | `site/content/articles/metamemetics/what-is-a-meme.md` | 190 | `evnine-simon-j-2018-303-318` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `duplicate-candidate`, `needs-external-verification` | The Anonymity of a Murmur: Internet (and Other) Memes |
| 164 | `site/content/articles/metamemetics/what-is-a-meme.md` | 202 | `dawkins-richard-the-1989-189-201` | `inbook` | 1 | `author`, `booktitle`, `citation`, `edition`, `location`, `pages`, `publisher`, `title`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `needs-external-verification` | Memes: The New Replicators |
| 165 | `site/content/articles/metamemetics/what-is-a-meme.md` | 214 | `shifman-limor-memes-2015-shifman-limor-memes-in-digital` | `book` | 1 | `author`, `citation`, `doi`, `publisher`, `title`, `url`, `year` | `citation-field-transitional`, `duplicate-candidate`, `needs-external-verification` | Memes in Digital Culture |
| 166 | `site/content/articles/metamemetics/what-is-a-meme.md` | 224 | `milner-ryan-the-2016-milner-ryan-the-world-made` | `book` | 1 | `author`, `citation`, `doi`, `publisher`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | The World Made Meme: Public Conversations and Participatory Media |
| 167 | `site/content/articles/metamemetics/what-is-a-meme.md` | 234 | `know-your-meme-2020-money-printer-go-brrr-online` | `online` | 1 | `author`, `citation`, `date`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Money Printer Go Brrr |
| 168 | `site/content/articles/metamemetics/what-is-a-meme.md` | 244 | `gerken-t-2018-is-this-1921-cartoon-the` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Is This 1921 Cartoon the First Ever Meme? |
| 169 | `site/content/articles/metamemetics/what-is-a-meme.md` | 255 | `know-your-meme-2015-expectation-vs` | `online` | 1 | `author`, `citation`, `date`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Expectation vs. Reality |
| 170 | `site/content/articles/metamemetics/what-is-a-meme.md` | 265 | `facebook-2021-memes-without-bottom-text` | `online` | 1 | `author`, `citation`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | Memes Without Bottom Text |
| 171 | `site/content/articles/metamemetics/what-is-a-meme.md` | 273 | `the-philosopher-s-2016-online-youtube` | `online` | 1 | `author`, `citation`, `organization`, `title`, `url`, `urldate` | `citation-field-transitional`, `needs-external-verification` | The Philosopher's Meme YouTube Channel |
| 172 | `site/content/articles/metamemetics/what-is-a-meme.md` | 282 | `unknown-user-2017-meta-i-created-an-analysis` | `online` | 1 | `author`, `citation`, `organization`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | [META] I created an analysis of postmodernism in memes |
| 173 | `site/content/articles/metamemetics/what-is-a-meme.md` | 292 | `the-straight-dope-2000-what-s-the-origin-of` | `online` | 1 | `author`, `citation`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | What’s the Origin of "Kilroy Was Here"? |
| 174 | `site/content/articles/metamemetics/what-is-a-meme.md` | 301 | `kuipers-giselinde-media-2002-450-470` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | Media Culture and Internet Disaster Jokes |
| 175 | `site/content/articles/metamemetics/what-is-a-meme.md` | 313 | `milner-ryan-logics-in-the-world-made-meme` | `inbook` | 1 | `author`, `booktitle`, `citation`, `doi`, `pages`, `publisher`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Logics: The Fundamentals of Memetic Participation |
| 176 | `site/content/articles/metamemetics/what-is-a-meme.md` | 325 | `know-your-meme-2015-wojak` | `online` | 1 | `author`, `citation`, `date`, `title`, `url`, `urldate`, `year` | `citation-field-transitional`, `needs-external-verification` | Wojak |
| 177 | `site/content/articles/metamemetics/what-is-a-meme.md` | 335 | `socialism-done-left-2020-i-don-t-deserve-you` | `online` | 1 | `author`, `citation`, `organization`, `title`, `type`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | I don’t deserve you, you should be with a real girl… |
| 178 | `site/content/articles/metamemetics/what-is-a-meme.md` | 345 | `weitz-morris-the-1956-27-35` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `citation-field-transitional`, `missing-url-field`, `needs-external-verification` | The Role of Theory in Aesthetics |
| 179 | `site/content/articles/metamemetics/what-is-a-meme.md` | 357 | `wittgenstein-ludwig-philosophical-1953-translated-by-e` | `book` | 1 | `author`, `citation`, `location`, `origdate`, `publisher`, `title`, `translator`, `year` | `citation-field-transitional`, `missing-structured-identifier`, `duplicate-candidate`, `needs-external-verification` | Philosophical Investigations |
| 180 | `site/content/articles/philosophy/how-to-digitally-coauthor-articles-in-philosophy-class.md` | 131 | `alfano-2018` | `inbook` | 1 | `author`, `booktitle`, `doi`, `editor`, `isbn`, `pages`, `publisher`, `title`, `year` | `needs-external-verification` | Digital Humanities for History of Philosophy: A Case Study on Nietzsche |
| 181 | `site/content/articles/philosophy/how-to-digitally-coauthor-articles-in-philosophy-class.md` | 143 | `jockers-2013` | `book` | 1 | `author`, `doi`, `isbn`, `publisher`, `title`, `year` | `needs-external-verification` | Macroanalysis: Digital Methods and Literary History |
| 182 | `site/content/articles/philosophy/how-to-digitally-coauthor-articles-in-philosophy-class.md` | 152 | `knobe-2015` | `article` | 1 | `author`, `doi`, `journal`, `pages`, `title`, `volume`, `year` | `needs-external-verification` | Philosophers are doing something different now: Quantitative data |
| 183 | `site/content/articles/philosophy/how-to-digitally-coauthor-articles-in-philosophy-class.md` | 162 | `laal-ghodsi-2011` | `article` | 1 | `author`, `doi`, `journal`, `pages`, `title`, `volume`, `year` | `needs-external-verification` | Benefits of collaborative learning |
| 184 | `site/content/articles/philosophy/how-to-digitally-coauthor-articles-in-philosophy-class.md` | 172 | `weatherson-2013` | `online` | 1 | `author`, `date`, `title`, `url` | `needs-external-verification` | Most Cited Articles from Philosophy Journals |
| 185 | `site/content/articles/philosophy/postnaturalism.md` | 167 | `nsf-2007-cyberinfrastructure` | `online` | 1 | `author`, `title`, `url`, `year` | `needs-external-verification` | Cyberinfrastructure Vision for 21st Century Discovery |
| 186 | `site/content/articles/philosophy/postnaturalism.md` | 174 | `schwitzgebel-2009-armchair` | `online` | 1 | `author`, `date`, `organization`, `title`, `url`, `year` | `needs-external-verification` | Alternatives to Burning the Armchair |
| 187 | `site/content/articles/philosophy/postnaturalism.md` | 183 | `taylor-francis-2018-philosophical-method` | `article` | 1 | `author`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `needs-external-verification` | Lessons for Experimental Philosophy from the Rise and “Fall” of Neurophilosophy |
| 188 | `site/content/articles/philosophy/postnaturalism.md` | 194 | `ndpr-2009-experimental-philosophy` | `online` | 1 | `organization`, `title`, `url`, `year` | `needs-external-verification` | Experimental Philosophy, Rationalism, and Naturalism: Rethinking Philosophical Method |
| 189 | `site/content/articles/philosophy/postnaturalism.md` | 201 | `sep-automated-reasoning` | `online` | 1 | `organization`, `title`, `url` | `missing-date`, `needs-external-verification` | Automated Reasoning |
| 190 | `site/content/articles/philosophy/postnaturalism.md` | 207 | `bundy-2011-automated-theorem-proving` | `article` | 1 | `author`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `needs-external-verification` | Automated Theorem Provers: A Practical Tool for the Working Mathematician? |
| 191 | `site/content/articles/philosophy/postnaturalism.md` | 218 | `matson-1984-metametaphilosophy` | `article` | 1 | `author`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `needs-external-verification` | III. Metametaphilosophy |
| 192 | `site/content/articles/philosophy/postnaturalism.md` | 229 | `clark-chalmers-1998-extended-mind` | `article` | 1 | `author`, `doi`, `journal`, `number`, `pages`, `title`, `url`, `volume`, `year` | `needs-external-verification` | The Extended Mind |
| 193 | `site/content/articles/philosophy/postnaturalism.md` | 241 | `allen-collinson-2009-sporting-embodiment` | `article` | 1 | `author`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `needs-external-verification` | Sporting Embodiment: Sports Studies and the (Continuing) Promise of Phenomenology |
| 194 | `site/content/articles/philosophy/postnaturalism.md` | 252 | `uidhir-2013-caricature` | `article` | 1 | `author`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `missing-structured-identifier`, `needs-external-verification` | The Epistemic Misuse \& Abuse of Pictorial Caricature |
| 195 | `site/content/articles/philosophy/postnaturalism.md` | 262 | `consigny-1994-nietzsche-sophists` | `article` | 1 | `author`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `needs-external-verification` | Nietzsche's Reading of the Sophists |
| 196 | `site/content/articles/philosophy/postnaturalism.md` | 273 | `mann-2003-nietzsche-sophists` | `article` | 1 | `author`, `doi`, `journal`, `number`, `title`, `volume`, `year` | `needs-external-verification` | Nietzsche's Interest and Enthusiasm for the Greek Sophists |
| 197 | `site/content/articles/philosophy/postnaturalism.md` | 283 | `schiller-1908-plato-protagoras` | `book` | 1 | `author`, `publisher`, `title`, `year` | `missing-structured-identifier`, `needs-external-verification` | Plato or Protagoras?: Being a critical examination of the Protagoras speech in the Theaetetus with some remarks upon error |
| 198 | `site/content/articles/philosophy/postnaturalism.md` | 290 | `plato-republic-book-ix` | `book` | 1 | `author`, `title` | `missing-date`, `missing-structured-identifier`, `needs-external-verification` | Republic, Book IX |
| 199 | `site/content/articles/philosophy/postnaturalism.md` | 295 | `tipton-2014-philosophical-biology` | `book` | 1 | `author`, `isbn`, `location`, `publisher`, `title`, `year` | `duplicate-candidate`, `needs-external-verification` | Philosophical Biology in Aristotle's Parts of Animals |
| 200 | `site/content/articles/philosophy/postnaturalism.md` | 304 | `cummins-2010-neo-teleology` | `incollection` | 1 | `author`, `booktitle`, `editor`, `isbn`, `location`, `pages`, `publisher`, `title`, `year` | `needs-external-verification` | Neo-Teleology |
| 201 | `site/content/articles/philosophy/postnaturalism.md` | 316 | `springer-2007-darwin-aristotle` | `article` | 1 | `author`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `needs-external-verification` | The Preface to Darwin's Origin of Species: The Curious History of the “Historical Sketch” |
| 202 | `site/content/articles/philosophy/postnaturalism.md` | 327 | `tipton-2014-parts-of-animals` | `book` | 1 | `author`, `isbn`, `location`, `publisher`, `title`, `year` | `duplicate-candidate`, `needs-external-verification` | Philosophical Biology in Aristotle's Parts of Animals |
| 203 | `site/content/articles/philosophy/postnaturalism.md` | 336 | `plato-republic-book-i` | `book` | 1 | `author`, `title` | `missing-date`, `missing-structured-identifier`, `needs-external-verification` | Republic, Book I |
| 204 | `site/content/articles/philosophy/postnaturalism.md` | 341 | `steinberger-1996-cephalus` | `article` | 2 | `author`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `needs-external-verification` | Who is Cephalus? |
| 205 | `site/content/articles/philosophy/postnaturalism.md` | 352 | `sep-mohism` | `online` | 2 | `organization`, `title`, `url` | `missing-date`, `needs-external-verification` | Mohism |
| 206 | `site/content/articles/philosophy/postnaturalism.md` | 358 | `hintikka-1998-abduction` | `article` | 1 | `author`, `journal`, `number`, `pages`, `title`, `url`, `volume`, `year` | `needs-external-verification` | What is abduction? The fundamental problem of contemporary epistemology |
| 207 | `site/content/articles/philosophy/postnaturalism.md` | 369 | `haack-1998-passionate-moderate` | `book` | 1 | `author`, `isbn`, `location`, `publisher`, `title`, `year` | `needs-external-verification` | Manifesto of a Passionate Moderate |
| 208 | `site/content/articles/philosophy/postnaturalism.md` | 378 | `sep-dewey-political` | `online` | 1 | `organization`, `title`, `url` | `missing-date`, `needs-external-verification` | Dewey's Political Philosophy |
| 209 | `site/content/articles/philosophy/postnaturalism.md` | 384 | `iep-rorty` | `online` | 1 | `organization`, `title`, `url` | `missing-date`, `needs-external-verification` | Richard Rorty |
| 210 | `site/content/articles/philosophy/postnaturalism.md` | 390 | `sep-deleuze` | `online` | 1 | `organization`, `title`, `url` | `missing-date`, `needs-external-verification` | Gilles Deleuze |
| 211 | `site/content/articles/philosophy/postnaturalism.md` | 396 | `rorty-1989-contingency` | `book` | 1 | `author`, `isbn`, `location`, `publisher`, `title`, `year` | `needs-external-verification` | Contingency, Irony, and Solidarity |
| 212 | `site/content/articles/philosophy/postnaturalism.md` | 405 | `berry-2011-computational-turn` | `article` | 1 | `author`, `journal`, `pages`, `title`, `volume`, `year` | `missing-structured-identifier`, `needs-external-verification` | The Computational Turn: Thinking about the Digital Humanities |
| 213 | `site/content/articles/philosophy/postnaturalism.md` | 414 | `lessig-2006-code-version-2` | `book` | 1 | `author`, `title`, `url`, `year` | `needs-external-verification` | Code, Version 2.0 |
| 214 | `site/content/articles/philosophy/postnaturalism.md` | 421 | `ietf-tao` | `online` | 1 | `organization`, `title`, `url` | `missing-date`, `needs-external-verification` | The Tao of IETF |
| 215 | `site/content/articles/philosophy/postnaturalism.md` | 427 | `heilbron-1990-comte-epistemology` | `article` | 1 | `author`, `doi`, `journal`, `number`, `pages`, `title`, `volume`, `year` | `needs-external-verification` | Auguste Comte and Modern Epistemology |
| 216 | `site/content/articles/philosophy/postnaturalism.md` | 438 | `wolfram-2012-new-kind-of-science` | `online` | 1 | `author`, `date`, `organization`, `title`, `url`, `year` | `needs-external-verification` | It's Been 10 Years: What's Happened with A New Kind of Science? |
| 217 | `site/content/articles/philosophy/postnaturalism.md` | 447 | `springer-2012-slime-mold-network` | `inproceedings` | 1 | `author`, `booktitle`, `doi`, `editor`, `location`, `pages`, `publisher`, `title`, `year` | `needs-external-verification` | A Slime Mold Solver for Linear Programming Problems |
| 218 | `site/content/articles/politics/a-tale-of-two-healthcare-narratives.md` | 50 | `archive-8kozz-healthcare-narrative` | `online` | 1 | `citation`, `title`, `url` | `citation-field-transitional`, `missing-contributor`, `missing-date`, `needs-external-verification` | Archived Article on Italian and South Korean Healthcare Systems During COVID-19 |
| 219 | `site/content/articles/politics/joshua-citarella-astroturfing.md` | 14 | `citarella-j-2022-how-to-plant-a-meme` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | How to Plant a Meme |
| 220 | `site/content/articles/politics/joshua-citarella-astroturfing.md` | 22 | `fisher-m-2005-dont-vote` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Don't Vote, Don't Encourage Them |
| 221 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 122 | `meme-alliance-actions` | `online` | 1 | `author`, `citation`, `title`, `url` | `citation-field-transitional`, `missing-date`, `needs-external-verification` | Actions |
| 222 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 129 | `eff-section-230` | `online` | 1 | `author`, `citation`, `title`, `url` | `citation-field-transitional`, `missing-date`, `needs-external-verification` | Section 230 of the Communications Decency Act |
| 223 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 136 | `romano-a-2014-facebook-revenge-porn-lawsuit` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | The Facebook Revenge Porn Lawsuit Could Change How We Report Abuse on Social Media |
| 224 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 144 | `meme-alliance-change-org-petition` | `online` | 1 | `author`, `citation`, `title`, `url` | `citation-field-transitional`, `missing-date`, `needs-external-verification` | Facebook: Please Address Your Seemingly Indiscriminatory and Harmful Reporting System |
| 225 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 151 | `zuckerberg-2016-rome-townhall-zuxit` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Rome Townhall Q&A |
| 226 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 159 | `wark-m-what-if-this-is-not-still-capitalism` | `online` | 4 | `author`, `citation`, `title`, `url` | `citation-field-transitional`, `missing-date`, `needs-external-verification` | What if This Is Not Still Capitalism But Something Worse? |
| 227 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 166 | `adblock-plus-2016-five-and-oh` | `online` | 1 | `author`, `citation`, `date`, `organization`, `title`, `url` | `citation-field-transitional`, `needs-external-verification` | Five and Oh! Look, Another Lawsuit Upholds Users' Rights Online |
| 228 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 175 | `cha-a-2011-apple-subscription-plan` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Apple's Subscription Plan Draws Inquiry from Regulators |
| 229 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 183 | `ernesto-2008-isps-deep-packet-inspection` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | ISPs Use Deep Packet Inspection to Throttle BitTorrent |
| 230 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 191 | `alter-c-2015-steam-workshop-internet-reacts` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Steam Workshop: Internet Reacts to Valve's New Paid Mods Policy |
| 231 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 199 | `good-o-2015-valve-removing-paid-mods` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Valve Removing Paid Mods from Steam Workshop |
| 232 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 207 | `ha-a-2015-twitter-cuts-off-datasift` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Twitter Cuts Off DataSift to Step Up Its Own B2B Big Data Analytics Business |
| 233 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 215 | `klee-m-2016-zuxit-facebook-meme-page-strike` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Zuxit: Facebook Meme Page Strike |
| 234 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 223 | `stallman-r-2011-anti-gplv3-propaganda` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Anti-GPLv3 Propaganda |
| 235 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 231 | `shu-c-2013-will-pay-for-lulz` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Will Pay for Lulz: 4chan Launches Self-Serve Advertising |
| 236 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 239 | `baer-j-2013-facebook-advertising-statistics` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | 15 New Facebook Advertising Statistics |
| 237 | `site/content/articles/politics/on-vectoralism-and-the-meme-alliance.mdx` | 247 | `meme-alliance-demands` | `online` | 1 | `author`, `citation`, `title`, `url` | `citation-field-transitional`, `missing-date`, `needs-external-verification` | Demands |
| 238 | `site/content/articles/politics/social-media-freedom.mdx` | 161 | `dibbell-j-1993-a-rape-in-cyberspace` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | A Rape in Cyberspace |
| 239 | `site/content/articles/politics/social-media-freedom.mdx` | 169 | `ontario-court-of-justice-2016-r-v-elliott` | `misc` -> `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `possible-entry-type-upgrade`, `generic-misc-type`, `needs-external-verification` | R. v. Elliott, 2016 ONCJ 35 |
| 240 | `site/content/articles/politics/social-media-freedom.mdx` | 177 | `bratton-b-moores-law-amplifies-whats-broken` | `online` | 1 | `author`, `citation`, `title`, `url` | `citation-field-transitional`, `missing-date`, `needs-external-verification` | If a problem is endemic to a system, Moore's Law amplifies what's broken |
| 241 | `site/content/articles/politics/the-structure-of-hyperspatial-politics.mdx` | 96 | `conway-m-1968-how-do-committees-invent` | `article` | 1 | `author`, `citation`, `journal`, `number`, `pages`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | How Do Committees Invent? |
| 242 | `site/content/articles/politics/the-structure-of-hyperspatial-politics.mdx` | 108 | `baggetta-m-2013-affect-anonymity-and-awareness` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Affect, Anonymity and Awareness: Learning in a Digital Environment |
| 243 | `site/content/articles/politics/the-structure-of-hyperspatial-politics.mdx` | 116 | `oilab-rendering-legible-the-ephemerality-of-4chanpol` | `online` | 1 | `author`, `citation`, `title`, `url` | `citation-field-transitional`, `missing-date`, `needs-external-verification` | Rendering Legible the Ephemerality of 4chan/pol/ |
| 244 | `site/content/articles/politics/the-structure-of-hyperspatial-politics.mdx` | 123 | `subramanian-s-2017-inside-the-macedonian-fake-news` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | Inside the Macedonian Fake-News Complex |
| 245 | `site/content/articles/politics/the-structure-of-hyperspatial-politics.mdx` | 131 | `morningstar-farmer-1990-lessons-of-lucasfilm-habitat` | `online` | 1 | `author`, `citation`, `title`, `url`, `year` | `citation-field-transitional`, `needs-external-verification` | The Lessons of Lucasfilm's Habitat |
| 246 | `site/content/articles/politics/the-structure-of-hyperspatial-politics.mdx` | 139 | `barbrook-cameron-1995-californian-ideology` | `article` | 1 | `author`, `citation`, `doi`, `journal`, `number`, `pages`, `title`, `url`, `volume`, `year` | `citation-field-transitional`, `needs-external-verification` | The Californian Ideology |

<!-- prettier-ignore-end -->
