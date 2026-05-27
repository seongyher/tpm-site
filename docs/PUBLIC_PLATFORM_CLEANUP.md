# Public Platform Cleanup

The reusable platform should be able to demonstrate and test itself without
requiring The Philosopher's Meme content, assets, support links, or editorial
voice. TPM remains the live default site instance, but platform-owned review
surfaces should use platform fixture data.

## Design Goals

- Keep `site/` as the TPM instance and `examples/docs-site/` as the neutral
  platform documentation instance.
- Make the private component catalog a platform QA surface, not a TPM-branded
  page with live-site image dependencies.
- Keep catalog examples realistic enough to catch layout failures while avoiding
  article titles, URLs, handles, and assets from the live TPM site.
- Prove that catalog-enabled builds work with an external site instance, because
  the catalog should exercise platform components independently from one site's
  assets.
- Keep CI additions narrow: one extra catalog-enabled external fixture build is
  enough to prove the boundary without duplicating all catalog e2e coverage.

## Decisions

### Component Catalog

The catalog is platform-owned. It should import fixture assets from
`src/catalog/assets/`, not `@site/assets`. The active site instance may still
provide theme tokens, authors, routes, and feature config, but missing TPM
images must not break catalog builds.

`src/catalog/assets/` is an explicit asset-location exception because these are
platform QA fixtures, not author-managed site assets. Article-image examples
use small raster fixtures so the catalog exercises the same optimized image
layout path as real articles.

Catalog copy should use neutral examples such as "Catalog Review Site" and
`example.com` URLs. This keeps the catalog useful as a public-engine regression
surface and lets `platform-check` scan catalog code for site-specific literals.

The catalog build flag is renamed to `PLATFORM_COMPONENT_CATALOG`. The tracked
`.env.catalog` file owns that detail for normal scripts, so users keep running
`just catalog-dev`, `just catalog-build`, and `just test-catalog`.

### Docs Site

The docs example site should not be branded as TPM. It should read as a generic
example for the reusable blog platform. Its identity, hero asset, favicon label,
and support copy should use "Blog Platform" or "Platform Docs" language.

### External Instance Proof

Add a small catalog-enabled fixture build using
`SITE_INSTANCE_ROOT=tests/fixtures/site-instance`. This proves the catalog can
compile when the active site instance lacks TPM-specific shared assets.

The existing full catalog e2e test remains scoped to the default catalog build.
The external proof only needs to build, because the failure mode being closed is
compile-time asset coupling.

## Non-Goals

- Do not redesign the visual catalog UI.
- Do not make the catalog public.
- Do not move all TPM-specific component tests in this pass. Tests that
  deliberately verify the live TPM instance can remain instance tests.
- Do not resume deferred citation locator or source appendix work.

## Implementation Milestones

1. Replace catalog site-asset imports with local platform fixture assets.
2. Replace catalog hard-coded TPM titles, URLs, support links, and share handles
   with neutral fixture data.
3. Rename catalog metadata and the environment flag to platform terminology.
4. Rename the docs-site identity and hero copy to neutral platform language.
5. Include catalog source files in `platform-check`.
6. Add `test-catalog-site-instance` and run it in catalog CI and release checks.
7. Verify with focused catalog tests, platform boundary checks, docs-site and
   fixture catalog builds, then the normal build gates.
