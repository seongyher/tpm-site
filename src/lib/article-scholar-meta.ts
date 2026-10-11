import type { ArticleReferenceData } from "./article-references/model";
import type { AuthorSummary } from "./authors";
import { type ArticleEntry, authorName, entryDate, entryTitle } from "./routes";
import { type SiteConfig, siteConfig } from "./site-config";

/** Display-ready Scholar metadata for one article page. */
export interface ArticleScholarMetaViewModel {
  abstract: string;
  authors: readonly string[];
  keywords: readonly string[];
  language: string;
  publicationDate: Date;
  publicationDateForScholar: string;
  references: readonly string[];
  title: string;
}

interface ArticleScholarMetaInput {
  article: ArticleEntry;
  articleReferences?: ArticleReferenceData | undefined;
  authors?: readonly AuthorSummary[];
  config?: Pick<SiteConfig, "identity"> | undefined;
}

/**
 * Builds Scholar metadata for an article.
 *
 * @param input Article entry, resolved authors, and site identity.
 * @param input.article Article content entry.
 * @param input.articleReferences Parsed article note and citation data.
 * @param input.authors Resolved structured author summaries.
 * @param input.config Optional site identity override for language metadata.
 * @returns Display-ready Scholar metadata for components and build checks.
 */
export function articleScholarMetaViewModel({
  article,
  articleReferences,
  authors = [],
  config = siteConfig,
}: ArticleScholarMetaInput): ArticleScholarMetaViewModel {
  const authorNames = articleScholarAuthorNames(article, authors);
  const publicationDate = entryDate(article);
  const publicationDateForScholar = scholarPublicationDate(publicationDate);
  const title = entryTitle(article);

  return {
    abstract: article.data.description,
    authors: authorNames,
    keywords: article.data.tags,
    language: config.identity.language,
    publicationDate,
    publicationDateForScholar,
    references: scholarCitationReferences(articleReferences),
    title,
  };
}

/**
 * Formats a date for Google Scholar's supported publication-date metadata.
 *
 * @param date Publication date.
 * @returns Date in `YYYY/MM/DD` format.
 */
export function scholarPublicationDate(date: Date): string {
  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");

  return `${year}/${month}/${day}`;
}

function articleScholarAuthorNames(
  article: ArticleEntry,
  authors: readonly AuthorSummary[],
): string[] {
  const structuredAuthors = authors
    .map((author) => author.displayName.trim())
    .filter((name) => name.length > 0);

  if (structuredAuthors.length > 0) {
    return structuredAuthors;
  }

  return [authorName(article)];
}

function scholarCitationReferences(
  articleReferences: ArticleReferenceData | undefined,
): string[] {
  if (articleReferences === undefined) {
    return [];
  }

  return articleReferences.citations
    .map((citation) =>
      citation.definition.children
        .map((block) => block.text)
        .join(" ")
        .replace(/\s+/gu, " ")
        .trim(),
    )
    .filter((reference) => reference.length > 0)
    .filter(
      (reference, index, references) => references.indexOf(reference) === index,
    );
}
