import type { ReactElement } from "react";

import {
  commandAvailabilityLabel,
  commandSafetyLabel,
  type StudioCommandSurfaceItem,
} from "../../commands/command-surfaces";
import { cn } from "../../lib/cn";
import { Badge } from "../ui/Badge";
import { CommandShortcut } from "./CommandShortcut";

interface CommandDisplayProps {
  className?: string | undefined;
  item: StudioCommandSurfaceItem;
  showGroup?: boolean;
  showSafety?: boolean;
}

/**
 * Shared visual body for palette, dropdown, and context-menu command rows.
 *
 * @returns Command label, metadata, reason, and shortcut.
 */
export function CommandDisplay({
  className,
  item,
  showGroup = false,
  showSafety = false,
}: CommandDisplayProps): ReactElement {
  const unavailable = item.availability.status !== "available";

  return (
    <span className={cn("flex min-w-0 flex-1 items-center gap-3", className)}>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium">{item.record.label}</span>
          {showGroup ? (
            <span className="text-muted-foreground shrink-0 text-xs">
              {item.groupLabel}
            </span>
          ) : null}
          {showSafety ? (
            <Badge tone={safetyBadgeTone(item.record.safety)}>
              {commandSafetyLabel(item.record.safety)}
            </Badge>
          ) : null}
        </span>
        {item.record.description === undefined ? null : (
          <span className="text-muted-foreground truncate text-xs">
            {item.record.description}
          </span>
        )}
        {unavailable ? (
          <span className="text-warning text-xs">
            {item.availability.reason ??
              commandAvailabilityLabel(item.availability)}
          </span>
        ) : null}
      </span>
      {item.shortcut === undefined ? null : (
        <CommandShortcut shortcut={item.shortcut} />
      )}
    </span>
  );
}

function safetyBadgeTone(
  safety: StudioCommandSurfaceItem["record"]["safety"],
): "accent" | "danger" | "neutral" | "success" | "warning" {
  switch (safety) {
    case "destructive":
      return "danger";
    case "navigation":
      return "neutral";
    case "provider-mutation":
      return "warning";
    case "safe":
      return "success";
    case "source-write":
      return "accent";
  }
}
