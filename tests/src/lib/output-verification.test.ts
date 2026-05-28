import { describe, expect, test } from "bun:test";

import {
  createOutputDiagnostic,
  createOutputVerificationReport,
  formatOutputDiagnostic,
  hasBlockingOutputDiagnostics,
  outputDiagnosticIdentity,
  runOutputVerifierModules,
} from "../../../src/lib/output-verification";

describe("output verification diagnostics", () => {
  test("creates diagnostics and rejects mismatched code namespaces", () => {
    const diagnostic = createOutputDiagnostic({
      category: "metadata",
      code: "metadata.description-missing",
      message: "index.html is missing a description.",
      moduleId: "metadata",
      owner: "generated-output",
      remediation: "Add a meta description.",
      severity: "error",
    });

    expect(diagnostic).toMatchObject({
      category: "metadata",
      code: "metadata.description-missing",
      severity: "error",
    });
    expect(() =>
      createOutputDiagnostic({
        category: "metadata",
        code: "html.description-missing",
        message: "Wrong namespace.",
        moduleId: "metadata",
        severity: "error",
      }),
    ).toThrow('must start with "metadata."');
  });

  test("summarizes diagnostics for machine-readable reports", () => {
    const diagnostics = [
      createOutputDiagnostic({
        category: "metadata",
        code: "metadata.description-missing",
        location: { outputPath: "index.html" },
        message: "Missing description.",
        moduleId: "metadata",
        severity: "error",
      }),
      createOutputDiagnostic({
        category: "asset",
        code: "asset.source-map-leak",
        location: { outputPath: "_astro/index.js.map" },
        message: "Source map leaked.",
        moduleId: "assets",
        severity: "warning",
      }),
      createOutputDiagnostic({
        category: "route",
        code: "route.static-route-ok",
        message: "Route output inspected.",
        moduleId: "routes",
        severity: "info",
      }),
    ];

    expect(createOutputVerificationReport(diagnostics).summary).toEqual({
      byCategory: {
        asset: 1,
        metadata: 1,
        route: 1,
      },
      byModule: {
        assets: 1,
        metadata: 1,
        routes: 1,
      },
      errors: 1,
      info: 1,
      total: 3,
      warnings: 1,
    });
    expect(hasBlockingOutputDiagnostics(diagnostics)).toBe(true);
  });

  test("builds stable diagnostic identities and human-readable lines", () => {
    const diagnostic = createOutputDiagnostic({
      category: "route",
      code: "route.required-output-missing",
      location: { outputPath: "articles/example/index.html" },
      message: "articles/example/index.html",
      moduleId: "routes",
      owner: "generated-output",
      severity: "error",
    });

    expect(outputDiagnosticIdentity(diagnostic)).toBe(
      "error|route.required-output-missing|articles/example/index.html",
    );
    expect(formatOutputDiagnostic(diagnostic)).toBe(
      "[error] route.required-output-missing at articles/example/index.html owner=generated-output: articles/example/index.html",
    );
  });

  test("runs verifier modules in order", async () => {
    const diagnostics = await runOutputVerifierModules(
      { distDir: "dist", rootDir: "." },
      [
        {
          category: "feed",
          id: "feed",
          label: "Feed",
          run: () => [
            createOutputDiagnostic({
              category: "feed",
              code: "feed.draft-leak",
              message: "feed.xml contains a draft.",
              moduleId: "feed",
              severity: "error",
            }),
          ],
        },
      ],
    );

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "feed.draft-leak",
    ]);
  });
});
