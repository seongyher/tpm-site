import { createRequire } from "node:module";

import { describe, expect, test } from "bun:test";

const require = createRequire(import.meta.url);
require("eslint");
const { default: config } = await import("../../eslint.config");

describe("ESLint config", () => {
  test("exports a flat config with global ignores and strict local rules", () => {
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(10);

    expect(
      config.some(
        (entry) =>
          entry.linterOptions?.reportUnusedDisableDirectives === "error",
      ),
    ).toBe(true);
    expect(
      config.some((entry) => entry.files?.includes("src/**/*.astro") === true),
    ).toBe(true);
    expect(
      config.some(
        (entry) =>
          entry.rules?.["@typescript-eslint/no-explicit-any"] === "error",
      ),
    ).toBe(true);
  });

  test("ignores generated output directories", () => {
    const globalIgnorePatterns = config.flatMap((entry) => entry.ignores ?? []);

    for (const ignoredGeneratedPath of [
      ".unlighthouse/",
      ".wrangler/",
      "dist/",
      "dist-catalog/",
      "target/",
    ]) {
      expect(globalIgnorePatterns).toContain(ignoredGeneratedPath);
    }
  });
});
