# Rust Adapter Capability Runtime

This document describes the Milestone 10 Rust adapter capability runtime. The
runtime is the first provider-neutral implementation slice for future CLI, GUI,
MCP, CI, and studio workflows that need to ask what configured providers can do
before showing, planning, or executing actions.

## Goals

- Keep provider capabilities in shared Rust operation code, not in a CLI-only,
  GUI-only, MCP-only, or Cloudflare-specific model.
- Represent local-only, TPM-like, and complex publisher provider profiles
  without making GitHub, Cloudflare, repo-local assets, or any enterprise tool
  core platform truth.
- Make unsupported, manual, partial, credential-gated, policy-disabled, and
  extension-gated actions visible before work starts.
- Keep credential references non-secret and prove secret handles are redacted
  in serialized output.
- Give later studio, MCP, and publish work stable operation output to consume.

## Implementation Surface

The runtime currently lives in `crates/tpm-operations/src/adapters.rs` and is
exposed through `tpm-operations` re-exports.

Key types:

- `ProviderId`
- `AdapterFamily`
- `CapabilityOperation`
- `CapabilityStatus`
- `CapabilityActionBehavior`
- `ProviderCapability`
- `AdapterDescriptor`
- `CapabilityRegistry`
- `AdapterRuntimeProfile`
- `AdapterInspectionPayload`
- `CredentialReference`
- `CredentialSecretReference`

The public product CLI surface is:

```sh
tpm adapters inspect
tpm adapters inspect --format json
tpm adapter inspect
```

The operation ID is `adapters.inspect`. The CLI command calls
`run_adapter_inspect`; it does not own a separate model.

## Runtime Profiles

`mock_registry(profile)` returns deterministic, network-free adapter fixtures.

| Profile             | Purpose                                                                              |
| ------------------- | ------------------------------------------------------------------------------------ |
| `local-only`        | Solo/local publisher with local source, local media, local build, and manual deploy. |
| `tpm-like`          | Current-project setup with repo media, review, Cloudflare deploy, and metrics.       |
| `complex-publisher` | Enterprise setup with external source, DAM, workflow, build, deploy, and identity.   |

These profiles are fixtures and presets, not product modes. Real provider
configuration should later produce the same `CapabilityRegistry` shape.

## Capability Records

Each `ProviderCapability` records:

- provider ID;
- adapter family and operation;
- capability status;
- required inputs and outputs;
- credential requirement and platform credential scopes;
- dry-run support;
- reversibility;
- destructive behavior;
- audit requirement;
- unsupported-operation behavior;
- supported interfaces;
- provider-owned manual steps;
- optional remediation.

Interfaces should call `action_behavior()` when deciding whether to enable,
hide, disable, reject, reroute, show manual steps, prompt authentication, show
a degraded state, show a policy block, or show an extension requirement.

## Diagnostics

Capability inventory and attempted execution are deliberately separate:

- `unavailable_capability_diagnostics()` produces non-blocking
  `TPM-ADAPTER-CAPABILITY-UNAVAILABLE` warnings for reports such as
  `adapters.inspect`.
- `unsupported_operation_diagnostic()` produces blocking
  `TPM-ADAPTER-UNSUPPORTED-OPERATION` errors for callers that attempt an
  unavailable operation.

This lets inspection commands succeed while still making invalid actions fail
before provider code runs.

## Credential Boundary

`CredentialReference` is a runtime reference, not site content. It can describe
provider ID, subject, storage profile, state, and platform scopes.

`CredentialSecretReference` is an opaque runtime handle. It always serializes
as `[redacted]`. Tests assert that the underlying handle string does not appear
in JSON output.

Do not add raw tokens, keys, cookies, OAuth codes, local credential file paths,
or provider secret values to adapter capabilities, diagnostics, fixtures,
operation output, or docs.

## Verification

Current verification lives in Rust unit/contract tests:

- provider ID validation;
- source/history optional Git behavior;
- media materialization, cache, migration, and unsupported write behavior;
- workflow/build/deploy dry-run, manual-step, audit, and provider-boundary
  behavior;
- credential redaction;
- diagnostics and observability sourceable outputs;
- capability action behavior mapping;
- local-only, TPM-like, and complex publisher mock profile coverage;
- operation-level `adapters.inspect` output for every profile;
- CLI JSON output proving schema version, adapter payload, credentials,
  dry-run support, unsupported statuses, diagnostics, and boundaries.

Focused commands:

```sh
cargo test --package tpm-operations --all-features --locked
cargo test --package tpm-cli --all-features --locked
```

Release handoff should still run `just rust-check` or broader release checks
when the touched surface warrants it.

## Extension And Provider Handoff

Future real providers and extensions should implement or generate the same
registry shape. They should not:

- expose raw provider SDK details as core capabilities;
- bypass credential scopes or action behavior;
- turn unavailable capabilities into late provider stack traces;
- create interface-local capability models;
- treat GitHub, Cloudflare, repo-local media, or any enterprise system as core
  platform assumptions.

When a new adapter family or operation is added, update:

1. `CapabilityOperation` and its `family()`/`as_str()` mappings;
2. mock profile capabilities;
3. operation/CLI tests that prove output shape and safety behavior;
4. relevant design docs if the public contract changes.
