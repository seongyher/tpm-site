import type { AnnouncementEntry } from "../routes/routes";
import type { PublishableListItem } from "./article-list";
import {
  publishableFromAnnouncement,
  publishableListItem,
  publishableListItems,
  visiblePublishables,
} from "./publishable";

/**
 * Converts an announcement entry into the shared article-list display shape.
 *
 * @param announcement Announcement content entry.
 * @returns Component-ready list item.
 */
export function announcementListItem(
  announcement: AnnouncementEntry,
): PublishableListItem {
  return publishableListItem(publishableFromAnnouncement(announcement));
}

/**
 * Converts announcement entries into shared article-list display props.
 *
 * @param announcements Announcement content entries.
 * @returns Component-ready list items.
 */
export function announcementListItems(
  announcements: readonly AnnouncementEntry[],
): PublishableListItem[] {
  return announcements.map(announcementListItem);
}

/**
 * Converts directory-visible announcements into shared article-list props.
 *
 * @param announcements Announcement content entries.
 * @returns Component-ready list items visible on public directory surfaces.
 */
export function announcementDirectoryListItems(
  announcements: readonly AnnouncementEntry[],
): PublishableListItem[] {
  return publishableListItems(
    visiblePublishables(
      announcements.map(publishableFromAnnouncement),
      "directory",
    ),
  );
}
