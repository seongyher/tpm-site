import {
  unified,
  type UnifiedProcessorOptions,
} from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import { articleImagePolicyCacheKey } from "./src/lib/article-image-policy";
import { sitemapIncludesPath } from "./src/lib/metadata";
import { siteConfig } from "./src/lib/site-config";
import { projectRelativePath, siteInstance } from "./src/lib/site-instance";
import { siteRedirects } from "./src/lib/site-redirects";
import {
  rehypeArticleImages,
  remarkArticleImageMarkers,
} from "./src/rehype-plugins/articleImages";
import { remarkArticleReferences } from "./src/remark-plugins/articleReferences";

function sitemapPagePathname(page: string): string {
  return (
    page.replace(/^[a-z][a-z\d+\-.]*:\/\/[^/]+/iu, "").split(/[?#]/u)[0] ?? "/"
  );
}

export const markdownProcessorOptions = {
  rehypePlugins: [
    [rehypeArticleImages, { policyCacheKey: articleImagePolicyCacheKey }],
  ],
  remarkPlugins: [
    [remarkArticleImageMarkers, { policyCacheKey: articleImagePolicyCacheKey }],
    [remarkArticleReferences, { validateLegacyFootnotes: true }],
  ],
} satisfies UnifiedProcessorOptions;

export default defineConfig({
  compressHTML: true,
  image: {
    breakpoints: [384, 640, 750, 828, 1080, 1280, 1668, 2048, 2560],
    dangerouslyProcessSVG: true,
    layout: "constrained",
    responsiveStyles: false,
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => sitemapIncludesPath(sitemapPagePathname(page)),
    }),
  ],
  markdown: {
    processor: unified(markdownProcessorOptions),
  },
  outDir: siteInstance.output.dist,
  publicDir: projectRelativePath(siteInstance.public),
  prefetch: {
    defaultStrategy: "hover",
    prefetchAll: false,
  },
  prerenderConflictBehavior: "error",
  redirects: siteRedirects,
  site: siteConfig.identity.url,
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@site/assets": siteInstance.assets.root,
        "@site/theme.css": siteInstance.theme,
      },
    },
    server: {
      fs: {
        allow: [process.cwd(), siteInstance.root],
      },
    },
  },
});
