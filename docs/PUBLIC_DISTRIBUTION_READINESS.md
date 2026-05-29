# Public Distribution Readiness

This document is the Milestone 14 readiness checklist for reusable packages,
the `tpm` CLI, the Tauri/Astro Studio app, examples, docs, and release
governance. It supports `IRK-209`.

## Current Readiness State

Current state:

- Rust crates are private workspace crates with strict docs, lints, tests, and
  supply-chain policy.
- The `tpm` CLI is a distributable binary candidate, not a public library API.
- The Studio app is a Tauri package candidate with unsigned local packaging
  checks and a separate signing/update plan.
- TypeScript platform entrypoints are internal public seams with a maintained
  consumer example.
- No crate or package should be published externally until its public API,
  compatibility baseline, examples, and release governance are accepted.

## Required Evidence

Before a public release, the release packet should include:

1. package-boundary decisions and extraction/rejection reasons;
2. public API compatibility policy and semver baseline where applicable;
3. external consumer examples that import only stable seams;
4. generated CLI reference and CLI release smoke results;
5. Tauri packaging, signing, update, and secret-handling plan;
6. supply-chain, secret, dependency, unsafe, and binary-size review evidence;
7. release-governance notes for breaking/deprecated public behavior;
8. final release-check output.

## Current Commands

Focused Milestone 14 commands:

```sh
just cli-reference-check
just cli-release-smoke
just studio-package-check
just rust-public-api-check
just rust-dependency-review
just rust-binary-size-review
just distribution-check
```

The normal full gate remains:

```sh
just release-check
```

## Readiness Gate

`just distribution-check` verifies the current distribution invariants:

- required Milestone 14 docs exist;
- generated CLI reference is current;
- CLI, Studio, public API, and distribution `just` recipes are present;
- Studio packaging policy exists;
- current Rust crates remain private unless a public release decision changes
  the workspace policy;
- external consumer examples remain present;
- public-distribution docs do not advertise TPM-only paths as public APIs.

This gate is intentionally narrower than a signed release pipeline. It catches
current drift while leaving credentialed signing, notarization, and
cross-platform artifact publishing for the future release infrastructure.

## Not Ready Until

The platform is not ready for public package/app release until:

- at least one package boundary has an accepted public compatibility contract;
- CLI artifacts are built and smoke-tested for target platforms;
- Studio signing/update credentials and release channels exist;
- package examples are validated against published or package-like entrypoints;
- release governance records all breaking, deprecated, and migration-relevant
  public changes.
