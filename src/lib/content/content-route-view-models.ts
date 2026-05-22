import type { MetadataListItem, RouteMetadataKind } from "../metadata/metadata";
import {
  type BibliographyArticleReferencesInput,
  bibliographyEntriesFromArticleReferences,
  type BibliographyEntry,
} from "../references/bibliography";
import { bibliographyUrl, type PageEntry, pageUrl } from "../routes/routes";
import { type SiteConfig, siteConfig } from "../site/site-config";

/** Metadata and layout facts common to content route view models. */
interface ContentRouteDocumentViewModel {
  canonicalPath: string;
  description: string;
  kind: RouteMetadataKind;
  title: string;
}

/** Route model for Markdown-backed standalone pages. */
export interface MarkdownPageRouteViewModel {
  description: string;
  document: ContentRouteDocumentViewModel;
  title: string;
}

/** Route model for the global bibliography page. */
export interface BibliographyRouteViewModel {
  document: ContentRouteDocumentViewModel;
  entries: BibliographyEntry[];
  items: MetadataListItem[];
}

/**
 * Builds route data for a Markdown-backed standalone page.
 *
 * @param page Page content entry.
 * @param slug Public page slug.
 * @param config Site configuration.
 * @returns Markdown page route view model.
 */
export function markdownPageRouteViewModel(
  page: PageEntry,
  slug: string,
  config: SiteConfig = siteConfig,
): MarkdownPageRouteViewModel {
  const description =
    page.data.description ?? `About ${config.identity.title}.`;

  return {
    description,
    document: documentViewModel({
      canonicalPath: pageUrl(slug),
      description,
      kind: "page",
      title: page.data.title,
      config,
    }),
    title: page.data.title,
  };
}

/**
 * Builds route data for the global bibliography page.
 *
 * @param input Articles paired with normalized article-reference data.
 * @param config Site configuration.
 * @returns Bibliography route view model.
 */
export function bibliographyRouteViewModel(
  input: readonly BibliographyArticleReferencesInput[],
  config: SiteConfig = siteConfig,
): BibliographyRouteViewModel {
  const entries = bibliographyEntriesFromArticleReferences(input);

  return {
    document: documentViewModel({
      canonicalPath: bibliographyUrl(),
      description: `Sources cited by articles in ${config.identity.title}.`,
      kind: "bibliography",
      title: "Bibliography",
      config,
    }),
    entries,
    items: entries.map((entry) => ({
      description: entry.display.authors,
      href: `${bibliographyUrl()}#${entry.id}`,
      title: entry.display.title ?? entry.sourceText,
    })),
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
}: DocumentViewModelInput): ContentRouteDocumentViewModel {
  return {
    canonicalPath,
    description,
    kind,
    title: `${title} | ${config.identity.title}`,
  };
}
