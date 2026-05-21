import type { ImageMetadata } from "astro";

import { articleArchiveItems } from "./archive";
import { articleCompilerArtifact } from "./article-compiler";
import {
  type ArticleContinuityItem,
  articleContinuityItem,
  articleContinuitySelection,
} from "./article-continuity";
import {
  type ArticleListItem,
  articleListItemsFromArchive,
} from "./article-list";
import {
  type ArticlePdfViewModel,
  type ArticleScholarMetaViewModel,
  articleScholarMetaViewModel,
} from "./article-pdf";
import type { ArticleReferenceData } from "./article-references/model";
import type { ArticleTableOfContentsHeading } from "./article-toc";
import { type ArticleViewModel, articleViewModel } from "./article-view";
import {
  type AuthorProfile,
  authorProfiles,
  authorSummariesForArticle,
  type AuthorSummary,
  getAuthorEntries,
  hasUsefulAuthorProfileContent,
} from "./authors";
import {
  type ArticleCitationMenuViewModel,
  articleCitationMenuViewModel,
} from "./citations/article-citation";
import { homepageDiscoveryLinks } from "./home";
import {
  type ArticleEntry,
  type AuthorEntry,
  bibliographyUrl,
  type CategorySummary,
  categoryUrl,
} from "./routes";
import {
  type SemanticDetailsViewModel,
  semanticDetailsViewModel,
} from "./semantic-metadata";
import { absoluteUrl } from "./seo";
import {
  type ArticleShareMenuViewModel,
  articleShareMenuViewModel,
} from "./share-targets";
import { type SiteConfig, siteConfig } from "./site-config";
import {
  type SocialPreviewImage,
  type SocialPreviewImageOptimizer,
  socialPreviewImageViewModel,
} from "./social-images";
import { type SupportBlockViewModel, supportBlockViewModel } from "./support";

/** Optional action shown beside article bibliography section headings. */
interface ArticleBibliographyActionViewModel {
  href: string;
  label: string;
}

/** Display-ready article page data consumed by `ArticleLayout`. */
export interface ArticlePageViewModel {
  article: ArticleViewModel;
  authorProfilesWithBio: AuthorProfile[];
  authors: AuthorSummary[];
  bibliographyAction?: ArticleBibliographyActionViewModel | undefined;
  canonicalUrl: string;
  category?: CategorySummary | undefined;
  categoryHref?: string | undefined;
  citation: ArticleCitationMenuViewModel;
  continuity?: ArticleContinuityItem | undefined;
  documentTitle: string;
  moreInCategory: ArticleListItem[];
  pdf?: ArticlePdfViewModel | undefined;
  profileLinksEnabled: boolean;
  readingNavigationLinks: Array<{ href: string; label: string }>;
  scholarMeta: ArticleScholarMetaViewModel;
  searchable: boolean;
  semanticDetails?: SemanticDetailsViewModel | undefined;
  share: ArticleShareMenuViewModel;
  showTableOfContents: boolean;
  socialPreviewImage: SocialPreviewImage;
  support: SupportBlockViewModel;
  tagsVisible: boolean;
}

interface ArticlePageViewModelInput {
  article: ArticleEntry;
  articleReferences?: ArticleReferenceData | undefined;
  config?: SiteConfig | undefined;
  content?: Partial<ArticlePageContentInput> | undefined;
  optimizeImage: SocialPreviewImageOptimizer;
  origin: string;
  site?: string | undefined | URL;
  tableOfContentsHeadings?: readonly ArticleTableOfContentsHeading[];
}

interface ArticlePageContentInput {
  allArticles: readonly ArticleEntry[];
  authorEntries: readonly AuthorEntry[];
  categories: CategorySummary[];
  fallbackSocialPreviewImage: ImageMetadata;
}

/**
 * Builds article-page data outside the Astro rendering template.
 *
 * @param input Article, site URL data, optimizer adapter, and optional fixtures.
 * @param input.article Article content entry.
 * @param input.articleReferences Parsed article note and citation data.
 * @param input.config Optional site configuration override.
 * @param input.content Optional content fixture override.
 * @param input.optimizeImage Astro image optimizer adapter.
 * @param input.origin Current request origin fallback.
 * @param input.site Configured Astro site origin, when available.
 * @param input.tableOfContentsHeadings Rendered article heading list.
 * @returns Display-ready article page view model.
 */
export async function articlePageViewModel({
  article,
  articleReferences,
  config = siteConfig,
  content,
  optimizeImage,
  origin,
  site,
  tableOfContentsHeadings = [],
}: ArticlePageViewModelInput): Promise<ArticlePageViewModel> {
  const artifact = articleCompilerArtifact(article, {
    articleReferences,
    config,
    tableOfContentsHeadings,
  });
  const articleView = articleViewModel(article, { config });
  const [allArticles, authorEntries, categories, fallbackSocialPreviewImage] =
    await Promise.all([
      content?.allArticles ?? getArticles(),
      content?.authorEntries ?? getAuthorEntries(),
      content?.categories ?? getCategories(),
      content?.fallbackSocialPreviewImage ?? getSiteSocialFallbackImage(),
    ]);
  const socialPreviewImage = await socialPreviewImageViewModel({
    alt: artifact.imageFacts.alt ?? artifact.title,
    fallback: fallbackSocialPreviewImage,
    optimize: optimizeImage,
    source: artifact.imageFacts.source,
  });
  const canonicalUrl = absoluteUrl(artifact.canonicalPath, site ?? origin);
  const authors = authorSummariesForArticle(article, authorEntries);
  const category = categories.find(
    (summary) => summary.slug === articleView.categorySlug,
  );
  const categoryHref =
    config.features.categories && category !== undefined
      ? categoryUrl(category.slug)
      : undefined;
  const scholarMeta = articleScholarMetaViewModel({
    article,
    articleReferences,
    authors,
    config,
    site,
  });

  return {
    article: articleView,
    authorProfilesWithBio: articleAuthorProfilesWithBio(
      authors,
      authorEntries,
      allArticles,
    ),
    authors,
    bibliographyAction: config.features.bibliography
      ? {
          href: bibliographyUrl(),
          label: "View Site Bibliography",
        }
      : undefined,
    canonicalUrl,
    category,
    categoryHref,
    citation: articleCitationMenuViewModel({
      articleId: article.id,
      authors,
      canonicalUrl,
      legacyAuthor: articleView.author,
      publishedAt: articleView.date,
      title: articleView.title,
    }),
    continuity: articleContinuity(
      article,
      allArticles,
      categories,
      authorEntries,
    ),
    documentTitle: `${articleView.title} | ${config.identity.title}`,
    moreInCategory: moreInCategoryItems(
      article,
      category,
      categories,
      authorEntries,
    ),
    pdf: scholarMeta.pdf,
    profileLinksEnabled: config.features.authors,
    readingNavigationLinks: homepageDiscoveryLinks(config),
    scholarMeta,
    searchable: config.features.search && artifact.surfaces.search,
    semanticDetails: semanticDetailsViewModel(article.data.semantic),
    share: articleShareMenuViewModel({
      articleUrl: canonicalUrl,
      description: articleView.description,
      image: socialPreviewImage,
      targetIds: config.share.targets,
      title: articleView.title,
    }),
    showTableOfContents: artifact.tableOfContents.useful,
    socialPreviewImage,
    support: supportBlockViewModel(config),
    tagsVisible: config.features.tags && artifact.tags.length > 0,
  };
}

async function getArticles(): Promise<ArticleEntry[]> {
  const content = await import("./content");

  return content.getArticles();
}

async function getCategories(): Promise<CategorySummary[]> {
  const content = await import("./content");

  return content.getCategories();
}

async function getSiteSocialFallbackImage(): Promise<ImageMetadata> {
  const content = await import("./content");

  return content.getSiteSocialFallbackImage();
}

function articleAuthorProfilesWithBio(
  authors: readonly AuthorSummary[],
  authorEntries: readonly AuthorEntry[],
  allArticles: readonly ArticleEntry[],
): AuthorProfile[] {
  const authorProfileMap = new Map(
    authorProfiles(authorEntries, allArticles).map((profile) => [
      profile.id,
      profile,
    ]),
  );

  return authors
    .map((author) => authorProfileMap.get(author.id))
    .filter((profile) => profile !== undefined)
    .filter((profile) => hasUsefulAuthorProfileContent(profile));
}

function articleContinuity(
  article: ArticleEntry,
  allArticles: readonly ArticleEntry[],
  categories: CategorySummary[],
  authorEntries: readonly AuthorEntry[],
): ArticleContinuityItem | undefined {
  const selection = articleContinuitySelection(article, allArticles);

  return selection === undefined
    ? undefined
    : articleContinuityItem(selection, categories, authorEntries);
}

function moreInCategoryItems(
  article: ArticleEntry,
  category: CategorySummary | undefined,
  categories: CategorySummary[],
  authorEntries: readonly AuthorEntry[],
): ArticleListItem[] {
  return category === undefined
    ? []
    : articleListItemsFromArchive(
        articleArchiveItems(
          category.articles
            .filter((categoryArticle) => categoryArticle.id !== article.id)
            .slice(0, 3),
          categories,
          authorEntries,
        ),
      );
}
