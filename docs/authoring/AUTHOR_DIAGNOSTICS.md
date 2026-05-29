# Author Diagnostics

This document defines the author-facing diagnostic contract for site doctor,
generated-output verification, future docs references, CLI, MCP, and GUI
studio surfaces.

The goal is to make strict platform checks understandable and repairable by
authors and site owners without losing the structured precision developers need
for release gates and automation.

## Goals

- Translate platform diagnostics into author/site-owner language.
- Keep one diagnostic model that can represent source problems, generated
  output problems, and future production-signal imports.
- Preserve stable machine-readable identity for diffing, GUI repair flows, and
  release reports.
- Keep ownership explicit so an author-fixable issue is not confused with a
  platform bug or external-service problem.
- Keep remediation concrete: identify the file, field, route, artifact, or URL
  involved and explain the next repair action.

## Non-Goals

- Do not replace the generated-output verifier diagnostic model.
- Do not expand site doctor checks here; that belongs to the later site-doctor
  implementation issue.
- Do not infer hidden source locations when only generated output is known.
- Do not create free-form diagnostic text that cannot be classified by future
  GUI, CLI, or MCP consumers.

## Diagnostic Shape

Every author-facing diagnostic should have:

- stable `code`;
- `severity`: `error`, `warning`, or `info`;
- `category`;
- short `summary`;
- optional `detail`;
- `repairOwner`;
- `fixability`;
- optional `location`;
- optional `remediation`;
- optional `relatedDocs`;
- optional `evidence`;
- `source`;

The `source` field records the origin of the diagnostic, such as `site-doctor`,
`generated-output`, `content-schema`, `markdown-plugin`, `asset-audit`,
`observability-import`, or `deployment-check`.

The `location` field may include:

- `sourcePath`;
- `outputPath`;
- `route`;
- `url`;
- `fieldPath`;
- `line`;
- `column`.

Source paths and field paths are preferred for author repair. Output paths,
routes, and URLs are still useful when a generated artifact points to the
problem but no exact source map exists yet.

## Categories

The author-facing category list is intentionally broader than the current build
verifier categories because it must cover source input, generated artifacts,
future production imports, and studio workflows.

| Category              | Use When                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `content`             | An article, announcement, page, collection, author, category, tag, or visible text needs attention.                   |
| `frontmatter`         | Markdown/MDX metadata is missing, invalid, ambiguous, or unsupported.                                                 |
| `config`              | Site-owner configuration, feature flags, navigation, support links, share links, theme, or site identity are invalid. |
| `assets`              | Local assets, public files, optimized images, downloads, or asset placement violate policy.                           |
| `routes`              | Public URL, route registry, generated path, canonical route, or historical URL behavior is wrong.                     |
| `redirects`           | Legacy redirects, configured redirects, or generated redirect fallbacks are missing or invalid.                       |
| `metadata`            | Head tags, JSON-LD, Open Graph, Twitter cards, Scholar tags, semantic profiles, or machine-readable claims are wrong. |
| `citations`           | Notes, citations, BibTeX, bibliography entries, citation exports, or reference backlinks need repair.                 |
| `media`               | Article images, hover images, embeds, thumbnails, social images, or media fallbacks need repair.                      |
| `pdfs`                | Article PDF generation, PDF links, PDF metadata, or PDF media policy needs repair.                                    |
| `feeds`               | RSS/feed output, feed visibility, or feed metadata is wrong.                                                          |
| `search`              | Search index, content index, or search visibility is wrong.                                                           |
| `accessibility`       | Alt text, landmarks, headings, focus behavior, labels, or semantic HTML need repair.                                  |
| `performance`         | Payload, cache, image size, layout stability, or Lighthouse budget needs attention.                                   |
| `deployment`          | Cloudflare, headers, host compatibility files, deploy config, or release readiness needs attention.                   |
| `generated-artifacts` | Built output exists, is missing, or is shaped incorrectly in a way not owned by a narrower category.                  |

When a diagnostic plausibly fits several categories, choose the category that
best describes the repair path. For example, an image missing alt text is
`accessibility`, while a social image that exceeds the social preview byte
budget is `media` or `metadata` depending on whether the repair is the image
policy or the metadata output.

## Repair Ownership

Every diagnostic should identify the person or system most likely to act.

| Repair Owner | Meaning                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| `author`     | The content author can fix the source Markdown, MDX, citation, image alt, or frontmatter.                          |
| `site-owner` | The publication owner can fix `site/config`, redirects, theme, public files, support/social links, or site assets. |
| `developer`  | A platform developer needs to change reusable code, schemas, components, scripts, or tests.                        |
| `platform`   | The platform generated an inconsistent artifact or needs an internal contract fix.                                 |
| `external`   | A third-party URL, provider, crawler, analytics export, or external service caused the issue.                      |

## Fixability

Repair owner says who probably acts. Fixability says whether the issue should
be expected to resolve through normal author/site-owner workflows.

| Fixability        | Meaning                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `source-edit`     | Edit a content, config, theme, redirect, public, or asset source file.                     |
| `regenerate`      | Re-run a generator or build after source is correct.                                       |
| `code-change`     | Change platform code or tests.                                                             |
| `external-action` | Repair an external target, provider config, account, or export.                            |
| `investigate`     | The diagnostic is actionable but needs human classification before a repair path is known. |

Future studio and MCP consumers should only offer direct form repair when
`fixability` is `source-edit` and the diagnostic has a source path or field
path.

## Severity

- `error`: blocks release or should block a normal author handoff.
- `warning`: should be repaired soon, but may not make current output invalid.
- `info`: helps users understand output, configuration, or generated artifacts.

Severity should reflect user impact and output correctness, not implementation
difficulty.

## Source Mapping Rules

Prefer the most repairable location:

1. source path plus field path, line, or column;
2. source path alone;
3. route plus generated output path;
4. generated output path alone;
5. URL;
6. message-only fallback.

When mapping generated-output diagnostics, keep the generated-output location
even if no source map exists. Later site-doctor and studio work can enrich those
diagnostics with source ownership.

## Mapping Current Diagnostics

Existing generated-output categories map into author-facing categories like
this:

| Output Category | Default Author Category |
| --------------- | ----------------------- |
| `asset`         | `assets`                |
| `build`         | `generated-artifacts`   |
| `cache`         | `deployment`            |
| `content`       | `content`               |
| `feed`          | `feeds`                 |
| `html`          | `generated-artifacts`   |
| `link`          | `routes`                |
| `metadata`      | `metadata`              |
| `pdf`           | `pdfs`                  |
| `redirect`      | `redirects`             |
| `route`         | `routes`                |
| `search`        | `search`                |
| `security`      | `deployment`            |
| `sitemap`       | `metadata`              |

Specific codes may override the default. For example,
`html.image-alt-missing` maps to `accessibility`, and
`html.media-output-invalid` maps to `media`.

Existing generated-output owners map into repair ownership like this:

| Output Owner       | Repair Owner |
| ------------------ | ------------ |
| `content`          | `author`     |
| `site-config`      | `site-owner` |
| `generated-output` | `platform`   |
| `platform`         | `developer`  |
| `external`         | `external`   |

Existing site-doctor diagnostics already use author-facing language, but they
need stable codes, categories, repair ownership, source mapping, related docs,
and JSON output before future GUI/CLI/MCP consumers can rely on them.

## Related Docs

Diagnostics should prefer stable docs paths over prose-only hints. Examples:

- config diagnostics: `docs/authoring/SITE_ANATOMY.md`,
  `docs/platform/HOMEPAGE_CONTENT_MODEL.md`, or generated site-config references;
- authoring diagnostics: `docs/authoring/AUTHORING_WORKFLOW.md`;
- citation diagnostics: `docs/authoring/ARTICLE_REFERENCE_AUTHORING.md`;
- metadata diagnostics: `docs/metadata/METADATA_GRAPH_AND_SEMANTIC_PROFILES.md`;
- media diagnostics: `docs/operations/MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md`;
- generated-output diagnostics: `docs/platform/GENERATED_OUTPUT_VERIFIER_CONTRACT.md`.

## Verification Requirements

The contract is useful only if it is executable.

Implementation should verify:

- codes are category-namespaced;
- generated-output diagnostics map into author-facing categories and repair
  owners;
- site-doctor diagnostics can be represented without changing current CLI text;
- diagnostics with source paths or output paths preserve those locations;
- sample diagnostics are understandable without platform-internal knowledge;
- JSON output is stable enough for future GUI, CLI, MCP, and diagnostic diff
  consumers.

Later site-doctor expansion should add fixture mistakes for each major category
and should snapshot both human-readable and machine-readable output.
