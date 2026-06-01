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
      className="min-h-full overflow-auto p-5 md:p-6"
      data-testid="settings-screen"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <SettingsHeader
          settingsState={effectiveState}
          workspaceName={fixture.workspace.displayName}
        />
        <SettingsStateBanner
          diagnostics={viewModel.diagnostics}
          settingsState={effectiveState}
        />
        <div className="grid min-w-0 gap-5 xl:grid-cols-[16rem_minmax(0,1fr)]">
          <SettingsSectionNav
            activeSectionId={viewModel.activeSection.id}
            onCommand={onCommand}
            sections={viewModel.sections}
          />
          <Panel className="min-w-0 p-5 md:p-6">
            <SettingsSectionHeader section={viewModel.activeSection} />
            <div className="mt-5">
              <DescriptorForm
                diagnostics={viewModel.diagnostics}
                draftValues={draftValues}
                mediaItems={fixture.media.items}
                sections={[viewModel.activeSection]}
                setDraftValues={setDraftValues}
              />
            </div>
            <AdvancedSettingsDisclosure />
          </Panel>
        </div>
      </div>
    </main>
  );
}

function SettingsHeader({
  settingsState,
  workspaceName,
}: {
  settingsState: EffectiveSettingsState;
  workspaceName: string;
}): ReactElement {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-semibold uppercase">
          Project settings
        </p>
        <h1 className="text-foreground mt-2 text-2xl font-semibold">
          Settings
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Update site details for {workspaceName}.
        </p>
      </div>
      <SettingsStateBadge settingsState={settingsState} />
    </header>
  );
}

function SettingsStateBanner({
  diagnostics,
  settingsState,
}: {
  diagnostics: readonly DiagnosticFixture[];
  settingsState: EffectiveSettingsState;
}): ReactElement {
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
    <Panel as="aside" className="min-w-0 p-2" variant="plain">
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
        "focus-visible:outline-accent flex w-full min-w-0 items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-2",
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
    <header className="border-border border-b pb-4">
      <p className="text-muted-foreground text-xs font-semibold uppercase">
        {section.label}
      </p>
      <h2 className="text-foreground mt-2 text-xl font-semibold">
        {settingsSectionTitle(section)}
      </h2>
      <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
        {settingsSectionDescription(section)}
      </p>
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
          The fixture does not include a settings scenario for this screen.
        </p>
      </Panel>
    </main>
  );
}

function SettingsStateBadge({
  settingsState,
}: {
  settingsState: EffectiveSettingsState;
}): ReactElement {
  switch (settingsState) {
    case "autosaving":
      return <Badge tone="warning">Autosaving</Badge>;
    case "dirty":
      return <Badge tone="warning">Unsaved changes</Badge>;
    case "invalid":
      return <Badge tone="danger">Needs attention</Badge>;
    case "saved":
      return <Badge tone="success">All changes saved</Badge>;
  }
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
          "Your settings changes are staged locally in this prototype.",
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

function settingsSectionDescription(section: FieldSectionFixture): string {
  switch (section.id) {
    case "authors":
      return "Choose default author behavior for new articles and article pages.";
    case "categories":
      return "Set the default taxonomy choices readers use to browse the site.";
    case "domain":
      return "Control the public URL used for canonical links, feeds, and publishing.";
    case "homepage":
      return "Choose the introductory copy and featured collection for the site home page.";
    case "navigation":
      return "Decide which top-level destinations appear in reader navigation.";
    case "publishing":
      return "Choose the publish target and preview safety defaults.";
    case "site-identity":
      return "Set the basic name and summary used across the site and social previews.";
    case "social-support":
      return "Add reader support and social identity links without editing code.";
    case "theme":
      return "Choose simple visual defaults that stay within the supported theme system.";
    default:
      return "Edit supported project settings for this section.";
  }
}
