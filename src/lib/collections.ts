import {
  type PublishableEntry,
  type PublishableListItem,
  publishableListItem,
  type PublishableVisibilitySurface,
  publishableVisibleOn,
} from "./publishable";
import type { EditorialCollectionEntry } from "./routes";

/** Astro content entry for one editor-owned publishable collection. */
export type { EditorialCollectionEntry };

/** Normalized collection item reference. */
interface CollectionItemReference {
  note?: string | undefined;
  slug: string;
}

/** Resolved collection item with its publishable entry. */
interface ResolvedCollectionItem {
  entry: PublishableEntry;
  note?: string | undefined;
}

/** Resolved editor-owned collection. */
interface ResolvedPublishableCollection {
  description?: string | undefined;
  entry: EditorialCollectionEntry;
  id: string;
  items: ResolvedCollectionItem[];
  title: string;
}

interface ResolveCollectionOptions {
  requiredVisibility?: PublishableVisibilitySurface | undefined;
}

/**
 * Filters out draft collection entries.
 *
 * @param entries Editorial collection entries.
 * @returns Non-draft collections in deterministic ID order.
 */
export function activeEditorialCollections(
  entries: readonly EditorialCollectionEntry[],
): EditorialCollectionEntry[] {
  return entries
    .filter((entry) => !entry.data.draft)
    .toSorted((a, b) => a.id.localeCompare(b.id));
}

/**
 * Finds one active collection by ID.
 *
 * @param entries Editorial collection entries.
 * @param id Collection content entry ID.
 * @returns Matching non-draft collection.
 */
export function editorialCollectionById(
  entries: readonly EditorialCollectionEntry[],
  id: string,
): EditorialCollectionEntry | undefined {
  return activeEditorialCollections(entries).find((entry) => entry.id === id);
}

/**
 * Normalizes string/object collection item frontmatter into one shape.
 *
 * @param entry Editorial collection entry.
 * @returns Collection item references in manual order.
 */
export function collectionItemReferences(
  entry: EditorialCollectionEntry,
): CollectionItemReference[] {
  return entry.data.items.map((item) =>
    typeof item === "string" ? { slug: item } : item,
  );
}

/**
 * Resolves an editorial collection against the global publishable index.
 *
 * @param entry Editorial collection entry.
 * @param publishables Publishable lookup by global slug.
 * @param options Resolution options.
 * @param options.requiredVisibility Visibility surface required for every item.
 * @returns Resolved collection preserving manual order.
 */
export function resolvePublishableCollection(
  entry: EditorialCollectionEntry,
  publishables: ReadonlyMap<string, PublishableEntry>,
  options: ResolveCollectionOptions = {},
): ResolvedPublishableCollection {
  const references = collectionItemReferences(entry);
  assertUniqueCollectionSlugs(entry, references);

  return {
    description: entry.data.description,
    entry,
    id: entry.id,
    items: references.map((reference) =>
      resolveCollectionItem(entry, reference, publishables, options),
    ),
    title: entry.data.title,
  };
}

/**
 * Converts a collection into directory-visible compact list items.
 *
 * @param entry Editorial collection entry.
 * @param publishables Publishable lookup by global slug.
 * @returns Directory-visible items in manual collection order.
 */
export function collectionDirectoryListItems(
  entry: EditorialCollectionEntry,
  publishables: ReadonlyMap<string, PublishableEntry>,
): PublishableListItem[] {
  return collectionListItems(entry, publishables);
}

/**
 * Converts a collection into collection-visible compact list items.
 *
 * @param entry Editorial collection entry.
 * @param publishables Publishable lookup by global slug.
 * @returns Collection-visible items in manual collection order.
 */
export function collectionListItems(
  entry: EditorialCollectionEntry,
  publishables: ReadonlyMap<string, PublishableEntry>,
): PublishableListItem[] {
  return resolvePublishableCollection(entry, publishables)
    .items.filter((item) => publishableVisibleOn(item.entry, "collections"))
    .map(({ entry: publishable, note }) => ({
      ...publishableListItem(publishable),
      description: note ?? publishable.description,
    }));
}

function assertUniqueCollectionSlugs(
  entry: EditorialCollectionEntry,
  references: readonly CollectionItemReference[],
): void {
  const seen = new Set<string>();
  const duplicates = references
    .map((reference) => reference.slug)
    .filter((slug) => {
      if (seen.has(slug)) {
        return true;
      }
      seen.add(slug);
      return false;
    });

  if (duplicates.length > 0) {
    throw new Error(
      `Collection "${entry.id}" contains duplicate item slugs: ${Array.from(
        new Set(duplicates),
      ).join(", ")}.`,
    );
  }
}

function resolveCollectionItem(
  entry: EditorialCollectionEntry,
  reference: CollectionItemReference,
  publishables: ReadonlyMap<string, PublishableEntry>,
  { requiredVisibility }: ResolveCollectionOptions,
): ResolvedCollectionItem {
  const publishable = publishables.get(reference.slug);

  if (publishable === undefined) {
    throw new Error(
      `Collection "${entry.id}" references unknown publishable slug "${reference.slug}".`,
    );
  }

  if (
    requiredVisibility !== undefined &&
    !publishableVisibleOn(publishable, requiredVisibility)
  ) {
    throw new Error(
      `Collection "${entry.id}" references "${reference.slug}", but that entry is hidden from ${requiredVisibility}.`,
    );
  }

  return {
    entry: publishable,
    note: reference.note,
  };
}
