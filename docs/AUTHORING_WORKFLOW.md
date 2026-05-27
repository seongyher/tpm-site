# Authoring Workflow

## Purpose

Authors should be able to add articles, announcements, images, tags, sources,
and basic site content without understanding platform internals.

The platform should translate common mistakes into precise, repairable
messages. The future GUI should call the same checks instead of inventing a
parallel validation model.

## Author-Facing Command Layer

Use the author command layer for day-to-day content edits:

```sh
just author-check
```

This runs the checks most relevant to author and webmaster edits:

- source content invariants;
- tag canonicalization;
- image asset location and shared-asset placement;
- site config relationship checks;
- generated site config schema freshness.

Use the safe repair command when the failure is tag normalization:

```sh
just author-fix
```

`author-fix` currently runs `tags-normalize`, which can trim/lowercase/collapse
safe tag differences and remove duplicate tags. It intentionally does not fix
slash-containing tags or unrelated Markdown prose because those require
editorial judgment.

## Lower-Level Commands

The command layer is intentionally thin. Maintainers can still run the focused
tools directly:

- `just content-check`
- `just tags-check`
- `just tags-normalize`
- `just assets-locations`
- `just assets-shared`
- `just site-doctor`
- `just site-schema-check`

Use `site-doctor` directly when changing site configuration, navigation,
collections, redirects, author profiles, category metadata, or site-level
assets:

```sh
just site-doctor
```

For editor, GUI, MCP, or CI consumers that need structured output:

```sh
just site-doctor -- --json
```

The JSON output uses the shared author diagnostic report shape: stable
diagnostic codes, severity, category, repair owner, source location, related
docs, remediation, and summary counts. Human output stays short so authors can
repair common mistakes without reading platform internals.

Keep new author-facing checks wired into `author:check` when they catch
mistakes authors can reasonably make while editing `site/`.

## Authoring Surfaces

Normal authors should mostly edit:

- `site/content/articles/`
- `site/content/announcements/`
- `site/assets/articles/`
- `site/assets/shared/`

Webmasters may also edit:

- `site/config/site.json`
- `site/theme.css`
- `site/content/authors/`
- `site/content/categories/`
- `site/content/collections/`
- `site/content/pages/`
- `site/public/`

Platform implementation files under `src/` should not be part of normal
article publication.

## Validation Philosophy

- Prefer defaults in `site/config/site.json` over repeated frontmatter.
- Let authors override frontmatter only for exceptions.
- Prefer dry-run checks before writing repair scripts.
- Keep repair scripts narrow and deterministic.
- Never rewrite article prose unless the command name and docs make that scope
  explicit.
- Error messages should name the file, explain the problem in author language,
  and state the repair.

## Current Gaps

The planned article submission tool in `scripts/article-submission/DESIGN.md`
is still deferred implementation work. Until then, the workflow is:

1. add or edit site content/assets;
2. run `just author-check`;
3. run `just author-fix` only for safe tag normalization;
4. run broader maintainer checks when code or platform files changed.
