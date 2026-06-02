import { describe, expect, test } from "vitest";

import {
  commandAvailabilityLabel,
  commandGroupLabel,
  commandSafetyLabel,
  filterStudioCommandItems,
  groupStudioCommandItems,
  studioCommandSurfaceItems,
} from "../../../apps/studio/src/commands/command-surfaces";
import {
  studioCommandIdForKeyboardEvent,
  studioShortcutCommandIds,
} from "../../../apps/studio/src/commands/keyboard-shortcuts";
import {
  studioCommandAvailability,
  type StudioCommandId,
  studioCommandRegistry,
} from "../../../apps/studio/src/commands/studio-commands";
import { studioMvpFixture } from "../../../apps/studio/src/data/fixtures/studio-mvp-fixture";
import { STUDIO_MVP_REQUIRED_SCREEN_STATE_IDS } from "../../../apps/studio/src/models/studio-fixtures";
import {
  applyEditorTextCommand,
  isEditorTextCommandId,
} from "../../../apps/studio/src/state/editor-transformations";
import {
  studioArticleTreeFolderCollapsed,
  studioLivePreviewVisible,
  studioSidebarSelection,
  studioWorkspaceRegions,
} from "../../../apps/studio/src/state/studio-selectors";
import {
  reduceStudioAppState,
  runStudioCommand,
  type StudioAppState,
  type StudioCommandPayload,
  studioStateFromScreenState,
  studioStateFromSession,
} from "../../../apps/studio/src/state/studio-state";

const interactionMatrixCommandIds = [
  "article.directory.open",
  "article.directory.resetFilters",
  "article.directory.setCategory",
  "article.directory.setSearch",
  "article.directory.setStatusFilter",
  "article.directory.setTag",
  "article.create",
  "article.open",
  "article.restoreVersion",
  "article.saveDraft",
  "articleTree.toggleFolder",
  "commandPalette.close",
  "commandPalette.open",
  "editor.properties.toggle",
  "editor.title.beginEdit",
  "editor.title.cancel",
  "editor.title.commit",
  "editor.title.update",
  "editor.updateSource",
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
  "media.setSearch",
  "media.setViewMode",
  "pane.togglePreview",
  "pane.toggleSidebar",
  "preview.open",
  "preview.openExternal",
  "preview.setViewport",
  "project.createSite",
  "project.openHome",
  "project.openSite",
  "project.showRecent",
  "publish.cancel",
  "publish.closeConfirm",
  "publish.confirm",
  "publish.done",
  "publish.finish",
  "publish.openConfirm",
  "publish.prepare",
  "publish.retry",
  "recovery.locateProject",
  "recovery.removeRecent",
  "restore.cancel",
  "restore.confirm",
  "restore.selectCheckpoint",
  "settings.open",
] as const satisfies readonly StudioCommandId[];

describe("studio command state", () => {
  test("keeps the interaction matrix synchronized with every command ID", () => {
    const registryCommandIds = studioCommandRegistry.map(
      (command) => command.id,
    );

    expect(interactionMatrixCommandIds).toEqual(registryCommandIds);
    expect(new Set(registryCommandIds).size).toBe(registryCommandIds.length);

    for (const command of studioCommandRegistry) {
      expect(command.label.trim().length).toBeGreaterThan(0);
      expect(command.description?.trim().length).toBeGreaterThan(0);
      expect(command.operationFamily.trim().length).toBeGreaterThan(0);
    }
  });

  test("restores exact screen state from fixture sessions", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "article-editor-invalid",
    );

    expect(restored.ok).toBe(true);

    if (restored.ok) {
      expect(restored.state).toMatchObject({
        activeArticleId: "article-writing-desk-invalid",
        activeArticleState: "invalid",
        activePreviewScenarioId: "preview-blocked",
        activeScreen: "article-editor",
        restoreStatus: "restored",
      });
      expect(restored.state.previewPane.visibility).toBe("visible");
    }
  });

  test("models missing-project restore without selecting a project", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "restore-failure",
    );

    expect(restored.ok).toBe(true);

    if (restored.ok) {
      expect(restored.state.restoreStatus).toBe("project-missing");
      expect(restored.state.activeProjectId).toBeUndefined();
      expect(
        studioCommandAvailability("recovery.locateProject", restored.state),
      ).toEqual({
        status: "available",
      });
    }
  });

  test("restores startup and project-home fixture states exactly", () => {
    const firstLaunch = studioStateFromScreenState(
      studioMvpFixture,
      "first-launch",
    );
    const recentProjects = studioStateFromScreenState(
      studioMvpFixture,
      "recent-projects",
    );
    const projectHome = studioStateFromScreenState(
      studioMvpFixture,
      "project-home",
    );

    expect(firstLaunch.ok).toBe(true);

    if (firstLaunch.ok) {
      expect(firstLaunch.state.activeProjectId).toBeUndefined();
      expect(firstLaunch.state).toMatchObject({
        activeScreen: "first-launch",
        previewPane: { visibility: "hidden" },
      });
    }
    expect(recentProjects).toMatchObject({
      ok: true,
      state: {
        activeProjectId: "workspace-northwind-journal",
        activeScreen: "recent-projects",
        restoreStatus: "restored",
      },
    });
    expect(projectHome).toMatchObject({
      ok: true,
      state: {
        activeProjectId: "workspace-northwind-journal",
        activeScreen: "project-home",
        restoreStatus: "restored",
      },
    });
  });

  test("derives workspace regions so hidden panes are absent", () => {
    const article = requiredStudioState("article-editor-clean");
    const projectHome = requiredStudioState("project-home");

    expect(studioWorkspaceRegions(article)).toEqual([
      "sidebar",
      "work",
      "preview",
    ]);
    expect(studioLivePreviewVisible(article)).toBe(true);
    expect(studioWorkspaceRegions(projectHome)).toEqual(["sidebar", "work"]);
    expect(studioLivePreviewVisible(projectHome)).toBe(false);

    const hiddenPreview = runStudioCommand(
      studioMvpFixture,
      article,
      "pane.togglePreview",
    );
    const hiddenSidebar = runStudioCommand(
      studioMvpFixture,
      article,
      "pane.toggleSidebar",
    );
    const nonEditorPreviewToggle = runStudioCommand(
      studioMvpFixture,
      projectHome,
      "pane.togglePreview",
    );

    expect(hiddenPreview.ok).toBe(true);
    expect(hiddenSidebar.ok).toBe(true);
    expect(nonEditorPreviewToggle).toMatchObject({
      ok: false,
      reason: "Open an article before showing the live article preview.",
    });

    if (hiddenPreview.ok) {
      expect(hiddenPreview.state.previewPane.visibility).toBe("hidden");
      expect(studioWorkspaceRegions(hiddenPreview.state)).toEqual([
        "sidebar",
        "work",
      ]);
    }

    if (hiddenSidebar.ok) {
      expect(hiddenSidebar.state.sidebar.visibility).toBe("hidden");
      expect(studioWorkspaceRegions(hiddenSidebar.state)).toEqual([
        "work",
        "preview",
      ]);
    }
  });

  test("keeps workspace and selection invariants for every fixture state", () => {
    for (const screenStateId of STUDIO_MVP_REQUIRED_SCREEN_STATE_IDS) {
      const state = requiredStudioState(screenStateId);
      const regions = studioWorkspaceRegions(state);
      const uniqueRegions = new Set(regions);
      const selection = studioSidebarSelection(state);

      expect(uniqueRegions.size, screenStateId).toBe(regions.length);
      expect(regions.includes("work"), screenStateId).toBe(true);
      expect(regions.includes("sidebar"), screenStateId).toBe(
        state.sidebar.visibility === "visible",
      );
      expect(regions.includes("preview"), screenStateId).toBe(
        studioLivePreviewVisible(state),
      );

      if (state.activeScreen !== "article-editor") {
        expect(studioLivePreviewVisible(state), screenStateId).toBe(false);
        expect(regions, screenStateId).not.toContain("preview");
      }

      if (selection.kind === "article") {
        expect(state.activeScreen, screenStateId).toBe("article-editor");
        expect(selection.articleId, screenStateId).toBe(state.activeArticleId);
      }
    }
  });

  test("derives one sidebar selection from the active location", () => {
    const article = requiredStudioState("article-editor-clean");
    const directory = requiredStudioState("article-directory-populated");
    const media = requiredStudioState("media-browser");
    const publish = requiredStudioState("publish-preview");

    expect(studioSidebarSelection(article)).toEqual({
      articleId: "article-writing-desk",
      kind: "article",
    });
    expect(studioSidebarSelection(directory)).toEqual({
      id: "articles",
      kind: "nav",
    });
    expect(studioSidebarSelection(media)).toEqual({
      id: "media",
      kind: "nav",
    });
    expect(studioSidebarSelection(publish)).toEqual({ kind: "none" });
  });

  test("removes editor live preview participation when leaving article editing", () => {
    const article = requiredStudioState("article-editor-clean");
    const projectHome = requiredStudioState("project-home");
    const nonEditorTransitions = [
      {
        commandId: "article.directory.open",
      },
      {
        commandId: "article.restoreVersion",
      },
      {
        commandId: "media.open",
      },
      {
        commandId: "project.openHome",
      },
      {
        commandId: "publish.prepare",
      },
      {
        commandId: "settings.open",
      },
    ] satisfies ReadonlyArray<{
      readonly commandId: StudioCommandId;
    }>;

    for (const { commandId } of nonEditorTransitions) {
      const result = runStudioCommand(studioMvpFixture, article, commandId);

      expect(result.ok, commandId).toBe(true);

      if (result.ok) {
        expect(studioLivePreviewVisible(result.state), commandId).toBe(false);
        expect(studioWorkspaceRegions(result.state), commandId).not.toContain(
          "preview",
        );
      }
    }

    const directory = runStudioCommand(
      studioMvpFixture,
      article,
      "article.directory.open",
    );

    expect(directory.ok).toBe(true);

    if (directory.ok) {
      const reopenedArticle = runStudioCommand(
        studioMvpFixture,
        directory.state,
        "article.open",
        { articleId: "article-small-shop" },
      );

      expect(reopenedArticle.ok).toBe(true);

      if (reopenedArticle.ok) {
        expect(reopenedArticle.state.activeArticleId).toBe(
          "article-small-shop",
        );
        expect(studioLivePreviewVisible(reopenedArticle.state)).toBe(true);
        expect(studioWorkspaceRegions(reopenedArticle.state)).toContain(
          "preview",
        );
      }
    }

    const wholeSitePreview = runStudioCommand(
      studioMvpFixture,
      projectHome,
      "preview.open",
    );

    expect(wholeSitePreview.ok).toBe(true);

    if (wholeSitePreview.ok) {
      expect(studioLivePreviewVisible(wholeSitePreview.state)).toBe(false);
      expect(studioWorkspaceRegions(wholeSitePreview.state)).not.toContain(
        "preview",
      );
    }
  });

  test("tracks article tree folder expansion through reducer state", () => {
    const article = requiredStudioState("article-editor-clean");

    expect(
      studioArticleTreeFolderCollapsed(article, "tree-workshop-folder"),
    ).toBe(false);

    const collapsed = runStudioCommand(
      studioMvpFixture,
      article,
      "articleTree.toggleFolder",
      { articleTreeNodeId: "tree-workshop-folder" },
    );

    expect(collapsed.ok).toBe(true);

    if (!collapsed.ok) {
      return;
    }

    expect(collapsed.state.collapsedArticleTreeNodeIds).toEqual([
      "tree-workshop-folder",
    ]);
    expect(
      studioArticleTreeFolderCollapsed(collapsed.state, "tree-workshop-folder"),
    ).toBe(true);

    expect(
      runStudioCommand(
        studioMvpFixture,
        collapsed.state,
        "articleTree.toggleFolder",
        { articleTreeNodeId: "tree-workshop-folder" },
      ),
    ).toMatchObject({
      ok: true,
      state: { collapsedArticleTreeNodeIds: [] },
    });
    expect(
      runStudioCommand(studioMvpFixture, article, "articleTree.toggleFolder"),
    ).toMatchObject({
      ok: false,
      reason: "Choose an article folder before toggling it.",
    });
    expect(
      runStudioCommand(studioMvpFixture, article, "articleTree.toggleFolder", {
        articleTreeNodeId: "tree-writing-desk",
      }),
    ).toMatchObject({
      ok: false,
      reason: "Unknown article folder: tree-writing-desk.",
    });
    expect(
      runStudioCommand(studioMvpFixture, article, "articleTree.toggleFolder", {
        articleTreeNodeId: "missing-folder",
      }),
    ).toMatchObject({
      ok: false,
      reason: "Unknown article folder: missing-folder.",
    });
  });

  test("models inline title editing and Properties collapse through reducer state", () => {
    const article = requiredStudioState("article-editor-clean");

    expect(article.editorProperties.visibility).toBe("visible");
    expect(studioCommandAvailability("editor.title.commit", article)).toEqual({
      reason: "Start editing the title first.",
      status: "disabled",
    });

    const collapsedProperties = runStudioCommand(
      studioMvpFixture,
      article,
      "editor.properties.toggle",
    );

    expect(collapsedProperties).toMatchObject({
      ok: true,
      state: {
        editorProperties: { visibility: "hidden" },
      },
    });

    const editing = runStudioCommand(
      studioMvpFixture,
      article,
      "editor.title.beginEdit",
    );

    expect(editing).toMatchObject({
      ok: true,
      state: {
        editorTitle: {
          baseline: "How to Build a Writing Desk",
          draft: "How to Build a Writing Desk",
          mode: "editing",
          status: "valid",
        },
      },
    });

    if (!editing.ok) {
      return;
    }

    const invalid = runStudioCommand(
      studioMvpFixture,
      editing.state,
      "editor.title.update",
      { titleDraft: "" },
    );

    expect(invalid).toMatchObject({
      ok: true,
      state: {
        activeArticleState: "invalid",
        activePreviewScenarioId: "preview-blocked",
        editorTitle: {
          diagnosticCode: "STUDIO-ARTICLE-TITLE-REQUIRED",
          draft: "",
          mode: "editing",
          status: "invalid",
        },
      },
    });

    if (!invalid.ok) {
      return;
    }

    expect(
      studioCommandAvailability("publish.prepare", invalid.state),
    ).toMatchObject({
      diagnosticCode: "STUDIO-ARTICLE-TITLE-REQUIRED",
      status: "blocked",
    });
    expect(
      runStudioCommand(studioMvpFixture, invalid.state, "editor.title.commit"),
    ).toMatchObject({
      diagnosticCode: "STUDIO-ARTICLE-TITLE-REQUIRED",
      ok: false,
      reason: "Add a title before applying it.",
      state: invalid.state,
    });

    const validDraft = runStudioCommand(
      studioMvpFixture,
      invalid.state,
      "editor.title.update",
      { titleDraft: "  A Better Writing Desk  " },
    );

    expect(validDraft).toMatchObject({
      ok: true,
      state: {
        activeArticleState: "dirty",
        activePreviewScenarioId: "preview-stale",
        editorTitle: {
          draft: "  A Better Writing Desk  ",
          mode: "editing",
          status: "valid",
        },
      },
    });

    if (!validDraft.ok) {
      return;
    }

    const committed = runStudioCommand(
      studioMvpFixture,
      validDraft.state,
      "editor.title.commit",
    );

    expect(committed).toMatchObject({
      ok: true,
      state: {
        editorTitle: {
          baseline: "A Better Writing Desk",
          draft: "A Better Writing Desk",
          mode: "viewing",
          status: "valid",
        },
      },
    });

    if (!committed.ok) {
      return;
    }

    const editingAgain = runStudioCommand(
      studioMvpFixture,
      committed.state,
      "editor.title.beginEdit",
    );
    const changedAgain = editingAgain.ok
      ? runStudioCommand(
          studioMvpFixture,
          editingAgain.state,
          "editor.title.update",
          {
            titleDraft: "Temporary title",
          },
        )
      : editingAgain;
    const cancelled = changedAgain.ok
      ? runStudioCommand(
          studioMvpFixture,
          changedAgain.state,
          "editor.title.cancel",
        )
      : changedAgain;

    expect(cancelled).toMatchObject({
      ok: true,
      state: {
        editorTitle: {
          baseline: "A Better Writing Desk",
          draft: "A Better Writing Desk",
          mode: "viewing",
          status: "valid",
        },
      },
    });
  });

  test("restores dialog-backed fixture states with their intended overlay", () => {
    const publishConfirm = studioStateFromScreenState(
      studioMvpFixture,
      "publish-confirm",
    );

    expect(publishConfirm).toMatchObject({
      ok: true,
      state: {
        activePublishScenarioId: "publish-confirm",
        activeScreen: "publish-preview",
        overlay: { kind: "publish-confirm" },
      },
    });
  });

  test("keeps command metadata stable and operation-aligned", () => {
    expect(studioCommandRegistry.map((command) => command.id)).toContain(
      "publish.confirm",
    );
    expect(
      studioCommandRegistry.find((command) => command.id === "publish.confirm"),
    ).toMatchObject({
      operationFamily: "publish.apply",
      safety: "provider-mutation",
    });
    expect(
      studioCommandRegistry.find(
        (command) => command.id === "article.saveDraft",
      ),
    ).toMatchObject({
      operationFamily: "editor.patch",
      safety: "source-write",
    });
  });

  test("derives visible command surface items from shared command records", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "article-editor-clean",
    );

    expect(restored.ok).toBe(true);

    if (!restored.ok) {
      return;
    }

    const items = studioCommandSurfaceItems(restored.state);
    const publishItem = items.find(
      (item) => item.record.id === "publish.prepare",
    );
    const saveItem = items.find(
      (item) => item.record.id === "article.saveDraft",
    );
    const hiddenSearchSetter = items.find(
      (item) => item.record.id === "article.directory.setSearch",
    );

    expect(publishItem).toMatchObject({
      availability: { status: "available" },
      groupLabel: "Preview and publish",
      record: {
        label: "Publish",
        safety: "safe",
      },
      shortcut: "⇧⌘P",
    });
    expect(saveItem?.groupLabel).toBe("Authoring");
    expect(hiddenSearchSetter).toBeUndefined();
    expect(commandAvailabilityLabel({ status: "blocked" })).toBe(
      "Needs attention",
    );
    expect(commandAvailabilityLabel({ status: "available" })).toBe("Available");
    expect(commandAvailabilityLabel({ status: "disabled" })).toBe(
      "Unavailable",
    );
    expect(commandGroupLabel("pane.toggleSidebar")).toBe("Workspace");
    expect(commandSafetyLabel("source-write")).toBe("Draft change");

    expect(
      groupStudioCommandItems(items).map(([groupLabel]) => groupLabel),
    ).toContain("Workspace");
  });

  test("filters command palette items by label, description, shortcut, and reason", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "article-editor-invalid",
    );

    expect(restored.ok).toBe(true);

    if (!restored.ok) {
      return;
    }

    const items = studioCommandSurfaceItems(restored.state);

    expect(
      filterStudioCommandItems(items, "errors").map((item) => item.record.id),
    ).toContain("publish.prepare");
    expect(
      filterStudioCommandItems(items, "draft change").map(
        (item) => item.record.id,
      ),
    ).toContain("article.saveDraft");
    expect(
      filterStudioCommandItems(items, "⌘1").map((item) => item.record.id),
    ).toEqual(["article.directory.open"]);
  });

  test("maps global keyboard shortcuts through the command registry", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "article-editor-clean",
    );

    expect(restored.ok).toBe(true);

    if (!restored.ok) {
      return;
    }

    expect(studioShortcutCommandIds()).toContain("publish.prepare");
    expect(
      studioCommandIdForKeyboardEvent(
        key("k", { metaKey: true }),
        restored.state,
      ),
    ).toBe("commandPalette.open");
    expect(
      studioCommandIdForKeyboardEvent(
        key("p", { metaKey: true, shiftKey: true }),
        restored.state,
      ),
    ).toBe("publish.prepare");
    expect(
      studioCommandIdForKeyboardEvent(
        key("b", { altKey: true, metaKey: true }),
        restored.state,
      ),
    ).toBe("pane.toggleSidebar");
    expect(
      studioCommandIdForKeyboardEvent(key("Escape"), {
        ...restored.state,
        overlay: { kind: "command-palette" },
      }),
    ).toBe("commandPalette.close");
    expect(
      studioCommandIdForKeyboardEvent(key("Escape"), restored.state),
    ).toBeUndefined();
  });

  test("classifies source editor text commands explicitly", () => {
    const editorCommandIds = new Set<StudioCommandId>([
      "format.blockquote",
      "format.bold",
      "format.bulletedList",
      "format.code",
      "format.codeBlock",
      "format.italic",
      "format.numberedList",
      "insert.footnote",
      "insert.heading",
      "insert.link",
    ]);

    for (const command of studioCommandRegistry) {
      expect(isEditorTextCommandId(command.id)).toBe(
        editorCommandIds.has(command.id),
      );
    }
  });

  test("returns disabled or blocked reasons instead of silent no-ops", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "article-editor-invalid",
    );

    expect(restored.ok).toBe(true);

    if (restored.ok) {
      expect(
        studioCommandAvailability("article.saveDraft", restored.state),
      ).toEqual({
        diagnosticCode: "STUDIO-ARTICLE-TITLE-REQUIRED",
        reason: "Fix article fields before saving a draft.",
        status: "blocked",
      });
      expect(
        runStudioCommand(studioMvpFixture, restored.state, "article.saveDraft"),
      ).toMatchObject({
        diagnosticCode: "STUDIO-ARTICLE-TITLE-REQUIRED",
        ok: false,
        reason: "Fix article fields before saving a draft.",
        state: restored.state,
      });
    }
  });

  test("preserves state for blocked and disabled interaction contracts", () => {
    const firstLaunch = requiredStudioState("first-launch");
    const invalidArticle = requiredStudioState("article-editor-invalid");
    const publishPreview = requiredStudioState("publish-preview");
    const restoreUnavailable = requiredStudioState("restore-unavailable");

    const blockedOrDisabledCases = [
      {
        commandId: "article.open",
        expectedReason: "Open or create a site before opening articles.",
        expectedStatus: "disabled",
        state: firstLaunch,
      },
      {
        commandId: "media.insertSelected",
        expectedReason: "Select an article and image before inserting media.",
        expectedStatus: "disabled",
        state: firstLaunch,
      },
      {
        commandId: "publish.prepare",
        expectedDiagnosticCode: "STUDIO-ARTICLE-TITLE-REQUIRED",
        expectedReason: "Fix article errors before publishing.",
        expectedStatus: "blocked",
        state: invalidArticle,
      },
      {
        commandId: "preview.open",
        expectedDiagnosticCode: "STUDIO-PREVIEW-BLOCKED",
        expectedReason: "Fix article errors before previewing.",
        expectedStatus: "blocked",
        state: invalidArticle,
      },
      {
        commandId: "publish.confirm",
        expectedReason: "Review the publish plan before confirming.",
        expectedStatus: "disabled",
        state: publishPreview,
      },
      {
        commandId: "restore.confirm",
        expectedReason: "Checkpoint history is not available for this project.",
        expectedStatus: "disabled",
        state: restoreUnavailable,
      },
    ] satisfies ReadonlyArray<{
      readonly commandId: StudioCommandId;
      readonly expectedDiagnosticCode?: string;
      readonly expectedReason: string;
      readonly expectedStatus: "blocked" | "disabled";
      readonly state: StudioAppState;
    }>;

    for (const {
      commandId,
      expectedDiagnosticCode,
      expectedReason,
      expectedStatus,
      state,
    } of blockedOrDisabledCases) {
      const availability = studioCommandAvailability(commandId, state);
      const result = runStudioCommand(studioMvpFixture, state, commandId);

      expect(availability).toMatchObject({
        reason: expectedReason,
        status: expectedStatus,
      });
      expect(result).toMatchObject({
        ok: false,
        reason: expectedReason,
      });
      expect(result.ok).toBe(false);
      expect(result.state).toBe(state);

      if (expectedDiagnosticCode !== undefined) {
        expect(availability.diagnosticCode).toBe(expectedDiagnosticCode);

        if (!result.ok) {
          expect(result.diagnosticCode).toBe(expectedDiagnosticCode);
        }
      }
    }
  });

  test("keeps representative interaction matrix transitions stable", () => {
    const article = requiredStudioState("article-editor-clean");
    const recentProjects = requiredStudioState("recent-projects");
    const projectHome = requiredStudioState("project-home");

    const transitionCases = [
      {
        commandId: "article.create",
        expectedState: {
          activeArticleId: "article-small-shop",
          activeScreen: "article-editor",
        },
        state: projectHome,
      },
      {
        commandId: "article.directory.open",
        expectedState: {
          activeScreen: "article-directory",
          articleDirectory: {
            directoryScenarioId: "directory-populated",
            query: "",
            statusFilter: "all",
          },
          overlay: { kind: "none" },
        },
        state: article,
      },
      {
        commandId: "project.showRecent",
        expectedState: {
          activeScreen: "recent-projects",
          overlay: { kind: "none" },
        },
        state: article,
      },
      {
        commandId: "project.openHome",
        expectedState: {
          activeScreen: "project-home",
          overlay: { kind: "none" },
        },
        state: recentProjects,
      },
      {
        commandId: "settings.open",
        expectedState: {
          activeScreen: "settings",
          activeSettingsSectionId: "publishing",
          activeSettingsState: "saved",
          overlay: { kind: "none" },
        },
        payload: { settingsSectionId: "publishing" },
        state: projectHome,
      },
      {
        commandId: "preview.open",
        expectedState: {
          activePreviewScenarioId: "preview-ready",
          previewPane: { sizePx: 520, visibility: "visible" },
        },
        state: article,
      },
      {
        commandId: "publish.prepare",
        expectedState: {
          activePreviewScenarioId: "preview-ready",
          activePublishScenarioId: "publish-preview",
          activeScreen: "publish-preview",
          overlay: { kind: "none" },
          previewPane: { visibility: "hidden" },
        },
        state: article,
      },
      {
        commandId: "article.restoreVersion",
        expectedState: {
          activeRestoreScenarioId: "restore-ready",
          activeScreen: "restore",
          overlay: { kind: "none" },
        },
        state: article,
      },
      {
        commandId: "insert.image",
        expectedState: {
          activeScreen: "media",
          overlay: { kind: "none" },
          previewPane: { visibility: "hidden" },
        },
        state: article,
      },
    ] satisfies ReadonlyArray<{
      readonly commandId: StudioCommandId;
      readonly expectedState: Partial<StudioAppState>;
      readonly payload?: StudioCommandPayload;
      readonly state: StudioAppState;
    }>;

    for (const {
      commandId,
      expectedState,
      payload,
      state,
    } of transitionCases) {
      expect(
        runStudioCommand(studioMvpFixture, state, commandId, payload),
      ).toMatchObject({
        command: { id: commandId },
        ok: true,
        state: expectedState,
      });
    }
  });

  test("keeps command availability precise for screen and flow context", () => {
    const firstLaunch = studioStateFromScreenState(
      studioMvpFixture,
      "first-launch",
    );
    const invalidArticle = studioStateFromScreenState(
      studioMvpFixture,
      "article-editor-invalid",
    );
    const article = studioStateFromScreenState(
      studioMvpFixture,
      "article-editor-clean",
    );

    expect(firstLaunch.ok).toBe(true);
    expect(invalidArticle.ok).toBe(true);
    expect(article.ok).toBe(true);

    if (!(firstLaunch.ok && invalidArticle.ok && article.ok)) {
      return;
    }

    expect(
      studioCommandAvailability("article.open", firstLaunch.state),
    ).toEqual({
      reason: "Open or create a site before opening articles.",
      status: "disabled",
    });
    expect(
      studioCommandAvailability("article.open", firstLaunch.state, {
        articleId: "article-writing-desk",
      }),
    ).toEqual({
      reason: "Open or create a site before opening articles.",
      status: "disabled",
    });
    expect(
      studioCommandAvailability("article.restoreVersion", firstLaunch.state),
    ).toEqual({
      reason: "Choose an article before restoring a version.",
      status: "disabled",
    });
    expect(
      studioCommandAvailability("commandPalette.close", firstLaunch.state),
    ).toEqual({
      reason: "The command palette is not open.",
      status: "disabled",
    });
    expect(studioCommandAvailability("format.bold", firstLaunch.state)).toEqual(
      {
        reason: "Open an article before editing.",
        status: "disabled",
      },
    );
    expect(
      studioCommandAvailability("insert.image", firstLaunch.state),
    ).toEqual({
      reason: "Open an article before inserting media.",
      status: "disabled",
    });
    expect(
      studioCommandAvailability("media.insertSelected", firstLaunch.state),
    ).toEqual({
      reason: "Select an article and image before inserting media.",
      status: "disabled",
    });
    expect(
      studioCommandAvailability("pane.togglePreview", firstLaunch.state),
    ).toEqual({
      reason: "Open an article before showing the live article preview.",
      status: "disabled",
    });
    expect(
      studioCommandAvailability("preview.open", invalidArticle.state),
    ).toEqual({
      diagnosticCode: "STUDIO-PREVIEW-BLOCKED",
      reason: "Fix article errors before previewing.",
      status: "blocked",
    });
    expect(
      studioCommandAvailability("publish.prepare", invalidArticle.state),
    ).toEqual({
      diagnosticCode: "STUDIO-ARTICLE-TITLE-REQUIRED",
      reason: "Fix article errors before publishing.",
      status: "blocked",
    });

    const directory = runStudioCommand(
      studioMvpFixture,
      firstLaunch.state,
      "article.directory.open",
    );
    const media = runStudioCommand(
      studioMvpFixture,
      article.state,
      "media.open",
    );
    const commandPalette = runStudioCommand(
      studioMvpFixture,
      firstLaunch.state,
      "commandPalette.open",
    );

    expect(directory.ok).toBe(true);
    expect(media.ok).toBe(true);
    expect(commandPalette.ok).toBe(true);

    if (directory.ok && media.ok && commandPalette.ok) {
      expect(
        studioCommandAvailability(
          "article.directory.setStatusFilter",
          directory.state,
        ),
      ).toEqual({ status: "available" });
      expect(studioCommandAvailability("media.setSearch", media.state)).toEqual(
        {
          status: "available",
        },
      );
      expect(
        studioCommandAvailability("commandPalette.close", commandPalette.state),
      ).toEqual({ status: "available" });
    }

    const publishPreview = runStudioCommand(
      studioMvpFixture,
      article.state,
      "publish.prepare",
    );
    expect(publishPreview.ok).toBe(true);

    if (publishPreview.ok) {
      expect(
        studioCommandAvailability("publish.openConfirm", publishPreview.state),
      ).toEqual({ status: "available" });
      expect(
        studioCommandAvailability("publish.finish", publishPreview.state),
      ).toEqual({
        reason: "Confirm the publish plan before completing publish.",
        status: "disabled",
      });

      const publishConfirm = runStudioCommand(
        studioMvpFixture,
        publishPreview.state,
        "publish.openConfirm",
      );

      expect(publishConfirm.ok).toBe(true);

      if (publishConfirm.ok) {
        expect(
          studioCommandAvailability("publish.confirm", publishConfirm.state),
        ).toEqual({ status: "available" });
      }
    }
  });

  test("runs navigation, pane, and editor transitions through the reducer", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "article-editor-clean",
    );

    expect(restored.ok).toBe(true);

    if (restored.ok) {
      const toggled = reduceStudioAppState(studioMvpFixture, restored.state, {
        commandId: "pane.togglePreview",
        type: "command",
      });
      const formatted = runStudioCommand(
        studioMvpFixture,
        restored.state,
        "format.bold",
      );
      const media = runStudioCommand(
        studioMvpFixture,
        restored.state,
        "media.open",
        { mediaId: "media-desk-sketch-missing-alt" },
      );
      const directory = runStudioCommand(
        studioMvpFixture,
        restored.state,
        "article.directory.open",
      );

      expect(toggled.ok).toBe(true);
      expect(formatted.ok).toBe(true);
      expect(media.ok).toBe(true);
      expect(directory.ok).toBe(true);

      if (toggled.ok && formatted.ok && media.ok && directory.ok) {
        expect(toggled.state.previewPane.visibility).toBe("hidden");
        expect(formatted.state.activeArticleState).toBe("dirty");
        expect(formatted.state.activePreviewScenarioId).toBe("preview-stale");
        expect(formatted.state.editorDraftSource).toContain("**bold text**");
        expect(formatted.state.editor?.lastCommandId).toBe("format.bold");
        expect(media.state).toMatchObject({
          activeMediaId: "media-desk-sketch-missing-alt",
          activeScreen: "media",
        });
        expect(directory.state).toMatchObject({
          activeScreen: "article-directory",
          articleDirectory: {
            directoryScenarioId: "directory-populated",
            query: "",
            statusFilter: "all",
          },
        });

        const searched = runStudioCommand(
          studioMvpFixture,
          directory.state,
          "article.directory.setSearch",
          { query: "desk" },
        );
        const filtered = searched.ok
          ? runStudioCommand(
              studioMvpFixture,
              searched.state,
              "article.directory.setStatusFilter",
              { statusFilter: "drafts" },
            )
          : searched;

        expect(filtered).toMatchObject({
          ok: true,
          state: {
            activeScreen: "article-directory",
            articleDirectory: {
              directoryScenarioId: "directory-populated",
              query: "desk",
              statusFilter: "drafts",
            },
          },
        });

        const home = runStudioCommand(
          studioMvpFixture,
          directory.state,
          "project.openHome",
        );

        expect(home).toMatchObject({
          ok: true,
          state: {
            activeScreen: "project-home",
            overlay: { kind: "none" },
          },
        });
      }
    }
  });

  test("applies source editor commands as pure Markdown transformations", () => {
    const selectedEditor = {
      contextTarget: "selection",
      cursorOffset: 0,
      scrollTop: 0,
      selection: { from: 6, to: 15 },
    } as const;
    const commandCases: ReadonlyArray<{
      readonly commandId: Parameters<typeof applyEditorTextCommand>[1];
      readonly editor?: Parameters<typeof applyEditorTextCommand>[2];
      readonly expected: string;
      readonly source: string;
    }> = [
      {
        commandId: "format.bold",
        editor: selectedEditor,
        expected: "plain **selection**",
        source: "plain selection",
      },
      {
        commandId: "format.italic",
        editor: selectedEditor,
        expected: "plain *selection*",
        source: "plain selection",
      },
      {
        commandId: "format.code",
        editor: selectedEditor,
        expected: "plain `selection`",
        source: "plain selection",
      },
      {
        commandId: "format.blockquote",
        editor: {
          contextTarget: "selection",
          cursorOffset: 0,
          scrollTop: 0,
          selection: { from: 0, to: 12 },
        },
        expected: "> first\n> second",
        source: "first\nsecond",
      },
      {
        commandId: "format.bulletedList",
        editor: {
          contextTarget: "selection",
          cursorOffset: 0,
          scrollTop: 0,
          selection: { from: 0, to: 14 },
        },
        expected: "- first\n- second",
        source: "- first\nsecond",
      },
      {
        commandId: "format.numberedList",
        editor: {
          contextTarget: "selection",
          cursorOffset: 0,
          scrollTop: 0,
          selection: { from: 0, to: 16 },
        },
        expected: "1. first\n2. second",
        source: "1. first\nsecond",
      },
      {
        commandId: "format.codeBlock",
        expected: "```\ncode block\n```",
        source: "",
      },
      {
        commandId: "insert.footnote",
        editor: {
          contextTarget: "selection",
          cursorOffset: 0,
          scrollTop: 0,
          selection: { from: 0, to: 4 },
        },
        expected: "[^1]\n\n[^1]: note",
        source: "note",
      },
      {
        commandId: "insert.heading",
        editor: {
          contextTarget: "selection",
          cursorOffset: 0,
          scrollTop: 0,
          selection: { from: 5, to: 9 },
        },
        expected: "## text",
        source: "lead text",
      },
      {
        commandId: "insert.link",
        editor: {
          contextTarget: "cursor",
          cursorOffset: 15,
          scrollTop: 0,
        },
        expected: "plain selection[link text](https://example.com)",
        source: "plain selection",
      },
    ];

    for (const { commandId, editor, expected, source } of commandCases) {
      expect(applyEditorTextCommand(source, commandId, editor).source).toBe(
        expected,
      );
    }

    const clampedReverseSelection = applyEditorTextCommand(
      "abc",
      "format.bold",
      {
        contextTarget: "selection",
        cursorOffset: 999,
        scrollTop: 0,
        selection: { from: 99, to: -3 },
      },
    );

    expect(clampedReverseSelection.source).toBe("**abc**");
  });

  test("reports missing fixture state through explicit recovery failures", () => {
    const fixtureWithoutFirstLaunch = {
      ...studioMvpFixture,
      sessions: studioMvpFixture.sessions.filter(
        (session) => session.id !== "session-first-launch",
      ),
    };
    const fixtureWithBrokenScreenState = {
      ...fixtureWithoutFirstLaunch,
      screenStates: fixtureWithoutFirstLaunch.screenStates.map((screenState) =>
        screenState.id === "first-launch"
          ? { ...screenState, sessionId: "missing-session" }
          : screenState,
      ),
    };
    const fixtureWithoutFirstLaunchScreenState = {
      ...studioMvpFixture,
      screenStates: studioMvpFixture.screenStates.filter(
        (screenState) => screenState.id !== "first-launch",
      ),
    };

    const brokenScreenSession = studioStateFromScreenState(
      fixtureWithBrokenScreenState,
      "first-launch",
    );
    const missingSession = studioStateFromSession(
      fixtureWithoutFirstLaunch,
      "missing-session",
    );
    const missingScreenState = studioStateFromScreenState(
      fixtureWithoutFirstLaunchScreenState,
      "first-launch",
    );
    const reducedRestore = reduceStudioAppState(
      fixtureWithoutFirstLaunchScreenState,
      missingSession.state,
      {
        screenStateId: "first-launch",
        type: "restore-screen-state",
      },
    );

    expect(brokenScreenSession).toMatchObject({
      ok: false,
      reason: "Missing session fixture: missing-session.",
    });
    expect(missingScreenState).toMatchObject({
      ok: false,
      reason: "Missing screen-state fixture: first-launch.",
      state: {
        activeScreen: "first-launch",
      },
    });
    expect(missingSession).toMatchObject({
      ok: false,
      reason: "Missing session fixture: missing-session.",
      state: {
        activeScreen: "first-launch",
        restoreStatus: "failed",
      },
    });
    expect(reducedRestore).toMatchObject({
      ok: false,
      reason: "Missing screen-state fixture: first-launch.",
    });
  });

  test("runs directory, project, and command-palette edge transitions", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "recent-projects",
    );

    expect(restored.ok).toBe(true);

    if (!restored.ok) {
      return;
    }

    const missingProject = runStudioCommand(
      studioMvpFixture,
      restored.state,
      "project.openSite",
      { recentProjectId: "recent-cedar" },
    );
    const openedDirectory = runStudioCommand(
      studioMvpFixture,
      restored.state,
      "article.directory.open",
    );
    const openedPalette = runStudioCommand(
      studioMvpFixture,
      restored.state,
      "commandPalette.open",
    );
    const openedKnownProject = runStudioCommand(
      studioMvpFixture,
      restored.state,
      "project.openSite",
      { recentProjectId: "recent-northwind" },
    );

    expect(missingProject).toMatchObject({
      ok: true,
      state: {
        activeScreen: "recent-projects",
        restoreStatus: "project-missing",
      },
    });
    expect(missingProject.state.activeProjectId).toBeUndefined();
    expect(openedDirectory.ok).toBe(true);
    expect(openedPalette.ok).toBe(true);
    expect(openedKnownProject).toMatchObject({
      ok: true,
      state: {
        activeProjectId: "workspace-northwind-journal",
        activeScreen: "project-home",
        restoreStatus: "restored",
      },
    });

    if (openedDirectory.ok) {
      const openedArticle = runStudioCommand(
        studioMvpFixture,
        openedDirectory.state,
        "article.open",
        { articleId: "article-writing-desk" },
      );
      const category = runStudioCommand(
        studioMvpFixture,
        openedDirectory.state,
        "article.directory.setCategory",
        { categoryFilter: "Workshop" },
      );
      const tag = category.ok
        ? runStudioCommand(
            studioMvpFixture,
            category.state,
            "article.directory.setTag",
            { tagFilter: "woodworking" },
          )
        : category;
      const reset = tag.ok
        ? runStudioCommand(
            studioMvpFixture,
            tag.state,
            "article.directory.resetFilters",
          )
        : tag;

      expect(openedArticle).toMatchObject({
        ok: true,
        state: {
          activeArticleId: "article-writing-desk",
          activeScreen: "article-editor",
          previewPane: { visibility: "visible" },
        },
      });
      expect(tag).toMatchObject({
        ok: true,
        state: {
          articleDirectory: {
            categoryFilter: "Workshop",
            tagFilter: "woodworking",
          },
        },
      });
      expect(reset).toMatchObject({
        ok: true,
        state: {
          articleDirectory: {
            directoryScenarioId: "directory-populated",
            query: "",
            statusFilter: "all",
          },
        },
      });
      expect(reset.state.articleDirectory).not.toHaveProperty("categoryFilter");
      expect(reset.state.articleDirectory).not.toHaveProperty("tagFilter");
    }

    if (openedPalette.ok) {
      expect(
        runStudioCommand(
          studioMvpFixture,
          openedPalette.state,
          "commandPalette.close",
        ),
      ).toMatchObject({
        ok: true,
        state: {
          overlay: { kind: "none" },
        },
      });
    }
  });

  test("keeps media and raw editor failure modes explicit", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "article-editor-clean",
    );

    expect(restored.ok).toBe(true);

    if (!restored.ok) {
      return;
    }

    expect(
      runStudioCommand(studioMvpFixture, restored.state, "editor.updateSource"),
    ).toMatchObject({
      ok: false,
      reason: "Missing editor source draft.",
    });

    const sourceSeeded = runStudioCommand(
      studioMvpFixture,
      restored.state,
      "editor.updateSource",
      {
        sourceDraft: "unchanged fixture source",
      },
    );

    expect(sourceSeeded.ok).toBe(true);

    if (sourceSeeded.ok) {
      expect(
        runStudioCommand(
          studioMvpFixture,
          sourceSeeded.state,
          "editor.updateSource",
          {
            sourceDraft: "unchanged fixture source",
          },
        ),
      ).toMatchObject({
        ok: true,
        state: {
          editor: {
            contextTarget: "cursor",
          },
        },
      });
    }

    const missingMediaState = {
      ...restored.state,
      activeMediaId: "missing-media",
    };
    const missingArticleState = {
      ...restored.state,
      activeArticleId: "missing-article",
      activeMediaId: "media-writing-desk-hero",
    };
    const missingArticleOpenState = {
      ...restored.state,
      activeArticleId: "missing-article",
    };

    expect(
      runStudioCommand(
        studioMvpFixture,
        missingMediaState,
        "media.insertSelected",
      ),
    ).toMatchObject({
      ok: false,
      reason: "Select an image before inserting media.",
    });
    expect(
      runStudioCommand(
        studioMvpFixture,
        missingArticleState,
        "media.insertSelected",
      ),
    ).toMatchObject({
      ok: false,
      reason: "Open an article before inserting media.",
    });
    expect(
      runStudioCommand(
        studioMvpFixture,
        missingArticleOpenState,
        "article.open",
      ),
    ).toMatchObject({
      ok: false,
      reason: "Choose an article before opening the editor.",
    });
  });

  test("routes raw editor transactions through centralized state", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "article-editor-clean",
    );

    expect(restored.ok).toBe(true);

    if (restored.ok) {
      const updated = runStudioCommand(
        studioMvpFixture,
        restored.state,
        "editor.updateSource",
        {
          cursorOffset: 17,
          selection: { from: 2, to: 17 },
          sourceDraft: "# Updated article\n\nDraft text.",
        },
      );

      expect(updated).toMatchObject({
        command: { id: "editor.updateSource" },
        ok: true,
        state: {
          activeArticleState: "dirty",
          activePreviewScenarioId: "preview-stale",
          editor: {
            contextTarget: "selection",
            cursorOffset: 17,
            lastCommandId: "editor.updateSource",
            selection: { from: 2, to: 17 },
          },
          editorDraftSource: "# Updated article\n\nDraft text.",
        },
      });
    }
  });

  test("routes preview commands through fixture-backed state", () => {
    const projectHome = studioStateFromScreenState(
      studioMvpFixture,
      "project-home",
    );
    const article = studioStateFromScreenState(
      studioMvpFixture,
      "article-editor-clean",
    );
    const firstLaunch = studioStateFromScreenState(
      studioMvpFixture,
      "first-launch",
    );

    expect(projectHome.ok).toBe(true);
    expect(article.ok).toBe(true);
    expect(firstLaunch.ok).toBe(true);

    if (projectHome.ok && article.ok && firstLaunch.ok) {
      const homePreview = runStudioCommand(
        studioMvpFixture,
        projectHome.state,
        "preview.open",
      );
      const staleArticle = runStudioCommand(
        studioMvpFixture,
        article.state,
        "format.bold",
      );
      const missingExternalPreview = runStudioCommand(
        studioMvpFixture,
        firstLaunch.state,
        "preview.openExternal",
      );

      expect(homePreview).toMatchObject({
        command: { id: "preview.open" },
        ok: true,
        state: {
          activePreviewScenarioId: "preview-home-ready",
          previewPane: { visibility: "hidden" },
        },
      });
      expect(missingExternalPreview).toMatchObject({
        command: { id: "preview.openExternal" },
        ok: false,
        reason: "External preview opens after the desktop shell is connected.",
      });

      if (staleArticle.ok) {
        expect(staleArticle.state.activePreviewScenarioId).toBe(
          "preview-stale",
        );

        const refreshed = runStudioCommand(
          studioMvpFixture,
          staleArticle.state,
          "preview.open",
        );
        const externalPreview = runStudioCommand(
          studioMvpFixture,
          refreshed.ok ? refreshed.state : staleArticle.state,
          "preview.openExternal",
        );
        const mobilePreview = runStudioCommand(
          studioMvpFixture,
          refreshed.ok ? refreshed.state : staleArticle.state,
          "preview.setViewport",
          { previewViewport: "mobile" },
        );

        expect(refreshed).toMatchObject({
          command: { id: "preview.open" },
          ok: true,
          state: {
            activePreviewScenarioId: "preview-ready",
            previewPane: { sizePx: 520, visibility: "visible" },
          },
        });
        expect(externalPreview).toMatchObject({
          command: { id: "preview.openExternal" },
          ok: false,
          reason:
            "External preview opens after the desktop shell is connected.",
        });
        expect(mobilePreview).toMatchObject({
          command: { id: "preview.setViewport" },
          ok: true,
          state: {
            previewViewport: "mobile",
          },
        });
      }
    }
  });

  test("routes settings section navigation through centralized state", () => {
    const projectHome = studioStateFromScreenState(
      studioMvpFixture,
      "project-home",
    );

    expect(projectHome.ok).toBe(true);

    if (projectHome.ok) {
      const opened = runStudioCommand(
        studioMvpFixture,
        projectHome.state,
        "settings.open",
      );

      expect(opened).toMatchObject({
        command: { id: "settings.open" },
        ok: true,
        state: {
          activeScreen: "settings",
          activeSettingsSectionId: "site-identity",
          activeSettingsState: "saved",
          overlay: { kind: "none" },
        },
      });

      const homepage =
        opened.ok &&
        runStudioCommand(studioMvpFixture, opened.state, "settings.open", {
          settingsSectionId: "homepage",
        });

      expect(homepage).toMatchObject({
        command: { id: "settings.open" },
        ok: true,
        state: {
          activeScreen: "settings",
          activeSettingsSectionId: "homepage",
          activeSettingsState: "saved",
          overlay: { kind: "none" },
        },
      });
    }
  });

  test("keeps startup project actions command-backed and fixture-only", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "first-launch",
    );

    expect(restored.ok).toBe(true);

    if (restored.ok) {
      const created = runStudioCommand(
        studioMvpFixture,
        restored.state,
        "project.createSite",
      );
      const recent = runStudioCommand(
        studioMvpFixture,
        restored.state,
        "project.showRecent",
      );

      expect(created).toMatchObject({
        command: { id: "project.createSite" },
        ok: true,
        state: {
          activeProjectId: "workspace-northwind-journal",
          activeScreen: "project-home",
        },
      });
      expect(recent).toMatchObject({
        command: { id: "project.showRecent" },
        ok: true,
        state: {
          activeScreen: "recent-projects",
        },
      });
    }
  });

  test("models missing-project recovery without filesystem side effects", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "restore-failure",
    );

    expect(restored.ok).toBe(true);

    if (restored.ok) {
      const removed = runStudioCommand(
        studioMvpFixture,
        restored.state,
        "recovery.removeRecent",
        { recentProjectId: "recent-cedar" },
      );
      const located = runStudioCommand(
        studioMvpFixture,
        restored.state,
        "recovery.locateProject",
        { recentProjectId: "recent-cedar" },
      );

      expect(removed).toMatchObject({
        ok: true,
        state: {
          activeScreen: "recent-projects",
          dismissedRecentProjectIds: ["recent-cedar"],
          restoreStatus: "restored",
        },
      });
      expect(located).toMatchObject({
        ok: true,
        state: {
          activeProjectId: "workspace-northwind-journal",
          activeScreen: "project-home",
          restoreStatus: "restored",
        },
      });
    }
  });

  test("models media browsing and insert-image as fixture-only editor state", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "article-editor-clean",
    );

    expect(restored.ok).toBe(true);

    if (!restored.ok) {
      return;
    }

    const opened = runStudioCommand(
      studioMvpFixture,
      restored.state,
      "insert.image",
    );

    expect(opened).toMatchObject({
      command: { id: "insert.image" },
      ok: true,
      state: {
        activeArticleId: "article-writing-desk",
        activeScreen: "media",
        previewPane: { visibility: "hidden" },
      },
    });
    expect(opened.ok).toBe(true);

    if (!opened.ok) {
      return;
    }

    const searched = runStudioCommand(
      studioMvpFixture,
      opened.state,
      "media.setSearch",
      { mediaQuery: "desk" },
    );
    const listed = runStudioCommand(
      studioMvpFixture,
      opened.state,
      "media.setViewMode",
      { mediaViewMode: "list" },
    );
    const selected = runStudioCommand(
      studioMvpFixture,
      opened.state,
      "media.open",
      { mediaId: "media-writing-desk-hero" },
    );

    expect(searched).toMatchObject({
      ok: true,
      state: { activeScreen: "media", media: { query: "desk" } },
    });
    expect(listed).toMatchObject({
      ok: true,
      state: { media: { viewMode: "list" } },
    });
    expect(selected).toMatchObject({
      ok: true,
      state: { activeMediaId: "media-writing-desk-hero" },
    });
    expect(selected.ok).toBe(true);

    if (!selected.ok) {
      return;
    }

    const inserted = runStudioCommand(
      studioMvpFixture,
      selected.state,
      "media.insertSelected",
      {
        mediaAltText: "Custom writing desk alt text",
        mediaId: "media-writing-desk-hero",
      },
    );

    expect(inserted).toMatchObject({
      command: { id: "media.insertSelected" },
      ok: true,
      state: {
        activeArticleState: "dirty",
        activeMediaId: "media-writing-desk-hero",
        activePreviewScenarioId: "preview-stale",
        activeScreen: "article-editor",
        editor: {
          contextTarget: "image-markdown",
          lastCommandId: "media.insertSelected",
        },
        previewPane: { visibility: "visible" },
      },
    });
    expect(inserted.state.editorDraftSource).toContain(
      "![Custom writing desk alt text](site/assets/articles/workshop/writing-desk-hero.jpg)",
    );
  });

  test("models checkpoint restore as safe fixture-only state transitions", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "article-editor-clean",
    );
    const unavailable = studioStateFromScreenState(
      studioMvpFixture,
      "restore-unavailable",
    );

    expect(restored.ok).toBe(true);
    expect(unavailable.ok).toBe(true);

    if (restored.ok && unavailable.ok) {
      const opened = runStudioCommand(
        studioMvpFixture,
        restored.state,
        "article.restoreVersion",
      );

      expect(opened).toMatchObject({
        command: { id: "article.restoreVersion" },
        ok: true,
        state: {
          activeRestoreScenarioId: "restore-ready",
          activeScreen: "restore",
          overlay: { kind: "none" },
        },
      });

      expect(opened.ok).toBe(true);

      if (!opened.ok) {
        return;
      }

      const selected = runStudioCommand(
        studioMvpFixture,
        opened.state,
        "restore.selectCheckpoint",
        {
          restoreScenarioId: "restore-draft-selected",
        },
      );

      expect(selected).toMatchObject({
        command: { id: "restore.selectCheckpoint" },
        ok: true,
        state: {
          activeRestoreScenarioId: "restore-draft-selected",
          activeScreen: "restore",
        },
      });
      expect(selected.ok).toBe(true);

      if (!selected.ok) {
        return;
      }

      const confirm = runStudioCommand(
        studioMvpFixture,
        selected.state,
        "restore.confirm",
      );

      expect(confirm).toMatchObject({
        command: { id: "restore.confirm" },
        ok: true,
        state: {
          activeRestoreScenarioId: "restore-confirm",
          activeScreen: "restore",
        },
      });
      expect(confirm.ok).toBe(true);

      if (!confirm.ok) {
        return;
      }

      const canceled = runStudioCommand(
        studioMvpFixture,
        confirm.state,
        "restore.cancel",
      );

      expect(canceled).toMatchObject({
        command: { id: "restore.cancel" },
        ok: true,
        state: {
          activeRestoreScenarioId: "restore-draft-selected",
          activeScreen: "restore",
        },
      });
      expect(canceled.ok).toBe(true);

      if (!canceled.ok) {
        return;
      }

      const reconfirmed = runStudioCommand(
        studioMvpFixture,
        canceled.state,
        "restore.confirm",
      );

      expect(reconfirmed.ok).toBe(true);

      if (!reconfirmed.ok) {
        return;
      }

      const completed = runStudioCommand(
        studioMvpFixture,
        reconfirmed.state,
        "restore.confirm",
      );

      expect(completed).toMatchObject({
        command: { id: "restore.confirm" },
        ok: true,
        state: {
          activeArticleState: "saved",
          activeRestoreScenarioId: "restore-restored",
          activeScreen: "restore",
        },
      });
      expect(
        runStudioCommand(
          studioMvpFixture,
          unavailable.state,
          "restore.confirm",
        ),
      ).toMatchObject({
        ok: false,
        reason: "Checkpoint history is not available for this project.",
      });

      expect(
        runStudioCommand(studioMvpFixture, opened.state, "restore.cancel"),
      ).toMatchObject({
        ok: true,
        state: {
          activeScreen: "article-editor",
          overlay: { kind: "none" },
        },
      });
    }
  });

  test("keeps restore cancel fallback safe without an article context", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "restore-unavailable",
    );

    expect(restored.ok).toBe(true);

    if (!restored.ok) {
      return;
    }

    const noArticleRestoreState = { ...restored.state };
    delete noArticleRestoreState.activeArticleId;

    const cancelled = runStudioCommand(
      studioMvpFixture,
      noArticleRestoreState,
      "restore.cancel",
    );

    expect(cancelled).toMatchObject({
      ok: true,
      state: {
        activeScreen: "project-home",
        overlay: { kind: "none" },
      },
    });
    expect(cancelled.state).not.toHaveProperty("activeRestoreScenarioId");
  });

  test("models publish plan and confirm as separate safe transitions", () => {
    const restored = studioStateFromScreenState(
      studioMvpFixture,
      "article-editor-clean",
    );

    expect(restored.ok).toBe(true);

    if (restored.ok) {
      const prepared = runStudioCommand(
        studioMvpFixture,
        restored.state,
        "publish.prepare",
      );

      expect(prepared.ok).toBe(true);

      if (prepared.ok) {
        expect(prepared.state.activePublishScenarioId).toBe("publish-preview");
        expect(prepared.state.activePreviewScenarioId).toBe("preview-ready");
        expect(prepared.state.activeScreen).toBe("publish-preview");
        expect(prepared.state.previewPane.visibility).toBe("hidden");

        const confirmOpen = runStudioCommand(
          studioMvpFixture,
          prepared.state,
          "publish.openConfirm",
        );

        expect(confirmOpen.ok).toBe(true);

        if (confirmOpen.ok) {
          expect(confirmOpen.state.activePublishScenarioId).toBe(
            "publish-confirm",
          );
          expect(confirmOpen.state.overlay.kind).toBe("publish-confirm");

          const confirmClosed = runStudioCommand(
            studioMvpFixture,
            confirmOpen.state,
            "publish.closeConfirm",
          );

          expect(confirmClosed).toMatchObject({
            ok: true,
            state: {
              activePublishScenarioId: "publish-preview",
              activeScreen: "publish-preview",
              overlay: { kind: "none" },
            },
          });

          const publishing = runStudioCommand(
            studioMvpFixture,
            confirmOpen.state,
            "publish.confirm",
          );

          expect(publishing).toMatchObject({
            ok: true,
            state: {
              activePublishScenarioId: "publish-progress",
              overlay: { kind: "none" },
            },
          });

          if (publishing.ok) {
            const success = runStudioCommand(
              studioMvpFixture,
              publishing.state,
              "publish.finish",
            );

            expect(success).toMatchObject({
              ok: true,
              state: { activePublishScenarioId: "publish-success" },
            });

            if (success.ok) {
              const done = runStudioCommand(
                studioMvpFixture,
                success.state,
                "publish.done",
              );

              expect(done).toMatchObject({
                ok: true,
                state: {
                  activeScreen: "article-editor",
                },
              });
              expect(done.state).not.toHaveProperty("activePublishScenarioId");
            }
          }
        }
      }
    }
  });

  test("routes publish retry and cancel without provider side effects", () => {
    const failed = studioStateFromScreenState(
      studioMvpFixture,
      "publish-failed",
    );
    const home = studioStateFromScreenState(studioMvpFixture, "project-home");

    expect(failed.ok).toBe(true);
    expect(home.ok).toBe(true);

    if (failed.ok) {
      expect(
        studioCommandAvailability("publish.retry", failed.state),
      ).toMatchObject({ status: "available" });

      expect(
        runStudioCommand(studioMvpFixture, failed.state, "publish.retry"),
      ).toMatchObject({
        ok: true,
        state: { activePublishScenarioId: "publish-progress" },
      });
    }

    if (home.ok) {
      const prepared = runStudioCommand(
        studioMvpFixture,
        home.state,
        "publish.prepare",
      );

      expect(prepared).toMatchObject({
        ok: true,
        state: {
          activePreviewScenarioId: "preview-home-ready",
          activeScreen: "publish-preview",
        },
      });

      if (prepared.ok) {
        const cancelled = runStudioCommand(
          studioMvpFixture,
          prepared.state,
          "publish.cancel",
        );

        expect(cancelled).toMatchObject({
          ok: true,
          state: {
            activeScreen: "project-home",
          },
        });
        expect(cancelled.state).not.toHaveProperty("activePublishScenarioId");
      }
    }
  });
});

function requiredStudioState(
  screenStateId: Parameters<typeof studioStateFromScreenState>[1],
): StudioAppState {
  const restored = studioStateFromScreenState(studioMvpFixture, screenStateId);

  if (!restored.ok) {
    throw new Error(restored.reason);
  }

  return restored.state;
}

function key(
  keyValue: string,
  overrides: Partial<{
    readonly altKey: boolean;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly shiftKey: boolean;
  }> = {},
): {
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly key: string;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
} {
  return {
    altKey: false,
    ctrlKey: false,
    key: keyValue,
    metaKey: false,
    shiftKey: false,
    ...overrides,
  };
}
