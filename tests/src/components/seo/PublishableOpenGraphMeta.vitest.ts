import { describe, expect, test } from "vitest";

import PublishableOpenGraphMeta from "../../../../src/components/seo/PublishableOpenGraphMeta.astro";
import { createAstroTestContainer } from "../../../helpers/astro-container";

describe("PublishableOpenGraphMeta", () => {
  test("renders article Open Graph fields with truthful modified dates only when present", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(PublishableOpenGraphMeta, {
      props: {
        author: "Author",
        publishedAt: new Date("2022-01-01T00:00:00.000Z"),
        section: "History",
        tags: ["memes", "history"],
      },
    });

    expect(view).toContain(
      'property="article:published_time" content="2022-01-01T00:00:00.000Z"',
    );
    expect(view).toContain('property="article:section" content="History"');
    expect(view).toContain('property="article:author" content="Author"');
    expect(view).toContain('property="article:tag" content="memes"');
    expect(view).not.toContain("article:modified_time");
  });
});
