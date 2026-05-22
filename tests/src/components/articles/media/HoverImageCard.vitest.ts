import sampleImage from "@site/assets/shared/tpm_defaultpic.jpg";
import { describe, expect, test } from "vitest";

import HoverImageCard from "../../../../../src/components/articles/media/HoverImageCard.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("HoverImageCard", () => {
  test("renders an anchored inline link and preview image", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HoverImageCard, {
      props: {
        alt: "Screenshot of a text message conversation",
        image: sampleImage,
        label: "inline preview",
      },
    });

    expect(view).toContain('data-anchor-preset="inline-hover-preview"');
    expect(view).toContain("data-disclosure-root");
    expect(view).toContain('data-disclosure-mode="hover-focus-tap"');
    expect(view).toContain("data-disclosure-trigger");
    expect(view).toContain("data-disclosure-panel");
    expect(view).toContain('aria-expanded="false"');
    expect(view).toContain("data-hover-image-trigger");
    expect(view).toContain("data-hover-image-panel");
    expect(view).toContain("f=webp");
    expect(view).not.toContain(sampleImage.src);
    expect(view).toContain('aria-label="Open full image: inline preview"');
    expect(view).toContain('alt="Screenshot of a text message conversation"');
    expect(view).toContain("shadow-lg");
    expect(view).toContain("ring-1");
    expect(view).toContain("pointer-fine:group-hover/hover-image:block");
    expect(view).toContain(
      "group-data-[disclosure-open=true]/hover-image:block",
    );
    expect(view).not.toContain("group-focus-within");
    expect(view).not.toContain("bg-popover");
    expect(view).not.toContain("p-1");
    expect(view).not.toContain("client:idle");
    expect(view).not.toContain('data-slot="hover-card');
  });

  test("uses the larger size variant only when expanded", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HoverImageCard, {
      props: {
        expanded: true,
        image: sampleImage,
        label: "wide preview",
      },
    });

    expect(view).toContain('data-hover-image-expanded="true"');
    expect(view).toContain("--hover-image-max-height: 34rem");
  });
});
