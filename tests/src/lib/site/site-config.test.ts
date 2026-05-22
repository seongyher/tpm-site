import { describe, expect, test } from "bun:test";

import {
  parseSiteConfig,
  type SiteConfig,
  siteConfig,
  siteShareTargetIds,
  titleWithSite,
} from "../../../../src/lib/site/site-config";
import {
  defaultMetadataConfig,
  defaultPublishableVisibilityConfig,
} from "../../../../src/lib/site/site-config-defaults";

const validConfig = {
  identity: {
    description: "A configurable publication.",
    language: "en",
    title: "Example Blog",
    url: "https://example.com",
  },
  homepage: {
    announcementLimit: 2,
    featuredCollection: "featured",
    recentLimit: 6,
    startHereCollection: "start-here",
  },
  navigation: {
    footer: [{ href: "/feed.xml", label: "RSS" }],
    primary: [{ href: "/articles/", label: "Articles" }],
  },
  routes: {
    allArticles: "/articles/all/",
    announcements: "/announcements/",
    articles: "/articles/",
    authors: "/authors/",
    bibliography: "/bibliography/",
    categories: "/categories/",
    collections: "/collections/",
    feed: "/feed.xml",
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
      compactLabel: "Patreon",
      href: "https://patreon.com/example",
      label: "Support Us",
    },
  },
} as const;

describe("site config", () => {
  test("loads the current TPM site config from the site directory", () => {
    expect(siteConfig.identity.title).toBe("The Philosopher's Meme");
    expect(siteConfig.identity.url).toBe("https://thephilosophersmeme.com");
    expect(siteConfig.identity.locale).toBe("en_US");
    expect(siteConfig.identity.publisherType).toBe("organization");
    expect(siteConfig.identity.logo).toBe("/favicon.svg?v=2");
    expect(siteConfig.identity.themeColor).toBe("#b65a35");
    expect(siteConfig.identity.sameAs).toContain("https://x.com/philo_meme");
    expect(siteConfig.navigation.primary).toEqual([
      { href: "/articles/", label: "Articles" },
      { href: "/about/", label: "About" },
    ]);
    expect(siteConfig.support.patreon.href).toBe(
      "https://patreon.com/thephilosophersmeme",
    );
    expect(siteConfig.homepage).toEqual({
      announcementLimit: 3,
      discoveryLinks: [
        { label: "Articles", route: "articles" },
        { label: "Archive", route: "allArticles" },
        { label: "Authors", route: "authors" },
        { label: "Collections", route: "collections" },
        { label: "Tags", route: "tags" },
      ],
      emptyText: {
        announcements: "Announcements will appear here.",
        categories: "No categories are available yet.",
        featured: "Featured items will appear here.",
        startHere: "Curated starter articles will appear here.",
      },
      featuredCollection: "featured",
      labels: {
        announcements: "Announcements",
        categories: "Categories",
        featured: "Featured Articles",
        read: "Read",
        recent: "Recent",
        startHere: "Start Here",
      },
      recentLimit: 8,
      startHereCollection: "start-here",
    });
    expect(siteConfig.features.pdf).toBe(true);
    expect(siteConfig.features.support).toBe(true);
    expect(siteConfig.contentDefaults.articles.pdf.enabled).toBe(true);
    expect(siteConfig.contentDefaults.announcements.visibility.search).toBe(
      true,
    );
    expect(siteConfig.share.targets).toEqual(Array.from(siteShareTargetIds));
    expect(siteConfig.share.xViaHandle).toBe("philo_meme");
  });

  test("parses a non-TPM blog config with default share, feature, and content settings", () => {
    const parsed: SiteConfig = parseSiteConfig(validConfig);

    expect(parsed.identity.title).toBe("Example Blog");
    expect(parsed.identity.locale).toBe("en_US");
    expect(parsed.identity.publisherType).toBe("organization");
    expect(parsed.identity.sameAs).toEqual([]);
    expect(parsed.share).toEqual({ targets: Array.from(siteShareTargetIds) });
    expect(parsed.metadata).toEqual({
      semanticProfiles: {
        enabled: Array.from(defaultMetadataConfig.semanticProfiles.enabled),
      },
    });
    expect(parsed.features.search).toBe(true);
    expect(parsed.homepage.discoveryLinks).toEqual([
      { label: "Articles", route: "articles" },
      { label: "Archive", route: "allArticles" },
      { label: "Authors", route: "authors" },
      { label: "Collections", route: "collections" },
      { label: "Tags", route: "tags" },
    ]);
    expect(parsed.contentDefaults.articles).toEqual({
      draft: false,
      pdf: { enabled: true },
      visibility: defaultPublishableVisibilityConfig,
    });
    expect(parsed.navigation.footer).toEqual([
      { href: "/feed.xml", label: "RSS" },
    ]);
  });

  test("parses homepage discovery links, metadata, and ordered share target overrides", () => {
    const parsed = parseSiteConfig({
      ...validConfig,
      homepage: {
        ...validConfig.homepage,
        discoveryLinks: [
          { label: "Essays", route: "articles" },
          { href: "https://example.com/newsletter", label: "Newsletter" },
        ],
        labels: {
          read: "Explore",
        },
      },
      metadata: {
        semanticProfiles: {
          enabled: ["review", "event"],
        },
      },
      share: {
        targets: ["reddit", "x"],
      },
    });

    expect(parsed.homepage.discoveryLinks).toEqual([
      { label: "Essays", route: "articles" },
      { href: "https://example.com/newsletter", label: "Newsletter" },
    ]);
    expect(parsed.homepage.labels).toMatchObject({
      categories: "Categories",
      read: "Explore",
    });
    expect(parsed.metadata.semanticProfiles.enabled).toEqual([
      "review",
      "event",
    ]);
    expect(parsed.share.targets).toEqual(["reddit", "x"]);
  });

  test("rejects ambiguous homepage links and duplicate share targets", () => {
    expect(() =>
      parseSiteConfig({
        ...validConfig,
        homepage: {
          ...validConfig.homepage,
          discoveryLinks: [
            { href: "/articles/", label: "Articles", route: "articles" },
          ],
        },
      }),
    ).toThrow(/homepage\.discoveryLinks\.0\.route/u);

    expect(() =>
      parseSiteConfig({
        ...validConfig,
        share: {
          targets: ["reddit", "reddit"],
        },
      }),
    ).toThrow(/share\.targets/u);

    expect(() =>
      parseSiteConfig({
        ...validConfig,
        metadata: {
          semanticProfiles: {
            enabled: ["review", "review"],
          },
        },
      }),
    ).toThrow(/metadata\.semanticProfiles\.enabled/u);
  });

  test("parses webmaster-owned feature and content defaults", () => {
    const parsed = parseSiteConfig({
      ...validConfig,
      contentDefaults: {
        announcements: {
          visibility: {
            search: false,
          },
        },
        articles: {
          pdf: {
            enabled: false,
          },
          visibility: {
            feed: false,
          },
        },
      },
      features: {
        pdf: false,
        support: false,
      },
    });

    expect(parsed.features).toMatchObject({
      pdf: false,
      search: true,
      support: false,
    });
    expect(parsed.contentDefaults.announcements).toEqual({
      draft: false,
      visibility: {
        ...defaultPublishableVisibilityConfig,
        feed: true,
        homepage: true,
        search: false,
      },
    });
    expect(parsed.contentDefaults.articles).toEqual({
      draft: false,
      pdf: { enabled: false },
      visibility: {
        ...defaultPublishableVisibilityConfig,
        feed: false,
        homepage: true,
        search: true,
      },
    });
  });

  test("rejects malformed links with path-aware errors", () => {
    const invalidConfig = {
      ...validConfig,
      navigation: {
        ...validConfig.navigation,
        primary: [{ href: "articles", label: "Articles" }],
      },
    };

    expect(() => parseSiteConfig(invalidConfig)).toThrow(
      /navigation\.primary\.0\.href/u,
    );
  });

  test("rejects non-path route values", () => {
    const invalidConfig = {
      ...validConfig,
      routes: {
        ...validConfig.routes,
        articles: "articles",
      },
    };

    expect(() => parseSiteConfig(invalidConfig)).toThrow(/routes\.articles/u);
  });

  test("builds titles with the configured site suffix", () => {
    expect(titleWithSite("Articles")).toBe("Articles | The Philosopher's Meme");
  });
});
