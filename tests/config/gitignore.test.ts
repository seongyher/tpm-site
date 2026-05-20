import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";

describe("gitignore config", () => {
  test("ignores generated output, local tool state, and local env overrides", async () => {
    const ignoreFile = await readFile(".gitignore", "utf8");

    for (const ignoredPath of [
      "node_modules/",
      "dist/",
      "dist-catalog/",
      ".astro/",
      ".wrangler/",
      "coverage/",
      ".lighthouseci/",
      "playwright-report/",
      "test-results/",
      "tmp/",
      ".unlighthouse/",
      ".env.local",
      ".env.*.local",
    ]) {
      expect(ignoreFile).toContain(ignoredPath);
    }
  });
});
