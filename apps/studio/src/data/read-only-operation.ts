import operationResult from "./read-only-operation.json";

/** Rust-owned read-only operation fixture consumed by the studio shell. */
export const readOnlyOperation = operationResult;

/** Inferred operation result shape from the Rust-validated JSON fixture. */
export type StudioOperationResult = typeof readOnlyOperation;

/** Inferred diagnostic item shape from the Rust-validated operation fixture. */
export type StudioDiagnostic =
  StudioOperationResult["diagnostics"]["diagnostics"][number];

/** UI badge tones for operation statuses supported by the shared envelope. */
export type StudioOperationStatusTone = "failed" | "success" | "warning";

/** UI badge tones for diagnostic severities supported by the shared envelope. */
export type StudioDiagnosticSeverityTone = "error" | "note" | "warning";

/** All status badge tones currently used by the read-only Studio shell. */
export type StudioBadgeTone =
  | StudioDiagnosticSeverityTone
  | StudioOperationStatusTone;

/** Studio surface navigation item. */
export interface StudioNavigationItem {
  /** Whether the surface is disabled in the current slice. */
  disabled: boolean;
  /** Fragment target for the surface. */
  href: string;
  /** Human-facing navigation label. */
  label: string;
}

/** Navigation model for the static Studio shell. */
export const studioNavigation = [
  { disabled: false, href: "#overview", label: "Overview" },
  { disabled: false, href: "#operation-result", label: "Diagnostics" },
  { disabled: false, href: "#settings", label: "Settings" },
  { disabled: false, href: "#content", label: "Content" },
  { disabled: false, href: "#media", label: "Media" },
  { disabled: false, href: "#preview", label: "Preview" },
  { disabled: false, href: "#publish", label: "Publish" },
  { disabled: false, href: "#audit", label: "Audit" },
  { disabled: false, href: "#verification", label: "Verification" },
] as const satisfies readonly StudioNavigationItem[];

/**
 * Returns the shared status-badge class for a known Studio badge tone.
 *
 * @param tone Badge tone derived from operation status or diagnostic severity.
 * @returns Tailwind class list for the tone.
 */
export function badgeClassForTone(tone: StudioBadgeTone): string {
  switch (tone) {
    case "error":
    case "failed":
      return "bg-danger-muted text-danger";
    case "note":
      return "bg-accent/15 text-accent-foreground";
    case "success":
      return "bg-success-muted text-success";
    case "warning":
      return "bg-warning-muted text-warning";
  }
}

/**
 * Returns the human label for an operation status.
 *
 * @param status Status string from the operation envelope.
 * @returns Stable short label for the shell status badge.
 */
export function operationStatusLabel(status: string): string {
  switch (status) {
    case "partial":
      return "Partial";
    case "requires-approval":
      return "Needs approval";
    case "requires-credentials":
      return "Needs credentials";
    case "unsupported":
      return "Unsupported";
  }

  switch (operationStatusTone(status)) {
    case "failed":
      return "Blocked";
    case "success":
      return "Ready";
    case "warning":
      return "Needs attention";
  }
}

/**
 * Maps an operation status string to a supported UI badge tone.
 *
 * @param status Status string from the operation envelope.
 * @returns Badge tone for known statuses, or failed for invalid fixture data.
 */
export function operationStatusTone(status: string): StudioOperationStatusTone {
  switch (status) {
    case "failed":
    case "success":
    case "warning":
      return status;
    case "partial":
    case "requires-approval":
    case "requires-credentials":
      return "warning";
    case "unsupported":
      return "failed";
    default:
      return "failed";
  }
}

/**
 * Maps a diagnostic severity string to a supported UI badge tone.
 *
 * @param severity Severity string from the operation diagnostic.
 * @returns Badge tone for known severities, or error for invalid fixture data.
 */
export function diagnosticSeverityTone(
  severity: string,
): StudioDiagnosticSeverityTone {
  switch (severity) {
    case "error":
    case "note":
    case "warning":
      return severity;
    default:
      return "error";
  }
}
