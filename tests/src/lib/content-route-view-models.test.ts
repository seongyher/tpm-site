import { describe, expect, test } from "bun:test";

import {
  bibliographyRouteViewModel,
  markdownPageRouteViewModel,
} from "../../../src/lib/content-route-view-models";
import { articleEntry } from "../../helpers/content";

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
});
