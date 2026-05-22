import type { ImageMetadata } from "astro";
import { describe, expect, test } from "vitest";

import PublishableMediaFrame from "../../../../../src/components/articles/media/PublishableMediaFrame.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("PublishableMediaFrame", () => {
  test("renders optimized linked media when an image is available", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(PublishableMediaFrame, {
      props: {
        href: "/articles/example/",
        image: {
          alt: "Example image",
          src: imageMetadata("/example.png"),
        },
        label: "Read Example",
        fetchpriority: "high",
        imageWidths: [320, 640],
        prefetch: "hover",
        quality: 72,
        renderHeight: 360,
        renderWidth: 640,
        sizes: "(min-width: 48rem) 40rem, 100vw",
      },
    });

    expect(view).toContain("data-publishable-media-frame");
    expect(view).toContain('data-publishable-media-has-image="true"');
    expect(view).toContain('href="/articles/example/"');
    expect(view).toContain('aria-label="Read Example"');
    expect(view).toContain('data-astro-prefetch="hover"');
    expect(view).toContain('fetchpriority="high"');
    expect(view).toContain('sizes="(min-width: 48rem) 40rem, 100vw"');
    expect(view).toContain('alt="Example image"');
  });

  test("renders a text fallback inside the same linked frame", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(PublishableMediaFrame, {
      props: {
        fallbackLabel: "TPM",
        href: "/announcements/support/",
        label: "Read Support",
        renderHeight: 360,
        renderWidth: 640,
      },
    });

    expect(view).toContain('data-publishable-media-has-image="false"');
    expect(view).toContain("data-publishable-media-fallback");
    expect(view).toContain('aria-hidden="true"');
    expect(view).toContain("TPM");
  });
});

function imageMetadata(src: string): ImageMetadata {
  return {
    format: "png",
    height: 600,
    src,
    width: 1200,
  };
}
