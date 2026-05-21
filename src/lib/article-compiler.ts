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
  routeChildIndexOutputPath,
  routeOutputBasePath,
} from "./route-registry";
import {
  type ArticleEntry,
  articleSlug,
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
  readonly imageFacts: {
    readonly alt?: string | undefined;
    readonly source: ArticleEntry["data"]["image"];
  };
  readonly outputs: {
    readonly html: {
      readonly path: string;
    };
    readonly pdf?: {
      readonly href: string;
      readonly path: string;
    };
  };
  readonly pdfEnabled: boolean;
  readonly references?: ArticleReferenceData | undefined;
  readonly route: {
    readonly path: string;
    readonly root: string;
    readonly routeKey: "articles";
  };
  readonly slug: string;
  readonly source: {
    readonly collection: "articles";
    readonly filePath?: string | undefined;
    readonly format: "markdown" | "mdx" | "unknown";
  };
  readonly surfaces: {
    readonly collections: boolean;
    readonly directory: boolean;
    readonly external: boolean;
    readonly feed: boolean;
    readonly homepage: boolean;
    readonly pdf: boolean;
    readonly related: boolean;
    readonly search: boolean;
    readonly sitemap: boolean;
  };
  readonly tableOfContents: {
    readonly headings: readonly ArticleTableOfContentsHeading[];
    readonly useful: boolean;
  };
  readonly tags: readonly string[];
  readonly title: string;
  readonly updated?: Date | undefined;
  readonly visibility: PublishableVisibility;
}

/** Site policy slice accepted by article compiler consumers. */
export type ArticleCompilerConfigInput = Partial<Pick<SiteConfig, "routes">> &
  Pick<SiteConfig, "contentDefaults" | "features">;

type ArticleCompilerConfig = Pick<
  SiteConfig,
  "contentDefaults" | "features" | "routes"
>;

interface ArticleCompilerOptions {
  readonly articleReferences?: ArticleReferenceData | undefined;
  readonly config?: ArticleCompilerConfigInput | undefined;
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
  const config = articleCompilerConfig(options.config);
  const date = entryDate(article);
  const slug = articleSlug(article);
  const canonicalPath = articleCanonicalPath(slug, config);
  const visibility = normalizePublishableVisibility(
    article.data.visibility,
    config.contentDefaults.articles.visibility,
  );
  const pdfEnabled = articlePdfEnabledFromArtifactInput(article, config);
  const surfaces = articleSurfaces(article, visibility, pdfEnabled);

  return {
    author: authorName(article),
    canonicalPath,
    categorySlug: categorySlug(article),
    date,
    description: excerpt(article),
    draft: article.data.draft,
    formattedDate: formatDate(date),
    id: article.id,
    image: article.data.image,
    imageAlt: article.data.imageAlt,
    imageFacts: {
      alt: article.data.imageAlt,
      source: article.data.image,
    },
    outputs: {
      html: {
        path: routeChildIndexOutputPath(config.routes.articles, slug),
      },
      ...(surfaces.pdf
        ? {
            pdf: {
              href: articlePdfHrefFromRoute(slug, config.routes.articles),
              path: articlePdfOutputPathFromRoute(slug, config.routes.articles),
            },
          }
        : {}),
    },
    pdfEnabled,
    references: options.articleReferences,
    route: {
      path: canonicalPath,
      routeKey: "articles",
      root: config.routes.articles,
    },
    slug,
    source: {
      collection: "articles",
      filePath: article.filePath,
      format: articleSourceFormat(article.filePath),
    },
    surfaces,
    tableOfContents: {
      headings: options.tableOfContentsHeadings ?? [],
      useful: hasUsefulTableOfContents(options.tableOfContentsHeadings ?? []),
    },
    tags: article.data.tags,
    title: entryTitle(article),
    updated: article.data.updated,
    visibility,
  };
}

function articleCompilerConfig(
  config: ArticleCompilerConfigInput | undefined,
): ArticleCompilerConfig {
  return {
    contentDefaults: config?.contentDefaults ?? siteConfig.contentDefaults,
    features: config?.features ?? siteConfig.features,
    routes: config?.routes ?? siteConfig.routes,
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

function articleCanonicalPath(
  slug: string,
  config: Pick<SiteConfig, "routes">,
): string {
  const root = articleRouteRoot(config.routes.articles);

  return `${root}${slug}/`;
}

function articlePdfHrefFromRoute(slug: string, route: string): string {
  return `${articleRouteRoot(route)}${slug}/${slug}.pdf`;
}

function articlePdfOutputPathFromRoute(slug: string, route: string): string {
  const basePath = routeOutputBasePath(route);

  return basePath === ""
    ? `${slug}/${slug}.pdf`
    : `${basePath}/${slug}/${slug}.pdf`;
}

function articleRouteRoot(route: string): string {
  return route.endsWith("/") ? route : `${route}/`;
}

function articleSourceFormat(
  filePath: string | undefined,
): ArticleCompilerArtifact["source"]["format"] {
  if (filePath?.endsWith(".mdx") === true) {
    return "mdx";
  }

  if (filePath?.endsWith(".md") === true) {
    return "markdown";
  }

  return "unknown";
}

function articleSurfaces(
  article: ArticleEntry,
  visibility: PublishableVisibility,
  pdfEnabled: boolean,
): ArticleCompilerArtifact["surfaces"] {
  const published = !article.data.draft;

  return {
    collections: published && visibility.collections,
    directory: published && visibility.directory,
    external: published && visibility.external,
    feed: published && visibility.feed,
    homepage: published && visibility.homepage,
    pdf: published && pdfEnabled && visibility.pdf,
    related: published && visibility.related,
    search: published && visibility.search,
    sitemap: published && visibility.sitemap,
  };
}
