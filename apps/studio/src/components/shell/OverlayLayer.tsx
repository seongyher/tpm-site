import type { ReactElement } from "react";

import type { StudioCommandId } from "../../commands/studio-commands";
import {
  publishViewModel,
  type StudioMvpFixture,
} from "../../models/studio-fixtures";
import type {
  StudioAppState,
  StudioOverlayState,
} from "../../state/studio-state";
import { CommandPalette } from "../commands/CommandPalette";
import { PublishConfirmDialog } from "../publish/PublishConfirmDialog";

interface OverlayLayerProps {
  fixture: StudioMvpFixture;
  onCloseCommand: () => void;
  onCommand: (commandId: StudioCommandId) => void;
  overlay: StudioOverlayState;
  state: StudioAppState;
}

/**
 * Reserved overlay mount point for dialogs, menus, command palette, and toasts.
 *
 * @returns The current overlay surface or an inert live-region mount point.
 */
export function OverlayLayer({
  fixture,
  onCommand,
  onCloseCommand,
  overlay,
  state,
}: OverlayLayerProps): ReactElement {
  if (overlay.kind === "none") {
    return <div aria-live="polite" data-studio-overlay-layer="" />;
  }

  if (overlay.kind === "command-palette") {
    return (
      <div
        aria-label="Studio command palette"
        aria-modal="true"
        className="fixed inset-0 z-50 grid place-items-start justify-center bg-black/15 pt-24"
        data-studio-overlay-layer=""
        role="dialog"
      >
        <CommandPalette
          onClose={onCloseCommand}
          onCommand={onCommand}
          state={state}
        />
      </div>
    );
  }

  if (overlay.kind === "blocked-action") {
    return (
      <div
        aria-live="assertive"
        className="border-danger/30 bg-panel shadow-panel fixed inset-x-4 top-4 z-50 mx-auto max-w-md rounded-[var(--radius-panel)] border p-4 text-sm"
        data-studio-overlay-layer=""
        role="alert"
      >
        <p className="text-foreground font-medium">Action unavailable</p>
        <p className="text-muted-foreground mt-1">{overlay.reason}</p>
      </div>
    );
  }

  const publish = publishViewModel(fixture, state);

  return publish === undefined ? (
    <div
      aria-live="polite"
      data-studio-overlay={overlay.kind}
      data-studio-overlay-layer=""
    />
  ) : (
    <div data-studio-overlay={overlay.kind} data-studio-overlay-layer="">
      <PublishConfirmDialog onCommand={onCommand} publish={publish} />
    </div>
  );
}
