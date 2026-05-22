# Starter Templates

Starter templates are maintained site instances for people evaluating or
adopting the platform without reverse-engineering the TPM publication instance.
They are distribution assets, not throwaway examples.

## Product Goal

A new user should be able to choose the closest starter, edit site-owned files,
and understand which platform capabilities are included or intentionally absent.
The starter matrix also gives developers a portable regression surface for
config defaults, site-instance boundaries, deployment assumptions, security
headers, metadata, feeds, PDFs, search, and docs.

## Maintained Starters

| Starter               | Root                                      | Best for                                     | Required surfaces                                                                                        | Intentionally absent                                     |
| --------------------- | ----------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Minimal Blog          | `examples/starters/minimal-blog`          | A solo writer who wants to publish quickly.  | Articles, author, one category, homepage, RSS, search.                                                   | Public support CTA and citations.                        |
| Editorial Magazine    | `examples/starters/editorial-magazine`    | A small editorial team.                      | Articles, announcements, collections, sections, support config.                                          | Heavy scholarly apparatus.                               |
| Scholarly Publication | `examples/starters/scholarly-publication` | A researcher, lab, or small journal.         | Citations, bibliography, PDFs, scholarly metadata defaults.                                              | Public support CTA.                                      |
| Documentation Site    | `examples/docs-site`                      | A project maintainer documenting a platform. | Docs-oriented article categories, configuration docs, announcements.                                     | Public support CTA.                                      |
| Kitchen Sink Demo     | `examples/starters/kitchen-sink`          | A platform evaluator.                        | Broad feature coverage: announcements, citations, bibliography, redirects, support, feeds, search, PDFs. | None by default; future extension demos remain optional. |

The source-of-truth matrix lives in `src/lib/starters/starter-templates.ts` and is
exposed through `src/platform/starters.ts`.

## Scaffold Workflow

Until a dedicated scaffold CLI exists, the supported workflow is a documented
copy flow:

1. Choose the closest starter from the matrix.
2. Copy the starter directory into a new site-instance directory.
3. Set `SITE_INSTANCE_ROOT` to that directory.
4. Edit `config/site.json`, `theme.css`, `content/`, `assets/`, and `public/`.
5. Run `bun run starters:check` from the platform repo to verify maintained
   starter contracts.
6. Run the normal site-instance checks for the copied site, starting with
   `bun run author:check` or `bun run site:doctor`.
7. Build with `SITE_INSTANCE_ROOT=<your-site> bun run build`.

Future CLI, MCP, and studio workflows should consume the same starter matrix
instead of introducing a separate template model.

## Acceptance Criteria

Every maintained starter must:

- live outside the active TPM `site/` instance;
- avoid TPM branding, canonical URLs, support links, and social handles;
- include parseable `config/site.json`, `config/redirects.json`, `theme.css`,
  `public/favicon.svg`, and `public/robots.txt`;
- include enough content to exercise its declared feature level;
- pass `site:doctor` without errors or warnings;
- declare source, build, and release checks in the starter matrix;
- stay small enough to maintain during platform refactors.

`bun run starters:check` enforces the source-level subset. Full build checks can
be run directly with the starter's declared `SITE_INSTANCE_ROOT` command, and
the docs starter is also covered by `bun run test:docs-site`.

## Release Compatibility

Starter compatibility is now part of the fast quality gate through
`starters:check`, which is called by `check:fast`. This keeps release checks
from passing if a starter root is missing required files, has stale site config,
triggers site doctor diagnostics, loses declared verification commands, or
accidentally imports TPM-specific identity.

The current release gate is intentionally source-level. Promoting every starter
to full multi-build release coverage should happen when the build matrix can do
that without making normal release checks too slow. The starter matrix already
records the full build command each starter must satisfy.

## Deprecation And Updates

Starter changes should be treated like product changes:

- preserve starter IDs unless a migration is documented;
- update this document and `src/lib/starters/starter-templates.ts` together;
- keep starter content generic and site-neutral;
- explain breaking starter changes in release notes;
- prefer adding a new starter over making an existing starter serve unrelated
  personas.
