import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, spyOn, test } from "bun:test";

import {
  formatMinifyHtmlExperimentSuiteReport,
  type MinifyHtmlGateRunner,
  type MinifyHtmlScenario,
  runMinifyHtmlExperimentSuite,
  runMinifyHtmlExperimentSuiteCli,
} from "../../../scripts/payload/run-minify-html-experiments";

async function withBuildOutput<T>(
  run: (paths: {
    outputRoot: string;
    reportFile: string;
    sourceDir: string;
  }) => Promise<T> | T,
): Promise<T> {
  const rootDir = mkdtempSync(
    path.join(tmpdir(), "tpm-minify-html-suite-test-"),
  );
  const sourceDir = path.join(rootDir, "dist");
  const outputRoot = path.join(rootDir, "out");
  const reportFile = path.join(rootDir, "report.md");

  try {
    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(
      path.join(sourceDir, "index.html"),
      `<!doctype html>
<html lang="en">
  <head>
    <title>Suite Test</title>
  </head>
  <body>
    <main>
      <button type="button">Support Us</button>
      <p>   Hello      world.   </p>
    </main>
  </body>
</html>`,
    );
    writeFileSync(
      path.join(sourceDir, "404.html"),
      "<!doctype html><html><body>Missing</body></html>",
    );

    return await run({ outputRoot, reportFile, sourceDir });
  } finally {
    rmSync(rootDir, { force: true, recursive: true });
  }
}

const candidateScenario = {
  name: "conservative",
  policy: "candidate",
  rationale: "Candidate scenario for test fixtures.",
} as const satisfies MinifyHtmlScenario;

const measurementScenario = {
  name: "noncompliant-measurement",
  policy: "measurement-only",
  rationale: "Measurement-only scenario for test fixtures.",
} as const satisfies MinifyHtmlScenario;

describe("minify-html experiment suite", () => {
  test("runs reproducible scenarios and writes a Markdown report", async () => {
    const gateRunner: MinifyHtmlGateRunner = async (command) => {
      await Promise.resolve();

      return {
        command,
        exitCode: 0,
        output: "",
      };
    };

    await withBuildOutput(async ({ outputRoot, reportFile, sourceDir }) => {
      const result = await runMinifyHtmlExperimentSuite({
        cwd: process.cwd(),
        gateRunner,
        outputRoot,
        reportFile,
        scenarios: [candidateScenario, measurementScenario],
        sourceDir,
      });

      expect(result.results).toHaveLength(2);
      expect(result.recommendedScenario?.scenario.name).toBe("conservative");
      expect(result.report).toContain("HTML Brotli Delta");
      expect(result.report).toContain("One-Pass Feasibility");
      expect(existsSync(reportFile)).toBe(true);
      expect(readFileSync(reportFile, "utf8")).toContain(
        "production target is static HTML",
      );
      expect(result.results[1]?.productionEligible).toBe(false);
    });
  });

  test("records failed gates and can enforce a production-candidate requirement", async () => {
    const gateRunner: MinifyHtmlGateRunner = async (command) => {
      await Promise.resolve();

      return {
        command,
        exitCode: 1,
        output: "HTML validation failed.\n<button> is missing type.",
      };
    };

    await withBuildOutput(async ({ outputRoot, sourceDir }) => {
      const result = await runMinifyHtmlExperimentSuite({
        cwd: process.cwd(),
        gateRunner,
        outputRoot,
        scenarios: [candidateScenario],
        sourceDir,
      });

      expect(result.recommendedScenario).toBeUndefined();
      expect(result.report).toContain("fail (1)");
      expect(result.report).toContain("HTML validation failed.");

      let rejectionMessage = "";

      try {
        await runMinifyHtmlExperimentSuite({
          cwd: process.cwd(),
          failIfNoProductionCandidate: true,
          gateRunner,
          outputRoot,
          scenarios: [candidateScenario],
          sourceDir,
        });
      } catch (error) {
        rejectionMessage =
          error instanceof Error ? error.message : String(error);
      }

      expect(rejectionMessage).toContain("No minify-html scenario passed");
    });
  });

  test("formats an empty suite report defensively", () => {
    const report = formatMinifyHtmlExperimentSuiteReport({
      recommendedScenario: undefined,
      results: [],
    });

    expect(report).toContain("No baseline was captured.");
    expect(report).toContain("No tested scenario is production-eligible.");
  });

  test.serial("prints command usage without running experiments", async () => {
    const log = spyOn(console, "log").mockImplementation(() => undefined);

    try {
      expect(await runMinifyHtmlExperimentSuiteCli(["--help"])).toBe(0);
      expect(String(log.mock.calls[0]?.[0])).toContain(
        "Usage: just payload-minify-html-experiments",
      );
    } finally {
      log.mockRestore();
    }
  });

  test.serial("reports invalid CLI scenario names", async () => {
    const error = spyOn(console, "error").mockImplementation(() => undefined);

    try {
      expect(
        await runMinifyHtmlExperimentSuiteCli(["--scenario", "unknown"]),
      ).toBe(1);
      expect(String(error.mock.calls[0]?.[0])).toContain(
        "Unknown minify-html scenario",
      );
    } finally {
      error.mockRestore();
    }
  });
});
