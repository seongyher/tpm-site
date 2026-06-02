import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

import { cn } from "../../lib/cn";

type ButtonVariant = "danger" | "ghost" | "primary" | "secondary";
type ButtonSize = "icon" | "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

/**
 * Shared Studio button primitive for command-backed actions.
 *
 * @returns A Studio-styled button or slot-backed button primitive.
 */
export function Button({
  asChild = false,
  children,
  className,
  size = "md",
  type = "button",
  variant = "secondary",
  ...props
}: ButtonProps): ReactElement {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-control)] border font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70 [&_svg]:size-4 [&_svg]:shrink-0",
        buttonVariantClass(variant),
        buttonSizeClass(size),
        className,
      )}
      type={asChild ? undefined : type}
      {...props}
    >
      {children}
    </Comp>
  );
}

function buttonSizeClass(size: ButtonSize): string {
  switch (size) {
    case "icon":
      return "size-8 justify-center px-0";
    case "md":
      return "h-9 px-3 text-sm";
    case "sm":
      return "h-8 px-2.5 text-xs";
  }
}

function buttonVariantClass(variant: ButtonVariant): string {
  switch (variant) {
    case "danger":
      return "border-danger bg-danger text-white hover:bg-danger/90 focus-visible:outline-danger disabled:bg-danger/40";
    case "ghost":
      return "border-transparent bg-transparent text-foreground hover:bg-panel-muted disabled:text-subtle-foreground";
    case "primary":
      return "border-accent bg-accent text-white hover:bg-accent/90 focus-visible:outline-accent disabled:bg-accent/40";
    case "secondary":
      return "border-border bg-panel text-foreground hover:bg-panel-muted disabled:text-subtle-foreground";
  }
}
