import { AlertTriangle, FileText, PanelRightOpen } from "lucide-react";
import { type ReactElement, useEffect, useState } from "react";

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
import { Panel } from "../components/ui/Panel";
import {
  articleEditorViewModel,
  type DiagnosticFixture,
  type StudioMvpFixture,
} from "../models/studio-fixtures";
import type {
  StudioAppState,
  StudioCommandPayload,
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

  return (
    <main className="min-h-full overflow-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-5 md:p-6">
        <ArticleEditorHeader
          articleTitle={article.title}
          route={article.route}
          sourcePath={article.sourceRef.path}
          workingState={workingState}
        />
        <EditorDiagnostics
          bodyDiagnostic={viewModel.bodyDiagnostic}
          fieldCount={viewModel.fieldDiagnostics.length}
          invalid={workingState === "invalid"}
        />
        {state.previewPane.visibility === "collapsed" ? (
          <PreviewCollapsedNotice onCommand={onCommand} />
        ) : null}
        <Panel className="p-4 md:p-5">
          <DescriptorForm
            diagnostics={fixture.diagnostics}
            draftValues={draftValues}
            mediaItems={fixture.media.items}
            sections={article.frontmatter}
            setDraftValues={setDraftValues}
          />
        </Panel>
        <div className="flex min-h-[32rem] flex-col">
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
  route,
  sourcePath,
  workingState,
}: {
  articleTitle: string;
  route: string;
  sourcePath: string;
  workingState: "autosaving" | "clean" | "dirty" | "invalid" | "saved";
}): ReactElement {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-semibold uppercase">
          Article editor
        </p>
        <h1 className="text-foreground mt-2 truncate text-2xl font-semibold">
          {articleTitle}
        </h1>
        <p className="text-muted-foreground mt-2 truncate text-sm">{route}</p>
        <p className="text-muted-foreground mt-1 truncate text-xs">
          {sourcePath}
        </p>
      </div>
      <WorkingStateBadge state={workingState} />
    </header>
  );
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
        <div>
          <h2 className="text-foreground text-sm font-semibold">
            Focused writing mode
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            The preview pane is collapsed. Reopen it when you want to inspect
            the rendered route.
          </p>
        </div>
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
