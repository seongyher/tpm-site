import type { ReactElement } from "react";

import { AutosaveIndicator } from "../feedback/AutosaveIndicator";
import { Badge } from "../ui/Badge";

type EditorWorkingCopyState =
  | "autosaving"
  | "clean"
  | "dirty"
  | "invalid"
  | "saved";

interface EditorStatusStripProps {
  format: "markdown" | "mdx";
  lastCommandLabel?: string | undefined;
  readTimeLabel: string;
  state: EditorWorkingCopyState;
  wordCountLabel: string;
}

/**
 * Footer metadata for the source editor and autosave model.
 *
 * @returns Compact editor state, word count, read time, and source format.
 */
export function EditorStatusStrip({
  format,
  lastCommandLabel,
  readTimeLabel,
  state,
  wordCountLabel,
}: EditorStatusStripProps): ReactElement {
  return (
    <footer className="border-border text-muted-foreground flex min-h-10 flex-wrap items-center justify-between gap-3 border-t px-4 py-2 text-xs">
      <AutosaveIndicator
        label={autosaveLabel(state)}
        state={autosaveState(state)}
      />
      <div className="flex flex-wrap items-center gap-3">
        {lastCommandLabel === undefined ? null : (
          <Badge tone="neutral">Last: {lastCommandLabel}</Badge>
        )}
        <span>{wordCountLabel}</span>
        <span aria-hidden="true">/</span>
        <span>{readTimeLabel}</span>
        <span aria-hidden="true">/</span>
        <span>{format.toUpperCase()}</span>
      </div>
    </footer>
  );
}

function autosaveLabel(state: EditorWorkingCopyState): string {
  switch (state) {
    case "autosaving":
      return "Autosaving...";
    case "clean":
      return "All changes saved";
    case "dirty":
      return "Unsaved local changes";
    case "invalid":
      return "Fix errors before saving";
    case "saved":
      return "Draft saved";
  }
}

function autosaveState(
  state: EditorWorkingCopyState,
): "dirty" | "failed" | "saved" | "saving" {
  switch (state) {
    case "autosaving":
      return "saving";
    case "clean":
    case "saved":
      return "saved";
    case "dirty":
      return "dirty";
    case "invalid":
      return "failed";
  }
}
