import { type ArticleEntry, sortNewestFirst, tagUrl } from "../routes/routes";

/** Display-ready tag data with matching sorted articles. */
export interface TagSummary {
  articles: ArticleEntry[];
  href: string;
  label: string;
  pathSegment: string;
}

/** Diagnostic for an invalid or noncanonical tag value. */
interface TagDiagnostic {
  index: number;
  message: string;
  value: string;
}

/** Result of normalizing an article's tag list for source rewriting. */
interface TagListNormalization {
  changed: boolean;
  diagnostics: TagDiagnostic[];
  tags: string[];
}

const whitespacePattern = /\s+/gu;

/**
 * Normalizes one tag label into its canonical display form.
 *
 * @param value Raw tag label.
 * @returns Lowercase, trimmed, whitespace-collapsed tag label.
 */
export function normalizeTag(value: string): string {
  return value.trim().replace(whitespacePattern, " ").toLowerCase();
}

/**
 * Builds the encoded dynamic route segment for a canonical tag label.
 *
 * @param tag Canonical tag label.
 * @returns URL path segment safe for Astro static route params.
 */
export function tagPathSegment(tag: string): string {
  return encodeURIComponent(tag);
}

/**
 * Finds canonical-format violations in a raw tag list.
 *
 * @param tags Raw tag labels from article frontmatter.
 * @returns Diagnostics for empty, slash-containing, noncanonical, and duplicate tags.
 */
export function tagDiagnostics(tags: readonly string[]): TagDiagnostic[] {
  const seen = new Map<string, number>();
  const diagnostics: TagDiagnostic[] = [];

  tags.forEach((tag, index) => {
    const normalized = normalizeTag(tag);

    if (normalized.length === 0) {
      diagnostics.push({
        index,
        message: "tag must not be empty",
        value: tag,
      });
      return;
    }

    if (tag.includes("/")) {
      diagnostics.push({
        index,
        message: 'tag must not contain "/"',
        value: tag,
      });
    }

    if (tag !== normalized) {
      diagnostics.push({
        index,
        message: `tag must be canonical "${normalized}"`,
        value: tag,
      });
    }

    const previousIndex = seen.get(normalized);
    if (previousIndex !== undefined) {
      diagnostics.push({
        index,
        message: `duplicate canonical tag "${normalized}" also appears at index ${previousIndex}`,
        value: tag,
      });
    } else {
      seen.set(normalized, index);
    }
  });

  return diagnostics;
}

/**
 * Normalizes a tag list for source cleanup.
 *
 * @param tags Raw tag labels from article frontmatter.
 * @returns Canonical unique tags plus diagnostics for values that need manual repair.
 */
export function normalizeTagList(
  tags: readonly string[],
): TagListNormalization {
  const diagnostics = tags.flatMap((tag, index) => {
    const normalized = normalizeTag(tag);
    const issues: TagDiagnostic[] = [];

    if (normalized.length === 0) {
      issues.push({ index, message: "tag must not be empty", value: tag });
    }

    if (tag.includes("/")) {
      issues.push({ index, message: 'tag must not contain "/"', value: tag });
    }

    return issues;
  });
  const normalizedTags = uniqueTags(tags.map(normalizeTag));

  return {
    changed: !sameStringArray(tags, normalizedTags),
    diagnostics,
    tags: normalizedTags,
  };
}

/**
 * Groups articles by canonical tag label for tag index and detail pages.
 *
 * @param articles Published article entries.
 * @returns Display-ready tag summaries sorted by label.
 */
export function tagSummariesFromArticles(
  articles: readonly ArticleEntry[],
): TagSummary[] {
  const groups = new Map<string, ArticleEntry[]>();

  articles.forEach((article) => {
    article.data.tags.forEach((tag) => {
      groups.set(tag, [...(groups.get(tag) ?? []), article]);
    });
  });

  return Array.from(groups.entries(), ([label, taggedArticles]) => ({
    articles: sortNewestFirst(taggedArticles),
    href: tagUrl(label),
    label,
    pathSegment: tagPathSegment(label),
  })).sort((left, right) => left.label.localeCompare(right.label));
}

function sameStringArray(left: readonly string[], right: readonly string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const rightValues = right[Symbol.iterator]();
  for (const value of left) {
    if (rightValues.next().value !== value) {
      return false;
    }
  }

  return true;
}

function uniqueTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();

  return tags.filter((tag) => {
    if (tag === "" || seen.has(tag)) {
      return false;
    }

    seen.add(tag);
    return true;
  });
}
