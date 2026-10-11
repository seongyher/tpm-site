# Dependency Maintenance

Use the exact Bun version in `package.json`. GitHub Actions reads that same
`packageManager` field through `bun-version-file: package.json`. CI and
`.node-version` use Node 22.23.3; the package engine range remains authoritative
for other supported Node releases.

Dependabot temporarily uses the `npm` ecosystem for manifest update proposals.
Complete each proposal by regenerating `bun.lock` with the pinned Bun version.
Keep frozen-lockfile installation enabled: a manifest-only dependency bump is
not reproducible and must fail CI. Native Bun support remains blocked on
[Dependabot PR 16071](https://github.com/dependabot/dependabot-core/pull/16071).
Switch only after its deployed updater supports this lockfile and Bun's nested
TypeScript alias fix; resume criteria are recorded in `DEFERRED.md`.

## Smaller QA Toolchain

The October 2026 simplification removes ESLint and its plugin/config stack,
Markdownlint, Lighthouse CI/Puppeteer, and `gray-matter`. Oxlint runs native
JavaScript/TypeScript correctness rules with no JavaScript plugins or separate
typechecking engine. Prettier owns formatting. Astro/TypeScript checks,
content/schema validation, Knip, HTML/output verification, unit/component tests,
Playwright, axe, dependency audits, and secrets checks remain.

Markdown/MDX formatting is manual and optional. The automatic Markdown style
review job and quality-run invocations are removed; use `format:markdown` to
check formatting or `fix:markdown` to apply it when explicitly wanted. Compiler,
schema, and built-output checks continue to validate published content.

This intentionally retires custom ESLint style/purity/complexity and type-aware
lint rules, Astro template lint, Markdown prose lint, and automated Lighthouse
scores. Compiler and browser checks provide different coverage; they are not
rule-for-rule substitutes. Use browser Lighthouse manually when investigating
performance. Astro's generated triple-slash type reference remains permitted.

Tooling frontmatter parsing now reuses `@astrojs/markdown-remark`, already part
of the site compiler. The small adapter preserves the prior body boundary for
source-line diagnostics. All 115 source content records were compared before
and after: parsed metadata and body text match exactly. Focused tests cover
line endings, body offsets, YAML dates/aliases, BOMs, empty metadata, and invalid
YAML. The site's Markdown rendering plugins are unchanged.

The change removes 42 direct dependencies and adds one (`oxlint`), reducing the
direct dependency count from 84 to 43 and lockfile package entries from 1,652
to 795. Both
unpatched packages, `braces` and `sprintf-js`, are absent from the lockfile.
There are no advisory dismissals or weakened audit thresholds. Overrides
specific to the removed stacks have also been removed, including the risky
Puppeteer browsers override. This reduces maintenance surface; future audit
findings are still possible.

## Coordinated Updates And Overrides

Dependabot groups Astro integrations, Playwright, Tailwind, and TypeScript
packages, with a separate weekly GitHub Actions updater. Update related packages
together and inspect the all-severity audit after refreshing transitive
resolutions. GitHub's Dependabot alerts API reported alerts disabled for this
repository during the October refresh; use the registry audit as well.

Keep the unified Markdown processor and article-reference/image plugins. The
Sätteri migration remains separate work in `DEFERRED.md`.

TypeScript 7 provides native `tsc` through
`@typescript/native: npm:typescript@^7.0.2`. Astro and Volar still need TypeScript
6's JavaScript API through `typescript: npm:@typescript/typescript6@^6.0.2`.
This follows [Microsoft's coexistence guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
Bun 1.4.2 includes the required [nested alias resolver fix](https://github.com/oven-sh/bun/pull/33835).
Remove the compatibility alias only when Astro supports the replacement API.

Remaining security override floors are in `package.json`. In particular,
Tailwind Typography pins an older CSS selector parser, so
`postcss-selector-parser` is overridden to 7.1.6. Selector parsing and production
builds were checked against the override. Remove each override when normal
parent ranges resolve a patched version without it; do not preserve overrides
for packages no longer in the graph.

## Verification

Run `bun install --frozen-lockfile`, `bun run check:release`,
`bun run test:a11y:built`, and `bun run audit:all`. Browser tests must use the
binaries for the installed Playwright version. The release gate still blocks
on high/critical advisories, while the all-severity command reports everything.

Playwright owns its preview server (`ASTRO_PREVIEW_BACKGROUND=0`, `--ignore-lock`)
and refuses to reuse an existing one. If port 4322 is occupied, select a free
port, for example `PLAYWRIGHT_TEST_PORT=4397 bun run check:release`.

The October refresh incorporates the four open Dependabot proposals (#163,
#165, #166, #168), updates all 33 then-outdated direct dependencies, and pins
Bun 1.4.3. Prettier's Astro plugin 1.x mechanically reformats 89 Astro files;
`astroCompressHTML: "html"` matches the existing Astro HTML compression policy.
Three legacy YAML descriptions use formatter-stable quoting with the updated
parser; parsed metadata and article bodies match HEAD, including trailing
newlines.

The oversized-PDF test fixture uses file padding to exceed the existing byte
limit. Redundant multi-megabyte subject metadata was removed after its encoding
stalled concurrent tests on a GitHub runner. PDF assertions, runtime behavior,
and test timeouts are unchanged.

The initial dependency refresh reduced 43 audit findings to two unpatched
advisories. Removing the toolchains now resolves those final two findings.
Lint diagnostic comparison preserves debugger and duplicate-branch errors;
two JSDoc diagnostics and a redundant Sonar condition diagnostic are intentionally
retired. See `QA_PREFLIGHT.md` for the scope and diagnostic comparison method.

Local evidence is in ignored `tmp/dependency-refresh-october/` and
`tmp/qa-simplification/`. Hosted GitHub Actions and Dependency Review run on the
pull request; check their results before merging.

Verified after simplification with Bun 1.4.3 and Node 22.23.3:

- Frozen installation and the complete `check:release` gate pass, including
  typechecking, lint/format/Knip checks, unit/Astro tests, all 16 catalog and 177
  production browser tests, output/HTML validation, audit, and secrets scanning.
- All 13 separate axe accessibility tests pass.
- All-severity audit returns no findings; the two previously unpatched
  dependencies are absent from the graph.
- Parser tests pass with 100% line/function coverage, and retained lint
  diagnostics match after the documented cross-engine normalization.
