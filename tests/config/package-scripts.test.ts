import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";

import { justRecipeBlock, parseJustRecipes } from "../helpers/justfile";

interface PackageJson {
  scripts?: Record<string, string>;
}

function isPackageJson(value: unknown): value is PackageJson {
  return typeof value === "object" && value !== null;
}

async function readJustfile(): Promise<string> {
  return readFile("justfile", "utf8");
}

async function readPackageJson(): Promise<PackageJson> {
  const parsed: unknown = JSON.parse(await readFile("package.json", "utf8"));

  if (!isPackageJson(parsed)) {
    throw new TypeError("package.json has an unexpected shape.");
  }

  return parsed;
}

describe("command surface", () => {
  test("keeps package scripts retired", async () => {
    const packageJson = await readPackageJson();

    expect(packageJson.scripts ?? {}).toEqual({});
  });

  test("uses just as the command router for major workflow surfaces", async () => {
    const justfile = await readJustfile();

    for (const recipe of [
      "setup",
      "dev",
      "build",
      "build-release",
      "check-fast",
      "check",
      "release-check",
      "fix",
      "test",
      "test-e2e-built",
      "docs-check",
      "author-check",
      "review-assets",
      "review-markdown",
      "coverage",
      "coverage-ts",
      "coverage-rust",
      "audit",
      "secrets",
      "deploy-cloudflare",
      "rust-check",
      "cli",
    ]) {
      expect(justfile).toContain(`\n${recipe}`);
    }
  });

  test("keeps coverage commands explicit by ecosystem and aggregate", async () => {
    const justfile = await readJustfile();

    expect(justRecipeBlock(justfile, "coverage")).toContain(
      "coverage-ts coverage-rust",
    );
    expect(justRecipeBlock(justfile, "coverage-ts")).toContain(
      "just _coverage-ts-report",
    );
    expect(justRecipeBlock(justfile, "coverage-ts")).toContain(
      "just coverage-verify {{args}}",
    );
    expect(justRecipeBlock(justfile, "coverage-rust")).toContain(
      "cargo llvm-cov",
    );
    expect(justRecipeBlock(justfile, "coverage-rust")).toContain(
      "--show-missing-lines",
    );

    for (const retiredRecipe of [
      "coverage-check",
      "coverage-unit",
      "rust-coverage",
    ]) {
      expect(
        justfile.includes(`\n${retiredRecipe}:`),
        `${retiredRecipe} should not be a public just recipe`,
      ).toBe(false);
    }
  });

  test("keeps asset review recipes aligned with typed xtask arguments", async () => {
    const justfile = await readJustfile();
    const reviewAssets = justRecipeBlock(justfile, "review-assets");

    expect(reviewAssets).toContain("just assets-duplicates --quiet");
    expect(reviewAssets).toContain("just assets-unused --quiet");
    expect(reviewAssets).not.toContain("--review");
  });

  test("keeps retired review-only commands out of the visible just surface", async () => {
    const justfile = await readJustfile();
    const recipes = new Set(parseJustRecipes(justfile));

    for (const retiredRecipe of [
      "payload-critical-css-experiment",
      "payload-minify-html-experiment",
      "payload-minify-html-experiments",
      "payload-postbuild-experiments",
      "payload-vite-experiments",
      "references-audit",
      "references-bibtex-audit",
      "references-catalog",
      "references-migrate-mechanical",
    ]) {
      expect(
        recipes.has(retiredRecipe),
        `${retiredRecipe} should be retired`,
      ).toBe(false);
    }
  });

  test("keeps built-output browser checks separate from local build conveniences", async () => {
    const justfile = await readJustfile();

    expect(justfile).toContain("test-e2e-built *args:");
    expect(justfile).toContain("./node_modules/.bin/playwright test tests/e2e");
    expect(justfile).toContain("test-a11y-built *args:");
    expect(justfile).toContain(
      "./node_modules/.bin/playwright test tests/a11y",
    );
    expect(justfile).toContain("test-perf-built *args:");
    expect(justfile).toContain("./node_modules/.bin/lhci autorun");

    expect(justfile).toContain("test-e2e *args:");
    expect(justfile).toContain("just build\n    just test-e2e-built");
    expect(justfile).toContain("test-a11y *args:");
    expect(justfile).toContain("just build\n    just test-a11y-built");
    expect(justfile).toContain("test-perf *args:");
    expect(justfile).toContain("just build\n    just test-perf-built");
  });

  test("keeps fast checks cheap and release checks from rebuilding before e2e", async () => {
    const justfile = await readJustfile();
    const fastCheck = justRecipeBlock(justfile, "check-fast");
    const normalCheck = justRecipeBlock(justfile, "check");
    const docsCheck = justRecipeBlock(justfile, "docs-check");
    const releaseCheck = justRecipeBlock(justfile, "release-check");

    for (const recipe of [
      "content-check",
      "tags-check",
      "site-doctor",
      "site-schema-check",
      "docs-references-check",
      "platform-check",
      "assets-locations",
      "assets-shared",
      "catalog-check",
      "package-check",
      "test-config",
    ]) {
      expect(fastCheck).toContain(recipe);
    }

    for (const expensiveRecipe of [
      "typecheck",
      "lint",
      "format",
      "deadcode",
      "test ",
      "build",
      "test-e2e",
    ]) {
      expect(fastCheck).not.toContain(expensiveRecipe);
    }

    expect(normalCheck).toContain("check-fast");
    expect(docsCheck).toContain("docs-references-check");
    expect(docsCheck).toContain("test-docs-site");
    expect(releaseCheck).toContain("build-release");
    expect(releaseCheck).toContain("docs-check");
    expect(releaseCheck).toContain("review-markdown");
    expect(releaseCheck).toContain("payload-check");
    expect(releaseCheck).toContain("test-e2e-built");
    expect(releaseCheck).not.toContain("test-e2e ");
  });

  test("keeps source-side site diagnostics in author and release check paths", async () => {
    const justfile = await readJustfile();
    const authorCheck = justRecipeBlock(justfile, "author-check");
    const fastCheck = justRecipeBlock(justfile, "check-fast");
    const releaseCheck = justRecipeBlock(justfile, "release-check");

    expect(authorCheck).toContain("content-check --quiet");
    expect(authorCheck).toContain("site-doctor --quiet");
    expect(authorCheck).toContain("site-schema-check --quiet");
    expect(fastCheck).toContain("site-doctor");
    expect(releaseCheck).toContain("check");
  });

  test("keeps catalog builds isolated from production output", async () => {
    const justfile = await readJustfile();

    expect(justRecipeBlock(justfile, "catalog-build")).toContain(
      "SITE_OUTPUT_DIR=dist-catalog",
    );
    expect(justRecipeBlock(justfile, "catalog-preview")).toContain(
      "SITE_OUTPUT_DIR=dist-catalog",
    );
    expect(justRecipeBlock(justfile, "catalog-preview-fresh")).toContain(
      "just catalog-build",
    );
    expect(justRecipeBlock(justfile, "test-catalog")).toContain(
      "just _xtask test-catalog",
    );
  });

  test("exposes Cloudflare static-asset deploy commands", async () => {
    const justfile = await readJustfile();

    expect(justRecipeBlock(justfile, "build-cloudflare")).toContain(
      "just _xtask build-cloudflare",
    );
    expect(justRecipeBlock(justfile, "build-release")).toContain(
      "build-cloudflare",
    );
    expect(justRecipeBlock(justfile, "deploy-cloudflare")).toContain(
      "wrangler deploy",
    );
    expect(justRecipeBlock(justfile, "preview-cloudflare")).toContain(
      "wrangler dev",
    );
    expect(justRecipeBlock(justfile, "preview-cloudflare-fresh")).toContain(
      "build-release",
    );
    expect(justRecipeBlock(justfile, "preview-release-fresh")).toContain(
      "build-release",
    );
  });
});
