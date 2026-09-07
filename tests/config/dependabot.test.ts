import { readFile } from "node:fs/promises";

import { z } from "astro/zod";
import { Glob, YAML } from "bun";
import { describe, expect, test } from "bun:test";

const groupSchema = z.object({
  "applies-to": z.string().optional(),
  "dependency-type": z.string().optional(),
  "exclude-patterns": z.array(z.string()).default([]),
  patterns: z.array(z.string()).min(1),
  "update-types": z.array(z.string()).optional(),
});

const dependabotSchema = z.object({
  updates: z.array(
    z.object({
      directory: z.string(),
      groups: z.record(z.string(), groupSchema).default({}),
      "package-ecosystem": z.string(),
    }),
  ),
  version: z.literal(2),
});

const dependencyFamilies = [
  ["astro", ["astro", "@astrojs/mdx", "@astrojs/markdown-remark"]],
  ["playwright", ["@playwright/test", "playwright-core"]],
  ["tailwind", ["tailwindcss", "@tailwindcss/vite"]],
  [
    "typescript-eslint",
    [
      "typescript",
      "@typescript/native",
      "typescript-eslint",
      "@typescript-eslint/parser",
    ],
  ],
] as const;

/** Reads the dependency updater used for the root package manifest. */
async function readRootUpdater() {
  const source = await readFile(".github/dependabot.yml", "utf8");
  const config = dependabotSchema.parse(YAML.parse(source));
  const rootUpdaters = config.updates.filter(
    (update) =>
      update.directory === "/" &&
      update["package-ecosystem"] !== "github-actions",
  );

  expect(rootUpdaters).toHaveLength(1);
  const [updater] = rootUpdaters;

  if (updater === undefined) {
    throw new Error("Expected one dependency updater for package.json.");
  }

  return updater;
}

describe("Dependabot config", () => {
  test("keeps manifest proposals until Dependabot supports the pinned Bun lockfile", async () => {
    const updater = await readRootUpdater();
    const packageJson: unknown = JSON.parse(
      await readFile("package.json", "utf8"),
    );
    const manifest = z
      .object({ packageManager: z.string() })
      .parse(packageJson);
    const lockfile = await readFile("bun.lock", "utf8");
    const source = await readFile(".github/dependabot.yml", "utf8");

    expect(manifest.packageManager).toMatch(/^bun@\d+\.\d+\.\d+$/u);
    expect(lockfile).toMatch(/^\s*\{\s*"lockfileVersion":\s*2\b/u);
    expect(updater["package-ecosystem"]).toBe("npm");
    expect(source).toContain("Bun version pinned in package.json");
    expect(source).toContain("bun install --lockfile-only");
    expect(source).toContain("bun install --frozen-lockfile");
    expect(source).toContain("DEFERRED.md");
  });

  test.each(dependencyFamilies)(
    "keeps the %s family together across release types",
    async (family, dependencies) => {
      const updater = await readRootUpdater();

      for (const dependency of dependencies) {
        const matchingGroup = Object.entries(updater.groups).find(
          ([, group]) =>
            group.patterns.some((pattern) =>
              new Glob(pattern).match(dependency),
            ) &&
            !group["exclude-patterns"].some((pattern) =>
              new Glob(pattern).match(dependency),
            ),
        );

        expect(matchingGroup?.[0]).toBe(family);
        expect(matchingGroup?.[1]["applies-to"] ?? "version-updates").toBe(
          "version-updates",
        );
        expect(matchingGroup?.[1]["dependency-type"]).toBeUndefined();
        expect(matchingGroup?.[1]["update-types"]).toBeUndefined();
      }
    },
  );
});
