/** Character range of the title to italicize within a citation. */
export interface CitationTitleRange {
  start: number;
  end: number;
}

/**
 * Splits citation text around the title selected by the citation formatter.
 *
 * @param text Exact citation text.
 * @param range Start and exclusive end of the italicized title.
 * @returns The three preview parts, or undefined for plain text.
 */
export function citationTitleParts(
  text: string,
  range: CitationTitleRange | undefined,
): { before: string; title: string; after: string } | undefined {
  if (range === undefined) {
    return undefined;
  }

  const { start, end } = range;

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end <= start ||
    end > text.length
  ) {
    return undefined;
  }

  return {
    before: text.slice(0, start),
    title: text.slice(start, end),
    after: text.slice(end),
  };
}
