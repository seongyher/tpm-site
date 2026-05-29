import { describe, expect, test } from "bun:test";

import { createObservabilityFinding } from "../../../src/lib/observability";
import {
  authorDiagnosticsFromObservabilityReport,
  createObservabilityReleaseHealthReport,
  formatObservabilityReleaseHealthMarkdownReport,
} from "../../../src/lib/observability-diagnostics";
import { createRouteLinkedObservabilityReport } from "../../../src/lib/observability-reports";
import { routeRegistryEntries } from "../../../src/lib/route-registry";
import { parseSiteConfig } from "../../../src/lib/site-config";

const config = parseSiteConfig({
  identity: {
    description: "A configurable publication.",
    language: "en",
    title: "Example Blog",
    url: "https://example.com",
  },
  navigation: {
    footer: [],
    primary: [],
  },
  routes: {
    allArticles: "/articles/all/",
    announcements: "/announcements/",
    articles: "/articles/",
    authors: "/authors/",
    bibliography: "/bibliography/",
    categories: "/categories/",
    collections: "/collections/",
    feed: "/feed.xml",
    home: "/",
    search: "/search/",
    tags: "/tags/",
  },
  support: {
    block: {
      body: "Keep publishing going.",
      title: "Support Example Blog",
    },
    discord: {
      href: "https://discord.gg/example",
      label: "Join Discord",
    },
    patreon: {
      href: "https://patreon.com/example",
      label: "Support Us",
    },
  },
});

const routeRegistry = routeRegistryEntries(config);

describe("observability diagnostics", () => {
  test("emits author diagnostics only for actionable source-repairable findings", () => {
    const report = createRouteLinkedObservabilityReport(
      [
        createObservabilityFinding({
          category: "links",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "author",
          providerCode: "broken-link",
          remediation: "Update the source link.",
          route: "/articles/example/",
          severity: "error",
          source: "link-scanner",
          summary: "Broken internal link.",
        }),
        createObservabilityFinding({
          category: "routes",
          confidence: "high",
          fixability: "investigate",
          noise: "bot-noise",
          owner: "external",
          route: "/.env",
          severity: "warning",
          source: "cloudflare",
          summary: "Bot probe.",
        }),
        createObservabilityFinding({
          category: "redirects",
          confidence: "medium",
          fixability: "source-edit",
          noise: "unclear",
          owner: "site-owner",
          route: "/2015/11/25/bane/",
          severity: "warning",
          source: "bing",
          summary: "Needs human triage.",
        }),
      ],
      { routeRegistry },
    );

    const diagnostics = authorDiagnosticsFromObservabilityReport(report);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      category: "routes",
      code: "routes.observability.link-scanner.broken-link.actionable",
      fixability: "source-edit",
      location: {
        outputPath: "articles",
        route: "/articles/example/",
        sourcePath: undefined,
        url: undefined,
      },
      relatedDocs: ["docs/metadata/OBSERVABILITY_AND_WEBMASTER_REPORTS.md"],
      repairOwner: "author",
      severity: "error",
      source: "observability-import",
      sourceCode: "broken-link",
      summary: "Broken internal link.",
    });
  });

  test("maps every source-repairable observability category into author taxonomy", () => {
    const cases = [
      ["accessibility", "accessibility"],
      ["assets", "assets"],
      ["cache", "deployment"],
      ["crawlability", "metadata"],
      ["deployment", "deployment"],
      ["links", "routes"],
      ["metadata", "metadata"],
      ["performance", "performance"],
      ["redirects", "redirects"],
      ["routes", "routes"],
      ["search", "search"],
      ["security", "deployment"],
      ["unknown", "generated-artifacts"],
      ["uptime", "deployment"],
    ] as const;
    const report = createRouteLinkedObservabilityReport(
      cases.map(([category]) =>
        createObservabilityFinding({
          category,
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "site-owner",
          route: "/articles/example/",
          severity: "warning",
          source: "manual",
          summary: `${category} warning.`,
        }),
      ),
      { routeRegistry },
    );

    expect(
      authorDiagnosticsFromObservabilityReport(report).map((diagnostic) => ({
        category: diagnostic.category,
        repairOwner: diagnostic.repairOwner,
        sourceCode: diagnostic.sourceCode,
        summary: diagnostic.summary,
      })),
    ).toEqual(
      cases.map(([category, expectedCategory]) => ({
        category: expectedCategory,
        repairOwner: "site-owner",
        sourceCode: undefined,
        summary: `${category} warning.`,
      })),
    );
  });

  test("builds release-health deltas and route-class summaries", () => {
    const baseline = createRouteLinkedObservabilityReport(
      [
        createObservabilityFinding({
          category: "routes",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "site-owner",
          route: "/favicon.ico",
          severity: "warning",
          source: "cloudflare",
          summary: "Missing favicon.",
          trend: { current: 8 },
        }),
        createObservabilityFinding({
          category: "links",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "author",
          route: "/articles/old/",
          severity: "error",
          source: "link-scanner",
          summary: "Old broken link.",
        }),
      ],
      { routeRegistry },
    );
    const candidate = createRouteLinkedObservabilityReport(
      [
        createObservabilityFinding({
          category: "routes",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "site-owner",
          route: "/favicon.ico",
          severity: "warning",
          source: "cloudflare",
          summary: "Missing favicon.",
          trend: { current: 2 },
        }),
        createObservabilityFinding({
          category: "metadata",
          confidence: "medium",
          fixability: "source-edit",
          noise: "actionable",
          owner: "site-owner",
          route: "/articles/new/",
          severity: "warning",
          source: "search-console",
          summary: "New metadata warning.",
          trend: { current: 1 },
        }),
      ],
      { routeRegistry },
    );

    const releaseHealth = createObservabilityReleaseHealthReport({
      baseline,
      candidate,
      title: "Example Release Health",
    });

    expect(releaseHealth.added).toHaveLength(1);
    expect(releaseHealth.changed).toHaveLength(1);
    expect(releaseHealth.resolved).toHaveLength(1);
    expect(releaseHealth.routeClasses).toEqual([
      {
        added: 1,
        changed: 0,
        persistent: 0,
        resolved: 1,
        routeClass: "articles",
      },
      {
        added: 0,
        changed: 1,
        persistent: 0,
        resolved: 0,
        routeClass: "unknown-internal-route",
      },
    ]);
  });

  test("sorts release-health deltas by route class, severity, and finding label", () => {
    const candidate = createRouteLinkedObservabilityReport(
      [
        createObservabilityFinding({
          category: "links",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "author",
          route: "/tags/example/",
          severity: "warning",
          source: "link-scanner",
          summary: "Tag warning.",
        }),
        createObservabilityFinding({
          category: "links",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "author",
          route: "/articles/b/",
          severity: "warning",
          source: "link-scanner",
          summary: "B warning.",
        }),
        createObservabilityFinding({
          category: "links",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "author",
          route: "/articles/a/",
          severity: "error",
          source: "link-scanner",
          summary: "A error.",
        }),
      ],
      { routeRegistry },
    );

    const releaseHealth = createObservabilityReleaseHealthReport({
      baseline: createRouteLinkedObservabilityReport([], { routeRegistry }),
      candidate,
    });

    expect(
      releaseHealth.added.map((delta) => delta.finding.finding.summary),
    ).toEqual(["A error.", "B warning.", "Tag warning."]);
  });

  test("formats deterministic release-health Markdown", () => {
    const baseline = createRouteLinkedObservabilityReport(
      [
        createObservabilityFinding({
          category: "routes",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "site-owner",
          route: "/favicon.ico",
          severity: "warning",
          source: "cloudflare",
          summary: "Missing favicon.",
          trend: { current: 8 },
        }),
      ],
      { routeRegistry },
    );
    const candidate = createRouteLinkedObservabilityReport(
      [
        createObservabilityFinding({
          category: "routes",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "site-owner",
          route: "/favicon.ico",
          severity: "warning",
          source: "cloudflare",
          summary: "Missing favicon.",
          trend: { current: 2 },
        }),
        createObservabilityFinding({
          category: "metadata",
          confidence: "medium",
          fixability: "source-edit",
          noise: "actionable",
          owner: "site-owner",
          route: "/articles/new/",
          severity: "warning",
          source: "search-console",
          summary: "New metadata warning.",
          trend: { current: 1 },
        }),
      ],
      { routeRegistry },
    );

    expect(
      formatObservabilityReleaseHealthMarkdownReport(
        createObservabilityReleaseHealthReport({
          baseline,
          candidate,
          title: "Example Release Health",
        }),
      ),
    ).toBe(
      [
        "# Example Release Health",
        "",
        "## Summary",
        "",
        "- Added findings: 1",
        "- Resolved findings: 0",
        "- Changed findings: 1",
        "- Persistent findings: 0",
        "",
        "## Route Class Changes",
        "",
        "| Route class | Added | Resolved | Changed | Persistent |",
        "| --- | --- | --- | --- | --- |",
        "| articles | 1 | 0 | 0 | 0 |",
        "| unknown-internal-route | 0 | 0 | 1 | 0 |",
        "",
        "## Added Findings",
        "",
        "| Route class | Severity | Source | Finding | Before | After |",
        "| --- | --- | --- | --- | --- | --- |",
        "| articles | warning | search-console | New metadata warning. | - | 1 |",
        "",
        "## Resolved Findings",
        "",
        "No findings.",
        "",
        "## Changed Counts",
        "",
        "| Route class | Severity | Source | Finding | Before | After |",
        "| --- | --- | --- | --- | --- | --- |",
        "| unknown-internal-route | warning | cloudflare | Missing favicon. | 8 | 2 |",
        "",
      ].join("\n"),
    );
  });

  test("formats empty and persistent release-health reports without fake deltas", () => {
    const baseline = createRouteLinkedObservabilityReport(
      [
        createObservabilityFinding({
          category: "links",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "author",
          route: "/articles/stable/",
          severity: "warning",
          source: "link-scanner",
          summary: "Stable | warning.",
        }),
      ],
      { routeRegistry },
    );
    const candidate = createRouteLinkedObservabilityReport(
      [
        createObservabilityFinding({
          category: "links",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "author",
          route: "/articles/stable/",
          severity: "warning",
          source: "link-scanner",
          summary: "Stable | warning.",
        }),
      ],
      { routeRegistry },
    );

    const persistent = createObservabilityReleaseHealthReport({
      baseline,
      candidate,
    });
    expect(persistent.added).toEqual([]);
    expect(persistent.changed).toEqual([]);
    expect(persistent.resolved).toEqual([]);
    expect(persistent.persistent).toHaveLength(1);
    expect(persistent.routeClasses).toEqual([
      {
        added: 0,
        changed: 0,
        persistent: 1,
        resolved: 0,
        routeClass: "articles",
      },
    ]);
    expect(
      formatObservabilityReleaseHealthMarkdownReport(
        createObservabilityReleaseHealthReport({
          baseline: createRouteLinkedObservabilityReport([], { routeRegistry }),
          candidate: createRouteLinkedObservabilityReport([], {
            routeRegistry,
          }),
        }),
      ),
    ).toContain("No route-class changes.");
  });
});
