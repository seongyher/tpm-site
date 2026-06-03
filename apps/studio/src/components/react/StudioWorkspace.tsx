import type { ReactElement } from "react";

import { StudioApp } from "../shell/StudioApp";

interface StudioWorkspaceProps {
  initialScreenStateId?: string | undefined;
  operationId: string;
}

/**
 * Minimal bounded React mount for the future interactive Studio workspace.
 *
 * The full fixture-backed shell replaces this foundation in later Milestone 16
 * issues. Keeping this island tiny proves Astro/React wiring without moving
 * domain behavior into the browser.
 *
 * @returns The Studio React app mounted inside the Astro shell.
 */
export function StudioWorkspace({
  initialScreenStateId,
  operationId,
}: StudioWorkspaceProps): ReactElement {
  return (
    <StudioApp
      initialScreenStateId={initialScreenStateId}
      operationId={operationId}
    />
  );
}
