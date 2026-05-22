import { describe, expect, test } from "bun:test";

import {
  createMigrationFixtureOutput,
  createMigrationReviewReport,
  formatMigrationReviewMarkdownReport,
  type MigrationFixture,
} from "../../../src/lib/migration-fixtures";
import { representativeMigrationFixtures } from "../../fixtures/migration-fixtures";

describe("migration fixtures", () => {
  test("cover representative source families with controlled fixture size", () => {
    expect(
      representativeMigrationFixtures.map((fixture) => fixture.sourceKind),
    ).toEqual([
      "wordpress",
      "legacy-tpm",
      "substack-like",
      "markdown-folder",
      "static-html",
    ]);
    expect(
      representativeMigrationFixtures.flatMap((fixture) => fixture.records),
    ).toHaveLength(5);
  });

  test("produce deterministic source output and source maps", () => {
    const outputs = representativeMigrationFixtures.map((fixture) =>
      createMigrationFixtureOutput(fixture),
    );

    expect(outputs.map((output) => output.sources[0]?.sourcePath)).toEqual([
      "site/content/articles/wordpress-fixture.md",
      "site/content/articles/legacy-tpm.md",
      "site/content/articles/substack-fixture.md",
      "site/content/articles/markdown-folder-fixture.md",
      "site/content/articles/static-html-fixture.md",
    ]);
    expect(outputs[0]?.sources[0]?.text).toBe(`---
authors: ["Legacy Author"]
category: "Culture"
legacyPermalink: "/2019/01/01/wordpress-fixture/"
migrationReview: "true"
pubDate: "2019-01-01"
tags: ["Migration", "WordPress"]
title: "WordPress Fixture"
---
Imported WordPress body with a preserved image reference.
`);
    expect(outputs[4]?.sourceMaps).toEqual([
      {
        generatedRoute: "/articles/static-html-fixture/",
        originalId: "static-html-fixture.html",
        originalUrl: "https://archive.example/essay/static-html-fixture.html",
        preservationStates: ["lossy"],
        sourceKind: "static-html",
        sourcePath: "static-html/essay/static-html-fixture.html",
      },
    ]);
  });

  test("generates human-review diagnostics for ambiguous or lossy conversions", () => {
    const diagnostics = representativeMigrationFixtures.flatMap(
      (fixture) => createMigrationFixtureOutput(fixture).diagnostics,
    );

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "content.migration-field-review",
      "content.migration-citation-review",
      "content.migration-asset-review",
      "content.migration-field-review",
      "content.migration-embed-review",
      "content.migration-redirect-review",
      "content.migration-field-review",
      "content.migration-redirect-review",
    ]);
    expect(
      diagnostics.some(
        (diagnostic) =>
          diagnostic.location?.sourcePath ===
            "substack/posts/substack-fixture.html" &&
          diagnostic.message ===
            "Substack Fixture includes embedded media that needs a static/PDF fallback review.",
      ),
    ).toBe(true);
  });

  test("preserves public URL redirects and remote asset expectations", () => {
    const wordpressOutput = createMigrationFixtureOutput(
      fixtureBySourceKind("wordpress"),
    );
    const staticHtmlOutput = createMigrationFixtureOutput(
      fixtureBySourceKind("static-html"),
    );

    expect(wordpressOutput.redirects).toEqual([
      {
        destination: "/articles/wordpress-fixture/",
        source: "/2019/01/01/wordpress-fixture/",
        state: "exact",
        status: 301,
      },
    ]);
    expect(staticHtmlOutput.redirects).toEqual([
      {
        destination: "/articles/static-html-fixture/",
        source: "/essay/static-html-fixture.html",
        state: "lossy",
        status: 301,
      },
    ]);
    expect(
      wordpressOutput.assets.some(
        (asset) =>
          asset.id === "wp-chart" &&
          asset.sourceUrl === "https://old.example/uploads/chart.jpg" &&
          asset.state === "manual-review",
      ),
    ).toBe(true);
  });

  test("distinguishes clean round trips from review-required and unsupported migrations", () => {
    const markdownOutput = createMigrationFixtureOutput(
      fixtureBySourceKind("markdown-folder"),
    );
    const staticHtmlOutput = createMigrationFixtureOutput(
      fixtureBySourceKind("static-html"),
    );
    const unsupportedOutput = createMigrationFixtureOutput({
      assets: [],
      records: [
        {
          assets: ["missing"],
          authors: ["Author"],
          body: "Body",
          fields: [
            {
              fieldPath: "title",
              state: "exact",
              value: "Title",
            },
          ],
          id: "unsupported",
          slug: "unsupported",
          source: {
            archiveEntry: "bad/export.html",
            originalId: "bad",
            sourceKind: "static-html",
          },
          title: "Unsupported",
        },
      ],
      redirects: [
        {
          destination: "articles/bad/",
          source: "bad-url",
          state: "unknown",
          status: 301,
        },
      ],
      sourceKind: "static-html",
    } satisfies MigrationFixture);

    expect(createMigrationReviewReport([markdownOutput]).status).toBe("passed");
    expect(createMigrationReviewReport([staticHtmlOutput]).status).toBe(
      "review-required",
    );
    expect(createMigrationReviewReport([unsupportedOutput]).status).toBe(
      "unsupported",
    );
    expect(
      unsupportedOutput.diagnostics.map((diagnostic) => diagnostic.code),
    ).toEqual([
      "content.migration-missing-asset",
      "content.migration-invalid-redirect",
      "content.migration-redirect-review",
    ]);
  });

  test("formats migration review reports for site-doctor and studio consumers", () => {
    const report = createMigrationReviewReport(
      representativeMigrationFixtures.map((fixture) =>
        createMigrationFixtureOutput(fixture),
      ),
    );

    expect(report.summaryByCode).toEqual({
      "content.migration-asset-review": 1,
      "content.migration-citation-review": 1,
      "content.migration-embed-review": 1,
      "content.migration-field-review": 3,
      "content.migration-redirect-review": 2,
    });
    expect(formatMigrationReviewMarkdownReport(report)).toContain(
      "| `content.migration-field-review` | 3 |",
    );
    expect(formatMigrationReviewMarkdownReport(report)).toContain(
      "Review the original source evidence before publishing the migrated record.",
    );
  });
});

function fixtureBySourceKind(
  sourceKind: MigrationFixture["sourceKind"],
): MigrationFixture {
  const fixture = representativeMigrationFixtures.find(
    (candidate) => candidate.sourceKind === sourceKind,
  );

  if (fixture === undefined) {
    throw new Error(`Missing migration fixture for ${sourceKind}.`);
  }

  return fixture;
}
