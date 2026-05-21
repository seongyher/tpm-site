import type {
  ArticleCitation,
  ArticleReferenceBlockContent,
  ArticleReferenceData,
  ParsedBibtexEntry,
} from "./article-references/model";
import {
  citationSourceIdentityKey,
  normalizedCitationSource,
} from "./article-references/source";
import {
  type ArticleEntry,
  articleUrl,
  entryTitle,
  formatDate,
} from "./routes";

/** Article plus normalized reference data ready for bibliography aggregation. */
export interface BibliographyArticleReferencesInput {
  article: ArticleEntry;
  references: ArticleReferenceData | undefined;
}

/** One article that cited a global bibliography source. */
export interface BibliographySourceArticle {
  articleId: string;
  date: string;
  href: string;
  markerIds: readonly string[];
  publishedAt: Date;
  title: string;
}

/** Display-ready fields derived from structured BibTeX source data. */
interface BibliographyDisplayFields {
  authors?: string | undefined;
  containerTitle?: string | undefined;
  doi?: string | undefined;
  fallbackText: string;
  publisher?: string | undefined;
  sourceUrl?: string | undefined;
  title?: string | undefined;
  year?: string | undefined;
}

/** One global bibliography source entry. */
export interface BibliographyEntry {
  display: BibliographyDisplayFields;
  id: string;
  sourceArticles: readonly BibliographySourceArticle[];
  sourceContent: readonly ArticleReferenceBlockContent[];
  sourceKey: string;
  sourceText: string;
  sourceUrl?: string | undefined;
}

interface BibliographyEntryDraft {
  display: BibliographyDisplayFields;
  sourceArticles: BibliographySourceArticle[];
  sourceContent: readonly ArticleReferenceBlockContent[];
  sourceKey: string;
  sourceText: string;
  sourceUrl?: string | undefined;
}

/**
 * Builds global bibliography entries from parsed article-reference data.
 *
 * @param inputs Articles paired with normalized article-reference data.
 * @returns Deduplicated bibliography entries sorted by source text.
 */
export function bibliographyEntriesFromArticleReferences(
  inputs: readonly BibliographyArticleReferencesInput[],
): BibliographyEntry[] {
  const drafts = inputs.reduce((groups, input) => {
    for (const citation of input.references?.citations ?? []) {
      const sourceKey = bibliographySourceKey(citation.bibtex);
      const previous = groups.get(sourceKey);
      const sourceArticle = sourceArticleFromEntry(input.article, citation);
      const display = bibliographyDisplayFields(citation);
      const next = previous ?? {
        display,
        sourceArticles: [],
        sourceContent: citation.definition.children,
        sourceKey,
        sourceText: display.fallbackText,
        sourceUrl: display.sourceUrl,
      };

      groups.set(sourceKey, {
        ...next,
        sourceArticles: [...next.sourceArticles, sourceArticle],
      });
    }

    return groups;
  }, new Map<string, BibliographyEntryDraft>());

  return Array.from(drafts.values())
    .sort(compareBibliographyDrafts)
    .map((draft) => ({
      ...draft,
      id: `bibliography-${stableSlug(draft.sourceText)}-${stableHash(
        draft.sourceKey,
      )}`,
      sourceArticles: sortedSourceArticles(draft.sourceArticles),
    }));
}

function bibliographySourceKey(entry: ParsedBibtexEntry): string {
  return citationSourceIdentityKey(entry);
}

function bibliographyDisplayFields(
  citation: ArticleCitation,
): BibliographyDisplayFields {
  const source = normalizedCitationSource(citation.bibtex);
  const authors =
    source.authors.length === 0
      ? source.editors.join("; ")
      : source.authors.join("; ");
  const sourceUrl = source.url ?? doiUrl(source.doi);

  return {
    ...(authors.length === 0 ? {} : { authors }),
    ...(source.containerTitle === undefined
      ? {}
      : { containerTitle: source.containerTitle }),
    ...(source.doi === undefined ? {} : { doi: source.doi }),
    fallbackText: citation.definition.children
      .map((block) => block.text)
      .join(" ")
      .trim(),
    ...(source.publisher === undefined ? {} : { publisher: source.publisher }),
    ...(sourceUrl === undefined ? {} : { sourceUrl }),
    ...(source.title === undefined ? {} : { title: source.title }),
    ...(source.year === undefined ? {} : { year: source.year }),
  };
}

function sourceArticleFromEntry(
  article: ArticleEntry,
  citation: ArticleCitation,
): BibliographySourceArticle {
  return {
    articleId: article.id,
    date: formatDate(article.data.date),
    href: articleUrl(article.id),
    markerIds: citation.references.map((reference) => reference.id),
    publishedAt: article.data.date,
    title: entryTitle(article),
  };
}

function sortedSourceArticles(
  articles: readonly BibliographySourceArticle[],
): BibliographySourceArticle[] {
  return Array.from(
    articles
      .reduce(mergeSourceArticles, new Map<string, BibliographySourceArticle>())
      .values(),
  ).sort(compareSourceArticles);
}

function mergeSourceArticles(
  groups: Map<string, BibliographySourceArticle>,
  article: BibliographySourceArticle,
): Map<string, BibliographySourceArticle> {
  const previous = groups.get(article.href);

  groups.set(
    article.href,
    previous === undefined
      ? article
      : {
          ...previous,
          markerIds: Array.from(
            new Set([...previous.markerIds, ...article.markerIds]),
          ),
        },
  );

  return groups;
}

function compareBibliographyDrafts(
  left: BibliographyEntryDraft,
  right: BibliographyEntryDraft,
): number {
  const authorSort = compareOptionalText(
    left.display.authors,
    right.display.authors,
  );

  if (authorSort !== 0) {
    return authorSort;
  }

  const yearSort = compareOptionalText(left.display.year, right.display.year);

  if (yearSort !== 0) {
    return yearSort;
  }

  const titleSort = compareOptionalText(
    left.display.title,
    right.display.title,
  );

  return titleSort === 0
    ? left.sourceKey.localeCompare(right.sourceKey)
    : titleSort;
}

function compareSourceArticles(
  left: BibliographySourceArticle,
  right: BibliographySourceArticle,
): number {
  const dateSort = right.publishedAt.getTime() - left.publishedAt.getTime();

  return dateSort === 0 ? left.title.localeCompare(right.title) : dateSort;
}

function compareOptionalText(
  left: string | undefined,
  right: string | undefined,
): number {
  if (left === undefined && right === undefined) {
    return 0;
  }

  if (left === undefined) {
    return 1;
  }

  if (right === undefined) {
    return -1;
  }

  return left.localeCompare(right, "en", { numeric: true });
}

function doiUrl(doi: string | undefined): string | undefined {
  return doi === undefined ? undefined : `https://doi.org/${normalizeDoi(doi)}`;
}

function normalizeDoi(value: string): string {
  return value.replace(/^https?:\/\/(?:dx\.)?doi\.org\//iu, "").toLowerCase();
}

function stableSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/&/gu, "and")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "")
    .slice(0, 48);

  return slug === "" ? "source" : slug;
}

function stableHash(value: string): string {
  const hash = Array.from(value).reduce(
    (current, character) =>
      Math.imul(current ^ (character.codePointAt(0) ?? 0), 16_777_619),
    2_166_136_261,
  );

  return (hash >>> 0).toString(36);
}
