# CLI Product Contract

This document is the design packet for `IRK-141`: the future `tpm` command
line product contract, feature set, command language, output policy, and safety
model.

The CLI is a first-class interface over the headless studio core. It is not a
replacement name for current repo-local `just` recipes. Repository command
orchestration remains `just` until specific behavior is promoted through the
shared operation core.

Related documents:

- [CLI_DESIGN_GUIDE.md](../../agent-docs/cli/CLI_DESIGN_GUIDE.md)
- [TPM_CLI_PRODUCT_STRATEGY.md](../../agent-docs/cli/TPM_CLI_PRODUCT_STRATEGY.md)
- [RUST_MIGRATION_AND_CLI_PLAN.md](../../agent-docs/rust/RUST_MIGRATION_AND_CLI_PLAN.md)
- [CLI_RUST_GUI_INTEGRATION_PLAN.md](../../agent-docs/roadmap/CLI_RUST_GUI_INTEGRATION_PLAN.md)
- [HEADLESS_STUDIO_CORE_CONTRACT.md](../studio/HEADLESS_STUDIO_CORE_CONTRACT.md)
- [STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md](../studio/STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md)

## Goals

1. Give authors, site owners, operators, developers, CI, migration users, and
   automation users a durable terminal interface over studio actions.
2. Keep commands product-shaped: check, preview, publish, rollback, import,
   export, media, providers, and extensions.
3. Keep JSON output stable enough for automation and parity tests.
4. Require dry-run, proposed-diff, and approval behavior for risky operations.
5. Keep provider mechanics behind adapter capabilities.
6. Make the CLI an adapter over the headless studio core.

## Non-Goals

- This document does not implement the CLI.
- This document does not freeze every final flag.
- This document does not replace current repository `just` recipes.
- This document does not require GitHub, Cloudflare, Wrangler, or repo-local
  assets.

## Command Design Principles

The CLI should:

- use verbs that match product intent;
- keep defaults safe and useful;
- print concise human output by default;
- support `--json` for automation;
- support `--dry-run` for mutating operations;
- show proposed diffs before writes;
- use stable exit codes;
- never ask interactive questions in CI/non-interactive mode;
- never accept secrets through flags when that risks shell history exposure;
- point diagnostics to source references and repair steps;
- use the same operation results as GUI, MCP, and CI.

## Top-Level Help Shape

Target help shape:

```text
tpm - static publishing studio

Usage:
  tpm <command> [options]

Core commands:
  init                 Create or connect a publication workspace
  status               Inspect workspace, provider, and release status
  check                Validate source and generated-output readiness
  dev                  Start local preview tooling for a workspace
  preview              Build or open a preview for source changes
  publish              Publish a verified release through configured providers
  rollback             Plan or apply a rollback to a previous release

Content:
  article              Create, inspect, validate, or edit articles
  media                Add, inspect, relink, materialize, or migrate media
  redirects            Inspect, add, and validate redirects
  metadata             Inspect metadata, social previews, feeds, PDFs, search

Operations:
  release              Prepare, verify, inspect, and export release reports
  deploy               Check, preview, publish, and rollback deploy targets
  import               Import content from another source
  export               Export source, generated output, or release artifacts
  migrate              Plan and apply source/media/workflow/provider upgrades

Administration:
  providers            Connect, test, inspect, and disconnect providers
  extensions           List, enable, disable, and inspect extensions
  config               Inspect and validate site and CLI configuration
  observability        Import and report provider/search/performance signals

Global options:
  --workspace <path>   Use a specific publication workspace
  --site <id>          Select a site in a multi-site workspace
  --profile <name>     Select a provider/profile configuration
  --json               Print machine-readable output
  --format <format>    Output format: human, json, ndjson
  --dry-run            Plan changes without applying them
  --yes                Confirm safe planned actions in non-interactive mode
  --quiet              Suppress non-essential human output
  --verbose            Show advanced provider and diagnostic details
  --no-color           Disable color output
  --help               Show help
  --version            Show version
```

## Command Families

### Workspace

- `tpm init`
- `tpm status`
- `tpm config inspect`
- `tpm config check`
- `tpm export source`

These commands discover or create a workspace and inspect source health without
requiring provider setup.

### Authoring

- `tpm article new`
- `tpm article check`
- `tpm article inspect`
- `tpm article edit`
- `tpm media add`
- `tpm media check`
- `tpm media relink`
- `tpm redirects add`
- `tpm redirects check`

Authoring commands should call source and schema operations. They may open an
editor when appropriate, but file editing is not the contract.

### Preview And Check

- `tpm check`
- `tpm doctor`
- `tpm preview`
- `tpm metadata inspect`
- `tpm pdf check`
- `tpm release verify`

These commands should share diagnostics and artifact summaries with GUI, MCP,
CI, and release reports.

### Publish And Release

- `tpm release prepare`
- `tpm release report`
- `tpm deploy check`
- `tpm deploy preview`
- `tpm deploy publish`
- `tpm publish`
- `tpm rollback`
- `tpm deploy rollback`

`tpm publish` is the product shortcut. `tpm deploy *` exposes target-specific
details for operators.

### Import, Export, And Migration

- `tpm import wordpress`
- `tpm import markdown`
- `tpm export source`
- `tpm export static`
- `tpm migrate plan`
- `tpm migrate apply`
- `tpm migration report`

Migrations default to dry-run and produce deterministic plans.

### Providers And Extensions

- `tpm providers list`
- `tpm providers connect`
- `tpm providers status`
- `tpm providers test`
- `tpm providers disconnect`
- `tpm extensions list`
- `tpm extensions enable`
- `tpm extensions disable`
- `tpm extensions inspect`

Provider commands should manage credential references and capability checks,
not raw provider secrets.

### Observability

- `tpm observability import`
- `tpm observability report`
- `tpm observability inspect`

These commands import external signals such as search console, crawl errors,
performance data, and deploy health into normalized diagnostics.

## Safety Classes

| Safety class      | Examples                                    | Default CLI behavior                                         |
| ----------------- | ------------------------------------------- | ------------------------------------------------------------ |
| Read-only         | `status`, `check`, `metadata inspect`       | run immediately                                              |
| Local write       | `article new`, local draft save             | show path and diff; confirm if interactive                   |
| Source write      | source migration, redirect add              | dry-run by default; require `--yes` or prompt                |
| Provider read     | provider status                             | require credential reference                                 |
| Provider mutation | preview deploy, cache purge                 | dry-run plan; require approval                               |
| Publish           | production publish                          | require clean checks, release plan, credential, approval     |
| Destructive       | disconnect provider, delete remote asset    | strongest confirmation; no implicit `--yes` for unknown risk |
| Agent write       | MCP-equivalent write through CLI automation | explicit non-interactive policy and audit                    |

## Output Contract

Human output:

- concise summary;
- diagnostics grouped by severity and source;
- next actions;
- provider details only when useful or `--verbose`.

JSON output:

```text
{
  "schemaVersion": "...",
  "operation": "...",
  "status": "...",
  "workspace": {...},
  "diagnostics": [...],
  "sourceDiffs": [...],
  "artifacts": [...],
  "providerReports": [...],
  "auditEvents": [...],
  "nextActions": [...]
}
```

`--json` must not include color, spinners, progress bars, prompts, or
unredacted secrets.

Exit-code policy:

- `0`: success;
- `1`: validation, diagnostics, or blocked operation;
- `2`: command usage error;
- `3`: provider or credential unavailable;
- `4`: unsafe operation rejected;
- `5`: unexpected internal error.

Exact codes can be refined during implementation, but they must be stable once
published.

## Workspace And Provider Discovery

Discovery order:

1. `--workspace`;
2. nearest workspace marker;
3. configured default workspace;
4. guided `tpm init`.

Provider selection:

1. explicit command flag;
2. active workspace profile;
3. default provider for operation;
4. diagnostic if ambiguous.

CLI config may store non-secret defaults. Credential secrets belong in OS
keychain, explicit secret stores, CI secret injection, or provider-specific
secure storage.

## Relationship To Current Scripts

Current Bun scripts remain repository developer tooling. They are not public
product commands.

Future promotion path:

1. Identify a repo script behavior that should become a product operation.
2. Move policy into the headless core.
3. Add operation result and diagnostic contracts.
4. Add CLI command over that operation.
5. Keep or remove the repo script based on developer workflow needs.

Examples:

- `just release-check` may remain a developer/repo gate while `tpm check`
  becomes the product validation command.
- `just preview` may remain an Astro local script while `tpm preview`
  orchestrates workspace, provider, and artifact-aware preview.

## Verification Plan

Later implementation should include:

- help-output snapshots;
- command parser tests;
- read-only command fixtures;
- local write dry-run and apply fixtures;
- provider capability and credential failure fixtures;
- publish plan and rollback plan fixtures;
- JSON schema snapshots;
- non-interactive CI behavior tests;
- secret redaction tests;
- parity fixtures shared with GUI and MCP.

## Handoff

Milestone 8 should implement the initial Rust CLI skeleton and first operation
vertical slice. Later milestones should add provider, publish, migration, and
parity behavior only through the headless studio core.
