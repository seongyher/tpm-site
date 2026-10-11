import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";

const toolingTsconfigPaths = [
  "scripts/tsconfig.json",
  "tests/tsconfig.json",
] as const;

interface LocalToolingTsconfig {
  extends: string;
  include: string[];
}

function isLocalToolingTsconfig(value: unknown): value is LocalToolingTsconfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "extends" in value &&
    "include" in value &&
    value.extends === "../tsconfig.tools.json" &&
    Array.isArray(value.include) &&
    value.include.every((entry) => typeof entry === "string")
  );
}

/**
 * Reads and validates a local tooling-directory TypeScript config.
 *
 * @param filePath Repository-relative config path.
 * @returns Parsed local tooling TypeScript config.
 */
async function readLocalToolingTsconfig(
  filePath: string,
): Promise<LocalToolingTsconfig> {
  const parsed: unknown = JSON.parse(await readFile(filePath, "utf8"));

  if (!isLocalToolingTsconfig(parsed)) {
    throw new TypeError(`${filePath} is not a local tooling tsconfig.`);
  }

  return parsed;
}

describe("local tooling tsconfigs", () => {
  test("let editors discover Node/Bun types in tooling directories", async () => {
    for (const filePath of toolingTsconfigPaths) {
      const config = await readLocalToolingTsconfig(filePath);

      expect(config).toEqual({
        extends: "../tsconfig.tools.json",
        include: ["**/*.ts"],
      });
    }
  });
});
