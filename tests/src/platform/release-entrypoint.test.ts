import { describe, expect, test } from "bun:test";

import {
  createReleaseGovernanceReport,
  releaseGovernanceDiagnostics,
} from "../../../src/platform/release";

describe("platform release entrypoint", () => {
  test("exposes release governance helpers through the platform seam", () => {
    expect(
      releaseGovernanceDiagnostics({
        changes: [],
        deploymentResults: [],
      }),
    ).toEqual([]);
    expect(
      createReleaseGovernanceReport({
        changes: [],
        deploymentResults: [],
        releaseId: "fixture",
        version: "0.1.0",
      }).summary.changeCount,
    ).toBe(0);
  });
});
