import type { ImageMetadata } from "astro";

/** Output roles that explain why media is being rendered. */
export const mediaRoles = [
  "article-image",
  "download",
  "embed",
  "fallback",
  "generated-artifact",
  "hover-image",
  "inline-image",
  "list-thumbnail",
  "pdf-image",
  "social-image",
] as const;

/** Output role that explains why one media item is being rendered. */
export type MediaRole = (typeof mediaRoles)[number];

/** Output surfaces that consume media policies. */
export const mediaSurfaces = [
  "article-html",
  "catalog",
  "download",
  "feed",
  "generated-output-verifier",
  "home-html",
  "listing-html",
  "metadata",
  "no-js",
  "pdf",
  "print",
  "search",
] as const;

/** Output surface that consumes one media policy. */
export type MediaSurface = (typeof mediaSurfaces)[number];

/** Severity for media diagnostics surfaced to checks and future tooling. */
type MediaDiagnosticSeverity = "error" | "info" | "warning";

/** Owner bucket for a media diagnostic. */
type MediaDiagnosticOwner =
  | "content"
  | "external-provider"
  | "generated-output"
  | "platform"
  | "site-config";

/** One media diagnostic suitable for author checks and output verifiers. */
export interface MediaDiagnostic {
  code: string;
  message: string;
  owner: MediaDiagnosticOwner;
  remediation?: string | undefined;
  role: MediaRole;
  severity: MediaDiagnosticSeverity;
  sourceId?: string | undefined;
  surface: MediaSurface;
}

/** Accessibility policy for image-like media output. */
type MediaAccessibilityPolicy =
  | {
      alt: string;
      kind: "descriptive";
    }
  | {
      kind: "decorative";
    };

/** Result of normalizing an image alt-text contract. */
export interface MediaAccessibilityPolicyResult {
  diagnostics: MediaDiagnostic[];
  policy?: MediaAccessibilityPolicy | undefined;
}

/** Input for image accessibility policy normalization. */
export interface MediaAccessibilityPolicyInput {
  allowDecorative?: boolean | undefined;
  alt?: string | undefined;
  role: MediaRole;
  sourceId?: string | undefined;
  surface: MediaSurface;
}

/** Fallback behavior for media that cannot render in one surface. */
type MediaFallbackPolicy =
  | {
      ariaHidden: true;
      kind: "text";
      label: string;
    }
  | {
      href: string;
      kind: "static-link";
      label: string;
    };

/** Explicit author/developer override for article image height handling. */
export type ArticleImageHeightPolicy = "auto" | "natural";

/** Stable article image role policy shared by Markdown and MDX renderers. */
export interface ArticleImageRolePolicy {
  isInspectable: boolean;
  maxHeightClass: string;
  policy: "bounded" | "natural";
  previewSizes: string;
  role: "article-image";
  surface: "article-html";
}

/** Social preview image generation policy. */
export interface SocialPreviewMediaPolicy {
  fit: "cover";
  format: "jpg";
  height: 630;
  maxBytes: number;
  mimeType: "image/jpeg";
  position: "center";
  quality: 82;
  role: "social-image";
  surface: "metadata";
  width: 1200;
}

/** Transform contract passed to Astro's optimizer for one social image. */
export interface SocialPreviewMediaTransform {
  fit: SocialPreviewMediaPolicy["fit"];
  format: SocialPreviewMediaPolicy["format"];
  height: SocialPreviewMediaPolicy["height"];
  position: SocialPreviewMediaPolicy["position"];
  quality: SocialPreviewMediaPolicy["quality"];
  src: ImageMetadata;
  width: SocialPreviewMediaPolicy["width"];
}

/** Known embedded-media providers with layout-specific frame needs. */
type EmbedMediaProvider = "soundcloud" | "unknown" | "youtube";

/** Layout class used by article embed wrappers and MDX embed components. */
export type EmbedMediaLayout = "audio" | "video";

/** Classified embedded-media source. */
export interface EmbedMediaClassification {
  layout: EmbedMediaLayout;
  provider: EmbedMediaProvider;
}

/** Provider policy for one embedded media instance. */
export interface EmbedMediaPolicy {
  diagnostics: MediaDiagnostic[];
  fallback?: MediaFallbackPolicy | undefined;
  frameClassName: string;
  iframeClassName: string;
  layout: EmbedMediaLayout;
  provider: EmbedMediaProvider;
  role: "embed";
  surface: "article-html";
}

/** Input used to build a provider embed policy. */
export interface EmbedMediaPolicyInput {
  fallbackHref?: string | undefined;
  sourceId?: string | undefined;
  src?: string | undefined;
  title?: string | undefined;
}

/** PDF fallback behavior for an article MDX component import. */
export interface ArticleMdxPdfCompatibility {
  importSource: string;
  mode: "static-link";
  note: string;
}

/** Result of checking one MDX import against PDF fallback policy. */
export interface ArticleMdxPdfCompatibilityResult {
  diagnostics: MediaDiagnostic[];
  fallback?: ArticleMdxPdfCompatibility | undefined;
  isCompatible: boolean;
}

/** Browser-collected PDF render facts for article images. */
export interface ArticlePdfRenderMediaFacts {
  relativeOutputPath: string;
  unloadedArticleImages: readonly string[];
  unoptimizedArticleImageSources: readonly string[];
}

/** Generated article PDF file-size facts. */
export interface ArticlePdfFileSizeFacts {
  byteLength: number;
  maxBytes: number;
  relativeOutputPath: string;
}

/** Text fallback policy for publishable media frames and feed/search records. */
export interface PublishableMediaFallbackPolicy {
  fallback: MediaFallbackPolicy;
  role: "fallback";
  surface: Extract<
    MediaSurface,
    "feed" | "home-html" | "listing-html" | "search"
  >;
}

const articleImagePreviewSizes = "(min-width: 48rem) 48rem, calc(100vw - 2rem)";
const articleImageSquareHeightCeilingClass = "max-h-[min(70svh,34rem)]";

export const socialPreviewMediaPolicy = {
  fit: "cover",
  format: "jpg",
  height: 630,
  maxBytes: 500 * 1024,
  mimeType: "image/jpeg",
  position: "center",
  quality: 82,
  role: "social-image",
  surface: "metadata",
  width: 1200,
} as const satisfies SocialPreviewMediaPolicy;

const youtubeHostPatterns = [
  "youtube.com",
  "youtube-nocookie.com",
  "youtu.be",
] as const;

const compatibleArticleMdxImports = [
  {
    importSource: "../../../components/articles/HoverImageLink.astro",
    mode: "static-link",
    note: "Renders as ordinary inline link text in PDF; hover preview panel is print-hidden.",
  },
  {
    importSource: "@/components/articles/HoverImageLink.astro",
    mode: "static-link",
    note: "Renders as ordinary inline link text in PDF; hover preview panel is print-hidden.",
  },
  {
    importSource: "../../../components/articles/HoverImageParagraph.astro",
    mode: "static-link",
    note: "Renders as ordinary paragraph text plus inline link in PDF; hover preview panel is print-hidden.",
  },
  {
    importSource: "@/components/articles/HoverImageParagraph.astro",
    mode: "static-link",
    note: "Renders as ordinary paragraph text plus inline link in PDF; hover preview panel is print-hidden.",
  },
  {
    importSource: "@/components/media/SoundCloudEmbed.astro",
    mode: "static-link",
    note: "Renders a print-only source link in PDF; the interactive iframe is print-hidden.",
  },
] as const satisfies readonly ArticleMdxPdfCompatibility[];

/** Supported article MDX component imports and their PDF fallback contracts. */
export const articleMdxPdfCompatibilityPolicies =
  compatibleArticleMdxImports as readonly ArticleMdxPdfCompatibility[];

/**
 * Normalizes accessibility requirements for image-like media.
 *
 * @param input Image accessibility policy input.
 * @returns Accessibility policy and any diagnostics.
 */
export function mediaAccessibilityPolicy(
  input: MediaAccessibilityPolicyInput,
): MediaAccessibilityPolicyResult {
  const alt = input.alt?.trim() ?? "";

  if (alt !== "") {
    return {
      diagnostics: [],
      policy: {
        alt,
        kind: "descriptive",
      },
    };
  }

  if (input.allowDecorative === true) {
    return {
      diagnostics: [],
      policy: {
        kind: "decorative",
      },
    };
  }

  return {
    diagnostics: [
      mediaDiagnostic({
        code: "media.missing-alt",
        message:
          "Image media needs non-empty alt text or an explicit decorative policy.",
        owner: "content",
        role: input.role,
        severity: "error",
        sourceId: input.sourceId,
        surface: input.surface,
        remediation:
          "Add useful alt text in frontmatter, Markdown, or component props.",
      }),
    ],
  };
}

/**
 * Returns the shared article-image role policy.
 *
 * @param heightPolicy Explicit author/developer override for height handling.
 * @returns Article image role policy.
 */
export function articleImageRolePolicy(
  heightPolicy: ArticleImageHeightPolicy = "auto",
): ArticleImageRolePolicy {
  if (heightPolicy === "natural") {
    return {
      isInspectable: false,
      maxHeightClass: "max-h-none",
      policy: "natural",
      previewSizes: articleImagePreviewSizes,
      role: "article-image",
      surface: "article-html",
    };
  }

  return {
    isInspectable: true,
    maxHeightClass: articleImageSquareHeightCeilingClass,
    policy: "bounded",
    previewSizes: articleImagePreviewSizes,
    role: "article-image",
    surface: "article-html",
  };
}

/**
 * Builds the Astro image transform for one social preview image.
 *
 * @param src Source image metadata.
 * @returns Social preview transform contract.
 */
export function socialPreviewMediaTransform(
  src: ImageMetadata,
): SocialPreviewMediaTransform {
  return {
    fit: socialPreviewMediaPolicy.fit,
    format: socialPreviewMediaPolicy.format,
    height: socialPreviewMediaPolicy.height,
    position: socialPreviewMediaPolicy.position,
    quality: socialPreviewMediaPolicy.quality,
    src,
    width: socialPreviewMediaPolicy.width,
  };
}

/**
 * Classifies an embedded-media source URL for layout decisions.
 *
 * @param src Embed source URL.
 * @returns Provider and layout classification.
 */
export function classifyEmbedMediaSource(
  src: string | undefined,
): EmbedMediaClassification {
  const normalized = src?.toLowerCase() ?? "";

  if (normalized.includes("w.soundcloud.com/player")) {
    return {
      layout: "audio",
      provider: "soundcloud",
    };
  }

  if (youtubeHostPatterns.some((host) => normalized.includes(host))) {
    return {
      layout: "video",
      provider: "youtube",
    };
  }

  return {
    layout: "video",
    provider: "unknown",
  };
}

/**
 * Returns the frame class for one embedded-media layout.
 *
 * @param layout Embedded-media layout.
 * @returns Static Tailwind class string for the wrapper frame.
 */
export function embedMediaFrameClassName(layout: EmbedMediaLayout): string {
  switch (layout) {
    case "audio":
      return "not-prose h-[110px]";
    case "video":
      return "not-prose aspect-video";
  }
}

/**
 * Returns the iframe class for one embedded-media layout.
 *
 * @param layout Embedded-media layout.
 * @returns Static Tailwind class string for the iframe.
 */
export function embedMediaIframeClassName(layout: EmbedMediaLayout): string {
  switch (layout) {
    case "audio":
      return "block h-full w-full border-0";
    case "video":
      return "block aspect-video w-full border-0";
  }
}

/**
 * Builds a provider embed policy with static fallback diagnostics.
 *
 * @param input Embed source, title, and fallback URL.
 * @returns Provider embed policy.
 */
export function embedMediaPolicy(
  input: EmbedMediaPolicyInput,
): EmbedMediaPolicy {
  const classification = classifyEmbedMediaSource(input.src);
  const fallbackLabel = input.title?.trim() ?? "";
  const fallback: MediaFallbackPolicy | undefined =
    input.fallbackHref === undefined || input.fallbackHref.trim() === ""
      ? undefined
      : {
          href: input.fallbackHref,
          kind: "static-link",
          label: fallbackLabel === "" ? "Open embed source" : fallbackLabel,
        };
  const diagnostics = [
    ...(input.title === undefined || input.title.trim() === ""
      ? [
          mediaDiagnostic({
            code: "media.embed-missing-title",
            message: "Embedded media needs a non-empty title.",
            owner: "content",
            role: "embed",
            severity: "error",
            sourceId: input.sourceId,
            surface: "article-html",
            remediation: "Add a title prop that describes the embedded media.",
          }),
        ]
      : []),
    ...(fallback === undefined
      ? [
          mediaDiagnostic({
            code: "media.embed-missing-fallback",
            message:
              "Embedded media needs a static fallback link for PDF, print, and no-JS output.",
            owner: "content",
            role: "embed",
            severity: "warning",
            sourceId: input.sourceId,
            surface: "article-html",
            remediation:
              "Provide a source URL or fallbackHref for the embedded media.",
          }),
        ]
      : []),
    ...(classification.provider === "unknown"
      ? [
          mediaDiagnostic({
            code: "media.embed-unknown-provider",
            message:
              "Embedded media uses the generic video policy because its provider is unknown.",
            owner: "content",
            role: "embed",
            severity: "info",
            sourceId: input.sourceId,
            surface: "article-html",
          }),
        ]
      : []),
  ];

  return {
    diagnostics,
    fallback,
    frameClassName: embedMediaFrameClassName(classification.layout),
    iframeClassName: embedMediaIframeClassName(classification.layout),
    layout: classification.layout,
    provider: classification.provider,
    role: "embed",
    surface: "article-html",
  };
}

/**
 * Builds a text fallback policy for media frames that have no image.
 *
 * @param input Fallback label and target surface.
 * @param input.fallbackLabel Optional explicit fallback label.
 * @param input.label Primary entry label.
 * @param input.surface Output surface.
 * @returns Text fallback policy.
 */
export function publishableMediaFallbackPolicy(input: {
  fallbackLabel?: string | undefined;
  label: string;
  surface: PublishableMediaFallbackPolicy["surface"];
}): PublishableMediaFallbackPolicy {
  const fallbackLabel = input.fallbackLabel?.trim() ?? "";

  return {
    fallback: {
      ariaHidden: true,
      kind: "text",
      label: fallbackLabel === "" ? input.label : fallbackLabel,
    },
    role: "fallback",
    surface: input.surface,
  };
}

/**
 * Reports whether an MDX import can affect PDF rendering.
 *
 * @param importSource Import source string as written in an article MDX file.
 * @returns True when the import points at a reusable component.
 */
export function isMediaMdxComponentImport(importSource: string): boolean {
  return /(?:^|\/)components\//u.test(importSource);
}

/**
 * Checks whether an article MDX import has a declared PDF fallback.
 *
 * Asset imports are not component imports and are therefore compatible here.
 *
 * @param importSource Import source string as written in an article MDX file.
 * @returns PDF compatibility result.
 */
export function mdxImportPdfCompatibilityPolicy(
  importSource: string,
): ArticleMdxPdfCompatibilityResult {
  if (!isMediaMdxComponentImport(importSource)) {
    return {
      diagnostics: [],
      isCompatible: true,
    };
  }

  const fallback = articleMdxPdfCompatibilityPolicies.find(
    (entry) => entry.importSource === importSource,
  );

  if (fallback !== undefined) {
    return {
      diagnostics: [],
      fallback,
      isCompatible: true,
    };
  }

  return {
    diagnostics: [
      mediaDiagnostic({
        code: "media.pdf-unsupported-mdx-component",
        message: "Article MDX component import has no declared PDF fallback.",
        owner: "platform",
        role: "pdf-image",
        severity: "warning",
        sourceId: importSource,
        surface: "pdf",
        remediation:
          "Add a PDF fallback policy for this component or disable PDF generation for the article.",
      }),
    ],
    isCompatible: false,
  };
}

/**
 * Converts article image render facts into explicit PDF media diagnostics.
 *
 * @param facts Browser-collected PDF image facts.
 * @returns PDF media diagnostics.
 */
export function articlePdfRenderMediaDiagnostics(
  facts: ArticlePdfRenderMediaFacts,
): MediaDiagnostic[] {
  return [
    ...(facts.unloadedArticleImages.length > 0
      ? [
          mediaDiagnostic({
            code: "media.pdf-image-unloaded",
            message: `${facts.relativeOutputPath}: article images failed to load before PDF rendering: ${facts.unloadedArticleImages.join(", ")}`,
            owner: "generated-output",
            remediation:
              "Check that each printable article image resolves to an optimized generated asset before PDF rendering.",
            role: "pdf-image",
            severity: "error",
            sourceId: facts.relativeOutputPath,
            surface: "pdf",
          }),
        ]
      : []),
    ...(facts.unoptimizedArticleImageSources.length > 0
      ? [
          mediaDiagnostic({
            code: "media.pdf-image-unoptimized",
            message: `${facts.relativeOutputPath}: article images bypassed Astro optimization: ${facts.unoptimizedArticleImageSources.join(", ")}`,
            owner: "generated-output",
            remediation:
              "Use local site assets and Astro image output for printable article images.",
            role: "pdf-image",
            severity: "error",
            sourceId: facts.relativeOutputPath,
            surface: "pdf",
          }),
        ]
      : []),
  ];
}

/**
 * Converts generated PDF file-size facts into media artifact diagnostics.
 *
 * @param facts Generated PDF size facts.
 * @returns PDF artifact diagnostics.
 */
export function articlePdfFileSizeMediaDiagnostics(
  facts: ArticlePdfFileSizeFacts,
): MediaDiagnostic[] {
  if (facts.byteLength <= facts.maxBytes) {
    return [];
  }

  return [
    mediaDiagnostic({
      code: "media.pdf-output-oversized",
      message: `${facts.relativeOutputPath}: generated PDF is ${facts.byteLength} bytes, above the ${facts.maxBytes} byte limit`,
      owner: "generated-output",
      remediation:
        "Inspect article media, PDF fallbacks, and generated image choices before raising the PDF budget.",
      role: "generated-artifact",
      severity: "error",
      sourceId: facts.relativeOutputPath,
      surface: "pdf",
    }),
  ];
}

function mediaDiagnostic(
  diagnostic: Omit<MediaDiagnostic, "sourceId"> & {
    sourceId?: string | undefined;
  },
): MediaDiagnostic {
  return {
    ...diagnostic,
    ...(diagnostic.sourceId === undefined
      ? {}
      : { sourceId: diagnostic.sourceId }),
  };
}
