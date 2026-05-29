# Studio GUI MVP Fixture And State Model

This document completes the fixture/state design pass for Linear `IRK-236` and
its child issues `IRK-261` through `IRK-264`.

The goal is to make the next fixture-backed GUI prototype realistic without
creating a throwaway frontend-only CMS model. Fixtures should look like future
Rust/Tauri operation results and should preserve the source-truth and
plan/apply architecture.

## Fixture Principles

1. Fixtures describe product state, not implementation shortcuts.
2. Canonical source is valid. Temporary working copies may be invalid.
3. Every source-like object has a source reference.
4. Every provider-backed fact has a provider/capability/credential summary.
5. Every blocked action has a diagnostic and a next action.
6. Every UI action maps to a future operation family.
7. GUI, CLI, MCP, and CI should eventually be able to share the same canonical
   operation result shapes.

## Root Fixture Shape

```ts
interface StudioMvpFixture {
  schemaVersion: "studio-gui-mvp.fixture.v1";
  session: StudioSessionFixture;
  workspace: WorkspaceFixture;
  navigation: NavigationFixture;
  articleDirectory: ArticleDirectoryFixture;
  articles: ArticleDocumentFixture[];
  settings: SettingsFixture;
  media: MediaLibraryFixture;
  preview: PreviewFixture;
  publish: PublishFixture;
  credentials: CredentialFixture[];
  diagnostics: DiagnosticFixture[];
}
```

The exact implementation may use Rust-generated JSON later. This TypeScript
shape is a design contract for the prototype.

## Session Fixture

```ts
type StudioScreen =
  | "first-launch"
  | "recent-projects"
  | "project-home"
  | "article-editor"
  | "media"
  | "settings"
  | "publish-preview";

interface StudioSessionFixture {
  lastRestoredAt: string;
  restoreStatus: "restored" | "project-missing" | "partial" | "failed";
  activeProjectId?: string;
  activeScreen: StudioScreen;
  activeArticleId?: string;
  activeMediaId?: string;
  activeSettingsSection?: string;
  sidebar: PanelState;
  previewPane: PanelState;
  editor?: EditorSessionState;
  window?: WindowStateFixture;
}
```

Exact restore is part of the product promise. The fixture must include both
successful and failed restore states.

## Workspace Fixture

```ts
interface WorkspaceFixture {
  id: string;
  displayName: string;
  sourceAdapter: ProviderSummary;
  historyAdapter: ProviderSummary;
  mediaAdapter: ProviderSummary;
  deployAdapter: ProviderSummary;
  rootDisplayPath: string;
  publicUrl?: string;
  status: "ready" | "dirty" | "blocked" | "unavailable";
  recentProjects: RecentProjectFixture[];
}
```

The GUI should say "site" or "project" to users, not "workspace" unless in
advanced details.

## Article Fixtures

```ts
interface ArticleTreeNodeFixture {
  id: string;
  title: string;
  kind: "folder" | "article";
  children?: ArticleTreeNodeFixture[];
  status?: "published" | "draft" | "dirty" | "invalid" | "missing-media";
  sourceRef?: SourceReferenceFixture;
}

interface ArticleDocumentFixture {
  id: string;
  title: string;
  sourceRef: SourceReferenceFixture;
  route: string;
  canonicalState: "valid" | "blocked";
  workingCopyState: "clean" | "dirty" | "autosaving" | "saved" | "invalid";
  frontmatter: FieldSectionFixture[];
  body: MarkdownBodyFixture;
  checkpoints: CheckpointFixture[];
  diagnostics: DiagnosticFixture[];
}
```

Canonical source should be valid unless the fixture intentionally demonstrates
a source diagnostic. Working copy state may be temporarily invalid while the
user is typing.

## Article Directory Fixture

The article directory/browser is the main-pane browse surface opened from the
Articles nav item or Open article action. It should render from indexed view
data, not from ad hoc Markdown parsing inside the component.

```ts
type ArticleDirectoryStatusFilter = "all" | "published" | "drafts";

interface ArticleDirectoryFixture {
  query: string;
  statusFilter: ArticleDirectoryStatusFilter;
  categoryFilter?: string;
  availableCategories: string[];
  resultCount: number;
  results: ArticleDirectoryResultFixture[];
  emptyState?: "no-articles" | "no-filter-results" | "loading";
}

interface ArticleDirectoryResultFixture {
  articleId: string;
  title: string;
  status: "published" | "draft" | "dirty" | "invalid" | "missing-media";
  category?: string;
  tags: string[];
  author?: string;
  dateLabel?: string;
  readTimeLabel?: string;
  excerpt: string;
  featuredMediaId?: string;
  diagnosticSummary?: DiagnosticFixture;
}
```

Required directory states:

- populated all articles;
- filtered by published/draft;
- filtered by category/tag;
- search results;
- no search/filter results with reset action;
- no articles yet with create action;
- article with warning/diagnostic marker.

## Field Descriptor Fixture

```ts
interface FieldDescriptorFixture {
  id: string;
  sourcePath: string;
  label: string;
  helpText?: string;
  input:
    | "text"
    | "textarea"
    | "date"
    | "select"
    | "multi-select"
    | "toggle"
    | "url"
    | "image-reference";
  visibility: "beginner" | "advanced" | "code-only" | "extension-owned";
  required: boolean;
  value: unknown;
  draftValue?: unknown;
  validation: FieldValidationState;
  generatedEffects: GeneratedEffectFixture[];
}
```

Fields are not raw Zod. They are authoring descriptors derived from schemas,
platform policy, and extension manifests.

## Editor State

```ts
interface EditorSessionState {
  cursorOffset: number;
  selection?: { from: number; to: number };
  scrollTop: number;
  lastCommand?: string;
  contextTarget: "selection" | "cursor" | "image-markdown" | "none";
}
```

Editor commands are state transitions:

- `format.bold`
- `format.italic`
- `insert.link`
- `insert.image`
- `insert.heading`
- `insert.footnote`
- `paste.plain-text`
- `preview.open-at-section`

Toolbar, hotkeys, command palette, and context menu all dispatch the same
commands.

## Media Fixture

```ts
interface MediaItemFixture {
  id: string;
  sourceRef: SourceReferenceFixture;
  displayName: string;
  kind: "image";
  thumbnailUrl: string;
  fullUrl: string;
  altText: string;
  caption?: string;
  dimensions?: { width: number; height: number };
  fileSizeLabel?: string;
  status: "ready" | "missing-alt" | "missing" | "unsupported";
  usage: MediaUsageFixture[];
}
```

Required fixture states:

- empty library;
- ready image;
- image missing alt text;
- missing image;
- selected image;
- inserted image.

## Preview State Machine

```text
idle
  -> loading
  -> ready
  -> stale
  -> loading
  -> ready

loading -> failed
loading -> blocked
stale -> blocked
blocked -> loading after repair
```

Preview state:

```ts
interface PreviewFixture {
  route: string;
  status: "idle" | "loading" | "ready" | "stale" | "blocked" | "failed";
  startedFrom: "home" | "article" | "manual-route";
  diagnostics: DiagnosticFixture[];
  lastRenderedAt?: string;
}
```

Preview is an operation over source or dirty draft state. It is not a
publication state.

## Autosave State Machine

```text
clean
  -> dirty
  -> autosave-pending
  -> autosaving
  -> saved

autosaving -> autosave-failed
autosave-failed -> dirty after user edit
saved -> dirty after user edit
```

Autosave must not hide failure. If autosave fails but the editor buffer is
still held safely, the UI should say so.

## Publish State Machine

```text
idle
  -> preparing-preview
  -> preview-ready
  -> confirm-open
  -> publishing
  -> published

preparing-preview -> blocked
preparing-preview -> failed
confirm-open -> preview-ready after cancel
publishing -> publish-failed
publish-failed -> preview-ready after retryable failure
```

Publish fixture:

```ts
interface PublishFixture {
  status:
    | "idle"
    | "preparing-preview"
    | "preview-ready"
    | "confirm-open"
    | "publishing"
    | "published"
    | "blocked"
    | "failed";
  targetProvider: ProviderSummary;
  credentialState: CredentialStateFixture;
  plan?: PublishPlanFixture;
  result?: PublishResultFixture;
  diagnostics: DiagnosticFixture[];
}
```

Publish always maps to plan then apply. The fixture should include both
successful and blocked publish states.

## Credential Fixture

Credential fixtures contain references and state, never secrets.

```ts
interface CredentialFixture {
  id: string;
  providerId: string;
  label: string;
  scopes: string[];
  state:
    | "missing"
    | "connected"
    | "expired"
    | "revoked"
    | "insufficient-scope"
    | "provider-unreachable";
  lastVerifiedAt?: string;
}
```

The GUI should say "Connect Cloudflare" or "Reconnect Cloudflare" by default.
Advanced details may show scopes.

## Operation Mapping

| GUI need           | Future operation family               |
| ------------------ | ------------------------------------- |
| Open project       | workspace discover/read               |
| Exact restore      | session/app state read                |
| List articles      | source inventory/editor document list |
| Open article       | get editor document                   |
| Edit metadata      | propose patch/validate patch          |
| Save draft         | write draft                           |
| Autosave           | write draft/checkpoint                |
| Restore checkpoint | history list/restore proposal/apply   |
| Insert image       | media resolve and document patch      |
| Edit media alt     | media metadata patch                  |
| Preview route      | preview route/build preview           |
| Publish preview    | publish plan                          |
| Confirm publish    | publish apply                         |
| Cloudflare status  | provider capability/credential status |

## Required Fixture Files For Implementation

The next implementation milestone should start with fixtures for:

1. first launch;
2. recent project restore;
3. project home with articles;
4. article directory populated/filtered/search;
5. article directory empty/no-results;
6. article editor clean;
7. article editor dirty/autosaving/saved;
8. article editor invalid frontmatter field;
9. article editor unsupported body diagnostic;
10. media grid and selected image;
11. media missing alt text;
12. settings dirty/invalid/saved;
13. preview ready/stale/blocked/failed;
14. publish preview/confirm/success;
15. publish blocked by missing Cloudflare connection;
16. publish failed with retry.

## Acceptance Criteria

The fixture/state model is ready when:

1. every visible MVP state has fixture data;
2. source references and diagnostics are explicit;
3. invalid canonical source is not represented casually;
4. temporary working-copy invalidity is modeled separately;
5. publish and provider actions use plan/apply states;
6. credentials are references and states only;
7. future Rust/Tauri operation mapping is clear.
