# Package Boundaries And Extraction Criteria

This document completes the design pass for `IRK-112`. It identifies internal
package-boundary candidates and defines the criteria that must be met before
any domain is treated as extractable.

The goal is not to publish packages immediately. The goal is to make reusable
subdomains explicit enough that future package, Astro integration, CLI, MCP,
and studio work starts from proven seams instead of package theater.

## Design Principles

- Keep TPM content, copy, URLs, assets, and publication identity out of
  reusable boundaries.
- Prefer one canonical domain model over surface-specific duplicates.
- Separate pure core logic from Astro, DOM, filesystem, process, provider, and
  network adapters.
- Prove a boundary internally before publishing it externally.
- Require at least one real consumer and fixture coverage before extraction.
- Treat an extraction candidate as rejected until it names a domain, API,
  consumers, diagnostics, tests, and blockers.

## Boundary Ladder

Use the smallest boundary that gives the repo useful discipline.

1. **Local domain module:** a normal `src/lib` module or focused script module
   with clear tests.
2. **Internal public entrypoint:** a stable import path used by more than one
   internal consumer.
3. **Private workspace package:** a package-like boundary used by fixtures,
   examples, scripts, or future studio code, but not published.
4. **Astro library:** reusable Astro components or helpers that do not require
   build hooks.
5. **Astro integration:** reusable behavior that needs Astro build hooks,
   config, Markdown/MDX integration, assets, or route integration.
6. **CLI/report package:** reusable validation, migration, audit, or reporting
   tooling.
7. **Framework-agnostic core:** pure logic reusable by Astro, Next, CLI, MCP,
   tests, and future GUI code through adapters.
8. **Environment-agnostic core:** pure logic that does not assume Node, Bun,
   browser, Workers, filesystem, DOM, or process state.
9. **Product-agnostic library:** a domain that can reasonably serve projects
   beyond static editorial publishing.

Most domains should stop at step 1 or 2 for now. Extraction is earned by
consumer evidence, not by conceptual neatness.

## Readiness Criteria

A candidate is ready for an internal public entrypoint when it has:

- a domain-specific name and purpose;
- typed input and output contracts;
- no hidden dependency on TPM source, active `site/`, current working
  directory, or singleton config unless declared as an adapter;
- source or output diagnostics where failure affects authors or generated
  artifacts;
- focused unit tests and at least one higher-level consumer test;
- documentation that names ownership, supported use, and non-goals.

A candidate is ready for a private workspace package only after it also has:

- at least two internal consumers or one internal consumer plus one fixture or
  example site;
- import-boundary tests proving dependencies are intentional;
- API snapshots or public-shape tests where useful;
- stable fixture data that does not depend on TPM content;
- a versioning and migration note for expected future callers.

A candidate is ready for external publishing only after it also has:

- a documented public API;
- compatibility policy;
- changelog expectations;
- independent usage examples;
- no private repo paths or site-instance assumptions;
- a clear support boundary.

## Candidate Matrix

| Domain                                    | Current evidence                                                       | Target boundary                                                             | Readiness   | Next proof                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| Site config and platform context          | `site-config`, `site-instance`, `platform-context`, fixture site tests | Framework-light platform core plus site-instance adapters                   | Medium-high | Add explicit internal entrypoint and second fixture-site consumer                                          |
| Source and artifact lifecycle             | `source-artifacts`, generated-output verifiers, asset scripts          | Framework-agnostic core with filesystem adapters                            | Medium-high | Prove all artifact ownership checks consume one manifest contract                                          |
| Route, feature, and entity registry       | `route-registry`, `routes`, `feature-routes`, route tests              | Framework-agnostic route core plus Astro route adapter                      | Medium      | Add entrypoint that route generation, sitemap, feed, and diagnostics all consume                           |
| Article compiler artifact                 | `article-compiler`, article pages, PDF, TOC, references                | Static editorial compiler domain with Astro content adapter                 | Medium      | Add non-rendering artifact fixtures for Markdown, MDX, references, media, and PDF                          |
| Publishable entries and route view models | `publishable`, listing/home/route view models                          | Site-agnostic editorial platform module                                     | Medium      | Prove homepage, archive, RSS, search, and fixture site use one view-model contract                         |
| Metadata and semantic profiles            | `metadata-graph`, `semantic-metadata`, `metadata`, SEO components      | Framework-agnostic metadata graph plus Astro head adapter                   | Medium-high | Add entrypoint consumed by Astro head, JSON-LD, Scholar, social previews, feeds, PDFs                      |
| References, citations, and bibliography   | `article-references`, `bibliography`, citation exports, audit scripts  | Product-agnostic scholarly reference core plus static-site adapters and CLI | High        | Split pure parsing/normalization/export from Astro/article rendering adapters                              |
| Media policy and social images            | `media-policy`, `social-images`, PDF/image/embed helpers               | Framework-agnostic media policy core plus Astro image/PDF/embed adapters    | Medium      | Prove media role decisions do not depend on physical repo paths                                            |
| PDF and scholarly artifacts               | `article-pdf`, PDF compatibility, generation script                    | Optional official artifact extension                                        | Medium      | Express PDF output ownership, size budget, fallback policy, and verifier hooks as a manifest-like contract |
| Generated-output verification             | `output-verification`, modular `scripts/build/verify-build/*`          | Static-output verifier core plus CLI/report adapters                        | Medium-high | Route all release and site-doctor diagnostics through a shared diagnostic identity model                   |
| Author diagnostics and site doctor        | `author-diagnostics`, `site-doctor`, generated references              | Author diagnostic core plus CLI/GUI adapters                                | Medium      | Consume site doctor checks through the same diagnostic taxonomy as generated-output verification           |
| Performance and payload tooling           | `performance-budgets`, `performance-workbench`, payload scripts        | CLI/report package with static-site adapters                                | Medium      | Add stable report contract and fixture inputs independent of one live scan output                          |
| Interaction primitives                    | `anchored-positioning`, `anchored-disclosure`, browser scripts         | Environment-agnostic state/geometry core plus DOM adapter                   | Medium-high | Keep DOM loading and browser storage outside pure positioning/disclosure logic                             |
| UI primitives and component catalog       | `components/ui`, `components/layout`, catalog examples                 | Astro component library candidate                                           | Medium-low  | Prove site-neutral fixtures and docs before any package boundary                                           |
| Import/export and migration               | citation audits, migration scripts, source/artifact contracts          | CLI/report domain plus platform migration core                              | Low-medium  | Define canonical import/export envelope before implementation packages                                     |
| Localization contracts                    | metadata, route, date, label, PDF, feed behavior                       | Platform config/content domain plus UI/layout fixtures                      | Low-medium  | Define typed locale model and fixture states before extraction                                             |

## Explicit Non-Candidates For Now

These areas should remain local until they have clearer consumers:

- TPM-specific homepage composition and support CTAs.
- One-off content migrations that do not preserve a general import/export
  format.
- Site-specific MDX components with no declared fallback, schema, or generated
  artifact behavior.
- Raw page route files that still orchestrate site-specific layout.
- Any helper whose only API would be generic names such as `getItems` or
  `makeUrl`.

## Internal Entrypoint Shape

Internal entrypoints should be boring and deliberate:

```ts
export type { MetadataGraph, MetadataProfile } from "./metadata/types";
export { createMetadataGraph } from "./metadata/create-metadata-graph";
export { renderAstroHeadMetadata } from "./metadata/astro-head-adapter";
```

Avoid barrel files that export every implementation detail. Entry points should
export domain contracts, constructors, and adapter functions, not incidental
helpers.

## Dependency Rules

- Pure cores may not import Astro, DOM, filesystem, process, provider SDKs,
  current working directory, or `site/`.
- Astro adapters may import Astro-specific APIs but should depend on pure cores
  for domain logic.
- CLI adapters may read files and environment, but should delegate validation,
  normalization, and diagnostics to pure logic.
- Site extensions may depend on site-owned assets and copy, but they should not
  leak those assumptions into platform entrypoints.
- Diagnostics should cross boundaries as structured values, not printed text.

## Verification Plan

For `IRK-113`, implementation should add:

- import-boundary tests for each accepted entrypoint;
- fixture-site imports from non-TPM examples;
- public-shape tests for entrypoints that downstream tooling will consume;
- negative tests for TPM leakage into reusable modules;
- one pure-core test that runs without Astro or filesystem IO for each
  framework-agnostic candidate.

For this design issue, the verification artifact is this matrix plus the
readiness criteria above. It names what can be extracted, what cannot, and what
proof is still missing.

## IRK-113 Accepted Entrypoints

The first internal entrypoint pass accepts only domains that can already be
used without TPM content or concrete route files:

- diagnostics;
- interaction primitives;
- media policy;
- article references and citation source normalization;
- route registry helpers.

Active site config, current site instance paths, publishable entry loaders,
article compilation, bibliography aggregation, and metadata head rendering are
not exposed as platform entrypoints yet when doing so would import active-site
singletons or Astro collection adapters. They remain valid extraction
candidates, but they need an explicit context split before becoming internal
public APIs.

## IRK-114 Consumer Evidence

`examples/platform-entrypoint-consumer/` is the first non-TPM consumer of the
accepted entrypoints. It is not a starter template. It is a small package-seam
proof that imports only `src/platform/*` and produces deterministic facts from
diagnostics, interaction primitives, media policy, article references, and
route helpers.

This example gives each accepted candidate current evidence:

| Entrypoint                  | Consumer evidence                                               | Portability target                                 | Remaining blockers                                                                   |
| --------------------------- | --------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/platform/diagnostics`  | Example report emits a structured diagnostic identity.          | CLI, MCP, GUI diagnostics, verifier packages       | Broader diagnostic registry and release-report ownership in later milestones.        |
| `src/platform/interactions` | Example report computes anchored placement without DOM runtime. | UI library core plus DOM/browser adapters          | Browser loader and custom element APIs stay adapter-owned.                           |
| `src/platform/media`        | Example report resolves alt-text policy and embed provider.     | Media policy core plus Astro/PDF/provider adapters | Remote asset provider and provenance policy remain future extension/adapter work.    |
| `src/platform/references`   | Example report parses BibTeX and emits a stable citation key.   | Scholarly reference core plus static-site adapters | Article rendering and bibliography aggregation still have collection-route adapters. |
| `src/platform/routes`       | Example report maps a route to generated output path facts.     | Route registry core plus Astro route adapters      | Full page/file-route generation still belongs to Astro route files.                  |

The example is covered by tests that execute it and scan it for accidental TPM
imports or publication-specific literals. This keeps the package-boundary proof
concrete without publishing external packages prematurely.
