# CLI Distribution

This document records the Milestone 14 distribution plan for the `tpm` CLI
binary. It supports `IRK-207`.

## Scope

The CLI is a product interface over the shared Rust operation core. It is not
the repository command router. Repository workflows continue to use `just`;
the CLI should expose author, operator, automation, and studio-adjacent product
operations.

Current distributable artifact:

- binary name: `tpm`;
- package: `crates/tpm-cli`;
- current role: additive product CLI proof over operation contracts;
- library API: private implementation detail except for generated command
  reference support.

## Local Artifact Build

The local release artifact smoke path is:

```sh
just cli-release-smoke
```

The smoke check should prove:

- the `tpm` binary builds in release mode with the pinned lockfile;
- `tpm --help` prints the product CLI surface;
- `tpm --version` prints the platform name and version;
- a JSON command such as `tpm site status --format json` emits the shared
  operation envelope.

This smoke path is not a cross-platform release pipeline yet. It is the local
distribution invariant that future CI release artifacts should reuse.

## Generated Command Reference

The generated command reference lives at
[`docs/generated/tpm-cli-reference.md`](../generated/tpm-cli-reference.md).

Use:

```sh
just cli-reference
just cli-reference-check
```

The reference is generated from the `tpm-cli` command model instead of being
hand-maintained. This keeps `--help`, docs, and release smoke tests aligned.

## Future Release Pipeline

Before public CLI release, add:

1. target platform matrix and artifact naming policy;
2. checksum/provenance generation;
3. install and update documentation;
4. packaged binary smoke tests for each supported platform;
5. release notes and migration notes for breaking CLI behavior;
6. optional installer or package-manager distribution after binary artifacts
   are reliable.

The first public release should ship the binary, generated command reference,
artifact checksums, and a minimal install guide. It should not expose
repository-only `tpm-xtask` behavior.

## Non-Goals

- Do not expose `just` recipes as `tpm` commands.
- Do not publish the `tpm-cli` library API as stable until it has an explicit
  public crate contract.
- Do not accept secrets as command-line flags in future provider commands.
