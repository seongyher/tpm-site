import path from "node:path";

import { describe, expect, test } from "bun:test";

import { resolveSiteInstancePaths } from "../../../src/lib/site-instance";
import {
  sourceArtifactEntry,
  sourceArtifactManifest,
} from "../../../src/lib/source-artifacts";

describe("source artifact manifest", () => {
  test("classifies default site-instance source and generated artifact roots", () => {
    const paths = resolveSiteInstancePaths({ cwd: "/repo/platform" });
    const manifest = sourceArtifactManifest(paths, { cwd: "/repo/platform" });

    expect(sourceArtifactEntry(manifest, "site.root")).toMatchObject({
      kind: "site-root",
      relativePath: "site",
    });
    expect(sourceArtifactEntry(manifest, "assets.root")).toMatchObject({
      kind: "processed-asset",
      relativePath: "site/assets",
    });
    expect(sourceArtifactEntry(manifest, "public.root")).toMatchObject({
      kind: "public-static",
      relativePath: "site/public",
    });
    expect(sourceArtifactEntry(manifest, "unusedAssets.root")).toMatchObject({
      kind: "parked-legacy-asset",
      relativePath: "site/unused-assets",
    });
    expect(sourceArtifactEntry(manifest, "output.dist")).toMatchObject({
      kind: "generated-output",
      relativePath: "dist",
    });
  });

  test("tracks external site roots and isolated output directories", () => {
    const paths = resolveSiteInstancePaths({
      cwd: "/repo/platform",
      outputDir: "dist/examples/docs-site",
      siteInstanceRoot: "../docs-site",
    });
    const manifest = sourceArtifactManifest(paths, { cwd: "/repo/platform" });

    expect(sourceArtifactEntry(manifest, "site.root").absolutePath).toBe(
      path.join("/repo", "docs-site"),
    );
    expect(sourceArtifactEntry(manifest, "site.root").relativePath).toBe(
      "../docs-site",
    );
    expect(sourceArtifactEntry(manifest, "output.dist").relativePath).toBe(
      "dist/examples/docs-site",
    );
  });

  test("groups entries by ownership category for scripts and reports", () => {
    const manifest = sourceArtifactManifest(
      resolveSiteInstancePaths({ cwd: "/repo/platform" }),
      { cwd: "/repo/platform" },
    );

    expect(manifest.generatedOutputs.map((entry) => entry.key)).toEqual([
      "output.dist",
    ]);
    expect(manifest.parkedLegacyAssets.map((entry) => entry.key)).toEqual([
      "unusedAssets.root",
    ]);
    expect(manifest.processedAssets.map((entry) => entry.key)).toContain(
      "assets.root",
    );
    expect(manifest.publicStatic.map((entry) => entry.key)).toEqual([
      "public.root",
    ]);
    expect(manifest.siteEditableSources.map((entry) => entry.key)).toContain(
      "content.articles",
    );
  });

  test("fails loudly for unknown manifest keys", () => {
    const manifest = sourceArtifactManifest(
      resolveSiteInstancePaths({ cwd: "/repo/platform" }),
      { cwd: "/repo/platform" },
    );

    expect(() =>
      sourceArtifactEntry({ ...manifest, entries: [] }, "assets.root"),
    ).toThrow('Missing source artifact manifest entry "assets.root".');
  });
});
