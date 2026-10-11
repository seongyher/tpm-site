import { describe, expect, test } from "bun:test";

import {
  formatCommandResult,
  outputHasWarningOrError,
  resultIsBlockingFailure,
  shouldPrintResult,
} from "../../../scripts/quality/run-quality";

const blockingCommand = {
  args: ["--silent", "run", "check"],
  blocking: true,
  label: "Normal quality gate",
};

const reviewCommand = {
  args: ["--silent", "run", "review:assets"],
  blocking: false,
  label: "Asset review",
};

describe("quiet quality runner", () => {
  test("does not treat successful zero-count summaries as warnings", () => {
    expect(
      outputHasWarningOrError(`Result (24 files):
- 0 errors
- 0 warnings
- 0 hints`),
    ).toBe(false);

    expect(outputHasWarningOrError("No warnings found.")).toBe(false);
    expect(outputHasWarningOrError("warnings: 0")).toBe(false);
    expect(
      outputHasWarningOrError(
        "$ oxlint --config .oxlintrc.json --deny-warnings .",
      ),
    ).toBe(false);
  });

  test("detects plural warning and error summaries", () => {
    expect(outputHasWarningOrError("2 warnings found.")).toBe(true);
    expect(outputHasWarningOrError("1 error found.")).toBe(true);
  });

  test("prints successful command output when it contains an actual warning", () => {
    expect(
      shouldPrintResult({
        command: reviewCommand,
        exitCode: 0,
        output: "Unused image review warning: found 1 image file.",
      }),
    ).toBe(true);
  });

  test("prints failed command output and marks blocking failures", () => {
    const result = {
      command: blockingCommand,
      exitCode: 1,
      output: "Type error: Example failed.",
    };

    expect(shouldPrintResult(result)).toBe(true);
    expect(resultIsBlockingFailure(result)).toBe(true);
    expect(formatCommandResult(result)).toContain("$ bun --silent run check");
  });

  test("non-blocking review failures do not fail the quality runner", () => {
    expect(
      resultIsBlockingFailure({
        command: reviewCommand,
        exitCode: 1,
        output: "Unused image review warning.",
      }),
    ).toBe(false);
  });
});
