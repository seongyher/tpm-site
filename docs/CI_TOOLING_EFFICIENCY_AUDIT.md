# CI And Tooling Efficiency Audit

This audit looks at developer productivity, CI cost, and redundant safety
checks in the current Bun/Astro tooling. The goal is not to weaken the release
gate. The goal is to run the same useful checks with less duplicated build
work, clearer local commands, and better separation between blocking safety
signals and review signals.

## Benchmark Scope

Measurements were taken locally on May 8, 2026 with warm dependency and Astro
image caches. CI timings will differ, especially around fresh installs,
Playwright browser provisioning, and GitHub artifact upload/download overhead.
The relative ordering is still useful for finding bottlenecks.

The benchmark ran each stage once. Browser and Lighthouse stages used an
existing built `dist/` so they measure the test/review step without also
counting the production build.

| Stage                       | Exit | Seconds |
| --------------------------- | ---: | ------: |
| content verify              |    0 |    0.39 |
| tag check                   |    0 |    0.09 |
| site doctor                 |    0 |    0.06 |
| site schema check           |    0 |    0.06 |
| platform boundary check     |    0 |    0.88 |
| asset locations             |    0 |    0.05 |
| shared assets               |    0 |    0.06 |
| typecheck astro             |    0 |   12.26 |
| typecheck tools             |    0 |    3.18 |
| lint                        |    0 |   19.44 |
| package sort                |    0 |    0.17 |
| format                      |    0 |    4.32 |
| deadcode                    |    0 |    2.38 |
| catalog check               |    0 |    0.10 |
| test accountability         |    0 |    0.13 |
| unit tests                  |    0 |    6.34 |
| astro component tests       |    0 |   40.42 |
| raw build                   |    0 |    9.53 |
| pdf build                   |    0 |   42.00 |
| build optimize              |    0 |    5.73 |
| build verify                |    0 |    1.98 |
| html validate               |    0 |    4.85 |
| asset review                |    0 |    0.23 |
| markdown review             |    0 |    8.57 |
| coverage review             |    0 |    6.91 |
| e2e on existing dist        |    0 |   21.51 |
| a11y on existing dist       |    0 |    7.02 |
| lighthouse on existing dist |    0 |   80.29 |

Additional split for `test-astro`:

| Stage                                  | Exit | Seconds |
| -------------------------------------- | ---: | ------: |
| `astro sync --force`                   |    0 |    2.57 |
| `sync-astro-test-store`                |    0 |    0.04 |
| `vitest run --config vitest.config.ts` |    0 |   29.56 |

Generated output size after the benchmark:

| Output                 |     Size |
| ---------------------- | -------: |
| `dist/`                |    93 MB |
| `dist/articles/`       |    39 MB |
| generated article PDFs | 59 files |

## Pre-Refactor CI Shape

Before Milestone 100, the CI workflow ran these PR jobs:

- `quality`: installs dependencies and runs `just check`.
- `markdown-review`: installs dependencies and runs Markdown review checks.
- `asset-review`: installs dependencies and runs duplicate/unused asset review.
- `build`: installs dependencies, installs Playwright Chromium, runs
  `just build`, `just verify`, and `just validate-html`.
- `browser`: installs dependencies, installs Playwright Chromium, runs
  `just test-e2e`.
- `catalog`: installs dependencies, installs Playwright Chromium, runs
  `just test-catalog` and `just test-catalog-site-instance`.
- `accessibility`: review-only, installs dependencies, installs Playwright
  Chromium, runs `just test-a11y`.
- `lighthouse`: review-only, installs dependencies, installs Playwright
  Chromium, runs `just test-perf`.
- `audit`: installs dependencies and runs the high-severity dependency audit.
- `audit-review`: review-only, installs dependencies and runs all-severity
  audit.
- `coverage-review`: review-only, installs dependencies and runs coverage.

On `main`, deploy repeated install, Playwright Chromium install, production
build, build verification, and HTML validation before uploading `dist/`.

## Redundancy Findings

### Production Build Repeats Too Often

`just build` currently runs:

1. raw Astro/Pagefind build;
2. article PDF generation through Playwright Chromium;
3. output optimization.

That is roughly 57 seconds locally before `verify` and `validate-html`.

In PR CI, the production build runs independently in:

- `build`;
- `browser`, because `test-e2e` runs `just build`;
- `accessibility`, because `test-a11y` runs `just build`;
- `lighthouse`, because `test-perf` runs `just build`.

That means the same production output is rebuilt four times on PRs, including
the 42-second PDF step. On `main`, deploy builds a fifth time instead of using
the already-verified build artifact.

### Playwright Browser Provisioning Is Repeated

Playwright Chromium is installed in every job that touches browser output or
PDF generation. That is currently necessary because PDF generation uses
Playwright during `build`, but it makes the build job browser-dependent even
when no browser test is running.

This is another reason the deferred document-first PDF pipeline matters: if
PDFs no longer need Chrome, the normal build can stop provisioning Playwright.

### Browser Test Scripts Always Rebuilt

The pre-refactor scripts were safe but inflexible:

- `test-e2e` always runs `just build` first.
- `test-a11y` always runs `just build` first.
- `test-perf` always runs `just build` first.

This is convenient locally when starting from no `dist/`, but it blocks CI from
reusing a verified build artifact and blocks developers from intentionally
running browser checks against an already-built output.

### Review Jobs Consume Real CI Time

`accessibility`, `lighthouse`, `markdown-review`, `asset-review`,
`audit-review`, and `coverage-review` are `continue-on-error`, which is good
for non-blocking review signals. They still consume runner minutes and setup
time on every PR.

Lighthouse is the largest review-only cost by far. It took about 80 seconds
against an existing `dist/`, before counting repeated production build and
Playwright install.

### Local Developer Commands Are Too Binary

For day-to-day work, `check` is strong but expensive because it includes
typechecking, lint, formatting, deadcode, catalog accountability, unit tests,
and Astro component tests. Based on the benchmark, the expensive pieces are:

- Astro component tests;
- ESLint;
- Astro typecheck.

The fast content/config invariant checks are valuable and cheap, but they are
buried inside the full gate. Developers need a clearer fast path for early
feedback and a clear release path for exhaustive confidence.

## Recommendations

### Implemented Refactor

Milestone 100 implements the highest-value first tranche from this audit:

- `test-e2e-built`, `test-a11y-built`, and `test-perf-built` run browser,
  accessibility, and Lighthouse checks against an existing `dist/`.
- The local convenience scripts still build first, then delegate to the
  built-output scripts.
- The `build` job uploads a short-retention `verified-dist` artifact only after
  build verification and HTML validation pass.
- Browser, accessibility, and Lighthouse jobs download `verified-dist` and run
  the built-output scripts without rebuilding.
- Deploy downloads and publishes the same verified artifact instead of
  rebuilding on `main`.

Correctness is encoded with package-script tests, CI workflow contract tests,
formatting checks, a production build, generated-output verification, HTML
validation, and built-output browser smoke checks.

Milestone 101 implements two local command follow-ups:

- `just check-fast` exposes the cheap invariant checks for early local feedback and
  makes the normal `just check` command reuse that set before expensive typecheck,
  lint, formatting, dead-code, and test stages.
- `just release-check` now runs e2e browser tests against the already verified
  release build through `just test-e2e-built` instead of rebuilding before e2e.
- `just quality` now stops at the first blocking failure, avoiding build/PDF/browser
  work after an earlier required gate has already failed.
- `just quality-release` now runs review-only a11y and Lighthouse checks through the
  built-output entrypoints after the release gate has left a verified normal
  `dist/` in place.

Milestone 102 adds output ownership and safe local parallelism:

- Catalog builds now use `SITE_OUTPUT_DIR=dist-catalog`, a sibling output
  directory outside the production `dist/` tree. That prevents catalog checks
  from depending on, overwriting, or being wiped by the normal release build.
- `just test-catalog` now has a small catalog-specific runner that builds the
  catalog variant into that isolated output directory before running the
  catalog Playwright invariants.
- `just check-fast` now runs cheap config contract tests, including the ESLint
  generated-output ignore contract, so new build output directories fail before
  the full lint stage starts reporting generated JavaScript.
- The quiet quality runner keeps build-producing gates sequential, then runs
  the trailing review-only suffix concurrently once all blocking work has
  passed. This parallelizes review signals without racing Astro build output or
  shared generated metadata.

Local command guidance after the follow-up:

- Use `just check-fast` while editing content, config, assets, or platform
  boundaries and you want quick feedback.
- Use `just check` before pushing normal code changes.
- Use `just quality` when you also want build, generated-output, HTML, Markdown,
  asset-review, and coverage review signals.
- Use `just release-check` or `just quality-release` only for release-grade local
  confidence.

### 1. Add Built-Output Test Scripts

Add scripts that run browser/review checks against an existing `dist/`:

- `test-e2e-built`: `playwright test tests/e2e`
- `test-a11y-built`: `playwright test tests/a11y`
- `test-perf-built`: `lhci autorun`

Catalog tests are intentionally separate from these built-output scripts
because they exercise a different site variant. `test:catalog` owns its
isolated `dist-catalog/` build instead of reusing the production artifact.

Keep the current convenience scripts:

- `test-e2e`: build then run `test-e2e-built`;
- `test-a11y`: build then run `test-a11y-built`;
- `test-perf`: build then run `test-perf-built`.

This preserves local ergonomics while giving CI a no-rebuild path.

### 2. Upload The Verified Build Once And Reuse It

Change the `build` job to upload the verified `dist/` as an artifact after
`build`, `verify`, and `validate-html` pass.

Then change `browser`, `accessibility`, and `lighthouse` to download that
artifact and run their new `*:built` scripts instead of rebuilding.

Expected payoff:

- removes three repeated production builds on PRs;
- avoids repeating the 42-second PDF build in browser/review jobs;
- makes browser/a11y/perf test results refer to the exact artifact already
  verified by the build job.

Tradeoff:

- `dist/` is currently about 93 MB, so artifact upload/download has a cost.
  That cost is likely lower than rebuilding and regenerating PDFs three times,
  but it should be measured in CI after implementation.

### 3. Reuse The Build Artifact For Deploy

On `main`, deploy should consume the verified `dist/` artifact from the build
job instead of doing another install, browser provisioning, build, verify, and
HTML validation pass.

This makes deploy more trustworthy: the artifact deployed is the artifact CI
already verified.

### 4. Keep Blocking And Review Signals Separate

Keep blocking PR gates focused on:

- `quality`;
- `build`;
- `browser`;
- `catalog`;
- `audit`;
- security workflow checks.

Keep review-only jobs as review-only, but consider moving the most expensive
review signals to one of these modes if CI minutes become painful:

- scheduled nightly;
- `push` to `main`;
- manual `workflow_dispatch`;
- path-filtered PR runs for changes likely to affect the signal.

Lighthouse is the best candidate for this because it is expensive and noisy by
nature. Accessibility is cheaper and should probably remain on PRs.

### 5. Add A Fast Local Feedback Script

Add a developer-first script such as `check-fast` or `doctor` that runs cheap
high-signal checks:

- content verification;
- tag normalization check;
- site doctor;
- schema freshness;
- platform boundary check;
- asset location/shared checks;
- package sorting;
- targeted unit tests if a future changed-file runner is added.

This should be fast enough to run frequently while editing. It should not
replace `check`; it gives developers earlier feedback before the full gate.

### 6. Add A Reproducible Benchmark Script

The ad hoc benchmark from this audit should become a Rust task surfaced
through `just`, for example:

```text
just tooling-benchmark
```

It should:

- run selected stages once, or N times when requested;
- emit Markdown and JSON reports;
- distinguish cold-cache and warm-cache mode;
- support `--skip-browser`, `--skip-lighthouse`, and `--output`;
- never mutate source files;
- document machine, OS, Bun, Node, Astro, and Playwright versions.

This makes future tooling changes measurable rather than vibes-based.

### 7. Treat PDF Generation As The Main Build-Time Design Risk

`build-pdf` is the largest build substage at about 42 seconds locally and is
the reason normal production builds need Playwright Chromium installed.

Short-term:

- do not run PDF generation in jobs that only need browser layout checks if
  they can consume an already-generated build artifact;
- consider a documented `build:no-pdf` or `build:browser-fixture` only if
  artifact reuse is not enough.

Long-term:

- resume the deferred article PDF document-pipeline replacement. A
  document-first renderer could remove Chrome from the production build path
  and make CI simpler.

### 8. Avoid Over-Optimizing Sub-Second Checks

Content, tag, site-config, platform-boundary, asset-location, shared-asset,
catalog-accountability, and package-order checks are cheap. Keep them direct
and explicit. The bottlenecks are build/PDF, browser/perf, Astro component
tests, ESLint, and Astro typechecking.

## Proposed Refactor Milestones

### Milestone 1: Built-Output Test Scripts

- Add `test-e2e-built`, `test-a11y-built`, and `test-perf-built`.
- Update existing `test-e2e`, `test-a11y`, and `test-perf` to delegate after
  building.
- Update `COMMANDS.md`.
- Add package-script tests for the new entries.

### Milestone 2: CI Artifact Reuse

- Upload `dist/` from the `build` job after verification passes.
- Download that artifact in browser, accessibility, and Lighthouse jobs.
- Switch those jobs to the built-output scripts.
- Measure CI wall time before and after.

### Milestone 3: Deploy Verified Artifact

- Make deploy depend on the build artifact.
- Remove duplicate deploy install/build/verify/validate steps.
- Ensure deploy still waits for the required blocking gates.

### Milestone 4: Local Fast Feedback

- Add a fast local check script for cheap invariant checks.
- Document when to use `check-fast`, `check`, `quality`, and
  `quality-release`.

### Milestone 5: Benchmark Tooling

- Commit the benchmark runner used by this audit in cleaned-up form.
- Generate a report under `docs/performance/` or `tmp/` depending on whether
  results should be versioned.
- Use it before and after future CI/tooling changes.

## Target End State

The target CI shape is:

- one production build per PR;
- browser, a11y, and performance checks run against the same verified artifact;
- deploy publishes the exact verified artifact;
- review-only jobs stay useful but do not dominate required CI time;
- developers have fast, medium, and release-grade local commands;
- benchmark data guides future tooling changes.
