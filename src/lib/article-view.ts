import { articleCompilerArtifact } from "./article-compiler";
import type { ArticleEntry } from "./routes";

/** Display and metadata fields needed by the article layout. */
export interface ArticleViewModel {
  author: string;
  canonicalPath: string;
  categorySlug: string;
  date: Date;
  description: string;
  formattedDate: string;
  imageAlt?: string | undefined;
  title: string;
}

/**
 * Builds the article layout model from a content collection entry.
 *
 * @param article Article content entry.
 * @returns Display-ready article metadata.
 */
export function articleViewModel(article: ArticleEntry): ArticleViewModel {
  const artifact = articleCompilerArtifact(article);

  return {
    author: artifact.author,
    canonicalPath: artifact.canonicalPath,
    categorySlug: artifact.categorySlug,
    date: artifact.date,
    description: artifact.description,
    formattedDate: artifact.formattedDate,
    imageAlt: artifact.imageAlt,
    title: artifact.title,
  };
}
