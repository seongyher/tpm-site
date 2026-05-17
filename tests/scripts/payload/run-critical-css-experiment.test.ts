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

import { describe, expect, test } from "bun:test";

import { runCriticalCssExperiment } from "../../../scripts/payload/run-critical-css-experiment";

async function withBuildOutput<T>(
  run: (paths: {
    outputDir: string;
    reportFile: string;
    sourceDir: string;
  }) => Promise<T> | T,
): Promise<T> {
  const rootDir = mkdtempSync(path.join(tmpdir(), "tpm-critical-css-test-"));
  const sourceDir = path.join(rootDir, "dist");
  const outputDir = path.join(rootDir, "out");
  const reportFile = path.join(rootDir, "report.md");

  try {
    mkdirSync(path.join(sourceDir, "_astro"), { recursive: true });
    writeFileSync(
      path.join(sourceDir, "index.html"),
      `<!doctype html>
<html lang="en">
  <head>
    <title>Critical CSS Test</title>
    <link rel="stylesheet" href="/_astro/base.css">
  </head>
  <body>
    <main class="article">
      <h1>Critical CSS Test</h1>
      <p>Experiment fixture.</p>
    </main>
  </body>
</html>`,
    );
    writeFileSync(
      path.join(sourceDir, "_astro", "base.css"),
      ".article{max-width:40rem}.unused{color:red}",
    );

    return await run({ outputDir, reportFile, sourceDir });
  } finally {
    rmSync(rootDir, { force: true, recursive: true });
  }
}

describe("critical CSS experiment", () => {
  test("runs on a copied build output and writes a reproducible report", async () => {
    await withBuildOutput(async ({ outputDir, reportFile, sourceDir }) => {
      const sourceHtmlFile = path.join(sourceDir, "index.html");
      const originalSourceHtml = readFileSync(sourceHtmlFile, "utf8");

      const report = await runCriticalCssExperiment({
        outputDir,
        reportFile,
        sourceDir,
      });

      expect(existsSync(reportFile)).toBe(true);
      expect(report).toContain("# Critical CSS Experiment");
      expect(report).toContain("- HTML files processed: 1");
      expect(report).toContain("## Payload Deltas");
      expect(report).toContain("## Initial Recommendation");
      expect(readFileSync(reportFile, "utf8")).toBe(`${report}\n`);
      expect(readFileSync(sourceHtmlFile, "utf8")).toBe(originalSourceHtml);
      expect(existsSync(path.join(outputDir, "index.html"))).toBe(true);
      expect(existsSync(path.join(outputDir, "_astro", "base.css"))).toBe(true);
    });
  });
});
