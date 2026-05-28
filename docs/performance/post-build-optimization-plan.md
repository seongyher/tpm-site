# Standalone Post-Build Optimization Plan

## Objective

Evaluate optimizers that can operate on generated `dist/` output even when
Astro or Vite do not expose them as first-class config options. This is separate
from Vite build-option experiments: a standalone pass can still be valid if it
is deterministic, cross-platform, measurable, and passes the same release gates
as normal output.

## Candidate Tool Classes

- HTML: `minify-html` can post-process generated HTML, but the current
  reproducible suite found no production-safe configuration because strict HTML
  validation failed.
- JavaScript: `oxc-minify` can post-process generated `_astro/*.js` files
  through its Node API. Oxc documents JS minification as high performance, but
  its standalone minifier is still an alpha-risk tool and must be proven through
  browser behavior tests before production adoption.
- CSS: `lightningcss` can post-process generated CSS through its standalone
  Node API. This is likely lower risk because Vite/Astro already use Lightning
  CSS in modern build paths, but the actual generated output still decides.
- SVG: `svgo` can post-process generated SVG assets. It should preserve
  `viewBox` unless a component-specific visual review explicitly approves
  removal.
- Raster images: Astro's asset pipeline already optimizes generated article
  images. Standalone raster recompression should be treated as a separate image
  quality experiment, not mixed into JS/CSS/SVG minification.
- Unreferenced generated raster assets: a deterministic post-build reference
  scan can remove orphaned raster files under `_astro/` after Astro has emitted
  the asset graph. This is not image recompression; referenced article images,
  social previews, inspector images, and PDF-linked assets stay intact.

## Experiment Harness

Historical note: the old `just payload-postbuild-experiments` rerun command was
retired from the active command surface during the Rust/`just` migration. The
active production path is `just build-optimize`; if this experiment harness is
reactivated, it should copy `dist/` into temporary scenario directories and
apply standalone transforms to those copies only. Each scenario should then
run:

- strict HTML validation;
- build-output verification;
- raw/gzip/Brotli payload measurement for all compressible files;
- focused CSS, JS, SVG, and HTML totals in the generated report.

The harness does not mutate the real `dist/` directory and should not be wired
into production builds until a scenario passes the full release gate.

The reproducible runs show that standalone optimizers are viable as a workflow.
Lightning CSS and SVGO both pass the generated-output gates on copied output,
with Lightning CSS producing the meaningful CSS compressed-size reduction. The
Oxc follow-up found that its initial verification failure was syntactic: Oxc
rewrote the Astro prefetch runtime's `"prefetch"` string to a template literal,
while preserving the runtime behaviors we care about. Build verification now
recognizes the prefetch runtime through behavior tokens rather than exact
generated-code quote style.

The selected production stack is the `safe-stack` scenario: Lightning CSS,
SVGO, conservative Oxc JS whitespace optimization, and unreferenced generated
Astro raster asset cleanup. `just build` now runs the raw Astro/Pagefind
build and then applies that stack to `dist/` through `just build-optimize`.
The raw build remains available as `just build-raw` so payload experiments
can keep comparing optimizer candidates against an unoptimized baseline.

`just preview-release-fresh` builds optimized output, verifies generated
pages/links/scripts, validates representative HTML, and then starts Astro
preview for release-like local inspection.

## Adoption Rule

A standalone optimizer is production-eligible only after:

- the reproducible suite shows meaningful Brotli/gzip savings;
- generated output verification and HTML validation pass;
- browser/e2e tests pass against the optimized output;
- accessibility checks pass against the optimized output;
- the full release gate passes;
- the chosen transform options are explicit and tested.

For JavaScript optimizers, passing static validation is not enough. Runtime
behavior, disclosure controls, search, theme toggling, prefetch, hover images,
and table-of-contents behavior must be tested in a browser against optimized
output.

The production build uses only conservative Oxc whitespace optimization.
Aggressive Oxc compression and mangling remain experiment-only until they pass
the same browser and release gates with a separate adoption decision.
