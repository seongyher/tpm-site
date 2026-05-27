# Generated References

This document defines the generated-reference contract for platform docs.

Generated references are not a replacement for narrative author guides. They
are deterministic snapshots of typed platform contracts so documentation does
not drift from schemas, registries, route policy, feature flags, metadata
profiles, media policy, or QA command ownership.

## Goals

- Generate reference material from source-of-truth code instead of copying
  schema and registry facts by hand.
- Keep generated output readable enough for authors and site owners when the
  referenced contract is author-facing.
- Give developers a focused drift check that fails when generated reference
  files are stale.
- Avoid coupling this work to the later public docs information architecture
  and link-check milestone.

## Non-Goals

- Do not redesign the docs site information architecture.
- Do not require every future reference surface to exist in this pass.
- Do not expose implementation-only schema internals that do not help an
  author, site owner, platform developer, or future studio consumer.
- Do not generate prose that should remain hand-written, such as tutorials,
  rationale, troubleshooting, tradeoffs, or examples with editorial context.

## Generated Artifact

The initial artifact is `docs/generated/platform-reference.md`.

It should include:

- a generated-file header;
- site config field paths generated from `siteConfigSchema`;
- article, announcement, page, category, author, and collection frontmatter
  field paths generated from content schemas where practical;
- route, entity, feature, output, and surface facts generated from
  `routeRegistryEntries(siteConfig)`;
- feature flags generated from the current site config schema/defaults;
- publishable visibility surfaces generated from current defaults;
- semantic profile kinds generated from `semanticProfileKinds`;
- media/PDF policy roles and surfaces generated from the current documented
  media policy vocabulary until those values move into a typed policy module;
- QA command/domain reference generated from the `just` command surface and
  Rust QA operation metadata.

The file is generated in `docs/generated/` rather than the docs-site content
tree so it can become a source for later public docs without forcing the
blocked public docs IA milestone to land now.

## Source Ownership

Generated sections should name their owning source.

| Section              | Owning Source                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| Site config fields   | `src/lib/site-config.ts` and generated JSON Schema                                                 |
| Frontmatter fields   | `src/lib/content-schemas.ts`                                                                       |
| Routes and features  | `src/lib/route-registry.ts`, `src/lib/site-config-defaults.ts`, and active `site/config/site.json` |
| Visibility surfaces  | `src/lib/site-config-defaults.ts` and content schema visibility defaults                           |
| Metadata profiles    | `src/lib/semantic-profile-kinds.ts`                                                                |
| Media/PDF vocabulary | `docs/MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md` until promoted to typed policy constants              |
| QA commands          | `justfile`, `COMMANDS.md`, `crates/tpm-xtask/src/tasks.rs`, and Rust QA operations                 |

When a source changes, the generated reference should change or the check
command should prove no output change is needed.

## Command Contract

The docs reference generator should provide:

- `just docs-references` to write generated references;
- `just docs-references-check` to fail when generated references are stale.

The check command should be fast enough for focused local use and should be
registered in the QA command registry. It should not run a full site build.

## Output Rules

- Use stable sorting for fields, routes, features, and commands.
- Include source paths in section headings or notes.
- Use Markdown tables for enumerable contracts.
- Prefer normalized field paths such as `identity.title` and
  `visibility.search`.
- Include type/default/required information when the JSON Schema exposes it.
- Avoid long JSON dumps. Link to the generated JSON Schema for full editor
  metadata where appropriate.

## Verification

Implementation should verify:

- the generator output is deterministic;
- `--check` fails when the generated file differs from source-of-truth output;
- `just` command evidence, Rust QA reports, and `COMMANDS.md` stay aligned;
- generated references mention all current route keys, feature flags, semantic
  profile kinds, and QA command domains;
- the implementation does not read built `dist/` output or depend on a running
  Astro server.

Later public docs work can split or embed the generated reference into
reader-facing docs-site pages. That should consume this generated artifact or
the same generator functions rather than copying the tables by hand.
