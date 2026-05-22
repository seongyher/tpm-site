import type {
  ArticleReferenceHtmlId,
  ArticleReferenceKind,
  ArticleReferenceLabel,
} from "./model";

/**
 * Builds the stable rendered entry ID for a normalized reference.
 *
 * @param label Canonical article reference label.
 * @returns Stable entry ID.
 */
export function articleReferenceEntryId(
  label: ArticleReferenceLabel,
): ArticleReferenceHtmlId {
  return label;
}

/**
 * Builds the stable inline marker ID for one body reference occurrence.
 *
 * @param label Canonical article reference label.
 * @param occurrenceIndexForLabel Zero-based occurrence index for this label.
 * @returns Stable marker ID.
 */
export function articleReferenceMarkerId(
  label: ArticleReferenceLabel,
  occurrenceIndexForLabel: number,
): ArticleReferenceHtmlId {
  return suffixedReferenceId(
    `${labelPrefix(label)}-ref-${labelSlug(label)}`,
    occurrenceIndexForLabel,
  );
}

/**
 * Builds the stable backlink ID for one rendered entry return link.
 *
 * @param label Canonical article reference label.
 * @param occurrenceIndexForLabel Zero-based occurrence index for this label.
 * @returns Stable backlink ID.
 */
export function articleReferenceBacklinkId(
  label: ArticleReferenceLabel,
  occurrenceIndexForLabel: number,
): ArticleReferenceHtmlId {
  return suffixedReferenceId(
    `${labelPrefix(label)}-backref-${labelSlug(label)}`,
    occurrenceIndexForLabel,
  );
}

/**
 * Builds the default marker display text for an inline reference.
 *
 * Citation source labels remain available in normalized reference data, but
 * inline citation markers default to numeric display so author-written prose
 * citations such as "Knobe (2015)" do not duplicate themselves in the body.
 *
 * @param kind Reference kind.
 * @param entryOrder One-based entry order within that reference kind.
 * @param displayLabel Optional author-provided display label.
 * @returns Marker display text.
 */
export function articleReferenceMarkerDisplayText(
  kind: ArticleReferenceKind,
  entryOrder: number,
  displayLabel: string | undefined,
): string {
  void kind;
  void displayLabel;

  return String(entryOrder);
}

function labelPrefix(label: ArticleReferenceLabel): "cite" | "note" {
  return label.startsWith("cite-") ? "cite" : "note";
}

function labelSlug(label: ArticleReferenceLabel): string {
  return label.replace(/^(?:cite|note)-/u, "");
}

function suffixedReferenceId(
  baseId: string,
  occurrenceIndexForLabel: number,
): ArticleReferenceHtmlId {
  return occurrenceIndexForLabel === 0
    ? baseId
    : `${baseId}-${occurrenceIndexForLabel + 1}`;
}
