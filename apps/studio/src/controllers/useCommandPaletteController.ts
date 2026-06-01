import { useMemo, useState } from "react";

import {
  filterStudioCommandItems,
  groupStudioCommandItems,
  type StudioCommandSurfaceGroup,
  studioCommandSurfaceItems,
} from "../commands/command-surfaces";
import type { StudioAppState } from "../state/studio-state";

interface CommandPaletteController {
  readonly groups: readonly StudioCommandSurfaceGroup[];
  readonly query: string;
  readonly setQuery: (query: string) => void;
}

/**
 * Derives command palette query and grouped command rows for the view layer.
 *
 * @param state Current Studio app state.
 * @returns Query state plus visible command groups.
 */
export function useCommandPaletteController(
  state: StudioAppState,
): CommandPaletteController {
  const [query, setQuery] = useState("");
  const items = useMemo(() => studioCommandSurfaceItems(state), [state]);
  const groups = useMemo(
    () => groupStudioCommandItems(filterStudioCommandItems(items, query)),
    [items, query],
  );

  return { groups, query, setQuery };
}
