# Large-File Refactor Plan

This pass reduces large, high-risk source files without changing product
behavior. The goal is not line-count reduction by itself; the goal is to make
the repo easier to understand, test, and extend while preserving current public
entrypoints, generated output, and command behavior.

## Goals

- Keep behavior stable and protected by existing checks.
- Split files only where a real domain seam exists.
- Preserve public imports with barrels or thin orchestration modules when
  callers already depend on a path.
- Move pure helpers away from command, DOM, filesystem, and process boundaries
  where practical.
- Keep future CLI, MCP, GUI, CI, and studio work on shared contracts instead
  of duplicating logic in interface-specific files.
- Prefer small modules with narrow responsibilities over generic utility dumps.

## Non-Goals

- No visual redesign.
- No `just` command behavior changes.
- No user-facing `tpm` CLI command changes.
- No PDF feature rewrite.
- No package extraction during this pass.

## Invariants

- `crates/tpm-xtask::tasks::run` remains the internal `just` command entry.
- The `tpm` user CLI remains separate from `tpm-xtask` repository automation.
- Component catalog output remains private review tooling, not site runtime UI.
- Existing TypeScript/Astro import paths should remain stable unless a change
  is local to the catalog.
- Refactors must not lower coverage expectations or replace precise tests with
  broad snapshot-only assertions.
- Coverage ignores stay narrow and justified.

## Implementation Order

1. Split `crates/tpm-xtask/src/tasks.rs` around existing internal seams:
   workspace context, external command planning/execution, filesystem/glob
   helpers, redirect generation, content/tag checks, asset checks, output
   optimization, and command adapters.
2. Split `src/catalog/ComponentCatalog.astro` into section components and
   fixture modules. Keep the root catalog as page-level orchestration.
3. Re-check platform domain files after the first two splits. Implement only
   high-confidence behavior-preserving splits where the module boundaries are
   obvious and existing tests can verify behavior.
4. Defer broad platform-domain rewrites when they require contract redesign
   rather than structural extraction.

## Target Boundaries

### Xtask

- `tasks.rs`: command parser compatibility and active command routing only.
- `tasks/workspace.rs`: xtask-local workspace discovery and output path
  normalization.
- `tasks/external.rs`: external command request and execution boundary.
- `tasks/filesystem.rs`: deterministic filesystem, extension, ignore, glob,
  path, hash, and display helpers.
- `tasks/content.rs`: content and tag source verification helpers.
- `tasks/assets.rs`: media reference scanning, duplicate/unused/shared image
  helpers, generated raster optimization helpers, and asset command adapters.
- `tasks/build.rs`: Astro/Pagefind/html-validate/catalog external-command
  adapters.
- `tasks/cloudflare.rs`: redirect generation inputs and Cloudflare static asset
  command adapter.
- `tasks/operations.rs`: operation-result bridge adapters.
- `tasks/qa.rs`: test-accountability and coverage command adapters.
- `tasks/site.rs`: site/content/schema/platform/catalog verification command
  adapters.

### Component Catalog

- `ComponentCatalog.astro`: fixture setup, header, and section composition
  only.
- `sections/*CatalogSection.astro`: one catalog domain per section.
- `examples/*`: reusable fixture data and hostile-content fixtures.

### Platform Domain Files

The following files should be split only when the split is obviously
behavior-preserving:

- `src/lib/extensions.ts`: manifest model, validation, resolution, catalog, and
  output-diagnostic concerns.
- `src/lib/studio-models.ts`: source registry, field descriptors, editor
  documents, and workflow state transitions.
- `src/rehype-plugins/articleImages.ts` and
  `src/remark-plugins/articleReferences.ts`: AST phases and node builders.
- `src/lib/semantic-metadata.ts` and `src/lib/media-policy.ts`: schemas,
  policies, view models, and generated-output helpers.
- `src/lib/deployment-adapters.ts`: provider-neutral model, provider parsers,
  provider diagnostics, and plan builders.

## Verification

- Run focused Rust checks after xtask movement.
- Run catalog checks after catalog movement.
- Run TypeScript/Astro checks after TypeScript or Astro module movement.
- Run aggregate coverage when logic moves across test seams.
- Run release checks before handoff if the touched surfaces can affect CI.

## Current Pass Decisions

- Implemented the xtask split now because the boundaries were already proven by
  command tests: process execution, workspace discovery, filesystem policy,
  Cloudflare redirects, content/tag checks, asset checks, and generated raster
  optimization are separate internal concerns.
- Moved the large inline xtask tests into `tasks/tests.rs` so production task
  adapters can be read without scrolling through fixture-heavy tests.
- Moved all active xtask command adapters behind focused task modules so
  `tasks.rs` stays a compatibility-aware router over typed command variants.
- Implemented the component catalog split now because catalog domains are
  visual review sections, each with clear fixture inputs and existing browser
  invariants.
- Extracted the article catalog section after the first catalog split because
  the root catalog still mixed page orchestration with article-section
  implementation. The article section now owns its required fixture inputs and
  section-level rendering contract.
- Did not split `extensions.ts`, `studio-models.ts`, `semantic-metadata.ts`,
  `media-policy.ts`, `deployment-adapters.ts`, or the AST plugins in this pass.
  Those files are real candidates, but the split should happen with their
  domain-contract work so we do not create premature barrels around unstable
  product models.
