import {
  AlertTriangle,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import type { ChangeEvent, ReactElement } from "react";

import type { StudioCommandId } from "../commands/studio-commands";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Panel } from "../components/ui/Panel";
import { Tooltip } from "../components/ui/Tooltip";
import {
  type ArticleDirectoryFilterInput,
  type ArticleDirectoryViewItem,
  type ArticleDirectoryViewModel,
  filteredArticleDirectoryViewModel,
  type StudioMvpFixture,
} from "../models/studio-fixtures";
import type {
  StudioAppState,
  StudioCommandPayload,
} from "../state/studio-state";

interface ArticleDirectoryScreenProps {
  fixture: StudioMvpFixture;
  onCommand: (
    commandId: StudioCommandId,
    payload?: StudioCommandPayload,
  ) => void;
  state: StudioAppState;
}

/**
 * Article directory/browser screen for scanning, filtering, and opening work.
 *
 * @returns The fixture-backed article directory work surface.
 */
export function ArticleDirectoryScreen({
  fixture,
  onCommand,
  state,
}: ArticleDirectoryScreenProps): ReactElement {
  const directory = filteredArticleDirectoryViewModel(
    fixture,
    state.articleDirectory,
  );

  return (
    <main className="min-h-full overflow-auto p-6 md:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <ArticleDirectoryHeader directory={directory} onCommand={onCommand} />
        <ArticleDirectoryFilters directory={directory} onCommand={onCommand} />
        <ArticleDirectoryResults directory={directory} onCommand={onCommand} />
      </div>
    </main>
  );
}

function ArticleDirectoryHeader({
  directory,
  onCommand,
}: {
  directory: ArticleDirectoryViewModel;
  onCommand: ArticleDirectoryScreenProps["onCommand"];
}): ReactElement {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-foreground text-3xl font-semibold">Articles</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Browse, filter, and open articles.
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {directory.resultCount}{" "}
          {directory.resultCount === 1 ? "article" : "articles"} shown
        </p>
      </div>
      <Button onClick={() => onCommand("article.create")} variant="primary">
        <Plus aria-hidden="true" />
        New article
      </Button>
    </header>
  );
}

function ArticleDirectoryFilters({
  directory,
  onCommand,
}: {
  directory: ArticleDirectoryViewModel;
  onCommand: ArticleDirectoryScreenProps["onCommand"];
}): ReactElement {
  return (
    <Panel className="p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <StatusFilter directory={directory} onCommand={onCommand} />
          <label className="relative block min-w-0 flex-1 lg:max-w-md">
            <span className="sr-only">Search articles</span>
            <Search
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            />
            <input
              className="border-border bg-panel text-foreground focus-visible:outline-accent h-10 w-full rounded-[var(--radius-control)] border pr-3 pl-10 text-sm focus-visible:outline-2"
              onChange={(event) => onSearchChange(onCommand, event, directory)}
              placeholder="Search title, tag, category, author..."
              type="search"
              value={directory.query}
            />
          </label>
        </div>
        <FilterChips directory={directory} onCommand={onCommand} />
      </div>
    </Panel>
  );
}

function ArticleDirectoryResults({
  directory,
  onCommand,
}: {
  directory: ArticleDirectoryViewModel;
  onCommand: ArticleDirectoryScreenProps["onCommand"];
}): ReactElement {
  if (directory.results.length === 0) {
    return (
      <ArticleDirectoryEmptyState directory={directory} onCommand={onCommand} />
    );
  }

  return (
    <section aria-label="Article results" className="grid gap-4 xl:grid-cols-2">
      {directory.results.map((item) => (
        <ArticleResultCard
          item={item}
          key={item.result.articleId}
          onCommand={onCommand}
        />
      ))}
    </section>
  );
}

function ArticleDirectoryEmptyState({
  directory,
  onCommand,
}: {
  directory: ArticleDirectoryViewModel;
  onCommand: ArticleDirectoryScreenProps["onCommand"];
}): ReactElement {
  const noArticles = directory.emptyState === "no-articles";

  return (
    <Panel className="p-8 text-center">
      <FileText
        aria-hidden="true"
        className="text-muted-foreground mx-auto size-10"
      />
      <h2 className="text-foreground mt-4 text-lg font-semibold">
        {noArticles ? "No articles yet" : "No articles match these filters"}
      </h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-6">
        {noArticles
          ? "Create your first article when you are ready to start writing."
          : "Clear the search and filters to return to the full article list."}
      </p>
      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        {noArticles ? (
          <Button onClick={() => onCommand("article.create")} variant="primary">
            <Plus aria-hidden="true" />
            New article
          </Button>
        ) : (
          <Button onClick={() => onCommand("article.directory.resetFilters")}>
            Reset filters
          </Button>
        )}
      </div>
    </Panel>
  );
}

function ArticleResultCard({
  item,
  onCommand,
}: {
  item: ArticleDirectoryViewItem;
  onCommand: ArticleDirectoryScreenProps["onCommand"];
}): ReactElement {
  return (
    <Panel className="overflow-hidden">
      <article className="grid h-full md:grid-cols-[14rem_minmax(0,1fr)] xl:flex xl:flex-col">
        <div className="bg-panel-muted border-border flex h-44 items-center justify-center border-b md:h-auto md:border-r md:border-b-0 xl:aspect-[16/7] xl:h-auto xl:border-r-0 xl:border-b">
          {item.featuredMedia === undefined ? (
            <FileText
              aria-hidden="true"
              className="text-muted-foreground size-10"
            />
          ) : (
            <img
              alt={
                item.featuredMedia.altText.length > 0
                  ? item.featuredMedia.altText
                  : ""
              }
              className="h-full w-full object-cover"
              src={item.featuredMedia.thumbnailUrl}
            />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge item={item} />
                {item.result.category === undefined ? null : (
                  <Badge tone="accent">{item.result.category}</Badge>
                )}
              </div>
              <h2 className="text-foreground line-clamp-2 text-lg font-semibold">
                {item.result.title}
              </h2>
            </div>
            <ArticleActionsButton title={item.result.title} />
          </div>
          <p className="text-muted-foreground line-clamp-3 text-sm leading-6">
            {item.result.excerpt}
          </p>
          {item.diagnostic === undefined ? null : (
            <div className="bg-warning-muted text-warning flex items-start gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm">
              <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" />
              <span>{item.diagnostic.message}</span>
            </div>
          )}
          <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span>{item.result.author ?? "Unknown author"}</span>
            <span>{item.result.dateLabel ?? "No date"}</span>
            <span>
              {item.result.readTimeLabel ?? item.article.body.wordCountLabel}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap gap-2">
              {item.result.tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button
              onClick={() =>
                onCommand("article.open", { articleId: item.result.articleId })
              }
              size="sm"
              variant="primary"
            >
              Open editor
            </Button>
          </div>
        </div>
      </article>
    </Panel>
  );
}

function ArticleActionsButton({ title }: { title: string }): ReactElement {
  return (
    <Tooltip content="Article actions: open, rename, duplicate, move, reveal, delete">
      <IconButton aria-haspopup="menu" label={`More actions for ${title}`}>
        <MoreHorizontal aria-hidden="true" />
      </IconButton>
    </Tooltip>
  );
}

function FilterChips({
  directory,
  onCommand,
}: {
  directory: ArticleDirectoryViewModel;
  onCommand: ArticleDirectoryScreenProps["onCommand"];
}): ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {directory.availableCategories.map((category) => (
        <FilterChip
          active={directory.categoryFilter === category}
          key={category}
          label={category}
          onClick={() =>
            onCommand("article.directory.setCategory", {
              categoryFilter:
                directory.categoryFilter === category ? undefined : category,
            })
          }
        />
      ))}
      {directory.availableTags.map((tag) => (
        <FilterChip
          active={directory.tagFilter === tag}
          key={tag}
          label={`#${tag}`}
          onClick={() =>
            onCommand("article.directory.setTag", {
              tagFilter: directory.tagFilter === tag ? undefined : tag,
            })
          }
        />
      ))}
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}): ReactElement {
  return (
    <button
      aria-pressed={active}
      className={
        active
          ? "bg-accent-muted text-accent-foreground focus-visible:outline-accent rounded-full px-3 py-1 text-sm font-medium focus-visible:outline-2"
          : "bg-panel-muted text-muted-foreground hover:bg-accent-muted hover:text-accent-foreground focus-visible:outline-accent rounded-full px-3 py-1 text-sm font-medium focus-visible:outline-2"
      }
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function StatusBadge({
  item,
}: {
  item: ArticleDirectoryViewItem;
}): ReactElement {
  switch (item.result.status) {
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

function StatusFilter({
  directory,
  onCommand,
}: {
  directory: ArticleDirectoryViewModel;
  onCommand: ArticleDirectoryScreenProps["onCommand"];
}): ReactElement {
  const filters = [
    { label: "All", value: "all" },
    { label: "Published", value: "published" },
    { label: "Drafts", value: "drafts" },
  ] as const satisfies readonly ArticleDirectoryStatusOption[];

  return (
    <div
      aria-label="Article status"
      className="bg-panel-muted border-border inline-flex flex-wrap rounded-[var(--radius-control)] border p-1"
      role="group"
    >
      {filters.map((filter) => (
        <button
          aria-pressed={directory.statusFilter === filter.value}
          className={
            directory.statusFilter === filter.value
              ? "bg-panel text-foreground shadow-panel rounded-[calc(var(--radius-control)-0.125rem)] px-3 py-1.5 text-sm font-medium"
              : "text-muted-foreground hover:text-foreground rounded-[calc(var(--radius-control)-0.125rem)] px-3 py-1.5 text-sm font-medium"
          }
          key={filter.value}
          onClick={() =>
            onCommand("article.directory.setStatusFilter", {
              statusFilter: filter.value,
            })
          }
          type="button"
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

function onSearchChange(
  onCommand: ArticleDirectoryScreenProps["onCommand"],
  event: ChangeEvent<HTMLInputElement>,
  directory: ArticleDirectoryViewModel,
): void {
  onCommand("article.directory.setSearch", {
    directoryScenarioId: directory.id,
    query: event.currentTarget.value,
  });
}

interface ArticleDirectoryStatusOption {
  readonly label: string;
  readonly value: ArticleDirectoryFilterInput["statusFilter"];
}
