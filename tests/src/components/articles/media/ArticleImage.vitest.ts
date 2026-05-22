import sampleImage from "@site/assets/shared/tpm_defaultpic.jpg";
import { describe, expect, test } from "vitest";

import ArticleImage from "../../../../../src/components/articles/media/ArticleImage.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("ArticleImage", () => {
  test("renders optimized bounded image markup with alt text and caption", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleImage, {
      props: {
        alt: "The Philosopher's Meme preview image",
        caption: "Preview caption.",
        src: sampleImage,
      },
    });

    expect(view).toContain("<figure");
    expect(view).toContain('data-article-image-policy="bounded"');
    expect(view).toContain('data-article-image-inspectable="true"');
    expect(view).toContain('alt="The Philosopher\'s Meme preview image"');
    expect(view).toContain('data-article-image="true"');
    expect(view).toContain("max-h-[min(70svh,34rem)]");
    expect(view).toContain(
      'sizes="(min-width: 48rem) 48rem, calc(100vw - 2rem)"',
    );
    expect(view).toContain("data-article-image-inspect-trigger");
    expect(view).toContain('aria-haspopup="dialog"');
    expect(view).toContain(
      'aria-label="View full image: The Philosopher\'s Meme preview image"',
    );
    expect(view).not.toContain(">View full image<");
    expect(view).toContain("Preview caption.");
  });

  test("keeps natural full-height image display explicit", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleImage, {
      props: {
        alt: "Natural image",
        heightPolicy: "natural",
        src: sampleImage,
      },
    });

    expect(view).toContain('data-article-image-policy="natural"');
    expect(view).toContain('data-article-image-inspectable="false"');
    expect(view).toContain("max-h-none");
    expect(view).not.toContain("data-article-image-inspect-trigger");
    expect(view).not.toContain("article-image-inspector");
  });
});
