import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import type { ReactElement } from "react";

import type { StudioCommandId } from "../commands/studio-commands";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Panel } from "../components/ui/Panel";
import { cn } from "../lib/cn";
import {
  type CheckpointFixture,
  type RestoreViewModel,
  restoreViewModel,
  type StudioMvpFixture,
} from "../models/studio-fixtures";
import type {
  StudioAppState,
  StudioCommandPayload,
} from "../state/studio-state";

interface RestoreScreenProps {
  fixture: StudioMvpFixture;
  onCommand: (
    commandId: StudioCommandId,
    payload?: StudioCommandPayload,
  ) => void;
  state: StudioAppState;
}

/**
 * Fixture-backed checkpoint restore surface.
 *
 * @returns Safe restore list, selected checkpoint detail, and confirmation states.
 */
export function RestoreScreen({
  fixture,
  onCommand,
  state,
}: RestoreScreenProps): ReactElement {
  const viewModel = restoreViewModel(fixture, state);

  if (viewModel === undefined) {
    return <MissingRestoreScreen onCommand={onCommand} />;
  }

  return (
    <main
      className="min-h-full overflow-auto p-5 md:p-6"
      data-testid="restore-screen"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <RestoreHeader viewModel={viewModel} />
        {viewModel.restore.status === "unavailable" ? (
          <RestoreUnavailable onCommand={onCommand} viewModel={viewModel} />
        ) : (
          <div className="grid min-w-0 gap-5 xl:grid-cols-[20rem_minmax(0,1fr)]">
            <CheckpointList onCommand={onCommand} viewModel={viewModel} />
            <RestoreDetail onCommand={onCommand} viewModel={viewModel} />
          </div>
        )}
      </div>
    </main>
  );
}

function RestoreHeader({
  viewModel,
}: {
  viewModel: RestoreViewModel;
}): ReactElement {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-semibold uppercase">
          Version recovery
        </p>
        <h1 className="text-foreground mt-2 text-2xl font-semibold">
          Restore version
        </h1>
        <p className="text-muted-foreground mt-2 truncate text-sm">
          {viewModel.article.title}
        </p>
        <p className="text-muted-foreground mt-1 truncate text-xs">
          {viewModel.article.sourceRef.path}
        </p>
      </div>
      <RestoreStatusBadge status={viewModel.restore.status} />
    </header>
  );
}

function CheckpointList({
  onCommand,
  viewModel,
}: {
  onCommand: RestoreScreenProps["onCommand"];
  viewModel: RestoreViewModel;
}): ReactElement {
  return (
    <Panel as="aside" className="min-w-0 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-foreground text-sm font-semibold">Checkpoints</h2>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            Choose a saved version to inspect before restoring.
          </p>
        </div>
        <Badge tone="neutral">{viewModel.historyProvider.label}</Badge>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {viewModel.checkpoints.map((checkpoint) => (
          <li key={checkpoint.id}>
            <CheckpointButton
              checkpoint={checkpoint}
              onCommand={onCommand}
              selected={checkpoint.id === viewModel.selectedCheckpoint?.id}
            />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function CheckpointButton({
  checkpoint,
  onCommand,
  selected,
}: {
  checkpoint: CheckpointFixture;
  onCommand: RestoreScreenProps["onCommand"];
  selected: boolean;
}): ReactElement {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        "focus-visible:outline-accent flex w-full min-w-0 items-start gap-3 rounded-[var(--radius-control)] border px-3 py-3 text-left text-sm transition-colors focus-visible:outline-2",
        selected
          ? "border-accent bg-accent-muted text-accent-foreground"
          : "border-border bg-panel hover:bg-panel-muted",
      )}
      onClick={() =>
        onCommand("restore.selectCheckpoint", {
          restoreScenarioId: restoreScenarioForCheckpoint(checkpoint.id),
        })
      }
      type="button"
    >
      <Clock3 aria-hidden="true" className="mt-0.5 shrink-0" />
      <span className="min-w-0">
        <span className="text-foreground block font-medium">
          {checkpoint.label}
        </span>
        <span className="text-muted-foreground mt-1 block text-xs">
          {checkpoint.createdLabel}
        </span>
      </span>
    </button>
  );
}

function RestoreDetail({
  onCommand,
  viewModel,
}: {
  onCommand: RestoreScreenProps["onCommand"];
  viewModel: RestoreViewModel;
}): ReactElement {
  const checkpoint = viewModel.selectedCheckpoint;

  return (
    <Panel className="min-w-0 p-5 md:p-6">
      {checkpoint === undefined ? (
        <EmptyCheckpointDetail />
      ) : (
        <div className="flex flex-col gap-5">
          <SelectedCheckpointSummary checkpoint={checkpoint} />
          <SourceDiffPlaceholder checkpoint={checkpoint} />
          <RestoreActionArea onCommand={onCommand} viewModel={viewModel} />
        </div>
      )}
    </Panel>
  );
}

function SelectedCheckpointSummary({
  checkpoint,
}: {
  checkpoint: CheckpointFixture;
}): ReactElement {
  return (
    <section>
      <p className="text-muted-foreground text-xs font-semibold uppercase">
        Selected checkpoint
      </p>
      <h2 className="text-foreground mt-2 text-xl font-semibold">
        {checkpoint.label}
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Saved {checkpoint.createdLabel.toLowerCase()}.
      </p>
      <p className="text-muted-foreground mt-1 truncate text-xs">
        {checkpoint.sourceRef.path}
      </p>
    </section>
  );
}

function SourceDiffPlaceholder({
  checkpoint,
}: {
  checkpoint: CheckpointFixture;
}): ReactElement {
  return (
    <Panel className="bg-panel-muted p-4">
      <div className="flex items-start gap-3">
        <FileText aria-hidden="true" className="text-muted-foreground mt-0.5" />
        <div className="min-w-0">
          <h3 className="text-foreground text-sm font-semibold">
            Source preview
          </h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            This checkpoint would restore the article source to{" "}
            {checkpoint.label}. The fixture shows the restore plan without
            changing files.
          </p>
          <ul className="text-muted-foreground mt-3 flex list-disc flex-col gap-1 pl-5 text-sm">
            <li>Current draft remains unchanged until you confirm.</li>
            <li>A history adapter will provide the real source diff later.</li>
            <li>No filesystem or provider writes happen in this prototype.</li>
          </ul>
        </div>
      </div>
    </Panel>
  );
}

function RestoreActionArea({
  onCommand,
  viewModel,
}: {
  onCommand: RestoreScreenProps["onCommand"];
  viewModel: RestoreViewModel;
}): ReactElement {
  switch (viewModel.restore.status) {
    case "confirm-open":
      return (
        <RestoreConfirmation onCommand={onCommand} viewModel={viewModel} />
      );
    case "ready":
      return (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button onClick={() => onCommand("restore.cancel")}>Cancel</Button>
          <Button
            onClick={() => onCommand("restore.confirm")}
            variant="primary"
          >
            <RotateCcw aria-hidden="true" />
            Review restore
          </Button>
        </div>
      );
    case "restored":
      return <RestoreComplete onCommand={onCommand} />;
    case "unavailable":
      return <RestoreUnavailable onCommand={onCommand} viewModel={viewModel} />;
  }
}

function RestoreConfirmation({
  onCommand,
  viewModel,
}: {
  onCommand: RestoreScreenProps["onCommand"];
  viewModel: RestoreViewModel;
}): ReactElement {
  return (
    <Panel className="border-warning bg-warning-muted p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck aria-hidden="true" className="text-warning mt-0.5" />
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-sm font-semibold">
            Confirm restore
          </h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Studio will restore this article to{" "}
            {viewModel.selectedCheckpoint?.label ?? "the selected checkpoint"}.
            This fixture simulates the source write and keeps the real files
            unchanged.
          </p>
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <Button onClick={() => onCommand("restore.cancel")}>Cancel</Button>
            <Button
              onClick={() => onCommand("restore.confirm")}
              variant="primary"
            >
              Restore
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RestoreComplete({
  onCommand,
}: {
  onCommand: RestoreScreenProps["onCommand"];
}): ReactElement {
  return (
    <Panel className="border-success bg-success-muted p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 aria-hidden="true" className="text-success mt-0.5" />
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-sm font-semibold">
            Version restored
          </h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            The prototype completed the restore flow without changing source
            files. Real history writes will go through the history adapter.
          </p>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => onCommand("restore.cancel")}>
              Back to editor
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RestoreUnavailable({
  onCommand,
  viewModel,
}: {
  onCommand: RestoreScreenProps["onCommand"];
  viewModel: RestoreViewModel;
}): ReactElement {
  const diagnostic = viewModel.diagnostics[0];

  return (
    <Panel className="border-warning bg-warning-muted p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden="true" className="text-warning mt-0.5" />
        <div className="min-w-0 flex-1">
          <h2 className="text-foreground text-base font-semibold">
            Checkpoint history is unavailable
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            {diagnostic?.message ??
              "Studio cannot list or restore checkpoints for this project."}
          </p>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {diagnostic?.remediation ??
              "Connect a history provider before restoring an older version."}
          </p>
          <Badge className="mt-4" tone="warning">
            {viewModel.historyProvider.status.replaceAll("-", " ")}
          </Badge>
          <div className="mt-5 flex justify-end">
            <Button onClick={() => onCommand("restore.cancel")}>
              Back to editor
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function EmptyCheckpointDetail(): ReactElement {
  return (
    <div className="text-muted-foreground flex min-h-72 items-center justify-center text-sm">
      Choose a checkpoint to inspect it.
    </div>
  );
}

function MissingRestoreScreen({
  onCommand,
}: Pick<RestoreScreenProps, "onCommand">): ReactElement {
  return (
    <main className="min-h-full overflow-auto p-6">
      <Panel className="mx-auto max-w-xl p-8 text-center">
        <AlertTriangle
          aria-hidden="true"
          className="text-warning mx-auto size-10"
        />
        <h1 className="text-foreground mt-4 text-xl font-semibold">
          Restore is unavailable
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Open an article with checkpoint history before restoring.
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

function RestoreStatusBadge({
  status,
}: {
  status: RestoreViewModel["restore"]["status"];
}): ReactElement {
  switch (status) {
    case "confirm-open":
      return <Badge tone="warning">Confirm restore</Badge>;
    case "ready":
      return <Badge tone="neutral">Ready</Badge>;
    case "restored":
      return <Badge tone="success">Restored</Badge>;
    case "unavailable":
      return <Badge tone="warning">History unavailable</Badge>;
  }
}

function restoreScenarioForCheckpoint(checkpointId: string): string {
  return checkpointId === "checkpoint-writing-desk-draft"
    ? "restore-draft-selected"
    : "restore-ready";
}
