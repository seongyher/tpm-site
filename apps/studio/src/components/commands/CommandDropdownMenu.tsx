import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ReactElement, ReactNode } from "react";

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

interface CommandDropdownMenuProps {
  commandIds: readonly StudioCommandId[];
  label: string;
  onCommand: (commandId: StudioCommandId) => void;
  state: StudioAppState;
  trigger: ReactNode;
}

/**
 * Shared dropdown menu renderer backed by command records.
 *
 * @returns A Radix dropdown with command-backed items.
 */
export function CommandDropdownMenu({
  commandIds,
  label,
  onCommand,
  state,
  trigger,
}: CommandDropdownMenuProps): ReactElement {
  const items = commandIds.flatMap((commandId) => {
    const record = studioCommandById(commandId);

    return record === undefined ? [] : [commandSurfaceItem(record, state)];
  });

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          aria-label={label}
          className="bg-panel border-border shadow-panel z-50 min-w-72 rounded-[var(--radius-panel)] border p-1"
          sideOffset={8}
        >
          {items.map((item) => (
            <CommandDropdownMenuItem
              item={item}
              key={item.record.id}
              onCommand={onCommand}
            />
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function CommandDropdownMenuItem({
  item,
  onCommand,
}: {
  item: StudioCommandSurfaceItem;
  onCommand: (commandId: StudioCommandId) => void;
}): ReactElement {
  const disabled = item.availability.status !== "available";

  return (
    <DropdownMenu.Item
      aria-disabled={disabled}
      className="focus:bg-accent-muted focus:text-accent-foreground flex cursor-default items-center rounded-[var(--radius-control)] px-2 py-2 text-sm outline-none data-[disabled]:opacity-65"
      disabled={disabled}
      onSelect={() => onCommand(item.record.id)}
    >
      <CommandDisplay item={item} />
    </DropdownMenu.Item>
  );
}
