# Supply Chain And Secret Policy

Supply-chain policy makes dependency, lockfile, secret, third-party script, and
asset-provenance posture part of the platform release model. The goal is to
keep release safety explicit while preserving fast local iteration for normal
authors and developers.

The implementation lives in `src/lib/supply-chain-policy.ts` and is exposed
through `src/platform/security.ts` for future CLI, MCP, studio, package, and
starter-template consumers.

## Check Placement

| Check                          | Command                       | Local  | PR     | Release  | Package/starter  |
| ------------------------------ | ----------------------------- | ------ | ------ | -------- | ---------------- |
| High-severity dependency audit | `just audit`                  | no     | yes    | blocking | blocking         |
| All-severity dependency audit  | `just audit-all`              | review | review | no       | review           |
| Secret scan                    | `just secrets`                | no     | yes    | blocking | blocking         |
| Bun lockfile present           | committed `bun.lock`          | yes    | yes    | blocking | package blocking |
| Secret-like `PUBLIC_*` names   | policy diagnostic             | yes    | yes    | blocking | blocking         |
| Third-party script policy      | static-output diagnostics     | no     | yes    | blocking | blocking         |
| Asset provenance               | origin/provenance diagnostics | yes    | yes    | warning  | warning          |

Fast local workflows should avoid high-latency scans unless the edited surface
requires them. Release and package/starter-template workflows should run the
blocking audit and secret posture because their output is intended to be
published or reused by other projects.

## Lockfile Policy

`bun.lock` is a repository contract. It gives release checks, CI, extracted
packages, and starter templates reproducible dependency inputs. Removing or
replacing the lockfile requires an explicit package-manager migration plan.

## Dependency Audit Policy

`just audit` runs `bun audit --audit-level=high` and is part of
`just release-check`. `just audit-all` runs all severities and remains
review/maintenance signal by
default. This keeps urgent supply-chain risk blocking without making every
local edit wait on low-severity dependency noise.

Use package-manager `overrides` for transitive security fixes when an upstream
tool has not yet released a dependency bump, and keep the override as narrow as
the advisory allows. Do not add a direct dependency only to influence the
resolver if the package is not imported by repo code; unused dependency checks
should stay clean.

## Rust Supply-Chain Policy

`just rust-deny` runs `cargo-deny` as part of the blocking Rust gate. It checks
advisories, yanked crates, duplicate dependency versions, licenses, and crate
sources for the Rust operation workspace and the studio shell.

The repo keeps duplicate dependency versions denied for repo-owned operation
crates. The Tauri desktop shell has a narrowly documented duplicate-version
skip-tree for Tauri's platform graph because Tauri currently pulls distinct
transitive versions across desktop/mobile, build-time/codegen, and OS-specific
paths. That exception belongs to the Tauri shell only and should be reviewed on
every Tauri upgrade.

The current Tauri graph also requires explicit advisory ignores for
informational unmaintained advisories in the Linux GTK3 stack and `urlpattern`
Unicode support crates. These are not direct repo-owned dependencies and no
safe upgrade is currently available through Tauri. New vulnerability advisories
must not be added to the ignore list without a separate risk review and
remediation plan.

The Rust license allow-list is intentionally explicit. Adding a new Rust
dependency may require adding an OSI/free license to `deny.toml`; do that only
after checking the dependency path and documenting any non-obvious policy
tradeoff.

## Secret Policy

Secret-like data must not enter source, committed local env files, generated
output, Linear/GitHub comments, docs, fixtures, or release artifacts.

Current required safeguards:

- `.env.local` and `.env.*.local` are ignored;
- `secrets` runs Gitleaks against git history in release checks;
- secret-like `PUBLIC_*` env names are rejected because they imply client-side
  exposure;
- generated-output samples can be checked for common token shapes and diagnostic
  evidence is redacted before display.

Fixtures may contain obviously fake secret-like strings only when the test
proves redaction or rejection behavior. Such fixtures must not be copied into
generated site output.

Future studio, CLI, MCP, CI, and provider-adapter credential flows use the
credential-reference, scope, redaction, audit, and recovery model in
[`STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md`](./STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md).
This policy remains the repo-wide secret and supply-chain posture; the studio
credential contract owns product-facing provider connection behavior.

## Third-Party Script And Asset Provenance Policy

Third-party scripts are rejected by default through the static-output security
model. A site owner can allow one only through a reviewed extension or
deployment policy that documents provider origin, reader privacy impact,
permissions, and rollback path.

Downloaded or migrated assets should preserve source provenance. Missing
provenance is a warning because many legacy assets are historical, but migration
tools and future studio flows should make the provenance field easy to fill
rather than relying on memory.

## Extracted Package And Starter Template Readiness

Future packages and starter templates should inherit this policy shape:

- pin or lock dependency inputs;
- expose a high-severity dependency audit command;
- expose a secret scan or documented equivalent;
- reject secret-like public env names;
- keep third-party script behavior behind explicit extension/provider policy;
- preserve asset provenance in migration or import workflows.

The same policy object should feed CLI, MCP, studio, CI, package, and starter
reports so safety posture does not drift across interfaces.
