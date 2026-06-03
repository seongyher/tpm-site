import {
  AlertTriangle,
  ChevronDown,
  FileText,
  Globe2,
  Heart,
  Home,
  List,
  type LucideIcon,
  Palette,
  Send,
  Settings,
  Tags,
  UserRound,
} from "lucide-react";
import { type ReactElement, useEffect, useState } from "react";

import type { StudioCommandId } from "../commands/studio-commands";
import { AutosaveIndicator } from "../components/feedback/AutosaveIndicator";
import {
  DescriptorForm,
  type DraftFieldValues,
} from "../components/forms/DescriptorForm";
import { Badge } from "../components/ui/Badge";
import { Panel } from "../components/ui/Panel";
import { cn } from "../lib/cn";
import {
  type DiagnosticFixture,
  type FieldSectionFixture,
  type SettingsFixture,
  settingsViewModel,
  type StudioMvpFixture,
} from "../models/studio-fixtures";
import type {
  StudioAppState,
  StudioCommandPayload,
} from "../state/studio-state";

interface SettingsScreenProps {
  fixture: StudioMvpFixture;
  onCommand: (
    commandId: StudioCommandId,
    payload?: StudioCommandPayload,
  ) => void;
  state: StudioAppState;
}

type EffectiveSettingsState = SettingsFixture["state"];

const settingsSectionIcons: Record<string, LucideIcon> = {
  authors: UserRound,
  categories: Tags,
  domain: Globe2,
  homepage: Home,
  navigation: List,
  publishing: Send,
  "site-identity": FileText,
  "social-support": Heart,
  theme: Palette,
};

/**
 * Fixture-backed project settings surface rendered from field descriptors.
 *
 * @returns Section navigation, descriptor-backed settings form, and autosave state.
 */
export function SettingsScreen({
  fixture,
  onCommand,
  state,
}: SettingsScreenProps): ReactElement {
  const viewModel = settingsViewModel(fixture, state);
  const [draftValues, setDraftValues] = useState<DraftFieldValues>(
    () => new Map(),
  );

  useEffect(() => {
    setDraftValues(new Map());
  }, [viewModel?.settings.id, viewModel?.activeSection.id]);

  if (viewModel === undefined) {
    return <MissingSettingsScreen />;
  }

  const effectiveState =
    draftValues.size > 0 && viewModel.settings.state !== "invalid"
      ? "dirty"
      : viewModel.settings.state;

  return (
    <main
      className="min-h-full overflow-auto p-4 md:p-5"
      data-testid="settings-screen"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <SettingsStateNotice
          diagnostics={viewModel.diagnostics}
          settingsState={effectiveState}
        />
        <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <SettingsSectionNav
            activeSectionId={viewModel.activeSection.id}
            onCommand={onCommand}
            sections={viewModel.sections}
          />
          <Panel className="min-w-0 p-4 md:p-5">
            <SettingsSectionHeader section={viewModel.activeSection} />
            <div className="mt-4">
              <DescriptorForm
                diagnostics={viewModel.diagnostics}
                draftValues={draftValues}
                mediaItems={fixture.media.items}
                sections={[viewModel.activeSection]}
                setDraftValues={setDraftValues}
                showSectionHeadings={false}
              />
            </div>
            <AdvancedSettingsDisclosure />
          </Panel>
        </div>
      </div>
    </main>
  );
}

function SettingsStateNotice({
  diagnostics,
  settingsState,
}: {
  diagnostics: readonly DiagnosticFixture[];
  settingsState: EffectiveSettingsState;
}): null | ReactElement {
  if (settingsState === "saved") {
    return null;
  }

  const diagnostic = diagnostics[0];
  const copy = settingsStateCopy(settingsState, diagnostic);

  return (
    <Panel className={cn("p-4", settingsStateBannerClass(settingsState))}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5">
          <AutosaveIndicator label={copy.label} state={copy.indicatorState} />
        </span>
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm leading-6">
            {copy.description}
          </p>
          {diagnostic?.remediation === undefined ? null : (
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              {diagnostic.remediation}
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
}

function SettingsSectionNav({
  activeSectionId,
  onCommand,
  sections,
}: {
  activeSectionId: string;
  onCommand: SettingsScreenProps["onCommand"];
  sections: readonly FieldSectionFixture[];
}): ReactElement {
  return (
    <Panel as="aside" className="min-w-0 self-start p-1.5" variant="plain">
      <nav aria-label="Settings sections">
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {sections.map((section) => (
            <li key={section.id}>
              <SettingsSectionButton
                active={section.id === activeSectionId}
                onCommand={onCommand}
                section={section}
              />
            </li>
          ))}
        </ul>
      </nav>
    </Panel>
  );
}

function SettingsSectionButton({
  active,
  onCommand,
  section,
}: {
  active: boolean;
  onCommand: SettingsScreenProps["onCommand"];
  section: FieldSectionFixture;
}): ReactElement {
  const Icon = settingsSectionIcons[section.id] ?? Settings;
  const hasInvalidField = section.fields.some(
    (field) => field.validation.status === "invalid",
  );
  const hasDraftValue = section.fields.some(
    (field) => field.draftValue !== undefined,
  );

  return (
    <button
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-visible:outline-accent flex w-full min-w-0 items-center gap-2 rounded-[var(--radius-control)] px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-2 [&_svg]:size-4 [&_svg]:shrink-0",
        active
          ? "bg-accent-muted text-accent-foreground"
          : "text-foreground hover:bg-panel-muted",
      )}
      onClick={() =>
        onCommand("settings.open", { settingsSectionId: section.id })
      }
      type="button"
    >
      <Icon aria-hidden="true" className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{section.label}</span>
      {hasInvalidField ? <Badge tone="danger">Fix</Badge> : null}
      {!hasInvalidField && hasDraftValue ? (
        <Badge tone="warning">Unsaved</Badge>
      ) : null}
    </button>
  );
}

function SettingsSectionHeader({
  section,
}: {
  section: FieldSectionFixture;
}): ReactElement {
  return (
    <header className="border-border border-b pb-3">
      <h1 className="text-foreground text-lg font-semibold">
        {settingsSectionTitle(section)}
      </h1>
    </header>
  );
}

function AdvancedSettingsDisclosure(): ReactElement {
  return (
    <details className="border-border bg-panel-muted mt-6 rounded-[var(--radius-panel)] border p-4">
      <summary className="text-foreground flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
        Advanced options
        <ChevronDown aria-hidden="true" className="shrink-0" />
      </summary>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        Custom routes, redirects, provider details, and source-only options will
        appear here when they are available for this project.
      </p>
    </details>
  );
}

function MissingSettingsScreen(): ReactElement {
  return (
    <main className="min-h-full overflow-auto p-6">
      <Panel className="mx-auto max-w-xl p-8 text-center">
        <AlertTriangle
          aria-hidden="true"
          className="text-warning mx-auto size-10"
        />
        <h1 className="text-foreground mt-4 text-xl font-semibold">
          Settings are unavailable
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Studio could not resolve settings for this screen.
        </p>
      </Panel>
    </main>
  );
}

function settingsStateCopy(
  settingsState: EffectiveSettingsState,
  diagnostic: DiagnosticFixture | undefined,
): {
  description: string;
  indicatorState: "dirty" | "failed" | "saved" | "saving";
  label: string;
} {
  switch (settingsState) {
    case "autosaving":
      return {
        description: "Saving settings automatically.",
        indicatorState: "saving",
        label: "Saving settings",
      };
    case "dirty":
      return {
        description:
          "Changes will save automatically when the section is valid.",
        indicatorState: "dirty",
        label: "Unsaved settings changes",
      };
    case "invalid":
      return {
        description:
          diagnostic?.message ?? "Fix highlighted settings before publishing.",
        indicatorState: "failed",
        label: "1 setting needs attention",
      };
    case "saved":
      return {
        description: "Last saved just now.",
        indicatorState: "saved",
        label: "Settings saved automatically",
      };
  }
}

function settingsStateBannerClass(state: EffectiveSettingsState): string {
  switch (state) {
    case "autosaving":
    case "dirty":
      return "border-warning bg-warning-muted";
    case "invalid":
      return "border-danger bg-danger-muted";
    case "saved":
      return "border-success bg-success-muted";
  }
}

function settingsSectionTitle(section: FieldSectionFixture): string {
  switch (section.id) {
    case "homepage":
      return "Home page";
    case "theme":
      return "Theme basics";
    default:
      return section.label;
  }
}
