import { describe, expect, test } from "bun:test";

import { createAuthorDiagnostic } from "../../../src/lib/author-diagnostics";
import {
  studioEditableDomains,
  studioEditorDocuments,
  type StudioEditorialState,
  studioFieldDescriptors,
  studioFieldsForDiagnostic,
  studioSourceReference,
  studioSourceReferences,
  transitionStudioEditorialState,
} from "../../../src/lib/studio-models";

describe("studio models", () => {
  test("describes every editable domain through source contracts", () => {
    expect(studioSourceReferences().map((source) => source.domain)).toEqual(
      Array.from(studioEditableDomains),
    );
    expect(studioSourceReference("article")).toMatchObject({
      artifactKey: "content.articles",
      defaultOwner: "author",
      role: "content",
      schemaOwner: "article-schema",
    });
    expect(studioSourceReference("site-config")).toMatchObject({
      artifactKey: "config.site",
      defaultOwner: "site-owner",
      role: "config",
      schemaOwner: "site-config-schema",
    });
  });

  test("builds deterministic JSON-ready editor documents and field descriptors", () => {
    const documents = studioEditorDocuments();
    const article = documents.find((document) => document.id === "article");
    const siteConfig = documents.find(
      (document) => document.id === "site-config",
    );

    expect(JSON.parse(JSON.stringify(documents))).toEqual(documents);
    expect(article?.fields.map((field) => field.fieldPath)).toContain("pdf");
    expect(
      article?.fields.find((field) => field.fieldPath === "title"),
    ).toMatchObject({
      effects: ["metadata", "route", "search", "sitemap"],
      input: "text",
      label: "Title",
      required: true,
    });
    expect(siteConfig?.fields.map((field) => field.fieldPath)).toContain(
      "routes.articles",
    );
  });

  test("keeps representative content, config, redirect, media, and homepage fields mapped", () => {
    expect(
      studioFieldDescriptors("collection").find(
        (field) => field.fieldPath === "items",
      ),
    ).toMatchObject({
      diagnostics: ["content", "routes"],
      effects: ["homepage", "route"],
      input: "reference",
    });
    const redirectFields = studioFieldDescriptors("redirect");

    expect(redirectFields[0]).toMatchObject({
      fieldPath: "from",
      owner: "site-owner",
      required: true,
    });
    expect(redirectFields[1]).toMatchObject({
      fieldPath: "to",
      owner: "site-owner",
      required: true,
    });
    expect(
      studioFieldDescriptors("media-asset").find(
        (field) => field.fieldPath === "alt",
      ),
    ).toMatchObject({
      diagnostics: ["accessibility", "media"],
      effects: ["metadata", "pdf", "search", "social-preview"],
      required: true,
    });
    expect(
      studioFieldDescriptors("site-config").find(
        (field) => field.fieldPath === "homepage",
      ),
    ).toMatchObject({
      effects: ["homepage"],
      owner: "site-owner",
    });
  });

  test("maps repairable diagnostics to likely studio fields", () => {
    const diagnostic = createAuthorDiagnostic({
      category: "metadata",
      code: "metadata.missing-description",
      fixability: "source-edit",
      location: {
        fieldPath: "description",
        sourcePath: "site/content/articles/example.md",
      },
      repairOwner: "author",
      severity: "warning",
      source: "site-doctor",
      summary: "Description is missing.",
    });

    const fields = studioFieldsForDiagnostic(diagnostic);

    expect(fields.map((field) => field.fieldPath)).toContain("description");
    expect(fields.some((field) => field.source.domain === "article")).toBe(
      true,
    );
  });

  test("accepts valid editorial state transitions", () => {
    const draft: StudioEditorialState = { kind: "draft" };
    const review = { id: "review-1", label: "Review 1" };
    const release = { id: "release-1", label: "Release 1" };
    const restorePoint = { id: "restore-1", label: "Before publish" };

    const ready = transitionStudioEditorialState(draft, "mark-ready");
    const inReview = transitionStudioEditorialState(
      ready.state,
      "submit-review",
      {
        review,
      },
    );
    const approved = transitionStudioEditorialState(inReview.state, "approve");
    const scheduled = transitionStudioEditorialState(
      approved.state,
      "schedule",
      {
        publishAt: "2026-06-01T12:00:00.000Z",
      },
    );
    const published = transitionStudioEditorialState(
      scheduled.state,
      "publish",
      {
        release,
      },
    );
    const rollback = transitionStudioEditorialState(
      published.state,
      "roll-back",
      {
        restorePoint,
      },
    );
    const restored = transitionStudioEditorialState(rollback.state, "restore");

    expect([
      ready.state.kind,
      inReview.state.kind,
      approved.state.kind,
      scheduled.state.kind,
      published.state.kind,
      rollback.state.kind,
      restored.state.kind,
    ]).toEqual([
      "ready",
      "in-review",
      "approved",
      "scheduled",
      "published",
      "rollback-proposed",
      "ready",
    ]);
  });

  test("rejects invalid editorial state transitions with actionable diagnostics", () => {
    const draft: StudioEditorialState = { kind: "draft" };
    const published: StudioEditorialState = {
      kind: "published",
      release: { id: "release-1", label: "Release 1" },
    };
    const blockingDiagnostic = createAuthorDiagnostic({
      category: "frontmatter",
      code: "frontmatter.invalid-date",
      fixability: "source-edit",
      repairOwner: "author",
      severity: "error",
      source: "content-schema",
      summary: "Date is invalid.",
    });

    expect(transitionStudioEditorialState(draft, "publish")).toMatchObject({
      diagnostics: [
        "Only ready, approved, or scheduled entries can be published.",
      ],
      ok: false,
      state: draft,
    });
    expect(
      transitionStudioEditorialState({ kind: "ready" }, "schedule", {
        blockingDiagnostics: [blockingDiagnostic],
        publishAt: "2026-06-01T12:00:00.000Z",
      }),
    ).toMatchObject({
      diagnostics: ["Resolve blocking diagnostics before continuing."],
      ok: false,
    });
    expect(
      transitionStudioEditorialState(draft, "submit-review"),
    ).toMatchObject({
      diagnostics: ["Review submission requires a review reference."],
      ok: false,
    });

    for (const [state, action, diagnostic] of [
      [draft, "approve", "Only review states can be approved."],
      [published, "mark-ready", "Published entries are already public."],
      [draft, "request-changes", "Only review states can request changes."],
      [draft, "restore", "Only rollback proposals can be restored."],
      [draft, "schedule", "Only ready or approved entries can be scheduled."],
      [
        draft,
        "unpublish",
        "Only published or scheduled entries can be unpublished.",
      ],
    ] as const) {
      expect(transitionStudioEditorialState(state, action)).toMatchObject({
        diagnostics: [diagnostic],
        ok: false,
        state,
      });
    }

    expect(transitionStudioEditorialState(draft, "roll-back")).toMatchObject({
      diagnostics: ["Rollback requires a restore point."],
      ok: false,
      state: draft,
    });
  });
});
