import type { StudioAppState } from "../state/studio-state";
import type { StudioCommandId } from "./studio-commands";

/** Minimal keyboard event shape used by browser handlers and unit tests. */
export interface StudioKeyboardEventLike {
  /** Whether Alt/Option is pressed. */
  readonly altKey: boolean;
  /** Whether Control is pressed. */
  readonly ctrlKey: boolean;
  /** Pressed key value from KeyboardEvent. */
  readonly key: string;
  /** Whether Command/Windows is pressed. */
  readonly metaKey: boolean;
  /** Whether Shift is pressed. */
  readonly shiftKey: boolean;
}

interface StudioShortcutBinding {
  readonly alt?: boolean;
  readonly commandId: StudioCommandId;
  readonly key: string;
  readonly primary?: boolean;
  readonly shift?: boolean;
}

const studioShortcutBindings = [
  shortcut("commandPalette.open", "k", { primary: true }),
  shortcut("article.directory.open", "1", { primary: true }),
  shortcut("media.open", "2", { primary: true }),
  shortcut("settings.open", ",", { primary: true }),
  shortcut("article.create", "n", { primary: true }),
  shortcut("article.saveDraft", "s", { primary: true }),
  shortcut("preview.open", "r", { primary: true }),
  shortcut("publish.prepare", "p", { primary: true, shift: true }),
  shortcut("pane.toggleSidebar", "b", { alt: true, primary: true }),
  shortcut("pane.togglePreview", "p", { alt: true, primary: true }),
  shortcut("format.bold", "b", { primary: true }),
  shortcut("format.italic", "i", { primary: true }),
  shortcut("format.code", "e", { primary: true }),
  shortcut("insert.link", "l", { primary: true }),
  shortcut("insert.image", "i", { primary: true, shift: true }),
] as const satisfies readonly StudioShortcutBinding[];

/**
 * Resolves a keyboard event into a Studio command.
 *
 * @param event Browser keyboard event shape.
 * @param state Current Studio app state.
 * @returns Command ID when the event maps to a command.
 */
export function studioCommandIdForKeyboardEvent(
  event: StudioKeyboardEventLike,
  state: StudioAppState,
): StudioCommandId | undefined {
  if (
    state.overlay.kind === "command-palette" &&
    normalizedKey(event.key) === "escape" &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  ) {
    return "commandPalette.close";
  }

  return studioShortcutBindings.find((binding) =>
    keyboardEventMatchesShortcut(event, binding),
  )?.commandId;
}

/**
 * Returns every command with an explicit global shortcut.
 *
 * @returns Stable shortcut command IDs.
 */
export function studioShortcutCommandIds(): readonly StudioCommandId[] {
  return studioShortcutBindings.map((binding) => binding.commandId);
}

function keyboardEventMatchesShortcut(
  event: StudioKeyboardEventLike,
  binding: StudioShortcutBinding,
): boolean {
  return (
    normalizedKey(event.key) === binding.key &&
    Boolean(binding.alt) === event.altKey &&
    Boolean(binding.shift) === event.shiftKey &&
    primaryMatches(event, Boolean(binding.primary))
  );
}

function normalizedKey(key: string): string {
  return key.toLocaleLowerCase();
}

function primaryMatches(
  event: StudioKeyboardEventLike,
  expectsPrimary: boolean,
): boolean {
  return expectsPrimary
    ? event.metaKey || event.ctrlKey
    : !event.metaKey && !event.ctrlKey;
}

function shortcut(
  commandId: StudioCommandId,
  key: string,
  options: Omit<StudioShortcutBinding, "commandId" | "key">,
): StudioShortcutBinding {
  return { commandId, key, ...options };
}
