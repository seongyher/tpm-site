import { describe, expect, test } from "bun:test";

import {
  createObservabilityFinding,
  createObservabilityReport,
  observabilityFindingsFromLighthouseReport,
  observabilityFindingsFromLinkScannerRows,
  observabilityFindingsFromStatusRows,
  observabilityFindingsFromWebmasterRows,
  redactObservabilityUrl,
} from "../../../src/lib/observability";

describe("observability", () => {
  test("creates normalized reports with deterministic summary counts", () => {
    const findings = [
      createObservabilityFinding({
        category: "routes",
        confidence: "high",
        fixability: "source-edit",
        noise: "actionable",
        owner: "site-owner",
        route: "articles/example",
        severity: "error",
        source: "manual",
        summary: "Missing route.",
        url: "https://example.com/articles/example/?token=secret#frag",
      }),
      createObservabilityFinding({
        category: "security",
        confidence: "high",
        fixability: "investigate",
        noise: "bot-noise",
        owner: "external",
        severity: "info",
        source: "security",
        summary: "Bot probe.",
      }),
    ];

    expect(findings[0]).toMatchObject({
      route: "/articles/example/",
      status: "open",
      url: "https://example.com/articles/example/",
    });
    expect(createObservabilityReport(findings).summary).toEqual({
      byCategory: {
        routes: 1,
        security: 1,
      },
      byNoise: {
        actionable: 1,
        "bot-noise": 1,
      },
      byOwner: {
        external: 1,
        "site-owner": 1,
      },
      bySeverity: {
        error: 1,
        info: 1,
      },
      total: 2,
    });
  });

  test("parses failing Lighthouse audits into performance findings", () => {
    const findings = observabilityFindingsFromLighthouseReport(
      {
        audits: {
          "network-dependency-tree": {
            description: "Critical request chain.",
            displayValue: "Maximum critical path latency: 236 ms",
            score: 0.42,
            scoreDisplayMode: "binary",
            title: "Avoid chaining critical requests",
          },
          "not-applicable": {
            score: 0,
            scoreDisplayMode: "notApplicable",
            title: "Ignored",
          },
          "uses-long-cache-ttl": {
            score: 0.8,
            scoreDisplayMode: "binary",
            title: "Use efficient cache lifetimes",
          },
        },
      },
      {
        route: "/",
        url: "https://thephilosophersmeme.com/?utm_source=test",
      },
    );

    expect(findings).toHaveLength(2);
    expect(findings[0]).toMatchObject({
      category: "performance",
      providerCode: "network-dependency-tree",
      route: "/",
      severity: "error",
      source: "lighthouse",
    });
    expect(findings[1]).toMatchObject({
      category: "cache",
      providerCode: "uses-long-cache-ttl",
      severity: "warning",
    });
  });

  test("ignores unsupported Lighthouse rows and maps metadata audit categories", () => {
    expect(observabilityFindingsFromLighthouseReport(null)).toEqual([]);

    const findings = observabilityFindingsFromLighthouseReport({
      audits: {
        "crawlable-anchors": {
          score: 0.9,
          scoreDisplayMode: "numeric",
          title: "Links are crawlable",
        },
        "ignored-informative": {
          score: 0,
          scoreDisplayMode: "informative",
          title: "Ignored",
        },
        malformed: "not an audit",
      },
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      category: "metadata",
      providerCode: "crawlable-anchors",
      severity: "warning",
    });
  });

  test("parses Cloudflare-style status rows and classifies scanner noise", () => {
    const findings = observabilityFindingsFromStatusRows({
      rows: [
        { count: 23, path: "/favicon.ico", status: 404 },
        { count: 12, path: "/.env", status: 404 },
        { count: 2, path: "/articles/what-is-a-meme/", status: 503 },
      ],
    });

    expect(findings[0]).toMatchObject({
      category: "routes",
      noise: "actionable",
      route: "/favicon.ico",
      severity: "warning",
      trend: { current: 23 },
    });
    expect(findings[1]).toMatchObject({
      noise: "bot-noise",
      owner: "external",
      route: "/.env",
    });
    expect(findings[2]).toMatchObject({
      category: "deployment",
      route: "/articles/what-is-a-meme/",
      severity: "error",
    });
  });

  test("ignores successful status rows and classifies stale asset crawls", () => {
    const findings = observabilityFindingsFromStatusRows([
      { count: 99, path: "/articles/ok/", status: 200 },
      {
        requests: 4,
        url: "https://example.com/assets/old.jpg",
        statusCode: 404,
      },
      { path: "/missing-status" },
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      noise: "stale-crawler",
      owner: "external",
      route: "/assets/old.jpg",
      trend: { current: 4 },
    });
  });

  test("parses webmaster and link-scanner rows through the normalized model", () => {
    const webmasterFindings = observabilityFindingsFromWebmasterRows(
      [
        {
          issue: "Broken redirect",
          severity: "error",
          url: "https://thephilosophersmeme.com/2015/11/25/bane/",
        },
      ],
      { source: "bing" },
    );
    const linkFindings = observabilityFindingsFromLinkScannerRows([
      {
        message: "404",
        page: "/articles/early-trash-dove/",
        target: "/assets/missing.jpg?cache=1",
      },
    ]);

    expect(webmasterFindings[0]).toMatchObject({
      category: "redirects",
      noise: "unclear",
      route: "/2015/11/25/bane/",
      source: "bing",
    });
    expect(linkFindings[0]).toMatchObject({
      category: "links",
      noise: "actionable",
      route: "/articles/early-trash-dove/",
      source: "link-scanner",
      url: "/assets/missing.jpg",
    });
  });

  test("maps webmaster issue language and ignores incomplete scanner rows", () => {
    const findings = observabilityFindingsFromWebmasterRows(
      {
        rows: [
          { issue: "Missing title metadata", url: "/untitled/" },
          { issue: "Crawl blocked by robots", url: "/private/" },
          { issue: "Bad inbound link", url: "/broken/" },
          { issue: "Low quality page", url: "external.example" },
          { issue: "No URL" },
        ],
      },
      { source: "search-console" },
    );

    expect(findings.map((finding) => finding.category)).toEqual([
      "metadata",
      "crawlability",
      "links",
      "search",
    ]);
    expect(findings.at(-1)).toMatchObject({
      confidence: "low",
      route: undefined,
    });
    expect(
      observabilityFindingsFromLinkScannerRows([{ page: "/articles/only/" }]),
    ).toEqual([]);
  });

  test("redacts query strings and hashes from stored URLs", () => {
    expect(
      redactObservabilityUrl(
        "https://thephilosophersmeme.com/articles/?fbclid=secret#comments",
      ),
    ).toBe("https://thephilosophersmeme.com/articles/");
    expect(redactObservabilityUrl("/feed.xml?token=secret")).toBe("/feed.xml");
  });
});
