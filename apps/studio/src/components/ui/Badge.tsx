import type { HTMLAttributes, ReactElement, ReactNode } from "react";

import { cn } from "../../lib/cn";

type BadgeTone = "accent" | "danger" | "neutral" | "success" | "warning";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: BadgeTone;
}

/**
 * Compact status badge for Studio rows, panels, and dialogs.
 *
 * @returns A small rounded status badge.
 */
export function Badge({
  children,
  className,
  tone = "neutral",
  ...props
}: BadgeProps): ReactElement {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        badgeToneClass(tone),
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

function badgeToneClass(tone: BadgeTone): string {
  switch (tone) {
    case "accent":
      return "bg-accent-muted text-accent-foreground";
    case "danger":
      return "bg-danger-muted text-danger";
    case "neutral":
      return "bg-panel-muted text-muted-foreground";
    case "success":
      return "bg-success-muted text-success";
    case "warning":
      return "bg-warning-muted text-warning";
  }
}
