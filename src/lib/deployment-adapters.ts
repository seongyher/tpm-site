/** Product action requested from a deployment adapter. */
export type DeployAction = "check" | "preview" | "publish" | "rollback";

/** Execution mode requested from a deployment adapter. */
export type DeployMode = "dry-run" | "execute";

/** Deployment provider capability support state. */
export type DeploymentCapabilityState =
  | "manual"
  | "partial"
  | "supported"
  | "unknown-until-authenticated"
  | "unsupported";

/** Stable deployment capability key. */
export type DeploymentCapabilityKey =
  | "cachePurge"
  | "cleanTrailingSlash"
  | "credentialValidation"
  | "customDomains"
  | "customHeaders"
  | "deployLogs"
  | "dnsVerification"
  | "dryRun"
  | "environmentVariables"
  | "immutableAssetCaching"
  | "localBuildUpload"
  | "previewDeployments"
  | "productionDeployments"
  | "providerSideBuild"
  | "redirects"
  | "rollback"
  | "staticAssetUpload";

/** Deployment adapter status suitable for CLI, CI, GUI, and MCP consumers. */
export type DeploymentAdapterStatus =
  | "blocked"
  | "failed"
  | "ok"
  | "ok-with-warnings";

/** Deployment diagnostic severity. */
export type DeploymentDiagnosticSeverity = "error" | "info" | "warning";

/** Stable deployment diagnostic code. */
export type DeploymentDiagnosticCode =
  | "DEPLOY_CACHE_POLICY_UNSUPPORTED"
  | "DEPLOY_CREDENTIAL_MISSING"
  | "DEPLOY_DOMAIN_NOT_CONFIGURED"
  | "DEPLOY_HEADER_UNSUPPORTED"
  | "DEPLOY_MANUAL_STEP_REQUIRED"
  | "DEPLOY_OUTPUT_MISSING"
  | "DEPLOY_PREVIEW_UNSUPPORTED"
  | "DEPLOY_PROVIDER_CONFIG_CONFLICT"
  | "DEPLOY_REDIRECT_UNSUPPORTED"
  | "DEPLOY_ROLLBACK_UNAVAILABLE";

/** Reference to a credential without exposing secret values. */
export interface CredentialReference {
  readonly id: string;
  readonly label: string;
  readonly scopes: readonly string[];
}

/** Release artifact subset needed by deployment adapters. */
export interface DeploymentReleaseArtifact {
  readonly generatedOutputRoot: string;
  readonly id: string;
  readonly redirectCount: number;
  readonly schemaVersion: string;
  readonly site: {
    readonly canonicalUrl: string;
    readonly domains: readonly string[];
    readonly name: string;
  };
}

/** Provider-specific deployment target. */
export interface DeploymentTargetConfig {
  readonly canonicalUrl: string;
  readonly domains: readonly string[];
  readonly kind: "cloudflare-workers-static-assets" | "static-folder";
  readonly name: string;
  readonly outputRoot: string;
}

/** Normalized deployment adapter request. */
export interface DeployAdapterRequest {
  readonly action: DeployAction;
  readonly credentials?: readonly CredentialReference[] | undefined;
  readonly mode: DeployMode;
  readonly releaseArtifact: DeploymentReleaseArtifact;
  readonly target: DeploymentTargetConfig;
}

/** One deployment diagnostic. */
export interface DeploymentDiagnostic {
  readonly blocked: boolean;
  readonly code: DeploymentDiagnosticCode;
  readonly message: string;
  readonly provider: string;
  readonly remediation: string;
  readonly severity: DeploymentDiagnosticSeverity;
  readonly target?: string | undefined;
}

/** Manual action required or recommended by a provider. */
export interface ManualDeploymentStep {
  readonly action: string;
  readonly owner: "provider" | "site-owner";
  readonly required: boolean;
}

/** Provider report row surfaced in release health output. */
export interface ProviderReport {
  readonly label: string;
  readonly value: string;
}

/** Deployment URL report. */
export interface DeploymentUrlReport {
  readonly previewUrl?: string | undefined;
  readonly productionUrl?: string | undefined;
}

/** Capability report returned by a deployment adapter. */
export type DeploymentCapabilityReport = Readonly<
  Record<DeploymentCapabilityKey, DeploymentCapabilityState>
>;

/** Normalized deployment adapter result. */
export interface DeployAdapterResult {
  readonly action: DeployAction;
  readonly capabilities: DeploymentCapabilityReport;
  readonly diagnostics: readonly DeploymentDiagnostic[];
  readonly manualSteps: readonly ManualDeploymentStep[];
  readonly provider: "cloudflare-workers-static-assets" | "static-folder";
  readonly providerReports: readonly ProviderReport[];
  readonly status: DeploymentAdapterStatus;
  readonly target: DeploymentTargetConfig;
  readonly urls: DeploymentUrlReport;
}

/** Parsed subset of `wrangler.toml` needed by the Cloudflare adapter. */
export interface CloudflareWorkersStaticAssetsConfig {
  readonly assetsDirectory: string;
  readonly compatibilityDate: string;
  readonly name: string;
  readonly notFoundHandling: "404-page" | "none" | "single-page-application";
}

/** Parsed Cloudflare static asset header rule. */
export interface CloudflareHeaderRule {
  readonly headers: Readonly<Record<string, string>>;
  readonly pathPattern: string;
}

/** Parsed Cloudflare static redirect rule. */
export interface CloudflareStaticRedirectRule {
  readonly destination: string;
  readonly source: string;
  readonly status: number;
}

/** Cloudflare adapter inputs that come from provider files. */
export interface CloudflareWorkersStaticAssetsRequest extends DeployAdapterRequest {
  readonly headersText: string;
  readonly redirectsText?: string | undefined;
  readonly wranglerConfig: CloudflareWorkersStaticAssetsConfig;
}

/** Static folder adapter inputs for provider-free export flows. */
export interface StaticFolderDeploymentRequest extends DeployAdapterRequest {
  readonly includesHeadersFile?: boolean | undefined;
  readonly includesRedirectsFile?: boolean | undefined;
}

/** Reference capability report for Cloudflare Workers Static Assets. */
export const cloudflareWorkersStaticAssetsCapabilities = {
  cachePurge: "manual",
  cleanTrailingSlash: "supported",
  credentialValidation: "unknown-until-authenticated",
  customDomains: "manual",
  customHeaders: "supported",
  deployLogs: "supported",
  dnsVerification: "manual",
  dryRun: "supported",
  environmentVariables: "supported",
  immutableAssetCaching: "supported",
  localBuildUpload: "supported",
  previewDeployments: "supported",
  productionDeployments: "supported",
  providerSideBuild: "unsupported",
  redirects: "supported",
  rollback: "manual",
  staticAssetUpload: "supported",
} as const satisfies DeploymentCapabilityReport;

/** Reference capability report for generic static folder export. */
export const staticFolderDeploymentCapabilities = {
  cachePurge: "unsupported",
  cleanTrailingSlash: "supported",
  credentialValidation: "unsupported",
  customDomains: "manual",
  customHeaders: "manual",
  deployLogs: "unsupported",
  dnsVerification: "manual",
  dryRun: "supported",
  environmentVariables: "unsupported",
  immutableAssetCaching: "manual",
  localBuildUpload: "supported",
  previewDeployments: "unsupported",
  productionDeployments: "manual",
  providerSideBuild: "unsupported",
  redirects: "manual",
  rollback: "manual",
  staticAssetUpload: "manual",
} as const satisfies DeploymentCapabilityReport;

/**
 * Parses the subset of `wrangler.toml` used by static asset deployment.
 *
 * @param text Wrangler TOML text.
 * @returns Parsed Cloudflare static asset config.
 */
export function parseCloudflareWorkersStaticAssetsConfig(
  text: string,
): CloudflareWorkersStaticAssetsConfig {
  return {
    assetsDirectory:
      optionalTomlString(text, "assets.directory") ??
      requiredTomlString(text, "directory"),
    compatibilityDate: requiredTomlString(text, "compatibility_date"),
    name: requiredTomlString(text, "name"),
    notFoundHandling: cloudflareNotFoundHandling(
      optionalTomlString(text, "assets.not_found_handling") ??
        optionalTomlString(text, "not_found_handling") ??
        "none",
    ),
  } satisfies CloudflareWorkersStaticAssetsConfig;
}

/**
 * Parses Cloudflare static `_headers` syntax into header rules.
 *
 * @param text `_headers` file text.
 * @returns Header rules in source order.
 */
export function parseCloudflareHeaderRules(
  text: string,
): CloudflareHeaderRule[] {
  const rules: CloudflareHeaderRule[] = [];
  let currentPath: string | undefined;
  let currentHeaders = new Map<string, string>();

  for (const line of text.split(/\r?\n/u)) {
    if (line.trim() === "" || line.trimStart().startsWith("#")) {
      continue;
    }

    if (/^\S/u.test(line)) {
      if (currentPath !== undefined) {
        rules.push({
          headers: Object.fromEntries(currentHeaders),
          pathPattern: currentPath,
        });
      }

      currentPath = line.trim();
      currentHeaders = new Map<string, string>();
      continue;
    }

    const [name, ...valueParts] = line.trim().split(":");
    if (currentPath !== undefined && name !== undefined) {
      currentHeaders.set(name, valueParts.join(":").trim());
    }
  }

  if (currentPath !== undefined) {
    rules.push({
      headers: Object.fromEntries(currentHeaders),
      pathPattern: currentPath,
    });
  }

  return rules;
}

/**
 * Parses Cloudflare static `_redirects` syntax into redirect rules.
 *
 * @param text `_redirects` file text.
 * @returns Redirect rules in source order.
 */
export function parseCloudflareStaticRedirectRules(
  text: string,
): CloudflareStaticRedirectRule[] {
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((line) => {
      const [source, destination, statusText] = line.split(/\s+/u);
      return {
        destination: destination ?? "",
        source: source ?? "",
        status: Number(statusText ?? "302"),
      };
    });
}

/**
 * Builds a normalized Cloudflare Workers Static Assets deployment result.
 *
 * @param request Cloudflare deployment request and provider file facts.
 * @returns Adapter result suitable for release reports and future product surfaces.
 */
export function createCloudflareWorkersStaticAssetsDeploymentPlan(
  request: CloudflareWorkersStaticAssetsRequest,
): DeployAdapterResult {
  const headers = parseCloudflareHeaderRules(request.headersText);
  const redirects = parseCloudflareStaticRedirectRules(
    request.redirectsText ?? "",
  );
  const diagnostics = cloudflareDeploymentDiagnostics(request, {
    headers,
    redirects,
  });
  const manualSteps = cloudflareManualSteps(request.action);

  return {
    action: request.action,
    capabilities: cloudflareWorkersStaticAssetsCapabilities,
    diagnostics,
    manualSteps,
    provider: "cloudflare-workers-static-assets",
    providerReports: cloudflareProviderReports(request, headers, redirects),
    status: deploymentStatus(diagnostics),
    target: request.target,
    urls: {
      previewUrl:
        request.action === "preview"
          ? `https://${request.wranglerConfig.name}.workers.dev/`
          : undefined,
      productionUrl: request.releaseArtifact.site.canonicalUrl,
    },
  };
}

/**
 * Builds a normalized static-folder deployment result.
 *
 * @param request Static folder deployment request.
 * @returns Adapter result suitable for release reports and future product surfaces.
 */
export function createStaticFolderDeploymentPlan(
  request: StaticFolderDeploymentRequest,
): DeployAdapterResult {
  const diagnostics = staticFolderDeploymentDiagnostics(request);

  return {
    action: request.action,
    capabilities: staticFolderDeploymentCapabilities,
    diagnostics,
    manualSteps: staticFolderManualSteps(request),
    provider: "static-folder",
    providerReports: staticFolderProviderReports(request),
    status: deploymentStatus(diagnostics),
    target: request.target,
    urls: {
      productionUrl: request.releaseArtifact.site.canonicalUrl,
    },
  };
}

function cloudflareDeploymentDiagnostics(
  request: CloudflareWorkersStaticAssetsRequest,
  parsed: {
    readonly headers: readonly CloudflareHeaderRule[];
    readonly redirects: readonly CloudflareStaticRedirectRule[];
  },
): DeploymentDiagnostic[] {
  return [
    ...cloudflareOutputDiagnostics(request),
    ...cloudflareCredentialDiagnostics(request),
    ...cloudflareHeaderDiagnostics(parsed.headers),
    ...cloudflareRedirectDiagnostics(request, parsed.redirects),
    ...cloudflareDomainDiagnostics(request),
    ...cloudflareRollbackDiagnostics(request.action),
  ];
}

function staticFolderDeploymentDiagnostics(
  request: StaticFolderDeploymentRequest,
): DeploymentDiagnostic[] {
  return [
    ...staticFolderPreviewDiagnostics(request),
    ...staticFolderPublishDiagnostics(request),
    ...staticFolderRedirectDiagnostics(request),
    ...staticFolderHeaderDiagnostics(request),
    ...staticFolderCacheDiagnostics(request),
    ...staticFolderRollbackDiagnostics(request.action),
  ];
}

function staticFolderPreviewDiagnostics(
  request: StaticFolderDeploymentRequest,
): DeploymentDiagnostic[] {
  return request.action === "preview"
    ? [
        deploymentDiagnostic({
          blocked: true,
          code: "DEPLOY_PREVIEW_UNSUPPORTED",
          message:
            "Static folder export cannot create a provider-hosted preview deployment.",
          provider: "static-folder",
          remediation:
            "Use local preview tooling or select a deploy provider with preview deployment support.",
          severity: "error",
          target: "action.preview",
        }),
      ]
    : [];
}

function staticFolderPublishDiagnostics(
  request: StaticFolderDeploymentRequest,
): DeploymentDiagnostic[] {
  return request.action === "publish"
    ? [
        deploymentDiagnostic({
          blocked: false,
          code: "DEPLOY_MANUAL_STEP_REQUIRED",
          message:
            "Static folder export does not upload or mutate a remote provider.",
          provider: "static-folder",
          remediation:
            "Upload the generated output folder to the chosen host, or choose a provider adapter for automated publish.",
          severity: "warning",
          target: request.releaseArtifact.generatedOutputRoot,
        }),
      ]
    : [];
}

function staticFolderRedirectDiagnostics(
  request: StaticFolderDeploymentRequest,
): DeploymentDiagnostic[] {
  return request.releaseArtifact.redirectCount === 0 ||
    request.includesRedirectsFile === true
    ? []
    : [
        deploymentDiagnostic({
          blocked: false,
          code: "DEPLOY_REDIRECT_UNSUPPORTED",
          message:
            "Static folder export cannot guarantee provider support for redirects.",
          provider: "static-folder",
          remediation:
            "Keep generated redirect files with the export and confirm the destination host supports them.",
          severity: "warning",
          target: "_redirects",
        }),
      ];
}

function staticFolderHeaderDiagnostics(
  request: StaticFolderDeploymentRequest,
): DeploymentDiagnostic[] {
  return request.includesHeadersFile === true
    ? []
    : [
        deploymentDiagnostic({
          blocked: false,
          code: "DEPLOY_HEADER_UNSUPPORTED",
          message:
            "Static folder export cannot guarantee provider support for custom headers.",
          provider: "static-folder",
          remediation:
            "Keep generated header files with the export and configure equivalent headers on the destination host.",
          severity: "warning",
          target: "_headers",
        }),
      ];
}

function staticFolderCacheDiagnostics(
  request: StaticFolderDeploymentRequest,
): DeploymentDiagnostic[] {
  return request.includesHeadersFile === true
    ? []
    : [
        deploymentDiagnostic({
          blocked: false,
          code: "DEPLOY_CACHE_POLICY_UNSUPPORTED",
          message:
            "Static folder export cannot enforce immutable cache headers for hashed assets.",
          provider: "static-folder",
          remediation:
            "Configure the destination host to serve `/_astro/*` with long-lived immutable cache headers.",
          severity: "warning",
          target: "/_astro/*",
        }),
      ];
}

function staticFolderRollbackDiagnostics(
  action: DeployAction,
): DeploymentDiagnostic[] {
  return action === "rollback"
    ? [
        deploymentDiagnostic({
          blocked: false,
          code: "DEPLOY_ROLLBACK_UNAVAILABLE",
          message:
            "Static folder rollback is a manual restore of a previous output folder.",
          provider: "static-folder",
          remediation:
            "Keep previous release artifacts if manual rollback may be needed.",
          severity: "warning",
          target: "rollback",
        }),
      ]
    : [];
}

function cloudflareOutputDiagnostics(
  request: CloudflareWorkersStaticAssetsRequest,
): DeploymentDiagnostic[] {
  return normalizeOutputRoot(request.wranglerConfig.assetsDirectory) ===
    normalizeOutputRoot(request.releaseArtifact.generatedOutputRoot)
    ? []
    : [
        deploymentDiagnostic({
          blocked: true,
          code: "DEPLOY_PROVIDER_CONFIG_CONFLICT",
          message: `Wrangler assets directory "${request.wranglerConfig.assetsDirectory}" does not match release output "${request.releaseArtifact.generatedOutputRoot}".`,
          remediation:
            "Update wrangler.toml or the release artifact so Cloudflare uploads the verified output directory.",
          severity: "error",
          target: "wrangler.toml",
        }),
      ];
}

function cloudflareCredentialDiagnostics(
  request: CloudflareWorkersStaticAssetsRequest,
): DeploymentDiagnostic[] {
  if (
    request.mode === "dry-run" ||
    (request.action !== "publish" && request.action !== "preview")
  ) {
    return [];
  }

  return (request.credentials ?? []).some((credential) =>
    credential.scopes.includes("deploy.publish"),
  )
    ? []
    : [
        deploymentDiagnostic({
          blocked: true,
          code: "DEPLOY_CREDENTIAL_MISSING",
          message:
            "Cloudflare publish and preview execution requires a deploy credential reference.",
          remediation:
            "Provide a credential reference with the deploy.publish scope; do not serialize the secret value into the release artifact.",
          severity: "error",
          target: "credentials",
        }),
      ];
}

function cloudflareHeaderDiagnostics(
  headers: readonly CloudflareHeaderRule[],
): DeploymentDiagnostic[] {
  const astroHeaders = headers.find((rule) => rule.pathPattern === "/_astro/*");
  const cacheHeader = astroHeaders?.headers["Cache-Control"];
  const hasImmutableCache =
    cacheHeader === "public, max-age=31556952, immutable";

  return hasImmutableCache
    ? []
    : [
        deploymentDiagnostic({
          blocked: true,
          code: "DEPLOY_CACHE_POLICY_UNSUPPORTED",
          message:
            "Cloudflare static headers must keep generated Astro assets immutable.",
          remediation:
            "Keep `/_astro/*` in `site/public/_headers` with `Cache-Control: public, max-age=31556952, immutable`.",
          severity: "error",
          target: "site/public/_headers",
        }),
      ];
}

function cloudflareRedirectDiagnostics(
  request: CloudflareWorkersStaticAssetsRequest,
  redirects: readonly CloudflareStaticRedirectRule[],
): DeploymentDiagnostic[] {
  if (redirects.length === request.releaseArtifact.redirectCount) {
    return [];
  }

  return [
    deploymentDiagnostic({
      blocked: true,
      code: "DEPLOY_REDIRECT_UNSUPPORTED",
      message: `Release artifact expects ${request.releaseArtifact.redirectCount} redirects, but Cloudflare _redirects contains ${redirects.length}.`,
      remediation:
        "Regenerate Cloudflare redirects before deploying the verified release artifact.",
      severity: "error",
      target: "_redirects",
    }),
  ];
}

function cloudflareDomainDiagnostics(
  request: CloudflareWorkersStaticAssetsRequest,
): DeploymentDiagnostic[] {
  return request.target.domains.includes(
    request.releaseArtifact.site.canonicalUrl,
  )
    ? []
    : [
        deploymentDiagnostic({
          blocked: false,
          code: "DEPLOY_DOMAIN_NOT_CONFIGURED",
          message:
            "Canonical URL is not listed as an explicit Cloudflare target domain.",
          remediation:
            "Confirm the custom domain is attached in Cloudflare, or add it to the target domains before launch.",
          severity: "warning",
          target: "target.domains",
        }),
      ];
}

function cloudflareRollbackDiagnostics(
  action: DeployAction,
): DeploymentDiagnostic[] {
  return action === "rollback"
    ? [
        deploymentDiagnostic({
          blocked: false,
          code: "DEPLOY_ROLLBACK_UNAVAILABLE",
          message:
            "Cloudflare rollback is modeled as a manual redeploy of a previous verified artifact.",
          remediation:
            "Use a prior release artifact and run a publish action, or use Cloudflare provider tooling if available.",
          severity: "warning",
          target: "rollback",
        }),
      ]
    : [];
}

function cloudflareManualSteps(action: DeployAction): ManualDeploymentStep[] {
  return [
    {
      action:
        "Confirm the configured custom domain is attached to the Cloudflare Worker.",
      owner: "site-owner",
      required: action === "publish",
    },
    {
      action:
        "Use Cloudflare provider tooling for cache purge or rollback when needed.",
      owner: "provider",
      required: action === "rollback",
    },
  ];
}

function cloudflareProviderReports(
  request: CloudflareWorkersStaticAssetsRequest,
  headers: readonly CloudflareHeaderRule[],
  redirects: readonly CloudflareStaticRedirectRule[],
): ProviderReport[] {
  return [
    { label: "provider", value: "Cloudflare Workers Static Assets" },
    { label: "worker", value: request.wranglerConfig.name },
    {
      label: "compatibilityDate",
      value: request.wranglerConfig.compatibilityDate,
    },
    { label: "assetsDirectory", value: request.wranglerConfig.assetsDirectory },
    {
      label: "notFoundHandling",
      value: request.wranglerConfig.notFoundHandling,
    },
    { label: "headerRules", value: String(headers.length) },
    { label: "redirectRules", value: String(redirects.length) },
    {
      label: "command",
      value: request.action === "preview" ? "wrangler dev" : "wrangler deploy",
    },
  ];
}

function deploymentStatus(
  diagnostics: readonly DeploymentDiagnostic[],
): DeploymentAdapterStatus {
  if (diagnostics.some((diagnostic) => diagnostic.blocked)) {
    return "blocked";
  }

  return diagnostics.some((diagnostic) => diagnostic.severity === "warning")
    ? "ok-with-warnings"
    : "ok";
}

function deploymentDiagnostic(
  input: Omit<DeploymentDiagnostic, "provider"> & {
    readonly provider?: DeploymentDiagnostic["provider"] | undefined;
  },
): DeploymentDiagnostic {
  return {
    ...input,
    provider: input.provider ?? "cloudflare-workers-static-assets",
  };
}

function staticFolderManualSteps(
  request: StaticFolderDeploymentRequest,
): ManualDeploymentStep[] {
  return [
    {
      action: `Upload ${request.releaseArtifact.generatedOutputRoot} to the chosen static host.`,
      owner: "site-owner",
      required: request.action === "publish",
    },
    {
      action:
        "Configure equivalent redirects, headers, cache policy, custom domain, and rollback behavior on the destination host.",
      owner: "site-owner",
      required: request.action === "publish",
    },
  ];
}

function staticFolderProviderReports(
  request: StaticFolderDeploymentRequest,
): ProviderReport[] {
  return [
    { label: "provider", value: "Static Folder Export" },
    { label: "outputRoot", value: request.releaseArtifact.generatedOutputRoot },
    {
      label: "redirects",
      value: String(request.releaseArtifact.redirectCount),
    },
    {
      label: "headersFile",
      value:
        request.includesHeadersFile === true ? "present" : "not-guaranteed",
    },
    {
      label: "redirectsFile",
      value:
        request.includesRedirectsFile === true ? "present" : "not-guaranteed",
    },
  ];
}

function normalizeOutputRoot(root: string): string {
  return root.replace(/^\.\//u, "").replace(/\/$/u, "");
}

function requiredTomlString(text: string, key: string): string {
  const value = optionalTomlString(text, key);
  if (value === undefined) {
    throw new Error(`Missing required Wrangler config key "${key}".`);
  }

  return value;
}

function cloudflareNotFoundHandling(
  value: string,
): CloudflareWorkersStaticAssetsConfig["notFoundHandling"] {
  switch (value) {
    case "404-page":
    case "none":
    case "single-page-application":
      return value;
  }

  throw new Error(
    `Unsupported Cloudflare not_found_handling value "${value}".`,
  );
}

function optionalTomlString(text: string, key: string): string | undefined {
  const [section, sectionField] = key.split(".");
  const expectedSection = sectionField === undefined ? undefined : section;
  const field = sectionField ?? section;
  let activeSection: string | undefined;

  for (const line of text.split(/\r?\n/u)) {
    const trimmed = line.trim();

    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }

    const sectionName = tomlSectionName(trimmed);
    if (sectionName !== undefined) {
      activeSection = sectionName;
      continue;
    }

    if (activeSection !== expectedSection) {
      continue;
    }

    const [lineKey, ...valueParts] = trimmed.split("=");
    if (lineKey?.trim() !== field) {
      continue;
    }

    return unquotedTomlString(valueParts.join("=").trim());
  }

  return undefined;
}

function tomlSectionName(line: string): string | undefined {
  return line.startsWith("[") && line.endsWith("]")
    ? line.slice(1, -1).trim()
    : undefined;
}

function unquotedTomlString(value: string): string | undefined {
  return value.startsWith('"') && value.endsWith('"')
    ? value.slice(1, -1)
    : undefined;
}
