import type { StudioAppState } from "../state/studio-state";
import {
  type StudioCommandAvailability,
  studioCommandAvailability,
  type StudioCommandId,
  type StudioCommandRecord,
  studioCommandRegistry,
  type StudioCommandSafety,
} from "./studio-commands";

/** User-facing command groups rendered in palettes and menus. */
export type StudioCommandGroup =
  | "authoring"
  | "navigation"
  | "preview-publish"
  | "recovery"
  | "workspace";

/** Command record plus dynamic state for visible command surfaces. */
export interface StudioCommandSurfaceItem {
  /** Dynamic availability for the current app state. */
  readonly availability: StudioCommandAvailability;
  /** Human-facing group label for menus and palette sections. */
  readonly groupLabel: string;
  /** Static command metadata. */
  readonly record: StudioCommandRecord;
  /** Optional shortcut label. */
  readonly shortcut?: string | undefined;
}

/** Label plus items for grouped command palette rendering. */
export type StudioCommandSurfaceGroup = readonly [
  string,
  readonly StudioCommandSurfaceItem[],
];

const paletteCommandIds = new Set<StudioCommandId>([
  "article.create",
  "article.directory.open",
  "article.open",
  "article.restoreVersion",
  "article.saveDraft",
  "format.blockquote",
  "format.bold",
  "format.bulletedList",
  "format.code",
  "format.codeBlock",
  "format.italic",
  "format.numberedList",
  "insert.footnote",
  "insert.heading",
  "insert.image",
  "insert.link",
  "media.insertSelected",
  "media.open",
  "pane.togglePreview",
  "pane.toggleSidebar",
  "preview.open",
  "preview.openExternal",
  "project.createSite",
  "project.openHome",
  "project.openSite",
  "project.showRecent",
  "publish.cancel",
  "publish.confirm",
  "publish.done",
  "publish.openConfirm",
  "publish.prepare",
  "publish.retry",
  "recovery.locateProject",
  "recovery.removeRecent",
  "restore.cancel",
  "restore.confirm",
  "settings.open",
]);

/**
 * Builds visible command records for command palettes and shared menus.
 *
 * @param state Current Studio app state.
 * @returns Command records with availability and display metadata.
 */
export function studioCommandSurfaceItems(
  state: StudioAppState,
): readonly StudioCommandSurfaceItem[] {
  return studioCommandRegistry
    .filter((record) => paletteCommandIds.has(record.id))
    .map((record) => commandSurfaceItem(record, state));
}

/**
 * Filters commands using deterministic text matching instead of UI-local rules.
 *
 * @param items Items to filter.
 * @param query Current command palette query.
 * @returns Items matching the query.
 */
export function filterStudioCommandItems(
  items: readonly StudioCommandSurfaceItem[],
  query: string,
): readonly StudioCommandSurfaceItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return normalizedQuery.length === 0
    ? items
    : items.filter((item) => commandSearchText(item).includes(normalizedQuery));
}

/**
 * Groups command items by their user-facing section label.
 *
 * @param items Command items to group.
 * @returns Group label and command item pairs.
 */
export function groupStudioCommandItems(
  items: readonly StudioCommandSurfaceItem[],
): readonly StudioCommandSurfaceGroup[] {
  const groups = new Map<string, StudioCommandSurfaceItem[]>();

  for (const item of items) {
    groups.set(item.groupLabel, [...(groups.get(item.groupLabel) ?? []), item]);
  }

  return Array.from(groups.entries());
}

/**
 * Builds a command surface item for a known command record.
 *
 * @param record Static command metadata.
 * @param state Current Studio app state.
 * @returns Command item with availability and grouping.
 */
export function commandSurfaceItem(
  record: StudioCommandRecord,
  state: StudioAppState,
): StudioCommandSurfaceItem {
  return {
    availability: studioCommandAvailability(record.id, state),
    groupLabel: commandGroupLabel(record.id),
    record,
    shortcut: record.shortcut,
  };
}

/**
 * Converts command availability into a compact visible label.
 *
 * @param availability Dynamic availability state.
 * @returns Human-facing availability label.
 */
export function commandAvailabilityLabel(
  availability: StudioCommandAvailability,
): string {
  switch (availability.status) {
    case "available":
      return "Available";
    case "blocked":
      return "Needs attention";
    case "disabled":
      return "Unavailable";
  }
}

/**
 * Returns a human label for command safety classes.
 *
 * @param safety Command safety class.
 * @returns Short label for command surfaces.
 */
export function commandSafetyLabel(safety: StudioCommandSafety): string {
  switch (safety) {
    case "destructive":
      return "Destructive";
    case "navigation":
      return "Navigation";
    case "provider-mutation":
      return "Provider action";
    case "safe":
      return "Safe";
    case "source-write":
      return "Draft change";
  }
}

/**
 * Groups commands by user task rather than implementation family.
 *
 * @param commandId Command to group.
 * @returns Stable group identifier.
 */
export function commandGroup(commandId: StudioCommandId): StudioCommandGroup {
  if (
    commandId.startsWith("format.") ||
    commandId.startsWith("insert.") ||
    commandId === "article.create" ||
    commandId === "article.open" ||
    commandId === "article.saveDraft" ||
    commandId === "media.insertSelected"
  ) {
    return "authoring";
  }

  if (commandId.startsWith("publish.") || commandId.startsWith("preview.")) {
    return "preview-publish";
  }

  if (
    commandId.startsWith("restore.") ||
    commandId.startsWith("recovery.") ||
    commandId === "article.restoreVersion"
  ) {
    return "recovery";
  }

  if (commandId.startsWith("pane.")) {
    return "workspace";
  }

  return "navigation";
}

/**
 * Returns the label for a command group.
 *
 * @param commandId Command to group.
 * @returns Human-facing group label.
 */
export function commandGroupLabel(commandId: StudioCommandId): string {
  switch (commandGroup(commandId)) {
    case "authoring":
      return "Authoring";
    case "navigation":
      return "Navigation";
    case "preview-publish":
      return "Preview and publish";
    case "recovery":
      return "Recovery";
    case "workspace":
      return "Workspace";
  }
}

function commandSearchText(item: StudioCommandSurfaceItem): string {
  return [
    item.record.id,
    item.record.label,
    item.record.description ?? "",
    item.groupLabel,
    commandSafetyLabel(item.record.safety),
    item.shortcut ?? "",
    item.availability.reason ?? "",
  ]
    .join(" ")
    .toLocaleLowerCase();
}
