# Unlighthouse Site Audit - 2026-05-17

## Scope

Source data:

- `/Users/irk/Developer/JAVASCRIPT/lighthouse/tpm-site/.unlighthouse/thephilosophersmeme.com/7abc`
- `/Users/irk/Developer/JAVASCRIPT/lighthouse/tpm-site/.unlighthouse/thephilosophersmeme.com/74c2`

The first export contains 78 Lighthouse JSON reports. The newer `74c2`
production rescan contains 46 reports and should be treated as the current
implementation target. Both scans target the deployed production site at
`https://thephilosophersmeme.com/`, so results include Cloudflare-injected
analytics/RUM scripts.

This report classifies each non-perfect Lighthouse issue as:

- **Improve**: actionable site or platform work.
- **Experiment**: plausible improvement, but only worth keeping after measured
  before/after evidence.
- **Monitor**: useful budget signal, not a direct implementation task yet.
- **Noise**: expected scanner output, external behavior, or stale against the
  current scan.

## Investigation Method

The investigation did not stop at Lighthouse labels. I parsed the `74c2`
reports, compared them with the earlier `7abc` scan, inspected the homepage
filmstrip/screenshot artifacts, and traced the recurring findings to current
source files.

Key source ownership:

- Homepage carousel: `src/components/blocks/home/HomeFeaturedCarousel.astro`,
  `src/components/blocks/home/HomeFeaturedSlide.astro`, and
  `src/scripts/home-featured-carousel.ts`.
- Publishable/list media: `src/components/articles/media/PublishableMediaFrame.astro`
  and `src/components/articles/lists/ArticleCard.astro`.
- Branded CTA logo sizing: `src/components/ui/BrandButton.astro`, used by
  `src/components/ui/PatreonButton.astro`,
  `src/components/ui/DiscordButton.astro`, and
  `src/components/blocks/shared/SupportBlock.astro`.
- Anchored-positioning request chain: `src/components/ui/AnchoredRoot.astro`
  and `src/scripts/anchored-positioning.ts`.
- Global render-blocking CSS: `src/layouts/BaseLayout.astro`,
  `src/styles/global.css`, `site/theme.css`, and `src/styles/print.css`.
- Flagged semantic table: `site/content/articles/history/wittgensteins-most-beloved-quote-was-real-but-its-fake-now.md`.

## Current `74c2` Route Summary

Worst current performance scores:

| Route                                                                   | Performance | A11y | Best Practices |  SEO | Notable metric              |
| ----------------------------------------------------------------------- | ----------: | ---: | -------------: | ---: | --------------------------- |
| `/`                                                                     |        0.84 | 0.94 |           1.00 | 1.00 | LCP 2.9s, Speed Index 15.6s |
| `/articles/kandinsky-and-loss/`                                         |        0.87 | 1.00 |           1.00 | 1.00 | CLS 0.259                   |
| `/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/` |        0.96 | 1.00 |           1.00 | 1.00 | CLS 0.082, table a11y       |
| `/tags/meta-irony/`                                                     |        0.97 | 1.00 |           1.00 | 1.00 | LCP 2.4s                    |
| `/bibliography/`                                                        |        0.98 | 0.98 |           1.00 | 1.00 | heading order               |

Current non-perfect audit groups:

| Audit ID                          | Count | Status                        |
| --------------------------------- | ----: | ----------------------------- |
| `cache-insight`                   |    46 | Noise: Cloudflare analytics   |
| `network-dependency-tree-insight` |    46 | Experiment: dependency budget |
| `render-blocking-insight`         |    46 | Experiment: critical CSS      |
| `first-contentful-paint`          |    40 | Monitor                       |
| `largest-contentful-paint`        |    39 | Improve through image work    |
| `image-delivery-insight`          |    22 | Improve                       |
| `interactive`                     |    12 | Monitor                       |
| `label-content-name-mismatch`     |     5 | Improve                       |
| `speed-index`                     |     3 | Improve carousel behavior     |
| `heading-order`                   |     2 | Improve                       |
| `cumulative-layout-shift`         |     2 | Improve CTA logo sizing       |
| `forced-reflow-insight`           |     1 | Monitor                       |
| `td-has-header`                   |     1 | Improve                       |
| `layout-shifts`                   |     1 | Improve CTA logo sizing       |
| `cls-culprits-insight`            |     1 | Improve CTA logo sizing       |
| `target-size`                     |     1 | Improve                       |
| `lcp-discovery-insight`           |     1 | Improve                       |
| `inspector-issues`                |     1 | Hosting/config investigation  |

## Developer Handoff Criteria

This audit is ready to implement when each pass has:

- a specific source owner;
- a measurable expected outcome;
- a verification command or browser/Lighthouse sample route;
- an explicit rollback rule for experiments;
- no dependency on changing production Cloudflare settings unless the pass is
  explicitly marked as hosting/config work.

Baseline routes to sample after implementation:

- `/`: carousel behavior, homepage LCP, Speed Index, accessibility, critical
  request chain, and homepage hero payload.
- `/articles/kandinsky-and-loss/`: current worst CLS and article-prose image
  delivery outlier.
- `/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/`:
  secondary CLS and semantic table accessibility.
- `/articles/`: article-card image sizing on a list-heavy route.
- `/authors/seong-young-her/`, `/categories/history/`, and
  `/tags/meta-irony/`: repeated article-card thumbnail payload behavior.
- `/bibliography/`: heading order and possible forced reflow monitoring.

Release-level verification remains:

```sh
bun run check:release
bun run test:a11y
bun run test:perf
```

For experiment passes, compare Lighthouse reports before and after on at least
the homepage, one article page, one list-heavy archive/category/tag page, and
the bibliography page. Keep the experiment only if it improves the targeted
metric without hurting accessibility, CLS, TBT, SEO, HTML validity, or visual
stability.

## Investigation Findings

### Homepage Speed Index

Status: **Improve**

The homepage Speed Index outlier is not a classic slow-render problem. In the
latest scan, homepage FCP is 1.7s, LCP is 2.9s, TBT is 0ms, CLS is 0, but Speed
Index is 15.6s. The filmstrip explains the mismatch: early thumbnails show the
initial `Homesteading the Memeosphere` featured slide, a later thumbnail around
9.6s shows `Support us on Patreon`, and the final screenshot shows another
slide. The carousel auto-rotates every 9s in
`src/scripts/home-featured-carousel.ts`.

Conclusion: Lighthouse is penalizing intentional visual change after first
paint. The page is not blank for 15 seconds.

Recommended implementation:

- Make the homepage featured carousel manual by default.
- Remove initial-load autoplay from the default behavior. If a future site
  configuration reintroduces autoplay, it should be opt-in and must not start
  during initial page-load measurement.
- Revise `aria-live="polite"` on the carousel viewport. Manual user-triggered
  slide changes can be announced, but the default page load should not set up a
  live region that announces automatic slide changes.

Risks:

- This is a visible behavior change. It removes passive motion from the
  homepage, but that is now the desired design and should improve reading,
  accessibility, and Lighthouse stability.

Tests:

- Add script tests proving the carousel does not auto-advance by default.
- Add a focused Playwright check that the active slide remains stable during the
  initial Lighthouse-style measurement window.
- Re-run homepage Lighthouse after deployment.

Acceptance criteria:

- No featured slide changes without user interaction during the first-load
  measurement window.
- Carousel arrows and dots still switch slides.
- Homepage Speed Index is no longer dominated by post-load carousel rotation.
- No accessibility regression from the carousel live-region behavior.

### Homepage Featured Image LCP

Status: **Improve**

The homepage LCP candidate is the active featured image:
`Homesteading the Memeosphere`. It is discoverable and eager, but Lighthouse
flags that it lacks `fetchpriority="high"`.

Source:

- `src/components/blocks/home/HomeFeaturedSlide.astro`
- `src/components/articles/media/PublishableMediaFrame.astro`

Recommended implementation:

- Add a `fetchpriority` prop to `PublishableMediaFrame`.
- Pass `fetchpriority="high"` only for the active first featured slide.
- Keep inactive carousel media lazy/default priority.
- Do not add a blanket image preload in the first implementation. Preload is
  useful when an LCP image is discovered late, but the active homepage featured
  image is already present in the HTML. Start with `fetchpriority`; add a
  targeted responsive preload only if follow-up Lighthouse/network timing still
  shows late discovery or load delay.
- If a targeted preload becomes necessary, the preload must match the generated
  responsive image candidate and `sizes` behavior. A mismatched preload is worse
  than no preload because it can waste bandwidth or double-fetch.

Tests:

- Add a component test for active featured media having `fetchpriority="high"`.
- Verify inactive slides do not all become high-priority downloads.
- If a preload experiment is added later, verify the network panel shows a
  single useful request for the intended LCP image, not duplicate image
  downloads.

### Article CLS From Brand Buttons

Status: **Improve**

The current `74c2` scan still reproduces the support-button CLS pattern:

- `/articles/kandinsky-and-loss/`: CLS 0.259.
- `/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/`:
  CLS 0.082.

The layout-shift detail for `kandinsky-and-loss` points at the Patreon lockup
inside the article support block:

```html
<img
  src="/_astro/patreon-lockup-white..."
  width="635"
  height="96"
  class="h-4 w-auto max-w-full"
/>
```

The source is `BrandButton.astro`, which renders an Astro `Image` with
`layout="fixed"` and then visually resizes it with `h-4 w-auto`. Lighthouse
still sees the branded image as an unsized or unstable media element.

Recommended implementation:

- Give brand logos a stable rendered layout box that matches the final button
  design.
- Avoid relying on raw SVG intrinsic dimensions such as `635x96` combined with
  CSS `h-4 w-auto`.
- Prefer one of:
  - a fixed logo wrapper with explicit width and height;
  - explicit rendered `width` and `height` props per brand lockup;
  - or inline SVG components for known brand lockups.

Risks:

- Minor visible CTA logo sizing changes are possible. Those are acceptable if
  the buttons remain visually balanced and consistent.

Tests:

- Add component coverage for stable logo dimensions.
- Add or extend e2e coverage for article endcap/support blocks not shifting
  after images load.

### Article List Image Sizing

Status: **Improve**

The latest scan has 73 image-delivery rows across 22 routes, with about 1.75 MB
of estimated savings. The repeated pattern is not missing Astro optimization:
the images are WebP. The issue is that list thumbnails use a generic
`renderWidth={640}`, `renderHeight={360}`, and generic generated `sizes`, even
when displayed as 80px, 96px, 240px, or 288px frames.

Top repeated examples:

- `A Tale of Two Healthcare Narratives`: 64 KB resource, 58 KB estimated waste.
- `Wittgenstein's Most Beloved Quote Was Real, But It's Fake Now`: 62 KB
  resource, 56 KB estimated waste.
- `2010's Decade Review, Part 2`: 50 KB resource, 45 KB estimated waste.
- `Hotline Miami and player complicity`: 49 KB resource, 43 KB estimated waste.
- `Memes, Jokes & Visual Puns`: 36 KB resource, 31 KB estimated waste.

Source:

- `ArticleCard.astro` passes `renderWidth={640}` and `renderHeight={360}` for
  all article-card thumbnails.
- `PublishableMediaFrame.astro` does not yet expose context-specific `sizes`,
  quality, or priority control.

Recommended implementation:

- Add context-specific image options to `PublishableMediaFrame`.
- Make `ArticleCard` pass thumbnail-specific dimensions and a `sizes` string
  matching its actual frames:
  - mobile: 80px;
  - `sm`: 96px;
  - `md`: 240px;
  - `lg`: 288px.
- Choose generated source widths intentionally. They should cover the largest
  rendered frame and normal high-DPR displays without using the current generic
  640px-wide article-media assumption for every thumbnail.
- Consider lower image quality for article-list thumbnails than for article
  prose images.
- Keep article prose images and inspectable article images higher quality.

Tests:

- Component tests should assert article-card images use thumbnail-specific
  dimensions/sizes.
- After implementation, compare `dist/_astro` image output and rerun sampled
  list routes in Lighthouse.

Acceptance criteria:

- Article cards no longer emit a generic `sizes="(min-width: 640px) 640px,
100vw"` thumbnail policy.
- Top repeated list-thumbnail image-delivery warnings are materially reduced on
  `/articles/`, author pages, category pages, and tag pages.
- Thumbnail visual quality remains acceptable on high-DPR screens.

### Homepage Hero Image Delivery

Status: **Improve / tune carefully**

The homepage hero logo image is already eager and high-priority. Lighthouse
still estimates about 55 KB savings from a 94 KB WebP candidate, mostly from
compression. This is a meaningful but less urgent issue than the article-card
thumbnail mismatch.

Recommended implementation:

- Treat the hero image as a separate quality/sizing decision from list
  thumbnails.
- Do not globally lower all image quality just to improve this one art asset.
- Consider a hero-specific quality setting if repeated scans show it remains a
  homepage payload outlier.

### Article Prose Image Delivery

Status: **Improve selectively**

`/articles/kandinsky-and-loss/` has a 23 KB image-delivery warning on
`loss_art_simplified.png`. The rendered image is tall and content-significant,
so it should not drive a global image quality reduction by itself.

Recommended implementation:

- Fix list-thumbnail sizing first.
- Recheck article-prose outliers after list images are tuned.
- Use content-specific exceptions for unusually detailed images rather than
  global compression if quality would degrade.

### Semantic Table Accessibility

Status: **Improve**

The current `td-has-header` failure is on:
`/articles/wittgensteins-most-beloved-quote-was-real-but-its-fake-now/`.

The table compares Google and Google Scholar search results. The first row is a
column-header row, and the first column acts as row labels:

```md
|                               | Google search results | Google Scholar search results |
| ----------------------------- | --------------------- | ----------------------------- |
| Dribble-Wittgenstein Phrasing | 7,730                 | 49                            |
| Malcolm-Wittgenstein Phrasing | 78                    | 41                            |
```

Plain Markdown renders first-column row labels as `<td>`, so assistive
technology cannot associate those data cells with row headers.

Recommended implementation:

- Fix this article with explicit semantic table HTML or an MDX table component.
- Document the authoring rule: use Markdown tables for simple tables, but use a
  semantic table escape hatch when the first column is a row header, when tables
  have multi-level headers, or when associations are non-trivial.
- Do not globally convert every first-column Markdown table cell into `<th>`.

Tests:

- Add a focused rendered-output test for this article or a fixture table that
  verifies `scope="row"` and `scope="col"` are present.

### Accessibility Name And Heading Issues

Status: **Improve**

Current `74c2` issues:

- Homepage carousel dot buttons have 8px by 8px hit targets.
- TOC summaries on several articles expose visible text `Contents Hide` but use
  an accessible name that does not include the visible text.
- Homepage fallback featured media shows visible text `TPM`, while the link
  accessible name is `Read Support us on Patreon`.
- Homepage featured slide title renders as an `h3` without a surrounding
  visible or hidden `h2`.
- Bibliography entries render `Cited by article` as an `h3` in a way that
  breaks heading order.

Recommended implementation:

- Make carousel dot buttons at least 24px by 24px while keeping the visible dot
  small.
- Remove or revise the TOC summary `aria-label` so visible words are included in
  the accessible name.
- Mark decorative fallback `TPM` text `aria-hidden` or include it in the link's
  accessible name.
- Add a semantic featured section heading or adjust slide title heading levels.
- Make repeated bibliography "Cited by article" labels non-heading text unless
  each bibliography source has a correct parent heading.

Tests:

- Component tests for each changed primitive/block.
- Re-run `bun run test:a11y` and a focused homepage/article Lighthouse sample.

### Critical Request Chain

Status: **Experiment - adopted**

The latest homepage critical chain is short but real:

- document: 148ms, 21.4 KB;
- `AnchoredRoot...js`: 205ms, 1.9 KB;
- `anchored-positioning...js`: 290ms, 2.1 KB;
- `BaseLayout...css`: 228ms, 19.7 KB;
- `page...js`: 184ms, 0.6 KB;
- `_astro_prefetch...js`: 223ms, 1.7 KB.

Lighthouse reports no useful preconnect candidates because the critical
requests are same-origin.

The actionable question is not preconnect. The question is whether
anchored-positioning needs to be on the homepage critical path. It loads because
header/category dropdowns and other anchored surfaces use `AnchoredRoot.astro`,
which unconditionally emits the positioning script.

Recommended experiment:

- Test a lazy-but-opportunistic anchored-positioning loader:
  - do not load the full positioning module on initial render;
  - load immediately on first anchored UI intent, such as `pointerenter`,
    `focusin`, `pointerdown`, or `click` on an anchored trigger/root;
  - also warm the module on browser idle so common users have it ready before
    they open a dropdown or popover;
  - share a single loader promise so every anchored surface installs the
    controller once.
- Preserve behavior for header category dropdowns, citation/share popovers,
  hover cards, and reference previews.
- Preserve an acceptable fallback while the module is loading. A fast hover or
  tap on the header must not leave the panel broken, off-screen, or unreachable.
- Keep the change only if Lighthouse and manual interaction checks improve
  without delaying first interaction with the header.

Tests:

- Unit-test the loader so first intent and idle warmup both install the module
  once.
- Browser-test header category dropdowns, citation/share popovers, hover image
  cards, and reference previews from a cold page load.
- Confirm the homepage critical request chain no longer includes
  `anchored-positioning` before first interaction.

Implementation outcome:

- `AnchoredRoot.astro` now emits a small
  `anchored-positioning-loader` script instead of loading the full positioning
  controller on first render.
- The loader imports the full positioning module on first anchored UI intent
  and warms it on idle with one shared promise.
- `anchored-positioning.ts` exposes
  `scheduleAnchoredRootFromTarget()` so the first trigger that caused the lazy
  load is positioned immediately after the module installs.
- Built output inspection confirms the full positioning controller is split
  behind a dynamic import instead of being directly requested by the initial
  homepage script graph.

### Render-Blocking CSS

Status: **Experiment - measured, not adopted**

Every route reports the main `BaseLayout` stylesheet as render-blocking. The
homepage sample is about 19.7 KB and 332ms. This is normal for a static site,
but it is still a valid optimization experiment.

Recommended experiment:

- Do not inline CSS by hand.
- Test an automated critical-CSS strategy on a build copy. `beasties` is a
  reasonable candidate because it can process static HTML after `astro build`,
  but it should be treated as an experiment rather than adopted directly.
- If using `beasties`, consider scoping with a critical container rather than
  letting long article pages inline every matching prose rule.
- Measure:
  - FCP/LCP changes;
  - HTML growth under gzip/Brotli;
  - CSS cache leverage lost to per-page inline CSS;
  - dark-mode flash risk;
  - route-specific style drift;
  - prose/print/header regressions.
- Keep only if the measured benefit outweighs the added build complexity.

Acceptance criteria:

- FCP/LCP or render-blocking diagnostics improve on cold loads.
- Total compressed transfer size does not increase enough to offset the paint
  win.
- No flash of unstyled content, dark-mode flash, prose regression, or header
  layout regression appears in screenshot checks.
- The process is automated and reproducible; no hand-maintained route-specific
  critical CSS is allowed.

Experiment result:

- `bun run payload:critical-css:experiment` now runs a bounded Beasties
  experiment against a copied build output and writes a reproducible report
  under `tmp/critical-css-experiment/report.md`.
- The first-pass Beasties scenario processed 303 HTML files and increased HTML
  payload by 8,890,189 bytes raw, 1,827,807 bytes gzip, and 1,535,810 bytes
  Brotli.
- Because the compressed payload increase is large and the current CSS request
  is already cacheable and modest, the audit does not recommend wiring Beasties
  into production without a separate measured FCP/LCP win large enough to
  justify the complexity.

### Cache Warnings

Status: **Noise**

The `cache-insight` warnings in the latest scan list only Cloudflare-injected
analytics assets:

- `/cdn-cgi/zaraz/s.js?...`
- `static.cloudflareinsights.com/beacon.min.js/...`

First-party hashed `/_astro/*` assets are not the cache-warning source in this
scan.

Recommended action:

- No Astro code change.
- Decide analytics policy separately if Cloudflare/Zaraz payload becomes a
  product concern.
- Keep production spot-checks for immutable first-party `/_astro/*` caching.

Repository policy:

- `site/public/_headers` already sets
  `Cache-Control: public, max-age=31556952, immutable` for `/_astro/*`.
- The current Unlighthouse cache warnings are Cloudflare-injected analytics
  assets, not first-party Astro assets.
- HTML, feeds, PDFs, Pagefind files, root icons, and other non-fingerprinted
  files intentionally keep normal revalidation behavior unless a route-specific
  policy is measured and documented.

### CSP / Inspector Issues

Status: **Hosting/config investigation**

The current Best Practices issue appears on `/tags/postmodernism/`. The
DevTools inspector issue lists first-party `_astro` scripts, Cloudflare
analytics scripts, `static.cloudflareinsights.com`, and
`stats.g.doubleclick.net`.

Recommended action:

- Inspect production response headers and Cloudflare dashboard settings before
  changing app code.
- Decide whether Cloudflare Web Analytics, Zaraz, Google/DoubleClick, and RUM
  are all intended.
- If the site intentionally has a CSP, version it in deployment config and make
  the allowlist explicit.

### FCP, LCP, TTI, And Forced Reflow

Status: **Monitor**

Most non-perfect FCP/LCP scores are not independent defects. They should improve
indirectly through image sizing, carousel stability, and possible CSS/script
experiments.

`interactive` scores are slightly below perfect on 12 routes, but TBT is 0 on
the worst pages. This is not currently a JavaScript execution problem.

`forced-reflow-insight` appears once on `/bibliography/` with about 33ms of
unattributed reflow. That is worth monitoring but not worth a standalone fix
unless it reproduces with attribution.

## Recommended Implementation Order

The implementation is tracked in `CHECKLIST.md` as Milestones 167-172. The
milestones intentionally separate direct fixes from experiments:

- Milestone 167 locks this audit into implementation invariants and test plans.
- Milestone 168 handles accessibility and semantic HTML issues first, because
  these have clear pass/fail scanner outcomes and low performance risk.
- Milestone 169 handles visual stability and LCP priority, including the manual
  homepage carousel, stable brand buttons, and selective `fetchpriority`.
- Milestone 170 handles article-list image payload tuning.
- Milestone 171 records repository-owned hosting/analytics policy so
  Cloudflare-injected scanner output is not confused with first-party code.
- Milestone 172 contains bounded experiments. These changes must be measured
  and may be reverted or deferred if the tradeoff is not objectively favorable.

### Pass 1: Accessibility And Semantics

- Fix carousel dot hit targets.
- Fix TOC summary accessible names.
- Fix homepage fallback media accessible names.
- Fix homepage featured and bibliography heading order.
- Fix the Wittgenstein table with explicit row/column header semantics.

Implementation outcome:

- Completed. Focused component/rendered-output tests cover the TOC toggle,
  publishable media fallback, homepage carousel controls, bibliography heading
  structure, and the rendered Wittgenstein table.

Expected impact:

- Homepage accessibility should move from 0.94 to 1.0.
- Bibliography accessibility should move from 0.98 to 1.0.
- The semantic table issue should disappear.

### Pass 2: Carousel Stability, CLS, And LCP Priority

- Disable or make opt-in homepage carousel autoplay.
- Stabilize `BrandButton` logo dimensions.
- Add `fetchpriority` support to `PublishableMediaFrame`.
- Mark only the active first featured image as high priority.
- Leave image preload out of the initial fix. Treat it as a follow-up
  experiment only if `fetchpriority` does not materially improve LCP timing.

Implementation outcome:

- The homepage featured carousel is manual by default and no longer starts an
  autoplay timer on page load.
- Brand CTA images now render with explicit intrinsic dimensions.
- `PublishableMediaFrame` accepts `fetchpriority`, and only the active first
  featured image receives `fetchpriority="high"`.
- No broad preload was added. Preload remains a future targeted experiment only
  if deployed measurement shows the LCP image is discovered late.

Expected impact:

- Homepage Speed Index should stop being dominated by carousel rotation.
- Article CLS outliers should fall below the release budget.
- Homepage LCP should improve modestly.

### Pass 3: Image Payload Tuning

- Give `ArticleCard` thumbnail-specific dimensions and `sizes`.
- Consider lower quality for list thumbnails only.
- Re-run sampled author/category/tag/article-index pages.
- Separately evaluate the homepage hero quality tradeoff.

Implementation outcome:

- `PublishableMediaFrame` now accepts context-specific `widths`, `sizes`, and
  `quality`.
- `ArticleCard` uses list-thumbnail dimensions, a thumbnail-specific `sizes`
  string, constrained generated widths, and conservative list-thumbnail quality
  tuning.
- Article-prose and homepage hero image quality were not globally reduced.

Expected impact:

- Lower image payload on list-heavy pages.
- Less LCP pressure on archive, author, category, and tag pages.

### Pass 4: Hosting And Analytics Policy

- Decide whether to keep every Cloudflare/analytics script currently injected.
- If CSP is intentional, make the policy explicit and versioned.
- Keep cache warnings classified as analytics noise unless policy changes.

Implementation outcome:

- First-party immutable caching is already owned by `site/public/_headers`.
- Cloudflare analytics/Zaraz cache warnings remain classified as production
  analytics policy, not Astro application code.
- CSP/analytics changes are intentionally out of scope for this audit unless a
  separate analytics/privacy policy decision is made.

### Pass 5: Bounded Performance Experiments

- Try lazy-but-opportunistic anchored-positioning: first intent loads
  immediately, idle warms opportunistically, and the shared module installs
  once.
- Try automated critical CSS.
- Optionally compare current Astro prefetch behavior against a narrower policy.

Acceptance rule:

- Keep only changes that improve measured cold-load metrics, preserve
  repeat-navigation UX, pass release gates, and do not add brittle route-specific
  styling or script behavior.

Implementation outcome:

- Lazy-but-opportunistic anchored positioning was adopted after unit coverage
  and built-output inspection.
- The critical-CSS experiment is reproducible but not adopted because the
  measured compressed HTML payload increase is too large for the current
  evidence.
- Astro prefetch policy was not changed; the current audit did not show a
  route-specific prefetch regression that justified narrowing it.

## Non-Actions

- Do not add preconnect hints for the current report; Lighthouse found no useful
  preconnect candidates.
- Do not add broad image preloads. Use `fetchpriority` first for known LCP
  images; preload only as a targeted experiment if measurement proves the image
  is discovered late.
- Do not inline main CSS just to silence `render-blocking-insight`.
- Do not remove Cloudflare analytics scripts without a separate analytics
  policy decision.
- Do not globally convert first-column Markdown table cells to row headers.
- Do not globally lower image quality based on one article-prose image.

## Follow-Up Verification

After implementing fixes, run:

```sh
bun run check:release
bun run test:a11y
bun run test:perf
```

Then re-run the full Unlighthouse scan against the deployed Worker so the
report reflects Cloudflare headers and script injection in the real production
environment.
