/** Copy-result states reflected on progressive clipboard buttons. */
export type ClipboardCopyState = "copied" | "error";

/** Minimal clipboard writer required by progressive copy helpers. */
export interface ClipboardWriter {
  readonly clipboard: {
    writeText(text: string): Promise<void>;
  };
}

/** Minimal status node contract needed for clipboard status reporting. */
interface ClipboardStatusNode {
  textContent: null | string;
}

/** Minimal root contract needed for clipboard status reporting. */
interface ClipboardStatusRoot {
  querySelector(selector: string): ClipboardStatusNode | null;
}

/** Minimal button contract needed for clipboard status reporting. */
export interface ClipboardStatusButton {
  closest(selector: string): ClipboardStatusRoot | null;
  readonly dataset: DOMStringMap;
}

/** Target elements and selectors needed to report copy status. */
export interface ClipboardStatusTarget {
  readonly button: ClipboardStatusButton;
  readonly rootSelector: string;
  readonly stateDatasetKey: string;
  readonly statusSelector: string;
}

/**
 * Parses a JSON-encoded string payload from a data attribute.
 *
 * @param encoded Encoded data attribute value.
 * @returns Parsed string, or undefined when the payload is absent or invalid.
 */
export function parseJsonStringPayload(
  encoded: string | undefined,
): string | undefined {
  if (encoded === undefined) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(encoded);

    return typeof parsed === "string" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Copies text to the clipboard and reports user-visible status.
 *
 * @param writer Clipboard writer.
 * @param text Text to copy.
 * @param statusTarget Button, selectors, and dataset key for status reporting.
 * @param messages Empty, success, and failure messages.
 * @param messages.empty Message for missing text.
 * @param messages.failure Message for failed clipboard writes.
 * @param messages.success Message for successful clipboard writes.
 */
export async function copyTextWithStatus(
  writer: ClipboardWriter,
  text: string,
  statusTarget: ClipboardStatusTarget,
  messages: {
    readonly empty: string;
    readonly failure: string;
    readonly success: string;
  },
): Promise<void> {
  if (text.trim().length === 0) {
    reportClipboardStatus(statusTarget, messages.empty, "error");
    return;
  }

  try {
    await writer.clipboard.writeText(text);
    reportClipboardStatus(statusTarget, messages.success, "copied");
  } catch {
    reportClipboardStatus(statusTarget, messages.failure, "error");
  }
}

/**
 * Reports clipboard status to the nearest owning root.
 *
 * @param target Button, selectors, and dataset key for status reporting.
 * @param message User-visible status message.
 * @param state Machine-readable copy state.
 */
export function reportClipboardStatus(
  target: ClipboardStatusTarget,
  message: string,
  state: ClipboardCopyState,
): void {
  const root = target.button.closest(target.rootSelector);
  const status = root?.querySelector(target.statusSelector);

  if (status !== undefined && status !== null) {
    status.textContent = message;
  }

  target.button.dataset[target.stateDatasetKey] = state;
}
