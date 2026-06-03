import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Copy,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { ReactElement } from "react";

import type { StudioCommandId } from "../../commands/studio-commands";
import type { StudioCommandPayload } from "../../state/studio-state";
import { IconButton } from "../ui/IconButton";
import { Tooltip } from "../ui/Tooltip";

interface ArticleActionMenuProps {
  articleId: string;
  articleTitle: string;
  onCommand: (
    commandId: StudioCommandId,
    payload?: StudioCommandPayload,
  ) => void;
  restoreEnabled?: boolean;
}

interface ArticleFutureAction {
  readonly icon: ReactElement;
  readonly label: string;
  readonly reason: string;
}

const futureActions = [
  {
    icon: <Pencil aria-hidden="true" />,
    label: "Rename",
    reason: "Renaming articles requires writable source operations.",
  },
  {
    icon: <Copy aria-hidden="true" />,
    label: "Duplicate",
    reason: "Duplicating articles requires writable source operations.",
  },
  {
    icon: <FolderOpen aria-hidden="true" />,
    label: "Move",
    reason: "Moving articles requires category and source-write operations.",
  },
  {
    icon: <Trash2 aria-hidden="true" />,
    label: "Delete",
    reason: "Deleting articles requires restore checkpoints and source writes.",
  },
] as const satisfies readonly ArticleFutureAction[];

/**
 * Command-backed menu for article row actions.
 *
 * @returns Article actions with real fixture navigation and disabled future operations.
 */
export function ArticleActionMenu({
  articleId,
  articleTitle,
  onCommand,
  restoreEnabled = false,
}: ArticleActionMenuProps): ReactElement {
  return (
    <DropdownMenu.Root>
      <Tooltip content="Article actions">
        <DropdownMenu.Trigger asChild>
          <IconButton
            aria-haspopup="menu"
            label={`Actions for ${articleTitle}`}
          >
            <MoreHorizontal aria-hidden="true" />
          </IconButton>
        </DropdownMenu.Trigger>
      </Tooltip>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          aria-label={`Actions for ${articleTitle}`}
          className="bg-panel border-border shadow-panel z-50 min-w-64 rounded-[var(--radius-panel)] border p-1"
          sideOffset={8}
        >
          <DropdownMenu.Item
            className="focus:bg-accent-muted focus:text-accent-foreground flex cursor-default items-center gap-2 rounded-[var(--radius-control)] px-2 py-2 text-sm outline-none"
            onSelect={() => onCommand("article.open", { articleId })}
          >
            <Pencil aria-hidden="true" className="size-4 shrink-0" />
            Open editor
          </DropdownMenu.Item>
          <DropdownMenu.Item
            aria-disabled={!restoreEnabled}
            className="focus:bg-accent-muted focus:text-accent-foreground flex cursor-default items-center gap-2 rounded-[var(--radius-control)] px-2 py-2 text-sm outline-none data-[disabled]:opacity-65"
            disabled={!restoreEnabled}
            onSelect={() => onCommand("article.restoreVersion")}
            title={
              restoreEnabled
                ? undefined
                : "Open this article before restoring versions."
            }
          >
            <RotateCcw aria-hidden="true" className="size-4 shrink-0" />
            Restore version
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="bg-border my-1 h-px" />
          {futureActions.map((action) => (
            <DropdownMenu.Item
              aria-disabled="true"
              className="flex cursor-default items-center gap-2 rounded-[var(--radius-control)] px-2 py-2 text-sm opacity-65 outline-none"
              disabled
              key={action.label}
              title={action.reason}
            >
              <span className="[&_svg]:size-4 [&_svg]:shrink-0">
                {action.icon}
              </span>
              <span className="min-w-0 flex-1">{action.label}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
