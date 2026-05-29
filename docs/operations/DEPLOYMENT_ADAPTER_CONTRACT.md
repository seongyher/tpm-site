# Deployment Adapter And Release Artifact Contract

This document completes the design pass for `IRK-118`. It defines the platform
contract between release intent, generated static artifacts, provider-specific
deployment behavior, and user-facing diagnostics.

The goal is to keep deployment product behavior stable while allowing different
providers to implement the mechanics. Cloudflare Workers Static Assets is the
reference bundled adapter, but static-folder export, GitHub Pages-style
publishing, and future custom providers must fit the same release shape.

## Design Principles

- Treat publish, preview, rollback, and release checks as product actions, not
  Cloudflare-specific commands.
- Keep credentials out of release artifacts. Artifacts may reference credential
  requirements, but never store secret values.
- Make provider capabilities explicit before work starts.
- Degrade through diagnostics and manual steps when a provider cannot support a
  feature.
- Keep generated output reproducible. A release artifact should explain what
  was built, how it was checked, and what provider action consumed it.
- Keep the default path simple: a single local site can publish without needing
  GitHub, while power users can route the same release through CI or custom
  providers.

## Core Concepts

### Release Artifact

A release artifact is the immutable description of one generated site build. It
is not the deployed site itself; it is the manifest and reports that explain
what the platform emitted and what should be deployed.

At minimum, a release artifact includes:

- release ID and artifact schema version;
- platform version, build command, build mode, and timestamp;
- site identity, canonical URL, configured domains, and active site instance;
- source snapshot reference, such as local path hash, git commit, or imported
  source manifest;
- generated output root and owned artifact manifest;
- route registry snapshot with canonical routes, historical redirects, sitemap
  routes, feed routes, PDF routes, and search routes;
- redirect report, including generated redirects, handwritten redirects,
  duplicate detection, and provider compatibility;
- header and cache policy report;
- metadata report for HTML head, social previews, JSON-LD, feeds, PDFs, and
  scholarly metadata;
- asset report with optimized assets, copied public files, original passthrough
  files, and large-file warnings;
- generated-output verifier report;
- dependency and security report when available;
- payload and performance budget report when available;
- provider plan and provider diagnostics;
- launch or manual follow-up steps;
- release health summary.

### Deployment Adapter

A deployment adapter receives a release artifact plus provider configuration
and turns it into a provider plan, preview deployment, production deployment, or
rollback action.

Adapters are not allowed to decide content policy. They implement provider
mechanics and return structured results.

### Deployment Target

A deployment target is the user's chosen destination, such as:

- local static export folder;
- Cloudflare Workers Static Assets;
- GitHub Pages;
- a future object-store/CDN pair;
- a custom studio extension provider.

Targets can share an adapter when their behavior is compatible, but their
configuration should remain explicit.

## Adapter Inputs

A deploy adapter should accept one normalized request object:

```ts
interface DeployAdapterRequest {
  action: "check" | "preview" | "publish" | "rollback";
  releaseArtifact: ReleaseArtifact;
  target: DeploymentTargetConfig;
  credentials: CredentialReference[];
  mode: "dry-run" | "execute";
  previousRelease?: ReleaseReference;
  logger?: DeploymentLogger;
}
```

The request object should carry:

- release artifact and generated output root;
- provider target kind and target name;
- configured domains and canonical URL;
- credential references, not raw secret values;
- desired action;
- dry-run or execute mode;
- previous release reference when rollback or differential diagnostics need it;
- optional logging hooks for CLI, CI, GUI, and MCP surfaces.

Credential references, provider scopes, redaction, audit, and recovery behavior
are governed by
[`STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md`](../studio/STUDIO_CREDENTIAL_AND_PROVIDER_SECURITY.md).

## Adapter Outputs

Every adapter action should return a structured result:

```ts
interface DeployAdapterResult {
  status: "ok" | "ok-with-warnings" | "blocked" | "failed";
  action: DeployAction;
  target: DeploymentTargetSummary;
  capabilities: DeploymentCapabilityReport;
  diagnostics: DeploymentDiagnostic[];
  providerReports: ProviderReport[];
  urls: DeploymentUrlReport;
  manualSteps: ManualDeploymentStep[];
  rollback?: RollbackReport;
}
```

The result should include:

- status suitable for CLI exit codes and GUI summaries;
- capability report for the requested action;
- provider diagnostics with stable codes where possible;
- preview URL and production URL when available;
- deploy ID, provider release ID, or uploaded artifact ID when available;
- unsupported-operation diagnostics;
- manual steps owned by the provider or user;
- rollback token or rollback limitation report;
- cache purge or cache compatibility report.

## Capability Model

Adapters should report capabilities before execution. A capability can be:

- `supported`;
- `unsupported`;
- `manual`;
- `partial`;
- `unknown-until-authenticated`.

Core capabilities:

- static asset upload;
- immutable asset caching;
- custom headers;
- redirects;
- clean trailing-slash behavior;
- preview deployments;
- production deployments;
- rollback;
- cache purge;
- domain attachment;
- DNS verification;
- CNAME file support;
- environment variables;
- deploy logs;
- provider-side build;
- local build upload;
- dry run;
- credential validation.

The platform should block execution only when a required capability is missing.
Optional capability gaps should become warnings or manual steps.

## Product Actions

### Check

`check` validates that a release artifact can be deployed to a target. It should
not upload files or mutate provider state.

It verifies:

- credentials are present and scoped correctly;
- required capabilities are available;
- redirects and headers can be represented;
- domain config matches provider expectations;
- artifact output exists and is owned by the release;
- manual steps are known.

### Preview

`preview` publishes an isolated release when the provider supports previews. If
the provider cannot preview, the adapter should return `manual` or
`unsupported` diagnostics and may offer static-folder export as a fallback.

### Publish

`publish` deploys the release artifact to the production target. It should
return provider release identifiers and URLs. It should not silently drop
redirects, headers, or generated files.

### Rollback

`rollback` restores a previous release when the provider supports it. If a
provider cannot rollback directly, the adapter should describe the fallback,
usually redeploying a known previous artifact.

## Provider Profiles

### Cloudflare Workers Static Assets

Cloudflare is the reference bundled adapter because it is the project's current
production target.

Expected support:

- local static build upload;
- headers and redirects through generated config;
- custom domains through Cloudflare configuration;
- immutable caching for hashed assets;
- preview or non-production deployments where configured;
- cache purge when credentials allow it;
- useful provider diagnostics through Wrangler and Cloudflare APIs.

Cloudflare-specific details should stay inside the adapter. Platform code
should ask for capabilities such as `customHeaders`, not inspect Wrangler
syntax directly.

Implementation status:

- `src/lib/deployment-adapters.ts` now owns the provider-neutral deployment
  result types and the Cloudflare Workers Static Assets reference adapter.
- `src/platform/deployment.ts` exposes the deployment seam for future CLI, MCP,
  studio, docs, and fixture consumers.
- The Cloudflare adapter parses the current `wrangler.toml`, `_headers`, and
  generated `_redirects` shapes into structured provider facts.
- The adapter returns capability reports, provider reports, URL summaries,
  manual steps, and diagnostics for config mismatches, missing credentials,
  missing immutable Astro asset cache headers, redirect count mismatches,
  domain follow-up, and manual rollback behavior.
- The adapter does not run Wrangler or read secrets. Execute-mode publish and
  preview actions require credential references with a `deploy.publish` scope,
  but secret values stay outside release artifacts.

Current TPM behavior represented by the adapter:

| Provider fact               | Source                                               | Adapter interpretation                                   |
| --------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| Worker name                 | `wrangler.toml` `name = "tpm-site"`                  | Cloudflare target name and provider report row.          |
| Static assets directory     | `wrangler.toml` `[assets].directory = "./dist"`      | Must match the verified release output root.             |
| 404 handling                | `wrangler.toml` `not_found_handling = "404-page"`    | Provider report; confirms static 404-page behavior.      |
| Immutable generated assets  | `site/public/_headers` `/_astro/*`                   | Required cache policy for hashed Astro assets.           |
| Traffic advice content type | `site/public/_headers` `/.well-known/traffic-advice` | Explicit static header preserved as provider facts.      |
| Legacy redirects            | generated `_redirects`                               | Redirect count must match release artifact expectations. |
| Production URL              | release artifact canonical URL                       | Reported as the production deployment URL.               |
| Preview URL                 | Worker preview convention                            | Reported for preview actions as a provider-derived URL.  |

Cloudflare remains an optional official bundled adapter, not the deployment
model itself. Product code should call the adapter contract and inspect
capabilities rather than special-casing `wrangler.toml`.

### Static Folder Export

Static export is the baseline adapter and should require no provider
credentials. It copies or points to a release output folder and emits manual
deployment instructions.

Expected support:

- release artifact creation;
- local folder output;
- manual steps;
- no provider mutation;
- no provider rollback;
- no automatic domain configuration.

This is important for the simplest user journey and for debugging. A user
should always be able to see what would be deployed.

Implementation status:

- `createStaticFolderDeploymentPlan()` is the second adapter fixture and the
  provider-free baseline.
- It shares the same `DeployAdapterRequest` and `DeployAdapterResult` shape as
  Cloudflare.
- It reports local output as supported, while headers, redirects, immutable
  cache policy, production upload, custom domains, DNS, and rollback are manual
  or unsupported.
- Publish returns explicit manual-step diagnostics rather than pretending an
  upload occurred.
- Provider-hosted preview is blocked with `DEPLOY_PREVIEW_UNSUPPORTED`, because
  a local folder export cannot create a remote preview URL.
- Redirect and header support is modeled as degraded unless the exported folder
  includes provider-specific files and the destination host is known to honor
  them.

This fixture is intentionally not a full GitHub Pages, Netlify, S3, or object
storage adapter. It exists to prove the platform contract is portable and that
unsupported provider capabilities become diagnostics instead of silent drops.

### GitHub Pages-Style Deployments

GitHub Pages-style deployments are intentionally limited.

Expected support:

- static upload through repository or action workflows;
- `CNAME` handling when configured;
- limited or no custom header support;
- limited redirect support unless additional static files or provider features
  are used;
- strong warnings when platform features cannot be represented.

The adapter should not hide these limitations. It should report unsupported
cache, header, or redirect behavior explicitly.

## Diagnostics

Deployment diagnostics should include:

- stable code;
- severity;
- target provider;
- affected release artifact field or output file;
- cause;
- remediation;
- whether execution is blocked.

Important diagnostic examples:

- `DEPLOY_CREDENTIAL_MISSING`;
- `DEPLOY_CREDENTIAL_SCOPE_INSUFFICIENT`;
- `DEPLOY_CAPABILITY_UNSUPPORTED`;
- `DEPLOY_REDIRECT_UNSUPPORTED`;
- `DEPLOY_HEADER_UNSUPPORTED`;
- `DEPLOY_CACHE_POLICY_UNSUPPORTED`;
- `DEPLOY_DOMAIN_NOT_CONFIGURED`;
- `DEPLOY_CANONICAL_URL_MISMATCH`;
- `DEPLOY_OUTPUT_MISSING`;
- `DEPLOY_OUTPUT_UNOWNED`;
- `DEPLOY_PROVIDER_CONFIG_CONFLICT`;
- `DEPLOY_ROLLBACK_UNAVAILABLE`;
- `DEPLOY_MANUAL_STEP_REQUIRED`.

Diagnostics should be author-readable in GUI/CLI contexts while preserving
machine-readable codes for CI, MCP, and automation.

## Release Artifact Schema Policy

Release artifact fields should be grouped by stability:

- **stable:** required fields consumed by deploy, verify, CLI, GUI, and CI;
- **experimental:** fields emitted for future adapters but not guaranteed yet;
- **provider:** adapter-owned details namespaced by provider;
- **extension:** third-party extension data with declared ownership.

Stable fields may add optional data, but they should not change meaning without
a schema version bump. Experimental fields must never be required by bundled
deploy adapters.

Release decision policy now lives in
[`RELEASE_GOVERNANCE.md`](../governance/RELEASE_GOVERNANCE.md). Deployment adapters provide
the provider-specific status, diagnostics, URLs, and manual steps consumed by
that report; release governance decides whether the overall release is
adequately documented and safe to publish.

## Verification Plan

Implementation work should add:

- fixture release artifacts for minimal site, TPM-like site, redirect-heavy
  site, and unsupported-provider site;
- mock adapter tests for `check`, `preview`, `publish`, and `rollback`;
- unsupported capability tests proving warnings and blocked statuses are
  deterministic;
- release artifact snapshot tests;
- tests proving credentials are referenced but not serialized into artifacts;
- tests proving Cloudflare, static export, and GitHub Pages-style profiles use
  the same adapter interface;
- one CLI-oriented result fixture and one GUI-oriented result fixture.

The design issue is complete when this document is linked from `IRK-118` and
downstream implementation issues can use it as the adapter contract.
