import sampleImage from "@site/assets/shared/tpm_defaultpic.jpg";
import { describe, expect, test } from "vitest";

import HoverImageLink from "../../../../../src/components/articles/media/HoverImageLink.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("HoverImageLink", () => {
  test("renders a native anchored hover-image link with image metadata", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HoverImageLink, {
      props: {
        alt: "Preview image",
        image: sampleImage,
        label: "preview",
      },
    });

    expect(view).toContain("preview");
    expect(view).toContain("f=webp");
    expect(view).not.toContain(sampleImage.src);
    expect(view).toContain('data-anchor-preset="inline-hover-preview"');
    expect(view).not.toContain("client:idle");
  });
});
