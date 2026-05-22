import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, spyOn, test } from "bun:test";

import {
  collectPayloadReport,
  formatPayloadReport,
  payloadReportBlockingFailures,
  runPayloadReportCli,
} from "../../../scripts/payload/report-payload";
import {
  routeClassHtmlOutputPath,
  routeClassPerformanceBudgets,
} from "../../../src/lib/release/performance-budgets";

function withBuildOutput<T>(run: (distDir: string) => T): T {
  const rootDir = mkdtempSync(path.join(tmpdir(), "tpm-payload-test-"));
  const distDir = path.join(rootDir, "dist");

  try {
    mkdirSync(path.join(distDir, "articles", "sample"), { recursive: true });
    mkdirSync(path.join(distDir, "assets"), { recursive: true });
    writeFileSync(
      path.join(distDir, "index.html"),
      "<!doctype html><html><body><main>Hello world</main></body></html>",
    );
    writeFileSync(
      path.join(distDir, "articles", "sample", "index.html"),
      "<!doctype html><html><body><article>Long article text ".repeat(20),
    );
    writeFileSync(
      path.join(distDir, "_headers"),
      "/_astro/*\n  Cache-Control: public, max-age=31556952, immutable\n",
    );
    writeFileSync(
      path.join(distDir, "assets", "site.css"),
      "body { color: red; }",
    );
    writeFileSync(path.join(distDir, "assets", "app.js"), "console.log('x');");
    writeFileSync(
      path.join(distDir, "assets", "image.png"),
      Buffer.from([1, 2, 3]),
    );
    writeFileSync(
      path.join(distDir, "articles", "sample", "sample.pdf"),
      Buffer.alloc(3 * 1024 * 1024 + 1),
    );

    return run(distDir);
  } finally {
    rmSync(rootDir, { force: true, recursive: true });
  }
}

describe("payload reporter", () => {
  test("aggregates raw, gzip, and Brotli sizes by extension", () => {
    withBuildOutput((distDir) => {
      const report = collectPayloadReport({ distDir, topCount: 1 });
      const htmlGroup = report.byExtension.find(
        (group) => group.extension === ".html",
      );
      const imageGroup = report.byExtension.find(
        (group) => group.extension === ".png",
      );
      const pdfRole = report.byAssetRole.find((group) => group.role === "pdf");
      const homeClass = report.routeClasses.find(
        (group) => group.id === "home",
      );

      expect(report.allFiles.files).toBe(7);
      expect(report.htmlFiles.files).toBe(2);
      expect(report.topHtmlByRaw).toHaveLength(1);
      expect(report.topHtmlByGzip).toHaveLength(1);
      expect(report.topHtmlByBrotli).toHaveLength(1);
      expect(htmlGroup?.gzipBytes).toBeGreaterThan(0);
      expect(htmlGroup?.brotliBytes).toBeGreaterThan(0);
      expect(imageGroup?.gzipBytes).toBeUndefined();
      expect(imageGroup?.brotliBytes).toBeUndefined();
      expect(pdfRole?.files).toBe(1);
      expect(report.pdfs.status).toBe("warn");
      expect(report.cacheHeaders).toEqual([
        {
          expectedHeader: "Cache-Control: public, max-age=31556952, immutable",
          headersPath: "_headers",
          pathPattern: "/_astro/*",
          status: "pass",
        },
      ]);
      expect(homeClass?.status).toBe("pass");
    });
  });

  test("formats deterministic human-readable output", () => {
    withBuildOutput((distDir) => {
      const report = collectPayloadReport({ distDir, topCount: 2 });
      const output = formatPayloadReport(report);

      expect(output).toContain("Payload report:");
      expect(output).toContain("Gzip-eligible assets:");
      expect(output).toContain("By extension:");
      expect(output).toContain("- .html:");
      expect(output).toContain("Largest HTML by Brotli:");
      expect(output).toContain("Largest HTML by gzip:");
      expect(output).toContain("articles/sample/index.html");
      expect(output).toContain("By asset role:");
      expect(output).toContain("Route classes:");
      expect(output).toContain("Generated PDFs:");
      expect(output).toContain("Cache headers:");
    });
  });

  test("separates warnings from deterministic release-blocking failures", () => {
    withBuildOutput((distDir) => {
      writeRouteClassFixtureFiles(distDir);
      const report = collectPayloadReport({ distDir, topCount: 2 });

      expect(report.pdfs.status).toBe("warn");
      expect(payloadReportBlockingFailures(report)).toEqual([]);

      unlinkSync(path.join(distDir, "_headers"));

      const brokenReport = collectPayloadReport({ distDir, topCount: 2 });

      expect(payloadReportBlockingFailures(brokenReport)).toContainEqual({
        message:
          'Cache header missing: expected "Cache-Control: public, max-age=31556952, immutable" under /_astro/* in _headers',
        owner: "cache",
      });
    });
  });

  test.serial("prints JSON from the command-line workflow", () => {
    withBuildOutput((distDir) => {
      const log = spyOn(console, "log").mockImplementation(() => undefined);

      try {
        expect(runPayloadReportCli(["--dist", distDir, "--json"])).toBe(0);
        const htmlFileCount = parseHtmlFileCount(
          String(log.mock.calls[0]?.[0]),
        );

        expect(htmlFileCount).toBe(2);
      } finally {
        log.mockRestore();
      }
    });
  });

  test.serial(
    "checks deterministic payload budgets from the command line",
    () => {
      withBuildOutput((distDir) => {
        writeRouteClassFixtureFiles(distDir);
        const log = spyOn(console, "log").mockImplementation(() => undefined);
        const error = spyOn(console, "error").mockImplementation(
          () => undefined,
        );

        try {
          expect(runPayloadReportCli(["--dist", distDir, "--check"])).toBe(0);

          unlinkSync(path.join(distDir, "_headers"));

          expect(runPayloadReportCli(["--dist", distDir, "--check"])).toBe(1);
          expect(String(error.mock.calls[0]?.[0])).toBe(
            "Payload budget check failed:",
          );
        } finally {
          error.mockRestore();
          log.mockRestore();
        }
      });
    },
  );

  test.serial("prints command usage without reading dist", () => {
    const log = spyOn(console, "log").mockImplementation(() => undefined);

    try {
      expect(runPayloadReportCli(["--help"], "/definitely/missing")).toBe(0);
      expect(String(log.mock.calls[0]?.[0])).toContain("Usage:");
    } finally {
      log.mockRestore();
    }
  });

  test.serial("reports missing build output and invalid flags", () => {
    const error = spyOn(console, "error").mockImplementation(() => undefined);

    try {
      expect(runPayloadReportCli(["--dist", "/definitely/missing"])).toBe(1);
      expect(String(error.mock.calls[0]?.[0])).toContain(
        "Build output directory not found",
      );

      expect(runPayloadReportCli(["--top", "0"])).toBe(1);
      expect(String(error.mock.calls[1]?.[0])).toContain(
        "--top must be a positive integer",
      );
    } finally {
      error.mockRestore();
    }
  });
});

function writeRouteClassFixtureFiles(distDir: string): void {
  for (const route of routeClassPerformanceBudgets.flatMap((budget) =>
    Array.from(budget.routes),
  )) {
    const outputPath = path.join(distDir, routeClassHtmlOutputPath(route));
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(
      outputPath,
      `<!doctype html><html><body><main>${route}</main></body></html>`,
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseHtmlFileCount(value: string): number {
  const parsed: unknown = JSON.parse(value);

  if (!isRecord(parsed) || !isRecord(parsed["htmlFiles"])) {
    throw new Error("Payload JSON did not include htmlFiles.");
  }

  const htmlFiles = parsed["htmlFiles"];

  if (typeof htmlFiles["files"] !== "number") {
    throw new Error("Payload JSON did not include an HTML file count.");
  }

  return htmlFiles["files"];
}
