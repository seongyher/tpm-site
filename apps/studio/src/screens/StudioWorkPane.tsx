import type { ReactElement } from "react";

import type { StudioCommandId } from "../commands/studio-commands";
import type { StudioMvpFixture } from "../models/studio-fixtures";
import type {
  StudioAppState,
  StudioCommandPayload,
} from "../state/studio-state";
import { ArticleDirectoryScreen } from "./ArticleDirectoryScreen";
import { ArticleEditorScreen } from "./ArticleEditorScreen";
import { MediaScreen } from "./MediaScreen";
import { ProjectHomeScreen } from "./ProjectHomeScreen";
import { PublishScreen } from "./PublishScreen";
import { RestoreScreen } from "./RestoreScreen";
import { SettingsScreen } from "./SettingsScreen";
import { FirstLaunchScreen, RecentProjectsScreen } from "./StartupScreens";

interface StudioWorkPaneProps {
  fixture: StudioMvpFixture;
  onCommand: (
    commandId: StudioCommandId,
    payload?: StudioCommandPayload,
  ) => void;
  state: StudioAppState;
}

/**
 * Routes fixture-backed Studio state to the active main work surface.
 *
 * @returns The active Studio work pane.
 */
export function StudioWorkPane({
  fixture,
  onCommand,
  state,
}: StudioWorkPaneProps): ReactElement {
  if (state.activeScreen === "article-directory") {
    return (
      <ArticleDirectoryScreen
        fixture={fixture}
        onCommand={onCommand}
        state={state}
      />
    );
  }

  if (state.activeScreen === "article-editor") {
    return (
      <ArticleEditorScreen
        fixture={fixture}
        onCommand={onCommand}
        state={state}
      />
    );
  }

  if (state.activeScreen === "first-launch") {
    return (
      <FirstLaunchScreen
        fixture={fixture}
        onCommand={onCommand}
        state={state}
      />
    );
  }

  if (state.activeScreen === "project-home") {
    return (
      <ProjectHomeScreen
        fixture={fixture}
        onCommand={onCommand}
        state={state}
      />
    );
  }

  if (state.activeScreen === "media") {
    return (
      <MediaScreen fixture={fixture} onCommand={onCommand} state={state} />
    );
  }

  if (state.activeScreen === "publish-preview") {
    return (
      <PublishScreen fixture={fixture} onCommand={onCommand} state={state} />
    );
  }

  if (state.activeScreen === "recent-projects") {
    return (
      <RecentProjectsScreen
        fixture={fixture}
        onCommand={onCommand}
        state={state}
      />
    );
  }

  if (state.activeScreen === "settings") {
    return (
      <SettingsScreen fixture={fixture} onCommand={onCommand} state={state} />
    );
  }

  return (
    <RestoreScreen fixture={fixture} onCommand={onCommand} state={state} />
  );
}
