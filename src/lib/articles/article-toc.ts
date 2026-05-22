import type { ArticleReferenceData } from "../references/article-references/model";

const minimumTableOfContentsHeadings = 2;
const articleReferencesHeadingIdPrefix = "article-references";

/** Raw heading metadata returned by Astro's `render(entry)` helper. */
interface RenderedArticleHeading {
  depth: number;
  slug: string;
  text: string;
}

/** Optional generated article sections that should participate in the TOC. */
interface ArticleTableOfContentsOptions {
  referenceHeadingIdPrefix?: string | undefined;
  references?: ArticleReferenceData | undefined;
}

/** Display-ready article heading link for the article table of contents. */
export interface ArticleTableOfContentsHeading {
  depth: number;
  href: `#${string}`;
  id: string;
  level: number;
  order: number;
  text: string;
}

const includedHeadingDepths = new Set([2, 3]);

/**
 * Converts Astro-rendered and generated article heading metadata into
 * table-of-contents data.
 *
 * @param headings Heading metadata returned by `render(entry)`.
 * @param options Optional generated section metadata from article references.
 * @returns Display-ready article-local heading navigation data.
 */
export function articleTableOfContentsHeadings(
  headings: readonly RenderedArticleHeading[],
  options: ArticleTableOfContentsOptions = {},
): ArticleTableOfContentsHeading[] {
  const referenceHeadings = articleReferenceTableOfContentsHeadings(options);
  const includedHeadings = [...headings, ...referenceHeadings].filter(
    (heading) => includedHeadingDepths.has(heading.depth),
  );
  const minimumDepth = includedHeadings.reduce(
    (currentMinimum, heading) => Math.min(currentMinimum, heading.depth),
    Number.POSITIVE_INFINITY,
  );

  return includedHeadings.map((heading, index) => ({
    depth: heading.depth,
    href: `#${heading.slug}`,
    id: heading.slug,
    level:
      minimumDepth === Number.POSITIVE_INFINITY
        ? 1
        : heading.depth - minimumDepth + 1,
    order: index,
    text: heading.text,
  }));
}

function articleReferenceTableOfContentsHeadings({
  referenceHeadingIdPrefix = articleReferencesHeadingIdPrefix,
  references,
}: ArticleTableOfContentsOptions): RenderedArticleHeading[] {
  if (references === undefined) {
    return [];
  }

  return [
    ...(references.notes.length > 0
      ? [
          {
            depth: 2,
            slug: `${referenceHeadingIdPrefix}-notes-heading`,
            text: "Notes",
          },
        ]
      : []),
    ...(references.citations.length > 0
      ? [
          {
            depth: 2,
            slug: `${referenceHeadingIdPrefix}-bibliography-heading`,
            text: "Bibliography",
          },
        ]
      : []),
  ];
}

/**
 * Determines whether the table of contents would help enough to render.
 *
 * @param headings Normalized article table-of-contents headings.
 * @returns Whether the article should show table-of-contents navigation.
 */
export function hasUsefulTableOfContents(
  headings: readonly ArticleTableOfContentsHeading[],
): boolean {
  return headings.length >= minimumTableOfContentsHeadings;
}
