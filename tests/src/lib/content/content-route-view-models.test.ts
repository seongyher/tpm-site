import { describe, expect, test } from "bun:test";

import {
  bibliographyRouteViewModel,
  markdownPageRouteViewModel,
} from "../../../../src/lib/content/content-route-view-models";
import type { ArticleReferenceData } from "../../../../src/lib/references/article-references/model";
import { articleEntry } from "../../../helpers/content";

describe("content route view models", () => {
  test("builds standalone Markdown page metadata and page props", () => {
    const model = markdownPageRouteViewModel(
      {
        body: "About body.",
        collection: "pages",
        data: {
          description: "About the site.",
          startHere: [],
          title: "About",
        },
        id: "about",
      },
      "about",
    );

    expect(model.document).toMatchObject({
      canonicalPath: "/about/",
      description: "About the site.",
      kind: "page",
    });
    expect(model.title).toBe("About");
  });

  test("uses site description fallback for pages without descriptions", () => {
    const model = markdownPageRouteViewModel(
      {
        body: "Body.",
        collection: "pages",
        data: {
          startHere: [],
          title: "Plain Page",
        },
        id: "plain",
      },
      "plain",
    );

    expect(model.description).toBe("About The Philosopher's Meme.");
    expect(model.document).toMatchObject({
      canonicalPath: "/plain/",
      description: "About The Philosopher's Meme.",
      title: "Plain Page | The Philosopher's Meme",
    });
  });

  test("builds empty bibliography route metadata without route-level shaping", () => {
    const model = bibliographyRouteViewModel([
      {
        article: articleEntry({ id: "uncited" }),
        references: undefined,
      },
    ]);

    expect(model.document).toMatchObject({
      canonicalPath: "/bibliography/",
      kind: "bibliography",
    });
    expect(model.entries).toEqual([]);
    expect(model.items).toEqual([]);
  });

  test("builds bibliography item metadata from cited article references", () => {
    const references = {
      citations: [
        {
          bibtex: {
            entryType: "article",
            fields: {
              author: "Researcher, Example",
              title: "Canonical Source",
              url: "https://example.com/source",
              year: "2020",
            },
            key: "source",
            normalizedKey: "source",
            raw: "@article{source,title={Canonical Source}}",
          },
          definition: {
            children: [
              {
                children: [{ kind: "text", text: "Canonical Source" }],
                kind: "paragraph",
                text: "Canonical Source",
              },
            ],
          },
          id: "cite-source",
          kind: "citation",
          label: "cite-source",
          order: 1,
          references: [
            {
              backlinkId: "cite-source-backref-1",
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
      notes: [],
    } satisfies ArticleReferenceData;

    const model = bibliographyRouteViewModel([
      {
        article: articleEntry({
          data: { title: "Citing Article" },
          id: "citing-article",
        }),
        references,
      },
    ]);

    expect(model.entries).toHaveLength(1);
    expect(model.items[0]).toMatchObject({
      description: "Researcher, Example",
      title: "Canonical Source",
    });
    expect(model.items[0]?.href).toMatch(/^\/bibliography\/#bibliography-/u);
  });
});
