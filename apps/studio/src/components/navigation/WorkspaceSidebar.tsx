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
  MoreHorizontal,
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
import type {
  StudioAppState,
  StudioCommandPayload,
} from "../../state/studio-state";
import { Badge } from "../ui/Badge";
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
  commandId: StudioCommandId;
  icon: LucideIcon;
  id: string;
  label: string;
}

interface ArticleTreeNodeProps {
  node: ArticleTreeNodeFixture;
  onCommand: WorkspaceSidebarProps["onCommand"];
  state: StudioAppState;
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
    commandId: "project.createSite",
    icon: FileText,
    id: "templates",
    label: "Templates",
  },
  {
    commandId: "commandPalette.open",
    icon: BookOpen,
    id: "learn",
    label: "Learn",
  },
  {
    commandId: "settings.open",
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
      <div className="border-border border-b px-4 py-4">
        <button
          className="text-foreground hover:bg-panel/70 focus-visible:outline-accent flex min-w-0 items-center gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-left text-sm font-semibold focus-visible:outline-2"
          type="button"
        >
          <span className="truncate">{workspace.displayName}</span>
          <ChevronDown aria-hidden="true" className="shrink-0" />
        </button>
      </div>
      <nav aria-label="Primary Studio sections" className="px-4 py-3">
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
        className="border-border min-h-0 flex-1 border-t px-4 py-3"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
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
        <ul className="m-0 flex list-none flex-col gap-1 overflow-auto p-0">
          {navigation.articleTree.map((node) => (
            <ArticleTreeNode
              key={node.id}
              node={node}
              onCommand={onCommand}
              state={state}
            />
          ))}
        </ul>
      </section>
      <div className="border-border border-t px-4 py-3">
        <button
          className="text-muted-foreground hover:bg-panel/70 focus-visible:outline-accent flex w-full items-center gap-3 rounded-[var(--radius-control)] px-2 py-2 text-left text-sm focus-visible:outline-2"
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
      <div className="border-border border-b px-4 py-4">
        <button
          className="text-foreground hover:bg-panel/70 focus-visible:outline-accent flex min-w-0 items-center gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-left text-sm font-semibold focus-visible:outline-2"
          type="button"
        >
          <Home aria-hidden="true" className="shrink-0" />
          <span className="truncate">Studio</span>
          <ChevronDown aria-hidden="true" className="shrink-0" />
        </button>
      </div>
      <nav aria-label="Startup sections" className="px-4 py-3">
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {startupItems.map((item) => (
            <li key={item.id}>
              <StartupSidebarButton
                item={item}
                onCommand={onCommand}
                selected={startupSelected(state, item.id)}
              />
            </li>
          ))}
        </ul>
      </nav>
      <section
        aria-label="Recent"
        className="border-border min-h-0 flex-1 border-t px-6 py-6"
      >
        <h2 className="text-muted-foreground text-xs font-semibold uppercase">
          Recent
        </h2>
        <p className="text-muted-foreground mt-5 max-w-40 text-center text-sm leading-6">
          Create a site or open an existing one.
        </p>
      </section>
      <div className="border-border border-t px-4 py-3">
        <button
          className="text-muted-foreground hover:bg-panel/70 focus-visible:outline-accent flex w-full items-center gap-3 rounded-[var(--radius-control)] px-2 py-2 text-left text-sm focus-visible:outline-2"
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
  state,
}: ArticleTreeNodeProps): ReactElement {
  if (node.kind === "folder") {
    return (
      <li>
        <div className="text-muted-foreground mb-1 flex items-center gap-2 px-2 py-1 text-sm">
          <ChevronDown aria-hidden="true" />
          <Folder aria-hidden="true" />
          <span className="truncate">{node.title}</span>
        </div>
        <ul className="m-0 flex list-none flex-col gap-1 p-0 pl-4">
          {(node.children ?? []).map((child) => (
            <ArticleTreeNode
              key={child.id}
              node={child}
              onCommand={onCommand}
              state={state}
            />
          ))}
        </ul>
      </li>
    );
  }

  const selected = state.activeArticleId === node.articleId;

  return (
    <li>
      <div
        className={cn(
          "group text-foreground flex min-w-0 items-center gap-2 rounded-[var(--radius-control)] px-2 py-2 text-sm",
          selected
            ? "bg-accent-muted text-accent-foreground"
            : "hover:bg-panel/70",
        )}
      >
        <FileText aria-hidden="true" className="shrink-0" />
        <button
          className="focus-visible:outline-accent min-w-0 flex-1 truncate text-left focus-visible:outline-2"
          onClick={() => openArticleNode(onCommand, node.articleId)}
          title={node.title}
          type="button"
        >
          {node.title}
        </button>
        <ArticleTreeStatus status={node.status} />
        <Tooltip content="Article actions">
          <IconButton
            aria-haspopup="menu"
            className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
            label={`Actions for ${node.title}`}
            variant="ghost"
          >
            <MoreHorizontal aria-hidden="true" />
          </IconButton>
        </Tooltip>
      </div>
    </li>
  );
}

function ArticleTreeStatus({
  status,
}: ArticleTreeStatusProps): null | ReactElement {
  switch (status) {
    case "dirty":
      return <Badge tone="warning">Unsaved</Badge>;
    case "draft":
      return <Badge tone="neutral">Draft</Badge>;
    case "invalid":
    case "missing-media":
      return (
        <span className="text-warning inline-flex items-center">
          <AlertTriangle aria-hidden="true" />
          <span className="sr-only">Needs attention</span>
        </span>
      );
    case "published":
      return <Badge tone="success">Live</Badge>;
    case undefined:
      return null;
  }
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
  const selected = selectedNavId(state) === item.id;

  return (
    <button
      className={cn(
        "focus-visible:outline-accent flex w-full min-w-0 items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2",
        selected
          ? "bg-accent-muted text-accent-foreground"
          : "text-foreground hover:bg-panel/70",
      )}
      onClick={() => onCommand(item.commandId)}
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

function selectedNavId(state: StudioAppState): string {
  switch (state.activeScreen) {
    case "article-directory":
    case "article-editor":
      return "articles";
    case "first-launch":
    case "project-home":
    case "recent-projects":
    case "restore":
      return "project-home";
    case "media":
      return "media";
    case "publish-preview":
      return "project-home";
    case "settings":
      return "settings";
  }
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

  return (
    <button
      className={cn(
        "focus-visible:outline-accent flex w-full min-w-0 items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2",
        selected
          ? "bg-accent-muted text-accent-foreground"
          : "text-foreground hover:bg-panel/70",
      )}
      onClick={() => onCommand(item.commandId)}
      type="button"
    >
      <Icon aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </button>
  );
}

function startupSelected(state: StudioAppState, itemId: string): boolean {
  if (
    itemId === "recent-projects" &&
    (state.activeScreen === "first-launch" ||
      state.activeScreen === "recent-projects")
  ) {
    return true;
  }

  return false;
}
