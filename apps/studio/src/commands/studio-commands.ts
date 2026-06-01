import type { StudioOperationFamily } from "../models/studio-fixtures";
import type { StudioAppState } from "../state/studio-state";

/** Stable command IDs shared by toolbar, menus, hotkeys, and command palette. */
export type StudioCommandId =
  | "article.create"
  | "article.directory.open"
  | "article.directory.resetFilters"
  | "article.directory.setCategory"
  | "article.directory.setSearch"
  | "article.directory.setStatusFilter"
  | "article.directory.setTag"
  | "article.open"
  | "article.restoreVersion"
  | "article.saveDraft"
  | "commandPalette.close"
  | "commandPalette.open"
  | "editor.updateSource"
  | "format.blockquote"
  | "format.bold"
  | "format.bulletedList"
  | "format.code"
  | "format.codeBlock"
  | "format.italic"
  | "format.numberedList"
  | "insert.footnote"
  | "insert.heading"
  | "insert.image"
  | "insert.link"
  | "media.insertSelected"
  | "media.open"
  | "media.setSearch"
  | "media.setViewMode"
  | "pane.togglePreview"
  | "pane.toggleSidebar"
  | "preview.open"
  | "preview.openExternal"
  | "project.createSite"
  | "project.openHome"
  | "project.openSite"
  | "project.showRecent"
  | "publish.cancel"
  | "publish.closeConfirm"
  | "publish.confirm"
  | "publish.done"
  | "publish.finish"
  | "publish.openConfirm"
  | "publish.prepare"
  | "publish.retry"
  | "recovery.locateProject"
  | "recovery.removeRecent"
  | "restore.cancel"
  | "restore.confirm"
  | "restore.selectCheckpoint"
  | "settings.open";

/** Safety class used to choose confirmation, menu, and disabled-state behavior. */
export type StudioCommandSafety =
  | "destructive"
  | "navigation"
  | "provider-mutation"
  | "safe"
  | "source-write";

/** Static command metadata independent of the current app state. */
export interface StudioCommandRecord {
  /** Optional description for command palette and tooltips. */
  readonly description?: string;
  /** Stable command ID. */
  readonly id: StudioCommandId;
  /** Human-facing label. */
  readonly label: string;
  /** Future operation family this command maps to. */
  readonly operationFamily: StudioOperationFamily;
  /** Safety class for confirmation and surface treatment. */
  readonly safety: StudioCommandSafety;
  /** Optional keyboard shortcut label. */
  readonly shortcut?: string;
}

/** Dynamic command availability for the current fixture-backed state. */
export interface StudioCommandAvailability {
  /** Optional diagnostic code explaining a blocked action. */
  readonly diagnosticCode?: string;
  /** Optional disabled reason rendered in tooltips or blocked-action dialogs. */
  readonly reason?: string;
  /** Whether the command can run right now. */
  readonly status: "available" | "blocked" | "disabled";
}

/** Stable MVP command registry consumed by all command surfaces. */
export const studioCommandRegistry = [
  command(
    "article.directory.open",
    "Articles",
    "Open the article directory.",
    "navigation",
    "source.inventory",
    "⌘1",
  ),
  command(
    "article.directory.resetFilters",
    "Reset filters",
    "Clear article directory filters.",
    "safe",
    "source.inventory",
  ),
  command(
    "article.directory.setCategory",
    "Filter by category",
    "Filter articles by category.",
    "safe",
    "source.inventory",
  ),
  command(
    "article.directory.setSearch",
    "Search articles",
    "Search article titles, summaries, tags, categories, and authors.",
    "safe",
    "source.inventory",
  ),
  command(
    "article.directory.setStatusFilter",
    "Filter by status",
    "Filter articles by publishing status.",
    "safe",
    "source.inventory",
  ),
  command(
    "article.directory.setTag",
    "Filter by tag",
    "Filter articles by tag.",
    "safe",
    "source.inventory",
  ),
  command(
    "article.create",
    "New article",
    "Create a draft article.",
    "source-write",
    "editor.document",
    "⌘N",
  ),
  command(
    "article.open",
    "Open article",
    "Open the selected article in the editor.",
    "navigation",
    "editor.document",
    "⌘O",
  ),
  command(
    "article.restoreVersion",
    "Restore version",
    "Open checkpoint recovery for the selected article.",
    "source-write",
    "history.checkpoints",
  ),
  command(
    "article.saveDraft",
    "Save draft",
    "Save the current article draft when it is valid.",
    "source-write",
    "editor.patch",
    "⌘S",
  ),
  command(
    "commandPalette.close",
    "Close command palette",
    "Close the command palette.",
    "safe",
    "session.restore",
    "Esc",
  ),
  command(
    "commandPalette.open",
    "Open command palette",
    "Search commands and app surfaces.",
    "safe",
    "session.restore",
    "⌘K",
  ),
  command(
    "editor.updateSource",
    "Update source",
    "Update the local source editor buffer.",
    "source-write",
    "editor.patch",
  ),
  command(
    "format.blockquote",
    "Quote",
    "Format the current line or selection as a Markdown quote.",
    "source-write",
    "editor.patch",
  ),
  command(
    "format.bold",
    "Bold",
    "Apply Markdown bold formatting.",
    "source-write",
    "editor.patch",
    "⌘B",
  ),
  command(
    "format.bulletedList",
    "Bulleted list",
    "Format the current line or selection as a bulleted list.",
    "source-write",
    "editor.patch",
  ),
  command(
    "format.code",
    "Inline code",
    "Apply inline Markdown code formatting.",
    "source-write",
    "editor.patch",
    "⌘E",
  ),
  command(
    "format.codeBlock",
    "Code block",
    "Insert or wrap the current selection in a fenced code block.",
    "source-write",
    "editor.patch",
  ),
  command(
    "format.italic",
    "Italic",
    "Apply Markdown italic formatting.",
    "source-write",
    "editor.patch",
    "⌘I",
  ),
  command(
    "format.numberedList",
    "Numbered list",
    "Format the current line or selection as a numbered list.",
    "source-write",
    "editor.patch",
  ),
  command(
    "insert.footnote",
    "Insert footnote",
    "Insert a Markdown footnote at the cursor.",
    "source-write",
    "editor.patch",
  ),
  command(
    "insert.heading",
    "Insert heading",
    "Insert or convert selected text to a heading.",
    "source-write",
    "editor.patch",
  ),
  command(
    "insert.image",
    "Insert image",
    "Open the media browser for image insertion.",
    "source-write",
    "media.resolve",
    "⇧⌘I",
  ),
  command(
    "insert.link",
    "Insert link",
    "Insert a Markdown link.",
    "source-write",
    "editor.patch",
    "⌘L",
  ),
  command(
    "media.insertSelected",
    "Insert selected image",
    "Insert the selected media item at the editor cursor.",
    "source-write",
    "media.patch",
  ),
  command(
    "media.open",
    "Media",
    "Open the media library.",
    "navigation",
    "media.resolve",
    "⌘2",
  ),
  command(
    "media.setSearch",
    "Search media",
    "Search media filenames, alt text, captions, and usage.",
    "safe",
    "media.resolve",
  ),
  command(
    "media.setViewMode",
    "Change media view",
    "Switch between media grid and list views.",
    "safe",
    "media.resolve",
  ),
  command(
    "pane.togglePreview",
    "Toggle preview",
    "Show or hide the preview pane.",
    "safe",
    "session.restore",
    "⌥⌘P",
  ),
  command(
    "pane.toggleSidebar",
    "Toggle sidebar",
    "Show or hide the left sidebar.",
    "safe",
    "session.restore",
    "⌥⌘B",
  ),
  command(
    "preview.open",
    "Preview",
    "Build and open a route preview.",
    "safe",
    "preview.route",
    "⌘R",
  ),
  command(
    "preview.openExternal",
    "Open preview externally",
    "Open the current preview route outside the Studio pane.",
    "safe",
    "preview.route",
  ),
  command(
    "project.createSite",
    "Create site",
    "Create a new site workspace.",
    "source-write",
    "workspace.discover",
  ),
  command(
    "project.openHome",
    "Project home",
    "Open the project home screen.",
    "navigation",
    "source.inventory",
  ),
  command(
    "project.openSite",
    "Open site",
    "Open a recent or selected site.",
    "navigation",
    "workspace.discover",
    "⌘O",
  ),
  command(
    "project.showRecent",
    "Recent projects",
    "Show recent sites.",
    "navigation",
    "workspace.discover",
  ),
  command(
    "publish.cancel",
    "Cancel publish",
    "Leave the publish flow without applying the plan.",
    "safe",
    "publish.plan",
  ),
  command(
    "publish.closeConfirm",
    "Close confirmation",
    "Return from confirmation to the publish preview.",
    "safe",
    "publish.plan",
  ),
  command(
    "publish.confirm",
    "Confirm publish",
    "Apply the confirmed publish plan.",
    "provider-mutation",
    "publish.apply",
  ),
  command(
    "publish.done",
    "Done",
    "Close the published result.",
    "navigation",
    "publish.apply",
  ),
  command(
    "publish.finish",
    "Finish fixture publish",
    "Advance the fixture-backed publish progress to the success state.",
    "safe",
    "publish.apply",
  ),
  command(
    "publish.openConfirm",
    "Review publish",
    "Open publish confirmation after preview.",
    "safe",
    "publish.plan",
  ),
  command(
    "publish.prepare",
    "Publish",
    "Prepare a publish preview and plan.",
    "safe",
    "publish.plan",
    "⇧⌘P",
  ),
  command(
    "publish.retry",
    "Retry publish",
    "Retry a failed fixture-backed publish apply step.",
    "safe",
    "publish.apply",
  ),
  command(
    "recovery.locateProject",
    "Locate project",
    "Choose the missing project folder.",
    "safe",
    "workspace.discover",
  ),
  command(
    "recovery.removeRecent",
    "Remove from recent",
    "Remove an unavailable project from the recent list.",
    "destructive",
    "session.restore",
  ),
  command(
    "restore.cancel",
    "Cancel restore",
    "Return to the checkpoint list or article editor without restoring.",
    "safe",
    "history.checkpoints",
  ),
  command(
    "restore.confirm",
    "Restore checkpoint",
    "Confirm restoring the selected checkpoint.",
    "source-write",
    "history.restore",
  ),
  command(
    "restore.selectCheckpoint",
    "Select checkpoint",
    "Select a checkpoint to inspect before restoring.",
    "safe",
    "history.checkpoints",
  ),
  command(
    "settings.open",
    "Settings",
    "Open site settings.",
    "navigation",
    "editor.validate",
    "⌘,",
  ),
] as const satisfies readonly StudioCommandRecord[];

/**
 * Finds a command record by stable ID.
 *
 * @param commandId Command ID to look up.
 * @returns Command metadata when the command exists.
 */
export function studioCommandById(
  commandId: string,
): StudioCommandRecord | undefined {
  return studioCommandRegistry.find(
    (commandRecord) => commandRecord.id === commandId,
  );
}

/**
 * Computes command availability from the current app state.
 *
 * @param commandId Command to inspect.
 * @param state Current fixture-backed Studio state.
 * @returns Availability status and any user-facing reason.
 */
export function studioCommandAvailability(
  commandId: StudioCommandId,
  state: StudioAppState,
): StudioCommandAvailability {
  const resolver = studioCommandAvailabilityResolvers.find(
    (candidate) => candidate.id === commandId,
  );

  return resolver === undefined
    ? disabled(`Unknown Studio command: ${commandId}.`)
    : resolver.availability(state);
}

const studioCommandAvailabilityResolvers = [
  resolver("article.create", available),
  resolver("article.directory.open", available),
  resolver("article.directory.resetFilters", articleDirectoryAvailability),
  resolver("article.directory.setCategory", articleDirectoryAvailability),
  resolver("article.directory.setSearch", articleDirectoryAvailability),
  resolver("article.directory.setStatusFilter", articleDirectoryAvailability),
  resolver("article.directory.setTag", articleDirectoryAvailability),
  resolver("article.open", articleOpenAvailability),
  resolver("article.restoreVersion", articleRestoreAvailability),
  resolver("article.saveDraft", saveDraftAvailability),
  resolver("commandPalette.close", commandPaletteCloseAvailability),
  resolver("commandPalette.open", available),
  resolver("editor.updateSource", editorCommandAvailability),
  resolver("format.blockquote", editorCommandAvailability),
  resolver("format.bold", editorCommandAvailability),
  resolver("format.bulletedList", editorCommandAvailability),
  resolver("format.code", editorCommandAvailability),
  resolver("format.codeBlock", editorCommandAvailability),
  resolver("format.italic", editorCommandAvailability),
  resolver("format.numberedList", editorCommandAvailability),
  resolver("insert.footnote", editorCommandAvailability),
  resolver("insert.heading", editorCommandAvailability),
  resolver("insert.image", insertImageAvailability),
  resolver("insert.link", editorCommandAvailability),
  resolver("media.insertSelected", mediaInsertAvailability),
  resolver("media.open", available),
  resolver("media.setSearch", mediaBrowserAvailability),
  resolver("media.setViewMode", mediaBrowserAvailability),
  resolver("pane.togglePreview", available),
  resolver("pane.toggleSidebar", available),
  resolver("preview.open", previewAvailability),
  resolver("preview.openExternal", previewExternalAvailability),
  resolver("project.createSite", available),
  resolver("project.openHome", available),
  resolver("project.openSite", available),
  resolver("project.showRecent", available),
  resolver("publish.confirm", publishConfirmAvailability),
  resolver("publish.cancel", publishActiveAvailability),
  resolver("publish.closeConfirm", publishConfirmAvailability),
  resolver("publish.done", publishDoneAvailability),
  resolver("publish.finish", publishFinishAvailability),
  resolver("publish.openConfirm", publishOpenConfirmAvailability),
  resolver("publish.prepare", publishPrepareAvailability),
  resolver("publish.retry", publishRetryAvailability),
  resolver("recovery.locateProject", recoveryAvailability),
  resolver("recovery.removeRecent", recoveryAvailability),
  resolver("restore.cancel", restoreAvailability),
  resolver("restore.confirm", restoreConfirmAvailability),
  resolver("restore.selectCheckpoint", restoreAvailability),
  resolver("settings.open", available),
] as const;

interface StudioCommandAvailabilityResolver {
  readonly availability: (state: StudioAppState) => StudioCommandAvailability;
  readonly id: StudioCommandId;
}

function available(): StudioCommandAvailability {
  return { status: "available" };
}

function blocked(
  reason: string,
  diagnosticCode: string,
): StudioCommandAvailability {
  return { diagnosticCode, reason, status: "blocked" };
}

function command(
  id: StudioCommandId,
  label: string,
  description: string,
  safety: StudioCommandSafety,
  operationFamily: StudioOperationFamily,
  shortcut?: string,
): StudioCommandRecord {
  return {
    description,
    id,
    label,
    operationFamily,
    safety,
    ...(shortcut === undefined ? {} : { shortcut }),
  };
}

function disabled(reason: string): StudioCommandAvailability {
  return { reason, status: "disabled" };
}

function articleOpenAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.activeArticleId === undefined
    ? disabled("Choose an article before opening the editor.")
    : available();
}

function articleDirectoryAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.activeScreen === "article-directory"
    ? available()
    : disabled("Open Articles before changing directory filters.");
}

function articleRestoreAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.activeArticleId === undefined
    ? disabled("Choose an article before restoring a version.")
    : available();
}

function commandPaletteCloseAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.overlay.kind === "command-palette"
    ? available()
    : disabled("The command palette is not open.");
}

function editorCommandAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.activeArticleId === undefined
    ? disabled("Open an article before editing.")
    : available();
}

function insertImageAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.activeArticleId === undefined
    ? disabled("Open an article before inserting media.")
    : available();
}

function mediaInsertAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.activeArticleId === undefined ||
    state.activeMediaId === undefined
    ? disabled("Select an article and image before inserting media.")
    : available();
}

function mediaBrowserAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.activeScreen === "media"
    ? available()
    : disabled("Open Media before changing media browser state.");
}

function previewAvailability(state: StudioAppState): StudioCommandAvailability {
  if (state.activeArticleState === "invalid") {
    return blocked(
      "Fix article errors before previewing.",
      "STUDIO-PREVIEW-BLOCKED",
    );
  }

  return available();
}

function previewExternalAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.activePreviewScenarioId === undefined
    ? disabled("Open a preview before opening it externally.")
    : available();
}

function publishConfirmAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.activePublishScenarioId === "publish-confirm"
    ? available()
    : disabled("Review the publish plan before confirming.");
}

function publishActiveAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.activePublishScenarioId === undefined
    ? disabled("Open the publish preview first.")
    : available();
}

function publishDoneAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.activePublishScenarioId === "publish-success"
    ? available()
    : disabled("Complete the publish flow before closing it.");
}

function publishFinishAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.activePublishScenarioId === "publish-progress"
    ? available()
    : disabled("Confirm the publish plan before completing the fixture apply.");
}

function publishOpenConfirmAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.activePublishScenarioId === "publish-preview"
    ? available()
    : disabled("Prepare a publish preview before confirming.");
}

function publishPrepareAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.activeArticleState === "invalid"
    ? blocked(
        "Fix article errors before publishing.",
        "STUDIO-ARTICLE-TITLE-REQUIRED",
      )
    : available();
}

function publishRetryAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.activePublishScenarioId === "publish-failed"
    ? available()
    : disabled("Retry is available after a failed publish.");
}

function recoveryAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  return state.restoreStatus === "project-missing"
    ? available()
    : disabled("No missing project needs recovery.");
}

function resolver(
  id: StudioCommandId,
  availability: StudioCommandAvailabilityResolver["availability"],
): StudioCommandAvailabilityResolver {
  return { availability, id };
}

function restoreAvailability(state: StudioAppState): StudioCommandAvailability {
  return state.activeRestoreScenarioId === undefined
    ? disabled("Open checkpoint recovery before changing restore state.")
    : available();
}

function restoreConfirmAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  if (state.activeRestoreScenarioId === undefined) {
    return disabled("Choose a checkpoint before restoring.");
  }

  return state.activeRestoreScenarioId === "restore-unavailable"
    ? disabled("Checkpoint history is not available for this project.")
    : available();
}

function saveDraftAvailability(
  state: StudioAppState,
): StudioCommandAvailability {
  if (state.activeArticleId === undefined) {
    return disabled("Open an article before saving a draft.");
  }

  if (state.activeArticleState === "invalid") {
    return blocked(
      "Fix article fields before saving a draft.",
      "STUDIO-ARTICLE-TITLE-REQUIRED",
    );
  }

  return available();
}
