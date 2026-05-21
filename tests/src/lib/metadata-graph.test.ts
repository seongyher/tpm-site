import { describe, expect, test } from "bun:test";

import { normalizeRouteMetadata } from "../../../src/lib/metadata";
import { routeMetadataGraphViewModel } from "../../../src/lib/metadata-graph";
import { siteConfig } from "../../../src/lib/site-config";

describe("metadata graph view model", () => {
  test("normalizes canonical, social, feed, and JSON-LD head metadata", () => {
    const view = routeMetadataGraphViewModel({
      image: {
        alt: "Example image",
        height: 630,
        src: "/_astro/example.hash.jpg",
        type: "image/jpeg",
        width: 1200,
      },
      metadata: normalizeRouteMetadata({
        canonicalPath: "/articles/example/",
        description: "Example description.",
        kind: "article",
        title: "Example Article",
      }),
      site: "https://example.com",
      structuredData: [
        { "@id": "https://example.com/articles/example/#extra" },
      ],
      type: "article",
    });

    expect(view).toMatchObject({
      applicationName: siteConfig.identity.shortTitle,
      canonicalUrl: "https://example.com/articles/example/",
      description: "Example description.",
      feedAlternate: {
        href: "/feed.xml",
        rel: "alternate",
        title: "The Philosopher's Meme RSS",
        type: "application/rss+xml",
      },
      openGraph: {
        description: "Example description.",
        image: {
          alt: "Example image",
          height: 630,
          type: "image/jpeg",
          url: "https://example.com/_astro/example.hash.jpg",
          width: 1200,
        },
        locale: "en_US",
        siteName: "The Philosopher's Meme",
        title: "Example Article",
        type: "article",
        url: "https://example.com/articles/example/",
      },
      robots: "index,follow",
      themeColor: "#b65a35",
      title: "Example Article",
      twitter: {
        card: "summary_large_image",
        description: "Example description.",
        image: "https://example.com/_astro/example.hash.jpg",
        imageAlt: "Example image",
        site: "@philo_meme",
        title: "Example Article",
      },
    });
    expect(view.jsonLd).toContain('"@context":"https://schema.org"');
    expect(view.jsonLd).toContain('"@type":"WebSite"');
    expect(view.jsonLd).toContain(
      '"@id":"https://example.com/articles/example/#extra"',
    );
  });

  test("keeps image and feed metadata absent when unavailable or disabled", () => {
    const view = routeMetadataGraphViewModel({
      config: {
        ...siteConfig,
        features: {
          ...siteConfig.features,
          feed: false,
        },
      },
      metadata: normalizeRouteMetadata({
        canonicalPath: "/search/",
        description: "Search.",
        kind: "search",
        title: "Search",
      }),
      site: "https://example.com",
    });

    expect(view.feedAlternate).toBeUndefined();
    expect(view.openGraph.image).toBeUndefined();
    expect(view.twitter.card).toBe("summary");
    expect(view.twitter.image).toBeUndefined();
    expect(view.robots).toBe("noindex,follow");
  });
});
