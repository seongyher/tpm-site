import { describe, expect, test } from "bun:test";

import {
  authorDiagnosticFromOutputDiagnostic,
  createAuthorDiagnostic,
  createAuthorDiagnosticReport,
} from "../../../src/lib/author-diagnostics";
import { createOutputDiagnostic } from "../../../src/lib/output-verification";

describe("author diagnostics", () => {
  test("creates diagnostics and rejects mismatched code namespaces", () => {
    expect(
      createAuthorDiagnostic({
        category: "config",
        code: "config.route-missing",
        fixability: "source-edit",
        repairOwner: "site-owner",
        severity: "error",
        source: "site-doctor",
        summary: "A configured route is missing.",
      }),
    ).toMatchObject({
      category: "config",
      code: "config.route-missing",
      repairOwner: "site-owner",
    });

    expect(() =>
      createAuthorDiagnostic({
        category: "config",
        code: "routes.route-missing",
        fixability: "source-edit",
        repairOwner: "site-owner",
        severity: "error",
        source: "site-doctor",
        summary: "Wrong namespace.",
      }),
    ).toThrow('must start with "config."');
  });

  test("maps generated-output diagnostics into author-facing repair ownership", () => {
    const diagnostic = authorDiagnosticFromOutputDiagnostic(
      createOutputDiagnostic({
        category: "html",
        code: "html.image-alt-missing",
        location: { outputPath: "articles/post/index.html" },
        message: "Article image is missing alt text.",
        moduleId: "build.html",
        owner: "content",
        remediation: "Add meaningful alt text.",
        severity: "error",
      }),
    );

    expect(diagnostic).toMatchObject({
      category: "accessibility",
      code: "accessibility.html.image-alt-missing",
      fixability: "source-edit",
      location: { outputPath: "articles/post/index.html" },
      relatedDocs: ["docs/AUTHOR_DIAGNOSTICS.md"],
      repairOwner: "author",
      source: "generated-output",
      sourceCode: "html.image-alt-missing",
    });
  });

  test("summarizes author diagnostics for future CLI, GUI, and MCP consumers", () => {
    const report = createAuthorDiagnosticReport([
      createAuthorDiagnostic({
        category: "metadata",
        code: "metadata.html-invalid",
        fixability: "investigate",
        repairOwner: "platform",
        severity: "error",
        source: "generated-output",
        summary: "Metadata output is invalid.",
      }),
      createAuthorDiagnostic({
        category: "config",
        code: "config.disabled-feature-linked",
        fixability: "source-edit",
        repairOwner: "site-owner",
        severity: "warning",
        source: "site-doctor",
        summary: "A disabled feature is linked.",
      }),
    ]);

    expect(report.summary).toEqual({
      byCategory: {
        config: 1,
        metadata: 1,
      },
      byRepairOwner: {
        platform: 1,
        "site-owner": 1,
      },
      errors: 1,
      info: 0,
      total: 2,
      warnings: 1,
    });
  });
});
