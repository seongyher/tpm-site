import type { ImageMetadata } from "astro";
import { describe, expect, test } from "vitest";

import HomeFeaturedCarousel from "../../../../../src/components/blocks/home/HomeFeaturedCarousel.astro";
import HomeFeaturedSlide from "../../../../../src/components/blocks/home/HomeFeaturedSlide.astro";
import type { HomeFeaturedItem } from "../../../../../src/lib/content/home";
import {
  createAstroTestContainer,
  testSiteUrl,
} from "../../../../helpers/astro-container";

describe("HomeFeaturedCarousel", () => {
  test("renders a static single featured item without controls", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeFeaturedCarousel, {
      props: { itemCount: 1 },
      request: new Request(`${testSiteUrl}/`),
      slots: {
        default: "<article data-home-featured-slide>Feature</article>",
      },
    });

    expect(view).toContain('aria-label="Featured Articles"');
    expect(view).toContain("Feature");
    expect(view).toContain("lg:grid-rows-[minmax(0,1fr)_auto]");
    expect(view).toContain("min-h-80");
    expect(view).toContain("content-start");
    expect(view).toContain('aria-live="off"');
    expect(view).not.toContain("content-center");
    expect(view).not.toContain("data-home-featured-next");
  });

  test("renders progressive controls for multiple featured items", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeFeaturedCarousel, {
      props: { itemCount: 2 },
      request: new Request(`${testSiteUrl}/`),
      slots: {
        default:
          "<article data-home-featured-slide>One</article><article data-home-featured-slide hidden>Two</article>",
      },
    });

    expect(view).toContain("data-home-featured-next");
    expect(view.indexOf("data-home-featured-previous")).toBeLessThan(
      view.indexOf("data-home-featured-indicators"),
    );
    expect(view.indexOf("data-home-featured-indicators")).toBeLessThan(
      view.indexOf("data-home-featured-next"),
    );
    expect(view).toContain("data-home-featured-indicator");
    expect(view).toContain("size-6");
    expect(view).toContain("size-2");
    expect(view).toContain("home-featured-carousel");
  });
});

describe("HomeFeaturedSlide", () => {
  test("renders article feature metadata and inherited description", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeFeaturedSlide, {
      props: {
        index: 0,
        item: featuredItem({
          category: { href: "/categories/culture/", title: "Culture" },
          date: "May 5, 2026",
          description: "Inherited article description.",
          href: "/articles/what-is-a-meme/",
          image: {
            alt: "Example feature image",
            src: imageMetadata("/feature.png"),
          },
          kind: "article",
          note: "Optional editorial copy.",
          title: "What Is a Meme?",
        }),
      },
      request: new Request(`${testSiteUrl}/`),
    });

    expect(view).toContain("What Is a Meme?");
    expect(view).toContain("Culture");
    expect(view).toContain("Inherited article description.");
    expect(view).toContain("Optional editorial copy.");
    expect(view).toContain("data-[home-featured-active=false]:invisible");
    expect(view).toContain("data-home-featured-meta");
    expect(view).toContain("data-home-featured-title");
    expect(view).toContain('fetchpriority="high"');
    expect(view).toContain("<h2");
    expect(view).not.toContain("<h3");
    expect(view).not.toContain("Join Discord");
  });

  test("renders announcement feature links", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeFeaturedSlide, {
      props: {
        index: 0,
        item: featuredItem({
          href: "/announcements/join-discord/",
          kind: "announcement",
          title: "Join the TPM Discord",
        }),
      },
      request: new Request(`${testSiteUrl}/`),
    });

    expect(view).toContain("Join the TPM Discord");
    expect(view).toContain("/announcements/join-discord/");
  });
});

function featuredItem(
  overrides: Partial<HomeFeaturedItem> = {},
): HomeFeaturedItem {
  return {
    href: "/articles/feature/",
    id: "feature",
    kind: "article",
    slug: "feature",
    title: "Feature",
    ...overrides,
  };
}

function imageMetadata(src: string): ImageMetadata {
  return {
    format: "png",
    height: 360,
    src,
    width: 480,
  };
}
