# Studio Extension Model

This document defines the extension model for the future static publishing
studio. It complements [STUDIO_PRODUCT_VISION.md](./STUDIO_PRODUCT_VISION.md)
and [STUDIO_ADAPTER_MODEL.md](./STUDIO_ADAPTER_MODEL.md).

The key idea:

> Core compiles and governs. Extensions add capabilities through explicit
> contracts.

The platform should ship with tasteful defaults that work immediately, while
leaving clean upgrade paths for backups, collaboration, media providers, deploy
providers, custom UI, PDFs, scholarly output, importers, and complex publisher
integrations.

## Extension Versus Adapter

Adapters connect the platform to a provider or implementation mechanism.
Extensions package a user-visible capability.

Examples:

- A Cloudflare deploy adapter knows how to publish static output to Cloudflare.
- A Cloudflare deploy extension packages that adapter with config schema,
  diagnostics, docs, GUI fields, release report hooks, and verifier policy.
- A Patreon button extension packages a UI component, config schema, assets,
  accessibility labels, allowed surfaces, and diagnostics.
- A PDF extension packages generation logic, PDF metadata, fallback policy,
  artifact routes, size budgets, UI controls, and verifiers.

Some extensions contain adapters. Some do not.

## Why Extensions Matter

The product must serve a long upgrade ladder:

1. A default user publishes from the GUI with near-zero technical knowledge.
2. The user adds backup/version history.
3. The user moves media out of source storage.
4. The user collaborates with others.
5. The user automates publishing.
6. The user becomes, or joins, a complex publication with custom systems.

If the platform hard-codes every default into core, upgrades become rewrites. If
the platform exposes only raw extension hooks, the default product becomes
confusing. The right model is opinionated bundled extensions over strict core
contracts.

## Core Responsibilities

Core owns the contracts that keep every extension safe and interoperable.

Core should own:

- site workspace model;
- source/artifact lifecycle;
- content and config schema system;
- route and entity registry;
- publishable model;
- compiler pipeline;
- generated-output artifact contracts;
- diagnostic taxonomy and reporting contracts;
- metadata graph base contract;
- media role and materialization contracts;
- extension manifest and loader;
- capability registry;
- security, permission, and trust boundaries;
- GUI/CLI/MCP action model;
- docs/reference generation from schemas and extension manifests.

Core should not own provider-specific mechanics, site-specific UI, optional
artifact generators, or publication-specific workflows.

## Extension Classes

### 1. Essential Bundled Extensions

These ship enabled by default because they define a good out-of-the-box blog.
They may still be modeled as extensions so they can be tested, configured,
disabled where reasonable, or replaced later.

Examples:

- Markdown/MDX article rendering;
- basic page rendering;
- default theme and layout recipe;
- local source workspace;
- local or app-managed history;
- local/repo media;
- direct publish workflow;
- basic metadata;
- RSS;
- sitemap;
- search index;
- basic image optimization;
- Cloudflare deploy as the recommended first deploy path.

These are "default" rather than "core" when the platform could plausibly keep
working with a different implementation.

### 2. Optional Official Extensions

These are supported by the platform team but not required for every site.

Examples:

- PDF generation;
- Google Scholar metadata;
- citations and bibliography;
- citation and footnote hover previews;
- social share targets;
- Patreon, Discord, YouTube, and other CTA buttons;
- support block composition;
- Cloudflare Pages deploy;
- GitHub Pages deploy and `CNAME` file support;
- Git source/history;
- GitHub backup, sync, and review workflow;
- Google Drive media;
- S3-compatible media;
- SoundCloud, YouTube, and other embeds;
- WordPress, Ghost, Substack, and static HTML importers;
- advanced metadata profiles such as reviews, books, events, videos,
  datasets, and products.

Optional official extensions should be high-quality and well documented. They
should also be removable without corrupting source content.

### 3. Site Extensions

Site extensions are local to a site workspace or organization.

Examples:

- TPM-specific homepage blocks;
- custom support CTA composition;
- custom MDX components;
- custom article endcaps;
- custom collection displays;
- publication-specific metadata profiles;
- custom import or migration scripts;
- organization-specific workflow adapters.

Site extensions are allowed to be more specific than official extensions, but
they still need manifests, diagnostics, and generated-output ownership.

### 4. Third-Party Extensions

Third-party extensions are developed outside the platform.

They need the strictest trust boundaries:

- explicit permissions;
- declared generated outputs;
- declared scripts and styles;
- declared external origins;
- schema-checked config;
- diagnostics;
- version compatibility;
- safe disable/uninstall behavior;
- clear docs;
- no hidden access to credentials, filesystem, deploy providers, or arbitrary
  generated output.

The platform should not prioritize third-party marketplaces too early, but the
architecture should avoid choices that make third-party extensions impossible.

## Extension Manifest

Every extension should eventually declare a manifest.

Potential fields:

```text
id
name
version
kind
description
capabilities
requiredPlatformVersion
dependencies
configSchema
sourceSchemaAdditions
contentKinds
components
editorSurfaces
routes
generatedArtifacts
mediaRoles
metadataProfiles
diagnostics
verifiers
scripts
styles
externalOrigins
permissions
migrations
docs
tests
```

The manifest is not just metadata. It is how the platform prevents accidental
global patching.

The current typed manifest contract is implemented in `src/lib/extensions.ts`,
exposed through `src/platform/extensions.ts`, and documented in
`docs/EXTENSION_ARCHITECTURE.md`.

## Capability Contracts

Extensions should expose capabilities as data.

Example capability families:

- `ui.component`
- `ui.block`
- `content.kind`
- `metadata.profile`
- `artifact.pdf`
- `artifact.feed`
- `artifact.search`
- `media.provider`
- `media.materializer`
- `workflow.transition`
- `deploy.provider`
- `source.provider`
- `history.provider`
- `import.source`
- `diagnostic.provider`
- `verifier.module`

The GUI, CLI, MCP, and release checks should read these capabilities. If a
capability is missing, the interface should hide or disable the action instead
of letting it fail late.

## UI Component Extensions

Custom UI is a major extension use case.

Examples:

- Patreon button;
- Discord button;
- YouTube button;
- image gallery;
- callout;
- custom embed;
- interactive article widget;
- publication-specific support block.

UI component extensions should declare:

- props schema;
- editor form schema;
- default values;
- allowed surfaces;
- static render behavior;
- preview behavior;
- PDF fallback;
- search/feed fallback;
- metadata effects;
- required assets;
- required scripts and hydration policy;
- accessibility labels and keyboard behavior;
- responsive behavior expectations;
- theme token usage;
- diagnostics for missing or invalid config.

This is what keeps "custom component" from becoming arbitrary code that breaks
PDFs, search, feeds, accessibility, or static output.

## Artifact Extensions

Artifact extensions emit generated output beyond normal HTML pages.

Examples:

- PDFs;
- RSS variants;
- search indexes;
- social image derivatives;
- bibliographies;
- manifests;
- downloadable archives.

Artifact extensions should declare:

- output routes or filenames;
- source inputs;
- artifact ownership;
- cache policy;
- crawler policy;
- metadata requirements;
- compatibility rules;
- size budgets;
- verification rules;
- failure behavior;
- UI controls.

PDF generation is the best current example. It should not be core forever just
because TPM cares about scholarly output. It should be an official extension
with clear artifact, fallback, metadata, media, and verification contracts.

## Deploy And Domain Extensions

Domain setup is mostly external to the product. The platform should support the
parts it can truthfully own.

Core should support:

- configured canonical domain;
- generated metadata, feeds, sitemap, PDFs, and links using that domain;
- diagnostics when the configured domain and generated output disagree;
- provider-neutral domain status concepts.

Deploy extensions can add provider-specific behavior:

- Cloudflare Worker/static asset setup;
- Cloudflare domain verification or status checks when credentials allow;
- GitHub Pages deploy;
- GitHub Pages `CNAME` file generation;
- Netlify or S3/CDN deploy;
- provider-specific redirect/header/cache output;
- deploy status, rollback, preview URLs, and cache invalidation.

The GUI can guide users through external DNS steps, but it should not claim to
own DNS setup unless a provider adapter truly supports that operation.

## Migration And Upgrade Hooks

Extensions should help users move up the adoption ladder.

Important migrations:

- local source to Git backup;
- local history to Git history;
- repo-local media to external folder;
- external folder to cloud media provider;
- local publish to CI publish;
- direct publish to review workflow;
- Cloudflare deploy to another deploy provider;
- one-site workspace to multi-site management;
- raw custom component to manifest-backed extension.

Migration hooks should provide:

- dry-run plan;
- affected files and artifacts;
- reversible steps when practical;
- source maps;
- diagnostics;
- post-migration checks;
- rollback or recovery guidance.

Migration is part of the product, not an afterthought.

## Security And Trust

Extensions are trust boundaries.

They may introduce:

- executable code;
- browser scripts;
- external origins;
- credentials;
- file access;
- network access;
- deploy access;
- generated public artifacts;
- privacy-sensitive analytics;
- third-party embeds.

The platform should require explicit permission declarations and diagnostics for
these behaviors. Official bundled extensions can receive trusted defaults.
Third-party and site extensions should be more constrained until the user grants
capabilities.

Credential and provider permissions should use the shared reference, scope,
redaction, audit, and recovery contract in
[`../docs/STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md`](../docs/STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md)
rather than exposing raw secrets to extension code.

## Refactor Implications

Existing features that should be evaluated as future extensions:

- Cloudflare deploy;
- GitHub Pages deploy and `CNAME`;
- Git/GitHub source and history;
- repo-local media;
- PDF generation;
- Google Scholar metadata;
- citation/bibliography system;
- reference hover previews;
- support block;
- Patreon/Discord/YouTube buttons;
- social share targets;
- SoundCloud/YouTube embeds;
- search index generation;
- RSS and sitemap generation;
- social image generation;
- import/migration tooling.

Not all of these should be extracted soon. The immediate goal is to shape them
around extension-like contracts: manifests, capabilities, explicit source and
artifact ownership, diagnostics, tests, and docs.

## Verification Expectations

Extension architecture should be verified with:

- manifest schema tests;
- fixture extensions;
- enabled/disabled extension fixture sites;
- import boundary checks;
- capability-driven UI/CLI/MCP tests;
- generated-output ownership checks;
- security and permission tests;
- artifact verifier tests;
- migration dry-run tests;
- docs/reference generation from extension manifests.

The success condition is not "extensions can run arbitrary code." The success
condition is that new capabilities can be added without patching global platform
files, breaking static output, or exposing unsupported actions to users.
