import {
  diagnosticSeverityTone,
  type StudioOperationResult,
} from "./read-only-operation";

/** Read-only Tauri command names currently exposed to the Studio frontend. */
export type StudioOperationCommand = "check_site" | "site_status";

/** Presentation state for the read-only operation result panel. */
export type StudioOperationLoadState =
  | {
      command: StudioOperationCommand;
      kind: "error";
      message: string;
      result: StudioOperationResult;
    }
  | {
      command: StudioOperationCommand;
      kind: "loading";
      result: StudioOperationResult;
    }
  | {
      command: StudioOperationCommand;
      kind: "ready";
      result: StudioOperationResult;
    }
  | {
      kind: "fallback";
      result: StudioOperationResult;
    };

/** Read-only command option rendered by the Studio operation panel. */
export interface StudioOperationCommandOption {
  /** Tauri command name. */
  command: StudioOperationCommand;
  /** Short button label. */
  label: string;
}

/** The read-only operation commands the first Studio GUI slice can request. */
export const studioOperationCommandOptions = [
  { command: "site_status", label: "Site status" },
  { command: "check_site", label: "Check site" },
] as const satisfies readonly StudioOperationCommandOption[];

/**
 * Returns a stable status message for the operation panel state.
 *
 * @param state Current operation load state.
 * @returns Human-facing status text suitable for an aria-live region.
 */
export function operationStateMessage(state: StudioOperationLoadState): string {
  switch (state.kind) {
    case "error":
      return `${commandLabel(state.command)} failed. Showing the last known operation result.`;
    case "fallback":
      return "Browser preview is showing the validated fixture fallback.";
    case "loading":
      return `Running ${commandLabel(state.command)}.`;
    case "ready":
      return `${commandLabel(state.command)} completed.`;
  }
}

/**
 * Returns a user-facing command label.
 *
 * @param command Read-only Tauri command name.
 * @returns Human-facing command label.
 */
export function commandLabel(command: StudioOperationCommand): string {
  switch (command) {
    case "check_site":
      return "Check site";
    case "site_status":
      return "Site status";
  }
}

/**
 * Converts an unknown failure reason into safe display text.
 *
 * @param error Unknown caught value.
 * @returns Short error message without leaking object internals.
 */
export function operationErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "The Studio command failed before returning an operation result.";
}

/**
 * Returns whether an operation result has visible diagnostics.
 *
 * @param result Operation result envelope.
 * @returns True when the result includes at least one diagnostic.
 */
export function hasDiagnostics(result: StudioOperationResult): boolean {
  return result.diagnostics.diagnostics.length > 0;
}

/**
 * Returns the border class for a diagnostic severity.
 *
 * @param severity Diagnostic severity from an operation result.
 * @returns Tailwind class for the diagnostic card border.
 */
export function diagnosticBorderClass(severity: string): string {
  switch (diagnosticSeverityTone(severity)) {
    case "error":
      return "border-l-danger";
    case "note":
      return "border-l-accent";
    case "warning":
      return "border-l-warning";
  }
}
