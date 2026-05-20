import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";

describe("markdownlint config", () => {
  test("delegates TPM citation labels to the article-reference verifier", async () => {
    const config = await readFile(".markdownlint-cli2.jsonc", "utf8");

    expect(config).toContain('"MD052": false');
    expect(config).toContain("[^cite-*]");
    expect(config).toContain("article-reference verifier");
  });

  test("ignores generated output and parked site assets", async () => {
    const config = await readFile(".markdownlint-cli2.jsonc", "utf8");

    expect(config).toContain('"dist/**"');
    expect(config).toContain('"dist-catalog/**"');
    expect(config).toContain('"site/unused-assets/**"');
    expect(config).toContain('"playwright-report/**"');
    expect(config).toContain('"test-results/**"');
  });
});
