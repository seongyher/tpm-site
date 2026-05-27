# Site Instance Migration

## Purpose

This document turns the platform/site boundary into the full in-repo migration.
The goal is to make `site/` the publication instance and keep `src/` as the
reusable Astro platform.

The migration should not change public URLs, article IDs, generated article
HTML semantics, PDF locations, RSS output, Pagefind behavior, or asset
processing. It changes ownership and path resolution.

## Target Shape

The in-repo site instance should own publication-specific files:

```text
site/
  README.md
  config/
    site.json
  content/
    announcements/
    articles/
    authors/
    categories/
    collections/
    pages/
  assets/
    articles/
    shared/
    site/
  public/
    CNAME
    favicon.svg
    robots.txt
  unused-assets/
```

The platform should own reusable code:

```text
src/
  catalog/
  components/
  layouts/
  lib/
  pages/
  rehype-plugins/
  remark-plugins/
  scripts/
  styles/
```

`src/content/`, `src/assets/`, and root `public/` should disappear after this
migration. `site/unused-assets/` remains a site-owned holding area and should be
excluded from generated output.

## Path Resolver Contract

All platform code and repository scripts should get site-instance paths from a
single resolver. The resolver must support two modes:

- default in-repo instance: `site/`;
- external proof instance: `SITE_INSTANCE_ROOT=/absolute/or/relative/path`.

The resolver should expose:

```ts
interface SiteInstancePaths {
  root: string;
  config: {
    site: string;
  };
  content: {
    announcements: string;
    articles: string;
    authors: string;
    categories: string;
    collections: string;
    pages: string;
  };
  assets: {
    root: string;
    articles: string;
    shared: string;
    site: string;
  };
  public: string;
  unusedAssets: string;
}
```

Paths should be absolute when passed to Node filesystem APIs. Astro loader
bases and Vite aliases may use absolute paths as well, because that is the only
shape that can support external instances without guessing the current working
directory.

The resolver should not import site config. Config loading imports the resolver,
not the other way around.

## Migration Invariants

- Route URLs do not change.
- Content entry IDs do not change.
- Article category derivation continues to come from the article file path
  relative to the configured article root.
- Markdown image references continue working by preserving the sibling
  `content/` and `assets/` relationship under `site/`.
- MDX imports use a documented site-asset alias rather than reaching into
  platform internals.
- `astro:assets` still processes article images, home images, CTA brand assets,
  fallback social images, and catalog fixtures.
- `site/public/` files still copy to the output root.
- Generated PDFs remain next to article HTML output.
- Scripts report editor-facing paths under `site/` instead of stale
  `src/content` or `src/assets` paths.
- `site/unused-assets` stays out of the build and remains subject to
  duplicate-image review.

## MDX Asset Imports

Markdown image references can move without content rewrites because their
relative path remains `../../../assets/...` or `../../assets/...`.

MDX import statements are different because they are module imports. They should
move from relative `../../../assets/...` imports to a site-owned alias:

```ts
import articleImage01 from "@site/assets/articles/example/image.png";
```

This keeps MDX as an advanced authoring escape hatch while avoiding imports that
look like platform internals.

## Astro Config Requirements

Astro must be configured so:

- content collection loaders read from resolver-backed paths;
- Vite allows access to the current site-instance root;
- Vite resolves `@site/assets` for MDX and platform asset imports;
- Astro `publicDir` points at `site/public`.
- Astro image processing allows trusted local SVG sources, because site
  instances and platform catalog fixtures may use SVGs as normal image metadata.
  Do not treat this as permission to process untrusted user-uploaded SVGs
  without a separate sanitization boundary.

The platform should not rely on `src/assets` after the migration.

## Script Requirements

Repository scripts should keep their command names, but path knowledge should
move into resolver-backed defaults:

- content verification;
- tag normalization;
- article reference audits;
- PDF generation;
- asset location verification;
- shared/unused/duplicate asset checks;
- build verification;
- Pagefind indexing;
- HTML validation;
- accountability ignores.

Tests that intentionally exercise generic helpers may keep synthetic
`src/assets` strings only when the string is local test data and not a default
project path.

## External Instance Proof

The production move is in-repo first. External support is a proof milestone,
not a separate repo split yet.

The repeatable proof lives at `tests/fixtures/site-instance/`. It includes a
small non-TPM site config, public files, homepage content, one announcement,
one article, one author profile, one category, and the required homepage
collections. The resolver test parses that config and runs the normal content
verifier against the fixture paths, proving core config/content/path logic can
operate outside both `src/` and the live `site/` directory.

The stronger proof is a full fixture build:

```sh
just test-site-instance
```

That command sets `SITE_INSTANCE_ROOT=tests/fixtures/site-instance` and runs the
normal production build path. It exists to catch platform code that still
imports TPM-named assets, assumes live site content, or depends on the in-repo
`site/` instance.

Current limitations are explicit:

- MDX remains an advanced escape hatch. External production instances will need
  the same `@site/assets` alias contract and platform component imports.
- Site-specific theme tokens now live in site-instance `theme.css`; a future
  GUI can generate that file from a friendlier structured theme editor.
- CI for a true two-repository deployment still needs a checkout recipe that
  places the platform and site instance beside each other before running the
  same `SITE_INSTANCE_ROOT` build.

## Critical Review

The main risk is moving files before the resolver is real. That would replace
old hard-coded paths with new hard-coded paths and fail the platform goal.

The second risk is treating MDX like ordinary Markdown. MDX imports are code,
so they need a stable site-asset alias and a documented advanced-authoring
contract.

The third risk is overfitting scripts to the current in-repo `site/` layout.
Use the resolver everywhere practical so `SITE_INSTANCE_ROOT` can work later.

The fourth risk is doing a huge rename and a huge behavior refactor in the same
step. Keep the file move behavior-preserving: no route changes, no content
rewrites except MDX import paths, no visual redesign.
