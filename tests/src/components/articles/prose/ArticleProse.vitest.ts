import { describe, expect, test } from "vitest";

import ArticleProse from "../../../../../src/components/articles/prose/ArticleProse.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("ArticleProse", () => {
  test("renders slotted article content inside the prose wrapper", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleProse, {
      slots: {
        default: "<p>Readable article copy.</p>",
      },
    });

    expect(view).toContain("prose");
    expect(view).toMatch(/\[(?:&|&#38;|&amp;)_pre_code\]:text-white/);
    expect(view).toMatch(/\[(?:&|&#38;|&amp;)(?:>|&gt;)\*:first-child\]:mt-0/);
    expect(view).not.toContain('type="module"');
    expect(view).toContain("Readable article copy.");
  });

  test("loads the image inspector only when the layout needs inspectable Markdown images", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(ArticleProse, {
      props: {
        enableImageInspector: true,
      },
      slots: {
        default: "<p>Readable article copy.</p>",
      },
    });

    expect(view).toContain('type="module"');
    expect(view).toContain(
      "ArticleImageInspectorScript.astro?astro&type=script",
    );
  });
});
