import { articleArchiveItems } from "./archive";
import {
  type ArticleListItem,
  articleListItemFromArchive,
} from "./article-list";
import {
  type ArticleEntry,
  type AuthorEntry,
  type CategorySummary,
  entryDate,
} from "./routes";

/** Direction of the chronological article continuation. */
type ArticleContinuityDirection = "next" | "previous";

/** Selected neighboring article for end-of-article continuity. */
export interface ArticleContinuitySelection {
  article: ArticleEntry;
  direction: ArticleContinuityDirection;
}

/** Display-ready end-of-article continuity item. */
export interface ArticleContinuityItem {
  item: ArticleListItem;
  label: "Next Article" | "Previous Article";
}

/**
 * Selects the chronological article neighbor for a current article.
 *
 * @param current Current article entry.
 * @param articles Published article entries.
 * @returns Immediate newer article, or immediate older article for newest entries.
 */
export function articleContinuitySelection(
  current: ArticleEntry,
  articles: readonly ArticleEntry[],
): ArticleContinuitySelection | undefined {
  const chronologicalArticles = sortOldestFirst(articles);
  const currentIndex = chronologicalArticles.findIndex(
    (article) => article.id === current.id,
  );

  if (currentIndex === -1) {
    return undefined;
  }

  const nextArticle = chronologicalArticles[currentIndex + 1];
  if (nextArticle !== undefined) {
    return {
      article: nextArticle,
      direction: "next",
    };
  }

  const previousArticle = chronologicalArticles[currentIndex - 1];
  if (previousArticle !== undefined) {
    return {
      article: previousArticle,
      direction: "previous",
    };
  }

  return undefined;
}

/**
 * Converts a selected continuity article into display props.
 *
 * @param selection Selected neighboring article.
 * @param categories Category metadata for article list display.
 * @param authors Author metadata for article list display.
 * @returns Display-ready continuity item.
 */
export function articleContinuityItem(
  selection: ArticleContinuitySelection,
  categories: CategorySummary[],
  authors: readonly AuthorEntry[] = [],
): ArticleContinuityItem {
  const [archiveItem] = articleArchiveItems(
    [selection.article],
    categories,
    authors,
  );

  // Coverage note: `articleArchiveItems([article])` emits exactly one item for
  // valid article entries. This guard keeps the view-model failure explicit if
  // that upstream invariant changes.
  if (archiveItem === undefined) {
    throw new Error(
      `Unable to build article continuity item for "${selection.article.id}".`,
    );
  }

  return {
    item: articleListItemFromArchive(archiveItem),
    label: selection.direction === "next" ? "Next Article" : "Previous Article",
  };
}

function sortOldestFirst(articles: readonly ArticleEntry[]): ArticleEntry[] {
  return Array.from(articles).sort((left, right) => {
    const leftTime = entryDate(left).getTime();
    const rightTime = entryDate(right).getTime();
    const dateSort = leftTime - rightTime;
    return dateSort !== 0 ? dateSort : left.id.localeCompare(right.id);
  });
}
