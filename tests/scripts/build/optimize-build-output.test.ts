import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, spyOn, test } from "bun:test";

import { runOptimizeBuildOutputCli } from "../../../scripts/build/optimize-build-output";

function withBuildOutput<T>(
  run: (paths: { cwd: string; outputDir: string }) => T,
): T {
  const cwd = mkdtempSync(path.join(tmpdir(), "tpm-optimize-cli-test-"));
  const outputDir = path.join(cwd, "dist");

  try {
    mkdirSync(path.join(outputDir, "_astro"), { recursive: true });
    writeFileSync(
      path.join(outputDir, "_astro", "style.css"),
      ".example    { color: rgb(255, 0, 0); margin: 0px; }\n",
    );
    writeFileSync(
      path.join(outputDir, "_astro", "entry.js"),
      "const message = 'hello' + ' world'; console.log(message);\n",
    );
    writeFileSync(
      path.join(outputDir, "favicon.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><metadata>unused</metadata><rect width="10" height="10"/></svg>',
    );

    return run({ cwd, outputDir });
  } finally {
    rmSync(cwd, { force: true, recursive: true });
  }
}

describe("production build output optimizer CLI", () => {
  test.serial("prints command usage without optimizing output", () => {
    const log = spyOn(console, "log").mockImplementation(() => undefined);

    try {
      expect(runOptimizeBuildOutputCli(["--help"])).toBe(0);
      expect(String(log.mock.calls[0]?.[0])).toContain(
        "Usage: just build-optimize",
      );
    } finally {
      log.mockRestore();
    }
  });

  test.serial("optimizes generated output quietly when requested", () => {
    withBuildOutput(({ cwd, outputDir }) => {
      const log = spyOn(console, "log").mockImplementation(() => undefined);
      const error = spyOn(console, "error").mockImplementation(() => undefined);

      try {
        expect(runOptimizeBuildOutputCli(["--quiet"], cwd)).toBe(0);
        expect(log).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
        expect(
          readFileSync(path.join(outputDir, "_astro", "style.css"), "utf8"),
        ).not.toContain("    ");
        expect(
          readFileSync(path.join(outputDir, "_astro", "entry.js"), "utf8"),
        ).toContain("console.log");
        expect(
          readFileSync(path.join(outputDir, "favicon.svg"), "utf8"),
        ).toContain("viewBox");
      } finally {
        log.mockRestore();
        error.mockRestore();
      }
    });
  });

  test.serial(
    "fails clearly when the configured output directory is missing",
    () => {
      const error = spyOn(console, "error").mockImplementation(() => undefined);

      try {
        expect(
          runOptimizeBuildOutputCli(["--dir", "missing-dist"], tmpdir()),
        ).toBe(1);
        expect(String(error.mock.calls[0]?.[0])).toContain(
          "Build output directory does not exist",
        );
      } finally {
        error.mockRestore();
      }
    },
  );
});
