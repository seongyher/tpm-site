import sampleImage from "@site/assets/shared/tpm_defaultpic.jpg";
import { describe, expect, test } from "vitest";

import HoverImageParagraph from "../../../../../src/components/articles/media/HoverImageParagraph.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("HoverImageParagraph", () => {
  test("keeps hover-image links inline with the paragraph copy", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HoverImageParagraph, {
      props: {
        after: " continues the sentence.",
        image: sampleImage,
        label: "preview",
      },
    });

    expect(view).toContain("<p");
    expect(view).toContain("preview");
    expect(view).toContain("continues the sentence.");
  });
});
