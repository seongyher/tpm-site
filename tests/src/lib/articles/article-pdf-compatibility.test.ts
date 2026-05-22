import { describe, expect, test } from "bun:test";

import {
  articleMdxPdfCompatibility,
  isArticleMdxComponentImport,
  isArticleMdxPdfCompatibleImport,
} from "../../../../src/lib/articles/article-pdf-compatibility";

describe("article MDX PDF compatibility", () => {
  test("keeps current article hover-image components explicitly compatible", () => {
    expect(
      articleMdxPdfCompatibility.map((entry) => entry.importSource).sort(),
    ).toEqual([
      "../../../components/articles/media/HoverImageLink.astro",
      "../../../components/articles/media/HoverImageParagraph.astro",
      "@/components/articles/media/HoverImageLink.astro",
      "@/components/articles/media/HoverImageParagraph.astro",
      "@/components/media/SoundCloudEmbed.astro",
    ]);
    expect(
      articleMdxPdfCompatibility.map((entry): string => entry.mode),
    ).toEqual([
      "static-link",
      "static-link",
      "static-link",
      "static-link",
      "static-link",
    ]);
  });

  test("treats article asset imports as compatible and component imports as gated", () => {
    expect(
      isArticleMdxComponentImport(
        "../../../assets/articles/social-media-freedom/gae1.png",
      ),
    ).toBe(false);
    expect(
      isArticleMdxPdfCompatibleImport(
        "../../../assets/articles/social-media-freedom/gae1.png",
      ),
    ).toBe(true);
    expect(
      isArticleMdxPdfCompatibleImport(
        "@site/assets/articles/social-media-freedom/gae1.png",
      ),
    ).toBe(true);
    expect(
      isArticleMdxPdfCompatibleImport(
        "../../../components/articles/media/HoverImageLink.astro",
      ),
    ).toBe(true);
    expect(
      isArticleMdxPdfCompatibleImport(
        "../../../components/articles/InteractiveWidget.astro",
      ),
    ).toBe(false);
  });
});
