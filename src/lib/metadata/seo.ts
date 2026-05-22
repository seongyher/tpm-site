import type { AuthorSummary } from "../content/authors";
import {
  type AnnouncementEntry,
  type ArticleEntry,
  articleUrl,
  authorName,
  type CategorySummary,
  SITE_URL,
} from "../routes/routes";
import { siteConfig } from "../site/site-config";

/** Optional normalized metadata for article JSON-LD output. */
interface ArticleBlogPostingJsonLdOptions {
  about?: ReadonlyArray<Record<"@id", string>> | undefined;
  image?: string | undefined;
}

interface PublishableBlogPostingJsonLdOptions {
  about?: ReadonlyArray<Record<"@id", string>> | undefined;
  authors?: readonly AuthorSummary[] | undefined;
  canonicalPath: string;
  fallbackAuthorName: string;
  image?: string | undefined;
  section?: string | undefined;
}

type PublishableBlogPostingEntry = Pick<
  AnnouncementEntry | ArticleEntry,
  "data" | "id"
>;

/**
 * Resolves a site-relative or absolute URL against the configured site origin.
 *
 * @param pathOrUrl Relative path or absolute URL.
 * @param site Astro site origin when available.
 * @returns Absolute URL string.
 */
export function absoluteUrl(
  pathOrUrl: string,
  site: string | undefined | URL,
): string {
  if (hasAbsoluteUrlPrefix(pathOrUrl)) {
    return pathOrUrl;
  }

  const base = site?.toString() ?? SITE_URL;
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = pathOrUrl.startsWith("/")
    ? pathOrUrl
    : `/${pathOrUrl}`;

  return `${normalizedBase}${normalizedPath}`;
}

/**
 * Builds BlogPosting JSON-LD for an article page.
 *
 * @param article Article content entry.
 * @param category Category summary for the article, when available.
 * @param site Astro site origin when available.
 * @param authors Optional structured author summaries.
 * @param options Optional normalized metadata overrides.
 * @returns Schema.org BlogPosting object ready for serialization.
 */
export function articleBlogPostingJsonLd(
  article: ArticleEntry,
  category: CategorySummary | undefined,
  site: string | undefined | URL,
  authors: readonly AuthorSummary[] = [],
  options: ArticleBlogPostingJsonLdOptions = {},
): Record<string, unknown> {
  return publishableBlogPostingJsonLd(article, site, {
    about: options.about,
    authors,
    canonicalPath: articleUrl(article.id),
    fallbackAuthorName: authorName(article),
    image: options.image,
    section: category?.title ?? category?.slug,
  });
}

/**
 * Builds BlogPosting JSON-LD for article-like publishable entries.
 *
 * @param entry Article or announcement content entry.
 * @param site Astro site origin when available.
 * @param options Normalized route, author, image, and section metadata.
 * @returns Schema.org BlogPosting object ready for serialization.
 */
export function publishableBlogPostingJsonLd(
  entry: PublishableBlogPostingEntry,
  site: string | undefined | URL,
  options: PublishableBlogPostingJsonLdOptions,
): Record<string, unknown> {
  const canonicalUrl = absoluteUrl(options.canonicalPath, site);
  const absoluteImage =
    options.image === undefined ? undefined : absoluteUrl(options.image, site);
  const siteRoot = absoluteUrl("/", site).replace(/\/+$/u, "/");

  return compactJsonLd({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonicalUrl}#article`,
    about:
      options.about === undefined || options.about.length === 0
        ? undefined
        : options.about,
    articleSection: options.section,
    author:
      options.authors !== undefined && options.authors.length > 0
        ? options.authors.map((author) => authorJsonLd(author, site))
        : {
            "@type": "Person",
            name: options.fallbackAuthorName,
          },
    dateModified: entry.data.updated?.toISOString(),
    datePublished: entry.data.date.toISOString(),
    description: entry.data.description,
    headline: entry.data.title,
    image: absoluteImage,
    inLanguage: siteConfig.identity.language,
    isPartOf: { "@id": `${siteRoot}#website` },
    keywords: entry.data.tags,
    mainEntityOfPage: { "@id": `${canonicalUrl}#webpage` },
    publisher: { "@id": `${siteRoot}#publisher` },
    url: canonicalUrl,
  });
}

/**
 * Serializes JSON-LD so it is safe to place inside an HTML script element.
 *
 * @param value Structured data object to serialize.
 * @returns JSON string with HTML-significant less-than characters escaped.
 */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function hasAbsoluteUrlPrefix(value: string): boolean {
  if (value.startsWith("//")) {
    return true;
  }

  const schemeSeparator = value.indexOf(":");
  if (schemeSeparator <= 0) {
    return false;
  }

  const scheme = value.slice(0, schemeSeparator);
  return Array.from(scheme).every(isUrlSchemeCharacter);
}

function isUrlSchemeCharacter(character: string, index: number): boolean {
  const codePoint = character.codePointAt(0);

  if (codePoint === undefined) {
    return false;
  }

  const isAsciiLetter =
    (codePoint >= 65 && codePoint <= 90) ||
    (codePoint >= 97 && codePoint <= 122);
  const isAsciiDigit = codePoint >= 48 && codePoint <= 57;

  return (
    isAsciiLetter ||
    (index > 0 &&
      (isAsciiDigit ||
        character === "+" ||
        character === "." ||
        character === "-"))
  );
}

function authorJsonLd(
  author: AuthorSummary,
  site: string | undefined | URL,
): Record<string, string> {
  return {
    "@type":
      author.type === "organization" || author.type === "collective"
        ? "Organization"
        : "Person",
    name: author.displayName,
    url: absoluteUrl(author.href, site),
  };
}

function compactJsonLd(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  );
}
