import { describe, expect, test } from "bun:test";

import type { StudioEditorialState } from "../../../src/lib/studio-models";
import {
  missingWorkflowCapabilities,
  runMockStudioWorkflowAction,
  studioProviderCapabilities,
  studioWorkflowAdapterProfile,
  studioWorkflowAdapterProfiles,
  type StudioWorkflowOperation,
} from "../../../src/lib/studio-workflows";

describe("studio workflows", () => {
  test("declares provider-neutral capabilities and workflow profiles", () => {
    const capabilityIds = studioProviderCapabilities().map(
      (capability) => capability.id,
    );

    expect(capabilityIds).toContain("source.write");
    expect(capabilityIds).toContain("workflow.direct-publish");
    expect(capabilityIds).toContain("workflow.review");
    expect(capabilityIds).toContain("deploy.publish");
    expect(capabilityIds).toContain("deploy.cache.invalidate");
    expect(
      studioWorkflowAdapterProfiles().map((profile) => profile.id),
    ).toEqual(["local-direct-publish", "optional-review", "provider-review"]);
    expect(studioWorkflowAdapterProfile("provider-review")).toMatchObject({
      mode: "provider-review",
      userVocabulary: "advanced",
    });
    expect(() => studioWorkflowAdapterProfile("missing-profile")).toThrow(
      'Missing studio workflow adapter profile "missing-profile".',
    );
  });

  test("checks operation support through capabilities instead of provider names", () => {
    const direct = studioWorkflowAdapterProfile("local-direct-publish");
    const review = studioWorkflowAdapterProfile("optional-review");

    expect(missingWorkflowCapabilities(direct, "submit-review")).toEqual([
      "workflow.review",
      "source.diff",
    ]);
    expect(missingWorkflowCapabilities(review, "submit-review")).toEqual([]);
    expect(missingWorkflowCapabilities(direct, "publish")).toEqual([]);
    expect(missingWorkflowCapabilities(direct, "cache-invalidate")).toEqual([
      "deploy.cache.invalidate",
    ]);
  });

  test("runs direct publish workflow with deterministic events and diffs", () => {
    const profile = studioWorkflowAdapterProfile("local-direct-publish");
    const release = { id: "release-1" };
    const ready: StudioEditorialState = { kind: "ready" };

    const result = runMockStudioWorkflowAction({
      context: { release },
      operation: "publish",
      profile,
      sourcePath: "site/content/articles/example.md",
      state: ready,
    });

    expect(result).toMatchObject({
      events: [
        {
          action: "publish",
          publicDetail: "Published.",
          status: "completed",
        },
      ],
      ok: true,
      sourceDiffs: [
        {
          kind: "publish-release",
          path: "site/content/articles/example.md",
          summary: "Published.",
        },
      ],
      state: {
        kind: "published",
        release,
      },
    });
  });

  test("runs optional review workflow without leaking provider mechanics", () => {
    const profile = studioWorkflowAdapterProfile("optional-review");
    const draft: StudioEditorialState = { kind: "draft" };

    const submitted = runMockStudioWorkflowAction({
      context: { review: { id: "review-1" } },
      operation: "submit-review",
      profile,
      sourcePath: "site/content/articles/example.md",
      state: draft,
    });
    const approved = runMockStudioWorkflowAction({
      operation: "approve",
      profile,
      sourcePath: "site/content/articles/example.md",
      state: submitted.state,
    });

    expect(submitted).toMatchObject({
      ok: true,
      sourceDiffs: [
        {
          kind: "write-workflow-state",
          summary: "Submitted for review.",
        },
      ],
      state: { kind: "in-review" },
    });
    expect(approved).toMatchObject({
      ok: true,
      sourceDiffs: [
        {
          kind: "write-workflow-state",
          summary: "Review approved.",
        },
      ],
      state: { kind: "approved" },
    });
    expect(submitted.events[0]?.advancedDetail).toBeUndefined();
  });

  test("blocks unsupported or invalid mocked workflow actions", () => {
    const direct = studioWorkflowAdapterProfile("local-direct-publish");
    const draft: StudioEditorialState = { kind: "draft" };

    expect(
      runMockStudioWorkflowAction({
        operation: "submit-review",
        profile: direct,
        state: draft,
      }),
    ).toMatchObject({
      diagnostics: ["Missing capabilities: workflow.review, source.diff."],
      ok: false,
    });
    expect(
      runMockStudioWorkflowAction({
        operation: "publish",
        profile: direct,
        state: draft,
      }),
    ).toMatchObject({
      diagnostics: [
        "Only ready, approved, or scheduled entries can be published.",
      ],
      ok: false,
    });
  });

  test("runs provider-only no-source operations without changing editorial state", () => {
    const profile = studioWorkflowAdapterProfile("provider-review");
    const state: StudioEditorialState = { kind: "ready" };
    const operations = [
      ["preview", "Preview prepared.", undefined],
      [
        "deploy-status",
        "Deploy status checked.",
        "Provider adapters may expose deploy logs, release IDs, and cache evidence as advanced details.",
      ],
      [
        "cache-invalidate",
        "Cache invalidation requested.",
        "Provider adapters may expose deploy logs, release IDs, and cache evidence as advanced details.",
      ],
      [
        "release-health",
        "Release health checked.",
        "Provider adapters may expose deploy logs, release IDs, and cache evidence as advanced details.",
      ],
    ] satisfies ReadonlyArray<
      readonly [StudioWorkflowOperation, string, string | undefined]
    >;

    expect(
      operations.map(([operation, publicDetail, advancedDetail]) => {
        const result = runMockStudioWorkflowAction({
          operation,
          profile,
          sourcePath: "site/content/articles/example.md",
          state,
        });

        return {
          advancedDetail: result.events[0]?.advancedDetail,
          kind: result.sourceDiffs[0]?.kind,
          ok: result.ok,
          operation,
          publicDetail: result.events[0]?.publicDetail,
          state: result.state,
          summary: result.sourceDiffs[0]?.summary,
          expected: { advancedDetail, publicDetail },
        };
      }),
    ).toEqual([
      {
        advancedDetail: undefined,
        expected: {
          advancedDetail: undefined,
          publicDetail: "Preview prepared.",
        },
        kind: "no-source-change",
        ok: true,
        operation: "preview",
        publicDetail: "Preview prepared.",
        state,
        summary: "Preview prepared.",
      },
      {
        advancedDetail:
          "Provider adapters may expose deploy logs, release IDs, and cache evidence as advanced details.",
        expected: {
          advancedDetail:
            "Provider adapters may expose deploy logs, release IDs, and cache evidence as advanced details.",
          publicDetail: "Deploy status checked.",
        },
        kind: "no-source-change",
        ok: true,
        operation: "deploy-status",
        publicDetail: "Deploy status checked.",
        state,
        summary: "Deploy status checked.",
      },
      {
        advancedDetail:
          "Provider adapters may expose deploy logs, release IDs, and cache evidence as advanced details.",
        expected: {
          advancedDetail:
            "Provider adapters may expose deploy logs, release IDs, and cache evidence as advanced details.",
          publicDetail: "Cache invalidation requested.",
        },
        kind: "no-source-change",
        ok: true,
        operation: "cache-invalidate",
        publicDetail: "Cache invalidation requested.",
        state,
        summary: "Cache invalidation requested.",
      },
      {
        advancedDetail:
          "Provider adapters may expose deploy logs, release IDs, and cache evidence as advanced details.",
        expected: {
          advancedDetail:
            "Provider adapters may expose deploy logs, release IDs, and cache evidence as advanced details.",
          publicDetail: "Release health checked.",
        },
        kind: "no-source-change",
        ok: true,
        operation: "release-health",
        publicDetail: "Release health checked.",
        state,
        summary: "Release health checked.",
      },
    ]);
  });

  test("models remaining editorial workflow operations with explicit source-diff kinds", () => {
    const profile = studioWorkflowAdapterProfile("provider-review");
    const review = { id: "review-1" };
    const release = { id: "release-1" };
    const restorePoint = { id: "restore-1" };

    expect(
      runMockStudioWorkflowAction({
        operation: "save-draft",
        profile,
        state: { kind: "published", release },
      }),
    ).toMatchObject({
      ok: true,
      sourceDiffs: [{ kind: "write-source", summary: "Draft saved." }],
      state: { kind: "draft" },
    });
    expect(
      runMockStudioWorkflowAction({
        context: { publishAt: "2026-06-01T10:00:00.000Z" },
        operation: "schedule",
        profile,
        state: { kind: "approved", review },
      }),
    ).toMatchObject({
      ok: true,
      sourceDiffs: [
        { kind: "write-workflow-state", summary: "Publish scheduled." },
      ],
      state: { kind: "scheduled", publishAt: "2026-06-01T10:00:00.000Z" },
    });
    expect(
      runMockStudioWorkflowAction({
        context: { unpublishReason: "Correction needed." },
        operation: "unpublish",
        profile,
        state: { kind: "published", release },
      }),
    ).toMatchObject({
      ok: true,
      sourceDiffs: [{ kind: "write-source", summary: "Unpublished." }],
      state: { kind: "unpublished", reason: "Correction needed." },
    });
    expect(
      runMockStudioWorkflowAction({
        context: { restorePoint },
        operation: "rollback",
        profile,
        state: { kind: "published", release },
      }),
    ).toMatchObject({
      ok: true,
      sourceDiffs: [{ kind: "write-source", summary: "Rollback proposed." }],
      state: { kind: "rollback-proposed", restorePoint },
    });
    expect(
      runMockStudioWorkflowAction({
        operation: "restore-version",
        profile,
        state: { kind: "rollback-proposed", restorePoint },
      }),
    ).toMatchObject({
      ok: true,
      sourceDiffs: [{ kind: "write-source", summary: "Version restored." }],
      state: { kind: "ready" },
    });
    expect(
      runMockStudioWorkflowAction({
        operation: "request-changes",
        profile,
        state: { kind: "approved", review },
      }),
    ).toMatchObject({
      ok: true,
      sourceDiffs: [
        { kind: "write-workflow-state", summary: "Changes requested." },
      ],
      state: { kind: "changes-requested", review },
    });
  });
});
