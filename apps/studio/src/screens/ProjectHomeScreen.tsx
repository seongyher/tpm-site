import {
  CheckCircle2,
  FileText,
  Image,
  type LucideIcon,
  Settings,
  UploadCloud,
} from "lucide-react";
import type { ReactElement } from "react";

import type { StudioCommandId } from "../commands/studio-commands";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Panel } from "../components/ui/Panel";
import {
  type ArticleDirectoryViewItem,
  articleDirectoryViewModel,
  type StudioMvpFixture,
} from "../models/studio-fixtures";
import type {
  StudioAppState,
  StudioCommandPayload,
} from "../state/studio-state";

interface ProjectHomeScreenProps {
  fixture: StudioMvpFixture;
  onCommand: (
    commandId: StudioCommandId,
    payload?: StudioCommandPayload,
  ) => void;
  state: StudioAppState;
}

interface ProjectAction {
  commandId: StudioCommandId;
  description: string;
  icon: LucideIcon;
  label: string;
}

const projectActions = [
  {
    commandId: "article.create",
    description: "Start writing a new article.",
    icon: FileText,
    label: "New article",
  },
  {
    commandId: "article.directory.open",
    description: "Browse and edit your articles.",
    icon: FileText,
    label: "Open article",
  },
  {
    commandId: "media.open",
    description: "Upload and manage images.",
    icon: Image,
    label: "Media",
  },
  {
    commandId: "settings.open",
    description: "Edit project settings.",
    icon: Settings,
    label: "Settings",
  },
  {
    commandId: "preview.open",
    description: "See how your site will look.",
    icon: FileText,
    label: "Preview site",
  },
  {
    commandId: "publish.prepare",
    description: "Make your latest changes live.",
    icon: UploadCloud,
    label: "Publish",
  },
] as const satisfies readonly ProjectAction[];

/**
 * Project home screen shown after a site is open but no document is selected.
 *
 * @returns The fixture-backed project home with action cards and summaries.
 */
export function ProjectHomeScreen({
  fixture,
  onCommand,
}: ProjectHomeScreenProps): ReactElement {
  const directory = articleDirectoryViewModel(fixture, "directory-populated");
  const recentWork = directory.results.slice(0, 4);
  const recentDrafts = directory.results.filter(isDraftLike).slice(0, 3);
  const deployProvider = fixture.workspace.providers.deploy;

  return (
    <main className="min-h-full overflow-auto p-6 md:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header>
          <h1 className="text-foreground text-3xl font-semibold">
            Project Home
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Create, manage, and publish content for{" "}
            {fixture.workspace.displayName}.
          </p>
        </header>

        <section aria-label="Common project actions">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {projectActions.map((action) => (
              <ProjectActionCard
                action={action}
                key={action.commandId}
                onCommand={onCommand}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <ArticleSummaryPanel
            items={recentWork}
            onCommand={onCommand}
            title="Recently edited"
          />
          <ArticleSummaryPanel
            emptyLabel="No recent drafts."
            items={recentDrafts}
            onCommand={onCommand}
            title="Recent drafts"
          />
        </section>

        <Panel className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="bg-success-muted text-success grid size-10 shrink-0 place-items-center rounded-full">
              <CheckCircle2 aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-foreground text-sm font-semibold">
                Provider connected
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {deployProvider.label} is connected and ready to publish.
              </p>
            </div>
          </div>
          <Button
            onClick={() => onCommand("settings.open")}
            variant="secondary"
          >
            Manage connection
          </Button>
        </Panel>
      </div>
    </main>
  );
}

function ArticleSummaryPanel({
  emptyLabel = "No recent articles.",
  items,
  onCommand,
  title,
}: {
  emptyLabel?: string;
  items: readonly ArticleDirectoryViewItem[];
  onCommand: ProjectHomeScreenProps["onCommand"];
  title: string;
}): ReactElement {
  return (
    <Panel className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-foreground text-base font-semibold">{title}</h2>
        <button
          className="text-accent hover:text-accent-foreground focus-visible:outline-accent rounded-[var(--radius-control)] text-sm focus-visible:outline-2"
          onClick={() => onCommand("article.directory.open")}
          type="button"
        >
          View all
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{emptyLabel}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {items.map((item) => (
            <ArticleSummaryRow
              item={item}
              key={item.result.articleId}
              onCommand={onCommand}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ArticleSummaryRow({
  item,
  onCommand,
}: {
  item: ArticleDirectoryViewItem;
  onCommand: ProjectHomeScreenProps["onCommand"];
}): ReactElement {
  return (
    <li className="flex min-w-0 items-start gap-3">
      <FileText aria-hidden="true" className="text-muted-foreground mt-0.5" />
      <button
        className="focus-visible:outline-accent min-w-0 flex-1 rounded-[var(--radius-control)] text-left focus-visible:outline-2"
        onClick={() =>
          onCommand("article.open", { articleId: item.result.articleId })
        }
        type="button"
      >
        <span className="text-foreground block truncate text-sm font-medium">
          {item.result.title}
        </span>
        <span className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
          <StatusBadge status={item.result.status} />
          <span>{item.result.dateLabel ?? "Recently edited"}</span>
        </span>
      </button>
    </li>
  );
}

function ProjectActionCard({
  action,
  onCommand,
}: {
  action: ProjectAction;
  onCommand: ProjectHomeScreenProps["onCommand"];
}): ReactElement {
  const Icon = action.icon;

  return (
    <Panel className="p-5">
      <button
        className="focus-visible:outline-accent flex w-full items-center gap-5 text-left focus-visible:outline-2"
        onClick={() => onCommand(action.commandId)}
        type="button"
      >
        <span className="bg-accent-muted text-accent-foreground grid size-14 shrink-0 place-items-center rounded-[var(--radius-control)]">
          <Icon aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="text-foreground block font-semibold">
            {action.label}
          </span>
          <span className="text-muted-foreground mt-1 block text-sm leading-5">
            {action.description}
          </span>
        </span>
      </button>
    </Panel>
  );
}

function StatusBadge({
  status,
}: {
  status: ArticleDirectoryViewItem["result"]["status"];
}): ReactElement {
  switch (status) {
    case "dirty":
      return <Badge tone="warning">Unsaved</Badge>;
    case "draft":
      return <Badge tone="neutral">Draft</Badge>;
    case "invalid":
    case "missing-media":
      return <Badge tone="warning">Needs attention</Badge>;
    case "published":
      return <Badge tone="success">Published</Badge>;
  }
}

function isDraftLike(item: ArticleDirectoryViewItem): boolean {
  return item.result.status === "draft" || item.result.status === "dirty";
}
