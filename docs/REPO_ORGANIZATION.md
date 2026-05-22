# Repository Organization

This document defines the target filesystem organization for the platform as it
matures from a TPM site repository into a reusable static publishing platform
with future studio, CLI, MCP, adapter, and package-boundary consumers.

The goal is not tidy paths for their own sake. The goal is to make domain
ownership obvious, keep author and site-owner surfaces simple, and make future
extraction work start from proven internal seams.

## Principles

- Keep site-instance material in `site/` and reusable platform code in `src/`.
- Keep `src/platform/` flat because it is the internal public entrypoint seam.
- Organize `src/lib/` by platform domain, not by incidental implementation
  type.
- Mirror source moves in tests when the source path is part of the test
  accountability model.
- Keep Astro route directories, site-instance directories, and build scripts
  boring unless a concrete domain problem appears.
- Prefer one domain move at a time over giant churn that makes review harder.
- Avoid compatibility barrels for internal moves unless a downstream consumer
  genuinely needs a transition period.

## Target Source Shape

```text
src/
  platform/        flat internal entrypoints for future package consumers
  lib/
    articles/      article rendering, TOC, PDF, embed, and prose policies
    content/       publishable entries, collections, authors, feeds, home data
    deployment/    provider-neutral deploy contracts and adapters
    diagnostics/   author and generated-output diagnostic contracts
    extensions/    extension manifests, lifecycle, and capability policies
    import-export/ migration, preservation, and round-trip contracts
    interactions/  browser-independent interaction and positioning logic
    localization/  locale and inclusive-default fixture contracts
    media/         media roles, social images, provenance, and fallbacks
    metadata/      metadata graphs, semantic profiles, SEO helpers
    observability/ webmaster and scanner report models
    references/    notes, citations, BibTeX, bibliography, and source models
    release/       release, performance, security, and supply-chain policies
    routes/        route registry, URL helpers, redirects, static paths
    shared/        small generic helpers with no domain ownership
    site/          site config, source artifacts, support, navigation, context
    starters/      starter template descriptors and checks
    studio/        studio-facing forms, source models, and workflow contracts
  components/
    articles/
    authors/
    bibliography/
    blocks/
    layout/
    media/
    navigation/
    pages/
    seo/
    ui/
  catalog/
  layouts/
  pages/
  scripts/
  styles/
```

`src/lib` should use the domain names above even before any package extraction.
The directories are local architecture seams, not published package names.

## Component Target Shape

The current top-level component groups are useful. Only oversized groups should
gain subfolders.

`src/components/blocks/` can split into:

```text
blocks/
  home/
  listing/
  terms/
  shared/
```

`src/components/articles/` can split into:

```text
articles/
  actions/
  endcap/
  header/
  lists/
  media/
  prose/
  references/
  toc/
```

These moves are valuable only if component docs, catalog examples, and tests
remain easy to follow. Component organization should not hide public component
contracts behind vague barrels.

## Documentation Target Shape

`docs/` should separate current contracts from historical evidence:

```text
docs/
  authoring/
  site-owner/
  platform/
  operations/
  audits/
  components/
  generated/
  performance/
  navigation/
  deferred/
```

The exact grouping should follow the documentation lifecycle:

- author-facing task guides stay simple and practical;
- site-owner configuration docs stay close to schema/config ownership;
- platform contracts stay durable and implementation-facing;
- audits and migration ledgers stay available but should not look like current
  contracts;
- generated references stay deterministic and clearly marked as generated.

## Areas To Keep Stable

- `site/` already expresses the active site instance clearly.
- `src/platform/` should stay flat until it grows beyond a small entrypoint
  seam.
- `src/pages/` should stay aligned with Astro file routing.
- `src/layouts/`, `src/styles/`, `src/catalog/`, and `scripts/` are already
  navigable enough for the current stage.
- `examples/` already separates docs site, starter templates, and entrypoint
  consumer proof. A future `examples/sites`, `examples/starters`, and
  `examples/consumers` split is possible, but lower value than `src/lib` and
  docs cleanup.

## Implementation Order

1. Move `src/lib` by domain and update mirrored `tests/src/lib` paths.
2. Update imports, `src/platform` entrypoints, platform-boundary ownership, and
   `docs/PLATFORM_MODULES.md`.
3. Run focused platform/library checks before moving component or docs paths.
4. Move component groups only where the catalog, docs, and tests can remain
   coherent.
5. Move docs after source paths settle, so docs describe the final shape once.
6. Update `AGENTS.md`, generated references, and lifecycle docs after accepted
   moves.

## Verification

Each move batch should run the smallest checks that prove the affected seam:

- `bun --silent run platform:check` after platform-domain moves.
- Focused unit tests for moved `src/lib` domains.
- Component, catalog, and docs checks after component path moves.
- Markdown/docs checks after documentation moves.
- `bun --silent run check:fast` after a complete organization phase.
- Broader release checks only when public output, content loading, generated
  references, or route behavior are touched heavily.
