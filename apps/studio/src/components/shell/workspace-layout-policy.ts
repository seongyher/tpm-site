/** Serializable visibility state for the three-pane Studio workspace. */
export interface StudioWorkspacePaneVisibility {
  /** Whether the preview pane participates in the layout. */
  readonly previewVisible: boolean;
  /** Whether the sidebar participates in the layout. */
  readonly sidebarVisible: boolean;
}

/** Percentage constraints consumed by react-resizable-panels. */
export interface StudioWorkspacePaneSize {
  /** Initial pane size percentage. */
  readonly defaultSize: number;
  /** Maximum pane size percentage while visible. */
  readonly maxSize?: number;
  /** Minimum pane size percentage while visible. */
  readonly minSize: number;
}

/** Percentage sizes and constraints consumed by react-resizable-panels. */
export interface StudioWorkspacePaneLayout {
  /** Preview pane size policy when visible. */
  readonly preview?: StudioWorkspacePaneSize;
  /** Sidebar pane size policy when visible. */
  readonly sidebar?: StudioWorkspacePaneSize;
  /** Main work pane size policy. */
  readonly work: StudioWorkspacePaneSize;
}

const EXPANDED_PREVIEW_SIZE = 35;
const EXPANDED_SIDEBAR_SIZE = 20;
const MAX_SIDEBAR_SIZE = 30;
const MIN_PREVIEW_SIZE = 24;
const MIN_SIDEBAR_SIZE = 16;
const MIN_WORK_SIZE = 28;
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
  const sidebar = sidebarVisible
    ? {
        defaultSize: EXPANDED_SIDEBAR_SIZE,
        maxSize: MAX_SIDEBAR_SIZE,
        minSize: MIN_SIDEBAR_SIZE,
      }
    : undefined;
  const preview = previewVisible
    ? {
        defaultSize: EXPANDED_PREVIEW_SIZE,
        minSize: MIN_PREVIEW_SIZE,
      }
    : undefined;
  const occupiedSize =
    (sidebar?.defaultSize ?? 0) + (preview?.defaultSize ?? 0);

  return {
    ...(preview === undefined ? {} : { preview }),
    ...(sidebar === undefined ? {} : { sidebar }),
    work: {
      defaultSize: TOTAL_LAYOUT_SIZE - occupiedSize,
      minSize: MIN_WORK_SIZE,
    },
  };
}
