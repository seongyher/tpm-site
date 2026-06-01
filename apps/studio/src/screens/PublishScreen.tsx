import * as Progress from "@radix-ui/react-progress";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  ExternalLink,
  FileText,
  RotateCcw,
  UploadCloud,
} from "lucide-react";
import type { ReactElement } from "react";

import type { StudioCommandId } from "../commands/studio-commands";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Panel } from "../components/ui/Panel";
import {
  type DiagnosticFixture,
  type PreviewPaneViewModel,
  type PublishViewModel,
  publishViewModel,
  type StudioMvpFixture,
} from "../models/studio-fixtures";
import type {
  StudioAppState,
  StudioCommandPayload,
} from "../state/studio-state";

interface PublishScreenProps {
  fixture: StudioMvpFixture;
  onCommand: (
    commandId: StudioCommandId,
    payload?: StudioCommandPayload,
  ) => void;
  state: StudioAppState;
}

/**
 * Fixture-backed publish preview and result flow.
 *
 * @returns Safe publish workflow screens over redacted fixture state.
 */
export function PublishScreen({
  fixture,
  onCommand,
  state,
}: PublishScreenProps): ReactElement {
  const publish = publishViewModel(fixture, state);

  if (publish === undefined) {
    return <PublishFallback onCommand={onCommand} />;
  }

  return (
    <main
      aria-labelledby="publish-screen-heading"
      className="bg-panel flex min-h-full flex-col overflow-hidden"
    >
      <PublishHeader onCommand={onCommand} publish={publish} />
      <div className="bg-panel-muted min-h-0 flex-1 overflow-auto">
        <PublishBody onCommand={onCommand} publish={publish} />
      </div>
    </main>
  );
}

function PublishBody({
  onCommand,
  publish,
}: {
  onCommand: PublishScreenProps["onCommand"];
  publish: PublishViewModel;
}): ReactElement {
  switch (publish.publish.status) {
    case "blocked":
      return <PublishBlocked onCommand={onCommand} publish={publish} />;
    case "confirm-open":
    case "preview-ready":
      return <PublishPreview publish={publish} />;
    case "failed":
      return <PublishFailed onCommand={onCommand} publish={publish} />;
    case "idle":
    case "preparing-preview":
      return <PublishPreparing onCommand={onCommand} publish={publish} />;
    case "published":
      return <PublishSuccess onCommand={onCommand} publish={publish} />;
    case "publishing":
      return <PublishProgress onCommand={onCommand} publish={publish} />;
  }
}

function PublishHeader({
  onCommand,
  publish,
}: {
  onCommand: PublishScreenProps["onCommand"];
  publish: PublishViewModel;
}): ReactElement {
  const warnings =
    publish.warningCount === 0
      ? "No warnings"
      : `${publish.warningCount} warning`;
  const canConfirm = publish.publish.status === "preview-ready";

  return (
    <header className="border-border flex min-h-14 items-center justify-between gap-3 border-b px-5">
      <div className="flex min-w-0 items-center gap-3">
        <p
          className="text-muted-foreground text-xs font-semibold uppercase"
          id="publish-screen-heading"
        >
          Publish preview
        </p>
        <Badge tone={publishStatusBadgeTone(publish)}>
          {publish.statusLabel}
        </Badge>
        <span className="text-muted-foreground truncate text-sm">
          {publish.preview.route}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
          <AlertTriangle
            aria-hidden="true"
            className={
              publish.warningCount === 0
                ? "text-subtle-foreground"
                : "text-warning"
            }
            size={16}
          />
          {warnings}
        </span>
        <Button onClick={() => onCommand("publish.cancel")}>Cancel</Button>
        <Button
          data-publish-confirm-trigger=""
          disabled={!canConfirm}
          onClick={() => onCommand("publish.openConfirm")}
          variant="primary"
        >
          Confirm publish
        </Button>
      </div>
    </header>
  );
}

function PublishPreview({
  publish,
}: {
  publish: PublishViewModel;
}): ReactElement {
  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <PublishPrototypeNotice />
      <div className="shadow-panel border-border bg-background overflow-hidden rounded-[var(--radius-panel)] border">
        <article className="mx-auto max-w-5xl px-10 py-10">
          <div className="border-border flex items-center justify-between gap-6 border-b pb-8">
            <h2 className="text-foreground font-serif text-3xl">
              Northwind Journal
            </h2>
            <nav
              aria-label="Preview site navigation"
              className="text-muted-foreground hidden items-center gap-8 text-sm md:flex"
            >
              <span>Articles</span>
              <span>Guides</span>
              <span>About</span>
              <span>Shop</span>
            </nav>
          </div>
          <RoutePreviewContent preview={publish.preview} />
        </article>
      </div>
    </div>
  );
}

function PublishPrototypeNotice(): ReactElement {
  return (
    <div className="border-border bg-panel text-muted-foreground mb-4 rounded-[var(--radius-control)] border px-4 py-3 text-sm">
      This fixture preview shows the publish plan and rendered route before any
      live provider mutation. No Cloudflare deploy runs from this prototype.
    </div>
  );
}

function RoutePreviewContent({
  preview,
}: {
  preview: PreviewPaneViewModel;
}): ReactElement {
  if (preview.article === undefined) {
    return (
      <section className="py-12">
        <p className="text-muted-foreground text-xs font-semibold uppercase">
          Home
        </p>
        <h1 className="text-foreground mt-4 max-w-3xl text-5xl font-semibold tracking-normal">
          Thoughtful guides for a well-crafted life
        </h1>
        <p className="text-muted-foreground mt-5 max-w-2xl text-lg leading-8">
          This home-page fixture is used when publishing from the project home
          instead of an article-specific editor.
        </p>
      </section>
    );
  }

  return (
    <section className="py-12">
      <Badge tone="neutral">{preview.category ?? "Article"}</Badge>
      <h1 className="text-foreground mt-5 max-w-4xl text-5xl leading-tight font-semibold tracking-normal">
        {preview.title}
      </h1>
      <p className="text-muted-foreground mt-4 flex flex-wrap gap-2 text-sm">
        {preview.author === undefined ? null : <span>{preview.author}</span>}
        {preview.displayDate === undefined ? null : (
          <span>{preview.displayDate}</span>
        )}
      </p>
      {preview.featuredMedia === undefined ? null : (
        <img
          alt={preview.featuredMedia.altText}
          className="mt-8 aspect-video w-full rounded-[var(--radius-panel)] object-cover"
          src={preview.featuredMedia.fullUrl}
        />
      )}
      {preview.description === undefined ? null : (
        <p className="text-foreground mt-8 max-w-3xl text-lg leading-8">
          {preview.description}
        </p>
      )}
      <section className="border-border mt-8 max-w-3xl border-t pt-8">
        <h2 className="text-foreground text-2xl font-semibold">
          Planning Your Desk
        </h2>
        <p className="text-muted-foreground mt-3 text-base leading-7">
          Before cutting any wood, take time to plan.
        </p>
      </section>
    </section>
  );
}

function PublishBlocked({
  onCommand,
  publish,
}: {
  onCommand: PublishScreenProps["onCommand"];
  publish: PublishViewModel;
}): ReactElement {
  return (
    <PublishStatePanel
      actions={
        <>
          <Button
            onClick={() =>
              onCommand("settings.open", { settingsSectionId: "publishing" })
            }
            variant="primary"
          >
            <Cloud aria-hidden="true" />
            Connect Cloudflare
          </Button>
          <Button onClick={() => onCommand("publish.cancel")}>Cancel</Button>
        </>
      }
      diagnostics={publish.diagnostics}
      icon={<AlertTriangle aria-hidden="true" className="text-danger" />}
      publish={publish}
      title="Connect Cloudflare before publishing"
    >
      This publish plan is blocked before any provider work can start. Connect a
      publish provider, then prepare the preview again.
    </PublishStatePanel>
  );
}

function PublishFailed({
  onCommand,
  publish,
}: {
  onCommand: PublishScreenProps["onCommand"];
  publish: PublishViewModel;
}): ReactElement {
  return (
    <PublishStatePanel
      actions={
        <>
          <Button onClick={() => onCommand("publish.retry")} variant="primary">
            <RotateCcw aria-hidden="true" />
            Retry publish
          </Button>
          <Button onClick={() => onCommand("publish.prepare")}>
            Review preview
          </Button>
          <Button onClick={() => onCommand("publish.cancel")}>Cancel</Button>
        </>
      }
      diagnostics={publish.diagnostics}
      icon={<AlertTriangle aria-hidden="true" className="text-warning" />}
      publish={publish}
      title="Publish failed"
    >
      The fixture apply step reached a retryable failure after confirmation. The
      release candidate and checkpoint remain available.
    </PublishStatePanel>
  );
}

function PublishPreparing({
  onCommand,
  publish,
}: {
  onCommand: PublishScreenProps["onCommand"];
  publish: PublishViewModel;
}): ReactElement {
  return (
    <PublishStatePanel
      actions={
        <Button onClick={() => onCommand("publish.prepare")} variant="primary">
          Prepare preview
        </Button>
      }
      diagnostics={publish.diagnostics}
      icon={<FileText aria-hidden="true" className="text-muted-foreground" />}
      publish={publish}
      title="Prepare publish preview"
    >
      Studio will run a fixture-backed preview and plan before any publish
      confirmation can appear.
    </PublishStatePanel>
  );
}

function PublishProgress({
  onCommand,
  publish,
}: {
  onCommand: PublishScreenProps["onCommand"];
  publish: PublishViewModel;
}): ReactElement {
  return (
    <PublishStatePanel
      actions={
        <Button onClick={() => onCommand("publish.finish")} variant="primary">
          Show success state
        </Button>
      }
      diagnostics={publish.diagnostics}
      icon={<UploadCloud aria-hidden="true" className="text-warning" />}
      publish={publish}
      title="Publishing to Cloudflare..."
    >
      <div className="space-y-4">
        <p>
          The confirmed fixture plan is in its apply phase. This prototype does
          not send credentials or deploy output to Cloudflare.
        </p>
        <Progress.Root
          aria-label="Publishing progress"
          className="bg-panel-muted h-2 overflow-hidden rounded-full"
          value={68}
        >
          <Progress.Indicator
            className="bg-accent block h-full rounded-full transition-transform"
            style={{ transform: "translateX(-32%)" }}
          />
        </Progress.Root>
      </div>
    </PublishStatePanel>
  );
}

function PublishSuccess({
  onCommand,
  publish,
}: {
  onCommand: PublishScreenProps["onCommand"];
  publish: PublishViewModel;
}): ReactElement {
  return (
    <PublishStatePanel
      actions={
        <>
          <Button asChild variant="primary">
            <a
              href={
                publish.result?.publishedUrl ?? publish.plan?.destinationUrl
              }
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink aria-hidden="true" />
              View site
            </a>
          </Button>
          <Button onClick={() => onCommand("article.restoreVersion")}>
            Restore checkpoint
          </Button>
          <Button onClick={() => onCommand("publish.done")}>Done</Button>
        </>
      }
      diagnostics={publish.diagnostics}
      icon={<CheckCircle2 aria-hidden="true" className="text-success" />}
      publish={publish}
      title="Publish complete"
    >
      The fixture result reached the published state. In the real provider flow,
      this state will be backed by a release record and deploy provider result.
    </PublishStatePanel>
  );
}

function PublishStatePanel({
  actions,
  children,
  diagnostics,
  icon,
  publish,
  title,
}: {
  actions: ReactElement;
  children: ReactElement | string;
  diagnostics: readonly DiagnosticFixture[];
  icon: ReactElement;
  publish: PublishViewModel;
  title: string;
}): ReactElement {
  return (
    <div className="grid min-h-full place-items-center px-6 py-10">
      <Panel className="w-full max-w-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-panel-muted flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)]">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-foreground text-xl font-semibold">{title}</h2>
              <Badge tone={publishStatusBadgeTone(publish)}>
                {publish.statusLabel}
              </Badge>
            </div>
            <div className="text-muted-foreground mt-2 text-sm leading-6">
              {children}
            </div>
            <PublishPlanSummary publish={publish} />
            <PublishDiagnostics diagnostics={diagnostics} />
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {actions}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function PublishPlanSummary({
  publish,
}: {
  publish: PublishViewModel;
}): ReactElement {
  return (
    <dl className="border-border bg-panel-muted mt-5 grid gap-3 rounded-[var(--radius-control)] border p-4 text-sm">
      <PublishFact
        label="Destination"
        value={publish.plan?.destinationUrl ?? "Not planned"}
      />
      <PublishFact label="Provider" value={publish.targetProvider.label} />
      <PublishFact label="Credential" value={publish.credentialStateLabel} />
      <PublishFact
        label="Checkpoint"
        value={
          publish.plan?.checkpointRequired === true
            ? "Will save before publishing"
            : "Not available"
        }
      />
      {publish.plan === undefined ? null : (
        <ol className="text-muted-foreground mt-1 list-decimal space-y-1 pl-5">
          {publish.plan.summary.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
    </dl>
  );
}

function PublishFact({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactElement {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground truncate text-right font-medium">
        {value}
      </dd>
    </div>
  );
}

function PublishDiagnostics({
  diagnostics,
}: {
  diagnostics: readonly DiagnosticFixture[];
}): null | ReactElement {
  if (diagnostics.length === 0) {
    return null;
  }

  return (
    <ul className="mt-5 space-y-3">
      {diagnostics.map((diagnostic) => (
        <li
          className="border-warning/40 bg-warning-muted rounded-[var(--radius-control)] border p-3"
          key={diagnostic.code}
        >
          <p className="text-foreground text-sm font-medium">
            {diagnostic.message}
          </p>
          {diagnostic.remediation === undefined ? null : (
            <p className="text-muted-foreground mt-1 text-sm leading-5">
              {diagnostic.remediation}
            </p>
          )}
          <p className="text-muted-foreground mt-2 text-xs">
            {diagnostic.code}
          </p>
        </li>
      ))}
    </ul>
  );
}

function PublishFallback({
  onCommand,
}: {
  onCommand: PublishScreenProps["onCommand"];
}): ReactElement {
  return (
    <main className="grid min-h-full place-items-center p-6">
      <Panel className="max-w-lg p-6">
        <h1 className="text-foreground text-xl font-semibold">
          Publish fixture unavailable
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          The publish screen could not resolve fixture-backed plan data.
        </p>
        <Button
          className="mt-5"
          onClick={() => onCommand("publish.cancel")}
          variant="primary"
        >
          Return to project
        </Button>
      </Panel>
    </main>
  );
}

function publishStatusBadgeTone(
  publish: PublishViewModel,
): "danger" | "neutral" | "success" | "warning" {
  return publish.statusTone;
}
