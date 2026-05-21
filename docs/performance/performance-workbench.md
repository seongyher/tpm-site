# Performance Workbench

This document defines the shared workflow for payload, cache, critical CSS,
preload/fetch-priority, Vite, and post-build optimization work. The goal is to
make performance changes evidence-based without turning noisy measurements into
fake precision.

The workbench treats performance work as a static publishing compiler concern:
source content and configuration are rendered into generated artifacts, then
the generated artifacts are measured, validated, and promoted only when they
preserve author intent, accessibility, semantic output, cacheability, and user
experience.

## Workflow

1. Start with a clean baseline.
   Build the site with the command that matches the question. Use
   `bun --silent run build:raw` when comparing optimizer candidates against
   unoptimized Astro/Pagefind output. Use `bun --silent run build` when the
   question is about production output.
2. Run the smallest reproducible experiment.
   Use the named `payload:*` script for the workbench track. Experiments must
   write to `tmp/` or a copied output directory and must not mutate `dist/`
   unless they are already part of the production build.
3. Measure comparable artifacts.
   Compare raw, gzip, and Brotli bytes for the same route classes and asset
   roles. Browser-only metrics such as LCP and CLS should be recorded as
   route-class evidence, not used as deterministic build facts unless the
   signal is stable.
4. Validate generated output.
   A candidate that changes emitted HTML, CSS, JavaScript, SVG, images, PDFs,
   feeds, redirects, metadata, or cache headers must pass the relevant focused
   generated-output checks before promotion.
5. Promote through contracts, not memory.
   Accepted behavior belongs in typed policies such as
   `src/lib/performance-budgets.ts`, the package-script registry, release
   checks, and docs. A report alone is not a production contract.
6. Keep rollback clear.
   Every adopted optimization must have an obvious rollback path that disables
   only the failing transform or budget without disrupting unrelated output.

## Tracks

| Track                       | Current state      | Evidence command                                                                   | Promotion rule                                                                                          |
| --------------------------- | ------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Route-class payload budgets | Release-gated      | `bun --silent run payload:check` and `bun --silent run payload:report -- --top 12` | Deterministic route/PDF/cache failures can block release; noisy Lighthouse timings stay warning-only.   |
| Cache policy                | Release-gated      | `bun --silent run payload:check` and `bun --silent run payload:report -- --top 12` | Header patterns may be broadened only when all matched files are fingerprinted or intentionally stable. |
| Post-build optimization     | Production-adopted | `bun --silent run payload:postbuild:experiments`                                   | New transforms need copied-output validation, browser checks, accessibility checks, and release checks. |
| Critical CSS extraction     | Experiment-only    | `bun --silent run payload:critical-css:experiment`                                 | Adopt only if route-class wins outweigh duplicated CSS and lost shared-cache benefits.                  |
| Preload/fetch priority      | Experiment-only    | Route-class Lighthouse or browser profile plus `payload:report`                    | Adopt only for stable first-viewport LCP resources with no competing-priority regression.               |
| Vite build options          | Experiment-only    | `bun --silent run payload:vite:experiments`                                        | Adopt only when a temporary Astro/Vite config passes all gates and reduces compressed output.           |
| HTML minification           | Experiment-only    | `bun --silent run payload:minify-html:experiments`                                 | Adopt only when strict HTML validation and machine-readable output stay correct.                        |

## Promotion Checklist

A performance optimization can move from experiment to production only when all
of these are true:

- The experiment is reproducible from a package script or documented browser
  profile.
- The baseline and candidate use the same content, route classes, and output
  mode.
- The candidate reports raw, gzip, and Brotli deltas where byte size is part of
  the claim.
- Generated-output verification and HTML validation pass when the candidate
  changes emitted files.
- Browser behavior tests cover any affected interaction scripts.
- Accessibility tests cover any affected rendered page classes.
- The promotion updates the relevant typed policy, package-script docs, and QA
  registry.
- The rollback path is limited to the candidate optimization or budget.

## Budget Policy

`payload:report` owns deterministic review evidence, and `payload:check`
promotes the release-blocking subset:

- route-class HTML Brotli budgets;
- generated PDF raw-byte warnings and failures;
- immutable cache-header evidence for fingerprinted Astro assets;
- asset-role totals for review.

Browser measurements remain useful but less deterministic. Lighthouse
performance scores, LCP, Speed Index, and critical request chains should guide
investigations and route-class sampling. They should not become hard release
failures until we have stable evidence across multiple clean baselines.

## Resource Priority

Preload and `fetchpriority` hints are powerful because they compete for the
first network slots. Add them only when a route-class profile identifies a
stable resource that is both first-viewport critical and likely to be late
without a hint.

Use this order:

1. Identify the LCP or critical resource from a built-output browser profile.
2. Confirm the resource is stable for the route class, not just one article.
3. Add the narrowest possible hint through the owning component or route
   helper.
4. Verify the profile improves without increasing unused bytes or delaying a
   more important resource.
5. Add a regression test or budget note that names the route class and reason.

Do not add global preconnects or preloads when Lighthouse cannot identify a
high-value origin or resource. First-party hashed assets are already same-origin
and cacheable.

## Cache Policy

Long-term immutable caching is appropriate for fingerprinted generated assets
such as `/_astro/*`. It is not automatically appropriate for mutable author
files, stable URLs, feeds, HTML routes, redirects, or generated PDFs.

When adding cache rules:

- prefer narrow path patterns;
- prove the files are fingerprinted or intentionally stable;
- keep the rule in `site/public/_headers` or the owning generated-output
  adapter;
- keep `payload:report` cache-header evidence passing.

## Rollback Policy

When an optimization regresses output, prefer disabling the smallest transform
or budget that caused the regression. Do not unwind unrelated performance
contracts. If a budget was too broad, replace it with a more precise route-class
or artifact-class budget instead of deleting performance accountability.
