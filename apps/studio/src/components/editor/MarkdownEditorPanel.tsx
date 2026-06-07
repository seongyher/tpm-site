import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView, type ViewUpdate } from "@codemirror/view";
import * as ContextMenu from "@radix-ui/react-context-menu";
import CodeMirror from "@uiw/react-codemirror";
import {
  Bold,
  Code2,
  Heading2,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
} from "lucide-react";
import {
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useMemo,
} from "react";

import {
  studioCommandById,
  type StudioCommandId,
} from "../../commands/studio-commands";
import type { EditorSessionStateFixture } from "../../models/studio-fixtures";
import type {
  StudioAppState,
  StudioCommandPayload,
} from "../../state/studio-state";
import { CommandContextMenuItems } from "../commands/CommandContextMenuItems";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { Tooltip } from "../ui/Tooltip";

interface MarkdownEditorPanelProps {
  editor: EditorSessionStateFixture | undefined;
  format: "markdown" | "mdx";
  onCommand: (commandId: StudioCommandId) => void;
  onSourceChange: (payload: StudioCommandPayload) => void;
  source: string;
  state: StudioAppState;
}

interface EditorCommandButton {
  icon: ReactNode;
  id: StudioCommandId;
}

const boldCommand: EditorCommandButton = {
  icon: <Bold aria-hidden="true" />,
  id: "format.bold",
};

const italicCommand: EditorCommandButton = {
  icon: <Italic aria-hidden="true" />,
  id: "format.italic",
};

const linkCommand: EditorCommandButton = {
  icon: <Link aria-hidden="true" />,
  id: "insert.link",
};

const headingCommand: EditorCommandButton = {
  icon: <Heading2 aria-hidden="true" />,
  id: "insert.heading",
};

const quoteCommand: EditorCommandButton = {
  icon: <Quote aria-hidden="true" />,
  id: "format.blockquote",
};

const inlineCodeCommand: EditorCommandButton = {
  icon: <Code2 aria-hidden="true" />,
  id: "format.code",
};

const bulletedListCommand: EditorCommandButton = {
  icon: <List aria-hidden="true" />,
  id: "format.bulletedList",
};

const numberedListCommand: EditorCommandButton = {
  icon: <ListOrdered aria-hidden="true" />,
  id: "format.numberedList",
};

const insertImageCommand: EditorCommandButton = {
  icon: <Image aria-hidden="true" />,
  id: "insert.image",
};

const primaryEditorCommands = [
  boldCommand,
  italicCommand,
  linkCommand,
  headingCommand,
  quoteCommand,
  inlineCodeCommand,
  bulletedListCommand,
  numberedListCommand,
  insertImageCommand,
] as const satisfies readonly EditorCommandButton[];

/**
 * Source-faithful Markdown/MDX editor panel backed by CodeMirror.
 *
 * @returns Editor toolbar, CodeMirror surface, context menu, and command hints.
 */
export function MarkdownEditorPanel({
  editor,
  format,
  onCommand,
  onSourceChange,
  source,
  state,
}: MarkdownEditorPanelProps): ReactElement {
  const sourceLabel = `${format.toUpperCase()} source`;
  const extensions = useMemo(
    () => [
      markdown({ codeLanguages: languages }),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({
        "aria-label": sourceLabel,
      }),
      EditorView.theme({
        "&": {
          backgroundColor: "transparent",
          fontSize: "0.8125rem",
        },
        ".cm-content": {
          fontFamily: "var(--font-mono)",
          minHeight: "24rem",
          padding: "0",
        },
        ".cm-gutters": {
          backgroundColor: "transparent",
          borderRightColor: "transparent",
        },
        ".cm-scroller": {
          fontFamily: "var(--font-mono)",
        },
      }),
    ],
    [sourceLabel],
  );

  return (
    <section
      aria-label={`${format.toUpperCase()} source editor`}
      className="flex min-h-0 flex-col"
      data-testid="markdown-editor-shell"
    >
      <MarkdownEditorToolbar onCommand={onCommand} />
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          <div
            aria-label={`${format.toUpperCase()} editor context menu area`}
            className="min-h-0 flex-1"
            data-testid="markdown-editor"
            onKeyDown={openContextMenuFromKeyboard}
            role="group"
            tabIndex={0}
          >
            <CodeMirror
              basicSetup={{
                bracketMatching: true,
                foldGutter: false,
                highlightActiveLine: false,
                highlightActiveLineGutter: false,
                lineNumbers: false,
              }}
              className="studio-codemirror h-full"
              extensions={extensions}
              onChange={(value, viewUpdate) =>
                onSourceChange(sourcePayload(value, viewUpdate))
              }
              value={source}
            />
          </div>
        </ContextMenu.Trigger>
        <EditorContextMenu
          editor={editor}
          onCommand={onCommand}
          state={state}
        />
      </ContextMenu.Root>
    </section>
  );
}

function openContextMenuFromKeyboard(
  event: KeyboardEvent<HTMLDivElement>,
): void {
  if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) {
    return;
  }

  event.preventDefault();

  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();

  target.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + 16,
      clientY: rect.top + 16,
    }),
  );
}

function EditorContextMenu({
  editor,
  onCommand,
  state,
}: {
  editor: EditorSessionStateFixture | undefined;
  onCommand: MarkdownEditorPanelProps["onCommand"];
  state: StudioAppState;
}): ReactElement {
  const target = editor?.contextTarget ?? "cursor";
  const commandIds = contextMenuCommandIds(target);

  return (
    <ContextMenu.Portal>
      <ContextMenu.Content
        aria-label={contextMenuAccessibleLabel(target)}
        className="bg-panel border-border shadow-panel z-50 min-w-56 rounded-[var(--radius-panel)] border p-1"
      >
        <CommandContextMenuItems
          commandIds={commandIds}
          onCommand={onCommand}
          state={state}
        />
      </ContextMenu.Content>
    </ContextMenu.Portal>
  );
}

function MarkdownEditorToolbar({
  onCommand,
}: {
  onCommand: MarkdownEditorPanelProps["onCommand"];
}): ReactElement {
  return (
    <div className="border-border flex min-h-10 items-center gap-1 overflow-x-auto border-y py-1">
      {primaryEditorCommands.map((command) => {
        const record = studioCommandById(command.id);
        const label = record?.label ?? command.id;

        return (
          <Tooltip content={label} key={command.id} shortcut={record?.shortcut}>
            <IconButton
              label={label}
              onClick={() => onCommand(command.id)}
              variant="ghost"
            >
              {command.icon}
            </IconButton>
          </Tooltip>
        );
      })}
      <div className="bg-border mx-1 h-5 w-px shrink-0" />
      <Tooltip content="Insert footnote">
        <Button
          className="text-muted-foreground"
          onClick={() => onCommand("insert.footnote")}
          size="sm"
          variant="ghost"
        >
          <Pilcrow aria-hidden="true" />
          Footnote
        </Button>
      </Tooltip>
      <Tooltip content="Code block">
        <Button
          className="text-muted-foreground"
          onClick={() => onCommand("format.codeBlock")}
          size="sm"
          variant="ghost"
        >
          <Code2 aria-hidden="true" />
          Block
        </Button>
      </Tooltip>
    </div>
  );
}

function contextMenuCommandIds(
  target: EditorSessionStateFixture["contextTarget"],
): readonly StudioCommandId[] {
  switch (target) {
    case "cursor":
      return [
        "insert.image",
        "insert.heading",
        "format.bulletedList",
        "format.numberedList",
        "insert.footnote",
      ];
    case "image-markdown":
      return ["insert.image", "format.bold", "format.italic", "insert.link"];
    case "none":
      return ["insert.image"];
    case "selection":
      return primaryEditorCommands.map((command) => command.id);
  }
}

function contextMenuAccessibleLabel(
  target: EditorSessionStateFixture["contextTarget"],
): string {
  switch (target) {
    case "cursor":
      return "Cursor actions";
    case "image-markdown":
      return "Image actions";
    case "none":
      return "Editor actions";
    case "selection":
      return "Selection actions";
  }
}

function sourcePayload(
  sourceDraft: string,
  viewUpdate: ViewUpdate,
): StudioCommandPayload {
  const selection = viewUpdate.state.selection.main;
  const selected =
    selection.from === selection.to
      ? undefined
      : { from: selection.from, to: selection.to };

  return {
    cursorOffset: selection.head,
    ...(selected === undefined ? {} : { selection: selected }),
    sourceDraft,
  };
}
