import type { ArticleReferenceData } from "./article-references/model";
import {
  type ArticleTableOfContentsHeading,
  hasUsefulTableOfContents,
} from "./article-toc";
import {
  normalizePublishableVisibility,
  type PublishableVisibility,
} from "./publishable";
import {
  type ArticleEntry,
  articleSlug,
  articleUrl,
  authorName,
  categorySlug,
  entryDate,
  entryTitle,
  excerpt,
  formatDate,
} from "./routes";
import { type SiteConfig, siteConfig } from "./site-config";

/** Stable compiled facts for one article source entry. */
export interface ArticleCompilerArtifact {
  readonly author: string;
  readonly canonicalPath: string;
  readonly categorySlug: string;
  readonly date: Date;
  readonly description: string;
  readonly draft: boolean;
  readonly formattedDate: string;
  readonly id: string;
  readonly image: ArticleEntry["data"]["image"];
  readonly imageAlt?: string | undefined;
  readonly pdfEnabled: boolean;
  readonly references?: ArticleReferenceData | undefined;
  readonly slug: string;
  readonly tableOfContents: {
    readonly headings: readonly ArticleTableOfContentsHeading[];
    readonly useful: boolean;
  };
  readonly tags: readonly string[];
  readonly title: string;
  readonly updated?: Date | undefined;
  readonly visibility: PublishableVisibility;
}

interface ArticleCompilerOptions {
  readonly articleReferences?: ArticleReferenceData | undefined;
  readonly config?: Pick<SiteConfig, "contentDefaults" | "features">;
  readonly tableOfContentsHeadings?:
    | readonly ArticleTableOfContentsHeading[]
    | undefined;
}

/**
 * Compiles stable article facts shared by article pages and downstream
 * generated outputs.
 *
 * @param article Article source entry.
 * @param options Optional site config policy overrides.
 * @returns Typed article compiler artifact.
 */
export function articleCompilerArtifact(
  article: ArticleEntry,
  options: ArticleCompilerOptions = {},
): ArticleCompilerArtifact {
  const config = options.config ?? siteConfig;
  const date = entryDate(article);
  const slug = articleSlug(article);

  return {
    author: authorName(article),
    canonicalPath: articleUrl(slug),
    categorySlug: categorySlug(article),
    date,
    description: excerpt(article),
    draft: article.data.draft,
    formattedDate: formatDate(date),
    id: article.id,
    image: article.data.image,
    imageAlt: article.data.imageAlt,
    pdfEnabled: articlePdfEnabledFromArtifactInput(article, config),
    references: options.articleReferences,
    slug,
    tableOfContents: {
      headings: options.tableOfContentsHeadings ?? [],
      useful: hasUsefulTableOfContents(options.tableOfContentsHeadings ?? []),
    },
    tags: article.data.tags,
    title: entryTitle(article),
    updated: article.data.updated,
    visibility: normalizePublishableVisibility(
      article.data.visibility,
      config.contentDefaults.articles.visibility,
    ),
  };
}

function articlePdfEnabledFromArtifactInput(
  article: ArticleEntry,
  config: Pick<SiteConfig, "contentDefaults" | "features">,
): boolean {
  if (!config.features.pdf) {
    return false;
  }

  return "pdf" in article.data
    ? article.data.pdf
    : config.contentDefaults.articles.pdf.enabled;
}
