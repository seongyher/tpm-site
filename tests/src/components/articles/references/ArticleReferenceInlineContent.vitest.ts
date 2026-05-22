import { describe, expect, test } from "vitest";

import ArticleReferenceInlineContent from "../../../../../src/components/articles/references/ArticleReferenceInlineContent.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("ArticleReferenceInlineContent", () => {
  test("renders links with flattened accessible text", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleReferenceInlineContent, {
      props: {
        content: {
          children: [
            {
              children: [{ kind: "text", text: "Archive" }],
              kind: "emphasis",
              text: "Archive",
            },
          ],
          kind: "link",
          text: "Archive",
          url: "https://example.com/source",
        },
      },
    });

    expect(view).toContain('href="https://example.com/source"');
    expect(view).toContain("Archive");
  });
});
