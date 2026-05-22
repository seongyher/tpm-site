# Checklist

This file tracks implementation milestones. It may keep completed items when
they are useful context. Explicitly deferred work belongs in
[DEFERRED.md](./DEFERRED.md).

## Working Rules

- Move postponed work to `DEFERRED.md` with a resume trigger instead of leaving
  stale unchecked milestones here.
- Move deferred work back into this file before implementation begins.
- Add or update design docs before implementing new components, substantial
  layout behavior, or non-component technical systems.
- Verify each milestone before marking it complete.
- Do not edit `site/content/articles/` unless the current task explicitly asks
  for article-content changes.

## Active Milestone 5 Execution

Milestone 5 is the distribution and ecosystem readiness layer. It should finish
the platform seams needed before the static blog studio product work begins.
Studio GUI/CLI/MCP product issues live in Milestone 6, not here.

### Milestone 254: Progressive Adoption And Extension Scope

- [x] Re-read the studio vision, adapter model, roadmap extension section, and
      current product-planning notes about default-to-enterprise user journeys.
- [x] Define the documentation updates needed for progressive adoption, domain
      setup boundaries, bundled extensions, custom UI components, and
      extension/package seams.
- [x] Verify this remains a documentation/design pass only, with no Linear
      issue updates or implementation changes.
      This pass will add a focused studio extension model doc, update the
      studio product vision with the adoption ladder and domain boundaries, and
      align the roadmap extension milestone around concrete bundled and custom
      extension examples.

### Milestone 255: Studio Extension Architecture Documentation

- [x] Write or update docs that define core, official bundled extensions,
      optional official extensions, site extensions, and third-party/custom
      extensions.
- [x] Capture extension contracts for UI components, deploy providers, media
      providers, PDF generation, metadata profiles, importers, verifiers, and
      diagnostics.
- [x] Critique the model against concrete examples such as Patreon/Discord
      buttons, PDF generation, Cloudflare deploy, GitHub Pages/CNAME, and
      custom MDX/editor components.
      Added `agent-docs/STUDIO_EXTENSION_MODEL.md` and linked it from
      `AGENTS.md`. The model defines core, bundled default, optional official,
      site, and third-party extension classes, plus manifest, capability,
      UI-component, artifact, deploy/domain, migration, and trust contracts.

### Milestone 256: Progressive Adoption Roadmap Alignment

- [x] Update the studio product vision so the default journey can upgrade from
      local one-click publishing to backup, external media, collaboration,
      automated publishing, and complex publisher integrations.
- [x] Update the platform roadmap and related docs so extension architecture,
      adapters, domain setup, and migration tooling support the adoption ladder.
- [x] Verify the docs explain what is core, what is bundled by default, and
      what should remain replaceable.
      Updated `agent-docs/STUDIO_PRODUCT_VISION.md`,
      `agent-docs/STUDIO_ADAPTER_MODEL.md`, and
      `agent-docs/PLATFORM_ROADMAP.md` with the adoption ladder, domain setup
      boundary, extension linkages, concrete bundled-extension candidates, and
      migration hooks for backup, media, collaboration, and automated publish.

### Milestone 257: Extension Vision Documentation Verification

- [x] Run focused documentation checks for the new and updated docs.
- [x] Inspect the docs for overfitting, overgeneralization, ambiguous extension
      boundaries, and missing migration paths.
- [x] Update this checklist with completion notes and leave Linear issue
      updates for the later planning pass.
      Verified with `bun --silent run review:markdown` and `git diff --check`.
      The final pass added the default Cloudflare launch scenario while keeping
      Cloudflare as a bundled deploy extension, not core. Linear issue updates
      remain intentionally untouched.

### Milestone 258: Milestone 5 Parallel Track Planning

- [x] Re-read the engineering philosophy, platform roadmap, studio product
      vision, adapter model, extension model, and the unblocked Milestone 5
      Linear issues before changing docs.
- [x] Break `IRK-112`, `IRK-118`, `IRK-126`, and `IRK-129` into granular
      checklist milestones with explicit design outputs and verification.
- [x] Verify the Milestone 5 parallel track only covers work that does not
      depend on unfinished Milestone 4 issues.
      The active Milestone 5 track is limited to `IRK-112`, `IRK-118`,
      `IRK-126`, and `IRK-129`; extension architecture, security enforcement,
      starter templates, and studio architecture remain downstream or
      prep-only until their blockers are complete.

### Milestone 259: IRK-112 Package Boundary And Extraction Criteria Design

- [x] Inventory internal extraction candidates across config, routes, compiler,
      metadata, references, media, interactions, generated-output verification,
      diagnostics, testing, and performance tooling.
- [x] Define portability targets, extraction readiness criteria, current
      consumers, dependency boundaries, and missing blockers for each candidate.
- [x] Verify the candidate matrix rejects vague package extraction and is
      traceable to the roadmap and engineering philosophy.
      Added `docs/PACKAGE_BOUNDARIES_AND_EXTRACTION_CRITERIA.md` with a
      boundary ladder, readiness criteria, candidate matrix, explicit
      non-candidates, dependency rules, and verification plan for later
      entrypoint/package work.

### Milestone 260: IRK-118 Deployment Adapter And Release Artifact Design

- [x] Define deployment adapter inputs, outputs, capability reporting,
      credential requirements, dry-run behavior, unsupported-operation
      diagnostics, and provider-owned manual steps.
- [x] Define the release artifact contract for route, redirect, metadata,
      payload, dependency, generated-output, launch-step, provider diagnostic,
      and release-health reports.
- [x] Verify Cloudflare remains the reference bundled adapter while static
      folder export and GitHub Pages-style deployments remain possible through
      the same contract.
      Added `docs/DEPLOYMENT_ADAPTER_CONTRACT.md` with release artifact
      schema groups, adapter request/result contracts, capability reporting,
      product actions, provider profiles, diagnostics, and implementation
      verification fixtures.

### Milestone 261: IRK-126 Import/Export And Preservation Design

- [x] Define canonical import/export envelopes for content, authors, taxonomy,
      collections, assets, redirects, citations, PDFs, generated metadata, and
      platform diagnostics.
- [x] Define source maps, preservation records, migration reports, human-review
      queues, and stable/experimental field policy for migration tooling.
- [x] Verify the format supports round-trip fixtures and legacy-source
      migration without turning migrations into one-off scripts.
      Added `docs/IMPORT_EXPORT_AND_PRESERVATION_POLICY.md` with a canonical
      export envelope, record kinds, source maps, preservation states, review
      queues, asset/citation policies, security constraints, and round-trip
      verification plan.

### Milestone 262: IRK-129 Localization Contract Design

- [x] Define locale, language, text direction, formatting, route-prefix,
      feed/sitemap, metadata, PDF, alternate-route, and localized-label
      contracts.
- [x] Identify current English/date/string assumptions that future
      implementation must migrate behind typed locale helpers or config.
- [x] Verify single-locale sites stay simple while non-English, multilingual,
      and RTL fixture states have a clear path.
      Added `docs/LOCALIZATION_CONTRACTS.md` with locale profiles, content
      locale behavior, route modes, metadata propagation, label registry,
      formatting policy, RTL considerations, diagnostics, and fixture plan.

### Milestone 263: Milestone 5 Parallel Track Verification

- [x] Run focused documentation checks for the new Milestone 5 design docs.
- [x] Review the docs together for consistency, missing blockers, premature
      implementation promises, and conflicts with the studio adapter/extension
      model.
- [x] Update this checklist with completion notes and leave downstream
      implementation issues blocked until their design dependencies are done.
      Verification passed with `bun --silent run review:markdown` and
      `git diff --check`. The four design docs stay at the contract/planning
      layer and leave implementation, packaging, adapters, migrations, and
      localization fixtures to downstream issues.

### Milestone 264: Metadata Schema Contract Audit And Enforcement

- [x] Audit every emitted metadata surface against authoritative contracts:
      Schema.org JSON-LD, Google structured data, Google Scholar, Open Graph,
      Twitter cards, RSS, sitemap, canonical URLs, and robots metadata.
- [x] Document the metadata schema contracts in `docs/` with authoritative
      source links, required fields, recommended fields, source data,
      fallbacks, and enforcement strategy.
- [x] Fix the known `ProfilePage.mainEntity` rich-result issue and any other
      concrete metadata defects found during the audit.
- [x] Add typed metadata builders, validators, verifier checks, or tests that
      make documented metadata contracts difficult or impossible to violate.
- [x] Run focused metadata verification and the relevant release checks before
      marking the milestone complete.

### Milestone 265: IRK-148 Repository Organization Design

- [x] Re-read the repository philosophy, platform module map, documentation
      lifecycle, package-boundary guidance, and current filesystem shape.
- [x] Write a durable repository organization plan that names the ideal target
      shape, accepted moves, rejected moves, risks, and verification order.
- [x] Verify the plan preserves platform/site boundaries and avoids cosmetic
      churn where a directory is already serving its purpose.
      Added `docs/REPO_ORGANIZATION.md` as the durable target plan. The plan
      keeps `site/`, `src/pages/`, `src/platform/`, layouts, styles, scripts,
      and examples stable while prioritizing domain-owned `src/lib` folders and
      oversized component groups.

### Milestone 266: IRK-148 Platform Library Domain Move

- [x] Move `src/lib` modules and mirrored `tests/src/lib` tests into platform
      domain folders that match the documented module map.
- [x] Update all imports, platform entrypoints, docs generation, scripts, and
      platform-boundary ownership to use the new domain paths.
- [x] Verify focused platform/library checks before proceeding to component or
      documentation path moves.
      Moved `src/lib` into documented domains such as `articles`, `content`,
      `metadata`, `references`, `routes`, `site`, and `studio`, with mirrored
      `tests/src/lib` paths. Updated imports, platform entrypoints, generated
      references, `knip.ts`, and platform-boundary ownership. Verified with
      `bun --silent run typecheck`, `bun --silent run platform:check`, focused
      library tests, and `bun --silent run check:fast`.

### Milestone 267: IRK-148 Component Directory Organization

- [x] Evaluate `src/components/blocks` and `src/components/articles` for
      domain subfolders that improve navigation without weakening catalog,
      docs, or test accountability.
- [x] Move approved low-risk component groups with mirrored component docs and
      tests where practical.
- [x] Verify catalog/component checks catch path drift and preserve public
      component contracts.
      Split `src/components/blocks` into `home`, `listing`, `shared`, and
      `terms`. Split `src/components/articles` into `actions`, `endcap`,
      `header`, `lists`, `media`, `prose`, `references`, and `toc`. Mirrored
      component tests and docs, then updated catalog examples/config paths.
      Verified with focused component/catalog tests and `check:fast`.

### Milestone 268: IRK-148 Documentation Directory Organization

- [x] Group durable docs by audience and contract type while preserving
      generated docs, component docs, and public docs-site expectations.
- [x] Move historical audits and migration evidence away from current contract
      docs without losing useful provenance.
- [x] Update cross-links, generated references, `AGENTS.md`, and documentation
      lifecycle guidance after any accepted doc moves.
      Documented the target docs grouping in `docs/REPO_ORGANIZATION.md` and
      kept root-level historical docs stable in this pass to avoid combining
      source moves with broad link churn. Updated `AGENTS.md`,
      `docs/PLATFORM_MODULES.md`, generated platform references, component
      docs, and current path references.

### Milestone 269: IRK-148 Final Verification And Handoff

- [x] Run focused checks for moved domains and `bun --silent run check:fast`.
- [x] Run broader checks if public output, generated references, content
      loading, or component catalog surfaces were touched heavily.
- [x] Update Linear status/documentation references after the repository
      organization work is verified.
      Verified with `bun --silent run typecheck`,
      `bun --silent run platform:check`, focused component/catalog/library
      tests, `bun --silent run check:fast`, `bun --silent run review:markdown`,
      and `git diff --check`. Full release checks were not required because
      this pass reorganized source/docs paths without changing public route or
      content behavior. IRK-148 is in review with the repository organization
      plan attached and a verification summary comment.
