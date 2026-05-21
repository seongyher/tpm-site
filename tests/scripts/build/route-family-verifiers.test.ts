import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, test } from "bun:test";

import {
  verifyFeedXml,
  verifyHtmlInternalLinks,
  verifyLegacyRedirectFallbackHtml,
  verifyMissingLegacyRedirectFallbacks,
  verifyRenderedRoutePath,
  verifyRequiredRouteOutputs,
  verifySitemapXml,
} from "../../../scripts/build/verify-build";

async function withTempDist<T>(callback: (distDir: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), "tpm-route-family-"));

  try {
    const distDir = path.join(root, "dist");
    await mkdir(distDir, { recursive: true });

    return await callback(distDir);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

async function writeDistFile(
  distDir: string,
  relativePath: string,
  text = "",
): Promise<void> {
  const fullPath = path.join(distDir, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, text);
}

describe("route-family verifier modules", () => {
  test("emits route diagnostics for missing output and dated pages", async () =>
    withTempDist(async (distDir) => {
      await writeDistFile(distDir, "index.html");

      const missingDiagnostics = await verifyRequiredRouteOutputs({
        distDir,
        requiredPaths: ["index.html", "articles/example/index.html"],
      });
      const datedDiagnostics = verifyRenderedRoutePath({
        isRedirectFallback: false,
        relativeHtmlPath: "2021/11/30/what-is-a-meme/index.html",
      });

      expect(missingDiagnostics).toMatchObject([
        {
          code: "route.required-output-missing",
          location: { outputPath: "articles/example/index.html" },
          message: "articles/example/index.html",
          moduleId: "build.routes",
          severity: "error",
        },
      ]);
      expect(datedDiagnostics).toMatchObject([
        {
          code: "route.dated-page-unexpected",
          location: {
            outputPath: "2021/11/30/what-is-a-meme/index.html",
          },
          message: "2021/11/30/what-is-a-meme/index.html",
          moduleId: "build.routes",
        },
      ]);
    }));

  test("emits link diagnostics only for missing local targets", async () =>
    withTempDist(async (distDir) => {
      await writeDistFile(distDir, "articles/present/index.html");
      await writeDistFile(distDir, "_astro/image.webp");

      const diagnostics = await verifyHtmlInternalLinks({
        distDir,
        html: [
          '<a href="/articles/present/">Present</a>',
          '<a href="/missing/">Missing</a>',
          '<a href="#local">Fragment</a>',
          '<a href="https://example.com/">External</a>',
          '<img src="/_astro/image.webp" alt="">',
        ].join(""),
        relativeHtmlPath: "index.html",
      });

      expect(diagnostics).toMatchObject([
        {
          code: "link.internal-target-missing",
          location: { outputPath: "index.html" },
          message: "index.html -> /missing/",
          moduleId: "build.links",
          owner: "content",
        },
      ]);
    }));

  test("emits redirect diagnostics for missing and invalid legacy fallbacks", async () =>
    withTempDist(async (distDir) => {
      const missingDiagnostics = await verifyMissingLegacyRedirectFallbacks({
        distDir,
        expectedRedirects: {
          "/2017/09/09/the-meta-ironic-era/": "/articles/the-meta-ironic-era/",
        },
      });
      const invalidDiagnostics = verifyLegacyRedirectFallbackHtml({
        expectedRedirects: {},
        html: "<html></html>",
        relativeHtmlPath: "2017/09/09/the-meta-ironic-era/index.html",
      });

      expect(missingDiagnostics).toMatchObject([
        {
          code: "redirect.legacy-fallback-missing",
          location: { route: "/2017/09/09/the-meta-ironic-era/" },
          message:
            "/2017/09/09/the-meta-ironic-era/ -> /articles/the-meta-ironic-era/ (2017/09/09/the-meta-ironic-era/index.html)",
          moduleId: "build.redirects",
        },
      ]);
      expect(invalidDiagnostics).toMatchObject([
        {
          code: "redirect.legacy-fallback-invalid",
          location: {
            outputPath: "2017/09/09/the-meta-ironic-era/index.html",
          },
          message:
            "2017/09/09/the-meta-ironic-era/index.html: no matching redirect in astro.config.ts for /2017/09/09/the-meta-ironic-era/",
          moduleId: "build.redirects",
        },
      ]);
    }));

  test("emits feed diagnostics for RSS item enclosures", () => {
    expect(
      verifyFeedXml({
        relativePath: "feed.xml",
        xml: '<rss><channel><item><enclosure url="/raw.png" /></item></channel></rss>',
      }),
    ).toMatchObject([
      {
        code: "feed.enclosure-unexpected",
        location: { outputPath: "feed.xml" },
        message: "feed.xml: RSS feed must not include item enclosures; found 1",
        moduleId: "build.feed",
      },
    ]);
  });

  test("emits sitemap diagnostics for invalid and noindex loc entries", () => {
    expect(
      verifySitemapXml({
        relativePath: "sitemap-0.xml",
        xml: [
          "<urlset>",
          "<url><loc>not-a-url</loc></url>",
          "<url><loc>https://thephilosophersmeme.com/search/</loc></url>",
          "</urlset>",
        ].join(""),
      }),
    ).toMatchObject([
      {
        code: "sitemap.loc-invalid",
        location: { outputPath: "sitemap-0.xml", url: "not-a-url" },
        message: "sitemap-0.xml: sitemap contains invalid URL not-a-url",
        moduleId: "build.sitemap",
      },
      {
        code: "sitemap.noindex-route-included",
        location: { outputPath: "sitemap-0.xml", route: "/search/" },
        message: "sitemap-0.xml: sitemap includes noindex route /search/",
        moduleId: "build.sitemap",
      },
    ]);
  });
});
