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
  formatPostBuildOptimizationSuiteReport,
  type PostBuildOptimizationGateRunner,
  type PostBuildOptimizationScenario,
  type PostBuildOptimizationVerifyRunner,
  runPostBuildOptimizationSuite,
  runPostBuildOptimizationSuiteCli,
} from "../../../scripts/payload/run-post-build-optimization-experiments";

const cssScenario = {
  name: "css",
  policy: "candidate",
  rationale: "CSS fixture.",
  transforms: ["lightning-css"],
} as const satisfies PostBuildOptimizationScenario;

const svgScenario = {
  name: "svg",
  policy: "candidate",
  rationale: "SVG fixture.",
  transforms: ["svgo"],
} as const satisfies PostBuildOptimizationScenario;

const jsScenario = {
  name: "js",
  policy: "candidate",
  rationale: "JS fixture.",
  transforms: ["oxc-js-conservative"],
} as const satisfies PostBuildOptimizationScenario;

async function withBuildOutput<T>(
  run: (paths: {
    outputRoot: string;
    reportFile: string;
    sourceDir: string;
  }) => Promise<T> | T,
): Promise<T> {
  const rootDir = mkdtempSync(path.join(tmpdir(), "tpm-postbuild-suite-test-"));
  const sourceDir = path.join(rootDir, "dist");
  const outputRoot = path.join(rootDir, "out");
  const reportFile = path.join(rootDir, "report.md");

  try {
    mkdirSync(path.join(sourceDir, "_astro"), { recursive: true });
    writeFileSync(
      path.join(sourceDir, "index.html"),
      "<!doctype html><html><body>Home</body></html>",
    );
    writeFileSync(
      path.join(sourceDir, "_astro", "style.css"),
      ".example    { color: rgb(255, 0, 0); margin: 0px; }\n",
    );
    writeFileSync(
      path.join(sourceDir, "_astro", "entry.js"),
      "const message = 'hello' + ' world'; console.log(message);\n",
    );
    writeFileSync(
      path.join(sourceDir, "favicon.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><metadata>unused</metadata><rect width="10" height="10"/></svg>',
    );

    return await run({ outputRoot, reportFile, sourceDir });
  } finally {
    rmSync(rootDir, { force: true, recursive: true });
  }
}

const passingGateRunner: PostBuildOptimizationGateRunner = async (command) => {
  await Promise.resolve();

  return {
    command,
    exitCode: 0,
    output: "",
  };
};

const passingVerifyRunner: PostBuildOptimizationVerifyRunner = async () => {
  await Promise.resolve();

  return {
    command: {
      args: ["scripts/build/verify-build.ts", "--quiet"],
      binary: "bunx",
      label: "Build verification",
    },
    exitCode: 0,
    output: "",
  };
};

describe("standalone post-build optimization suite", () => {
  test("runs standalone CSS, SVG, and JS scenarios and writes a report", async () => {
    await withBuildOutput(async ({ outputRoot, reportFile, sourceDir }) => {
      mkdirSync(path.join(outputRoot, "css"), { recursive: true });
      writeFileSync(path.join(outputRoot, "css", "stale.txt"), "stale");

      const result = await runPostBuildOptimizationSuite({
        cwd: process.cwd(),
        gateRunner: passingGateRunner,
        outputRoot,
        reportFile,
        scenarios: [cssScenario, svgScenario, jsScenario],
        sourceDir,
        verifyRunner: passingVerifyRunner,
      });

      expect(result.results).toHaveLength(3);
      expect(result.report).toContain("Standalone Post-Build Optimization");
      expect(result.report).toContain("Adoption Notes");
      expect(result.recommendedScenario).toBeDefined();
      expect(existsSync(reportFile)).toBe(true);
      expect(readFileSync(reportFile, "utf8")).toContain(
        "standalone optimizers",
      );
      expect(existsSync(path.join(outputRoot, "css", "stale.txt"))).toBe(false);
    });
  });

  test("keeps failed gate output in the report and excludes failed candidates", async () => {
    const failingGateRunner: PostBuildOptimizationGateRunner = async (
      command,
    ) => {
      await Promise.resolve();

      return {
        command,
        exitCode: 1,
        output: "HTML validation failed.",
      };
    };

    await withBuildOutput(async ({ outputRoot, sourceDir }) => {
      const result = await runPostBuildOptimizationSuite({
        cwd: process.cwd(),
        gateRunner: failingGateRunner,
        outputRoot,
        scenarios: [cssScenario],
        sourceDir,
        verifyRunner: passingVerifyRunner,
      });

      expect(result.recommendedScenario).toBeUndefined();
      expect(result.results[0]?.productionEligible).toBe(false);
      expect(result.report).toContain("HTML validation failed.");
    });
  });

  test("formats an empty scenario report defensively", () => {
    const report = formatPostBuildOptimizationSuiteReport({
      baseline: {
        allFiles: {
          brotliBytes: 0,
          extension: "*",
          files: 0,
          gzipBytes: 0,
          rawBytes: 0,
        },
        byAssetRole: [],
        byExtension: [],
        cacheHeaders: [],
        gzipEligibleFiles: {
          brotliBytes: 0,
          extension: "gzip-eligible",
          files: 0,
          gzipBytes: 0,
          rawBytes: 0,
        },
        htmlFiles: {
          brotliBytes: 0,
          extension: ".html",
          files: 0,
          gzipBytes: 0,
          rawBytes: 0,
        },
        pdfs: {
          failureBytes: 0,
          files: [],
          status: "missing",
          targetBytes: 0,
          warningBytes: 0,
        },
        routeClasses: [],
        topHtmlByBrotli: [],
        topHtmlByGzip: [],
        topHtmlByRaw: [],
      },
      recommendedScenario: undefined,
      results: [],
    });

    expect(report).toContain("No standalone post-build optimizer");
  });

  test.serial("prints command usage without running experiments", async () => {
    const log = spyOn(console, "log").mockImplementation(() => undefined);

    try {
      expect(await runPostBuildOptimizationSuiteCli(["--help"])).toBe(0);
      expect(String(log.mock.calls[0]?.[0])).toContain(
        "Usage: just payload-postbuild-experiments",
      );
    } finally {
      log.mockRestore();
    }
  });

  test.serial("reports invalid CLI scenario names", async () => {
    const error = spyOn(console, "error").mockImplementation(() => undefined);

    try {
      expect(
        await runPostBuildOptimizationSuiteCli(["--scenario", "unknown"]),
      ).toBe(1);
      expect(String(error.mock.calls[0]?.[0])).toContain(
        "Unknown post-build optimization scenario",
      );
    } finally {
      error.mockRestore();
    }
  });
});
