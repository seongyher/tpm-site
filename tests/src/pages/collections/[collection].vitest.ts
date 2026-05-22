import { describe, expect, test } from "vitest";

import { getEditorialCollections } from "../../../../src/lib/content/content";
import CollectionPage from "../../../../src/pages/collections/[collection].astro";
import {
  createAstroTestContainer,
  testSiteUrl,
} from "../../../helpers/astro-container";

describe("collection detail page", () => {
  test("renders a collection directory in manual order", async () => {
    const container = await createAstroTestContainer();
    const collection = (await getEditorialCollections()).find(
      (entry) => entry.id === "start-here",
    );

    if (collection === undefined) {
      throw new Error("Missing start-here collection fixture.");
    }

    const view = await container.renderToString(CollectionPage, {
      props: { collection },
      request: new Request(`${testSiteUrl}/collections/${collection.id}/`),
    });

    expect(view).toContain("Collection");
    expect(view).toContain("Start Here");
    expect(view).toContain("/collections/start-here/");
    expect(view.indexOf("What Is A Meme?")).toBeLessThan(
      view.indexOf("Memes Are Not Jokes, They Are Diagram-Games"),
    );
  });
});
