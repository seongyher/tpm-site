import { z } from "astro/zod";
import { describe, expect, test } from "bun:test";

import {
  articleSchema,
  editorialCollectionSchema,
} from "../../../src/lib/content-schemas";
import { parseSiteConfig } from "../../../src/lib/site-config";
import { parseSiteRedirects } from "../../../src/lib/site-redirects";
import {
  applyStudioFieldPatches,
  createStudioPreviewRequest,
  createStudioPreviewResponse,
  normalizeStudioFieldPatches,
  type StudioJsonObject,
} from "../../../src/lib/studio-forms";
import { studioEditorDocuments } from "../../../src/lib/studio-models";
import {
  runMockStudioWorkflowAction,
  studioWorkflowAdapterProfile,
} from "../../../src/lib/studio-workflows";

describe("studio round-trip and parity fixtures", () => {
  test("round-trips Markdown article frontmatter through the article schema", () => {
    const document = requiredDocument("article");
    const source = {
      author: "Author",
      date: "2026-05-22",
      description: "Original description.",
      draft: true,
      tags: ["memes"],
      title: "Original Title",
      visibility: {
        collections: true,
        directory: true,
        external: true,
        feed: true,
        homepage: true,
        pdf: true,
        related: true,
        search: true,
        sitemap: true,
      },
    };
    const patches = normalizeStudioFieldPatches(document, [
      { fieldPath: "title", value: "Edited Title" },
      { fieldPath: "draft", value: false },
      {
        fieldPath: "visibility",
        value: {
          collections: true,
          directory: true,
          external: true,
          feed: false,
          homepage: true,
          pdf: true,
          related: true,
          search: true,
          sitemap: true,
        },
      },
    ]);
    const patched = applyStudioFieldPatches(source, patches.normalizedPatches);
    const directEdit = {
      ...source,
      draft: false,
      title: "Edited Title",
      visibility: {
        ...source.visibility,
        feed: false,
      },
    };
    const schema = articleSchema({ image: () => z.any() });

    expect(schema.parse(patched)).toEqual(schema.parse(directEdit));
  });

  test("preserves MDX body patch intent and preview contract shape", () => {
    const request = createStudioPreviewRequest({
      artifacts: ["html", "metadata", "diagnostics"],
      domain: "article",
      patches: [
        {
          fieldPath: "body",
          value:
            'Intro text with <HoverImageLink href="/example.png">image</HoverImageLink>.',
        },
      ],
      targets: [{ route: "/articles/mdx-example/" }],
    });
    const response = createStudioPreviewResponse({ request });

    expect(response).toMatchObject({
      status: "ready",
      targets: [{ route: "/articles/mdx-example/" }],
    });
    expect(response.normalizedPatches[0]?.value).toContain("HoverImageLink");
  });

  test("round-trips collection ordering and notes through collection schema", () => {
    const document = requiredDocument("collection");
    const source = {
      description: "Original collection.",
      draft: false,
      items: ["first-article"],
      title: "Original Collection",
    };
    const patches = normalizeStudioFieldPatches(document, [
      {
        fieldPath: "items",
        value: [
          "first-article",
          { note: "Read this next.", slug: "second-article" },
        ],
      },
    ]);
    const patched = applyStudioFieldPatches(source, patches.normalizedPatches);
    const directEdit = {
      ...source,
      items: [
        "first-article",
        { note: "Read this next.", slug: "second-article" },
      ],
    };

    expect(editorialCollectionSchema().parse(patched)).toEqual(
      editorialCollectionSchema().parse(directEdit),
    );
  });

  test("round-trips site config patches through the site config parser", () => {
    const document = requiredDocument("site-config");
    const source: StudioJsonObject = {
      identity: {
        description: "Original site description.",
        language: "en",
        title: "Original Site Title",
        url: "https://example.com",
      },
      navigation: {
        footer: [],
        primary: [],
      },
      routes: {
        allArticles: "/archive/",
        announcements: "/announcements/",
        articles: "/articles/",
        authors: "/authors/",
        bibliography: "/bibliography/",
        categories: "/categories/",
        collections: "/collections/",
        feed: "/feed.xml",
        home: "/",
        search: "/search/",
        tags: "/tags/",
      },
      support: {
        block: {
          body: "Support independent publishing.",
          title: "Support",
        },
        discord: {
          href: "https://discord.example.com",
          label: "Discord",
        },
        patreon: {
          href: "https://patreon.example.com",
          label: "Patreon",
        },
      },
    };
    const patches = normalizeStudioFieldPatches(document, [
      { fieldPath: "identity.title", value: "Edited Site Title" },
      { fieldPath: "routes.articles", value: "/writing/" },
    ]);
    const patched = applyStudioFieldPatches(source, patches.normalizedPatches);
    const directEdit: StudioJsonObject = {
      ...source,
      identity: {
        ...requiredJsonObject(source["identity"]),
        title: "Edited Site Title",
      },
      routes: {
        ...requiredJsonObject(source["routes"]),
        articles: "/writing/",
      },
    };

    expect(parseSiteConfig(patched)).toEqual(parseSiteConfig(directEdit));
  });

  test("keeps redirect and media metadata fixtures source-shaped", () => {
    const redirectDocument = requiredDocument("redirect");
    const mediaDocument = requiredDocument("media-asset");
    const redirectPatches = normalizeStudioFieldPatches(redirectDocument, [
      { fieldPath: "from", value: "/old-path/" },
      { fieldPath: "to", value: "/new-path/" },
    ]);
    const mediaPatches = normalizeStudioFieldPatches(mediaDocument, [
      { fieldPath: "source", value: "site/assets/articles/example.png" },
      { fieldPath: "alt", value: "Example image description." },
    ]);

    const [fromPatch, toPatch] = redirectPatches.normalizedPatches;

    if (
      fromPatch === undefined ||
      toPatch === undefined ||
      typeof fromPatch.value !== "string" ||
      typeof toPatch.value !== "string"
    ) {
      throw new Error("Expected string redirect patches.");
    }

    expect(parseSiteRedirects({ [fromPatch.value]: toPatch.value })).toEqual({
      "/old-path/": "/new-path/",
    });
    expect(applyStudioFieldPatches({}, mediaPatches.normalizedPatches)).toEqual(
      {
        alt: "Example image description.",
        source: "site/assets/articles/example.png",
      },
    );
  });

  test("runs mocked provider workflow fixtures without network or credentials", () => {
    const profile = studioWorkflowAdapterProfile("optional-review");
    const review = { id: "review-1" };
    const release = { id: "release-1" };
    const sourcePath = "site/content/articles/example.md";
    const submitted = runMockStudioWorkflowAction({
      context: { review },
      operation: "submit-review",
      profile,
      sourcePath,
      state: { kind: "ready" },
    });
    const approved = runMockStudioWorkflowAction({
      operation: "approve",
      profile,
      sourcePath,
      state: submitted.state,
    });
    const published = runMockStudioWorkflowAction({
      context: { release },
      operation: "publish",
      profile,
      sourcePath,
      state: approved.state,
    });

    expect(published).toMatchObject({
      ok: true,
      sourceDiffs: [
        {
          kind: "publish-release",
          path: sourcePath,
        },
      ],
      state: {
        kind: "published",
        release,
      },
    });
  });
});

function requiredDocument(id: string) {
  const document = studioEditorDocuments().find(
    (candidate) => candidate.id === id,
  );

  if (document === undefined) {
    throw new Error(`Missing studio editor document "${id}".`);
  }

  return document;
}

function requiredJsonObject(
  value: StudioJsonObject[string] | undefined,
): StudioJsonObject {
  if (isStudioJsonObject(value)) {
    return value;
  }

  throw new Error("Expected JSON object.");
}

function isStudioJsonObject(
  value: StudioJsonObject[string] | undefined,
): value is StudioJsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
