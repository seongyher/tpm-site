import { describe, expect, test } from "bun:test";

import { formatCloudflareRedirects } from "../../../src/lib/cloudflare-redirects";
import {
  createCloudflareWorkersStaticAssetsDeploymentPlan,
  createStaticFolderDeploymentPlan,
  type DeploymentReleaseArtifact,
  type DeploymentTargetConfig,
} from "../../../src/lib/deployment-adapters";
import {
  createOutputDiagnostic,
  createOutputVerificationReport,
} from "../../../src/lib/output-verification";
import {
  createReleaseGovernanceReport,
  formatReleaseGovernanceMarkdownReport,
  type ReleaseGovernanceChange,
  releaseGovernanceDiagnostics,
} from "../../../src/lib/release-governance";

const releaseArtifact = {
  generatedOutputRoot: "dist",
  id: "release-2026-05-22",
  redirectCount: 1,
  schemaVersion: "0.1.0",
  site: {
    canonicalUrl: "https://example.com/",
    domains: ["https://example.com/"],
    name: "Example Site",
  },
} satisfies DeploymentReleaseArtifact;

const cloudflareTarget = {
  canonicalUrl: "https://example.com/",
  domains: ["https://example.com/"],
  kind: "cloudflare-workers-static-assets",
  name: "example-worker",
  outputRoot: "dist",
} satisfies DeploymentTargetConfig;

const staticTarget = {
  canonicalUrl: "https://example.com/",
  domains: [],
  kind: "static-folder",
  name: "local-export",
  outputRoot: "dist",
} satisfies DeploymentTargetConfig;

const breakingRouteChange = {
  area: "routes",
  impact: "breaking",
  source: "src/lib/routes.ts",
  summary: "Change canonical article route shape.",
} satisfies ReleaseGovernanceChange;

describe("release governance", () => {
  test("requires migration, compatibility, and rollback notes for breaking changes", () => {
    expect(
      releaseGovernanceDiagnostics({
        changes: [breakingRouteChange],
        deploymentResults: [],
      }).map((diagnostic) => diagnostic.code),
    ).toEqual([
      "release.breaking-compatibility-note-missing",
      "release.breaking-migration-note-missing",
      "release.breaking-rollback-note-missing",
    ]);
  });

  test("creates a deterministic release report from changes and deployment adapters", () => {
    const report = createReleaseGovernanceReport({
      changes: [
        {
          ...breakingRouteChange,
          compatibilityNote:
            "Old article URLs keep generated redirect fallbacks for one release train.",
          migrationNote:
            "Run the route manifest migration before publishing the release.",
          rollbackNote:
            "Redeploy the previous release artifact if route verification fails.",
        },
        {
          area: "metadata",
          deprecationNote:
            "The legacy metadata field remains readable for one release.",
          impact: "deprecation",
          source: "site/content/articles/example.md",
          summary: "Deprecate a legacy metadata field.",
        },
      ],
      deploymentResults: [
        createCloudflareWorkersStaticAssetsDeploymentPlan({
          action: "publish",
          headersText:
            "/_astro/*\n  Cache-Control: public, max-age=31556952, immutable\n",
          mode: "dry-run",
          redirectsText: formatCloudflareRedirects([
            { destination: "/articles/example/", source: "/2020/example/" },
          ]),
          releaseArtifact,
          target: cloudflareTarget,
          wranglerConfig: {
            assetsDirectory: "./dist",
            compatibilityDate: "2026-05-08",
            name: "example-worker",
            notFoundHandling: "404-page",
          },
        }),
        createStaticFolderDeploymentPlan({
          action: "publish",
          mode: "dry-run",
          releaseArtifact,
          target: staticTarget,
        }),
      ],
      outputVerification: createOutputVerificationReport([]),
      releaseId: "release-2026-05-22",
      version: "0.5.0",
    });
    const markdown = formatReleaseGovernanceMarkdownReport(report);

    expect(report.summary).toMatchObject({
      blockingDiagnostics: 0,
      breakingChanges: 1,
      changeCount: 2,
      deploymentStatuses: {
        "example-worker": "ok",
        "local-export": "ok-with-warnings",
      },
      outputErrors: 0,
      outputWarnings: 0,
    });
    expect(markdown).toContain("# Release Governance Report");
    expect(markdown).toContain(
      "| Target | Provider | Status | Diagnostics | Manual Steps |",
    );
    expect(markdown).toContain(
      "| local-export | static-folder | ok-with-warnings | 4 | 2 |",
    );
    expect(markdown).toContain(
      "- [ ] (required, site-owner) Upload dist to the chosen static host.",
    );
    expect(markdown).toContain("No release-governance diagnostics.");
  });

  test("blocks release governance when deployment adapters are blocked", () => {
    const report = createReleaseGovernanceReport({
      changes: [],
      deploymentResults: [
        createCloudflareWorkersStaticAssetsDeploymentPlan({
          action: "publish",
          headersText:
            "/_astro/*\n  Cache-Control: public, max-age=31556952, immutable\n",
          mode: "execute",
          redirectsText: formatCloudflareRedirects([]),
          releaseArtifact: { ...releaseArtifact, redirectCount: 0 },
          target: cloudflareTarget,
          wranglerConfig: {
            assetsDirectory: "./dist",
            compatibilityDate: "2026-05-08",
            name: "example-worker",
            notFoundHandling: "404-page",
          },
        }),
      ],
      releaseId: "release-blocked",
      version: "0.5.0",
    });

    expect(report.summary.blockingDiagnostics).toBe(1);
    expect(report.diagnostics).toContainEqual({
      code: "release.deployment-blocked",
      message:
        "example-worker: cloudflare-workers-static-assets deployment is blocked.",
      severity: "error",
      source: "example-worker",
    });
  });

  test("formats empty releases and output verifier summaries explicitly", () => {
    const report = createReleaseGovernanceReport({
      changes: [],
      deploymentResults: [],
      outputVerification: createOutputVerificationReport([
        createOutputDiagnostic({
          category: "html",
          code: "html.invalid",
          message: "Broken | table\ncell.",
          moduleId: "html-validate",
          severity: "error",
        }),
        createOutputDiagnostic({
          category: "metadata",
          code: "metadata.preview-warning",
          message: "Preview warning.",
          moduleId: "metadata",
          severity: "warning",
        }),
      ]),
      releaseId: "release-empty",
      title: "Custom Release Gate",
      version: "0.6.0",
    });
    const markdown = formatReleaseGovernanceMarkdownReport(report);

    expect(report.summary).toMatchObject({
      blockingDiagnostics: 0,
      breakingChanges: 0,
      changeCount: 0,
      deploymentStatuses: {},
      outputErrors: 1,
      outputWarnings: 1,
    });
    expect(markdown).toContain("# Custom Release Gate");
    expect(markdown).toContain("No deployment adapter results supplied.");
    expect(markdown).toContain("No release changes recorded.");
    expect(markdown).toContain("- [ ] (required, developer)");
  });

  test("warns for deprecations without notes and sorts diagnostics deterministically", () => {
    const diagnostics = releaseGovernanceDiagnostics({
      changes: [
        {
          area: "metadata",
          impact: "deprecation",
          source: "site/content/articles/deprecated.md",
          summary: "Deprecate a legacy metadata field.",
        },
        breakingRouteChange,
      ],
      deploymentResults: [],
    });

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "release.breaking-compatibility-note-missing",
      "release.breaking-migration-note-missing",
      "release.breaking-rollback-note-missing",
      "release.deprecation-note-missing",
    ]);
    expect(diagnostics.at(-1)).toMatchObject({
      severity: "warning",
      source: "site/content/articles/deprecated.md",
    });
  });

  test("sorts release report rows and escapes Markdown table cells deterministically", () => {
    const report = createReleaseGovernanceReport({
      changes: [
        {
          area: "metadata",
          impact: "minor",
          source: "site/content/articles/b.md",
          summary: "Updates a value with | and\na newline.",
        },
        {
          area: "metadata",
          impact: "minor",
          source: "site/content/articles/a.md",
          summary: "Updates another value.",
        },
        {
          area: "routes",
          compatibilityNote: "Redirects stay in place.",
          impact: "breaking",
          migrationNote: "Regenerate route manifests.",
          rollbackNote: "Restore the previous manifest.",
          source: "src/lib/routes.ts",
          summary: "Changes routes.",
        },
      ],
      deploymentResults: [
        createStaticFolderDeploymentPlan({
          action: "publish",
          mode: "dry-run",
          releaseArtifact,
          target: staticTarget,
        }),
      ],
      releaseId: "release-sorted",
      version: "0.7.0",
    });
    const markdown = formatReleaseGovernanceMarkdownReport(report);

    expect(markdown.indexOf("site/content/articles/a.md")).toBeLessThan(
      markdown.indexOf("site/content/articles/b.md"),
    );
    expect(markdown).toContain("Updates a value with \\| and a newline.");
    expect(markdown).toContain(
      "| local-export | static-folder | ok-with-warnings | 4 | 2 |",
    );
  });

  test("formats sorted release diagnostics with escaped table cells", () => {
    const report = createReleaseGovernanceReport({
      changes: [
        {
          area: "metadata",
          deprecationNote: "Legacy readers keep compatibility.",
          impact: "deprecation",
          source: "site/content/articles/deprecated.md",
          summary: "Deprecate a metadata value.",
        },
        {
          area: "routes",
          impact: "breaking",
          source: "src/lib/routes.ts",
          summary: "Route message with | and\nnewline.",
        },
      ],
      deploymentResults: [],
      releaseId: "release-diagnostics",
      version: "0.8.0",
    });
    const markdown = formatReleaseGovernanceMarkdownReport(report);

    expect(markdown).toContain("| Severity | Code | Source | Message |");
    expect(
      markdown.indexOf("release.breaking-compatibility-note-missing"),
    ).toBeLessThan(markdown.indexOf("release.breaking-migration-note-missing"));
    expect(markdown).toContain("Route message with \\| and newline.");
  });
});
