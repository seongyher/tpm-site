import {
  type AuthorDiagnostic,
  type AuthorDiagnosticCategory,
  createAuthorDiagnostic,
} from "./author-diagnostics";
import {
  type StudioEditability,
  type StudioEditableDomain,
  type StudioEditorDocument,
  studioEditorDocuments,
  type StudioFieldDescriptor,
  studioFieldDescriptors,
  type StudioGeneratedSurface,
  type StudioSourceReference,
  studioSourceReference,
} from "./studio-models";

/** JSON value accepted by studio contracts. */
type StudioJsonValue =
  | boolean
  | null
  | number
  | readonly StudioJsonValue[]
  | string
  | { readonly [key: string]: StudioJsonValue };

/** JSON object accepted by studio source patch helpers. */
export type StudioJsonObject = Readonly<Record<string, StudioJsonValue>>;

/** Preview artifact family requested by a studio preview. */
type StudioPreviewArtifactKind =
  | "diagnostics"
  | "feed"
  | "html"
  | "metadata"
  | "pdf"
  | "search"
  | "social-image";

/** Preview status returned by deterministic studio contracts. */
type StudioPreviewStatus =
  | "diagnostics"
  | "ready"
  | "unavailable"
  | "unsupported";

/** How a patch should be applied by a future source adapter. */
type StudioPatchWriteMode = "draft-only" | "source-edit";

/** Form field descriptor derived from a studio field descriptor. */
interface StudioFormFieldDescriptor {
  readonly diagnostics: readonly AuthorDiagnosticCategory[];
  readonly editability: StudioEditability;
  readonly effects: readonly StudioGeneratedSurface[];
  readonly fieldPath: string;
  readonly id: string;
  readonly input: StudioFieldDescriptor["input"];
  readonly label: string;
  readonly required: boolean;
}

/** Form section for grouped studio fields. */
interface StudioFormSectionDescriptor {
  readonly fields: readonly StudioFormFieldDescriptor[];
  readonly id: StudioEditability;
  readonly title: string;
}

/** JSON-ready form descriptor for one editor document. */
export interface StudioFormDescriptor {
  readonly documentId: string;
  readonly sections: readonly StudioFormSectionDescriptor[];
  readonly source: StudioSourceReference;
  readonly title: string;
}

/** Proposed change to one studio field. */
export interface StudioFieldPatch {
  readonly fieldPath: string;
  readonly value: StudioJsonValue;
  readonly writeMode?: StudioPatchWriteMode | undefined;
}

/** Validated field patch with resolved field descriptor. */
export interface NormalizedStudioFieldPatch {
  readonly field: StudioFieldDescriptor;
  readonly fieldPath: string;
  readonly value: StudioJsonValue;
  readonly writeMode: StudioPatchWriteMode;
}

/** Result of validating dirty studio field patches. */
export interface StudioFieldPatchNormalizationResult {
  readonly diagnostics: readonly AuthorDiagnostic[];
  readonly normalizedPatches: readonly NormalizedStudioFieldPatch[];
  readonly unsupportedFields: readonly string[];
}

/** Route or generated output target requested by a preview. */
interface StudioPreviewTarget {
  readonly outputPath?: string | undefined;
  readonly route?: string | undefined;
}

/** Deterministic studio preview request. */
export interface StudioPreviewRequest {
  readonly artifacts: readonly StudioPreviewArtifactKind[];
  readonly document: StudioEditorDocument;
  readonly patches: StudioFieldPatchNormalizationResult;
  readonly requiredCapabilities: readonly string[];
  readonly targets: readonly StudioPreviewTarget[];
}

/** Deterministic studio preview response shell. */
export interface StudioPreviewResponse {
  readonly artifacts: readonly StudioPreviewArtifactKind[];
  readonly diagnostics: readonly AuthorDiagnostic[];
  readonly normalizedPatches: readonly NormalizedStudioFieldPatch[];
  readonly requiredCapabilities: readonly string[];
  readonly status: StudioPreviewStatus;
  readonly targets: readonly StudioPreviewTarget[];
  readonly unavailableCapabilities: readonly string[];
  readonly unsupportedFields: readonly string[];
}

/** Options for creating a studio preview request. */
export interface StudioPreviewRequestOptions {
  readonly allowCodeOnly?: boolean | undefined;
  readonly artifacts?: readonly StudioPreviewArtifactKind[] | undefined;
  readonly domain: StudioEditableDomain;
  readonly patches?: readonly StudioFieldPatch[] | undefined;
  readonly requiredCapabilities?: readonly string[] | undefined;
  readonly targets?: readonly StudioPreviewTarget[] | undefined;
}

/** Options for creating a studio preview response. */
export interface StudioPreviewResponseOptions {
  readonly diagnostics?: readonly AuthorDiagnostic[] | undefined;
  readonly request: StudioPreviewRequest;
  readonly unavailableCapabilities?: readonly string[] | undefined;
}

/**
 * Applies normalized studio patches to a JSON object without mutating source.
 *
 * @param source Source object to patch.
 * @param patches Normalized field patches.
 * @returns Patched source object.
 */
export function applyStudioFieldPatches(
  source: StudioJsonObject,
  patches: readonly NormalizedStudioFieldPatch[],
): StudioJsonObject {
  return patches.reduce(
    (current, patch) =>
      applyStudioFieldPatch(current, patch.fieldPath, patch.value),
    source,
  );
}

/**
 * Builds form descriptors for every editable studio document.
 *
 * @returns JSON-ready form descriptors.
 */
export function studioFormDescriptors(): StudioFormDescriptor[] {
  return studioEditorDocuments().map(studioFormDescriptorForDocument);
}

/**
 * Builds a form descriptor for one editable domain.
 *
 * @param domain Editable studio domain.
 * @returns JSON-ready form descriptor.
 */
export function studioFormDescriptorForDomain(
  domain: StudioEditableDomain,
): StudioFormDescriptor {
  return studioFormDescriptorForDocument({
    description: studioSourceReference(domain).description,
    fields: studioFieldDescriptors(domain),
    id: domain,
    source: studioSourceReference(domain),
    title: domain,
  });
}

/**
 * Builds a form descriptor for one editor document.
 *
 * @param document Editor document descriptor.
 * @returns Form descriptor grouped by editability.
 */
function studioFormDescriptorForDocument(
  document: StudioEditorDocument,
): StudioFormDescriptor {
  const sections = (
    ["beginner", "advanced", "code-only", "extension-owned"] as const
  )
    .map((editability) => ({
      fields: document.fields
        .filter(
          (fieldDescriptor) => fieldDescriptor.editability === editability,
        )
        .map(formFieldDescriptor),
      id: editability,
      title: sectionTitle(editability),
    }))
    .filter((section) => section.fields.length > 0);

  return {
    documentId: document.id,
    sections,
    source: document.source,
    title: document.title,
  };
}

/**
 * Validates dirty field patches against a studio document descriptor.
 *
 * @param document Editor document descriptor.
 * @param patches Proposed field patches.
 * @param options Normalization options.
 * @param options.allowCodeOnly Whether code-only fields may be patched.
 * @returns Normalized patches and repairable diagnostics.
 */
export function normalizeStudioFieldPatches(
  document: StudioEditorDocument,
  patches: readonly StudioFieldPatch[],
  options: { readonly allowCodeOnly?: boolean | undefined } = {},
): StudioFieldPatchNormalizationResult {
  const normalizedPatches: NormalizedStudioFieldPatch[] = [];
  const diagnostics: AuthorDiagnostic[] = [];
  const unsupportedFields: string[] = [];

  for (const patch of patches) {
    const fieldDescriptor = document.fields.find(
      (field) => field.fieldPath === patch.fieldPath,
    );

    if (fieldDescriptor === undefined) {
      diagnostics.push(unknownFieldDiagnostic(document, patch.fieldPath));
      continue;
    }

    if (
      fieldDescriptor.editability === "code-only" &&
      options.allowCodeOnly !== true
    ) {
      unsupportedFields.push(fieldDescriptor.fieldPath);
      diagnostics.push(unsupportedFieldDiagnostic(fieldDescriptor));
      continue;
    }

    normalizedPatches.push({
      field: fieldDescriptor,
      fieldPath: patch.fieldPath,
      value: patch.value,
      writeMode: patch.writeMode ?? "source-edit",
    });
  }

  return {
    diagnostics,
    normalizedPatches,
    unsupportedFields,
  };
}

/**
 * Creates a deterministic preview request from dirty editor state.
 *
 * @param options Preview request options.
 * @returns Preview request with normalized patches.
 */
export function createStudioPreviewRequest(
  options: StudioPreviewRequestOptions,
): StudioPreviewRequest {
  const document = studioEditorDocuments().find(
    (candidate) => candidate.id === options.domain,
  );

  if (document === undefined) {
    throw new Error(`Missing studio editor document "${options.domain}".`);
  }

  return {
    artifacts: options.artifacts ?? ["html", "metadata", "diagnostics"],
    document,
    patches: normalizeStudioFieldPatches(document, options.patches ?? [], {
      allowCodeOnly: options.allowCodeOnly,
    }),
    requiredCapabilities: options.requiredCapabilities ?? [],
    targets: options.targets ?? [],
  };
}

/**
 * Creates a deterministic preview response shell from a preview request.
 *
 * @param options Preview response options.
 * @returns Preview response status, diagnostics, and normalized patches.
 */
export function createStudioPreviewResponse(
  options: StudioPreviewResponseOptions,
): StudioPreviewResponse {
  const unavailableCapabilities = options.unavailableCapabilities ?? [];
  const diagnostics = [
    ...options.request.patches.diagnostics,
    ...(options.diagnostics ?? []),
  ];
  const status = previewStatus({
    diagnostics,
    unavailableCapabilities,
    unsupportedFields: options.request.patches.unsupportedFields,
  });

  return {
    artifacts: options.request.artifacts,
    diagnostics,
    normalizedPatches: options.request.patches.normalizedPatches,
    requiredCapabilities: options.request.requiredCapabilities,
    status,
    targets: options.request.targets,
    unavailableCapabilities,
    unsupportedFields: options.request.patches.unsupportedFields,
  };
}

/**
 * Creates a repairable diagnostic for an unsupported preview field.
 *
 * @param fieldDescriptor Unsupported field descriptor.
 * @returns Author-facing diagnostic.
 */
export function unsupportedFieldDiagnostic(
  fieldDescriptor: StudioFieldDescriptor,
): AuthorDiagnostic {
  const category = fieldDescriptor.diagnostics[0] ?? "content";

  return createAuthorDiagnostic({
    category,
    code: `${category}.studio-preview-unsupported`,
    fixability: "source-edit",
    location: {
      fieldPath: fieldDescriptor.fieldPath,
    },
    relatedDocs: ["docs/STUDIO_READINESS_CONTRACTS.md"],
    remediation: "Edit this field in source or enable a compatible extension.",
    repairOwner: fieldDescriptor.owner,
    severity: "warning",
    source: "site-doctor",
    summary: `${fieldDescriptor.label} cannot be safely edited in this preview surface.`,
  });
}

function formFieldDescriptor(
  fieldDescriptor: StudioFieldDescriptor,
): StudioFormFieldDescriptor {
  return {
    diagnostics: fieldDescriptor.diagnostics,
    editability: fieldDescriptor.editability,
    effects: fieldDescriptor.effects,
    fieldPath: fieldDescriptor.fieldPath,
    id: fieldDescriptor.id,
    input: fieldDescriptor.input,
    label: fieldDescriptor.label,
    required: fieldDescriptor.required,
  };
}

function applyStudioFieldPatch(
  source: StudioJsonObject,
  fieldPath: string,
  value: StudioJsonValue,
): StudioJsonObject {
  const [head, ...tail] = fieldPath.split(".");

  if (head === undefined || head.length === 0) {
    return source;
  }

  if (tail.length === 0) {
    return {
      ...source,
      [head]: value,
    };
  }

  // eslint-disable-next-line security/detect-object-injection -- Studio patch paths are validated against descriptors before reaching this pure JSON patch helper.
  const currentValue = source[head];
  const currentObject = isStudioJsonObject(currentValue) ? currentValue : {};

  return {
    ...source,
    [head]: applyStudioFieldPatch(currentObject, tail.join("."), value),
  };
}

function isStudioJsonObject(
  value: StudioJsonValue | undefined,
): value is StudioJsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function previewStatus({
  diagnostics,
  unavailableCapabilities,
  unsupportedFields,
}: {
  readonly diagnostics: readonly AuthorDiagnostic[];
  readonly unavailableCapabilities: readonly string[];
  readonly unsupportedFields: readonly string[];
}): StudioPreviewStatus {
  if (unavailableCapabilities.length > 0) {
    return "unavailable";
  }

  if (unsupportedFields.length > 0) {
    return "unsupported";
  }

  if (diagnostics.length > 0) {
    return "diagnostics";
  }

  return "ready";
}

function sectionTitle(editability: StudioEditability): string {
  switch (editability) {
    case "advanced":
      return "Advanced";
    case "beginner":
      return "Basics";
    case "code-only":
      return "Source Only";
    case "extension-owned":
      return "Extensions";
  }
}

function unknownFieldDiagnostic(
  document: StudioEditorDocument,
  fieldPath: string,
): AuthorDiagnostic {
  const source = document.source;
  const category = source.role === "config" ? "config" : "content";

  return createAuthorDiagnostic({
    category,
    code: `${category}.studio-field-unknown`,
    fixability: "source-edit",
    location: {
      fieldPath,
    },
    relatedDocs: ["docs/STUDIO_READINESS_CONTRACTS.md"],
    remediation:
      "Use a field declared by the current platform source contract.",
    repairOwner: source.defaultOwner,
    severity: "error",
    source: "site-doctor",
    summary: `Unknown studio field "${fieldPath}" for ${document.title}.`,
  });
}
