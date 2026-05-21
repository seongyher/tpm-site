import { articleCompilerArtifact } from "./article-compiler";
import type { ArticleReferenceData } from "./article-references/model";
import type { AuthorSummary } from "./authors";
import { routeOutputBasePath } from "./route-registry";
import { type ArticleEntry, authorName } from "./routes";
import { absoluteUrl } from "./seo";
import { type SiteConfig, siteConfig } from "./site-config";

/** Display-ready Scholar metadata for one article page. */
export interface ArticleScholarMetaViewModel {
  abstract: string;
  authors: readonly string[];
  keywords: readonly string[];
  language: string;
  pdf?: ArticlePdfViewModel | undefined;
  publicationDate: Date;
  publicationDateForScholar: string;
  references: readonly string[];
  title: string;
}

/** Display-ready PDF data for one PDF-eligible article page. */
export interface ArticlePdfViewModel {
  articleUrl: string;
  authors: readonly string[];
  citationPdfUrl: string;
  pdfHref: string;
  pdfOutputPath: string;
  publicationDate: Date;
  publicationDateForScholar: string;
  title: string;
}

interface ArticlePdfViewModelInput {
  article: ArticleEntry;
  articleReferences?: ArticleReferenceData | undefined;
  authors?: readonly AuthorSummary[];
  config?:
    | Pick<SiteConfig, "contentDefaults" | "features" | "identity">
    | undefined;
  site?: string | undefined | URL;
}

/**
 * Builds Scholar metadata plus optional same-directory PDF data for an article.
 *
 * @param input Article entry, resolved authors, and optional site origin.
 * @param input.article Article content entry.
 * @param input.articleReferences Parsed article note and citation data.
 * @param input.authors Resolved structured author summaries.
 * @param input.config Optional site config override for feature/default policy.
 * @param input.site Optional site origin for absolute Scholar URLs.
 * @returns Display-ready Scholar metadata for components and build checks.
 */
export function articleScholarMetaViewModel({
  article,
  articleReferences,
  authors = [],
  config = siteConfig,
  site,
}: ArticlePdfViewModelInput): ArticleScholarMetaViewModel {
  const artifact = articleCompilerArtifact(article, { config });
  const authorNames = articlePdfAuthorNames(article, authors);
  const publicationDate = artifact.date;
  const publicationDateForScholar = scholarPublicationDate(publicationDate);
  const title = artifact.title;
  const pdfOutput = artifact.outputs.pdf;

  return {
    abstract: artifact.description,
    authors: authorNames,
    keywords: artifact.tags,
    language: config.identity.language,
    pdf:
      pdfOutput === undefined
        ? undefined
        : {
            articleUrl: absoluteUrl(artifact.canonicalPath, site),
            authors: authorNames,
            citationPdfUrl: absoluteUrl(pdfOutput.href, site),
            pdfHref: pdfOutput.href,
            pdfOutputPath: pdfOutput.path,
            publicationDate,
            publicationDateForScholar,
            title,
          },
    publicationDate,
    publicationDateForScholar,
    references: scholarCitationReferences(articleReferences),
    title,
  };
}

/**
 * Builds same-directory PDF data for a PDF-eligible article.
 *
 * @param input Article entry, resolved authors, and optional site origin.
 * @returns Display-ready PDF metadata, or undefined when PDF output is disabled.
 */
export function articlePdfViewModel(
  input: ArticlePdfViewModelInput,
): ArticlePdfViewModel | undefined {
  return articleScholarMetaViewModel(input).pdf;
}

/**
 * Checks whether a published article should receive generated PDF surfaces.
 *
 * @param article Article content entry.
 * @param config Site config with PDF feature and default policy.
 * @returns True unless the article explicitly opts out with `pdf: false`.
 */
export function articlePdfEnabled(
  article: ArticleEntry,
  config: Pick<SiteConfig, "contentDefaults" | "features"> = siteConfig,
): boolean {
  return articleCompilerArtifact(article, { config }).pdfEnabled;
}

/**
 * Builds the public href for an article's generated PDF.
 *
 * @param slug Public article slug.
 * @param route Configured article route root.
 * @returns Same-directory public PDF path.
 */
export function articlePdfHref(
  slug: string,
  route = siteConfig.routes.articles,
): string {
  return `${articleRouteRoot(route)}${slug}/${slug}.pdf`;
}

/**
 * Builds the generated `dist` path for an article PDF.
 *
 * @param slug Public article slug.
 * @param route Configured article route root.
 * @returns Relative path inside `dist`.
 */
export function articlePdfOutputPath(
  slug: string,
  route = siteConfig.routes.articles,
): string {
  return articlePdfOutputPathForRoute(slug, route);
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

function articlePdfOutputPathForRoute(slug: string, route: string): string {
  const basePath = routeOutputBasePath(route);

  return basePath === ""
    ? `${slug}/${slug}.pdf`
    : `${basePath}/${slug}/${slug}.pdf`;
}

function articleRouteRoot(route: string): string {
  return route.endsWith("/") ? route : `${route}/`;
}

function articlePdfAuthorNames(
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
