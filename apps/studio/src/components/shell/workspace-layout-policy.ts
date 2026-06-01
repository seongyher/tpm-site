/** Serializable visibility state for the three-pane Studio workspace. */
export interface StudioWorkspacePaneVisibility {
  /** Whether the preview pane is collapsed to its rail. */
  readonly previewCollapsed: boolean;
  /** Whether the sidebar is collapsed to its rail. */
  readonly sidebarCollapsed: boolean;
}

/** Percentage sizes consumed by react-resizable-panels. */
export interface StudioWorkspacePaneLayout {
  /** Preview pane size percentage. */
  readonly preview: number;
  /** Sidebar pane size percentage. */
  readonly sidebar: number;
  /** Main work pane size percentage. */
  readonly work: number;
}

const COLLAPSED_PANE_SIZE = 5;
const EXPANDED_PREVIEW_SIZE = 35;
const EXPANDED_SIDEBAR_SIZE = 22;
const TOTAL_LAYOUT_SIZE = 100;

/**
 * Computes a stable workspace pane layout that always sums to 100%.
 *
 * @param visibility Current sidebar and preview visibility state.
 * @param visibility.previewCollapsed Whether the preview pane is collapsed.
 * @param visibility.sidebarCollapsed Whether the sidebar pane is collapsed.
 * @returns Resizable panel default sizes.
 */
export function studioWorkspacePaneLayout({
  previewCollapsed,
  sidebarCollapsed,
}: StudioWorkspacePaneVisibility): StudioWorkspacePaneLayout {
  const sidebar = sidebarCollapsed
    ? COLLAPSED_PANE_SIZE
    : EXPANDED_SIDEBAR_SIZE;
  const preview = previewCollapsed
    ? COLLAPSED_PANE_SIZE
    : EXPANDED_PREVIEW_SIZE;

  return {
    preview,
    sidebar,
    work: TOTAL_LAYOUT_SIZE - sidebar - preview,
  };
}
