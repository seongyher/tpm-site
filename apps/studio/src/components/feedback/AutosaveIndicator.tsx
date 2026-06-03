import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import type { ReactElement } from "react";

import { cn } from "../../lib/cn";

type AutosaveState = "dirty" | "failed" | "saved" | "saving";

interface AutosaveIndicatorProps {
  label: string;
  state: AutosaveState;
}

/**
 * Compact autosave state used by shell and editing surfaces.
 *
 * @returns An inline autosave status indicator.
 */
export function AutosaveIndicator({
  label,
  state,
}: AutosaveIndicatorProps): ReactElement {
  const Icon = autosaveIcon(state);

  return (
    <span
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 text-sm [&_svg]:size-4 [&_svg]:shrink-0",
        autosaveClass(state),
      )}
    >
      <Icon aria-hidden="true" />
      {label}
    </span>
  );
}

function autosaveClass(state: AutosaveState): string {
  switch (state) {
    case "dirty":
    case "saving":
      return "text-muted-foreground";
    case "failed":
      return "text-danger";
    case "saved":
      return "text-success";
  }
}

function autosaveIcon(state: AutosaveState): typeof CheckCircle2 {
  switch (state) {
    case "dirty":
    case "saved":
      return CheckCircle2;
    case "failed":
      return CircleAlert;
    case "saving":
      return LoaderCircle;
  }
}
