import { describe, expect, test } from "vitest";

import { studioMvpFixture } from "../../../apps/studio/src/data/fixtures/studio-mvp-fixture";
import {
  type ArticleDirectoryFixture,
  type ArticleDirectoryResultFixture,
  articleDirectoryViewModel,
  type ArticleDocumentFixture,
  articleEditorViewModel,
  filteredArticleDirectoryViewModel,
  type MediaItemFixture,
  mediaLibraryViewModel,
  previewPaneViewModel,
  publishViewModel,
  restoreViewModel,
  settingsViewModel,
  STUDIO_MVP_REQUIRED_SCREEN_STATE_IDS,
  type StudioMvpFixture,
  validateStudioMvpFixture,
} from "../../../apps/studio/src/models/studio-fixtures";

describe("studio GUI MVP fixture", () => {
  test("validates the bundled operation-shaped fixture graph", () => {
    expect(validateStudioMvpFixture(studioMvpFixture)).toEqual([]);
    expect(studioMvpFixture.schemaVersion).toBe("studio-gui-mvp.fixture.v1");
    expect(studioMvpFixture.workspace.providers.deploy.id).toBe(
      "cloudflare-workers",
    );
  });

  test("covers every required visible MVP screen state", () => {
    expect(studioMvpFixture.screenStates.map((state) => state.id)).toEqual(
      Array.from(STUDIO_MVP_REQUIRED_SCREEN_STATE_IDS),
    );
    expect(
      studioMvpFixture.screenStates.flatMap((state) => state.operationFamilies),
    ).toContain("publish.apply");
  });

  test("derives article directory view data without source parsing", () => {
    const viewModel = articleDirectoryViewModel(
      studioMvpFixture,
      "directory-populated",
    );

    expect(viewModel.resultCount).toBe(3);
    expect(viewModel.results.map((item) => item.article.id)).toEqual([
      "article-writing-desk",
      "article-small-shop",
      "article-choosing-wood",
    ]);
    expect(viewModel.results[0]?.featuredMedia?.id).toBe(
      "media-writing-desk-hero",
    );
    expect(viewModel.results[2]?.diagnostic?.code).toBe(
      "STUDIO-MEDIA-MISSING-SOURCE",
    );
  });

  test("derives filtered directory results from serializable state", () => {
    const filtered = filteredArticleDirectoryViewModel(studioMvpFixture, {
      categoryFilter: "Workshop",
      query: "desk",
      statusFilter: "drafts",
      tagFilter: "tools",
    });
    const noResults = filteredArticleDirectoryViewModel(studioMvpFixture, {
      query: "luthiery",
      statusFilter: "all",
    });
    const empty = filteredArticleDirectoryViewModel(studioMvpFixture, {
      directoryScenarioId: "directory-empty",
      query: "",
      statusFilter: "all",
    });

    expect(filtered.resultCount).toBe(1);
    expect(filtered.results.map((item) => item.result.articleId)).toEqual([
      "article-writing-desk",
    ]);
    expect(filtered).toMatchObject({
      categoryFilter: "Workshop",
      query: "desk",
      statusFilter: "drafts",
      tagFilter: "tools",
    });
    expect(noResults).toMatchObject({
      emptyState: "no-filter-results",
      resultCount: 0,
    });
    expect(empty).toMatchObject({
      emptyState: "no-articles",
      resultCount: 0,
    });
  });

  test("derives article editor view data from descriptors and diagnostics", () => {
    const clean = articleEditorViewModel(
      studioMvpFixture,
      "article-writing-desk",
    );
    const invalid = articleEditorViewModel(
      studioMvpFixture,
      "article-writing-desk-invalid",
    );
    const unsupported = articleEditorViewModel(
      studioMvpFixture,
      "article-custom-mdx",
    );

    expect(clean?.featuredMedia?.id).toBe("media-writing-desk-hero");
    expect(invalid).not.toBeUndefined();

    if (invalid !== undefined) {
      expect(invalid.fieldDiagnostics).toHaveLength(1);
      expect(invalid.fieldDiagnostics[0]?.diagnostic.code).toBe(
        "STUDIO-ARTICLE-TITLE-REQUIRED",
      );
      expect(invalid.fieldDiagnostics[0]?.field.id).toBe("title");
      expect(invalid.fieldDiagnostics[0]?.section.id).toBe("identity");
    }

    expect(unsupported?.bodyDiagnostic).toMatchObject({
      code: "STUDIO-ARTICLE-UNSUPPORTED-MDX",
      severity: "warning",
    });
    expect(
      articleEditorViewModel(studioMvpFixture, "missing-article"),
    ).toBeUndefined();
  });

  test("derives preview pane view data without Markdown rendering", () => {
    const ready = previewPaneViewModel(studioMvpFixture, {
      activeArticleId: "article-writing-desk",
      activePreviewScenarioId: "preview-ready",
    });
    const stale = previewPaneViewModel(studioMvpFixture, {
      activeArticleId: "article-writing-desk",
      activePreviewScenarioId: "preview-stale",
    });
    const loading = previewPaneViewModel(studioMvpFixture, {
      activeArticleId: "article-writing-desk",
      activePreviewScenarioId: "preview-loading",
    });
    const blocked = previewPaneViewModel(studioMvpFixture, {
      activeArticleId: "article-writing-desk-invalid",
      activePreviewScenarioId: "preview-blocked",
    });
    const failed = previewPaneViewModel(studioMvpFixture, {
      activeArticleId: "article-writing-desk",
      activePreviewScenarioId: "preview-failed",
    });
    const home = previewPaneViewModel(studioMvpFixture, {
      activePreviewScenarioId: "preview-home-ready",
    });
    const empty = previewPaneViewModel(studioMvpFixture, {});

    expect(ready).toMatchObject({
      author: "Ava Brooks",
      category: "Workshop",
      description:
        "A simple, sturdy writing desk can transform the way you work and think.",
      displayDate: "May 14, 2026",
      renderMode: "article",
      route: "/articles/how-to-build-a-writing-desk/",
      status: "ready",
      statusLabel: "Ready",
      statusTone: "success",
      tags: ["woodworking", "home", "tools"],
      title: "How to Build a Writing Desk",
    });
    expect(ready.featuredMedia?.id).toBe("media-writing-desk-hero");
    expect(stale).toMatchObject({
      renderMode: "article",
      status: "stale",
      statusTone: "warning",
    });
    expect(loading).toMatchObject({
      diagnostics: [],
      renderMode: "status",
      status: "loading",
      statusLabel: "Loading",
    });
    expect(blocked).toMatchObject({
      diagnostics: [{ code: "STUDIO-PREVIEW-BLOCKED" }],
      renderMode: "status",
      status: "blocked",
      statusTone: "error",
    });
    expect(failed).toMatchObject({
      diagnostics: [{ code: "STUDIO-PREVIEW-FAILED" }],
      renderMode: "status",
      status: "failed",
      statusTone: "warning",
    });
    expect(home.article).toBeUndefined();
    expect(home).toMatchObject({
      renderMode: "article",
      route: "/",
      status: "ready",
      title: "Northwind Journal",
    });
    expect(empty).toMatchObject({
      renderMode: "empty",
      route: "/",
      status: "idle",
    });
  });

  test("derives settings view data from descriptor-backed config sections", () => {
    const saved = settingsViewModel(studioMvpFixture, {
      activeSettingsSectionId: "site-identity",
    });
    const homepage = settingsViewModel(studioMvpFixture, {
      activeSettingsSectionId: "homepage",
    });
    const dirty = settingsViewModel(studioMvpFixture, {
      activeSettingsSectionId: "navigation",
    });
    const invalid = settingsViewModel(studioMvpFixture, {
      activeSettingsSectionId: "domain",
    });

    expect(saved?.settings.state).toBe("saved");
    expect(saved?.sections.map((section) => section.id)).toEqual([
      "site-identity",
      "domain",
      "navigation",
      "social-support",
      "authors",
      "categories",
      "homepage",
      "theme",
      "publishing",
    ]);
    expect(homepage).toMatchObject({
      activeSection: { id: "homepage", label: "Homepage" },
      settings: { id: "settings-saved" },
    });
    expect(
      dirty?.activeSection.fields.find((field) => field.id === "articlesInNav")
        ?.draftValue,
    ).toBe(false);
    expect(dirty?.settings.state).toBe("dirty");
    expect(invalid).toMatchObject({
      activeSection: { id: "domain" },
      diagnostics: [{ code: "STUDIO-SETTINGS-SITE-URL-INVALID" }],
      fieldDiagnostics: [
        {
          diagnostic: { code: "STUDIO-SETTINGS-SITE-URL-INVALID" },
          field: { id: "siteUrl", draftValue: "northwindjournal" },
          section: { id: "domain" },
        },
      ],
      settings: { state: "invalid" },
    });
  });

  test("derives media browser view data from fixture media and local state", () => {
    const grid = mediaLibraryViewModel(studioMvpFixture, {
      activeMediaId: "media-writing-desk-hero",
      media: { query: "", viewMode: "grid" },
    });
    const missingAlt = mediaLibraryViewModel(studioMvpFixture, {
      activeMediaId: "media-desk-sketch-missing-alt",
      media: { query: "", viewMode: "grid" },
    });
    const searched = mediaLibraryViewModel(studioMvpFixture, {
      media: { query: "pegboard", viewMode: "list" },
    });
    const noResults = mediaLibraryViewModel(studioMvpFixture, {
      media: { query: "luthiery", viewMode: "grid" },
    });

    expect(grid.items).toHaveLength(studioMvpFixture.media.items.length);
    expect(grid.selectedItem).toMatchObject({
      item: {
        displayName: "writing-desk-hero.jpg",
        id: "media-writing-desk-hero",
        status: "ready",
      },
    });
    expect(missingAlt.selectedItem).toMatchObject({
      diagnostic: { code: "STUDIO-MEDIA-MISSING-ALT" },
      item: {
        altText: "",
        id: "media-desk-sketch-missing-alt",
        status: "missing-alt",
      },
    });
    expect(searched).toMatchObject({
      items: [{ item: { id: "media-pegboard-tools" } }],
      query: "pegboard",
      viewMode: "list",
    });
    expect(noResults).toMatchObject({
      emptyState: "no-filter-results",
      items: [],
      query: "luthiery",
    });
  });

  test("derives publish workflow data with redacted credential state", () => {
    const articlePublish = publishViewModel(studioMvpFixture, {
      activeArticleId: "article-writing-desk",
      activePreviewScenarioId: "preview-ready",
      activePublishScenarioId: "publish-preview",
    });
    const homePublish = publishViewModel(studioMvpFixture, {
      activePublishScenarioId: "publish-preview",
    });
    const blocked = publishViewModel(studioMvpFixture, {
      activePublishScenarioId: "publish-blocked",
    });
    const failed = publishViewModel(studioMvpFixture, {
      activePublishScenarioId: "publish-failed",
    });

    expect(articlePublish).toMatchObject({
      credentialStateLabel: "Connected credential reference",
      plan: {
        checkpointRequired: true,
        destinationUrl: "https://northwindjournal.com",
        operationFamily: "publish.plan",
      },
      preview: { route: "/articles/how-to-build-a-writing-desk/" },
      publish: { status: "preview-ready" },
      statusLabel: "Preview ready",
    });
    expect(homePublish?.preview).toMatchObject({ route: "/" });
    expect(blocked).toMatchObject({
      credentialStateLabel: "Provider not connected",
      diagnostics: [{ code: "STUDIO-PUBLISH-MISSING-CLOUDFLARE" }],
      shouldShowConfirmDialog: false,
      statusTone: "danger",
    });
    expect(failed).toMatchObject({
      diagnostics: [{ code: "STUDIO-PUBLISH-FAILED" }],
      statusLabel: "Failed",
      statusTone: "warning",
    });
    expect(JSON.stringify(articlePublish)).not.toContain("secret");
    expect(JSON.stringify(blocked)).not.toContain("apiKey");
  });

  test("derives restore view data from checkpoints and history capabilities", () => {
    const ready = restoreViewModel(studioMvpFixture, {
      activeArticleId: "article-writing-desk",
      activeRestoreScenarioId: "restore-ready",
    });
    const confirm = restoreViewModel(studioMvpFixture, {
      activeRestoreScenarioId: "restore-confirm",
    });
    const unavailable = restoreViewModel(studioMvpFixture, {
      activeRestoreScenarioId: "restore-unavailable",
    });

    expect(ready).toMatchObject({
      article: { id: "article-writing-desk" },
      checkpoints: [
        { id: "checkpoint-writing-desk-autosave" },
        { id: "checkpoint-writing-desk-draft" },
      ],
      historyProvider: { id: "local-checkpoints" },
      restore: { id: "restore-ready", status: "ready" },
      selectedCheckpoint: { id: "checkpoint-writing-desk-autosave" },
    });
    expect(confirm).toMatchObject({
      restore: { id: "restore-confirm", status: "confirm-open" },
      selectedCheckpoint: { id: "checkpoint-writing-desk-draft" },
    });
    expect(unavailable).toMatchObject({
      diagnostics: [{ code: "STUDIO-RESTORE-UNAVAILABLE" }],
      restore: { id: "restore-unavailable", status: "unavailable" },
    });
    expect(
      restoreViewModel(
        { ...studioMvpFixture, restoreFlows: [] },
        { activeRestoreScenarioId: "missing" },
      ),
    ).toBeUndefined();
  });

  test("catches duplicate IDs and broken fixture references", () => {
    const article = requiredArticle("article-writing-desk");
    const media = requiredMedia("media-writing-desk-hero");
    const fixture = {
      ...studioMvpFixture,
      articleDirectories: studioMvpFixture.articleDirectories.map(
        (directory) =>
          directory.id === "directory-populated"
            ? withBrokenMediaReference(directory)
            : directory,
      ),
      articles: [...studioMvpFixture.articles, article],
      diagnostics: [
        ...studioMvpFixture.diagnostics,
        studioMvpFixture.diagnostics[0],
      ],
      media: {
        ...studioMvpFixture.media,
        items: [...studioMvpFixture.media.items, media],
      },
      sessions: [
        ...studioMvpFixture.sessions,
        { ...studioMvpFixture.sessions[0] },
      ],
    } satisfies StudioMvpFixture;

    expect(
      validateStudioMvpFixture(fixture).map((issue) => issue.code),
    ).toEqual(
      expect.arrayContaining([
        "studio.fixture.broken-directory-media",
        "studio.fixture.duplicate-article-id",
        "studio.fixture.duplicate-diagnostic-code",
        "studio.fixture.duplicate-media-id",
        "studio.fixture.duplicate-session-id",
      ]),
    );
  });

  test("catches broken screen, session, article-tree, and scenario references", () => {
    const fixture = {
      ...studioMvpFixture,
      navigation: {
        ...studioMvpFixture.navigation,
        articleTree: studioMvpFixture.navigation.articleTree.map(
          (node, index) =>
            index === 0 ? { ...node, articleId: "missing-article" } : node,
        ),
      },
      screenStates: studioMvpFixture.screenStates
        .filter((screenState) => screenState.id !== "preview-loading")
        .map((screenState) =>
          screenState.id === "first-launch"
            ? { ...screenState, sessionId: "missing-session" }
            : screenState,
        ),
      sessions: studioMvpFixture.sessions.map((session) =>
        session.id === "session-editor-clean"
          ? {
              ...session,
              activeArticleId: "missing-article",
              activeDirectoryScenarioId: "missing-directory",
              activeMediaId: "missing-media",
              activePreviewScenarioId: "missing-preview",
              activePublishScenarioId: "missing-publish",
              activeRestoreScenarioId: "missing-restore",
            }
          : session,
      ),
    } satisfies StudioMvpFixture;

    expect(
      validateStudioMvpFixture(fixture).map((issue) => issue.code),
    ).toEqual(
      expect.arrayContaining([
        "studio.fixture.broken-tree-article",
        "studio.fixture.broken-screen-session",
        "studio.fixture.broken-session-article",
        "studio.fixture.broken-session-directory",
        "studio.fixture.broken-session-media",
        "studio.fixture.broken-session-preview",
        "studio.fixture.broken-session-publish",
        "studio.fixture.broken-session-restore",
        "studio.fixture.missing-screen-state",
      ]),
    );
  });

  test("requires diagnostics for invalid and blocked fixture states", () => {
    const fixture = {
      ...studioMvpFixture,
      articles: studioMvpFixture.articles.map((article) =>
        article.id === "article-writing-desk-invalid"
          ? (() => {
              const articleWithoutFieldDiagnostics = {
                ...article,
                diagnostics: [],
                frontmatter: article.frontmatter.map((section) => ({
                  ...section,
                  fields: section.fields.map((field) =>
                    field.id === "title"
                      ? (() => {
                          const validationWithoutDiagnostic = {
                            ...field.validation,
                          };
                          delete validationWithoutDiagnostic.diagnosticCode;

                          return {
                            ...field,
                            validation: validationWithoutDiagnostic,
                          };
                        })()
                      : field,
                  ),
                })),
              } satisfies ArticleDocumentFixture;

              return articleWithoutFieldDiagnostics;
            })()
          : article,
      ),
      settings: studioMvpFixture.settings.map((settings) =>
        settings.id === "settings-invalid"
          ? { ...settings, diagnostics: [] }
          : settings,
      ),
      previews: studioMvpFixture.previews.map((preview) =>
        preview.id === "preview-blocked"
          ? { ...preview, diagnostics: [] }
          : preview,
      ),
      publishes: studioMvpFixture.publishes.map((publish) =>
        publish.id === "publish-blocked"
          ? { ...publish, diagnostics: [] }
          : publish,
      ),
    } satisfies StudioMvpFixture;

    expect(
      validateStudioMvpFixture(fixture).map((issue) => issue.code),
    ).toEqual(
      expect.arrayContaining([
        "studio.fixture.invalid-article-missing-diagnostic",
        "studio.fixture.invalid-field-missing-diagnostic",
        "studio.fixture.invalid-settings-missing-diagnostic",
        "studio.fixture.preview-missing-diagnostic",
        "studio.fixture.publish-missing-diagnostic",
      ]),
    );
  });

  test("keeps media fixtures local and explicit about non-ready states", () => {
    expect(
      studioMvpFixture.media.items.every(
        (media) =>
          media.fullUrl.startsWith("/fixtures/studio/media/") &&
          media.thumbnailUrl.startsWith("/fixtures/studio/media/"),
      ),
    ).toBe(true);
    expect(requiredMedia("media-desk-sketch-missing-alt")).toMatchObject({
      altText: "",
      diagnosticCode: "STUDIO-MEDIA-MISSING-ALT",
      status: "missing-alt",
    });
    expect(requiredMedia("media-missing-source")).toMatchObject({
      diagnosticCode: "STUDIO-MEDIA-MISSING-SOURCE",
      status: "missing",
    });
  });

  test("rejects media fixtures with nonlocal assets or incoherent non-ready states", () => {
    const ready = requiredMedia("media-writing-desk-hero");
    const missingAlt = requiredMedia("media-desk-sketch-missing-alt");
    const missing = requiredMedia("media-missing-source");
    const missingWithoutDiagnostic = { ...missing };
    delete missingWithoutDiagnostic.diagnosticCode;
    const fixture = {
      ...studioMvpFixture,
      media: {
        ...studioMvpFixture.media,
        items: [
          {
            ...ready,
            fullUrl: "https://example.com/remote-full.jpg",
          },
          {
            ...missingAlt,
            altText: "This should not exist while status is missing-alt.",
          },
          {
            ...missingWithoutDiagnostic,
          },
        ],
      },
    } satisfies StudioMvpFixture;

    expect(
      validateStudioMvpFixture(fixture).map((issue) => issue.code),
    ).toEqual(
      expect.arrayContaining([
        "studio.fixture.media-missing-alt-has-alt",
        "studio.fixture.media-missing-diagnostic",
        "studio.fixture.media-nonlocal-asset",
      ]),
    );
  });
});

function requiredArticle(id: string): ArticleDocumentFixture {
  const article = studioMvpFixture.articles.find(
    (candidate) => candidate.id === id,
  );

  if (article === undefined) {
    throw new Error(`Missing test article fixture: ${id}`);
  }

  return article;
}

function requiredMedia(id: string): MediaItemFixture {
  const media = studioMvpFixture.media.items.find(
    (candidate) => candidate.id === id,
  );

  if (media === undefined) {
    throw new Error(`Missing test media fixture: ${id}`);
  }

  return media;
}

function withBrokenMediaReference(
  directory: ArticleDirectoryFixture,
): ArticleDirectoryFixture {
  return {
    ...directory,
    results: directory.results.map((result, index) =>
      index === 0 ? brokenMediaResult(result) : result,
    ),
  };
}

function brokenMediaResult(
  result: ArticleDirectoryResultFixture,
): ArticleDirectoryResultFixture {
  return {
    ...result,
    featuredMediaId: "media-does-not-exist",
  };
}
