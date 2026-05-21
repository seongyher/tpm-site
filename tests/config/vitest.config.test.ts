import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";

describe("vitest config", () => {
  test("runs only Astro component tests under Vitest", async () => {
    const source = await readFile("vitest.config.ts", "utf8");

    expect(source).toContain('include: ["tests/**/*.vitest.ts"]');
    expect(source).toContain('environment: "node"');
  });
});
