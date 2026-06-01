import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileImage,
  FolderOpen,
  Grid2X2,
  ImagePlus,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import {
  type ChangeEvent,
  type ReactElement,
  useEffect,
  useState,
} from "react";

import type { StudioCommandId } from "../commands/studio-commands";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Panel } from "../components/ui/Panel";
import { cn } from "../lib/cn";
import {
  type MediaLibraryViewItem,
  mediaLibraryViewModel,
  type StudioMvpFixture,
} from "../models/studio-fixtures";
import type {
  StudioAppState,
  StudioCommandPayload,
} from "../state/studio-state";

interface MediaScreenProps {
  fixture: StudioMvpFixture;
  onCommand: (
    commandId: StudioCommandId,
    payload?: StudioCommandPayload,
  ) => void;
  state: StudioAppState;
}

interface MediaMetadataDraft {
  readonly altText: string;
  readonly caption: string;
}

type MediaDisplayStatus = MediaLibraryViewItem["item"]["status"];

/**
 * Fixture-backed media browser and detail surface.
 *
 * @returns Media grid/list, selected media details, metadata draft fields, and insert action.
 */
export function MediaScreen({
  fixture,
  onCommand,
  state,
}: MediaScreenProps): ReactElement {
  const viewModel = mediaLibraryViewModel(fixture, state);
  const selectedItem = viewModel.selectedItem;
  const [metadataDraft, setMetadataDraft] = useState<MediaMetadataDraft>(() =>
    metadataDraftFromItem(selectedItem),
  );

  useEffect(() => {
    setMetadataDraft(metadataDraftFromItem(selectedItem));
  }, [selectedItem?.item.id]);

  return (
    <main className="min-h-full overflow-auto" data-testid="media-screen">
      <div className="grid min-h-full grid-cols-1 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="border-border min-w-0 border-r p-5 md:p-6">
          <MediaHeader />
          <MediaToolbar
            onCommand={onCommand}
            query={viewModel.query}
            viewMode={viewModel.viewMode}
          />
          <MediaCollection
            items={viewModel.items}
            onCommand={onCommand}
            selectedDisplayStatus={mediaDisplayStatus(
              selectedItem,
              metadataDraft,
            )}
            selectedMediaId={selectedItem?.item.id}
            viewMode={viewModel.viewMode}
          />
          <MediaEmptyState emptyState={viewModel.emptyState} />
        </section>
        <MediaDetailPane
          draft={metadataDraft}
          onCommand={onCommand}
          selectedItem={selectedItem}
          setDraft={setMetadataDraft}
          state={state}
        />
      </div>
    </main>
  );
}

function MediaHeader(): ReactElement {
  return (
    <header className="mb-5 flex flex-col gap-2">
      <p className="text-muted-foreground text-xs font-semibold uppercase">
        Media library
      </p>
      <h1 className="text-foreground text-2xl font-semibold">Media</h1>
      <p className="text-muted-foreground max-w-2xl text-sm leading-6">
        Browse images, repair image metadata, and insert selected media into the
        current article.
      </p>
    </header>
  );
}

function MediaToolbar({
  onCommand,
  query,
  viewMode,
}: {
  onCommand: MediaScreenProps["onCommand"];
  query: string;
  viewMode: "grid" | "list";
}): ReactElement {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
      <Button disabled>
        <Plus aria-hidden="true" />
        Add
      </Button>
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Search media</span>
        <Search
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <input
          className="border-border bg-panel text-foreground focus-visible:outline-accent h-10 w-full rounded-[var(--radius-control)] border py-2 pr-3 pl-9 text-sm focus-visible:outline-2"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onCommand("media.setSearch", {
              mediaQuery: event.currentTarget.value,
            })
          }
          placeholder="Search media..."
          type="search"
          value={query}
        />
      </label>
      <div
        aria-label="Media view"
        className="border-border bg-panel inline-flex rounded-[var(--radius-control)] border p-1"
        role="group"
      >
        <IconButton
          aria-pressed={viewMode === "grid"}
          label="Show media grid"
          onClick={() =>
            onCommand("media.setViewMode", { mediaViewMode: "grid" })
          }
          variant={viewMode === "grid" ? "secondary" : "ghost"}
        >
          <Grid2X2 aria-hidden="true" />
        </IconButton>
        <IconButton
          aria-pressed={viewMode === "list"}
          label="Show media list"
          onClick={() =>
            onCommand("media.setViewMode", { mediaViewMode: "list" })
          }
          variant={viewMode === "list" ? "secondary" : "ghost"}
        >
          <List aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  );
}

function MediaCollection({
  items,
  onCommand,
  selectedDisplayStatus,
  selectedMediaId,
  viewMode,
}: {
  items: readonly MediaLibraryViewItem[];
  onCommand: MediaScreenProps["onCommand"];
  selectedDisplayStatus: MediaDisplayStatus | undefined;
  selectedMediaId: string | undefined;
  viewMode: "grid" | "list";
}): ReactElement {
  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <MediaListItem
            displayStatus={
              item.item.id === selectedMediaId
                ? selectedDisplayStatus
                : undefined
            }
            item={item}
            key={item.item.id}
            onCommand={onCommand}
            selected={item.item.id === selectedMediaId}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4">
      {items.map((item) => (
        <MediaCard
          displayStatus={
            item.item.id === selectedMediaId ? selectedDisplayStatus : undefined
          }
          item={item}
          key={item.item.id}
          onCommand={onCommand}
          selected={item.item.id === selectedMediaId}
        />
      ))}
    </div>
  );
}

function MediaCard({
  displayStatus,
  item,
  onCommand,
  selected,
}: {
  displayStatus: MediaDisplayStatus | undefined;
  item: MediaLibraryViewItem;
  onCommand: MediaScreenProps["onCommand"];
  selected: boolean;
}): ReactElement {
  const media = item.item;

  return (
    <button
      aria-pressed={selected}
      className={cn(
        "focus-visible:outline-accent group bg-panel min-w-0 rounded-[var(--radius-panel)] border p-2 text-left transition-colors focus-visible:outline-2",
        selected
          ? "border-accent shadow-sm"
          : "border-border hover:border-accent/50 hover:bg-panel-muted",
      )}
      onClick={() => onCommand("media.open", { mediaId: media.id })}
      type="button"
    >
      <span className="border-border bg-panel-muted relative block overflow-hidden rounded-[var(--radius-control)] border">
        <img
          alt={media.altText.length > 0 ? media.altText : ""}
          className="aspect-[4/3] w-full object-cover"
          src={media.thumbnailUrl}
        />
        <MediaStatusBadge
          className="absolute top-2 right-2"
          status={displayStatus ?? item.item.status}
        />
      </span>
      <span className="text-foreground mt-2 block truncate text-sm font-medium">
        {media.displayName}
      </span>
      <span className="text-muted-foreground mt-1 block truncate text-xs">
        {mediaDimensionsLabel(media)}
      </span>
    </button>
  );
}

function MediaListItem({
  displayStatus,
  item,
  onCommand,
  selected,
}: {
  displayStatus: MediaDisplayStatus | undefined;
  item: MediaLibraryViewItem;
  onCommand: MediaScreenProps["onCommand"];
  selected: boolean;
}): ReactElement {
  const media = item.item;

  return (
    <button
      aria-pressed={selected}
      className={cn(
        "focus-visible:outline-accent bg-panel flex min-w-0 items-center gap-3 rounded-[var(--radius-control)] border p-2 text-left focus-visible:outline-2",
        selected ? "border-accent bg-accent-muted" : "border-border",
      )}
      onClick={() => onCommand("media.open", { mediaId: media.id })}
      type="button"
    >
      <img
        alt={media.altText.length > 0 ? media.altText : ""}
        className="border-border size-14 rounded-[var(--radius-control)] border object-cover"
        src={media.thumbnailUrl}
      />
      <span className="min-w-0 flex-1">
        <span className="text-foreground block truncate text-sm font-medium">
          {media.displayName}
        </span>
        <span className="text-muted-foreground mt-1 block truncate text-xs">
          {media.sourceRef.path}
        </span>
      </span>
      <MediaStatusBadge status={displayStatus ?? item.item.status} />
    </button>
  );
}

function MediaEmptyState({
  emptyState,
}: {
  emptyState: "loading" | "no-filter-results" | "no-media" | undefined;
}): null | ReactElement {
  if (emptyState === undefined) {
    return null;
  }

  const copy = mediaEmptyCopy(emptyState);

  return (
    <Panel className="mt-5 p-8 text-center">
      <FileImage
        aria-hidden="true"
        className="text-muted-foreground mx-auto size-10"
      />
      <h2 className="text-foreground mt-4 text-base font-semibold">
        {copy.title}
      </h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-6">
        {copy.description}
      </p>
    </Panel>
  );
}

function MediaDetailPane({
  draft,
  onCommand,
  selectedItem,
  setDraft,
  state,
}: {
  draft: MediaMetadataDraft;
  onCommand: MediaScreenProps["onCommand"];
  selectedItem: MediaLibraryViewItem | undefined;
  setDraft: (draft: MediaMetadataDraft) => void;
  state: StudioAppState;
}): ReactElement {
  if (selectedItem === undefined) {
    return <EmptyMediaDetail />;
  }

  const media = selectedItem.item;
  const missingAlt = draft.altText.trim().length === 0;
  const displayStatus = mediaDisplayStatus(selectedItem, draft) ?? media.status;
  const displayDiagnostic =
    displayStatus === media.status ? selectedItem.diagnostic : undefined;
  const insertDisabled = state.activeArticleId === undefined || missingAlt;

  return (
    <aside
      aria-label="Media details"
      className="border-border bg-panel min-w-0 border-t xl:border-t-0 xl:border-l"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-semibold uppercase">
              Media details
            </p>
            <h2 className="text-foreground mt-1 truncate text-base font-semibold">
              {media.displayName}
            </h2>
          </div>
          <IconButton label="More media actions">
            <MoreHorizontal aria-hidden="true" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-5">
          <img
            alt={draft.altText.trim().length > 0 ? draft.altText : ""}
            className="border-border bg-panel-muted aspect-[4/3] w-full rounded-[var(--radius-panel)] border object-cover"
            src={media.fullUrl}
          />
          <MediaDetailStatus
            diagnostic={displayDiagnostic}
            status={displayStatus}
          />
          <MetadataField
            helpText={
              missingAlt
                ? "Add useful alt text before inserting this image."
                : "Great. This image has descriptive alt text."
            }
            invalid={missingAlt}
            label="Alt text"
            onChange={(value) => setDraft({ ...draft, altText: value })}
            value={draft.altText}
          />
          <MetadataField
            label="Caption"
            onChange={(value) => setDraft({ ...draft, caption: value })}
            value={draft.caption}
          />
          <MediaFacts displayStatus={displayStatus} item={selectedItem} />
          <MediaUsageList item={selectedItem} />
        </div>
        <div className="border-border flex flex-wrap justify-end gap-2 border-t p-4">
          <Button
            disabled={insertDisabled}
            onClick={() =>
              onCommand("media.insertSelected", {
                mediaAltText: draft.altText,
                mediaCaption: draft.caption,
                mediaId: media.id,
              })
            }
            variant="primary"
          >
            <ImagePlus aria-hidden="true" />
            Insert into article
          </Button>
          <Button disabled>
            <Upload aria-hidden="true" />
            Replace
          </Button>
          <Button disabled>
            <FolderOpen aria-hidden="true" />
            Reveal
          </Button>
          <IconButton label="Copy media reference">
            <Copy aria-hidden="true" />
          </IconButton>
        </div>
      </div>
    </aside>
  );
}

function MediaDetailStatus({
  diagnostic,
  status,
}: {
  diagnostic: MediaLibraryViewItem["diagnostic"] | undefined;
  status: MediaDisplayStatus;
}): null | ReactElement {
  if (diagnostic === undefined && status === "ready") {
    return (
      <div className="text-success mt-4 flex items-center gap-2 text-sm">
        <CheckCircle2 aria-hidden="true" className="size-4" />
        Ready to use
      </div>
    );
  }

  return (
    <Panel className="border-warning bg-warning-muted mt-4 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle aria-hidden="true" className="text-warning mt-0.5" />
        <div className="min-w-0">
          <p className="text-foreground text-sm font-medium">
            {diagnostic?.message ?? "This image needs attention."}
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

function MetadataField({
  helpText,
  invalid = false,
  label,
  onChange,
  value,
}: {
  helpText?: string;
  invalid?: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}): ReactElement {
  const id = `media-${label.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <label className="mt-5 flex flex-col gap-2" htmlFor={id}>
      <span className="text-foreground text-sm font-medium">{label}</span>
      <textarea
        aria-describedby={helpText === undefined ? undefined : `${id}-help`}
        aria-invalid={invalid}
        className={cn(
          "border-border bg-panel text-foreground focus-visible:outline-accent min-h-10 rounded-[var(--radius-control)] border px-3 py-2 text-sm leading-6 focus-visible:outline-2",
          invalid && "border-warning focus-visible:outline-warning",
          label === "Caption" && "min-h-20",
        )}
        id={id}
        onChange={(event) => onChange(event.currentTarget.value)}
        value={value}
      />
      {helpText === undefined ? null : (
        <span
          className={cn(
            "text-xs leading-5",
            invalid ? "text-warning" : "text-muted-foreground",
          )}
          id={`${id}-help`}
        >
          {helpText}
        </span>
      )}
    </label>
  );
}

function MediaFacts({
  displayStatus,
  item,
}: {
  displayStatus: MediaDisplayStatus;
  item: MediaLibraryViewItem;
}): ReactElement {
  const media = item.item;

  return (
    <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
      <MediaFact label="Dimensions" value={mediaDimensionsLabel(media)} />
      <MediaFact label="Size" value={media.fileSizeLabel ?? "Unknown"} />
      <MediaFact label="Type" value={media.kind} />
      <MediaFact label="Status" value={displayStatus.replaceAll("-", " ")} />
    </dl>
  );
}

function MediaFact({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactElement {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-foreground mt-1 truncate font-medium">{value}</dd>
    </div>
  );
}

function MediaUsageList({
  item,
}: {
  item: MediaLibraryViewItem;
}): ReactElement {
  return (
    <section className="mt-6">
      <h3 className="text-foreground text-sm font-semibold">Used in</h3>
      {item.item.usage.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-sm">
          This image is not used by any article in the fixture.
        </p>
      ) : (
        <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
          {item.item.usage.map((usage) => (
            <li className="flex min-w-0 items-start gap-3" key={usage.title}>
              <FileImage
                aria-hidden="true"
                className="text-muted-foreground mt-0.5 size-4"
              />
              <span className="min-w-0 flex-1">
                <span className="text-foreground block truncate text-sm font-medium">
                  {usage.title}
                </span>
                <span className="text-muted-foreground mt-1 block truncate text-xs">
                  {usage.locationLabel}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyMediaDetail(): ReactElement {
  return (
    <aside
      aria-label="Media details"
      className="border-border bg-panel border-t p-6 xl:border-t-0 xl:border-l"
    >
      <div className="text-muted-foreground flex min-h-72 flex-col items-center justify-center text-center text-sm">
        <FileImage aria-hidden="true" className="mb-3 size-10" />
        Select an image to inspect metadata and usage.
      </div>
    </aside>
  );
}

function MediaStatusBadge({
  className,
  status,
}: {
  className?: string;
  status: MediaDisplayStatus;
}): null | ReactElement {
  switch (status) {
    case "missing":
      return (
        <Badge className={className} tone="danger">
          Missing
        </Badge>
      );
    case "missing-alt":
      return (
        <Badge className={className} tone="warning">
          Missing alt
        </Badge>
      );
    case "ready":
      return null;
    case "unsupported":
      return (
        <Badge className={className} tone="warning">
          Unsupported
        </Badge>
      );
  }
}

function mediaDimensionsLabel(item: MediaLibraryViewItem["item"]): string {
  return item.dimensions === undefined
    ? "Unknown dimensions"
    : `${item.dimensions.width} x ${item.dimensions.height}`;
}

function mediaEmptyCopy(
  emptyState: "loading" | "no-filter-results" | "no-media",
): {
  readonly description: string;
  readonly title: string;
} {
  switch (emptyState) {
    case "loading":
      return {
        description: "Studio is preparing the media library fixture.",
        title: "Loading media",
      };
    case "no-filter-results":
      return {
        description: "Try a different filename, alt text, caption, or usage.",
        title: "No media matches this search",
      };
    case "no-media":
      return {
        description: "Add images before inserting media into articles.",
        title: "No media yet",
      };
  }
}

function metadataDraftFromItem(
  item: MediaLibraryViewItem | undefined,
): MediaMetadataDraft {
  return {
    altText: item?.item.altText ?? "",
    caption: item?.item.caption ?? "",
  };
}

function mediaDisplayStatus(
  item: MediaLibraryViewItem | undefined,
  draft: MediaMetadataDraft,
): MediaDisplayStatus | undefined {
  if (item === undefined) {
    return undefined;
  }

  return item.item.status === "missing-alt" && draft.altText.trim().length > 0
    ? "ready"
    : item.item.status;
}
