# TPM CLI Reference

This file is generated from the `tpm-cli` command model. Do not edit it by hand.
Run `just cli-reference` to refresh it.

## Top-Level Help

```text
tpm - static publishing operations for TPM sites

Usage:
  tpm <command> [options]

Commands:
  adapters inspect   Inspect adapter capabilities and provider boundaries
  site status        Show workspace source roots, config, and source inventory
  site doctor        Run site workspace diagnostics
  check              Run the first Rust workspace diagnostic check
  doctor             Explain current workspace diagnostics and remediation
  media images       Inspect image asset policy
  routes redirects   Inspect route and redirect policy
  release inspect    Inspect generated output/release readiness
  studio settings    Inspect schema-driven Studio settings surfaces
  studio content     Inspect content list and source editor plans
  studio media       Inspect media library and materialization plans
  studio preview     Inspect preview orchestration plans
  studio release     Inspect release manifest and publish plan
  studio publish apply
                     Inspect the gated publish-apply plan
  studio verify      Verify Studio authoring/publish workflow readiness
  help <command>     Show command help
  version            Show version information

Global options:
  --site <path>              Site workspace to operate on
  --format <text|json|ndjson>
                             Output format
  --json                     Alias for --format json
  --ci                       Disable prompts; accepted for automation parity
  --quiet                    Accepted for future concise output
  --verbose                  Accepted for future detailed output
  --no-color                 Disable ANSI color; output is currently plain text

Examples:
  tpm adapters inspect --format json
  tpm site status --format json
  tpm media images
  tpm check --format json
  tpm doctor
  tpm release inspect
  tpm studio release --format json
```

## Adapters

```text
tpm adapters - inspect provider adapter capabilities

Usage:
  tpm adapters inspect [options]
  tpm adapter inspect [options]

Commands:
  inspect       List configured adapters, capability states, credentials,
                dry-run support, unsupported operations, and boundaries

Examples:
  tpm adapters inspect
  tpm adapters inspect --format json
```

## Site

```text
tpm site - create and manage site workspaces

Usage:
  tpm site status [options]
  tpm site doctor [options]

Commands:
  status        Show site config, source roots, source artifacts, and health
  doctor        Run site workspace diagnostics

Examples:
  tpm site status
  tpm site doctor
  tpm site status --site tests/fixtures/rust-workspace --format json
```

## Check

```text
tpm check - validate the current workspace with first-slice Rust diagnostics

Usage:
  tpm check [all|workspace] [options]

Examples:
  tpm check
  tpm check --format json

This first slice checks workspace structure only. Existing Bun/Astro release
checks remain the source of truth for full site validation.
```

## Doctor

```text
tpm doctor - explain current workspace diagnostics and remediation

Usage:
  tpm doctor [workspace] [options]

Examples:
  tpm doctor
  tpm doctor --site tests/fixtures/rust-workspace
```

## Media

```text
tpm media - inspect and validate media assets

Usage:
  tpm media images [options]

Examples:
  tpm media images
  tpm media images --format json
```

## Routes

```text
tpm routes - inspect route and redirect policy

Usage:
  tpm routes redirects [options]

Examples:
  tpm routes redirects
  tpm routes redirects --format json
```

## Release

```text
tpm release - inspect generated output and release readiness

Usage:
  tpm release inspect [latest] [options]

Examples:
  tpm release inspect
  tpm release inspect latest --format json
```

## Studio

```text
tpm studio - inspect Studio authoring, preview, release, and publish operations

Usage:
  tpm studio settings [options]
  tpm studio content [options]
  tpm studio media [options]
  tpm studio preview [options]
  tpm studio release [options]
  tpm studio publish apply [options]
  tpm studio verify [options]

Examples:
  tpm studio settings --format json
  tpm studio content
  tpm studio publish apply --format json
```
