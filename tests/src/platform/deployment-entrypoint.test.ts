import { describe, expect, test } from "bun:test";

import {
  cloudflareWorkersStaticAssetsCapabilities,
  createStaticFolderDeploymentPlan,
  parseCloudflareStaticRedirectRules,
  parseCloudflareWorkersStaticAssetsConfig,
} from "../../../src/platform/deployment";

describe("platform deployment entrypoint", () => {
  test("exposes Cloudflare deployment helpers through the platform seam", () => {
    expect(
      parseCloudflareWorkersStaticAssetsConfig(`
name = "fixture"
compatibility_date = "2026-05-08"

[assets]
directory = "./dist"
not_found_handling = "404-page"
      `),
    ).toMatchObject({
      assetsDirectory: "./dist",
      name: "fixture",
      notFoundHandling: "404-page",
    });
    expect(parseCloudflareStaticRedirectRules("/old/ /new/ 301\n")).toEqual([
      {
        destination: "/new/",
        source: "/old/",
        status: 301,
      },
    ]);
    expect(cloudflareWorkersStaticAssetsCapabilities.staticAssetUpload).toBe(
      "supported",
    );
    expect(
      createStaticFolderDeploymentPlan({
        action: "check",
        mode: "dry-run",
        releaseArtifact: {
          generatedOutputRoot: "dist",
          id: "fixture",
          redirectCount: 0,
          schemaVersion: "0.1.0",
          site: {
            canonicalUrl: "https://example.com/",
            domains: ["https://example.com/"],
            name: "Fixture",
          },
        },
        target: {
          canonicalUrl: "https://example.com/",
          domains: [],
          kind: "static-folder",
          name: "local",
          outputRoot: "dist",
        },
      }).provider,
    ).toBe("static-folder");
  });
});
