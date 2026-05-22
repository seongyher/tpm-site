type ArticleListTitleFit = "compact" | "default" | "dense" | "minimum";
type ArticleListDescriptionFit = "compact" | "default" | "tight";

const articleListTitleFitClasses = {
  compact: "text-base md:text-lg",
  default: "text-xl md:text-2xl",
  dense: "text-lg md:text-xl",
  minimum: "text-sm md:text-base",
} as const satisfies Record<ArticleListTitleFit, string>;

const articleListDescriptionFitClasses = {
  compact: "text-sm leading-6",
  default: "text-sm leading-6 md:text-base md:leading-7",
  tight: "text-sm leading-5",
} as const satisfies Record<ArticleListDescriptionFit, string>;

const compactTitleScore = 92;
const denseTitleScore = 64;
const compactDescriptionScore = 156;
const descriptionTagPattern = /<[^>]*>/gu;
const imageColumnPenalty = 12;
const minimumTitleScore = 124;
const tightDescriptionScore = 228;
const longWordSoftLimit = 14;
const wordPattern = /\S+/gu;

/**
 * Selects a stable title density for article-list rows.
 *
 * @param title Article title rendered in a list row.
 * @param hasImage Whether the row reserves a thumbnail column.
 * @returns Title density variant to apply before the two-line clamp fallback.
 */
export function articleListTitleFitVariant(
  title: string,
  hasImage: boolean,
): ArticleListTitleFit {
  const fitScore =
    articleListTitleFitScore(title) + (hasImage ? imageColumnPenalty : 0);

  if (fitScore >= minimumTitleScore) {
    return "minimum";
  }

  if (fitScore >= compactTitleScore) {
    return "compact";
  }

  if (fitScore >= denseTitleScore) {
    return "dense";
  }

  return "default";
}

/**
 * Selects Tailwind classes for a content-aware article-list title size.
 *
 * @param title Article title rendered in a list row.
 * @param hasImage Whether the row reserves a thumbnail column.
 * @returns Complete Tailwind text-size class string for the title.
 */
export function articleListTitleFitClass(
  title: string,
  hasImage: boolean,
): string {
  return articleListTitleFitClasses[
    articleListTitleFitVariant(title, hasImage)
  ];
}

/**
 * Selects a stable description density for article-list rows.
 *
 * @param description Article description or sanitized excerpt rendered in a list row.
 * @param hasImage Whether the row reserves a thumbnail column.
 * @returns Description density variant to apply before the three-line clamp fallback.
 */
export function articleListDescriptionFitVariant(
  description: string,
  hasImage: boolean,
): ArticleListDescriptionFit {
  const fitScore =
    articleListTextFitScore(description.replace(descriptionTagPattern, "")) +
    (hasImage ? imageColumnPenalty : 0);

  if (fitScore >= tightDescriptionScore) {
    return "tight";
  }

  if (fitScore >= compactDescriptionScore) {
    return "compact";
  }

  return "default";
}

/**
 * Selects Tailwind classes for a content-aware article-list description size.
 *
 * @param description Article description or sanitized excerpt rendered in a list row.
 * @param hasImage Whether the row reserves a thumbnail column.
 * @returns Complete Tailwind text-size and line-height class string.
 */
export function articleListDescriptionFitClass(
  description: string,
  hasImage: boolean,
): string {
  return articleListDescriptionFitClasses[
    articleListDescriptionFitVariant(description, hasImage)
  ];
}

function articleListTitleFitScore(title: string): number {
  return articleListTextFitScore(title);
}

function articleListTextFitScore(value: string): number {
  const normalizedValue = value.trim();
  const words = normalizedValue.match(wordPattern) ?? [];
  const longWordPenalty = words.reduce(
    (totalPenalty, word) =>
      totalPenalty + Math.max(word.length - longWordSoftLimit, 0),
    0,
  );

  return normalizedValue.length + longWordPenalty;
}
