# Dependency Maintenance

Use the exact Bun version in `package.json`. GitHub Actions reads that same
`packageManager` field through `bun-version-file: package.json`. Dependabot
temporarily uses the `npm` ecosystem for manifest update proposals. Complete
each proposal by regenerating `bun.lock` with the pinned Bun version and running
the checks below. Keep frozen-lockfile installation enabled: a manifest-only
dependency bump is not reproducible and must fail CI.

As of September 7, 2026, Dependabot's native Bun updater still bundles Bun
1.3.14 and supports only lockfile version 1; this project now needs Bun 1.4.2
and its generated version 2 lockfile. Native support is tracked by
[Dependabot PR 16071](https://github.com/dependabot/dependabot-core/pull/16071),
but its proposed Bun 1.4.0 also predates the TypeScript alias fix below. Switch
ecosystems only after both fixes are deployed; the resume criteria are recorded
in `DEFERRED.md`. Do not downgrade the lockfile or remove frozen installation
to make manifest-only proposals pass.

## Coordinated Updates

Dependabot groups Astro integrations, Playwright packages, Tailwind packages,
and TypeScript/ESLint packages. Update related packages together and regenerate
the lockfile with Bun. Updating only direct dependencies can retain vulnerable
transitive resolutions; inspect the all-severity audit after each refresh.

Astro 7.3 and MDX 8 continue using the configured
`@astrojs/markdown-remark` unified processor. MDX 8 requires Markdown Remark
7.3 or newer. Preserve the article-reference and image plugins; the Sätteri
migration remains separate work in `DEFERRED.md`.

## TypeScript Compiler And API

TypeScript 7 provides the native `tsc` command through
`@typescript/native: npm:typescript@^7.0.2`. Astro, Volar, and typed ESLint still
need TypeScript 6's JavaScript API, supplied by
`typescript: npm:@typescript/typescript6@^6.0.2`. Its `@typescript/old` dependency
resolves to TypeScript 6.0.3 and `tsc6` remains available for compatibility checks.
The existing `typecheck:tools` script therefore uses TypeScript 7 while Astro
and ESLint retain their supported compiler API.

This follows [Microsoft's coexistence guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
Bun 1.3.12 incorrectly resolves the nested alias into a circular wrapper and
returns an empty compiler API. Bun 1.4.2 includes the
[resolver fix](https://github.com/oven-sh/bun/pull/33835); regenerate old lockfiles
with the supported Bun version rather than preserving that bad resolution.
Remove the compatibility alias only when Astro and typed ESLint support the
TypeScript 7 API.

## Security Overrides

The September 2026 refresh preserves existing compatibility/security overrides
and raises the `fast-uri`, `postcss`, and `qs` floors to the audited releases
3.1.7, 8.5.28, and 6.16.0 respectively.

`@puppeteer/browsers` is temporarily pinned to **3.2.2**. Lighthouse CI 0.15.1
uses Lighthouse 12.6.1 and Puppeteer 24, whose browsers 2.x dependency includes
`extract-zip`. That package has an
[unpatched symlink traversal advisory](https://github.com/advisories/GHSA-jmr9-qjv8-65gv).
Browsers 3.x removes it, retaining the synchronous launch/path APIs consumed by
Puppeteer 24. The exact override deliberately crosses Puppeteer's declared
version range, so verify actual Lighthouse collection whenever changing it.
Its Node requirement is compatible with the repository's existing minimum.
Remove this override when a normal Lighthouse CI dependency update resolves
browsers 3.x or newer without it. Do not upgrade Puppeteer independently to 25:
its asynchronous executable-path API requires coordinated Lighthouse changes.

The current graph retains Lighthouse CI's CommonJS `proxy-agent` 6.5.0, which
also serves browsers 3.2.2 despite that package's optional `>=8.0.1` peer range.
The browsers HTTP helper was verified through a local HTTP proxy, in addition
to CommonJS/ESM module loading and a real Chrome launch. Recheck proxy behavior
when changing this override; a global proxy-agent major override would affect
Lighthouse CI's own CommonJS imports.

## Verification

Run `bun install --frozen-lockfile`, `bun run check:release`, and
`bun run audit:all`. When changing lint plugins also run `bun run lint:mdx`,
because normal lint excludes authored MDX. For browser tooling overrides run
`bun run test:perf:built` against the verified release build. Browser and
accessibility checks must use the browser binaries for the installed Playwright
version.

Playwright starts its own preview server and refuses to reuse an existing one,
so catalog and production checks cannot accidentally inspect another site.
Astro 7.3 backgrounds previews automatically in agent environments; the test
server sets `ASTRO_PREVIEW_BACKGROUND=0` and uses `--ignore-lock` so Playwright
owns a foreground process without changing unrelated preview-daemon state.
If the default port 4322 is occupied, select a free port explicitly, for example
`PLAYWRIGHT_TEST_PORT=4397 bun run check:release`. The override must be an integer
between 1 and 65535.

The baseline audit reported 43 vulnerabilities (29 high, 12 moderate, two low).
Fresh direct/transitive resolution removed 42; the browsers override removed
the remaining `extract-zip` finding. The all-severity audit then reported no
vulnerabilities across 1,307 packages. Audit results are a dated snapshot;
rerun the registry audit before merging subsequent dependency changes.

The September 7 refresh was verified with Bun 1.4.2 and Node 24.19.0:

- Frozen installation succeeded and `bun outdated` returned no direct updates.
- `check:release` passed, including type/lint/unit/component checks, 16 catalog
  browser tests, 177 production browser tests, generated-output validation,
  the dependency audit, and the secrets scan.
- Authored MDX lint and all 13 accessibility tests passed.
- Lighthouse passed required assertions on all six URLs. Accessibility,
  best-practices, and SEO scored 100 everywhere. Five pages scored 99–100 for
  performance; the homepage scored 88 against the advisory target of 95,
  with a 12.9-second Speed Index, 2.3-second LCP, zero blocking time, and no
  layout shift. The performance warning remains an observation from this run;
  these checks do not establish whether it predates the dependency refresh.

Local verification logs are in ignored `tmp/dependency-refresh/`, and Lighthouse
reports are in ignored `.lighthouseci/`. The Lighthouse run used Chromium from
the installed Playwright release through `CHROME_PATH`.
