import {
  articleCompilerArtifact,
  type ArticleCompilerConfigInput,
} from "./article-compiler";
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

interface ArticleViewModelOptions {
  readonly config?: ArticleCompilerConfigInput | undefined;
}

/**
 * Builds the article layout model from a content collection entry.
 *
 * @param article Article content entry.
 * @param options Optional article compiler policy overrides.
 * @returns Display-ready article metadata.
 */
export function articleViewModel(
  article: ArticleEntry,
  options: ArticleViewModelOptions = {},
): ArticleViewModel {
  const artifact = articleCompilerArtifact(article, {
    config: options.config,
  });

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
