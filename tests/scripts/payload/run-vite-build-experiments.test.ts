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
  formatViteBuildExperimentSuiteReport,
  runViteBuildExperimentSuite,
  runViteBuildExperimentSuiteCli,
  type ViteBuildScenario,
  type ViteBuildScenarioRunner,
} from "../../../scripts/payload/run-vite-build-experiments";

const baselineScenario = {
  config: {},
  name: "baseline",
  policy: "candidate",
  rationale: "Baseline fixture.",
} as const satisfies ViteBuildScenario;

const smallerScenario = {
  config: {
    build: {
      cssMinify: "lightningcss",
    },
  },
  name: "smaller-css",
  policy: "candidate",
  rationale: "Smaller fixture.",
} as const satisfies ViteBuildScenario;

const unsupportedScenario = {
  config: {
    build: {
      minify: "oxc",
    },
  },
  name: "oxc-minify",
  policy: "unsupported",
  rationale: "Unsupported fixture.",
} as const satisfies ViteBuildScenario;

async function withExperimentPaths<T>(
  run: (paths: { outputRoot: string; reportFile: string }) => Promise<T> | T,
): Promise<T> {
  const rootDir = mkdtempSync(path.join(tmpdir(), "tpm-vite-suite-test-"));
  const outputRoot = path.join(rootDir, "out");
  const reportFile = path.join(rootDir, "report.md");

  try {
    return await run({ outputRoot, reportFile });
  } finally {
    rmSync(rootDir, { force: true, recursive: true });
  }
}

function writeBuildFixture(outputDir: string, repeatedText: string): void {
  mkdirSync(path.join(outputDir, "_astro"), { recursive: true });
  mkdirSync(path.join(outputDir, "about"), { recursive: true });
  mkdirSync(path.join(outputDir, "articles"), { recursive: true });
  mkdirSync(path.join(outputDir, "authors", "writer"), { recursive: true });
  mkdirSync(path.join(outputDir, "categories", "culture"), {
    recursive: true,
  });
  mkdirSync(path.join(outputDir, "search"), { recursive: true });
  writeFileSync(
    path.join(outputDir, "index.html"),
    `<!doctype html><html><body>${repeatedText}</body></html>`,
  );
  writeFileSync(
    path.join(outputDir, "404.html"),
    "<!doctype html><html><body>Missing</body></html>",
  );
  writeFileSync(
    path.join(outputDir, "about", "index.html"),
    "<!doctype html><html><body>About</body></html>",
  );
  writeFileSync(
    path.join(outputDir, "articles", "index.html"),
    "<!doctype html><html><body>Articles</body></html>",
  );
  writeFileSync(
    path.join(outputDir, "authors", "writer", "index.html"),
    "<!doctype html><html><body>Writer</body></html>",
  );
  writeFileSync(
    path.join(outputDir, "categories", "culture", "index.html"),
    "<!doctype html><html><body>Culture</body></html>",
  );
  writeFileSync(
    path.join(outputDir, "search", "index.html"),
    "<!doctype html><html><body>Search</body></html>",
  );
  writeFileSync(path.join(outputDir, "_astro", "style.css"), repeatedText);
  writeFileSync(path.join(outputDir, "_astro", "entry.js"), repeatedText);
}

describe("Vite build experiment suite", () => {
  test("runs build scenarios, measures Brotli deltas, and writes a report", async () => {
    const runner: ViteBuildScenarioRunner = async (scenario, paths) => {
      await Promise.resolve();

      writeBuildFixture(
        paths.outputDir,
        scenario.name === "baseline"
          ? Array.from({ length: 200 }, (_, index) => `word-${index}`).join(" ")
          : "alpha ".repeat(20),
      );

      return [
        {
          command: {
            args: ["astro", "build", "--config", paths.configFile],
            binary: "bunx",
            label: "Astro build",
          },
          exitCode: 0,
          output: "",
        },
        {
          command: {
            args: ["pagefind", "--site", paths.outputDir],
            binary: "bunx",
            label: "Pagefind indexing",
          },
          exitCode: 0,
          output: "",
        },
      ];
    };

    await withExperimentPaths(async ({ outputRoot, reportFile }) => {
      const result = await runViteBuildExperimentSuite({
        cwd: process.cwd(),
        outputRoot,
        reportFile,
        runner,
        scenarios: [baselineScenario, smallerScenario],
      });

      expect(result.results).toHaveLength(2);
      expect(result.recommendedScenario?.scenario.name).toBe("smaller-css");
      expect(result.report).toContain("Vite Build Experiments");
      expect(result.report).toContain("Brotli Delta");
      expect(result.report).toContain("Follow-Up Candidates");
      expect(existsSync(reportFile)).toBe(true);
      expect(readFileSync(reportFile, "utf8")).toContain(
        "compression-capable hosting",
      );
    });
  });

  test("records unsupported build failures without treating them as candidates", async () => {
    const runner: ViteBuildScenarioRunner = async (scenario, paths) => {
      await Promise.resolve();

      if (scenario.policy === "unsupported") {
        return [
          {
            command: {
              args: ["astro", "build", "--config", paths.configFile],
              binary: "bunx",
              label: "Astro build",
            },
            exitCode: 1,
            output: "Invalid value for build.minify: oxc",
          },
        ];
      }

      writeBuildFixture(paths.outputDir, "baseline ".repeat(20));

      return [
        {
          command: {
            args: ["astro", "build", "--config", paths.configFile],
            binary: "bunx",
            label: "Astro build",
          },
          exitCode: 0,
          output: "",
        },
      ];
    };

    await withExperimentPaths(async ({ outputRoot }) => {
      const result = await runViteBuildExperimentSuite({
        cwd: process.cwd(),
        outputRoot,
        runner,
        scenarios: [baselineScenario, unsupportedScenario],
      });

      expect(result.recommendedScenario).toBeUndefined();
      expect(result.results[1]?.productionEligible).toBe(false);
      expect(result.report).toContain("Invalid value for build.minify: oxc");
    });
  });

  test("formats an empty suite defensively", () => {
    const report = formatViteBuildExperimentSuiteReport({
      baseline: undefined,
      recommendedScenario: undefined,
      results: [],
    });

    expect(report).toContain("No baseline was captured.");
    expect(report).toContain(
      "No Vite/Astro build override currently qualifies",
    );
  });

  test.serial("prints command usage without running experiments", async () => {
    const log = spyOn(console, "log").mockImplementation(() => undefined);

    try {
      expect(await runViteBuildExperimentSuiteCli(["--help"])).toBe(0);
      expect(String(log.mock.calls[0]?.[0])).toContain(
        "Usage: just payload-vite-experiments",
      );
    } finally {
      log.mockRestore();
    }
  });

  test.serial("reports invalid CLI scenario names", async () => {
    const error = spyOn(console, "error").mockImplementation(() => undefined);

    try {
      expect(
        await runViteBuildExperimentSuiteCli(["--scenario", "unknown"]),
      ).toBe(1);
      expect(String(error.mock.calls[0]?.[0])).toContain(
        "Unknown Vite build scenario",
      );
    } finally {
      error.mockRestore();
    }
  });
});
