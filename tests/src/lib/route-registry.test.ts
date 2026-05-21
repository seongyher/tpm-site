import { describe, expect, test } from "bun:test";

import {
  routeChildIndexOutputPath,
  routeFeatureEnabled,
  routeIndexOutputPath,
  routeOutputKind,
  routeOutputPath,
  routeOwnsPathname,
  type RouteRegistryEntityKind,
  routeRegistryEntries,
  routeRegistryEntryForKey,
  type RouteRegistryPattern,
  type RouteRegistrySurface,
} from "../../../src/lib/route-registry";
import { parseSiteConfig } from "../../../src/lib/site-config";

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

describe("route registry", () => {
  test("registers configured routes with entity and feature ownership", () => {
    expect(
      routeRegistryEntries(config).map((entry) => [
        entry.routeKey,
        entry.entity,
        entry.feature,
        entry.enabled,
        entry.artifactKey,
        entry.outputPath,
        entry.pattern,
      ]),
    ).toEqual([
      ["home", "home", undefined, true, "output.routes", "index.html", "root"],
      [
        "articles",
        "article",
        undefined,
        true,
        "output.routes",
        "writing",
        "entry-root",
      ],
      [
        "allArticles",
        "article",
        undefined,
        true,
        "output.routes",
        "articles/all",
        "index",
      ],
      [
        "announcements",
        "announcement",
        "announcements",
        false,
        "output.routes",
        "updates",
        "entry-root",
      ],
      [
        "authors",
        "author",
        "authors",
        true,
        "output.routes",
        "authors",
        "entry-root",
      ],
      [
        "bibliography",
        "bibliography",
        "bibliography",
        true,
        "output.routes",
        "sources",
        "index",
      ],
      [
        "categories",
        "category",
        "categories",
        true,
        "output.routes",
        "topics",
        "entry-root",
      ],
      [
        "collections",
        "collection",
        "collections",
        true,
        "output.routes",
        "collections",
        "entry-root",
      ],
      ["feed", "feed", "feed", false, "output.feed", "rss.xml", "file"],
      [
        "search",
        "search",
        "search",
        true,
        "output.searchIndex",
        "search",
        "index",
      ],
      ["tags", "tag", "tags", false, "output.routes", "tags", "entry-root"],
    ]);
  });

  test("normalizes output kinds and generated output paths", () => {
    expect(routeOutputKind("/feed.xml")).toBe("file");
    expect(routeOutputKind("/articles/")).toBe("directory");
    expect(routeOutputPath("/")).toBe("index.html");
    expect(routeOutputPath("/articles/")).toBe("articles");
    expect(routeOutputPath("/feed.xml")).toBe("feed.xml");
    expect(routeIndexOutputPath("/articles/")).toBe("articles/index.html");
    expect(routeChildIndexOutputPath("/articles/", "post")).toBe(
      "articles/post/index.html",
    );
  });

  test("matches pathnames owned by directory and file routes", () => {
    expect(routeOwnsPathname("/updates/", "/updates/")).toBe(true);
    expect(routeOwnsPathname("/updates/site-news/", "/updates/")).toBe(true);
    expect(routeOwnsPathname("/updates-ish/", "/updates/")).toBe(false);
    expect(routeOwnsPathname("/rss.xml", "/rss.xml")).toBe(true);
    expect(routeOwnsPathname("/rss.xml/extra/", "/rss.xml")).toBe(false);
  });

  test("exposes route surfaces for diagnostics and generated output consumers", () => {
    const feed = routeRegistryEntryForKey(config, "feed");
    const tags = routeRegistryEntryForKey(config, "tags");
    const entity: RouteRegistryEntityKind = "feed";
    const pattern: RouteRegistryPattern = "file";
    const surface: RouteRegistrySurface = "feed";

    expect(feed.artifactKey).toBe("output.feed");
    expect(feed.entity).toBe(entity);
    expect(feed.outputKind).toBe("file");
    expect(feed.pattern).toBe(pattern);
    expect(feed.surfaces).toContain(surface);
    expect(feed.surfaces).toContain("validation");
    expect(routeFeatureEnabled(config, feed.feature)).toBe(false);
    expect(routeFeatureEnabled(config, undefined)).toBe(true);
    expect(tags.enabled).toBe(false);
    expect(tags.surfaces).toContain("disabled-feature-diagnostic");
  });
});
