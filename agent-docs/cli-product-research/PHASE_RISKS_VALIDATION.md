# Phase, Risk, And Validation Notes

This file records the initial implementation slice, later phases, risks,
non-goals, and validation strategy for the TPM CLI.

## Planning Areas

- First implementation slice.
- Later CLI phases.
- Explicit deferrals.
- Risks.
- Non-goals.
- Validation plan.

## First Implementation Slice

The first implementation slice should prove the product thesis without trying
to become the full CMS, deploy-provider, media-migration, and extension system
at once.

Primary users:

- terminal-comfortable site owners;
- collaborative publication maintainers;
- CI;
- developers preparing future GUI/MCP contracts.

Core outcomes:

1. Orient the user in a site workspace.
2. Validate the site with author-language diagnostics.
3. Build/export static output with a structured release/artifact report.
4. Preview locally.
5. Produce stable JSON for CI and future MCP/GUI consumers.

Candidate first scope:

- workspace/context detection;
- `status`-like orientation;
- `check`/`doctor` diagnostics;
- build/export static output;
- artifact/release report generation;
- route/media/metadata/config inspection;
- JSON output and exit code classes;
- shell help and examples.

First scope should avoid:

- full visual editing;
- full importers;
- media migration apply;
- arbitrary third-party extensions;
- every deploy provider;
- GitHub PR workflow automation;
- scheduling;
- user/role management.

## Later CLI Phases

### Phase 2: Publish Adapter Foundation

Goals:

- provider-neutral publish plan;
- Cloudflare reference publish adapter;
- static-folder export target;
- deploy status;
- provider/account context;
- dry-run and execute modes;
- release artifact persistence.

### Phase 3: Media And Migration Planning

Goals:

- media inventory;
- unused/oversized/remote/unoptimized media diagnostics;
- repo-local to external media migration plan;
- source reference rewrite plan;
- import/export preservation ledger foundations.

### Phase 4: Source, History, And Workflow Adapters

Goals:

- Git source/history adapter;
- local source/history adapter;
- optional GitHub/GitLab workflow adapters;
- submit/review/publish capability mapping;
- source snapshot reports.

### Phase 5: Extension And Adapter Developer UX

Goals:

- extension list/check/capabilities;
- manifest validation;
- extension fixture checks;
- adapter capability inspection;
- scaffolding only after manifest/contracts settle.

### Phase 6: Importers And Complex Publisher Integrations

Goals:

- import plan/apply for selected legacy sources;
- media/content preservation reports;
- custom source/media/workflow/deploy adapter integration;
- large-site performance and streaming reports.

### Phase 7: GUI And MCP Parity

Goals:

- GUI/studio uses same operation contracts;
- MCP server exposes safe machine actions over the same diagnostics, preview,
  build, publish-plan, and artifact contracts;
- CLI remains the scriptable local/operator surface.

## Risk Register

| Risk                                                | Impact                                        | Mitigation                                                                               |
| --------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Git becomes the product model                       | Default users excluded; workflows overfit TPM | Treat Git as source/history/workflow adapter only. Use editorial vocabulary.             |
| Cloudflare becomes the product model                | Provider lock-in and poor portability         | Keep publish adapter contract provider-neutral; Cloudflare is reference adapter.         |
| CLI wraps Bun scripts directly                      | Brittle commands and parallel architecture    | Add operation planning layer over platform contracts.                                    |
| Diagnostics diverge between CLI, CI, GUI, MCP       | Users get inconsistent repair guidance        | Use one versioned diagnostics schema and shared renderers.                               |
| Media remains repo-local                            | Scaling and collaboration pain                | Add media inventory and adapter migration planning.                                      |
| Destructive publish/migration commands are too easy | Data loss or unintended production changes    | Plan/dry-run first, explicit target identity, confirmation, saved plans.                 |
| Commands expose Astro/provider jargon               | Authors cannot use or understand the tool     | Human output uses publishing terms; advanced detail can include technical names.         |
| JSON output is added late                           | CI/MCP integrations scrape prose              | Machine output is part of the first implementation for diagnostics/status/build reports. |
| Importers lose historical metadata                  | Content fidelity regression                   | Import plans include preservation diagnostics and manual-review states.                  |
| Secret handling leaks credentials                   | Security incident                             | Credential references, redaction, no secret flags by default, provider auth adapters.    |
| Huge command surface ships early                    | Maintenance burden and compatibility debt     | Early implementation is disciplined; compatibility tests protect released commands.      |
| Extension commands bypass manifests                 | Unsafe plugin behavior                        | Extension CLI consumes manifest catalog and platform entrypoints only.                   |

## Non-Goals

- Build a separate CMS data model.
- Replace the future GUI editor.
- Require GitHub/Git, Cloudflare, or repo-local media.
- Become a generic deploy-provider abstraction unrelated to publishing.
- Expose all platform internals as commands.
- Solve every migration source in the first release.
- Make interactive prompts the only way to configure anything.
- Promise no-code publishing from the CLI alone.

## Validation Plan

### Documentation Validation

- Every command has examples.
- Every mutating command documents dry-run/plan and non-interactive behavior.
- Config precedence and active context are documented.
- JSON output schemas are documented before use.
- Provider-specific manual steps are linked from diagnostics.

### Unit/Contract Tests

- command parser grammar;
- invalid flag/argument combinations;
- config precedence;
- workspace context;
- diagnostic schema;
- release artifact schema;
- JSON output shape;
- exit code classes;
- safety level classification.

### Fixture Tests

- default local site;
- TPM-like collaborative site;
- starter site;
- malformed content/config;
- broken media;
- broken redirects/routes;
- metadata/social/feed/PDF failure;
- provider capability unsupported states;
- extension manifest errors.

### Integration Tests

- check/doctor on fixture sites;
- build/export and artifact report;
- preview starts without production side effects;
- publish plan against mock provider adapter;
- no prompts under non-TTY/CI mode;
- stdout/stderr separation;
- color/no-color behavior.

### Dogfooding

- Run CLI checks against this repo's active site.
- Compare CLI diagnostics to existing release checks.
- Use CLI release report as PR/release review artifact.
- Track which existing Bun scripts become implementation details instead of
  user-facing commands.

### Usability Walkthroughs

- New terminal-comfortable site owner: create/open/check/preview/build.
- Publication maintainer: diagnose broken article/media/metadata before PR.
- CI consumer: run check/build with JSON and stable exits.
- Provider publish: inspect plan, confirm target, publish, inspect status.
- Support scenario: use `status` and diagnostics to explain a user's broken
  workspace.
