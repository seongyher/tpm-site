import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

import { Button } from "./Button";

interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  children: ReactNode;
  label: string;
  variant?: "danger" | "ghost" | "primary" | "secondary";
}

/**
 * Icon-only button with a required accessible label.
 *
 * @returns A labeled icon-only Studio button.
 */
export function IconButton({
  children,
  label,
  variant = "ghost",
  ...props
}: IconButtonProps): ReactElement {
  return (
    <Button aria-label={label} size="icon" variant={variant} {...props}>
      {children}
    </Button>
  );
}
