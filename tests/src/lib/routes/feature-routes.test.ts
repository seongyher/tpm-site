import { describe, expect, test } from "bun:test";

import {
  optionalFeatureRouteEntries,
  optionalRouteOwnsPathname,
} from "../../../../src/lib/routes/feature-routes";
import { parseSiteConfig } from "../../../../src/lib/site/site-config";

const config = parseSiteConfig({
  features: {
    announcements: false,
    feed: false,
    tags: false,
  },
  identity: {
    description: "A configurable publication.",
    language: "en",
    title: "Example Blog",
    url: "https://example.com",
  },
  navigation: {
    footer: [],
    primary: [],
  },
  routes: {
    allArticles: "/articles/all/",
    announcements: "/updates/",
    articles: "/writing/",
    authors: "/authors/",
    bibliography: "/sources/",
    categories: "/topics/",
    collections: "/collections/",
    feed: "/rss.xml",
    home: "/",
    search: "/search/",
    tags: "/tags/",
  },
  support: {
    block: {
      body: "Keep publishing going.",
      title: "Support Example Blog",
    },
    discord: {
      href: "https://discord.gg/example",
      label: "Join Discord",
    },
    patreon: {
      href: "https://patreon.com/example",
      label: "Support Us",
    },
  },
});

describe("optional feature routes", () => {
  test("normalizes disabled feature routes to generated output paths", () => {
    expect(
      optionalFeatureRouteEntries(config)
        .filter((entry) => !entry.enabled)
        .map((entry) => [entry.feature, entry.outputPath, entry.outputKind]),
    ).toEqual([
      ["announcements", "updates", "directory"],
      ["feed", "rss.xml", "file"],
      ["tags", "tags", "directory"],
    ]);
  });

  test("matches sitemap pathnames owned by optional route roots", () => {
    expect(optionalRouteOwnsPathname("/updates/", "/updates/")).toBe(true);
    expect(optionalRouteOwnsPathname("/updates/site-news/", "/updates/")).toBe(
      true,
    );
    expect(optionalRouteOwnsPathname("/updates-ish/", "/updates/")).toBe(false);
    expect(optionalRouteOwnsPathname("/rss.xml", "/rss.xml")).toBe(true);
    expect(optionalRouteOwnsPathname("/rss.xml/extra/", "/rss.xml")).toBe(
      false,
    );
  });
});
