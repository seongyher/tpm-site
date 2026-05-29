# QA Preflight

This document is the working design and audit artifact for the roadmap
preflight milestone:

- Linear parent: `IRK-8`
- Canonical child sequence: `IRK-36`, `IRK-37`, `IRK-38`, `IRK-39`, `IRK-40`
- Superseded issue: `IRK-35`

The goal is to make the QA foundation fast, scoped, reproducible, and
trustworthy before large platform refactors begin.

## Operating Rules

The preflight sequence deliberately separates discovery from behavior changes.

1. Inventory first.
2. Define the registry and parity contract second.
3. Add failure probes before narrowing scope.
4. Add diagnostic diffing before risky replacements.
5. Tighten tool scopes only after coverage can be proved.

`IRK-36` must not change QA behavior. It records the current state and identifies
risks. Behavior changes belong to `IRK-40` after the registry, probes, and
diagnostic diff harness exist.

## Work Sequence

### 1. QA Inventory (`IRK-36`)

Inventory the current repo QA surface.

Required coverage:

- `package.json` scripts.
- GitHub Actions workflows.
- Lint, format, TypeScript, Astro, Vitest, Playwright, markdown, HTML,
  security, performance, content, asset, generated-output, coverage, and
  boundary-check tooling.
- Git and tool ignore files.
- Script docs and command references.

Inventory record fields:

- command or config path;
- owner domain;
- command class;
- local command;
- CI usage;
- mutation behavior;
- inputs;
- outputs or artifacts;
- runtime expectation;
- include/exclude scope;
- known overlap;
- current risk;
- later milestone that should address the risk.

Command classes:

- `fast-local`: intended for frequent local use while editing.
- `focused`: validates one domain or one class of behavior.
- `release`: broad local release gate.
- `ci`: CI-only or CI-specific orchestration.
- `mutation`: changes source, generated fixtures, lockfiles, or formatting.
- `investigation`: optional audit, experiment, report, or maintenance command.

### 2. Script Registry And CI Parity (`IRK-37`)

Turn the inventory into a durable command contract.

Expected outputs:

- machine-readable script registry;
- human-readable command map;
- CI-to-local reproduction map;
- drift check where practical.

Every CI gate should map to one local command or a documented CI-only reason.

Implemented outputs:

- `justfile` is the canonical command router and local reproduction surface.
- `COMMANDS.md` is the human command map.
- Rust QA operations and task adapters provide machine-readable command and
  migration reports where a typed operation is useful.
- `tests/config` verifies `just` recipe coverage, command docs, package-script
  retirement, CI snippets, local command references, and complete CI job
  coverage.
- `just test-config` keeps `check-fast` catching command and CI parity drift
  before full lint/test stages.

### 3. Failure-Probe Fixtures (`IRK-38`)

Add isolated bad fixtures that prove QA layers still catch representative
failures before scope changes land.

Probe candidates:

- invalid frontmatter;
- broken internal link;
- missing image alt text;
- invalid metadata;
- malformed redirect;
- unsafe embed;
- malformed citation;
- oversized or misplaced asset;
- layout overflow fixture;
- invalid generated artifact.

Probe fixtures must not leak into normal site content, production generated
output, or release artifacts.

Implemented outputs:

- Failure-probe coverage is represented by focused `tests/config`,
  `tests/src`, `tests/lib`, browser, and generated-output fixtures rather than
  a retained TypeScript probe registry.
- `just test-config` and release checks keep bad-input fixtures outside
  production content/output roots while preserving CI/local parity checks.
- The current fixture matrix covers content, article image, asset, redirect,
  generated-output, metadata, HTML, citation, site-config, and responsive
  layout failure classes.

### 4. Diagnostic Diff Harness (`IRK-39`)

Add a comparison path for risky QA refactors.

Diagnostic records should capture:

- tool name;
- command;
- diagnostic code;
- severity;
- file or route;
- message;
- count;
- raw output location when useful.

The harness should compare diagnostics, not only exit codes.

Implemented outputs:

- `just diagnostics-diff` exposes the Rust diagnostic-diff operation for
  normalized diagnostic snapshot comparisons.
- The Rust operation compares expected and actual diagnostic snapshots by tool,
  code, severity, file, route, message, and count.
- Rust tests cover operation behavior; `just rust-check` keeps the comparison
  tool available for future QA refactors.
- Risky QA refactors should characterize baseline and candidate diagnostics
  before any high-risk scope replacement is accepted.

### 5. Scope Cleanup And Final Command Map (`IRK-40`)

Only after the previous milestones exist:

- tighten overbroad scopes;
- split fast local and release commands where useful;
- update `COMMANDS.md` and related docs;
- record before/after runtime and diagnostic differences;
- verify coverage with probes and release checks.

Implemented outputs:

- Safe scope cleanup was limited to generated-output ignores that already match
  repository intent: `dist-catalog/` is now ignored by Prettier, markdownlint,
  Knip, test accountability, and coverage inventory.
- Config and verifier tests now protect those generated-output ignores.
- No high-risk replacement of `eslint .`, broad Prettier globs, Knip roots, or
  Markdown review scope was accepted in this preflight. Those changes require a
  baseline/candidate diagnostic snapshot through `just diagnostics-diff`.
- `COMMANDS.md` is the human command map, backed by `justfile` and Rust QA
  operations. `just test-config` now runs command-surface, CI, and config
  contract tests as part of `just check-fast`.
- Runtime observation for the expanded `just test-config` gate: 44 tests in roughly
  2.2 seconds locally. No diagnostic-count comparison was needed for the
  generated-output ignore additions because they only exclude ignored generated
  directories from tools that should never inspect generated artifacts.

## Inventory Notes

The current-state inventory belongs below this section. It should stay factual:
what exists, what each command/config currently appears to own, and what risks
or overlaps need follow-up.

### Current Command Surface

`justfile` currently exposes the repository command surface. `COMMANDS.md` is the
human-readable per-script purpose reference and is broadly up to date. The
inventory below classifies the current commands by domain and risk so the next
milestones can turn the classification into an enforceable registry.

| Domain                     | Commands                                                                                                                                                                                                | Current class                                          | Mutation                                | CI usage                                                                                        | Notes                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Asset inventory            | `just assets-locations`, `just assets-shared`                                                                                                                                                           | `focused`                                              | no                                      | `just check-fast`                                                                               | Blocking source asset organization checks.                                                                    |
| Asset review               | `just assets-duplicates`, `just assets-unused`, `just review-assets`                                                                                                                                    | `investigation`                                        | no                                      | review-only CI                                                                                  | Review signal.                                                                                                |
| Author workflow            | `just author-check`                                                                                                                                                                                     | `focused`                                              | no                                      | no                                                                                              | Convenience wrapper around author-facing content/site checks.                                                 |
| Author workflow            | `just author-fix`                                                                                                                                                                                       | `mutation`                                             | yes                                     | no                                                                                              | Currently tag normalization only.                                                                             |
| Build                      | `just build-raw`, `just build-pdf`, `just build-optimize`, `just build`, `just build-release`, `just build-cloudflare`                                                                                  | `release`                                              | generated output                        | blocking CI                                                                                     | Builds active site output and deploy metadata. CI builds once, uploads `dist`, then downstream jobs reuse it. |
| Catalog                    | `just catalog-*`, `just test-catalog`, `just test-catalog-site-instance`, `just catalog-check`                                                                                                          | `focused`                                              | generated output                        | blocking CI for catalog tests; `just check-fast` for catalog accountability                     | Uses isolated `dist-catalog` or fixture output paths.                                                         |
| Check orchestration        | `just check-fast`, `just check`, `just release-check`, `just quality`, `just quality-release`                                                                                                           | `fast-local` or `release`                              | no, except called builds                | `just check` blocks CI; release wrapper is local                                                | `release-check` includes Markdown review; `quality-*` adds quieter output and review-only trailing checks.    |
| Coverage                   | `just coverage`, `just coverage-ts`, `just coverage-rust`; private `coverage-verify` adapter                                                                                                            | `investigation`                                        | coverage output                         | review-only CI                                                                                  | Coverage is review/accountability, not the normal blocking `check`.                                           |
| Deploy and preview         | `just deploy-cloudflare`, `just preview-*`, `just dev`, `just docs-site-*`, `just catalog-dev`                                                                                                          | `investigation` or deploy                              | external deploy or local server/output  | deploy uses Wrangler action on `main`                                                           | CI deploy uses `cloudflare/wrangler-action`, not the `just` recipe directly.                                  |
| Formatting                 | `just format-*`, `just fix`, `just markdown-fix`                                                                                                                                                        | `fast-local` or `mutation`                             | write variants mutate                   | `just check` via `just format`; `just release-check` via `just review-markdown`                 | Code formatting is blocking in normal checks; Markdown formatting is blocking in release checks.              |
| Lint and dead code         | `just lint`, `just lint-fix`, `just lint-mdx`, `just lint-markdown`, `just package-check`, `just deadcode`                                                                                              | `fast-local` or `focused`                              | fix variant mutates                     | `just check`; `just release-check` via `just review-markdown`; markdown-review CI               | ESLint ignores generated dirs and Markdown/MDX in the main run; MDX has a focused lint command.               |
| Payload                    | `just payload-check`, `just payload-report`                                                                                                                                                             | `release` or `investigation`                           | no                                      | `just payload-check` in release gate                                                            | Old experiment commands are removed from `just --list`; active payload report/check is Rust-owned.            |
| Platform and site config   | `just platform-check`, `just site-doctor`, `just site-schema`, `just site-schema-check`                                                                                                                 | `focused`                                              | schema recipe can mutate                | `just check-fast`                                                                               | Supports platform/site split and future GUI/editor validation.                                                |
| References                 | none active                                                                                                                                                                                             | historical                                             | no                                      | no                                                                                              | Manual citation/reference commands are removed from `just --list` unless the workflow is reactivated.         |
| Security                   | `just audit`, `just audit-all`, `just secrets`                                                                                                                                                          | `release` or `investigation`                           | no                                      | `just audit` blocking CI; `just audit-all` review-only CI; Gitleaks action in security workflow | Dependency Review is CI-only on PRs.                                                                          |
| Tags and content           | `just content-check`, `just tags-check`, `just tags-normalize`                                                                                                                                          | `focused` or `mutation`                                | normalize mutates                       | `just check-fast`                                                                               | Content invariants and safe tag normalization.                                                                |
| Tests                      | `just test`, `just test-unit`, `just test-astro`, `just test-config`, `just test-e2e-*`, `just test-a11y-*`, `just test-perf-*`, `just test-flake`, `just test-docs-site`, `just test-accountability-*` | `fast-local`, `focused`, `release`, or `investigation` | generated output for build-backed tests | blocking and review CI depending on suite                                                       | Built-output variants intentionally avoid rebuilding when CI downloads the verified artifact.                 |
| Type and output validation | `just typecheck-*`, `just typecheck`, `just verify`, `just validate-html`                                                                                                                               | `fast-local` or `release`                              | no                                      | blocking CI                                                                                     | Release output verification is split from build generation.                                                   |

### CI Workflow Inventory

`.github/workflows/ci.yml` has one blocking quality/build/browser/catalog/audit
spine and several review-only jobs.

| CI job              | Blocking                         | Local reproduction                                                                                      | Notes                                                                      |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `quality`           | yes                              | `just check`                                                                                            | Main PR gate after install.                                                |
| `markdown-review`   | no                               | `just review-markdown`; also included in `just release-check` locally                                   | Focused style signal for Markdown/MDX; blocking in the local release gate. |
| `asset-review`      | no                               | `just review-assets`                                                                                    | Review-only duplicate/unused image signal.                                 |
| `build`             | yes                              | `just build`, `just build-cloudflare`, `just verify`, `just validate-html`                              | Uploads `verified-dist` for downstream checks.                             |
| `browser`           | yes                              | `just test-e2e-built` after a verified build                                                            | Downloads `verified-dist`; does not rebuild.                               |
| `catalog`           | yes                              | `just test-catalog` and `just test-catalog-site-instance`                                               | Exercises platform component catalog and fixture site catalog.             |
| `accessibility`     | no                               | `just test-a11y-built` after a verified build                                                           | Review-only axe scan against `verified-dist`.                              |
| `lighthouse`        | no                               | `just test-perf-built` after a verified build                                                           | Review-only Lighthouse CI output to `.lighthouseci/`.                      |
| `audit`             | yes                              | `just audit`                                                                                            | High-severity dependency audit.                                            |
| `audit-review`      | no                               | `just audit-all`                                                                                        | All-severity maintenance signal.                                           |
| `coverage-review`   | no                               | `just coverage`                                                                                         | Review-only TypeScript/Astro LCOV, Rust coverage, and coverage inventory.  |
| `deploy-cloudflare` | yes on `main` after dependencies | `just deploy-cloudflare` is closest, but CI uses `cloudflare/wrangler-action@v3` with `command: deploy` | Deploys the verified artifact, not a rebuilt output.                       |

`.github/workflows/security.yml` adds:

- `dependency-review`: PR-only GitHub Dependency Review action; CI-only because
  it depends on GitHub pull request metadata.
- `secrets`: Gitleaks action against git history. Local approximation is
  `just secrets`, scoped to the current branch history, while the CI action
  owns SARIF/security-event integration.

### Config And Scope Inventory

| Config or policy                                   | Scope owner                       | Include scope                                                                             | Exclude scope                                                                                                                     | Current tests                                                                   |
| -------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `eslint.config.ts`                                 | lint/type/style contracts         | Flat config for JS, TS, Astro, MDX, React, Tailwind, tests, data, component boundaries    | `.astro/`, `.lighthouseci/`, `coverage/`, `dist/`, `dist-catalog/`, `node_modules/`, Playwright artifacts, `tmp/`, lockfile noise | `tests/config/eslint.config.test.ts`                                            |
| `prettier.config.mjs` and `.prettierignore`        | code/config formatting            | Code/config globs in `just` recipes; Markdown through separate scripts                    | Generated output, local skills, coverage, Lighthouse, Playwright artifacts, `tmp/`, `unused-assets/`                              | `tests/config/prettier.config.test.ts`                                          |
| `.markdownlint-cli2.jsonc`                         | Markdown style review             | `**/*.md`                                                                                 | Generated output, local skills, coverage, Lighthouse, Playwright artifacts, `unused-assets/**`                                    | `tests/config/markdownlint.config.test.ts`                                      |
| `.htmlvalidate.json` and `just validate-html`      | generated HTML validity           | Representative built HTML chosen by Rust task adapter                                     | Not a full-site HTML crawl                                                                                                        | HTML validation is part of release check                                        |
| `tsconfig.json`                                    | app/static site TypeScript        | Astro config, `site/content`, `src`                                                       | `dist`, `node_modules`                                                                                                            | `tests/config/tsconfig.test.ts`                                                 |
| `tsconfig.tools.json` plus local tooling tsconfigs | tooling TypeScript                | Astro config, ESLint config, Knip, Playwright, scripts, tests, types, Vitest              | `dist`, `node_modules`                                                                                                            | `tests/config/tsconfig.tools.test.ts`, `tests/config/tooling-tsconfigs.test.ts` |
| `astro.config.ts`                                  | static site build contract        | Static output, strict redirects, content Markdown pipeline, image policy, prefetch policy | Server output and SSR adapters are absent                                                                                         | `tests/config/astro.config.test.ts`                                             |
| `vitest.config.ts`                                 | Astro container tests             | `tests/**/*.vitest.ts` only                                                               | Bun unit tests are excluded                                                                                                       | `tests/config/vitest.config.test.ts`                                            |
| `playwright.config.ts`                             | built-output browser tests        | `tests/**/*.pw.ts` against Astro preview on port `4322`                                   | No multi-browser matrix yet                                                                                                       | `tests/config/playwright.config.test.ts`                                        |
| `knip.ts`                                          | dead code and dependency analysis | Astro config, ESLint config, scripts, `src`, tests, route entrypoints                     | Generated output, coverage, Playwright artifacts, `public/**`, known binaries/dependencies                                        | `tests/config/knip.test.ts`                                                     |
| `lighthouserc.json`                                | Lighthouse review                 | Six representative routes, budgets, key CWV assertions                                    | Not a full-site Lighthouse crawl                                                                                                  | CI review-only Lighthouse job                                                   |
| `wrangler.toml`                                    | Cloudflare static asset deploy    | `dist` static assets with `404-page` handling                                             | No Worker-first routing                                                                                                           | `tests/config/wrangler.config.test.ts`                                          |
| `site/public/_headers`                             | static asset headers              | Long-lived `_astro` caching and traffic-advice content type                               | No dynamic Worker headers                                                                                                         | `tests/config/static-public-files.test.ts`                                      |
| `.test-accountability-ignore`                      | test accountability               | Repository files from git, mirrored tests, approved exceptions                            | Generated dirs and explicit approved paths                                                                                        | `test:accountability`, `test:accountability:release`                            |
| `scripts/coverage-exceptions.json`                 | LCOV coverage accountability      | Code-like source roots in coverage verifier                                               | Approved CSS exception only                                                                                                       | `coverage:verify`                                                               |
| Asset ignore JSON files                            | asset inventory                   | Image-location exceptions, duplicate exceptions, unused exceptions                        | Duplicate and unused ignore lists are empty                                                                                       | Asset scripts and related tests                                                 |

### Current Scope Observations

1. The repo already has config tests for the highest-risk command contracts:
   `just` recipe entrypoints, CI artifact reuse, Cloudflare deployment shape,
   strict TypeScript settings, Playwright built-output testing, and generated
   output ignores.
2. Main local linting uses `eslint .`, which is simple and strict, but it makes
   later narrowing risky unless diagnostic diffs prove equivalent coverage.
3. Code formatting and Markdown formatting are intentionally separate. This is
   correct for content fidelity, but the registry should make the distinction
   explicit so authors do not accidentally run broad Markdown rewrites.
4. CI uses one verified build artifact for browser, accessibility, Lighthouse,
   and deploy paths. That is the desired release architecture and should be
   preserved.
5. Security checks have two CI-only surfaces: GitHub Dependency Review and the
   Gitleaks action security-event integration. Local equivalents should be
   documented as approximations, not exact reproductions.
6. Review-only gates are intentionally not blocking in CI. The registry should
   preserve this distinction instead of treating every command as equal.
7. The current inventory does not reveal stale `just` recipes, but it does show
   that script metadata lives only in prose. `IRK-37` should move command
   contracts into data and derive/check prose from that data where practical.

## Findings

Use this section to group confirmed issues by action milestone.

Finding states:

- `observe`: known behavior, no change recommended yet.
- `fix-in-37`: registry or CI parity work.
- `fix-in-38`: failure-probe coverage.
- `fix-in-39`: diagnostic diff work.
- `fix-in-40`: safe scope cleanup.
- `defer`: useful, but outside this preflight.

Confirmed findings:

1. `fix-in-37`: Package command purpose and CI parity are documented in prose,
   not a machine-readable registry. That makes drift checks necessarily partial.
2. `fix-in-37`: CI deploy and security actions have local approximations but no
   explicit parity metadata explaining what is exact, approximate, or CI-only.
3. `fix-in-38`: Existing config tests protect stable contracts, but there is no
   isolated failure-probe suite proving that narrowed QA scopes still catch
   representative bad content, bad metadata, bad links, bad assets, bad
   citations, or bad generated artifacts.
4. `fix-in-39`: The repo has command wrappers, but no standard diagnostic
   comparison format for proving that a scoped replacement reports the same
   files/codes/severities as the old command.
5. `fix-in-40`: `eslint .`, Prettier broad globs, Knip project roots, and
   Markdown review scopes should remain unchanged until diagnostic comparisons
   and failure probes prove a narrower scope is safe.
6. `observe`: Review-only CI jobs are intentionally non-blocking. This is not a
   bug, but the command registry should label them clearly.

## Verification Log

Record verification commands and outcomes here as each preflight child
milestone completes.

- `IRK-36`: passed `just test-config` with 30 tests and passed `just review-markdown`
  after formatting `agent-docs/qa/QA_PREFLIGHT.md`.
- `IRK-37`: passed `just test-config` with 34 tests, `just test-accountability`,
  `just typecheck-tools`, and `just review-markdown`.
- `IRK-38`: passed `just test-config` with 37 tests, `just test-accountability`, and
  `just typecheck-tools`.
- `IRK-39`: passed `just test-config` with 42 tests, `just typecheck-tools`,
  `just diagnostics-diff --help`, and `just test-accountability`.
- `IRK-40`: targeted generated-output ignore tests passed with 30 tests,
  `just package-check` passed after sorting `package.json`, and
  `just test-config` passed with 44 tests. The final preflight verification also
  passed `just check-fast`, `just typecheck-tools`, `just review-markdown`, and
  the full `just release-check` gate.
