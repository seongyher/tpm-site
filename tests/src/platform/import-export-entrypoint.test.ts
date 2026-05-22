import { describe, expect, test } from "bun:test";

import {
  createMigrationFixtureOutput,
  createMigrationReviewReport,
  formatMigrationReviewMarkdownReport,
  type MigrationFixture,
} from "../../../src/platform/import-export";

describe("platform import-export entrypoint", () => {
  test("exposes migration fixture helpers through the platform seam", () => {
    const fixture = {
      assets: [],
      records: [
        {
          authors: ["Author"],
          body: "Body",
          fields: [
            {
              fieldPath: "title",
              state: "exact",
              value: "Title",
            },
          ],
          id: "entry",
          slug: "entry",
          source: {
            archiveEntry: "archive/entry.md",
            originalId: "entry.md",
            sourceKind: "markdown-folder",
          },
          title: "Title",
        },
      ],
      redirects: [],
      sourceKind: "markdown-folder",
    } satisfies MigrationFixture;

    expect(
      createMigrationFixtureOutput(fixture).sources.some(
        (source) =>
          !source.reviewRequired &&
          source.sourcePath === "site/content/articles/entry.md",
      ),
    ).toBe(true);
    expect(
      formatMigrationReviewMarkdownReport(
        createMigrationReviewReport([createMigrationFixtureOutput(fixture)]),
      ),
    ).toContain("Status: `passed`");
  });
});
