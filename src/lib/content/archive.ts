import type { ImageMetadata } from "astro";

import {
  type ArticleEntry,
  articleUrl,
  type AuthorEntry,
  authorName,
  categorySlug,
  type CategorySummary,
  categoryUrl,
  entryDate,
  entryTitle,
  excerpt,
  formatDate,
} from "../routes/routes";
import { siteConfig } from "../site/site-config";
import {
  authorDisplayNameForArticle,
  authorSummariesForArticle,
  type AuthorSummary,
} from "./authors";

/** Display-ready image metadata for article list previews. */
interface ArticleArchiveImage {
  alt: string;
  src: ImageMetadata;
}

/** Display-ready archive item for article listing pages. */
export interface ArticleArchiveItem {
  article: ArticleEntry;
  author: string;
  authors: AuthorSummary[];
  category?:
    | undefined
    | {
        title: string;
        url: string;
      };
  date: string;
  description: string;
  image?: ArticleArchiveImage | undefined;
  title: string;
  url: string;
}

/**
 * Builds article archive view models from articles and category metadata.
 *
 * @param articles Published article entries sorted for display.
 * @param categories Category summaries used for display labels.
 * @param authors Optional author metadata used to build structured bylines.
 * @returns Display-ready archive items.
 */
export function articleArchiveItems(
  articles: readonly ArticleEntry[],
  categories: CategorySummary[],
  authors: readonly AuthorEntry[] = [],
): ArticleArchiveItem[] {
  const categoryMap = new Map(
    categories.map((category) => [category.slug, category] as const),
  );

  return articles.map((article) => {
    const category = categoryMap.get(categorySlug(article));
    const title = entryTitle(article);

    return {
      article,
      author:
        authors.length > 0
          ? authorDisplayNameForArticle(article, authors)
          : authorName(article),
      authors:
        authors.length > 0 ? authorSummariesForArticle(article, authors) : [],
      category:
        !siteConfig.features.categories || category === undefined
          ? undefined
          : {
              title: category.title,
              url: categoryUrl(category.slug),
            },
      date: formatDate(entryDate(article)),
      description: excerpt(article),
      image:
        article.data.image === undefined
          ? undefined
          : {
              alt: article.data.imageAlt ?? title,
              src: article.data.image,
            },
      title,
      url: articleUrl(article.id),
    };
  });
}
