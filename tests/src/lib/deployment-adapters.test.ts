import { readFile } from "node:fs/promises";

import { describe, expect, test } from "bun:test";

import { formatCloudflareRedirects } from "../../../src/lib/cloudflare-redirects";
import {
  cloudflareWorkersStaticAssetsCapabilities,
  createCloudflareWorkersStaticAssetsDeploymentPlan,
  createStaticFolderDeploymentPlan,
  type DeploymentReleaseArtifact,
  type DeploymentTargetConfig,
  parseCloudflareHeaderRules,
  parseCloudflareStaticRedirectRules,
  parseCloudflareWorkersStaticAssetsConfig,
  staticFolderDeploymentCapabilities,
} from "../../../src/lib/deployment-adapters";

const releaseArtifact = {
  generatedOutputRoot: "dist",
  id: "release-fixture",
  redirectCount: 2,
  schemaVersion: "0.1.0",
  site: {
    canonicalUrl: "https://thephilosophersmeme.com/",
    domains: ["https://thephilosophersmeme.com/"],
    name: "The Philosopher's Meme",
  },
} satisfies DeploymentReleaseArtifact;

const target = {
  canonicalUrl: "https://thephilosophersmeme.com/",
  domains: ["https://thephilosophersmeme.com/"],
  kind: "cloudflare-workers-static-assets",
  name: "tpm-site",
  outputRoot: "dist",
} satisfies DeploymentTargetConfig;

const staticFolderTarget = {
  canonicalUrl: "https://thephilosophersmeme.com/",
  domains: [],
  kind: "static-folder",
  name: "local-export",
  outputRoot: "dist",
} satisfies DeploymentTargetConfig;

describe("deployment adapters", () => {
  test("parses current Cloudflare config and static headers", async () => {
    const config = parseCloudflareWorkersStaticAssetsConfig(
      await readFile("wrangler.toml", "utf8"),
    );
    const headerRules = parseCloudflareHeaderRules(
      await readFile("site/public/_headers", "utf8"),
    );

    expect(config).toEqual({
      assetsDirectory: "./dist",
      compatibilityDate: "2026-05-08",
      name: "tpm-site",
      notFoundHandling: "404-page",
    });
    expect(headerRules).toContainEqual({
      headers: {
        "Cache-Control": "public, max-age=31556952, immutable",
      },
      pathPattern: "/_astro/*",
    });
    expect(headerRules).toContainEqual({
      headers: {
        "Content-Type": "application/trafficadvice+json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
      pathPattern: "/.well-known/traffic-advice",
    });
  });

  test("creates a Cloudflare dry-run plan for the current TPM deploy target", async () => {
    const redirectsText = formatCloudflareRedirects([
      { destination: "/articles/one/", source: "/2020/one/" },
      { destination: "/articles/two/", source: "/2020/two/" },
    ]);
    const result = createCloudflareWorkersStaticAssetsDeploymentPlan({
      action: "publish",
      headersText: await readFile("site/public/_headers", "utf8"),
      mode: "dry-run",
      redirectsText,
      releaseArtifact,
      target,
      wranglerConfig: parseCloudflareWorkersStaticAssetsConfig(
        await readFile("wrangler.toml", "utf8"),
      ),
    });

    expect(result.status).toBe("ok");
    expect(result.capabilities).toMatchObject({
      customHeaders: "supported",
      immutableAssetCaching: "supported",
      localBuildUpload: "supported",
      productionDeployments: "supported",
      redirects: "supported",
      staticAssetUpload: "supported",
    });
    expect(result.providerReports).toContainEqual({
      label: "command",
      value: "wrangler deploy",
    });
    expect(result.providerReports).toContainEqual({
      label: "redirectRules",
      value: "2",
    });
    expect(result.urls.productionUrl).toBe("https://thephilosophersmeme.com/");
  });

  test("blocks execute deploys without credential references", async () => {
    const result = createCloudflareWorkersStaticAssetsDeploymentPlan({
      action: "publish",
      headersText: await readFile("site/public/_headers", "utf8"),
      mode: "execute",
      redirectsText: formatCloudflareRedirects([]),
      releaseArtifact: { ...releaseArtifact, redirectCount: 0 },
      target,
      wranglerConfig: parseCloudflareWorkersStaticAssetsConfig(
        await readFile("wrangler.toml", "utf8"),
      ),
    });

    expect(result.status).toBe("blocked");
    expect(
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.blocked &&
          diagnostic.code === "DEPLOY_CREDENTIAL_MISSING" &&
          diagnostic.target === "credentials",
      ),
    ).toBe(true);
  });

  test("reports provider config, cache, redirect, and rollback warnings", () => {
    const result = createCloudflareWorkersStaticAssetsDeploymentPlan({
      action: "rollback",
      headersText: "/_astro/*\n  Cache-Control: public, max-age=60\n",
      mode: "dry-run",
      redirectsText: formatCloudflareRedirects([]),
      releaseArtifact,
      target,
      wranglerConfig: {
        assetsDirectory: "./other-dist",
        compatibilityDate: "2026-05-08",
        name: "tpm-site",
        notFoundHandling: "404-page",
      },
    });

    expect(result.status).toBe("blocked");
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "DEPLOY_PROVIDER_CONFIG_CONFLICT",
      "DEPLOY_CACHE_POLICY_UNSUPPORTED",
      "DEPLOY_REDIRECT_UNSUPPORTED",
      "DEPLOY_ROLLBACK_UNAVAILABLE",
    ]);
    expect(result.manualSteps).toContainEqual({
      action:
        "Use Cloudflare provider tooling for cache purge or rollback when needed.",
      owner: "provider",
      required: true,
    });
  });

  test("parses Cloudflare redirects and keeps capability names stable", () => {
    const redirects = parseCloudflareStaticRedirectRules(
      formatCloudflareRedirects([
        { destination: "/articles/example/", source: "/2020/example/" },
      ]),
    );

    expect(redirects).toEqual([
      {
        destination: "/articles/example/",
        source: "/2020/example/",
        status: 301,
      },
    ]);
    expect(cloudflareWorkersStaticAssetsCapabilities.providerSideBuild).toBe(
      "unsupported",
    );
  });

  test("creates a static-folder adapter plan with explicit degraded capabilities", () => {
    const result = createStaticFolderDeploymentPlan({
      action: "publish",
      mode: "dry-run",
      releaseArtifact,
      target: staticFolderTarget,
    });

    expect(result.provider).toBe("static-folder");
    expect(result.status).toBe("ok-with-warnings");
    expect(result.capabilities).toMatchObject({
      customHeaders: "manual",
      immutableAssetCaching: "manual",
      previewDeployments: "unsupported",
      productionDeployments: "manual",
      redirects: "manual",
    });
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "DEPLOY_MANUAL_STEP_REQUIRED",
      "DEPLOY_REDIRECT_UNSUPPORTED",
      "DEPLOY_HEADER_UNSUPPORTED",
      "DEPLOY_CACHE_POLICY_UNSUPPORTED",
    ]);
    expect(result.manualSteps).toContainEqual({
      action: "Upload dist to the chosen static host.",
      owner: "site-owner",
      required: true,
    });
  });

  test("blocks provider preview when the static-folder adapter cannot support it", () => {
    const result = createStaticFolderDeploymentPlan({
      action: "preview",
      includesHeadersFile: true,
      includesRedirectsFile: true,
      mode: "dry-run",
      releaseArtifact,
      target: staticFolderTarget,
    });

    expect(result.status).toBe("blocked");
    expect(
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.blocked &&
          diagnostic.code === "DEPLOY_PREVIEW_UNSUPPORTED" &&
          diagnostic.provider === "static-folder",
      ),
    ).toBe(true);
    expect(staticFolderDeploymentCapabilities.cachePurge).toBe("unsupported");
  });
});
