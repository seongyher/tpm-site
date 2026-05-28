import { describe, expect, test } from "vitest";

import sampleDarkImage from "../../../../src/catalog/assets/catalog-sample-dark.svg";
import sampleImage from "../../../../src/catalog/assets/catalog-sample-light.svg";
import MediaCatalogSection from "../../../../src/catalog/sections/MediaCatalogSection.astro";
import { createAstroTestContainer } from "../../../helpers/astro-container";

describe("MediaCatalogSection", () => {
  test("renders media primitive catalog examples from a domain section", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(MediaCatalogSection, {
      props: {
        sampleDarkImage,
        sampleImage,
      },
    });

    expect(view).toContain("Media Primitives");
    expect(view).toContain("src/components/media/ResponsiveIframe.astro");
    expect(view).toContain("src/components/media/SoundCloudEmbed.astro");
    expect(view).toContain("src/components/media/YouTubeEmbed.astro");
    expect(view).toContain("src/components/media/EmbedFrame.astro");
    expect(view).toContain("src/components/media/ThemedImage.astro");
    expect(view).toContain("Catalog sample art");
  });
});
