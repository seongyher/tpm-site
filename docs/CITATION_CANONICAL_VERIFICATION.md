# Citation Canonical Verification Plan

Date: 2026-05-17

This document defines the citation cleanup workflow after the structural
BibTeX audit. The structural audit proves that every article citation marker
and `tpm-bibtex` entry can be inventoried. It does not prove source accuracy.

The canonical verification pass is deliberately editorial and manual. Every
entry must be checked against source evidence before article source is changed.

## Goals

- Preserve author intent while correcting migrated citation data.
- Convert parser-compatible but semantically broken BibTeX into useful
  structured source records.
- Improve article bibliographies, the sitewide bibliography, machine
  readability, citation previews, and future export behavior.
- Make the cleanup reproducible by using a fixed 246-entry ledger so no source
  can be skipped accidentally.

## Non-Goals

- Do not trust the migrated `citation = {...}` field as canonical truth.
- Do not blindly normalize similar entries into one source.
- Do not delete bibliography-only entries until the article's source-list
  intent has been reviewed.
- Do not rely only on parser validity, DOI presence, or automated metadata
  lookup.

## Verification Standard

Every citation entry needs three checks.

### 1. BibTeX Structure

Check whether the entry is valid and useful BibTeX/BibLaTeX-like source data:

- parser syntax is valid;
- entry type matches the source shape;
- contributor fields are not polluted with title, container, publisher, page,
  or date text;
- `title` is an actual source title, not a page range, translator fragment, or
  whole prose citation;
- required and recommended fields are present where known;
- URLs, DOIs, ISBNs, ISSNs, and archive fields are structured when available;
- literal `citation` is retained only as migration evidence or author-approved
  display text, not as the only usable source record.

### 2. Online Source Verification

Look up the work manually and compare the entry against source evidence. Prefer
authoritative evidence in this order:

1. DOI registration metadata or publisher page;
2. official book, journal, institution, court, platform, or author page;
3. stable library/catalog records for books and editions;
4. Internet Archive or web archive evidence for dead web pages;
5. reputable secondary indexes when the primary source is unavailable.

Record enough evidence for a future maintainer to understand the decision:

- source URL or DOI used for verification;
- corrected title/contributors/container/date;
- source type;
- confidence level;
- unresolved ambiguity.

### 3. Author-Intent Sanity

Check the article context, not just the bibliography block:

- the cited work supports the surrounding claim;
- a page, chapter, figure, or locator mentioned in prose is preserved;
- the citation is not accidentally pointing at a related but different work;
- bibliography-only entries remain only when the article appears to intend a
  source list rather than an inline claim citation;
- ambiguous or unrecoverable sources are marked for editorial review instead of
  silently rewritten.

## Target Entry Types

Use the most specific type that fits the verified source.

| Source shape                      | Preferred type             | Required fields                                  | Recommended fields                                                         |
| --------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| Journal article                   | `@article`                 | `author`, `title`, `journal`, `year` or `date`   | `volume`, `number`, `pages`, `doi`, `url`                                  |
| Book or monograph                 | `@book`                    | `author` or `editor`, `title`, `year` or `date`  | `publisher`, `location`, `isbn`, `edition`, `url`                          |
| Chapter or essay in edited volume | `@incollection`            | `author`, `title`, `booktitle`, `year` or `date` | `editor`, `publisher`, `location`, `pages`, `doi`, `url`                   |
| Conference paper                  | `@inproceedings`           | `author`, `title`, `booktitle`, `year` or `date` | `editor`, `publisher`, `pages`, `doi`, `url`                               |
| Web article or page               | `@online`                  | `title`, `url`                                   | `author` or `organization`, `date`, `urldate`, `archiveurl`, `archivedate` |
| Video, podcast, or platform media | `@online`                  | `title`, `url`                                   | `author` or `organization`, `date`, `type`, `urldate`, `archiveurl`        |
| Social post                       | `@online`                  | `author` or `organization`, `title`, `url`       | `date`, `urldate`, `archiveurl`, platform in `organization` or `note`      |
| Court/legal document              | `@misc` or `@online`       | `title`, `year` or `date`                        | `institution`, `number`, `url`, `urldate`                                  |
| Classical or historical text      | `@book` or `@incollection` | work title, edition/translator/source decision   | `translator`, `editor`, `publisher`, `location`, `year`, locator in prose  |

`@misc` is allowed only when no better source shape exists or when the source is
temporarily unresolved. It should not be the default for known books, articles,
chapters, web pages, or videos.

## Field Rules

- Keep BibTeX keys lowercase ASCII with hyphens.
- Prefer one canonical key per verified source identity.
- Use `author` for people or named group authors.
- Use `organization` when the responsible source is a site, institution, or
  platform and there is no personal author.
- Use `journal`, `booktitle`, and `publisher` instead of embedding containers
  in `title` or `author`.
- Use `pages` for page ranges.
- Use `doi` without a URL prefix.
- Use `url` for the live or canonical source URL.
- Use `archiveurl` and `archivedate` when the cited live URL is dead or the
  archived page is the best evidence.
- Use `urldate` for access dates when the citation is a web source.
- Keep article-specific page references in prose until locator metadata is
  designed.
- Preserve the original literal citation in review notes while changing the
  structured fields; remove `citation` only when display output no longer
  depends on it.

## Ledger Statuses

Each ledger row should use one of these statuses:

- `verified-ready`: source was checked and the correction can be applied.
- `verified-clean`: current structured data is already adequate after lookup.
- `needs-correction`: source identity is clear, but fields are wrong or
  incomplete.
- `duplicate-merge-ready`: verified same source as another row and ready to
  normalize.
- `ambiguous`: source lookup found plausible competing interpretations.
- `unrecoverable`: source could not be found with reasonable evidence.
- `editorial-review`: source exists, but author intent or source-list behavior
  needs a human editorial decision.

## Ledger Columns

The canonical verification ledger must include:

- row number from `docs/CITATION_BIBTEX_AUDIT.md`;
- article path;
- source line;
- key;
- usage count;
- current entry type;
- current review text;
- current literal citation;
- online evidence checked;
- corrected source identity;
- recommended type;
- required field changes;
- duplicate/source identity notes;
- author-intent notes;
- confidence;
- status.

## Batch Order

1. `what-is-a-meme.md`, because it contains the clearest mechanical field
   splits.
2. `postnaturalism.md`, because it contains placeholder and incomplete
   scholarly/philosophical sources.
3. DOI-backed sources across `internetmemetics.md` and
   `the-memeticists-challenge-remains-open.md`.
4. Duplicate clusters across the sitewide bibliography.
5. Web/video/social sources, including dead links and archive decisions.
6. Bibliography-only entries after source-list intent is reviewed.

## Verification After Corrections

After each correction batch:

1. Run `just references-bibtex-audit -- --write --quiet`.
2. Review `docs/CITATION_BIBTEX_AUDIT.md` for coverage regressions.
3. Inspect changed article bibliography output.
4. Inspect `/bibliography/` for grouping and link behavior.
5. Run focused tests if helper logic changed.
6. Run `just release-check` before handoff after source edits.
