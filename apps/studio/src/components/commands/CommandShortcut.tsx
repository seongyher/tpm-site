import type { ReactElement } from "react";

import { cn } from "../../lib/cn";

interface CommandShortcutProps {
  className?: string | undefined;
  shortcut: string;
}

/**
 * Compact keyboard shortcut pill shared by command surfaces.
 *
 * @returns A keyboard shortcut label.
 */
export function CommandShortcut({
  className,
  shortcut,
}: CommandShortcutProps): ReactElement {
  return (
    <kbd
      className={cn(
        "bg-panel-muted text-muted-foreground inline-flex h-6 shrink-0 items-center rounded-full px-2 font-mono text-xs",
        className,
      )}
    >
      {shortcut}
    </kbd>
  );
}
