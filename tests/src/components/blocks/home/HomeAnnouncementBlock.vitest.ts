import announcementImage from "@site/assets/site/r2021-03-22.png";
import { describe, expect, test } from "vitest";

import HomeAnnouncementBlock from "../../../../../src/components/blocks/home/HomeAnnouncementBlock.astro";
import { createAstroTestContainer } from "../../../../helpers/astro-container";

describe("HomeAnnouncementBlock", () => {
  test("renders announcement media and editable prose", async () => {
    const container = await createAstroTestContainer();
    const view = await container.renderToString(HomeAnnouncementBlock, {
      props: {
        image: announcementImage,
        imageAlt: "Announcement image",
      },
      slots: {
        default: "<p>Announcement copy.</p>",
      },
    });

    expect(view).toContain("Announcements");
    expect(view).toContain('alt="Announcement image"');
    expect(view).toContain("Announcement copy.");
  });
});
