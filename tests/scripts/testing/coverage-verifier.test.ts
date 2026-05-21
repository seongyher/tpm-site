import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, spyOn, test } from "bun:test";

import {
  formatCoverageInventoryReport,
  runCoverageVerificationCli,
  verifyCoverageInventory,
} from "../../../scripts/testing/verify-test-coverage";

async function withTempRoot<T>(callback: (root: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-coverage-test-"));

  try {
    return await callback(root);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

async function writeText(root: string, relativePath: string, text: string) {
  const fullPath = path.join(root, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, text);
}

describe("coverage inventory verifier", () => {
  test("reports testable source files missing from LCOV", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "coverage/lcov.info", "SF:scripts/covered.ts\n");
      await writeText(
        root,
        "scripts/covered.ts",
        "export const covered = 1;\n",
      );
      await writeText(
        root,
        "scripts/missing.ts",
        "export const missing = 1;\n",
      );
      await writeText(root, "scripts/component.astro", "<div />\n");
      await writeText(
        root,
        "scripts/types.d.ts",
        "declare const value: string;\n",
      );
      await writeText(root, "scripts/styles.css", ".x { color: red; }\n");
      await writeText(
        root,
        "scripts/coverage-exceptions.json",
        JSON.stringify([
          {
            pattern: "scripts/**/style?.css",
            reason: "Approved CSS exception for this test.",
          },
        ]),
      );
      await writeText(
        root,
        "scripts/nested/style1.css",
        ".x { color: red; }\n",
      );

      const result = await verifyCoverageInventory({
        exceptionFile: "scripts/coverage-exceptions.json",
        rootDir: root,
        roots: ["scripts"],
      });

      expect(result.approvedExceptionFiles).toEqual([
        "scripts/nested/style1.css",
        "scripts/styles.css",
      ]);
      expect(result.missingFiles).toEqual([
        "scripts/component.astro",
        "scripts/missing.ts",
        "scripts/types.d.ts",
      ]);
      expect(formatCoverageInventoryReport(result)).toContain(
        "unapproved coverage gaps",
      );
    }));

  test("accepts source files represented by mirrored accountability tests", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "coverage/lcov.info", "");
      await writeText(
        root,
        "scripts/mirrored.ts",
        "export const mirrored = 1;\n",
      );
      await writeText(
        root,
        "tests/scripts/mirrored.test.ts",
        "import { describe } from 'bun:test';\n",
      );
      await writeText(
        root,
        "scripts/coverage-exceptions.json",
        JSON.stringify([]),
      );

      const result = await verifyCoverageInventory({
        exceptionFile: "scripts/coverage-exceptions.json",
        rootDir: root,
        roots: ["scripts"],
      });

      expect(result.missingFiles).toEqual([]);
    }));

  test("ignores generated output roots even when they are passed explicitly", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "coverage/lcov.info", "");
      await writeText(
        root,
        "dist-catalog/generated.ts",
        "export const x = 1;\n",
      );
      await writeText(root, "dist/generated.ts", "export const x = 1;\n");
      await writeText(
        root,
        "scripts/coverage-exceptions.json",
        JSON.stringify([]),
      );

      const result = await verifyCoverageInventory({
        exceptionFile: "scripts/coverage-exceptions.json",
        rootDir: root,
        roots: ["dist-catalog", "dist"],
      });

      expect(result.subjectFiles).toEqual([]);
      expect(result.missingFiles).toEqual([]);
    }));

  test("passes when all testable source files are represented", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "coverage/lcov.info", "SF:scripts/covered.ts\n");
      await writeText(
        root,
        "scripts/covered.ts",
        "export const covered = 1;\n",
      );
      await writeText(
        root,
        "scripts/coverage-exceptions.json",
        JSON.stringify([]),
      );

      const result = await verifyCoverageInventory({
        exceptionFile: "scripts/coverage-exceptions.json",
        rootDir: root,
        roots: ["scripts"],
      });

      expect(result.missingFiles).toEqual([]);
      expect(formatCoverageInventoryReport(result)).toContain(
        "Coverage inventory passed",
      );
    }));

  test("supports broad coverage exception globs", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "coverage/lcov.info", "");
      await writeText(
        root,
        "scripts/exception.ts",
        "export const value = 1;\n",
      );
      await writeText(
        root,
        "scripts/coverage-exceptions.json",
        JSON.stringify([
          {
            pattern: "scripts/**",
            reason: "Approved broad glob exception for this test fixture.",
          },
        ]),
      );

      const result = await verifyCoverageInventory({
        exceptionFile: "scripts/coverage-exceptions.json",
        rootDir: root,
        roots: ["scripts"],
      });

      expect(result.missingFiles).toEqual([]);
      expect(result.approvedExceptionFiles).toEqual(["scripts/exception.ts"]);
    }));

  test("supports single-segment coverage exception globs", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "coverage/lcov.info", "");
      await writeText(
        root,
        "scripts/exception.ts",
        "export const value = 1;\n",
      );
      await writeText(
        root,
        "scripts/coverage-exceptions.json",
        JSON.stringify([
          {
            pattern: "scripts/*.ts",
            reason:
              "Approved single-segment glob exception for this test fixture.",
          },
        ]),
      );

      const result = await verifyCoverageInventory({
        exceptionFile: "scripts/coverage-exceptions.json",
        rootDir: root,
        roots: ["scripts"],
      });

      expect(result.missingFiles).toEqual([]);
      expect(result.approvedExceptionFiles).toEqual(["scripts/exception.ts"]);
    }));

  test.serial(
    "prints command usage without reading coverage files",
    async () => {
      const log = spyOn(console, "log").mockImplementation(() => undefined);

      try {
        const exitCode = await runCoverageVerificationCli(
          ["--help"],
          process.cwd(),
        );

        expect(exitCode).toBe(0);
        expect(String(log.mock.calls[0]?.[0])).toContain(
          "Usage: bun run coverage:verify",
        );
      } finally {
        log.mockRestore();
      }
    },
  );

  test.serial("prints coverage inventory failures from the CLI", async () =>
    withTempRoot(async (root) => {
      const error = spyOn(console, "error").mockImplementation(() => undefined);

      try {
        await writeText(root, "coverage/lcov.info", "");
        await writeText(root, "astro.config.ts", "export default {};\n");
        await writeText(root, "eslint.config.ts", "export default [];\n");
        await writeText(root, "knip.ts", "export default {};\n");
        await writeText(root, "playwright.config.ts", "export default {};\n");
        await writeText(root, "prettier.config.mjs", "export default {};\n");
        await writeText(root, "eslint/example.ts", "export const value = 1;\n");
        await writeText(root, "src/example.ts", "export const value = 1;\n");
        await writeText(
          root,
          "types/example.d.ts",
          "declare const value: 1;\n",
        );
        await writeText(
          root,
          "scripts/missing.ts",
          "export const missing = 1;\n",
        );
        await writeText(
          root,
          "scripts/coverage-exceptions.json",
          JSON.stringify([]),
        );

        const exitCode = await runCoverageVerificationCli([], root);

        expect(exitCode).toBe(1);
        expect(String(error.mock.calls[0]?.[0])).toContain(
          "unapproved coverage gap",
        );
      } finally {
        error.mockRestore();
      }
    }),
  );

  test.serial("prints coverage inventory success from the CLI", async () =>
    withTempRoot(async (root) => {
      const log = spyOn(console, "log").mockImplementation(() => undefined);

      try {
        await writeText(
          root,
          "coverage/lcov.info",
          [
            "SF:astro.config.ts",
            "SF:eslint.config.ts",
            "SF:knip.ts",
            "SF:playwright.config.ts",
            "SF:prettier.config.mjs",
            "SF:eslint/example.ts",
            "SF:scripts/covered.ts",
            "SF:src/example.ts",
            "SF:types/example.d.ts",
          ].join("\n"),
        );
        await writeText(root, "astro.config.ts", "export default {};\n");
        await writeText(root, "eslint.config.ts", "export default [];\n");
        await writeText(root, "knip.ts", "export default {};\n");
        await writeText(root, "playwright.config.ts", "export default {};\n");
        await writeText(root, "prettier.config.mjs", "export default {};\n");
        await writeText(root, "eslint/example.ts", "export const value = 1;\n");
        await writeText(
          root,
          "scripts/covered.ts",
          "export const value = 1;\n",
        );
        await writeText(root, "src/example.ts", "export const value = 1;\n");
        await writeText(
          root,
          "types/example.d.ts",
          "declare const value: 1;\n",
        );
        await writeText(
          root,
          "scripts/coverage-exceptions.json",
          JSON.stringify([]),
        );

        const exitCode = await runCoverageVerificationCli([], root);

        expect(exitCode).toBe(0);
        expect(String(log.mock.calls[0]?.[0])).toContain(
          "Coverage inventory passed",
        );
      } finally {
        log.mockRestore();
      }
    }),
  );

  test("rejects malformed coverage exception files", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "coverage/lcov.info", "");
      await writeText(root, "scripts/example.ts", "export const value = 1;\n");
      await writeText(
        root,
        "scripts/coverage-exceptions.json",
        JSON.stringify([{ pattern: "scripts/example.ts", reason: "" }]),
      );

      let caughtError: unknown;
      try {
        await verifyCoverageInventory({
          exceptionFile: "scripts/coverage-exceptions.json",
          rootDir: root,
          roots: ["scripts"],
        });
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(TypeError);
      expect(caughtError).toHaveProperty(
        "message",
        "scripts/coverage-exceptions.json[0] must include string pattern and reason fields.",
      );
    }));

  test("rejects coverage exception files that are not arrays", async () =>
    withTempRoot(async (root) => {
      await writeText(root, "coverage/lcov.info", "");
      await writeText(root, "scripts/example.ts", "export const value = 1;\n");
      await writeText(
        root,
        "scripts/coverage-exceptions.json",
        JSON.stringify({ pattern: "scripts/example.ts" }),
      );

      let caughtError: unknown;
      try {
        await verifyCoverageInventory({
          exceptionFile: "scripts/coverage-exceptions.json",
          rootDir: root,
          roots: ["scripts"],
        });
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(TypeError);
      expect(caughtError).toHaveProperty(
        "message",
        "scripts/coverage-exceptions.json must contain an array.",
      );
    }));
});
