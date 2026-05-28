# Site Doctor

## Purpose

`just site-doctor` is the author and site-owner diagnostic entry point for source
relationships that schemas cannot validate alone.

It should answer:

- Is this site instance structurally complete?
- Do site-owned config choices point at real source files?
- Do optional features, routes, navigation, and homepage settings agree?
- Are common content, asset, redirect, metadata, feed/search, PDF, and media
  policy mistakes visible before a full build?
- Can future GUI, CLI, and MCP surfaces present the same diagnostics in author
  language?

The site doctor is not a replacement for release verification. Release
verification inspects generated `dist/` output. The site doctor inspects source
intent and should only predict generated output when the source contracts make
that expectation deterministic.

## Ownership Boundary

`just site-doctor` owns source-side relationships:

- required site-instance files and directories;
- site config relationships not expressible in the config schema;
- route shape, duplicate configured paths, feature gates, and configured links;
- homepage collection IDs and discovery links;
- author/category/collection references that can be checked without rendering;
- source asset placement and basic media-policy eligibility;
- redirects that can be parsed from site-owned JSON and content
  `legacyPermalink` values;
- metadata profile configuration and source fields needed by social, SEO, and
  scholarly output;
- feed/search/PDF feature configuration that conflicts with source visibility;
- source expectations for generated references, docs, and generated platform
  artifacts.

Generated-output verifier modules own generated artifacts:

- whether `dist/` contains the expected HTML, RSS, sitemap, Pagefind, PDF,
  redirect fallback, and asset files;
- whether generated HTML contains correct metadata, JSON-LD, alt attributes,
  links, hydration boundaries, and embed fallbacks;
- whether generated cache headers and output payload policies are correct;
- whether generated PDFs contain expected metadata and content;
- whether generated social images have the expected encoded file type, size,
  and link relationships.

When a failure can only be proven after rendering, `just site-doctor` should not
duplicate the release verifier. It may link to the relevant release check in
the diagnostic detail.

## Diagnostic Contract

Every site-doctor finding must map to the shared
[author diagnostic contract](./AUTHOR_DIAGNOSTICS.md).

Human output stays concise:

```text
Error: Homepage featured collection `featured` does not exist.
   Path: site/content/collections/featured.mdx
   Fix: Create the configured collection file or update the homepage collection ID in site/config/site.json.
```

Machine-readable output should use the stable author diagnostic report shape:

```json
{
  "diagnostics": [
    {
      "category": "config",
      "code": "config.homepage-collection-missing",
      "fixability": "source-edit",
      "location": { "sourcePath": "site/content/collections/featured.mdx" },
      "relatedDocs": ["docs/HOMEPAGE_CONTENT_MODEL.md"],
      "remediation": "Create the configured collection file or update the homepage collection ID in site/config/site.json.",
      "repairOwner": "site-owner",
      "severity": "error",
      "source": "site-doctor",
      "summary": "Homepage featured collection `featured` does not exist."
    }
  ],
  "summary": {
    "errors": 1,
    "warnings": 0,
    "info": 0,
    "total": 1
  }
}
```

Diagnostic rules:

- `severity` reflects whether the site should be considered invalid for normal
  author workflow.
- `code` is stable and namespaced by category.
- `location.sourcePath` is preferred for repairable source mistakes.
- `location.route`, `location.outputPath`, or `location.url` should be included
  only when they are genuinely useful.
- `repairOwner` should be `author` for article/page/content edits and
  `site-owner` for config, redirects, taxonomy, navigation, theme, public files,
  and deploy-facing files.
- `fixability` should be `source-edit` when a normal site edit fixes the issue.
- `relatedDocs` should point to the shortest useful repair guide.
- `detail` and `evidence` should be used when the summary alone would make the
  author guess.

## Check Families

### Source Roots

Validate required source roots from the source/artifact manifest:

- `site/config/site.json`;
- `site/config/redirects.json`;
- `site/theme.css`;
- required content collections;
- required public files or directories.

Feature-disabled optional roots should not produce errors just because the
directory is absent.

### Routes And Features

Validate configured routes:

- `home` must be `/`;
- `feed` must point at an XML path;
- directory routes must be trailing-slashed;
- configured route paths must be unique;
- disabled feature routes must not appear in navigation, homepage discovery
  links, or other site-configured route references unless the feature is
  explicitly re-enabled.

### Homepage

Validate homepage references:

- configured featured and start-here collection IDs exist as `.md` or `.mdx`;
- homepage discovery links use exactly one route or href, already enforced by
  schema, and do not point at disabled feature routes;
- configured homepage limits are positive, already enforced by schema.

### Content Relationships

Validate relationships that span content collections:

- article and announcement authors refer to known author IDs or aliases;
- article categories implied by directory path have category metadata when the
  category route is enabled;
- collection items refer to existing article or announcement IDs;
- collection drafts are not selected as required homepage collections unless
  intentionally allowed by later policy;
- category metadata files do not describe categories with no current entries
  unless the route is intentionally kept as an empty landing page.

These checks should use normalized content helpers where practical and should
not parse Markdown prose.

### Redirects

Validate source redirect intent:

- `site/config/redirects.json` parses as the canonical redirect map;
- configured redirect sources are site paths;
- redirect destinations are site paths or absolute URLs;
- redirects are non-recursive and non-self-referential;
- content `legacyPermalink` values do not conflict with configured redirects or
  each other;
- redirect counts and line lengths stay below known Cloudflare static redirect
  constraints.

Generated fallback HTML remains a release-verifier concern.

### Assets And Media

Validate source media intent when possible:

- site config logos and fallback images use known site paths or URLs;
- local article images are resolved by content schemas;
- source assets live under `site/assets/` unless intentionally parked under
  `site/unused-assets/`;
- embed/media policy warnings are emitted when a source can be inspected
  without rendering;
- PDF-disabled entries do not need PDF media fallbacks, while PDF-enabled MDX
  entries should have supported fallback behavior.

Rendered image optimization, generated social image size, and PDF content
presence remain release-verifier concerns.

### Metadata, Feeds, Search, And PDFs

Validate source-side policy:

- enabled semantic profiles are known and unique, already enforced by schema;
- article semantic metadata fields are valid for the enabled profiles, already
  enforced by collection schemas;
- feed/search/sitemap visibility defaults are coherent with enabled features;
- PDF feature and article PDF defaults do not promise PDF output for content
  kinds that do not support it.

Rendered metadata and generated files remain release-verifier concerns.

### Generated References And Docs

Validate source expectations that docs and tooling depend on:

- generated platform references are fresh when `just docs-references-check` reports
  drift;
- documentation checks should remain separate commands, but site doctor may
  emit an info or warning when generated references are stale in author-facing
  workflows.

## CLI UX

Required CLI modes:

- default human output;
- `--quiet` for check orchestration;
- `--json` for future GUI, CLI, MCP, and CI report consumers;
- `--help` with examples and exit-code semantics.

Exit-code policy:

- `0` when there are no errors;
- `1` when any error is present;
- warnings alone should not fail unless a future `--strict` mode explicitly
  asks for that behavior.

## Fixture Strategy

Coverage should use small fixture site instances instead of mutating the real
TPM site.

Fixtures should cover:

- complete minimal site instance;
- missing source roots;
- route collisions and invalid route shapes;
- disabled-feature navigation and homepage discovery links;
- missing homepage collections;
- unknown collection items;
- unknown authors or categories;
- recursive or conflicting redirects;
- feature/visibility conflicts;
- JSON output summary counts and stable diagnostic codes.

Do not add test-only exports to make this possible. Use explicit dependency
injection for config, paths, content facts, redirect maps, and filesystem
existence where needed.

## Completion Criteria

The site-doctor expansion is complete when:

- clean fixture sites emit no diagnostics;
- broken fixture sites produce stable author diagnostics with file paths,
  repair owners, related docs, and concrete remediation;
- human output remains readable;
- JSON output uses `AuthorDiagnosticReport`;
- `just author-check` includes the expanded site doctor;
- release verification still owns generated-output facts;
- docs explain the author command layer and common repairs.
