import {
  type StudioEditorialState,
  type StudioWorkflowAction,
  type StudioWorkflowTransitionContext,
  transitionStudioEditorialState,
} from "./studio-models";

/** Provider family exposed to future studio workflow adapters. */
type StudioProviderFamily =
  | "build"
  | "deploy"
  | "diagnostics"
  | "history"
  | "identity"
  | "media"
  | "source"
  | "workflow";

/** Studio workflow operation normalized from product-level actions. */
export type StudioWorkflowOperation =
  | "approve"
  | "cache-invalidate"
  | "deploy-status"
  | "preview"
  | "publish"
  | "release-health"
  | "request-changes"
  | "restore-version"
  | "rollback"
  | "save-draft"
  | "schedule"
  | "submit-review"
  | "unpublish";

/** Stable capability ID exposed by workflow providers. */
export type StudioProviderCapabilityId =
  | "build.full"
  | "build.preview"
  | "deploy.cache.invalidate"
  | "deploy.publish"
  | "deploy.status"
  | "diagnostics.release-health"
  | "history.restore"
  | "identity.credentials"
  | "media.materialize"
  | "source.diff"
  | "source.write"
  | "workflow.direct-publish"
  | "workflow.review";

/** Trust and side-effect level for one provider capability. */
type StudioProviderCapabilityRisk =
  | "destructive"
  | "external"
  | "local"
  | "read-only";

/** Provider capability descriptor used by future workflow adapters. */
export interface StudioProviderCapability {
  readonly credentialRequired: boolean;
  readonly dryRun: boolean;
  readonly family: StudioProviderFamily;
  readonly id: StudioProviderCapabilityId;
  readonly label: string;
  readonly retryable: boolean;
  readonly reversible: boolean;
  readonly risk: StudioProviderCapabilityRisk;
}

/** Workflow adapter profile mode. */
type StudioWorkflowAdapterMode =
  | "direct-publish"
  | "provider-review"
  | "review";

/** Provider-neutral workflow adapter profile. */
export interface StudioWorkflowAdapterProfile {
  readonly capabilities: readonly StudioProviderCapabilityId[];
  readonly id: string;
  readonly label: string;
  readonly mode: StudioWorkflowAdapterMode;
  readonly operations: readonly StudioWorkflowOperation[];
  readonly userVocabulary: "advanced" | "editorial";
}

/** Source or workflow diff emitted by a mocked workflow action. */
interface StudioWorkflowSourceDiff {
  readonly kind:
    | "no-source-change"
    | "publish-release"
    | "write-source"
    | "write-workflow-state";
  readonly path: string;
  readonly summary: string;
}

/** Mocked workflow event for deterministic tests and future previews. */
interface StudioWorkflowEvent {
  readonly action: StudioWorkflowOperation;
  readonly advancedDetail?: string | undefined;
  readonly publicDetail: string;
  readonly status: "blocked" | "completed";
}

/** Input for running a mocked workflow action. */
export interface MockStudioWorkflowActionInput {
  readonly context?: StudioWorkflowTransitionContext | undefined;
  readonly operation: StudioWorkflowOperation;
  readonly profile: StudioWorkflowAdapterProfile;
  readonly sourcePath?: string | undefined;
  readonly state: StudioEditorialState;
}

/** Output from a mocked workflow action. */
export interface MockStudioWorkflowActionResult {
  readonly diagnostics: readonly string[];
  readonly events: readonly StudioWorkflowEvent[];
  readonly ok: boolean;
  readonly sourceDiffs: readonly StudioWorkflowSourceDiff[];
  readonly state: StudioEditorialState;
}

const providerCapabilities = [
  capability("source.write", "source", "Write source changes", {
    dryRun: true,
    reversible: true,
    risk: "local",
  }),
  capability("source.diff", "source", "Diff source changes", {
    dryRun: true,
    reversible: true,
    risk: "read-only",
  }),
  capability("history.restore", "history", "Restore previous versions", {
    dryRun: true,
    reversible: true,
    risk: "destructive",
  }),
  capability("media.materialize", "media", "Materialize media for builds", {
    dryRun: true,
    reversible: false,
    risk: "local",
  }),
  capability("workflow.direct-publish", "workflow", "Direct publish workflow", {
    dryRun: true,
    reversible: true,
    risk: "external",
  }),
  capability("workflow.review", "workflow", "Review workflow", {
    dryRun: true,
    reversible: true,
    risk: "local",
  }),
  capability("build.preview", "build", "Preview build", {
    dryRun: true,
    reversible: true,
    risk: "local",
  }),
  capability("build.full", "build", "Full static build", {
    dryRun: true,
    reversible: true,
    risk: "local",
  }),
  capability("deploy.publish", "deploy", "Publish generated output", {
    credentialRequired: true,
    dryRun: false,
    reversible: true,
    risk: "external",
  }),
  capability("deploy.status", "deploy", "Read deploy status", {
    credentialRequired: true,
    dryRun: true,
    reversible: true,
    risk: "read-only",
  }),
  capability("deploy.cache.invalidate", "deploy", "Invalidate deploy cache", {
    credentialRequired: true,
    dryRun: false,
    reversible: false,
    risk: "external",
  }),
  capability(
    "diagnostics.release-health",
    "diagnostics",
    "Compare release health",
    {
      dryRun: true,
      reversible: true,
      risk: "read-only",
    },
  ),
  capability("identity.credentials", "identity", "Use provider credentials", {
    credentialRequired: true,
    dryRun: true,
    reversible: false,
    risk: "external",
  }),
] as const satisfies readonly StudioProviderCapability[];

const workflowProfiles = [
  {
    capabilities: [
      "source.write",
      "source.diff",
      "history.restore",
      "workflow.direct-publish",
      "build.preview",
      "build.full",
      "deploy.publish",
      "deploy.status",
      "diagnostics.release-health",
    ],
    id: "local-direct-publish",
    label: "Local direct publish",
    mode: "direct-publish",
    operations: [
      "save-draft",
      "preview",
      "publish",
      "unpublish",
      "schedule",
      "rollback",
      "restore-version",
      "deploy-status",
      "release-health",
    ],
    userVocabulary: "editorial",
  },
  {
    capabilities: [
      "source.write",
      "source.diff",
      "history.restore",
      "workflow.review",
      "build.preview",
      "build.full",
      "deploy.publish",
      "deploy.status",
      "diagnostics.release-health",
    ],
    id: "optional-review",
    label: "Optional editorial review",
    mode: "review",
    operations: [
      "save-draft",
      "preview",
      "submit-review",
      "approve",
      "request-changes",
      "publish",
      "unpublish",
      "schedule",
      "rollback",
      "restore-version",
      "deploy-status",
      "release-health",
    ],
    userVocabulary: "editorial",
  },
  {
    capabilities: [
      "source.write",
      "source.diff",
      "history.restore",
      "workflow.review",
      "build.preview",
      "build.full",
      "deploy.publish",
      "deploy.status",
      "deploy.cache.invalidate",
      "diagnostics.release-health",
      "identity.credentials",
    ],
    id: "provider-review",
    label: "Provider-backed review",
    mode: "provider-review",
    operations: [
      "save-draft",
      "preview",
      "submit-review",
      "approve",
      "request-changes",
      "publish",
      "unpublish",
      "schedule",
      "rollback",
      "restore-version",
      "deploy-status",
      "cache-invalidate",
      "release-health",
    ],
    userVocabulary: "advanced",
  },
] as const satisfies readonly StudioWorkflowAdapterProfile[];

/**
 * Returns the provider-neutral capability registry.
 *
 * @returns Workflow capability descriptors.
 */
export function studioProviderCapabilities(): StudioProviderCapability[] {
  return providerCapabilities.map((entry) => ({ ...entry }));
}

/**
 * Returns the bundled workflow adapter profiles.
 *
 * @returns Workflow adapter profiles for direct, review, and provider modes.
 */
export function studioWorkflowAdapterProfiles(): StudioWorkflowAdapterProfile[] {
  return workflowProfiles.map((entry) => ({
    ...entry,
    capabilities: Array.from(entry.capabilities),
    operations: Array.from(entry.operations),
  }));
}

/**
 * Finds one bundled workflow adapter profile.
 *
 * @param id Workflow profile ID.
 * @returns Matching adapter profile.
 */
export function studioWorkflowAdapterProfile(
  id: string,
): StudioWorkflowAdapterProfile {
  const profile = studioWorkflowAdapterProfiles().find(
    (candidate) => candidate.id === id,
  );

  if (profile === undefined) {
    throw new Error(`Missing studio workflow adapter profile "${id}".`);
  }

  return profile;
}

/**
 * Returns capability IDs missing from a profile for one operation.
 *
 * @param profile Workflow adapter profile.
 * @param operation Requested workflow operation.
 * @returns Missing capability IDs, or an empty array when supported.
 */
export function missingWorkflowCapabilities(
  profile: StudioWorkflowAdapterProfile,
  operation: StudioWorkflowOperation,
): StudioProviderCapabilityId[] {
  if (!profile.operations.includes(operation)) {
    return requiredCapabilitiesForOperation(operation);
  }

  return requiredCapabilitiesForOperation(operation).filter(
    (capabilityId) => !profile.capabilities.includes(capabilityId),
  );
}

/**
 * Runs a mocked provider workflow action without network or credentials.
 *
 * @param input Mock workflow action input.
 * @returns Deterministic workflow result with events and source diffs.
 */
export function runMockStudioWorkflowAction(
  input: MockStudioWorkflowActionInput,
): MockStudioWorkflowActionResult {
  const missingCapabilities = missingWorkflowCapabilities(
    input.profile,
    input.operation,
  );

  if (missingCapabilities.length > 0) {
    return blocked(input.state, input.operation, [
      `Missing capabilities: ${missingCapabilities.join(", ")}.`,
    ]);
  }

  const editorialAction = editorialActionForOperation(input.operation);

  if (editorialAction === undefined) {
    return completed({
      operation: input.operation,
      sourcePath: input.sourcePath,
      state: input.state,
    });
  }

  const transition = transitionStudioEditorialState(
    input.state,
    editorialAction,
    input.context,
  );

  if (!transition.ok) {
    return blocked(input.state, input.operation, transition.diagnostics);
  }

  return completed({
    operation: input.operation,
    sourcePath: input.sourcePath,
    state: transition.state,
  });
}

function blocked(
  state: StudioEditorialState,
  operation: StudioWorkflowOperation,
  diagnostics: readonly string[],
): MockStudioWorkflowActionResult {
  return {
    diagnostics,
    events: [
      {
        action: operation,
        publicDetail: diagnostics[0] ?? "Workflow action was blocked.",
        status: "blocked",
      },
    ],
    ok: false,
    sourceDiffs: [],
    state,
  };
}

function capability(
  id: StudioProviderCapabilityId,
  family: StudioProviderFamily,
  label: string,
  options: {
    readonly credentialRequired?: boolean | undefined;
    readonly dryRun: boolean;
    readonly retryable?: boolean | undefined;
    readonly reversible: boolean;
    readonly risk: StudioProviderCapabilityRisk;
  },
): StudioProviderCapability {
  return {
    credentialRequired: options.credentialRequired ?? false,
    dryRun: options.dryRun,
    family,
    id,
    label,
    reversible: options.reversible,
    retryable: options.retryable ?? true,
    risk: options.risk,
  };
}

function completed({
  operation,
  sourcePath = "studio://source",
  state,
}: {
  readonly operation: StudioWorkflowOperation;
  readonly sourcePath?: string | undefined;
  readonly state: StudioEditorialState;
}): MockStudioWorkflowActionResult {
  return {
    diagnostics: [],
    events: [
      {
        action: operation,
        advancedDetail: advancedDetailForOperation(operation),
        publicDetail: publicDetailForOperation(operation),
        status: "completed",
      },
    ],
    ok: true,
    sourceDiffs: [sourceDiffForOperation(operation, sourcePath)],
    state,
  };
}

function editorialActionForOperation(
  operation: StudioWorkflowOperation,
): StudioWorkflowAction | undefined {
  switch (operation) {
    case "approve":
      return "approve";
    case "cache-invalidate":
    case "deploy-status":
    case "preview":
    case "release-health":
      return undefined;
    case "publish":
      return "publish";
    case "request-changes":
      return "request-changes";
    case "restore-version":
      return "restore";
    case "rollback":
      return "roll-back";
    case "save-draft":
      return "save-draft";
    case "schedule":
      return "schedule";
    case "submit-review":
      return "submit-review";
    case "unpublish":
      return "unpublish";
  }
}

function publicDetailForOperation(operation: StudioWorkflowOperation): string {
  switch (operation) {
    case "approve":
      return "Review approved.";
    case "cache-invalidate":
      return "Cache invalidation requested.";
    case "deploy-status":
      return "Deploy status checked.";
    case "preview":
      return "Preview prepared.";
    case "publish":
      return "Published.";
    case "release-health":
      return "Release health checked.";
    case "request-changes":
      return "Changes requested.";
    case "restore-version":
      return "Version restored.";
    case "rollback":
      return "Rollback proposed.";
    case "save-draft":
      return "Draft saved.";
    case "schedule":
      return "Publish scheduled.";
    case "submit-review":
      return "Submitted for review.";
    case "unpublish":
      return "Unpublished.";
  }
}

function advancedDetailForOperation(
  operation: StudioWorkflowOperation,
): string | undefined {
  if (
    operation === "cache-invalidate" ||
    operation === "deploy-status" ||
    operation === "publish" ||
    operation === "release-health"
  ) {
    return "Provider adapters may expose deploy logs, release IDs, and cache evidence as advanced details.";
  }

  return undefined;
}

function requiredCapabilitiesForOperation(
  operation: StudioWorkflowOperation,
): StudioProviderCapabilityId[] {
  switch (operation) {
    case "approve":
    case "request-changes":
    case "submit-review":
      return ["workflow.review", "source.diff"];
    case "cache-invalidate":
      return ["deploy.cache.invalidate"];
    case "deploy-status":
      return ["deploy.status"];
    case "preview":
      return ["build.preview", "source.diff"];
    case "publish":
      return ["build.full", "deploy.publish"];
    case "release-health":
      return ["diagnostics.release-health"];
    case "restore-version":
    case "rollback":
      return ["history.restore", "source.diff"];
    case "save-draft":
      return ["source.write"];
    case "schedule":
      return ["source.write"];
    case "unpublish":
      return ["source.write"];
  }
}

function sourceDiffForOperation(
  operation: StudioWorkflowOperation,
  sourcePath: string,
): StudioWorkflowSourceDiff {
  switch (operation) {
    case "approve":
    case "request-changes":
    case "schedule":
    case "submit-review":
      return {
        kind: "write-workflow-state",
        path: sourcePath,
        summary: publicDetailForOperation(operation),
      };
    case "cache-invalidate":
    case "deploy-status":
    case "preview":
    case "release-health":
      return {
        kind: "no-source-change",
        path: sourcePath,
        summary: publicDetailForOperation(operation),
      };
    case "publish":
      return {
        kind: "publish-release",
        path: sourcePath,
        summary: publicDetailForOperation(operation),
      };
    case "restore-version":
    case "rollback":
    case "save-draft":
    case "unpublish":
      return {
        kind: "write-source",
        path: sourcePath,
        summary: publicDetailForOperation(operation),
      };
  }
}
