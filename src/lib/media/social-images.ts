import type { ImageMetadata } from "astro";

import {
  socialPreviewMediaPolicy,
  type SocialPreviewMediaTransform,
  socialPreviewMediaTransform,
} from "./media-policy";

export const socialPreviewImageSpec = {
  fit: socialPreviewMediaPolicy.fit,
  format: socialPreviewMediaPolicy.format,
  height: socialPreviewMediaPolicy.height,
  position: socialPreviewMediaPolicy.position,
  quality: socialPreviewMediaPolicy.quality,
  width: socialPreviewMediaPolicy.width,
} as const;

export const socialPreviewImageMimeType = socialPreviewMediaPolicy.mimeType;
export const maxSocialPreviewImageBytes = socialPreviewMediaPolicy.maxBytes;

/** Generated social preview image metadata for Open Graph, Twitter, and JSON-LD. */
export interface SocialPreviewImage {
  alt?: string | undefined;
  height: typeof socialPreviewImageSpec.height;
  src: string;
  type: typeof socialPreviewImageMimeType;
  width: typeof socialPreviewImageSpec.width;
}

/** Transform contract passed to Astro's image optimizer for social previews. */
export type SocialPreviewImageTransform = SocialPreviewMediaTransform;

/** Minimal optimizer adapter shape needed by the social preview pipeline. */
export type SocialPreviewImageOptimizer = (
  transform: SocialPreviewImageTransform,
) => Promise<{ src: string }>;

/** Inputs needed to generate one social preview image view model. */
interface SocialPreviewImageViewModelInput {
  alt?: string | undefined;
  fallback: ImageMetadata;
  optimize: SocialPreviewImageOptimizer;
  source?: ImageMetadata | undefined;
}

/**
 * Generates social preview metadata from a source image or site fallback.
 *
 * @param input Source image, fallback image, alt text, and optimizer adapter.
 * @returns Generated social preview image metadata.
 */
export async function socialPreviewImageViewModel(
  input: SocialPreviewImageViewModelInput,
): Promise<SocialPreviewImage> {
  const image = input.source ?? input.fallback;
  const optimized = await input.optimize(socialPreviewMediaTransform(image));
  const alt = input.alt?.trim();

  return {
    ...(alt !== undefined && alt !== "" ? { alt } : {}),
    height: socialPreviewImageSpec.height,
    src: optimized.src,
    type: socialPreviewImageMimeType,
    width: socialPreviewImageSpec.width,
  };
}
