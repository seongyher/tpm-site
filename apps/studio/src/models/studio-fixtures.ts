/** Operation-shaped schema version for Studio GUI MVP fixtures. */
export const STUDIO_MVP_FIXTURE_SCHEMA_VERSION =
  "studio-gui-mvp.fixture.v1" as const;

/** All fixture screen-state IDs required before the GUI MVP can render. */
export const STUDIO_MVP_REQUIRED_SCREEN_STATE_IDS = [
  "first-launch",
  "recent-projects",
  "restore-failure",
  "project-home",
  "article-directory-populated",
  "article-directory-filtered",
  "article-directory-search-results",
  "article-directory-no-results",
  "article-directory-empty",
  "article-editor-clean",
  "article-editor-dirty",
  "article-editor-invalid",
  "article-editor-unsupported-body",
  "media-browser",
  "media-selected",
  "media-missing-alt",
  "settings-saved",
  "settings-dirty",
  "settings-invalid",
  "preview-ready",
  "preview-stale",
  "preview-loading",
  "preview-blocked",
  "preview-failed",
  "publish-preview",
  "publish-confirm",
  "publish-progress",
  "publish-success",
  "publish-blocked",
  "publish-failed",
  "restore-checkpoints",
  "restore-confirm",
  "restore-restored",
  "restore-unavailable",
] as const;

/** Known operation families that future Rust/Tauri commands will own. */
export type StudioOperationFamily =
  | "credentials.inspect"
  | "editor.document"
  | "editor.patch"
  | "editor.validate"
  | "history.checkpoints"
  | "history.restore"
  | "media.patch"
  | "media.resolve"
  | "preview.route"
  | "providers.inspect"
  | "publish.apply"
  | "publish.plan"
  | "session.restore"
  | "source.inventory"
  | "workspace.discover";

/** Screen identifiers used by the fixture-backed Studio GUI. */
export type StudioScreen =
  | "article-directory"
  | "article-editor"
  | "first-launch"
  | "media"
  | "project-home"
  | "publish-preview"
  | "recent-projects"
  | "restore"
  | "settings";

/** Reusable panel state for sidebar, editor properties, and preview panes. */
export interface PanelStateFixture {
  /** Optional fixed pixel size for desktop visual fixtures. */
  readonly sizePx?: number;
  /** Whether the panel participates in the visible workspace layout. */
  readonly visibility: "hidden" | "visible";
}

/** Stable reference to authored source, generated artifact, or operation data. */
export interface SourceReferenceFixture {
  /** Optional source collection name when the path belongs to authored content. */
  readonly collection?: string;
  /** Optional field path used by diagnostics and field descriptors. */
  readonly fieldPath?: string;
  /** Source-reference kind. */
  readonly kind: "artifact" | "operation" | "source";
  /** Stable project-relative display path or operation payload path. */
  readonly path: string;
}

/** Provider/capability summary without provider-specific implementation data. */
export interface ProviderSummaryFixture {
  /** Stable capability names exposed by this provider. */
  readonly capabilities: readonly string[];
  /** Provider family owned by the adapter runtime. */
  readonly family:
    | "build"
    | "deploy"
    | "diagnostics"
    | "history"
    | "identity"
    | "media"
    | "observability"
    | "source"
    | "workflow";
  /** Stable provider ID. */
  readonly id: string;
  /** Human-facing provider label. */
  readonly label: string;
  /** Current provider availability for this fixture. */
  readonly status:
    | "available"
    | "degraded"
    | "requires-credentials"
    | "unavailable";
}

/** Non-secret credential reference and verification state. */
export interface CredentialFixture {
  /** Stable credential reference ID. */
  readonly id: string;
  /** Human-facing credential label. */
  readonly label: string;
  /** Optional ISO timestamp for the last non-secret verification. */
  readonly lastVerifiedAt?: string;
  /** Provider this credential belongs to. */
  readonly providerId: string;
  /** Non-secret scopes reported for planning and diagnostics. */
  readonly scopes: readonly string[];
  /** Credential verification state. */
  readonly state:
    | "connected"
    | "expired"
    | "insufficient-scope"
    | "missing"
    | "provider-unreachable"
    | "revoked";
}

/** Actionable author-facing diagnostic used by fixture screens. */
export interface DiagnosticFixture {
  /** Whether the diagnostic blocks the current action. */
  readonly blocksAction: boolean;
  /** Stable diagnostic code. */
  readonly code: string;
  /** Optional source or artifact location. */
  readonly location?: SourceReferenceFixture;
  /** Author-facing summary. */
  readonly message: string;
  /** Optional command ID for a safe next action. */
  readonly nextActionId?: string;
  /** Optional concrete recovery instruction. */
  readonly remediation?: string;
  /** Diagnostic severity. */
  readonly severity: "error" | "note" | "warning";
}

/** Workspace summary used by all fixture states. */
export interface WorkspaceFixture {
  /** User-facing site name. */
  readonly displayName: string;
  /** Stable project/workspace ID. */
  readonly id: string;
  /** Provider summaries grouped by adapter family. */
  readonly providers: {
    readonly build: ProviderSummaryFixture;
    readonly deploy: ProviderSummaryFixture;
    readonly diagnostics: ProviderSummaryFixture;
    readonly history: ProviderSummaryFixture;
    readonly identity: ProviderSummaryFixture;
    readonly media: ProviderSummaryFixture;
    readonly observability: ProviderSummaryFixture;
    readonly source: ProviderSummaryFixture;
    readonly workflow: ProviderSummaryFixture;
  };
  /** Optional public URL for preview and publish flows. */
  readonly publicUrl?: string;
  /** Recently opened project records for startup screens. */
  readonly recentProjects: readonly RecentProjectFixture[];
  /** Friendly local path shown to the user. */
  readonly rootDisplayPath: string;
  /** Workspace readiness summary. */
  readonly status: "blocked" | "dirty" | "ready" | "unavailable";
}

/** Recent project state for startup and recovery surfaces. */
export interface RecentProjectFixture {
  /** Human-facing project name. */
  readonly displayName: string;
  /** Stable recent-project ID. */
  readonly id: string;
  /** Human-readable last-opened label. */
  readonly lastOpenedLabel: string;
  /** Last known display path. */
  readonly rootDisplayPath: string;
  /** Whether this project path can be opened. */
  readonly status: "available" | "missing" | "unavailable";
}

/** Restored app session state for exact-resume scenarios. */
export interface StudioSessionFixture {
  /** Active article ID for editor states. */
  readonly activeArticleId?: string;
  /** Active article directory scenario. */
  readonly activeDirectoryScenarioId?: string;
  /** Active media ID for media states. */
  readonly activeMediaId?: string;
  /** Active preview scenario. */
  readonly activePreviewScenarioId?: string;
  /** Active project ID when a project is loaded. */
  readonly activeProjectId?: string;
  /** Active publish scenario. */
  readonly activePublishScenarioId?: string;
  /** Active restore scenario. */
  readonly activeRestoreScenarioId?: string;
  /** Active screen for the fixture state. */
  readonly activeScreen: StudioScreen;
  /** Active settings section for settings states. */
  readonly activeSettingsSectionId?: string;
  /** Optional editor cursor and scroll state. */
  readonly editor?: EditorSessionStateFixture;
  /** Stable scenario ID. */
  readonly id: string;
  /** ISO timestamp for the restore attempt. */
  readonly lastRestoredAt: string;
  /** Preview pane state at restore. */
  readonly previewPane: PanelStateFixture;
  /** Restore result state. */
  readonly restoreStatus: "failed" | "partial" | "project-missing" | "restored";
  /** Sidebar state at restore. */
  readonly sidebar: PanelStateFixture;
}

/** Screen-state registry entry that maps visible screens to fixture data. */
export interface StudioScreenStateFixture {
  /** Stable screen-state ID. */
  readonly id: (typeof STUDIO_MVP_REQUIRED_SCREEN_STATE_IDS)[number];
  /** Human-facing state label for tests and documentation. */
  readonly label: string;
  /** Operation families this screen should eventually call. */
  readonly operationFamilies: readonly StudioOperationFamily[];
  /** Screen rendered by this fixture. */
  readonly screen: StudioScreen;
  /** Session scenario that owns panel and restore state. */
  readonly sessionId: string;
}

/** Sidebar and article-tree navigation state. */
export interface NavigationFixture {
  /** Article tree shown in the sidebar. */
  readonly articleTree: readonly ArticleTreeNodeFixture[];
  /** Primary app navigation items. */
  readonly primaryItems: readonly NavigationItemFixture[];
}

/** Primary app navigation item. */
export interface NavigationItemFixture {
  /** Command used when selected. */
  readonly commandId: string;
  /** Stable navigation ID. */
  readonly id: string;
  /** Human-facing label. */
  readonly label: string;
  /** Target screen. */
  readonly screen: StudioScreen;
}

/** Article tree node used by the sidebar browser. */
export interface ArticleTreeNodeFixture {
  /** Article ID when the node represents an article. */
  readonly articleId?: string;
  /** Child nodes for folder entries. */
  readonly children?: readonly ArticleTreeNodeFixture[];
  /** Stable tree node ID. */
  readonly id: string;
  /** Tree node kind. */
  readonly kind: "article" | "folder";
  /** Source location for article nodes. */
  readonly sourceRef?: SourceReferenceFixture;
  /** Article status marker. */
  readonly status?: ArticleStatusFixture;
  /** Human-facing node label. */
  readonly title: string;
}

/** Article status values used by directory, tree, and editor states. */
export type ArticleStatusFixture =
  | "dirty"
  | "draft"
  | "invalid"
  | "missing-media"
  | "published";

/** Article directory state for browser/search/filter surfaces. */
export interface ArticleDirectoryFixture {
  /** Available category labels for the filter surface. */
  readonly availableCategories: readonly string[];
  /** Available tag labels for the filter surface. */
  readonly availableTags: readonly string[];
  /** Optional category filter. */
  readonly categoryFilter?: string;
  /** Empty state when no rows should render. */
  readonly emptyState?: "loading" | "no-articles" | "no-filter-results";
  /** Stable directory scenario ID. */
  readonly id: string;
  /** Current search query. */
  readonly query: string;
  /** Directory result records. */
  readonly results: readonly ArticleDirectoryResultFixture[];
  /** Current status filter. */
  readonly statusFilter: "all" | "drafts" | "published";
  /** Optional tag filter. */
  readonly tagFilter?: string;
}

/** Article directory card or row result. */
export interface ArticleDirectoryResultFixture {
  /** Article represented by this row/card. */
  readonly articleId: string;
  /** Optional author label. */
  readonly author?: string;
  /** Optional category label. */
  readonly category?: string;
  /** Optional display date. */
  readonly dateLabel?: string;
  /** Optional diagnostic code for warning markers. */
  readonly diagnosticCode?: string;
  /** Short summary shown in browser cards. */
  readonly excerpt: string;
  /** Optional featured media ID. */
  readonly featuredMediaId?: string;
  /** Optional read-time label. */
  readonly readTimeLabel?: string;
  /** Display status. */
  readonly status: ArticleStatusFixture;
  /** Display tag labels. */
  readonly tags: readonly string[];
  /** Display title. */
  readonly title: string;
}

/** Article document data consumed by editor fixtures. */
export interface ArticleDocumentFixture {
  /** Markdown/MDX source body fixture. */
  readonly body: MarkdownBodyFixture;
  /** Canonical persisted source validity. */
  readonly canonicalState: "blocked" | "valid";
  /** Historical checkpoints for recovery flows. */
  readonly checkpoints: readonly CheckpointFixture[];
  /** Article-specific diagnostics. */
  readonly diagnostics: readonly DiagnosticFixture[];
  /** Descriptor-backed frontmatter sections. */
  readonly frontmatter: readonly FieldSectionFixture[];
  /** Stable article ID. */
  readonly id: string;
  /** Public route for preview/publish fixtures. */
  readonly route: string;
  /** Source reference for the article file. */
  readonly sourceRef: SourceReferenceFixture;
  /** User-facing title. */
  readonly title: string;
  /** Current editor working-copy state. */
  readonly workingCopyState:
    | "autosaving"
    | "clean"
    | "dirty"
    | "invalid"
    | "saved";
}

/** Descriptor section for frontmatter or settings forms. */
export interface FieldSectionFixture {
  /** Section field descriptors. */
  readonly fields: readonly FieldDescriptorFixture[];
  /** Stable section ID. */
  readonly id: string;
  /** Human-facing section label. */
  readonly label: string;
}

/** Field descriptor derived from source schemas and platform policy. */
export interface FieldDescriptorFixture {
  /** Temporary draft value when it differs from source. */
  readonly draftValue?: FieldValueFixture;
  /** Generated-output effects communicated to advanced users and tests. */
  readonly generatedEffects: readonly GeneratedEffectFixture[];
  /** Optional help text. */
  readonly helpText?: string;
  /** Stable field ID. */
  readonly id: string;
  /** Input primitive for this fixture. */
  readonly input:
    | "date"
    | "image-reference"
    | "multi-select"
    | "select"
    | "text"
    | "textarea"
    | "toggle"
    | "url";
  /** Human-facing field label. */
  readonly label: string;
  /** Whether the field is required. */
  readonly required: boolean;
  /** Source field path. */
  readonly sourcePath: string;
  /** Current validation state. */
  readonly validation: FieldValidationStateFixture;
  /** Persisted field value. */
  readonly value: FieldValueFixture;
  /** Visibility tier for beginner and advanced forms. */
  readonly visibility:
    | "advanced"
    | "beginner"
    | "code-only"
    | "extension-owned";
}

/** Serializable field value supported by fixture-backed forms. */
export type FieldValueFixture =
  | boolean
  | null
  | number
  | readonly string[]
  | string;

/** Field-level validation status and optional diagnostic link. */
export interface FieldValidationStateFixture {
  /** Optional diagnostic code when invalid or warning. */
  readonly diagnosticCode?: string;
  /** Validation state. */
  readonly status: "invalid" | "valid" | "warning";
}

/** Generated-output effect labels for field changes. */
export type GeneratedEffectFixture =
  | "accessibility"
  | "feed"
  | "homepage"
  | "metadata"
  | "pdf"
  | "route"
  | "search"
  | "sitemap"
  | "social-preview";

/** Markdown or MDX body fixture for source-faithful editing. */
export interface MarkdownBodyFixture {
  /** Body source format. */
  readonly format: "markdown" | "mdx";
  /** Reading-time display label. */
  readonly readTimeLabel: string;
  /** Source text shown in the editor fixture. */
  readonly source: string;
  /** Optional unsupported-feature diagnostic code. */
  readonly unsupportedDiagnosticCode?: string;
  /** Word-count display label. */
  readonly wordCountLabel: string;
}

/** Editor cursor, selection, and context state. */
export interface EditorSessionStateFixture {
  /** Context-menu target derived from selection/cursor state. */
  readonly contextTarget: "cursor" | "image-markdown" | "none" | "selection";
  /** Cursor offset in the source body. */
  readonly cursorOffset: number;
  /** Optional last command ID. */
  readonly lastCommandId?: string;
  /** Editor scroll offset. */
  readonly scrollTop: number;
  /** Optional selection range. */
  readonly selection?: {
    /** Selection start offset. */
    readonly from: number;
    /** Selection end offset. */
    readonly to: number;
  };
}

/** Restore checkpoint record for history/recovery flows. */
export interface CheckpointFixture {
  /** Display timestamp. */
  readonly createdLabel: string;
  /** Stable checkpoint ID. */
  readonly id: string;
  /** Human-facing checkpoint label. */
  readonly label: string;
  /** Source reference or operation artifact that produced the checkpoint. */
  readonly sourceRef: SourceReferenceFixture;
}

/** Settings form fixture with descriptor-backed sections. */
export interface SettingsFixture {
  /** Active section ID. */
  readonly activeSectionId: string;
  /** Settings diagnostics. */
  readonly diagnostics: readonly DiagnosticFixture[];
  /** Stable settings scenario ID. */
  readonly id: string;
  /** Settings sections rendered by the GUI. */
  readonly sections: readonly FieldSectionFixture[];
  /** Current settings working-copy state. */
  readonly state: "autosaving" | "dirty" | "invalid" | "saved";
}

/** Media library state and item records. */
export interface MediaLibraryFixture {
  /** Empty state when no media rows should render. */
  readonly emptyState?: "loading" | "no-filter-results" | "no-media";
  /** Media records. */
  readonly items: readonly MediaItemFixture[];
  /** Current media search query. */
  readonly query: string;
  /** Selected media ID when detail pane is open. */
  readonly selectedMediaId?: string;
  /** Display mode for the library. */
  readonly viewMode: "grid" | "list";
}

/** Media asset record with stable local preview URLs. */
export interface MediaItemFixture {
  /** Accessibility alt text. Empty only when status is missing-alt. */
  readonly altText: string;
  /** Optional caption. */
  readonly caption?: string;
  /** Optional diagnostic code for warning/error markers. */
  readonly diagnosticCode?: string;
  /** Optional image dimensions. */
  readonly dimensions?: {
    /** Height in CSS pixels. */
    readonly height: number;
    /** Width in CSS pixels. */
    readonly width: number;
  };
  /** Human-facing filename. */
  readonly displayName: string;
  /** Optional display file size. */
  readonly fileSizeLabel?: string;
  /** Local full preview URL served by the Studio fixture app. */
  readonly fullUrl: string;
  /** Stable media ID. */
  readonly id: string;
  /** Media kind. */
  readonly kind: "image";
  /** Source reference for the media source. */
  readonly sourceRef: SourceReferenceFixture;
  /** Media validation state. */
  readonly status: "missing" | "missing-alt" | "ready" | "unsupported";
  /** Local thumbnail URL served by the Studio fixture app. */
  readonly thumbnailUrl: string;
  /** Usage records linking this media back to content. */
  readonly usage: readonly MediaUsageFixture[];
}

/** Media usage link back to an article or other source. */
export interface MediaUsageFixture {
  /** Article ID that references the asset. */
  readonly articleId: string;
  /** Display route or source location. */
  readonly locationLabel: string;
  /** User-facing article title. */
  readonly title: string;
}

/** Preview operation scenario used by editor and publish surfaces. */
export interface PreviewFixture {
  /** Preview diagnostics. */
  readonly diagnostics: readonly DiagnosticFixture[];
  /** Stable preview scenario ID. */
  readonly id: string;
  /** Optional display timestamp for last render. */
  readonly lastRenderedAt?: string;
  /** Route being previewed. */
  readonly route: string;
  /** How preview was initiated. */
  readonly startedFrom: "article" | "home" | "manual-route";
  /** Current preview state. */
  readonly status:
    | "blocked"
    | "failed"
    | "idle"
    | "loading"
    | "ready"
    | "stale";
}

/** Publish state scenario that preserves plan/apply boundaries. */
export interface PublishFixture {
  /** Credential reference used for the target provider. */
  readonly credentialId: string;
  /** Credential state snapshot for this scenario. */
  readonly credentialState: CredentialFixture["state"];
  /** Publish diagnostics. */
  readonly diagnostics: readonly DiagnosticFixture[];
  /** Stable publish scenario ID. */
  readonly id: string;
  /** Optional planned action summary. */
  readonly plan?: PublishPlanFixture;
  /** Optional publish result summary. */
  readonly result?: PublishResultFixture;
  /** Current publish state. */
  readonly status:
    | "blocked"
    | "confirm-open"
    | "failed"
    | "idle"
    | "preparing-preview"
    | "preview-ready"
    | "published"
    | "publishing";
  /** Deploy provider target. */
  readonly targetProvider: ProviderSummaryFixture;
}

/** Publish plan data shown before provider mutation. */
export interface PublishPlanFixture {
  /** Whether a checkpoint will be saved before apply. */
  readonly checkpointRequired: boolean;
  /** Target public URL. */
  readonly destinationUrl: string;
  /** Stable plan ID. */
  readonly id: string;
  /** Planned operation family. */
  readonly operationFamily: "publish.plan";
  /** User-facing action summary. */
  readonly summary: readonly string[];
}

/** Publish result data shown after a simulated apply. */
export interface PublishResultFixture {
  /** User-facing completion label. */
  readonly completedLabel: string;
  /** Public URL for the published site. */
  readonly publishedUrl: string;
  /** Stable release ID. */
  readonly releaseId: string;
}

/** Restore flow scenario for checkpoint recovery. */
export interface RestoreFlowFixture {
  /** Active article for restore context. */
  readonly articleId: string;
  /** Restore diagnostics. */
  readonly diagnostics: readonly DiagnosticFixture[];
  /** Stable restore scenario ID. */
  readonly id: string;
  /** Selected checkpoint ID. */
  readonly selectedCheckpointId: string;
  /** Restore flow state. */
  readonly status: "confirm-open" | "ready" | "restored" | "unavailable";
}

/** Complete fixture graph for the Studio GUI MVP prototype. */
export interface StudioMvpFixture {
  /** Article directory scenarios. */
  readonly articleDirectories: readonly ArticleDirectoryFixture[];
  /** Article editor source documents. */
  readonly articles: readonly ArticleDocumentFixture[];
  /** Credential references. */
  readonly credentials: readonly CredentialFixture[];
  /** Shared diagnostics referenced by screens, media, and fields. */
  readonly diagnostics: readonly DiagnosticFixture[];
  /** Fixture metadata for visual QA and handoff comments. */
  readonly generatedFor: "studio-gui-mvp";
  /** Media library fixture data. */
  readonly media: MediaLibraryFixture;
  /** Navigation and article tree data. */
  readonly navigation: NavigationFixture;
  /** Preview scenarios. */
  readonly previews: readonly PreviewFixture[];
  /** Publish scenarios. */
  readonly publishes: readonly PublishFixture[];
  /** Restore checkpoint scenarios. */
  readonly restoreFlows: readonly RestoreFlowFixture[];
  /** Fixture schema version. */
  readonly schemaVersion: string;
  /** Screen-state registry for all visible MVP states. */
  readonly screenStates: readonly StudioScreenStateFixture[];
  /** Session scenarios for exact restore and active screen state. */
  readonly sessions: readonly StudioSessionFixture[];
  /** Settings form scenario data. */
  readonly settings: readonly SettingsFixture[];
  /** Workspace/provider summary. */
  readonly workspace: WorkspaceFixture;
}

/** Validation issue emitted by fixture graph validation. */
export interface StudioFixtureValidationIssue {
  /** Stable validation issue code. */
  readonly code: string;
  /** Human-readable explanation. */
  readonly message: string;
  /** Path to the invalid fixture location. */
  readonly path: string;
}

/** Derived article directory data for React screens. */
export interface ArticleDirectoryViewModel {
  /** Empty-state categories available for filter controls. */
  readonly availableCategories: readonly string[];
  /** Empty-state tags available for filter controls. */
  readonly availableTags: readonly string[];
  /** Optional active category filter. */
  readonly categoryFilter?: string | undefined;
  /** Empty state when the directory renders without results. */
  readonly emptyState?: ArticleDirectoryFixture["emptyState"];
  /** Directory scenario ID. */
  readonly id: string;
  /** Current search query. */
  readonly query: string;
  /** Result count derived from result records. */
  readonly resultCount: number;
  /** Results with resolved article, media, and diagnostic references. */
  readonly results: readonly ArticleDirectoryViewItem[];
  /** Current status filter. */
  readonly statusFilter: ArticleDirectoryFixture["statusFilter"];
  /** Optional active tag filter. */
  readonly tagFilter?: string | undefined;
}

/** Resolved article directory row/card data. */
export interface ArticleDirectoryViewItem {
  /** Source article. */
  readonly article: ArticleDocumentFixture;
  /** Optional resolved diagnostic. */
  readonly diagnostic?: DiagnosticFixture;
  /** Optional resolved featured media. */
  readonly featuredMedia?: MediaItemFixture;
  /** Directory display record. */
  readonly result: ArticleDirectoryResultFixture;
}

/** Serializable article-directory filter input. */
export interface ArticleDirectoryFilterInput {
  /** Optional category filter. */
  readonly categoryFilter?: string | undefined;
  /** Directory scenario to use as the source records. */
  readonly directoryScenarioId?: string;
  /** Search query. */
  readonly query: string;
  /** Status filter. */
  readonly statusFilter: ArticleDirectoryFixture["statusFilter"];
  /** Optional tag filter. */
  readonly tagFilter?: string | undefined;
}

/** Resolved article editor data for metadata forms and source editing. */
export interface ArticleEditorViewModel {
  /** Article being edited. */
  readonly article: ArticleDocumentFixture;
  /** Optional body-level unsupported-feature diagnostic. */
  readonly bodyDiagnostic?: DiagnosticFixture;
  /** Featured media resolved from frontmatter when present. */
  readonly featuredMedia?: MediaItemFixture;
  /** Diagnostics attached to invalid or warning frontmatter fields. */
  readonly fieldDiagnostics: readonly ArticleEditorFieldDiagnostic[];
}

/** Resolved field diagnostic used by descriptor-backed forms. */
export interface ArticleEditorFieldDiagnostic {
  /** Diagnostic attached to the field. */
  readonly diagnostic: DiagnosticFixture;
  /** Field that produced the diagnostic. */
  readonly field: FieldDescriptorFixture;
  /** Section that owns the field. */
  readonly section: FieldSectionFixture;
}

/** Resolved settings view data for descriptor-backed site settings forms. */
export interface SettingsViewModel {
  /** Active settings section rendered in the main form panel. */
  readonly activeSection: FieldSectionFixture;
  /** Diagnostics attached to the active settings scenario. */
  readonly diagnostics: readonly DiagnosticFixture[];
  /** Diagnostics attached to invalid or warning settings fields. */
  readonly fieldDiagnostics: readonly SettingsFieldDiagnostic[];
  /** All settings sections available in the local fixture scenario. */
  readonly sections: readonly FieldSectionFixture[];
  /** Settings fixture scenario backing this view. */
  readonly settings: SettingsFixture;
}

/** Resolved field diagnostic used by settings forms. */
export interface SettingsFieldDiagnostic {
  /** Diagnostic attached to the field. */
  readonly diagnostic: DiagnosticFixture;
  /** Field that produced the diagnostic. */
  readonly field: FieldDescriptorFixture;
  /** Section that owns the field. */
  readonly section: FieldSectionFixture;
}

/** Resolved media browser row/card with optional diagnostic context. */
export interface MediaLibraryViewItem {
  /** Diagnostic attached to this media item when it has a warning/error state. */
  readonly diagnostic?: DiagnosticFixture;
  /** Source media item. */
  readonly item: MediaItemFixture;
}

/** Resolved media browser data for grid/list and detail panes. */
export interface MediaLibraryViewModel {
  /** Empty state for no media or no matching media. */
  readonly emptyState?: MediaLibraryFixture["emptyState"];
  /** Filtered media items rendered by the browser. */
  readonly items: readonly MediaLibraryViewItem[];
  /** Current media search query. */
  readonly query: string;
  /** Selected media item with resolved diagnostic context. */
  readonly selectedItem?: MediaLibraryViewItem;
  /** Current browser view mode. */
  readonly viewMode: MediaLibraryFixture["viewMode"];
}

/** Resolved preview pane data derived from fixtures and app state. */
export interface PreviewPaneViewModel {
  /** Article associated with the preview route when applicable. */
  readonly article?: ArticleDocumentFixture;
  /** Optional article author display label. */
  readonly author?: string;
  /** Optional article category display label. */
  readonly category?: string;
  /** Optional article description display text. */
  readonly description?: string;
  /** Diagnostics shown in preview context. */
  readonly diagnostics: readonly DiagnosticFixture[];
  /** Optional article date display label. */
  readonly displayDate?: string;
  /** Optional featured media for article preview fixtures. */
  readonly featuredMedia?: MediaItemFixture;
  /** Whether the preview should render a route body, a status panel, or idle copy. */
  readonly renderMode: "article" | "empty" | "status";
  /** Active route label. */
  readonly route: string;
  /** Machine-readable preview status for state-specific surfaces. */
  readonly status: PreviewFixture["status"];
  /** Human-facing status copy. */
  readonly statusLabel: string;
  /** Tone used by badges and status panels. */
  readonly statusTone: "neutral" | "success" | DiagnosticFixture["severity"];
  /** Optional tag labels. */
  readonly tags: readonly string[];
  /** Title for the preview body or status panel. */
  readonly title: string;
}

/** Resolved publish workflow data derived from fixture state. */
export interface PublishViewModel {
  /** Credential reference for this publish attempt, without any secret value. */
  readonly credential?: CredentialFixture;
  /** User-facing credential state label. */
  readonly credentialStateLabel: string;
  /** Diagnostics shown in publish context. */
  readonly diagnostics: readonly DiagnosticFixture[];
  /** Active publish plan, when the current state reached planning. */
  readonly plan?: PublishPlanFixture;
  /** Route preview shown before confirmation. */
  readonly preview: PreviewPaneViewModel;
  /** Active publish fixture scenario. */
  readonly publish: PublishFixture;
  /** Result summary for successful fixture-backed publishes. */
  readonly result?: PublishResultFixture;
  /** Whether the current state should render the confirm dialog. */
  readonly shouldShowConfirmDialog: boolean;
  /** Human-facing publish status label. */
  readonly statusLabel: string;
  /** Tone used by publish status badges and panels. */
  readonly statusTone: "danger" | "neutral" | "success" | "warning";
  /** Public or provider target summary. */
  readonly targetProvider: ProviderSummaryFixture;
  /** Number of non-blocking warnings in this publish state. */
  readonly warningCount: number;
}

/** Resolved restore/checkpoint data for source recovery screens. */
export interface RestoreViewModel {
  /** Article being restored. */
  readonly article: ArticleDocumentFixture;
  /** Checkpoints available for the article. */
  readonly checkpoints: readonly CheckpointFixture[];
  /** Diagnostics attached to the restore flow. */
  readonly diagnostics: readonly DiagnosticFixture[];
  /** History provider capability summary. */
  readonly historyProvider: ProviderSummaryFixture;
  /** Active restore flow scenario. */
  readonly restore: RestoreFlowFixture;
  /** Selected checkpoint detail. */
  readonly selectedCheckpoint: CheckpointFixture | undefined;
}

/**
 * Validates that a Studio GUI MVP fixture is internally consistent.
 *
 * @param fixture Fixture graph to validate.
 * @returns Deterministic list of validation issues.
 */
export function validateStudioMvpFixture(
  fixture: StudioMvpFixture,
): StudioFixtureValidationIssue[] {
  return [
    ...validateRootFixture(fixture),
    ...validateRequiredScreenStates(fixture),
    ...validateReferences(fixture),
    ...validateDiagnosticsForStates(fixture),
    ...validateMediaPolicy(fixture),
  ];
}

/**
 * Builds a resolved article-directory view model from fixture records.
 *
 * @param fixture Fixture graph containing articles, media, and diagnostics.
 * @param directoryId Directory scenario ID.
 * @returns Resolved directory view model.
 */
export function articleDirectoryViewModel(
  fixture: StudioMvpFixture,
  directoryId: string,
): ArticleDirectoryViewModel {
  const directory = fixture.articleDirectories.find(
    (scenario) => scenario.id === directoryId,
  );

  if (directory === undefined) {
    return {
      availableCategories: [],
      availableTags: [],
      id: directoryId,
      query: "",
      resultCount: 0,
      results: [],
      statusFilter: "all",
    };
  }

  const results = directory.results.flatMap((result) => {
    const article = fixture.articles.find(
      (candidate) => candidate.id === result.articleId,
    );

    if (article === undefined) {
      return [];
    }

    const featuredMedia =
      result.featuredMediaId === undefined
        ? undefined
        : fixture.media.items.find(
            (media) => media.id === result.featuredMediaId,
          );
    const diagnostic =
      result.diagnosticCode === undefined
        ? undefined
        : diagnosticByCode(fixture, result.diagnosticCode);

    return [
      {
        article,
        result,
        ...(diagnostic === undefined ? {} : { diagnostic }),
        ...(featuredMedia === undefined ? {} : { featuredMedia }),
      },
    ];
  });

  return {
    availableCategories: directory.availableCategories,
    availableTags: directory.availableTags,
    id: directory.id,
    query: directory.query,
    resultCount: results.length,
    results,
    statusFilter: directory.statusFilter,
    ...(directory.categoryFilter === undefined
      ? {}
      : { categoryFilter: directory.categoryFilter }),
    ...(directory.emptyState === undefined
      ? {}
      : { emptyState: directory.emptyState }),
    ...(directory.tagFilter === undefined
      ? {}
      : { tagFilter: directory.tagFilter }),
  };
}

/**
 * Builds an article-directory view model from serializable filter state.
 *
 * @param fixture Fixture graph containing articles, media, and diagnostics.
 * @param filters Serializable filter/search state.
 * @returns Resolved and filtered directory view model.
 */
export function filteredArticleDirectoryViewModel(
  fixture: StudioMvpFixture,
  filters: ArticleDirectoryFilterInput,
): ArticleDirectoryViewModel {
  const baseDirectoryId = filters.directoryScenarioId ?? "directory-populated";
  const base = articleDirectoryViewModel(fixture, baseDirectoryId);

  if (base.emptyState === "no-articles") {
    return base;
  }

  const normalizedQuery = filters.query.trim().toLowerCase();
  const results = base.results.filter(
    (item) =>
      matchesStatusFilter(item, filters.statusFilter) &&
      matchesCategoryFilter(item, filters.categoryFilter) &&
      matchesTagFilter(item, filters.tagFilter) &&
      matchesQuery(item, normalizedQuery),
  );

  return {
    availableCategories: base.availableCategories,
    availableTags: base.availableTags,
    id: base.id,
    query: filters.query,
    resultCount: results.length,
    results,
    statusFilter: filters.statusFilter,
    ...(filters.categoryFilter === undefined
      ? {}
      : { categoryFilter: filters.categoryFilter }),
    ...(results.length === 0
      ? { emptyState: "no-filter-results" as const }
      : {}),
    ...(filters.tagFilter === undefined
      ? {}
      : { tagFilter: filters.tagFilter }),
  };
}

/**
 * Builds a resolved article-editor view model from fixture records.
 *
 * @param fixture Fixture graph containing articles, media, and diagnostics.
 * @param articleId Article ID to open.
 * @returns Resolved editor view model when the article exists.
 */
export function articleEditorViewModel(
  fixture: StudioMvpFixture,
  articleId: string | undefined,
): ArticleEditorViewModel | undefined {
  const article =
    articleId === undefined
      ? undefined
      : fixture.articles.find((candidate) => candidate.id === articleId);

  if (article === undefined) {
    return undefined;
  }

  const featuredMediaId = article.frontmatter
    .flatMap((section) => section.fields)
    .find((field) => field.id === "featuredImage")?.value;
  const featuredMedia =
    typeof featuredMediaId === "string"
      ? fixture.media.items.find((media) => media.id === featuredMediaId)
      : undefined;
  const bodyDiagnostic =
    article.body.unsupportedDiagnosticCode === undefined
      ? undefined
      : diagnosticByCode(fixture, article.body.unsupportedDiagnosticCode);

  return {
    article,
    fieldDiagnostics: article.frontmatter.flatMap((section) =>
      section.fields.flatMap((field) => {
        const diagnostic =
          field.validation.diagnosticCode === undefined
            ? undefined
            : diagnosticByCode(fixture, field.validation.diagnosticCode);

        return diagnostic === undefined ? [] : [{ diagnostic, field, section }];
      }),
    ),
    ...(bodyDiagnostic === undefined ? {} : { bodyDiagnostic }),
    ...(featuredMedia === undefined ? {} : { featuredMedia }),
  };
}

/**
 * Builds settings view data from descriptor-backed fixture sections.
 *
 * @param fixture Fixture graph containing settings scenarios.
 * @param state Current app state.
 * @param state.activeSettingsSectionId Active settings section ID.
 * @returns Settings view data, or undefined when no settings fixture exists.
 */
export function settingsViewModel(
  fixture: StudioMvpFixture,
  state: {
    readonly activeSettingsSectionId?: string | undefined;
  },
): SettingsViewModel | undefined {
  const fallbackSettings =
    fixture.settings.find((candidate) => candidate.id === "settings-saved") ??
    fixture.settings[0];

  if (fallbackSettings === undefined) {
    return undefined;
  }

  const sectionId =
    state.activeSettingsSectionId ?? fallbackSettings.activeSectionId;
  const settings =
    fixture.settings.find(
      (candidate) => candidate.activeSectionId === sectionId,
    ) ?? fallbackSettings;
  const activeSection =
    settings.sections.find((section) => section.id === sectionId) ??
    settings.sections.find(
      (section) => section.id === settings.activeSectionId,
    ) ??
    settings.sections[0];

  if (activeSection === undefined) {
    return undefined;
  }

  return {
    activeSection,
    diagnostics: settings.diagnostics,
    fieldDiagnostics: settings.sections.flatMap((section) =>
      section.fields.flatMap((field) => {
        const diagnostic =
          field.validation.diagnosticCode === undefined
            ? undefined
            : diagnosticByCode(fixture, field.validation.diagnosticCode);

        return diagnostic === undefined ? [] : [{ diagnostic, field, section }];
      }),
    ),
    sections: settings.sections,
    settings,
  };
}

/**
 * Builds media browser view data from fixture records and local app state.
 *
 * @param fixture Fixture graph containing media and diagnostics.
 * @param state Current media selection and browser state.
 * @param state.activeMediaId Active media item ID.
 * @param state.media Current media search and display state.
 * @param state.media.query Current media search query.
 * @param state.media.viewMode Current media display mode.
 * @returns Filtered media library view data with resolved diagnostics.
 */
export function mediaLibraryViewModel(
  fixture: StudioMvpFixture,
  state: {
    readonly activeMediaId?: string | undefined;
    readonly media: {
      readonly query: string;
      readonly viewMode: MediaLibraryFixture["viewMode"];
    };
  },
): MediaLibraryViewModel {
  const query = state.media.query;
  const normalizedQuery = query.trim().toLowerCase();
  const items = fixture.media.items
    .filter((item) => matchesMediaQuery(item, normalizedQuery))
    .map((item) => mediaLibraryViewItem(fixture, item));
  const selectedMediaId =
    state.activeMediaId ?? fixture.media.selectedMediaId ?? items[0]?.item.id;
  const selectedItem = items.find((item) => item.item.id === selectedMediaId);
  const emptyState =
    fixture.media.emptyState ??
    (items.length === 0 ? "no-filter-results" : undefined);

  return {
    items,
    query,
    viewMode: state.media.viewMode,
    ...(emptyState === undefined ? {} : { emptyState }),
    ...(selectedItem === undefined ? {} : { selectedItem }),
  };
}

/**
 * Builds preview pane view data without rendering or parsing source Markdown.
 *
 * @param fixture Fixture graph containing preview scenarios and articles.
 * @param state Current app state.
 * @param state.activeArticleId Active article ID when the preview is article-scoped.
 * @param state.activePreviewScenarioId Active preview scenario ID.
 * @returns Resolved preview data for the right pane.
 */
export function previewPaneViewModel(
  fixture: StudioMvpFixture,
  state: {
    readonly activeArticleId?: string | undefined;
    readonly activePreviewScenarioId?: string | undefined;
  },
): PreviewPaneViewModel {
  const preview = fixture.previews.find(
    (candidate) => candidate.id === state.activePreviewScenarioId,
  );
  const article =
    state.activeArticleId === undefined
      ? articleByPreviewRoute(fixture, preview?.route)
      : fixture.articles.find(
          (candidate) => candidate.id === state.activeArticleId,
        );
  const featuredMedia = previewFeaturedMedia(fixture, article);
  const title = article?.title ?? fixture.workspace.displayName;
  const status = preview?.status ?? "idle";
  const author = fieldString(article, "author");
  const category = fieldString(article, "category");
  const description = fieldString(article, "description");
  const displayDate = formattedDate(fieldString(article, "date"));

  return {
    diagnostics: preview?.diagnostics ?? [],
    renderMode: previewRenderMode(status),
    route: preview?.route ?? article?.route ?? "/",
    status,
    statusLabel: previewStatusLabel(status),
    statusTone: previewStatusTone(status),
    tags: fieldStringArray(article, "tags"),
    title,
    ...(article === undefined ? {} : { article }),
    ...(featuredMedia === undefined ? {} : { featuredMedia }),
    ...(author === undefined ? {} : { author }),
    ...(category === undefined ? {} : { category }),
    ...(description === undefined ? {} : { description }),
    ...(displayDate === undefined ? {} : { displayDate }),
  };
}

/**
 * Builds publish workflow view data while preserving preview/plan/apply seams.
 *
 * @param fixture Fixture graph containing publish, credential, and preview data.
 * @param state Current app state.
 * @param state.activeArticleId Article context used to pick the publish preview route.
 * @param state.activePreviewScenarioId Active preview scenario when one exists.
 * @param state.activePublishScenarioId Active publish scenario ID.
 * @returns Resolved publish workflow data, or undefined when fixture data is incomplete.
 */
export function publishViewModel(
  fixture: StudioMvpFixture,
  state: {
    readonly activeArticleId?: string | undefined;
    readonly activePreviewScenarioId?: string | undefined;
    readonly activePublishScenarioId?: string | undefined;
  },
): PublishViewModel | undefined {
  const publish =
    fixture.publishes.find(
      (candidate) => candidate.id === state.activePublishScenarioId,
    ) ??
    fixture.publishes.find((candidate) => candidate.id === "publish-preview");

  if (publish === undefined) {
    return undefined;
  }

  const previewScenarioId =
    state.activePreviewScenarioId ??
    (state.activeArticleId === undefined
      ? "preview-home-ready"
      : "preview-ready");
  const preview = previewPaneViewModel(fixture, {
    activeArticleId: state.activeArticleId,
    activePreviewScenarioId: previewScenarioId,
  });
  const credential = fixture.credentials.find(
    (candidate) => candidate.id === publish.credentialId,
  );
  const warningCount = publish.diagnostics.filter(
    (diagnostic) => diagnostic.severity === "warning",
  ).length;

  return {
    credentialStateLabel: credentialStateLabel(publish.credentialState),
    diagnostics: publish.diagnostics,
    preview,
    publish,
    shouldShowConfirmDialog: publish.status === "confirm-open",
    statusLabel: publishStatusLabel(publish.status),
    statusTone: publishStatusTone(publish.status),
    targetProvider: publish.targetProvider,
    warningCount,
    ...(credential === undefined ? {} : { credential }),
    ...(publish.plan === undefined ? {} : { plan: publish.plan }),
    ...(publish.result === undefined ? {} : { result: publish.result }),
  };
}

/**
 * Builds checkpoint restore view data from fixture records and app state.
 *
 * @param fixture Fixture graph containing restore flows and articles.
 * @param state Current app state.
 * @param state.activeArticleId Article context when no restore scenario is selected.
 * @param state.activeRestoreScenarioId Active restore scenario ID.
 * @returns Resolved restore data when the article and flow exist.
 */
export function restoreViewModel(
  fixture: StudioMvpFixture,
  state: {
    readonly activeArticleId?: string | undefined;
    readonly activeRestoreScenarioId?: string | undefined;
  },
): RestoreViewModel | undefined {
  const restore =
    fixture.restoreFlows.find(
      (candidate) => candidate.id === state.activeRestoreScenarioId,
    ) ??
    fixture.restoreFlows.find((candidate) => candidate.id === "restore-ready");
  const article =
    restore === undefined
      ? articleById(fixture, state.activeArticleId)
      : articleById(fixture, restore.articleId);

  if (restore === undefined || article === undefined) {
    return undefined;
  }

  const selectedCheckpoint = article.checkpoints.find(
    (checkpoint) => checkpoint.id === restore.selectedCheckpointId,
  );

  return {
    article,
    checkpoints: article.checkpoints,
    diagnostics: restore.diagnostics,
    historyProvider: fixture.workspace.providers.history,
    restore,
    selectedCheckpoint,
  };
}

function articleById(
  fixture: StudioMvpFixture,
  articleId: string | undefined,
): ArticleDocumentFixture | undefined {
  return articleId === undefined
    ? undefined
    : fixture.articles.find((article) => article.id === articleId);
}

function articleByPreviewRoute(
  fixture: StudioMvpFixture,
  route: string | undefined,
): ArticleDocumentFixture | undefined {
  return route === undefined
    ? undefined
    : fixture.articles.find((article) => article.route === route);
}

function fieldString(
  article: ArticleDocumentFixture | undefined,
  fieldId: string,
): string | undefined {
  const field = article?.frontmatter
    .flatMap((section) => section.fields)
    .find((candidate) => candidate.id === fieldId);
  const value = field?.draftValue ?? field?.value;

  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function fieldStringArray(
  article: ArticleDocumentFixture | undefined,
  fieldId: string,
): readonly string[] {
  const field = article?.frontmatter
    .flatMap((section) => section.fields)
    .find((candidate) => candidate.id === fieldId);
  const value = field?.draftValue ?? field?.value;

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function formattedDate(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map((part) => Number(part));

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function previewFeaturedMedia(
  fixture: StudioMvpFixture,
  article: ArticleDocumentFixture | undefined,
): MediaItemFixture | undefined {
  const mediaId = fieldString(article, "featuredImage");

  return mediaId === undefined
    ? undefined
    : fixture.media.items.find((media) => media.id === mediaId);
}

function previewRenderMode(
  status: PreviewFixture["status"],
): PreviewPaneViewModel["renderMode"] {
  switch (status) {
    case "blocked":
    case "failed":
      return "status";
    case "idle":
      return "empty";
    case "loading":
      return "status";
    case "ready":
    case "stale":
      return "article";
  }
}

function previewStatusLabel(status: PreviewFixture["status"]): string {
  switch (status) {
    case "blocked":
      return "Blocked";
    case "failed":
      return "Failed";
    case "idle":
      return "Idle";
    case "loading":
      return "Loading";
    case "ready":
      return "Ready";
    case "stale":
      return "Stale";
  }
}

function previewStatusTone(
  status: PreviewFixture["status"],
): PreviewPaneViewModel["statusTone"] {
  switch (status) {
    case "blocked":
      return "error";
    case "failed":
    case "loading":
    case "stale":
      return "warning";
    case "idle":
      return "neutral";
    case "ready":
      return "success";
  }
}

function credentialStateLabel(state: CredentialFixture["state"]): string {
  switch (state) {
    case "connected":
      return "Connected credential reference";
    case "expired":
      return "Credential expired";
    case "insufficient-scope":
      return "Missing publish permission";
    case "missing":
      return "Provider not connected";
    case "provider-unreachable":
      return "Provider unreachable";
    case "revoked":
      return "Credential revoked";
  }
}

function publishStatusLabel(status: PublishFixture["status"]): string {
  switch (status) {
    case "blocked":
      return "Blocked";
    case "confirm-open":
      return "Ready to confirm";
    case "failed":
      return "Failed";
    case "idle":
      return "Not started";
    case "preparing-preview":
      return "Preparing preview";
    case "preview-ready":
      return "Preview ready";
    case "published":
      return "Published";
    case "publishing":
      return "Publishing";
  }
}

function publishStatusTone(
  status: PublishFixture["status"],
): PublishViewModel["statusTone"] {
  switch (status) {
    case "blocked":
      return "danger";
    case "confirm-open":
    case "idle":
    case "preview-ready":
      return "neutral";
    case "failed":
    case "preparing-preview":
    case "publishing":
      return "warning";
    case "published":
      return "success";
  }
}

function matchesCategoryFilter(
  item: ArticleDirectoryViewItem,
  categoryFilter: string | undefined,
): boolean {
  return (
    categoryFilter === undefined || item.result.category === categoryFilter
  );
}

function matchesQuery(
  item: ArticleDirectoryViewItem,
  normalizedQuery: string,
): boolean {
  if (normalizedQuery.length === 0) {
    return true;
  }

  return [
    item.result.author,
    item.result.category,
    item.result.excerpt,
    item.result.title,
    ...item.result.tags,
  ].some((value) => value?.toLowerCase().includes(normalizedQuery) === true);
}

function matchesStatusFilter(
  item: ArticleDirectoryViewItem,
  statusFilter: ArticleDirectoryFixture["statusFilter"],
): boolean {
  switch (statusFilter) {
    case "all":
      return true;
    case "drafts":
      return item.result.status !== "published";
    case "published":
      return item.result.status === "published";
  }
}

function matchesTagFilter(
  item: ArticleDirectoryViewItem,
  tagFilter: string | undefined,
): boolean {
  return tagFilter === undefined || item.result.tags.includes(tagFilter);
}

function mediaLibraryViewItem(
  fixture: StudioMvpFixture,
  item: MediaItemFixture,
): MediaLibraryViewItem {
  const diagnostic =
    item.diagnosticCode === undefined
      ? undefined
      : diagnosticByCode(fixture, item.diagnosticCode);

  return {
    item,
    ...(diagnostic === undefined ? {} : { diagnostic }),
  };
}

function matchesMediaQuery(
  item: MediaItemFixture,
  normalizedQuery: string,
): boolean {
  if (normalizedQuery.length === 0) {
    return true;
  }

  return [
    item.altText,
    item.caption,
    item.displayName,
    item.fileSizeLabel,
    item.sourceRef.path,
    item.status,
    ...item.usage.flatMap((usage) => [usage.locationLabel, usage.title]),
  ].some((value) => value?.toLowerCase().includes(normalizedQuery) === true);
}

function validateRootFixture(
  fixture: StudioMvpFixture,
): StudioFixtureValidationIssue[] {
  const schemaIssues =
    fixture.schemaVersion === STUDIO_MVP_FIXTURE_SCHEMA_VERSION
      ? []
      : [
          issue(
            "studio.fixture.schema-version",
            "schemaVersion",
            "Fixture schemaVersion does not match the Studio GUI MVP schema.",
          ),
        ];

  return [
    ...schemaIssues,
    ...duplicateIssues(
      "studio.fixture.duplicate-article-id",
      "articles",
      fixture.articles.map((article) => article.id),
    ),
    ...duplicateIssues(
      "studio.fixture.duplicate-media-id",
      "media.items",
      fixture.media.items.map((media) => media.id),
    ),
    ...duplicateIssues(
      "studio.fixture.duplicate-session-id",
      "sessions",
      fixture.sessions.map((session) => session.id),
    ),
    ...duplicateIssues(
      "studio.fixture.duplicate-diagnostic-code",
      "diagnostics",
      fixture.diagnostics.map((diagnostic) => diagnostic.code),
    ),
  ];
}

function validateRequiredScreenStates(
  fixture: StudioMvpFixture,
): StudioFixtureValidationIssue[] {
  const present = new Set(fixture.screenStates.map((screen) => screen.id));

  return STUDIO_MVP_REQUIRED_SCREEN_STATE_IDS.filter(
    (id) => !present.has(id),
  ).map((id) =>
    issue(
      "studio.fixture.missing-screen-state",
      `screenStates.${id}`,
      `Missing required Studio GUI MVP screen-state fixture: ${id}.`,
    ),
  );
}

function validateReferences(
  fixture: StudioMvpFixture,
): StudioFixtureValidationIssue[] {
  const articleIds = new Set(fixture.articles.map((article) => article.id));
  const mediaIds = new Set(fixture.media.items.map((media) => media.id));
  const sessionIds = new Set(fixture.sessions.map((session) => session.id));
  const diagnosticCodes = new Set(
    fixture.diagnostics.map((diagnostic) => diagnostic.code),
  );
  const credentialIds = new Set(
    fixture.credentials.map((credential) => credential.id),
  );
  const directoryIds = new Set(
    fixture.articleDirectories.map((directory) => directory.id),
  );
  const previewIds = new Set(fixture.previews.map((preview) => preview.id));
  const publishIds = new Set(fixture.publishes.map((publish) => publish.id));
  const restoreIds = new Set(fixture.restoreFlows.map((restore) => restore.id));

  return [
    ...fixture.screenStates.flatMap((screen) =>
      hasReference(sessionIds, screen.sessionId)
        ? []
        : [
            issue(
              "studio.fixture.broken-screen-session",
              `screenStates.${screen.id}.sessionId`,
              `Screen state ${screen.id} references missing session ${screen.sessionId}.`,
            ),
          ],
    ),
    ...fixture.sessions.flatMap((session) => [
      ...optionalReferenceIssue(
        articleIds,
        session.activeArticleId,
        `sessions.${session.id}.activeArticleId`,
        "studio.fixture.broken-session-article",
      ),
      ...optionalReferenceIssue(
        mediaIds,
        session.activeMediaId,
        `sessions.${session.id}.activeMediaId`,
        "studio.fixture.broken-session-media",
      ),
      ...optionalReferenceIssue(
        directoryIds,
        session.activeDirectoryScenarioId,
        `sessions.${session.id}.activeDirectoryScenarioId`,
        "studio.fixture.broken-session-directory",
      ),
      ...optionalReferenceIssue(
        previewIds,
        session.activePreviewScenarioId,
        `sessions.${session.id}.activePreviewScenarioId`,
        "studio.fixture.broken-session-preview",
      ),
      ...optionalReferenceIssue(
        publishIds,
        session.activePublishScenarioId,
        `sessions.${session.id}.activePublishScenarioId`,
        "studio.fixture.broken-session-publish",
      ),
      ...optionalReferenceIssue(
        restoreIds,
        session.activeRestoreScenarioId,
        `sessions.${session.id}.activeRestoreScenarioId`,
        "studio.fixture.broken-session-restore",
      ),
    ]),
    ...articleTreeReferenceIssues(fixture.navigation.articleTree, articleIds),
    ...fixture.articleDirectories.flatMap((directory) =>
      directory.results.flatMap((result) => [
        ...referenceIssue(
          articleIds,
          result.articleId,
          `articleDirectories.${directory.id}.results.${result.articleId}`,
          "studio.fixture.broken-directory-article",
        ),
        ...optionalReferenceIssue(
          mediaIds,
          result.featuredMediaId,
          `articleDirectories.${directory.id}.results.${result.articleId}.featuredMediaId`,
          "studio.fixture.broken-directory-media",
        ),
        ...optionalReferenceIssue(
          diagnosticCodes,
          result.diagnosticCode,
          `articleDirectories.${directory.id}.results.${result.articleId}.diagnosticCode`,
          "studio.fixture.broken-directory-diagnostic",
        ),
      ]),
    ),
    ...fixture.articles.flatMap((article) => [
      ...optionalReferenceIssue(
        diagnosticCodes,
        article.body.unsupportedDiagnosticCode,
        `articles.${article.id}.body.unsupportedDiagnosticCode`,
        "studio.fixture.broken-article-body-diagnostic",
      ),
      ...article.frontmatter.flatMap((section) =>
        section.fields.flatMap((field) =>
          optionalReferenceIssue(
            diagnosticCodes,
            field.validation.diagnosticCode,
            `articles.${article.id}.frontmatter.${section.id}.${field.id}.diagnosticCode`,
            "studio.fixture.broken-field-diagnostic",
          ),
        ),
      ),
    ]),
    ...fixture.media.items.flatMap((media) => [
      ...optionalReferenceIssue(
        diagnosticCodes,
        media.diagnosticCode,
        `media.items.${media.id}.diagnosticCode`,
        "studio.fixture.broken-media-diagnostic",
      ),
      ...media.usage.flatMap((usage) =>
        referenceIssue(
          articleIds,
          usage.articleId,
          `media.items.${media.id}.usage.${usage.articleId}`,
          "studio.fixture.broken-media-usage",
        ),
      ),
    ]),
    ...fixture.publishes.flatMap((publish) =>
      referenceIssue(
        credentialIds,
        publish.credentialId,
        `publishes.${publish.id}.credentialId`,
        "studio.fixture.broken-publish-credential",
      ),
    ),
    ...fixture.restoreFlows.flatMap((restore) =>
      referenceIssue(
        articleIds,
        restore.articleId,
        `restoreFlows.${restore.id}.articleId`,
        "studio.fixture.broken-restore-article",
      ),
    ),
  ];
}

function validateDiagnosticsForStates(
  fixture: StudioMvpFixture,
): StudioFixtureValidationIssue[] {
  return [
    ...fixture.articles.flatMap((article) => {
      const invalidFields = article.frontmatter.flatMap((section) =>
        section.fields.filter((field) => field.validation.status === "invalid"),
      );
      const invalidStateIssues =
        article.workingCopyState === "invalid" &&
        article.diagnostics.length === 0
          ? [
              issue(
                "studio.fixture.invalid-article-missing-diagnostic",
                `articles.${article.id}.diagnostics`,
                `Invalid article ${article.id} must include an actionable diagnostic.`,
              ),
            ]
          : [];
      const invalidFieldIssues = invalidFields.flatMap((field) =>
        field.validation.diagnosticCode === undefined
          ? [
              issue(
                "studio.fixture.invalid-field-missing-diagnostic",
                `articles.${article.id}.frontmatter.${field.id}`,
                `Invalid field ${field.id} must link to a diagnostic code.`,
              ),
            ]
          : [],
      );

      return [...invalidStateIssues, ...invalidFieldIssues];
    }),
    ...fixture.settings.flatMap((settings) =>
      settings.state === "invalid" && settings.diagnostics.length === 0
        ? [
            issue(
              "studio.fixture.invalid-settings-missing-diagnostic",
              `settings.${settings.id}.diagnostics`,
              `Invalid settings state ${settings.id} must include an actionable diagnostic.`,
            ),
          ]
        : [],
    ),
    ...fixture.previews.flatMap((preview) =>
      isDiagnosticRequiredPreviewStatus(preview.status) &&
      preview.diagnostics.length === 0
        ? [
            issue(
              "studio.fixture.preview-missing-diagnostic",
              `previews.${preview.id}.diagnostics`,
              `Preview state ${preview.id} must explain the blocked or failed preview.`,
            ),
          ]
        : [],
    ),
    ...fixture.publishes.flatMap((publish) =>
      isDiagnosticRequiredPublishStatus(publish.status) &&
      publish.diagnostics.length === 0
        ? [
            issue(
              "studio.fixture.publish-missing-diagnostic",
              `publishes.${publish.id}.diagnostics`,
              `Publish state ${publish.id} must explain the blocked or failed publish.`,
            ),
          ]
        : [],
    ),
  ];
}

function validateMediaPolicy(
  fixture: StudioMvpFixture,
): StudioFixtureValidationIssue[] {
  return fixture.media.items.flatMap((media) => {
    const localAssetIssues =
      isLocalFixtureAsset(media.thumbnailUrl) &&
      isLocalFixtureAsset(media.fullUrl)
        ? []
        : [
            issue(
              "studio.fixture.media-nonlocal-asset",
              `media.items.${media.id}`,
              `Media fixture ${media.id} must use stable local fixture URLs.`,
            ),
          ];
    const altIssues =
      media.status === "missing-alt" && media.altText.length > 0
        ? [
            issue(
              "studio.fixture.media-missing-alt-has-alt",
              `media.items.${media.id}.altText`,
              `Media fixture ${media.id} is marked missing-alt but has alt text.`,
            ),
          ]
        : [];
    const diagnosticIssues =
      media.status === "ready" || media.diagnosticCode !== undefined
        ? []
        : [
            issue(
              "studio.fixture.media-missing-diagnostic",
              `media.items.${media.id}.diagnosticCode`,
              `Media fixture ${media.id} needs a diagnostic code for its non-ready state.`,
            ),
          ];

    return [...localAssetIssues, ...altIssues, ...diagnosticIssues];
  });
}

function articleTreeReferenceIssues(
  nodes: readonly ArticleTreeNodeFixture[],
  articleIds: ReadonlySet<string>,
): StudioFixtureValidationIssue[] {
  return nodes.flatMap((node) => [
    ...optionalReferenceIssue(
      articleIds,
      node.articleId,
      `navigation.articleTree.${node.id}.articleId`,
      "studio.fixture.broken-tree-article",
    ),
    ...articleTreeReferenceIssues(node.children ?? [], articleIds),
  ]);
}

function duplicateIssues(
  code: string,
  path: string,
  ids: readonly string[],
): StudioFixtureValidationIssue[] {
  return ids.flatMap((id, index) =>
    ids.indexOf(id) === index
      ? []
      : [
          issue(
            code,
            `${path}.${id}`,
            `Duplicate fixture ID ${id} appears more than once.`,
          ),
        ],
  );
}

function diagnosticByCode(
  fixture: StudioMvpFixture,
  code: string,
): DiagnosticFixture | undefined {
  return fixture.diagnostics.find((diagnostic) => diagnostic.code === code);
}

function hasReference(ids: ReadonlySet<string>, id: string): boolean {
  return ids.has(id);
}

function referenceIssue(
  ids: ReadonlySet<string>,
  id: string,
  path: string,
  code: string,
): StudioFixtureValidationIssue[] {
  return hasReference(ids, id)
    ? []
    : [
        issue(
          code,
          path,
          `Fixture reference ${id} does not point at an existing fixture record.`,
        ),
      ];
}

function optionalReferenceIssue(
  ids: ReadonlySet<string>,
  id: string | undefined,
  path: string,
  code: string,
): StudioFixtureValidationIssue[] {
  return id === undefined ? [] : referenceIssue(ids, id, path, code);
}

function isDiagnosticRequiredPreviewStatus(
  status: PreviewFixture["status"],
): boolean {
  switch (status) {
    case "blocked":
    case "failed":
      return true;
    case "idle":
    case "loading":
    case "ready":
    case "stale":
      return false;
  }
}

function isDiagnosticRequiredPublishStatus(
  status: PublishFixture["status"],
): boolean {
  switch (status) {
    case "blocked":
    case "failed":
      return true;
    case "confirm-open":
    case "idle":
    case "preparing-preview":
    case "preview-ready":
    case "published":
    case "publishing":
      return false;
  }
}

function isLocalFixtureAsset(url: string): boolean {
  return url.startsWith("/fixtures/studio/media/");
}

function issue(
  code: string,
  path: string,
  message: string,
): StudioFixtureValidationIssue {
  return { code, message, path };
}
