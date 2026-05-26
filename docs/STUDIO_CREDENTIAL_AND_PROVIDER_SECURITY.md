# Studio Credential And Provider Security

This document defines the credential, provider, permission, audit, and
redaction contract for the future static publishing studio. It completes the
design pass for `IRK-125` and connects the studio product vision, adapter
model, extension model, deployment adapter contract, static-output security
policy, and supply-chain/secret policy.

The goal is to let GUI, CLI, MCP, CI, and provider adapters share one security
model before credentialed publishing, hosted accounts, third-party extensions,
or write-capable automation exist.

## Goals

- Keep credentials out of source files, generated output, release artifacts,
  exported workspaces, logs, diagnostics, comments, and public docs.
- Make every provider-backed action capability-checked before it is shown,
  planned, or executed.
- Require dry-run plans and explicit approval for writes, publishes,
  destructive operations, and provider mutations.
- Give default users simple language such as "Connect provider" and "Publish"
  while preserving precise scopes, audit, and recovery for power users.
- Let advanced publishers replace identity, source, media, workflow, build,
  deploy, and observability providers without bypassing platform policy.
- Keep MCP and agent access safe by default: read-only first, plan before
  apply, no unredacted secrets, and auditable mutations.

## Non-Goals

This contract does not implement OAuth flows, hosted account storage, desktop
keychain bindings, or provider-specific APIs. It defines the platform boundary
those implementations must satisfy later.

This contract also does not make GitHub, Cloudflare, a hosted secrets manager,
or any single asset store mandatory. Each is one possible provider behind a
capability contract.

## Core Invariants

1. Secret values are never ordinary config.
2. Source intent and credential state are separate domains.
3. Interfaces express user intent; adapters handle provider mechanics.
4. Provider capabilities are checked before UI actions, CLI commands, MCP
   tools, or CI steps can execute.
5. Every credentialed mutation has an audit record.
6. Every unsupported or insufficiently scoped action produces an actionable
   diagnostic instead of a late provider failure.
7. Read-only inspection must work without granting write, publish, deploy, or
   destructive scopes.
8. Third-party extensions are untrusted until explicit policy grants the
   required permissions.

## Credential Reference Model

Platform code should pass credential references, not secret values.

```ts
interface CredentialReference {
  id: string;
  providerId: string;
  subject: CredentialSubject;
  scopes: ProviderScope[];
  storage: CredentialStorageSummary;
  state: CredentialState;
  expiresAt?: string;
  lastVerifiedAt?: string;
}
```

The reference may identify where a secret lives and what it can do, but it must
not contain the token, key, password, OAuth refresh token, private key, or
cookie itself.

`CredentialSubject` should distinguish:

- a local user;
- a publication workspace;
- a provider account;
- an organization;
- a CI job;
- an MCP client;
- a hosted studio service account;
- a third-party extension grant.

`CredentialState` should use explicit states:

- `missing`;
- `pending`;
- `connected`;
- `expired`;
- `revoked`;
- `insufficient-scope`;
- `provider-unreachable`;
- `disabled`;
- `untrusted-extension`;
- `unknown`.

Unknown state must be treated as not safe to execute writes. It may allow
read-only provider status checks when the adapter declares that check safe.

## Storage Profiles

Credential storage depends on runtime. The platform should model the storage
profile and enforce the same redaction rules everywhere.

| Runtime               | Expected storage model                                     | Notes                                                                 |
| --------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| Desktop studio        | OS keychain or encrypted app storage                       | Default for local non-technical users.                                |
| CLI local             | OS keychain, explicit credential file, or environment      | Avoid secret flags and shell history.                                 |
| CI                    | CI secret manager or environment injected at runtime       | Never commit CI secrets or serialize them into artifacts.             |
| Hosted studio         | Hosted secrets manager with tenant and workspace isolation | Requires a separate hosted security review before implementation.     |
| MCP server            | No implicit storage by default                             | Tools receive scoped references and never expose values in responses. |
| Static generated site | No credential storage                                      | Public output may contain provider URLs, never provider secrets.      |

Plain committed config may store provider IDs, target names, required scopes,
public URLs, and credential-reference IDs. It must not store secret values.

## Scope Model

Scopes should be platform concepts first and provider-specific permissions
second. Provider adapters map platform scopes to provider permissions.

Baseline platform scopes:

- `provider.status.read`;
- `source.read`;
- `source.write`;
- `history.read`;
- `history.write`;
- `media.read`;
- `media.write`;
- `workflow.read`;
- `workflow.transition`;
- `build.run`;
- `deploy.preview`;
- `deploy.publish`;
- `deploy.rollback`;
- `diagnostics.read`;
- `observability.import`;
- `extension.configure`;
- `credential.test`;
- `credential.rotate`;
- `credential.revoke`.

Provider-specific scopes may be recorded in adapter diagnostics and advanced
details, but default users should see the product capability and the concrete
repair step.

## Operation Safety Classes

Every GUI action, CLI command, MCP tool, CI step, and extension operation
should declare one safety class.

| Class             | Examples                                | Default behavior                                                |
| ----------------- | --------------------------------------- | --------------------------------------------------------------- |
| Read-only         | inspect routes, list diagnostics        | Allowed when source is readable.                                |
| Local write       | save draft in local workspace           | Allowed after validation and undo/restore support.              |
| Source write      | commit source, migrate media references | Requires proposed diff and confirmation or workflow policy.     |
| Provider read     | fetch deploy status, validate domain    | Requires credential reference and read scope.                   |
| Provider mutation | create preview, purge cache             | Requires plan, explicit approval, audit, and scoped credential. |
| Publish           | deploy production release               | Requires release artifact, checks, plan, approval, and audit.   |
| Destructive       | revoke credential, delete remote asset  | Requires strongest confirmation, rollback notes, and audit.     |
| Agent write       | MCP proposed edit or publish apply      | Disabled unless explicit write scope and apply step exist.      |

Interfaces should hide unavailable actions when absence is expected, disable
them with explanation when the user can repair the state, and reject them with
diagnostics when an unsafe caller attempts execution anyway.

## Provider Action Flow

Credentialed operations should follow the same plan/apply shape:

1. Load source intent and provider configuration.
2. Resolve adapter capabilities.
3. Resolve credential references and states.
4. Produce a dry-run plan with source changes, generated artifacts, provider
   actions, expected URLs, manual steps, and rollback limits.
5. Run checks that do not mutate provider state.
6. Require approval for writes, provider mutations, publishes, and destructive
   operations.
7. Execute through the adapter with scoped credentials.
8. Emit audit events and provider diagnostics.
9. Emit release or recovery artifacts that reference credential IDs and scopes,
   never secret values.

No interface should skip the plan phase for publish, rollback, migration, or
provider mutation.

## Redaction Contract

Redaction applies to logs, diagnostics, MCP tool responses, CLI output, GUI
panels, release reports, test snapshots, Linear/GitHub comments, and generated
docs.

Always redact:

- access tokens;
- refresh tokens;
- API keys;
- private keys;
- session cookies;
- webhook secrets;
- OAuth authorization codes;
- signed upload URLs when they grant write access;
- credential file paths when they reveal private local structure;
- provider logs that include secret-like substrings.

Allowed fields after review:

- provider ID;
- target name;
- public account or organization label;
- public URL;
- credential reference ID;
- scope names;
- expiration timestamp;
- last verification timestamp;
- non-secret provider error code.

Diagnostics should say what failed and how to fix it without exposing the value
that failed.

## Audit Contract

Every credentialed mutation should produce an audit event with:

- event ID;
- timestamp;
- actor subject;
- interface: GUI, CLI, MCP, CI, or adapter;
- operation ID;
- safety class;
- provider and target;
- credential reference ID;
- requested scopes;
- source artifact or release reference;
- dry-run plan reference when applicable;
- approval reference when applicable;
- result state;
- diagnostics;
- rollback or recovery reference when available.

Audit events must not contain secret values. Audit logs may be local, provider
backed, or enterprise-backed depending on the configured history and workflow
adapters.

## Extension Permissions

Extensions that request provider, credential, file, network, script, or output
access must declare it in their manifest. The extension catalog should expose
that request before installation or enablement.

Policy expectations:

- essential bundled and optional official extensions may receive trusted
  defaults, but still declare permissions and tests;
- site extensions may only access site-owned source/config through declared
  schemas and permissions;
- third-party extensions are denied credential, deploy, source write, and
  network permissions until explicitly granted;
- disabling an extension must explain what source, output, and credential
  behavior changes;
- uninstall must either prove no owned source remains or run a declared
  migration.

Credential grants belong to the workspace or user, not to arbitrary extension
code. Extensions receive scoped adapter services, not raw secrets.

## Interface Rules

### GUI

The GUI should use author language by default:

- Connect provider.
- Test connection.
- Needs permission.
- Publish is blocked.
- Reconnect account.
- Review publish plan.
- Roll back release.

Advanced details may show provider scope names, diagnostic codes, and adapter
reports. The default path should not ask users to paste tokens unless a
provider profile explicitly requires it and explains the risk.

### CLI

CLI commands should:

- never accept secrets in positional arguments;
- avoid secret values in flags;
- support keychain, stdin, explicit files, or environment references when
  needed;
- print redacted output by default;
- expose stable JSON result shapes for automation;
- use non-zero exit codes for blocked, failed, and unsafe states;
- require explicit flags for apply/publish/destructive operations.

### MCP

MCP should start read-only:

- resources and tools can inspect source, routes, diagnostics, capabilities,
  release plans, and provider status;
- write-capable tools require explicit permission, plan-first behavior, and an
  apply step;
- tool responses must never include secret values;
- agent-readable diagnostics should include repair steps and safe next actions.

### CI

CI may receive credentials from the CI secret manager, but release artifacts
must only record credential references, scope names, and provider result
summaries. CI logs should use the same redaction contract as the CLI and MCP.

## Recovery And Revocation

The studio should treat recovery as a first-class product surface.

Required recovery flows:

- reconnect expired credentials;
- revoke a provider connection;
- rotate a credential;
- downgrade from connected provider to manual steps;
- export source without credentials;
- publish by static-folder export when provider publish is blocked;
- roll back or redeploy a previous release when provider rollback is absent;
- disable an extension and preserve or migrate owned source.

Recovery diagnostics should identify whether the next action belongs to the
author, site owner, developer, provider administrator, or external provider.

## Fixture And Verification Requirements

Future implementation should add deterministic fixtures for:

- missing credential;
- connected credential with sufficient scope;
- connected credential with insufficient scope;
- expired credential;
- revoked credential;
- provider unreachable;
- disabled extension requiring a credential;
- untrusted third-party extension requesting credential access;
- read-only MCP access;
- denied MCP write;
- plan-only publish;
- approved publish;
- failed publish with recovery path;
- rollback supported;
- rollback unsupported with redeploy fallback;
- generated output containing no credential values;
- release artifact containing references but no secret values;
- logs and diagnostics with redaction applied.

Blocking tests should prove secrets cannot leak into generated static output,
release artifacts, source snapshots, exported workspaces, docs, comments, or
MCP responses.

## Relationship To Existing Contracts

- `docs/SUPPLY_CHAIN_AND_SECRET_POLICY.md` owns repo-level dependency,
  lockfile, secret-scan, public-env, and third-party-script posture.
- `docs/STATIC_OUTPUT_SECURITY.md` owns browser-facing static-output trust
  boundaries.
- `docs/DEPLOYMENT_ADAPTER_CONTRACT.md` owns deploy request/result shapes and
  requires credential references rather than secret values.
- `docs/EXTENSION_ARCHITECTURE.md` owns extension manifests, capability
  declarations, permissions, and lifecycle states.
- `agent-docs/STUDIO_ADAPTER_MODEL.md` owns provider adapter families.
- This document owns the shared credential, scope, audit, redaction, and
  recovery contract those surfaces must use.

## Exit Criteria

The future studio is ready to design credentialed workflows when:

- every provider-backed action declares capabilities, scopes, and safety class;
- every interface consumes credential references instead of secret values;
- every mutation has plan/apply, redaction, and audit behavior;
- every unsafe or unsupported state has an actionable diagnostic;
- provider-specific details remain inside adapters and extension manifests;
- tests can prove generated output and release artifacts never contain secrets.
