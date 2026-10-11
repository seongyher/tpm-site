import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";

interface TypeScriptConfig {
  compilerOptions?: Record<string, unknown>;
  extends?: string;
  include?: string[];
}

function isTypeScriptConfig(value: unknown): value is TypeScriptConfig {
  return typeof value === "object" && value !== null;
}

async function readTypeScriptConfig(
  filePath: string,
): Promise<TypeScriptConfig> {
  const parsed: unknown = JSON.parse(await readFile(filePath, "utf8"));

  if (!isTypeScriptConfig(parsed)) {
    throw new TypeError(`${filePath} is not a TypeScript config object.`);
  }

  return parsed;
}

describe("tsconfig.tools", () => {
  test("typechecks repository tooling, scripts, configs, and tests", async () => {
    const config = await readTypeScriptConfig("tsconfig.tools.json");

    expect(config.extends).toBe("./tsconfig.json");
    expect(config.compilerOptions).toMatchObject({
      moduleResolution: "Bundler",
      noEmit: true,
    });
    if (config.include === undefined) {
      throw new Error("Expected tsconfig.tools.json to define include paths.");
    }

    expect(config.include).toContain("scripts/**/*.ts");
    expect(config.include).toContain("tests/**/*.ts");
    expect(config.include).toContain("vitest.config.ts");
  });
});
