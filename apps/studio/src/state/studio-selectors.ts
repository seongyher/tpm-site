import type { StudioAppState } from "./studio-state";

/** Sidebar selection derived from the single active Studio location. */
export type StudioSidebarSelection =
  | { readonly articleId: string; readonly kind: "article" }
  | { readonly id: string; readonly kind: "nav" }
  | { readonly kind: "none" };

/** Visible workspace regions in render order. */
export type StudioWorkspaceRegion = "preview" | "sidebar" | "work";

/**
 * Returns whether the left sidebar participates in workspace layout.
 *
 * @param state Current Studio app state.
 * @returns Whether the sidebar should be rendered.
 */
export function studioSidebarVisible(state: StudioAppState): boolean {
  return state.sidebar.visibility === "visible";
}

/**
 * Returns whether the article live preview participates in workspace layout.
 *
 * @param state Current Studio app state.
 * @returns Whether the live preview pane should be rendered.
 */
export function studioLivePreviewVisible(state: StudioAppState): boolean {
  return (
    state.activeScreen === "article-editor" &&
    state.previewPane.visibility === "visible"
  );
}

/**
 * Returns the workspace regions that should be rendered.
 *
 * @param state Current Studio app state.
 * @returns Workspace regions in visual render order.
 */
export function studioWorkspaceRegions(
  state: StudioAppState,
): readonly StudioWorkspaceRegion[] {
  return [
    ...(studioSidebarVisible(state) ? ["sidebar" as const] : []),
    "work" as const,
    ...(studioLivePreviewVisible(state) ? ["preview" as const] : []),
  ];
}

/**
 * Returns the only sidebar item that should be visually selected.
 *
 * @param state Current Studio app state.
 * @returns Sidebar selection derived from the active screen and article.
 */
export function studioSidebarSelection(
  state: StudioAppState,
): StudioSidebarSelection {
  if (
    state.activeScreen === "article-editor" &&
    state.activeArticleId !== undefined
  ) {
    return { articleId: state.activeArticleId, kind: "article" };
  }

  switch (state.activeScreen) {
    case "article-directory":
    case "article-editor":
      return { id: "articles", kind: "nav" };
    case "first-launch":
      return { id: "recent-projects", kind: "nav" };
    case "media":
      return { id: "media", kind: "nav" };
    case "project-home":
      return { id: "project-home", kind: "nav" };
    case "publish-preview":
      return { kind: "none" };
    case "recent-projects":
      return { id: "recent-projects", kind: "nav" };
    case "restore":
      return { kind: "none" };
    case "settings":
      return { id: "settings", kind: "nav" };
  }
}

/**
 * Returns whether an article-tree folder node is collapsed.
 *
 * @param state Current Studio app state.
 * @param nodeId Article tree node ID.
 * @returns Whether the node is collapsed.
 */
export function studioArticleTreeFolderCollapsed(
  state: StudioAppState,
  nodeId: string,
): boolean {
  return state.collapsedArticleTreeNodeIds.includes(nodeId);
}
