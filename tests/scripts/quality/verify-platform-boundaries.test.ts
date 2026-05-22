import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
  formatPlatformBoundaryReport,
  verifyPlatformBoundaries,
} from "../../../scripts/quality/verify-platform-boundaries";

const ownedLibFiles = [
  "src/lib/routes.ts",
  "src/lib/site-config.ts",
  "src/lib/utils.ts",
].map((path) => ({ path, text: "export const value = true;\n" }));

describe("platform boundary verifier", () => {
  test("passes generic owned platform modules", () => {
    const result = verifyPlatformBoundaries({
      files: [
        ...ownedLibFiles,
        {
          path: "src/platform/routes.ts",
          text: 'export { routeOutputPath } from "../lib/route-registry";\n',
        },
        {
          path: "src/layouts/BaseLayout.astro",
          text: '---\nimport "@site/theme.css";\n---\n<slot />\n',
        },
      ],
      rootDir: ".",
    });

    expect(result.forbiddenEntrypointImports).toEqual([]);
    expect(result.forbiddenExtensionImports).toEqual([]);
    expect(result.unownedLibFiles).toEqual([]);
    expect(result.unownedPlatformEntrypoints).toEqual([]);
    expect(result.forbiddenImports).toEqual([]);
    expect(result.forbiddenLiterals).toEqual([]);
    expect(formatPlatformBoundaryReport(result)).toBe(
      "Platform boundary check passed.",
    );
  });

  test("reports unowned src/lib modules", () => {
    const result = verifyPlatformBoundaries({
      files: [
        ...ownedLibFiles,
        {
          path: "src/lib/mystery.ts",
          text: "export const mystery = true;\n",
        },
      ],
      rootDir: ".",
    });

    expect(result.unownedLibFiles).toEqual(["mystery.ts"]);
    expect(formatPlatformBoundaryReport(result)).toContain(
      "Unowned src/lib modules:",
    );
  });

  test("reports unowned src/platform entrypoints", () => {
    const result = verifyPlatformBoundaries({
      files: [
        ...ownedLibFiles,
        {
          path: "src/platform/surprise.ts",
          text: 'export { value } from "../lib/routes";\n',
        },
      ],
      rootDir: ".",
    });

    expect(result.unownedPlatformEntrypoints).toEqual(["surprise.ts"]);
    expect(formatPlatformBoundaryReport(result)).toContain(
      "Unowned src/platform entrypoints:",
    );
  });

  test("reports imports that bypass platform entrypoint seams", () => {
    const result = verifyPlatformBoundaries({
      files: [
        ...ownedLibFiles,
        {
          path: "src/platform/routes.ts",
          text: 'export { ArticleList } from "../components/articles/ArticleList.astro";\n',
        },
      ],
      rootDir: ".",
    });

    expect(result.forbiddenEntrypointImports).toEqual([
      {
        file: "src/platform/routes.ts",
        message:
          'Unsupported platform-entrypoint import "../components/articles/ArticleList.astro". Entrypoints may only re-export local entrypoints or src/lib domain modules.',
      },
    ]);
    expect(formatPlatformBoundaryReport(result)).toContain(
      "Unsupported platform-entrypoint imports:",
    );
  });

  test("reports extension imports that bypass platform entrypoints", () => {
    const result = verifyPlatformBoundaries({
      files: [
        ...ownedLibFiles,
        {
          path: "extensions/example/index.ts",
          text: 'import { routeOutputPath } from "../../src/lib/route-registry";\n',
        },
        {
          path: "extensions/allowed/index.ts",
          text: 'import { routeOutputPath } from "../../src/platform/routes";\n',
        },
      ],
      rootDir: ".",
    });

    expect(result.forbiddenExtensionImports).toEqual([
      {
        file: "extensions/example/index.ts",
        message:
          'Unsupported extension import "../../src/lib/route-registry". Extensions must use platform entrypoints instead of reaching into site, src/lib, components, pages, scripts, or tests directly.',
      },
    ]);
    expect(formatPlatformBoundaryReport(result)).toContain(
      "Unsupported extension imports:",
    );
  });

  test("reports site-specific literals in reusable platform code", () => {
    const result = verifyPlatformBoundaries({
      files: [
        ...ownedLibFiles,
        {
          path: "src/components/blocks/Example.astro",
          text: "<p>The Philosopher's Meme</p>\n",
        },
      ],
      rootDir: ".",
    });

    expect(result.forbiddenLiterals).toEqual([
      {
        file: "src/components/blocks/Example.astro",
        message:
          "Move The Philosopher's Meme display copy into the site instance.",
      },
    ]);
  });

  test("reports unsupported site-instance imports", () => {
    const result = verifyPlatformBoundaries({
      files: [
        ...ownedLibFiles,
        {
          path: "src/components/blocks/Example.astro",
          text: '---\nimport image from "@site/assets/example.png";\n---\n',
        },
      ],
      rootDir: ".",
    });

    expect(result.forbiddenImports).toEqual([
      {
        file: "src/components/blocks/Example.astro",
        message:
          'Unsupported site-instance import "@site/assets/example.png". Read site data through config/content adapters or explicit props.',
      },
    ]);
  });

  test("checks private catalog code for live site coupling", () => {
    const result = verifyPlatformBoundaries({
      files: [
        ...ownedLibFiles,
        {
          path: "src/catalog/ComponentCatalog.astro",
          text: '---\nimport image from "@site/assets/shared/live-site.png";\n---\n<p>Catalog</p>\n',
        },
        {
          path: "src/catalog/catalog.config.ts",
          text: 'export const flag = "TPM_COMPONENT_CATALOG";\n',
        },
      ],
      rootDir: ".",
    });

    expect(result.forbiddenImports).toEqual([
      {
        file: "src/catalog/ComponentCatalog.astro",
        message:
          'Unsupported site-instance import "@site/assets/shared/live-site.png". Read site data through config/content adapters or explicit props.',
      },
    ]);
    expect(result.forbiddenLiterals).toEqual([
      {
        file: "src/catalog/catalog.config.ts",
        message: "Move TPM-specific reader copy into site content or config.",
      },
    ]);
  });

  test("ignores tracked files deleted in a dirty worktree", () => {
    const rootDir = mkdtempSync(path.join(os.tmpdir(), "platform-boundary-"));

    try {
      mkdirSync(path.join(rootDir, "src/lib"), { recursive: true });
      writeFileSync(
        path.join(rootDir, "src/lib/routes.ts"),
        "export const routes = true;\n",
      );
      writeFileSync(
        path.join(rootDir, "src/lib/site-config.ts"),
        "export const config = true;\n",
      );
      writeFileSync(
        path.join(rootDir, "src/lib/utils.ts"),
        "export const utils = true;\n",
      );
      writeFileSync(
        path.join(rootDir, "src/lib/deleted.ts"),
        "export const deleted = true;\n",
      );
      spawnSync("git", ["init"], { cwd: rootDir });
      spawnSync("git", ["add", "."], { cwd: rootDir });
      rmSync(path.join(rootDir, "src/lib/deleted.ts"));

      const result = verifyPlatformBoundaries({ rootDir });

      expect(result.unownedLibFiles).toEqual([]);
      expect(result.forbiddenImports).toEqual([]);
      expect(result.forbiddenLiterals).toEqual([]);
    } finally {
      rmSync(rootDir, { force: true, recursive: true });
    }
  });
});
