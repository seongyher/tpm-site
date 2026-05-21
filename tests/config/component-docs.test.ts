import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "bun:test";

const componentRoot = path.join("src", "components");
const componentDocRoot = path.join("docs", "components");

describe("component design documentation", () => {
  test("keeps component one-pagers and inventory aligned with source components", async () => {
    const componentPaths = listComponentPaths();
    const inventory = await readFile(
      path.join(componentDocRoot, "INVENTORY.md"),
      "utf8",
    );

    for (const componentPath of componentPaths) {
      const docPath = componentDocPath(componentPath);

      expect(
        existsSync(docPath),
        `${componentPath} is missing ${docPath}`,
      ).toBe(true);
      expect(
        inventory,
        `${componentPath} is missing from component inventory`,
      ).toContain(`\`${componentPath}\``);
    }
  });
});

function listComponentPaths(): string[] {
  return readdirSync(componentRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const group = entry.name;
      const groupRoot = path.join(componentRoot, group);

      return readdirSync(groupRoot)
        .filter((fileName) => fileName.endsWith(".astro"))
        .map((fileName) => path.join(groupRoot, fileName));
    })
    .map(toPosix)
    .sort((left, right) => left.localeCompare(right));
}

function componentDocPath(componentPath: string): string {
  const parsed = path.parse(componentPath);
  const group = path.basename(parsed.dir);

  return path.join(componentDocRoot, group, `${parsed.name}.md`);
}

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}
