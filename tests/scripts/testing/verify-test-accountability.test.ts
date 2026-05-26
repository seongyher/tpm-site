import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, spyOn, test } from "bun:test";

import {
  accountabilityMirrorTests,
  formatTestAccountabilityReport,
  parseAccountabilityIgnore,
  runTestAccountabilityCli,
  verifyTestAccountability,
} from "../../../scripts/testing/verify-test-accountability";

async function runGit(root: string, args: string[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("git", args, {
      cwd: root,
      stdio: ["ignore", "ignore", "pipe"],
    });
    const chunks: Buffer[] = [];

    child.stderr.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(Buffer.concat(chunks).toString("utf8")));
    });
  });
}

async function withTempRoot<T>(callback: (root: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-accountability-test-"));

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

describe("test accountability verifier", () => {
  test("requires meaningful comments directly above ignore patterns", () => {
    const parsed = parseAccountabilityIgnore(`# Too short
src/assets/**

# Requested permission: Static assets are covered by asset quality checks.
public/**
`);

    expect(parsed.invalidRules).toHaveLength(1);
    expect(parsed.rules.at(1)?.requestedPermission).toBe(true);
  });

  test("reuses a meaningful comment for contiguous ignore-pattern groups", () => {
    const parsed =
      parseAccountabilityIgnore(`# Requested permission: Static assets are covered by repository asset checks.
src/assets/**
public/**
`);

    expect(parsed.invalidRules).toEqual([]);
    expect(parsed.rules.map((rule) => rule.reason)).toEqual([
      "Requested permission: Static assets are covered by repository asset checks.",
      "Requested permission: Static assets are covered by repository asset checks.",
    ]);
  });

  test("accounts for approved ignore entries without release blockers", async () => {
    const result = await verifyTestAccountability({
      files: [
        ".test-accountability-ignore",
        "scripts/example.ts",
        "src/assets/example.png",
        "tests/scripts/example.test.ts",
      ],
      rootDir: process.cwd(),
    });

    expect(result.missingMirrors).toEqual([]);
    expect(result.requestedPermissionRules).toEqual([]);
    expect(formatTestAccountabilityReport(result, true)).not.toContain(
      "Requested-permission accountability exceptions",
    );
  });

  test("ignores generated output directories even when a file list includes them", async () => {
    const result = await verifyTestAccountability({
      files: [
        ".test-accountability-ignore",
        "dist-catalog/generated.ts",
        "dist/generated.ts",
        "node_modules/pkg/generated.ts",
      ],
      rootDir: process.cwd(),
    });

    expect(result.files).toEqual([".test-accountability-ignore"]);
    expect(result.unaccountedFiles).toEqual([]);
    expect(result.missingMirrors).toEqual([]);
  });

  test("fails files that are neither mirrored nor explicitly accounted for", async () => {
    const result = await verifyTestAccountability({
      files: [".test-accountability-ignore", "src/lib/uncovered.ts"],
      rootDir: process.cwd(),
    });

    expect(result.missingMirrors).toEqual([
      {
        expected: ["tests/src/lib/uncovered.test.ts"],
        file: "src/lib/uncovered.ts",
      },
    ]);
  });

  test("maps special project files to their conventional accountability tests", () => {
    expect(accountabilityMirrorTests("astro.config.ts")).toEqual([
      "tests/config/astro.config.test.ts",
    ]);
    expect(accountabilityMirrorTests("src/pages/index.astro")).toEqual([
      "tests/src/pages/index.test.ts",
      "tests/src/pages/index.vitest.ts",
    ]);
    expect(accountabilityMirrorTests("scripts/tsconfig.json")).toEqual([
      "tests/config/tooling-tsconfigs.test.ts",
    ]);
    expect(accountabilityMirrorTests("tsconfig.json")).toEqual([
      "tests/config/tsconfig.test.ts",
    ]);
    expect(accountabilityMirrorTests("tsconfig.tools.json")).toEqual([
      "tests/config/tsconfig.tools.test.ts",
    ]);
    expect(accountabilityMirrorTests("vitest.config.ts")).toEqual([
      "tests/config/vitest.config.test.ts",
    ]);
    expect(accountabilityMirrorTests("wrangler.toml")).toEqual([
      "tests/config/wrangler.config.test.ts",
    ]);
    expect(
      accountabilityMirrorTests(
        "examples/platform-entrypoint-consumer/platform-consumer.ts",
      ),
    ).toEqual(["tests/src/platform/example-consumer.test.ts"]);
    expect(accountabilityMirrorTests("src/platform/extensions.ts")).toEqual([
      "tests/src/platform/extensions.test.ts",
      "tests/src/platform/extensions-entrypoint.test.ts",
      "tests/src/platform/entrypoints.test.ts",
    ]);
  });

  test("accounts for Rust workspace files through Cargo and just gates", async () => {
    const result = await verifyTestAccountability({
      files: [
        ".test-accountability-ignore",
        "Cargo.lock",
        "Cargo.toml",
        "crates/tpm-cli/Cargo.toml",
        "crates/tpm-cli/src/lib.rs",
        "crates/tpm-cli/src/main.rs",
        "crates/tpm-core/Cargo.toml",
        "crates/tpm-core/src/lib.rs",
        "deny.toml",
        "justfile",
        "rust-toolchain.toml",
      ],
      rootDir: process.cwd(),
    });

    expect(result.missingMirrors).toEqual([]);
    expect(result.unaccountedFiles).toEqual([]);
  });

  test("formats all accountability failure sections", () => {
    const report = formatTestAccountabilityReport(
      {
        accountabilityFiles: [],
        files: ["src/lib/example.ts"],
        invalidRules: ["bad ignore rule"],
        missingMirrors: [
          {
            expected: ["tests/src/lib/example.test.ts"],
            file: "src/lib/example.ts",
          },
        ],
        requestedPermissionRules: [
          {
            line: 2,
            pattern: "src/assets/**",
            reason:
              "Requested permission: assets are verified by repository asset tooling.",
            requestedPermission: true,
          },
        ],
        unaccountedFiles: ["README.md"],
        unmatchedRules: [
          {
            line: 5,
            pattern: "missing/**",
            reason: "This pattern intentionally has no matching files.",
            requestedPermission: false,
          },
        ],
      },
      true,
    );

    expect(report).toContain("Invalid accountability ignore rules:");
    expect(report).toContain(
      "Accountability ignore patterns that match no repository files:",
    );
    expect(report).toContain("Code files missing mirrored tests:");
    expect(report).toContain("Repository files without test accountability:");
    expect(report).toContain(
      "Requested-permission accountability exceptions must be resolved before release:",
    );
    expect(
      formatTestAccountabilityReport(
        {
          accountabilityFiles: [],
          files: ["src/assets/example.png"],
          invalidRules: [],
          missingMirrors: [],
          requestedPermissionRules: [
            {
              line: 2,
              pattern: "src/assets/**",
              reason:
                "Requested permission: assets are verified by repository asset tooling.",
              requestedPermission: true,
            },
          ],
          unaccountedFiles: [],
          unmatchedRules: [],
        },
        false,
      ),
    ).toContain("Requested-permission accountability exceptions to report");
  });

  test.serial(
    "prints command usage without listing repository files",
    async () => {
      const log = spyOn(console, "log").mockImplementation(() => undefined);

      try {
        const exitCode = await runTestAccountabilityCli(
          ["--help"],
          process.cwd(),
        );

        expect(exitCode).toBe(0);
        expect(String(log.mock.calls[0]?.[0])).toContain(
          "Usage: bun run test:accountability",
        );
      } finally {
        log.mockRestore();
      }
    },
  );

  test.serial(
    "blocks requested-permission rules during release checks",
    async () =>
      withTempRoot(async (root) => {
        const error = spyOn(console, "error").mockImplementation(
          () => undefined,
        );

        try {
          await runGit(root, ["init"]);
          await writeText(
            root,
            ".test-accountability-ignore",
            "# Requested permission: Static assets are covered by repository asset checks.\nsrc/assets/**\n",
          );
          await writeText(root, "src/assets/example.png", "image");

          const exitCode = await runTestAccountabilityCli(
            ["--release", "--quiet"],
            root,
          );

          expect(exitCode).toBe(1);
          expect(String(error.mock.calls[0]?.[0])).toContain(
            "Requested-permission accountability exceptions must be resolved before release",
          );
        } finally {
          error.mockRestore();
        }
      }),
  );

  test.serial(
    "prints successful accountability output when not quiet",
    async () =>
      withTempRoot(async (root) => {
        const log = spyOn(console, "log").mockImplementation(() => undefined);

        try {
          await runGit(root, ["init"]);
          await writeText(
            root,
            ".test-accountability-ignore",
            "# Accountability fixture file is covered by this command-line test.\n.test-accountability-ignore\n",
          );

          const exitCode = await runTestAccountabilityCli([], root);

          expect(exitCode).toBe(0);
          expect(String(log.mock.calls[0]?.[0])).toContain(
            "Test accountability passed",
          );
        } finally {
          log.mockRestore();
        }
      }),
  );

  test.serial(
    "ignores tracked files that have been deleted before a rename is staged",
    async () =>
      withTempRoot(async (root) => {
        const log = spyOn(console, "log").mockImplementation(() => undefined);

        try {
          await runGit(root, ["init"]);
          await writeText(
            root,
            ".test-accountability-ignore",
            "# Accountability fixture file is covered by this command-line test.\n.test-accountability-ignore\n",
          );
          await writeText(root, "stale.config.ts", "export default {};\n");
          await runGit(root, ["add", ".test-accountability-ignore"]);
          await runGit(root, ["add", "stale.config.ts"]);
          await unlink(path.join(root, "stale.config.ts"));

          const exitCode = await runTestAccountabilityCli([], root);

          expect(exitCode).toBe(0);
          expect(String(log.mock.calls[0]?.[0])).toContain(
            "Test accountability passed",
          );
        } finally {
          log.mockRestore();
        }
      }),
  );

  test("fails clearly when repository files cannot be listed", async () =>
    withTempRoot(async (root) => {
      await writeText(root, ".test-accountability-ignore", "");

      let caughtError: unknown;
      try {
        await verifyTestAccountability({ rootDir: root });
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(Error);
    }));
});
