import { describe, expect, test } from "bun:test";

import type { StudioEditorialState } from "../../../src/lib/studio-models";
import {
  missingWorkflowCapabilities,
  runMockStudioWorkflowAction,
  studioProviderCapabilities,
  studioWorkflowAdapterProfile,
  studioWorkflowAdapterProfiles,
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
});
