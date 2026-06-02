import {
  AlertTriangle,
  Clock3,
  ExternalLink,
  Monitor,
  MoreHorizontal,
  PanelRight,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import type { ReactElement } from "react";

import {
  studioCommandAvailability,
  type StudioCommandId,
} from "../../commands/studio-commands";
import { cn } from "../../lib/cn";
import {
  type DiagnosticFixture,
  type PreviewPaneViewModel,
  previewPaneViewModel,
  type StudioMvpFixture,
} from "../../models/studio-fixtures";
import type {
  StudioAppState,
  StudioCommandPayload,
  StudioPreviewViewport,
} from "../../state/studio-state";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { Panel } from "../ui/Panel";
import { Tooltip } from "../ui/Tooltip";

interface PreviewPaneShellProps {
  fixture: StudioMvpFixture;
  onCommand: (
    commandId: StudioCommandId,
    payload?: StudioCommandPayload,
  ) => void;
  state: StudioAppState;
}

/**
 * Shared preview/details pane shell for fixture-backed route preview states.
 *
 * @returns The currently active Studio preview/details pane.
 */
export function PreviewPaneShell({
  fixture,
  onCommand,
  state,
}: PreviewPaneShellProps): ReactElement {
  const preview = previewPaneViewModel(fixture, state);

  return (
    <aside aria-label="Preview pane" className="flex h-full min-h-0 flex-col">
      <div className="border-border flex min-h-12 items-center justify-between gap-2 border-b px-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-foreground text-sm font-semibold">Preview</h2>
            <PreviewStatusBadge tone={preview.statusTone}>
              {preview.statusLabel}
            </PreviewStatusBadge>
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {preview.route}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <PreviewModeToggle onCommand={onCommand} state={state} />
          <Tooltip
            content={
              studioCommandAvailability("preview.openExternal", state).reason ??
              "Open preview externally"
            }
          >
            <IconButton
              disabled={
                studioCommandAvailability("preview.openExternal", state)
                  .status !== "available"
              }
              label="Open preview externally"
              onClick={() => onCommand("preview.openExternal")}
              title={
                studioCommandAvailability("preview.openExternal", state).reason
              }
            >
              <ExternalLink aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip content="Toggle preview" shortcut="⌥⌘P">
            <IconButton
              label="Toggle preview"
              onClick={() => onCommand("pane.togglePreview")}
            >
              <PanelRight aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip content="More preview actions will appear when preview extensions are connected.">
            <IconButton
              disabled
              label="More preview actions. More preview actions will appear when preview extensions are connected."
              title="More preview actions will appear when preview extensions are connected."
            >
              <MoreHorizontal aria-hidden="true" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <PreviewContent
          onCommand={onCommand}
          preview={preview}
          viewport={state.previewViewport}
        />
      </div>
    </aside>
  );
}

function PreviewContent({
  onCommand,
  preview,
  viewport,
}: {
  onCommand: PreviewPaneShellProps["onCommand"];
  preview: PreviewPaneViewModel;
  viewport: StudioPreviewViewport;
}): ReactElement {
  if (preview.renderMode === "article") {
    return (
      <ArticleRoutePreview
        onCommand={onCommand}
        preview={preview}
        viewport={viewport}
      />
    );
  }

  if (preview.renderMode === "status") {
    return <PreviewStatusPanel onCommand={onCommand} preview={preview} />;
  }

  return (
    <Panel className="p-5" variant="muted">
      <p className="text-muted-foreground text-xs font-semibold uppercase">
        No preview selected
      </p>
      <h3 className="text-foreground mt-3 text-lg font-semibold">
        Open a page preview
      </h3>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        Use Preview from an article or project screen to render the selected
        route.
      </p>
      <Button
        className="mt-4"
        onClick={() => onCommand("preview.open")}
        size="sm"
      >
        Open preview
      </Button>
    </Panel>
  );
}

function ArticleRoutePreview({
  onCommand,
  preview,
  viewport,
}: {
  onCommand: PreviewPaneShellProps["onCommand"];
  preview: PreviewPaneViewModel;
  viewport: StudioPreviewViewport;
}): ReactElement {
  return (
    <article
      className={cn(
        "mx-auto",
        viewport === "mobile"
          ? "border-border bg-background max-w-[23rem] rounded-[var(--radius-panel)] border p-4 shadow-sm"
          : "max-w-2xl",
      )}
      data-preview-viewport={viewport}
      data-testid="route-preview"
    >
      {preview.statusLabel === "Stale" ? (
        <PreviewNotice
          actionLabel="Refresh preview"
          message="The article changed after this preview was rendered."
          onAction={() => onCommand("preview.open")}
          title="Preview out of date"
          tone="warning"
        />
      ) : null}
      <h1 className="text-foreground text-3xl leading-tight font-semibold">
        {preview.title}
      </h1>
      <PreviewByline preview={preview} />
      <PreviewTags tags={preview.tags} />
      {preview.featuredMedia === undefined ? null : (
        <img
          alt={preview.featuredMedia.altText}
          className="mt-5 aspect-video w-full rounded-[var(--radius-panel)] object-cover"
          src={preview.featuredMedia.fullUrl}
        />
      )}
      {preview.description === undefined ? null : (
        <p className="text-foreground mt-5 text-sm leading-6">
          {preview.description}
        </p>
      )}
      {preview.article === undefined ? (
        <HomeRoutePreviewSummary />
      ) : (
        <ArticleRoutePreviewSummary />
      )}
    </article>
  );
}

function ArticleRoutePreviewSummary(): ReactElement {
  return (
    <section className="border-border mt-6 border-t pt-5">
      <h2 className="text-foreground text-xl font-semibold">
        Planning Your Desk
      </h2>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        Before cutting any wood, take time to plan your materials, workspace,
        and measurements.
      </p>
    </section>
  );
}

function HomeRoutePreviewSummary(): ReactElement {
  return (
    <section className="border-border mt-6 border-t pt-5">
      <h2 className="text-foreground text-xl font-semibold">
        Home page preview
      </h2>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        Thoughtful guides, practical notes, and workshop ideas appear here when
        readers open the site.
      </p>
    </section>
  );
}

function PreviewByline({
  preview,
}: {
  preview: PreviewPaneViewModel;
}): ReactElement {
  const items = [preview.author, preview.displayDate, preview.category].filter(
    (item): item is string => item !== undefined,
  );

  return (
    <p className="text-muted-foreground mt-3 flex flex-wrap items-center gap-2 text-sm">
      {items.map((item) => (
        <span
          className="after:text-border after:ml-2 after:content-['•'] last:after:content-none"
          key={item}
        >
          {item}
        </span>
      ))}
    </p>
  );
}

function PreviewDiagnostics({
  diagnostics,
}: {
  diagnostics: readonly DiagnosticFixture[];
}): null | ReactElement {
  if (diagnostics.length === 0) {
    return null;
  }

  return (
    <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
      {diagnostics.map((diagnostic) => (
        <li
          className="border-border bg-panel rounded-[var(--radius-control)] border p-3"
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

function PreviewModeToggle({
  onCommand,
  state,
}: {
  onCommand: PreviewPaneShellProps["onCommand"];
  state: StudioAppState;
}): ReactElement {
  return (
    <div
      aria-label="Preview viewport"
      className="border-border bg-panel-muted hidden rounded-[var(--radius-control)] border p-0.5 xl:flex"
      role="group"
    >
      <IconButton
        aria-pressed={state.previewViewport === "desktop"}
        label="Desktop preview"
        onClick={() =>
          onCommand("preview.setViewport", { previewViewport: "desktop" })
        }
        variant={state.previewViewport === "desktop" ? "secondary" : "ghost"}
      >
        <Monitor aria-hidden="true" />
      </IconButton>
      <IconButton
        aria-pressed={state.previewViewport === "mobile"}
        label="Mobile preview"
        onClick={() =>
          onCommand("preview.setViewport", { previewViewport: "mobile" })
        }
        variant={state.previewViewport === "mobile" ? "secondary" : "ghost"}
      >
        <Smartphone aria-hidden="true" />
      </IconButton>
    </div>
  );
}

function PreviewNotice({
  actionLabel,
  message,
  onAction,
  title,
  tone,
}: {
  actionLabel: string;
  message: string;
  onAction: () => void;
  title: string;
  tone: "danger" | "warning";
}): ReactElement {
  const Icon = tone === "danger" ? AlertTriangle : Clock3;
  const toneClass =
    tone === "danger"
      ? "border-danger/40 bg-danger-muted text-danger"
      : "border-warning/40 bg-warning-muted text-warning";

  return (
    <div
      className={`mb-5 rounded-[var(--radius-panel)] border p-4 ${toneClass}`}
    >
      <div className="flex items-start gap-3">
        <Icon aria-hidden="true" className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-sm font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-5">
            {message}
          </p>
        </div>
        <Button onClick={onAction} size="sm" variant="secondary">
          <RefreshCw aria-hidden="true" />
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

function PreviewStatusBadge({
  children,
  tone,
}: {
  children: string;
  tone: PreviewPaneViewModel["statusTone"];
}): ReactElement {
  switch (tone) {
    case "error":
      return <Badge tone="danger">{children}</Badge>;
    case "neutral":
    case "note":
      return <Badge tone="neutral">{children}</Badge>;
    case "success":
      return <Badge tone="success">{children}</Badge>;
    case "warning":
      return <Badge tone="warning">{children}</Badge>;
  }
}

function PreviewStatusPanel({
  onCommand,
  preview,
}: {
  onCommand: PreviewPaneShellProps["onCommand"];
  preview: PreviewPaneViewModel;
}): ReactElement {
  const content = previewStatusContent(preview.status);
  const Icon = content.icon === "refresh" ? RefreshCw : AlertTriangle;

  return (
    <Panel className="mx-auto max-w-2xl p-5" variant="muted">
      <div className="flex items-start gap-3">
        <Icon aria-hidden="true" className={content.iconClassName} />
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs font-semibold uppercase">
            {preview.route}
          </p>
          <h3 className="text-foreground mt-2 text-lg font-semibold">
            {content.title}
          </h3>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            {content.message}
          </p>
          <PreviewDiagnostics diagnostics={preview.diagnostics} />
          <Button
            className="mt-5"
            disabled={content.retryDisabled}
            onClick={() => onCommand("preview.open")}
            size="sm"
          >
            <RefreshCw aria-hidden="true" />
            Retry preview
          </Button>
        </div>
      </div>
    </Panel>
  );
}

interface PreviewStatusContent {
  readonly icon: "alert" | "refresh";
  readonly iconClassName: string;
  readonly message: string;
  readonly retryDisabled: boolean;
  readonly title: string;
}

function previewStatusContent(
  status: PreviewPaneViewModel["status"],
): PreviewStatusContent {
  switch (status) {
    case "blocked":
      return {
        icon: "alert",
        iconClassName: "mt-0.5 text-danger",
        message:
          "Fix the blocking article or site issue before previewing this route.",
        retryDisabled: true,
        title: "Preview is blocked",
      };
    case "failed":
      return {
        icon: "alert",
        iconClassName: "mt-0.5 text-warning",
        message:
          "The preview operation failed before producing a usable route artifact.",
        retryDisabled: false,
        title: "Preview failed",
      };
    case "idle":
    case "ready":
    case "stale":
      return {
        icon: "alert",
        iconClassName: "mt-0.5 text-muted-foreground",
        message: "Open a preview to render this route.",
        retryDisabled: false,
        title: "No preview selected",
      };
    case "loading":
      return {
        icon: "refresh",
        iconClassName: "mt-0.5 text-warning",
        message: "Studio is preparing a route preview from the current state.",
        retryDisabled: false,
        title: "Preparing preview",
      };
  }
}

function PreviewTags({
  tags,
}: {
  tags: readonly string[];
}): null | ReactElement {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag} tone="accent">
          {tag}
        </Badge>
      ))}
    </div>
  );
}
