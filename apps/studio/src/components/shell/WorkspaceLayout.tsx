import type { ReactElement, ReactNode } from "react";
import {
  Group as ResizableGroup,
  Panel as ResizablePanel,
  Separator as ResizeSeparator,
} from "react-resizable-panels";

import { cn } from "../../lib/cn";
import type { StudioAppState } from "../../state/studio-state";
import {
  studioWorkspacePaneLayout,
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

  return (
    <ResizableGroup
      className="min-h-0 flex-1"
      id="studio-fixture-workspace-layout"
      key={`${state.sidebar.visibility}:${state.previewPane.visibility}`}
      orientation="horizontal"
    >
      <SidebarPane
        collapsed={visibility.sidebarCollapsed}
        defaultSize={layout.sidebar}
      >
        {sidebar}
      </SidebarPane>
      <ResizeSeparator
        aria-label="Resize sidebar"
        className="bg-border hover:bg-accent focus-visible:bg-accent w-px transition-colors focus-visible:outline-none"
        id="sidebar-resize"
      />
      <WorkPane defaultSize={layout.work}>{main}</WorkPane>
      <ResizeSeparator
        aria-label="Resize preview"
        className="bg-border hover:bg-accent focus-visible:bg-accent w-px transition-colors focus-visible:outline-none"
        id="preview-resize"
      />
      <PreviewPane
        collapsed={visibility.previewCollapsed}
        defaultSize={layout.preview}
      >
        {preview}
      </PreviewPane>
    </ResizableGroup>
  );
}

function CollapsedRail({ label }: { label: string }): ReactElement {
  return (
    <div
      aria-label={`${label} collapsed`}
      className="text-muted-foreground flex h-full items-start justify-center pt-4 text-xs"
    >
      {label}
    </div>
  );
}

function PreviewPane({
  children,
  collapsed,
  defaultSize,
}: {
  children: ReactNode;
  collapsed: boolean;
  defaultSize: number;
}): ReactElement {
  return (
    <ResizablePanel
      className="border-border bg-panel min-w-0 border-l"
      collapsedSize="5%"
      collapsible
      defaultSize={`${defaultSize}%`}
      id="preview"
      minSize="24%"
    >
      <div className={cn("h-full", collapsed && "sr-only")}>{children}</div>
      {collapsed ? <CollapsedRail label="Preview" /> : null}
    </ResizablePanel>
  );
}

function SidebarPane({
  children,
  collapsed,
  defaultSize,
}: {
  children: ReactNode;
  collapsed: boolean;
  defaultSize: number;
}): ReactElement {
  return (
    <ResizablePanel
      className="border-border bg-sidebar min-w-0 border-r"
      collapsedSize="5%"
      collapsible
      defaultSize={`${defaultSize}%`}
      id="sidebar"
      maxSize="30%"
      minSize="16%"
    >
      <div className={cn("h-full", collapsed && "sr-only")}>{children}</div>
      {collapsed ? <CollapsedRail label="Sidebar" /> : null}
    </ResizablePanel>
  );
}

function WorkPane({
  children,
  defaultSize,
}: {
  children: ReactNode;
  defaultSize: number;
}): ReactElement {
  return (
    <ResizablePanel
      className="bg-panel min-w-[26rem] overflow-auto"
      defaultSize={`${defaultSize}%`}
      id="work"
      minSize="34%"
    >
      {children}
    </ResizablePanel>
  );
}

function paneVisibility(state: StudioAppState): StudioWorkspacePaneVisibility {
  return {
    previewCollapsed: state.previewPane.visibility === "collapsed",
    sidebarCollapsed: state.sidebar.visibility === "collapsed",
  };
}
