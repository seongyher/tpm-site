import {
  studioCommandAvailability,
  studioCommandById,
  type StudioCommandId,
  type StudioCommandRecord,
} from "../commands/studio-commands";
import type {
  ArticleDirectoryFixture,
  ArticleDocumentFixture,
  EditorSessionStateFixture,
  MediaItemFixture,
  PanelStateFixture,
  SettingsFixture,
  StudioMvpFixture,
  StudioScreen,
  StudioScreenStateFixture,
  StudioSessionFixture,
} from "../models/studio-fixtures";
import {
  applyEditorTextCommand,
  isEditorTextCommandId,
} from "./editor-transformations";

/** Overlay states owned by the Studio app reducer. */
export type StudioOverlayState =
  | {
      readonly commandId: StudioCommandId;
      readonly kind: "blocked-action";
      readonly reason: string;
    }
  | { readonly kind: "command-palette" }
  | { readonly kind: "none" }
  | { readonly kind: "publish-confirm" };

/** Serializable article directory filter/search state. */
export interface StudioArticleDirectoryState {
  /** Active category filter when present. */
  readonly categoryFilter?: string | undefined;
  /** Active fixture-backed directory scenario. */
  readonly directoryScenarioId?: string;
  /** Current directory search query. */
  readonly query: string;
  /** Current status filter. */
  readonly statusFilter: ArticleDirectoryFixture["statusFilter"];
  /** Active tag filter when present. */
  readonly tagFilter?: string | undefined;
}

/** Serializable media browser state for exact session restore. */
export interface StudioMediaBrowserState {
  /** Current media search query. */
  readonly query: string;
  /** Current media browser display mode. */
  readonly viewMode: StudioMvpFixture["media"]["viewMode"];
}

/** Fixture-backed Studio app state shared by all GUI command surfaces. */
export interface StudioAppState {
  /** Active article ID when editing or previewing article context. */
  readonly activeArticleId?: string;
  /** Working-copy state for the selected article. */
  readonly activeArticleState?: ArticleDocumentFixture["workingCopyState"];
  /** Active media ID when a media detail pane is selected. */
  readonly activeMediaId?: string;
  /** Active preview scenario ID. */
  readonly activePreviewScenarioId?: string;
  /** Active project ID when a project is loaded. */
  readonly activeProjectId?: string;
  /** Active publish scenario ID. */
  readonly activePublishScenarioId?: string;
  /** Active restore scenario ID. */
  readonly activeRestoreScenarioId?: string;
  /** Active screen. */
  readonly activeScreen: StudioScreen;
  /** Active settings section ID. */
  readonly activeSettingsSectionId?: string;
  /** Working-copy state for the selected settings section. */
  readonly activeSettingsState?: SettingsFixture["state"];
  /** Directory filter/search state. */
  readonly articleDirectory: StudioArticleDirectoryState;
  /** Recent-project IDs dismissed from the startup recovery list. */
  readonly dismissedRecentProjectIds?: readonly string[];
  /** Editor cursor and context state. */
  readonly editor?: StudioSessionFixture["editor"];
  /** Local source editor buffer before an operation-backed draft write. */
  readonly editorDraftSource?: string;
  /** Media browser search/view state. */
  readonly media: StudioMediaBrowserState;
  /** Overlay state for dialogs, menus, and command palette. */
  readonly overlay: StudioOverlayState;
  /** Preview pane collapse/size state. */
  readonly previewPane: PanelStateFixture;
  /** Restore status from the exact session model. */
  readonly restoreStatus: StudioSessionFixture["restoreStatus"];
  /** Sidebar collapse/size state. */
  readonly sidebar: PanelStateFixture;
}

/** Payload values accepted by stateful command execution. */
export interface StudioCommandPayload {
  /** Article to open or use as action target. */
  readonly articleId?: string;
  /** Category filter to apply in the article directory. */
  readonly categoryFilter?: string | undefined;
  /** Cursor offset after an editor transaction. */
  readonly cursorOffset?: number;
  /** Directory scenario to open. */
  readonly directoryScenarioId?: string;
  /** Local alt text to use for fixture image insertion. */
  readonly mediaAltText?: string;
  /** Local caption draft for fixture media metadata surfaces. */
  readonly mediaCaption?: string;
  /** Media item to select. */
  readonly mediaId?: string;
  /** Media search query to apply. */
  readonly mediaQuery?: string;
  /** Media browser display mode to apply. */
  readonly mediaViewMode?: StudioMediaBrowserState["viewMode"];
  /** Search query to apply in the article directory. */
  readonly query?: string;
  /** Recent project to open or remove from startup recovery surfaces. */
  readonly recentProjectId?: string;
  /** Restore scenario to open. */
  readonly restoreScenarioId?: string;
  /** Editor selected range after an editor transaction. */
  readonly selection?: EditorSessionStateFixture["selection"];
  /** Settings section to open. */
  readonly settingsSectionId?: string;
  /** Local editor source draft after an editor transaction. */
  readonly sourceDraft?: string;
  /** Status filter to apply in the article directory. */
  readonly statusFilter?: StudioArticleDirectoryState["statusFilter"];
  /** Tag filter to apply in the article directory. */
  readonly tagFilter?: string | undefined;
}

/** Pure action accepted by the Studio app reducer. */
export type StudioAppAction =
  | {
      readonly commandId: StudioCommandId;
      readonly payload?: StudioCommandPayload;
      readonly type: "command";
    }
  | {
      readonly screenStateId: StudioScreenStateFixture["id"];
      readonly type: "restore-screen-state";
    };

/** Result of a reducer or command transition. */
export type StudioTransitionResult =
  | {
      readonly command?: StudioCommandRecord;
      readonly diagnosticCode?: string;
      readonly ok: false;
      readonly reason: string;
      readonly state: StudioAppState;
    }
  | {
      readonly command?: StudioCommandRecord;
      readonly ok: true;
      readonly state: StudioAppState;
    };

/**
 * Restores initial app state from a visible screen-state fixture.
 *
 * @param fixture Fixture graph to read from.
 * @param screenStateId Screen-state ID to restore.
 * @returns Transition result with restored app state or a recovery failure.
 */
export function studioStateFromScreenState(
  fixture: StudioMvpFixture,
  screenStateId: StudioScreenStateFixture["id"],
): StudioTransitionResult {
  const screenState = fixture.screenStates.find(
    (state) => state.id === screenStateId,
  );

  if (screenState === undefined) {
    return failed(
      defaultState(fixture),
      `Missing screen-state fixture: ${screenStateId}.`,
    );
  }

  return studioStateFromSession(fixture, screenState.sessionId);
}

/**
 * Restores app state from a saved session fixture.
 *
 * @param fixture Fixture graph to read from.
 * @param sessionId Session fixture ID.
 * @returns Transition result with exact restored state or recovery state.
 */
export function studioStateFromSession(
  fixture: StudioMvpFixture,
  sessionId: string,
): StudioTransitionResult {
  const session = fixture.sessions.find(
    (candidate) => candidate.id === sessionId,
  );

  if (session === undefined) {
    return failed(
      defaultState(fixture),
      `Missing session fixture: ${sessionId}.`,
    );
  }

  return succeeded(stateFromSession(fixture, session));
}

/**
 * Runs a Studio command through the shared reducer model.
 *
 * @param fixture Fixture graph used to resolve command targets.
 * @param state Current app state.
 * @param commandId Command to execute.
 * @param payload Optional target payload.
 * @returns Transition result with next state or disabled/blocked reason.
 */
export function runStudioCommand(
  fixture: StudioMvpFixture,
  state: StudioAppState,
  commandId: StudioCommandId,
  payload?: StudioCommandPayload,
): StudioTransitionResult {
  const commandRecord = studioCommandById(commandId);

  if (commandRecord === undefined) {
    return failed(state, `Unknown Studio command: ${commandId}.`);
  }

  const availability = studioCommandAvailability(commandId, state);

  if (availability.status !== "available") {
    return failed(
      state,
      availability.reason ?? "This command is not available.",
      {
        command: commandRecord,
        ...(availability.diagnosticCode === undefined
          ? {}
          : { diagnosticCode: availability.diagnosticCode }),
      },
    );
  }

  return transitionAvailableCommand(fixture, state, commandRecord, payload);
}

/**
 * Applies a reducer action to Studio app state.
 *
 * @param fixture Fixture graph used to resolve action targets.
 * @param state Current app state.
 * @param action Reducer action.
 * @returns Transition result after applying the action.
 */
export function reduceStudioAppState(
  fixture: StudioMvpFixture,
  state: StudioAppState,
  action: StudioAppAction,
): StudioTransitionResult {
  switch (action.type) {
    case "command":
      return runStudioCommand(fixture, state, action.commandId, action.payload);
    case "restore-screen-state":
      return studioStateFromScreenState(fixture, action.screenStateId);
  }
}

function defaultState(fixture: StudioMvpFixture): StudioAppState {
  const session = fixture.sessions.find(
    (candidate) => candidate.id === "session-first-launch",
  );

  if (session === undefined) {
    return {
      activeScreen: "first-launch",
      articleDirectory: {
        query: "",
        statusFilter: "all",
      },
      media: {
        query: fixture.media.query,
        viewMode: fixture.media.viewMode,
      },
      overlay: { kind: "none" },
      previewPane: { visibility: "collapsed" },
      restoreStatus: "failed",
      sidebar: { visibility: "expanded" },
    };
  }

  return stateFromSession(fixture, session);
}

function failed(
  state: StudioAppState,
  reason: string,
  details?: {
    readonly command?: StudioCommandRecord;
    readonly diagnosticCode?: string;
  },
): StudioTransitionResult {
  return {
    ok: false,
    reason,
    state,
    ...(details?.command === undefined ? {} : { command: details.command }),
    ...(details?.diagnosticCode === undefined
      ? {}
      : { diagnosticCode: details.diagnosticCode }),
  };
}

function selectedDirectoryState(
  fixture: StudioMvpFixture,
  session: StudioSessionFixture,
): StudioArticleDirectoryState {
  const directory =
    session.activeDirectoryScenarioId === undefined
      ? undefined
      : fixture.articleDirectories.find(
          (candidate) => candidate.id === session.activeDirectoryScenarioId,
        );

  return {
    query: directory?.query ?? "",
    statusFilter: directory?.statusFilter ?? "all",
    ...(directory?.categoryFilter === undefined
      ? {}
      : { categoryFilter: directory.categoryFilter }),
    ...(session.activeDirectoryScenarioId === undefined
      ? {}
      : { directoryScenarioId: session.activeDirectoryScenarioId }),
    ...(directory?.tagFilter === undefined
      ? {}
      : { tagFilter: directory.tagFilter }),
  };
}

function stateFromSession(
  fixture: StudioMvpFixture,
  session: StudioSessionFixture,
): StudioAppState {
  const article =
    session.activeArticleId === undefined
      ? undefined
      : articleById(fixture, session.activeArticleId);

  return {
    activeScreen: session.activeScreen,
    articleDirectory: selectedDirectoryState(fixture, session),
    media: {
      query: fixture.media.query,
      viewMode: fixture.media.viewMode,
    },
    overlay: overlayFromSession(session),
    previewPane: session.previewPane,
    restoreStatus: session.restoreStatus,
    sidebar: session.sidebar,
    ...(article === undefined
      ? {}
      : { activeArticleState: article.workingCopyState }),
    ...(session.activeArticleId === undefined
      ? {}
      : { activeArticleId: session.activeArticleId }),
    ...(session.activeMediaId === undefined
      ? {}
      : { activeMediaId: session.activeMediaId }),
    ...(session.activePreviewScenarioId === undefined
      ? {}
      : { activePreviewScenarioId: session.activePreviewScenarioId }),
    ...(session.activeProjectId === undefined
      ? {}
      : { activeProjectId: session.activeProjectId }),
    ...(session.activePublishScenarioId === undefined
      ? {}
      : { activePublishScenarioId: session.activePublishScenarioId }),
    ...(session.activeRestoreScenarioId === undefined
      ? {}
      : { activeRestoreScenarioId: session.activeRestoreScenarioId }),
    ...(session.activeSettingsSectionId === undefined
      ? {}
      : {
          activeSettingsSectionId: session.activeSettingsSectionId,
          activeSettingsState: settingsStateForSection(
            fixture,
            session.activeSettingsSectionId,
          ),
        }),
    ...(session.editor === undefined ? {} : { editor: session.editor }),
  };
}

function overlayFromSession(session: StudioSessionFixture): StudioOverlayState {
  return session.activePublishScenarioId === "publish-confirm"
    ? { kind: "publish-confirm" }
    : { kind: "none" };
}

function succeeded(
  state: StudioAppState,
  command?: StudioCommandRecord,
): StudioTransitionResult {
  return {
    ok: true,
    state,
    ...(command === undefined ? {} : { command }),
  };
}

function transitionAvailableCommand(
  fixture: StudioMvpFixture,
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
  payload?: StudioCommandPayload,
): StudioTransitionResult {
  switch (commandRecord.id) {
    case "article.create":
      return transitionOpenArticle(
        fixture,
        state,
        commandRecord,
        "article-small-shop",
      );
    case "article.directory.open":
      return succeeded(
        {
          ...state,
          activeScreen: "article-directory",
          articleDirectory: {
            directoryScenarioId: "directory-populated",
            query: "",
            statusFilter: "all",
          },
          overlay: { kind: "none" },
        },
        commandRecord,
      );
    case "article.directory.resetFilters":
      return transitionArticleDirectoryFilter(state, commandRecord, {
        categoryFilter: undefined,
        query: "",
        statusFilter: "all",
        tagFilter: undefined,
      });
    case "article.directory.setCategory":
      return transitionArticleDirectoryFilter(state, commandRecord, {
        categoryFilter: payload?.categoryFilter,
      });
    case "article.directory.setSearch":
      return transitionArticleDirectoryFilter(state, commandRecord, {
        query: payload?.query ?? "",
      });
    case "article.directory.setStatusFilter":
      return transitionArticleDirectoryFilter(state, commandRecord, {
        statusFilter: payload?.statusFilter ?? "all",
      });
    case "article.directory.setTag":
      return transitionArticleDirectoryFilter(state, commandRecord, {
        tagFilter: payload?.tagFilter,
      });
    case "article.open":
      return transitionOpenArticle(
        fixture,
        state,
        commandRecord,
        payload?.articleId ?? state.activeArticleId,
      );
    case "article.restoreVersion":
      return succeeded(
        {
          ...state,
          activeRestoreScenarioId:
            payload?.restoreScenarioId ?? "restore-ready",
          activeScreen: "restore",
          overlay: { kind: "none" },
        },
        commandRecord,
      );
    case "article.saveDraft":
      return succeeded(
        {
          ...state,
          activeArticleState: "saved",
          overlay: { kind: "none" },
        },
        commandRecord,
      );
    case "commandPalette.close":
      return succeeded({ ...state, overlay: { kind: "none" } }, commandRecord);
    case "commandPalette.open":
      return succeeded(
        { ...state, overlay: { kind: "command-palette" } },
        commandRecord,
      );
    case "editor.updateSource":
      return transitionEditorSourceUpdate(state, commandRecord, payload);
    case "format.blockquote":
    case "format.bold":
    case "format.bulletedList":
    case "format.code":
    case "format.codeBlock":
    case "format.italic":
    case "format.numberedList":
    case "insert.footnote":
    case "insert.heading":
    case "insert.link":
      return transitionEditorCommand(fixture, state, commandRecord);
    case "insert.image":
      return transitionInsertImageCommand(fixture, state, commandRecord);
    case "media.insertSelected":
      return transitionMediaInsert(fixture, state, commandRecord, payload);
    case "media.open":
      return transitionMediaOpen(
        fixture,
        state,
        commandRecord,
        payload?.mediaId,
      );
    case "media.setSearch":
      return transitionMediaSearch(state, commandRecord, payload);
    case "media.setViewMode":
      return transitionMediaViewMode(state, commandRecord, payload);
    case "pane.togglePreview":
      return succeeded(
        { ...state, previewPane: toggledPanel(state.previewPane) },
        commandRecord,
      );
    case "pane.toggleSidebar":
      return succeeded(
        { ...state, sidebar: toggledPanel(state.sidebar) },
        commandRecord,
      );
    case "preview.open":
      return transitionPreviewOpen(state, commandRecord);
    case "preview.openExternal":
      return succeeded({ ...state, overlay: { kind: "none" } }, commandRecord);
    case "project.createSite":
      return succeeded(
        {
          ...state,
          activeProjectId: fixture.workspace.id,
          activeScreen: "project-home",
          overlay: { kind: "none" },
          restoreStatus: "restored",
        },
        commandRecord,
      );
    case "project.openHome":
      return succeeded(
        {
          ...state,
          activeScreen: "project-home",
          overlay: { kind: "none" },
        },
        commandRecord,
      );
    case "project.openSite":
      return transitionOpenProject(fixture, state, commandRecord, payload);
    case "project.showRecent":
      return succeeded(
        {
          ...state,
          activeScreen: "recent-projects",
          overlay: { kind: "none" },
        },
        commandRecord,
      );
    case "publish.cancel":
    case "publish.done":
      return transitionPublishExit(state, commandRecord);
    case "publish.closeConfirm":
      return succeeded(
        {
          ...state,
          activePublishScenarioId: "publish-preview",
          overlay: { kind: "none" },
        },
        commandRecord,
      );
    case "publish.confirm":
    case "publish.retry":
      return transitionPublishScenario(
        state,
        commandRecord,
        "publish-progress",
      );
    case "publish.finish":
      return succeeded(
        {
          ...state,
          activePublishScenarioId: "publish-success",
          overlay: { kind: "none" },
        },
        commandRecord,
      );
    case "publish.openConfirm":
      return succeeded(
        {
          ...state,
          activePublishScenarioId: "publish-confirm",
          overlay: { kind: "publish-confirm" },
        },
        commandRecord,
      );
    case "publish.prepare":
      return succeeded(
        {
          ...state,
          activePreviewScenarioId:
            state.activeArticleId === undefined
              ? "preview-home-ready"
              : "preview-ready",
          activePublishScenarioId: "publish-preview",
          activeScreen: "publish-preview",
          overlay: { kind: "none" },
          previewPane: { ...state.previewPane, visibility: "collapsed" },
        },
        commandRecord,
      );
    case "recovery.locateProject":
      return succeeded(
        {
          ...state,
          activeProjectId: fixture.workspace.id,
          activeScreen: "project-home",
          restoreStatus: "restored",
        },
        commandRecord,
      );
    case "recovery.removeRecent":
      return transitionRemoveRecentProject(
        fixture,
        state,
        commandRecord,
        payload,
      );
    case "restore.cancel":
      return transitionRestoreCancel(state, commandRecord);
    case "restore.confirm":
      return transitionRestoreConfirm(state, commandRecord);
    case "restore.selectCheckpoint":
      return transitionRestoreSelect(state, commandRecord, payload);
    case "settings.open":
      return transitionSettingsOpen(
        fixture,
        state,
        commandRecord,
        payload?.settingsSectionId,
      );
  }
}

function transitionPublishExit(
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
): StudioTransitionResult {
  return succeeded(
    {
      ...stateWithoutActivePublish(state),
      activeScreen: publishReturnScreen(state),
      overlay: { kind: "none" },
    },
    commandRecord,
  );
}

function transitionPublishScenario(
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
  activePublishScenarioId: NonNullable<
    StudioAppState["activePublishScenarioId"]
  >,
): StudioTransitionResult {
  return succeeded(
    {
      ...state,
      activePublishScenarioId,
      overlay: { kind: "none" },
    },
    commandRecord,
  );
}

function transitionRestoreCancel(
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
): StudioTransitionResult {
  if (state.activeRestoreScenarioId === "restore-confirm") {
    return succeeded(
      {
        ...state,
        activeRestoreScenarioId: "restore-draft-selected",
        activeScreen: "restore",
        overlay: { kind: "none" },
      },
      commandRecord,
    );
  }

  const { activeRestoreScenarioId: _activeRestoreScenarioId, ...nextState } =
    state;
  void _activeRestoreScenarioId;

  return succeeded(
    {
      ...nextState,
      activeScreen:
        state.activeArticleId === undefined ? "project-home" : "article-editor",
      overlay: { kind: "none" },
    },
    commandRecord,
  );
}

function transitionRestoreConfirm(
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
): StudioTransitionResult {
  const activeRestoreScenarioId =
    state.activeRestoreScenarioId === "restore-confirm"
      ? "restore-restored"
      : "restore-confirm";

  return succeeded(
    {
      ...state,
      activeRestoreScenarioId,
      activeScreen: "restore",
      ...(activeRestoreScenarioId === "restore-restored"
        ? { activeArticleState: "saved" as const }
        : {}),
      overlay: { kind: "none" },
    },
    commandRecord,
  );
}

function transitionRestoreSelect(
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
  payload?: StudioCommandPayload,
): StudioTransitionResult {
  return succeeded(
    {
      ...state,
      activeRestoreScenarioId:
        payload?.restoreScenarioId ??
        state.activeRestoreScenarioId ??
        "restore-ready",
      activeScreen: "restore",
      overlay: { kind: "none" },
    },
    commandRecord,
  );
}

function articleById(
  fixture: StudioMvpFixture,
  articleId: string,
): ArticleDocumentFixture | undefined {
  return fixture.articles.find((article) => article.id === articleId);
}

function transitionArticleDirectoryFilter(
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
  nextFilter: Partial<StudioArticleDirectoryState>,
): StudioTransitionResult {
  const articleDirectory = {
    ...state.articleDirectory,
    ...nextFilter,
  };

  return succeeded(
    {
      ...state,
      activeScreen: "article-directory",
      articleDirectory: normalizedArticleDirectoryFilter(articleDirectory),
      overlay: { kind: "none" },
    },
    commandRecord,
  );
}

function normalizedArticleDirectoryFilter(
  filter: StudioArticleDirectoryState,
): StudioArticleDirectoryState {
  return {
    directoryScenarioId: filter.directoryScenarioId ?? "directory-populated",
    query: filter.query,
    statusFilter: filter.statusFilter,
    ...(filter.categoryFilter === undefined
      ? {}
      : { categoryFilter: filter.categoryFilter }),
    ...(filter.tagFilter === undefined ? {} : { tagFilter: filter.tagFilter }),
  };
}

function mediaById(
  fixture: StudioMvpFixture,
  mediaId: string,
): MediaItemFixture | undefined {
  return fixture.media.items.find((media) => media.id === mediaId);
}

function transitionOpenProject(
  fixture: StudioMvpFixture,
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
  payload?: StudioCommandPayload,
): StudioTransitionResult {
  const recentProject =
    payload?.recentProjectId === undefined
      ? undefined
      : fixture.workspace.recentProjects.find(
          (project) => project.id === payload.recentProjectId,
        );

  if (recentProject?.status === "missing") {
    const { activeProjectId: _activeProjectId, ...stateWithoutProject } = state;
    void _activeProjectId;

    return succeeded(
      {
        ...stateWithoutProject,
        activeScreen: "recent-projects",
        overlay: { kind: "none" },
        restoreStatus: "project-missing",
      },
      commandRecord,
    );
  }

  return succeeded(
    {
      ...state,
      activeProjectId: fixture.workspace.id,
      activeScreen: "project-home",
      overlay: { kind: "none" },
      restoreStatus: "restored",
    },
    commandRecord,
  );
}

function transitionRemoveRecentProject(
  fixture: StudioMvpFixture,
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
  payload?: StudioCommandPayload,
): StudioTransitionResult {
  const dismissedRecentProjectId =
    payload?.recentProjectId ??
    fixture.workspace.recentProjects.find(
      (project) => project.status !== "available",
    )?.id;

  const dismissedRecentProjectIds =
    dismissedRecentProjectId === undefined
      ? (state.dismissedRecentProjectIds ?? [])
      : [...(state.dismissedRecentProjectIds ?? []), dismissedRecentProjectId];

  return succeeded(
    {
      ...state,
      activeScreen: "recent-projects",
      dismissedRecentProjectIds,
      overlay: { kind: "none" },
      restoreStatus: "restored",
    },
    commandRecord,
  );
}

function toggledPanel(panel: PanelStateFixture): PanelStateFixture {
  return panel.visibility === "expanded"
    ? { ...panel, visibility: "collapsed" }
    : { ...panel, visibility: "expanded" };
}

function transitionEditorCommand(
  fixture: StudioMvpFixture,
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
): StudioTransitionResult {
  const article =
    state.activeArticleId === undefined
      ? undefined
      : articleById(fixture, state.activeArticleId);
  const source = state.editorDraftSource ?? article?.body.source;

  if (source === undefined) {
    return failed(state, "Open an article before editing.", {
      command: commandRecord,
    });
  }

  if (!isEditorTextCommandId(commandRecord.id)) {
    return failed(state, "Unsupported editor command.", {
      command: commandRecord,
    });
  }

  const nextEditor = applyEditorTextCommand(
    source,
    commandRecord.id,
    state.editor,
  );

  return succeeded(
    {
      ...state,
      activeArticleState: "dirty",
      activePreviewScenarioId: "preview-stale",
      editor: {
        contextTarget: nextEditor.contextTarget,
        cursorOffset: nextEditor.cursorOffset,
        lastCommandId: commandRecord.id,
        scrollTop: state.editor?.scrollTop ?? 0,
        ...(nextEditor.selection === undefined
          ? {}
          : { selection: nextEditor.selection }),
      },
      editorDraftSource: nextEditor.source,
    },
    commandRecord,
  );
}

function transitionEditorSourceUpdate(
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
  payload?: StudioCommandPayload,
): StudioTransitionResult {
  if (payload?.sourceDraft === undefined) {
    return failed(state, "Missing editor source draft.", {
      command: commandRecord,
    });
  }

  const selection = payload.selection;
  const unchangedSource = payload.sourceDraft === state.editorDraftSource;
  const lastCommandId = unchangedSource
    ? state.editor?.lastCommandId
    : commandRecord.id;

  return succeeded(
    {
      ...state,
      activeArticleState: "dirty",
      activePreviewScenarioId: "preview-stale",
      editor: {
        contextTarget:
          selection === undefined || selection.from === selection.to
            ? "cursor"
            : "selection",
        cursorOffset: payload.cursorOffset ?? state.editor?.cursorOffset ?? 0,
        scrollTop: state.editor?.scrollTop ?? 0,
        ...(lastCommandId === undefined ? {} : { lastCommandId }),
        ...(selection === undefined ? {} : { selection }),
      },
      editorDraftSource: payload.sourceDraft,
      overlay: { kind: "none" },
    },
    commandRecord,
  );
}

function transitionMediaInsert(
  fixture: StudioMvpFixture,
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
  payload?: StudioCommandPayload,
): StudioTransitionResult {
  const mediaId = payload?.mediaId ?? state.activeMediaId;
  const media = mediaId === undefined ? undefined : mediaById(fixture, mediaId);

  if (media === undefined) {
    return failed(state, "Select an image before inserting media.", {
      command: commandRecord,
    });
  }

  const article =
    state.activeArticleId === undefined
      ? undefined
      : articleById(fixture, state.activeArticleId);
  const source = state.editorDraftSource ?? article?.body.source;

  if (source === undefined) {
    return failed(state, "Open an article before inserting media.", {
      command: commandRecord,
    });
  }

  const markdown = imageMarkdownForMedia(media, payload?.mediaAltText);
  const cursorOffset = boundedCursorOffset(
    state.editor?.cursorOffset ?? source.length,
    source,
  );

  return succeeded(
    {
      ...state,
      activeArticleState: "dirty",
      activeMediaId: media.id,
      activePreviewScenarioId: "preview-stale",
      activeScreen: "article-editor",
      editor: {
        contextTarget: "image-markdown",
        cursorOffset: cursorOffset + markdown.length,
        lastCommandId: commandRecord.id,
        scrollTop: state.editor?.scrollTop ?? 0,
      },
      editorDraftSource: [
        source.slice(0, cursorOffset),
        markdown,
        source.slice(cursorOffset),
      ].join(""),
      overlay: { kind: "none" },
      previewPane: { sizePx: 520, visibility: "expanded" },
    },
    commandRecord,
  );
}

function transitionInsertImageCommand(
  fixture: StudioMvpFixture,
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
): StudioTransitionResult {
  const activeMediaId = state.activeMediaId ?? fixture.media.selectedMediaId;

  return succeeded(
    {
      ...state,
      activeScreen: "media",
      media: {
        query: state.media.query,
        viewMode: state.media.viewMode,
      },
      overlay: { kind: "none" },
      previewPane: { sizePx: 0, visibility: "collapsed" },
      ...(activeMediaId === undefined ? {} : { activeMediaId }),
    },
    commandRecord,
  );
}

function transitionMediaOpen(
  fixture: StudioMvpFixture,
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
  mediaId?: string,
): StudioTransitionResult {
  const media = mediaId === undefined ? undefined : mediaById(fixture, mediaId);
  const nextMediaId = media?.id ?? state.activeMediaId;

  return succeeded(
    {
      ...state,
      activeScreen: "media",
      media: {
        query: state.media.query,
        viewMode: state.media.viewMode,
      },
      overlay: { kind: "none" },
      previewPane: { sizePx: 0, visibility: "collapsed" },
      ...(nextMediaId === undefined ? {} : { activeMediaId: nextMediaId }),
    },
    commandRecord,
  );
}

function transitionMediaSearch(
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
  payload?: StudioCommandPayload,
): StudioTransitionResult {
  return succeeded(
    {
      ...state,
      activeScreen: "media",
      media: {
        ...state.media,
        query: payload?.mediaQuery ?? "",
      },
      overlay: { kind: "none" },
    },
    commandRecord,
  );
}

function transitionMediaViewMode(
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
  payload?: StudioCommandPayload,
): StudioTransitionResult {
  return succeeded(
    {
      ...state,
      activeScreen: "media",
      media: {
        ...state.media,
        viewMode: payload?.mediaViewMode ?? state.media.viewMode,
      },
      overlay: { kind: "none" },
    },
    commandRecord,
  );
}

function boundedCursorOffset(cursorOffset: number, source: string): number {
  return Math.min(Math.max(cursorOffset, 0), source.length);
}

function imageMarkdownForMedia(
  media: MediaItemFixture,
  altTextOverride: string | undefined,
): string {
  const override = altTextOverride?.trim();
  const altText =
    override === undefined || override.length === 0
      ? mediaAltTextFallback(media)
      : override;

  return `![${escapedMarkdownLabel(altText)}](${media.sourceRef.path})`;
}

function mediaAltTextFallback(media: MediaItemFixture): string {
  return media.altText.length > 0
    ? media.altText
    : filenameStem(media.displayName);
}

function escapedMarkdownLabel(label: string): string {
  return label.replaceAll("[", "\\[").replaceAll("]", "\\]");
}

function filenameStem(filename: string): string {
  const extensionIndex = filename.lastIndexOf(".");

  return extensionIndex > 0 ? filename.slice(0, extensionIndex) : filename;
}

function transitionPreviewOpen(
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
): StudioTransitionResult {
  return succeeded(
    {
      ...state,
      activePreviewScenarioId:
        state.activeArticleId === undefined
          ? "preview-home-ready"
          : "preview-ready",
      overlay: { kind: "none" },
      previewPane: { sizePx: 520, visibility: "expanded" },
    },
    commandRecord,
  );
}

function transitionOpenArticle(
  fixture: StudioMvpFixture,
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
  articleId: string | undefined,
): StudioTransitionResult {
  const article =
    articleId === undefined ? undefined : articleById(fixture, articleId);

  if (article === undefined) {
    return failed(state, "Choose an article before opening the editor.", {
      command: commandRecord,
    });
  }

  const { editorDraftSource: _editorDraftSource, ...stateWithoutEditorDraft } =
    state;
  void _editorDraftSource;

  return succeeded(
    {
      ...stateWithoutEditorDraft,
      activeArticleId: article.id,
      activeArticleState: article.workingCopyState,
      activePreviewScenarioId:
        article.workingCopyState === "invalid"
          ? "preview-blocked"
          : "preview-ready",
      activeScreen: "article-editor",
      editor: {
        contextTarget: "cursor",
        cursorOffset: 0,
        lastCommandId: commandRecord.id,
        scrollTop: 0,
      },
      overlay: { kind: "none" },
    },
    commandRecord,
  );
}

function stateWithoutActivePublish(
  state: StudioAppState,
): Omit<StudioAppState, "activePublishScenarioId"> {
  const {
    activePublishScenarioId: _activePublishScenarioId,
    ...stateWithoutPublish
  } = state;
  void _activePublishScenarioId;

  return stateWithoutPublish;
}

function publishReturnScreen(state: StudioAppState): StudioScreen {
  return state.activeArticleId === undefined
    ? "project-home"
    : "article-editor";
}

function transitionSettingsOpen(
  fixture: StudioMvpFixture,
  state: StudioAppState,
  commandRecord: StudioCommandRecord,
  settingsSectionId?: string,
): StudioTransitionResult {
  const nextSettingsSectionId =
    settingsSectionId ?? state.activeSettingsSectionId ?? "site-identity";

  return succeeded(
    {
      ...state,
      activeScreen: "settings",
      activeSettingsSectionId: nextSettingsSectionId,
      activeSettingsState: settingsStateForSection(
        fixture,
        nextSettingsSectionId,
      ),
      overlay: { kind: "none" },
    },
    commandRecord,
  );
}

function settingsStateForSection(
  fixture: StudioMvpFixture,
  settingsSectionId: string,
): SettingsFixture["state"] {
  return (
    fixture.settings.find(
      (settings) => settings.activeSectionId === settingsSectionId,
    )?.state ?? "saved"
  );
}
