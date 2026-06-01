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

import type { StudioCommandId } from "../../commands/studio-commands";
import {
  type DiagnosticFixture,
  type PreviewPaneViewModel,
  previewPaneViewModel,
  type StudioMvpFixture,
} from "../../models/studio-fixtures";
import type { StudioAppState } from "../../state/studio-state";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { Panel } from "../ui/Panel";
import { Tooltip } from "../ui/Tooltip";

interface PreviewPaneShellProps {
  fixture: StudioMvpFixture;
  onCommand: (commandId: StudioCommandId) => void;
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
      <div className="border-border flex min-h-14 items-center justify-between gap-3 border-b px-4">
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
          <PreviewModeToggle />
          <Tooltip content="Open preview externally">
            <IconButton
              disabled={state.activePreviewScenarioId === undefined}
              label="Open preview externally"
              onClick={() => onCommand("preview.openExternal")}
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
          <Tooltip content="More preview actions">
            <IconButton disabled label="More preview actions">
              <MoreHorizontal aria-hidden="true" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-5">
        <PreviewContent onCommand={onCommand} preview={preview} />
      </div>
    </aside>
  );
}

function PreviewContent({
  onCommand,
  preview,
}: {
  onCommand: PreviewPaneShellProps["onCommand"];
  preview: PreviewPaneViewModel;
}): ReactElement {
  if (preview.renderMode === "article") {
    return <ArticleRoutePreview onCommand={onCommand} preview={preview} />;
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
        Use Preview from an article or project screen to build a fixture-backed
        route preview.
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
}: {
  onCommand: PreviewPaneShellProps["onCommand"];
  preview: PreviewPaneViewModel;
}): ReactElement {
  return (
    <article className="mx-auto max-w-2xl" data-testid="route-preview">
      {preview.statusLabel === "Stale" ? (
        <PreviewNotice
          actionLabel="Refresh preview"
          message="The article changed after this preview was rendered."
          onAction={() => onCommand("preview.open")}
          title="Preview out of date"
          tone="warning"
        />
      ) : null}
      <p className="text-muted-foreground text-xs font-semibold uppercase">
        Rendered route preview
      </p>
      <h1 className="text-foreground mt-4 text-3xl leading-tight font-semibold">
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
        This fixture represents the generated route preview. Future backend
        wiring will replace the fixture with the built static route artifact.
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
        This fixture represents the generated home page route. Publishing
        preview starts here when no article-specific context is active.
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

function PreviewModeToggle(): ReactElement {
  return (
    <div
      aria-label="Preview viewport"
      className="border-border bg-panel-muted hidden rounded-[var(--radius-control)] border p-0.5 xl:flex"
      role="group"
    >
      <IconButton aria-pressed="true" label="Desktop preview" variant="ghost">
        <Monitor aria-hidden="true" />
      </IconButton>
      <IconButton disabled label="Mobile preview" variant="ghost">
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
        message:
          "Studio is preparing a route preview from the current fixture state.",
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
