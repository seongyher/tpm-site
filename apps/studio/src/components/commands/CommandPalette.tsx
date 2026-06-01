import { Command } from "cmdk";
import { Search } from "lucide-react";
import type { ReactElement } from "react";

import type { StudioCommandId } from "../../commands/studio-commands";
import { useCommandPaletteController } from "../../controllers/useCommandPaletteController";
import type { StudioAppState } from "../../state/studio-state";
import { Button } from "../ui/Button";
import { CommandDisplay } from "./CommandDisplay";

interface CommandPaletteProps {
  onClose: () => void;
  onCommand: (commandId: StudioCommandId) => void;
  state: StudioAppState;
}

/**
 * Searchable command palette rendered from the shared command registry.
 *
 * @returns Command palette dialog content.
 */
export function CommandPalette({
  onClose,
  onCommand,
  state,
}: CommandPaletteProps): ReactElement {
  const { groups, query, setQuery } = useCommandPaletteController(state);

  return (
    <Command
      className="border-border bg-panel shadow-panel w-[min(42rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-panel)] border"
      label="Studio command palette"
      shouldFilter={false}
    >
      <div className="border-border flex items-center gap-2 border-b px-4 py-3">
        <Search aria-hidden="true" className="text-muted-foreground size-4" />
        <Command.Input
          autoFocus
          className="placeholder:text-muted-foreground min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
          onValueChange={setQuery}
          placeholder="Search commands, screens, and actions..."
          value={query}
        />
        <Button onClick={onClose} size="sm" variant="ghost">
          Close
        </Button>
      </div>
      <Command.List className="max-h-[28rem] overflow-y-auto p-2">
        <Command.Empty className="text-muted-foreground px-3 py-8 text-center text-sm">
          No commands found.
        </Command.Empty>
        {groups.map(([groupLabel, groupItems]) => (
          <Command.Group heading={groupLabel} key={groupLabel}>
            {groupItems.map((item) => (
              <Command.Item
                aria-disabled={item.availability.status !== "available"}
                className="data-[selected=true]:bg-accent-muted data-[selected=true]:text-accent-foreground my-0.5 flex min-h-14 cursor-default scroll-m-1 items-center rounded-[var(--radius-control)] px-3 py-2 text-sm outline-none aria-disabled:opacity-65"
                disabled={item.availability.status !== "available"}
                key={item.record.id}
                onSelect={() => onCommand(item.record.id)}
                value={item.record.id}
              >
                <CommandDisplay item={item} showSafety />
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command>
  );
}
