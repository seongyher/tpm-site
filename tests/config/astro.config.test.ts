import { describe, expect, test } from "bun:test";

import config, { markdownProcessorOptions } from "../../astro.config";
import { articleImagePolicyCacheKey } from "../../src/lib/article-image-policy";
import { siteInstance } from "../../src/lib/site-instance";
import {
  rehypeArticleImages,
  remarkArticleImageMarkers,
} from "../../src/rehype-plugins/articleImages";
import { remarkArticleReferences } from "../../src/remark-plugins/articleReferences";

describe("Astro config", () => {
  test("keeps static-site production invariants explicit", () => {
    expect(config.site).toBe("https://thephilosophersmeme.com");
    expect(config.trailingSlash).toBe("always");
    expect(config.compressHTML).toBe(true);
    expect(config.image).toMatchObject({
      breakpoints: [384, 640, 750, 828, 1080, 1280, 1668, 2048, 2560],
      dangerouslyProcessSVG: true,
      layout: "constrained",
      responsiveStyles: false,
    });
    expect(config.prefetch).toEqual({
      defaultStrategy: "hover",
      prefetchAll: false,
    });
    expect(config.prerenderConflictBehavior).toBe("error");
    expect(config.publicDir).toBe("site/public");
    expect(config.vite?.resolve?.alias).toMatchObject({
      "@site/assets": siteInstance.assets.root,
      "@site/theme.css": siteInstance.theme,
    });
  });

  test("keeps legacy redirects separate from article routing helpers", () => {
    expect(config.redirects?.["/2021/05/16/gamergate-as-metagaming/"]).toBe(
      "/articles/gamergate-as-metagaming/",
    );
  });

  test("runs article references through the Markdown pipeline with strict legacy validation", () => {
    expect(config.markdown?.processor?.name).toBe("unified");
    expect(markdownProcessorOptions.remarkPlugins).not.toContain(
      remarkArticleReferences,
    );
    expect(markdownProcessorOptions.remarkPlugins).toContainEqual([
      remarkArticleReferences,
      { validateLegacyFootnotes: true },
    ]);
  });

  test("runs editorial article image handling before Astro optimizes Markdown images", () => {
    expect(markdownProcessorOptions.remarkPlugins).toContainEqual([
      remarkArticleImageMarkers,
      { policyCacheKey: articleImagePolicyCacheKey },
    ]);
    expect(markdownProcessorOptions.rehypePlugins).toContainEqual([
      rehypeArticleImages,
      { policyCacheKey: articleImagePolicyCacheKey },
    ]);
  });
});
