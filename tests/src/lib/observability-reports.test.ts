import { describe, expect, test } from "bun:test";

import { createObservabilityFinding } from "../../../src/lib/observability";
import {
  createRouteLinkedObservabilityReport,
  formatRouteLinkedObservabilityMarkdownReport,
  routeLinkObservabilityFindings,
} from "../../../src/lib/observability-reports";
import { createPlatformContext } from "../../../src/lib/platform-context";
import { routeRegistryEntries } from "../../../src/lib/route-registry";
import { parseSiteConfig } from "../../../src/lib/site-config";
import type { SiteInstancePaths } from "../../../src/lib/site-instance";

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
    announcements: "/updates/",
    articles: "/writing/",
    authors: "/authors/",
    bibliography: "/sources/",
    categories: "/topics/",
    collections: "/collections/",
    feed: "/rss.xml",
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

describe("observability reports", () => {
  test("links findings to the most specific registered route", () => {
    const linked = routeLinkObservabilityFindings(
      [
        createObservabilityFinding({
          category: "links",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "author",
          route: "/writing/example-post/",
          severity: "error",
          source: "link-scanner",
          summary: "Broken internal link.",
        }),
        createObservabilityFinding({
          category: "cache",
          confidence: "high",
          fixability: "code-change",
          noise: "actionable",
          owner: "developer",
          route: "/rss.xml",
          severity: "warning",
          source: "lighthouse",
          summary: "Feed cache header needs review.",
        }),
      ],
      { routeRegistry },
    );

    expect(linked).toHaveLength(2);
    expect(linked[0]).toMatchObject({
      disposition: "actionable",
      routeMatch: {
        artifactKey: "output.routes",
        entity: "article",
        kind: "registered-route",
        route: "/writing/",
        routeKey: "articles",
      },
    });
    expect(linked[1]).toMatchObject({
      routeMatch: {
        artifactKey: "output.feed",
        entity: "feed",
        kind: "registered-route",
        outputPath: "rss.xml",
        routeKey: "feed",
      },
    });
  });

  test("classifies unknown internal routes, external URLs, and scanner noise", () => {
    const report = createRouteLinkedObservabilityReport(
      [
        createObservabilityFinding({
          category: "redirects",
          confidence: "medium",
          fixability: "source-edit",
          noise: "unclear",
          owner: "site-owner",
          route: "/2015/11/25/bane/",
          severity: "warning",
          source: "bing",
          summary: "Broken legacy redirect.",
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
          category: "security",
          confidence: "low",
          fixability: "investigate",
          noise: "provider-noise",
          owner: "external",
          severity: "info",
          source: "manual",
          summary: "External provider warning.",
          url: "https://scanner.example/report?id=secret",
        }),
        createObservabilityFinding({
          category: "unknown",
          confidence: "low",
          fixability: "investigate",
          noise: "unclear",
          owner: "external",
          severity: "info",
          source: "manual",
          summary: "Unmapped global warning.",
        }),
      ],
      { routeRegistry },
    );

    expect(report.summary).toMatchObject({
      byDisposition: {
        "needs-triage": 2,
        noise: 2,
      },
      byRouteMatch: {
        external: 1,
        unmapped: 1,
        "unknown-internal-route": 2,
      },
      total: 4,
    });
    expect(report.findings.map((finding) => finding.disposition)).toEqual([
      "needs-triage",
      "needs-triage",
      "noise",
      "noise",
    ]);
    expect(report.findings[3]?.finding.url).toBe(
      "https://scanner.example/report/",
    );
  });

  test("sorts same-route findings by source and summary before formatting", () => {
    const report = createRouteLinkedObservabilityReport(
      [
        createObservabilityFinding({
          category: "links",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "author",
          remediation: "Fix line one.\nThen retry.",
          route: "/writing/example-post/",
          severity: "warning",
          source: "search-console",
          summary: "Z warning.",
        }),
        createObservabilityFinding({
          category: "links",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "author",
          providerCode: "broken|pipe",
          remediation: "Update the URL.",
          route: "/writing/example-post/",
          severity: "warning",
          source: "bing",
          summary: "A | warning.",
        }),
      ],
      { routeRegistry },
    );

    expect(report.findings.map((finding) => finding.finding.source)).toEqual([
      "bing",
      "search-console",
    ]);
    expect(formatRouteLinkedObservabilityMarkdownReport(report)).toContain(
      "| warning | links | /writing/example-post/ (articles) | author | bing:broken\\|pipe | A \\| warning. | Update the URL. |",
    );
    expect(formatRouteLinkedObservabilityMarkdownReport(report)).toContain(
      "Fix line one. Then retry.",
    );
  });

  test("attaches safe source-artifact facts when a manifest is available", () => {
    const sourceArtifacts = createPlatformContext({
      config,
      cwd: "/repo",
      paths: siteInstancePaths("/repo/site"),
    }).sourceArtifacts;
    const [linked] = routeLinkObservabilityFindings(
      [
        createObservabilityFinding({
          category: "metadata",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "site-owner",
          route: "/writing/example-post/",
          severity: "warning",
          source: "search-console",
          summary: "Metadata issue.",
        }),
      ],
      { routeRegistry, sourceArtifacts },
    );

    expect(linked?.routeMatch.sourceArtifact).toMatchObject({
      key: "output.routes",
      owner: "platform",
      relativePath: "dist",
      role: "generated-route",
    });
  });

  test("formats deterministic Markdown sections for generated reports", () => {
    const report = createRouteLinkedObservabilityReport(
      [
        createObservabilityFinding({
          category: "links",
          confidence: "high",
          fixability: "source-edit",
          noise: "actionable",
          owner: "author",
          remediation: "Fix the source link.",
          route: "/writing/example-post/",
          severity: "error",
          source: "link-scanner",
          summary: "Broken internal link.",
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
          summary: "Broken legacy redirect.",
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
      ],
      {
        routeRegistry,
        title: "Example Webmaster Report",
      },
    );

    expect(formatRouteLinkedObservabilityMarkdownReport(report)).toBe(
      [
        "# Example Webmaster Report",
        "",
        "## Summary",
        "",
        "- Total findings: 3",
        "- Actionable findings: 1",
        "- Needs triage: 1",
        "- Noise or accepted findings: 1",
        "",
        "## Actionable Findings",
        "",
        "| Severity | Category | Route | Owner | Source | Finding | Remediation |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        "| error | links | /writing/example-post/ (articles) | author | link-scanner | Broken internal link. | Fix the source link. |",
        "",
        "## Needs Triage",
        "",
        "| Severity | Category | Route | Owner | Source | Finding | Remediation |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        "| warning | redirects | /2015/11/25/bane/ | site-owner | bing | Broken legacy redirect. |  |",
        "",
        "## Noise And Accepted Findings",
        "",
        "| Severity | Category | Route | Owner | Source | Finding | Remediation |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        "| warning | routes | /.env | external | cloudflare | Bot probe. |  |",
        "",
      ].join("\n"),
    );
  });
});

function siteInstancePaths(root: string): SiteInstancePaths {
  return {
    assets: {
      articles: `${root}/assets/articles`,
      root: `${root}/assets`,
      shared: `${root}/assets/shared`,
      site: `${root}/assets/site`,
    },
    config: {
      redirects: `${root}/config/redirects.json`,
      site: `${root}/config/site.json`,
    },
    content: {
      announcements: `${root}/content/announcements`,
      articles: `${root}/content/articles`,
      authors: `${root}/content/authors`,
      categories: `${root}/content/categories`,
      collections: `${root}/content/collections`,
      pages: `${root}/content/pages`,
    },
    output: {
      dist: "/repo/dist",
    },
    public: `${root}/public`,
    root,
    theme: `${root}/theme.css`,
    unusedAssets: `${root}/unused-assets`,
  };
}
