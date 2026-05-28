# Repository Commands

Use `just --list` as the canonical command index.

Package scripts are intentionally retired. `package.json` remains the package
manifest, dependency manifest, Bun lockfile anchor, and Astro ecosystem package
metadata, but it is no longer the human-facing workflow surface.

The command router follows these rules:

- use `just <recipe>` for repository workflows;
- keep `justfile` recipes as orchestration only;
- keep public platform operations behind `just cli ...`, and keep internal
  repository automation behind focused recipes that call the private
  `just _xtask ...` adapter;
- call Astro, Playwright, Vitest, Prettier, ESLint, Markdownlint, Lighthouse
  CI, Wrangler, Gitleaks, and Bun directly from `just` when those ecosystem
  tools are still the correct boundary;
- keep `scripts/build/generate-article-pdfs.ts` as the only retained
  TypeScript automation exception, behind `just build-pdf`.

Internal Rust task adapters in
[`crates/tpm-xtask/`](crates/tpm-xtask/) own migrated repository maintenance
behavior. They are intentionally separate from the user-facing `tpm` product
CLI. `just test-config` keeps the command surface guarded against
package-script regressions and documented command drift.

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
| `just release-check` | Run the full release gate used before handoff, including Markdown review.  |
| `just fix`           | Run automatic JS/TS/Astro/Tailwind, Markdown/MDX, package, and Rust fixes. |

## Studio Shell

| Command                     | Purpose                                                       |
| --------------------------- | ------------------------------------------------------------- |
| `just studio-dev`           | Start the static Studio frontend shell in Astro dev mode.     |
| `just studio-build`         | Build the static Studio frontend shell into `dist/studio`.    |
| `just studio-check`         | Type-check the Studio frontend shell with warnings as errors. |
| `just studio-preview`       | Preview an existing built Studio frontend shell.              |
| `just studio-preview-fresh` | Build, then preview the static Studio frontend shell.         |
| `just studio-tauri-dev`     | Start the desktop Studio shell in Tauri dev mode.             |
| `just studio-tauri-build`   | Build the desktop Studio shell with the static Astro shell.   |

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
| `just test-unit`       | Run Bun unit/component/page tests plus retained PDF tests.          |
| `just test-astro`      | Run Astro container/component tests.                                |
| `just test-config`     | Run command-surface and repository configuration tests.             |
| `just test-e2e`        | Build, then run Playwright browser tests.                           |
| `just test-e2e-built`  | Run Playwright browser tests against existing built output.         |
| `just test-a11y`       | Build, then run axe accessibility review tests.                     |
| `just test-a11y-built` | Run axe tests against existing built output.                        |
| `just test-perf`       | Build, then run Lighthouse CI review.                               |
| `just test-perf-built` | Run Lighthouse CI against existing built output.                    |
| `just coverage`        | Run all coverage review signals.                                    |
| `just coverage-ts`     | Run TypeScript/Astro coverage plus broad coverage accountability.   |
| `just coverage-rust`   | Run Rust coverage with missing-line output when installed.          |
| `just review-assets`   | Run duplicate and unused image review checks.                       |
| `just review-markdown` | Run focused Markdown/MDX style review.                              |

## Rust And CLI

| Command                   | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| `just rust-check`         | Run all blocking Rust gates.                             |
| `just rust-check-fast`    | Run the fastest Rust type-check gate.                    |
| `just rust-fix`           | Run Rust formatting and Clippy machine-applicable fixes. |
| `just rust-nextest`       | Run review-only `cargo-nextest` when installed.          |
| `just cli --help`         | Run the additive Rust CLI shell.                         |
| `just migration-baseline` | Show migration classifications and command debt.         |
| `just qa-registry`        | Run the Rust QA registry report.                         |

## Performance

| Command               | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `just payload-check`  | Run release payload checks from Rust.                |
| `just payload-report` | Report generated-output payload size data from Rust. |

Retired payload experiment commands are intentionally absent from
`just --list`; historical reports remain in `docs/performance/`, but reusing
those workflows requires restoring them explicitly instead of relying on a
successful no-op.

## Remaining TypeScript Exception

`just build-pdf` is the only recipe that calls a repository-owned TypeScript
automation file: `scripts/build/generate-article-pdfs.ts`. It remains because
PDF generation is browser/JS-adjacent legacy behavior and has a retained unit
test in `tests/build/generate-article-pdfs.test.ts`. All other migrated
repository automation is Rust-owned or removed from the active command
surface.
