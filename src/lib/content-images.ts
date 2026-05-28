import type { ImageMetadata } from "astro";

type MaybeImageMetadata = Partial<Record<keyof ImageMetadata, unknown>>;

/**
 * Checks whether a runtime value is Astro image metadata.
 *
 * Content collections type local images as `ImageMetadata`, but Astro's test
 * container can expose unresolved image references as strings. Rendering and
 * social-image optimization should only use values the Astro asset pipeline can
 * actually process.
 *
 * @param value Potential content image value.
 * @returns True when the value has the metadata shape expected by Astro assets.
 */
export function isImageMetadata(value: unknown): value is ImageMetadata {
  if (
    (typeof value !== "object" && typeof value !== "function") ||
    value === null
  ) {
    return false;
  }

  const image = value as MaybeImageMetadata;

  return (
    typeof image.src === "string" &&
    typeof image.width === "number" &&
    typeof image.height === "number" &&
    typeof image.format === "string"
  );
}

/**
 * Returns Astro image metadata when a content image is optimizer-ready.
 *
 * @param value Potential content image value.
 * @returns Image metadata, or undefined for unresolved content references.
 */
export function imageMetadataOrUndefined(
  value: unknown,
): ImageMetadata | undefined {
  return isImageMetadata(value) ? value : undefined;
}
