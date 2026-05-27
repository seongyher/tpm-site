import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import { parseSiteConfig } from "../../../src/lib/site-config";
import {
  projectRelativePath,
  resolveSiteInstancePaths,
} from "../../../src/lib/site-instance";

describe("site instance paths", () => {
  test("resolves the default in-repo site instance", () => {
    const paths = resolveSiteInstancePaths({ cwd: "/repo/platform" });

    expect(paths.root).toBe(path.join("/repo/platform", "site"));
    expect(paths.config.site).toBe(
      path.join("/repo/platform", "site", "config", "site.json"),
    );
    expect(paths.config.redirects).toBe(
      path.join("/repo/platform", "site", "config", "redirects.json"),
    );
    expect(paths.content.articles).toBe(
      path.join("/repo/platform", "site", "content", "articles"),
    );
    expect(paths.assets.shared).toBe(
      path.join("/repo/platform", "site", "assets", "shared"),
    );
    expect(paths.public).toBe(path.join("/repo/platform", "site", "public"));
    expect(paths.theme).toBe(path.join("/repo/platform", "site", "theme.css"));
    expect(paths.output.dist).toBe(path.join("/repo/platform", "dist"));
  });

  test("resolves a sibling external instance root", () => {
    const paths = resolveSiteInstancePaths({
      cwd: "/repo/platform",
      siteInstanceRoot: "../example-site",
    });

    expect(paths.root).toBe(path.join("/repo", "example-site"));
    expect(paths.content.pages).toBe(
      path.join("/repo", "example-site", "content", "pages"),
    );
    expect(paths.unusedAssets).toBe(
      path.join("/repo", "example-site", "unused-assets"),
    );
    expect(paths.theme).toBe(path.join("/repo", "example-site", "theme.css"));
  });

  test("treats blank instance roots as the default in-repo site", () => {
    const paths = resolveSiteInstancePaths({
      cwd: "/repo/platform",
      siteInstanceRoot: " ",
    });

    expect(paths.root).toBe(path.join("/repo/platform", "site"));
  });

  test("resolves a custom output directory independently from the site root", () => {
    const paths = resolveSiteInstancePaths({
      cwd: "/repo/platform",
      outputDir: "dist/example-site",
      siteInstanceRoot: "../example-site",
    });

    expect(paths.root).toBe(path.join("/repo", "example-site"));
    expect(paths.output.dist).toBe(
      path.join("/repo/platform", "dist", "example-site"),
    );
  });

  test("uses site and output environment defaults for tooling callers", () => {
    const previousSiteRoot = process.env["SITE_INSTANCE_ROOT"];
    const previousOutputDir = process.env["SITE_OUTPUT_DIR"];

    process.env["SITE_INSTANCE_ROOT"] = "examples/docs-site";
    process.env["SITE_OUTPUT_DIR"] = "dist/examples/docs-site";

    try {
      const paths = resolveSiteInstancePaths({ cwd: "/repo/platform" });

      expect(paths.root).toBe(
        path.join("/repo/platform", "examples", "docs-site"),
      );
      expect(paths.output.dist).toBe(
        path.join("/repo/platform", "dist", "examples", "docs-site"),
      );
    } finally {
      if (previousSiteRoot === undefined) {
        delete process.env["SITE_INSTANCE_ROOT"];
      } else {
        process.env["SITE_INSTANCE_ROOT"] = previousSiteRoot;
      }

      if (previousOutputDir === undefined) {
        delete process.env["SITE_OUTPUT_DIR"];
      } else {
        process.env["SITE_OUTPUT_DIR"] = previousOutputDir;
      }
    }
  });

  test("formats project-relative paths for author-facing messages", () => {
    expect(
      projectRelativePath("/repo/platform/site/content", "/repo/platform"),
    ).toBe("site/content");
  });

  test("verifies a non-TPM fixture site instance outside platform and live site roots", async () => {
    const paths = resolveSiteInstancePaths({
      cwd: process.cwd(),
      siteInstanceRoot: "tests/fixtures/site-instance",
    });
    const config = parseSiteConfig(
      JSON.parse(await readFile(paths.config.site, "utf8")),
    );

    expect(paths.root).toBe(
      path.join(process.cwd(), "tests", "fixtures", "site-instance"),
    );
    expect(config.identity.title).toBe("Example Platform Site");
    const article = await readFile(
      path.join(paths.content.articles, "proof", "external-proof.md"),
      "utf8",
    );

    expect(article).toContain("External Proof");
  });
});
