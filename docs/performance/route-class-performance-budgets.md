# Route-Class Performance Budget Strategy

This document covers the design work for Linear issue IRK-89. It defines the
first route-class performance budget model for the platform: which routes are
representative, which metrics matter, what is already measured, and how future
budget enforcement should be introduced without turning noisy measurements into
fake precision.

The goal is to make performance measurable by route class while preserving the
project's static-first Astro model, accessibility, semantic output, and
maintainable component architecture.

## Current Evidence

### Existing Lighthouse CI Contract

`lighthouserc.json` currently samples:

- `/`
- `/articles/`
- `/articles/all/`
- `/articles/gamergate-as-metagaming/`
- `/articles/what-is-a-meme/`
- `/articles/kandinsky-and-loss/`
- `/articles/misattributed-plato-quote-is-real-now/`
- `/categories/history/`
- `/bibliography/`
- `/about/`

Current assertions:

| Metric                   | Level   | Threshold    |
| ------------------------ | ------- | ------------ |
| Accessibility score      | Error   | `>= 0.9`     |
| Best Practices score     | Error   | `1.0`        |
| Performance score        | Warning | `>= 0.95`    |
| SEO score                | Error   | `>= 0.9`     |
| Cumulative Layout Shift  | Error   | `<= 0.05`    |
| Largest Contentful Paint | Warning | `<= 2500 ms` |
| Total Blocking Time      | Warning | `<= 150 ms`  |

Current wildcard resource budgets:

| Resource budget       | Threshold     |
| --------------------- | ------------- |
| Total resources       | `<= 45`       |
| Scripts               | `<= 2`        |
| Stylesheets           | `<= 4`        |
| Images                | `<= 12`       |
| Third-party resources | `0`           |
| Script transfer       | `<= 80 KiB`   |
| Stylesheet transfer   | `<= 60 KiB`   |
| Image transfer        | `<= 700 KiB`  |
| Total transfer        | `<= 1000 KiB` |

These budgets are useful but too broad. They do not distinguish a homepage,
plain article, citation-heavy article, media-heavy article, taxonomy page, or
generated PDF artifact.

### Current Unlighthouse Evidence

`docs/performance/unlighthouse-audit-2026-05-17.md` is the current full-site
audit reference. Its newer `74c2` production scan covered 46 routes and found:

- homepage performance `0.84`, driven by carousel visual changes during the
  measurement window;
- `/articles/kandinsky-and-loss/` performance `0.87`, with CLS `0.259`;
- `/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/`
  performance `0.96`, with CLS `0.082`;
- widespread image-delivery opportunities on list and article pages;
- cache warnings caused by Cloudflare-injected analytics, not first-party
  hashed `/_astro/*` assets;
- render-blocking CSS and dependency-chain findings worth monitoring, but not
  yet worth critical-CSS adoption based on the current experiment evidence.

That scan is production evidence, so it includes Cloudflare analytics behavior.
It should inform route sampling and follow-up investigations, not silently
replace local release gates.

### Current Generated Payload Evidence

The current local build was generated with:

```sh
bun --silent run build
bun --silent run payload:report -- --top 12
```

Build output summary:

| Group                | Count |          Raw |        gzip |      Brotli |
| -------------------- | ----: | -----------: | ----------: | ----------: |
| All assets           |  1481 | 95,551,279 B | 4,765,400 B | 3,455,417 B |
| Gzip-eligible assets |   341 | 31,900,664 B | 4,765,400 B | 3,455,417 B |
| HTML assets          |   308 | 31,255,654 B | 4,597,726 B | 3,313,762 B |

Important extension totals:

| Extension | Count |          Raw |        gzip |      Brotli |
| --------- | ----: | -----------: | ----------: | ----------: |
| `.css`    |     4 |    154,293 B |    27,762 B |    23,451 B |
| `.html`   |   308 | 31,255,654 B | 4,597,726 B | 3,313,762 B |
| `.js`     |    15 |    412,747 B |   116,748 B |    98,369 B |
| `.pdf`    |    59 | 29,891,564 B |         n/a |         n/a |
| `.webp`   |   951 | 29,896,532 B |         n/a |         n/a |

Representative HTML route sizes:

| Route                                                                   |       Raw |     gzip |   Brotli |
| ----------------------------------------------------------------------- | --------: | -------: | -------: |
| `/`                                                                     | 161,131 B | 21,651 B | 15,055 B |
| `/articles/`                                                            | 136,843 B | 18,662 B | 12,957 B |
| `/articles/all/`                                                        | 326,235 B | 38,866 B | 21,086 B |
| `/articles/what-is-a-meme/`                                             | 285,270 B | 47,777 B | 35,286 B |
| `/articles/kandinsky-and-loss/`                                         | 158,182 B | 24,257 B | 18,068 B |
| `/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/` | 179,682 B | 28,222 B | 21,049 B |
| `/categories/history/`                                                  | 144,168 B | 19,292 B | 13,015 B |
| `/tags/meta-irony/`                                                     | 123,260 B | 16,830 B | 11,838 B |
| `/authors/seong-young-her/`                                             | 259,390 B | 30,862 B | 17,656 B |
| `/bibliography/`                                                        | 562,047 B | 60,049 B | 36,342 B |

Largest generated PDFs:

| PDF                                                                    |        Size |
| ---------------------------------------------------------------------- | ----------: |
| `articles/the-interpretation-of-memes/the-interpretation-of-memes.pdf` | 3,749,017 B |
| `articles/what-is-a-meme/what-is-a-meme.pdf`                           | 2,167,000 B |
| `articles/what-we-talk-about-harambe/what-we-talk-about-harambe.pdf`   | 2,042,448 B |
| `articles/memes-jokes-and-visual-puns/memes-jokes-and-visual-puns.pdf` | 2,017,824 B |
| `articles/the-memetic-bottleneck/the-memetic-bottleneck.pdf`           | 1,387,670 B |

Current hard generated-file budgets already enforced elsewhere:

- social preview images: `500 KiB`, enforced by build verification;
- article PDFs: `5 MiB`, enforced by build verification;
- first-party hashed `/_astro/*` assets: long-term immutable cache header in
  `site/public/_headers`.

## Route Classes

Route classes are the unit for future budget ownership. A class groups routes
with similar payload shape, LCP risk, interaction cost, and user intent.

| Route class                      | Baseline routes                                                                                                    | Why it matters                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Home                             | `/`                                                                                                                | First impression, biggest CTA surface, hero image, featured carousel, discovery rail. |
| Articles hub                     | `/articles/`, `/articles/all/`                                                                                     | List-heavy reading entry points with many article previews.                           |
| Standard article                 | `/articles/gamergate-as-metagaming/`, `/articles/misattributed-plato-quote-is-real-now/`                           | Typical article page: prose, metadata, actions, TOC, support block, related blocks.   |
| Scholarly/citation-heavy article | `/articles/what-is-a-meme/`, `/articles/internetmemetics/`, `/articles/the-memeticists-challenge-remains-open/`    | Dense citations, bibliography, generated reference sections, large HTML payload.      |
| Media-heavy article              | `/articles/kandinsky-and-loss/`, `/articles/memes-jokes-and-visual-puns/`, `/articles/what-we-talk-about-harambe/` | Images, figure layout, CLS risk, PDF size risk, image transfer budget.                |
| Taxonomy and author listing      | `/categories/history/`, `/tags/meta-irony/`, `/authors/seong-young-her/`, `/collections/featured/`                 | Repeated teaser/card surfaces and image/list payload risk.                            |
| Static page                      | `/about/`, `/announcements/`, `/collections/`                                                                      | Mostly static content with low JavaScript and image expectations.                     |
| Search and bibliography          | `/search/`, `/bibliography/`                                                                                       | Special generated data, Pagefind/search assets, large bibliography HTML.              |
| Generated feeds and metadata     | `/feed.xml`, sitemap files, `_redirects`, social images                                                            | Machine-readability and crawler surfaces; not normal Lighthouse routes.               |
| Generated PDFs                   | Article PDF files                                                                                                  | Scholar compatibility, download size, and print/media fallback contract.              |

The first implementation should keep the existing `lighthouserc.json` sample
set, then add one route from each missing class rather than replacing all
samples at once.

## Metrics And Budget Policy

### Core Web Vitals And Lighthouse

Use Lighthouse on built output for browser-derived metrics:

| Metric               | Current policy          | Route-class policy                                                                          |
| -------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| Performance score    | Warning at `>= 0.95`    | Keep warning initially. Promote route-class failures only after two stable green baselines. |
| Accessibility score  | Error at `>= 0.9`       | Raise individual pages toward `1.0`; do not loosen for performance.                         |
| Best Practices score | Error at `1.0`          | Keep hard. Investigate scanner noise explicitly instead of lowering.                        |
| SEO score            | Error at `>= 0.9`       | Raise toward `1.0` where route metadata is platform-owned.                                  |
| LCP                  | Warning at `<= 2500 ms` | Keep warning initially; route classes should record LCP element and transfer cause.         |
| CLS                  | Error at `<= 0.05`      | Keep hard; any route-class baseline above this is a bug or explicit follow-up.              |
| TBT                  | Warning at `<= 150 ms`  | Keep warning; new hydrated code must justify its TBT cost.                                  |
| Speed Index          | Not currently explicit  | Track for home and list routes; do not allow timed visual changes to dominate it.           |

Do not turn noisy performance scores into hard failures until the route class
has stable baselines. Keep accessibility, semantic correctness, SEO, and HTML
validity hard where they are deterministic.

### HTML Payload Budgets

HTML budgets should use Brotli as the primary threshold because Cloudflare can
serve Brotli to modern browsers and the payload reporter already measures it.
gzip should stay visible because some clients still receive gzip.

Initial warning ceilings should be baseline-derived with enough headroom for
normal content edits. A suggested first pass:

| Route class                      |                                 Current evidence | Initial warning ceiling | Initial failure ceiling |
| -------------------------------- | -----------------------------------------------: | ----------------------: | ----------------------: |
| Home                             |                                `15.1 KiB` Brotli |                `20 KiB` |                `25 KiB` |
| Articles hub                     |                                `13.0 KiB` Brotli |                `18 KiB` |                `24 KiB` |
| Full archive                     |                                `21.1 KiB` Brotli |                `28 KiB` |                `36 KiB` |
| Standard article                 | `18.1-21.0 KiB` Brotli in current sampled routes |                `28 KiB` |                `36 KiB` |
| Scholarly/citation-heavy article |                          up to `43.6 KiB` Brotli |                `50 KiB` |                `65 KiB` |
| Taxonomy and author listing      | `11.8-17.7 KiB` Brotli in current sampled routes |                `24 KiB` |                `32 KiB` |
| Bibliography                     |                                `36.3 KiB` Brotli |                `45 KiB` |                `60 KiB` |

These are starting budgets, not permanent ceilings. After budget tooling
records several clean release baselines, tighten them by route class instead of
raising them casually.

### CSS, JavaScript, Fonts, And Critical Chains

Initial policy:

- Keep the existing Lighthouse resource budgets for CSS and JS until route
  budgets replace them.
- First-party CSS must remain cacheable and modest. Current total CSS is
  `27,762 B` gzip / `23,451 B` Brotli across 4 files.
- New route classes should record critical CSS count, transfer size, and
  whether CSS is shared/cacheable.
- JavaScript should stay opt-in. Current generated JS total is `116,748 B`
  gzip / `98,369 B` Brotli across 15 files, but each route should only load the
  scripts it needs.
- New above-the-fold interaction scripts should be lazy, idle, or interaction
  triggered when possible.
- External fonts should remain zero unless a site theme deliberately opts into
  them with documented performance and layout-stability budgets.
- Critical request-chain findings should be tracked as a warning signal. A new
  first-load script in the critical chain needs an explicit reason.

Critical CSS extraction remains an experiment, not a default. The existing
Beasties experiment increased compressed payload significantly, so adoption
requires measured route-class wins that outweigh cacheability and payload
costs.

### Image And Media Budgets

Initial policy:

- Keep the existing wildcard Lighthouse image transfer budget of `700 KiB`.
- Add lower route-class image warnings for non-media pages after measurement:
  home/list/static pages should not inherit media-heavy article allowances.
- Track LCP image source, responsive candidate, rendered size, transfer size,
  loading mode, and `fetchpriority`.
- Require any new first-viewport image component to reserve stable dimensions
  and use the Astro asset pipeline unless the source is intentionally public
  and unprocessed.
- Treat remote media and iframes as route-class risks. They need static
  fallbacks, layout reservations, and PDF behavior.

The budget tool should distinguish total generated image corpus size from
per-route image transfer. Large generated corpora are acceptable only when
route-level transfer remains efficient and unreferenced assets are pruned.

### PDF Budgets

Generated PDFs are not normal web-page payload, but they matter for Scholar,
downloads, and storage.

Initial policy:

- Keep the hard `5 MiB` per-PDF failure.
- Add review warnings above `3 MiB` because the current largest PDF is
  `3,749,017 B`.
- Treat `2 MiB` as the target for most PDFs.
- Media-heavy PDFs may exceed `2 MiB`, but the build report should make those
  exceptions visible.
- Continue verifying PDF metadata, PDF eligibility, PDF disabled behavior, and
  PDF link correctness through build verification.

### Cache Budgets

Initial policy:

- Keep `Cache-Control: public, max-age=31556952, immutable` for `/_astro/*`.
- Do not apply immutable caching to HTML, feeds, Pagefind files, PDFs, root
  icons, or other non-fingerprinted files without a route-specific policy.
- Keep production cache-warning triage separate from local budgets when the
  warning source is Cloudflare analytics or another host-injected script.
- Add a future generated-output verifier that confirms `dist/_headers` contains
  the expected immutable rule for `/_astro/*`.

## Device And Measurement Profiles

Primary profile:

- Lighthouse mobile profile over static built output.
- One run for local smoke checks, more runs for budget changes when noise is
  suspected.
- Same representative route classes across local, CI, and production spot
  checks where possible.

Secondary profiles:

- Desktop Lighthouse for design-heavy or wide-layout changes.
- Playwright layout checks for viewport-specific containment and CLS-sensitive
  UI.
- Full Unlighthouse production scans for periodic discovery, not every PR.
- Payload reports from `dist/` for generated-output budgets.

## Enforcement Plan

1. Keep current `test:perf` behavior while the route-class workbench is built.
2. Add a typed route-class manifest that maps route classes to representative
   routes and budget profiles.
3. Add a budget reporter that reads built output and reports route HTML size,
   generated asset totals, PDF sizes, and cache-header presence.
4. Integrate the reporter as review-only first.
5. Promote deterministic budgets to release-blocking after they are stable:
   HTML compressed size, PDF size, cache header presence, generated asset
   presence, route manifest validity.
6. Keep noisy browser metrics as warnings until multiple baseline runs prove
   they are stable enough to fail release reliably.
7. Record every budget increase with a reason. Prefer making payload smaller
   before increasing a threshold.

Current implementation status:

- `src/lib/performance-budgets.ts` owns the typed route-class manifest,
  representative routes, HTML Brotli warning/failure budgets, generated PDF
  budget policy, and immutable Astro asset cache policy.
- `payload:report` emits machine-readable and human-readable evidence for
  extension totals, asset-role totals, route-class HTML budget states, generated
  PDF warning/failure states, and `_headers` cache policy presence.
- `lighthouserc.json` samples at least one route from each route class marked
  for Lighthouse measurement.
- These payload and Lighthouse metrics are still review/workbench evidence; the
  existing release gates continue to own deterministic generated-output failures
  until the route-class budgets have stable baselines.

## Acceptance Criteria For Implementation

Route-class budget implementation is complete when:

1. route classes and representative routes live in typed data, not ad hoc
   arrays inside scripts;
2. `lighthouserc.json` samples at least one route from each high-risk class;
3. payload reporting can emit machine-readable route-class budget results;
4. generated PDFs and social images remain covered by build verification;
5. cache-header policy is verified from generated output;
6. docs explain which budgets are hard, warning-only, or investigation-only;
7. failures identify the route, class, metric, measured value, threshold, and
   likely owner.

## Verification

This design was checked against `lighthouserc.json`, `package.json`,
`docs/performance/unlighthouse-audit-2026-05-17.md`,
`docs/ARTICLE_PDF_EXPORT.md`, `docs/SOCIAL_PREVIEW_IMAGES.md`,
`site/public/_headers`, `scripts/payload/report-payload.ts`,
`scripts/build/verify-build.ts`, and a fresh local `dist/` generated with
`bun --silent run build`.
