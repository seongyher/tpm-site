import { type ArticleArchiveItem, articleArchiveItems } from "./archive";
import {
  editorialCollectionById,
  type EditorialCollectionEntry,
  resolvePublishableCollection,
} from "./collections";
import { optionalFeatureRouteEntries } from "./feature-routes";
import { sectionNavigationItems, type SectionNavItem } from "./navigation";
import {
  type PublishableEntry,
  publishableFromAnnouncement,
  publishableFromArticleArchive,
  publishableIndex,
  type PublishableKind,
  type PublishableListItem,
  publishableListItems,
  visiblePublishables,
} from "./publishable";
import type {
  AnnouncementEntry,
  ArticleEntry,
  AuthorEntry,
  CategorySummary,
  PageEntry,
} from "./routes";
import type { SiteConfig, SiteRouteKey } from "./site-config";
import {
  type SupportActionsViewModel,
  supportActionsViewModel,
} from "./support";

/** Display-ready homepage featured item. */
export interface HomeFeaturedItem extends PublishableListItem {
  id: string;
  kind: PublishableKind;
  note?: string | undefined;
  slug: string;
}

/** Inputs required to build the homepage view model. */
interface HomePageViewModelInput {
  announcementLimit?: number;
  announcements: readonly AnnouncementEntry[];
  archiveItems: readonly ArticleArchiveItem[];
  collections: readonly EditorialCollectionEntry[];
  featuredCollectionId?: string;
  recentLimit?: number;
  startHereCollectionId?: string;
}

/** Display-ready homepage view model consumed by the Astro route. */
interface HomePageViewModel {
  announcementItems: PublishableListItem[];
  featuredItems: HomeFeaturedItem[];
  recentFeedItems: PublishableListItem[];
  startHereItems: PublishableListItem[];
}

/** Display-ready homepage discovery link. */
interface HomeDiscoveryLink {
  href: string;
  label: string;
}

/** Display-ready homepage lead list configuration. */
interface HomeEntryListViewModel {
  emptyText: string;
  items: PublishableListItem[];
  title: string;
  titleHref?: string | undefined;
}

/** Display-ready homepage category rail configuration. */
interface HomeCategoryRailViewModel {
  emptyText: string;
  items: readonly SectionNavItem[];
  title: string;
}

/** Display-ready homepage featured carousel configuration. */
interface HomeFeaturedCarouselViewModel {
  emptyText: string;
  fallbackLabel: string;
  items: HomeFeaturedItem[];
  title: string;
}

/** Display-ready homepage hero configuration. */
interface HomeHeroViewModel {
  darkImage: NonNullable<PageEntry["data"]["hero"]>["lightImage"];
  headingTitle: string;
  imageAlt: string;
  lightImage: NonNullable<PageEntry["data"]["hero"]>["lightImage"];
  support: SupportActionsViewModel;
  tagline?: string | undefined;
}

/** Inputs required to build the full homepage route view model. */
interface HomePageRouteViewModelInput {
  announcements: readonly AnnouncementEntry[];
  articles: readonly ArticleEntry[];
  authors: readonly AuthorEntry[];
  categories: CategorySummary[];
  collections: readonly EditorialCollectionEntry[];
  config: SiteConfig;
  home: Pick<PageEntry, "data">;
}

/** Display-ready homepage route view model consumed by `src/pages/index.astro`. */
interface HomePageRouteViewModel {
  announcements: HomeEntryListViewModel;
  canonicalPath: "/";
  categories?: HomeCategoryRailViewModel | undefined;
  description: string;
  discovery: {
    links: HomeDiscoveryLink[];
    title: string;
  };
  document: {
    canonicalPath: "/";
    description: string;
    kind: "home";
    title: string;
  };
  featured: HomeFeaturedCarouselViewModel;
  hero: HomeHeroViewModel;
  recent: {
    ariaLabel: string;
    items: PublishableListItem[];
  };
  startHere: HomeEntryListViewModel;
  title: string;
}

/**
 * Builds the homepage view model from publishable entries and collections.
 *
 * @param input Homepage content inputs.
 * @param input.announcementLimit Maximum newest announcements shown on home.
 * @param input.announcements Published announcements.
 * @param input.archiveItems Display-ready normal article archive items.
 * @param input.collections Active editor-owned collections.
 * @param input.featuredCollectionId Collection ID used for the featured carousel.
 * @param input.recentLimit Maximum newest normal articles shown on home.
 * @param input.startHereCollectionId Collection ID used for the start-here list.
 * @returns Display-ready homepage lists and feature items.
 */
export function homePageViewModel({
  announcementLimit = 3,
  announcements,
  archiveItems,
  collections,
  featuredCollectionId = "featured",
  recentLimit = 8,
  startHereCollectionId = "start-here",
}: HomePageViewModelInput): HomePageViewModel {
  const articlePublishables = archiveItems.map(publishableFromArticleArchive);
  const announcementPublishables = announcements.map(
    publishableFromAnnouncement,
  );
  const publishables = [...articlePublishables, ...announcementPublishables];
  const index = publishableIndex(publishables);
  const featuredCollection = requiredCollection(
    collections,
    featuredCollectionId,
  );
  const startHereCollection = requiredCollection(
    collections,
    startHereCollectionId,
  );
  const featuredItems = resolvePublishableCollection(
    featuredCollection,
    index,
    { requiredVisibility: "homepage" },
  ).items.map(featuredItemFromResolvedItem);
  const startHereItems = publishableListItems(
    resolvePublishableCollection(startHereCollection, index, {
      requiredVisibility: "homepage",
    }).items.map((item) => item.entry),
  );
  const announcementItems = publishableListItems(
    visiblePublishables(announcementPublishables, "homepage").slice(
      0,
      announcementLimit,
    ),
  );
  const recentFeedItems = publishableListItems(
    visiblePublishables(articlePublishables, "homepage").slice(0, recentLimit),
  );

  return {
    announcementItems,
    featuredItems,
    recentFeedItems,
    startHereItems,
  };
}

/**
 * Builds the complete homepage route view model from config and content.
 *
 * @param input Homepage page entry, configured labels, and loaded content.
 * @param input.announcements Published announcements.
 * @param input.articles Published articles.
 * @param input.authors Author metadata entries.
 * @param input.categories Category summaries.
 * @param input.collections Active editor-owned collections.
 * @param input.config Validated site-owner config.
 * @param input.home Homepage content entry.
 * @returns Display-ready props for the homepage route blocks.
 */
export function homePageRouteViewModel({
  announcements,
  articles,
  authors,
  categories,
  collections,
  config,
  home,
}: HomePageRouteViewModelInput): HomePageRouteViewModel {
  const hero = home.data.hero;

  if (hero === undefined) {
    throw new Error(
      "Missing homepage hero config at site/content/pages/index.md frontmatter.",
    );
  }

  const viewModel = homePageViewModel({
    announcementLimit: config.homepage.announcementLimit,
    announcements,
    archiveItems: articleArchiveItems(articles, categories, authors),
    collections,
    featuredCollectionId: config.homepage.featuredCollection,
    recentLimit: config.homepage.recentLimit,
    startHereCollectionId: config.homepage.startHereCollection,
  });
  const fallbackLabel = config.identity.shortTitle ?? config.identity.title;
  const description = home.data.description ?? config.identity.description;
  const title = titleWithConfig(home.data.title, config);

  return {
    announcements: {
      emptyText: config.homepage.emptyText.announcements,
      items: viewModel.announcementItems,
      title: config.homepage.labels.announcements,
      titleHref: config.features.announcements
        ? routeForKey(config, "announcements")
        : undefined,
    },
    canonicalPath: "/",
    categories: config.features.categories
      ? {
          emptyText: config.homepage.emptyText.categories,
          items: sectionNavigationItems(categories, "/"),
          title: config.homepage.labels.categories,
        }
      : undefined,
    description,
    document: {
      canonicalPath: "/",
      description,
      kind: "home",
      title,
    },
    discovery: {
      links: homepageDiscoveryLinks(config),
      title: config.homepage.labels.read,
    },
    featured: {
      emptyText: config.homepage.emptyText.featured,
      fallbackLabel,
      items: viewModel.featuredItems,
      title: config.homepage.labels.featured,
    },
    hero: {
      darkImage: hero.darkImage ?? hero.lightImage,
      headingTitle: config.identity.title,
      imageAlt: hero.imageAlt ?? home.data.title,
      lightImage: hero.lightImage,
      support: supportActionsViewModel(config),
      tagline: hero.tagline,
    },
    recent: {
      ariaLabel: config.homepage.labels.recent,
      items: viewModel.recentFeedItems,
    },
    startHere: {
      emptyText: config.homepage.emptyText.startHere,
      items: viewModel.startHereItems,
      title: config.homepage.labels.startHere,
      titleHref: config.features.collections
        ? childRoute(
            routeForKey(config, "collections"),
            config.homepage.startHereCollection,
          )
        : undefined,
    },
    title,
  };
}

/**
 * Resolves configured homepage discovery links against routes and feature flags.
 *
 * @param config Validated site config.
 * @returns Homepage discovery links safe to render for the active feature set.
 */
export function homepageDiscoveryLinks(
  config: SiteConfig,
): HomeDiscoveryLink[] {
  const disabledOptionalRoutes = new Set(
    optionalFeatureRouteEntries(config)
      .filter((entry) => !entry.enabled)
      .map((entry) => entry.routeKey),
  );

  return config.homepage.discoveryLinks.flatMap((link) => {
    if (link.route !== undefined) {
      return disabledOptionalRoutes.has(link.route)
        ? []
        : [{ href: routeForKey(config, link.route), label: link.label }];
    }

    return link.href === undefined
      ? []
      : [{ href: link.href, label: link.label }];
  });
}

function featuredItemFromResolvedItem({
  entry,
  note,
}: {
  entry: PublishableEntry;
  note?: string | undefined;
}): HomeFeaturedItem {
  return {
    ...entry,
    id: entry.slug,
    note,
  };
}

function requiredCollection(
  collections: readonly EditorialCollectionEntry[],
  id: string,
): EditorialCollectionEntry {
  const collection = editorialCollectionById(collections, id);

  if (collection === undefined) {
    throw new Error(`Missing required homepage collection "${id}".`);
  }

  return collection;
}

function routeForKey(config: SiteConfig, key: SiteRouteKey): string {
  switch (key) {
    case "allArticles": {
      return config.routes.allArticles;
    }
    case "announcements": {
      return config.routes.announcements;
    }
    case "articles": {
      return config.routes.articles;
    }
    case "authors": {
      return config.routes.authors;
    }
    case "bibliography": {
      return config.routes.bibliography;
    }
    case "categories": {
      return config.routes.categories;
    }
    case "collections": {
      return config.routes.collections;
    }
    case "feed": {
      return config.routes.feed;
    }
    case "home": {
      return config.routes.home;
    }
    case "search": {
      return config.routes.search;
    }
    case "tags": {
      return config.routes.tags;
    }
  }
}

function childRoute(base: string, child: string): string {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;

  return `${normalizedBase}${child}/`;
}

function titleWithConfig(title: string, config: SiteConfig): string {
  return `${title} | ${config.identity.title}`;
}
