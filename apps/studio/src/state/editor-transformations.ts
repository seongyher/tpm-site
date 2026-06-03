import type { StudioCommandId } from "../commands/studio-commands";
import type { EditorSessionStateFixture } from "../models/studio-fixtures";

/** Source-editing commands that transform a Markdown/MDX text buffer. */
export type EditorTextCommandId = Extract<
  StudioCommandId,
  | "format.blockquote"
  | "format.bold"
  | "format.bulletedList"
  | "format.code"
  | "format.codeBlock"
  | "format.italic"
  | "format.numberedList"
  | "insert.footnote"
  | "insert.heading"
  | "insert.link"
>;

/**
 * Checks whether a Studio command is a pure source editor command.
 *
 * @param commandId Studio command ID to inspect.
 * @returns Whether the command maps to a source transformation.
 */
export function isEditorTextCommandId(
  commandId: StudioCommandId,
): commandId is EditorTextCommandId {
  switch (commandId) {
    case "article.create":
    case "article.directory.open":
    case "article.directory.resetFilters":
    case "article.directory.setCategory":
    case "article.directory.setSearch":
    case "article.directory.setStatusFilter":
    case "article.directory.setTag":
    case "article.open":
    case "article.restoreVersion":
    case "article.saveDraft":
    case "articleTree.toggleFolder":
    case "commandPalette.close":
    case "commandPalette.open":
    case "editor.properties.toggle":
    case "editor.title.beginEdit":
    case "editor.title.cancel":
    case "editor.title.commit":
    case "editor.title.update":
    case "editor.updateSource":
      return false;
    case "format.blockquote":
    case "format.bold":
    case "format.bulletedList":
    case "format.code":
    case "format.codeBlock":
    case "format.italic":
    case "format.numberedList":
    case "insert.footnote":
    case "insert.heading":
      return true;
    case "insert.image":
      return false;
    case "insert.link":
      return true;
    case "media.insertSelected":
    case "media.open":
    case "media.setSearch":
    case "media.setViewMode":
    case "pane.togglePreview":
    case "pane.toggleSidebar":
    case "preview.open":
    case "preview.openExternal":
    case "preview.setViewport":
    case "project.createSite":
    case "project.openHome":
    case "project.openSite":
    case "project.showRecent":
    case "publish.cancel":
    case "publish.closeConfirm":
    case "publish.confirm":
    case "publish.done":
    case "publish.finish":
    case "publish.openConfirm":
    case "publish.prepare":
    case "publish.retry":
    case "recovery.locateProject":
    case "recovery.removeRecent":
    case "restore.cancel":
    case "restore.confirm":
    case "restore.selectCheckpoint":
    case "settings.open":
      return false;
  }
}

/** Result of a pure source-editor command transformation. */
export interface EditorTransformationResult {
  /** Updated context-menu target after the command. */
  readonly contextTarget: EditorSessionStateFixture["contextTarget"];
  /** Cursor offset after replacing the source range. */
  readonly cursorOffset: number;
  /** Optional selected range after the command. */
  readonly selection?: EditorSessionStateFixture["selection"];
  /** Updated source buffer. */
  readonly source: string;
}

/**
 * Applies a source-faithful editor command to a Markdown/MDX text buffer.
 *
 * @param source Source text before the command.
 * @param commandId Editor command to apply.
 * @param editor Cursor, selection, and context metadata.
 * @returns Updated source text and editor cursor metadata.
 */
export function applyEditorTextCommand(
  source: string,
  commandId: EditorTextCommandId,
  editor: EditorSessionStateFixture | undefined,
): EditorTransformationResult {
  const range = selectedRange(source, editor);

  switch (commandId) {
    case "format.blockquote":
      return replaceRange(
        source,
        range,
        prefixedLines(selectedText(source, range), "> ", "Quote"),
      );
    case "format.bold":
      return wrappedInline(source, range, "**", "bold text");
    case "format.bulletedList":
      return replaceRange(
        source,
        range,
        prefixedLines(selectedText(source, range), "- ", "List item"),
      );
    case "format.code":
      return wrappedInline(source, range, "`", "code");
    case "format.codeBlock":
      return replaceRange(
        source,
        range,
        fencedBlock(selectedText(source, range)),
      );
    case "format.italic":
      return wrappedInline(source, range, "*", "italic text");
    case "format.numberedList":
      return replaceRange(
        source,
        range,
        numberedLines(selectedText(source, range)),
      );
    case "insert.footnote":
      return replaceRange(source, range, footnote(selectedText(source, range)));
    case "insert.heading":
      return replaceRange(
        source,
        lineStartRange(source, range),
        heading(selectedText(source, range)),
      );
    case "insert.link":
      return replaceRange(source, range, link(selectedText(source, range)));
  }
}

function fencedBlock(text: string): string {
  return text.trim().length === 0
    ? "```\ncode block\n```"
    : `\`\`\`\n${text.trim()}\n\`\`\``;
}

function footnote(text: string): string {
  const noteText = text.trim().length === 0 ? "Footnote text" : text.trim();

  return `[^1]\n\n[^1]: ${noteText}`;
}

function heading(text: string): string {
  const headingText = text.trim().length === 0 ? "Heading" : text.trim();

  return `## ${headingText}`;
}

function lineStartRange(source: string, range: TextRange): TextRange {
  const before = source.slice(0, range.from);
  const lineStart = before.lastIndexOf("\n") + 1;

  return { from: lineStart, to: range.to };
}

function link(text: string): string {
  const linkText = text.trim().length === 0 ? "link text" : text.trim();

  return `[${linkText}](https://example.com)`;
}

function numberedLines(text: string): string {
  const normalizedText = text.trim().length === 0 ? "List item" : text;

  return normalizedText
    .split("\n")
    .map((line, index) => `${index + 1}. ${line.replace(/^\d+\.\s*/, "")}`)
    .join("\n");
}

function prefixedLines(
  text: string,
  prefix: string,
  fallbackText: string,
): string {
  const normalizedText = text.trim().length === 0 ? fallbackText : text;

  return normalizedText
    .split("\n")
    .map((line) => `${prefix}${line.replace(/^[-*>]\s*/, "")}`)
    .join("\n");
}

function replaceRange(
  source: string,
  range: TextRange,
  replacement: string,
): EditorTransformationResult {
  const nextSource = `${source.slice(0, range.from)}${replacement}${source.slice(
    range.to,
  )}`;
  const cursorOffset = range.from + replacement.length;

  return {
    contextTarget: "cursor",
    cursorOffset,
    source: nextSource,
  };
}

function selectedRange(
  source: string,
  editor: EditorSessionStateFixture | undefined,
): TextRange {
  const cursorOffset = clampedOffset(source, editor?.cursorOffset ?? 0);
  const selection = editor?.selection;

  if (selection === undefined || selection.from === selection.to) {
    return { from: cursorOffset, to: cursorOffset };
  }

  return {
    from: clampedOffset(source, Math.min(selection.from, selection.to)),
    to: clampedOffset(source, Math.max(selection.from, selection.to)),
  };
}

function selectedText(source: string, range: TextRange): string {
  return source.slice(range.from, range.to);
}

function wrappedInline(
  source: string,
  range: TextRange,
  marker: string,
  fallbackText: string,
): EditorTransformationResult {
  const text = selectedText(source, range);
  const innerText = text.length === 0 ? fallbackText : text;

  return replaceRange(source, range, `${marker}${innerText}${marker}`);
}

function clampedOffset(source: string, offset: number): number {
  return Math.min(Math.max(offset, 0), source.length);
}

interface TextRange {
  readonly from: number;
  readonly to: number;
}
