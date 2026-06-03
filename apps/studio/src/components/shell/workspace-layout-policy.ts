/** Serializable visibility state for the three-pane Studio workspace. */
export interface StudioWorkspacePaneVisibility {
  /** Whether the preview pane participates in the layout. */
  readonly previewVisible: boolean;
  /** Whether the sidebar participates in the layout. */
  readonly sidebarVisible: boolean;
}

/** Percentage sizes consumed by react-resizable-panels. */
export interface StudioWorkspacePaneLayout {
  /** Preview pane size percentage when visible. */
  readonly preview?: number;
  /** Sidebar pane size percentage when visible. */
  readonly sidebar?: number;
  /** Main work pane size percentage. */
  readonly work: number;
}

const EXPANDED_PREVIEW_SIZE = 35;
const EXPANDED_SIDEBAR_SIZE = 20;
const TOTAL_LAYOUT_SIZE = 100;

/**
 * Computes a stable workspace pane layout that always sums to 100%.
 *
 * @param visibility Current sidebar and preview visibility state.
 * @param visibility.previewVisible Whether the preview pane is visible.
 * @param visibility.sidebarVisible Whether the sidebar pane is visible.
 * @returns Resizable panel default sizes.
 */
export function studioWorkspacePaneLayout({
  previewVisible,
  sidebarVisible,
}: StudioWorkspacePaneVisibility): StudioWorkspacePaneLayout {
  const sidebar = sidebarVisible ? EXPANDED_SIDEBAR_SIZE : undefined;
  const preview = previewVisible ? EXPANDED_PREVIEW_SIZE : undefined;

  return {
    ...(preview === undefined ? {} : { preview }),
    ...(sidebar === undefined ? {} : { sidebar }),
    work: TOTAL_LAYOUT_SIZE - (sidebar ?? 0) - (preview ?? 0),
  };
}
