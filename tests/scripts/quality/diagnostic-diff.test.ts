import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, spyOn, test } from "bun:test";

import {
  compareDiagnostics,
  diagnosticDiffIsEmpty,
  type DiagnosticRecord,
  formatDiagnosticDiff,
  runDiagnosticDiffCli,
} from "../../../scripts/quality/diagnostic-diff";

const baseDiagnostic = {
  code: "missing-alt",
  file: "dist/articles/example/index.html",
  message: "Image is missing alt text.",
  severity: "error",
  tool: "html",
} satisfies DiagnosticRecord;

async function withTempRoot<T>(callback: (root: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-diagnostic-diff-test-"));

  try {
    return await callback(root);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

async function writeJson(
  root: string,
  relativePath: string,
  value: unknown,
): Promise<string> {
  const fullPath = path.join(root, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, `${JSON.stringify(value)}\n`);
  return fullPath;
}

describe("diagnostic diff", () => {
  test("treats reordered diagnostics and duplicate records as the same snapshot", () => {
    const expected = [
      baseDiagnostic,
      {
        ...baseDiagnostic,
        code: "broken-link",
        count: 2,
        message: "Broken local link.",
      },
    ];
    const actual = [
      { ...baseDiagnostic, code: "broken-link", message: "Broken local link." },
      { ...baseDiagnostic, code: "broken-link", message: "Broken local link." },
      baseDiagnostic,
    ];

    expect(diagnosticDiffIsEmpty(compareDiagnostics(expected, actual))).toBe(
      true,
    );
  });

  test("reports missing, added, and changed diagnostic counts", () => {
    const result = compareDiagnostics(
      [
        baseDiagnostic,
        {
          ...baseDiagnostic,
          code: "broken-link",
          count: 2,
          message: "Broken local link.",
        },
      ],
      [
        {
          ...baseDiagnostic,
          code: "broken-link",
          message: "Broken local link.",
        },
        {
          ...baseDiagnostic,
          code: "new-warning",
          message: "New warning.",
          severity: "warning",
        },
      ],
    );

    expect(result.missing.map((delta) => delta.record.code)).toEqual([
      "missing-alt",
    ]);
    expect(result.added.map((delta) => delta.record.code)).toEqual([
      "new-warning",
    ]);
    expect(result.countChanged).toEqual([
      {
        actualCount: 1,
        expectedCount: 2,
        record: {
          ...baseDiagnostic,
          code: "broken-link",
          message: "Broken local link.",
        },
      },
    ]);
  });

  test("formats actionable diff reports", () => {
    const report = formatDiagnosticDiff(
      compareDiagnostics([baseDiagnostic], []),
    );

    expect(report).toContain("Missing diagnostics:");
    expect(report).toContain("html/missing-alt error");
    expect(report).toContain("expected 1, actual 0");
  });

  test.serial("compares diagnostic JSON files from the CLI", async () =>
    withTempRoot(async (root) => {
      const log = spyOn(console, "log").mockImplementation(() => undefined);

      try {
        const expected = await writeJson(root, "expected.json", [
          baseDiagnostic,
        ]);
        const actual = await writeJson(root, "actual.json", [baseDiagnostic]);

        const exitCode = await runDiagnosticDiffCli([expected, actual]);

        expect(exitCode).toBe(0);
        expect(String(log.mock.calls[0]?.[0])).toContain(
          "Diagnostic diff passed",
        );
      } finally {
        log.mockRestore();
      }
    }),
  );

  test.serial("fails malformed diagnostic JSON from the CLI", async () =>
    withTempRoot(async (root) => {
      const error = spyOn(console, "error").mockImplementation(() => undefined);

      try {
        const expected = await writeJson(root, "expected.json", [
          baseDiagnostic,
        ]);
        const actual = await writeJson(root, "actual.json", [
          { code: "missing-tool" },
        ]);

        const exitCode = await runDiagnosticDiffCli([expected, actual]);

        expect(exitCode).toBe(1);
        expect(String(error.mock.calls[0]?.[0])).toContain(
          "is not a valid diagnostic record",
        );
      } finally {
        error.mockRestore();
      }
    }),
  );
});
