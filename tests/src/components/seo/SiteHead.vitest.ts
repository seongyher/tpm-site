import { describe, expect, test } from "vitest";

import SiteHead from "../../../../src/components/seo/SiteHead.astro";
import { normalizeRouteMetadata } from "../../../../src/lib/metadata";
import { createAstroTestContainer } from "../../../helpers/astro-container";

describe("SiteHead", () => {
  test("renders canonical, Open Graph, Twitter, and title metadata", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(SiteHead, {
      props: {
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
        type: "article",
      },
    });

    expect(view).toContain("<title>Example Article</title>");
    expect(view).toContain('name="robots" content="index,follow"');
    expect(view).toContain('property="og:locale" content="en_US"');
    expect(view).toContain('name="twitter:site" content="@philo_meme"');
    expect(view).toContain('name="theme-color" content="#b65a35"');
    expect(view).toContain(
      'href="https://thephilosophersmeme.com/articles/example/"',
    );
    expect(view).toContain('property="og:type" content="article"');
    expect(view).toContain('name="twitter:card" content="summary_large_image"');
    expect(view).toContain(
      'property="og:image" content="https://thephilosophersmeme.com/_astro/example.hash.jpg"',
    );
    expect(view).toContain('property="og:image:width" content="1200"');
    expect(view).toContain('property="og:image:height" content="630"');
    expect(view).toContain('property="og:image:type" content="image/jpeg"');
    expect(view).toContain('name="twitter:image:alt" content="Example image"');
    expect(view).toContain('"@type":"WebSite"');
    expect(view).toContain(
      '"@id":"https://thephilosophersmeme.com/#publisher"',
    );
  });
});
