import type { ReactElement } from "react";

import type { StudioCommandId } from "../../commands/studio-commands";
import type { StudioMvpFixture } from "../../models/studio-fixtures";
import { StudioWorkPane } from "../../screens/StudioWorkPane";
import type {
  StudioAppState,
  StudioCommandPayload,
} from "../../state/studio-state";
import { WorkspaceSidebar } from "../navigation/WorkspaceSidebar";
import { PreviewPaneShell } from "../preview/PreviewPaneShell";
import { AppToolbar } from "./AppToolbar";
import { NativeToolbarBridge } from "./NativeToolbarBridge";
import { OverlayLayer } from "./OverlayLayer";
import { WorkspaceLayout } from "./WorkspaceLayout";

interface StudioShellProps {
  fixture: StudioMvpFixture;
  isReady: boolean;
  onCommand: (
    commandId: StudioCommandId,
    payload?: StudioCommandPayload,
  ) => void;
  operationId: string;
  state: StudioAppState;
}

/**
 * Shared fixture-backed Studio workspace shell.
 *
 * @returns The full-window Studio workspace composition.
 */
export function StudioShell({
  fixture,
  isReady,
  operationId,
  onCommand,
  state,
}: StudioShellProps): ReactElement {
  return (
    <section
      aria-label="Studio workspace"
      className="bg-background flex h-screen min-h-[42rem] overflow-hidden"
      data-studio-ready={isReady ? "true" : "false"}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <AppToolbar onCommand={onCommand} state={state} />
        <WorkspaceLayout
          main={
            <StudioWorkPane
              fixture={fixture}
              onCommand={onCommand}
              state={state}
            />
          }
          preview={
            <PreviewPaneShell
              fixture={fixture}
              onCommand={onCommand}
              state={state}
            />
          }
          sidebar={
            <WorkspaceSidebar
              navigation={fixture.navigation}
              onCommand={onCommand}
              state={state}
              workspace={fixture.workspace}
            />
          }
          state={state}
        />
        <NativeToolbarBridge operationId={operationId} />
      </div>
      <OverlayLayer
        fixture={fixture}
        onCloseCommand={() => onCommand("commandPalette.close")}
        onCommand={onCommand}
        overlay={state.overlay}
        state={state}
      />
    </section>
  );
}
