import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

describe("Oxlint correctness gate", () => {
  test("rejects debugger statements and unreachable duplicate branches", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "tpm-oxlint-"));
    const file = path.join(root, "probe.ts");

    try {
      await writeFile(
        file,
        `export function choose(value: number): number {
  debugger;
  if (value === 1) return 2;
  else if (value === 1) return 3;
  return value;
}
`,
      );
      const result = Bun.spawnSync([
        path.resolve("node_modules/.bin/oxlint"),
        "--config",
        path.resolve(".oxlintrc.json"),
        "--format",
        "json",
        file,
      ]);
      const report = JSON.parse(result.stdout.toString()) as {
        diagnostics: { code: string; severity: string }[];
      };

      expect(result.exitCode).toBe(1);
      expect(report.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "eslint(no-debugger)",
            severity: "error",
          }),
          expect.objectContaining({
            code: "eslint(no-dupe-else-if)",
            severity: "error",
          }),
        ]),
      );

      await writeFile(
        file,
        "export function choose(value: number): number { return value + 1; }\n",
      );
      const clean = Bun.spawnSync([
        path.resolve("node_modules/.bin/oxlint"),
        "--config",
        path.resolve(".oxlintrc.json"),
        "--deny-warnings",
        file,
      ]);
      expect(clean.exitCode).toBe(0);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  test("keeps native lint separate from compiler and generated output checks", async () => {
    const config = JSON.parse(await readFile(".oxlintrc.json", "utf8")) as {
      plugins: string[];
      jsPlugins?: string[];
      categories: Record<string, string>;
      ignorePatterns: string[];
    };
    expect(config.categories).toEqual({ correctness: "error" });
    expect(config.plugins).toEqual(["typescript", "oxc"]);
    expect(config.jsPlugins).toBeUndefined();
    expect(config.ignorePatterns).toEqual(
      expect.arrayContaining([
        "dist/**",
        "dist-catalog/**",
        ".astro/**",
        "tmp/**",
        "node_modules/**",
        "**/*.astro",
        "**/*.md",
        "**/*.mdx",
      ]),
    );
  });
});
