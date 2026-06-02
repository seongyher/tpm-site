import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  PanelRightOpen,
  Pencil,
  X,
} from "lucide-react";
import {
  type Dispatch,
  type KeyboardEvent,
  type ReactElement,
  type SetStateAction,
  useEffect,
  useState,
} from "react";

import {
  studioCommandById,
  type StudioCommandId,
} from "../commands/studio-commands";
import { EditorStatusStrip } from "../components/editor/EditorStatusStrip";
import { MarkdownEditorPanel } from "../components/editor/MarkdownEditorPanel";
import {
  DescriptorForm,
  type DraftFieldValues,
} from "../components/forms/DescriptorForm";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Panel } from "../components/ui/Panel";
import { Tooltip } from "../components/ui/Tooltip";
import { cn } from "../lib/cn";
import {
  articleEditorViewModel,
  type DiagnosticFixture,
  type FieldSectionFixture,
  type StudioMvpFixture,
} from "../models/studio-fixtures";
import type {
  StudioAppState,
  StudioCommandPayload,
  StudioEditorTitleState,
} from "../state/studio-state";

interface ArticleEditorScreenProps {
  fixture: StudioMvpFixture;
  onCommand: (
    commandId: StudioCommandId,
    payload?: StudioCommandPayload,
  ) => void;
  state: StudioAppState;
}

/**
 * Primary source-faithful article editor surface.
 *
 * @returns Metadata form, source editor, status strip, and editor diagnostics.
 */
export function ArticleEditorScreen({
  fixture,
  onCommand,
  state,
}: ArticleEditorScreenProps): ReactElement {
  const viewModel = articleEditorViewModel(fixture, state.activeArticleId);
  const [draftValues, setDraftValues] = useState<DraftFieldValues>(
    () => new Map(),
  );

  useEffect(() => {
    setDraftValues(new Map());
  }, [viewModel?.article.id]);

  if (viewModel === undefined) {
    return <MissingArticleEditor onCommand={onCommand} />;
  }

  const { article } = viewModel;
  const source = state.editorDraftSource ?? article.body.source;
  const workingState = state.activeArticleState ?? article.workingCopyState;
  const lastCommandLabel = commandLabel(state.editor?.lastCommandId);
  const titleDiagnostic = viewModel.fieldDiagnostics.find(
    (fieldDiagnostic) => fieldDiagnostic.field.id === "title",
  )?.diagnostic;
  const titleInvalid =
    titleDiagnostic !== undefined || state.editorTitle?.status === "invalid";
  const propertySections = articlePropertySections(article.frontmatter);

  return (
    <main className="min-h-full overflow-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-5 md:p-6">
        <ArticleEditorHeader
          articleTitle={article.title}
          onCommand={onCommand}
          route={article.route}
          titleDiagnostic={titleDiagnostic}
          titleState={state.editorTitle}
          workingState={workingState}
        />
        <EditorDiagnostics
          bodyDiagnostic={viewModel.bodyDiagnostic}
          fieldCount={
            viewModel.fieldDiagnostics.filter(
              (fieldDiagnostic) => fieldDiagnostic.field.id !== "title",
            ).length
          }
          invalid={workingState === "invalid" && !titleInvalid}
        />
        {state.previewPane.visibility === "hidden" ? (
          <PreviewCollapsedNotice onCommand={onCommand} />
        ) : null}
        <ArticlePropertiesPanel
          diagnostics={fixture.diagnostics}
          draftValues={draftValues}
          mediaItems={fixture.media.items}
          onCommand={onCommand}
          sections={propertySections}
          setDraftValues={setDraftValues}
          state={state}
        />
        <div className="flex min-h-[32rem] flex-col gap-2">
          <MarkdownEditorPanel
            editor={state.editor}
            format={article.body.format}
            onCommand={onCommand}
            onSourceChange={(payload) =>
              onCommand("editor.updateSource", payload)
            }
            source={source}
            state={state}
          />
          <EditorStatusStrip
            format={article.body.format}
            lastCommandLabel={lastCommandLabel}
            readTimeLabel={article.body.readTimeLabel}
            state={workingState}
            wordCountLabel={article.body.wordCountLabel}
          />
        </div>
      </div>
    </main>
  );
}

function ArticleEditorHeader({
  articleTitle,
  onCommand,
  route,
  titleDiagnostic,
  titleState,
  workingState,
}: {
  articleTitle: string;
  onCommand: ArticleEditorScreenProps["onCommand"];
  route: string;
  titleDiagnostic: DiagnosticFixture | undefined;
  titleState: StudioEditorTitleState | undefined;
  workingState: "autosaving" | "clean" | "dirty" | "invalid" | "saved";
}): ReactElement {
  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <EditableArticleTitle
        articleTitle={articleTitle}
        onCommand={onCommand}
        route={route}
        titleDiagnostic={titleDiagnostic}
        titleState={titleState}
      />
      <WorkingStateBadge state={workingState} />
    </header>
  );
}

function EditableArticleTitle({
  articleTitle,
  onCommand,
  route,
  titleDiagnostic,
  titleState,
}: {
  articleTitle: string;
  onCommand: ArticleEditorScreenProps["onCommand"];
  route: string;
  titleDiagnostic: DiagnosticFixture | undefined;
  titleState: StudioEditorTitleState | undefined;
}): ReactElement {
  const editing = titleState?.mode === "editing";
  const titleDraft = titleState?.draft ?? articleTitle;
  const invalid = titleState?.status === "invalid";
  const message =
    titleDiagnostic?.message ?? "Add a title before publishing this article.";

  if (editing) {
    return (
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start gap-2">
          <label className="min-w-0 flex-1" htmlFor="studio-article-title">
            <span className="sr-only">Article title</span>
            <input
              aria-describedby={
                invalid ? "studio-article-title-error" : undefined
              }
              aria-invalid={invalid}
              autoFocus
              className={cn(
                "text-foreground placeholder:text-muted-foreground focus-visible:outline-accent w-full bg-transparent text-3xl leading-tight font-semibold outline-none focus-visible:outline-2",
                invalid && "text-danger focus-visible:outline-danger",
              )}
              id="studio-article-title"
              onChange={(event) =>
                onCommand("editor.title.update", {
                  titleDraft: event.currentTarget.value,
                })
              }
              onKeyDown={(event) => onTitleInputKeyDown(event, onCommand)}
              placeholder="Untitled article"
              value={titleDraft}
            />
          </label>
          <Tooltip content="Apply title">
            <IconButton
              disabled={invalid}
              label="Apply title"
              onClick={() => onCommand("editor.title.commit")}
              variant="ghost"
            >
              <Check aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip content="Cancel title edit">
            <IconButton
              label="Cancel title edit"
              onClick={() => onCommand("editor.title.cancel")}
              variant="ghost"
            >
              <X aria-hidden="true" />
            </IconButton>
          </Tooltip>
        </div>
        {invalid ? (
          <p
            className="text-danger mt-2 flex items-center gap-2 text-sm"
            id="studio-article-title-error"
          >
            <AlertTriangle aria-hidden="true" />
            {message}
          </p>
        ) : null}
        <p className="text-muted-foreground mt-2 truncate text-sm">{route}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1">
      <div className="group flex min-w-0 items-center gap-2">
        <h1 className="text-foreground min-w-0 truncate text-3xl leading-tight font-semibold">
          {titleDraft}
        </h1>
        <Tooltip content="Edit title">
          <IconButton
            className="opacity-70 group-focus-within:opacity-100 group-hover:opacity-100"
            label="Edit article title"
            onClick={() => onCommand("editor.title.beginEdit")}
            variant="ghost"
          >
            <Pencil aria-hidden="true" />
          </IconButton>
        </Tooltip>
      </div>
      <p className="text-muted-foreground mt-2 truncate text-sm">{route}</p>
    </div>
  );
}

function onTitleInputKeyDown(
  event: KeyboardEvent<HTMLInputElement>,
  onCommand: ArticleEditorScreenProps["onCommand"],
): void {
  if (event.key === "Enter") {
    event.preventDefault();
    onCommand("editor.title.commit");
  }

  if (event.key === "Escape") {
    event.preventDefault();
    onCommand("editor.title.cancel");
  }
}

function ArticlePropertiesPanel({
  diagnostics,
  draftValues,
  mediaItems,
  onCommand,
  sections,
  setDraftValues,
  state,
}: {
  diagnostics: readonly DiagnosticFixture[];
  draftValues: DraftFieldValues;
  mediaItems: StudioMvpFixture["media"]["items"];
  onCommand: ArticleEditorScreenProps["onCommand"];
  sections: readonly FieldSectionFixture[];
  setDraftValues: Dispatch<SetStateAction<DraftFieldValues>>;
  state: StudioAppState;
}): ReactElement {
  const visible = state.editorProperties.visibility === "visible";

  return (
    <Panel className="p-0">
      <button
        aria-expanded={visible}
        className="focus-visible:outline-accent flex w-full items-center justify-between gap-3 rounded-[var(--radius-panel)] px-4 py-3 text-left focus-visible:outline-2"
        onClick={() => onCommand("editor.properties.toggle")}
        type="button"
      >
        <span className="text-foreground min-w-0 text-sm font-semibold">
          Properties
        </span>
        {visible ? (
          <ChevronDown aria-hidden="true" className="text-muted-foreground" />
        ) : (
          <ChevronRight aria-hidden="true" className="text-muted-foreground" />
        )}
      </button>
      {visible ? (
        <div className="border-border border-t p-4">
          <DescriptorForm
            diagnostics={diagnostics}
            draftValues={draftValues}
            mediaItems={mediaItems}
            sections={sections}
            setDraftValues={setDraftValues}
            showSectionHeadings={false}
          />
        </div>
      ) : null}
    </Panel>
  );
}

function articlePropertySections(
  sections: readonly FieldSectionFixture[],
): readonly FieldSectionFixture[] {
  return sections
    .map((section) => ({
      ...section,
      fields: section.fields.filter((field) => field.id !== "title"),
    }))
    .filter((section) => section.fields.length > 0);
}

function EditorDiagnostics({
  bodyDiagnostic,
  fieldCount,
  invalid,
}: {
  bodyDiagnostic: DiagnosticFixture | undefined;
  fieldCount: number;
  invalid: boolean;
}): null | ReactElement {
  if (!invalid && bodyDiagnostic === undefined && fieldCount === 0) {
    return null;
  }

  return (
    <Panel className="border-warning bg-warning-muted p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle
          aria-hidden="true"
          className={invalid ? "text-danger mt-0.5" : "text-warning mt-0.5"}
        />
        <div className="min-w-0">
          <h2 className="text-foreground text-sm font-semibold">
            {invalid ? "This article has errors" : "Editor notice"}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {bodyDiagnostic?.message ??
              "Fix highlighted article fields before saving, previewing, or publishing."}
          </p>
          {bodyDiagnostic?.remediation === undefined ? null : (
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              {bodyDiagnostic.remediation}
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
}

function MissingArticleEditor({
  onCommand,
}: Pick<ArticleEditorScreenProps, "onCommand">): ReactElement {
  return (
    <main className="min-h-full overflow-auto p-6">
      <Panel className="mx-auto max-w-xl p-8 text-center">
        <FileText
          aria-hidden="true"
          className="text-muted-foreground mx-auto size-10"
        />
        <h1 className="text-foreground mt-4 text-xl font-semibold">
          Choose an article
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Open the article directory and choose an article before editing.
        </p>
        <Button
          className="mt-5"
          onClick={() => onCommand("article.directory.open")}
          variant="primary"
        >
          Open articles
        </Button>
      </Panel>
    </main>
  );
}

function PreviewCollapsedNotice({
  onCommand,
}: Pick<ArticleEditorScreenProps, "onCommand">): ReactElement {
  return (
    <Panel className="bg-panel-muted p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-foreground text-sm font-semibold">
          Preview hidden
        </h2>
        <Button onClick={() => onCommand("pane.togglePreview")}>
          <PanelRightOpen aria-hidden="true" />
          Open preview
        </Button>
      </div>
    </Panel>
  );
}

function WorkingStateBadge({
  state,
}: {
  state: "autosaving" | "clean" | "dirty" | "invalid" | "saved";
}): ReactElement {
  switch (state) {
    case "autosaving":
      return <Badge tone="warning">Autosaving</Badge>;
    case "clean":
      return <Badge tone="success">All changes saved</Badge>;
    case "dirty":
      return <Badge tone="warning">Unsaved changes</Badge>;
    case "invalid":
      return <Badge tone="danger">Needs attention</Badge>;
    case "saved":
      return <Badge tone="success">Draft saved</Badge>;
  }
}

function commandLabel(commandId: string | undefined): string | undefined {
  if (commandId === undefined) {
    return undefined;
  }

  return studioCommandById(commandId)?.label ?? commandId;
}
