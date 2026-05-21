import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";

interface PackageJson {
  scripts: Record<string, string>;
}

const expectedScriptEntrypoints = [
  ["assets:duplicates", "scripts/assets/find-duplicate-images.ts"],
  ["assets:locations", "scripts/assets/verify-image-asset-locations.ts"],
  ["assets:shared", "scripts/assets/find-shared-assets.ts"],
  ["assets:unused", "scripts/assets/find-unused-images.ts"],
  ["build:cloudflare", "scripts/build/generate-cloudflare-redirects.ts"],
  ["build:optimize", "scripts/build/optimize-build-output.ts"],
  ["build:pdf", "scripts/build/generate-article-pdfs.ts"],
  ["build:raw", "scripts/build/build-raw.ts"],
  ["catalog:check", "scripts/quality/verify-component-catalog.ts"],
  ["coverage:verify", "scripts/testing/verify-test-coverage.ts"],
  ["docs:references", "scripts/docs/generate-platform-references.ts"],
  ["docs:references:check", "scripts/docs/generate-platform-references.ts"],
  [
    "payload:minify-html:experiment",
    "scripts/payload/minify-html-experiment.ts",
  ],
  [
    "payload:minify-html:experiments",
    "scripts/payload/run-minify-html-experiments.ts",
  ],
  [
    "payload:postbuild:experiments",
    "scripts/payload/run-post-build-optimization-experiments.ts",
  ],
  ["payload:report", "scripts/payload/report-payload.ts"],
  ["payload:vite:experiments", "scripts/payload/run-vite-build-experiments.ts"],
  ["platform:check", "scripts/quality/verify-platform-boundaries.ts"],
  ["quality", "scripts/quality/run-quality.ts"],
  ["quality:release", "scripts/quality/run-quality.ts"],
  ["site:doctor", "scripts/site/site-doctor.ts"],
  ["site:schema", "scripts/site/generate-site-config-schema.ts"],
  ["site:schema:check", "scripts/site/generate-site-config-schema.ts"],
  ["tags:check", "scripts/content/normalize-tags.ts"],
  ["tags:normalize", "scripts/content/normalize-tags.ts"],
  ["test", "scripts/testing/run-tests.ts"],
  ["test:accountability", "scripts/testing/verify-test-accountability.ts"],
  [
    "test:accountability:release",
    "scripts/testing/verify-test-accountability.ts",
  ],
  ["test:astro", "scripts/testing/sync-astro-test-store.ts"],
  ["test:catalog", "scripts/testing/run-catalog-tests.ts"],
  ["test:flake", "scripts/testing/run-randomized-tests.ts"],
  ["validate:html", "scripts/build/validate-html.ts"],
  ["verify", "scripts/build/verify-build.ts"],
  ["verify:content", "scripts/content/verify-content.ts"],
] as const;

function isPackageJson(value: unknown): value is PackageJson {
  return (
    typeof value === "object" &&
    value !== null &&
    "scripts" in value &&
    typeof value.scripts === "object" &&
    value.scripts !== null
  );
}

async function readPackageJson(): Promise<PackageJson> {
  const parsed: unknown = JSON.parse(await readFile("package.json", "utf8"));

  if (!isPackageJson(parsed)) {
    throw new TypeError("package.json does not contain a scripts object.");
  }

  return parsed;
}

describe("package scripts", () => {
  test("point script entrypoints at organized script directories", async () => {
    const packageJson = await readPackageJson();
    const scripts = new Map(Object.entries(packageJson.scripts));

    for (const [scriptName, entrypoint] of expectedScriptEntrypoints) {
      expect(scripts.get(scriptName)).toContain(entrypoint);
      expect(existsSync(entrypoint)).toBe(true);
    }
  });

  test("keeps built-output browser checks separate from local build conveniences", async () => {
    const packageJson = await readPackageJson();
    const scripts = new Map(Object.entries(packageJson.scripts));

    expect(scripts.get("test:e2e:built")).toBe("playwright test tests/e2e");
    expect(scripts.get("test:a11y:built")).toBe("playwright test tests/a11y");
    expect(scripts.get("test:perf:built")).toBe("lhci autorun");

    expect(scripts.get("test:e2e")).toBe(
      "bun --silent run build && bun --silent run test:e2e:built",
    );
    expect(scripts.get("test:a11y")).toBe(
      "bun --silent run build && bun --silent run test:a11y:built",
    );
    expect(scripts.get("test:perf")).toBe(
      "bun --silent run build && bun --silent run test:perf:built",
    );
  });

  test("keeps fast checks cheap and release checks from rebuilding before e2e", async () => {
    const packageJson = await readPackageJson();
    const scripts = new Map(Object.entries(packageJson.scripts));
    const fastCheck = scripts.get("check:fast") ?? "";
    const normalCheck = scripts.get("check") ?? "";
    const releaseCheck = scripts.get("check:release") ?? "";

    for (const scriptName of [
      "verify:content",
      "tags:check",
      "site:doctor",
      "site:schema:check",
      "docs:references:check",
      "platform:check",
      "assets:locations",
      "assets:shared",
      "catalog:check",
      "lint:packages",
      "test:config",
    ]) {
      expect(fastCheck).toContain(`run ${scriptName}`);
    }

    for (const expensiveScriptName of [
      "typecheck",
      "lint &&",
      "format",
      "deadcode",
      "test &&",
      "build",
      "test:e2e",
    ]) {
      expect(fastCheck).not.toContain(`run ${expensiveScriptName}`);
    }

    expect(normalCheck.startsWith("bun --silent run check:fast &&")).toBe(true);
    expect(releaseCheck).toContain("bun --silent run build:release");
    expect(releaseCheck).toContain("bun --silent run test:e2e:built");
    expect(releaseCheck).not.toContain("bun --silent run test:e2e &&");
    expect(releaseCheck.indexOf("bun --silent run test:catalog")).toBeLessThan(
      releaseCheck.indexOf("bun --silent run build:release"),
    );
    expect(
      releaseCheck.indexOf("bun --silent run test:e2e:built"),
    ).toBeGreaterThan(releaseCheck.indexOf("bun --silent run validate:html"));
  });

  test("keeps catalog builds isolated from production output", async () => {
    const packageJson = await readPackageJson();
    const scripts = new Map(Object.entries(packageJson.scripts));

    expect(scripts.get("catalog:build")).toContain(
      "SITE_OUTPUT_DIR=dist-catalog",
    );
    expect(scripts.get("catalog:preview")).toContain(
      "SITE_OUTPUT_DIR=dist-catalog",
    );
    expect(scripts.get("catalog:preview:fresh")).toBe(
      "bun --silent run catalog:build && bun --silent run catalog:preview",
    );
    expect(scripts.get("test:catalog")).toBe(
      "bun scripts/testing/run-catalog-tests.ts",
    );
  });

  test("exposes Cloudflare static-asset deploy commands", async () => {
    const packageJson = await readPackageJson();
    const scripts = new Map(Object.entries(packageJson.scripts));

    expect(scripts.get("build:cloudflare")).toBe(
      "bun scripts/build/generate-cloudflare-redirects.ts --quiet",
    );
    expect(scripts.get("build:release")).toBe(
      "bun --silent run build && bun --silent run build:cloudflare",
    );
    expect(scripts.get("deploy:cloudflare")).toBe("wrangler deploy");
    expect(scripts.get("preview:cloudflare")).toBe("wrangler dev");
    expect(scripts.get("preview:cloudflare:fresh")).toContain(
      "bun --silent run build:release",
    );
    expect(scripts.get("preview:release:fresh")).toContain(
      "bun --silent run build:release",
    );
  });
});
