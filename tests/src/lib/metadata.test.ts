import { describe, expect, test } from "bun:test";

import {
  breadcrumbEntityId,
  breadcrumbListJsonLd,
  itemListEntityId,
  itemListJsonLd,
  jsonLdGraph,
  normalizeRouteMetadata,
  profileEntityJsonLd,
  publishableDiscoveryPolicy,
  publisherEntityId,
  routeDiscoveryPolicy,
  routeEntityId,
  type RouteMetadataKind,
  routeRobotsPolicy,
  siteIdentityJsonLd,
  sitemapIncludesPath,
  siteRootUrl,
  webPageEntityId,
  webPageJsonLd,
  websiteEntityId,
} from "../../../src/lib/metadata";
import { siteConfig } from "../../../src/lib/site-config";

describe("metadata contract", () => {
  test("normalizes indexable public route metadata", () => {
    expect(
      normalizeRouteMetadata({
        canonicalPath: "/articles/",
        description: "Browse articles.",
        kind: "articles-index",
        title: "Articles",
      }),
    ).toEqual({
      canonicalPath: "/articles/",
      description: "Browse articles.",
      discovery: {
        contentIndex: true,
        feed: false,
        sitemap: true,
      },
      kind: "articles-index",
      robots: "index,follow",
      title: "Articles",
    });
  });

  test("keeps utility routes out of indexable discovery surfaces", () => {
    expect(routeRobotsPolicy("search")).toBe("noindex,follow");
    expect(routeRobotsPolicy("not-found")).toBe("noindex,follow");
    expect(routeRobotsPolicy("catalog")).toBe("noindex,follow");
    expect(routeDiscoveryPolicy("search")).toEqual({
      contentIndex: false,
      feed: false,
      sitemap: false,
    });
  });

  test("assigns route families to explicit Schema.org webpage types", () => {
    const expectedTypes = new Map<RouteMetadataKind, string>([
      ["announcement", "WebPage"],
      ["announcements-index", "CollectionPage"],
      ["article", "WebPage"],
      ["articles-archive", "CollectionPage"],
      ["articles-index", "CollectionPage"],
      ["author-index", "WebPage"],
      ["author-profile", "ProfilePage"],
      ["bibliography", "CollectionPage"],
      ["catalog", "WebPage"],
      ["category-detail", "CollectionPage"],
      ["category-index", "CollectionPage"],
      ["collection-detail", "CollectionPage"],
      ["collection-index", "CollectionPage"],
      ["home", "WebPage"],
      ["not-found", "WebPage"],
      ["page", "WebPage"],
      ["redirect", "WebPage"],
      ["search", "WebPage"],
      ["tag-detail", "CollectionPage"],
      ["tag-index", "CollectionPage"],
    ]);

    for (const [kind, schemaType] of expectedTypes) {
      const metadata = normalizeRouteMetadata({
        canonicalPath: `/${kind}/`,
        description: `${kind} description.`,
        kind,
        title: `${kind} title`,
      });
      const options =
        kind === "author-profile"
          ? {
              mainEntity: {
                "@type": "Person",
                name: `${kind} author`,
              },
            }
          : undefined;

      expect(
        webPageJsonLd(metadata, "https://example.com", siteConfig, options),
      ).toMatchObject({
        "@type": schemaType,
        name: `${kind} title`,
      });
    }
  });

  test("requires ProfilePage mainEntity metadata to describe an author profile", () => {
    const metadata = normalizeRouteMetadata({
      canonicalPath: "/authors/example/",
      description: "Example author profile.",
      kind: "author-profile",
      title: "Example Author",
    });
    const author = profileEntityJsonLd(
      {
        href: "/authors/example/",
        name: "Example Author",
        type: "person",
      },
      "https://example.com",
    );

    expect(() => webPageJsonLd(metadata, "https://example.com")).toThrow(
      "ProfilePage JSON-LD requires a mainEntity Person or Organization.",
    );
    expect(
      webPageJsonLd(metadata, "https://example.com", siteConfig, {
        mainEntity: author,
      }),
    ).toMatchObject({
      "@id": "https://example.com/authors/example/#webpage",
      "@type": "ProfilePage",
      mainEntity: author,
    });
    expect(() =>
      webPageJsonLd(metadata, "https://example.com", siteConfig, {
        mainEntity: {
          "@type": "Thing",
          name: "Example Author",
        },
      }),
    ).toThrow("ProfilePage mainEntity must be a Person or Organization");
  });

  test("keeps non-indexable and archive-like routes out of the right discovery surfaces", () => {
    expect(routeDiscoveryPolicy("articles-archive")).toEqual({
      contentIndex: false,
      feed: false,
      sitemap: true,
    });
    expect(routeDiscoveryPolicy("bibliography")).toEqual({
      contentIndex: false,
      feed: false,
      sitemap: true,
    });
    expect(routeDiscoveryPolicy("redirect")).toEqual({
      contentIndex: false,
      feed: false,
      sitemap: false,
    });
    expect(routeDiscoveryPolicy("redirect", "noindex,follow")).toEqual({
      contentIndex: false,
      feed: false,
      sitemap: false,
    });
  });

  test("maps article-like visibility to sitemap, feed, and content index policy", () => {
    expect(
      publishableDiscoveryPolicy({
        directory: true,
        feed: false,
        search: true,
      }),
    ).toEqual({
      contentIndex: true,
      feed: false,
      sitemap: true,
    });
  });

  test("excludes known noindex routes from sitemap paths", () => {
    expect(sitemapIncludesPath("/articles/")).toBe(true);
    expect(sitemapIncludesPath("/search/")).toBe(false);
    expect(sitemapIncludesPath("/search/index.html")).toBe(false);
    expect(sitemapIncludesPath("/404/")).toBe(false);
    expect(sitemapIncludesPath("/catalog/buttons/")).toBe(false);
  });

  test("builds stable site and route entity IDs", () => {
    const site = "https://example.com";

    expect(siteRootUrl(site)).toBe("https://example.com/");
    expect(websiteEntityId(site)).toBe("https://example.com/#website");
    expect(publisherEntityId(site)).toBe("https://example.com/#publisher");
    expect(routeEntityId("/articles/post/", "article", site)).toBe(
      "https://example.com/articles/post/#article",
    );
    expect(webPageEntityId("/articles/post/", site)).toBe(
      "https://example.com/articles/post/#webpage",
    );
    expect(itemListEntityId("/articles/", site)).toBe(
      "https://example.com/articles/#itemlist",
    );
    expect(breadcrumbEntityId("/articles/post/", site)).toBe(
      "https://example.com/articles/post/#breadcrumb",
    );
  });

  test("builds site identity and route webpage JSON-LD graph nodes", () => {
    const site = "https://example.com";
    const metadata = normalizeRouteMetadata({
      canonicalPath: "/articles/",
      description: "Browse articles.",
      kind: "articles-index",
      title: "Articles",
    });

    const graph = jsonLdGraph([
      ...siteIdentityJsonLd(site),
      webPageJsonLd(metadata, site),
    ]);
    if (graph === undefined) {
      throw new Error("Expected metadata graph");
    }
    const nodes = graph["@graph"];

    expect(graph["@context"]).toBe("https://schema.org");
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@id": "https://example.com/#publisher",
          "@type": "Organization",
          name: "The Philosopher's Meme",
        }),
        expect.objectContaining({
          "@id": "https://example.com/#website",
          "@type": "WebSite",
        }),
        expect.objectContaining({
          "@id": "https://example.com/articles/#webpage",
          "@type": "CollectionPage",
          isPartOf: { "@id": "https://example.com/#website" },
          name: "Articles",
        }),
      ]),
    );
  });

  test("builds compact identity and profile nodes from configurable site facts", () => {
    expect(
      siteIdentityJsonLd("https://example.com", {
        ...siteConfig,
        identity: {
          ...siteConfig.identity,
          description: "Example description.",
          language: "en",
          logo: "/logo.svg",
          publisherName: "Example Person",
          publisherType: "person",
          sameAs: ["https://example.com/social"],
          shortTitle: "Example",
          title: "Example Site",
          url: "https://example.com",
        },
      }),
    ).toEqual([
      {
        "@id": "https://example.com/#publisher",
        "@type": "Person",
        logo: {
          "@type": "ImageObject",
          url: "https://example.com/logo.svg",
        },
        name: "Example Person",
        sameAs: ["https://example.com/social"],
        url: "https://example.com/",
      },
      {
        "@id": "https://example.com/#website",
        "@type": "WebSite",
        alternateName: "Example",
        description: "Example description.",
        inLanguage: "en",
        name: "Example Site",
        publisher: { "@id": "https://example.com/#publisher" },
        url: "https://example.com/",
      },
    ]);

    expect(
      profileEntityJsonLd(
        {
          description: "Collective profile.",
          href: "/authors/group/",
          name: "The Group",
          sameAs: ["https://example.com/group"],
          type: "collective",
        },
        "https://example.com",
      ),
    ).toEqual({
      "@id": "https://example.com/authors/group/#author",
      "@type": "Organization",
      description: "Collective profile.",
      name: "The Group",
      sameAs: ["https://example.com/group"],
      url: "https://example.com/authors/group/",
    });
  });

  test("builds item lists and breadcrumb lists from visible route items", () => {
    const site = "https://example.com";

    expect(itemListJsonLd("/articles/", [], site)).toBeUndefined();
    expect(
      breadcrumbListJsonLd(
        "/articles/one/",
        [{ href: "/", title: "Home" }],
        site,
      ),
    ).toBeUndefined();
    expect(jsonLdGraph([{}, { "@type": "Thing" }])).toEqual({
      "@context": "https://schema.org",
      "@graph": [{ "@type": "Thing" }],
    });
    expect(jsonLdGraph([{}])).toBeUndefined();

    expect(
      itemListJsonLd(
        "/articles/",
        [
          {
            description: "First article.",
            href: "/articles/one/",
            title: "One",
          },
        ],
        site,
      ),
    ).toEqual({
      "@id": "https://example.com/articles/#itemlist",
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          description: "First article.",
          name: "One",
          position: 1,
          url: "https://example.com/articles/one/",
        },
      ],
      numberOfItems: 1,
    });

    expect(
      breadcrumbListJsonLd(
        "/articles/one/",
        [
          { href: "/", title: "Home" },
          { href: "/articles/", title: "Articles" },
          { href: "/articles/one/", title: "One" },
        ],
        site,
      ),
    ).toEqual({
      "@id": "https://example.com/articles/one/#breadcrumb",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          item: "https://example.com/",
          name: "Home",
          position: 1,
        },
        {
          "@type": "ListItem",
          item: "https://example.com/articles/",
          name: "Articles",
          position: 2,
        },
        {
          "@type": "ListItem",
          item: "https://example.com/articles/one/",
          name: "One",
          position: 3,
        },
      ],
    });
  });
});
