import { describe, expect, test } from "bun:test";

import { articleCompilerArtifact } from "../../../src/lib/article-compiler";
import { defaultPublishableVisibility } from "../../../src/lib/publishable";
import type { ArticleEntry } from "../../../src/lib/routes";
import { parseSiteConfig } from "../../../src/lib/site-config";

function article(data: Partial<ArticleEntry["data"]> = {}): ArticleEntry {
  return {
    collection: "articles",
    data: {
      author: "Author Name",
      date: new Date("2022-01-02T00:00:00Z"),
      description: "A useful description.",
      draft: false,
      tags: ["meme", "culture"],
      title: "A &amp; B",
      visibility: defaultPublishableVisibility,
      ...data,
    },
    filePath: "/repo/site/content/articles/culture/a-and-b.md",
    id: "a-and-b",
  };
}

const config = parseSiteConfig({
  contentDefaults: {
    articles: {
      draft: false,
      pdf: {
        enabled: false,
      },
      visibility: {
        ...defaultPublishableVisibility,
        feed: true,
        homepage: false,
        search: true,
      },
    },
  },
  features: {
    pdf: true,
  },
  identity: {
    description: "A configurable publication.",
    language: "en",
    title: "Example Blog",
    url: "https://example.com",
  },
  navigation: {
    footer: [],
    primary: [],
  },
  routes: {
    allArticles: "/articles/all/",
    announcements: "/announcements/",
    articles: "/writing/",
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
      body: "Keep publishing going.",
      title: "Support Example Blog",
    },
    discord: {
      href: "https://discord.gg/example",
      label: "Join Discord",
    },
    patreon: {
      href: "https://patreon.com/example",
      label: "Support Us",
    },
  },
});

describe("article compiler artifact", () => {
  test("compiles stable article identity and display facts", () => {
    expect(articleCompilerArtifact(article())).toMatchObject({
      author: "Author Name",
      canonicalPath: "/articles/a-and-b/",
      categorySlug: "culture",
      description: "A useful description.",
      draft: false,
      formattedDate: "January 2, 2022",
      id: "a-and-b",
      outputs: {
        html: {
          path: "articles/a-and-b/index.html",
        },
        pdf: {
          href: "/articles/a-and-b/a-and-b.pdf",
          path: "articles/a-and-b/a-and-b.pdf",
        },
      },
      route: {
        path: "/articles/a-and-b/",
        routeKey: "articles",
        root: "/articles/",
      },
      slug: "a-and-b",
      source: {
        collection: "articles",
        filePath: "/repo/site/content/articles/culture/a-and-b.md",
        format: "markdown",
      },
      surfaces: {
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
      title: "A & B",
    });
  });

  test("normalizes visibility and PDF policy from site config defaults", () => {
    const artifact = articleCompilerArtifact(
      article({
        visibility: config.contentDefaults.articles.visibility,
      }),
      { config },
    );

    expect(artifact.visibility).toEqual({
      ...defaultPublishableVisibility,
      feed: true,
      homepage: false,
      search: true,
    });
    expect(artifact.canonicalPath).toBe("/writing/a-and-b/");
    expect(artifact.outputs.html.path).toBe("writing/a-and-b/index.html");
    expect(artifact.pdfEnabled).toBe(false);
    expect(artifact.outputs.pdf).toBeUndefined();
  });

  test("lets frontmatter visibility and PDF policy override defaults", () => {
    const artifact = articleCompilerArtifact(
      article({
        pdf: true,
        visibility: {
          ...defaultPublishableVisibility,
          feed: true,
          homepage: true,
          search: false,
        },
      }),
      { config },
    );

    expect(artifact.visibility).toEqual({
      ...defaultPublishableVisibility,
      feed: true,
      homepage: true,
      search: false,
    });
    expect(artifact.pdfEnabled).toBe(true);
    expect(artifact.surfaces).toMatchObject({
      homepage: true,
      pdf: true,
      search: false,
    });
  });

  test("carries reference and table-of-contents facts for downstream consumers", () => {
    const references = {
      citations: [
        {
          bibtex: {
            entryType: "article",
            fields: {},
            key: "source",
            normalizedKey: "source",
            raw: "@article{source}",
          },
          definition: {
            children: [
              {
                children: [],
                kind: "paragraph",
                text: "Citation source.",
              },
            ],
          },
          displayLabel: "1",
          id: "cite-source",
          kind: "citation",
          label: "cite-source",
          order: 1,
          references: [
            {
              backlinkId: "cite-source-back-1",
              displayText: "[1]",
              entryId: "cite-source",
              id: "cite-source-ref-1",
              kind: "citation",
              label: "cite-source",
              order: 1,
            },
          ],
        },
      ],
      notes: [
        {
          definition: {
            children: [
              {
                children: [],
                kind: "paragraph",
                text: "Footnote text.",
              },
            ],
          },
          displayLabel: "1",
          id: "note-source",
          kind: "note",
          label: "note-source",
          order: 1,
          references: [
            {
              backlinkId: "note-source-back-1",
              displayText: "[1]",
              entryId: "note-source",
              id: "note-source-ref-1",
              kind: "note",
              label: "note-source",
              order: 1,
            },
          ],
        },
      ],
    } as const;
    const headings = [
      {
        depth: 2,
        href: "#first",
        id: "first",
        level: 1,
        order: 0,
        text: "First",
      },
      {
        depth: 2,
        href: "#second",
        id: "second",
        level: 1,
        order: 1,
        text: "Second",
      },
    ] as const;
    const artifact = articleCompilerArtifact(article(), {
      articleReferences: references,
      tableOfContentsHeadings: headings,
    });

    expect(artifact.references?.citations).toHaveLength(1);
    expect(artifact.references?.notes).toHaveLength(1);
    expect(artifact.tableOfContents).toEqual({
      headings,
      useful: true,
    });
  });
});
