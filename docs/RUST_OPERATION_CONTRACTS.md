# Rust Operation Contracts

This document defines the first shared Rust contracts for platform operations.
The goal is one typed operation model that can be rendered by the CLI, future
Tauri studio GUI, MCP server, CI reports, generated-output verifiers, and
tests.

These contracts are additive. They do not replace existing Bun/Astro behavior
until later parity milestones prove that a Rust operation is the correct source
of truth for a domain.

## Goals

- Keep operation data typed, serializable, deterministic, and interface-neutral.
- Give authors and site owners actionable diagnostics with source or artifact
  references and remediation.
- Give developers stable machine-readable JSON that can power GUI panels, MCP
  tools, CI annotations, and regression fixtures.
- Keep filesystem and workspace discovery thin around pure domain models.
- Snapshot machine contracts exactly while testing human text with focused
  assertions.

## Crate Boundaries

| Crate             | Responsibility                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `tpm-core`        | Small shared primitives such as `Severity`, `CommandExit`, and platform constants.               |
| `tpm-diagnostics` | Stable diagnostic codes, severities, source/artifact locations, remediation, reports, renderers. |
| `tpm-workspace`   | Workspace discovery, active site roots, source roots, ignored-path policy, source inventory.     |
| `tpm-operations`  | Versioned operation request/result envelopes, status derivation, timing, summaries, renderers.   |
| `tpm-cli`         | Thin command shell. It should parse intent and render operation results, not own domain logic.   |

Do not import Astro pages, layouts, visual components, current TPM content, or
provider-specific deployment code into these crates.

## Diagnostic Contract

Diagnostics represent actionable platform feedback.

Required fields:

- `code`: stable uppercase identifier such as `TPM-WORKSPACE-CONFIG`;
- `severity`: `note`, `warning`, or `error`;
- `message`: author/site-owner-facing summary.

Optional fields:

- `location`: source or generated-artifact reference;
- `remediation`: concrete repair guidance;
- `developerMessage`: implementation context for maintainers.

Severity rules:

- `error` blocks the current operation.
- `warning` is non-blocking but should be visible in human and machine output.
- `note` is informational.

Location rules:

- Source locations point at authored inputs such as `site/config/site.json` or
  `site/content/articles/example.md`.
- Artifact locations point at generated output such as `dist/index.html`.
- Paths should be deterministic display paths relative to the workspace root
  when possible.
- Line and column numbers are one-based and optional.

Renderer rules:

- Human output should be readable and stable enough for users.
- JSON output is the machine contract and should be exact in fixtures.
- Optional fields should be omitted from JSON when absent.

## Workspace Contract

`WorkspaceContext` represents the active source workspace.

Current discovery rule:

1. Start from a path supplied by the caller.
2. Walk ancestors until `site/config/site.json` exists.
3. Treat that ancestor as the workspace root.

Current roots:

| Root                    | Required | Meaning                                      |
| ----------------------- | -------- | -------------------------------------------- |
| `site/config/site.json` | yes      | Active site configuration source.            |
| `site/content`          | yes      | Authored content collections.                |
| `site/assets`           | yes      | Processed source assets.                     |
| `site/public`           | yes      | Static files copied as public output.        |
| `dist`                  | no       | Default generated-output root for reporting. |

Source artifact inventory currently includes:

- the site config file;
- files under `site/content`;
- files under `site/assets`;
- files under `site/public`.

Ignored source parking files:

- `.DS_Store`;
- `.gitkeep`;
- `Thumbs.db`.

Do not ignore every hidden path. Public paths such as
`site/public/.well-known/traffic-advice` are valid source artifacts.

## Operation Envelope

An operation result is a serializable envelope with:

- `schemaVersion`: current machine contract version;
- `request`: operation ID, requesting interface, and optional workspace path;
- `status`: derived from diagnostics as `success`, `warning`, or `failed`;
- `summary`: short title plus optional detail lines;
- `timing`: optional duration in milliseconds;
- `diagnostics`: diagnostic report.

Operation IDs are lowercase stable identifiers such as `workspace.status`.
They should name platform operations, not UI buttons or provider calls.

Current operations:

| Operation ID          | Purpose                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `workspace.status`    | Report discovered workspace source roots, required roots, source inventory, and health.  |
| `workspace.check`     | Run the first Rust workspace diagnostic check over the same operation envelope.          |
| `workspace.doctor`    | Explain workspace diagnostics and remediations through the shared diagnostic model.      |
| `site.doctor`         | Run the dual-run Rust site-doctor report over shared workspace diagnostics.              |
| `migration.baseline`  | Report milestone 9 script-domain classifications and migration cleanup targets.          |
| `media.images`        | Run the dual-run Rust image asset inventory and verification report.                     |
| `routes.redirects`    | Run the dual-run Rust redirect inventory and Cloudflare static redirect policy report.   |
| `qa.registry`         | Report QA command ownership, migration domains, and package-wrapper debt.                |
| `qa.diagnostics-diff` | Compare normalized diagnostic snapshots using the shared operation envelope.             |
| `output.verify`       | Bridge generated-output inventory into shared diagnostics without replacing verifiers.   |
| `release.inspect`     | Inspect the conventional generated-output root and report release-readiness diagnostics. |

Dual-run operations are intentionally report-first. They prove CLI/GUI/MCP/CI
contract shape and capture parity evidence without claiming source-of-truth
status over the existing Bun/Astro release checks until promotion.

The current requesting interfaces are:

- `cli`;
- `gui`;
- `mcp`;
- `ci`;
- `test`.

Status derivation:

- empty diagnostic report -> `success`;
- warnings or notes only -> `warning`;
- any error -> `failed`.

## Fixture And Snapshot Strategy

Machine-readable contracts are protected by exact JSON fixtures under
`tests/fixtures/rust-operations/`.

Current fixture:

- `workspace-status-warning.json`: exercises schema version, request metadata,
  warning status, timing, and warning diagnostics.

Fixture policy:

- Use exact JSON snapshots for operation envelopes and other machine contracts.
- Keep fixtures small and domain-focused.
- Prefer adding a new fixture when a new contract shape appears.
- Avoid exact snapshots for user-facing prose unless wording itself is the
  compatibility contract.
- Use focused assertions for human output to preserve flexibility.

The neutral source workspace fixture lives in
`tests/fixtures/rust-workspace/`. Keep it generic and non-TPM. Add invalid
fixture variants next to it when a test needs broken source state.

## Promotion Rules

A Rust operation can become a public CLI command, GUI action, MCP tool, or CI
report only after it has:

1. typed request/result data;
2. diagnostic behavior for success, warning, and failure paths where relevant;
3. deterministic source/artifact references;
4. human and JSON renderers when user-facing or machine-facing output exists;
5. focused Rust tests;
6. exact machine fixtures for stable serialized output;
7. documentation of any source mutations, provider calls, or credentials.

Mutating operations need a plan/apply design before they are exposed through
CLI, GUI, MCP, or CI.
