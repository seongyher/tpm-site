import { describe, expect, test } from "bun:test";

import {
  type AuthorDiagnostic,
  authorDiagnosticFromOutputDiagnostic,
  createAuthorDiagnostic,
  createAuthorDiagnosticReport,
} from "../../../../src/lib/diagnostics/author-diagnostics";
import {
  createOutputDiagnostic,
  type OutputDiagnosticCategory,
  type OutputDiagnosticOwner,
} from "../../../../src/lib/diagnostics/output-verification";

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

  test("maps every generated-output category to author-facing category and docs", () => {
    const cases = [
      ["asset", "assets", ["docs/MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md"]],
      [
        "build",
        "generated-artifacts",
        ["docs/GENERATED_OUTPUT_VERIFIER_CONTRACT.md"],
      ],
      ["cache", "deployment", ["docs/CLOUDFLARE_WORKERS_MIGRATION.md"]],
      ["content", "content", ["docs/AUTHORING_WORKFLOW.md"]],
      [
        "feed",
        "feeds",
        ["docs/PUBLISHABLE_FEED_ARTICLE_CONTINUITY_AND_EMBEDS.md"],
      ],
      [
        "html",
        "generated-artifacts",
        ["docs/GENERATED_OUTPUT_VERIFIER_CONTRACT.md"],
      ],
      ["link", "routes", ["docs/SOURCE_CONTRACTS.md"]],
      [
        "metadata",
        "metadata",
        ["docs/METADATA_GRAPH_AND_SEMANTIC_PROFILES.md"],
      ],
      ["pdf", "pdfs", ["docs/ARTICLE_PDF_EXPORT.md"]],
      ["redirect", "redirects", ["docs/SITE_ANATOMY.md"]],
      ["route", "routes", ["docs/SOURCE_CONTRACTS.md"]],
      ["search", "search", ["docs/METADATA_GRAPH_AND_SEMANTIC_PROFILES.md"]],
      ["security", "deployment", ["docs/CLOUDFLARE_WORKERS_MIGRATION.md"]],
      ["sitemap", "metadata", ["docs/METADATA_GRAPH_AND_SEMANTIC_PROFILES.md"]],
    ] satisfies ReadonlyArray<
      readonly [
        OutputDiagnosticCategory,
        AuthorDiagnostic["category"],
        readonly string[],
      ]
    >;

    expect(
      cases.map(([category, expectedCategory, expectedDocs]) => {
        const diagnostic = authorDiagnosticFromOutputDiagnostic(
          createOutputDiagnostic({
            category,
            code: `${category}.example`,
            message: `${category} message.`,
            moduleId: "test",
            severity: "warning",
          }),
        );

        return {
          category: diagnostic.category,
          expectedCategory,
          expectedDocs,
          relatedDocs: diagnostic.relatedDocs,
        };
      }),
    ).toEqual(
      cases.map(([, expectedCategory, expectedDocs]) => ({
        category: expectedCategory,
        expectedCategory,
        expectedDocs,
        relatedDocs: expectedDocs,
      })),
    );
  });

  test("maps generated-output repair owners to author-facing fixability", () => {
    const cases = [
      ["content", "author", "source-edit"],
      ["external", "external", "external-action"],
      ["generated-output", "platform", "investigate"],
      ["platform", "developer", "code-change"],
      ["site-config", "site-owner", "source-edit"],
      [undefined, "platform", "investigate"],
    ] satisfies ReadonlyArray<
      readonly [
        OutputDiagnosticOwner | undefined,
        AuthorDiagnostic["repairOwner"],
        AuthorDiagnostic["fixability"],
      ]
    >;

    expect(
      cases.map(([owner, repairOwner, fixability]) => {
        const diagnostic = authorDiagnosticFromOutputDiagnostic(
          createOutputDiagnostic({
            category: "link",
            code: "link.example",
            message: "Broken link.",
            moduleId: "test",
            owner,
            severity: "error",
          }),
        );

        return {
          fixability: diagnostic.fixability,
          repairOwner: diagnostic.repairOwner,
          expected: {
            fixability,
            repairOwner,
          },
        };
      }),
    ).toEqual(
      cases.map(([, repairOwner, fixability]) => ({
        expected: {
          fixability,
          repairOwner,
        },
        fixability,
        repairOwner,
      })),
    );
  });

  test("uses specific author categories for generated image and media diagnostics", () => {
    expect(
      authorDiagnosticFromOutputDiagnostic(
        createOutputDiagnostic({
          category: "html",
          code: "html.media-output-invalid",
          message: "Embedded media output is invalid.",
          moduleId: "build.html",
          owner: "content",
          severity: "error",
        }),
      ),
    ).toMatchObject({
      category: "media",
      relatedDocs: ["docs/MEDIA_POLICY_AND_PROVIDER_ADAPTERS.md"],
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
