import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactElement, ReactNode } from "react";

import { cn } from "../../lib/cn";

interface TooltipProviderProps {
  children: ReactNode;
}

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  description?: ReactNode | undefined;
  shortcut?: string | undefined;
}

/**
 * Shared tooltip provider with desktop-tool delays.
 *
 * @returns The Radix tooltip provider for Studio controls.
 */
export function TooltipProvider({
  children,
}: TooltipProviderProps): ReactElement {
  return (
    <TooltipPrimitive.Provider delayDuration={350} skipDelayDuration={100}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

/**
 * Tooltip for icon-only and compact command controls.
 *
 * @returns A tooltip-wrapped control.
 */
export function Tooltip({
  children,
  content,
  description,
  shortcut,
}: TooltipProps): ReactElement {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className={cn(
            "border-border bg-panel text-foreground shadow-panel flex max-w-80 items-center gap-3 rounded-[var(--radius-control)] border px-3 py-2 text-sm",
          )}
          sideOffset={8}
        >
          <span className="flex min-w-0 flex-col">
            <span>{content}</span>
            {description === undefined ? null : (
              <span className="text-muted-foreground text-xs">
                {description}
              </span>
            )}
          </span>
          {shortcut === undefined ? null : (
            <kbd className="bg-panel-muted text-muted-foreground rounded-full px-2 py-0.5 font-mono text-xs">
              {shortcut}
            </kbd>
          )}
          <TooltipPrimitive.Arrow className="fill-panel" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
