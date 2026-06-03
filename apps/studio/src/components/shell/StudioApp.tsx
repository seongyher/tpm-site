import type { ReactElement } from "react";

import { useStudioAppController } from "../../controllers/useStudioAppController";
import { studioMvpFixture } from "../../data/fixtures/studio-mvp-fixture";
import { StudioProviders } from "./StudioProviders";
import { StudioShell } from "./StudioShell";

interface StudioAppProps {
  initialScreenStateId?: string | undefined;
  operationId: string;
}

/**
 * Minimal Studio app composition that proves the shared shell can host later
 * fixture-backed screens.
 *
 * @returns The fixture-backed Studio app with providers installed.
 */
export function StudioApp({
  initialScreenStateId,
  operationId,
}: StudioAppProps): ReactElement {
  const controller = useStudioAppController(studioMvpFixture, {
    initialScreenStateId,
  });

  return (
    <StudioProviders>
      <StudioShell
        fixture={studioMvpFixture}
        isReady={controller.isReady}
        onCommand={controller.runCommand}
        operationId={operationId}
        state={controller.state}
      />
    </StudioProviders>
  );
}
