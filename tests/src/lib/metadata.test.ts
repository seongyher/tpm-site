import { describe, expect, test } from "bun:test";

import {
  breadcrumbEntityId,
  breadcrumbListJsonLd,
  itemListEntityId,
  itemListJsonLd,
  jsonLdGraph,
  normalizeRouteMetadata,
  publishableDiscoveryPolicy,
  publisherEntityId,
  routeDiscoveryPolicy,
  routeEntityId,
  routeRobotsPolicy,
  siteIdentityJsonLd,
  sitemapIncludesPath,
  siteRootUrl,
  webPageEntityId,
  webPageJsonLd,
  websiteEntityId,
} from "../../../src/lib/metadata";

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

  test("builds item lists and breadcrumb lists from visible route items", () => {
    const site = "https://example.com";

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
