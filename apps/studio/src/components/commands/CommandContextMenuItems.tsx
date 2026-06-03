import * as ContextMenu from "@radix-ui/react-context-menu";
import type { ReactElement } from "react";

import {
  commandSurfaceItem,
  type StudioCommandSurfaceItem,
} from "../../commands/command-surfaces";
import {
  studioCommandById,
  type StudioCommandId,
} from "../../commands/studio-commands";
import type { StudioAppState } from "../../state/studio-state";
import { CommandDisplay } from "./CommandDisplay";

interface CommandContextMenuItemsProps {
  commandIds: readonly StudioCommandId[];
  onCommand: (commandId: StudioCommandId) => void;
  state: StudioAppState;
}

/**
 * Shared ContextMenu item renderer for command-backed contextual actions.
 *
 * @returns Context-menu command rows without redundant visible headings.
 */
export function CommandContextMenuItems({
  commandIds,
  onCommand,
  state,
}: CommandContextMenuItemsProps): ReactElement {
  const items = commandIds.flatMap((commandId) => {
    const record = studioCommandById(commandId);

    return record === undefined ? [] : [commandSurfaceItem(record, state)];
  });

  return (
    <>
      {items.map((item) => (
        <CommandContextMenuItem
          item={item}
          key={item.record.id}
          onCommand={onCommand}
        />
      ))}
    </>
  );
}

function CommandContextMenuItem({
  item,
  onCommand,
}: {
  item: StudioCommandSurfaceItem;
  onCommand: (commandId: StudioCommandId) => void;
}): ReactElement {
  const disabled = item.availability.status !== "available";

  return (
    <ContextMenu.Item
      aria-disabled={disabled}
      className="focus:bg-accent-muted focus:text-accent-foreground flex cursor-default items-center rounded-[var(--radius-control)] px-2 py-2 text-sm outline-none data-[disabled]:opacity-65"
      disabled={disabled}
      onSelect={() => onCommand(item.record.id)}
    >
      <CommandDisplay item={item} />
    </ContextMenu.Item>
  );
}
