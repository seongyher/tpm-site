import { describe, expect, test } from "vitest";

import {
  commandLabel,
  diagnosticBorderClass,
  hasDiagnostics,
  isStudioOperationCommand,
  operationErrorMessage,
  operationStateMessage,
  studioOperationCommandOptions,
} from "../../../apps/studio/src/data/operation-runtime";
import {
  badgeClassForTone,
  diagnosticSeverityTone,
  operationStatusLabel,
  operationStatusTone,
  readOnlyOperation,
  studioNavigation,
} from "../../../apps/studio/src/data/read-only-operation";

describe("studio operation runtime helpers", () => {
  test("describes fallback, loading, ready, and error states", () => {
    expect(
      operationStateMessage({
        kind: "fallback",
        result: readOnlyOperation,
      }),
    ).toContain("fixture fallback");
    expect(
      operationStateMessage({
        command: "site_status",
        kind: "loading",
        result: readOnlyOperation,
      }),
    ).toBe("Running Site status.");
    expect(
      operationStateMessage({
        command: "check_site",
        kind: "ready",
        result: readOnlyOperation,
      }),
    ).toBe("Check site completed.");
    expect(
      operationStateMessage({
        command: "check_site",
        kind: "error",
        message: "failed",
        result: readOnlyOperation,
      }),
    ).toContain("failed");
  });

  test("normalizes unknown errors for display", () => {
    expect(operationErrorMessage(new Error("Command failed"))).toBe(
      "Command failed",
    );
    expect(operationErrorMessage("Command failed")).toBe("Command failed");
    expect(operationErrorMessage({ message: "hidden internals" })).toBe(
      "The Studio command failed before returning an operation result.",
    );
  });

  test("reports diagnostic presence and severity classes", () => {
    expect(hasDiagnostics(readOnlyOperation)).toBe(true);
    expect(diagnosticBorderClass("error")).toBe("border-l-danger");
    expect(diagnosticBorderClass("note")).toBe("border-l-accent");
    expect(diagnosticBorderClass("warning")).toBe("border-l-warning");
    expect(diagnosticBorderClass("unexpected")).toBe("border-l-danger");
  });

  test("keeps status and severity tone mappings explicit", () => {
    expect(operationStatusTone("failed")).toBe("failed");
    expect(operationStatusTone("success")).toBe("success");
    expect(operationStatusTone("warning")).toBe("warning");
    expect(operationStatusTone("partial")).toBe("warning");
    expect(operationStatusTone("requires-approval")).toBe("warning");
    expect(operationStatusTone("requires-credentials")).toBe("warning");
    expect(operationStatusTone("unsupported")).toBe("failed");
    expect(operationStatusTone("unexpected")).toBe("failed");

    expect(operationStatusLabel("failed")).toBe("Blocked");
    expect(operationStatusLabel("success")).toBe("Ready");
    expect(operationStatusLabel("warning")).toBe("Needs attention");
    expect(operationStatusLabel("partial")).toBe("Partial");
    expect(operationStatusLabel("requires-approval")).toBe("Needs approval");
    expect(operationStatusLabel("requires-credentials")).toBe(
      "Needs credentials",
    );
    expect(operationStatusLabel("unsupported")).toBe("Unsupported");
    expect(operationStatusLabel("unexpected")).toBe("Blocked");

    expect(diagnosticSeverityTone("error")).toBe("error");
    expect(diagnosticSeverityTone("note")).toBe("note");
    expect(diagnosticSeverityTone("warning")).toBe("warning");
    expect(diagnosticSeverityTone("unexpected")).toBe("error");
  });

  test("keeps badge classes and studio navigation stable", () => {
    expect(badgeClassForTone("error")).toBe("bg-danger-muted text-danger");
    expect(badgeClassForTone("failed")).toBe("bg-danger-muted text-danger");
    expect(badgeClassForTone("note")).toBe(
      "bg-accent/15 text-accent-foreground",
    );
    expect(badgeClassForTone("success")).toBe("bg-success-muted text-success");
    expect(badgeClassForTone("warning")).toBe("bg-warning-muted text-warning");

    expect(studioNavigation.map((item) => item.label)).toEqual([
      "Overview",
      "Diagnostics",
      "Settings",
      "Content",
      "Media",
      "Preview",
      "Publish",
      "Audit",
      "Verification",
    ]);
    expect(studioNavigation.map(({ disabled }) => disabled)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  test("keeps the Studio operation command catalog explicit", () => {
    const expectedCommands = [
      "site_status",
      "check_site",
      "studio_settings",
      "studio_content",
      "studio_media",
      "studio_preview",
      "studio_release",
      "studio_publish_apply",
      "studio_workflow_verify",
    ] as const;

    expect(
      studioOperationCommandOptions.map((option) => option.command),
    ).toEqual(Array.from(expectedCommands));
    expect(expectedCommands.map((command) => commandLabel(command))).toEqual([
      "Site status",
      "Check site",
      "Settings",
      "Content",
      "Media",
      "Preview",
      "Release",
      "Publish apply",
      "Verify studio",
    ]);
    expect(isStudioOperationCommand("studio_release")).toBe(true);
    expect(isStudioOperationCommand("site_status")).toBe(true);
    expect(isStudioOperationCommand("unknown")).toBe(false);
  });
});
