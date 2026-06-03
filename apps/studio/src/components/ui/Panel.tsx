import type { HTMLAttributes, ReactElement, ReactNode } from "react";

import { cn } from "../../lib/cn";

interface PanelProps extends HTMLAttributes<HTMLElement> {
  as?: "aside" | "section";
  children: ReactNode;
  variant?: "muted" | "plain";
}

/**
 * Structural Studio panel primitive for work panes and side surfaces.
 *
 * @returns A bordered Studio panel element.
 */
export function Panel({
  as: Tag = "section",
  children,
  className,
  variant = "plain",
  ...props
}: PanelProps): ReactElement {
  return (
    <Tag
      className={cn(
        "border-border shadow-panel rounded-[var(--radius-panel)] border",
        variant === "plain" ? "bg-panel" : "bg-panel-muted",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
