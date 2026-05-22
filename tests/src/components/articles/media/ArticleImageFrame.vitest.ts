import sampleImage from "@site/assets/shared/tpm_defaultpic.jpg";
import { describe, expect, test } from "vitest";

import ArticleImageFrame from "../../../../../src/components/articles/media/ArticleImageFrame.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("ArticleImageFrame", () => {
  test("renders inspectable image chrome as a button", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleImageFrame, {
      props: {
        alt: "Inspectable image",
        frameClass: "frame-class",
        imageClass: "image-class",
        inspectLabel: "View full image: Inspectable image",
        inspectable: true,
        inspectionClass: "inspection-class",
        previewSizes: "100vw",
        src: sampleImage,
      },
    });

    expect(view).toContain("<button");
    expect(view).toContain("data-article-image-inspect-trigger");
    expect(view).toContain('aria-haspopup="dialog"');
    expect(view).toContain('aria-label="View full image: Inspectable image"');
    expect(view).toContain("data-article-image-inspect-affordance");
    expect(view).toContain('alt="Inspectable image"');
  });

  test("renders non-inspectable image chrome without a trigger", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleImageFrame, {
      props: {
        alt: "Natural image",
        frameClass: "frame-class",
        imageClass: "image-class",
        inspectLabel: "View full image: Natural image",
        inspectable: false,
        inspectionClass: "inspection-class",
        previewSizes: "100vw",
        src: sampleImage,
      },
    });

    expect(view).toContain("<div");
    expect(view).not.toContain("data-article-image-inspect-trigger");
    expect(view).not.toContain("data-article-image-inspect-affordance");
    expect(view).toContain('alt="Natural image"');
  });
});
