import { describe, expect, test } from "bun:test";

import {
  createPlatformContext,
  platformContext,
} from "../../../src/lib/platform-context";
import { siteConfig } from "../../../src/lib/site-config";
import { resolveSiteInstancePaths } from "../../../src/lib/site-instance";

describe("platform context", () => {
  test("exposes the current site instance through a default compatibility context", () => {
    expect(platformContext.config.identity.title).toBe(
      siteConfig.identity.title,
    );
    expect(platformContext.paths.root).toEndWith("/site");
    expect(
      platformContext.sourceArtifacts.entries.map((entry) => entry.key),
    ).toContain("config.site");
  });

  test("composes explicit paths and config for fixture-style callers", () => {
    const context = createPlatformContext({
      config: siteConfig,
      cwd: "/repo/platform",
      paths: resolveSiteInstancePaths({
        cwd: "/repo/platform",
        outputDir: "dist/fixture",
        siteInstanceRoot: "tests/fixtures/site-instance",
      }),
    });

    expect(context.paths.root).toBe(
      "/repo/platform/tests/fixtures/site-instance",
    );
    expect(context.sourceArtifacts.generatedOutputs).toEqual([
      expect.objectContaining({
        key: "output.dist",
        relativePath: "dist/fixture",
      }),
    ]);
  });
});
