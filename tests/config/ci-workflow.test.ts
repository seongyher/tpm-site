import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";

async function readCiWorkflow(): Promise<string> {
  return readFile(".github/workflows/ci.yml", "utf8");
}

function jobBlock(workflow: string, jobName: string): string {
  const start = workflow.indexOf(`  ${jobName}:\n`);

  if (start === -1) {
    throw new Error(`Missing CI job ${jobName}.`);
  }

  const rest = workflow.slice(start + 1);
  const nextJob = rest.search(/\n {2}[a-z][\w-]*:\n/u);

  return nextJob === -1 ? rest : rest.slice(0, nextJob);
}

function secretExpression(name: string): string {
  return ["$", "{{ secrets.", name, " }}"].join("");
}

function envExpression(name: string): string {
  return ["$", "{{ env.", name, " }}"].join("");
}

describe("CI workflow", () => {
  test("uses the pinned package manager version for every Bun job", async () => {
    const [workflow, manifestSource] = await Promise.all([
      readCiWorkflow(),
      readFile("package.json", "utf8"),
    ]);
    const manifest: unknown = JSON.parse(manifestSource);
    const bunSetups = workflow
      .split("      - uses: oven-sh/setup-bun@v2\n")
      .slice(1);

    if (
      typeof manifest !== "object" ||
      manifest === null ||
      !("packageManager" in manifest) ||
      typeof manifest.packageManager !== "string"
    ) {
      throw new TypeError("package.json must declare its package manager.");
    }

    expect(manifest.packageManager).toMatch(/^bun@\d+\.\d+\.\d+$/u);
    expect(bunSetups.length).toBeGreaterThan(0);
    expect(workflow).not.toContain("bun-version:");

    for (const setup of bunSetups) {
      expect(
        setup.startsWith(
          "        with:\n          bun-version-file: package.json\n",
        ),
      ).toBe(true);
    }
  });

  test("uploads one verified build artifact for downstream checks", async () => {
    const workflow = await readCiWorkflow();
    const build = jobBlock(workflow, "build");

    expect(build).toContain("bun run build");
    expect(build).toContain("bun run build:cloudflare");
    expect(build).toContain("bun run verify");
    expect(build).toContain("bun run validate:html");
    expect(build).toContain("actions/upload-artifact@v4");
    expect(build).toContain("name: verified-dist");
    expect(build).toContain("path: dist");
    expect(build).toContain("retention-days: 2");
  });

  test("runs browser, accessibility, and Lighthouse checks against the verified artifact", async () => {
    const workflow = await readCiWorkflow();
    const browser = jobBlock(workflow, "browser");
    const accessibility = jobBlock(workflow, "accessibility");
    const lighthouse = jobBlock(workflow, "lighthouse");

    for (const job of [browser, accessibility, lighthouse]) {
      expect(job).toContain("needs:");
      expect(job).toContain("- build");
      expect(job).toContain("actions/download-artifact@v4");
      expect(job).toContain("name: verified-dist");
      expect(job).toContain("path: dist");
      expect(job).not.toContain("bun run build");
    }

    expect(browser).toContain("bun run test:e2e:built");
    expect(accessibility).toContain("bun run test:a11y:built");
    expect(lighthouse).toContain("bun run test:perf:built");
  });

  test("does not keep a GitHub Pages deploy job after Cloudflare cutover", async () => {
    const workflow = await readCiWorkflow();

    expect(workflow).not.toContain("\n  deploy:\n");
    expect(workflow).not.toContain("Deploy to GitHub Pages");
    expect(workflow).not.toContain("actions/configure-pages");
    expect(workflow).not.toContain("actions/upload-pages-artifact");
    expect(workflow).not.toContain("actions/deploy-pages");
    expect(workflow).not.toContain("id-token: write");
    expect(workflow).not.toContain("pages: write");
    expect(workflow).not.toContain("github-pages");
  });

  test("deploys the verified artifact to Cloudflare Workers on main", async () => {
    const workflow = await readCiWorkflow();
    const deploy = jobBlock(workflow, "deploy-cloudflare");

    expect(workflow).toContain('NODE_VERSION: "22.22.3"');
    expect(deploy).toContain("needs:");
    expect(deploy).toContain("- build");
    expect(deploy).toContain("actions/setup-node@v4");
    expect(deploy).toContain(`node-version: ${envExpression("NODE_VERSION")}`);
    expect(deploy).toContain("actions/download-artifact@v4");
    expect(deploy).toContain("name: verified-dist");
    expect(deploy).toContain("path: dist");
    expect(deploy).toContain("cloudflare/wrangler-action@v3");
    expect(deploy).toContain(
      `accountId: ${secretExpression("CLOUDFLARE_ACCOUNT_ID")}`,
    );
    expect(deploy).toContain(
      `apiToken: ${secretExpression("CLOUDFLARE_API_TOKEN")}`,
    );
    expect(deploy).toContain("command: deploy --cwd ../..");
    expect(deploy).toContain("packageManager: npm");
    expect(deploy).toContain("workingDirectory: .github/cloudflare-deploy");
    expect(deploy).toContain('wranglerVersion: "4"');
    expect(deploy).not.toContain("environment:");
    expect(deploy).not.toContain("oven-sh/setup-bun@v2");
    expect(deploy).not.toContain("NPM_CONFIG_LEGACY_PEER_DEPS");
    expect(deploy).not.toContain("bun run build");
    expect(deploy).not.toContain("bun run verify");
    expect(deploy).not.toContain("bun run validate:html");
  });
});
