import {
  createOutputDiagnostic,
  type OutputDiagnostic,
} from "./output-verification";

/** Supported extension trust and ownership classes. */
export const extensionKinds = [
  "essential-bundled",
  "optional-official",
  "site",
  "third-party",
] as const;

/** Extension trust and ownership class. */
export type ExtensionKind = (typeof extensionKinds)[number];

/** Lifecycle states surfaced by extension catalog and future product UIs. */
export const extensionLifecycleStates = [
  "disabled",
  "deprecated",
  "enabled",
  "incompatible",
  "installable",
  "installed",
  "needs-migration",
  "removed",
  "unavailable",
] as const;

/** Lifecycle state surfaced by extension catalog and future product UIs. */
export type ExtensionLifecycleState = (typeof extensionLifecycleStates)[number];

/** Trust boundary labels surfaced by extension catalog and future product UIs. */
export const extensionTrustBoundaries = [
  "bundled-essential",
  "bundled-official",
  "site-owned",
  "third-party",
] as const;

/** Trust boundary label surfaced by extension catalog and future product UIs. */
export type ExtensionTrustBoundary = (typeof extensionTrustBoundaries)[number];

/** Capability families exposed to GUI, CLI, MCP, docs, and verifiers. */
export const extensionCapabilityFamilies = [
  "artifact.archive",
  "artifact.feed",
  "artifact.pdf",
  "artifact.search",
  "artifact.social-image",
  "content.kind",
  "deploy.provider",
  "diagnostic.provider",
  "docs.generator",
  "history.provider",
  "import.source",
  "media.materializer",
  "media.provider",
  "metadata.profile",
  "route.module",
  "source.provider",
  "ui.block",
  "ui.component",
  "verifier.module",
  "workflow.transition",
] as const;

/** Capability family that an extension may declare. */
export type ExtensionCapabilityFamily =
  (typeof extensionCapabilityFamilies)[number];

/** Extension point kinds that platform code may load. */
export const extensionPointKinds = [
  "article.compiler.transform",
  "author.diagnostic",
  "catalog.fixture",
  "content.kind",
  "deploy.adapter",
  "docs.generator",
  "history.adapter",
  "import.source",
  "media.materializer",
  "media.policy",
  "metadata.profile",
  "route.module",
  "source.adapter",
  "ui.block",
  "ui.component",
  "verifier.module",
  "workflow.adapter",
] as const;

/** Extension point kind exposed by core. */
export type ExtensionPointKind = (typeof extensionPointKinds)[number];

/** Permission declaration required before an extension can touch a boundary. */
export const extensionPermissions = [
  "browser.script",
  "credential.read",
  "deploy.publish",
  "external.origin",
  "filesystem.read",
  "filesystem.write",
  "generated.output.write",
  "migration.write",
  "network.request",
  "site.assets.read",
  "site.assets.write",
  "site.config.read",
  "site.config.write",
  "site.content.read",
  "site.content.write",
] as const;

/** Permission declaration required before an extension can touch a boundary. */
export type ExtensionPermission = (typeof extensionPermissions)[number];

/** Stable extension identifier. */
export type ExtensionId = string;

/** Namespaced capability ID local to one extension. */
export type ExtensionCapabilityId = string;

/** Stable capability key used by dependency and conflict diagnostics. */
export type ExtensionCapabilityKey =
  `${ExtensionCapabilityFamily}:${ExtensionCapabilityId}`;

/** Diagnostic emitted while validating an extension manifest. */
export interface ExtensionManifestDiagnostic {
  readonly code: ExtensionManifestDiagnosticCode;
  readonly message: string;
  readonly path: string;
  readonly severity: "error" | "warning";
}

/** Known manifest validation diagnostic code. */
export type ExtensionManifestDiagnosticCode =
  | "extension.capability-duplicate"
  | "extension.capability-required"
  | "extension.conflict-self"
  | "extension.dependency-missing"
  | "extension.dependency-self"
  | "extension.docs-missing"
  | "extension.feature-missing"
  | "extension.generated-artifact-conflict"
  | "extension.generated-output-undeclared"
  | "extension.id-invalid"
  | "extension.permission-required"
  | "extension.route-undeclared";

/** One declared extension capability. */
export interface ExtensionCapability {
  readonly family: ExtensionCapabilityFamily;
  readonly id: ExtensionCapabilityId;
  readonly summary: string;
}

/** Dependency on another extension or capability provider. */
export interface ExtensionDependency {
  readonly id: ExtensionId;
  readonly optional?: boolean | undefined;
  readonly reason: string;
  readonly version?: string | undefined;
}

/** Declared incompatibility with another extension. */
export interface ExtensionConflict {
  readonly id: ExtensionId;
  readonly reason: string;
}

/** Declared extension point implementation. */
export interface ExtensionPointDeclaration {
  readonly kind: ExtensionPointKind;
  readonly module: string;
  readonly name: string;
}

/** Schema contributed by an extension. */
export interface ExtensionSchemaDeclaration {
  readonly id: string;
  readonly owner: "config" | "content" | "source";
  readonly schemaRef: string;
}

/** Content kind contributed by an extension. */
export interface ExtensionContentKindDeclaration {
  readonly collection: string;
  readonly routeCapability?: ExtensionCapabilityId | undefined;
  readonly schemaRef: string;
}

/** UI component or block contributed by an extension. */
export interface ExtensionComponentDeclaration {
  readonly componentRef: string;
  readonly fallback: {
    readonly feed: "omit" | "static-text";
    readonly pdf: "omit" | "static-link" | "static-render";
    readonly search: "omit" | "static-text";
  };
  readonly name: string;
  readonly propsSchemaRef?: string | undefined;
  readonly surfaces: readonly ExtensionSurface[];
}

/** Authoring surface contributed by an extension. */
export interface ExtensionEditorSurfaceDeclaration {
  readonly fieldsSchemaRef?: string | undefined;
  readonly surface: ExtensionSurface;
}

/** Public or generated route contributed by an extension. */
export interface ExtensionRouteDeclaration {
  readonly pathPattern: string;
  readonly routeKey: string;
  readonly surfaces: readonly ExtensionSurface[];
}

/** Generated artifact contributed by an extension. */
export interface ExtensionGeneratedArtifactDeclaration {
  readonly cachePolicy: "immutable" | "public-revalidate" | "short-lived";
  readonly kind: ExtensionGeneratedArtifactKind;
  readonly owner: "extension";
  readonly pathPattern: string;
  readonly verifierRef?: string | undefined;
}

/** Media role or provider contributed by an extension. */
export interface ExtensionMediaDeclaration {
  readonly kind: "materializer" | "policy" | "provider";
  readonly mediaRole?: string | undefined;
  readonly provider?: string | undefined;
}

/** Metadata profile contributed by an extension. */
export interface ExtensionMetadataProfileDeclaration {
  readonly kind: string;
  readonly schemaRef: string;
}

/** Diagnostic code namespace contributed by an extension. */
export interface ExtensionDiagnosticDeclaration {
  readonly category: string;
  readonly codePrefix: string;
}

/** Verifier module contributed by an extension. */
export interface ExtensionVerifierDeclaration {
  readonly moduleRef: string;
  readonly ownsArtifacts: readonly string[];
}

/** Runtime script or style contributed by an extension. */
export interface ExtensionRuntimeAssetDeclaration {
  readonly loadPolicy?: "content-gated" | "idle" | "immediate" | undefined;
  readonly path: string;
}

/** External origin touched by an extension. */
export interface ExtensionExternalOriginDeclaration {
  readonly origin: string;
  readonly purpose: string;
  readonly userTriggered: boolean;
}

/** Source migration contributed by an extension. */
export interface ExtensionMigrationDeclaration {
  readonly dryRun: boolean;
  readonly fromVersion?: string | undefined;
  readonly id: string;
  readonly reversible: boolean;
  readonly summary: string;
  readonly touches: readonly ExtensionMigrationTouch[];
  readonly toVersion?: string | undefined;
}

/** Extension-owned documentation. */
export interface ExtensionDocumentDeclaration {
  readonly audience: "author" | "developer" | "extension-author" | "owner";
  readonly path: string;
}

/** Extension-owned test fixture or command. */
export interface ExtensionTestDeclaration {
  readonly command?: string | undefined;
  readonly fixture?: string | undefined;
  readonly kind: "boundary" | "build" | "unit" | "verifier";
}

/** Safe-disable behavior declared by an extension. */
export interface ExtensionDisabledBehavior {
  readonly mode:
    | "disable-capabilities"
    | "keep-source-ignore-output"
    | "reject-disable"
    | "remove-artifacts";
  readonly summary: string;
}

/** Deprecation policy for a manifest or extension capability. */
export interface ExtensionDeprecation {
  readonly message: string;
  readonly replacement?: ExtensionId | undefined;
  readonly since: string;
}

/** Complete extension manifest consumed by platform tooling. */
export interface ExtensionManifest {
  readonly capabilities: readonly ExtensionCapability[];
  readonly components?: readonly ExtensionComponentDeclaration[] | undefined;
  readonly config?: ExtensionSchemaDeclaration | undefined;
  readonly conflicts?: readonly ExtensionConflict[] | undefined;
  readonly contentKinds?:
    | readonly ExtensionContentKindDeclaration[]
    | undefined;
  readonly dependencies?: readonly ExtensionDependency[] | undefined;
  readonly deprecation?: ExtensionDeprecation | undefined;
  readonly diagnostics?: readonly ExtensionDiagnosticDeclaration[] | undefined;
  readonly disabledBehavior: ExtensionDisabledBehavior;
  readonly docs?: readonly ExtensionDocumentDeclaration[] | undefined;
  readonly editorSurfaces?:
    | readonly ExtensionEditorSurfaceDeclaration[]
    | undefined;
  readonly extensionPoints?: readonly ExtensionPointDeclaration[] | undefined;
  readonly externalOrigins?:
    | readonly ExtensionExternalOriginDeclaration[]
    | undefined;
  readonly generatedArtifacts?:
    | readonly ExtensionGeneratedArtifactDeclaration[]
    | undefined;
  readonly id: ExtensionId;
  readonly kind: ExtensionKind;
  readonly media?: readonly ExtensionMediaDeclaration[] | undefined;
  readonly metadataProfiles?:
    | readonly ExtensionMetadataProfileDeclaration[]
    | undefined;
  readonly migrations?: readonly ExtensionMigrationDeclaration[] | undefined;
  readonly name: string;
  readonly permissions?: readonly ExtensionPermission[] | undefined;
  readonly requiredFeatures?: readonly string[] | undefined;
  readonly requiredPlatformVersion?: string | undefined;
  readonly routes?: readonly ExtensionRouteDeclaration[] | undefined;
  readonly scripts?: readonly ExtensionRuntimeAssetDeclaration[] | undefined;
  readonly sourceSchemaAdditions?:
    | readonly ExtensionSchemaDeclaration[]
    | undefined;
  readonly styles?: readonly ExtensionRuntimeAssetDeclaration[] | undefined;
  readonly summary: string;
  readonly tests?: readonly ExtensionTestDeclaration[] | undefined;
  readonly verifiers?: readonly ExtensionVerifierDeclaration[] | undefined;
  readonly version: string;
}

/** Disabled extension plus the reason it is unavailable. */
export interface ResolvedDisabledExtension {
  readonly manifest: ExtensionManifest;
  readonly reason:
    | "explicitly-disabled"
    | "missing-dependency"
    | "missing-feature";
}

/** Inputs for resolving active extension capabilities. */
export interface ResolveExtensionManifestsOptions {
  readonly disabled?: readonly ExtensionId[] | undefined;
  readonly featureFlags?: Readonly<Record<string, boolean>> | undefined;
}

/** Resolved extension manifests and active declarations. */
export interface ExtensionResolution {
  readonly capabilities: readonly ExtensionCapability[];
  readonly diagnostics: readonly ExtensionManifestDiagnostic[];
  readonly disabled: readonly ResolvedDisabledExtension[];
  readonly enabled: readonly ExtensionManifest[];
  readonly generatedArtifacts: readonly ExtensionGeneratedArtifactDeclaration[];
}

/** Options for creating extension catalog entries. */
export interface ExtensionCatalogOptions extends ResolveExtensionManifestsOptions {
  readonly installed?: readonly ExtensionId[] | undefined;
  readonly removed?: readonly ExtensionId[] | undefined;
  readonly unavailable?: readonly ExtensionId[] | undefined;
}

/** Catalog entry consumed by docs, GUI, CLI, MCP, and CI summaries. */
export interface ExtensionCatalogEntry {
  readonly bundled: boolean;
  readonly defaultEnabled: boolean;
  readonly diagnostics: readonly ExtensionManifestDiagnostic[];
  readonly lifecycle: ExtensionLifecycleState;
  readonly manifest: ExtensionManifest;
  readonly safeDisable: boolean;
  readonly trustBoundary: ExtensionTrustBoundary;
}

/** Stable reference row generated from one catalog entry. */
export interface ExtensionCatalogReferenceRow {
  readonly bundled: boolean;
  readonly capabilities: readonly ExtensionCapabilityKey[];
  readonly defaultEnabled: boolean;
  readonly diagnosticPrefixes: readonly string[];
  readonly disabledBehavior: ExtensionDisabledBehavior["mode"];
  readonly docs: readonly string[];
  readonly generatedArtifactPaths: readonly string[];
  readonly id: ExtensionId;
  readonly kind: ExtensionKind;
  readonly lifecycle: ExtensionLifecycleState;
  readonly migrationCount: number;
  readonly name: string;
  readonly safeDisable: boolean;
  readonly summary: string;
  readonly trustBoundary: ExtensionTrustBoundary;
}

/** Extension-owned output discovered by a verifier or future loader. */
export interface ExtensionOutputObservation {
  readonly extensionId: ExtensionId;
  readonly kind: "generated-artifact" | "route";
  readonly pathPattern: string;
}

/** Public/generated surface affected by an extension declaration. */
type ExtensionSurface =
  | "article"
  | "catalog"
  | "editor"
  | "feed"
  | "home"
  | "metadata"
  | "pdf"
  | "search"
  | "sitemap";

/** Generated artifact kind owned by an extension. */
type ExtensionGeneratedArtifactKind =
  | "archive"
  | "bibliography"
  | "feed"
  | "manifest"
  | "pdf"
  | "search-index"
  | "social-image";

/** Source or output family touched by a migration. */
type ExtensionMigrationTouch =
  | "config"
  | "content"
  | "generated-output"
  | "media"
  | "routes"
  | "theme";

/**
 * Defines an extension manifest while preserving literal types.
 *
 * @template Manifest Extension manifest type.
 * @param manifest Extension manifest.
 * @returns The manifest unchanged.
 */
export function defineExtensionManifest<
  const Manifest extends ExtensionManifest,
>(manifest: Manifest): Manifest {
  return manifest;
}

/**
 * Validates cross-field extension manifest rules that types cannot express.
 *
 * @param manifest Extension manifest.
 * @returns Manifest diagnostics.
 */
export function validateExtensionManifest(
  manifest: ExtensionManifest,
): ExtensionManifestDiagnostic[] {
  return [
    ...extensionIdDiagnostics(manifest),
    ...duplicateCapabilityDiagnostics(manifest),
    ...selfReferenceDiagnostics(manifest),
    ...requiredCapabilityDiagnostics(manifest),
    ...requiredPermissionDiagnostics(manifest),
  ];
}

/**
 * Builds stable capability keys from a manifest.
 *
 * @param manifest Extension manifest.
 * @returns Capability keys.
 */
export function extensionCapabilityKeys(
  manifest: Pick<ExtensionManifest, "capabilities">,
): ExtensionCapabilityKey[] {
  return manifest.capabilities.map(
    (capability) =>
      `${capability.family}:${capability.id}` satisfies ExtensionCapabilityKey,
  );
}

/**
 * Resolves enabled extension manifests and active extension-owned outputs.
 *
 * @param manifests Candidate manifests.
 * @param options Disabled IDs and feature flags.
 * @returns Resolved extension state.
 */
export function resolveExtensionManifests(
  manifests: readonly ExtensionManifest[],
  options: ResolveExtensionManifestsOptions = {},
): ExtensionResolution {
  const explicitlyDisabled = new Set(options.disabled ?? []);
  const disabled = [
    ...explicitlyDisabledManifests(manifests, explicitlyDisabled),
    ...featureDisabledManifests(manifests, explicitlyDisabled, options),
  ];
  const featureDisabledIds = new Set(
    disabled.map(({ manifest }) => manifest.id),
  );
  const dependencyDisabled = dependencyDisabledManifests(
    manifests,
    new Set([...explicitlyDisabled, ...featureDisabledIds]),
  );
  const allDisabled = [...disabled, ...dependencyDisabled];
  const disabledIds = new Set(allDisabled.map(({ manifest }) => manifest.id));
  const enabled = manifests.filter((manifest) => !disabledIds.has(manifest.id));
  const diagnostics = [
    ...manifests.flatMap(validateExtensionManifest),
    ...featureDiagnostics(disabled),
    ...dependencyDiagnostics(dependencyDisabled),
    ...generatedArtifactConflictDiagnostics(enabled),
  ];

  return {
    capabilities: enabled.flatMap((manifest) => manifest.capabilities),
    diagnostics,
    disabled: allDisabled,
    enabled,
    generatedArtifacts: enabled.flatMap(
      (manifest) => manifest.generatedArtifacts ?? [],
    ),
  };
}

/**
 * Creates catalog entries from manifests and activation options.
 *
 * @param manifests Extension manifests.
 * @param options Installation, disable, feature, and availability options.
 * @returns Catalog entries.
 */
export function extensionCatalogEntries(
  manifests: readonly ExtensionManifest[],
  options: ExtensionCatalogOptions = {},
): ExtensionCatalogEntry[] {
  const resolution = resolveExtensionManifests(manifests, options);
  const enabled = new Set(resolution.enabled.map((manifest) => manifest.id));
  const disabledById = new Map(
    resolution.disabled.map((entry) => [entry.manifest.id, entry] as const),
  );
  const installed = new Set(
    options.installed ?? manifests.map((manifest) => manifest.id),
  );
  const removed = new Set(options.removed ?? []);
  const unavailable = new Set(options.unavailable ?? []);

  return manifests.map((manifest) => {
    const disabled = disabledById.get(manifest.id);

    return {
      bundled: isBundledExtension(manifest),
      defaultEnabled: isDefaultEnabledExtension(manifest),
      diagnostics: catalogEntryDiagnostics(manifest, resolution.diagnostics),
      lifecycle: extensionLifecycleState({
        disabledReason: disabled?.reason,
        enabled: enabled.has(manifest.id),
        installed: installed.has(manifest.id),
        manifest,
        removed: removed.has(manifest.id),
        unavailable: unavailable.has(manifest.id),
      }),
      manifest,
      safeDisable: isSafeDisableExtension(manifest),
      trustBoundary: extensionTrustBoundary(manifest),
    };
  });
}

/**
 * Converts catalog entries into stable rows for docs/reference output.
 *
 * @param entries Catalog entries.
 * @returns Reference rows.
 */
export function extensionCatalogReferenceRows(
  entries: readonly ExtensionCatalogEntry[],
): ExtensionCatalogReferenceRow[] {
  return entries.map((entry) => ({
    bundled: entry.bundled,
    capabilities: extensionCapabilityKeys(entry.manifest),
    defaultEnabled: entry.defaultEnabled,
    diagnosticPrefixes: (entry.manifest.diagnostics ?? []).map(
      (diagnostic) => diagnostic.codePrefix,
    ),
    disabledBehavior: entry.manifest.disabledBehavior.mode,
    docs: (entry.manifest.docs ?? []).map((doc) => doc.path),
    generatedArtifactPaths: (entry.manifest.generatedArtifacts ?? []).map(
      (artifact) => artifact.pathPattern,
    ),
    id: entry.manifest.id,
    kind: entry.manifest.kind,
    lifecycle: entry.lifecycle,
    migrationCount: entry.manifest.migrations?.length ?? 0,
    name: entry.manifest.name,
    safeDisable: entry.safeDisable,
    summary: entry.manifest.summary,
    trustBoundary: entry.trustBoundary,
  }));
}

/**
 * Reports extension-owned outputs that were not declared by a manifest.
 *
 * @param manifests Known extension manifests.
 * @param observations Extension-owned outputs discovered elsewhere.
 * @returns Manifest diagnostics.
 */
export function extensionOutputDeclarationDiagnostics(
  manifests: readonly ExtensionManifest[],
  observations: readonly ExtensionOutputObservation[],
): ExtensionManifestDiagnostic[] {
  const manifestById = new Map(
    manifests.map((manifest) => [manifest.id, manifest] as const),
  );

  return observations.flatMap((observation) => {
    const manifest = manifestById.get(observation.extensionId);

    if (manifest === undefined) {
      return [
        extensionDiagnostic(
          observation.kind === "route"
            ? "extension.route-undeclared"
            : "extension.generated-output-undeclared",
          `Extension "${observation.extensionId}" produced "${observation.pathPattern}" but no manifest is installed for that extension.`,
          observation.kind === "route" ? "routes" : "generatedArtifacts",
        ),
      ];
    }

    const declarations =
      observation.kind === "route"
        ? (manifest.routes ?? []).map((route) => route.pathPattern)
        : (manifest.generatedArtifacts ?? []).map(
            (artifact) => artifact.pathPattern,
          );

    return declarations.includes(observation.pathPattern)
      ? []
      : [
          extensionDiagnostic(
            observation.kind === "route"
              ? "extension.route-undeclared"
              : "extension.generated-output-undeclared",
            `Extension "${observation.extensionId}" produced "${observation.pathPattern}" without declaring it in ${observation.kind === "route" ? "routes" : "generatedArtifacts"}.`,
            observation.kind === "route" ? "routes" : "generatedArtifacts",
          ),
        ];
  });
}

/**
 * Reports extension manifests that do not declare documentation hooks.
 *
 * @param manifests Extension manifests.
 * @returns Documentation diagnostics.
 */
export function extensionDocumentationDiagnostics(
  manifests: readonly ExtensionManifest[],
): ExtensionManifestDiagnostic[] {
  return manifests
    .filter(
      (manifest) => manifest.docs === undefined || manifest.docs.length === 0,
    )
    .map((manifest) =>
      extensionDiagnostic(
        "extension.docs-missing",
        `Extension "${manifest.id}" should declare docs for authors, owners, developers, or extension authors.`,
        "docs",
      ),
    );
}

/**
 * Converts extension diagnostics into generated-output diagnostics.
 *
 * @param extensionId Extension id that owns the diagnostics.
 * @param diagnostics Extension diagnostics.
 * @returns Generated-output diagnostics suitable for release reports.
 */
export function extensionDiagnosticsToOutputDiagnostics(
  extensionId: ExtensionId,
  diagnostics: readonly ExtensionManifestDiagnostic[],
): OutputDiagnostic[] {
  return diagnostics.map((diagnostic) =>
    createOutputDiagnostic({
      category: diagnostic.code.includes("generated-output")
        ? "route"
        : "build",
      code: diagnostic.code.includes("generated-output")
        ? "route.extension-output-undeclared"
        : "build.extension-manifest",
      evidence: [`extension=${extensionId}`, `path=${diagnostic.path}`],
      message: diagnostic.message,
      moduleId: "extension-manifest",
      owner: "platform",
      remediation:
        "Update the extension manifest so capabilities, outputs, permissions, and docs are explicit.",
      severity: diagnostic.severity,
    }),
  );
}

function extensionIdDiagnostics(
  manifest: ExtensionManifest,
): ExtensionManifestDiagnostic[] {
  return isValidExtensionId(manifest.id)
    ? []
    : [
        {
          code: "extension.id-invalid",
          message:
            "Extension id must be lowercase and may use an optional npm-style scope.",
          path: "id",
          severity: "error",
        },
      ];
}

function explicitlyDisabledManifests(
  manifests: readonly ExtensionManifest[],
  disabled: ReadonlySet<ExtensionId>,
): ResolvedDisabledExtension[] {
  return manifests
    .filter((manifest) => disabled.has(manifest.id))
    .map((manifest) => ({
      manifest,
      reason: "explicitly-disabled",
    }));
}

function featureDisabledManifests(
  manifests: readonly ExtensionManifest[],
  explicitlyDisabled: ReadonlySet<ExtensionId>,
  options: ResolveExtensionManifestsOptions,
): ResolvedDisabledExtension[] {
  return manifests
    .filter((manifest) => !explicitlyDisabled.has(manifest.id))
    .filter((manifest) =>
      (manifest.requiredFeatures ?? []).some(
        (feature) => !featureFlagEnabled(options.featureFlags, feature),
      ),
    )
    .map((manifest) => ({
      manifest,
      reason: "missing-feature",
    }));
}

function dependencyDisabledManifests(
  manifests: readonly ExtensionManifest[],
  alreadyDisabled: ReadonlySet<ExtensionId>,
): ResolvedDisabledExtension[] {
  const manifestIds = new Set(manifests.map((manifest) => manifest.id));

  return manifests
    .filter((manifest) => !alreadyDisabled.has(manifest.id))
    .filter((manifest) =>
      (manifest.dependencies ?? []).some(
        (dependency) =>
          dependency.optional !== true &&
          (!manifestIds.has(dependency.id) ||
            alreadyDisabled.has(dependency.id)),
      ),
    )
    .map((manifest) => ({
      manifest,
      reason: "missing-dependency",
    }));
}

function featureDiagnostics(
  disabled: readonly ResolvedDisabledExtension[],
): ExtensionManifestDiagnostic[] {
  return disabled
    .filter(({ reason }) => reason === "missing-feature")
    .flatMap(({ manifest }) =>
      (manifest.requiredFeatures ?? []).map((feature) =>
        extensionDiagnostic(
          "extension.feature-missing",
          `Extension "${manifest.id}" requires feature flag "${feature}".`,
          "requiredFeatures",
        ),
      ),
    );
}

function dependencyDiagnostics(
  disabled: readonly ResolvedDisabledExtension[],
): ExtensionManifestDiagnostic[] {
  return disabled
    .filter(({ reason }) => reason === "missing-dependency")
    .flatMap(({ manifest }) =>
      (manifest.dependencies ?? [])
        .filter((dependency) => dependency.optional !== true)
        .map((dependency) =>
          extensionDiagnostic(
            "extension.dependency-missing",
            `Extension "${manifest.id}" requires extension "${dependency.id}": ${dependency.reason}`,
            "dependencies",
          ),
        ),
    );
}

function generatedArtifactConflictDiagnostics(
  enabled: readonly ExtensionManifest[],
): ExtensionManifestDiagnostic[] {
  const owners = new Map<string, ExtensionId>();
  const diagnostics: ExtensionManifestDiagnostic[] = [];

  for (const manifest of enabled) {
    for (const artifact of manifest.generatedArtifacts ?? []) {
      const existingOwner = owners.get(artifact.pathPattern);

      if (existingOwner === undefined) {
        owners.set(artifact.pathPattern, manifest.id);
      } else {
        diagnostics.push(
          extensionDiagnostic(
            "extension.generated-artifact-conflict",
            `Extensions "${existingOwner}" and "${manifest.id}" both declare generated artifact "${artifact.pathPattern}".`,
            "generatedArtifacts",
          ),
        );
      }
    }
  }

  return diagnostics;
}

function isBundledExtension(manifest: ExtensionManifest): boolean {
  return (
    manifest.kind === "essential-bundled" ||
    manifest.kind === "optional-official"
  );
}

function isDefaultEnabledExtension(manifest: ExtensionManifest): boolean {
  return manifest.kind === "essential-bundled";
}

function isSafeDisableExtension(manifest: ExtensionManifest): boolean {
  return manifest.disabledBehavior.mode !== "reject-disable";
}

function extensionTrustBoundary(
  manifest: ExtensionManifest,
): ExtensionTrustBoundary {
  switch (manifest.kind) {
    case "essential-bundled":
      return "bundled-essential";
    case "optional-official":
      return "bundled-official";
    case "site":
      return "site-owned";
    case "third-party":
      return "third-party";
  }
}

function catalogEntryDiagnostics(
  manifest: ExtensionManifest,
  diagnostics: readonly ExtensionManifestDiagnostic[],
): ExtensionManifestDiagnostic[] {
  return [
    ...validateExtensionManifest(manifest),
    ...extensionDocumentationDiagnostics([manifest]),
    ...diagnostics.filter((diagnostic) =>
      diagnostic.message.includes(`"${manifest.id}"`),
    ),
  ];
}

function extensionLifecycleState({
  disabledReason,
  enabled,
  installed,
  manifest,
  removed,
  unavailable,
}: {
  readonly disabledReason?: ResolvedDisabledExtension["reason"] | undefined;
  readonly enabled: boolean;
  readonly installed: boolean;
  readonly manifest: ExtensionManifest;
  readonly removed: boolean;
  readonly unavailable: boolean;
}): ExtensionLifecycleState {
  if (removed) {
    return "removed";
  }

  if (unavailable) {
    return "unavailable";
  }

  if (!installed) {
    return "installable";
  }

  if (
    disabledReason === "missing-dependency" ||
    disabledReason === "missing-feature"
  ) {
    return "incompatible";
  }

  if (disabledReason === "explicitly-disabled") {
    return "disabled";
  }

  if (manifest.deprecation !== undefined) {
    return "deprecated";
  }

  if ((manifest.migrations ?? []).length > 0) {
    return "needs-migration";
  }

  return enabled ? "enabled" : "installed";
}

function duplicateCapabilityDiagnostics(
  manifest: ExtensionManifest,
): ExtensionManifestDiagnostic[] {
  const seen = new Set<ExtensionCapabilityKey>();
  const diagnostics: ExtensionManifestDiagnostic[] = [];

  for (const key of extensionCapabilityKeys(manifest)) {
    if (seen.has(key)) {
      diagnostics.push({
        code: "extension.capability-duplicate",
        message: `Capability "${key}" is declared more than once.`,
        path: "capabilities",
        severity: "error",
      });
    }

    seen.add(key);
  }

  return diagnostics;
}

function selfReferenceDiagnostics(
  manifest: ExtensionManifest,
): ExtensionManifestDiagnostic[] {
  return [
    ...(manifest.dependencies ?? [])
      .filter((dependency) => dependency.id === manifest.id)
      .map((dependency) =>
        extensionDiagnostic(
          "extension.dependency-self",
          `Extension "${manifest.id}" cannot depend on itself: ${dependency.reason}`,
          "dependencies",
        ),
      ),
    ...(manifest.conflicts ?? [])
      .filter((conflict) => conflict.id === manifest.id)
      .map((conflict) =>
        extensionDiagnostic(
          "extension.conflict-self",
          `Extension "${manifest.id}" cannot conflict with itself: ${conflict.reason}`,
          "conflicts",
        ),
      ),
  ];
}

function requiredCapabilityDiagnostics(
  manifest: ExtensionManifest,
): ExtensionManifestDiagnostic[] {
  return [
    ...requiredCapabilityForValue(
      manifest,
      manifest.components,
      ["ui.block", "ui.component"],
      "components",
    ),
    ...requiredCapabilityForValue(
      manifest,
      manifest.routes,
      ["route.module"],
      "routes",
    ),
    ...requiredCapabilityForValue(
      manifest,
      manifest.generatedArtifacts,
      [
        "artifact.archive",
        "artifact.feed",
        "artifact.pdf",
        "artifact.search",
        "artifact.social-image",
      ],
      "generatedArtifacts",
    ),
    ...requiredCapabilityForValue(
      manifest,
      manifest.metadataProfiles,
      ["metadata.profile"],
      "metadataProfiles",
    ),
    ...requiredCapabilityForValue(
      manifest,
      manifest.verifiers,
      ["verifier.module"],
      "verifiers",
    ),
  ];
}

function requiredPermissionDiagnostics(
  manifest: ExtensionManifest,
): ExtensionManifestDiagnostic[] {
  return [
    ...requiredPermissionForValue(
      manifest,
      manifest.scripts,
      "browser.script",
      "scripts",
    ),
    ...requiredPermissionForValue(
      manifest,
      manifest.externalOrigins,
      "external.origin",
      "externalOrigins",
    ),
    ...requiredPermissionForValue(
      manifest,
      manifest.generatedArtifacts,
      "generated.output.write",
      "generatedArtifacts",
    ),
    ...requiredPermissionForValue(
      manifest,
      manifest.migrations,
      "migration.write",
      "migrations",
    ),
  ];
}

function requiredCapabilityForValue(
  manifest: ExtensionManifest,
  value: readonly unknown[] | undefined,
  families: readonly ExtensionCapabilityFamily[],
  path: string,
): ExtensionManifestDiagnostic[] {
  if (value === undefined || value.length === 0) {
    return [];
  }

  if (hasAnyCapabilityFamily(manifest, families)) {
    return [];
  }

  return [
    extensionDiagnostic(
      "extension.capability-required",
      `${path} requires one of these capability families: ${families.join(", ")}.`,
      path,
    ),
  ];
}

function requiredPermissionForValue(
  manifest: ExtensionManifest,
  value: readonly unknown[] | undefined,
  permission: ExtensionPermission,
  path: string,
): ExtensionManifestDiagnostic[] {
  if (value === undefined || value.length === 0) {
    return [];
  }

  if (hasPermission(manifest, permission)) {
    return [];
  }

  return [
    extensionDiagnostic(
      "extension.permission-required",
      `${path} requires permission "${permission}".`,
      path,
    ),
  ];
}

function featureFlagEnabled(
  featureFlags: Readonly<Record<string, boolean>> | undefined,
  feature: string,
): boolean {
  return (
    featureFlags !== undefined &&
    Object.entries(featureFlags).some(
      ([candidate, enabled]) => candidate === feature && enabled,
    )
  );
}

function hasAnyCapabilityFamily(
  manifest: ExtensionManifest,
  families: readonly ExtensionCapabilityFamily[],
): boolean {
  return manifest.capabilities.some((capability) =>
    families.includes(capability.family),
  );
}

function hasPermission(
  manifest: ExtensionManifest,
  permission: ExtensionPermission,
): boolean {
  return manifest.permissions?.includes(permission) ?? false;
}

function isValidExtensionId(value: string): boolean {
  if (!value.startsWith("@")) {
    return validExtensionIdSegment(value);
  }

  const parts = value.split("/");
  const scope = parts[0];
  const id = parts[1];

  if (parts.length === 2 && scope !== undefined && id !== undefined) {
    return (
      scope.startsWith("@") &&
      validExtensionIdSegment(scope.slice(1)) &&
      validExtensionIdSegment(id)
    );
  }

  return false;
}

function validExtensionIdSegment(value: string | undefined): boolean {
  return (
    value !== undefined &&
    value.length > 0 &&
    lowercaseAsciiAlphanumeric(value.at(0)) &&
    Array.from(value).every(validExtensionIdCharacter)
  );
}

function validExtensionIdCharacter(character: string): boolean {
  return (
    lowercaseAsciiAlphanumeric(character) ||
    character === "." ||
    character === "_" ||
    character === "-"
  );
}

function lowercaseAsciiAlphanumeric(character: string | undefined): boolean {
  if (character === undefined) {
    return false;
  }

  const code = character.codePointAt(0);

  return (
    code !== undefined &&
    ((code >= 48 && code <= 57) || (code >= 97 && code <= 122))
  );
}

function extensionDiagnostic(
  code: ExtensionManifestDiagnosticCode,
  message: string,
  path: string,
): ExtensionManifestDiagnostic {
  return {
    code,
    message,
    path,
    severity: "error",
  };
}
