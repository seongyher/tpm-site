import { describe, expect, test } from "bun:test";

import {
  defineExtensionManifest,
  extensionCapabilityKeys,
  extensionCatalogEntries,
  extensionCatalogReferenceRows,
  extensionDiagnosticsToOutputDiagnostics,
  extensionDocumentationDiagnostics,
  extensionLifecycleStates,
  type ExtensionManifest,
  extensionOutputDeclarationDiagnostics,
  resolveExtensionManifests,
  validateExtensionManifest,
} from "../../../src/lib/extensions";
import {
  fixtureCalloutExtension,
  fixtureDependentExtension,
  fixtureMarkdownExtension,
  fixtureMigratingImporterExtension,
  fixturePdfConflictExtension,
  fixturePdfExtension,
  fixtureReviewMetadataExtension,
  fixtureThirdPartyEmbedExtension,
} from "../../fixtures/extensions";

describe("extension manifest contracts", () => {
  test("accepts an official generated-artifact extension manifest", () => {
    const manifest = defineExtensionManifest({
      capabilities: [
        {
          family: "artifact.pdf",
          id: "article-pdf",
          summary: "Generate article PDFs.",
        },
        {
          family: "verifier.module",
          id: "pdf-output",
          summary: "Verify generated PDF output.",
        },
      ],
      disabledBehavior: {
        mode: "remove-artifacts",
        summary: "Remove PDF links and generated PDF artifacts.",
      },
      docs: [
        {
          audience: "owner",
          path: "docs/authoring/ARTICLE_PDF_EXPORT.md",
        },
      ],
      generatedArtifacts: [
        {
          cachePolicy: "public-revalidate",
          kind: "pdf",
          owner: "extension",
          pathPattern: "/articles/:slug/:slug.pdf",
          verifierRef: "article-pdf-output",
        },
      ],
      id: "@official/pdf",
      kind: "optional-official",
      name: "Article PDF",
      permissions: ["generated.output.write"],
      summary: "Generate scholarly article PDFs.",
      tests: [
        {
          command: "just test-e2e-built -- article-pdf",
          kind: "build",
        },
      ],
      verifiers: [
        {
          moduleRef: "article-pdf-output",
          ownsArtifacts: ["output.articlePdfs"],
        },
      ],
      version: "0.1.0",
    } satisfies ExtensionManifest);

    expect(validateExtensionManifest(manifest)).toEqual([]);
    expect(extensionCapabilityKeys(manifest)).toEqual([
      "artifact.pdf:article-pdf",
      "verifier.module:pdf-output",
    ]);
  });

  test("reports duplicate capabilities and invalid self references", () => {
    const manifest = defineExtensionManifest({
      capabilities: [
        {
          family: "ui.component",
          id: "cta-button",
          summary: "Render a CTA button.",
        },
        {
          family: "ui.component",
          id: "cta-button",
          summary: "Duplicate CTA button.",
        },
      ],
      conflicts: [
        {
          id: "bad extension",
          reason: "A self-conflict should be rejected.",
        },
      ],
      dependencies: [
        {
          id: "bad extension",
          reason: "A self-dependency should be rejected.",
        },
      ],
      disabledBehavior: {
        mode: "disable-capabilities",
        summary: "Disable CTA rendering.",
      },
      id: "bad extension",
      kind: "site",
      name: "Bad Extension",
      summary: "Invalid manifest.",
      version: "0.1.0",
    } satisfies ExtensionManifest);

    expect(
      validateExtensionManifest(manifest).map((error) => error.code),
    ).toEqual([
      "extension.id-invalid",
      "extension.capability-duplicate",
      "extension.dependency-self",
      "extension.conflict-self",
    ]);

    const scoped = defineExtensionManifest({
      ...manifest,
      conflicts: [],
      dependencies: [],
      id: "@bad/scope/extra",
    } satisfies ExtensionManifest);

    expect(
      validateExtensionManifest(scoped).map((error) => error.code),
    ).toContain("extension.id-invalid");
  });

  test("requires capabilities and permissions for extension-owned surfaces", () => {
    const manifest = defineExtensionManifest({
      capabilities: [],
      components: [
        {
          componentRef: "components/Callout.astro",
          fallback: {
            feed: "static-text",
            pdf: "static-render",
            search: "static-text",
          },
          name: "Callout",
          surfaces: ["article"],
        },
      ],
      disabledBehavior: {
        mode: "keep-source-ignore-output",
        summary: "Leave source in place but skip rendered output.",
      },
      externalOrigins: [
        {
          origin: "https://example.com",
          purpose: "Fetch embed metadata.",
          userTriggered: false,
        },
      ],
      generatedArtifacts: [
        {
          cachePolicy: "immutable",
          kind: "search-index",
          owner: "extension",
          pathPattern: "/search-index.json",
        },
      ],
      id: "example.callout",
      kind: "third-party",
      name: "Callout",
      routes: [
        {
          pathPattern: "/callouts/",
          routeKey: "callouts",
          surfaces: ["sitemap"],
        },
      ],
      scripts: [
        {
          loadPolicy: "content-gated",
          path: "src/scripts/callout.ts",
        },
      ],
      summary: "Adds callout rendering.",
      version: "0.1.0",
    } satisfies ExtensionManifest);

    expect(
      validateExtensionManifest(manifest).map((error) => error.code),
    ).toEqual([
      "extension.capability-required",
      "extension.capability-required",
      "extension.capability-required",
      "extension.permission-required",
      "extension.permission-required",
      "extension.permission-required",
    ]);
  });

  test("resolves enabled fixture extensions and removes disabled artifacts", () => {
    const enabled = resolveExtensionManifests([
      fixturePdfExtension,
      fixtureCalloutExtension,
    ]);

    expect(enabled.diagnostics).toEqual([]);
    expect(enabled.enabled.map((manifest) => manifest.id)).toEqual([
      "fixture.pdf",
      "fixture.callout",
    ]);
    expect(
      enabled.generatedArtifacts.map((artifact) => artifact.pathPattern),
    ).toEqual(["/articles/:slug/:slug.pdf"]);

    const disabled = resolveExtensionManifests(
      [fixturePdfExtension, fixtureCalloutExtension],
      {
        disabled: ["fixture.pdf"],
      },
    );

    expect(disabled.enabled.map((manifest) => manifest.id)).toEqual([
      "fixture.callout",
    ]);
    expect(disabled.disabled).toMatchObject([
      {
        reason: "explicitly-disabled",
      },
    ]);
    expect(disabled.generatedArtifacts).toEqual([]);
  });

  test("diagnoses missing dependencies and missing feature flags", () => {
    const resolution = resolveExtensionManifests([
      fixtureDependentExtension,
      fixtureReviewMetadataExtension,
    ]);

    expect(resolution.enabled).toEqual([]);
    expect(
      resolution.disabled.map((entry) => [entry.manifest.id, entry.reason]),
    ).toEqual([
      ["fixture.review-metadata", "missing-feature"],
      ["fixture.pdf-download-block", "missing-dependency"],
    ]);
    expect(resolution.diagnostics.map((error) => error.code)).toEqual([
      "extension.feature-missing",
      "extension.dependency-missing",
    ]);

    const enabled = resolveExtensionManifests(
      [fixturePdfExtension, fixtureDependentExtension],
      {
        featureFlags: { "advanced-metadata": true },
      },
    );

    expect(enabled.enabled.map((manifest) => manifest.id)).toEqual([
      "fixture.pdf",
      "fixture.pdf-download-block",
    ]);
  });

  test("diagnoses conflicting generated output paths", () => {
    const resolution = resolveExtensionManifests([
      fixturePdfExtension,
      fixturePdfConflictExtension,
    ]);

    expect(resolution.diagnostics).toContainEqual({
      code: "extension.generated-artifact-conflict",
      message:
        'Extensions "fixture.pdf" and "fixture.pdf-conflict" both declare generated artifact "/articles/:slug/:slug.pdf".',
      path: "generatedArtifacts",
      severity: "error",
    });
  });

  test("diagnoses undeclared extension outputs and routes", () => {
    expect(
      extensionOutputDeclarationDiagnostics(
        [fixturePdfExtension],
        [
          {
            extensionId: "fixture.pdf",
            kind: "generated-artifact",
            pathPattern: "/articles/:slug/missing.pdf",
          },
          {
            extensionId: "fixture.missing-route",
            kind: "route",
            pathPattern: "/missing/",
          },
        ],
      ).map((diagnostic) => diagnostic.code),
    ).toEqual([
      "extension.generated-output-undeclared",
      "extension.route-undeclared",
    ]);
  });

  test("reports missing docs hooks and converts diagnostics for output reports", () => {
    const diagnostics = extensionDocumentationDiagnostics([
      fixturePdfConflictExtension,
    ]);

    expect(diagnostics).toEqual([
      {
        code: "extension.docs-missing",
        message:
          'Extension "fixture.pdf-conflict" should declare docs for authors, owners, developers, or extension authors.',
        path: "docs",
        severity: "error",
      },
    ]);
    expect(
      extensionDiagnosticsToOutputDiagnostics(
        "fixture.pdf-conflict",
        diagnostics,
      ),
    ).toMatchObject([
      {
        category: "build",
        code: "build.extension-manifest",
        evidence: ["extension=fixture.pdf-conflict", "path=docs"],
        moduleId: "extension-manifest",
      },
    ]);
  });

  test("builds catalog rows across bundled, official, site, and third-party classes", () => {
    const entries = extensionCatalogEntries([
      fixtureMarkdownExtension,
      fixturePdfExtension,
      fixtureCalloutExtension,
      fixtureThirdPartyEmbedExtension,
    ]);
    const rows = extensionCatalogReferenceRows(entries);

    expect(rows.map((row) => row.id)).toEqual([
      "fixture.markdown-mdx",
      "fixture.pdf",
      "fixture.callout",
      "fixture.third-party-embed",
    ]);
    expect(
      rows.map((row) => [
        row.kind,
        row.lifecycle,
        row.bundled,
        row.defaultEnabled,
        row.safeDisable,
        row.trustBoundary,
      ]),
    ).toEqual([
      ["essential-bundled", "enabled", true, true, false, "bundled-essential"],
      ["optional-official", "enabled", true, false, true, "bundled-official"],
      ["site", "enabled", false, false, true, "site-owned"],
      ["third-party", "enabled", false, false, true, "third-party"],
    ]);
    expect(rows[1]).toMatchObject({
      disabledBehavior: "remove-artifacts",
      docs: ["docs/authoring/ARTICLE_PDF_EXPORT.md"],
      generatedArtifactPaths: ["/articles/:slug/:slug.pdf"],
      migrationCount: 0,
      summary: "Fixture generated-artifact extension.",
    });
  });

  test("reports disabled, incompatible, and migration lifecycle states", () => {
    const entries = extensionCatalogEntries(
      [
        fixturePdfExtension,
        fixtureDependentExtension,
        fixtureReviewMetadataExtension,
        fixtureMigratingImporterExtension,
      ],
      {
        disabled: ["fixture.pdf"],
      },
    );
    const rowsById = new Map(
      extensionCatalogReferenceRows(entries).map((row) => [row.id, row]),
    );

    expect(rowsById.get("fixture.pdf")?.lifecycle).toBe("disabled");
    expect(rowsById.get("fixture.pdf-download-block")?.lifecycle).toBe(
      "incompatible",
    );
    expect(rowsById.get("fixture.review-metadata")?.lifecycle).toBe(
      "incompatible",
    );
    expect(rowsById.get("fixture.legacy-importer")?.lifecycle).toBe(
      "needs-migration",
    );
    expect(
      entries
        .find((entry) => entry.manifest.id === "fixture.review-metadata")
        ?.diagnostics.map((diagnostic) => diagnostic.code),
    ).toEqual(["extension.docs-missing", "extension.feature-missing"]);
  });

  test("distinguishes installable, unavailable, removed, and deprecated catalog states", () => {
    const deprecated = defineExtensionManifest({
      ...fixtureThirdPartyEmbedExtension,
      deprecation: {
        message: "Use the official embed extension.",
        replacement: "fixture.callout",
        since: "0.2.0",
      },
      id: "fixture.deprecated-embed",
      name: "Fixture Deprecated Embed",
    } satisfies ExtensionManifest);
    const entries = extensionCatalogEntries(
      [
        fixturePdfExtension,
        fixtureMigratingImporterExtension,
        deprecated,
        fixtureCalloutExtension,
        {
          ...fixtureCalloutExtension,
          id: "fixture.installable-callout",
          name: "Fixture Installable Callout",
        },
      ],
      {
        installed: ["fixture.legacy-importer", "fixture.deprecated-embed"],
        removed: ["fixture.callout"],
        unavailable: ["fixture.pdf"],
      },
    );
    const rowsById = new Map(
      extensionCatalogReferenceRows(entries).map((row) => [row.id, row]),
    );

    expect(extensionLifecycleStates).toContain("deprecated");
    expect(rowsById.get("fixture.pdf")?.lifecycle).toBe("unavailable");
    expect(rowsById.get("fixture.legacy-importer")?.lifecycle).toBe(
      "needs-migration",
    );
    expect(rowsById.get("fixture.deprecated-embed")?.lifecycle).toBe(
      "deprecated",
    );
    expect(rowsById.get("fixture.callout")?.lifecycle).toBe("removed");
    expect(rowsById.get("fixture.installable-callout")?.lifecycle).toBe(
      "installable",
    );
  });
});
