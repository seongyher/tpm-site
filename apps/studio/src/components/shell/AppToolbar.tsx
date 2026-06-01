import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  PanelLeft,
  PanelRight,
  Plus,
  Search,
} from "lucide-react";
import type { ReactElement, ReactNode } from "react";

import {
  studioCommandAvailability,
  studioCommandById,
  type StudioCommandId,
} from "../../commands/studio-commands";
import type {
  StudioAppState,
  StudioCommandPayload,
} from "../../state/studio-state";
import { CommandDropdownMenu } from "../commands/CommandDropdownMenu";
import { AutosaveIndicator } from "../feedback/AutosaveIndicator";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { Tooltip } from "../ui/Tooltip";

interface AppToolbarProps {
  onCommand: (
    commandId: StudioCommandId,
    payload?: StudioCommandPayload,
  ) => void;
  state: StudioAppState;
}

interface ToolbarCommandButtonProps {
  children: ReactNode;
  commandId: StudioCommandId;
  label: string;
  onCommand: AppToolbarProps["onCommand"];
  shortcut?: string | undefined;
  state: StudioAppState;
  variant?: "primary" | "secondary";
}

/**
 * Shared Studio app toolbar for navigation, command entry, and primary actions.
 *
 * @returns The global Studio command toolbar.
 */
export function AppToolbar({
  onCommand,
  state,
}: AppToolbarProps): ReactElement {
  const startupMode =
    state.activeScreen === "first-launch" ||
    state.activeScreen === "recent-projects";
  const autosave = toolbarAutosaveStatus(state);

  return (
    <header className="border-border bg-panel flex min-h-16 items-center justify-between gap-3 border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Tooltip content="Back" shortcut="⌘[">
          <IconButton disabled label="Back">
            <ArrowLeft aria-hidden="true" />
          </IconButton>
        </Tooltip>
        <Tooltip content="Forward" shortcut="⌘]">
          <IconButton disabled label="Forward">
            <ArrowRight aria-hidden="true" />
          </IconButton>
        </Tooltip>
        <ToolbarIconCommand
          commandId="pane.toggleSidebar"
          label="Toggle side panel"
          onCommand={onCommand}
          shortcut="⌥⌘B"
          state={state}
        >
          <PanelLeft aria-hidden="true" />
        </ToolbarIconCommand>
        <Tooltip content="Open command palette" shortcut="⌘K">
          <Button
            aria-keyshortcuts="Meta+K Control+K"
            className="text-muted-foreground hidden min-w-56 justify-start xl:inline-flex"
            data-command-palette-trigger=""
            onClick={() => onCommand("commandPalette.open")}
            variant="secondary"
          >
            <Search aria-hidden="true" />
            {startupMode
              ? "Search sites..."
              : "Search articles, media, commands..."}
          </Button>
        </Tooltip>
      </div>
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <AutosaveIndicator label={autosave.label} state={autosave.state} />
        {startupMode ? (
          <ToolbarTextCommand
            commandId="project.createSite"
            label="Create site"
            onCommand={onCommand}
            state={state}
            variant="primary"
          >
            <Plus aria-hidden="true" />
            Create site
          </ToolbarTextCommand>
        ) : (
          <>
            <ToolbarTextCommand
              commandId="article.saveDraft"
              label="Save draft"
              onCommand={onCommand}
              shortcut="⌘S"
              state={state}
            />
            <ToolbarTextCommand
              commandId="preview.open"
              label="Preview"
              onCommand={onCommand}
              shortcut="⌘R"
              state={state}
            />
            <ToolbarTextCommand
              commandId="publish.prepare"
              label="Publish"
              onCommand={onCommand}
              shortcut="⇧⌘P"
              state={state}
              variant="primary"
            />
          </>
        )}
        <ToolbarIconCommand
          commandId="pane.togglePreview"
          label="Toggle preview"
          onCommand={onCommand}
          shortcut="⌥⌘P"
          state={state}
        >
          <PanelRight aria-hidden="true" />
        </ToolbarIconCommand>
        <CommandDropdownMenu
          commandIds={publishOptionCommandIds}
          label="Publish options"
          onCommand={onCommand}
          state={state}
          trigger={
            <IconButton label="More publish options" variant="secondary">
              <ChevronDown aria-hidden="true" />
            </IconButton>
          }
        />
      </div>
    </header>
  );
}

const publishOptionCommandIds = [
  "publish.prepare",
  "publish.openConfirm",
  "publish.cancel",
  "publish.retry",
  "publish.done",
  "preview.openExternal",
] as const satisfies readonly StudioCommandId[];

function toolbarAutosaveStatus(state: StudioAppState): {
  label: string;
  state: "dirty" | "failed" | "saved" | "saving";
} {
  if (state.activeScreen === "settings") {
    switch (state.activeSettingsState) {
      case "autosaving":
        return { label: "Saving settings", state: "saving" };
      case "dirty":
        return { label: "Unsaved settings changes", state: "dirty" };
      case "invalid":
        return { label: "Settings need attention", state: "failed" };
      case "saved":
      case undefined:
        return { label: "All changes saved", state: "saved" };
    }
  }

  switch (state.activeArticleState) {
    case "autosaving":
      return { label: "Autosaving", state: "saving" };
    case "clean":
    case "saved":
    case undefined:
      return { label: "All changes saved", state: "saved" };
    case "dirty":
      return { label: "Unsaved local changes", state: "dirty" };
    case "invalid":
      return { label: "1 field needs attention", state: "failed" };
  }

  return { label: "All changes saved", state: "saved" };
}

function ToolbarCommandButton({
  children,
  commandId,
  label,
  onCommand,
  shortcut,
  state,
  variant = "secondary",
}: ToolbarCommandButtonProps): ReactElement {
  const availability = studioCommandAvailability(commandId, state);
  const disabled = availability.status !== "available";
  const command = studioCommandById(commandId);
  const tooltip = availability.reason ?? label;

  return (
    <Tooltip
      content={tooltip}
      description={
        availability.reason === undefined ? command?.description : undefined
      }
      shortcut={shortcut}
    >
      <Button
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => onCommand(commandId)}
        variant={variant}
      >
        {children}
      </Button>
    </Tooltip>
  );
}

function ToolbarIconCommand({
  children,
  commandId,
  label,
  onCommand,
  shortcut,
  state,
}: Omit<ToolbarCommandButtonProps, "variant">): ReactElement {
  const availability = studioCommandAvailability(commandId, state);
  const disabled = availability.status !== "available";
  const command = studioCommandById(commandId);
  const tooltip = availability.reason ?? label;

  return (
    <Tooltip
      content={tooltip}
      description={
        availability.reason === undefined ? command?.description : undefined
      }
      shortcut={shortcut}
    >
      <IconButton
        aria-disabled={disabled}
        disabled={disabled}
        label={label}
        onClick={() => onCommand(commandId)}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

function ToolbarTextCommand({
  children,
  commandId,
  label,
  onCommand,
  shortcut,
  state,
  variant = "secondary",
}: Omit<ToolbarCommandButtonProps, "children"> & {
  children?: ReactNode;
}): ReactElement {
  return (
    <ToolbarCommandButton
      commandId={commandId}
      label={label}
      onCommand={onCommand}
      shortcut={shortcut}
      state={state}
      variant={variant}
    >
      {children ?? label}
    </ToolbarCommandButton>
  );
}
