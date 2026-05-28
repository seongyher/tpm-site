import {
  type ArticleEntry,
  type AuthorEntry,
  authorName,
  authorUrl,
  sortNewestFirst,
} from "./routes";

/** Public author type values used by author metadata and JSON-LD. */
type AuthorType = AuthorEntry["data"]["type"];

/** Public author social/profile link. */
export interface AuthorSocialLink {
  href: string;
  label: string;
}

/** Display-ready author data for bylines and compact author links. */
export interface AuthorSummary {
  displayName: string;
  href: string;
  id: string;
  shortBio?: string | undefined;
  type: AuthorType;
}

/** Display-ready author profile data for author index and detail pages. */
export interface AuthorProfile extends AuthorSummary {
  aliases: readonly string[];
  articles: readonly ArticleEntry[];
  entry: AuthorEntry;
  socials: readonly AuthorSocialLink[];
  website?: string | undefined;
}

/**
 * Determines whether an author profile has enough visible content to render a
 * biography surface.
 *
 * @param profile Author profile display data.
 * @param options Optional render context.
 * @param options.hasProfileBody Whether a long-form profile body will render.
 * @returns True when a bio section would render useful content.
 */
export function hasUsefulAuthorProfileContent(
  profile: Pick<AuthorProfile, "shortBio" | "socials" | "website">,
  options: { hasProfileBody?: boolean } = {},
): boolean {
  return (
    options.hasProfileBody === true ||
    profile.shortBio !== undefined ||
    profile.socials.length > 0 ||
    profile.website !== undefined
  );
}

/**
 * Builds display-ready author summary data.
 *
 * @param entry Author content entry.
 * @returns Author summary for bylines and compact links.
 */
function authorSummary(entry: AuthorEntry): AuthorSummary {
  return {
    displayName: entry.data.displayName,
    href: authorUrl(entry.id),
    id: entry.id,
    shortBio: entry.data.shortBio,
    type: entry.data.type,
  };
}

/**
 * Builds display-ready author profiles from author entries and articles.
 *
 * @param authors Author metadata entries.
 * @param articles Published article entries.
 * @returns Author profiles sorted by display name.
 */
export function authorProfiles(
  authors: readonly AuthorEntry[],
  articles: readonly ArticleEntry[],
): AuthorProfile[] {
  assertUniqueAuthorAliases(authors);

  return sortAuthorEntries(authors).map((author) => ({
    ...authorSummary(author),
    aliases: authorAliasValues(author),
    articles: articlesForAuthor(author, articles, authors),
    entry: author,
    socials: author.data.socials,
    website: author.data.website,
  }));
}

/**
 * Resolves structured author summaries for one article.
 *
 * @param article Article content entry.
 * @param authors Known author metadata entries.
 * @returns Ordered author summaries, or an empty array when the byline is unknown.
 */
export function authorSummariesForArticle(
  article: ArticleEntry,
  authors: readonly AuthorEntry[],
): AuthorSummary[] {
  return authorEntriesForByline(authorName(article), authors).map(
    authorSummary,
  );
}

/**
 * Resolves the display byline for one article.
 *
 * @param article Article content entry.
 * @param authors Known author metadata entries.
 * @returns Structured display names when known, otherwise the legacy byline.
 */
export function authorDisplayNameForArticle(
  article: ArticleEntry,
  authors: readonly AuthorEntry[],
): string {
  const summaries = authorSummariesForArticle(article, authors);

  return summaries.length > 0
    ? summaries.map((author) => author.displayName).join(" & ")
    : authorName(article);
}

/**
 * Resolves author entries for a legacy byline string.
 *
 * @param byline Legacy article author string.
 * @param authors Known author metadata entries.
 * @returns Ordered author entries when every byline part is known.
 */
export function authorEntriesForByline(
  byline: string,
  authors: readonly AuthorEntry[],
): AuthorEntry[] {
  const aliasMap = authorAliasMap(authors);
  const parts = splitByline(byline);
  const matches = parts
    .map((part) => aliasMap.get(normalizeAuthorAlias(part)))
    .filter(isAuthorEntry);

  return matches.length === parts.length ? matches : [];
}

/**
 * Loads author metadata entries.
 *
 * @returns Author content entries sorted by display name.
 */
export async function getAuthorEntries(): Promise<AuthorEntry[]> {
  const { getCollection } = await import("astro:content");
  const entries = await getCollection("authors");
  assertUniqueAuthorAliases(entries);

  return sortAuthorEntries(entries);
}

/**
 * Loads complete author profiles with article relationships.
 *
 * @returns Author profiles with published articles.
 */
export async function getAuthorProfiles(): Promise<AuthorProfile[]> {
  // Coverage note: this default loader crosses Astro's virtual content module
  // boundary. Unit tests cover profile derivation through injected author and
  // article entries; route/container tests cover the real content integration.
  const { getArticles } = await import("./content");

  return authorProfiles(await getAuthorEntries(), await getArticles());
}

/**
 * Finds legacy article bylines that do not resolve to known authors.
 *
 * @param articles Article entries to inspect.
 * @param authors Known author metadata entries.
 * @returns Unique unknown bylines sorted alphabetically.
 */
export function unknownAuthorBylines(
  articles: readonly ArticleEntry[],
  authors: readonly AuthorEntry[],
): string[] {
  return Array.from(
    new Set(
      articles
        .map(authorName)
        .filter(
          (byline) => authorEntriesForByline(byline, authors).length === 0,
        ),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

/**
 * Normalizes an author alias for stable matching.
 *
 * @param value Free-form author alias.
 * @returns Case-insensitive, whitespace-normalized alias key.
 */
export function normalizeAuthorAlias(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function articlesForAuthor(
  author: AuthorEntry,
  articles: readonly ArticleEntry[],
  authors: readonly AuthorEntry[],
): ArticleEntry[] {
  return sortNewestFirst(
    articles.filter((article) =>
      authorEntriesForByline(authorName(article), authors).some(
        (entry) => entry.id === author.id,
      ),
    ),
  );
}

function assertUniqueAuthorAliases(authors: readonly AuthorEntry[]): void {
  const duplicates = duplicateAuthorAliases(authors);

  if (duplicates.length > 0) {
    throw new Error(`Duplicate author aliases: ${duplicates.join(", ")}.`);
  }
}

function authorAliasMap(
  authors: readonly AuthorEntry[],
): Map<string, AuthorEntry> {
  assertUniqueAuthorAliases(authors);

  return new Map(
    authors.flatMap((author) =>
      authorAliasValues(author).map(
        (alias) => [normalizeAuthorAlias(alias), author] as const,
      ),
    ),
  );
}

function authorAliasValues(author: AuthorEntry): string[] {
  return Array.from(new Set([author.data.displayName, ...author.data.aliases]));
}

function duplicateAuthorAliases(authors: readonly AuthorEntry[]): string[] {
  const seen = new Map<string, string>();
  const duplicates = new Set<string>();

  authors.forEach((author) => {
    authorAliasValues(author).forEach((alias) => {
      const key = normalizeAuthorAlias(alias);
      const existingAuthorId = seen.get(key);

      if (existingAuthorId !== undefined && existingAuthorId !== author.id) {
        duplicates.add(alias);
      } else {
        seen.set(key, author.id);
      }
    });
  });

  return Array.from(duplicates).sort((left, right) =>
    left.localeCompare(right),
  );
}

function isAuthorEntry(value: AuthorEntry | undefined): value is AuthorEntry {
  return value !== undefined;
}

function sortAuthorEntries(authors: readonly AuthorEntry[]): AuthorEntry[] {
  return Array.from(authors).sort((left, right) =>
    left.data.displayName.localeCompare(right.data.displayName),
  );
}

function splitByline(byline: string): string[] {
  return byline
    .split(/\s*&\s*/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
