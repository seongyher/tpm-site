import type { PublishableListItem } from "../../../lib/content/publishable";

/** Metadata token shown in compact entry rows. */
export type CompactEntryMetaItem =
  | string
  | {
      href?: string | undefined;
      label: string;
      prefetch?: "hover" | "load" | "tap" | "viewport" | boolean | undefined;
    };

/** Publishable entry item with compact-list display overrides. */
export interface CompactEntryItem extends PublishableListItem {
  metaItems?: readonly CompactEntryMetaItem[] | undefined;
  prefetch?: "hover" | "load" | "tap" | "viewport" | boolean | undefined;
}

/**
 * Builds display metadata for a compact entry row.
 *
 * @param item Publishable entry or explicit compact entry item.
 * @returns Ordered metadata tokens for the compact row.
 */
export function compactEntryMetaItems(
  item: CompactEntryItem,
): CompactEntryMetaItem[] {
  if (item.metaItems !== undefined) {
    return Array.from(item.metaItems);
  }

  const categoryMeta =
    item.category === undefined
      ? []
      : [
          {
            href: item.category.href,
            label: item.category.title,
            prefetch: "hover" as const,
          },
        ];
  const dateMeta =
    item.date === undefined || item.date === "" ? [] : [item.date];
  const authorMeta =
    item.author === undefined || item.author === "" ? [] : [item.author];

  return [...categoryMeta, ...dateMeta, ...authorMeta];
}

/**
 * Chooses the default prefetch intent for a compact row link.
 *
 * @param item Publishable entry or explicit compact entry item.
 * @returns Astro prefetch strategy for internal links.
 */
export function compactEntryPrefetch(
  item: CompactEntryItem,
): "hover" | "load" | "tap" | "viewport" | boolean | undefined {
  if (item.prefetch !== undefined) {
    return item.prefetch;
  }

  return item.href.startsWith("/") ? "hover" : undefined;
}
