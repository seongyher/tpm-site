import type { ArticleArchiveItem } from "./archive";
import {
  publishableFromArticleArchive,
  type PublishableListItem,
  publishableListItem,
  publishableListItems,
  type PublishableVisibilitySurface,
  visiblePublishables,
} from "./publishable";

/** Compatibility name for the generic publishable-entry list item. */
export type ArticleListItem = PublishableListItem;
export type { PublishableListItem };

/**
 * Converts an archive item into the shared article-list item shape.
 *
 * @param item Archive item from content helpers.
 * @returns Component-ready article list item.
 */
export function articleListItemFromArchive(
  item: ArticleArchiveItem,
): ArticleListItem {
  return publishableListItem(publishableFromArticleArchive(item));
}

/**
 * Converts archive items into shared article-list item props.
 *
 * @param items Archive items from content helpers.
 * @param surface Visibility surface required for each item.
 * @returns Component-ready article list items.
 */
export function articleListItemsFromArchive(
  items: readonly ArticleArchiveItem[],
  surface: PublishableVisibilitySurface = "directory",
): ArticleListItem[] {
  return publishableListItems(
    visiblePublishables(items.map(publishableFromArticleArchive), surface),
  );
}
