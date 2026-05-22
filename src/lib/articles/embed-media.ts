import {
  classifyEmbedMediaSource,
  type EmbedMediaClassification,
  embedMediaFrameClassName,
  embedMediaIframeClassName,
  type EmbedMediaLayout,
} from "../media/media-policy";

export type {
  EmbedMediaClassification,
  EmbedMediaLayout,
} from "../media/media-policy";

/**
 * Classifies an embedded-media source URL for layout decisions.
 *
 * @param src Embed source URL.
 * @returns Provider and layout classification.
 */
export function classifyEmbedMedia(
  src: string | undefined,
): EmbedMediaClassification {
  return classifyEmbedMediaSource(src);
}

/**
 * Returns the frame class for one embedded-media layout.
 *
 * @param layout Embedded-media layout.
 * @returns Static Tailwind class string for the wrapper frame.
 */
export function embedFrameClassName(layout: EmbedMediaLayout): string {
  return embedMediaFrameClassName(layout);
}

/**
 * Returns the iframe class for one embedded-media layout.
 *
 * @param layout Embedded-media layout.
 * @returns Static Tailwind class string for the iframe.
 */
export function embedIframeClassName(layout: EmbedMediaLayout): string {
  return embedMediaIframeClassName(layout);
}

/**
 * Builds a SoundCloud player URL from a public SoundCloud URL.
 *
 * @param sourceUrl Public SoundCloud track or playlist URL.
 * @returns SoundCloud player iframe URL.
 */
export function soundCloudPlayerUrl(sourceUrl: string): string {
  const params = new URLSearchParams({
    auto_play: "false",
    color: "ff5500",
    hide_related: "false",
    show_comments: "true",
    show_reposts: "false",
    show_user: "true",
    url: sourceUrl,
  });

  return `https://w.soundcloud.com/player/?${params.toString()}`;
}
