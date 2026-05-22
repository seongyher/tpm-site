import { describe, expect, test } from "vitest";

import HomeFeaturedCarouselControls from "../../../../../src/components/blocks/home/HomeFeaturedCarouselControls.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("HomeFeaturedCarouselControls", () => {
  test("renders previous, indicator, and next controls in stable order", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeFeaturedCarouselControls, {
      props: { itemCount: 3 },
    });

    expect(view).toContain("data-home-featured-controls");
    expect(view).toContain("data-home-featured-previous");
    expect(view).toContain("data-home-featured-next");
    expect(view.match(/data-home-featured-index=/g)?.length).toBe(3);
    expect(view.indexOf("data-home-featured-previous")).toBeLessThan(
      view.indexOf("data-home-featured-indicators"),
    );
    expect(view.indexOf("data-home-featured-indicators")).toBeLessThan(
      view.indexOf("data-home-featured-next"),
    );
  });
});
