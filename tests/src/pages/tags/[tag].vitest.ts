import { describe, expect, test } from "vitest";

import { getTags } from "../../../../src/lib/content/content";
import TagPage from "../../../../src/pages/tags/[tag].astro";
import {
  createAstroTestContainer,
  testSiteUrl,
} from "../../../helpers/astro-container";

describe("tag page", () => {
  test("renders article listings for one canonical tag", async () => {
    const tag = (await getTags()).find(
      (candidate) => candidate.label === "memeculture",
    );

    if (tag === undefined) {
      throw new Error("Expected the memeculture tag to exist in content.");
    }

    const container = await createAstroTestContainer();
    const view = await container.renderToString(TagPage, {
      props: { tag },
      request: new Request(`${testSiteUrl}${tag.href}`),
    });

    expect(view).toContain("Tag");
    expect(view).toContain("memeculture");
    expect(view).toContain("Articles tagged memeculture.");
    expect(view).toContain("<article");
    expect(view).toContain("data-page-frame");
  });
});
