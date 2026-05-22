# Documentation Lifecycle

This document defines how platform documentation should be owned, updated,
generated, and verified. It is the design contract for Milestone 4
documentation work.

The goal is not more documentation for its own sake. The goal is to make docs a
maintained product surface that helps authors, site owners, platform
developers, extension authors, deploy operators, and future studio users make
correct changes without learning internal implementation details too early.

## Principles

- Do not create stale parallel truth. If a schema, registry, manifest, package
  script, or component contract owns a fact, docs should reference it, generate
  from it, or declare the current hand-written reference temporary.
- Keep author docs simple. Non-technical authors should edit content and run
  author-facing checks without needing platform architecture.
- Keep developer docs explicit. Platform developers should know the contract,
  source of truth, verification command, and downstream consumers for a domain.
- Make documentation changes local and checkable. A source change should make
  the related documentation obligation clear.
- Prefer generated references for enumerable contracts. Hand-written prose is
  best for goals, workflows, examples, tradeoffs, and troubleshooting.

## Audiences

Documentation should name one primary audience. Secondary audiences are fine,
but mixed-audience docs should be split when the reader has to understand too
much unrelated context.

- **Authors:** write or edit articles, announcements, collections, citations,
  images, and pages.
- **Site owners:** configure identity, routes, navigation, theme, support
  links, social/share links, redirects, and feature flags.
- **Platform developers:** change reusable source contracts, route behavior,
  rendering engines, components, output verifiers, and QA tooling.
- **Extension authors:** add components, integrations, generators, deploy
  adapters, content transformers, or future plugin-like surfaces.
- **Deploy operators:** build, preview, validate, deploy, diagnose production
  output, and inspect redirects/cache/search/feeds.
- **Future studio users:** use a GUI, CLI, or MCP surface over the same schemas,
  route registry, source/artifact manifest, diagnostics, and generated-output
  contracts.
- **Maintainers:** plan roadmap work, review architecture decisions, and decide
  when deferred or audit work should become active.

## Document Kinds

Each documentation surface should fit one of these kinds.

- **Author guide:** task-focused, non-technical, example-first.
- **Site-owner guide:** configuration-focused, still low-code where practical.
- **Platform reference:** source contracts, APIs, module boundaries, and
  generated-output guarantees.
- **Component reference:** component public contract, composition, responsive
  behavior, accessibility, theme behavior, and testable invariants.
- **Generated reference:** deterministic output from a schema, registry,
  manifest, package script registry, or other typed source.
- **Operational runbook:** commands, release checks, deployment, previews,
  diagnostics, and production triage.
- **Architecture/design contract:** durable design decisions that future
  implementation should follow.
- **Audit/decision record:** evidence, findings, recommendations, and accepted
  tradeoffs from a research or planning pass.
- **Migration/historical note:** information that preserves historical context
  but is not the current authoring contract.
- **Deferred-work note:** postponed work with a reason and resume trigger.

## Source-Of-Truth Rules

Every doc should have an owning source. The owning source is the thing that
must be changed first when the contract changes.

- Site identity, routes, feature flags, support links, share targets, homepage
  labels, and content defaults are owned by `siteConfigSchema` and the active
  `site/config/site.json`.
- Public route shape, feature ownership, route surfaces, generated route output
  paths, and disabled-feature diagnostics are owned by `routeRegistryEntries()`.
- Source roots, editable locations, generated artifact families, public static
  output, and artifact owners are owned by `sourceArtifactManifest()`.
- Article render facts, visibility, PDF eligibility, scholarly metadata
  eligibility, reference facts, table of contents, and output facts are owned by
  the article compiler artifact.
- Package-script purpose, QA class, CI parity, mutation behavior, and runtime
  expectations are owned by `package.json` plus the QA command registry.
- Starter-template personas, supported feature matrices, source/build/release
  checks, and adoption guidance are owned by `src/lib/starters/starter-templates.ts`
  plus the maintained roots under `examples/starters/` and
  `examples/docs-site/`.
- Component public contracts are owned jointly by the component implementation,
  component one-pager, catalog fixture, and focused tests.
- Generated public files are owned by the platform contracts that create them,
  then verified by generated-output checks.
- Narrative workflows are owned by the audience-facing docs, but they should
  link to generated or reference docs for complete enumerations.

## Placement Rules

- Put TPM-specific author and site-owner instructions in `site/README.md`.
- Put repo-local developer setup, command orientation, and release guidance in
  `README.md` or `PACKAGE_SCRIPTS.md`.
- Put durable platform contracts and implementation-facing references in
  `docs/`.
- Put public platform documentation and example-site workflows in
  `examples/docs-site/`.
- Put long-term planning, audits, and agent handoff material in `agent-docs/`.
  Promote findings into `docs/` when they become current platform contracts.
- Put active execution state in `CHECKLIST.md` and postponed execution state in
  `DEFERRED.md`.
- Keep generated references near the docs surface that consumes them, but make
  the owning source and check command obvious in the generated file header.

## Current Documentation Map

### Author And Site-Owner Docs

- `site/README.md` is the primary author and site-owner guide for the TPM site
  instance. It should stay practical and non-technical.
- `docs/AUTHORING_WORKFLOW.md` and `docs/ARTICLE_REFERENCE_AUTHORING.md`
  explain deeper author workflows and citation rules.
- `docs/HOMEPAGE_CONTENT_MODEL.md`, `docs/SITE_THEME_CONTRACT.md`, and related
  platform docs explain site-owner configuration surfaces that need more detail
  than `site/README.md` should carry.
- `examples/docs-site/content/articles/authoring/*` and
  `examples/docs-site/content/articles/configuration/*` are public docs-site
  author and site-owner pages.

### Developer And Maintainer Docs

- `README.md` is the repo-level developer entry point. It should stay focused
  on commands, local setup, architecture orientation, and release checks.
- `PACKAGE_SCRIPTS.md` is the human-readable package-script reference. Its
  truth comes from `package.json` and the QA command registry.
- `agent-docs/ENGINEERING_PHILOSOPHY.md` is the durable engineering decision
  aid for substantial platform work.
- `agent-docs/PLATFORM_ROADMAP.md` is the long-term platform and productization
  roadmap.
- `docs/SOURCE_CONTRACTS.md` defines Milestone 1 source contracts.
- `docs/TEST_MATRIX_AND_FIXTURE_STRATEGY.md`,
  `docs/GENERATED_OUTPUT_VERIFIER_CONTRACT.md`, and performance docs define
  later platform verification contracts.
- `docs/PLATFORM_MODULES.md` maps current platform domains, internal public
  entrypoints, and package-boundary intent.
- `docs/STARTER_TEMPLATES.md` defines maintained starter personas, source
  roots, verification, and release expectations.
- `docs/EXTENSION_ARCHITECTURE.md`,
  `docs/DEPLOYMENT_ADAPTER_CONTRACT.md`,
  `docs/IMPORT_EXPORT_AND_PRESERVATION_POLICY.md`,
  `docs/LOCALIZATION_CONTRACTS.md`, `docs/RELEASE_GOVERNANCE.md`,
  `docs/STATIC_OUTPUT_SECURITY.md`, and
  `docs/SUPPLY_CHAIN_AND_SECRET_POLICY.md` define Milestone 5 platform
  contracts for future productization.
- `docs/generated/platform-reference.md` is generated from platform schemas
  and registries by `bun run docs:references`.

### Component Docs

- `docs/components/README.md` defines how component one-pagers work.
- `docs/components/_TEMPLATE.md` defines the expected component doc shape.
- `docs/components/**` mirrors reusable components and should change when a
  component's public contract, responsive behavior, accessibility behavior, or
  testable invariants change.
- The component catalog and component tests are the executable companions to
  component docs.

### Public Docs Site

- `docs/PUBLIC_DOCUMENTATION_SITE.md` defines the docs-site information
  architecture and audience paths.
- `examples/docs-site/README.md` explains how the docs site is both public
  documentation and a second platform consumer.
- `examples/docs-site/content/articles/reference/*` is the current location for
  public reference material that should eventually consume generated references
  where possible.

### Starter And Example Docs

- `docs/STARTER_TEMPLATES.md` is the maintained starter contract.
- `examples/starters/**/README.md` should stay brief, persona-specific, and
  suitable for authors using that starter as a starting point.
- `examples/platform-entrypoint-consumer/` is a package-boundary proof, not an
  author-facing starter.

### Planning And Historical Docs

- `CHECKLIST.md` tracks active implementation milestones.
- `DEFERRED.md` tracks postponed work with resume triggers.
- `agent-docs/*AUDIT*.md`, `agent-docs/codebase-roadmap/*`, and
  `agent-docs/fresh-codebase-audit-2026-05-20/*` are planning and historical
  evidence. They should not be treated as the current platform contract unless
  a current roadmap or implementation doc explicitly promotes their findings.

## Documentation Ownership Matrix

Use this matrix when deciding whether a source change requires a documentation
change.

### Author Editing Docs

- Primary audience: authors.
- Document kind: author guide.
- Current surfaces: `site/README.md`, authoring docs, docs-site authoring
  pages.
- Owning sources: content collection schemas, article compiler artifact,
  citation/reference policy, media policy, and author-facing diagnostics.
- Update trigger: content frontmatter, article rendering, citations, images,
  PDFs, visibility, collections, or author command behavior changes.
- Verification owner: author checks, content verification, Markdown review, and
  docs-site checks when public examples change.

### Site Owner Configuration Docs

- Primary audience: site owners.
- Document kind: site-owner guide and generated reference.
- Current surfaces: `site/README.md`, `docs/HOMEPAGE_CONTENT_MODEL.md`,
  `docs/SITE_THEME_CONTRACT.md`, docs-site configuration pages, generated site
  config schemas.
- Owning sources: `siteConfigSchema`, site config defaults, route registry,
  source/artifact manifest, redirects config, theme contract, and active site
  config examples.
- Update trigger: site config, feature flag, route, navigation, homepage,
  support/social/share, redirect, theme, or site-instance path changes.
- Verification owner: `site:schema:check`, docs-site checks, config tests, and
  route/source-artifact tests when their contracts change.

### Platform Contract Docs

- Primary audience: platform developers and extension authors.
- Document kind: platform reference and architecture/design contract.
- Current surfaces: source contracts, platform modules, verifier contract,
  test matrix strategy, performance budget docs, and roadmap docs.
- Owning sources: typed contracts in `src/lib/**`, scripts under `scripts/**`,
  verifier modules, test fixtures, and roadmap decisions.
- Update trigger: public platform API, compiler artifact, route registry,
  source/artifact manifest, verifier, fixture-site, or output contract changes.
- Verification owner: focused domain tests, platform boundary checks, generated
  output verification, and release checks for broad contract changes.

### Component Contract Docs

- Primary audience: platform developers and extension authors.
- Document kind: component reference.
- Current surfaces: `docs/components/**`, component catalog, component tests,
  and component implementation files.
- Owning sources: component props, slots, variants, catalog fixtures,
  accessibility behavior, responsive behavior, and focused component tests.
- Update trigger: public props, layout contract, accessibility behavior,
  responsive behavior, theme behavior, or reusable primitive composition
  changes.
- Verification owner: component tests, catalog checks, accessibility/e2e tests
  when behavior is visible, and Markdown review for one-pagers.

### Command And QA Docs

- Primary audience: developers, deploy operators, and maintainers.
- Document kind: operational runbook and generated reference.
- Current surfaces: `README.md`, `PACKAGE_SCRIPTS.md`, QA preflight docs, and
  docs-site command reference.
- Owning sources: `package.json`, QA command registry, CI workflows, failure
  probes, and release orchestration scripts.
- Update trigger: package script, CI workflow, command classification,
  mutation behavior, runtime expectation, or release gate changes.
- Verification owner: package-script tests, CI workflow tests, QA registry
  tests, and Markdown review.

### Public Docs Site

- Primary audience: authors, site owners, deploy operators, and future studio
  users.
- Document kind: author guide, site-owner guide, operational runbook, and
  reference.
- Current surfaces: `examples/docs-site/**` plus
  `docs/PUBLIC_DOCUMENTATION_SITE.md`.
- Owning sources: public platform workflows, generated references, example site
  config/content, and the docs-site information architecture.
- Update trigger: any public workflow, configuration surface, authoring surface,
  operations command, or reference contract changes.
- Verification owner: `test:docs-site`, Markdown review, link checks when
  available, and generated-reference drift checks.

### Starter Template Docs

- Primary audience: authors, site owners, platform developers, and future
  studio/CLI/MCP users.
- Document kind: author guide, product contract, and fixture strategy.
- Current surfaces: `docs/STARTER_TEMPLATES.md`,
  `examples/starters/**/README.md`, and `examples/docs-site/README.md`.
- Owning sources: `src/lib/starters/starter-templates.ts`, maintained starter roots,
  and starter verification logic.
- Update trigger: starter ID, persona, feature matrix, checks, required files,
  or starter source content changes.
- Verification owner: `bun --silent run starters:check`, Markdown review, and
  focused starter-template tests.

### Planning, Deferred, And Historical Docs

- Primary audience: maintainers and platform developers.
- Document kind: roadmap, audit/decision record, migration note, or
  deferred-work note.
- Current surfaces: `agent-docs/**`, `docs/*AUDIT*.md`, `CHECKLIST.md`, and
  `DEFERRED.md`.
- Owning sources: accepted roadmap decisions, completed audits, active
  checklist state, and deferred-work resume triggers.
- Update trigger: milestone planning, audit completion, deferred-work
  activation, roadmap scope changes, or handoff decisions.
- Verification owner: Markdown review and the specific checklist or Linear
  handoff step that made the planning doc active.

## Generated-Reference Lifecycle

Generated references should be used when the reference lists a bounded,
machine-readable contract. Generated docs must have one owning source and one
drift check.

The lifecycle is:

1. Identify the owning source: schema, registry, manifest, package script
   registry, component inventory, compiler artifact, or verifier registry.
2. Generate a deterministic reference from that source.
3. Mark the generated file clearly so authors do not edit it by hand.
4. Add a check command that fails when generated output is stale.
5. Link narrative docs to the generated reference instead of duplicating the
   enumeration.
6. Keep generated references public-docs ready when the underlying contract is
   useful outside TPM.

Current generated references:

- `docs/generated/platform-reference.md` is generated by
  `bun run docs:references` and checked by `bun run docs:references:check`.
  It currently covers site config fields, content frontmatter fields, routes,
  feature flags, visibility surfaces, semantic profiles, media/PDF vocabulary,
  author diagnostics, source/artifact manifests, and QA command domains.
- `site/config/site.schema.json` and `examples/docs-site/config/site.schema.json`
  are generated from `siteConfigSchema` and checked by `site:schema:check`.

Planned generated references:

- **Component inventory reference:** generated from `src/components/**`,
  `docs/components/**`, catalog fixtures, and component tests.
- **Generated-output contract reference:** generated from output verifier
  modules and route/artifact registries once verifier modules are split.
- **Metadata/media/reference policy reference:** generated from metadata,
  media, citation, PDF, and feed policy registries after those policies expose
  stable public descriptors.

## Update Triggers

Use these triggers during implementation review.

- `siteConfigSchema`, `site-config-defaults`, or `site/config/site.json`
  changes: update or regenerate config docs, site-owner docs, docs-site config
  pages, and schema output.
- `route-registry.ts` changes: update or regenerate route, feature,
  navigation, sitemap/search/feed, and disabled-feature docs.
- `source-artifacts.ts` or site-instance path changes: update or regenerate
  site anatomy, source/artifact, generated-output, and future studio docs.
- Content collection schema changes: update author docs, frontmatter reference,
  docs-site authoring pages, and author-facing diagnostics.
- Article compiler artifact changes: update source contracts, PDF/scholarship,
  citations, table-of-contents, metadata, and generated-output docs as needed.
- Component public-contract changes: update the component one-pager, catalog
  fixture, accessibility/responsive notes, and focused tests.
- Package script, QA registry, or CI workflow changes: update command docs,
  QA preflight docs, and CI/local parity tests.
- Starter template, starter registry, or example site changes: update
  `docs/STARTER_TEMPLATES.md`, starter README files, docs-site examples when
  public behavior changes, and generated references when source contracts
  change.
- Platform entrypoint or productization contract changes: update
  `docs/PLATFORM_MODULES.md` plus the relevant domain contract such as
  extension architecture, deployment adapters, import/export, localization,
  release governance, static-output security, or supply-chain policy.
- Deploy, redirects, headers, cache, robots, sitemap, or Cloudflare changes:
  update operations docs and release/deploy runbooks.
- Metadata, SEO, accessibility, social-preview, or machine-readable output
  changes: update public-output docs and validation expectations.
- Deferred work becomes active: move it from `DEFERRED.md` to `CHECKLIST.md`
  before implementation.

## Verification Ownership

Documentation verification should match the kind of doc that changed.

- Narrative Markdown changes: `bun --silent run review:markdown`.
- Generated platform-reference changes:
  `bun --silent run docs:references:check`.
- Starter template changes: `bun --silent run starters:check`.
- Docs-site source changes: `bun --silent run test:docs-site`.
- Site config reference changes: `bun --silent run site:schema:check`.
- Package script or CI reference changes: `bun --silent run test:config`.
- Component contract changes: `bun --silent run catalog:check` plus focused
  component tests.
- Source contract or generated-output contract changes: focused unit tests for
  the owning domain, then the relevant release gate.
- Broad platform contract changes: `bun --silent run check:release` before
  handoff.

Future documentation tooling should add a broader docs accountability check
that maps changed source domains to expected documentation surfaces. That check
should use the ownership and trigger model in this document rather than
hard-coded filename guesses. `docs:references:check`, `site:schema:check`, and
`starters:check` are current focused precedents.

## Downstream Boundaries

This document now describes both the lifecycle design and the current focused
documentation checks.

- `IRK-103` should connect site-doctor diagnostics to author/site-owner docs
  after the diagnostic taxonomy is stable.
- Future docs-accountability work should connect source-domain changes to
  expected documentation surfaces after the generated-reference and starter
  precedents have settled.
- Future link checking should cover docs, docs-site content, starter READMEs,
  and generated references.

If downstream work discovers that a planned generated reference lacks a stable
owning schema, registry, or manifest, it should improve that source contract
before generating the doc.
