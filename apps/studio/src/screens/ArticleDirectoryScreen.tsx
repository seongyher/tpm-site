import { AlertTriangle, FileText, Plus, Search } from "lucide-react";
import type { ChangeEvent, ReactElement } from "react";

import type { StudioCommandId } from "../commands/studio-commands";
import { ArticleActionMenu } from "../components/articles/ArticleActionMenu";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Panel } from "../components/ui/Panel";
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
    <main className="min-h-full overflow-auto p-4 md:p-5">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <ArticleDirectoryToolbar directory={directory} onCommand={onCommand} />
        <ArticleDirectoryResults
          directory={directory}
          onCommand={onCommand}
          state={state}
        />
      </div>
    </main>
  );
}

function ArticleDirectoryToolbar({
  directory,
  onCommand,
}: {
  directory: ArticleDirectoryViewModel;
  onCommand: ArticleDirectoryScreenProps["onCommand"];
}): ReactElement {
  return (
    <section aria-label="Article directory" className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <StatusFilter directory={directory} onCommand={onCommand} />
          <span className="text-muted-foreground text-xs">
            {directory.resultCount}{" "}
            {directory.resultCount === 1 ? "article" : "articles"}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 lg:max-w-xl">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search articles</span>
            <Search
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <input
              className="border-border bg-panel text-foreground focus-visible:outline-accent h-9 w-full rounded-[var(--radius-control)] border pr-3 pl-9 text-sm focus-visible:outline-2"
              onChange={(event) => onSearchChange(onCommand, event, directory)}
              placeholder="Search articles..."
              type="search"
              value={directory.query}
            />
          </label>
          <Button onClick={() => onCommand("article.create")} variant="primary">
            <Plus aria-hidden="true" />
            New article
          </Button>
        </div>
      </div>
      <FilterChips directory={directory} onCommand={onCommand} />
    </section>
  );
}
function ArticleDirectoryResults({
  directory,
  onCommand,
  state,
}: {
  directory: ArticleDirectoryViewModel;
  onCommand: ArticleDirectoryScreenProps["onCommand"];
  state: StudioAppState;
}): ReactElement {
  if (directory.results.length === 0) {
    return (
      <ArticleDirectoryEmptyState directory={directory} onCommand={onCommand} />
    );
  }

  return (
    <section aria-label="Article results" className="flex flex-col gap-2">
      {directory.results.map((item) => (
        <ArticleResultRow
          item={item}
          key={item.result.articleId}
          onCommand={onCommand}
          state={state}
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

function ArticleResultRow({
  item,
  onCommand,
  state,
}: {
  item: ArticleDirectoryViewItem;
  onCommand: ArticleDirectoryScreenProps["onCommand"];
  state: StudioAppState;
}): ReactElement {
  return (
    <Panel className="overflow-hidden" data-testid="article-result-row">
      <article className="grid min-h-28 grid-cols-[8.5rem_minmax(0,1fr)] sm:grid-cols-[8.5rem_minmax(0,1fr)_auto]">
        <div className="border-border flex min-h-28 items-center border-r p-2">
          <div
            className="bg-panel-muted flex aspect-[1.91/1] w-full items-center justify-center overflow-hidden rounded-[var(--radius-control)]"
            data-testid="article-result-thumbnail"
          >
            {item.featuredMedia === undefined ? (
              <FileText aria-hidden="true" className="text-muted-foreground" />
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
        </div>
        <div className="grid min-w-0 gap-1.5 p-3">
          <div className="flex min-w-0 items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <StatusBadge item={item} />
                {item.result.category === undefined ? null : (
                  <Badge tone="accent">{item.result.category}</Badge>
                )}
                <span className="text-muted-foreground text-xs">
                  {item.result.author ?? "Unknown author"}
                </span>
                <span className="text-muted-foreground text-xs">
                  {item.result.dateLabel ?? "No date"}
                </span>
                <span className="text-muted-foreground text-xs">
                  {item.result.readTimeLabel ??
                    item.article.body.wordCountLabel}
                </span>
              </div>
              <h2 className="text-foreground mt-1 line-clamp-1 text-base leading-snug font-semibold">
                {item.result.title}
              </h2>
            </div>
            <ArticleActionMenu
              articleId={item.result.articleId}
              articleTitle={item.result.title}
              onCommand={onCommand}
              restoreEnabled={state.activeArticleId === item.result.articleId}
            />
          </div>
          <div className="min-w-0">
            {item.diagnostic === undefined ? (
              <p className="text-muted-foreground line-clamp-1 text-sm leading-5">
                {item.result.excerpt}
              </p>
            ) : (
              <p className="text-warning flex min-w-0 items-center gap-1.5 text-sm leading-5">
                <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">{item.diagnostic.message}</span>
              </p>
            )}
          </div>
          <div className="flex min-w-0 flex-wrap gap-1.5">
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {item.result.tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="border-border flex items-end justify-end border-t p-3 sm:border-t-0 sm:pl-0">
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
      </article>
    </Panel>
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
          ? "bg-accent-muted text-accent-foreground focus-visible:outline-accent rounded-full px-2.5 py-1 text-xs font-medium focus-visible:outline-2"
          : "bg-panel-muted text-muted-foreground hover:bg-accent-muted hover:text-accent-foreground focus-visible:outline-accent rounded-full px-2.5 py-1 text-xs font-medium focus-visible:outline-2"
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
              ? "bg-panel text-foreground shadow-panel rounded-[calc(var(--radius-control)-0.125rem)] px-2.5 py-1 text-xs font-medium"
              : "text-muted-foreground hover:text-foreground rounded-[calc(var(--radius-control)-0.125rem)] px-2.5 py-1 text-xs font-medium"
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
