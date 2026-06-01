import { useCallback, useEffect, useMemo, useState } from "react";

import { studioCommandIdForKeyboardEvent } from "../commands/keyboard-shortcuts";
import {
  studioCommandAvailability,
  type StudioCommandId,
} from "../commands/studio-commands";
import type { StudioMvpFixture } from "../models/studio-fixtures";
import {
  runStudioCommand,
  type StudioAppState,
  type StudioCommandPayload,
  studioStateFromScreenState,
  type StudioTransitionResult,
} from "../state/studio-state";

/** Controller returned to the React Studio app shell. */
export interface StudioAppController {
  /** Whether the client-side controller has mounted and can run commands. */
  readonly isReady: boolean;
  /** Dispatches a shared command and updates local fixture-backed state. */
  readonly runCommand: (
    commandId: StudioCommandId,
    payload?: StudioCommandPayload,
  ) => StudioTransitionResult;
  /** Current fixture-backed app state. */
  readonly state: StudioAppState;
}

interface UseStudioAppControllerOptions {
  /** Optional fixture screen-state ID used by QA deep links and handoff demos. */
  readonly initialScreenStateId?: string | undefined;
}

/**
 * Creates the local fixture-backed Studio controller.
 *
 * @param fixture Studio MVP fixture graph.
 * @param options Optional controller initialization settings.
 * @returns App state and command dispatcher for React views.
 */
export function useStudioAppController(
  fixture: StudioMvpFixture,
  options: UseStudioAppControllerOptions = {},
): StudioAppController {
  const initialState = useMemo(() => {
    const requestedScreenStateId =
      options.initialScreenStateId ??
      browserScreenStateId() ??
      "article-editor-clean";
    const requestedScreenState = fixture.screenStates.find(
      (screenState) => screenState.id === requestedScreenStateId,
    );
    const resolvedScreenStateId =
      requestedScreenState?.id ?? "article-editor-clean";
    const requested = studioStateFromScreenState(
      fixture,
      resolvedScreenStateId,
    );

    return requested.state;
  }, [fixture, options.initialScreenStateId]);
  const [isReady, setIsReady] = useState(false);
  const [state, setState] = useState<StudioAppState>(initialState);

  const runCommand = useCallback(
    (
      commandId: StudioCommandId,
      payload?: StudioCommandPayload,
    ): StudioTransitionResult => {
      const result = runStudioCommand(fixture, state, commandId, payload);

      setState(result.state);

      return result;
    },
    [fixture, state],
  );

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const commandId = studioCommandIdForKeyboardEvent(event, state);

      if (commandId === undefined) {
        return;
      }

      const availability = studioCommandAvailability(commandId, state);

      if (availability.status !== "available") {
        return;
      }

      event.preventDefault();
      runCommand(commandId);
    };

    globalThis.addEventListener("keydown", handleKeyDown);

    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [runCommand, state]);

  return { isReady, runCommand, state };
}

function browserScreenStateId(): string | undefined {
  if (typeof globalThis.location === "undefined") {
    return undefined;
  }

  return (
    new URLSearchParams(globalThis.location.search).get("screen") ?? undefined
  );
}
