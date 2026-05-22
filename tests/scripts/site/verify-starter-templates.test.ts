import { describe, expect, test } from "bun:test";

import {
  formatStarterTemplateIssues,
  verifyStarterTemplates,
} from "../../../scripts/site/verify-starter-templates";

describe("starter template verification", () => {
  test("passes the maintained starter template matrix", () => {
    const report = verifyStarterTemplates();

    expect(report.starterCount).toBe(5);
    expect(report.issues).toEqual([]);
  });

  test("formats starter template issues with starter IDs", () => {
    expect(
      formatStarterTemplateIssues([
        {
          message: "Missing required starter source path.",
          path: "/repo/examples/starters/minimal-blog/config/site.json",
          starterId: "minimal-blog",
        },
      ]),
    ).toContain("minimal-blog: Missing required starter source path.");
  });
});
