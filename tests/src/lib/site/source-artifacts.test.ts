import path from "node:path";

import { describe, expect, test } from "bun:test";

import { resolveSiteInstancePaths } from "../../../../src/lib/site/site-instance";
import {
  sourceArtifactEntriesByRole,
  sourceArtifactEntry,
  type SourceArtifactKind,
  sourceArtifactManifest,
  type SourceArtifactOwner,
  type SourceArtifactRole,
} from "../../../../src/lib/site/source-artifacts";

describe("source artifact manifest", () => {
  test("classifies default site-instance source and generated artifact roots", () => {
    const paths = resolveSiteInstancePaths({ cwd: "/repo/platform" });
    const manifest = sourceArtifactManifest(paths, { cwd: "/repo/platform" });

    expect(sourceArtifactEntry(manifest, "site.root")).toMatchObject({
      description: "Active site instance root",
      kind: "site-root",
      owner: "site-owner",
      relativePath: "site",
      required: true,
      role: "site-root",
    });
    expect(sourceArtifactEntry(manifest, "assets.root")).toMatchObject({
      kind: "processed-asset",
      owner: "site-owner",
      relativePath: "site/assets",
      required: false,
      role: "asset-source",
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
      owner: "platform",
      relativePath: "dist",
      required: true,
      role: "generated-route",
    });
    expect(sourceArtifactEntry(manifest, "output.searchIndex")).toMatchObject({
      kind: "generated-output",
      relativePath: "dist/pagefind",
      role: "generated-search",
    });
    expect(
      sourceArtifactEntriesByRole(manifest, "generated-search").map(
        (entry) => entry.key,
      ),
    ).toEqual(["output.searchIndex"]);
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
      "output.routes",
      "output.assets",
      "output.socialImages",
      "output.articlePdfs",
      "output.feed",
      "output.sitemapIndex",
      "output.searchIndex",
      "output.redirectFallbacks",
      "output.headers",
      "output.wellKnown",
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

  test("exports the source/artifact contract type vocabulary", () => {
    const kind: SourceArtifactKind = "generated-output";
    const owner: SourceArtifactOwner = "platform";
    const role: SourceArtifactRole = "generated-route";

    expect([kind, owner, role]).toEqual([
      "generated-output",
      "platform",
      "generated-route",
    ]);
  });
});
