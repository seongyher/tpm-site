# CLI, Rust, And Tauri/Astro GUI Integration Plan

This document is the high-level implementation plan for the TPM CLI, Rust
migration, MCP surface, and future Tauri/Astro studio GUI. It exists so future
Linear issues can be created from one coherent architecture instead of separate
CLI, Rust, and GUI tracks that drift apart.

## Goals

The goal is to turn the current Astro site/platform into a typed static
publishing compiler with multiple interfaces over the same core.

The plan should preserve the repo's core engineering commitments:

1. Authors and site owners express publication intent through content, assets,
   config, media, workflow, and provider choices.
2. Platform code validates and normalizes that intent, then emits static
   routes, HTML, metadata, feeds, search data, PDFs, assets, diagnostics,
   release reports, and deployable artifacts.
3. CLI, Tauri GUI, MCP, CI, and local developer commands all call the same
   operation contracts.
4. The GUI must not become a second CMS model.
5. The CLI must not become a loose wrapper around Bun scripts.
6. The Rust core must not replace existing behavior until parity tests prove
   the replacement is safe.
7. Astro remains the renderer/frontend adapter where Astro is the right tool.
8. Tauri remains a native shell and permissioned Rust command host, not a
   separate business-logic layer.

The studio product architecture and publication workspace model are owned by
[STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md](./STUDIO_ARCHITECTURE_AND_WORKSPACE_MODEL.md).

## Current Repo Starting Point

The repo has started this plan with additive foundations. The implementation
is still early and must remain parity-driven.

Current facts:

- The additive Rust workspace exists with `tpm-core`, `tpm-diagnostics`,
  `tpm-workspace`, `tpm-operations`, and `tpm-cli`.
- `justfile` routes Bun and Rust checks while keeping domain logic out of
  recipes.
- There is no `apps/studio/` or `src-tauri/` yet.
- Shared Rust operation contracts are documented in
  [`../docs/RUST_OPERATION_CONTRACTS.md`](../docs/RUST_OPERATION_CONTRACTS.md).
- `src/platform/*` already exposes stable internal platform entrypoints for
  deployment, diagnostics, extensions, import/export, interactions,
  localization, media, references, release, routes, security, and starters.
- `scripts/` already contains deterministic report-oriented tools that are
  good Rust migration candidates: site doctor, image asset checks, redirect
  generation, generated-output verification, QA registry, diagnostic diffing,
  and release checks.
- The roadmap already defines the product direction: a comprehensive static
  blog studio where GUI, CLI, MCP, and CI are interfaces over one platform
  compiler.

This means the next work should be additive and contract-driven. The first Rust
commits should prove the operation model, not replace the site.

## Stack Decision

Use:

- **Rust** for durable platform core, operation requests/results, diagnostics,
  source/workspace/media/route/release policy, CLI, MCP, and Tauri backend.
- **Astro** for the deployed site renderer and for the future studio frontend
  shell.
- **Tauri** for the desktop GUI shell, native permissions, filesystem/provider
  access, and command bridge to Rust operations.
- **Bun/Astro/TypeScript** for current site rendering, current browser-bound
  scripts, current tests, and frontend UI where that remains the right tool.
- **`just`** as the repo command router that makes local/CI commands
  discoverable without becoming domain logic.

Official docs support this shape:

- Tauri is frontend-agnostic and conceptually acts as a static web host. It
  expects static HTML/CSS/JavaScript/WASM assets and does not natively support
  server-based SSR frontends:
  <https://v2.tauri.app/start/frontend/>
- Astro's `output: "static"` prerenders pages and outputs a static site by
  default when pages do not opt out:
  <https://docs.astro.build/en/reference/configuration-reference/#output>
- Tauri frontend code calls Rust through registered commands with serializable
  arguments/results:
  <https://v2.tauri.app/develop/calling-rust/>
- Tauri capabilities define fine-grained command/plugin access for windows and
  webviews:
  <https://v2.tauri.app/security/capabilities/>

### Decision Records And Tradeoffs

The stack decision should stay explicit in implementation issues. These are
the decisions currently made, the alternatives considered, and the tradeoffs to
carry forward.

1. **Rust core over TypeScript-only scripts.**
   - Recommendation: build durable compiler/domain operations in Rust and keep
     TypeScript where Astro, browser APIs, and current tests are the natural
     boundary.
   - Alternatives: keep extending Bun scripts, or rewrite the entire platform
     in Rust at once.
   - Why: Rust gives stronger type, CLI, native app, MCP, testing, and
     distribution foundations. A full rewrite would create too much parity
     risk. Bun scripts should remain until Rust replacements have dual-run
     evidence.
   - Cost: cross-language schema/binding work becomes mandatory.
2. **CLI-first over GUI-first.**
   - Recommendation: make the CLI the first complete interface over shared
     operations.
   - Alternatives: start with the studio GUI, or keep operations hidden behind
     internal scripts.
   - Why: CLI behavior is easier to snapshot, run in CI, compare against
     current behavior, and expose to MCP. The GUI should prove reuse after the
     operation contracts exist.
   - Cost: some author-facing product value waits until command contracts are
     stable.
3. **Tauri/Astro studio over Electron, web-only, or a framework-only shell.**
   - Recommendation: use Tauri for the native shell and Astro for the static
     studio frontend shell, with framework islands only where interaction
     complexity requires them.
   - Alternatives: Electron, hosted web app first, or a React/Vite-only Tauri
     frontend.
   - Why: Tauri keeps native permissions and packaging close to the Rust
     operation core; Astro matches the repo's static-first and content-first
     direction and can ship a static frontend bundle into Tauri.
   - Cost: the studio frontend must respect Astro's static model and avoid
     treating Astro as an app-state owner. If a future screen needs a richer
     client framework, it should be embedded as an island or bounded app
     surface, not used to bypass operation contracts.
4. **Bundled provider adapters over provider-owned core.**
   - Recommendation: Cloudflare, GitHub, local filesystem, and repo-local media
     should be excellent bundled adapters/extensions, not assumptions in core
     source, media, workflow, or deploy models.
   - Alternatives: make Cloudflare/GitHub the default product model, or make
     every provider a third-party plugin from day one.
   - Why: the default user needs a simple path, while TPM and larger publishers
     need provider flexibility. Bundled adapters give strong defaults without
     locking the model.
   - Cost: capability reporting and unsupported-operation diagnostics must be
     designed early.
5. **Plan/apply mutations over direct writes.**
   - Recommendation: any operation that can mutate source files, media,
     provider state, release artifacts, or remote services should have a plan
     result before apply.
   - Alternatives: direct write commands with confirmation prompts, or GUI-only
     undo.
   - Why: plan/apply gives CLI, GUI, MCP, CI, and review workflows one safety
     model and makes future audit logs possible.
   - Cost: first implementations take longer because plan output, source diffs,
     and capability diagnostics are part of the feature.

## Architecture Thesis

The architecture is:

```text
Rust operation core
  -> CLI command renderer
  -> Tauri command bindings
  -> MCP tools/resources
  -> CI and just recipes
  -> Astro/static renderer adapters
  -> tests and fixtures

Astro studio frontend
  -> invokes Tauri commands
  -> renders editor, preview, diagnostics, plans, releases, and settings
```

The operation core owns publishing meaning. Interfaces own presentation.

Weak architecture:

```text
CLI has one model
GUI has another model
MCP writes files directly
CI calls unrelated scripts
Tauri commands own provider logic
```

Target architecture:

```text
create typed request
  -> execute shared operation
  -> return typed result with diagnostics
  -> render as CLI human output, CLI JSON, GUI state, MCP result, or CI report
```

## Primary Boundaries

### 1. Rust Core Crates

Rust should own durable, testable, mostly framework-agnostic domain logic:

- workspace discovery;
- source artifact inventory;
- path and URL policy;
- diagnostics and report envelopes;
- route and redirect policy;
- media inventory and materialization policy;
- source/config/content schemas where practical;
- release manifest and release reports;
- generated-output verification models;
- source/history/workflow/build/deploy adapter traits;
- extension capability and manifest contracts;
- operation request/result types.

The Rust core should avoid:

- Astro component imports;
- DOM APIs;
- browser local storage;
- direct Tauri types except in Tauri adapter crates;
- direct Cloudflare/GitHub assumptions except in provider adapter crates;
- current TPM site content assumptions;
- current working directory singletons.

### 2. Astro Renderer And Frontend

Astro should own:

- current deployed site pages, layouts, components, islands, and Markdown/MDX
  rendering;
- studio frontend shell and static UI;
- editor screens, settings screens, issue panels, and preview controls;
- component reuse where the browser is the natural environment.

Astro should not own:

- canonical source/workflow/deploy state;
- provider actions;
- filesystem writes;
- credential handling;
- release authority;
- business rules that CLI/MCP/CI also need.

### 3. Tauri Shell

Tauri should own:

- desktop app packaging;
- permissioned native bridge;
- filesystem and provider access through explicit capabilities;
- command bindings over Rust operations;
- progress/cancellation events;
- secure credential adapter boundaries.

Tauri should not own:

- source parsing;
- publication policy;
- direct file mutations outside operation plan/apply;
- deploy provider assumptions in GUI code;
- a separate storage model for canonical content.

### 4. CLI

The CLI should be the first complete interface over the operation core because
it is easiest to test, easiest to run in CI, and easiest to use for parity
checks.

The CLI should own:

- command grammar;
- help text;
- stable exit codes;
- human output rendering;
- JSON/machine output rendering;
- plan/apply confirmation mechanics.

The CLI should not own:

- business logic;
- provider-specific deploy mechanics;
- file mutation policy;
- its own schema model.

### 5. MCP

The MCP server should expose the same operations to agents. It should start
read-heavy and become write-capable only after plan/apply, source diffs, audit
logs, and permission scopes are mature.

## Canonical Operation Model

Every operation should have:

- typed request;
- typed result;
- stable diagnostic list;
- source references;
- provider capability checks where relevant;
- human renderer;
- machine renderer;
- plan mode for mutations;
- apply mode only after explicit approval;
- fixture coverage;
- parity checks when replacing current TypeScript/Bun behavior.

Read/report operations can appear early. Mutating operations need stronger
contracts.

Read/report examples:

- `site_status`;
- `check_site`;
- `doctor_explain`;
- `media_inventory`;
- `route_manifest`;
- `release_inspect`;
- `extension_list`;
- `adapter_capabilities`.

Plan/apply examples:

- `content_create_plan` / `content_apply_plan`;
- `media_migration_plan` / `media_migration_apply`;
- `source_backup_plan` / `source_backup_apply`;
- `publish_plan` / `publish_apply`;
- `rollback_plan` / `rollback_apply`;
- `import_plan` / `import_apply`.

### Operation Promotion Gates

Operations should move through gates instead of jumping directly from internal
helper to public behavior.

1. **Internal operation.** The operation has typed request/result types,
   diagnostics, fixtures, and unit tests. It is not a public CLI/GUI/MCP
   surface yet.
2. **Report operation.** The operation has stable human and JSON renderers,
   snapshot coverage, and source references. It can appear in CI or developer
   reports.
3. **CLI public command.** The operation has help text, examples, exit-code
   policy, transcript tests, and versioned machine output.
4. **GUI read surface.** The operation has generated or schema-validated
   frontend types and renders the same result shape as CLI fixtures.
5. **Plan operation.** A mutating workflow can show source/provider changes,
   unsupported capability diagnostics, and recovery expectations without
   applying them.
6. **Apply operation.** The plan has explicit approval semantics, audit output,
   rollback or recovery behavior, and provider/secret scope tests.
7. **MCP write tool.** The operation is already safe through CLI/GUI
   plan/apply and has MCP-specific permission, audit, and blocked-write tests.
8. **Replacement command.** A Rust operation replaces an existing Bun/TypeScript
   script only after dual-run parity, accepted-difference documentation, and a
   rollback or fallback decision.

Implementation issues should name the gate they are targeting. A command or
screen that skips gates needs an explicit design exception.

## Product Interface Plan

### CLI Command Families

The CLI should keep the command families already designed in
[`TPM_CLI_PRODUCT_STRATEGY.md`](./TPM_CLI_PRODUCT_STRATEGY.md):

```text
tpm site ...
tpm content ...
tpm media ...
tpm source ...
tpm workflow ...
tpm check ...
tpm doctor ...
tpm preview ...
tpm build ...
tpm release ...
tpm publish ...
tpm import ...
tpm export ...
tpm extension ...
tpm adapter ...
tpm mcp ...
```

First vertical slice:

1. `tpm --help`
2. `tpm site status --format json`
3. `tpm check --format json`
4. `tpm doctor`
5. `tpm release inspect`

The first slice should prove:

- typed workspace loading;
- diagnostic envelope;
- human output;
- JSON output;
- stable exit codes;
- snapshot tests;
- fixture site compatibility;
- no replaced Bun behavior.

### Tauri/Astro Studio

The GUI should be an Astro static frontend packaged by Tauri.

Recommended layout:

```text
apps/
  studio/
    frontend/
      astro.config.mjs
      package.json
      src/
        pages-or-routes/
        components/
        editor/
        diagnostics/
        generated-types/
    src-tauri/
      Cargo.toml
      tauri.conf.json
      capabilities/
      src/
        lib.rs
        commands/
```

First GUI proof:

1. Build a minimal Astro studio frontend.
2. Package it in Tauri as static assets.
3. Expose a Tauri command for `site_status`.
4. Expose a Tauri command for `check_site`.
5. Render site status and diagnostics in the GUI.
6. Verify CLI and GUI consume the same Rust result fixtures.

Do not start GUI work with a rich editor. The first proof should test the
interface boundary.

First proof acceptance bar:

- The app loads the static Astro frontend through Tauri without broad file,
  shell, or network capabilities.
- The frontend invokes `site_status` and `check_site` through Tauri commands,
  not through duplicated browser logic.
- Request/result types are shared from Rust through generated TypeScript
  bindings or validated against generated JSON Schema.
- The GUI renders diagnostics with severity, source reference, and remediation
  text from the Rust result envelope.
- A test proves CLI output fixtures and GUI fixtures originate from the same
  operation result data.
- The spike performs no source mutation, credential storage, provider publish,
  external media sync, or rich editor behavior.
- The result states whether Astro routing/components are sufficient for the
  next GUI slice or whether a bounded framework island is justified.

Next GUI slices:

1. Schema-driven site settings view.
2. Content list and route preview view.
3. Markdown/MDX editor with source fidelity.
4. Media library and media reference picker.
5. Preview orchestration.
6. Release/publish plan view.
7. Publish apply flow with provider capabilities and audit log.

### MCP

Initial MCP should expose read/report operations:

- `site_status`;
- `run_check`;
- `run_doctor`;
- `inspect_route`;
- `inspect_media`;
- `create_release_plan`;
- `explain_diagnostic`.

Mutating MCP tools should wait until the CLI and GUI already use plan/apply
for the same operation.

## Implementation Sequence

### Stage 0: Planning And Issue Setup

Purpose: turn this architecture into Linear issues without over-specifying
unknown implementation details.

Deliverables:

- this document;
- roadmap links;
- issue groups for Rust core, CLI, Tauri/Astro GUI, MCP, and adapter work;
- explicit blockers and parallel-safe tracks.

Verification:

- docs agree on one operation-core model;
- no CLI/GUI/MCP issue proposes a separate content/source/workflow model.

### Stage 1: Rust Workspace And QA Foundation

Purpose: add Rust safely without changing site behavior.

Deliverables:

- root Cargo workspace;
- `rust-toolchain.toml`;
- initial crates such as `tpm-core`, `tpm-diagnostics`, `tpm-workspace`,
  `tpm-cli`;
- strict Rust QA baseline from
  [`RUST_QA_TOOLING_EVALUATION.md`](./rust-migration-research/RUST_QA_TOOLING_EVALUATION.md);
- `justfile` recipes for existing Bun gates and new Rust gates.

Blocks:

- all Rust implementation;
- CLI executable;
- Tauri command bindings;
- MCP server.

Verification:

- Rust checks pass;
- existing release checks still pass;
- no generated site output changes.

### Stage 2: Operation Envelope And Workspace Core

Purpose: define the shared request/result/diagnostic model every interface will
use.

Deliverables:

- diagnostic envelope;
- operation metadata;
- source references;
- workspace discovery;
- site/source artifact manifest;
- JSON report schema;
- fixture workspaces.

Blocks:

- CLI status/check commands;
- Tauri status/check commands;
- MCP read/report tools;
- dual-run migration reports.

Verification:

- Rust unit tests;
- snapshot tests for JSON and human diagnostics;
- fixture tests for TPM-like and non-TPM workspaces.

### Stage 3: CLI Vertical Slice

Purpose: make the CLI the first real operation interface.

Deliverables:

- `tpm --help`;
- `tpm site status`;
- `tpm check`;
- `tpm doctor`;
- JSON/human output;
- stable exit-code policy;
- command snapshots and transcript tests.

Blocks:

- CLI-driven CI replacement;
- MCP read/report commands;
- GUI command parity tests.

Verification:

- `assert_cmd`/`trycmd`/snapshot tests;
- fixture site checks;
- output schemas;
- no domain logic in command handlers.

### Stage 4: Dual-Run Rust Migrations

Purpose: migrate high-confidence scripts to Rust without losing behavior.

Candidates:

1. site doctor;
2. image asset location;
3. redirect generation;
4. QA command registry;
5. diagnostic diff;
6. selected generated-output verification modules.

Deliverables for each candidate:

- observe current TypeScript behavior with fixtures;
- implement Rust equivalent;
- add dual-run comparison;
- record accepted differences;
- promote only after parity.

Verification:

- current Bun script and Rust operation agree;
- mismatch reports are source-mapped and actionable;
- `just` commands and docs are updated only after promotion.

### Stage 5: Adapter Contracts

Purpose: make source, media, history, workflow, build, deploy, identity, and
diagnostics provider-neutral.

Deliverables:

- source adapter trait;
- history adapter trait;
- media adapter trait;
- workflow adapter trait;
- build adapter trait;
- deploy adapter trait;
- credential/identity boundary;
- capability registry.

Blocks:

- default local publisher GUI;
- Cloudflare publish GUI;
- GitHub backup/review workflows;
- external media migration;
- complex publisher extension points.

Verification:

- mocked adapters;
- capability-driven UI/CLI/MCP tests;
- dry-run plan fixtures;
- permission/secret-boundary tests.

### Stage 6: Tauri/Astro Command-Binding Spike

Purpose: prove the GUI can consume the same Rust operations as the CLI.

Deliverables:

- `apps/studio/frontend` Astro shell;
- `apps/studio/src-tauri` app shell;
- minimal Tauri capabilities;
- `site_status` command binding;
- `check_site` command binding;
- generated frontend TypeScript types or schema-validated request/result
  types;
- GUI page rendering status and diagnostics.

Blocks:

- production editor;
- publish GUI;
- credentialed provider flows.

Verification:

- Tauri command tests;
- frontend component tests for status/diagnostics rendering;
- parity fixtures proving CLI and GUI consume the same operation results;
- no broad filesystem or shell capabilities.

### Stage 7: Studio Authoring And Preview

Purpose: make real author workflows possible without creating a parallel CMS.

Deliverables:

- schema-driven site settings forms;
- content list;
- article editor with source fidelity;
- media picker;
- draft save plan/apply;
- preview route orchestration;
- diagnostics panel with source mapping;
- restore/version UI over history adapter.

Verification:

- golden source-diff tests;
- preview/release parity tests;
- accessibility and keyboard tests;
- data-loss and recovery tests;
- editor round-trip tests for Markdown/MDX.

### Stage 8: Publish, Release, And Provider Workflows

Purpose: connect author actions to real static publishing while preserving
provider neutrality.

Deliverables:

- release manifest;
- release health report;
- publish plan view;
- publish apply flow;
- rollback plan/apply;
- Cloudflare bundled deploy extension;
- local static export;
- Git/GitHub backup and review adapters as optional workflows.

Verification:

- mocked provider tests;
- release artifact snapshots;
- credential-scope tests;
- publish/rollback audit logs;
- output parity with static build/release checks.

### Stage 9: MCP And Automation

Purpose: expose the same operations safely to agents and automation.

Deliverables:

- read/report MCP tools;
- resource endpoints for route registry, diagnostics, source manifest, release
  manifest, config schema, and generated-output reports;
- dry-run write tools only after plan/apply is mature;
- audit logs and confirmation semantics for write tools.

Verification:

- MCP tool tests;
- read-only default tests;
- blocked unsafe write tests;
- secret redaction tests;
- parity with CLI operation fixtures.

### Stage 10: Packaging, Extraction, And Distribution

Purpose: turn proven seams into reusable packages and distribution assets.

Deliverables:

- public crate/package candidates;
- semver/public API checks;
- examples consuming crates outside the app;
- optional Astro integrations or adapters;
- Tauri app packaging pipeline;
- CLI release pipeline.

Verification:

- external consumer examples;
- semver checks;
- API docs;
- package/source boundary tests;
- app signing/release checks when distribution begins.

## Parallelization Plan

Can start immediately:

- Rust workspace/QA design and implementation;
- `just` command router design;
- operation envelope design;
- CLI skeleton design;
- Tauri/Astro app shell design;
- adapter capability model refinement;
- editor UX prototypes with mocked data.

Should wait for operation envelope:

- real CLI status/check commands;
- Tauri command bindings;
- MCP read tools;
- GUI diagnostics panel.

Should wait for adapter contracts:

- real publish GUI;
- real media migration GUI;
- Git/GitHub backup/review workflows;
- Cloudflare credentialed publish flow;
- external media provider workflows.

Should wait for CLI/operation parity:

- replacing Bun scripts;
- write-capable MCP tools;
- GUI apply flows that mutate source or provider state.

## Linear Issue Grouping

Recommended top-level issue groups:

1. **Rust workspace and QA foundation.**
2. **Operation envelope, diagnostics, and workspace source model.**
3. **CLI vertical slice.**
4. **Dual-run migration of existing QA/site scripts.**
5. **Adapter contracts and capability registry.**
6. **Tauri/Astro studio shell and command-binding spike.**
7. **Schema-driven studio authoring surfaces.**
8. **Preview, release, publish, and rollback workflows.**
9. **MCP read/report tools and later plan/apply tools.**
10. **Packaging, public API, and distribution pipeline.**

Every issue should state:

- which operation or adapter contract it touches;
- whether it is read/report, plan, apply, or public;
- whether it affects CLI, GUI, MCP, CI, or all of them;
- whether it can mutate source/provider state;
- which fixtures prove correctness;
- what blocks it;
- what it blocks.

## Open Questions For Issue Planning

These questions should stay visible while creating issues. They do not block
the whole roadmap, but each relevant implementation issue should resolve or
explicitly defer the question it touches.

1. **Rust version policy.** Pin stable first; set `rust-version` after the
   first dependency floor is real.
2. **TypeScript binding strategy.** Compare `ts-rs`, `specta`, generated JSON
   Schema, and hand-written validation before committing GUI/MCP-facing models.
3. **Local history format.** Decide whether app-managed history is plain files,
   hidden Git, SQLite, or adapter-provided before building author undo/restore.
4. **Studio frontend shape.** Keep Astro as the shell, but decide screen by
   screen whether plain Astro, custom elements, React/Svelte islands, or a
   bounded client app is the simplest correct UI.
5. **Preview strategy.** Define when fast preview can use incremental cached
   artifacts and when full Astro build parity is required.
6. **Credential storage.** Pick OS keychain/Tauri plugin/provider-token
   boundaries before any credentialed publish flow.
7. **Packaging and updates.** Decide signing, notarization, update channels,
   and release provenance before public studio distribution.
8. **Media materialization.** Define cache invalidation, source hashes, and
   provider capability requirements before external media workflows.
9. **Hosted studio possibility.** Desktop-first does not forbid a later hosted
   studio, but the source/provider/credential model must not assume local
   desktop only.

## What Not To Put In First Issues

The first implementation wave should stay focused. Do not include these until
their prerequisites exist:

- rich Markdown/MDX editing;
- credentialed Cloudflare/GitHub/provider publishing;
- external media storage migrations;
- source-writing GUI flows;
- write-capable MCP tools;
- public package extraction;
- app signing/update distribution;
- replacing existing Bun scripts without dual-run parity.

## Design Risks

### GUI Parallel Model

Risk: the studio becomes the easiest place to bypass compiler contracts.

Countermeasure: every GUI action calls shared operations; source mutations use
plan/apply; editor output is verified by golden source diffs.

### CLI Script Wrapper

Risk: the CLI becomes a nicer command runner for unrelated scripts.

Countermeasure: command handlers parse intent and call typed operations; Bun
scripts are migrated only through parity-backed operation replacements.

### Provider Lock-In

Risk: Cloudflare, GitHub, or repo-local assets become hidden core assumptions.

Countermeasure: model them as excellent bundled adapters/extensions, not core
truth.

### Preview Drift

Risk: fast GUI preview diverges from release output.

Countermeasure: preview paths emit preview manifests and are parity-tested
against full static builds before publish.

### Permission Creep

Risk: Tauri permissions become broad because it is convenient.

Countermeasure: minimal capabilities, selected workspace/media roots, no global
shell/filesystem access, and provider-specific credential scopes.

### Rust Overreach

Risk: Rust migration tries to replace Astro rendering or browser behavior too
early.

Countermeasure: Rust owns compiler/domain operations; Astro remains renderer
and frontend adapter until a specific domain has a better Rust-native boundary.

## Done Criteria For This Planning Track

This planning track is ready for Linear execution when:

- this document, the roadmap, CLI strategy, Rust migration plan, studio vision,
  adapter model, and extension model agree on the same operation-core
  architecture;
- no remaining plan implies a separate GUI/CLI/MCP source model;
- issue groups can be created with explicit blockers;
- initial implementation can begin with Rust workspace/QA and operation
  envelope work without waiting for GUI design;
- Tauri/Astro GUI work has a first proof target that does not require a rich
  editor or credentialed publish flow.

## Bottom Line

Build the durable core first, expose it through the CLI first, prove GUI reuse
with a Tauri/Astro command-binding spike second, and only then build rich
authoring, preview, publish, and MCP write workflows.

This is the safest path to the final product: a non-technical static blog
studio with CLI, MCP, CI, and GUI surfaces that all share one typed,
deterministic publishing compiler.
