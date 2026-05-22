import type {
  MetadataBreadcrumbItem,
  MetadataListItem,
  RouteMetadataKind,
} from "../metadata/metadata";
import {
  type AnnouncementEntry,
  announcementsIndexUrl,
  type ArticleEntry,
  articlesArchiveUrl,
  articlesIndexUrl,
  type AuthorEntry,
  authorsIndexUrl,
  categoriesIndexUrl,
  type CategorySummary,
  categoryUrl,
  collectionsIndexUrl,
  collectionUrl,
  searchUrl,
  tagsIndexUrl,
} from "../routes/routes";
import {
  sectionNavigationItems,
  type SectionNavItem,
} from "../site/navigation";
import { type SiteConfig, siteConfig } from "../site/site-config";
import { announcementDirectoryListItems } from "./announcements";
import { articleArchiveItems } from "./archive";
import {
  type ArticleListItem,
  articleListItemsFromArchive,
} from "./article-list";
import type { AuthorProfile } from "./authors";
import {
  collectionListItems,
  type EditorialCollectionEntry,
} from "./collections";
import {
  publishableFromAnnouncement,
  publishableFromArticleArchive,
  publishableIndex,
} from "./publishable";
import type { TagSummary } from "./tags";

/** Metadata and layout facts common to public route view models. */
interface RouteDocumentViewModel {
  canonicalPath: string;
  description: string;
  kind: RouteMetadataKind;
  title: string;
}

/** Compact route-owned term item for overview pages. */
interface RouteTermItem extends MetadataListItem {
  count: number;
}

/** Route model for the article landing page. */
export interface ArticlesIndexRouteViewModel {
  archiveHref: string;
  categoryItems: SectionNavItem[];
  document: RouteDocumentViewModel;
  latestItems: ArticleListItem[];
  latestTitle: string;
  pageDescription: string;
}

/** Route model for the complete article archive page. */
export interface ArticlesArchiveRouteViewModel {
  document: RouteDocumentViewModel;
  items: ArticleListItem[];
  listDescription: string;
  listTitle: string;
}

/** Route model for the category overview page. */
export interface CategoryIndexRouteViewModel {
  document: RouteDocumentViewModel;
  items: SectionNavItem[];
  overviewDescription: string;
  overviewTitle: string;
}

/** Route model for the tag overview page. */
export interface TagsIndexRouteViewModel {
  document: RouteDocumentViewModel;
  emptyLabel: string;
  items: RouteTermItem[];
  overviewDescription: string;
  overviewTitle: string;
}

/** Route model for category and tag detail pages. */
export interface TermDetailRouteViewModel {
  breadcrumbs: MetadataBreadcrumbItem[];
  document: RouteDocumentViewModel;
  eyebrow: string;
  items: ArticleListItem[];
  listDescription: string;
  listTitle: string;
}

/** Route model for the author index page. */
export interface AuthorsIndexRouteViewModel {
  document: RouteDocumentViewModel;
  profileItems: MetadataListItem[];
  profiles: AuthorProfile[];
}

/** Structured author identity facts passed to JSON-LD helpers. */
interface AuthorProfileEntityViewModel {
  description?: string | undefined;
  href: string;
  name: string;
  sameAs: string[];
  type: AuthorProfile["type"];
}

/** Route model for an author profile page. */
export interface AuthorDetailRouteViewModel {
  breadcrumbs: MetadataBreadcrumbItem[];
  description: string;
  document: RouteDocumentViewModel;
  hasProfileBody: boolean;
  items: ArticleListItem[];
  profile: AuthorProfile;
  profileEntity: AuthorProfileEntityViewModel;
}

/** Route model for the announcement index page. */
export interface AnnouncementsIndexRouteViewModel {
  document: RouteDocumentViewModel;
  items: ArticleListItem[];
  listDescription: string;
  listTitle: string;
}

/** Route model for the collection index page. */
export interface CollectionsIndexRouteViewModel {
  document: RouteDocumentViewModel;
  emptyLabel: string;
  itemNoun: string;
  itemNounPlural: string;
  items: RouteTermItem[];
  overviewDescription: string;
  overviewTitle: string;
}

/** Route model for the search page. */
export interface SearchRouteViewModel {
  document: RouteDocumentViewModel;
}

/** Route model for a collection detail page. */
export interface CollectionDetailRouteViewModel {
  breadcrumbs: MetadataBreadcrumbItem[];
  description: string;
  document: RouteDocumentViewModel;
  eyebrow: string;
  items: ArticleListItem[];
  title: string;
}

interface ArticlesIndexRouteInput {
  articles: readonly ArticleEntry[];
  authors: readonly AuthorEntry[];
  categories: CategorySummary[];
  config?: SiteConfig | undefined;
}

interface ArticlesArchiveRouteInput {
  articles: readonly ArticleEntry[];
  authors: readonly AuthorEntry[];
  categories: CategorySummary[];
  config?: SiteConfig | undefined;
}

interface CategoryDetailRouteInput {
  authors: readonly AuthorEntry[];
  category: CategorySummary;
  config?: SiteConfig | undefined;
}

interface TagDetailRouteInput {
  authors: readonly AuthorEntry[];
  categories: CategorySummary[];
  config?: SiteConfig | undefined;
  tag: TagSummary;
}

interface AuthorDetailRouteInput {
  authors: readonly AuthorEntry[];
  categories: CategorySummary[];
  config?: SiteConfig | undefined;
  profile: AuthorProfile;
}

interface CollectionDetailRouteInput {
  announcements: readonly AnnouncementEntry[];
  articles: readonly ArticleEntry[];
  authors: readonly AuthorEntry[];
  categories: CategorySummary[];
  collection: EditorialCollectionEntry;
  config?: SiteConfig | undefined;
}

/**
 * Builds article landing page data from content summaries.
 *
 * @param input Article, category, author, and config inputs.
 * @param input.articles Published article entries.
 * @param input.authors Author metadata entries.
 * @param input.categories Category summaries.
 * @param input.config Optional site configuration override.
 * @returns Article landing route view model.
 */
export function articlesIndexRouteViewModel({
  articles,
  authors,
  categories,
  config = siteConfig,
}: ArticlesIndexRouteInput): ArticlesIndexRouteViewModel {
  const archiveItems = articleArchiveItems(articles, categories, authors);
  const latestItems = articleListItemsFromArchive(archiveItems.slice(0, 8));

  return {
    archiveHref: articlesArchiveUrl(),
    categoryItems: sectionNavigationItems(categories, articlesIndexUrl()),
    document: documentViewModel({
      canonicalPath: articlesIndexUrl(),
      description: `Browse ${config.identity.title} by category, recent writing, and full archive.`,
      kind: "articles-index",
      title: "Articles",
      config,
    }),
    latestItems,
    latestTitle: "Latest Articles",
    pageDescription:
      "Browse articles by category, start with recent writing, or go straight to the complete article archive.",
  };
}

/**
 * Builds complete article archive route data.
 *
 * @param input Article, category, author, and config inputs.
 * @param input.articles Published article entries.
 * @param input.authors Author metadata entries.
 * @param input.categories Category summaries.
 * @param input.config Optional site configuration override.
 * @returns Article archive route view model.
 */
export function articlesArchiveRouteViewModel({
  articles,
  authors,
  categories,
  config = siteConfig,
}: ArticlesArchiveRouteInput): ArticlesArchiveRouteViewModel {
  const items = articleListItemsFromArchive(
    articleArchiveItems(articles, categories, authors),
  );

  return {
    document: documentViewModel({
      canonicalPath: articlesArchiveUrl(),
      description: `Complete chronological article archive for ${config.identity.title}.`,
      kind: "articles-archive",
      title: "All Articles",
      config,
    }),
    items,
    listDescription: "The complete chronological archive.",
    listTitle: "All Articles",
  };
}

/**
 * Builds category index route data.
 *
 * @param categories Public category summaries.
 * @param config Site configuration.
 * @returns Category index route view model.
 */
export function categoriesIndexRouteViewModel(
  categories: CategorySummary[],
  config: SiteConfig = siteConfig,
): CategoryIndexRouteViewModel {
  return {
    document: documentViewModel({
      canonicalPath: categoriesIndexUrl(),
      description: "Browse articles by category.",
      kind: "category-index",
      title: "Categories",
      config,
    }),
    items: sectionNavigationItems(categories, categoriesIndexUrl()),
    overviewDescription: "Browse the archive by subject.",
    overviewTitle: "Categories",
  };
}

/**
 * Builds category detail route data.
 *
 * @param input Category, author, and config inputs.
 * @param input.authors Author metadata entries.
 * @param input.category Category summary for the route.
 * @param input.config Optional site configuration override.
 * @returns Category detail route view model.
 */
export function categoryDetailRouteViewModel({
  authors,
  category,
  config = siteConfig,
}: CategoryDetailRouteInput): TermDetailRouteViewModel {
  const href = categoryUrl(category.slug);
  const description =
    category.description ?? `Articles filed under ${category.title}.`;

  return {
    breadcrumbs: [
      { href: "/", title: "Home" },
      { href: categoriesIndexUrl(), title: "Categories" },
      { href, title: category.title },
    ],
    document: documentViewModel({
      canonicalPath: href,
      description,
      kind: "category-detail",
      title: category.title,
      config,
    }),
    eyebrow: "Category",
    items: articleListItemsFromArchive(
      articleArchiveItems(category.articles, [category], authors),
    ),
    listDescription: description,
    listTitle: category.title,
  };
}

/**
 * Builds tag index route data.
 *
 * @param tags Public tag summaries.
 * @param config Site configuration.
 * @returns Tag index route view model.
 */
export function tagsIndexRouteViewModel(
  tags: readonly TagSummary[],
  config: SiteConfig = siteConfig,
): TagsIndexRouteViewModel {
  return {
    document: documentViewModel({
      canonicalPath: tagsIndexUrl(),
      description: "Browse articles by tag.",
      kind: "tag-index",
      title: "Tags",
      config,
    }),
    emptyLabel: "No article tags are available yet.",
    items: tags.map((tag) => ({
      count: tag.articles.length,
      href: tag.href,
      title: tag.label,
    })),
    overviewDescription:
      "Browse articles by recurring topics, references, and motifs.",
    overviewTitle: "Tags",
  };
}

/**
 * Builds tag detail route data.
 *
 * @param input Tag, category, author, and config inputs.
 * @param input.authors Author metadata entries.
 * @param input.categories Category summaries.
 * @param input.config Optional site configuration override.
 * @param input.tag Tag summary for the route.
 * @returns Tag detail route view model.
 */
export function tagDetailRouteViewModel({
  authors,
  categories,
  config = siteConfig,
  tag,
}: TagDetailRouteInput): TermDetailRouteViewModel {
  const description = `Articles tagged ${tag.label}.`;

  return {
    breadcrumbs: [
      { href: "/", title: "Home" },
      { href: tagsIndexUrl(), title: "Tags" },
      { href: tag.href, title: tag.label },
    ],
    document: documentViewModel({
      canonicalPath: tag.href,
      description,
      kind: "tag-detail",
      title: `${tag.label} | Tags`,
      config,
    }),
    eyebrow: "Tag",
    items: articleListItemsFromArchive(
      articleArchiveItems(tag.articles, categories, authors),
    ),
    listDescription: description,
    listTitle: tag.label,
  };
}

/**
 * Builds author index route data.
 *
 * @param profiles Public author profiles.
 * @param config Site configuration.
 * @returns Author index route view model.
 */
export function authorsIndexRouteViewModel(
  profiles: readonly AuthorProfile[],
  config: SiteConfig = siteConfig,
): AuthorsIndexRouteViewModel {
  return {
    document: documentViewModel({
      canonicalPath: authorsIndexUrl(),
      description: `Browse contributors and collectives in ${config.identity.title} archive.`,
      kind: "author-index",
      title: "Authors",
      config,
    }),
    profileItems: profiles.map((profile) => ({
      description: profile.shortBio,
      href: profile.href,
      title: profile.displayName,
    })),
    profiles: Array.from(profiles),
  };
}

/**
 * Builds author detail route data.
 *
 * @param input Author profile, category, author, and config inputs.
 * @param input.authors Author metadata entries.
 * @param input.categories Category summaries.
 * @param input.config Optional site configuration override.
 * @param input.profile Author profile for the route.
 * @returns Author detail route view model.
 */
export function authorDetailRouteViewModel({
  authors,
  categories,
  config = siteConfig,
  profile,
}: AuthorDetailRouteInput): AuthorDetailRouteViewModel {
  const hasProfileBody = (profile.entry.body ?? "").trim().length > 0;
  const description =
    profile.shortBio ??
    `Articles by ${profile.displayName} in ${config.identity.title} archive.`;

  return {
    breadcrumbs: [
      { href: "/", title: "Home" },
      { href: authorsIndexUrl(), title: "Authors" },
      { href: profile.href, title: profile.displayName },
    ],
    description,
    document: documentViewModel({
      canonicalPath: profile.href,
      description,
      kind: "author-profile",
      title: profile.displayName,
      config,
    }),
    hasProfileBody,
    items: articleListItemsFromArchive(
      articleArchiveItems(profile.articles, categories, authors),
    ),
    profile,
    profileEntity: {
      description: profile.shortBio,
      href: profile.href,
      name: profile.displayName,
      sameAs: [
        ...(profile.website === undefined ? [] : [profile.website]),
        ...profile.socials.map((social) => social.href),
      ],
      type: profile.type,
    },
  };
}

/**
 * Builds announcement index route data.
 *
 * @param announcements Published announcements.
 * @param config Site configuration.
 * @returns Announcement index route view model.
 */
export function announcementsIndexRouteViewModel(
  announcements: readonly AnnouncementEntry[],
  config: SiteConfig = siteConfig,
): AnnouncementsIndexRouteViewModel {
  const description = `Updates from ${config.identity.title}.`;

  return {
    document: documentViewModel({
      canonicalPath: announcementsIndexUrl(),
      description,
      kind: "announcements-index",
      title: "Announcements",
      config,
    }),
    items: announcementDirectoryListItems(announcements),
    listDescription: description,
    listTitle: "Announcements",
  };
}

/**
 * Builds collection index route data.
 *
 * @param collections Active editorial collections.
 * @param config Site configuration.
 * @returns Collection index route view model.
 */
export function collectionsIndexRouteViewModel(
  collections: readonly EditorialCollectionEntry[],
  config: SiteConfig = siteConfig,
): CollectionsIndexRouteViewModel {
  return {
    document: documentViewModel({
      canonicalPath: collectionsIndexUrl(),
      description: `Curated article and announcement collections from ${config.identity.title}.`,
      kind: "collection-index",
      title: "Collections",
      config,
    }),
    emptyLabel: "No collections are available yet.",
    itemNoun: "entry",
    itemNounPlural: "entries",
    items: collections.map((collection) => ({
      count: collection.data.items.length,
      description: collection.data.description,
      href: collectionUrl(collection.id),
      title: collection.data.title,
    })),
    overviewDescription: `Curated paths through ${config.identity.title} articles and announcements.`,
    overviewTitle: "Collections",
  };
}

/**
 * Builds search route data.
 *
 * @param config Site configuration.
 * @returns Search route view model.
 */
export function searchRouteViewModel(
  config: SiteConfig = siteConfig,
): SearchRouteViewModel {
  return {
    document: documentViewModel({
      canonicalPath: searchUrl(),
      description: `Search ${config.identity.title} archive.`,
      kind: "search",
      title: "Search",
      config,
    }),
  };
}

/**
 * Builds collection detail route data.
 *
 * @param input Collection, publishable source, author, category, and config inputs.
 * @param input.announcements Announcement entries.
 * @param input.articles Published article entries.
 * @param input.authors Author metadata entries.
 * @param input.categories Category summaries.
 * @param input.collection Editorial collection entry for the route.
 * @param input.config Optional site configuration override.
 * @returns Collection detail route view model.
 */
export function collectionDetailRouteViewModel({
  announcements,
  articles,
  authors,
  categories,
  collection,
  config = siteConfig,
}: CollectionDetailRouteInput): CollectionDetailRouteViewModel {
  const archiveItems = articleArchiveItems(articles, categories, authors);
  const publishables = publishableIndex([
    ...archiveItems.map(publishableFromArticleArchive),
    ...announcements.map(publishableFromAnnouncement),
  ]);
  const title =
    collection.id === "featured" ? "Featured Articles" : collection.data.title;
  const href = collectionUrl(collection.id);
  const description =
    collection.data.description ??
    `Curated ${config.identity.title} entries in ${title}.`;

  return {
    breadcrumbs: [
      { href: "/", title: "Home" },
      { href: collectionsIndexUrl(), title: "Collections" },
      { href, title },
    ],
    description,
    document: documentViewModel({
      canonicalPath: href,
      description,
      kind: "collection-detail",
      title: `${title} | Collections`,
      config,
    }),
    eyebrow: "Collection",
    items: collectionListItems(collection, publishables),
    title,
  };
}

interface DocumentViewModelInput {
  canonicalPath: string;
  config: SiteConfig;
  description: string;
  kind: RouteMetadataKind;
  title: string;
}

function documentViewModel({
  canonicalPath,
  config,
  description,
  kind,
  title,
}: DocumentViewModelInput): RouteDocumentViewModel {
  return {
    canonicalPath,
    description,
    kind,
    title: `${title} | ${config.identity.title}`,
  };
}
