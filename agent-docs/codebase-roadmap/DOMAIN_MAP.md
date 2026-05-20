# Domain Map

This document maps the platform's domains and subdomains to current repo files,
desired boundaries, and possible future extraction paths.

## Platform Domain Hierarchy

The repo should be understood as a hierarchy of domains. The top level is the
blog platform product, not a single site.

```text
Blog platform
  Site instance
    identity, theme, config, redirects, public files
    content, authors, categories, collections, assets
    author workflow and site-owner workflow
  Platform generator
    route registry and static output
    content compiler and publishable model
    article renderer and page recipes
    metadata, SEO, social previews, and machine readability
    references, citations, bibliography, and scholarly output
    interaction primitives and hydrated controllers
    component system and catalog
    generated-output verification
    performance and payload tooling
    extension points and plugin manifests
    deployment adapters and release governance
    security, privacy, and trust policy
    observability and webmaster intelligence
    import/export and migration portability
    localization and inclusive defaults
    starter templates and distribution
    test fixtures and quality gates
    public docs and developer tooling
```

The target architecture should let developers express work in the vocabulary of
one subdomain at a time. A feature should say "add a semantic profile", "add a
publishable surface", "add a route feature", or "add an article compiler
artifact" rather than requiring edits across unrelated code.

## Current Domain Ownership

| Domain                           | Current source paths                                                                                                                                                             | Current responsibility                                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Site instance                    | `site/**`, `src/lib/site-config.ts`, `src/lib/site-instance.ts`                                                                                                                  | Active publication config, content, theme, assets, redirects, and public files.                                                                        |
| Content schemas and loaders      | `src/content.config.ts`, `src/lib/content-schemas.ts`, `src/lib/content.ts`, `src/lib/routes.ts`                                                                                 | Astro collection definitions, frontmatter validation, published content loading, slug and URL helpers.                                                 |
| Publishable entries              | `src/lib/publishable.ts`, `src/lib/archive.ts`, `src/lib/feed.ts`, `src/lib/home.ts`, `src/lib/article-list.ts`                                                                  | Normalize articles and announcements for directories, home, feed, lists, and related surfaces.                                                         |
| Routes and features              | `src/pages/**`, `src/lib/routes.ts`, `src/lib/feature-routes.ts`, `src/lib/static-paths.ts`, `src/lib/site-redirects.ts`                                                         | Static routes, optional route ownership, canonical URL helpers, generated redirects.                                                                   |
| Metadata and machine readability | `src/lib/metadata.ts`, `src/lib/semantic-metadata.ts`, `src/lib/seo.ts`, `src/components/seo/**`                                                                                 | Route metadata, robots policy, JSON-LD, social metadata, Scholar metadata.                                                                             |
| Article rendering                | `src/layouts/ArticleLayout.astro`, `src/lib/article-page-view-model.ts`, `src/lib/article-view.ts`, `src/lib/article-toc.ts`, `src/components/articles/**`                       | Article page data, article header, prose, images, TOC, references, endcaps, sharing, PDF link.                                                         |
| References and bibliography      | `src/lib/article-references/**`, `src/lib/bibliography.ts`, `src/lib/citations/article-citation.ts`, `src/remark-plugins/articleReferences.ts`, `src/components/bibliography/**` | Notes, citations, BibTeX parsing, bibliography aggregation, cite menu output.                                                                          |
| PDF and scholarly output         | `src/lib/article-pdf.ts`, `src/lib/article-pdf-compatibility.ts`, `scripts/build/generate-article-pdfs.ts`, `src/styles/print.css`                                               | PDF eligibility, Scholar metadata, print/PDF fallback rules, PDF generation.                                                                           |
| Media and assets                 | `src/lib/social-images.ts`, `src/lib/article-image-policy.ts`, `src/lib/embed-media.ts`, `src/components/media/**`, `scripts/assets/**`                                          | Optimized images, social previews, article image policy, embeds, asset audits.                                                                         |
| Layout and visual primitives     | `src/components/layout/**`, `src/components/ui/**`, `src/components/blocks/**`, `src/styles/global.css`, `site/theme.css`                                                        | Page frames, section stacks, buttons, rails, blocks, theme tokens, responsive layout.                                                                  |
| Interactions                     | `src/scripts/**`, `src/lib/anchored-positioning.ts`, `src/lib/anchored-disclosure.ts`, interaction components                                                                    | Anchored panels, disclosure, image inspector, share menu, carousel, scroll rail, search, theme, header offset.                                         |
| Generated-output tooling         | `scripts/build/**`, `scripts/content/**`, `scripts/site/**`, `scripts/quality/**`, `scripts/testing/**`                                                                          | Build verification, PDF generation, content checks, site doctor, quality runner, coverage/test accountability.                                         |
| Tests and fixtures               | `tests/**`, `tests/fixtures/**`, `examples/docs-site/**`, `src/pages/catalog/**`                                                                                                 | Component tests, script tests, e2e, a11y, catalog proof, external site-instance proof.                                                                 |
| Documentation                    | `README.md`, `site/README.md`, `AUTHOR_TUTORIAL.md`, `docs/**`, `agent-docs/**`, `examples/docs-site/**`                                                                         | Author guidance, platform docs, design docs, audits, generated component docs, future public docs site.                                                |
| Mature product surfaces          | Future work spanning route/content/config/tooling contracts                                                                                                                      | Extension architecture, authoring studio, import/export, deployment adapters, security/privacy, observability, localization, and starter distribution. |

## Target Domain Boundaries

- Site-specific values should enter the platform through a typed context:
  identity, routes, features, content defaults, support actions, share targets,
  theme contract, and output paths. Singleton imports should be limited to
  route/layout integration and config bootstrap modules.
- Route ownership should be declared once. The registry should describe route
  key, path, output kind, feature flag, sitemap behavior, feed behavior,
  Pagefind behavior, metadata defaults, static path generator, redirect
  behavior, and docs label.
- The content compiler should produce a typed artifact for each publishable
  page. That artifact should include body HTML, headings, references, images,
  embeds, compatibility notes, generated sections, and machine-readable
  metadata.
- Visual components should consume view models and semantic primitives.
  Components should not load content, read site config, or infer URL policy.
- Build scripts should use shared source readers, route registries, and
  compiler artifacts. Scripts should produce structured diagnostics that can be
  rendered for humans, consumed by CI, and reused by future GUI tooling.
- Metadata should be profile-driven. A route can opt into article, review,
  event, dataset, software, FAQ, collection, author, organization, citation
  source, or future profiles without custom page code.
- Responsive layout should be solved through named primitives and recipes:
  reading body, browsing body, section stack, split heading, horizontal rail,
  media frame, action row, endcap stack, content rail, and page frame.
- Author workflow should sit on the same typed contracts as the platform:
  schemas, site doctor, article submission checks, previews, generated docs,
  and validation should use the same domain models.
- Extractable modules should first become internal packages or clearly named
  subdirectories with public entrypoints, then later become Astro integrations
  or standalone packages if they prove useful outside this repo.
- Mature product surfaces should consume the same registries, schemas,
  diagnostics, manifests, and source maps as the core platform. Future editor,
  extension, deployment, import/export, observability, and starter-template
  work should not create parallel representations of content, routes, config,
  or generated output.

## Extractability Candidates

| Candidate                              | Why it is promising                                                                                             | Target form                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Anchored positioning and disclosure    | Pure engine, typed presets, lazy loader, multiple UI consumers, strong tests.                                   | Internal package, later standalone UI utility.                  |
| Metadata and semantic profiles         | Broad platform value, validated frontmatter profiles, JSON-LD output, social/SEO/Scholar needs.                 | Internal `metadata` package, later Astro integration.           |
| Article references and bibliography    | Complex parser/normalizer, BibTeX support, article and sitewide outputs, author docs.                           | Internal references package, later content plugin.              |
| Generated-output verifier              | Monolithic script already validates many static-site contracts.                                                 | Internal CLI package with plugin-style verifiers.               |
| Site config and site doctor            | Validated config, schema generation, feature flags, future GUI readiness.                                       | Internal config package plus author CLI.                        |
| PDF and scholarly export               | Scholar metadata, print CSS, PDF generation, MDX compatibility registry.                                        | Internal scholarly-output package.                              |
| Route and feature registry             | Core to platform configurability and optional surfaces.                                                         | Internal route registry package.                                |
| Asset and social image pipeline        | Optimized social images, asset audits, public/static contracts.                                                 | Internal asset pipeline package.                                |
| Component catalog and docs generator   | Broad component inventory, tests, generated docs, public docs site seed.                                        | Platform catalog module and docs-site generator.                |
| Publishable entry model                | Articles, announcements, collections, feeds, lists, related entries.                                            | Internal content-display package.                               |
| Extension registry and plugin contract | Needed for future content kinds, verifiers, metadata profiles, routes, media policies, and deployment adapters. | Internal extension API, later Astro integration/plugin surface. |
| Deployment adapter and release tools   | Host-specific headers, redirects, cache behavior, release reports, and compatibility policy.                    | Internal deployment package, later host adapter package.        |
| Authoring studio data model            | Future GUI/admin needs schema-driven forms, previews, diagnostics, drafts, and PR workflows.                    | Internal editor-model package and GUI/API contract.             |
| Import/export and migration toolkit    | Legacy migrations, source maps, round-trip portability, and external archive support.                           | Internal migration CLI and portable content manifest.           |
| Security/privacy policy engine         | CSP, third-party origins, embeds, analytics, trust boundaries, and dependency posture.                          | Internal policy/verifier package.                               |
| Observability diagnostics              | Cloudflare/Search Console/Bing/Lighthouse/link-scan reports can feed structured remediation.                    | Internal diagnostics package and static reports.                |
| Localization contract                  | Locale, language, direction, alternate routes, PDF/feed/metadata language, and translated layout stress tests.  | Internal i18n contract before optional integration.             |
| Starter template system                | New site instances need scaffoldable, verified, site-neutral examples.                                          | Platform starter package and docs-site workflow.                |
