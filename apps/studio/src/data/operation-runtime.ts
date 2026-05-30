import type { StudioAuthoringOperationResult } from "./authoring-operation";
import {
  diagnosticSeverityTone,
  type StudioOperationResult,
} from "./read-only-operation";

/** Operation result variants currently returned to the Studio runtime panel. */
export type StudioRuntimeOperationResult =
  | StudioAuthoringOperationResult
  | StudioOperationResult;

/** Diagnostic item variants currently returned to the Studio runtime panel. */
export type StudioRuntimeDiagnostic =
  StudioRuntimeOperationResult["diagnostics"]["diagnostics"][number];

/** Tauri command names currently exposed to the Studio frontend. */
export type StudioOperationCommand =
  | "check_site"
  | "site_status"
  | "studio_content"
  | "studio_media"
  | "studio_preview"
  | "studio_publish_apply"
  | "studio_release"
  | "studio_settings"
  | "studio_workflow_verify";

/** Presentation state for the Studio operation result panel. */
export type StudioOperationLoadState =
  | {
      command: StudioOperationCommand;
      kind: "error";
      message: string;
      result: StudioRuntimeOperationResult;
    }
  | {
      command: StudioOperationCommand;
      kind: "loading";
      result: StudioRuntimeOperationResult;
    }
  | {
      command: StudioOperationCommand;
      kind: "ready";
      result: StudioRuntimeOperationResult;
    }
  | {
      kind: "fallback";
      result: StudioRuntimeOperationResult;
    };

/** Command option rendered by the Studio operation panel. */
export interface StudioOperationCommandOption {
  /** Tauri command name. */
  command: StudioOperationCommand;
  /** Short button label. */
  label: string;
}

/** The operation commands the current Studio GUI slice can request. */
export const studioOperationCommandOptions = [
  { command: "site_status", label: "Site status" },
  { command: "check_site", label: "Check site" },
  { command: "studio_settings", label: "Settings" },
  { command: "studio_content", label: "Content" },
  { command: "studio_media", label: "Media" },
  { command: "studio_preview", label: "Preview" },
  { command: "studio_release", label: "Release" },
  { command: "studio_publish_apply", label: "Publish apply" },
  { command: "studio_workflow_verify", label: "Verify studio" },
] as const satisfies readonly StudioOperationCommandOption[];

/**
 * Returns whether an unknown value is a Tauri Studio operation command.
 *
 * @param command Potential command value from a button dataset.
 * @returns True when the command belongs to the rendered command catalog.
 */
export function isStudioOperationCommand(
  command: string | undefined,
): command is StudioOperationCommand {
  return studioOperationCommandOptions.some(
    (option) => option.command === command,
  );
}

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
 * @param command Tauri command name.
 * @returns Human-facing command label.
 */
export function commandLabel(command: StudioOperationCommand): string {
  switch (command) {
    case "check_site":
      return "Check site";
    case "site_status":
      return "Site status";
    case "studio_content":
      return "Content";
    case "studio_media":
      return "Media";
    case "studio_preview":
      return "Preview";
    case "studio_publish_apply":
      return "Publish apply";
    case "studio_release":
      return "Release";
    case "studio_settings":
      return "Settings";
    case "studio_workflow_verify":
      return "Verify studio";
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
export function hasDiagnostics(result: StudioRuntimeOperationResult): boolean {
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
