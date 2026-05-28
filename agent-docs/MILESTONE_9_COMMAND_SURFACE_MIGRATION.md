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
- Remove repository-owned TypeScript tooling from the command surface except
  the retained PDF generator exception.
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
4. `bun scripts/...` may remain only for
   `scripts/build/generate-article-pdfs.ts` behind `just build-pdf`.
5. `bunx` may remain for ecosystem tool bootstrap where a local binary is not
   available or the tool is naturally Node/Bun-bound.

Disallowed after this milestone:

- `bun run <script>` as the documented or CI command surface;
- package scripts used as command composition;
- repository-owned TypeScript fallback tools other than the PDF exception;
- Rust package-script wrappers;
- domain logic inside `justfile`.

## Command Ownership Classes

| Class                        | Meaning                                                                                   | Examples                                                                                                                           | Milestone 9 action                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Rust-owned product operation | Rust owns a durable operation contract that belongs in the public `tpm` product language. | `tpm site doctor`, `tpm media images`, `tpm routes redirects`, `tpm release inspect`                                               | Keep behind `just cli ...` and use as promoted/report evidence for future CLI, GUI, MCP, and CI consumers.                               |
| `just` orchestration         | `just` composes existing checks and tools without domain logic.                           | `just check`, `just release-check`, `just build-release`, `just test`, `just docs-check`                                           | Replace package-script compositions.                                                                                                     |
| JS/Astro ecosystem adapter   | The underlying tool is correctly JS/Astro/browser/provider-owned.                         | `astro`, `vitest`, `playwright`, `prettier`, `eslint`, `markdownlint-cli2`, `lhci`, `wrangler`, `gitleaks`, `bun audit`            | Call directly from `just` recipes.                                                                                                       |
| Internal Rust task adapter   | Rust-owned repository maintenance behavior that is not a public product CLI.              | `just _xtask build-raw`, `just _xtask content-check`, `just _xtask verify`, `just _xtask payload-check`, `just _xtask qa-registry` | Use only from focused `just` recipes; promote behavior to product CLI commands only when the command belongs in the public CLI language. |
| TypeScript PDF exception     | Retained legacy browser/JS-adjacent PDF generator.                                        | `scripts/build/generate-article-pdfs.ts`                                                                                           | Keep behind `just build-pdf` until PDF export is redesigned or removed.                                                                  |
| Retired review command       | Old investigation tooling that is no longer active release behavior.                      | payload minification, Vite build experiments, critical CSS experiments, citation audits                                            | Remove old `just` names from the visible command surface; direct internal calls fail with a clear retired-task usage error.              |
| Obsolete/delete              | Package-script wrapper or helper no longer needed after `just` promotion.                 | old package-script-only wrappers and duplicate orchestration helpers                                                               | Delete when no longer imported by tests/docs.                                                                                            |

## Domain Disposition

| Domain                          | Package scripts before migration                     | Milestone 9 disposition                                                                                                              |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Setup and command discovery     | none plus ad hoc docs                                | Add `just setup`, `just setup-rust`, `just setup-browser`, `just list`.                                                              |
| Development servers             | `dev`, `preview`, catalog/docs-site preview wrappers | Direct `just dev`, `just preview`, `just catalog-dev`, `just docs-site-dev`, and fresh-preview recipes.                              |
| Authoring                       | `author:check`, `author:fix`                         | `just author-check` and `just author-fix`; Rust tasks own content, tag, asset, site, and schema checks.                              |
| Content and tags                | `verify:content`, `tags:*`                           | `just content-check`, `just tags-check`, `just tags-normalize`; Rust task adapters own active behavior.                              |
| Site config                     | `site:doctor`, `site:schema:*`                       | `just site-doctor` uses the Rust operation; `just site-schema*` uses Rust task adapters over existing schema artifacts.              |
| Assets/media                    | `assets:*`, `review:assets`                          | `just media-images` uses the Rust report; asset location/shared/unused/duplicate checks are Rust task adapters.                      |
| Routes/redirects                | `build:cloudflare`                                   | `just routes-redirects` reports Rust route policy; `just build-cloudflare` writes deploy artifacts from Rust.                        |
| Build/release output            | `build:*`, `verify`, `validate:html`                 | `just build*`, `just verify`, `just validate-html`; Astro/Pagefind/html-validate remain ecosystem adapters invoked from Rust/`just`. |
| Payload/performance             | `payload:*`                                          | `just payload-check` and `just payload-report`; old experiment commands are removed from the active `just` surface.                  |
| Docs references                 | `docs:*`                                             | `just docs-*`; generated-reference checks are Rust task adapters over existing docs artifacts.                                       |
| Docs site and catalog           | `docs-site:*`, `catalog:*`                           | Direct `just` wrappers with isolated environment variables.                                                                          |
| Tests                           | `test*`, `coverage*`                                 | `just test*`, `just coverage*`; Rust task adapters own repository test accountability and coverage verification.                     |
| Typecheck/lint/format/dead code | `typecheck`, `lint`, `format`, `deadcode`            | Direct ecosystem commands in `just`.                                                                                                 |
| Rust                            | package wrappers already removed                     | `just rust-*` stays source of truth.                                                                                                 |
| Security                        | `audit*`, `secrets`                                  | `just audit*`, `just secrets`; CI uses matching recipes plus GitHub-native dependency review.                                        |
| Deploy                          | `deploy:cloudflare`, `preview:cloudflare*`           | `just deploy-cloudflare`, `just preview-cloudflare*`; provider adapter remains Wrangler.                                             |
| QA registry and diagnostic diff | `test:config`, `diagnostics:diff`                    | Registry becomes `just`-oriented; diagnostic diff has Rust and fallback surfaces during promotion.                                   |

## Migration Guardrails

- Keep `justfile` recipes orchestration-only. A long shell pipeline is a smell;
  move logic to Rust or a justified temporary fallback.
- Keep release behavior stable. If a promoted command intentionally changes old
  behavior, document the accepted difference and add a test.
- Do not reintroduce a TypeScript fallback merely because a command is easier
  to script in TypeScript. Add Rust task/operation logic or call the ecosystem
  tool directly from `just`.
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

The command surface migration intentionally leaves one repository-owned
TypeScript exception: PDF generation. That exception is narrow, documented, and
hidden behind `just build-pdf`.

Remaining command-surface debt is no longer TypeScript fallback code. It is
product hardening work inside Rust operations and task adapters:

- promote internal task adapters to public CLI commands when they become part
  of the product language;
- deepen generated-output verification as reusable diagnostic modules;
- decide whether PDF export should be redesigned, ported, or removed;
- strengthen payload budgets from the current Rust raw-size report into a
  compressed route-class policy if performance work needs that gate;
- restore historical review workflows as real commands only if those workflows
  become active again.
