# minify-html Adoption Plan

## Objective

Add the strongest safe production minification pipeline for the generated
static site. The final build should be optimized for gzip/Brotli-capable static
hosting while preserving valid HTML, Lighthouse-sensitive behavior, search,
SEO, article text, accessibility, and responsive layout.

This plan is intentionally experiment-driven. We will not reject aggressive
options out of fear, but we will reject any option that objectively violates
repo requirements.

## Phase 1: Research

- Document the option surface, one-pass tradeoffs, package/runtime constraints,
  hard blockers, and initial candidate configuration.
- Decide whether one-pass is a default candidate or an experiment-only path.
- Update `CHECKLIST.md` when the research is verified.

Phase 1 is complete when `docs/performance/minify-html-research.md` explains
every option and identifies hard blockers.

## Phase 2: Measurement Harness

- Add a payload reporting script that measures raw, gzip, and Brotli sizes for
  final `dist` assets by extension and for `dist/**/*.html` specifically.
- Report top HTML files by raw bytes and gzip bytes so experiments show where
  savings come from.
- Keep the report read-only and quiet enough for CI/review use.
- Add tests for the payload reporter using temporary fixture files.
- Document the `just` command in `COMMANDS.md`.

Phase 2 is complete when we can run a build, collect baseline payload numbers,
and compare later experiments against the same raw/gzip/Brotli metrics.

## Phase 3: Standard minify-html Experiment

- Add `@minify-html/node` as a dev dependency.
- Add a post-build experiment script that can minify a copy of `dist/**/*.html`
  with an explicit named configuration.
- Add a reproducible scenario suite that runs every named configuration against
  the same source build, validates each copied output, measures raw/gzip/Brotli
  deltas, and writes a Markdown report.
- Test at least these configurations:
  - `conservative`: closing tags kept, `<html>/<head>` kept, CSS minified,
    JavaScript not minified.
  - `inline-js`: same as conservative, but with `minify_js: true`.
  - `optional-tags`: conservative, but allowing optional closing/opening tag
    omission where the library normally would.
  - `noncompliant-measurement`: enables noncompliant options only to measure
    theoretical savings, never as a default production candidate.
- For each configuration, record raw, gzip, and Brotli deltas, build-time
  overhead, and every failed or passed gate.
- Preserve the pre-minified baseline until the experiment result has been
  measured; do not rely on impressions.

Phase 3 is complete when `docs/performance/minify-html-experiments.md` is
generated from the suite and records the measured output and the recommended
production configuration or rejection.

## Phase 4: One-Pass Feasibility Check

- Check whether one-pass has a maintained, cross-platform, Bun-friendly package
  or CLI path suitable for this repo.
- If it does, run it against the same copied build output and compare size,
  build time, errors, and validation gates.
- If it does not, record that as the reason it is not production-eligible.

One-pass can be adopted only if it is cross-platform, scriptable through Bun,
passes every gate, and provides an objective advantage over the standard
library. Speed alone is not enough.

## Phase 5: Production Integration

Current status: deferred. The first reproducible suite run found no
production-eligible `minify-html` configuration because every tested scenario
failed strict HTML validation.

- Add the production minification script with the winning explicit
  configuration.
- Run the script after Astro build and Pagefind indexing so it optimizes the
  final generated HTML.
- Keep production output plain HTML files; do not generate `.gz` or `.br`
  sidecars for Cloudflare Workers Static Assets.
- Make the build fail if the minifier fails, skips an HTML file unexpectedly,
  or produces invalid output.
- Update `just build`, `just verify`, relevant command docs, and tests.
- Keep minification deterministic and quiet unless it reports a failure or an
  explicit payload report is requested.

Phase 5 is complete when normal `just build` emits minified production HTML
and the full release gate passes.

## Required Gates

Every production candidate must pass:

- `just build`
- `just verify`
- `just validate-html`
- `just test-e2e`
- `just test-a11y`
- `just check`
- `just coverage`
- JSON-LD parse checks for representative article and author pages
- Search result rendering checks, including `<mark>` highlights
- Article anchor and TOC interaction checks

If a candidate fails one of these gates, either fix the underlying issue or
remove the candidate option from the production configuration.

## Production Bias

Prefer the smallest fully valid output over the smallest browser-tolerated
output. Lighthouse, SEO, accessibility, search, and reader trust are part of
performance. Noncompliant output is only acceptable if the user explicitly
approves a standards tradeoff after seeing measured savings and risks.
