import { describe, expect, test } from "bun:test";

import { createAuthorDiagnostic } from "../../../src/lib/author-diagnostics";
import {
  applyStudioFieldPatches,
  createStudioPreviewRequest,
  createStudioPreviewResponse,
  normalizeStudioFieldPatches,
  studioFormDescriptorForDomain,
  studioFormDescriptors,
  unsupportedFieldDiagnostic,
} from "../../../src/lib/studio-forms";
import {
  studioEditorDocuments,
  type StudioFieldDescriptor,
} from "../../../src/lib/studio-models";

describe("studio forms and previews", () => {
  test("creates deterministic JSON-ready form descriptors", () => {
    const descriptors = studioFormDescriptors();
    const article = studioFormDescriptorForDomain("article");

    expect(JSON.parse(JSON.stringify(descriptors))).toEqual(descriptors);
    expect(article.sections.map((section) => section.id)).toContain("beginner");
    const fieldPaths = article.sections.flatMap((section) =>
      section.fields.map((field) => field.fieldPath),
    );

    expect(fieldPaths).toContain("body");
    expect(fieldPaths).toContain("title");
    expect(fieldPaths).toContain("description");
    expect(fieldPaths).toContain("pdf");
    expect(
      article.sections
        .find((section) => section.id === "advanced")
        ?.fields.map((field) => field.fieldPath),
    ).toContain("pdf");
  });

  test("normalizes valid patches and rejects unknown fields", () => {
    const document = studioEditorDocuments().find(
      (candidate) => candidate.id === "site-config",
    );

    if (document === undefined) {
      throw new Error("Missing site-config document.");
    }

    const result = normalizeStudioFieldPatches(document, [
      { fieldPath: "identity.title", value: "New Site" },
      { fieldPath: "missing.field", value: true },
    ]);

    expect(result.normalizedPatches).toHaveLength(1);
    expect(result.normalizedPatches[0]).toMatchObject({
      fieldPath: "identity.title",
      value: "New Site",
      writeMode: "source-edit",
    });
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      category: "config",
      code: "config.studio-field-unknown",
      repairOwner: "site-owner",
    });
    expect(
      applyStudioFieldPatches(
        { identity: { title: "Old Site" } },
        result.normalizedPatches,
      ),
    ).toEqual({
      identity: {
        title: "New Site",
      },
    });
  });

  test("keeps code-only studio fields behind an explicit source-edit escape hatch", () => {
    const article = requiredStudioDocument("article");
    const codeOnlyField: StudioFieldDescriptor = {
      diagnostics: ["content"],
      editability: "code-only",
      effects: ["route"],
      fieldPath: "mdx.customWidget",
      id: "mdx.customWidget",
      input: "textarea",
      label: "Custom widget",
      owner: "author",
      required: false,
      source: article.source,
    };
    const document = {
      ...article,
      fields: [...article.fields, codeOnlyField],
    };
    const patch = {
      fieldPath: "mdx.customWidget",
      value: "<CustomWidget />",
    };

    const blocked = normalizeStudioFieldPatches(document, [patch]);
    const allowed = normalizeStudioFieldPatches(document, [patch], {
      allowCodeOnly: true,
    });

    expect(blocked).toMatchObject({
      normalizedPatches: [],
      unsupportedFields: ["mdx.customWidget"],
    });
    expect(blocked.diagnostics[0]).toMatchObject({
      code: "content.studio-preview-unsupported",
      location: { fieldPath: "mdx.customWidget" },
    });
    expect(allowed.normalizedPatches).toHaveLength(1);
    expect(allowed.normalizedPatches[0]).toMatchObject({
      fieldPath: "mdx.customWidget",
      writeMode: "source-edit",
    });
  });

  test("ignores invalid empty patch paths before mutating source objects", () => {
    const article = requiredStudioDocument("article");
    const emptyPathField: StudioFieldDescriptor = {
      diagnostics: ["content"],
      editability: "beginner",
      effects: ["route"],
      fieldPath: "",
      id: "empty-path",
      input: "text",
      label: "Empty path",
      owner: "author",
      required: false,
      source: article.source,
    };
    const result = normalizeStudioFieldPatches(
      {
        ...article,
        fields: [...article.fields, emptyPathField],
      },
      [{ fieldPath: "", value: "Ignored" }],
    );

    expect(
      applyStudioFieldPatches({ title: "Original" }, result.normalizedPatches),
    ).toEqual({ title: "Original" });
  });

  test("creates preview requests and responses from dirty editor state", () => {
    const request = createStudioPreviewRequest({
      artifacts: ["html", "metadata", "pdf"],
      domain: "article",
      patches: [
        { fieldPath: "title", value: "Preview Title" },
        { fieldPath: "pdf", value: false, writeMode: "draft-only" },
      ],
      targets: [{ route: "/articles/example/" }],
    });
    const response = createStudioPreviewResponse({ request });

    expect(response).toMatchObject({
      artifacts: ["html", "metadata", "pdf"],
      status: "ready",
      targets: [{ route: "/articles/example/" }],
    });
    expect(response.normalizedPatches.map((patch) => patch.fieldPath)).toEqual([
      "title",
      "pdf",
    ]);
  });

  test("marks previews unavailable when provider capabilities are missing", () => {
    const request = createStudioPreviewRequest({
      domain: "media-asset",
      patches: [{ fieldPath: "source", value: "external://asset.jpg" }],
      requiredCapabilities: ["media.materialize"],
    });
    const response = createStudioPreviewResponse({
      request,
      unavailableCapabilities: ["media.materialize"],
    });

    expect(response).toMatchObject({
      requiredCapabilities: ["media.materialize"],
      status: "unavailable",
      unavailableCapabilities: ["media.materialize"],
    });
  });

  test("keeps unsupported preview states explicit", () => {
    const field: StudioFieldDescriptor = {
      diagnostics: ["content"],
      editability: "code-only",
      effects: ["route"],
      fieldPath: "mdx.customWidget",
      id: "mdx.customWidget",
      input: "textarea",
      label: "Custom widget",
      owner: "author",
      required: false,
      source: requiredStudioDocument("article").source,
    };
    const diagnostic = unsupportedFieldDiagnostic(field);
    const repairDiagnostic = createAuthorDiagnostic({
      category: "content",
      code: "content.preview-blocked",
      fixability: "source-edit",
      repairOwner: "author",
      severity: "warning",
      source: "site-doctor",
      summary: "Preview is blocked.",
    });
    const request = createStudioPreviewRequest({
      domain: "article",
      patches: [{ fieldPath: "not-a-field", value: "x" }],
    });
    const response = createStudioPreviewResponse({
      diagnostics: [diagnostic, repairDiagnostic],
      request,
    });

    expect(diagnostic).toMatchObject({
      code: "content.studio-preview-unsupported",
      location: { fieldPath: "mdx.customWidget" },
    });
    expect(response).toMatchObject({
      status: "diagnostics",
    });
    expect(response.diagnostics.map((item) => item.code)).toEqual([
      "content.studio-field-unknown",
      "content.studio-preview-unsupported",
      "content.preview-blocked",
    ]);
  });
});

function requiredStudioDocument(id: string) {
  const document = studioEditorDocuments().find(
    (candidate) => candidate.id === id,
  );

  if (document === undefined) {
    throw new Error(`Missing studio document "${id}".`);
  }

  return document;
}
