# Platform Mapping Notes

This file maps proposed CLI responsibility areas to platform contracts and
identifies missing seams. The CLI should be an interface over platform/studio
contracts, not a parallel implementation.

## Platform Domains

- Source workspace.
- Content collections.
- Site configuration.
- Media policy.
- Route registry.
- Metadata profiles.
- Diagnostics.
- Build/export artifacts.
- Deploy adapters.
- Import/export.
- Extensions.
- Release reports.

## Mapping Summary

| CLI responsibility                  | Existing platform source                                                      | Missing or immature seam                                                       | Notes                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Site workspace detection/status     | `site-instance`, `site-config`, `platform-context`, starters docs             | CLI-ready explicit workspace context and config precedence report              | Should not rely on cwd singleton assumptions long-term.                       |
| Content/config validation           | Astro content schemas, `content-schemas`, `publishable`, `author-diagnostics` | Stable CLI diagnostic aggregator with JSON schema version                      | Must use same diagnostics as GUI/MCP/CI.                                      |
| Route and redirect inspection       | `route-registry`, `routes`, `feature-routes`, `site-redirects`                | CLI route/artifact view model                                                  | Useful for `routes list`, `redirects check`, release reports.                 |
| Metadata/artifact inspection        | `metadata`, `metadata-graph`, `semantic-metadata`, social image docs          | Artifact manifest surface that can be queried without reading `dist/` manually | Should cover HTML head, JSON-LD, feeds, PDFs, sitemap, search, social images. |
| Media diagnostics                   | `media-policy`, `article-image-policy`, `social-images`, media docs           | Media inventory and migration planner                                          | First phase: check/list; later: plan/apply migration.                         |
| Build/export                        | Astro build path, `output-verification`, `source-artifacts`                   | Stable release artifact builder and CLI build result                           | Build should emit structured release/artifact report.                         |
| Deploy/publish                      | `deployment-adapters`, `src/platform/deployment.ts`, deploy adapter docs      | Credential adapter, provider target registry, publish plan persistence         | Cloudflare is reference adapter, not core model.                              |
| Import/export/preservation          | `migration-fixtures`, `src/platform/import-export.ts`, preservation docs      | Real importer contracts and source-map ledger                                  | Future importers should be plan-first.                                        |
| Extensions/adapters                 | `extensions`, `src/platform/extensions.ts`, extension docs                    | CLI extension catalog commands and scaffold/fixture flows                      | Later phase unless adapter work needs visibility earlier.                     |
| Release governance                  | `release-governance`, `src/platform/release.ts`, release docs                 | CLI release report command and machine-readable schema                         | Important for CI and publication teams.                                       |
| Studio forms/workflows              | `studio-forms`, `studio-models`, `studio-workflows`                           | Shared operation planning layer for GUI/CLI/MCP                                | Prevents parallel models.                                                     |
| Security/supply-chain/static output | `static-output-security`, `supply-chain-policy`, `src/platform/security.ts`   | CLI-friendly security/release diagnostics                                      | Likely part of `check` and release report.                                    |

## Existing Platform Strengths To Reuse

- `src/platform/*` entrypoints already define internal public seams for future
  CLI/MCP/studio consumers.
- Diagnostics and generated-output verification already exist and should be
  promoted into CLI-ready reports rather than rewritten.
- Deployment adapter contracts already frame publish/preview/rollback as
  product actions over release artifacts.
- Extension manifests already expose capability families and lifecycle state.
- Studio readiness modules already define editor models, forms, workflow states,
  and preview shells.
- Roadmap/docs already insist that GUI, CLI, MCP, and CI share one compiler
  model.

## Needed Product Seams Before A Real CLI

### CLI Operation Planning Layer

The CLI should call typed operations such as "check site", "build release",
"plan publish", and "inspect artifact" rather than directly composing
filesystem, Astro, and provider calls inside command handlers.

Candidate shape:

```text
parse command -> load workspace context -> plan operation -> execute adapter
              -> render human output or JSON
```

This keeps command handlers thin and lets GUI/MCP reuse operation planning.

### Workspace Context

The platform needs an explicit workspace context that can answer:

- site root;
- source adapter;
- media adapter;
- config files and defaults;
- platform version;
- active target;
- generated output root;
- credential references;
- feature flags/extensions.

The CLI should not rely on "current repo equals site equals platform source."

### Diagnostic Report Schema

The CLI needs stable JSON for diagnostics:

- schema version;
- status;
- summary counts;
- stable codes;
- severity;
- source file or artifact;
- route or target;
- cause;
- remediation;
- docs links;
- owner domain or extension.

This schema should become shared infrastructure for CI, GUI, MCP, and release
reports.

### Release Artifact Builder

Deploy and publish commands need a release artifact, not just an output folder.
The release artifact should include:

- source snapshot;
- route registry snapshot;
- generated artifact manifest;
- media and asset report;
- metadata report;
- redirect/header/cache report;
- diagnostics report;
- deploy target plan.

### Credential And Provider Context

Provider adapters need credential references and account context, not raw
secrets. The CLI should be able to explain:

- active provider;
- target site/project;
- account identity;
- credential source;
- missing scopes;
- manual provider setup steps.

### Media Inventory And Migration

Media needs a provider-neutral inventory before migration:

- source references;
- generated derivatives;
- alt/caption/metadata;
- ownership;
- size/type/fingerprint;
- referenced/unreferenced state;
- external origin;
- candidate target adapter.

### Import/Export Plans

Import and export should share a preservation contract:

- old source item;
- new target item;
- route/redirect mapping;
- media mapping;
- metadata mapping;
- uncertainty;
- manual review.

## Parallel Architecture Risks

Avoid these failure modes:

- CLI command reads `site/` directly instead of using workspace/source
  contracts.
- CLI command invokes provider CLI directly without deploy adapter reporting.
- CLI command renders its own diagnostics instead of consuming diagnostic
  models.
- CLI command adds content editing prompts separate from schema/form contracts.
- CLI command treats GitHub/Cloudflare as mandatory defaults.
- CLI command parses generated HTML instead of consuming artifact manifests when
  a platform artifact exists.

## Platform Mapping Conclusion

The CLI can be a high-leverage product surface only if it stays thin. Its job
is to turn user intent into typed platform operations, render useful output,
and enforce safety. The platform compiler and adapter contracts should own
truth, policy, diagnostics, and generated artifacts.
