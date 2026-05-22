import { normalizeSlug } from "../routes/routes";

/**
 * Converts free-form text into a browser-safe HTML id stem.
 *
 * HTML validators require ids to start with a letter. Route slugs and tags can
 * legitimately start with a number, so generated heading ids need this extra
 * guard instead of reusing URL slug normalization directly.
 *
 * @param value Raw display text.
 * @param fallback Prefix to use when the display text has no slug characters.
 * @returns A lowercase id-safe stem that starts with a letter.
 */
export function htmlIdFromText(value: string, fallback = "section"): string {
  const normalizedFallback = normalizeSlug(fallback);
  const fallbackStem =
    normalizedFallback.length === 0 ? "section" : normalizedFallback;
  const normalizedValue = normalizeSlug(value);
  const stem = normalizedValue.length === 0 ? fallbackStem : normalizedValue;

  return /^[a-z]/.test(stem) ? stem : `${fallbackStem}-${stem}`;
}
