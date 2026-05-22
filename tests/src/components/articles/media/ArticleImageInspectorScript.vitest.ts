import { describe, expect, test } from "vitest";

import ArticleImageInspectorScript from "../../../../../src/components/articles/media/ArticleImageInspectorScript.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("ArticleImageInspectorScript", () => {
  test("renders the native article image inspector script boundary", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleImageInspectorScript);

    expect(view).toContain('type="module"');
    expect(view).toContain(
      "ArticleImageInspectorScript.astro?astro&type=script",
    );
  });
});
