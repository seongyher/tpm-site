import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock3,
  Cloud,
  FileText,
  Folder,
  Home,
  Image,
  type LucideIcon,
  Settings,
  Trash2,
} from "lucide-react";
import type { ReactElement } from "react";

import type { StudioCommandId } from "../../commands/studio-commands";
import { cn } from "../../lib/cn";
import type {
  ArticleStatusFixture,
  ArticleTreeNodeFixture,
  NavigationFixture,
  WorkspaceFixture,
} from "../../models/studio-fixtures";
import {
  studioArticleTreeFolderCollapsed,
  type StudioSidebarSelection,
  studioSidebarSelection,
} from "../../state/studio-selectors";
import type {
  StudioAppState,
  StudioCommandPayload,
} from "../../state/studio-state";
import { ArticleActionMenu } from "../articles/ArticleActionMenu";
import { IconButton } from "../ui/IconButton";
import { Tooltip } from "../ui/Tooltip";

interface WorkspaceSidebarProps {
  navigation: NavigationFixture;
  onCommand: (
    commandId: StudioCommandId,
    payload?: StudioCommandPayload,
  ) => void;
  state: StudioAppState;
  workspace: WorkspaceFixture;
}

interface SidebarNavItem {
  commandId?: StudioCommandId;
  disabledReason?: string;
  icon: LucideIcon;
  id: string;
  label: string;
}

interface ArticleTreeNodeProps {
  node: ArticleTreeNodeFixture;
  onCommand: WorkspaceSidebarProps["onCommand"];
  selection: StudioSidebarSelection;
  state: StudioAppState;
}

type ArticleTreeFolderNodeFixture = ArticleTreeNodeFixture & {
  readonly kind: "folder";
};

type ArticleTreeLeafNodeFixture = ArticleTreeNodeFixture & {
  readonly kind: "article";
};

interface ArticleTreeFolderNodeProps extends ArticleTreeNodeProps {
  node: ArticleTreeFolderNodeFixture;
}

interface ArticleTreeLeafNodeProps extends Omit<ArticleTreeNodeProps, "state"> {
  node: ArticleTreeLeafNodeFixture;
}

interface ArticleTreeStatusProps {
  status: ArticleStatusFixture | undefined;
}

const primaryItems = [
  {
    commandId: "project.openHome",
    icon: Home,
    id: "project-home",
    label: "Home",
  },
  {
    commandId: "article.directory.open",
    icon: FileText,
    id: "articles",
    label: "Articles",
  },
  { commandId: "media.open", icon: Image, id: "media", label: "Media" },
  {
    commandId: "settings.open",
    icon: Settings,
    id: "settings",
    label: "Settings",
  },
] as const satisfies readonly SidebarNavItem[];

const startupItems = [
  {
    commandId: "project.showRecent",
    icon: Clock3,
    id: "recent-projects",
    label: "Recent Projects",
  },
  {
    disabledReason:
      "Template browsing will be available when starter templates are connected.",
    icon: FileText,
    id: "templates",
    label: "Templates",
  },
  {
    disabledReason:
      "Learning resources will open after documentation routes are connected.",
    icon: BookOpen,
    id: "learn",
    label: "Learn",
  },
  {
    disabledReason:
      "Cloud account management is available after a site is opened.",
    icon: Cloud,
    id: "cloud",
    label: "Cloud",
  },
] as const satisfies readonly SidebarNavItem[];

/**
 * Persistent Studio sidebar with project switcher, primary nav, and article tree.
 *
 * @returns The primary Studio navigation sidebar.
 */
export function WorkspaceSidebar({
  navigation,
  onCommand,
  state,
  workspace,
}: WorkspaceSidebarProps): ReactElement {
  if (state.activeProjectId === undefined) {
    return (
      <StartupSidebar
        onCommand={onCommand}
        state={state}
        workspace={workspace}
      />
    );
  }

  return (
    <aside
      aria-label="Studio navigation"
      className="bg-sidebar flex h-full min-h-0 flex-col"
    >
      <div className="border-border border-b px-3 py-3">
        <div
          className="text-foreground flex min-w-0 items-center gap-2 px-2 py-1.5 text-sm font-semibold"
          title="Project switching will be available when multiple workspaces are connected."
        >
          <span className="truncate">{workspace.displayName}</span>
        </div>
      </div>
      <nav aria-label="Primary Studio sections" className="px-3 py-2">
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {primaryItems.map((item) => (
            <li key={item.id}>
              <SidebarButton item={item} onCommand={onCommand} state={state} />
            </li>
          ))}
        </ul>
      </nav>
      <section
        aria-label="Articles"
        className="border-border min-h-0 flex-1 border-t px-3 py-2.5"
      >
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <h2 className="text-muted-foreground text-xs font-semibold uppercase">
            Articles
          </h2>
          <Tooltip content="New article" shortcut="⌘N">
            <IconButton
              label="New article"
              onClick={() => onCommand("article.create")}
              variant="ghost"
            >
              <FileText aria-hidden="true" />
            </IconButton>
          </Tooltip>
        </div>
        <ul className="m-0 flex list-none flex-col gap-0.5 overflow-auto p-0">
          {navigation.articleTree.map((node) => (
            <ArticleTreeNode
              key={node.id}
              node={node}
              onCommand={onCommand}
              selection={studioSidebarSelection(state)}
              state={state}
            />
          ))}
        </ul>
      </section>
      <div className="border-border border-t px-3 py-2.5">
        <button
          className="text-muted-foreground flex w-full cursor-not-allowed items-center gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-left text-sm opacity-65 [&_svg]:size-4 [&_svg]:shrink-0"
          disabled
          title="Trash will open when deleted articles or media are available."
          type="button"
        >
          <Trash2 aria-hidden="true" />
          Trash
        </button>
      </div>
    </aside>
  );
}

function StartupSidebar({
  onCommand,
  state,
}: Pick<
  WorkspaceSidebarProps,
  "onCommand" | "state" | "workspace"
>): ReactElement {
  return (
    <aside
      aria-label="Studio navigation"
      className="bg-sidebar flex h-full min-h-0 flex-col"
    >
      <div className="border-border border-b px-3 py-3">
        <div
          className="text-foreground flex min-w-0 items-center gap-2 px-2 py-1.5 text-sm font-semibold [&_svg]:size-4 [&_svg]:shrink-0"
          title="Open or create a site to choose a workspace."
        >
          <Home aria-hidden="true" className="shrink-0" />
          <span className="truncate">Studio</span>
        </div>
      </div>
      <nav aria-label="Startup sections" className="px-3 py-2">
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {startupItems.map((item) => (
            <li key={item.id}>
              <StartupSidebarButton
                item={item}
                onCommand={onCommand}
                selected={startupSelected(
                  studioSidebarSelection(state),
                  item.id,
                )}
              />
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-border min-h-0 flex-1 border-t" />
      <div className="border-border border-t px-3 py-2.5">
        <button
          className="text-muted-foreground flex w-full cursor-not-allowed items-center gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-left text-sm opacity-65 [&_svg]:size-4 [&_svg]:shrink-0"
          disabled
          title="Trash will open after a site with deleted items is available."
          type="button"
        >
          <Trash2 aria-hidden="true" />
          Trash
        </button>
      </div>
    </aside>
  );
}

function ArticleTreeNode({
  node,
  onCommand,
  selection,
  state,
}: ArticleTreeNodeProps): ReactElement {
  if (isArticleTreeFolderNode(node)) {
    return (
      <ArticleTreeFolderNode
        node={node}
        onCommand={onCommand}
        selection={selection}
        state={state}
      />
    );
  }

  if (isArticleTreeLeafNode(node)) {
    return (
      <ArticleTreeLeafNode
        node={node}
        onCommand={onCommand}
        selection={selection}
      />
    );
  }

  throw new Error(`Unsupported article tree node kind: ${node.kind}`);
}

function ArticleTreeFolderNode({
  node,
  onCommand,
  selection,
  state,
}: ArticleTreeFolderNodeProps): ReactElement {
  const collapsed = studioArticleTreeFolderCollapsed(state, node.id);

  return (
    <li>
      <button
        aria-expanded={!collapsed}
        className="text-muted-foreground hover:bg-panel/70 focus-visible:outline-accent mb-0.5 flex w-full min-w-0 items-center gap-1.5 rounded-[var(--radius-control)] px-2 py-1 text-left text-sm focus-visible:outline-2 [&_svg]:size-4 [&_svg]:shrink-0"
        onClick={() =>
          onCommand("articleTree.toggleFolder", {
            articleTreeNodeId: node.id,
          })
        }
        type="button"
      >
        {collapsed ? (
          <ChevronRight aria-hidden="true" />
        ) : (
          <ChevronDown aria-hidden="true" />
        )}
        <Folder aria-hidden="true" />
        <span className="truncate">{node.title}</span>
      </button>
      {collapsed ? null : (
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0 pl-4">
          {(node.children ?? []).map((child) => (
            <ArticleTreeNode
              key={child.id}
              node={child}
              onCommand={onCommand}
              selection={selection}
              state={state}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function ArticleTreeLeafNode({
  node,
  onCommand,
  selection,
}: ArticleTreeLeafNodeProps): ReactElement {
  const selected =
    selection.kind === "article" && selection.articleId === node.articleId;

  return (
    <li>
      <div
        className={cn(
          "group text-foreground flex min-w-0 items-center rounded-[var(--radius-control)] text-sm",
          selected
            ? "bg-accent-muted text-accent-foreground"
            : "hover:bg-panel/70",
        )}
        data-selected={selected ? "true" : undefined}
      >
        <button
          aria-current={selected ? "page" : undefined}
          className="focus-visible:outline-accent flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-left focus-visible:outline-2 [&_svg]:size-4 [&_svg]:shrink-0"
          onClick={() => openArticleNode(onCommand, node.articleId)}
          title={node.title}
          type="button"
        >
          <FileText aria-hidden="true" className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">{node.title}</span>
          <ArticleTreeStatus status={node.status} />
        </button>
        {node.articleId === undefined ? null : (
          <div className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
            <ArticleActionMenu
              articleId={node.articleId}
              articleTitle={node.title}
              onCommand={onCommand}
              restoreEnabled={selected}
            />
          </div>
        )}
      </div>
    </li>
  );
}

function isArticleTreeFolderNode(
  node: ArticleTreeNodeFixture,
): node is ArticleTreeFolderNodeFixture {
  return node.kind === "folder";
}

function isArticleTreeLeafNode(
  node: ArticleTreeNodeFixture,
): node is ArticleTreeLeafNodeFixture {
  return node.kind === "article";
}

function ArticleTreeStatus({
  status,
}: ArticleTreeStatusProps): null | ReactElement {
  switch (status) {
    case "dirty":
      return <StatusDot className="bg-warning" label="Unsaved changes" />;
    case "draft":
      return <StatusDot className="bg-muted-foreground" label="Draft" />;
    case "invalid":
    case "missing-media":
      return (
        <span
          className="text-warning inline-flex items-center"
          title="Needs attention"
        >
          <AlertTriangle aria-hidden="true" />
          <span className="sr-only">Needs attention</span>
        </span>
      );
    case "published":
      return <StatusDot className="bg-success" label="Published" />;
    case undefined:
      return null;
  }
}

function StatusDot({
  className,
  label,
}: {
  className: string;
  label: string;
}): ReactElement {
  return (
    <span
      aria-label={label}
      className={cn("inline-flex size-2 shrink-0 rounded-full", className)}
      title={label}
    />
  );
}

function openArticleNode(
  onCommand: WorkspaceSidebarProps["onCommand"],
  articleId: ArticleTreeNodeFixture["articleId"],
): void {
  if (articleId === undefined) {
    onCommand("article.open");

    return;
  }

  onCommand("article.open", { articleId });
}

function SidebarButton({
  item,
  onCommand,
  state,
}: {
  item: SidebarNavItem;
  onCommand: WorkspaceSidebarProps["onCommand"];
  state: StudioAppState;
}): ReactElement {
  const Icon = item.icon;
  const selection = studioSidebarSelection(state);
  const selected = selection.kind === "nav" && selection.id === item.id;

  return (
    <button
      aria-current={selected ? "page" : undefined}
      className={cn(
        "focus-visible:outline-accent flex w-full min-w-0 items-center gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-2 [&_svg]:size-4 [&_svg]:shrink-0",
        selected
          ? "bg-accent-muted text-accent-foreground"
          : "text-foreground hover:bg-panel/70",
      )}
      data-selected={selected ? "true" : undefined}
      onClick={() => {
        if (item.commandId !== undefined) {
          onCommand(item.commandId);
        }
      }}
      type="button"
    >
      <Icon aria-hidden="true" />
      <span className="truncate">{item.label}</span>
      {item.id === "project-home" ? (
        <ChevronRight aria-hidden="true" className="ml-auto" />
      ) : null}
    </button>
  );
}

function StartupSidebarButton({
  item,
  onCommand,
  selected,
}: {
  item: SidebarNavItem;
  onCommand: WorkspaceSidebarProps["onCommand"];
  selected: boolean;
}): ReactElement {
  const Icon = item.icon;
  const disabled = item.commandId === undefined;

  return (
    <button
      aria-current={selected ? "page" : undefined}
      className={startupSidebarButtonClassName(selected, disabled)}
      data-selected={selected ? "true" : undefined}
      disabled={disabled}
      onClick={() => {
        if (item.commandId !== undefined) {
          onCommand(item.commandId);
        }
      }}
      title={item.disabledReason}
      type="button"
    >
      <Icon aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </button>
  );
}

function startupSidebarButtonClassName(
  selected: boolean,
  disabled: boolean,
): string {
  const stateClass = startupSidebarButtonStateClassName(selected, disabled);

  return cn(
    "focus-visible:outline-accent flex w-full min-w-0 items-center gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-2 [&_svg]:size-4 [&_svg]:shrink-0",
    stateClass,
  );
}

function startupSidebarButtonStateClassName(
  selected: boolean,
  disabled: boolean,
): string {
  if (selected) {
    return "bg-accent-muted text-accent-foreground";
  }

  if (disabled) {
    return "text-muted-foreground cursor-not-allowed opacity-65";
  }

  return "text-foreground hover:bg-panel/70";
}

function startupSelected(
  selection: StudioSidebarSelection,
  itemId: string,
): boolean {
  return selection.kind === "nav" && selection.id === itemId;
}
