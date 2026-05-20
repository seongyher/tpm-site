import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";
import { type Options, resolveConfig } from "prettier";

async function resolveProjectConfig(file: string): Promise<Options> {
  const config = await resolveConfig(file, { config: "prettier.config.mjs" });

  if (config === null) {
    throw new Error(`Expected Prettier config for ${file}.`);
  }

  return config;
}

describe("Prettier config", () => {
  test("keeps Astro and Tailwind formatting plugins enabled", async () => {
    const config = await resolveProjectConfig("src/pages/index.astro");

    expect(config.plugins).toEqual([
      "prettier-plugin-astro",
      "prettier-plugin-tailwindcss",
    ]);
    expect(config.singleQuote).toBe(false);
    expect(config.trailingComma).toBe("all");
  });

  test("uses JSON-compatible trailing commas for config data files", async () => {
    const config = await resolveProjectConfig(".github/dependabot.yml");

    expect(config.trailingComma).toBe("none");
  });

  test("ignores generated output directories", async () => {
    const ignoreFile = await readFile(".prettierignore", "utf8");

    expect(ignoreFile).toContain("dist/");
    expect(ignoreFile).toContain("dist-catalog/");
    expect(ignoreFile).toContain("coverage/");
    expect(ignoreFile).toContain("playwright-report/");
    expect(ignoreFile).toContain("test-results/");
  });
});
