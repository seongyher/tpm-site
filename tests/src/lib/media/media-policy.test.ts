import type { ImageMetadata } from "astro";
import { describe, expect, test } from "bun:test";

import {
  articleImageRolePolicy,
  articlePdfFileSizeMediaDiagnostics,
  articlePdfRenderMediaDiagnostics,
  classifyEmbedMediaSource,
  embedMediaPolicy,
  mdxImportPdfCompatibilityPolicy,
  mediaAccessibilityPolicy,
  publishableMediaFallbackPolicy,
  socialPreviewMediaPolicy,
  socialPreviewMediaTransform,
} from "../../../../src/lib/media/media-policy";

const sourceImage = {
  format: "png",
  height: 900,
  src: "/src/source.png",
  width: 900,
} as const satisfies ImageMetadata;

describe("media policy", () => {
  test("normalizes descriptive alt text and reports missing required alt text", () => {
    expect(
      mediaAccessibilityPolicy({
        alt: "  Useful alt text  ",
        role: "article-image",
        surface: "article-html",
      }),
    ).toEqual({
      diagnostics: [],
      policy: {
        alt: "Useful alt text",
        kind: "descriptive",
      },
    });

    const missing = mediaAccessibilityPolicy({
      role: "article-image",
      sourceId: "article:example:image",
      surface: "article-html",
    });

    expect(missing.policy).toBeUndefined();
    expect(missing.diagnostics).toHaveLength(1);
    expect(missing.diagnostics[0]).toMatchObject({
      code: "media.missing-alt",
      owner: "content",
      role: "article-image",
      severity: "error",
      sourceId: "article:example:image",
      surface: "article-html",
    });
  });

  test("allows explicit decorative image policy", () => {
    expect(
      mediaAccessibilityPolicy({
        allowDecorative: true,
        role: "fallback",
        surface: "listing-html",
      }),
    ).toEqual({
      diagnostics: [],
      policy: {
        kind: "decorative",
      },
    });
  });

  test("keeps article image display policy stable", () => {
    expect(articleImageRolePolicy()).toEqual({
      isInspectable: true,
      maxHeightClass: "max-h-[min(70svh,34rem)]",
      policy: "bounded",
      previewSizes: "(min-width: 48rem) 48rem, calc(100vw - 2rem)",
      role: "article-image",
      surface: "article-html",
    });
    expect(articleImageRolePolicy("natural")).toEqual({
      isInspectable: false,
      maxHeightClass: "max-h-none",
      policy: "natural",
      previewSizes: "(min-width: 48rem) 48rem, calc(100vw - 2rem)",
      role: "article-image",
      surface: "article-html",
    });
  });

  test("defines social preview optimization policy", () => {
    expect(socialPreviewMediaPolicy).toEqual({
      fit: "cover",
      format: "jpg",
      height: 630,
      maxBytes: 512000,
      mimeType: "image/jpeg",
      position: "center",
      quality: 82,
      role: "social-image",
      surface: "metadata",
      width: 1200,
    });
    expect(socialPreviewMediaTransform(sourceImage)).toEqual({
      fit: "cover",
      format: "jpg",
      height: 630,
      position: "center",
      quality: 82,
      src: sourceImage,
      width: 1200,
    });
  });

  test("classifies embeds and requires provider fallbacks", () => {
    expect(
      classifyEmbedMediaSource(
        "https://w.soundcloud.com/player/?url=https://x",
      ),
    ).toEqual({
      layout: "audio",
      provider: "soundcloud",
    });
    expect(
      classifyEmbedMediaSource("https://www.youtube.com/embed/example"),
    ).toEqual({
      layout: "video",
      provider: "youtube",
    });

    const policy = embedMediaPolicy({
      fallbackHref: "https://soundcloud.com/example/track",
      src: "https://w.soundcloud.com/player/?url=https://soundcloud.com/example/track",
      title: "Example track",
    });

    expect(policy).toEqual({
      diagnostics: [],
      fallback: {
        href: "https://soundcloud.com/example/track",
        kind: "static-link",
        label: "Example track",
      },
      frameClassName: "not-prose h-[110px]",
      iframeClassName: "block h-full w-full border-0",
      layout: "audio",
      provider: "soundcloud",
      role: "embed",
      surface: "article-html",
    });

    const incomplete = embedMediaPolicy({
      src: "https://example.com/embed",
    });

    expect(incomplete.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      [
        "media.embed-missing-title",
        "media.embed-missing-fallback",
        "media.embed-unknown-provider",
      ],
    );
  });

  test("returns search and feed-safe text fallback policy", () => {
    expect(
      publishableMediaFallbackPolicy({
        fallbackLabel: "  TPM  ",
        label: "Article title",
        surface: "search",
      }),
    ).toEqual({
      fallback: {
        ariaHidden: true,
        kind: "text",
        label: "TPM",
      },
      role: "fallback",
      surface: "search",
    });
  });

  test("reports MDX components without PDF fallbacks", () => {
    const compatible = mdxImportPdfCompatibilityPolicy(
      "../../../components/articles/media/HoverImageLink.astro",
    );
    expect(compatible.diagnostics).toEqual([]);
    expect(compatible.isCompatible).toBe(true);
    expect(compatible.fallback).toMatchObject({
      importSource: "../../../components/articles/media/HoverImageLink.astro",
      mode: "static-link",
    });
    expect(
      mdxImportPdfCompatibilityPolicy(
        "../../../assets/articles/example/image.png",
      ),
    ).toEqual({
      diagnostics: [],
      isCompatible: true,
    });

    const unsupported = mdxImportPdfCompatibilityPolicy(
      "../../../components/articles/InteractiveWidget.astro",
    );

    expect(unsupported.isCompatible).toBe(false);
    expect(unsupported.diagnostics).toHaveLength(1);
    expect(unsupported.diagnostics[0]).toMatchObject({
      code: "media.pdf-unsupported-mdx-component",
      role: "pdf-image",
      severity: "warning",
      surface: "pdf",
    });
  });

  test("reports PDF media render and artifact diagnostics", () => {
    expect(
      articlePdfRenderMediaDiagnostics({
        relativeOutputPath: "articles/live/live.pdf",
        unloadedArticleImages: ["Figure 7"],
        unoptimizedArticleImageSources: ["/assets/raw.png"],
      }).map((diagnostic) => ({
        code: diagnostic.code,
        message: diagnostic.message,
        role: diagnostic.role,
        surface: diagnostic.surface,
      })),
    ).toEqual([
      {
        code: "media.pdf-image-unloaded",
        message:
          "articles/live/live.pdf: article images failed to load before PDF rendering: Figure 7",
        role: "pdf-image",
        surface: "pdf",
      },
      {
        code: "media.pdf-image-unoptimized",
        message:
          "articles/live/live.pdf: article images bypassed Astro optimization: /assets/raw.png",
        role: "pdf-image",
        surface: "pdf",
      },
    ]);

    expect(
      articlePdfFileSizeMediaDiagnostics({
        byteLength: 6,
        maxBytes: 5,
        relativeOutputPath: "articles/live/live.pdf",
      }).map((diagnostic) => ({
        code: diagnostic.code,
        message: diagnostic.message,
        role: diagnostic.role,
        surface: diagnostic.surface,
      })),
    ).toEqual([
      {
        code: "media.pdf-output-oversized",
        message:
          "articles/live/live.pdf: generated PDF is 6 bytes, above the 5 byte limit",
        role: "generated-artifact",
        surface: "pdf",
      },
    ]);

    expect(
      articlePdfFileSizeMediaDiagnostics({
        byteLength: 5,
        maxBytes: 5,
        relativeOutputPath: "articles/live/live.pdf",
      }),
    ).toEqual([]);
  });
});
