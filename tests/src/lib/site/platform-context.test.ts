import { describe, expect, test } from "bun:test";

import {
  createPlatformContext,
  platformArticleCompilerContext,
  platformArtifactContext,
  platformContext,
  platformRouteContext,
} from "../../../../src/lib/site/platform-context";
import { siteConfig } from "../../../../src/lib/site/site-config";
import { resolveSiteInstancePaths } from "../../../../src/lib/site/site-instance";

describe("platform context", () => {
  test("exposes the current site instance through a default compatibility context", () => {
    expect(platformContext.config.identity.title).toBe(
      siteConfig.identity.title,
    );
    expect(platformContext.paths.root).toEndWith("/site");
    expect(
      platformContext.sourceArtifacts.entries.map((entry) => entry.key),
    ).toContain("config.site");
    expect(
      platformContext.routeRegistry.map((entry) => entry.routeKey),
    ).toContain("articles");
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
    const generatedOutputPaths = new Map(
      context.sourceArtifacts.generatedOutputs.map((entry) => [
        entry.key,
        entry.relativePath,
      ]),
    );

    expect(generatedOutputPaths.get("output.dist")).toBe("dist/fixture");
    expect(generatedOutputPaths.get("output.routes")).toBe("dist/fixture");
    expect(generatedOutputPaths.get("output.searchIndex")).toBe(
      "dist/fixture/pagefind",
    );
    expect(platformRouteContext(context).enabledRoutes.length).toBeGreaterThan(
      0,
    );
    expect(platformArtifactContext(context).paths.root).toBe(
      context.paths.root,
    );
    expect(platformArticleCompilerContext(context).config.features.pdf).toBe(
      siteConfig.features.pdf,
    );
  });
});
