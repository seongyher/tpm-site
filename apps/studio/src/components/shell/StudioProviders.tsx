import type { ReactElement, ReactNode } from "react";

import { TooltipProvider } from "../ui/Tooltip";

interface StudioProvidersProps {
  children: ReactNode;
}

/**
 * Root providers for the bounded Studio React workspace.
 *
 * @returns Provider composition for Studio React islands.
 */
export function StudioProviders({
  children,
}: StudioProvidersProps): ReactElement {
  return <TooltipProvider>{children}</TooltipProvider>;
}
