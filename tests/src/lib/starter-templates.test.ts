import { describe, expect, test } from "bun:test";

import {
  starterTemplateById,
  starterTemplateIds,
  starterTemplateMatrix,
} from "../../../src/lib/starter-templates";

describe("starter templates", () => {
  test("defines the maintained starter matrix in product order", () => {
    const matrix = starterTemplateMatrix();

    expect(matrix.map((template) => template.id)).toEqual([
      "minimal-blog",
      "editorial-magazine",
      "scholarly-publication",
      "docs-site",
      "kitchen-sink",
    ]);
    expect(matrix).toHaveLength(starterTemplateIds.length);
  });

  test("names required, optional, and intentionally absent capabilities", () => {
    const scholarly = starterTemplateById("scholarly-publication");
    const minimal = starterTemplateById("minimal-blog");

    expect(
      scholarly.capabilities.some(
        (capability) =>
          capability.level === "required" && capability.name === "citations",
      ),
    ).toBe(true);
    expect(
      minimal.capabilities.some(
        (capability) =>
          capability.level === "intentionally-absent" &&
          capability.name === "citations",
      ),
    ).toBe(true);
  });

  test("declares source, build, and release checks for every starter", () => {
    for (const template of starterTemplateMatrix()) {
      expect(template.acceptanceChecks.source.length).toBeGreaterThan(0);
      expect(template.acceptanceChecks.build.length).toBeGreaterThan(0);
      expect(template.acceptanceChecks.release).toContain(
        "just starters-check",
      );
      expect(template.root).not.toContain("site/");
    }
  });
});
