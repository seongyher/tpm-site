import type { ReactElement, ReactNode } from "react";
import {
  Group as ResizableGroup,
  Panel as ResizablePanel,
  Separator as ResizeSeparator,
} from "react-resizable-panels";

import {
  studioLivePreviewVisible,
  studioSidebarVisible,
} from "../../state/studio-selectors";
import type { StudioAppState } from "../../state/studio-state";
import {
  studioWorkspacePaneLayout,
  type StudioWorkspacePaneSize,
  type StudioWorkspacePaneVisibility,
} from "./workspace-layout-policy";

interface WorkspaceLayoutProps {
  main: ReactNode;
  preview: ReactNode;
  sidebar: ReactNode;
  state: StudioAppState;
}

/**
 * Resizable desktop workspace layout shared by every Studio screen.
 *
 * @returns Resizable sidebar, work, and preview panes.
 */
export function WorkspaceLayout({
  main,
  preview,
  sidebar,
  state,
}: WorkspaceLayoutProps): ReactElement {
  const visibility = paneVisibility(state);
  const layout = studioWorkspacePaneLayout(visibility);
  const sidebarVisible = studioSidebarVisible(state);
  const previewVisible = studioLivePreviewVisible(state);

  return (
    <ResizableGroup
      className="min-h-0 flex-1"
      id="studio-fixture-workspace-layout"
      key={`${state.sidebar.visibility}:${state.previewPane.visibility}`}
      orientation="horizontal"
    >
      {sidebarVisible && layout.sidebar !== undefined ? (
        <>
          <SidebarPane size={layout.sidebar}>{sidebar}</SidebarPane>
          <ResizeSeparator
            aria-label="Resize sidebar"
            className="bg-border hover:bg-accent focus-visible:bg-accent w-px transition-colors focus-visible:outline-none"
            id="sidebar-resize"
          />
        </>
      ) : null}
      <WorkPane size={layout.work}>{main}</WorkPane>
      {previewVisible && layout.preview !== undefined ? (
        <>
          <ResizeSeparator
            aria-label="Resize preview"
            className="bg-border hover:bg-accent focus-visible:bg-accent w-px transition-colors focus-visible:outline-none"
            id="preview-resize"
          />
          <PreviewPane size={layout.preview}>{preview}</PreviewPane>
        </>
      ) : null}
    </ResizableGroup>
  );
}

function PreviewPane({
  children,
  size,
}: {
  children: ReactNode;
  size: StudioWorkspacePaneSize;
}): ReactElement {
  return (
    <ResizablePanel
      className="border-border bg-panel min-w-0 border-l"
      defaultSize={percentage(size.defaultSize)}
      id="preview"
      minSize={percentage(size.minSize)}
    >
      <div className="h-full min-w-0 overflow-hidden">{children}</div>
    </ResizablePanel>
  );
}

function SidebarPane({
  children,
  size,
}: {
  children: ReactNode;
  size: StudioWorkspacePaneSize;
}): ReactElement {
  return (
    <ResizablePanel
      className="border-border bg-sidebar min-w-0 border-r"
      defaultSize={percentage(size.defaultSize)}
      id="sidebar"
      maxSize={
        size.maxSize === undefined ? undefined : percentage(size.maxSize)
      }
      minSize={percentage(size.minSize)}
    >
      <div className="h-full min-w-0 overflow-hidden">{children}</div>
    </ResizablePanel>
  );
}

function WorkPane({
  children,
  size,
}: {
  children: ReactNode;
  size: StudioWorkspacePaneSize;
}): ReactElement {
  return (
    <ResizablePanel
      className="bg-panel min-w-0"
      data-testid="work"
      defaultSize={percentage(size.defaultSize)}
      id="work"
      minSize={percentage(size.minSize)}
    >
      <div className="h-full min-w-0 overflow-auto">{children}</div>
    </ResizablePanel>
  );
}

function percentage(size: number): string {
  return `${size}%`;
}

function paneVisibility(state: StudioAppState): StudioWorkspacePaneVisibility {
  return {
    previewVisible: studioLivePreviewVisible(state),
    sidebarVisible: studioSidebarVisible(state),
  };
}
