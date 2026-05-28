import authoringOperationResult from "./authoring-operation.json";

/** Rust-shaped Studio authoring fixture consumed by Milestone 12 panels. */
export const authoringOperation = authoringOperationResult;

/** Inferred Studio authoring operation envelope. */
export type StudioAuthoringOperationResult = typeof authoringOperation;

/** Inferred Studio authoring payload data shape. */
export type StudioAuthoringPayload =
  StudioAuthoringOperationResult["payload"]["data"];

/** Studio authoring surface item. */
export type StudioAuthoringSurface = StudioAuthoringPayload["surfaces"][number];

/** Studio settings field descriptor. */
export type StudioSettingsField = StudioAuthoringPayload["settings"][number];

/** Studio content entry descriptor. */
export type StudioContentEntry =
  StudioAuthoringPayload["content"]["entries"][number];

/** Studio media entry descriptor. */
export type StudioMediaEntry =
  StudioAuthoringPayload["media"]["entries"][number];

/** Studio verification item descriptor. */
export type StudioVerificationItem =
  StudioAuthoringPayload["verification"][number];

/**
 * Returns the display label for a surface status.
 *
 * @param status Studio authoring surface status.
 * @returns Human-facing status label.
 */
export function surfaceStatusLabel(status: string): string {
  switch (status) {
    case "dry-run":
      return "Dry run";
    case "partial":
      return "Partial";
    case "ready":
      return "Ready";
    case "requires-approval":
      return "Needs approval";
    case "requires-credentials":
      return "Needs credentials";
    case "unsupported":
      return "Unsupported";
    default:
      return "Needs review";
  }
}

/**
 * Returns the badge tone for a surface status.
 *
 * @param status Studio authoring surface status.
 * @returns Badge tone for the surface status.
 */
export function surfaceStatusTone(
  status: string,
): "failed" | "success" | "warning" {
  switch (status) {
    case "ready":
      return "success";
    case "unsupported":
      return "failed";
    case "partial":
    case "requires-approval":
    case "requires-credentials":
    default:
      return "warning";
  }
}
