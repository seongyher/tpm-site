import { describe, expect, test } from "bun:test";

import {
  defaultContentDefaultsConfig,
  defaultFeatureConfig,
  defaultHomepageConfig,
  defaultHomepageDiscoveryLinksConfig,
  defaultPublishableVisibilityConfig,
  siteRouteKeys,
  siteShareTargetIds,
} from "../../../src/lib/site-config-defaults";

describe("site config defaults", () => {
  test("exposes the complete route and share key sets used by config schemas", () => {
    expect(siteRouteKeys).toContain("home");
    expect(siteRouteKeys).toContain("collections");
    expect(siteRouteKeys).toContain("bibliography");
    expect(siteShareTargetIds).toEqual([
      "bluesky",
      "x",
      "threads",
      "facebook",
      "linkedin",
      "reddit",
      "hacker-news",
      "pinterest",
    ]);
  });

  test("keeps homepage defaults site-owner editable but platform-safe", () => {
    expect(defaultHomepageConfig).toMatchObject({
      announcementLimit: 3,
      featuredCollection: "featured",
      recentLimit: 8,
      startHereCollection: "start-here",
    });
    expect(defaultHomepageDiscoveryLinksConfig).toEqual([
      { label: "Articles", route: "articles" },
      { label: "Archive", route: "allArticles" },
      { label: "Authors", route: "authors" },
      { label: "Collections", route: "collections" },
      { label: "Tags", route: "tags" },
    ]);
  });

  test("keeps visibility and feature defaults explicit", () => {
    expect(defaultFeatureConfig.support).toBe(true);
    expect(defaultFeatureConfig).not.toHaveProperty("pdf");
    expect(defaultPublishableVisibilityConfig).toEqual({
      directory: true,
      feed: true,
      homepage: true,
      search: true,
    });
    expect(defaultContentDefaultsConfig.articles).not.toHaveProperty("pdf");
    expect(defaultContentDefaultsConfig.announcements.visibility).toEqual(
      defaultPublishableVisibilityConfig,
    );
  });
});
