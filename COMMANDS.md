# Repository Commands

Use `just --list` as the canonical command index.

Package scripts are intentionally retired. `package.json` remains the package
manifest, dependency manifest, Bun lockfile anchor, and Astro ecosystem package
metadata, but it is no longer the human-facing workflow surface.

The command router follows these rules:

- use `just <recipe>` for repository workflows;
- keep `justfile` recipes as orchestration only;
- keep Rust domain operations behind `just cli ...` or focused recipes;
- call Astro, Playwright, Vitest, Prettier, ESLint, Markdownlint, Lighthouse
  CI, Wrangler, Gitleaks, and Bun directly from `just` when those ecosystem
  tools are still the correct boundary;
- keep remaining repository TypeScript scripts as explicit migration
  fallbacks until Rust parity work safely replaces them.

The command registry in
[`scripts/quality/qa-command-registry.ts`](scripts/quality/qa-command-registry.ts)
classifies every `just` recipe, records CI parity expectations, and maps
command domains to focused/release/CI evidence or a documented exception.
`just test-config` fails when the registry drifts from `justfile`, CI
workflows, or domain-coverage accountability.

Dependency audit, secret scan, lockfile, third-party script, and generated
secret-output expectations are documented in
[`docs/SUPPLY_CHAIN_AND_SECRET_POLICY.md`](docs/SUPPLY_CHAIN_AND_SECRET_POLICY.md).

## First Commands

```sh
just --list
just setup
just dev
just check-fast
just check
just release-check
just fix
```

`just setup` installs JavaScript dependencies and Rust components needed by the
normal local toolchain. `just setup-browser` installs the Playwright browser
used by browser-backed tests.

## Daily Development

| Command              | Purpose                                                                    |
| -------------------- | -------------------------------------------------------------------------- |
| `just dev`           | Start the current site in Astro dev mode.                                  |
| `just build`         | Build the active static site, generate PDFs, and optimize output.          |
| `just preview`       | Serve an existing built `dist/` output through Astro preview.              |
| `just preview-fresh` | Build, then preview the current site.                                      |
| `just check-fast`    | Run cheap high-signal source/config/registry checks.                       |
| `just check`         | Run normal PR-quality validation plus fast Rust type checking.             |
| `just release-check` | Run the full release gate used before handoff.                             |
| `just fix`           | Run automatic JS/TS/Astro/Tailwind, Markdown/MDX, package, and Rust fixes. |

## Author And Site Checks

| Command                  | Purpose                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| `just author-check`      | Run content, tag, asset, site, and schema checks for authors.         |
| `just author-fix`        | Apply safe author-facing source repairs, currently tag normalization. |
| `just content-check`     | Verify source content invariants.                                     |
| `just tags-check`        | Dry-run safe tag normalization.                                       |
| `just tags-normalize`    | Write safe tag normalization.                                         |
| `just site-doctor`       | Run the Rust site-doctor report.                                      |
| `just site-schema-check` | Check whether `site/config/site.schema.json` is current.              |
| `just site-schema`       | Regenerate `site/config/site.schema.json`.                            |
| `just starters-check`    | Verify maintained starter templates.                                  |

## Build, Output, And Deploy

| Command                         | Purpose                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| `just build-raw`                | Run the raw Astro/Pagefind build.                                  |
| `just build-pdf`                | Generate same-directory static article PDFs.                       |
| `just build-optimize`           | Optimize generated build output.                                   |
| `just build-cloudflare`         | Generate Cloudflare Workers Static Assets redirect files.          |
| `just build-release`            | Build and add deploy-target files.                                 |
| `just verify`                   | Verify generated output pages, links, metadata, PDFs, and scripts. |
| `just validate-html`            | Validate representative built HTML output.                         |
| `just output-verify`            | Run the Rust generated-output report bridge.                       |
| `just preview-cloudflare`       | Start Wrangler against the Cloudflare config.                      |
| `just preview-cloudflare-fresh` | Build release output, then start Wrangler.                         |
| `just deploy-cloudflare`        | Deploy current verified output through Wrangler.                   |

## Tests And Review Signals

| Command                | Purpose                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `just test`            | Run test accountability, Bun unit tests, and Astro component tests. |
| `just test-unit`       | Run Bun unit/script/component/page tests.                           |
| `just test-astro`      | Run Astro container/component tests.                                |
| `just test-config`     | Run config, command-registry, and QA metadata tests.                |
| `just test-e2e`        | Build, then run Playwright browser tests.                           |
| `just test-e2e-built`  | Run Playwright browser tests against existing built output.         |
| `just test-a11y`       | Build, then run axe accessibility review tests.                     |
| `just test-a11y-built` | Run axe tests against existing built output.                        |
| `just test-perf`       | Build, then run Lighthouse CI review.                               |
| `just test-perf-built` | Run Lighthouse CI against existing built output.                    |
| `just coverage`        | Generate LCOV coverage and verify broad coverage accountability.    |
| `just review-assets`   | Run duplicate and unused image review checks.                       |
| `just review-markdown` | Run Markdown/MDX style review.                                      |

## Rust And CLI

| Command                   | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| `just rust-check`         | Run all blocking Rust gates.                             |
| `just rust-check-fast`    | Run the fastest Rust type-check gate.                    |
| `just rust-fix`           | Run Rust formatting and Clippy machine-applicable fixes. |
| `just rust-coverage`      | Run review-only Rust coverage when installed.            |
| `just rust-nextest`       | Run review-only `cargo-nextest` when installed.          |
| `just cli --help`         | Run the additive Rust CLI shell.                         |
| `just migration-baseline` | Show migration classifications and command debt.         |
| `just qa-registry`        | Run the Rust QA registry report.                         |

## Performance And Experiments

| Command                                | Purpose                                    |
| -------------------------------------- | ------------------------------------------ |
| `just payload-check`                   | Run deterministic release payload budgets. |
| `just payload-report`                  | Report raw, gzip, and Brotli sizes.        |
| `just payload-critical-css-experiment` | Run the bounded critical-CSS experiment.   |
| `just payload-minify-html-experiment`  | Run one minify-html experiment.            |
| `just payload-minify-html-experiments` | Run the minify-html experiment suite.      |
| `just payload-postbuild-experiments`   | Run post-build optimization experiments.   |
| `just payload-vite-experiments`        | Run Vite build option experiments.         |

## Remaining TypeScript Fallbacks

Some commands still call repository-owned TypeScript files with `bun
scripts/...`. These are migration fallbacks, not package-script architecture.
They remain while Rust parity work proceeds for:

- deep generated-output verification;
- PDF generation and browser-rendered artifacts;
- build-output optimization;
- site config schema generation;
- starter-template verification;
- generated platform references;
- content/reference/citation audits;
- coverage and test-accountability reporting;
- payload experiment runners.

The target state is Rust-owned deterministic platform operations with `just`
as the developer command router and Astro/Bun ecosystem tools hidden behind
focused recipes where appropriate.
