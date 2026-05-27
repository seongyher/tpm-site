# Milestone 9 Command Surface Migration

This document defines the corrected milestone 9 target: the repository command
surface moves from package scripts to `just` and Rust-backed operations. It is
the implementation guide for IRK-219 through IRK-230.

## Goals

- Make `just --list` the canonical human command index.
- Make GitHub Actions call `just` recipes, not package scripts.
- Remove `package.json` scripts as a developer workflow surface.
- Keep Rust operations as the target owner for deterministic platform and
  repository tooling.
- Keep Astro, Playwright, Vitest, Prettier, ESLint, Markdownlint, Pagefind,
  Lighthouse CI, Gitleaks, Wrangler, and Bun itself as implementation adapters
  where they are the correct ecosystem boundary.
- Classify any remaining repository-owned TypeScript tooling as a time-boxed
  migration fallback instead of permanent architecture.
- Preserve release, browser, accessibility, payload, docs, and authoring
  behavior while improving command ergonomics and CI/local parity.

## Current Inventory

The pre-migration `package.json` exposed 101 scripts:

- 43 directly executed repository TypeScript scripts with `bun scripts/...`;
- 33 package-script compositions using `bun run`;
- 22 direct ecosystem tool or provider commands such as Astro, Playwright,
  Vitest, Prettier, ESLint, Markdownlint, Knip, Gitleaks, Wrangler, Lighthouse
  CI, and `bun audit`;
- 3 environment-specific wrapper groups that mostly exist to pass site output
  directories or catalog/docs-site environment variables.

That inventory makes package scripts too broad to remain the source of truth.
The command surface is mixing product commands, QA gates, experiments,
provider adapters, package-maintenance commands, local servers, and migration
helpers in one flat `package.json` map.

## End-State Policy

Package scripts are not the canonical workflow surface after this milestone.

Allowed end-state package-script policy:

1. `package.json` may omit `scripts` entirely.
2. If a future package script is added, it must be a temporary compatibility
   shim with a documented owner, expiry trigger, and corresponding `just`
   recipe. The guard tests must fail on unclassified scripts.
3. Human-facing docs, agent instructions, CI workflows, and release guidance
   should use `just`, not `bun run`.

Allowed Bun usage after this milestone:

1. `bun install` remains the package-manager install command.
2. `bun test` remains the JavaScript/TypeScript/Astro unit-test runner while
   those tests are in the JS ecosystem.
3. `bun audit` remains the dependency-audit adapter.
4. `bun scripts/...` may remain only for repository-owned TypeScript tools
   that are explicitly classified as temporary migration fallbacks.
5. `bunx` may remain for ecosystem tool bootstrap where a local binary is not
   available or the tool is naturally Node/Bun-bound.

Disallowed after this milestone:

- `bun run <script>` as the documented or CI command surface;
- package scripts used as command composition;
- undocumented repository-owned TypeScript fallback tools;
- Rust package-script wrappers;
- domain logic inside `justfile`.

## Command Ownership Classes

| Class                         | Meaning                                                                   | Examples                                                                                                                             | Milestone 9 action                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Rust-owned operation          | Rust owns the durable operation contract and reports.                     | `tpm site doctor`, `tpm media images`, `tpm routes redirects`, `tpm qa registry`, `tpm output verify`                                | Keep behind `just cli ...`, use as promoted/report evidence, and continue parity work before deleting deeper TS sources of truth. |
| `just` orchestration          | `just` composes existing checks and tools without domain logic.           | `just check`, `just release-check`, `just build-release`, `just test`, `just docs-check`                                             | Replace package-script compositions.                                                                                              |
| JS/Astro ecosystem adapter    | The underlying tool is correctly JS/Astro/browser/provider-owned.         | `astro`, `vitest`, `playwright`, `prettier`, `eslint`, `markdownlint-cli2`, `lhci`, `wrangler`, `gitleaks`, `bun audit`              | Call directly from `just` recipes.                                                                                                |
| Temporary TypeScript fallback | Repository-owned deterministic tooling that still needs a Rust port.      | generated-output verifier, PDF generation, build optimizer, docs reference generator, starter checks, coverage/accountability checks | Call from `just` with explicit migration debt and keep tests.                                                                     |
| Review-only experiment        | Tooling used for investigations, not required release behavior.           | payload minification, Vite build experiments, critical CSS experiments, citation audits                                              | Keep as `just` recipes and document as review-only.                                                                               |
| Obsolete/delete               | Package-script wrapper or helper no longer needed after `just` promotion. | `scripts/testing/run-tests.ts`, `scripts/quality/run-quality.ts` once `just` owns orchestration                                      | Delete when no longer imported by tests/docs.                                                                                     |

## Domain Disposition

| Domain                          | Package scripts before migration                     | Milestone 9 disposition                                                                                                                    |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Setup and command discovery     | none plus ad hoc docs                                | Add `just setup`, `just setup-rust`, `just setup-browser`, `just list`.                                                                    |
| Development servers             | `dev`, `preview`, catalog/docs-site preview wrappers | Direct `just dev`, `just preview`, `just catalog-dev`, `just docs-site-dev`, and fresh-preview recipes.                                    |
| Authoring                       | `author:check`, `author:fix`                         | `just author-check` and `just author-fix`; keep TypeScript fallbacks behind recipes until Rust content/tag/site operations fully own them. |
| Content and tags                | `verify:content`, `tags:*`                           | `just content-check`, `just tags-check`, `just tags-normalize`; Rust operation target, TypeScript fallback for now.                        |
| Site config                     | `site:doctor`, `site:schema:*`                       | `just site-doctor` uses Rust report; schema generation remains TypeScript fallback behind `just site-schema*`.                             |
| Assets/media                    | `assets:*`, `review:assets`                          | `just media-images` uses Rust report; location/shared/unused/duplicate fallbacks remain behind explicit recipes until parity is promoted.  |
| Routes/redirects                | `build:cloudflare`                                   | `just routes-redirects` for Rust report; deploy artifact generation remains a build fallback until the writer is promoted.                 |
| Build/release output            | `build:*`, `verify`, `validate:html`                 | `just build*`, `just verify`, `just validate-html`; build/PDF/optimizer/verifier remain temporary TypeScript/Astro adapters.               |
| Payload/performance             | `payload:*`                                          | `just payload-*`; keep review-only experiments explicit.                                                                                   |
| Docs references                 | `docs:*`                                             | `just docs-*`; generator remains TypeScript fallback until Rust schema/reference generation exists.                                        |
| Docs site and catalog           | `docs-site:*`, `catalog:*`                           | Direct `just` wrappers with isolated environment variables.                                                                                |
| Tests                           | `test*`, `coverage*`                                 | `just test*`, `just coverage*`; remove TypeScript orchestration helpers where `just` can orchestrate directly.                             |
| Typecheck/lint/format/dead code | `typecheck`, `lint`, `format`, `deadcode`            | Direct ecosystem commands in `just`.                                                                                                       |
| Rust                            | package wrappers already removed                     | `just rust-*` stays source of truth.                                                                                                       |
| Security                        | `audit*`, `secrets`                                  | `just audit*`, `just secrets`; CI uses matching recipes plus GitHub-native dependency review.                                              |
| Deploy                          | `deploy:cloudflare`, `preview:cloudflare*`           | `just deploy-cloudflare`, `just preview-cloudflare*`; provider adapter remains Wrangler.                                                   |
| QA registry and diagnostic diff | `test:config`, `diagnostics:diff`                    | Registry becomes `just`-oriented; diagnostic diff has Rust and fallback surfaces during promotion.                                         |

## Migration Guardrails

- Keep `justfile` recipes orchestration-only. A long shell pipeline is a smell;
  move logic to Rust or a justified temporary fallback.
- Keep release behavior stable. If a promoted command intentionally changes old
  behavior, document the accepted difference and add a test.
- Do not remove a TypeScript fallback merely because a report shell exists.
  Remove it only when the Rust implementation owns the same behavior or the
  old behavior is explicitly obsolete.
- Prefer direct tool invocation over package-script indirection when the tool
  is an ecosystem adapter.
- Prefer Rust operation contracts for domain diagnostics, reports, and future
  GUI/MCP reuse.
- Keep command names kebab-case in `just` so they read like product actions:
  `author-check`, `build-release`, `test-e2e-built`, `docs-references-check`.
- Keep aggregate commands obvious:
  - `just check-fast`
  - `just check`
  - `just release-check`
  - `just fix`
  - `just test`
  - `just build`

## Verification Plan

Focused verification for this migration:

```sh
just test-config
just docs-references-check -- --quiet
just rust-check
just check-fast
just release-check
```

The no-regression guard should prove:

- `package.json` has no command surface or only documented temporary shims;
- every `just` recipe that participates in QA is classified in the registry;
- every CI job maps to a local `just` recipe or has a documented CI-only
  reason;
- domain coverage has focused and release evidence or an explicit exception;
- docs that generate command references point at `just`, not package scripts.

## Remaining Debt After Surface Migration

The command surface migration does not pretend that every repository-owned
TypeScript tool has been safely ported to Rust. It makes the remaining debt
visible and bounded.

Temporary fallback areas that should continue into later parity work:

- deep generated-output verification modules;
- PDF generation and browser-rendered artifact production;
- build-output optimization stack;
- site config schema generation until Rust schema generation is available;
- starter-template verification;
- generated platform reference documentation;
- content/reference/citation audits;
- coverage and test-accountability reporting;
- payload experiment runners.

Those fallbacks remain acceptable only because they are now hidden behind
`just`, classified in the command registry, and attached to explicit Rust
promotion targets.
