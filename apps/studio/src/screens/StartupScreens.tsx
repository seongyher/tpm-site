import {
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import type { ReactElement } from "react";

import type { StudioCommandId } from "../commands/studio-commands";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Panel } from "../components/ui/Panel";
import { Tooltip } from "../components/ui/Tooltip";
import type {
  RecentProjectFixture,
  StudioMvpFixture,
} from "../models/studio-fixtures";
import type {
  StudioAppState,
  StudioCommandPayload,
} from "../state/studio-state";

interface StartupScreenProps {
  fixture: StudioMvpFixture;
  onCommand: (
    commandId: StudioCommandId,
    payload?: StudioCommandPayload,
  ) => void;
  state: StudioAppState;
}

/**
 * First-launch screen for a user with no selected site.
 *
 * @returns A centered non-technical startup panel.
 */
export function FirstLaunchScreen({
  onCommand,
}: StartupScreenProps): ReactElement {
  return (
    <main className="grid min-h-full overflow-auto p-6">
      <Panel className="m-auto w-full max-w-2xl p-10 text-center">
        <div className="bg-accent text-panel mx-auto grid size-14 place-items-center rounded-[var(--radius-control)]">
          <FolderOpen aria-hidden="true" />
        </div>
        <p className="text-muted-foreground mt-6 text-sm font-semibold">
          Studio
        </p>
        <h1 className="text-foreground mt-3 text-3xl font-semibold">
          Welcome to Studio
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-6">
          Create a site or open an existing one to get started.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            onClick={() => onCommand("project.createSite")}
            variant="primary"
          >
            <Plus aria-hidden="true" />
            Create site
          </Button>
          <Button onClick={() => onCommand("project.openSite")}>
            <FolderOpen aria-hidden="true" />
            Open site
          </Button>
        </div>
        <p className="text-muted-foreground mt-6 text-sm">
          You can publish later after connecting Cloudflare.
        </p>
      </Panel>
    </main>
  );
}

/**
 * Recent-project and restore-failure screen for returning users.
 *
 * @returns A fixture-backed recent project recovery surface.
 */
export function RecentProjectsScreen({
  fixture,
  onCommand,
  state,
}: StartupScreenProps): ReactElement {
  const recentProjects = visibleRecentProjects(fixture, state);
  const restoreFailed = state.restoreStatus === "project-missing";

  return (
    <main className="min-h-full overflow-auto p-6 md:p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-foreground text-3xl font-semibold">
              Recent Projects
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Pick up where you left off.
            </p>
          </div>
          <Button
            onClick={() => onCommand("project.createSite")}
            variant="primary"
          >
            <Plus aria-hidden="true" />
            Create new site
          </Button>
        </header>

        {restoreFailed ? (
          <Panel className="border-warning bg-warning-muted p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                aria-hidden="true"
                className="text-warning mt-0.5 shrink-0"
              />
              <div className="min-w-0">
                <h2 className="text-foreground text-sm font-semibold">
                  We could not find this site folder.
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Locate it to continue, or remove it from your recent list.
                </p>
              </div>
            </div>
          </Panel>
        ) : null}

        <Panel className="overflow-hidden">
          <div className="border-border text-muted-foreground grid grid-cols-[minmax(0,1fr)_9rem_8rem_8rem] gap-4 border-b px-5 py-3 text-sm font-semibold max-lg:hidden">
            <span>Project</span>
            <span>Last opened</span>
            <span>Status</span>
            <span className="sr-only">Actions</span>
          </div>
          <ul className="divide-border m-0 list-none divide-y p-0">
            {recentProjects.map((project) => (
              <RecentProjectRow
                key={project.id}
                onCommand={onCommand}
                project={project}
              />
            ))}
          </ul>
        </Panel>
      </div>
    </main>
  );
}

function RecentProjectRow({
  onCommand,
  project,
}: {
  onCommand: StartupScreenProps["onCommand"];
  project: RecentProjectFixture;
}): ReactElement {
  const missing = project.status !== "available";

  return (
    <li
      className={
        missing
          ? "border-warning bg-warning-muted/65 border-l-4"
          : "bg-panel border-l-4 border-transparent"
      }
    >
      <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_9rem_8rem_8rem] lg:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <span className="bg-accent-muted text-accent-foreground grid size-11 shrink-0 place-items-center rounded-[var(--radius-control)] text-sm font-semibold">
            {projectInitials(project.displayName)}
          </span>
          <div className="min-w-0">
            <h2 className="text-foreground truncate text-sm font-semibold">
              {project.displayName}
            </h2>
            <p className="text-muted-foreground mt-1 truncate text-sm">
              {project.rootDisplayPath}
            </p>
            {missing ? (
              <p className="text-warning mt-2 text-sm font-medium">
                We could not find this site folder. Locate it to continue.
              </p>
            ) : null}
          </div>
        </div>
        <span className="text-muted-foreground text-sm">
          {project.lastOpenedLabel}
        </span>
        <ProjectStatusBadge status={project.status} />
        <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
          {missing ? (
            <>
              <Button
                onClick={() =>
                  onCommand("recovery.locateProject", {
                    recentProjectId: project.id,
                  })
                }
                size="sm"
                variant="secondary"
              >
                Locate
              </Button>
              <Button
                onClick={() =>
                  onCommand("recovery.removeRecent", {
                    recentProjectId: project.id,
                  })
                }
                size="sm"
                variant="secondary"
              >
                Remove
              </Button>
            </>
          ) : (
            <Button
              onClick={() =>
                onCommand("project.openSite", { recentProjectId: project.id })
              }
              size="sm"
              variant="secondary"
            >
              Open
            </Button>
          )}
          <Tooltip content="More options">
            <IconButton label={`More options for ${project.displayName}`}>
              {missing ? (
                <Trash2 aria-hidden="true" />
              ) : (
                <MoreHorizontal aria-hidden="true" />
              )}
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </li>
  );
}

function ProjectStatusBadge({
  status,
}: {
  status: RecentProjectFixture["status"];
}): ReactElement {
  switch (status) {
    case "available":
      return (
        <Badge tone="success">
          <CheckCircle2 aria-hidden="true" />
          Available
        </Badge>
      );
    case "missing":
    case "unavailable":
      return (
        <Badge tone="warning">
          <AlertTriangle aria-hidden="true" />
          Unavailable
        </Badge>
      );
  }
}

function projectInitials(displayName: string): string {
  const words = displayName
    .split(" ")
    .filter((word) => word.trim().length > 0)
    .slice(0, 2);

  return words.map((word) => word.charAt(0).toUpperCase()).join("");
}

function visibleRecentProjects(
  fixture: StudioMvpFixture,
  state: StudioAppState,
): readonly RecentProjectFixture[] {
  const dismissed = new Set(state.dismissedRecentProjectIds ?? []);

  return fixture.workspace.recentProjects.filter(
    (project) => !dismissed.has(project.id),
  );
}
