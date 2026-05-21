import { describe, expect, test } from "bun:test";

import {
  routeOutputKind,
  routeOutputPath,
  routeOwnsPathname,
  routeRegistryEntries,
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
        entry.outputPath,
      ]),
    ).toEqual([
      ["home", "home", undefined, true, "index.html"],
      ["articles", "article", undefined, true, "writing"],
      ["allArticles", "article", undefined, true, "articles/all"],
      ["announcements", "announcement", "announcements", false, "updates"],
      ["authors", "author", "authors", true, "authors"],
      ["bibliography", "bibliography", "bibliography", true, "sources"],
      ["categories", "category", "categories", true, "topics"],
      ["collections", "collection", "collections", true, "collections"],
      ["feed", "feed", "feed", false, "rss.xml"],
      ["search", "search", "search", true, "search"],
      ["tags", "tag", "tags", false, "tags"],
    ]);
  });

  test("normalizes output kinds and generated output paths", () => {
    expect(routeOutputKind("/feed.xml")).toBe("file");
    expect(routeOutputKind("/articles/")).toBe("directory");
    expect(routeOutputPath("/")).toBe("index.html");
    expect(routeOutputPath("/articles/")).toBe("articles");
    expect(routeOutputPath("/feed.xml")).toBe("feed.xml");
  });

  test("matches pathnames owned by directory and file routes", () => {
    expect(routeOwnsPathname("/updates/", "/updates/")).toBe(true);
    expect(routeOwnsPathname("/updates/site-news/", "/updates/")).toBe(true);
    expect(routeOwnsPathname("/updates-ish/", "/updates/")).toBe(false);
    expect(routeOwnsPathname("/rss.xml", "/rss.xml")).toBe(true);
    expect(routeOwnsPathname("/rss.xml/extra/", "/rss.xml")).toBe(false);
  });
});
