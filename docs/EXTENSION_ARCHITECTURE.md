# Extension Architecture

This document defines the current typed extension manifest contract. It turns
the studio extension model from a product idea into a platform vocabulary that
code, docs, tests, future CLI commands, future MCP tools, and future GUI
surfaces can consume.

The immediate goal is not to run arbitrary third-party code. The immediate goal
is to shape optional capabilities around explicit manifests so future
extensions can add behavior without patching global files or quietly bypassing
static-output, security, accessibility, metadata, or generated-artifact
contracts.

## Core Rule

Core owns contracts and guardrails. Extensions declare capabilities.

An extension may only be treated as installed when the platform can answer:

- what capability the extension adds;
- which extension point it implements;
- what generated artifacts, routes, source schemas, scripts, styles, origins,
  diagnostics, verifiers, docs, and tests it owns;
- which permissions and provider boundaries it needs;
- what happens when it is disabled, deprecated, upgraded, or conflicting with
  another extension.

## Manifest Contract

The TypeScript contract lives in `src/lib/extensions.ts` and is exposed through
the internal public entrypoint `src/platform/extensions.ts`.

Every manifest declares:

- `id`: lowercase extension identifier, optionally npm-scoped;
- `name`: human-readable name;
- `version`: extension version string;
- `kind`: `essential-bundled`, `optional-official`, `site`, or `third-party`;
- `summary`: short author/developer-facing summary;
- `capabilities`: capability declarations read by GUI, CLI, MCP, docs, and
  verifiers;
- `disabledBehavior`: what the platform should do when the extension is
  disabled.

Optional fields declare dependencies, conflicts, config schema, source schema
additions, content kinds, components, editor surfaces, routes, generated
artifacts, media behavior, metadata profiles, diagnostics, verifiers, scripts,
styles, external origins, migrations, docs, and tests.

## Capability Families

Capability families are data, not implementation details. They tell product
surfaces which actions can be displayed and tell verification tools where
ownership belongs.

Current families:

- `artifact.archive`
- `artifact.feed`
- `artifact.pdf`
- `artifact.search`
- `artifact.social-image`
- `content.kind`
- `deploy.provider`
- `diagnostic.provider`
- `docs.generator`
- `history.provider`
- `import.source`
- `media.materializer`
- `media.provider`
- `metadata.profile`
- `route.module`
- `source.provider`
- `ui.block`
- `ui.component`
- `verifier.module`
- `workflow.transition`

## Extension Points

Extension points name where core may load declared behavior. A manifest can
declare one or more implementations, but every implementation must be backed by
capabilities and tests.

Current extension points:

- article compiler transforms;
- author diagnostics;
- catalog fixtures;
- content kinds;
- deploy adapters;
- docs generators;
- history adapters;
- import sources;
- media materializers;
- media policies;
- metadata profiles;
- route modules;
- source adapters;
- UI blocks;
- UI components;
- verifier modules;
- workflow adapters.

## Permissions And Trust

Permissions are explicit because extensions are trust boundaries.

Examples:

- browser scripts require `browser.script`;
- generated artifacts require `generated.output.write`;
- external origins require `external.origin`;
- migrations require `migration.write`;
- deploy actions require `deploy.publish`;
- credentialed provider actions require the relevant credential/provider
  permission declared by
  [`STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md`](./STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md).

Official bundled extensions can receive trusted defaults, but site and
third-party extensions should declare more of their behavior explicitly. Future
security work will decide which permissions can be auto-granted, prompted,
blocked, or restricted by policy.

## Validation Rules

`validateExtensionManifest()` currently checks cross-field rules that types
cannot express:

- invalid extension IDs;
- duplicate capability keys;
- self-dependencies;
- self-conflicts;
- declared routes without `route.module`;
- declared components without `ui.component` or `ui.block`;
- generated artifacts without artifact capabilities and
  `generated.output.write`;
- metadata profiles without `metadata.profile`;
- verifier modules without `verifier.module`;
- scripts without `browser.script`;
- external origins without `external.origin`;
- migrations without `migration.write`.

`resolveExtensionManifests()` adds fixture-backed activation checks:

- explicitly disabled extensions are removed from active capabilities and
  generated artifacts;
- required feature flags must be enabled before the extension activates;
- required dependencies must be installed and enabled;
- duplicate generated artifact output paths are reported as conflicts.

`extensionOutputDeclarationDiagnostics()` lets verifier or loader code report
extension-owned routes and generated artifacts that were observed but not
declared by an installed manifest.

`extensionDocumentationDiagnostics()` reports manifests without docs hooks.
`extensionDiagnosticsToOutputDiagnostics()` converts extension diagnostics into
generated-output diagnostics so release reports can display extension failures
through the same reporting pipeline as core platform checks.

Later verifier work should route these diagnostics through the same
author/developer diagnostic model used by generated-output and site-doctor
checks.

## Import Boundaries

Extensions are expected to import platform APIs through `src/platform/*`
entrypoints. `just platform-check` now has a narrow guardrail for future
extension source files under `extensions/` or `site/extensions/`:

- local extension-relative imports are allowed;
- `@/platform/*` and relative imports that target `src/platform/*` are allowed;
- direct imports from `src/lib`, components, layouts, pages, scripts, tests,
  or `site/` are reported as unsupported extension imports.

This keeps extensions on deliberate seams while still allowing local extension
implementation files.

## Fixture Extensions

Current fixture tests use site-agnostic manifests from
`tests/fixtures/extensions.ts`:

- `fixture.markdown-mdx`: essential bundled Markdown/MDX content and route
  extension;
- `fixture.pdf`: generated PDF artifact and verifier module extension;
- `fixture.callout`: UI component extension with PDF/search/feed fallbacks;
- `fixture.third-party-embed`: third-party UI component extension with a
  declared external origin;
- `fixture.review-metadata`: feature-gated metadata profile extension;
- `fixture.legacy-importer`: optional official importer with a pending source
  migration;
- `fixture.pdf-download-block`: dependency fixture that requires `fixture.pdf`;
- `fixture.pdf-conflict`: conflicting generated-output fixture.

These fixtures prove enabled, disabled, missing dependency, missing feature
flag, and conflicting output states without importing TPM content or assets.

## Catalog And Lifecycle

The catalog is a view over manifests and resolution state, not a separate
registry. `extensionCatalogEntries()` keeps the manifest as the source of truth,
adds activation state, and exposes fields that product surfaces can consume
without re-deriving policy:

- lifecycle: `unavailable`, `installable`, `installed`, `enabled`, `disabled`,
  `needs-migration`, `incompatible`, `deprecated`, or `removed`;
- class: `essential-bundled`, `optional-official`, `site`, or `third-party`;
- trust boundary: `bundled-essential`, `bundled-official`, `site-owned`, or
  `third-party`;
- bundled/default flags;
- safe-disable flag and disabled behavior;
- generated artifact paths;
- diagnostic prefixes;
- migration count;
- docs hooks.

`extensionCatalogReferenceRows()` converts catalog entries into stable
documentation/reference rows for GUI, CLI, MCP, CI summaries, docs pages, and
release reports. Consumers should use those rows for display and use the
manifest only when they need full declarations.

Lifecycle meanings:

- `unavailable`: known capability exists but cannot be installed in the current
  platform, provider, or runtime.
- `installable`: known capability is available but not installed.
- `installed`: source is present, but it is not currently enabled by resolution
  state.
- `enabled`: installed and active.
- `disabled`: explicitly disabled by site-owner or workspace policy.
- `needs-migration`: installed, but declares a pending source or config
  migration before normal use.
- `incompatible`: blocked by a missing dependency, feature flag, platform
  version, or provider capability.
- `deprecated`: still usable, but a replacement or removal path should be
  shown.
- `removed`: intentionally removed from the active platform or site.

Safe-disable is determined by `disabledBehavior.mode`. `reject-disable` means
future product UIs should not offer a normal disable action. Other modes may be
disabled, but the UI should display what happens to source and output:

- `disable-capabilities`: stop exposing the capability.
- `keep-source-ignore-output`: keep source declarations but omit generated
  output.
- `remove-artifacts`: remove generated controls and artifacts owned by the
  extension.

Uninstall is separate from disable. An uninstall flow must first confirm that
no source/config schema owned by the extension still exists, or it must run a
declared migration that removes, converts, or parks that source data. Removed
generated artifacts are safe only when the manifest declares ownership.

## Default Boundary

Core owns contracts, loaders, schemas, diagnostics, permissions, route and
artifact registries, and the extension catalog. Bundled extensions own default
behavior. This keeps the platform small enough to generalize while preserving a
good out-of-the-box blog.

Current classification target:

| Capability                                                                                      | Boundary                                                               | Rationale                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Markdown/MDX rendering, article/page content kinds, base route modules                          | Essential bundled                                                      | The default blog cannot function without them, but they still declare source, route, docs, and tests.                        |
| Local source provider, local history provider, local media provider/materializer                | Essential bundled                                                      | The simplest user should be able to write, preview, and publish locally with no extra provider setup.                        |
| Metadata, RSS, sitemap, social image defaults, search index                                     | Essential bundled by default, replaceable by official extensions later | They are expected on a modern static blog, but should remain declared capabilities so advanced users can swap policies.      |
| Cloudflare deploy adapter                                                                       | Optional official bundled                                              | Recommended default deploy path, but not core because GitHub Pages, static folder, and other providers must remain possible. |
| PDF generation, Google Scholar metadata, citations/bibliography, reference previews             | Optional official bundled                                              | High-value publishing features that can be disabled or replaced without breaking the basic blog.                             |
| Support CTAs, social/share targets, Patreon/Discord/YouTube buttons, embeds                     | Site or optional official extensions                                   | Useful defaults should exist, but publication-specific accounts and policies must not be core.                               |
| Importers such as WordPress, Substack, or legacy Markdown                                       | Optional official extensions                                           | They are migration tools, often with write permissions and provider-specific assumptions.                                    |
| Advanced metadata profiles such as reviews, recipes, events, books, courses, datasets, products | Optional official or third-party extensions                            | Valuable for platform users with different editorial domains, but not part of every publication.                             |
| TPM-specific homepage blocks, copy, buttons, and MDX components                                 | Site extensions                                                        | They belong to the TPM site instance and should not be required by the platform.                                             |

## Product Surface Rules

Future surfaces should use the same catalog contracts:

- GUI: list installable, installed, enabled, disabled, incompatible,
  needs-migration, deprecated, and removed extensions with docs links and safe
  actions only.
- CLI: expose the same catalog rows through commands such as list, enable,
  disable, migrate, verify, and doctor.
- MCP: expose read-only catalog and diagnostics tools first; write tools should
  require explicit permission and use the same workflow contracts as the CLI and
  GUI.
- CI/release reports: show extension-owned generated outputs, diagnostics,
  docs hooks, migrations, and provider requirements.
- Generated docs: build extension reference tables from manifest/catalog rows
  rather than hand-maintained lists.

Trust boundary behavior:

- bundled essential and official extensions may receive first-party defaults but
  still declare permissions, tests, docs, and output ownership;
- site extensions may read and write site-owned content/config only through
  declared schemas and permissions;
- third-party extensions should be treated as untrusted until policy explicitly
  grants permissions;
- browser scripts, network origins, credentials, source writes, and generated
  output writes must stay explicit and follow the credential-reference model in
  [`STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md`](./STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md).

## Design Boundaries

This contract intentionally does not do the following yet:

- dynamically load extension code;
- run third-party scripts;
- publish a package API;
- install marketplace extensions;
- mutate source files;
- grant credentials;
- bypass static-output verification.

Those behaviors need implementation milestones, fixture extensions, trust
policy, and generated-output ownership checks before they become product
features.
