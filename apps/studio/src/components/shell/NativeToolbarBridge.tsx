import type { ReactElement } from "react";

import { studioShortcutCommandIds } from "../../commands/keyboard-shortcuts";

interface NativeToolbarBridgeProps {
  operationId: string;
}

/**
 * Invisible placeholder for future Tauri native menu and toolbar integration.
 *
 * @returns A hidden bridge element with stable command metadata.
 */
export function NativeToolbarBridge({
  operationId,
}: NativeToolbarBridgeProps): ReactElement {
  return (
    <div
      aria-hidden="true"
      data-operation-id={operationId}
      data-studio-native-command-ids={studioShortcutCommandIds().join(" ")}
      data-studio-native-toolbar-placeholder=""
      hidden
    />
  );
}
